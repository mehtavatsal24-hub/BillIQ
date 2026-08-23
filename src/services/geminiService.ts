import { DimensionalOrderItem, LineItem, AIProductSuggestion, AIDocumentAnalysis, DocumentHistoryItem, BusinessDetails, PriceHistoryItem, SavedCustomer } from "../types";
import { sanitizeExtractedDescription } from "../utils/itemUtils";
import mammoth from "mammoth";
import { read, utils } from "xlsx";
import { auth } from "./auth";
import { getDisplayErrorMessage } from "../utils/errorUtils";
import { GoogleGenAI } from "@google/genai";

export { sanitizeExtractedDescription };

/**
 * Preserves high-resolution image detail (up to 4096px) for OCR legibility of dense 200+ item tables.
 * Non-image files (PDF, DOCX, XLSX) and crisp images are preserved with zero degradation.
 */
export async function compressImageFile(
  file: File,
  maxDimension = 4096,
  quality = 0.95
): Promise<{ base64Data: string; mimeType: string }> {
  // If not an image (e.g. PDF) or is SVG, convert to standard base64 directly with zero quality loss
  if (!file.type.startsWith("image/") || file.type === "image/svg+xml") {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const fullStr = e.target?.result as string;
        const parts = fullStr.split(",");
        resolve({
          base64Data: parts[1] || fullStr,
          mimeType: file.type || "application/pdf",
        });
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const rawDataUrl = e.target?.result as string;
      const parts = rawDataUrl.split(",");
      const rawBase64 = parts[1] || rawDataUrl;

      const img = new Image();
      img.onload = () => {
        try {
          let { width, height } = img;

          // If image dimensions are within 4096px and size is reasonable, keep raw image without re-compression
          if (width <= maxDimension && height <= maxDimension && file.size <= 15 * 1024 * 1024) {
            resolve({ base64Data: rawBase64, mimeType: file.type || "image/jpeg" });
            return;
          }

          // Proportionally scale only if exceeding 4096px
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");

          if (!ctx) {
            resolve({ base64Data: rawBase64, mimeType: file.type });
            return;
          }

          // High-quality interpolation for OCR legibility of fine text
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";

          // White background prevents transparent PNGs from becoming black
          ctx.fillStyle = "#FFFFFF";
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);

          const outputMime = file.type === "image/png" ? "image/png" : "image/jpeg";
          const dataUrl = canvas.toDataURL(outputMime, quality);
          const base64Data = dataUrl.split(",")[1];

          resolve({ base64Data: base64Data || rawBase64, mimeType: outputMime });
        } catch (err) {
          console.warn("[Image Processing] Canvas resize fallback to raw:", err);
          resolve({ base64Data: rawBase64, mimeType: file.type });
        }
      };
      img.onerror = () => {
        resolve({ base64Data: rawBase64, mimeType: file.type });
      };
      img.src = rawDataUrl;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * Performs a fetch request with timeout protection (default 180 seconds for large 200+ item parsing)
 */
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 180000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (error: any) {
    clearTimeout(id);
    if (error.name === "AbortError") {
      throw new Error("Request timed out while analyzing large document. Please ensure stable internet connection or try again.");
    }
    throw error;
  }
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  try {
    if (auth?.currentUser) {
      let token = await auth.currentUser.getIdToken(false);
      if (!token) {
        token = await auth.currentUser.getIdToken(true);
      }
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    }
  } catch (e) {
    console.warn("Failed to get auth token:", e);
  }
  return headers;
}

export function getFriendlyGeminiError(error: any, userEmail?: string | null): string {
  return getDisplayErrorMessage(error, userEmail, "Unable to generate details at this moment. Please try again or fill in the fields manually.");
}

