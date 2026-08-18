import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { InvoiceData, DocumentType, PDFSection, PDFLayoutSettings, MeasuredValue } from "../types";
import { format } from "date-fns";
import { CURRENCY_SYMBOLS } from "../constants";
import { getCurrencySymbol, getCountryConfig, getTaxName, getRegionTaxLabel } from "../utils/localization";
import { getUniquePhysicalBoxesCount } from "../lib/boxUtils";
import { trackEvent } from "./analytics";
function hexToRgb(hex: string): [number, number, number] {
  if (!hex) return [30, 30, 30];
  let cleanHex = hex.replace("#", "");
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split("").map(c => c + c).join("");
  }
  const num = parseInt(cleanHex, 16);
  if (isNaN(num)) return [30, 30, 30];
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function normalizeDocType(dt: any): string {
  if (!dt) return "";
  const s = String(dt).trim().toLowerCase().replace(/_/g, " ");
  if (s === "tax invoice" || s === "taxinvoice" || s === "invoice") return "invoice";
  if (s === "proforma invoice" || s === "proformainvoice") return "proforma invoice";
  if (s === "quotation") return "quotation";
  if (s === "purchase order" || s === "purchaseorder") return "purchase order";
  if (s === "packing list" || s === "packinglist") return "packing list";
  if (s === "cost sheet" || s === "costsheet") return "cost sheet";
  return s;
}

export interface HeaderField {
  label: string;
  value: string;
}

/**
 * Draws a key-value header cell with strict word-wrapping logic.
 * Ensures unbroken strings or multi-word values wrap entirely to the next line without line clipping.
 */
export const drawHeaderField = (
  doc: jsPDF,
  label: string,
  value: string,
  x: number,
  y: number,
  cellWidth: number,
  padding: number = 2
): number => {
  const contentWidth = cellWidth - padding * 2;

  // Set typography for label
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.8);
  doc.setTextColor(15, 23, 42);
  const labelText = `${label}: `;
  const labelWidth = doc.getTextWidth(labelText);

  // Available width remaining on line 1 for the value text
  const remainingFirstLineWidth = Math.max(10, contentWidth - labelWidth);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 41, 59);

  // Tokenize value by whitespace to inspect full words
  const words = (value || '').trim().split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';

  words.forEach((word) => {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const testWidth = doc.getTextWidth(testLine);

    // If first line, check against remaining line space after label
    const maxAllowedWidth = lines.length === 0 ? remainingFirstLineWidth : contentWidth;

    if (testWidth <= maxAllowedWidth) {
      currentLine = testLine;
    } else {
      if (currentLine) {
        lines.push(currentLine);
      }
      currentLine = word; // Push the entire unbroken token/word to the next line
    }
  });

  if (currentLine) {
    lines.push(currentLine);
  }

  // Render Label & First Line on the same horizontal baseline
  const lineHeight = 3.8; // mm
  let currentY = y + padding + 2.5;

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(labelText, x + padding, currentY);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 41, 59);
  if (lines.length > 0) {
    // Print first line starting right after the label text
    doc.text(lines[0], x + padding + labelWidth, currentY);

    // Print subsequent wrapped lines aligned under the value column or full width
    for (let i = 1; i < lines.length; i++) {
      currentY += lineHeight;
      doc.text(lines[i], x + padding, currentY);
    }
  }

  // Return dynamic height calculated for row auto-sizing
  const totalHeight = (lines.length > 1 ? (lines.length - 1) * lineHeight : 0) + padding * 2 + 4;
  return Math.max(totalHeight, 10);
};

const DEFAULT_LAYOUT: PDFLayoutSettings = {
  template: "classic",
  sectionOrder: ["header", "party_details", "items_table", "totals", "bank_details", "incoterms", "terms", "signature"],
  accentColor: "#1e1e1e",
};

export function getPdfCurrencySymbol(currencyCode: string = "INR"): string {
  switch (currencyCode) {
    case "INR":
      return "Rs.";
    case "USD":
      return "$";
    case "EUR":
      return "EUR";
    case "GBP":
      return "£";
    case "CAD":
      return "CA$";
    case "AUD":
      return "A$";
    case "AED":
      return "AED";
    case "SGD":
      return "S$";
    case "JPY":
      return "¥";
    default: {
      const sym = getCurrencySymbol(currencyCode);
      return /^[\x00-\x7F]+$/.test(sym) ? sym : currencyCode;
    }
  }
}

export async function generateMtcPDF(data: InvoiceData): Promise<jsPDF> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });
  
  const pageWidth = doc.internal.pageSize.width; // 210
  const pageHeight = doc.internal.pageSize.height; // 297
  const { business } = data;
  const hasLetterhead = !!business.letterhead;
  const logo = business.logo;
  const signature = business.signature;
  const hideForPreprinted = !!data.layoutSettings?.hideForPreprintedLetterhead;
  const hasLetterheadToDraw = hasLetterhead && !hideForPreprinted;
  
  // Margins
  let currentY = 10;
  
  // Help draw letterhead
  const addLetterhead = () => {
    if (hideForPreprinted) return;
    if (business.letterhead) {
      try {
        let format = "JPEG";
        if (business.letterhead.startsWith("data:image/png")) format = "PNG";
        else if (business.letterhead.startsWith("data:image/webp")) format = "WEBP";
        doc.addImage(business.letterhead, format, 0, 0, 210, 297);
      } catch (e) {
        console.error("Failed to add letterhead to MTC PDF", e);
      }
    }
  };

  // Override addPage to automatically add letterhead to new pages
  const originalAddPage = doc.addPage.bind(doc);
  (doc as any).addPage = function(...args: any[]) {
    originalAddPage(...args);
    if (hasLetterhead && !hideForPreprinted) addLetterhead();
    return this;
  };

  if (hasLetterhead || hideForPreprinted) {
    if (hasLetterheadToDraw) {
      addLetterhead();
    }
    currentY = 65; // offset under letterhead
  } else {
    // Manually render a beautiful clean corporate header
    if (!hideForPreprinted) {
      if (logo) {
        try {
          let format = "PNG";
          if (logo.startsWith("data:image/jpeg") || logo.startsWith("data:image/jpg")) format = "JPEG";
          const imgProps = doc.getImageProperties(logo);
          const aspect = imgProps.width / imgProps.height;
          const maxW = 22, maxH = 22;
          let w = maxW, h = maxW / aspect;
          if (h > maxH) { h = maxH; w = maxH * aspect; }
          doc.addImage(logo, format, 10, currentY, w, h);
        } catch (e) {}
      }
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text(business.name, 35, currentY + 5);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      const bizTaxLabel = getCountryConfig(business.country || data.countryOfOrigin || "India").taxLabel;
      const addressLines = [
        business.address,
        `Phone: ${business.phone || "-"} | Email: ${business.email || "-"}`,
        business.gstin ? `${bizTaxLabel}: ${business.gstin}` : ''
      ].filter(Boolean);
      
      addressLines.forEach((line, idx) => {
        doc.text(line!, 35, currentY + 10 + (idx * 4.5));
      });
    }
    
    currentY += 28;
    // Top dividing line
    if (!hideForPreprinted) {
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.4);
      doc.line(10, currentY, 200, currentY);
    }
    currentY += 5;
  }
  
  // Title
  if (!hideForPreprinted) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(40, 40, 40);
    const titleType = (data as any).mtcType === "3.2" ? "3.2" : "3.1";
    doc.text(`MATERIAL TEST CERTIFICATE (EN 10204 Type ${titleType})`, pageWidth / 2, currentY + 2, { align: "center" });
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(120, 120, 120);
    doc.text("(QUALITY MANAGEMENT SYSTEM COMPLIANT CERTIFICATION)", pageWidth / 2, currentY + 6, { align: "center" });
    doc.setTextColor(0, 0, 0);
  }
  
  currentY += 10;
  
  // 1. Certificate Details Key-Value Table
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("I. CERTIFIED COMPLIANCE METADATA:", 10, currentY);
  currentY += 4;

  const certDetailsBody = [
    [
      { content: "Certificate No:", styles: { fontStyle: "bold", fillColor: [248, 249, 250] } },
      { content: (data as any).mtcCertificateNo || data.id },
      { content: "Date of Issue:", styles: { fontStyle: "bold", fillColor: [248, 249, 250] } },
      { content: data.date }
    ],
    [
      { content: "Specification / Grade:", styles: { fontStyle: "bold", fillColor: [248, 249, 250] } },
      { content: (data as any).mtcSpecification || "-" },
      { content: "Purchase Order No:", styles: { fontStyle: "bold", fillColor: [248, 249, 250] } },
      { content: data.poNumber || "-" }
    ],
    [
      { content: "Dimension standard:", styles: { fontStyle: "bold", fillColor: [248, 249, 250] } },
      { content: (data as any).mtcDimension || "-" },
      { content: "Customer Details:", styles: { fontStyle: "bold", fillColor: [248, 249, 250] } },
      { content: `${data.customer.name}\n${data.customer.address || ""}` }
    ]
  ];
  
  autoTable(doc, {
    startY: currentY,
    body: certDetailsBody as any,
    theme: "grid",
    styles: { fontSize: 7, cellPadding: 2, valign: "middle" },
    columnStyles: {
      0: { cellWidth: 35 },
      1: { cellWidth: 60 },
      2: { cellWidth: 35 },
      3: { cellWidth: 60 }
    },
    margin: { left: 10, right: 10, top: (hasLetterhead || hideForPreprinted) ? 65 : 15, bottom: 25 }
  });
  
  currentY = (doc as any).lastAutoTable.finalY + 6;
  
  // 2. Main Items Table
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("II. LINE ITEM STATUS & TRACEABILITY INDEX:", 10, currentY);
  
  const itemsHead = [["Sr", "Item Description", "Quantity", "Heat Number"]];
  const itemsBody = data.items.map((it, idx) => [
    idx + 1,
    it.description || "-",
    `${it.quantity} ${it.unit || "NOS"}`,
    it.heatNo || "-"
  ]);
  
  autoTable(doc, {
    startY: currentY + 2,
    head: itemsHead,
    body: itemsBody,
    theme: "grid",
    headStyles: { fillColor: [40, 40, 40], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 7 },
    styles: { fontSize: 7, cellPadding: 2, halign: "center", fontStyle: "normal" },
    columnStyles: {
      0: { cellWidth: 8 },
      1: { halign: "left", cellWidth: 55 },
      2: { cellWidth: 20 },
      3: { cellWidth: 22 },
      4: { cellWidth: 22 },
      5: { cellWidth: 15 },
      6: { cellWidth: 25, fontStyle: "bold" },
      7: { cellWidth: 23 }
    },
    margin: { left: 10, right: 10, top: (hasLetterhead || hideForPreprinted) ? 65 : 15, bottom: 25 }
  });
  
  currentY = (doc as any).lastAutoTable.finalY + 6;
  
  // 3. Chemical Element analysis table
  if (currentY + 30 > pageHeight - 35) {
     doc.addPage();
     currentY = (hasLetterhead || hideForPreprinted) ? 65 : 15;
  }
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("III. CHEMICAL COMPOSITION (PRODUCT ANALYSIS) (% BY WEIGHT):", 10, currentY);
  
  const chemHeadArgs = ["Heat No", "C", "Mn", "Si", "S", "P", "Ni", "Cr", "Mo", "Cu", "V", "N", "Cb", "CE", "Ti"];
  const chemBody = data.items.map((it: any) => {
    const ch = it.chemistry || {};
    return [
      it.heatNo || "-",
      ch.C || "-",
      ch.Mn || "-",
      ch.Si || "-",
      ch.S || "-",
      ch.P || "-",
      ch.Ni || "-",
      ch.Cr || "-",
      ch.Mo || "-",
      ch.Cu || "-",
      ch.V || "-",
      ch.N || "-",
      ch.Cb || "-",
      ch.CE || "-",
      ch.Ti || "-"
    ];
  });
  
  autoTable(doc, {
    startY: currentY + 2,
    head: [chemHeadArgs],
    body: chemBody,
    theme: "grid",
    headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: "bold", fontSize: 6.5 },
    styles: { fontSize: 7, cellPadding: 1.5, halign: "center" },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 26, halign: "left" }
    },
    margin: { left: 10, right: 10, top: (hasLetterhead || hideForPreprinted) ? 65 : 15, bottom: 25 }
  });
  
  currentY = (doc as any).lastAutoTable.finalY + 6;
  
  // 4. Mechanical Strength Properties table
  if (currentY + 35 > pageHeight - 35) {
     doc.addPage();
     currentY = (hasLetterhead || hideForPreprinted) ? 65 : 15;
  }
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("IV. MECHANICAL TEST RESULTS (TENSILE, HARDNESS & CHARPY IMPACT):", 10, currentY);
  
  const mechHead = [["Heat No", "YS (MPa)", "UTS (MPa)", "Elong (%)", "Red. Area %", "Hardness (HBW)", "Impact Temp", "Impact Values (J)", "Impact Avg (J)"]];
  
  const mechBody = data.items.map((it: any) => {
    const mech = it.mechanical || {};
    return [
      it.heatNo || "-",
      mech.YieldStrength || "-",
      mech.TensileStrength || "-",
      mech.Elongation || "-",
      mech.ReductionOfArea || "-",
      mech.Hardness || "-",
      it.impactTemp || "-",
      it.impactValues || "-",
      it.impactAvg || "-"
    ];
  });
  
  autoTable(doc, {
    startY: currentY + 2,
    head: mechHead,
    body: mechBody,
    theme: "grid",
    headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: "bold", fontSize: 6.5 },
    styles: { fontSize: 7, cellPadding: 1.5, halign: "center" },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 26, halign: "left" }
    },
    margin: { left: 10, right: 10, top: (hasLetterhead || hideForPreprinted) ? 65 : 15, bottom: 25 }
  });
  
  currentY = (doc as any).lastAutoTable.finalY + 6;
  
  // 5. Heat Treatment table
  if (currentY + 25 > pageHeight - 35) {
     doc.addPage();
     currentY = (hasLetterhead || hideForPreprinted) ? 65 : 15;
  }
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("V. HEAT TREATMENT HISTORY PROTOCOLS:", 10, currentY);
  
  const htHead = [["Heat No", "Treatment condition", "Soaking Temp (°C)", "Holding Time", "Cooling Method"]];
  const htBody = data.items.map((it: any) => {
    const ht = it.heatTreatment || {};
    return [
      it.heatNo || "-",
      ht.condition || "-",
      ht.temperature || "-",
      ht.holdingTime || "-",
      ht.coolingMethod || "-"
    ];
  });
  
  autoTable(doc, {
    startY: currentY + 2,
    head: htHead,
    body: htBody,
    theme: "grid",
    headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: "bold", fontSize: 6.5 },
    styles: { fontSize: 7, cellPadding: 2, halign: "center" },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 26, halign: "left" },
      1: { halign: "left" }
    },
    margin: { left: 10, right: 10, top: (hasLetterhead || hideForPreprinted) ? 65 : 15, bottom: 25 }
  });
  
  currentY = (doc as any).lastAutoTable.finalY + 8;
  
  // 6. Remarks / Footnotes & Stamp/Sign Side-by-side
  if (currentY + 35 > pageHeight - 15) {
     doc.addPage();
     currentY = (hasLetterhead || hideForPreprinted) ? 65 : 15;
  }
  
  // Outer divider
  doc.setDrawColor(225, 225, 225);
  doc.line(10, currentY, 200, currentY);
  currentY += 4;
  
  // Footnotes
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.text("VI. NOTES & CERTIFICATION REPORT REMARKS:", 10, currentY);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(100, 100, 100);
  
  const remLines = ((data as any).mtcRemarks || "").split("\n").filter(Boolean);
  let noteY = currentY + 4;
  remLines.forEach((l) => {
    if (noteY < pageHeight - 15) {
      doc.text(l, 10, noteY);
      noteY += 3.5;
    }
  });
  
  // Draw the stamp and signature on the right
  const rightX = 145;
  const stampY = currentY + 4;
  
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.text("AUTHORIZED QC COMPLIANCE STAMP:", rightX, currentY);
  
  doc.setFont("helvetica", "italic");
  doc.setFontSize(6.5);
  doc.setTextColor(140, 140, 140);
  doc.text("Certified Genuine EN 10204 3.1", rightX, stampY + 1);
  
  if (signature) {
    try {
      let format = "PNG";
      if (signature.startsWith("data:image/jpeg") || signature.startsWith("data:image/jpg")) format = "JPEG";
      const imgProps = doc.getImageProperties(signature);
      const aspect = imgProps.width / imgProps.height;
      const maxSigWidth = 35;
      const maxSigHeight = 15;
      let renderWidth = maxSigWidth;
      let renderHeight = maxSigWidth / aspect;
      if (renderHeight > maxSigHeight) {
        renderHeight = maxSigHeight;
        renderWidth = maxSigHeight * aspect;
      }
      doc.addImage(signature, format, rightX, stampY + 3, renderWidth, renderHeight);
    } catch (e) {}
  }
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(40, 40, 40);
  doc.text("Works QA / QC Lead Inspector", rightX, stampY + 20);
  
  // Let's add page numbers and elegant double borders to each page
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    
    // Draw robust elegant double borders standard for high-end EN 10204 certificates
    if (!hideForPreprinted) {
      doc.setDrawColor(60, 60, 60);
      doc.setLineWidth(0.6);
      doc.rect(5, 5, pageWidth - 10, pageHeight - 10);
      
      doc.setDrawColor(180, 180, 180);
      doc.setLineWidth(0.2);
      doc.rect(6, 6, pageWidth - 12, pageHeight - 12);
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(150, 150, 150);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 8, { align: "center" });
    if (!hideForPreprinted) {
      doc.text("Disclaimer: This digital Material Test Certificate validates compliance with relevant European Standards. Any unauthorized modification voids validation.", 10, pageHeight - 8);
    }
  }
  
  return doc;
}

