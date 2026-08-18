import React, { useState } from "react";
import { 
  Search, 
  FileText, 
  ExternalLink, 
  Trash2, 
  Calendar, 
  User, 
  ChevronLeft,
  Filter,
  Download,
  Edit2,
  FileSpreadsheet,
  Table
} from "lucide-react";
import { Card, CardHeader, CardContent } from "./Card";
import { Button } from "./Button";
import { DocumentHistoryItem, DocumentType } from "../types";
import { CURRENCY_SYMBOLS } from "../constants";
import { getCurrencySymbol, getCountryConfig, formatCurrencyAmount } from "../utils/localization";
import { exportHistorySummaryToCSV, exportHistoryItemizedToCSV } from "../utils/csvExport";
import { exportInvoiceDataToLandedCostExcel } from "../services/excelService";

interface HistoryListProps {
  history: DocumentHistoryItem[];
  onOpenDocument: (doc: DocumentHistoryItem) => void;
  onDownloadPDF: (doc: DocumentHistoryItem) => void;
  onDeleteDocument: (timestamp: number) => void;
  onUpdatePaymentStatus?: (timestamp: number, status: "pending" | "paid" | "overdue" | "due_soon") => void;
  onBack: () => void;
}

const getDocTypeStyle = (type: string) => {
  switch (type) {
    case DocumentType.TAX_INVOICE:
    case "Tax Invoice":
      return "bg-emerald-50 text-emerald-600";
    case DocumentType.PACKING_LIST:
    case "Packing List":
      return "bg-blue-50 text-blue-600";
    case DocumentType.DELIVERY_CHALLAN:
    case "Delivery Challan":
      return "bg-purple-50 text-purple-600";
    case DocumentType.QUOTATION:
    case "Quotation":
      return "bg-cyan-50 text-cyan-600";
    case DocumentType.PURCHASE_ORDER:
    case "Purchase Order":
      return "bg-orange-50 text-orange-600";
    case DocumentType.PROFORMA_INVOICE:
    case "Proforma Invoice":
      return "bg-indigo-50 text-indigo-600";
    case DocumentType.COST_SHEET:
    case "Cost Sheet":
      return "bg-amber-50 text-amber-600";
    default:
      return "bg-zinc-50 text-zinc-600";
  }
};

