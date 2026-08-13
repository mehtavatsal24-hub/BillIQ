import * as XLSX from "xlsx";
import { SupplierColumn, CostSheetRow } from "../components/LandedCostSheet";
import { InvoiceData } from "../types";

export interface ExportLandedCostSheetOptions {
  docId?: string;
  docDate?: string;
  businessName?: string;
  customerName?: string;
  projectName?: string;
  currencySymbol?: string;
  currency?: string;
  totalQuantity: number;
  totalWeight: number;
  weightUnit?: "kg" | "lbs";
  suppliers: SupplierColumn[];
  rows: CostSheetRow[];
  activeTab?: "standard" | "customize";
}

/**
 * Generates and downloads a multi-supplier Landed Cost Analysis Excel spreadsheet (.xlsx).
 * Preserves multi-supplier side-by-side columns, cost category rows, and live Excel calculated formulas
 * (SUMs, percentages, per-unit calculations, profit markups, discounts, and final selling price formulas).
 */
export function exportLandedCostSheetToExcel(options: ExportLandedCostSheetOptions) {
  const {
    docId = "CS-1001",
    docDate = new Date().toISOString().split("T")[0],
    businessName = "Business",
    customerName = "-",
    projectName = "-",
    currencySymbol = "$",
    currency = "USD",
    totalQuantity = 100,
    totalWeight = 0,
    weightUnit = "kg",
    suppliers = [],
    rows = [],
  } = options;

  const activeRows = rows.filter(r => r.isVisible !== false);
  const numSuppliers = suppliers.length > 0 ? suppliers.length : 1;

  // Currency number formatting pattern for Excel cells
  const numFmt = currencySymbol === "₹" ? "₹#,##0.00" 
    : currencySymbol === "€" ? "€#,##0.00" 
    : currencySymbol === "£" ? "£#,##0.00" 
    : currencySymbol === "A$" || currencySymbol === "C$" || currencySymbol === "S$" ? `${currencySymbol}#,##0.00`
    : "$#,##0.00";

  const ws: XLSX.WorkSheet = {};

  const setCell = (
    cellRef: string,
    v: string | number,
    type: "s" | "n" | "b" = typeof v === "number" ? "n" : "s",
    formula?: string,
    format?: string
  ) => {
    const cell: XLSX.CellObject = { v, t: type };
    if (formula) {
      cell.f = formula;
    }
    if (format) {
      cell.z = format;
    }
    ws[cellRef] = cell;
  };

  // Helper getters for row amounts and type values for a specific supplier
  const getRowAmount = (row: CostSheetRow, supplierId: string): number => {
    if (row.supplierAmounts && row.supplierAmounts[supplierId] !== undefined) {
      return row.supplierAmounts[supplierId];
    }
    return supplierId === suppliers[0]?.id ? (row.amount || 0) : 0;
  };

  const getRowTypeValue = (row: CostSheetRow, supplierId: string): number => {
    if (row.supplierTypeValues && row.supplierTypeValues[supplierId] !== undefined) {
      return row.supplierTypeValues[supplierId];
    }
    return supplierId === suppliers[0]?.id ? (row.typeValue ?? (row.type === "Flat" ? (row.amount || 0) : 0)) : 0;
  };

  // Row 1: Document Main Title
  setCell("A1", "LANDED COST ANALYSIS SHEET", "s");

  // Row 2: Company / Business Name
  setCell("A2", businessName || "Business Name", "s");

  // Row 4: Metadata Row 1
  setCell("A4", "Cost Sheet No.:", "s");
  setCell("B4", docId, "s");
  setCell("C4", "Cost Sheet Date:", "s");
  setCell("D4", docDate, "s");

  // Row 5: Metadata Row 2
  setCell("A5", "Customer Name:", "s");
  setCell("B5", customerName || "-", "s");
  setCell("C5", "Project Name:", "s");
  setCell("D5", projectName || "-", "s");

  // Row 6: Parameters (Quantity & Weight)
  setCell("A6", "Total Quantity:", "s");
  setCell("B6", Math.max(1, totalQuantity || 1), "n", undefined, "#,##0");
  setCell("C6", "Total Weight:", "s");
  setCell("D6", Math.max(0, totalWeight || 0), "n", undefined, "#,##0.00");
  setCell("E6", "Weight Unit:", "s");
  setCell("F6", weightUnit || "kg", "s");
  setCell("G6", "Currency:", "s");
  setCell("H6", currency, "s");

  // Row 8: Cost Comparison Table Header
  setCell("A8", "#", "s");
  setCell("B8", "COST HEAD / CATEGORY", "s");
  setCell("C8", "REMARKS / DETAILS", "s");
  setCell("D8", "CALCULATION BASIS", "s");

  // Determine supplier calculations to flag Lowest Cost
  const supplierCalculations = suppliers.map(sup => {
    const prodCostTotal = activeRows
      .filter((r, idx) => r.categoryKey === "product" || idx === 0)
      .reduce((acc, r) => acc + (r.type === "Per Unit" ? (getRowTypeValue(r, sup.id) * (totalQuantity || 1)) : (r.type === "By Weight" ? (getRowTypeValue(r, sup.id) * (totalWeight || 0)) : getRowAmount(r, sup.id))), 0);

    const computedRows = activeRows.map(r => {
      if (r.type === "%") return (prodCostTotal * getRowTypeValue(r, sup.id)) / 100;
      if (r.type === "Per Unit") return getRowTypeValue(r, sup.id) * (totalQuantity || 1);
      if (r.type === "By Weight") return getRowTypeValue(r, sup.id) * (totalWeight || 0);
      return getRowAmount(r, sup.id);
    });

    const totalLandedCost = computedRows.reduce((a, b) => a + b, 0);
    const profitAmount = sup.profitType === "%" ? (prodCostTotal * (sup.profitValue || 0)) / 100 : (sup.profitValue || 0);
    const discountAmount = sup.discountType === "%" ? (prodCostTotal * (sup.discountValue || 0)) / 100 : (sup.discountValue || 0);
    const finalPrice = Math.max(0, totalLandedCost + profitAmount - discountAmount);

    return { id: sup.id, totalLandedCost, finalPrice };
  });

  const minFinalPrice = Math.min(...supplierCalculations.map(s => s.finalPrice));

  suppliers.forEach((sup, sIdx) => {
    const colLetter = String.fromCharCode(69 + sIdx); // Col E, F, G, H, I
    const isLowest = numSuppliers > 1 && supplierCalculations.find(s => s.id === sup.id)?.finalPrice === minFinalPrice;
    const headerText = `${sup.name}${isLowest ? " (Lowest Cost)" : ""}`;
    setCell(`${colLetter}8`, headerText, "s");
  });

  // Data Rows (Starting at Excel Row 9)
  let currentExcelRow = 9;
  const startCostRow = 9;

  let productRowExcelIndex = 9;

  activeRows.forEach((r, idx) => {
    const rowNum = currentExcelRow;
    if (r.categoryKey === "product" || idx === 0) {
      productRowExcelIndex = rowNum;
    }

    setCell(`A${rowNum}`, idx + 1, "n");
    setCell(`B${rowNum}`, r.costHead, "s");
    setCell(`C${rowNum}`, r.description || "-", "s");

    // Format basis description
    let basisText = "Flat Amount";
    if (r.type === "%") {
      basisText = `% on Base Product Price`;
    } else if (r.type === "Per Unit") {
      basisText = `Per Unit Rate (${totalQuantity} Units)`;
    } else if (r.type === "By Weight") {
      basisText = `By Weight Rate (${totalWeight} ${weightUnit})`;
    }
    setCell(`D${rowNum}`, basisText, "s");

    suppliers.forEach((sup, sIdx) => {
      const colLetter = String.fromCharCode(69 + sIdx);
      const cellRef = `${colLetter}${rowNum}`;
      const prodCostCellRef = `${colLetter}${productRowExcelIndex}`;
      const typeVal = getRowTypeValue(r, sup.id);
      const amt = getRowAmount(r, sup.id);

      if (r.type === "%") {
        const prodCostVal = activeRows
          .filter((p, pIdx) => p.categoryKey === "product" || pIdx === 0)
          .reduce((acc, p) => acc + getRowAmount(p, sup.id), 0) || 0;
        const calculated = Math.round(((prodCostVal * typeVal) / 100) * 100) / 100;
        const formula = `${prodCostCellRef}*${typeVal}/100`;
        setCell(cellRef, calculated, "n", formula, numFmt);
      } else if (r.type === "Per Unit") {
        const calculated = Math.round((typeVal * (totalQuantity || 1)) * 100) / 100;
        const formula = `${typeVal}*$B$6`;
        setCell(cellRef, calculated, "n", formula, numFmt);
      } else if (r.type === "By Weight") {
        const calculated = Math.round((typeVal * (totalWeight || 0)) * 100) / 100;
        const formula = `${typeVal}*$D$6`;
        setCell(cellRef, calculated, "n", formula, numFmt);
      } else {
        setCell(cellRef, amt, "n", undefined, numFmt);
      }
    });

    currentExcelRow++;
  });

  const endCostRow = currentExcelRow - 1;

  // Blank row for rhythm
  currentExcelRow++;

  // --- SUMMARY & FORMULAS SECTION ---
  const prodRowIndices: number[] = [];
  const logisticsRowIndices: number[] = [];

  activeRows.forEach((r, idx) => {
    const excelRow = startCostRow + idx;
    if (r.categoryKey === "product" || idx === 0) {
      prodRowIndices.push(excelRow);
    } else {
      logisticsRowIndices.push(excelRow);
    }
  });

  // 1. Total Product Base Cost Row
  const prodCostTotalRow = currentExcelRow;
  setCell(`B${prodCostTotalRow}`, "Total Product Base Cost", "s");
  setCell(`D${prodCostTotalRow}`, "Base Material / Product Price Sum", "s");

  suppliers.forEach((sup, sIdx) => {
    const colLetter = String.fromCharCode(69 + sIdx);
    const cellRef = `${colLetter}${prodCostTotalRow}`;
    const val = activeRows
      .filter((r, idx) => r.categoryKey === "product" || idx === 0)
      .reduce((acc, r) => acc + (r.type === "Per Unit" ? getRowTypeValue(r, sup.id) * totalQuantity : (r.type === "By Weight" ? getRowTypeValue(r, sup.id) * totalWeight : getRowAmount(r, sup.id))), 0);

    if (prodRowIndices.length === 1) {
      const formula = `${colLetter}${prodRowIndices[0]}`;
      setCell(cellRef, val, "n", formula, numFmt);
    } else if (prodRowIndices.length > 1) {
      const sumExpr = prodRowIndices.map(r => `${colLetter}${r}`).join("+");
      setCell(cellRef, val, "n", sumExpr, numFmt);
    } else {
      setCell(cellRef, 0, "n", undefined, numFmt);
    }
  });

  currentExcelRow++;

  // 2. Total Logistics & Additional Charges Row
  const logisticsTotalRow = currentExcelRow;
  setCell(`B${logisticsTotalRow}`, "Total Logistics & Additional Charges", "s");
  setCell(`D${logisticsTotalRow}`, "Freight, Duties, Packaging & Handling Sum", "s");

  suppliers.forEach((sup, sIdx) => {
    const colLetter = String.fromCharCode(69 + sIdx);
    const cellRef = `${colLetter}${logisticsTotalRow}`;
    if (logisticsRowIndices.length > 0) {
      const minRow = Math.min(...logisticsRowIndices);
      const maxRow = Math.max(...logisticsRowIndices);
      const formula = `SUM(${colLetter}${minRow}:${colLetter}${maxRow})`;

      const prodCostVal = activeRows
        .filter((p, pIdx) => p.categoryKey === "product" || pIdx === 0)
        .reduce((acc, p) => acc + getRowAmount(p, sup.id), 0) || 0;

      const logisticsVal = activeRows
        .filter((r, idx) => !(r.categoryKey === "product" || idx === 0))
        .reduce((acc, r) => {
          if (r.type === "%") return acc + (prodCostVal * getRowTypeValue(r, sup.id)) / 100;
          if (r.type === "Per Unit") return acc + (getRowTypeValue(r, sup.id) * totalQuantity);
          if (r.type === "By Weight") return acc + (getRowTypeValue(r, sup.id) * totalWeight);
          return acc + getRowAmount(r, sup.id);
        }, 0);

      setCell(cellRef, logisticsVal, "n", formula, numFmt);
    } else {
      setCell(cellRef, 0, "n", undefined, numFmt);
    }
  });

  currentExcelRow++;

  // 3. TOTAL LANDED COST Row
  const landedCostRow = currentExcelRow;
  setCell(`B${landedCostRow}`, "TOTAL LANDED COST", "s");
  setCell(`D${landedCostRow}`, "Product Cost + Logistics", "s");

  suppliers.forEach((sup, sIdx) => {
    const colLetter = String.fromCharCode(69 + sIdx);
    const cellRef = `${colLetter}${landedCostRow}`;
    const prodCell = `${colLetter}${prodCostTotalRow}`;
    const logCell = `${colLetter}${logisticsTotalRow}`;
    const formula = `${prodCell}+${logCell}`;

    const prodCostVal = activeRows
      .filter((p, pIdx) => p.categoryKey === "product" || pIdx === 0)
      .reduce((acc, p) => acc + getRowAmount(p, sup.id), 0) || 0;

    const allRowsVal = activeRows.reduce((acc, r) => {
      if (r.type === "%") return acc + (prodCostVal * getRowTypeValue(r, sup.id)) / 100;
      if (r.type === "Per Unit") return acc + (getRowTypeValue(r, sup.id) * totalQuantity);
      if (r.type === "By Weight") return acc + (getRowTypeValue(r, sup.id) * totalWeight);
      return acc + getRowAmount(r, sup.id);
    }, 0);

    setCell(cellRef, allRowsVal, "n", formula, numFmt);
  });

  currentExcelRow++;

  // 4. Landed Cost Per Unit Row
  const landedPerUnitRow = currentExcelRow;
  setCell(`B${landedPerUnitRow}`, "Landed Cost Per Unit", "s");
  setCell(`D${landedPerUnitRow}`, "Total Landed Cost / Total Quantity", "s");

  suppliers.forEach((sup, sIdx) => {
    const colLetter = String.fromCharCode(69 + sIdx);
    const cellRef = `${colLetter}${landedPerUnitRow}`;
    const landedCell = `${colLetter}${landedCostRow}`;
    const formula = `${landedCell}/$B$6`;

    const prodCostVal = activeRows
      .filter((p, pIdx) => p.categoryKey === "product" || pIdx === 0)
      .reduce((acc, p) => acc + getRowAmount(p, sup.id), 0) || 0;

    const allRowsVal = activeRows.reduce((acc, r) => {
      if (r.type === "%") return acc + (prodCostVal * getRowTypeValue(r, sup.id)) / 100;
      if (r.type === "Per Unit") return acc + (getRowTypeValue(r, sup.id) * totalQuantity);
      if (r.type === "By Weight") return acc + (getRowTypeValue(r, sup.id) * totalWeight);
      return acc + getRowAmount(r, sup.id);
    }, 0);

    const perUnitVal = allRowsVal / (totalQuantity || 1);
    setCell(cellRef, perUnitVal, "n", formula, numFmt);
  });

  currentExcelRow++;

  // 5. Target Profit / Margin Row
  const profitRow = currentExcelRow;
  setCell(`B${profitRow}`, "Target Profit / Margin (+)", "s");

  suppliers.forEach((sup, sIdx) => {
    const colLetter = String.fromCharCode(69 + sIdx);
    const cellRef = `${colLetter}${profitRow}`;
    const prodCell = `${colLetter}${prodCostTotalRow}`;

    let formula = "";
    const prodCostVal = activeRows
      .filter((p, pIdx) => p.categoryKey === "product" || pIdx === 0)
      .reduce((acc, p) => acc + getRowAmount(p, sup.id), 0) || 0;
    let profitVal = 0;

    if (sup.profitType === "%") {
      const pct = sup.profitValue || 0;
      formula = `${prodCell}*${pct}/100`;
      profitVal = (prodCostVal * pct) / 100;
    } else {
      profitVal = sup.profitValue || 0;
    }

    setCell(`D${profitRow}`, `Profit Markup (${sup.profitType === "%" ? sup.profitValue + "% on Base Cost" : currencySymbol + sup.profitValue + " Flat"})`, "s");
    setCell(cellRef, profitVal, "n", formula || undefined, numFmt);
  });

  currentExcelRow++;

  // 6. Subtotal Quote Price Row
  const subtotalRow = currentExcelRow;
  setCell(`B${subtotalRow}`, "Subtotal Quoted Price", "s");
  setCell(`D${subtotalRow}`, "Landed Cost + Profit", "s");

  suppliers.forEach((sup, sIdx) => {
    const colLetter = String.fromCharCode(69 + sIdx);
    const cellRef = `${colLetter}${subtotalRow}`;
    const landedCell = `${colLetter}${landedCostRow}`;
    const profitCell = `${colLetter}${profitRow}`;
    const formula = `${landedCell}+${profitCell}`;

    const prodCostVal = activeRows
      .filter((p, pIdx) => p.categoryKey === "product" || pIdx === 0)
      .reduce((acc, p) => acc + getRowAmount(p, sup.id), 0) || 0;

    const landedVal = activeRows.reduce((acc, r) => {
      if (r.type === "%") return acc + (prodCostVal * getRowTypeValue(r, sup.id)) / 100;
      if (r.type === "Per Unit") return acc + (getRowTypeValue(r, sup.id) * totalQuantity);
      if (r.type === "By Weight") return acc + (getRowTypeValue(r, sup.id) * totalWeight);
      return acc + getRowAmount(r, sup.id);
    }, 0);

    const profitVal = sup.profitType === "%" ? (prodCostVal * (sup.profitValue || 0)) / 100 : (sup.profitValue || 0);

    setCell(cellRef, landedVal + profitVal, "n", formula, numFmt);
  });

  currentExcelRow++;

  // 7. Discount (-) Row
  const discountRow = currentExcelRow;
  setCell(`B${discountRow}`, "Discount (-)", "s");

  suppliers.forEach((sup, sIdx) => {
    const colLetter = String.fromCharCode(69 + sIdx);
    const cellRef = `${colLetter}${discountRow}`;
    const prodCell = `${colLetter}${prodCostTotalRow}`;

    let formula = "";
    const prodCostVal = activeRows
      .filter((p, pIdx) => p.categoryKey === "product" || pIdx === 0)
      .reduce((acc, p) => acc + getRowAmount(p, sup.id), 0) || 0;
    let discVal = 0;

    if (sup.discountType === "%") {
      const pct = sup.discountValue || 0;
      formula = `${prodCell}*${pct}/100`;
      discVal = (prodCostVal * pct) / 100;
    } else {
      discVal = sup.discountValue || 0;
    }

    setCell(`D${discountRow}`, `Trade Rebate (${sup.discountType === "%" ? sup.discountValue + "%" : currencySymbol + sup.discountValue})`, "s");
    setCell(cellRef, discVal, "n", formula || undefined, numFmt);
  });

  currentExcelRow++;

  // 8. FINAL QUOTED SELLING PRICE Row
  const finalPriceRow = currentExcelRow;
  setCell(`B${finalPriceRow}`, "FINAL QUOTED SELLING PRICE", "s");
  setCell(`D${finalPriceRow}`, "Subtotal - Discount", "s");

  suppliers.forEach((sup, sIdx) => {
    const colLetter = String.fromCharCode(69 + sIdx);
    const cellRef = `${colLetter}${finalPriceRow}`;
    const subtotalCell = `${colLetter}${subtotalRow}`;
    const discountCell = `${colLetter}${discountRow}`;
    const formula = `MAX(0,${subtotalCell}-${discountCell})`;

    const prodCostVal = activeRows
      .filter((p, pIdx) => p.categoryKey === "product" || pIdx === 0)
      .reduce((acc, p) => acc + getRowAmount(p, sup.id), 0) || 0;

    const landedVal = activeRows.reduce((acc, r) => {
      if (r.type === "%") return acc + (prodCostVal * getRowTypeValue(r, sup.id)) / 100;
      if (r.type === "Per Unit") return acc + (getRowTypeValue(r, sup.id) * totalQuantity);
      if (r.type === "By Weight") return acc + (getRowTypeValue(r, sup.id) * totalWeight);
      return acc + getRowAmount(r, sup.id);
    }, 0);

    const profitVal = sup.profitType === "%" ? (prodCostVal * (sup.profitValue || 0)) / 100 : (sup.profitValue || 0);
    const discVal = sup.discountType === "%" ? (prodCostVal * (sup.discountValue || 0)) / 100 : (sup.discountValue || 0);
    const finalVal = Math.max(0, landedVal + profitVal - discVal);

    setCell(cellRef, finalVal, "n", formula, numFmt);
  });

  currentExcelRow++;

  // 9. Selling Price Per Unit Row
  const finalPerUnitRow = currentExcelRow;
  setCell(`B${finalPerUnitRow}`, "Final Quoted Selling Price Per Unit", "s");
  setCell(`D${finalPerUnitRow}`, "Final Quoted Selling Price / Total Quantity", "s");

  suppliers.forEach((sup, sIdx) => {
    const colLetter = String.fromCharCode(69 + sIdx);
    const cellRef = `${colLetter}${finalPerUnitRow}`;
    const finalCell = `${colLetter}${finalPriceRow}`;
    const formula = `${finalCell}/$B$6`;

    const prodCostVal = activeRows
      .filter((p, pIdx) => p.categoryKey === "product" || pIdx === 0)
      .reduce((acc, p) => acc + getRowAmount(p, sup.id), 0) || 0;

    const landedVal = activeRows.reduce((acc, r) => {
      if (r.type === "%") return acc + (prodCostVal * getRowTypeValue(r, sup.id)) / 100;
      if (r.type === "Per Unit") return acc + (getRowTypeValue(r, sup.id) * totalQuantity);
      if (r.type === "By Weight") return acc + (getRowTypeValue(r, sup.id) * totalWeight);
      return acc + getRowAmount(r, sup.id);
    }, 0);

    const profitVal = sup.profitType === "%" ? (prodCostVal * (sup.profitValue || 0)) / 100 : (sup.profitValue || 0);
    const discVal = sup.discountType === "%" ? (prodCostVal * (sup.discountValue || 0)) / 100 : (sup.discountValue || 0);
    const finalVal = Math.max(0, landedVal + profitVal - discVal);
    const finalPerUnit = finalVal / (totalQuantity || 1);

    setCell(cellRef, finalPerUnit, "n", formula, numFmt);
  });

  // Calculate grid range boundaries
  const maxColIdx = 3 + numSuppliers; // 0=A, 1=B, 2=C, 3=D, 4=E...
  ws["!ref"] = XLSX.utils.encode_range({
    s: { r: 0, c: 0 },
    e: { r: currentExcelRow - 1, c: maxColIdx }
  });

  // Auto column widths
  const colWidths = [
    { wch: 6 },   // A: #
    { wch: 38 },  // B: Cost Head / Category
    { wch: 36 },  // C: Remarks
    { wch: 32 },  // D: Basis
  ];
  for (let i = 0; i < numSuppliers; i++) {
    colWidths.push({ wch: 26 });
  }
  ws["!cols"] = colWidths;

  // Create workbook & write to file download
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Landed Cost Sheet");

  const cleanDocId = docId.replace(/[^a-zA-Z0-9_-]/g, "_");
  const fileName = `Landed_Cost_Sheet_${cleanDocId}_${docDate}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

/**
 * Utility to export an InvoiceData object of type COST_SHEET to Excel.
 */
export function exportInvoiceDataToLandedCostExcel(data: InvoiceData) {
  const suppliers: SupplierColumn[] = (data.costSheetSuppliers && data.costSheetSuppliers.length > 0)
    ? data.costSheetSuppliers.map(s => ({
        id: s.id,
        name: s.name,
        profitType: s.profitType || "%",
        profitValue: s.profitValue || 0,
        discountType: s.discountType || "Flat",
        discountValue: s.discountValue || 0,
      }))
    : [{
        id: "sup-1",
        name: "Primary Supplier",
        profitType: data.costSheetProfitType || "%",
        profitValue: data.costSheetProfitValue || 0,
        discountType: data.costSheetDiscountType || "Flat",
        discountValue: data.costSheetDiscountValue || 0,
      }];

  const rows: CostSheetRow[] = (data.costSheetRowsSummary && data.costSheetRowsSummary.length > 0)
    ? data.costSheetRowsSummary.map((r, idx) => ({
        id: r.id || `row-${idx}`,
        categoryKey: idx === 0 ? "product" : `cat-${idx}`,
        costHead: r.costHead || r.head || `Cost Head ${idx + 1}`,
        description: r.description || r.remarks || "",
        placeholder: "",
        type: (r.type || r.costType || "Flat") as "Flat" | "%" | "Per Unit" | "By Weight",
        typeValue: r.typeValue,
        amount: r.supplierAmounts ? (r.supplierAmounts[suppliers[0]?.id] || 0) : 0,
        supplierAmounts: r.supplierAmounts || r.amountsBySupplier || {},
        supplierTypeValues: r.supplierTypeValues || {},
        isVisible: true,
      }))
    : (data.items || []).map((item, idx) => {
        const itemAmt = (item.estimatedUnitCost || item.rate || 0) * (item.quantity || 1);
        return {
          id: item.id || `row-${idx}`,
          categoryKey: idx === 0 ? "product" : `cat-${idx}`,
          costHead: item.costHead || item.description || `Item ${idx + 1}`,
          description: item.remarks || "",
          placeholder: "",
          type: "Flat" as const,
          amount: itemAmt,
          supplierAmounts: { [suppliers[0].id]: itemAmt },
          supplierTypeValues: { [suppliers[0].id]: itemAmt },
          isVisible: true,
        };
      });

  exportLandedCostSheetToExcel({
    docId: data.id,
    docDate: data.date,
    businessName: data.business?.name,
    customerName: data.customer?.name,
    projectName: data.projectName,
    currencySymbol: data.currency ? (data.currency === "INR" ? "₹" : data.currency === "EUR" ? "€" : data.currency === "GBP" ? "£" : "$") : "$",
    currency: data.currency || "USD",
    totalQuantity: data.costSheetTotalQuantity || (data.items || []).reduce((acc, i) => acc + (i.quantity || 0), 0) || 100,
    totalWeight: data.costSheetTotalWeight || (data.items || []).reduce((acc, i) => acc + (i.grossWeight || i.netWeight || 0), 0) || 0,
    weightUnit: data.costSheetWeightUnit || "kg",
    suppliers,
    rows,
  });
}