export function estimateItemWeight(description: string, quantity: number = 1): number {
  if (!description) return 0;
  const descLower = (description || "").toLowerCase();
  let baseWeight = 0.5;

  const sizeMatch = descLower.match(/\b(\d+(?:\.\d+)?)\s*(?:inch|\"|in|dn\d+)\b/);
  const size = sizeMatch ? parseFloat(sizeMatch[1]) : 1;

  if (descLower.includes("flange")) {
    baseWeight = Math.pow(size, 2) * 1.8 + 1.2;
  } else if (descLower.includes("pipe") || descLower.includes("tube")) {
    baseWeight = size * 3.5;
  } else if (descLower.includes("elbow") || descLower.includes("tee") || descLower.includes("reducer")) {
    baseWeight = Math.pow(size, 1.8) * 0.9;
  }

  return Math.round(baseWeight * Math.max(1, quantity) * 100) / 100;
}

export function checkForLocalOrCatalogWeight(description: string): number | null {
  if (!description) return null;
  const weight = estimateItemWeight(description, 1);
  return weight > 0 ? weight : null;
}

/**
 * Executes an async function with exponential backoff retry logic on transient errors (429, 503, high demand, etc.).
 */
export async function callWithRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delay = 1000
): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const errorStr = String(error?.message || error?.statusText || error || "");
    const isTransient =
      errorStr.includes("429") ||
      errorStr.includes("503") ||
      errorStr.includes("500") ||
      errorStr.includes("502") ||
      errorStr.includes("504") ||
      errorStr.includes("UNAVAILABLE") ||
      errorStr.includes("RESOURCE_EXHAUSTED") ||
      errorStr.includes("high demand") ||
      errorStr.includes("quota") ||
      errorStr.includes("rate limit") ||
      error?.status === 429 ||
      error?.status === 503 ||
      error?.status === 500;

    if (isTransient && retries > 0) {
      console.warn(`API transient error (${errorStr}). Retrying in ${delay}ms... (${retries} retries left)`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return callWithRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
}

/**
 * A highly robust JSON parser that handles clean, unescaped, or truncated JSON responses
 * (especially useful for large 200+ item line-item extractions).
 */
export function safeJSONParse(text: string, fallback: any = {}): any {
  if (!text || typeof text !== "string") return fallback;
  let cleaned = text.trim();

  if (cleaned.includes("```json")) {
    const match = cleaned.match(/```json\s*([\s\S]*?)\s*(?:```|$)/);
    if (match && match[1]) cleaned = match[1].trim();
  } else if (cleaned.includes("```")) {
    const match = cleaned.match(/```\s*([\s\S]*?)\s*(?:```|$)/);
    if (match && match[1]) cleaned = match[1].trim();
  }

  // 1. Direct JSON parse
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    // Continue to boundary extraction
  }

  // 2. Substring boundary parsing ({...} or [...])
  try {
    const startObj = cleaned.indexOf("{");
    const startArr = cleaned.indexOf("[");
    let start = -1;
    if (startObj !== -1 && startArr !== -1) {
      start = Math.min(startObj, startArr);
    } else if (startObj !== -1) {
      start = startObj;
    } else if (startArr !== -1) {
      start = startArr;
    }

    const endObj = cleaned.lastIndexOf("}");
    const endArr = cleaned.lastIndexOf("]");
    const end = Math.max(endObj, endArr);

    if (start !== -1 && end !== -1 && end > start) {
      return JSON.parse(cleaned.slice(start, end + 1));
    }
  } catch (e2) {
    // Continue to truncated array recovery
  }

  // 3. Truncated array / unclosed bracket repair for massive 200+ line item payloads
  try {
    const startObj = cleaned.indexOf("{");
    if (startObj !== -1) {
      const str = cleaned.slice(startObj);
      const lastItemEnd = str.lastIndexOf("}");
      if (lastItemEnd !== -1) {
        let candidate = str.slice(0, lastItemEnd + 1);
        const openBraces = (candidate.match(/\{/g) || []).length;
        const closeBraces = (candidate.match(/\}/g) || []).length;
        const openBrackets = (candidate.match(/\[/g) || []).length;
        const closeBrackets = (candidate.match(/\]/g) || []).length;

        for (let i = 0; i < openBrackets - closeBrackets; i++) {
          candidate += "]";
        }
        for (let i = 0; i < openBraces - closeBraces; i++) {
          candidate += "}";
        }

        try {
          return JSON.parse(candidate);
        } catch {
          candidate = candidate.replace(/,\s*([\}\]])/g, "$1");
          return JSON.parse(candidate);
        }
      }
    }
  } catch (repairErr) {
    console.warn("Truncated JSON recovery failed in geminiService:", repairErr);
  }

  return fallback;
}

