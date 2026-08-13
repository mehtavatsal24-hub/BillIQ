import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { DocumentType, LineItem, CustomerDetails, BusinessDetails } from "../types";
import { getCountryConfig, formatMoney, getCurrencySymbol } from "../utils/localization";
import { Calculator, CheckCircle2, FileText, Printer, ShieldAlert, ArrowRight, Tag, X } from "lucide-react";

interface TaxSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmDownload: () => void;
  onPrint?: () => void;
  docType: DocumentType;
  docId: string;
  date: string;
  items: LineItem[];
  customer: CustomerDetails;
  business: BusinessDetails;
  discount?: number;
  discountRate?: number;
  currency?: string;
  country?: string;
  advancePercentage?: number;
  isTaxEnabled?: boolean;
  isIgst?: boolean;
}

export const TaxSummaryModal: React.FC<TaxSummaryModalProps> = ({
  isOpen,
  onClose,
  onConfirmDownload,
  onPrint,
  docType,
  docId,
  date,
  items = [],
  customer,
  business,
  discount = 0,
  currency = "INR",
  country = "India",
  advancePercentage = 0,
  isTaxEnabled,
  isIgst
}) => {
  if (!isOpen) return null;

  const countryConfig = getCountryConfig(country || (business as any).country || "India");
  const currencySymbol = getCurrencySymbol(currency || countryConfig.currencyCode);

  // Subtotal calculation
  const validItems = items.filter(item => !item.isRegret);
  const subtotal = Math.round(validItems.reduce((sum, item) => sum + (item.quantity * item.rate), 0) * 100) / 100;

  // Determine Tax logic
  const isQuotation = docType === DocumentType.QUOTATION;
  const isPackingList = docType === DocumentType.PACKING_LIST;
  const showTax = isTaxEnabled !== undefined ? isTaxEnabled : (!isQuotation && !isPackingList);

  // Tax calculations per HSN / Item
  const bizStateCode = business.gstin?.substring(0, 2);
  const custStateCode = customer.gstin?.substring(0, 2);
  const isValidBizState = bizStateCode && /^\d{2}$/.test(bizStateCode);
  const isValidCustState = custStateCode && /^\d{2}$/.test(custStateCode);
  const isInterState = !!isIgst || !!(isValidBizState && isValidCustState && bizStateCode !== custStateCode);

  // HSN Tax Breakdown Map (for GST)
  const hsnMap: Record<string, { hsn: string; taxable: number; rate: number; taxAmount: number }> = {};
  
  let totalTaxAmount = 0;

  if (showTax && !isPackingList) {
    validItems.forEach(item => {
      const lineVal = item.quantity * item.rate;
      const rate = item.taxRate ?? countryConfig.defaultTaxRate ?? 18;
      const tax = (lineVal * rate) / 100;
      totalTaxAmount += tax;

      const key = `${item.hsn || 'GENERAL'}_${rate}`;
      if (!hsnMap[key]) {
        hsnMap[key] = { hsn: item.hsn || '8424 (General)', taxable: 0, rate, taxAmount: 0 };
      }
      hsnMap[key].taxable += lineVal;
      hsnMap[key].taxAmount += tax;
    });
  }

  totalTaxAmount = Math.round(totalTaxAmount * 100) / 100;
  const grossTotal = Math.round((subtotal + totalTaxAmount - discount) * 100) / 100;
  const grandTotal = Math.max(0, Math.round(grossTotal));
  const roundOff = Math.round((grandTotal - grossTotal) * 100) / 100;
  const advanceAmount = advancePercentage > 0 ? Math.round((grandTotal * advancePercentage / 100) * 100) / 100 : 0;
  const balanceDue = Math.max(0, grandTotal - advanceAmount);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative bg-white rounded-3xl shadow-2xl max-w-2xl w-full border border-zinc-200 overflow-hidden z-10 my-8 flex flex-col max-h-[90vh]"
        >
          {/* Modal Header */}
          <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-zinc-900 flex items-center justify-center text-white">
                <Calculator className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-zinc-900">Tax Breakdown & Verification</h2>
                <p className="text-xs text-zinc-500">Review document totals before final PDF generation</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-6 overflow-y-auto max-h-[75vh]">
        {/* Document Overview Header Banner */}
        <div className="bg-gradient-to-r from-zinc-900 to-slate-800 text-white p-5 rounded-2xl shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-bold uppercase tracking-wider">
                {docType}
              </span>
              <span className="text-zinc-400 text-xs">#{docId || "DRAFT"}</span>
            </div>
            <h3 className="text-xl font-bold mt-1.5 text-white flex items-center gap-2">
              <span>{customer.name || "Customer Not Specified"}</span>
            </h3>
            <p className="text-xs text-zinc-300 mt-0.5">
              {countryConfig.flag} {countryConfig.name} &bull; Currency: <strong className="text-white">{currency} ({currencySymbol})</strong> &bull; Date: {date || "Today"}
            </p>
          </div>

          <div className="text-right bg-white/10 px-4 py-2.5 rounded-xl border border-white/10 backdrop-blur-sm">
            <span className="text-[10px] uppercase font-semibold text-zinc-300 block">Final Document Total</span>
            <span className="text-2xl font-black text-emerald-400 tracking-tight">
              {formatMoney(grandTotal, currency)}
            </span>
          </div>
        </div>

        {/* Tax System Info Banner */}
        <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-xl flex items-start gap-3">
          <Calculator className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-emerald-900 space-y-1">
            <div className="font-bold text-emerald-950 flex items-center gap-2">
              <span>Tax Configuration: {countryConfig.name} ({countryConfig.taxSystem.replace('_', ' ')})</span>
              <span className="text-[10px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded font-mono font-bold">
                {countryConfig.taxLabel}: {customer.gstin || business.gstin || "N/A"}
              </span>
            </div>
            <p className="text-emerald-800/90 leading-relaxed">
              {countryConfig.taxSystem === "GST_INDIA" ? (
                isInterState ? 
                  "Inter-State Sale detected based on GSTIN state codes. IGST will be applied in full." :
                  "Intra-State Sale detected. Tax is evenly split between CGST (50%) and SGST (50%)."
              ) : countryConfig.taxSystem === "SALES_TAX_US" ? (
                "United States Sales Tax rules applied based on buyer state location."
              ) : (
                `Global ${countryConfig.taxSystem.replace('_', ' ')} applied.`
              )}
            </p>
          </div>
        </div>

        {/* HSN & Item Tax Breakdown Table */}
        {showTax && !isPackingList && Object.keys(hsnMap).length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-zinc-700 uppercase tracking-wider flex items-center gap-1.5">
                <Tag className="w-4 h-4 text-zinc-500" />
                Itemized Tax & HSN Summary
              </h4>
              <span className="text-[10px] text-zinc-500 font-medium">
                {Object.keys(hsnMap).length} Tax Group(s)
              </span>
            </div>

            <div className="border border-gray-300 rounded-xl overflow-hidden bg-white text-xs shadow-sm">
              <table 
                className="w-full text-left border-collapse border border-gray-300 table-fixed"
                style={{ borderCollapse: 'collapse', tableLayout: 'fixed' }}
              >
                <thead>
                  <tr className="bg-zinc-100 text-zinc-800 font-bold border-b border-gray-300 uppercase tracking-wider text-[11px]">
                    <th className="p-2.5 border border-gray-300 font-bold">HSN / Category</th>
                    <th className="p-2.5 border border-gray-300 text-right w-32 whitespace-nowrap">Taxable Value</th>
                    {countryConfig.taxSystem === "GST_INDIA" && !isInterState ? (
                      <>
                        <th className="p-2.5 border border-gray-300 text-right w-28 whitespace-nowrap">CGST</th>
                        <th className="p-2.5 border border-gray-300 text-right w-28 whitespace-nowrap">SGST</th>
                      </>
                    ) : (
                      <th className="p-2.5 border border-gray-300 text-right w-32 whitespace-nowrap">
                        {countryConfig.taxSystem === "GST_INDIA" ? "IGST Rate" :
                         countryConfig.taxSystem === "SALES_TAX_US" ? "Sales Tax Rate" :
                         countryConfig.taxSystem === "VAT_GLOBAL" ? "VAT Rate" : "GST Rate"}
                      </th>
                    )}
                    <th className="p-2.5 border border-gray-300 text-right w-36 whitespace-nowrap">Tax Amount</th>
                  </tr>
                </thead>
                <tbody className="text-zinc-800 font-medium">
                  {Object.values(hsnMap).map((row, idx) => {
                    const isLast = idx === Object.values(hsnMap).length - 1;
                    return (
                      <tr key={idx} className={`hover:bg-zinc-50/50 ${isLast ? 'border-b-2 border-gray-300' : ''}`}>
                        <td className="p-2.5 border border-gray-300 font-bold font-mono text-zinc-900 break-words [overflow-wrap:anywhere]">{row.hsn}</td>
                        <td className="p-2.5 border border-gray-300 text-right font-mono whitespace-nowrap">{formatMoney(row.taxable, currency)}</td>
                        {countryConfig.taxSystem === "GST_INDIA" && !isInterState ? (
                          <>
                            <td className="p-2.5 border border-gray-300 text-right text-zinc-600 font-mono whitespace-nowrap">
                              {row.rate / 2}% ({formatMoney(row.taxAmount / 2, currency)})
                            </td>
                            <td className="p-2.5 border border-gray-300 text-right text-zinc-600 font-mono whitespace-nowrap">
                              {row.rate / 2}% ({formatMoney(row.taxAmount / 2, currency)})
                            </td>
                          </>
                        ) : (
                          <td className="p-2.5 border border-gray-300 text-right text-zinc-600 font-mono whitespace-nowrap">
                            {row.rate}%
                          </td>
                        )}
                        <td className="p-2.5 border border-gray-300 text-right font-bold text-zinc-900 font-mono whitespace-nowrap">
                          {formatMoney(row.taxAmount, currency)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Financial Totals Breakdown Grid */}
        <div className="bg-zinc-50 rounded-xl p-4 border border-zinc-200 space-y-2.5 text-xs">
          <div className="flex justify-between items-center text-zinc-600">
            <span>Subtotal ({validItems.length} items):</span>
            <span className="font-bold text-zinc-900 font-mono">{formatMoney(subtotal, currency)}</span>
          </div>

          {showTax && !isPackingList && (
            countryConfig.taxSystem === "GST_INDIA" ? (
              isInterState ? (
                <div className="flex justify-between items-center text-zinc-600">
                  <span>Integrated GST (IGST):</span>
                  <span className="font-bold text-zinc-900 font-mono">{formatMoney(totalTaxAmount, currency)}</span>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center text-zinc-600">
                    <span>Central GST (CGST):</span>
                    <span className="font-bold text-zinc-900 font-mono">{formatMoney(totalTaxAmount / 2, currency)}</span>
                  </div>
                  <div className="flex justify-between items-center text-zinc-600">
                    <span>State GST (SGST):</span>
                    <span className="font-bold text-zinc-900 font-mono">{formatMoney(totalTaxAmount / 2, currency)}</span>
                  </div>
                </>
              )
            ) : (
              <div className="flex justify-between items-center text-zinc-600">
                <span>Tax Amount ({countryConfig.taxSystem.replace('_', ' ')}):</span>
                <span className="font-bold text-zinc-900 font-mono">{formatMoney(totalTaxAmount, currency)}</span>
              </div>
            )
          )}

          {discount > 0 && (
            <div className="flex justify-between items-center text-emerald-700 font-medium">
              <span>Discount Applied:</span>
              <span className="font-bold font-mono">- {formatMoney(discount, currency)}</span>
            </div>
          )}

          <div className="flex justify-between items-center text-zinc-600">
            <span>Round Off:</span>
            <span className="font-bold text-zinc-900 font-mono">
              {roundOff >= 0 ? `+${formatMoney(roundOff, currency)}` : formatMoney(roundOff, currency)}
            </span>
          </div>

          <div className="border-t border-zinc-200 pt-2 flex justify-between items-center text-sm font-black text-zinc-900">
            <span>Grand Total:</span>
            <span className="text-emerald-600 font-mono text-base">{formatMoney(grandTotal, currency)}</span>
          </div>

          {advancePercentage > 0 && (
            <div className="bg-amber-50 p-2.5 rounded-lg border border-amber-200 space-y-1 text-amber-900">
              <div className="flex justify-between items-center font-bold">
                <span>Advance Required ({advancePercentage}%):</span>
                <span className="font-mono">{formatMoney(advanceAmount, currency)}</span>
              </div>
              <div className="flex justify-between items-center text-[11px] text-amber-700">
                <span>Balance Due against Delivery:</span>
                <span className="font-mono font-bold">{formatMoney(balanceDue, currency)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons Footer */}
        <div className="pt-2 border-t border-zinc-100 flex flex-wrap items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-zinc-200 text-xs font-bold text-zinc-700 hover:bg-zinc-50 transition-colors"
          >
            Back to Edit
          </button>

          {onPrint && (
            <button
              type="button"
              onClick={onPrint}
              className="px-4 py-2.5 rounded-xl border border-zinc-200 text-xs font-bold text-zinc-700 hover:bg-zinc-50 transition-colors flex items-center gap-2"
            >
              <Printer className="w-4 h-4 text-zinc-500" />
              <span>Print Preview</span>
            </button>
          )}

          <button
            type="button"
            onClick={onConfirmDownload}
            className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Confirm & Generate PDF</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
