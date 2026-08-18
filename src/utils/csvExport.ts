import { DocumentHistoryItem } from "../types";

const escapeCSV = (val: any): string => {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
};

/**
 * Export document history as a high-level summary CSV.
 * Ideal for financial overview, ledger summaries, and billing tracking.
 */
export const exportHistorySummaryToCSV = (
  historyItems: DocumentHistoryItem[],
  filenamePrefix: string = "invoice_history_summary"
) => {
  if (!historyItems || historyItems.length === 0) return;

  const headers = [
    "Document ID",
    "Document Type",
    "Date",
    "Customer / Party Name",
    "GSTIN / Tax ID",
    "Email",
    "Phone",
    "PO / Ref Number",
    "Currency",
    "Subtotal",
    "Tax Amount",
    "Freight",
    "Packaging",
    "Discount",
    "Round Off",
    "Grand Total",
    "Grand Total (INR)",
    "Items Count"
  ];

  const rows = historyItems.map(item => {
    const data = item.fullData;
    const items = data?.items || [];
    
    // Calculate subtotal and tax if fullData exists
    const subtotal = items.length > 0 
      ? items.reduce((sum, i) => sum + ((i.quantity || 0) * (i.rate || 0)), 0)
      : (item.total || 0);

    const taxAmount = items.length > 0
      ? items.reduce((sum, i) => sum + ((i.quantity || 0) * (i.rate || 0) * ((i.taxRate || 0) / 100)), 0)
      : 0;

    const freight = data?.freightAmount || 0;
    const packaging = data?.packagingAmount || 0;
    const discount = data?.discount || 0;
    const roundOff = (data as any)?.roundOff || 0;

    return [
      escapeCSV(item.id),
      escapeCSV(item.type),
      escapeCSV(item.date),
      escapeCSV(item.customerName || data?.customer?.name || ""),
      escapeCSV(data?.customer?.gstin || ""),
      escapeCSV(data?.customer?.email || ""),
      escapeCSV(data?.customer?.phone || ""),
      escapeCSV(data?.poNumber || ""),
      escapeCSV(item.currency || data?.currency || "INR"),
      subtotal.toFixed(2),
      taxAmount.toFixed(2),
      freight.toFixed(2),
      packaging.toFixed(2),
      discount.toFixed(2),
      roundOff.toFixed(2),
      (item.total || 0).toFixed(2),
      (item.inrTotal || item.total || 0).toFixed(2),
      items.length
    ].join(",");
  });

  const csvContent = [headers.join(","), ...rows].join("\n");
  downloadCSV(csvContent, `${filenamePrefix}_${new Date().toISOString().slice(0, 10)}.csv`);
};

/**
 * Export document history as detailed line-item records CSV.
 * Ideal for inventory tracking, GST/Tax filing (HSN breakdown), and itemized accounting.
 */