/**
 * Normalizes and sanitizes extracted products to prevent NaN values, negative rates, or missing units.
 */
function sanitizeExtractedProducts(products: any[]): any[] {
  if (!Array.isArray(products)) return [];
  return products
    .filter((p) => p && typeof p === "object")
    .map((p, idx) => {
      const rawQty = typeof p.quantity === "number" ? p.quantity : parseFloat(String(p.quantity || "1").replace(/,/g, ""));
      const quantity = isNaN(rawQty) || rawQty <= 0 ? 1 : rawQty;

      const rawRate = typeof p.rate === "number" ? p.rate : parseFloat(String(p.rate || "0").replace(/,/g, ""));
      const rate = isNaN(rawRate) || rawRate < 0 ? 0 : rawRate;

      const rawTax = typeof p.suggestedTaxRate === "number" ? p.suggestedTaxRate : parseFloat(String(p.suggestedTaxRate || "18"));
      const suggestedTaxRate = isNaN(rawTax) || rawTax < 0 ? 18 : Math.min(rawTax, 100);

      const rawName = p.name || p.description || `Item ${idx + 1}`;
      const name = sanitizeExtractedDescription(String(rawName));

      const rawUnit = String(p.unit || "NOS").trim().toUpperCase();
      const unit = rawUnit.length > 0 ? rawUnit : "NOS";

      return {
        ...p,
        name,
        quantity,
        rate,
        suggestedTaxRate,
        unit,
        hsn: p.hsn ? String(p.hsn).trim() : "",
      };
    });
}