export async function generateInvoicePDF(data: InvoiceData): Promise<jsPDF> {
  const doc = new jsPDF();
  const { business, layoutSettings = DEFAULT_LAYOUT } = data;
  const hasLetterhead = !!(business.letterhead && business.letterhead.trim().length > 10);
  const hideForPreprinted = !!layoutSettings.hideForPreprintedLetterhead;
  const needsLetterheadSpace = hasLetterhead || hideForPreprinted;
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

  // Use dynamic margins if provided, otherwise fallback to defaults (65mm for letterhead space, 25mm for plain paper)
  const defaultHeader = needsLetterheadSpace ? 65 : 25;
  const defaultFooter = needsLetterheadSpace ? 35 : 20;

  const headerHeight = (typeof layoutSettings.headerHeight === 'number' && layoutSettings.headerHeight > 0)
    ? layoutSettings.headerHeight
    : defaultHeader;

  const footerHeight = (typeof layoutSettings.footerHeight === 'number' && layoutSettings.footerHeight > 0)
    ? layoutSettings.footerHeight
    : defaultFooter;

  const SAFE_BOTTOM = footerHeight;
  let currentY = headerHeight;

  // Function to add letterhead to a page
  const addLetterhead = () => {
    if (hideForPreprinted) return;
    if (business.letterhead) {
      try {
        let format = "JPEG";
        if (business.letterhead.startsWith("data:image/png")) format = "PNG";
        else if (business.letterhead.startsWith("data:image/webp")) format = "WEBP";
        
        doc.addImage(business.letterhead, format, 0, 0, 210, 297);
      } catch (e) {
        console.error("Failed to add letterhead to PDF", e);
      }
    }
  };

  // Override addPage to automatically add letterhead to new pages
  // This ensures it's drawn first and doesn't cover content
  const originalAddPage = doc.addPage.bind(doc);
  (doc as any).addPage = function(...args: any[]) {
    originalAddPage(...args);
    if (hasLetterhead && !hideForPreprinted) addLetterhead();
    return this;
  };

  // Initial letterhead for page 1
  if (hasLetterhead && !hideForPreprinted) addLetterhead();

  const { items = [], discount = 0, isExport, currency = "INR", type, customer } = data;

  const renderIncotermsOnly = (y: number): number => {
    const { type, isExport, incotermRule } = data;

    const currentNormType = normalizeDocType(type);

    // Check Incoterms Active
    const isAllowedIncotermsDoc = currentNormType === "invoice" || currentNormType === "quotation";
    const isIncotermsActive = Boolean(
      (isExport || (incotermRule && incotermRule.trim().length > 0)) &&
      incotermRule &&
      incotermRule.trim().length > 0 &&
      isAllowedIncotermsDoc
    );

    if (!isIncotermsActive) {
      return y;
    }

    const ruleLabels: Record<string, string> = {
      "EXW": "EXW - Ex Works",
      "FCA": "FCA - Free Carrier",
      "FAS": "FAS - Free Alongside Ship",
      "FOB": "FOB - Free On Board",
      "CFR": "CFR - Cost and Freight",
      "CIF": "CIF - Cost, Insurance and Freight",
      "CPT": "CPT - Carriage Paid To",
      "CIP": "CIP - Carriage and Insurance Paid To",
      "DPU": "DPU - Delivered at Place Unloaded",
      "DAP": "DAP - Delivered at Place",
      "DDP": "DDP - Delivered Duty Paid"
    };
    const displayRule = ruleLabels[incotermRule.trim().toUpperCase()] || incotermRule.trim();

    const namedPlace = (data.incotermNamedPlace || data.finalDestination || "").trim();
    const portOfLoading = (data.incotermPortOfLoading || data.portOfLoading || "").trim();
    const countryOrigin = (data.incotermCountryOfOrigin || data.countryOfOrigin || "").trim();
    const countryDest = (data.incotermCountryOfDestination || data.countryOfDestination || "").trim();
    const freightTerms = (data.incotermFreightTerms || "").trim();
    const insuranceDetails = (data.incotermInsuranceDetails || "").trim();

    const tableRows: any[] = [
      [
        { content: "Incoterm Selected:", styles: { fontStyle: 'bold', fillColor: [249, 250, 251], textColor: [17, 24, 39] } },
        displayRule,
        { content: "Named Place / Delivery:", styles: { fontStyle: 'bold', fillColor: [249, 250, 251], textColor: [17, 24, 39] } },
        namedPlace || "-"
      ],
      [
        { content: "Port of Loading / Departure:", styles: { fontStyle: 'bold', fillColor: [249, 250, 251], textColor: [17, 24, 39] } },
        portOfLoading || "-",
        { content: "Freight Terms:", styles: { fontStyle: 'bold', fillColor: [249, 250, 251], textColor: [17, 24, 39] } },
        freightTerms || "-"
      ],
      [
        { content: "Country of Origin:", styles: { fontStyle: 'bold', fillColor: [249, 250, 251], textColor: [17, 24, 39] } },
        countryOrigin || "-",
        { content: "Country of Destination:", styles: { fontStyle: 'bold', fillColor: [249, 250, 251], textColor: [17, 24, 39] } },
        countryDest || "-"
      ]
    ];

    if (insuranceDetails) {
      tableRows.push([
        { content: "Insurance Details / Policy:", styles: { fontStyle: 'bold', fillColor: [249, 250, 251], textColor: [17, 24, 39] } },
        { content: insuranceDetails, colSpan: 3 }
      ]);
    }

    const estTableHeight = (tableRows.length + 1) * 7 + 10;
    if (y + estTableHeight > pageHeight - SAFE_BOTTOM) {
      doc.addPage();
      y = headerHeight + 2;
    } else {
      y += 2;
    }

    autoTable(doc, {
      startY: y,
      margin: { left: 15, right: 15 },
      head: [[{ content: "INCOTERMS & DELIVERY DETAILS", colSpan: 4 }]],
      body: tableRows,
      theme: 'grid',
      headStyles: {
        fillColor: [17, 24, 39],
        textColor: [255, 255, 255],
        fontSize: 7.5,
        fontStyle: 'bold',
        halign: 'left',
        cellPadding: 2.5
      },
      columnStyles: {
        0: { cellWidth: 42 },
        1: { cellWidth: 48 },
        2: { cellWidth: 45 },
        3: { cellWidth: 45 }
      },
      styles: {
        font: 'helvetica',
        fontSize: 7,
        cellPadding: 2,
        textColor: [31, 41, 55],
        lineColor: [209, 213, 219],
        lineWidth: 0.25,
        overflow: 'linebreak'
      }
    });

    return (doc as any).lastAutoTable.finalY + 4;
  };

  const sections: Record<string, (y: number) => number> = {
    header: (y) => {
      const { type } = data;
      if (hasLetterhead || hideForPreprinted) {
        return y;
      }

      const startY = 10;
      let curY = startY;
      const leftX = 15;
      const rightX = pageWidth - 15;
      const contentWidth = rightX - leftX; // 180mm

      // 1. Logo at Top Right with proper aspect ratio & bounding box
      let logoWidth = 0;
      let logoHeight = 0;
      let logoBottomY = curY;

      if (business.logo) {
        try {
          let format = "PNG";
          if (business.logo.startsWith("data:image/jpeg") || business.logo.startsWith("data:image/jpg")) format = "JPEG";
          
          const imgProps = doc.getImageProperties(business.logo);
          const aspect = imgProps.width / imgProps.height;
          const maxW = 42; // Max width 42mm
          const maxH = 20; // Max height 20mm

          if (aspect > maxW / maxH) {
            logoWidth = maxW;
            logoHeight = maxW / aspect;
          } else {
            logoHeight = maxH;
            logoWidth = maxH * aspect;
          }

          doc.addImage(business.logo, format, rightX - logoWidth, curY, logoWidth, logoHeight);
          logoBottomY = curY + logoHeight;
        } catch (e) {
          logoWidth = 0;
          logoHeight = 0;
        }
      }

      // Constrain company details container width to prevent overlapping logo
      const maxLeftWidth = logoWidth > 0 ? contentWidth - logoWidth - 8 : contentWidth;

      // 2. Company Name (Large Prominent Display Typography)
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(15, 23, 42); // #0F172A Dark Navy
      const companyTitle = (business.name || "YOUR BUSINESS NAME").toUpperCase();
      const titleLines = doc.splitTextToSize(companyTitle, maxLeftWidth);
      doc.text(titleLines, leftX, curY + 5);
      curY += (titleLines.length * 6.5) + 1;

      // 3. Tagline / Industry Sub-Heading
      if (business.industry) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(71, 85, 105); // Slate 600
        const tagLines = doc.splitTextToSize(business.industry, maxLeftWidth);
        doc.text(tagLines, leftX, curY + 2);
        curY += (tagLines.length * 3.8) + 2;
      } else {
        curY += 2;
      }

      // 4. Two-Column Contact & Address Details within maxLeftWidth
      const colGap = 4;
      const addrWidth = logoWidth > 0 ? Math.floor(maxLeftWidth * 0.52) : 95;
      const contactWidth = maxLeftWidth - addrWidth - colGap;
      const contactX = leftX + addrWidth + colGap;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(51, 65, 85); // Slate 700

      let leftY = curY;
      if (business.address) {
        const addressLines = doc.splitTextToSize(business.address, addrWidth);
        doc.text(addressLines, leftX, leftY);
        leftY += addressLines.length * 3.8;
      }

      let rightY = curY;
      const bizTaxLabel = getCountryConfig(business.country || data.countryOfOrigin || "India").taxLabel;
      const contactLines: string[] = [];
      if (business.phone) contactLines.push(`Tel : ${business.phone}`);
      if (business.email) contactLines.push(`Email : ${business.email}`);
      if (business.gstin) contactLines.push(`${bizTaxLabel} : ${business.gstin}`);

      contactLines.forEach(line => {
        const wrapped = doc.splitTextToSize(line, contactWidth);
        doc.text(wrapped, contactX, rightY);
        rightY += wrapped.length * 3.8;
      });

      const headerBottomY = Math.max(leftY, rightY, logoBottomY) + 4;

      // 5. Sleek double separator lines under header (Image #2 styling)
      doc.setDrawColor(15, 23, 42); // Navy bar
      doc.setLineWidth(0.6);
      doc.line(leftX, headerBottomY, rightX, headerBottomY);

      doc.setLineWidth(0.2);
      doc.line(leftX, headerBottomY + 0.8, rightX, headerBottomY + 0.8);

      return Math.max(headerBottomY + 4, headerHeight);
    },

    party_details: (y) => {
      const { customer, type, id, date, transport, poNumber, isExport } = data;
      const scopeOfWork = (data as any).scopeOfWork;
      const materialType = (data as any).materialType;
      const isPackingList = type === DocumentType.PACKING_LIST;
      const isQA = false;

      let safeDate = "-";
      try {
        if (date) safeDate = format(new Date(date), "dd-MM-yyyy");
      } catch (e) {
        console.error("Invalid date for PDF", date);
      }

      if (isQA) {
        // Check for space for heading + some table content
        if (y + 45 > pageHeight - SAFE_BOTTOM) {
          doc.addPage();
          y = headerHeight;
        }
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text("1. GENERAL INFORMATION", 15, y);
        y += 4;

        const rows = [
          ["CLIENT", customer.name || "-"],
          ["MANUFACTURER", business.name || "-"],
          ["P O NO & DATE", `${poNumber || "-"} DT-${safeDate}`]
        ];

        if (scopeOfWork) rows.push(["SCOPE OF WORK", scopeOfWork]);
        if (materialType) rows.push(["MATERIAL TYPE", materialType]);

        autoTable(doc, {
          startY: y,
          body: rows,
          theme: 'grid',
          styles: { fontSize: 9, cellPadding: 3, textColor: [0, 0, 0], font: "helvetica" },
          columnStyles: { 0: { cellWidth: 40, fontStyle: 'bold', fillColor: [240, 240, 240] }, 1: { cellWidth: 'auto' } },
          margin: { left: 15, right: 15, top: headerHeight },
        });

        return (doc as any).lastAutoTable.finalY + 10;
      }

      if (isPackingList) {
        let buyerOrdDateStr = "-";
        try {
          if (data.buyerOrderDate) {
            buyerOrdDateStr = format(new Date(data.buyerOrderDate), "dd-MM-yyyy");
          }
        } catch (e) {}

        const showNotesPL = data.showNotesInPdf !== false && Boolean(data.notes && data.notes.trim());
        const showTermsPL = data.showTermsInPdf !== false && Boolean(data.terms && data.terms.trim());
        const hasPaymentTerms = Boolean(data.paymentTerms && data.paymentTerms.trim());
        const hasTermsOrNotes = Boolean(showTermsPL || showNotesPL || hasPaymentTerms);
        
        const termsParts: string[] = [];
        if (hasPaymentTerms) termsParts.push(`Payment Terms: ${data.paymentTerms?.trim()}`);
        if (showNotesPL) termsParts.push(`Notes: ${data.notes.trim()}`);
        if (showTermsPL) termsParts.push(`Terms: ${data.terms.trim()}`);

        const termsText = hasTermsOrNotes 
          ? `Terms of Delivery and Payment:\n${termsParts.join("\n")}`
          : `Terms of Delivery and Payment:\n-`;
        
        // Estimate the height of terms text to make sure the row is tall enough
        const rawLines = termsText.split('\n');
        let estimatedTotalLines = 0;
        rawLines.forEach(line => {
          const lineLen = line.trim().length;
          estimatedTotalLines += Math.max(1, Math.ceil(lineLen / 75));
        });
        
        const scaleFactorValue = doc.internal.scaleFactor || 2.834645;
        const ptToMm = 1 / scaleFactorValue;
        const fontSizeMm = 7.5 * ptToMm;
        const lineHeightValue = fontSizeMm * 1.25;
        const estimatedTextHeightMm = estimatedTotalLines * lineHeightValue;
        const cellPaddingSumMm = 2.2 * 2; // top + bottom padding
        const minTermsCellHeight = estimatedTextHeightMm + cellPaddingSumMm;
        
        const defaultSumHeight = 33; // 3 rows, default ~11mm each
        const extraHeightRequired = Math.max(0, minTermsCellHeight - defaultSumHeight);
        const adjustedRow345Height = 11 + (extraHeightRequired / 3);

        const sellerTaxLabel = getCountryConfig(business.country || data.countryOfOrigin || "India").taxLabel;
        const customerTaxLabel = getCountryConfig(customer.country || data.countryOfDestination || business.country || "India").taxLabel;

        const buyerText = data.buyerDetails 
          ? data.buyerDetails 
          : `${customer.name || "-"}\n${customer.address || "-"}${customer.country ? `, ${customer.country}` : ""}${customer.gstin ? `\n${customerTaxLabel}: ${customer.gstin}` : ""}${customer.phone ? `\nTel: ${customer.phone}` : ""}`;

        const consigneeText = data.consigneeName 
          ? `${data.consigneeName}\n${data.consigneeAddress || customer.address || "-"}${data.consigneeGstin ? `\n${customerTaxLabel}: ${data.consigneeGstin}` : ""}${customer.phone ? `\nTel: ${customer.phone}` : ""}`
          : "(Same as Buyer / Client)";

        const packingListRows = isExport ? [
          // Title Bar row
          [
            {
              content: "PACKING LIST",
              colSpan: 4,
              styles: { halign: 'center' as const, fontStyle: 'bold' as const, fillColor: [240, 243, 246] as [number, number, number], textColor: [15, 23, 42] as [number, number, number], minCellHeight: 8 }
            }
          ],
          [
            { content: `EXPORTER / SHIPPER\n${business.name || "-"}\n${business.address || "-"}\n${sellerTaxLabel}: ${business.gstin || "-"}\nEmail: ${business.email || "-"}`, colSpan: 2 },
            { content: `Invoice No. / Document No.:\n${id || "-"}`, colSpan: 1 },
            { content: `Invoice Date:\n${safeDate}`, colSpan: 1 }
          ],
          [
            { content: `BUYER / CLIENT\n${buyerText}`, colSpan: 2 },
            { content: `Buyer's Order No. / PO. Number:\n${poNumber || "-"}`, colSpan: 1 },
            { content: `Buyer's Order Date:\n${buyerOrdDateStr}`, colSpan: 1 }
          ],
          [
            { content: `CONSIGNEE\n${consigneeText}`, colSpan: 2 },
            { content: `Country of Origin of Goods:\n${data.countryOfOrigin || "India"}`, colSpan: 1 },
            { content: `Country of Final Destination:\n${data.countryOfDestination || "-"}`, colSpan: 1 }
          ],
          [
            { content: `Pre-Carriage by:\n${data.preCarriageBy || "-"}`, colSpan: 1 },
            { content: `Place of Receipt by pre-carrier:\n${data.placeOfReceipt || "-"}`, colSpan: 1 },
            { content: termsText, colSpan: 2, rowSpan: 3 }
          ],
          [
            { content: `Vessel / Flight No.:\n${data.vesselFlightNo || "NA"}`, colSpan: 1 },
            { content: `Port of Loading:\n${data.portOfLoading || "-"}`, colSpan: 1 }
          ],
          [
            { content: `Port of Discharge:\n${data.portOfDischarge || "-"}`, colSpan: 1 },
            { content: `Final Destination:\n${data.finalDestination || "-"}`, colSpan: 1 }
          ]
        ] : [
          // Title Bar row
          [
            {
              content: "PACKING LIST",
              colSpan: 4,
              styles: { halign: 'center' as const, fontStyle: 'bold' as const, fillColor: [240, 243, 246] as [number, number, number], textColor: [15, 23, 42] as [number, number, number], minCellHeight: 8 }
            }
          ],
          [
            { content: `SELLER / SHIPPER\n${business.name || "-"}\n${business.address || "-"}\n${sellerTaxLabel}: ${business.gstin || "-"}\nEmail: ${business.email || "-"}`, colSpan: 2 },
            { content: `Invoice No. / Document No.:\n${id || "-"}`, colSpan: 1 },
            { content: `Invoice Date:\n${safeDate}`, colSpan: 1 }
          ],
          [
            { content: `BUYER / CLIENT\n${buyerText}`, colSpan: 2 },
            { content: `Buyer's Order No. / PO. Number:\n${poNumber || "-"}`, colSpan: 1 },
            { content: `Buyer's Order Date:\n${buyerOrdDateStr}`, colSpan: 1 }
          ],
          [
            { content: `CONSIGNEE\n${consigneeText}`, colSpan: 2 },
            { content: termsText, colSpan: 2, rowSpan: 3 }
          ],
          [
            { content: `Pre-Carriage by / Dispatch Mode:\n${data.preCarriageBy || "-"}`, colSpan: 1 },
            { content: `Place of Receipt:\n${data.placeOfReceipt || "-"}`, colSpan: 1 }
          ],
          [
            { content: `Vehicle / Transport No.:\n${data.vesselFlightNo || "NA"}`, colSpan: 1 },
            { content: `Final Destination:\n${data.finalDestination || "-"}`, colSpan: 1 }
          ]
        ];

        autoTable(doc, {
          startY: y,
          body: packingListRows,
          theme: 'grid',
          styles: { 
            fontSize: 7.5, 
            cellPadding: 2.2, 
            textColor: [0, 0, 0], 
            font: "helvetica",
            lineColor: [120, 120, 120],
            lineWidth: 0.15
          },
          columnStyles: {
            0: { cellWidth: 45 },
            1: { cellWidth: 45 },
            2: { cellWidth: 45 },
            3: { cellWidth: 45 }
          },
          margin: { left: 15, right: 15, top: headerHeight },
          didParseCell: (cellData) => {
            const rowIndex = cellData.row.index;
            if (isExport) {
              if (rowIndex === 4 || rowIndex === 5 || rowIndex === 6) {
                cellData.row.height = adjustedRow345Height;
                cellData.cell.styles.minCellHeight = adjustedRow345Height;
              }
            } else {
              if (rowIndex === 3 || rowIndex === 4 || rowIndex === 5) {
                cellData.row.height = adjustedRow345Height;
                cellData.cell.styles.minCellHeight = adjustedRow345Height;
              }
            }
          },
          willDrawCell: (cellData) => {
            if (cellData.section === 'body') {
              (cellData.cell as any)._rawTextBackup = [...cellData.cell.text];
              cellData.cell.text = [];
            }
          },
          didDrawCell: (cellData) => {
            if (cellData.section === 'body') {
              const cell = cellData.cell;
              const textLines = (cell as any)._rawTextBackup;
              if (textLines && textLines.length > 0) {
                const rowIndex = cellData.row.index;
                const padding = cell.styles.cellPadding;
                const topPadding = (padding && typeof padding === 'object' && 'top' in padding) ? padding.top : 2.2;
                const leftPadding = (padding && typeof padding === 'object' && 'left' in padding) ? padding.left : 2.2;
                
                const scaleVal = doc.internal.scaleFactor || 2.834645;
                const ptToMmValue = 1 / scaleVal;

                // Row 0: Centered Title Bar ("PACKING LIST")
                if (rowIndex === 0) {
                  doc.setFont("helvetica", "bold");
                  doc.setFontSize(10);
                  doc.setTextColor(15, 23, 42);
                  const text = textLines.join(" ");
                  doc.text(text, cell.x + (cell.width / 2), cell.y + topPadding + (10 * ptToMmValue * 0.85), { align: "center" });
                  return;
                }

                const fontSize = cell.styles.fontSize || 7.5;
                const fontSizeMmVal = fontSize * ptToMmValue;
                const lineHeight = fontSizeMmVal * 1.25; 
                
                let currentY = cell.y + topPadding + (fontSizeMmVal * 0.85);
                
                textLines.forEach((line: string, index: number) => {
                  if (index === 0) {
                    doc.setFont("helvetica", "normal");
                    doc.setTextColor(0, 0, 0);
                  } else {
                    doc.setFont("helvetica", "normal");
                    doc.setTextColor(50, 50, 50);
                  }
                  doc.setFontSize(fontSize);
                  doc.text(line, cell.x + leftPadding, currentY);
                  currentY += lineHeight;
                });
              }
            }
          }
        });

        return (doc as any).lastAutoTable.finalY + 10;
      }

      // Standard Tax Invoice / Quotation Grid Layout matching Tally / GST pattern
      const getGstinState = (gstin?: string) => {
        if (!gstin) return { name: "", code: "" };
        const clean = gstin.trim().toUpperCase();
        if (clean.length >= 2) {
          const code = clean.substring(0, 2);
          const map: Record<string, string> = {
            "01": "Jammu & Kashmir", "02": "Himachal Pradesh", "03": "Punjab", "04": "Chandigarh",
            "05": "Uttarakhand", "06": "Haryana", "07": "Delhi", "08": "Rajasthan",
            "09": "Uttar Pradesh", "10": "Bihar", "11": "Sikkim", "12": "Arunachal Pradesh",
            "13": "Nagaland", "14": "Manipur", "15": "Mizoram", "16": "Tripura",
            "17": "Meghalaya", "18": "Assam", "19": "West Bengal", "20": "Jharkhand",
            "21": "Odisha", "22": "Chhattisgarh", "23": "Madhya Pradesh", "24": "Gujarat",
            "25": "Daman & Diu", "26": "Dadra & Nagar Haveli", "27": "Maharashtra", "28": "Andhra Pradesh",
            "29": "Karnataka", "30": "Goa", "31": "Lakshadweep", "32": "Kerala",
            "33": "Tamil Nadu", "34": "Puducherry", "35": "Andaman & Nicobar Islands", "36": "Telangana",
            "37": "Andhra Pradesh", "38": "Ladakh"
          };
          if (map[code]) return { name: map[code], code };
        }
        return { name: "", code: "" };
      };

      const custState = getGstinState(customer.gstin);
      const buyerOrdDateStr = data.buyerOrderDate ? format(new Date(data.buyerOrderDate), "dd-MM-yyyy") : safeDate;
      const docTitle = (type === DocumentType.QUOTATION ? "Quotation" : (type === DocumentType.COST_SHEET ? "PRODUCT COST SHEET" : (type === DocumentType.TAX_INVOICE ? "Tax Invoice" : type.replace(/_/g, " ")))).toUpperCase();
      const docNumberLabel = type === DocumentType.QUOTATION ? "Quotation No." : (type === DocumentType.COST_SHEET ? "Cost Sheet No." : "Invoice No.");

      // Available text widths inside cells (accounting for 2.5mm padding on left & right)
      const col2Width = 85; // colSpan 2 = 90mm - 5mm padding = 85mm
      const col1Width = 40; // colSpan 1 = 45mm - 5mm padding = 40mm

      // Pre-wrap Vendor lines
      const vendorTaxLabel = getCountryConfig(business.country || data.countryOfOrigin || "India").taxLabel;
      const vendorNameLines = doc.splitTextToSize(business.name || "YOUR BUSINESS NAME", col2Width);
      const vendorAddrLines = business.address ? doc.splitTextToSize(business.address, col2Width) : [];
      const vendorGstinStr = `${vendorTaxLabel}: ${business.gstin || "-"}`;
      const vendorEmailStr = `E-Mail: ${business.email || "-"}`;
      const vendorPhoneStr = business.phone ? `Phone: ${business.phone}` : "";

      const vendorLines = [
        "SELLER / SHIPPER",
        ...vendorNameLines,
        ...vendorAddrLines,
        vendorGstinStr,
        vendorEmailStr,
        ...(vendorPhoneStr ? [vendorPhoneStr] : [])
      ];

      // Pre-wrap Party / Customer lines
      const partyTaxLabel = getCountryConfig(customer.country || data.countryOfDestination || business.country || "India").taxLabel;
      const partyNameLines = doc.splitTextToSize(customer.name || "-", col2Width);
      const partyAddrLines = customer.address ? doc.splitTextToSize(customer.address, col2Width) : [];
      const partyStateStr = custState.name ? `State Name: ${custState.name}, Code: ${custState.code}` : `Place of Supply: ${data.countryOfDestination || "India"}`;
      const partyGstinStr = `${partyTaxLabel}: ${customer.gstin || "-"}`;
      const partyEmailStr = customer.email ? `E-Mail: ${customer.email}` : "";
      const partyPhoneStr = customer.phone ? `Phone: ${customer.phone}` : "";

      const partyLines = [
        "BUYER / CONSIGNEE",
        ...partyNameLines,
        ...partyAddrLines,
        partyStateStr,
        partyGstinStr,
        ...(partyEmailStr ? [partyEmailStr] : []),
        ...(partyPhoneStr ? [partyPhoneStr] : [])
      ];

      const hasConsignee = !!(data.consigneeName?.trim() || data.consigneeAddress?.trim());

      // Single multi-line strings with dummy padding lines so autoTable computes exact cell heights
      const vendorContentStr = "1\n2\n3\n4\n5\n6\n7\n8\n9\n10\n11\n12";
      const partyContentStr = hasConsignee 
        ? "1\n2\n3\n4\n5\n6\n7\n8\n9\n10\n11\n12\n13"
        : "1\n2\n3\n4\n5\n6\n7\n8\n9\n10";

      // Helper for right-side metadata cells returning a \n string
      const formatRightCell = (label: string, val?: string, colWidthMm: number = 45) => {
        const cleanVal = (val && val.trim() && val.trim() !== "NA") ? val.trim() : "-";
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.8);
        const labelText = `${label}: `;
        const labelWidth = doc.getTextWidth(labelText);
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.8);
        
        const cellPaddingSide = 2.0; // mm
        const totalAvailWidth = colWidthMm - (cellPaddingSide * 2);
        const remainingFirstLineWidth = Math.max(10, totalAvailWidth - labelWidth);
        
        const words = cleanVal.split(/\s+/);
        const valLines: string[] = [];
        let currentLine = '';

        words.forEach((word) => {
          const testLine = currentLine ? `${currentLine} ${word}` : word;
          const testWidth = doc.getTextWidth(testLine);
          const maxAllowedWidth = valLines.length === 0 ? remainingFirstLineWidth : totalAvailWidth;

          if (testWidth <= maxAllowedWidth) {
            currentLine = testLine;
          } else {
            if (currentLine) {
              valLines.push(currentLine);
            }
            currentLine = word;
          }
        });

        if (currentLine) {
          valLines.push(currentLine);
        }
        
        return [label, ...valLines].join("\n");
      };

      const isQuotation = type === DocumentType.QUOTATION;
      const isPurchaseOrder = type === DocumentType.PURCHASE_ORDER;
      const isCostSheet = type === DocumentType.COST_SHEET;
      const rightRowMinHeight = hasConsignee ? 14 : 10;

      const gridRows: any[] = isCostSheet ? [
        // Title bar
        [
          {
            content: docTitle,
            colSpan: 4,
            styles: { halign: 'center' as const, fontStyle: 'bold' as const, fillColor: [240, 243, 246] as [number, number, number], textColor: [15, 23, 42] as [number, number, number], minCellHeight: 8 }
          }
        ],
        // Row 1: Cost Sheet No & Date
        [
          { content: formatRightCell("Cost Sheet No.", id, 90), colSpan: 2, styles: { minCellHeight: 8 } },
          { content: formatRightCell("Cost Sheet Date", safeDate, 90), colSpan: 2, styles: { minCellHeight: 8 } }
        ],
        // Row 2: Customer Name & Project Name
        [
          { content: formatRightCell("Customer Name", customer.name || "-", 90), colSpan: 2, styles: { minCellHeight: 8 } },
          { content: formatRightCell("Project Name", data.projectName || "-", 90), colSpan: 2, styles: { minCellHeight: 8 } }
        ]
      ] : isQuotation ? [
        // Title bar
        [
          {
            content: docTitle,
            colSpan: 4,
            styles: { halign: 'center' as const, fontStyle: 'bold' as const, fillColor: [240, 243, 246] as [number, number, number], textColor: [15, 23, 42] as [number, number, number], minCellHeight: 8 }
          }
        ],
        // Row 1: Quotation No & Quotation Date
        [
          { content: formatRightCell("Quotation No.", id, 90), colSpan: 2, styles: { minCellHeight: 10 } },
          { content: formatRightCell("Quotation Date", safeDate, 90), colSpan: 2, styles: { minCellHeight: 10 } }
        ],
        // Row 2: Valid Until / Expiry Date & Payment Terms
        [
          { content: formatRightCell("Valid Until / Expiry Date", data.buyerOrderDate ? buyerOrdDateStr : "", 90), colSpan: 2, styles: { minCellHeight: 10 } },
          { content: formatRightCell("Payment Terms", data.paymentTerms, 90), colSpan: 2, styles: { minCellHeight: 10 } }
        ],
        // Row 3: Vendor (colSpan 2) and Customer (colSpan 2)
        [
          { content: vendorContentStr, colSpan: 2, styles: { valign: 'top' as const, minCellHeight: 34 } },
          { content: partyContentStr, colSpan: 2, styles: { valign: 'top' as const, minCellHeight: hasConsignee ? 38 : 34 } }
        ]
      ] : isPurchaseOrder ? [
        // Title bar
        [
          {
            content: docTitle,
            colSpan: 4,
            styles: { halign: 'center' as const, fontStyle: 'bold' as const, fillColor: [240, 243, 246] as [number, number, number], textColor: [15, 23, 42] as [number, number, number], minCellHeight: 8 }
          }
        ],
        // Row 1: P.O. No & P.O. Date
        [
          { content: formatRightCell("P.O. No.", id, 90), colSpan: 2, styles: { minCellHeight: 10 } },
          { content: formatRightCell("P.O. Date", safeDate, 90), colSpan: 2, styles: { minCellHeight: 10 } }
        ],
        // Row 2: Expected Delivery Date & Payment Terms
        [
          { content: formatRightCell("Expected Delivery Date", data.buyerOrderDate ? buyerOrdDateStr : "", 90), colSpan: 2, styles: { minCellHeight: 10 } },
          { content: formatRightCell("Payment Terms", data.paymentTerms, 90), colSpan: 2, styles: { minCellHeight: 10 } }
        ],
        // Row 3: Delivery Location
        [
          { content: formatRightCell("Delivery Location / Destination", data.finalDestination, 180), colSpan: 4, styles: { minCellHeight: 10 } }
        ],
        // Row 4: Buyer Details (colSpan 2) and Supplier Details (colSpan 2)
        [
          { content: vendorContentStr, colSpan: 2, styles: { valign: 'top' as const, minCellHeight: 34 } },
          { content: partyContentStr, colSpan: 2, styles: { valign: 'top' as const, minCellHeight: hasConsignee ? 38 : 34 } }
        ]
      ] : [
        // Title bar
        [
          {
            content: docTitle,
            colSpan: 4,
            styles: { halign: 'center' as const, fontStyle: 'bold' as const, fillColor: [240, 243, 246] as [number, number, number], textColor: [15, 23, 42] as [number, number, number], minCellHeight: 8 }
          }
        ],
        // Row 1: Vendor (colSpan 2, rowSpan 3)
        [
          { content: vendorContentStr, colSpan: 2, rowSpan: 3, styles: { valign: 'top' as const } },
          { content: formatRightCell(docNumberLabel, id, 45), styles: { minCellHeight: 10 } },
          { content: formatRightCell("Dated", safeDate, 45), styles: { minCellHeight: 10 } }
        ],
        // Row 2: Delivery Note / Dispatch Ref | Mode/Terms of Payment or No. of Packages
        [
          { 
            content: (type === DocumentType.DELIVERY_CHALLAN || (type && String(type).toLowerCase().includes("challan")))
              ? formatRightCell("Dispatch Ref / LR No.", data.despatchDocNo || transport, 45)
              : formatRightCell("Delivery Note", transport, 45), 
            styles: { minCellHeight: 10 } 
          },
          { 
            content: (type === DocumentType.DELIVERY_CHALLAN || (type && String(type).toLowerCase().includes("challan")))
              ? formatRightCell("No. of Packages", data.numberOfPackages || "-", 45)
              : formatRightCell("Mode of Payment", data.paymentMode || data.paymentTerms, 45), 
            styles: { minCellHeight: 10 } 
          }
        ],
        // Row 3: Buyer's Order No. | Reason for Transport / Order Date
        [
          { content: formatRightCell("Order No.", poNumber, 45), styles: { minCellHeight: 10 } },
          { 
            content: (type === DocumentType.DELIVERY_CHALLAN || (type && String(type).toLowerCase().includes("challan")))
              ? formatRightCell("Reason for Transport", data.reasonForTransportation || "Supply", 45)
              : formatRightCell("Order Date", data.buyerOrderDate ? buyerOrdDateStr : "", 45),
            styles: { minCellHeight: 10 } 
          }
        ],
        // Row 4: Customer (colSpan 2, rowSpan 2)
        [
          { content: partyContentStr, colSpan: 2, rowSpan: 2, styles: { valign: 'top' as const } },
          { content: formatRightCell("Payment Terms", data.paymentTerms || data.despatchDocNo, 45), styles: { minCellHeight: rightRowMinHeight } },
          { content: formatRightCell("Terms / Due Date", data.dueDate || (data.paymentTerms ? safeDate : ""), 45), styles: { minCellHeight: rightRowMinHeight } }
        ],
        // Row 5: Despatched through | Destination
        [
          { content: formatRightCell("Dispatch Via", transport, 45), styles: { minCellHeight: rightRowMinHeight } },
          { content: formatRightCell("Destination", data.finalDestination, 45), styles: { minCellHeight: rightRowMinHeight } }
        ]
      ];

      autoTable(doc, {
        startY: y,
        body: gridRows,
        theme: 'grid',
        styles: {
          fontSize: 7.8,
          cellPadding: 2.0,
          textColor: [15, 23, 42],
          font: "helvetica",
          lineColor: [148, 163, 184],
          lineWidth: 0.15
        },
        columnStyles: {
          0: { cellWidth: 45 },
          1: { cellWidth: 45 },
          2: { cellWidth: 45 },
          3: { cellWidth: 45 }
        },
        margin: { left: 15, right: 15, top: headerHeight },
        willDrawCell: (cellData) => {
          if (cellData.section === 'body') {
            (cellData.cell as any)._formattedLines = Array.isArray(cellData.cell.text) ? [...cellData.cell.text] : [cellData.cell.text];
            cellData.cell.text = [];
          }
        },
        didDrawCell: (cellData) => {
          if (cellData.section === 'body') {
            const cell = cellData.cell;
            const lines = (cell as any)._formattedLines;
            if (!lines || lines.length === 0) return;

            const rowIndex = cellData.row.index;
            const colIndex = cellData.column.index;

            const padding = cell.styles.cellPadding;
            const topPadding = (typeof padding === 'object' && padding && 'top' in padding) ? (padding as any).top : 2.5;
            const leftPadding = (typeof padding === 'object' && padding && 'left' in padding) ? (padding as any).left : 2.5;

            const scaleVal = doc.internal.scaleFactor || 2.834645;
            const ptToMm = 1 / scaleVal;

            // Row 0: Title Bar
            if (rowIndex === 0) {
              doc.setFont("helvetica", "bold");
              doc.setFontSize(10);
              doc.setTextColor(15, 23, 42);
              const text = lines.join(" ");
              doc.text(text, cell.x + (cell.width / 2), cell.y + topPadding + (10 * ptToMm * 0.85), { align: "center" });
              return;
            }

            // Helper for drawing structured Key-Value Detail Box
            const renderDetailBox = (
              boxTitle: string,
              items: { label: string; value: string; isTitle?: boolean }[]
            ) => {
              const boxWidth = cell.width - (leftPadding * 2);
              const cellMaxY = cell.y + cell.height - 1.2; // Strict bottom boundary of the cell
              let curY = cell.y + topPadding + 0.4;

              // 1. Box Header Title with highlighted background bar
              const headerBoxHeight = 4.5; // mm
              doc.setFillColor(238, 242, 246); // #EEEF4 Slate-blue light background
              doc.setDrawColor(203, 213, 225); // #CBD5E1 Slate 300 border
              doc.setLineWidth(0.15);
              doc.rect(cell.x + leftPadding, curY, boxWidth, headerBoxHeight, 'FD');

              // Draw Header Text
              doc.setFont("helvetica", "bold");
              doc.setFontSize(8.2);
              doc.setTextColor(15, 23, 42); // #0F172A Dark Navy
              doc.text(boxTitle.toUpperCase(), cell.x + leftPadding + 2.5, curY + 3.2);

              curY += headerBoxHeight + 4.0; // Clear, spacious gap between header bar and first field

              // 2. Determine density/spacing for equal vertical rhythm
              const validItems = items.filter(it => it.value && it.value.trim() !== "" && it.value.trim() !== "-");

              const lineStep = 3.5;   // Step between wrapped lines of same field
              const fieldStep = 4.8;  // Equal, generous vertical gap between fields
              const labelFontSize = 7.8;
              const valFontSize = 7.8;
              const titleFontSize = 8.2;

              // 3. Render Key-Value pairs
              validItems.forEach(item => {
                if (curY + 2.0 > cellMaxY) return; // Boundary guard

                const labelText = `${item.label} - `;
                doc.setFont("helvetica", "bold");
                doc.setFontSize(labelFontSize);
                doc.setTextColor(15, 23, 42); // Dark Navy label heading (prominent & bold)

                const labelWidth = doc.getTextWidth(labelText) + 0.3;
                doc.text(labelText, cell.x + leftPadding, curY);

                // Draw Value on right on the same line
                doc.setFont("helvetica", item.isTitle ? "bold" : "normal");
                if (item.isTitle) {
                  doc.setFontSize(titleFontSize);
                  doc.setTextColor(15, 23, 42); // Dark Navy
                } else {
                  doc.setFontSize(valFontSize);
                  doc.setTextColor(51, 65, 85); // Slate 700
                }

                const valueAvailWidth = Math.max(10, boxWidth - labelWidth);
                const valLines = doc.splitTextToSize(item.value, valueAvailWidth);

                valLines.forEach((vLine: string, vIdx: number) => {
                  if (curY + 1.8 > cellMaxY) return;

                  if (vIdx === 0) {
                    doc.text(vLine, cell.x + leftPadding + labelWidth, curY);
                  } else {
                    curY += lineStep;
                    if (curY + 1.8 <= cellMaxY) {
                      doc.text(vLine, cell.x + leftPadding + labelWidth, curY);
                    }
                  }
                });

                curY += fieldStep;
              });
            };

            if (isQuotation) {
              if (rowIndex === 3 && colIndex === 0) {
                const sellerTaxLabel = getCountryConfig(business.country || data.countryOfOrigin || "India").taxLabel;
                const sellerItems = [
                  { label: "M/S", value: business.name || "YOUR BUSINESS NAME", isTitle: true },
                  { label: "Address", value: business.address || "-" },
                  { label: "Phone", value: business.phone || "-" },
                  { label: "E-Mail", value: business.email || "-" },
                  { label: sellerTaxLabel, value: business.gstin || "-" },
                  { label: "State", value: business.state || data.countryOfOrigin || "India" }
                ];
                renderDetailBox("Vendor Details", sellerItems);
                return;
              }
              if (rowIndex === 3 && colIndex === 2) {
                const customerTaxLabel = getCountryConfig(customer.country || data.countryOfDestination || business.country || "India").taxLabel;
                const placeOfSupplyStr = custState.name ? `${custState.name} ( ${custState.code} )` : (data.countryOfDestination || "India");

                if (hasConsignee) {
                  const customerItems = [
                    { label: "Billed To", value: customer.name || "-", isTitle: true },
                    { label: "Buyer Addr", value: customer.address || "-" },
                    { label: "Shipped To", value: data.consigneeName || customer.name || "-", isTitle: true },
                    { label: "Ship Addr", value: data.consigneeAddress || "-" },
                    ...(data.consigneeGstin ? [{ label: "Consignee " + customerTaxLabel, value: data.consigneeGstin }] : []),
                    { label: "Place of Supply", value: placeOfSupplyStr }
                  ];
                  renderDetailBox("Customer & Consignee Details", customerItems);
                } else {
                  const customerItems = [
                    { label: "M/S", value: customer.name || "-", isTitle: true },
                    { label: "Address", value: `${customer.address || "-"}${customer.country ? `, ${customer.country}` : ""}` },
                    { label: "Phone", value: customer.phone || "-" },
                    { label: "E-Mail", value: customer.email || "-" },
                    { label: customerTaxLabel, value: customer.gstin || "-", isTitle: false },
                    { label: "Place of Supply", value: placeOfSupplyStr }
                  ];
                  renderDetailBox("Customer Details", customerItems);
                }
                return;
              }
            } else if (isPurchaseOrder) {
              if (rowIndex === 4 && colIndex === 0) {
                const sellerTaxLabel = getCountryConfig(business.country || data.countryOfOrigin || "India").taxLabel;
                const buyerItems = [
                  { label: "M/S", value: business.name || "YOUR BUSINESS NAME", isTitle: true },
                  { label: "Address", value: business.address || "-" },
                  { label: "Phone", value: business.phone || "-" },
                  { label: "E-Mail", value: business.email || "-" },
                  { label: sellerTaxLabel, value: business.gstin || "-" },
                  { label: "State", value: business.state || data.countryOfOrigin || "India" }
                ];
                renderDetailBox("Buyer / Issuer Details", buyerItems);
                return;
              }
              if (rowIndex === 4 && colIndex === 2) {
                const customerTaxLabel = getCountryConfig(customer.country || data.countryOfDestination || business.country || "India").taxLabel;
                const placeOfSupplyStr = custState.name ? `${custState.name} ( ${custState.code} )` : (data.countryOfDestination || "India");

                if (hasConsignee) {
                  const supplierItems = [
                    { label: "Supplier", value: customer.name || "-", isTitle: true },
                    { label: "Address", value: customer.address || "-" },
                    { label: "Ship To (Consignee)", value: data.consigneeName || "-", isTitle: true },
                    { label: "Ship Addr", value: data.consigneeAddress || "-" },
                    ...(data.consigneeGstin ? [{ label: "Consignee " + customerTaxLabel, value: data.consigneeGstin }] : []),
                    { label: "Place of Supply", value: placeOfSupplyStr }
                  ];
                  renderDetailBox("Supplier & Consignee Details", supplierItems);
                } else {
                  const supplierItems = [
                    { label: "M/S", value: customer.name || "-", isTitle: true },
                    { label: "Address", value: customer.address || "-" },
                    { label: "Phone", value: customer.phone || "-" },
                    { label: "E-Mail", value: customer.email || "-" },
                    { label: customerTaxLabel, value: customer.gstin || "-", isTitle: false },
                    { label: "Place of Supply", value: placeOfSupplyStr }
                  ];
                  renderDetailBox("Supplier Details", supplierItems);
                }
                return;
              }
            } else if (!isCostSheet) {
              // Row 1, Col 0: Vendor Box
              if (rowIndex === 1 && colIndex === 0) {
                const sellerTaxLabel = getCountryConfig(business.country || data.countryOfOrigin || "India").taxLabel;
                const sellerItems = [
                  { label: "M/S", value: business.name || "YOUR BUSINESS NAME", isTitle: true },
                  { label: "Address", value: business.address || "-" },
                  { label: "Phone", value: business.phone || "-" },
                  { label: "E-Mail", value: business.email || "-" },
                  { label: sellerTaxLabel, value: business.gstin || "-" },
                  { label: "State", value: business.state || data.countryOfOrigin || "India" }
                ];
                renderDetailBox("Vendor Details", sellerItems);
                return;
              }

              // Row 4, Col 0: Customer / Consignee Box
              if (rowIndex === 4 && colIndex === 0) {
                const customerTaxLabel = getCountryConfig(customer.country || data.countryOfDestination || business.country || "India").taxLabel;
                const placeOfSupplyStr = custState.name ? `${custState.name} ( ${custState.code} )` : (data.countryOfDestination || "India");

                if (hasConsignee) {
                  const customerItems = [
                    { label: "Billed To (Buyer)", value: customer.name || "-", isTitle: true },
                    { label: "Buyer Addr", value: `${customer.address || "-"}${customer.country ? `, ${customer.country}` : ""}` },
                    { label: "Buyer " + customerTaxLabel, value: customer.gstin || "-", isTitle: false },
                    { label: "Shipped To (Consignee)", value: data.consigneeName || customer.name || "-", isTitle: true },
                    { label: "Ship Addr", value: data.consigneeAddress || "-" },
                    ...(data.consigneeGstin ? [{ label: "Consignee " + customerTaxLabel, value: data.consigneeGstin }] : []),
                    { label: "Place of Supply", value: placeOfSupplyStr }
                  ];
                  renderDetailBox("Buyer & Consignee Details", customerItems);
                } else {
                  const customerItems = [
                    { label: "M/S", value: customer.name || "-", isTitle: true },
                    { label: "Address", value: `${customer.address || "-"}${customer.country ? `, ${customer.country}` : ""}` },
                    { label: "Phone", value: customer.phone || "-" },
                    { label: "E-Mail", value: customer.email || "-" },
                    { label: customerTaxLabel, value: customer.gstin || "-", isTitle: false },
                    { label: "Place of Supply", value: placeOfSupplyStr }
                  ];
                  renderDetailBox("Customer Details", customerItems);
                }
                return;
              }
            }

            // Right-Side Metadata Cells (Label and Value adjacent on the same line)
            const label = lines[0];
            const valLines = lines.slice(1);

            if (label) {
              const leftPadding = (typeof cell.styles.cellPadding === 'object' && cell.styles.cellPadding && 'left' in cell.styles.cellPadding)
                ? (cell.styles.cellPadding as any).left
                : 2.0;
              
              drawHeaderField(
                doc,
                label,
                valLines.join(" "),
                cell.x,
                cell.y,
                cell.width,
                leftPadding
              );
            }
          }
        }
      });

      return (doc as any).lastAutoTable.finalY + 4;
    },

    items_table: (y) => {
      const { items, isExport, currency = "INR", type } = data;
      const isPackingList = type === DocumentType.PACKING_LIST;
      const isQA = false;

      if (isQA) {
        // Space check for heading + some of the table content
        if (y + 45 > pageHeight - SAFE_BOTTOM) {
          doc.addPage();
          y = headerHeight;
        }
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text("5. TECHNICAL SPECIFICATIONS & QUANTITY", 15, y);

        autoTable(doc, {
          startY: y + 5,
          head: [["#", "SPECIFICATION & DESCRIPTION", "QTY", "HEAT", "DIM", "MARK"]],
          body: items.map((item, index) => [
            index + 1,
            item.description,
            item.quantity,
            "", // Placeholder for Heat
            "", // Placeholder for Dim
            "", // Placeholder for Mark
          ]),
          theme: 'grid',
          headStyles: { 
            fillColor: [200, 200, 200],
            textColor: [0, 0, 0],
            fontSize: 9,
            fontStyle: 'bold',
            halign: 'center'
          },
          columnStyles: {
            0: { halign: 'center', cellWidth: 15 },
            1: { cellWidth: 'auto' },
            2: { halign: 'center', cellWidth: 18 },
            3: { halign: 'center', cellWidth: 18 },
            4: { halign: 'center', cellWidth: 18 },
            5: { halign: 'center', cellWidth: 18 },
          },
          styles: { fontSize: 9.5, cellPadding: 4, font: "helvetica", textColor: [0, 0, 0] },
          margin: { left: 15, right: 15, top: headerHeight, bottom: SAFE_BOTTOM },
          didDrawCell: (cellData) => {
            if (cellData.section === 'body' && (cellData.column.index >= 3)) {
              const item = items?.[cellData.row.index];
              if (!item) return;
              
              const isChecked = true;
              
              if (isChecked) {
                doc.setDrawColor(0, 150, 0);
                doc.setLineWidth(0.5);
                const x = cellData.cell.x + cellData.cell.width / 2;
                const y = cellData.cell.y + cellData.cell.height / 2;
                // Draw a simple tick mark
                doc.line(x - 2, y, x - 0.5, y + 1.5);
                doc.line(x - 0.5, y + 1.5, x + 2, y - 2);
              } else {
                doc.setTextColor(150, 150, 150);
                doc.setFontSize(6);
                doc.text("-", cellData.cell.x + cellData.cell.width / 2, cellData.cell.y + cellData.cell.height / 2 + 1, { align: 'center' });
              }
            }
          },
          rowPageBreak: 'auto'
        });

        return (doc as any).lastAutoTable.finalY + 15;
      }

      if (isPackingList) {
        const tableData = items.map((item, index) => [
          index + 1,
          item.description,
          item.qtyPacked || item.quantity,
          item.netWeight !== undefined && item.netWeight !== 0 ? `${item.netWeight}` : "-",
          item.grossWeight !== undefined && item.grossWeight !== 0 ? `${item.grossWeight}` : "-",
          item.boxNo || `Box ${index + 1}`
        ]);

        const totalQtyPacked = items.reduce((sum, item) => sum + (Number(item.qtyPacked || item.quantity) || 0), 0);
        const totalNetWeight = items.reduce((sum, item) => sum + (Number(item.netWeight) || 0), 0);
        const totalGrossWeight = items.reduce((sum, item) => sum + (Number(item.grossWeight) || 0), 0);

        tableData.push([
          "",
          "TOTAL",
          totalQtyPacked > 0 ? `${totalQtyPacked}` : "-",
          totalNetWeight > 0 ? `${Math.round(totalNetWeight * 100) / 100} KGS` : "-",
          totalGrossWeight > 0 ? `${Math.round(totalGrossWeight * 100) / 100} KGS` : "-",
          ""
        ]);

        autoTable(doc, {
          startY: y,
          head: [["Sr.No.", "ITEM DESCRIPTION", "QTY PKD", "NET WT\n(KGS)", "GROSS WT\n(KGS)", "PACKAGING"]],
          body: tableData,
          theme: 'grid',
          headStyles: { 
            fillColor: [240, 240, 240],
            textColor: [0, 0, 0],
            fontSize: 7.5,
            fontStyle: 'bold',
            halign: 'center',
            valign: 'middle'
          },
          columnStyles: {
            0: { halign: 'center', cellWidth: 14 },
            1: { cellWidth: 'auto' },
            2: { halign: 'center', cellWidth: 18 },
            3: { halign: 'center', cellWidth: 22 },
            4: { halign: 'center', cellWidth: 22 },
            5: { halign: 'center', cellWidth: 28 },
          },
          styles: { fontSize: 7.5, cellPadding: 2.5, font: "helvetica", textColor: [0, 0, 0], valign: 'middle' },
          margin: { left: 15, right: 15, top: headerHeight, bottom: SAFE_BOTTOM },
          didParseCell: (cellData) => {
            if (cellData.row.index === tableData.length - 1) {
              cellData.cell.styles.fontStyle = 'bold';
              cellData.cell.styles.fillColor = [240, 240, 240];
            }
          },
          didDrawPage: (d) => {
            if (d.pageNumber > 1) {
              doc.setFontSize(8);
              doc.setFont("helvetica", "italic");
              doc.setTextColor(150, 150, 150);
              doc.text(`Continued from page ${d.pageNumber - 1}...`, 15, headerHeight - 4);
              doc.setTextColor(0, 0, 0);
            }
          },
          rowPageBreak: 'auto'
        });

        return (doc as any).lastAutoTable.finalY + 8;
      }

      if (type === DocumentType.COST_SHEET) {
        const activeSymbol = getPdfCurrencySymbol(currency);
        const suppliers = data.costSheetSuppliers || [];
        const rowsSummary = data.costSheetRowsSummary || [];

        if (suppliers.length > 0 && rowsSummary.length > 0) {
          const tableHead = [
            ["#", "COST HEAD / CATEGORY", "REMARKS", "BASIS", ...suppliers.map(s => s.name + ((s.isLowestCost || s.isBestValue) ? "\n(Best)" : ""))]
          ];

          const costTableData = rowsSummary.map((row, index) => {
            const rowType = row.type || row.costType || "Flat";
            let typeStr: string = row.basisDetail || "";

            if (!typeStr) {
              if (rowType === "%") {
                typeStr = row.typeValue ? `${row.typeValue}% on Base` : "% on Base";
              } else if (rowType === "Per Unit") {
                typeStr = row.typeValue ? `${activeSymbol}${row.typeValue.toFixed(2)} / unit` : "Per Unit";
              } else if (rowType === "By Weight") {
                typeStr = row.typeValue ? `${activeSymbol}${row.typeValue.toFixed(2)} / ${data.costSheetWeightUnit || 'kg'}` : "By Weight";
              } else {
                typeStr = "Flat";
              }
            }

            const amounts = row.supplierAmounts || row.amountsBySupplier || {};
            const supplierAmounts = suppliers.map(s => {
              const amt = amounts[s.id] ?? 0;
              return `${activeSymbol}${amt.toLocaleString(currency === 'INR' ? 'en-IN' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            });

            return [
              index + 1,
              row.costHead || row.head || "Cost Head",
              row.description || row.remarks || "-",
              typeStr,
              ...supplierAmounts
            ];
          });

          const numSuppliers = suppliers.length;
          const suppColWidth = Math.max(20, (186 - 88) / Math.max(1, numSuppliers));

          const baseColsWidth: Record<number, any> = {
            0: { halign: 'center' as const, valign: 'middle' as const, cellWidth: 8 },
            1: { halign: 'left' as const, valign: 'middle' as const, cellWidth: 36, fontStyle: 'bold' },
            2: { halign: 'left' as const, valign: 'middle' as const, cellWidth: 22 },
            3: { halign: 'center' as const, valign: 'middle' as const, cellWidth: 22 }
          };
          const supplierColStyles: Record<number, any> = {};
          suppliers.forEach((sup, i) => {
            const isBest = sup.isLowestCost || sup.isBestValue;
            supplierColStyles[4 + i] = {
              halign: 'right' as const,
              valign: 'middle' as const,
              cellWidth: suppColWidth,
              fontStyle: isBest ? 'bold' : 'normal'
            };
          });

          autoTable(doc, {
            startY: y,
            head: tableHead,
            body: costTableData,
            theme: "grid",
            tableLineColor: [209, 213, 219],
            tableLineWidth: 0.25,
            headStyles: {
              fillColor: [30, 41, 59],
              textColor: [255, 255, 255],
              fontSize: 7.5,
              fontStyle: 'bold',
              halign: 'center',
              valign: 'middle',
              cellPadding: { top: 2.5, bottom: 2.5, left: 1.5, right: 1.5 }
            },
            bodyStyles: {
              fontSize: 7.5,
              cellPadding: { top: 2, bottom: 2, left: 1.5, right: 1.5 },
              valign: 'middle',
              textColor: [15, 23, 42]
            },
            columnStyles: {
              ...baseColsWidth,
              ...supplierColStyles
            },
            didParseCell: (cellData) => {
              if (cellData.section === 'body' && cellData.column.index >= 4) {
                const supIndex = cellData.column.index - 4;
                const isBest = suppliers[supIndex]?.isLowestCost || suppliers[supIndex]?.isBestValue;
                if (isBest) {
                  cellData.cell.styles.fillColor = [236, 253, 245];
                  cellData.cell.styles.textColor = [4, 120, 87];
                  cellData.cell.styles.fontStyle = 'bold';
                }
              }
              if (cellData.section === 'head' && cellData.column.index >= 4) {
                const supIndex = cellData.column.index - 4;
                const isBest = suppliers[supIndex]?.isLowestCost || suppliers[supIndex]?.isBestValue;
                if (isBest) {
                  cellData.cell.styles.fillColor = [5, 150, 105];
                  cellData.cell.styles.textColor = [255, 255, 255];
                }
              }
            },
            margin: { left: 12, right: 12, top: headerHeight, bottom: SAFE_BOTTOM },
            rowPageBreak: 'auto'
          });

          return (doc as any).lastAutoTable.finalY + 8;
        }

        const costTableData = items.map((item, index) => {
          const costHead = item.costHead || item.description || "Cost Head";
          const remarks = item.remarks && item.remarks !== costHead ? item.remarks : "-";
          let typeStr: string = item.costType || "Flat";
          if (item.costType === "%") {
            typeStr = `${(item.costTypeValue || 0).toFixed(2)}% on Base Product Price`;
          } else if (item.costType === "Per Unit") {
            typeStr = `${activeSymbol}${(item.costTypeValue || 0).toFixed(2)} / Unit`;
          }

          const amt = item.rate || 0;
          return [
            index + 1,
            costHead,
            remarks,
            typeStr,
            `${activeSymbol}${amt.toLocaleString(currency === 'INR' ? 'en-IN' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
          ];
        });

        autoTable(doc, {
          startY: y,
          head: [["#", "COST HEAD / CATEGORY", "DESCRIPTION / DETAILS", "COST TYPE / BASIS", "AMOUNT"]],
          body: costTableData,
          theme: "grid",
          tableLineColor: [209, 213, 219],
          tableLineWidth: 0.25,
          headStyles: {
            fillColor: [30, 41, 59],
            textColor: [255, 255, 255],
            fontSize: 8,
            fontStyle: 'bold',
            halign: 'center',
            valign: 'middle'
          },
          bodyStyles: {
            fontSize: 8,
            cellPadding: 3,
            valign: 'middle'
          },
          columnStyles: {
            0: { halign: 'center', cellWidth: 12 },
            1: { cellWidth: 50, fontStyle: 'bold' },
            2: { cellWidth: 'auto' },
            3: { halign: 'center', cellWidth: 45 },
            4: { halign: 'right', cellWidth: 35, fontStyle: 'bold' },
          },
          margin: { left: 15, right: 15, top: headerHeight, bottom: SAFE_BOTTOM },
          rowPageBreak: 'auto'
        });

        return (doc as any).lastAutoTable.finalY + 8;
      }

      const activeSymbol = getPdfCurrencySymbol(currency);
      const isChallan = type === DocumentType.DELIVERY_CHALLAN || (type && String(type).toLowerCase().includes("challan"));
      const hidePricesOnChallan = isChallan && !data.showPricesInChallan;

      if (hidePricesOnChallan) {
        const tableData = items.map((item, index) => [
          index + 1,
          item.description,
          item.hsn || "-",
          item.isRegret ? "-" : `${item.quantity} ${item.unit || "NOS"}`,
        ]);

        autoTable(doc, {
          startY: y,
          head: [["#", "Item Description", "HSN / SAC", "Quantity / Unit"]],
          body: tableData,
          theme: "grid",
          tableLineColor: [209, 213, 219],
          tableLineWidth: 0.25,
          headStyles: { 
            fillColor: layoutSettings.accentColor ? hexToRgb(layoutSettings.accentColor) : (layoutSettings.template === "modern" ? [63, 63, 70] : [30, 30, 30]),
            textColor: [255, 255, 255],
            fontSize: 8.5,
            fontStyle: 'bold',
            lineWidth: 0.25,
            lineColor: [209, 213, 219],
            valign: 'middle'
          },
          bodyStyles: {
            lineWidth: 0.25,
            lineColor: [209, 213, 219],
            textColor: [30, 30, 30],
            overflow: 'linebreak',
            valign: 'middle'
          },
          columnStyles: {
            0: { halign: 'center', cellWidth: 15 },
            1: { cellWidth: 'auto', overflow: 'linebreak' },
            2: { halign: 'center', cellWidth: 35 },
            3: { halign: 'center', cellWidth: 40 },
          },
          didParseCell: (data) => {
            if (data.section === 'head') {
              if (data.column.index === 0 || data.column.index === 2 || data.column.index === 3) data.cell.styles.halign = 'center';
            }
          },
          styles: { fontSize: 9, cellPadding: 3, font: "helvetica", lineColor: [209, 213, 219], lineWidth: 0.25 },
          margin: { left: 15, right: 15, top: headerHeight, bottom: SAFE_BOTTOM },
          didDrawPage: (d) => {
            if (d.pageNumber > 1) {
              doc.setFontSize(8);
              doc.setFont("helvetica", "italic");
              doc.setTextColor(150, 150, 150);
              doc.text(`Continued from page ${d.pageNumber - 1}...`, 15, headerHeight - 4);
              doc.setTextColor(0, 0, 0);
            }
          },
          rowPageBreak: 'auto'
        });

        return (doc as any).lastAutoTable.finalY + 8;
      }

      const tableData = items.map((item, index) => [
        index + 1,
        item.description,
        item.hsn,
        item.isRegret ? "-" : `${item.quantity} ${item.unit || "NOS"}`,
        item.isRegret ? "REGRET" : `${activeSymbol} ${item.rate.toLocaleString(currency === 'INR' ? 'en-IN' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        item.isRegret ? "REGRET" : `${activeSymbol} ${(item.quantity * item.rate).toLocaleString(currency === 'INR' ? 'en-IN' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      ]);

      autoTable(doc, {
        startY: y,
        head: [["#", "Description", "HSN", "Qty", `Rate (${activeSymbol})`, `Amount (${activeSymbol})`]],
        body: tableData,
        theme: "grid",
        tableLineColor: [209, 213, 219],
        tableLineWidth: 0.25,
        headStyles: { 
          fillColor: layoutSettings.accentColor ? hexToRgb(layoutSettings.accentColor) : (layoutSettings.template === "modern" ? [63, 63, 70] : [30, 30, 30]),
          textColor: [255, 255, 255],
          fontSize: 8.5,
          fontStyle: 'bold',
          lineWidth: 0.25,
          lineColor: [209, 213, 219],
          valign: 'middle'
        },
        bodyStyles: {
          lineWidth: 0.25,
          lineColor: [209, 213, 219],
          textColor: [30, 30, 30],
          overflow: 'linebreak',
          valign: 'middle'
        },
        columnStyles: {
          0: { halign: 'center', cellWidth: 14 },
          1: { cellWidth: 'auto', overflow: 'linebreak' },
          2: { halign: 'center', cellWidth: 23 },
          3: { halign: 'right', cellWidth: 22 },
          4: { halign: 'right', cellWidth: 38 },
          5: { halign: 'right', cellWidth: 40 },
        },
        didParseCell: (data) => {
          if (data.section === 'head') {
            if (data.column.index === 3 || data.column.index === 4 || data.column.index === 5) data.cell.styles.halign = 'right';
            else if (data.column.index === 0 || data.column.index === 2) data.cell.styles.halign = 'center';
          }
        },
        styles: { fontSize: 9, cellPadding: 3, font: "helvetica", lineColor: [209, 213, 219], lineWidth: 0.25 },
        margin: { left: 15, right: 15, top: headerHeight, bottom: SAFE_BOTTOM },
        didDrawPage: (d) => {
          if (d.pageNumber > 1) {
            doc.setFontSize(8);
            doc.setFont("helvetica", "italic");
            doc.setTextColor(150, 150, 150);
            doc.text(`Continued from page ${d.pageNumber - 1}...`, 15, headerHeight - 4);
            doc.setTextColor(0, 0, 0);
          }
        },
        rowPageBreak: 'auto'
      });

      return (doc as any).lastAutoTable.finalY + 8;
    },

    totals: (y) => {
      const { items, discount = 0, discountRate = 0, isExport, currency = "INR", type, customer } = data;
      
      if (type === DocumentType.COST_SHEET) {
        const activeSymbol = getPdfCurrencySymbol(currency);
        const suppliers = data.costSheetSuppliers || [];

        if (suppliers.length > 0) {
          const estSummaryHeight = 55;
          if (y + estSummaryHeight > pageHeight - SAFE_BOTTOM) {
            doc.addPage();
            y = headerHeight + 2;
          }

          const headRow = ["SUMMARY & TOTALS", ...suppliers.map(s => s.name + ((s.isLowestCost || s.isBestValue) ? "\n★ (Best)" : ""))];

          const summaryRows: string[][] = [
            ["Total Base Product Price", ...suppliers.map(s => `${activeSymbol}${(s.productCostTotal ?? s.productCost ?? 0).toLocaleString(currency === 'INR' ? 'en-IN' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`)],
            ["Overheads & Logistics Subtotal", ...suppliers.map(s => `${activeSymbol}${(s.logisticsTotal ?? s.logisticsCost ?? 0).toLocaleString(currency === 'INR' ? 'en-IN' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`)],
            ["Total Base Landed Cost", ...suppliers.map(s => `${activeSymbol}${(s.totalLandedCost ?? s.landedCost ?? 0).toLocaleString(currency === 'INR' ? 'en-IN' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`)],
            ["Target Profit Margin / Markup", ...suppliers.map(s => `+${activeSymbol}${(s.profitAmount || 0).toLocaleString(currency === 'INR' ? 'en-IN' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${s.profitType === '%' ? `${s.profitValue}%` : 'Flat'})`)],
            ["Discount (-)", ...suppliers.map(s => (s.discountAmount || 0) > 0 ? `-${activeSymbol}${(s.discountAmount).toLocaleString(currency === 'INR' ? 'en-IN' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "-")],
            ["FINAL QUOTED SELLING PRICE", ...suppliers.map(s => `${activeSymbol}${(s.finalSellingPrice || 0).toLocaleString(currency === 'INR' ? 'en-IN' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`)],
          ];

          const numSuppliers = suppliers.length;
          const suppColWidth = Math.max(22, (186 - 66) / Math.max(1, numSuppliers));

          const supplierColStyles: Record<number, any> = {};
          suppliers.forEach((sup, i) => {
            supplierColStyles[1 + i] = {
              halign: 'right' as const,
              valign: 'middle' as const,
              cellWidth: suppColWidth,
              fontStyle: 'bold' as const
            };
          });

          autoTable(doc, {
            startY: y,
            head: [headRow],
            body: summaryRows,
            theme: 'grid',
            tableLineColor: [209, 213, 219],
            tableLineWidth: 0.25,
            headStyles: {
              fillColor: [30, 41, 59],
              textColor: [255, 255, 255],
              fontSize: 8,
              fontStyle: 'bold',
              halign: 'center',
              valign: 'middle',
              cellPadding: 2.5
            },
            bodyStyles: {
              fontSize: 8,
              cellPadding: 2.5,
              valign: 'middle',
              textColor: [15, 23, 42]
            },
            styles: { fontSize: 8, cellPadding: 2.5, font: "helvetica", textColor: [15, 23, 42], valign: 'middle' },
            columnStyles: {
              0: { fontStyle: 'bold', cellWidth: 66, halign: 'left' as const, valign: 'middle' as const },
              ...supplierColStyles
            },
            margin: { left: 12, right: 12 },
            didParseCell: (cellData) => {
              if (cellData.section === 'head' && cellData.column.index >= 1) {
                const supIndex = cellData.column.index - 1;
                const isBest = suppliers[supIndex]?.isLowestCost || suppliers[supIndex]?.isBestValue;
                if (isBest) {
                  cellData.cell.styles.fillColor = [5, 150, 105];
                }
              }
              if (cellData.section === 'body') {
                if (cellData.row.index === summaryRows.length - 1) {
                  cellData.cell.styles.fillColor = [240, 243, 246];
                  cellData.cell.styles.fontSize = 8.5;
                  cellData.cell.styles.fontStyle = 'bold';
                  if (cellData.column.index >= 1) {
                    const supIndex = cellData.column.index - 1;
                    const isBest = suppliers[supIndex]?.isLowestCost || suppliers[supIndex]?.isBestValue;
                    if (isBest) {
                      cellData.cell.styles.fillColor = [209, 250, 229];
                      cellData.cell.styles.textColor = [4, 120, 87];
                    }
                  }
                } else if (cellData.column.index >= 1) {
                  const supIndex = cellData.column.index - 1;
                  const isBest = suppliers[supIndex]?.isLowestCost || suppliers[supIndex]?.isBestValue;
                  if (isBest) {
                    cellData.cell.styles.fillColor = [236, 253, 245];
                  }
                }
              }
            }
          });

          return (doc as any).lastAutoTable.finalY + 8;
        }

        const productCostTotal = data.costSheetProductCostTotal ?? items.filter(i => i.costCategoryKey === "product" || i.rawMaterialCost).reduce((acc, i) => acc + (i.rate || 0), 0);
        const logisticsTotal = data.costSheetLogisticsTotal ?? items.filter(i => i.costCategoryKey !== "product" && i.costCategoryKey !== "labour").reduce((acc, i) => acc + (i.rate || 0), 0);
        const totalLandedCost = data.costSheetTotalLandedCost ?? (productCostTotal + logisticsTotal);

        const profitType = data.costSheetProfitType ?? "%";
        const profitValue = data.costSheetProfitValue ?? 0;
        const profitAmount = data.costSheetProfitAmount ?? (profitType === "%" ? (totalLandedCost * profitValue) / 100 : profitValue);

        const discountType = data.costSheetDiscountType ?? "Flat";
        const discountValue = data.costSheetDiscountValue ?? 0;
        const discountAmount = data.costSheetDiscountAmount ?? (discountType === "%" ? (productCostTotal * discountValue) / 100 : discountValue);

        const finalSellingPrice = data.costSheetFinalSellingPrice ?? Math.max(0, totalLandedCost + profitAmount - discountAmount);

        const summaryRows: string[][] = [
          ["Total Base Product Price:", `${activeSymbol} ${productCostTotal.toFixed(2)}`],
          ["Overheads & Freight / Logistics Subtotal:", `${activeSymbol} ${logisticsTotal.toFixed(2)}`],
          ["Total Base Landed Cost:", `${activeSymbol} ${totalLandedCost.toFixed(2)}`],
        ];

        if (profitAmount > 0) {
          const profitLabel = profitType === "%" ? `Target Profit Margin (+${profitValue}% on Total Landed Cost):` : `Target Profit Margin (Flat):`;
          summaryRows.push([profitLabel, `+${activeSymbol} ${profitAmount.toFixed(2)}`]);
        }

        if (discountAmount > 0) {
          const discountLabel = discountType === "%" ? `Discount (-${discountValue}% on Base Product Price):` : `Discount (Flat):`;
          summaryRows.push([discountLabel, `-${activeSymbol} ${discountAmount.toFixed(2)}`]);
        }

        summaryRows.push(["FINAL QUOTED SELLING PRICE:", `${activeSymbol} ${finalSellingPrice.toFixed(2)}`]);

        autoTable(doc, {
          startY: y,
          body: summaryRows,
          theme: 'grid',
          styles: { fontSize: 8.5, cellPadding: 3, font: "helvetica", textColor: [15, 23, 42] },
          columnStyles: {
            0: { fontStyle: 'bold', cellWidth: 115, halign: 'left' },
            1: { fontStyle: 'bold', cellWidth: 65, halign: 'right' }
          },
          margin: { left: 15, right: 15 },
          didParseCell: (cellData) => {
            if (cellData.row.index === summaryRows.length - 1) {
              cellData.cell.styles.fillColor = [240, 243, 246];
              cellData.cell.styles.fontSize = 9.5;
              cellData.cell.styles.fontStyle = 'bold';
            }
          }
        });

        return (doc as any).lastAutoTable.finalY + 8;
      }
      
      if (type === DocumentType.PACKING_LIST) {
        const boxes = data.packingBoxes || [];
        if (boxes.length === 0) return y;
         // Helper to safely extract quantity from quantityText (e.g. "Box 1-5 X 20" -> 20)
        const parseBoxQty = (boxQuantityText: string | undefined): number => {
          if (!boxQuantityText) return 0;
          const trimmed = boxQuantityText.trim();
          const match = trimmed.match(/[xX]\s*(\d+)\s*$/);
          if (match) {
            return parseInt(match[1], 10);
          }
          const literalParts = trimmed.split(/\s*[xX]\s*/);
          if (literalParts.length > 1) {
            const lastPart = parseInt(literalParts[literalParts.length - 1], 10);
            if (!isNaN(lastPart)) return lastPart;
          }
          return 0;
        };

        // Group boxes with identical dimensions, netWeight, grossWeight, and qty
        const groups: Record<string, typeof boxes[0][]> = {};
        boxes.forEach(box => {
          const singleQty = parseBoxQty(box.quantityText);
          const net = box.netWeight !== undefined && box.netWeight !== null ? Number(box.netWeight) : 0;
          const gross = box.grossWeight !== undefined && box.grossWeight !== null ? Number(box.grossWeight) : 0;
          const dims = (box.dimensions || "").trim();
          
          const key = isExport 
            ? `${singleQty}_${net.toFixed(2)}_${gross.toFixed(2)}_${dims}`
            : `${singleQty}_${dims}`;
          if (!groups[key]) {
            groups[key] = [];
          }
          groups[key].push(box);
        });

        // Format grouped box numbers nicely
        const formatBoxGroup = (groupBoxes: typeof boxes[0][]) => {
          if (groupBoxes.length === 1) {
            return groupBoxes[0].boxNo || "";
          }

          const parsed = groupBoxes.map(b => {
            const bNo = b.boxNo || "";
            const numMatch = bNo.match(/\d+/);
            const num = numMatch ? parseInt(numMatch[0], 10) : NaN;
            const prefix = numMatch ? bNo.substring(0, bNo.indexOf(numMatch[0])) : bNo;
            return { raw: bNo, num, prefix };
          });

          const allNumeric = parsed.every(p => !isNaN(p.num));
          if (allNumeric) {
            parsed.sort((a, b) => a.num - b.num);
            const prefix = parsed[0].prefix || "Box ";

            const ranges: string[] = [];
            let start = parsed[0].num;
            let prev = parsed[0].num;

            for (let i = 1; i < parsed.length; i++) {
              if (parsed[i].num === prev + 1) {
                prev = parsed[i].num;
              } else {
                if (start === prev) {
                  ranges.push(`${start}`);
                } else {
                  ranges.push(`${start} - ${prev}`);
                }
                start = parsed[i].num;
                prev = parsed[i].num;
              }
            }
            if (start === prev) {
              ranges.push(`${start}`);
            } else {
              ranges.push(`${start} - ${prev}`);
            }

            return `${prefix}${ranges.join(", ")} (${groupBoxes.length} Boxes)`;
          }

          const names = groupBoxes.map(b => b.boxNo || "");
          if (names.length <= 4) {
            return names.join(", ");
          } else {
            return `${names.slice(0, 3).join(", ")}, ... (${names.length} Boxes)`;
          }
        };

        const summaryRows: any[] = Object.values(groups).map(group => {
          const singleQty = parseBoxQty(group[0].quantityText);
          const totalQtyInGroup = singleQty * group.length;
          const totalNetInGroup = (group[0].netWeight || 0) * group.length;
          const totalGrossInGroup = (group[0].grossWeight || 0) * group.length;

          return [
            formatBoxGroup(group),
            `${totalQtyInGroup} NOS`,
            totalNetInGroup > 0 ? `${totalNetInGroup.toFixed(2)} KGS` : "-",
            totalGrossInGroup > 0 ? `${totalGrossInGroup.toFixed(2)} KGS` : "-",
            group[0].dimensions || "-"
          ];
        });

        // Space check
        const estimatedHeight = 15 + (summaryRows.length * 6) + 15;
        if (y + estimatedHeight > pageHeight - SAFE_BOTTOM) {
          doc.addPage();
          y = headerHeight;
        }

        doc.setFont("helvetica", "bold");
        doc.setFontSize(9.5);
        const actualTotalBoxes = getUniquePhysicalBoxesCount(boxes);
        doc.text(`PACKING DETAILS & SUMMARY (Total Boxes: ${actualTotalBoxes})`, 15, y);
        y += 4;

        // Add a total row at the end
        const totalQty = boxes.reduce((sum, b) => {
          return sum + parseBoxQty(b.quantityText);
        }, 0);

        const totalNet = boxes.reduce((sum, b) => sum + (b.netWeight || 0), 0);
        const totalGross = boxes.reduce((sum, b) => sum + (b.grossWeight || 0), 0);

        summaryRows.push([
          "TOTALS",
          `${totalQty} NOS`,
          totalNet > 0 ? `${totalNet.toFixed(2)} KGS` : "-",
          totalGross > 0 ? `${totalGross.toFixed(2)} KGS` : "-",
          ""
        ]);

        autoTable(doc, {
          startY: y,
          head: [["Package / Box No.", "Packed Quantity", "Net Weight (KGS)", "Gross Weight (KGS)", "Dimensions / Size (Inches)"]],
          body: summaryRows,
          theme: 'grid',
          headStyles: { 
            fillColor: [240, 240, 240],
            textColor: [0, 0, 0],
            fontSize: 8,
            fontStyle: 'bold',
            halign: 'center'
          },
          columnStyles: {
            0: { halign: 'center', cellWidth: 35 },
            1: { halign: 'center', cellWidth: 30 },
            2: { halign: 'center', cellWidth: 30 },
            3: { halign: 'center', cellWidth: 30 },
            4: { halign: 'center', cellWidth: 'auto' },
          },
          styles: { fontSize: 8, cellPadding: 2.1, font: "helvetica", textColor: [0, 0, 0] },
          margin: { left: 15, right: 15, top: headerHeight, bottom: SAFE_BOTTOM },
          didParseCell: (cellData) => {
            if (cellData.row.index === summaryRows.length - 1) {
              // Mark the Total row bold
              cellData.cell.styles.fontStyle = 'bold';
              cellData.cell.styles.fillColor = [245, 245, 245];
            }
          }
        });

        return (doc as any).lastAutoTable.finalY + 10;
      }

      const isChallan = type === DocumentType.DELIVERY_CHALLAN || (type && String(type).toLowerCase().includes("challan"));
      if (isChallan && !data.showPricesInChallan) {
        return y;
      }
      
      const subtotal = Math.round(items.reduce((acc, item) => acc + (item.isRegret ? 0 : item.quantity * item.rate), 0) * 100) / 100;
      const isQuotation = type === DocumentType.QUOTATION;
      const isTaxApplicable = data.isTaxEnabled !== undefined ? data.isTaxEnabled : (!isQuotation && !isExport);
      const freightAmt = data.freightOption === "extra" ? Math.round((data.freightAmount || 0) * 100) / 100 : 0;
      const packagingAmt = data.packagingOption === "extra" ? Math.round((data.packagingAmount || 0) * 100) / 100 : 0;

      const itemTax = items.reduce((acc, item) => acc + (item.isRegret ? 0 : (item.quantity * item.rate * item.taxRate) / 100), 0);
      const avgTaxRate = subtotal > 0 ? (itemTax / subtotal) : 0.18;

      const effectiveFreightTaxRate = (data.freightTaxRate !== undefined && !isNaN(data.freightTaxRate)) ? data.freightTaxRate : (avgTaxRate * 100);
      const effectivePackagingTaxRate = (data.packagingTaxRate !== undefined && !isNaN(data.packagingTaxRate)) ? data.packagingTaxRate : (avgTaxRate * 100);

      const fTaxTiming = data.freightTaxTiming !== undefined ? data.freightTaxTiming : "before_tax";
      const pTaxTiming = data.packagingTaxTiming !== undefined ? data.packagingTaxTiming : "before_tax";

      const freightTax = (isTaxApplicable && data.freightOption === "extra" && fTaxTiming === "before_tax") ? (freightAmt * (effectiveFreightTaxRate / 100)) : 0;
      const packagingTax = (isTaxApplicable && data.packagingOption === "extra" && pTaxTiming === "before_tax") ? (packagingAmt * (effectivePackagingTaxRate / 100)) : 0;

      const totalTax = isTaxApplicable ? Math.round((itemTax + freightTax + packagingTax) * 100) / 100 : 0;
      const grossTotal = Math.round((subtotal + totalTax - discount + freightAmt + packagingAmt) * 100) / 100;
      const grandTotal = Math.max(0, Math.round(grossTotal));
      const roundOff = Math.round((grandTotal - grossTotal) * 100) / 100;
      const activeSymbol = getPdfCurrencySymbol(currency);

      const formatCurrencyLocal = (val: number) => {
        const locale = currency === "INR" ? "en-IN" : "en-US";
        return `${activeSymbol} ${val.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      };

      const isProforma = type === DocumentType.PROFORMA_INVOICE;
      const hasAdvance = isProforma && (data.advancePercentage || 0) > 0;

      const bizStateCode = business.gstin?.substring(0, 2);
      const custStateCode = customer.gstin?.substring(0, 2);
      const isValidBizState = bizStateCode && /^\d{2}$/.test(bizStateCode);
      const isValidCustState = custStateCode && /^\d{2}$/.test(custStateCode);
      const isInterState = !!(isValidBizState && isValidCustState && bizStateCode !== custStateCode) || isExport || !!data.isIgst;

      const showFreight = data.freightOption === "extra" || data.freightOption === "inclusive";
      const showPackaging = data.packagingOption === "extra" || data.packagingOption === "inclusive";

      const hasDiscount = discount > 0;
      const taxSys = business.taxSystem || getCountryConfig(business.country || "India").taxSystem;

      // Calculate tax percentage string
      const taxPctVal = Math.round((avgTaxRate * 100) * 100) / 100;
      const formatPctStr = (pct: number) => {
        const rounded = Math.round(pct * 100) / 100;
        return Number.isInteger(rounded) ? `${rounded}%` : `${rounded.toFixed(2)}%`;
      };
      const totalTaxPctLabel = formatPctStr(taxPctVal);
      const halfTaxPctLabel = formatPctStr(taxPctVal / 2);

      // Construct table rows
      const summaryTableRows: string[][] = [];

      if (!isQuotation || totalTax > 0) {
        summaryTableRows.push(["Subtotal:", formatCurrencyLocal(subtotal)]);
        if (totalTax > 0) {
          const sellerCountry = business.country || data.countryOfOrigin || "India";
          const taxName = getTaxName(sellerCountry);

          if (taxSys === "GST_INDIA" || sellerCountry.toLowerCase().trim() === "india") {
            if (isInterState) {
              summaryTableRows.push(["Total IGST:", formatCurrencyLocal(totalTax)]);
            } else {
              summaryTableRows.push(["Total CGST:", formatCurrencyLocal(totalTax / 2)]);
              summaryTableRows.push(["Total SGST:", formatCurrencyLocal(totalTax / 2)]);
            }
          } else {
            summaryTableRows.push([`Total ${taxName}:`, formatCurrencyLocal(totalTax)]);
          }
        }
      } else if (hasDiscount) {
        summaryTableRows.push(["Total:", formatCurrencyLocal(subtotal)]);
      }

      if (hasDiscount) {
        const discountLabel = discountRate > 0 ? `Discount (${discountRate}%):` : `Discount:`;
        summaryTableRows.push([discountLabel, `- ${formatCurrencyLocal(discount)}`]);
      }

      if (showFreight) {
        const val = data.freightOption === "extra" ? formatCurrencyLocal(freightAmt) : "Inclusive";
        summaryTableRows.push(["Freight Charge:", val]);
      }

      if (showPackaging) {
        const val = data.packagingOption === "extra" ? formatCurrencyLocal(packagingAmt) : "Inclusive";
        summaryTableRows.push(["Packaging & Forwarding:", val]);
      }

      const roundOffFormatted = roundOff >= 0 ? `+${formatCurrencyLocal(roundOff)}` : formatCurrencyLocal(roundOff);
      summaryTableRows.push(["Round Off:", roundOffFormatted]);

      summaryTableRows.push(["Grand Total:", formatCurrencyLocal(grandTotal)]);

      if (hasAdvance) {
        const advanceAmt = Math.round((grandTotal * (data.advancePercentage || 0) / 100) * 100) / 100;
        summaryTableRows.push([`TOTAL ADVANCE PAYABLE (${data.advancePercentage}%):`, formatCurrencyLocal(advanceAmt)]);
      }

      // Build Tax Summary Breakdown Table data (left side of totals)
      const slabMap = new Map<number, { rate: number; base: number; tax: number; total: number }>();

      items.forEach(item => {
        if (item.isRegret) return;
        const rate = item.taxRate ?? 0;
        const base = item.quantity * item.rate;
        const tax = isTaxApplicable ? (base * rate) / 100 : 0;
        const existing = slabMap.get(rate);
        if (existing) {
          existing.base += base;
          existing.tax += tax;
          existing.total += (base + tax);
        } else {
          slabMap.set(rate, { rate, base, tax, total: base + tax });
        }
      });

      if (isTaxApplicable && freightAmt > 0 && freightTax > 0) {
        const fRate = Math.round(effectiveFreightTaxRate * 100) / 100;
        const existingF = slabMap.get(fRate);
        if (existingF) {
          existingF.base += freightAmt;
          existingF.tax += freightTax;
          existingF.total += (freightAmt + freightTax);
        } else {
          slabMap.set(fRate, { rate: fRate, base: freightAmt, tax: freightTax, total: freightAmt + freightTax });
        }
      }

      if (isTaxApplicable && packagingAmt > 0 && packagingTax > 0) {
        const pRate = Math.round(effectivePackagingTaxRate * 100) / 100;
        const existingP = slabMap.get(pRate);
        if (existingP) {
          existingP.base += packagingAmt;
          existingP.tax += packagingTax;
          existingP.total += (packagingAmt + packagingTax);
        } else {
          slabMap.set(pRate, { rate: pRate, base: packagingAmt, tax: packagingTax, total: packagingAmt + packagingTax });
        }
      }

      const sortedSlabs = Array.from(slabMap.values()).sort((a, b) => a.rate - b.rate);
      const showTaxSummaryTable = isTaxApplicable && (totalTax > 0 || sortedSlabs.some(s => s.rate > 0));

      const taxTableRows: string[][] = [];
      if (showTaxSummaryTable) {
        let totBase = 0;
        let totTax = 0;
        let totAll = 0;

        sortedSlabs.forEach(slab => {
          const slabRateStr = formatPctStr(slab.rate);
          const sellerCountry = business.country || data.countryOfOrigin || "India";
          const taxName = getTaxName(sellerCountry);
          let slabLabel = `${taxName} @ ${slabRateStr}`;
          if (taxSys === "GST_INDIA" || sellerCountry.toLowerCase().trim() === "india") {
            if (isInterState) slabLabel = `IGST @ ${slabRateStr}`;
            else slabLabel = `GST @ ${slabRateStr}`;
          }

          const baseRound = Math.round(slab.base * 100) / 100;
          const taxRound = Math.round(slab.tax * 100) / 100;
          const totalRound = Math.round(slab.total * 100) / 100;

          totBase += baseRound;
          totTax += taxRound;
          totAll += totalRound;

          taxTableRows.push([
            slabLabel,
            formatCurrencyLocal(baseRound),
            formatCurrencyLocal(taxRound),
            formatCurrencyLocal(totalRound)
          ]);
        });

        // Add TOTAL row for Tax Breakdown
        taxTableRows.push([
          "TOTAL",
          formatCurrencyLocal(Math.round(totBase * 100) / 100),
          formatCurrencyLocal(Math.round(totTax * 100) / 100),
          formatCurrencyLocal(Math.round(totAll * 100) / 100)
        ]);
      }

      // Check Bank Details Active
      const currentNormType = normalizeDocType(type);
      const allowedDocs = (business as any).showBankDetailsInDocs;
      let isBankAllowed = false;
      if (Array.isArray(allowedDocs)) {
        const normAllowed = allowedDocs.map(normalizeDocType);
        isBankAllowed = normAllowed.includes(currentNormType);
      } else {
        isBankAllowed = (currentNormType === "invoice" || currentNormType === "proforma invoice");
      }

      const hasBankDetailsData = Boolean(
        business.bankName || business.accountNumber || business.ifscCode || business.branchCode
      );

      const isBankDetailsActive = isBankAllowed && hasBankDetailsData;

      const rightTableEstHeight = (summaryTableRows.length * 6.5) + 6;

      if (y + rightTableEstHeight > pageHeight - SAFE_BOTTOM) {
        doc.addPage();
        y = headerHeight;
      }

      const startTotalsY = y;
      let leftFinalY = startTotalsY;

      // 1. Bank Details Table (LEFT side - 90mm width)
      if (isBankDetailsActive) {
        const bankBody: any[] = [];
        if (business.bankName) {
          bankBody.push([{ content: "Bank Name:", styles: { fontStyle: 'bold', fillColor: [249, 250, 251], textColor: [17, 24, 39] } }, business.bankName]);
        }
        if (business.accountNumber) {
          bankBody.push([{ content: "Account No.:", styles: { fontStyle: 'bold', fillColor: [249, 250, 251], textColor: [17, 24, 39] } }, business.accountNumber]);
        }
        if (business.ifscCode) {
          bankBody.push([{ content: "IFSC / SWIFT:", styles: { fontStyle: 'bold', fillColor: [249, 250, 251], textColor: [17, 24, 39] } }, business.ifscCode]);
        }
        if (business.branchCode) {
          bankBody.push([{ content: "Branch Code:", styles: { fontStyle: 'bold', fillColor: [249, 250, 251], textColor: [17, 24, 39] } }, business.branchCode]);
        }

        autoTable(doc, {
          startY: startTotalsY,
          margin: { left: 15, right: pageWidth - 15 - 90 },
          head: [[{ content: "BANK DETAILS", colSpan: 2 }]],
          body: bankBody,
          theme: 'grid',
          headStyles: {
            fillColor: [17, 24, 39],
            textColor: [255, 255, 255],
            fontSize: 8.5,
            fontStyle: 'bold',
            halign: 'left',
            cellPadding: 2.5
          },
          columnStyles: {
            0: { cellWidth: 28 },
            1: { cellWidth: 62 }
          },
          styles: {
            font: 'helvetica',
            fontSize: 8.5,
            cellPadding: 2,
            textColor: [31, 41, 55],
            lineColor: [209, 213, 219],
            lineWidth: 0.25,
            overflow: 'linebreak'
          }
        });
        leftFinalY = (doc as any).lastAutoTable.finalY;
      }

      // 2. Grand Totals Table (RIGHT side - 80mm width)
      autoTable(doc, {
        startY: startTotalsY,
        margin: { left: 115, right: 15 },
        body: summaryTableRows,
        theme: 'grid',
        styles: {
          font: 'helvetica',
          fontSize: 8.5,
          cellPadding: 2.2,
          textColor: [40, 40, 40],
          lineColor: [180, 180, 180],
          lineWidth: 0.2,
        },
        columnStyles: {
          0: { halign: 'left', cellWidth: 42, fontStyle: 'normal' },
          1: { halign: 'right', cellWidth: 38, fontStyle: 'normal' },
        },
        didParseCell: (cellData) => {
          const rowLabel = summaryTableRows[cellData.row.index]?.[0] || "";
          if (rowLabel === "Grand Total:") {
            cellData.cell.styles.fontStyle = 'bold';
            cellData.cell.styles.fontSize = 9.5;
            cellData.cell.styles.textColor = [0, 0, 0];
            cellData.cell.styles.fillColor = [245, 245, 245];
          } else if (rowLabel.startsWith("TOTAL ADVANCE PAYABLE")) {
            cellData.cell.styles.fontStyle = 'bold';
            cellData.cell.styles.fontSize = 8.5;
            cellData.cell.styles.textColor = [0, 0, 0];
            cellData.cell.styles.fillColor = [238, 242, 246];
          }
        }
      });

      const rightFinalY = (doc as any).lastAutoTable.finalY;
      let currentY = Math.max(leftFinalY, rightFinalY);

      // 3. Amount in Words (positioned directly below Grand Total & Bank Details)
      const amountForWords = hasAdvance ? Math.round((grandTotal * (data.advancePercentage || 0) / 100) * 100) / 100 : grandTotal;
      const amountWords = numberToWords(amountForWords, currency);
      const splitWords = doc.splitTextToSize(amountWords, 180);

      const wordsEstHeight = 8 + (splitWords.length * 3.8);
      if (currentY + wordsEstHeight > pageHeight - SAFE_BOTTOM) {
        doc.addPage();
        currentY = headerHeight + 2;
      } else {
        currentY += 4;
      }

      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(80, 80, 80);
      doc.text("AMOUNT IN WORDS:", 15, currentY);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);
      doc.text(splitWords, 15, currentY + 3.8);

      currentY += 3.8 + (splitWords.length * 3.8) + 3;

      // 4. Tax Summary / Tax Slab Table (positioned below Amount in Words)
      if (showTaxSummaryTable) {
        const taxTableEstHeight = (taxTableRows.length + 1) * 6 + 8;
        if (currentY + taxTableEstHeight > pageHeight - SAFE_BOTTOM) {
          doc.addPage();
          currentY = headerHeight + 2;
        } else {
          currentY += 2;
        }

        autoTable(doc, {
          startY: currentY,
          margin: { left: 15, right: 15 },
          head: [["Tax Slab", "Taxable Base", "Tax Amount", "Total"]],
          body: taxTableRows,
          theme: 'grid',
          headStyles: {
            fillColor: [240, 240, 240],
            textColor: [0, 0, 0],
            fontSize: 7.5,
            fontStyle: 'bold',
            halign: 'center'
          },
          columnStyles: {
            0: { halign: 'left', cellWidth: 50 },
            1: { halign: 'right', cellWidth: 40 },
            2: { halign: 'right', cellWidth: 45 },
            3: { halign: 'right', cellWidth: 45 }
          },
          styles: {
            font: 'helvetica',
            fontSize: 7.5,
            cellPadding: 1.8,
            textColor: [40, 40, 40],
            lineColor: [180, 180, 180],
            lineWidth: 0.2
          },
          didParseCell: (cellData) => {
            if (cellData.row.index === taxTableRows.length - 1) {
              cellData.cell.styles.fontStyle = 'bold';
              cellData.cell.styles.fillColor = [245, 245, 245];
              cellData.cell.styles.textColor = [0, 0, 0];
            }
          }
        });
        currentY = (doc as any).lastAutoTable.finalY + 4;
      }

      return currentY;
    },

    bank_details: (y: number) => y,
    incoterms: (y: number) => renderIncotermsOnly(y),

    terms: (y) => {
      const { notes, terms, type, showNotesInPdf, showTermsInPdf } = data;
      
      const showTerms = showTermsInPdf !== false && Boolean(terms && terms.trim().length > 0);
      const showNotes = showNotesInPdf !== false && Boolean(notes && notes.trim().length > 0);
      if ((!showNotes && !showTerms) || type === DocumentType.PACKING_LIST) return y;

      // Check if we have enough space to start the terms section
      // If not, move to a new page
      if (y + 20 > pageHeight - SAFE_BOTTOM) {
        doc.addPage();
        y = headerHeight;
      }
      
      const body = [];
      if (showNotes) {
        body.push(["NOTES / PAYMENT INSTRUCTIONS"]);
        body.push([notes.trim()]);
      }
      if (showTerms) {
        body.push(["TERMS & CONDITIONS"]);
        body.push([terms.trim()]);
      }

      autoTable(doc, {
        startY: y,
        body: body,
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 3, textColor: [80, 80, 80], valign: 'top' },
        columnStyles: { 0: { fontStyle: 'normal' } },
        didParseCell: (data) => {
          const text = data.cell.text[0];
          if (text === "NOTES / PAYMENT INSTRUCTIONS" || text === "TERMS & CONDITIONS") {
            data.cell.styles.fillColor = layoutSettings.accentColor ? hexToRgb(layoutSettings.accentColor) : [240, 240, 240];
            data.cell.styles.textColor = layoutSettings.accentColor ? [255, 255, 255] : [50, 50, 50];
            data.cell.styles.fontStyle = 'bold';
          }
        },
        margin: { left: 15, right: 15, bottom: SAFE_BOTTOM, top: headerHeight },
        pageBreak: 'auto'
      });
      return (doc as any).lastAutoTable.finalY + 8;
    },

    signature: (y) => {
      const { type } = data;
      
      if (type === DocumentType.PACKING_LIST) {
        const declSigHeight = 28;
        const targetSigY = pageHeight - SAFE_BOTTOM - declSigHeight - 2;

        if (y > targetSigY) {
          doc.addPage();
        }
        const sigY = pageHeight - SAFE_BOTTOM - declSigHeight - 2;

        // Left half: Declaration text box
        doc.setDrawColor(120, 120, 120);
        doc.setLineWidth(0.15);
        doc.rect(15, sigY, 90, 25); // draw box around Declaration

        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.text("DECLARATION", 18, sigY + 5);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        const declText = "We declare that this details sheet shows the actual description of the goods packed and that all packing details are correct and true.";
        const splitDecl = doc.splitTextToSize(declText, 84);
        doc.text(splitDecl, 18, sigY + 10);

        // Right half: For business.name & Signature
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text(`For ${business.name || "YOUR BUSINESS NAME"}`, pageWidth - 15, sigY + 5, { align: "right" });

        if (business.signature) {
          try {
            let format = "PNG";
            if (business.signature.startsWith("data:image/jpeg") || business.signature.startsWith("data:image/jpg")) format = "JPEG";
            const imgProps = doc.getImageProperties(business.signature);
            const aspect = imgProps.width / imgProps.height;
            const maxSigWidth = 45;
            const maxSigHeight = 15;
            let renderWidth = maxSigWidth;
            let renderHeight = maxSigWidth / aspect;
            if (renderHeight > maxSigHeight) {
              renderHeight = maxSigHeight;
              renderWidth = maxSigHeight * aspect;
            }
            const sigX = pageWidth - 15 - renderWidth;
            doc.addImage(business.signature, format, sigX, sigY + 5, renderWidth, renderHeight);
          } catch (e) {}
        }

        doc.setFont("helvetica", "bold");
        doc.text("Signature", pageWidth - 15, sigY + 22, { align: "right" });

        return sigY + 28;
      }

      const hasSigImg = Boolean(business.signature);
      const sigBlockHeight = hasSigImg ? 30 : 24;
      const targetSigY = pageHeight - SAFE_BOTTOM - sigBlockHeight - 2;

      let finalSigY = targetSigY;
      if (y > targetSigY) {
        doc.addPage();
        finalSigY = pageHeight - SAFE_BOTTOM - sigBlockHeight - 2;
      }

      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text(`For ${business.name || "YOUR BUSINESS NAME"}`, pageWidth - 15, finalSigY, { align: "right" });
      
      let currentSigY = finalSigY;
      if (business.signature) {
        try {
          let format = "PNG";
          if (business.signature.startsWith("data:image/jpeg") || business.signature.startsWith("data:image/jpg")) format = "JPEG";
          
          const imgProps = doc.getImageProperties(business.signature);
          const aspectRatio = imgProps.width / imgProps.height;
          const maxSigWidth = 45;
          const maxSigHeight = 20;

          let renderWidth = maxSigWidth;
          let renderHeight = maxSigWidth / aspectRatio;

          if (renderHeight > maxSigHeight) {
            renderHeight = maxSigHeight;
            renderWidth = maxSigHeight * aspectRatio;
          }

          const sigX = pageWidth - 15 - renderWidth;
          doc.addImage(business.signature, format, sigX, currentSigY + 2, renderWidth, renderHeight);
          currentSigY += renderHeight + 3;
        } catch (e) {
          currentSigY += 18;
        }
      } else {
        currentSigY += 18;
      }
      
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text("Signature", pageWidth - 15, currentSigY, { align: "right" });
      return currentSigY + 6;
    },

    qa_risk_mitigation: (y) => y,
    qa_inspection_summary: (y) => y,
    qa_traceability: (y) => y,
    qa_sampling: (y) => y,
    qa_ncr: (y: number) => y,
    qa_evidence: (y) => y,
    qa_packaging: (y: number) => y,
    qa_technical_notes: (y: number) => y,
    qa_final_remarks: (y: number) => y,
    qa_declaration: (y: number) => y,
    qa_dimensional_report: (y: number) => y
  };

  // Execute sections in order
  const defaultSections = ["header", "party_details", "items_table", "totals", "bank_details", "incoterms", "terms", "signature"];
  let order: string[] = (layoutSettings.sectionOrder && layoutSettings.sectionOrder.length > 0)
    ? [...layoutSettings.sectionOrder]
    : [...defaultSections];

  // If incoterms is missing from order, insert it after bank_details or before terms
  if (!order.includes("incoterms")) {
    const bankIdx = order.indexOf("bank_details");
    if (bankIdx !== -1) {
      order.splice(bankIdx + 1, 0, "incoterms");
    } else {
      const termsIdx = order.indexOf("terms");
      if (termsIdx !== -1) {
        order.splice(termsIdx, 0, "incoterms");
      } else {
        order.push("incoterms");
      }
    }
  }

  // Ensure all essential sections exist in order list so no part of the document is skipped
  defaultSections.forEach(secKey => {
    if (!order.includes(secKey)) {
      order.push(secKey);
    }
  });

  order.forEach(sectionKey => {
    if (sections[sectionKey]) {
      currentY = sections[sectionKey](currentY);
    }
  });

  // Page numbering & footer disclaimer across all generated pages
  const totalPages = (doc as any).internal.getNumberOfPages();
  const pageFooterY = pageHeight - Math.max(6, Math.min(12, footerHeight / 3));
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(120, 120, 120);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - 15, pageFooterY, { align: "right" });
    if (!hasLetterhead && !hideForPreprinted) {
      doc.text("This is a computer generated document.", 15, pageFooterY);
    }
  }

  return doc;
}


function numberToWords(amount: number, currency: string = "INR"): string {
  const units = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const scales = ["", "Thousand", "Million", "Billion", "Trillion"];

  if (amount === 0) return "Zero";

  function convertChunk(num: number): string {
    let str = "";
    if (num >= 100) {
      str += units[Math.floor(num / 100)] + " Hundred ";
      num %= 100;
    }
    if (num >= 20) {
      str += tens[Math.floor(num / 10)] + " ";
      num %= 10;
    }
    if (num > 0) {
      str += units[num] + " ";
    }
    return str.trim();
  }

  const isINR = currency === "INR";
  const wholePart = Math.floor(amount);
  const decimalPart = Math.round((amount - wholePart) * 100);

  let result = "";

  if (isINR) {
    // Indian numbering system (Lakhs, Crores)
    const formatIndian = (num: number): string => {
      if (num === 0) return "";
      let res = "";
      if (num >= 10000000) {
        res += formatIndian(Math.floor(num / 10000000)) + " Crore ";
        num %= 10000000;
      }
      if (num >= 100000) {
        res += formatIndian(Math.floor(num / 100000)) + " Lakh ";
        num %= 100000;
      }
      if (num >= 1000) {
        res += formatIndian(Math.floor(num / 1000)) + " Thousand ";
        num %= 1000;
      }
      if (num > 0) {
        res += convertChunk(num);
      }
      return res.trim();
    };
    result = formatIndian(wholePart);
  } else {
    // International numbering system
    let scaleIdx = 0;
    let tempNum = wholePart;
    while (tempNum > 0) {
      const chunk = tempNum % 1000;
      if (chunk > 0) {
        result = convertChunk(chunk) + " " + scales[scaleIdx] + " " + result;
      }
      tempNum = Math.floor(tempNum / 1000);
      scaleIdx++;
    }
  }

  result = result.trim() || "Zero";
  const currencyName = isINR ? "Rupees" : (currency === "USD" ? "Dollars" : currency);
  const subCurrencyName = isINR ? "Paise" : (currency === "USD" ? "Cents" : "Cents");

  if (decimalPart > 0) {
    return `${currencyName} ${result} and ${convertChunk(decimalPart)} ${subCurrencyName} Only`;
  }
  return `${currencyName} ${result} Only`;
}

export async function downloadInvoicePDF(data: InvoiceData): Promise<void> {
  trackEvent("PDF Downloaded", {
    documentType: data.type || "Invoice",
    documentNumber: data.id || "",
    amount: (data as any).totals?.grandTotal || (data as any).grandTotal || 0,
    currency: data.currency || "USD",
  });
  const doc = await generateInvoicePDF(data);
  const { id, type } = data;
  const safeId = id.replace(/[\/\\]/g, "_").replace(/[^a-z0-9_\-]/gi, "_");
  const safeType = type.replace(/[^a-z0-9_\-]/gi, "_");
  const filename = `${safeType}_${safeId}.pdf`;

  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  if (isMobile) {
    try {
      // On mobile, Safari and Chrome prefer rendering the PDF in a new window or tab
      // where the user can natively save it to files or share it. 
      const blob = doc.output('blob');
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 3000);
    } catch (e) {
      console.warn("Mobile standard blob action failed, trying data-uri fallback", e);
      // Fallback to data uri
      try {
        const dataUri = doc.output('datauristring');
        const newWindow = window.open();
        if (newWindow) {
          newWindow.document.write(`<iframe src="${dataUri}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
          newWindow.document.close();
        } else {
          window.location.href = dataUri;
        }
      } catch (dataUriErr) {
        console.error("All PDF mobile generation options exhausted", dataUriErr);
      }
    }
  } else {
    // Normal desktop execution
    doc.save(filename);
  }
}