export const HistoryList = ({ history, onOpenDocument, onDownloadPDF, onDeleteDocument, onUpdatePaymentStatus, onBack }: HistoryListProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("All");

  const filteredHistory = history
    .filter(doc => {
      const term = (searchTerm || "").toLowerCase();
      const docId = (doc.id || "").toLowerCase();
      const custName = (doc.customerName || "").toLowerCase();
      const matchesSearch = docId.includes(term) || custName.includes(term);
      const matchesType = filterType === "All" || doc.type === filterType;
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      const tA = typeof a.timestamp === "number" ? a.timestamp : (a.timestamp ? new Date(a.timestamp).getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0));
      const tB = typeof b.timestamp === "number" ? b.timestamp : (b.timestamp ? new Date(b.timestamp).getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0));
      return tB - tA;
    });

  const documentTypes = ["All", ...Object.values(DocumentType)];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-zinc-900">Document History</h2>
            <p className="text-sm text-zinc-500">View and manage all your created documents</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={filteredHistory.length === 0}
            onClick={() => exportHistorySummaryToCSV(filteredHistory)}
            className="flex items-center gap-2 font-semibold text-zinc-700 hover:text-zinc-900 border-zinc-200 bg-white hover:bg-zinc-50"
            title="Export high-level invoice summary CSV"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            <span>Export CSV (Summary)</span>
            {filteredHistory.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-emerald-100 text-emerald-800 font-bold rounded-full">
                {filteredHistory.length}
              </span>
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            disabled={filteredHistory.length === 0}
            onClick={() => exportHistoryItemizedToCSV(filteredHistory)}
            className="flex items-center gap-2 font-semibold text-zinc-700 hover:text-zinc-900 border-zinc-200 bg-white hover:bg-zinc-50"
            title="Export detailed line-item level CSV with HSN & item details"
          >
            <Table className="h-4 w-4 text-blue-600" />
            <span>Export CSV (Itemized)</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search by ID or customer name..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-900 transition-all"
            value={searchTerm ?? ""}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <select
            className="w-full pl-10 pr-4 py-2 bg-white border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-900 transition-all appearance-none"
            value={filterType ?? "All"}
            onChange={(e) => setFilterType(e.target.value)}
          >
            {documentTypes.map((type, idx) => (
              <option key={`${type}-${idx}`} value={type}>{type}</option>
            ))}
          </select>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50/50">
                  <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-wider w-12">#</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Document</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-wider whitespace-nowrap min-w-[120px]">Date</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-wider text-right">Amount</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {filteredHistory.length > 0 ? (
                  filteredHistory.map((doc, idx) => (
                    <tr 
                      key={`${doc.id || 'doc'}-${doc.timestamp || ''}-${idx}`} 
                      className="hover:bg-zinc-50 transition-colors group cursor-pointer"
                      onClick={() => onDownloadPDF(doc)}
                      title="Click to view PDF"
                    >
                      <td className="px-6 py-4">
                        <span className="text-xs font-bold text-zinc-400">{idx + 1}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded flex items-center justify-center shrink-0 ${getDocTypeStyle(doc.type)}`}>
                            <FileText className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex flex-row items-center gap-2 flex-wrap">
                              <p className="text-sm font-bold text-zinc-900">{doc.id}</p>
                              {doc.editCount !== undefined && doc.editCount > 0 && (
                                <span 
                                  className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 whitespace-nowrap inline-flex items-center shrink-0"
                                  title={`Edited ${doc.editCount} time(s)`}
                                >
                                  {doc.editCount} {doc.editCount === 1 ? 'Edit' : 'Edits'}
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-zinc-500 uppercase font-semibold mt-1">{doc.type}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <User className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                            <p className="text-sm font-semibold text-zinc-800">{doc.customerName}</p>
                          </div>
                          {(doc.customerCountry || doc.fullData?.customer?.country) && (
                            <div className="inline-flex items-center gap-1 text-[11px] text-zinc-600 font-semibold bg-zinc-100 px-2 py-0.5 rounded-md border border-zinc-200/60">
                              <span>{getCountryConfig(doc.customerCountry || doc.fullData?.customer?.country || "India").flag}</span>
                              <span>{doc.customerCountry || doc.fullData?.customer?.country}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 align-middle whitespace-nowrap min-w-[120px]">
                        <div className="flex items-center gap-2 whitespace-nowrap">
                          <Calendar className="h-3 w-3 text-zinc-400 shrink-0" />
                          <p className="text-sm text-zinc-500 whitespace-nowrap">{doc.date}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className="text-sm font-bold text-zinc-900">
                          {formatCurrencyAmount(doc.total, doc.currency || 'INR')}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {onUpdatePaymentStatus && (
                            <select
                              value={doc.paymentStatus || "pending"}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => {
                                e.stopPropagation();
                                onUpdatePaymentStatus(
                                  doc.timestamp, 
                                  e.target.value as "pending" | "paid" | "overdue" | "due_soon"
                                );
                              }}
                              className={`px-2.5 py-1 text-xs font-bold rounded-lg border focus:outline-none transition-all cursor-pointer ${
                                (doc.paymentStatus === "paid")
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                                  : (doc.paymentStatus === "overdue")
                                  ? "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                                  : (doc.paymentStatus === "due_soon")
                                  ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                                  : "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                              }`}
                              title="Update Payment Status"
                            >
                              <option value="pending" className="bg-white text-zinc-800 font-semibold">Pending</option>
                              <option value="due_soon" className="bg-white text-amber-700 font-semibold">Due Soon</option>
                              <option value="overdue" className="bg-white text-rose-700 font-semibold">Overdue</option>
                              <option value="paid" className="bg-white text-emerald-700 font-semibold">Paid / Settled</option>
                            </select>
                          )}
                          {(doc.type === DocumentType.COST_SHEET || (doc.type as string) === "Cost Sheet") && doc.fullData && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                exportInvoiceDataToLandedCostExcel(doc.fullData);
                              }}
                              className="p-2 hover:bg-emerald-50 rounded-lg text-emerald-600 hover:text-emerald-700 transition-colors"
                              title="Export Landed Cost Sheet to Excel (.xlsx)"
                            >
                              <FileSpreadsheet className="h-4 w-4" />
                            </button>
                          )}
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              onDownloadPDF(doc);
                            }}
                            className="p-2 hover:bg-zinc-200 rounded-lg text-zinc-400 hover:text-zinc-900 transition-colors"
                            title="View PDF"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenDocument(doc);
                            }}
                            className="p-2 hover:bg-indigo-50 rounded-lg text-zinc-400 hover:text-indigo-600 transition-colors"
                            title="Edit / Revise"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteDocument(doc.timestamp);
                            }}
                            className="p-2 hover:bg-red-50 rounded-lg text-zinc-400 hover:text-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-2 text-zinc-400">
                        <FileText className="h-8 w-8 opacity-20" />
                        <p className="text-sm font-medium">No documents found matching your search</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