async function extractTextFromFile(file: File): Promise<string | null> {
  const fileName = (file && file.name) ? file.name.toLowerCase() : "";
  const fileType = (file && file.type) ? file.type.toLowerCase() : "";

  // 1. Handle Spreadsheet files (.xlsx, .xls, .csv)
  if (
    fileName.endsWith(".xlsx") ||
    fileName.endsWith(".xls") ||
    fileName.endsWith(".csv") ||
    fileType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    fileType === "application/vnd.ms-excel" ||
    fileType === "text/csv"
  ) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = read(arrayBuffer, { type: "array" });
      let textContent = "";
      for (const sheetName of workbook.SheetNames) {
        const worksheet = workbook.Sheets[sheetName];
        const csv = utils.sheet_to_csv(worksheet);
        textContent += `### Sheet: ${sheetName} ###\n${csv}\n\n`;
      }
      return textContent;
    } catch (err) {
      console.error("XLSX parsing failed:", err);
      throw new Error(`Failed to read spreadsheet file: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // 2. Handle Word document files (.docx)
  if (
    fileName.endsWith(".docx") ||
    fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      return result.value;
    } catch (err) {
      console.error("Mammoth DOCX parsing failed:", err);
      throw new Error(`Failed to read Word document (.docx): ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // 3. Handle Text files
  if (fileName.endsWith(".txt") || fileType === "text/plain") {
    try {
      return await file.text();
    } catch (err) {
      console.error("Txt reading failed:", err);
    }
  }

  return null;
}

export async function smartAnalyzeDimensionalReport(
  items: LineItem[],
  currentReports: DimensionalOrderItem[]
): Promise<DimensionalOrderItem[]> {
  try {
    const res = await fetchWithTimeout("/api/smart-analyze-dimensional-report", {
      method: "POST",
      headers: await getAuthHeaders(),
      body: JSON.stringify({ items, currentReports }),
    });

    if (!res.ok) throw new Error("API call failed");
    const data = await res.json();
    return data.result || currentReports;
  } catch (error) {
    console.error("AI Smart Check Error:", error);
    return currentReports;
  }
}

export async function checkTolerances(
  report: DimensionalOrderItem
): Promise<{ dimensions: Record<string, { tolerance: string; status: "valid" | "invalid"; message?: string }> }> {
  try {
    const res = await fetchWithTimeout("/api/check-tolerances", {
      method: "POST",
      headers: await getAuthHeaders(),
      body: JSON.stringify({ report }),
    });

    if (!res.ok) throw new Error("API call failed");
    const data = await res.json();
    return data.result || { dimensions: {} };
  } catch (error) {
    console.error("Tolerance Check Error:", error);
    return { dimensions: {} };
  }
}

export async function processVoiceInput(
  transcript: string,
  industry: string = "Industrial",
  letterhead: string = ""
): Promise<Partial<AIProductSuggestion> | null> {
  try {
    const res = await fetchWithTimeout("/api/process-voice-input", {
      method: "POST",
      headers: await getAuthHeaders(),
      body: JSON.stringify({ transcript, industry, letterhead }),
    });

    if (!res.ok) throw new Error("API call failed");
    const data = await res.json();
    return data.result || null;
  } catch (error) {
    console.error("Voice input processing failed:", error);
    return null;
  }
}

export async function extractDocumentData(
  file: File,
  industry: string = "Industrial",
  history: DocumentHistoryItem[] = [],
  letterhead: string = "",
  businessName: string = ""
): Promise<AIDocumentAnalysis | null> {
  return analyzeDocument(file, industry, history, letterhead, businessName);
}

export async function analyzeDocument(
  file: File,
  industry: string = "Industrial",
  history: DocumentHistoryItem[] = [],
  letterhead: string = "",
  businessName: string = ""
): Promise<AIDocumentAnalysis | null> {
  try {
    if (!file) {
      throw new Error("No file provided for document analysis.");
    }

    if (file.size > 25 * 1024 * 1024) {
      throw new Error("File size exceeds 25MB. Please upload a smaller file or split pages into batches.");
    }

    const extractedText = await extractTextFromFile(file);

    let payload: any = {
      industry,
      history,
      letterhead,
      businessName,
    };

    let base64Data = "";
    let mimeType = "";

    if (extractedText) {
      payload.extractedText = extractedText;
    } else {
      // Compress/downscale high-res images to avoid Base64 memory bloating and 413 Payload Too Large
      const comp = await compressImageFile(file);
      base64Data = comp.base64Data;
      mimeType = comp.mimeType;
      payload.fileContent = base64Data;
      payload.mimeType = mimeType;
    }

    // 1. Try server-side Express endpoint (/api/analyze-document)
    try {
      const res = await fetchWithTimeout("/api/analyze-document", {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify(payload),
      }, 180000);

      if (res.ok) {
        const data = await res.json();
        const result: AIDocumentAnalysis | null = data.result || null;
        if (result && Array.isArray(result.products)) {
          result.products = sanitizeExtractedProducts(result.products);
        }
        return result;
      }
    } catch (serverErr) {
      console.warn("[Document Analysis]: Express server API call skipped or unreachable. Utilizing direct Gemini AI client fallback...", serverErr);
    }

    // 2. Client-Side Fallback using @google/genai SDK
    const apiKey = (import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || "").trim();
    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const systemPrompt = `You are an expert AI Document Specialist and OCR Parser supporting all industries for ${businessName || "Enterprise"} (${industry || "General"}).
Analyze the provided document (Purchase Order, Invoice, Quotation, Manifest, Delivery Challan, Packing List, or RFQ).
Extract EVERY SINGLE LINE ITEM WITHOUT EXCEPTION. Return JSON strictly adhering to:
{
  "documentType": "TAX_INVOICE" | "PURCHASE_ORDER" | "QUOTATION" | "DELIVERY_CHALLAN" | "PACKING_LIST",
  "documentNumber": "string",
  "date": "YYYY-MM-DD",
  "dueDate": "YYYY-MM-DD",
  "customer": { "name": "string", "address": "string", "taxId": "string", "email": "string", "phone": "string" },
  "supplier": { "name": "string", "address": "string", "taxId": "string" },
  "products": [
    { "name": "string", "hsn": "string", "quantity": 1, "unit": "NOS", "rate": 0, "suggestedTaxRate": 18 }
  ]
}`;

        const contents: any[] = [];
        if (extractedText) {
          contents.push(systemPrompt + "\n\nEXTRACTED DOCUMENT TEXT:\n" + extractedText);
        } else if (base64Data) {
          contents.push(
            { inlineData: { mimeType: mimeType || "image/jpeg", data: base64Data } },
            systemPrompt
          );
        }

        const models = ["gemini-2.5-flash", "gemini-1.5-flash", "gemini-2.0-flash"];
        for (const model of models) {
          try {
            const response = await ai.models.generateContent({
              model,
              contents,
              config: {
                responseMimeType: "application/json",
                temperature: 0.1,
              },
            });
            const text = response.text;
            if (text) {
              const parsed = safeJSONParse(text);
              if (parsed && Array.isArray(parsed.products)) {
                parsed.products = sanitizeExtractedProducts(parsed.products);
              }
              return parsed;
            }
          } catch (modelErr) {
            console.warn(`[Client Gemini Fallback] Model ${model} failed, trying next...`, modelErr);
          }
        }
      } catch (clientErr) {
        console.error("[Client Gemini Fallback] Exception:", clientErr);
      }
    }

    throw new Error("Document analysis could not be completed. Please ensure your backend server is running (`npm run dev`) or check your GEMINI_API_KEY.");
  } catch (error) {
    console.error("Document analysis failed:", error);
    throw error;
  }
}