export const exportHistoryItemizedToCSV = (
  historyItems: DocumentHistoryItem[],
  filenamePrefix: string = "invoice_history_itemized"
) => {
  if (!historyItems || historyItems.length === 0) return;

  const headers = [
    "Document ID",
    "Document Type",
    "Date",
    "Customer / Party Name",
    "GSTIN / Tax ID",
    "PO Number",
    "Currency",
    "Item #",
    "Description",
    "HSN / SAC",
    "Quantity",
    "Unit",
    "Rate",
    "Line Subtotal",
    "Tax Rate (%)",
    "Tax Amount",
    "Line Total",
    "Heat / Lot No",
    "Size / Grade / Standard"
  ];

  const rows: string[] = [];

  historyItems.forEach(item => {
    const data = item.fullData;
    const items = data?.items || [];
    const currency = item.currency || data?.currency || "INR";
    const custName = item.customerName || data?.customer?.name || "";
    const gstin = data?.customer?.gstin || "";
    const poNum = data?.poNumber || "";

    if (items.length === 0) {
      // Single row if no line items populated
      rows.push([
        escapeCSV(item.id),
        escapeCSV(item.type),
        escapeCSV(item.date),
        escapeCSV(custName),
        escapeCSV(gstin),
        escapeCSV(poNum),
        escapeCSV(currency),
        1,
        escapeCSV("Total Amount Document"),
        escapeCSV(""),
        1,
        escapeCSV("NOS"),
        (item.total || 0).toFixed(2),
        (item.total || 0).toFixed(2),
        "0%",
        "0.00",
        (item.total || 0).toFixed(2),
        escapeCSV(""),
        escapeCSV("")
      ].join(","));
    } else {
      items.forEach((line, idx) => {
        const qty = line.quantity || 0;
        const rate = line.rate || 0;
        const taxPct = line.taxRate || 0;
        const lineSubtotal = qty * rate;
        const lineTax = lineSubtotal * (taxPct / 100);
        const lineTotal = lineSubtotal + lineTax;

        const specDetails = "";

        rows.push([
          escapeCSV(item.id),
          escapeCSV(item.type),
          escapeCSV(item.date),
          escapeCSV(custName),
          escapeCSV(gstin),
          escapeCSV(poNum),
          escapeCSV(currency),
          idx + 1,
          escapeCSV(line.description || ""),
          escapeCSV(line.hsn || ""),
          qty,
          escapeCSV(line.unit || "NOS"),
          rate.toFixed(2),
          lineSubtotal.toFixed(2),
          `${taxPct}%`,
          lineTax.toFixed(2),
          lineTotal.toFixed(2),
          escapeCSV(line.heatNo || ""),
          escapeCSV(specDetails)
        ].join(","));
      });
    }
  });

  const csvContent = [headers.join(","), ...rows].join("\n");
  downloadCSV(csvContent, `${filenamePrefix}_${new Date().toISOString().slice(0, 10)}.csv`);
};

/**
 * Export active document line items to CSV.
 * Opens directly in Microsoft Excel / Google Sheets with UTF-8 BOM encoding.
 */
export const exportCurrentDocumentItemsToCSV = (
  items: any[],
  docDetails: { docId?: string; docType?: string; date?: string; customerName?: string; currency?: string } = {},
  filenamePrefix: string = "line_items"
) => {
  if (!items || items.length === 0) return;

  const headers = [
    "Item #",
    "Description",
    "HSN / SAC",
    "Quantity",
    "Unit",
    "Rate",
    "Currency",
    "Line Subtotal",
    "Tax Rate (%)",
    "Tax Amount",
    "Line Total",
    "Heat / Lot No",
    "Document ID",
    "Document Date",
    "Customer Name"
  ];

  const rows = items.map((line, idx) => {
    const qty = Number(line.quantity) || 0;
    const rate = Number(line.rate) || 0;
    const taxPct = Number(line.taxRate) || 0;
    const lineSubtotal = qty * rate;
    const lineTax = lineSubtotal * (taxPct / 100);
    const lineTotal = lineSubtotal + lineTax;

    return [
      idx + 1,
      escapeCSV(line.description || ""),
      escapeCSV(line.hsn || ""),
      qty,
      escapeCSV(line.unit || "NOS"),
      rate.toFixed(2),
      escapeCSV(docDetails.currency || "INR"),
      lineSubtotal.toFixed(2),
      `${taxPct}%`,
      lineTax.toFixed(2),
      lineTotal.toFixed(2),
      escapeCSV(line.heatNo || ""),
      escapeCSV(docDetails.docId || ""),
      escapeCSV(docDetails.date || ""),
      escapeCSV(docDetails.customerName || "")
    ].join(",");
  });

  const csvContent = [headers.join(","), ...rows].join("\n");
  const cleanId = (docDetails.docId || "doc").replace(/[^a-zA-Z0-9_-]/g, "_");
  downloadCSV(csvContent, `${filenamePrefix}_${cleanId}_${new Date().toISOString().slice(0, 10)}.csv`);
};

/**
 * Helper to initiate browser download of CSV string
 */
const downloadCSV = (csvContent: string, fileName: string) => {
  // \ufeff is UTF-8 Byte Order Mark (BOM) so Microsoft Excel opens special characters correctly
  const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
