import { DimensionalOrderItem, LineItem, AIProductSuggestion, AIDocumentAnalysis, DocumentHistoryItem, BusinessDetails, PriceHistoryItem, SavedCustomer } from "../types";
import { sanitizeExtractedDescription } from "../utils/itemUtils";
import mammoth from "mammoth";
import { read, utils } from "xlsx";
import { auth } from "./firebase";

export { sanitizeExtractedDescription };

async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  try {
    if (auth?.currentUser) {
      const token = await auth.currentUser.getIdToken();
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    }
  } catch (e) {
    console.warn("Failed to get auth token:", e);
  }
  return headers;
}

export function getFriendlyGeminiError(error: any): string {
  if (!error) return "An unexpected error occurred.";
  const msg = typeof error === "string" ? error : error.message || String(error);
  if (msg.includes("429") || msg.includes("quota") || msg.includes("RESOURCE_EXHAUSTED")) {
    return "API rate limit reached. Please try again in a moment.";
  }
  if (msg.includes("503") || msg.includes("UNAVAILABLE") || msg.includes("high demand") || msg.includes("spikes in demand")) {
    return "The AI service is experiencing temporary high demand from the provider. Please try again in a few moments.";
  }
  if (msg.includes("API call failed")) {
    return "Failed to analyze document. The AI service may be temporarily busy. Please try again in a moment.";
  }
  return msg;
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

  return Math.round(baseWeight * quantity * 100) / 100;
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
 * A highly robust JSON parser that handles clean, unescaped, or truncated JSON responses.
 */
export function safeJSONParse(text: string, fallback: any = {}): any {
  if (!text) return fallback;
  let cleaned = text.trim();

  if (cleaned.includes("```json")) {
    const match = cleaned.match(/```json\s*([\s\S]*?)\s*```/);
    if (match) cleaned = match[1].trim();
  } else if (cleaned.includes("```")) {
    const match = cleaned.match(/```\s*([\s\S]*?)\s*```/);
    if (match) cleaned = match[1].trim();
  }

  try {
    return JSON.parse(cleaned);
  } catch (e) {
    // Basic repair if needed
    try {
      const start = Math.min(
        cleaned.indexOf("{") !== -1 ? cleaned.indexOf("{") : Infinity,
        cleaned.indexOf("[") !== -1 ? cleaned.indexOf("[") : Infinity
      );
      const end = Math.max(cleaned.lastIndexOf("}"), cleaned.lastIndexOf("]"));
      if (start !== Infinity && end !== -1 && end > start) {
        return JSON.parse(cleaned.slice(start, end + 1));
      }
    } catch (e2) {
      console.error("JSON parse failed:", e2);
    }
  }

  return fallback;
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
    const res = await fetch("/api/smart-analyze-dimensional-report", {
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
    const res = await fetch("/api/check-tolerances", {
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
    const res = await fetch("/api/process-voice-input", {
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
    const extractedText = await extractTextFromFile(file);

    let payload: any = {
      industry,
      history,
      letterhead,
      businessName,
    };

    if (extractedText) {
      payload.extractedText = extractedText;
    } else {
      const fileContent = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve((e.target?.result as string).split(",")[1]);
        reader.onerror = (e) => reject(e);
        reader.readAsDataURL(file);
      });

      payload.fileContent = fileContent;
      payload.mimeType = file.type;
    }

    const res = await fetch("/api/analyze-document", {
      method: "POST",
      headers: await getAuthHeaders(),
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      let errText = "API call failed";
      try {
        const errData = await res.json();
        if (errData?.error) errText = errData.error;
      } catch {}
      throw new Error(errText);
    }
    const data = await res.json();
    const result: AIDocumentAnalysis | null = data.result || null;
    if (result && Array.isArray(result.products)) {
      result.products = result.products.map((p) => ({
        ...p,
        name: sanitizeExtractedDescription(p.name || (p as any).description || ""),
      }));
    }
    return result;
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
    const res = await fetch("/api/analyze-text-content", {
      method: "POST",
      headers: await getAuthHeaders(),
      body: JSON.stringify({ text, industry, businessName }),
    });

    if (!res.ok) {
      let errText = "API call failed";
      try {
        const errData = await res.json();
        if (errData?.error) errText = errData.error;
      } catch {}
      throw new Error(errText);
    }
    const data = await res.json();
    const result: AIDocumentAnalysis | null = data.result || null;
    if (result && Array.isArray(result.products)) {
      result.products = result.products.map((p) => ({
        ...p,
        name: sanitizeExtractedDescription(p.name || (p as any).description || ""),
      }));
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
    const res = await fetch("/api/generate-bill-notes", {
      method: "POST",
      headers: await getAuthHeaders(),
      body: JSON.stringify({ items, businessName }),
    });

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
    const res = await fetch("/api/analyze-letterhead", {
      method: "POST",
      headers: await getAuthHeaders(),
      body: JSON.stringify({ imageData }),
    });

    if (!res.ok) throw new Error("API call failed");
    const data = await res.json();
    return data.result || null;
  } catch (error) {
    return null;
  }
}

export async function analyzePriceAnomaly(
  currentPrice: number,
  productDescription: string,
  priceHistory: PriceHistoryItem[],
  allItems: LineItem[],
  customerName?: string,
  currency: string = "INR"
): Promise<{ severity: "low" | "medium" | "high"; message: string } | null> {
  if (currentPrice <= 0 || !productDescription || productDescription.trim().length < 3) return null;

  // 1. Instant offline rule-based check against historical prices
  if (priceHistory && priceHistory.length > 0) {
    const descLower = (productDescription || "").toLowerCase();
    const matchingHistory = priceHistory.filter(
      (h) => h.description && (h.description || "").toLowerCase().includes(descLower.slice(0, 8))
    );

    if (matchingHistory.length > 0) {
      const avgRate = matchingHistory.reduce((acc, h) => acc + (h.rate || 0), 0) / matchingHistory.length;
      if (avgRate > 0) {
        if (currentPrice < avgRate * 0.3) {
          return {
            severity: "high",
            message: `Price (${currentPrice} ${currency}) is significantly below historical average (${avgRate.toFixed(2)} ${currency}). Check for missing digits or typos.`,
          };
        } else if (currentPrice > avgRate * 3.0) {
          return {
            severity: "medium",
            message: `Price (${currentPrice} ${currency}) is over 3x higher than historical average (${avgRate.toFixed(2)} ${currency}).`,
          };
        }
      }
    }
  }

  // 2. Intra-document size-price inversion check
  const currentDescLower = (productDescription || "").toLowerCase();
  for (const otherItem of allItems) {
    if (!otherItem.description || otherItem.description === productDescription || !otherItem.rate) continue;
    const otherDescLower = (otherItem.description || "").toLowerCase();

    const currentSizeMatch = currentDescLower.match(/\b(\d+)\s*(?:inch|\"|in)\b/);
    const otherSizeMatch = otherDescLower.match(/\b(\d+)\s*(?:inch|\"|in)\b/);

    if (currentSizeMatch && otherSizeMatch) {
      const currentSize = parseInt(currentSizeMatch[1]);
      const otherSize = parseInt(otherSizeMatch[1]);

      if (currentSize > otherSize && currentPrice < otherItem.rate * 0.4) {
        return {
          severity: "high",
          message: `Larger item (${currentSize}") rate (${currentPrice}) is much lower than smaller item (${otherSize}" @ ${otherItem.rate}). Check for typos.`,
        };
      }
    }
  }

  return null;
}

export async function searchAndGetHSN(description: string): Promise<string> {
  if (!description || typeof description !== 'string' || description.trim().length < 3) return "";

  const desc = (description || "").toLowerCase();

  // 1. Instant offline keyword classifier
  if (
    desc.includes("stainless") ||
    desc.includes("ss") ||
    desc.includes("304") ||
    desc.includes("316") ||
    desc.includes("a182")
  ) {
    if (desc.includes("flange")) return "73072100";
    if (
      desc.includes("elbow") ||
      desc.includes("tee") ||
      desc.includes("reducer") ||
      desc.includes("cap") ||
      desc.includes("fitting")
    )
      return "73072300";
  }
  if (
    desc.includes("carbon") ||
    desc.includes("cs") ||
    desc.includes("lf2") ||
    desc.includes("a105") ||
    desc.includes("wpl6") ||
    desc.includes("wpb")
  ) {
    if (desc.includes("flange")) return "73079190";
    if (
      desc.includes("elbow") ||
      desc.includes("tee") ||
      desc.includes("reducer") ||
      desc.includes("bend") ||
      desc.includes("fitting")
    )
      return "73079390";
    if (
      desc.includes("olet") ||
      desc.includes("coupling") ||
      desc.includes("swage") ||
      desc.includes("nipple")
    )
      return "73079210";
  }
  if (desc.includes("flange")) return "73079190";
  if (
    desc.includes("fitting") ||
    desc.includes("elbow") ||
    desc.includes("tee") ||
    desc.includes("reducer")
  )
    return "73079390";

  // 2. Safe backend API proxy
  try {
    const res = await fetch("/api/search-and-get-hsn", {
      method: "POST",
      headers: await getAuthHeaders(),
      body: JSON.stringify({ description }),
    });

    if (!res.ok) throw new Error("API call failed");
    const data = await res.json();
    return data.result || "73079190";
  } catch (error) {
    // Suppress error quietly and use local default
  }

  return "73079190";
}

export async function editLineItemsWithAI(
  currentItems: LineItem[],
  userCommand: string,
  docType: string,
  currency: string,
  docContext?: Record<string, any>
): Promise<{ items: LineItem[]; docUpdates?: Record<string, any>; explanation: string }> {
  try {
    const res = await fetch("/api/edit-line-items", {
      method: "POST",
      headers: await getAuthHeaders(),
      body: JSON.stringify({ currentItems, userCommand, docType, currency, docContext }),
    });

    if (!res.ok) throw new Error("API call failed");
    const data = await res.json();
    const result = data.result || { items: currentItems, docUpdates: null, explanation: "Could not apply instructions." };

    let processedItems = Array.isArray(result.items) ? result.items : currentItems;
    processedItems = postProcessDescriptionEdits(processedItems, userCommand);

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
    };
  });
}