export async function analyzeTextContent(
  text: string,
  industry: string = "Industrial",
  businessName: string = ""
): Promise<AIDocumentAnalysis | null> {
  try {
    if (!text || !text.trim()) {
      throw new Error("No text content provided for analysis.");
    }

    const res = await fetchWithTimeout("/api/analyze-text-content", {
      method: "POST",
      headers: await getAuthHeaders(),
      body: JSON.stringify({ text, industry, businessName }),
    }, 180000);

    if (!res.ok) {
      let errText = "API call failed";
      try {
        const errData = await res.json();
        if (errData?.error) errText = errData.error;
      } catch {
        if (res.status === 429) {
          errText = "Rate limit reached. Please wait a moment and try again.";
        } else if (res.status === 503) {
          errText = "AI service is currently busy. Please retry in a few moments.";
        }
      }
      throw new Error(errText);
    }

    const data = await res.json();
    const result: AIDocumentAnalysis | null = data.result || null;
    if (result && Array.isArray(result.products)) {
      result.products = sanitizeExtractedProducts(result.products);
    }
    return result;
  } catch (error) {
    console.error("Text analysis failed:", error);
    throw error;
  }
}

export async function generateInvoiceNotes(
  items: LineItem[],
  businessName: string
): Promise<string> {
  try {
    const res = await fetchWithTimeout("/api/generate-bill-notes", {
      method: "POST",
      headers: await getAuthHeaders(),
      body: JSON.stringify({ items, businessName }),
    }, 30000);

    if (!res.ok) throw new Error("API call failed");
    const data = await res.json();
    return data.result || "Thank you for your business.";
  } catch (error) {
    return "Thank you for your business.";
  }
}

export async function analyzeCustomerPatterns(
  customerName: string,
  history: any[]
): Promise<{ notes: string; terms: string }> {
  if (!customerName || !history || history.length === 0) {
    return { notes: "", terms: "" };
  }

  const trimmedName = (customerName || "").toLowerCase().trim();
  const match = history.find((item: any) => {
    const itemCustName = item.customer?.name || item.customerName || "";
    return (itemCustName || "").toLowerCase().trim() === trimmedName;
  });

  if (match) {
    return {
      notes: match.notes || "",
      terms: match.terms || "",
    };
  }

  return { notes: "", terms: "" };
}

export async function analyzeLetterhead(
  imageData: string
): Promise<Partial<BusinessDetails> | null> {
  try {
    const res = await fetchWithTimeout("/api/analyze-letterhead", {
      method: "POST",
      headers: await getAuthHeaders(),
      body: JSON.stringify({ imageData }),
    }, 30000);

    if (!res.ok) throw new Error("API call failed");
    const data = await res.json();
    return data.result || null;
  } catch (error) {
    return null;
  }
}

export async function analyzePriceAnomaly(
  _currentPrice: number,
  _productDescription: string,
  _priceHistory: PriceHistoryItem[] = [],
  _allItems: LineItem[] = [],
  _customerName?: string,
  _currency?: string
): Promise<{ severity: "low" | "medium" | "high"; message: string } | null> {
  // AI rate/price anomaly suggestions disabled per user request
  return null;
}

export async function searchAndGetHSN(description: string): Promise<string> {
  if (!description || typeof description !== 'string' || description.trim().length < 2) return "";

  // Safe backend API proxy
  try {
    const res = await fetchWithTimeout("/api/search-and-get-hsn", {
      method: "POST",
      headers: await getAuthHeaders(),
      body: JSON.stringify({ description }),
    }, 20000);

    if (!res.ok) throw new Error("API call failed");
    const data = await res.json();
    return data.result || "";
  } catch (error) {
    // Suppress error quietly
  }

  return "";
}

export async function editLineItemsWithAI(
  currentItems: LineItem[],
  userCommand: string,
  docType: string,
  currency: string,
  docContext?: Record<string, any>
): Promise<{ items: LineItem[]; docUpdates?: Record<string, any>; explanation: string }> {
  try {
    const res = await fetchWithTimeout("/api/edit-line-items", {
      method: "POST",
      headers: await getAuthHeaders(),
      body: JSON.stringify({ currentItems, userCommand, docType, currency, docContext }),
    }, 180000);

    if (!res.ok) throw new Error("API call failed");
    const data = await res.json();
    const result = data.result || { items: currentItems, docUpdates: null, explanation: "Could not apply instructions." };

    let processedItems = Array.isArray(result.items) ? result.items : currentItems;
    processedItems = postProcessDescriptionEdits(processedItems, userCommand);

    // Ensure all numeric fields are safe and non-negative
    processedItems = processedItems.map((item) => ({
      ...item,
      quantity: isNaN(item.quantity) || item.quantity <= 0 ? 1 : item.quantity,
      rate: isNaN(item.rate) || item.rate < 0 ? 0 : item.rate,
      taxRate: isNaN(item.taxRate) ? 18 : Math.max(0, Math.min(100, item.taxRate)),
      unit: item.unit ? String(item.unit).trim().toUpperCase() : "NOS",
    }));

    return {
      items: processedItems,
      docUpdates: result.docUpdates || null,
      explanation: result.explanation || "Document updated successfully.",
    };
  } catch (error) {
    console.error("editLineItemsWithAI error:", error);
    const fallbackItems = postProcessDescriptionEdits(currentItems, userCommand);
    const wasModified = fallbackItems.some((item, idx) => item.description !== currentItems[idx]?.description);

    return {
      items: fallbackItems,
      docUpdates: null,
      explanation: wasModified
        ? "Line item descriptions updated successfully."
        : "An error occurred while executing the command.",
    };
  }
}

/**
 * Ensures item description edits (e.g. removing incoterms or specific phrases)
 * are deterministically applied across all items and document types.
 */
function postProcessDescriptionEdits(items: LineItem[], userCommand: string): LineItem[] {
  if (!Array.isArray(items) || items.length === 0) return items;
  const lowerCmd = userCommand.toLowerCase();

  const isRemoveIncoterm =
    /\b(remove|delete|clear|strip|erase|without)\b/i.test(lowerCmd) &&
    /\b(incoterm|incoterms)\b/i.test(lowerCmd);

  const wordRemoveMatch =
    userCommand.match(/\b(?:remove|delete|clear|strip)\s+["']?([^"'\n]+?)["']?\s+(?:from|in)\s+(?:all\s+)?(?:line\s+items?|items?|descriptions?|rows?)\b/i) ||
    userCommand.match(/\b(?:remove|delete|clear|strip)\s+(?:word|phrase)\s+["']?([^"'\n]+?)["']?\s+from\s+descriptions?\b/i);

  if (!isRemoveIncoterm && !wordRemoveMatch) {
    return items;
  }

  return items.map((item) => {
    let desc = item.description || "";
    const origDesc = desc;

    if (isRemoveIncoterm) {
      desc = desc
        .replace(/(?:\|\s*)?(?:incoterms?)\s*[:\-]?\s*[a-z0-9\-]+\b(?:\s*\|)?/gi, "")
        .replace(/(?:\|\s*)?(?:incoterms?)\b(?:\s*\|)?/gi, "");
    }

    if (wordRemoveMatch && wordRemoveMatch[1]) {
      const target = wordRemoveMatch[1].trim();
      if (target && !/incoterm/i.test(target)) {
        const escaped = target.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        desc = desc.replace(new RegExp(escaped, "gi"), "");
      }
    }

    desc = desc
      .replace(/\s*\|\s*\|+/g, " | ")
      .replace(/^\s*\|\s*/, "")
      .replace(/\s*\|\s*$/, "")
      .replace(/\s{2,}/g, " ")
      .trim();

    const wasEdited = desc !== origDesc;

    return {
      ...item,
      description: desc,
      isAiEdited: wasEdited || Boolean(item.isAiEdited),
    };
  });
}

export async function smartGenerateMtcData(items: LineItem[]): Promise<LineItem[]> {
  function hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash);
  }

  function seededRandom(seed: number): () => number {
    let s = seed;
    return function () {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
  }

  return items.map((item, idx) => {
    const desc = (item.description || "").trim();
    const descLower = (desc || "").toLowerCase();

    const seed = hashCode(item.id || "" + idx + desc);
    const rand = seededRandom(seed);
    const getVal = (min: number, max: number, decimals: number = 2) => {
      const v = min + rand() * (max - min);
      return v.toFixed(decimals);
    };

    let detectedGrade = "ASTM A105";

    if (descLower.includes("lf2") || descLower.includes("a350")) {
      detectedGrade = "ASTM A350 LF2 CL1";
    } else if (descLower.includes("316l") || descLower.includes("f316l") || descLower.includes("tp316l")) {
      detectedGrade = "ASTM A182 F316L";
    } else if (descLower.includes("304l") || descLower.includes("f304l") || descLower.includes("tp304l")) {
      detectedGrade = "ASTM A182 F304L";
    } else if (descLower.includes("316") || descLower.includes("f316") || descLower.includes("tp316")) {
      detectedGrade = "ASTM A182 F316";
    } else if (descLower.includes("304") || descLower.includes("f304") || descLower.includes("tp304")) {
      detectedGrade = "ASTM A182 F304";
    } else if (descLower.includes("wpb") || descLower.includes("a234")) {
      detectedGrade = "ASTM A234 WPB";
    }

    return {
      ...item,
      heatNo: item.heatNo || `HT-${(seed % 899999) + 100000}`,
      c: getVal(0.02, 0.08),
      mn: getVal(1.0, 2.0),
      si: getVal(0.2, 0.75),
      p: getVal(0.01, 0.04, 3),
      s: getVal(0.005, 0.03, 3),
      cr: descLower.includes("316") ? getVal(16.0, 18.0) : getVal(18.0, 20.0),
      ni: descLower.includes("316") ? getVal(10.0, 14.0) : getVal(8.0, 10.5),
      mo: descLower.includes("316") ? getVal(2.0, 3.0) : "0.00",
      cu: "0.00",
      n: "0.00",
      v: "0.00",
      w: "0.00",
      ti: "0.00",
      al: "0.00",
      nb: "0.00",
      co: "0.00",
      fe: "Bal",
      yieldStrength: "" + Math.round(205 + rand() * 100),
      tensileStrength: "" + Math.round(515 + rand() * 150),
      elongation: "" + Math.round(35 + rand() * 20),
      reductionOfArea: "" + Math.round(50 + rand() * 20),
      hardness: "" + Math.round(150 + rand() * 40) + " HBW",
      impactTemp: "-196°C",
      impactValues: "60, 65, 70",
      impactAvg: "65 J",
      microstructure: "Austenitic with no continuous carbide network",
      grainSize: "ASTM 6-8",
      inclusionRating: "Thin: <0.5, Thick: 0.0",
      heatTreatment: "Solution Annealed @ 1050°C for 2h & Water Quenched",
      materialGrade: item.materialGrade || detectedGrade,
      standard: item.standard || "ASTM A182 / ASME SA182",
    };
  });
}
