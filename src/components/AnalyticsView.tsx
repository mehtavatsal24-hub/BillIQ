import React, { useState, useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Filter,
  Download,
  FileSpreadsheet,
  ArrowUpRight,
  ArrowDownRight,
  PieChart as PieChartIcon,
  BarChart3,
  Users,
  RefreshCw,
  Search,
  ChevronRight,
  Sparkles,
  Layers,
  Percent,
  Plus
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from "recharts";
import { DocumentHistoryItem, DocumentType, SavedCustomer } from "../types";
import { Card, CardHeader, CardTitle, CardContent } from "./Card";
import { Button } from "./Button";
import { getCurrencySymbol, formatCurrencyAmount, convertInrToCurrency } from "../utils/localization";
import { parseDateString, calculateDueDate, getDaysUntilDue } from "../utils/dateUtils";
import { exportHistorySummaryToCSV, exportHistoryItemizedToCSV } from "../utils/csvExport";
import { motion } from "motion/react";

interface AnalyticsViewProps {
  history: DocumentHistoryItem[];
  customers: SavedCustomer[];
  currency: string;
  onOpenDocument: (doc: DocumentHistoryItem) => void;
  onNavigate: (step: string) => void;
  onNewBill: () => void;
}

type DateRangeFilter = "7d" | "30d" | "90d" | "1y" | "all" | "custom";

const CHART_COLORS = [
  "#2563eb", // blue-600
  "#10b981", // emerald-500
  "#8b5cf6", // purple-500
  "#f59e0b", // amber-500
  "#ec4899", // pink-500
  "#06b6d4", // cyan-500
  "#64748b", // slate-500
];

const STATUS_COLORS: Record<string, string> = {
  Paid: "#10b981", // emerald
  Pending: "#f59e0b", // amber
  Overdue: "#ef4444", // red
  Approaching: "#3b82f6", // blue
  Draft: "#94a3b8" // slate
};

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  history,
  customers,
  currency,
  onOpenDocument,
  onNavigate,
  onNewBill
}) => {
  const rawCurrency = (currency || "INR").trim().toUpperCase();
  const activeCurrency = !rawCurrency || rawCurrency === "AOA" || rawCurrency === "AO" || rawCurrency === "KZ" || rawCurrency === "KZ." || rawCurrency === "ANGOLA" ? "INR" : rawCurrency;
  const rawSymbol = getCurrencySymbol(activeCurrency);
  const currencySymbol = !rawSymbol || rawSymbol === "Kz" || activeCurrency === "INR" ? "₹" : rawSymbol;

  // Filters State
  const [dateRange, setDateRange] = useState<DateRangeFilter>("30d");
  const [customStart, setCustomStart] = useState<string>("");
  const [customEnd, setCustomEnd] = useState<string>("");
  const [selectedDocType, setSelectedDocType] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [chartViewMode, setChartViewMode] = useState<"revenue" | "count">("revenue");

  // Helper to normalize document amount in active currency
  const getDocAmountInActiveCurrency = (doc: DocumentHistoryItem): number => {
    let docCurrency = (doc.currency || "INR").trim().toUpperCase();
    if (docCurrency === "AOA" || docCurrency === "AO" || docCurrency === "KZ" || docCurrency === "KZ." || docCurrency === "ANGOLA") {
      docCurrency = "INR";
    }
    if (docCurrency === activeCurrency) {
      return Number(doc.total || doc.totalAmount || 0);
    }
    const inrValue = doc.inrTotal || (docCurrency === "INR" ? Number(doc.total || doc.totalAmount || 0) : 0);
    if (inrValue) {
      return convertInrToCurrency(inrValue, activeCurrency);
    }
    return Number(doc.total || doc.totalAmount || 0);
  };

  // Helper to parse date timestamps safely
  const getDocDate = (doc: DocumentHistoryItem): Date => {
    if (doc.date) {
      const parsed = parseDateString(doc.date, doc.timestamp);
      if (!isNaN(parsed.getTime())) return parsed;
    }
    if (doc.timestamp) {
      const parsed = new Date(doc.timestamp);
      if (!isNaN(parsed.getTime())) return parsed;
    }
    if (doc.createdAt) {
      const parsed = new Date(doc.createdAt);
      if (!isNaN(parsed.getTime())) return parsed;
    }
    return new Date();
  };

  // Determine Date Range Boundaries
  const dateBoundaries = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    let start = new Date(today);
    let previousStart = new Date(today);
    let previousEnd = new Date(today);

    switch (dateRange) {
      case "7d":
        start.setDate(today.getDate() - 7);
        start.setHours(0, 0, 0, 0);
        previousEnd = new Date(start);
        previousEnd.setMilliseconds(-1);
        previousStart = new Date(start);
        previousStart.setDate(start.getDate() - 7);
        break;
      case "30d":
        start.setDate(today.getDate() - 30);
        start.setHours(0, 0, 0, 0);
        previousEnd = new Date(start);
        previousEnd.setMilliseconds(-1);
        previousStart = new Date(start);
        previousStart.setDate(start.getDate() - 30);
        break;
      case "90d":
        start.setDate(today.getDate() - 90);
        start.setHours(0, 0, 0, 0);
        previousEnd = new Date(start);
        previousEnd.setMilliseconds(-1);
        previousStart = new Date(start);
        previousStart.setDate(start.getDate() - 90);
        break;
      case "1y":
        start.setFullYear(today.getFullYear() - 1);
        start.setHours(0, 0, 0, 0);
        previousEnd = new Date(start);
        previousEnd.setMilliseconds(-1);
        previousStart = new Date(start);
        previousStart.setFullYear(start.getFullYear() - 1);
        break;
      case "custom":
        if (customStart) {
          start = new Date(customStart);
          start.setHours(0, 0, 0, 0);
        } else {
          start = new Date(0);
        }
        if (customEnd) {
          const end = new Date(customEnd);
          end.setHours(23, 59, 59, 999);
          today.setTime(end.getTime());
        }
        previousStart = new Date(0);
        previousEnd = new Date(0);
        break;
      case "all":
      default:
        start = new Date(0); // Epoch
        previousStart = new Date(0);
        previousEnd = new Date(0);
        break;
    }

    return { start, end: today, previousStart, previousEnd };
  }, [dateRange, customStart, customEnd]);

  // Filtered Documents based on active selection
  const filteredHistory = useMemo(() => {
    return history.filter((doc) => {
      const docDate = getDocDate(doc);
      if (docDate < dateBoundaries.start || docDate > dateBoundaries.end) {
        return false;
      }
      if (selectedDocType !== "ALL" && doc.type !== selectedDocType) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const customer = (doc.customerName || doc.partyName || "").toLowerCase();
        const docId = (doc.id || doc.documentNumber || "").toLowerCase();
        if (!customer.includes(q) && !docId.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [history, dateBoundaries, selectedDocType, searchQuery]);

  // Previous Period Documents for comparison
  const previousPeriodHistory = useMemo(() => {
    if (dateRange === "all" || dateRange === "custom") return [];
    return history.filter((doc) => {
      const docDate = getDocDate(doc);
      return docDate >= dateBoundaries.previousStart && docDate <= dateBoundaries.previousEnd;
    });
  }, [history, dateBoundaries, dateRange]);

  // Compute Core Financial & Operational KPIs
  const kpis = useMemo(() => {
    let totalRevenue = 0;
    let invoiceCount = 0;
    let quotationCount = 0;
    let challanCount = 0;
    let poCount = 0;
    let costSheetCount = 0;
    let otherCount = 0;

    let paidRevenue = 0;
    let paidCount = 0;
    let pendingRevenue = 0;
    let pendingCount = 0;
    let overdueRevenue = 0;
    let overdueCount = 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    filteredHistory.forEach((doc) => {
      const amt = getDocAmountInActiveCurrency(doc);
      const isInvoice = doc.type === DocumentType.TAX_INVOICE || doc.type === "Tax Invoice" || doc.type === "Invoice";

      if (isInvoice) {
        totalRevenue += amt;
        invoiceCount++;

        // Payment status evaluation
        if (doc.paymentStatus === "paid" || doc.status?.toLowerCase() === "paid") {
          paidRevenue += amt;
          paidCount++;
        } else {
          // Check if overdue
          let isOverdue = false;
          if (doc.dueDate) {
            const dueDate = new Date(doc.dueDate);
            if (!isNaN(dueDate.getTime()) && dueDate < today) {
              isOverdue = true;
            }
          }
          if (isOverdue || doc.paymentStatus === "overdue") {
            overdueRevenue += amt;
            overdueCount++;
          } else {
            pendingRevenue += amt;
            pendingCount++;
          }
        }
      } else if (doc.type === DocumentType.QUOTATION || doc.type === "Quotation") {
        quotationCount++;
      } else if (doc.type === DocumentType.DELIVERY_CHALLAN || doc.type === "Delivery Challan") {
        challanCount++;
      } else if (doc.type === DocumentType.PURCHASE_ORDER || doc.type === "Purchase Order") {
        poCount++;
      } else if (doc.type === DocumentType.COST_SHEET || doc.type === "Cost Sheet") {
        costSheetCount++;
      } else {
        otherCount++;
      }
    });

    // Previous Period Sales for Growth calculation
    const prevSales = previousPeriodHistory
      .filter((d) => d.type === DocumentType.TAX_INVOICE || d.type === "Tax Invoice")
      .reduce((sum, d) => sum + getDocAmountInActiveCurrency(d), 0);

    const revenueGrowthPct = prevSales > 0 ? ((totalRevenue - prevSales) / prevSales) * 100 : null;
    const avgInvoiceValue = invoiceCount > 0 ? totalRevenue / invoiceCount : 0;
    const collectionRate = totalRevenue > 0 ? (paidRevenue / totalRevenue) * 100 : 0;

    return {
      totalRevenue,
      totalDocuments: filteredHistory.length,
      invoiceCount,
      quotationCount,
      challanCount,
      poCount,
      costSheetCount,
      otherCount,
      avgInvoiceValue,
      paidRevenue,
      paidCount,
      pendingRevenue,
      pendingCount,
      overdueRevenue,
      overdueCount,
      collectionRate,
      prevSales,
      revenueGrowthPct
    };
  }, [filteredHistory, previousPeriodHistory, activeCurrency]);

  // Time-Series Trend Data for Recharts
  const timeSeriesData = useMemo(() => {
    if (filteredHistory.length === 0) return [];

    // Grouping strategy based on range
    const isDaily = dateRange === "7d" || dateRange === "30d";
    const groupedMap = new Map<string, { label: string; dateSort: number; revenue: number; invoices: number; quotations: number; totalDocs: number }>();

    filteredHistory.forEach((doc) => {
      const docDate = getDocDate(doc);
      const amt = getDocAmountInActiveCurrency(doc);
      const isInvoice = doc.type === DocumentType.TAX_INVOICE || doc.type === "Tax Invoice";
      const isQuote = doc.type === DocumentType.QUOTATION || doc.type === "Quotation";

      let key = "";
      let label = "";
      let dateSort = 0;

      if (isDaily) {
        key = docDate.toISOString().slice(0, 10);
        label = docDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        dateSort = new Date(docDate.getFullYear(), docDate.getMonth(), docDate.getDate()).getTime();
      } else {
        // Month grouping (e.g. "Jan 2026")
        key = `${docDate.getFullYear()}-${String(docDate.getMonth() + 1).padStart(2, "0")}`;
        label = docDate.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
        dateSort = new Date(docDate.getFullYear(), docDate.getMonth(), 1).getTime();
      }

      if (!groupedMap.has(key)) {
        groupedMap.set(key, { label, dateSort, revenue: 0, invoices: 0, quotations: 0, totalDocs: 0 });
      }

      const entry = groupedMap.get(key)!;
      entry.totalDocs += 1;
      if (isInvoice) {
        entry.revenue += amt;
        entry.invoices += 1;
      } else if (isQuote) {
        entry.quotations += 1;
      }
    });

    return Array.from(groupedMap.values()).sort((a, b) => a.dateSort - b.dateSort);
  }, [filteredHistory, dateRange, activeCurrency]);

  // Top 5 Clients by Revenue Volume
  const topClientsData = useMemo(() => {
    const clientMap = new Map<string, { name: string; revenue: number; docCount: number; invoices: number }>();

    filteredHistory.forEach((doc) => {
      const rawName = (doc.customerName || doc.partyName || doc.fullData?.customer?.name || "Unnamed Client").trim();
      const name = rawName.length > 22 ? rawName.slice(0, 22) + "…" : rawName;
      const amt = getDocAmountInActiveCurrency(doc);
      const isInvoice = doc.type === DocumentType.TAX_INVOICE || doc.type === "Tax Invoice";

      if (!clientMap.has(name)) {
        clientMap.set(name, { name, revenue: 0, docCount: 0, invoices: 0 });
      }

      const client = clientMap.get(name)!;
      client.docCount += 1;
      if (isInvoice) {
        client.revenue += amt;
        client.invoices += 1;
      }
    });

    const sorted = Array.from(clientMap.values())
      .filter((c) => c.revenue > 0)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    return sorted;
  }, [filteredHistory, activeCurrency]);

  // Document Type Distribution for PieChart
  const documentTypeDistribution = useMemo(() => {
    const map: Record<string, number> = {};
    filteredHistory.forEach((doc) => {
      const type = doc.type || "Other";
      map[type] = (map[type] || 0) + 1;
    });

    return Object.entries(map).map(([name, value]) => ({
      name,
      value
    }));
  }, [filteredHistory]);

  // Currency Breakdown
  const currencyDistribution = useMemo(() => {
    const map: Record<string, { count: number; totalAmount: number }> = {};
    filteredHistory.forEach((doc) => {
      const curr = (doc.currency || "INR").trim().toUpperCase();
      if (!map[curr]) {
        map[curr] = { count: 0, totalAmount: 0 };
      }
      map[curr].count += 1;
      map[curr].totalAmount += Number(doc.total || doc.totalAmount || 0);
    });

    return Object.entries(map).map(([curr, data]) => ({
      currency: curr,
      count: data.count,
      totalAmount: data.totalAmount
    }));
  }, [filteredHistory]);

  // Payment Status Breakdown Data
  const paymentStatusData = useMemo(() => {
    return [
      { name: "Paid", value: kpis.paidRevenue, count: kpis.paidCount, color: STATUS_COLORS.Paid },
      { name: "Pending", value: kpis.pendingRevenue, count: kpis.pendingCount, color: STATUS_COLORS.Pending },
      { name: "Overdue", value: kpis.overdueRevenue, count: kpis.overdueCount, color: STATUS_COLORS.Overdue }
    ].filter((item) => item.value > 0 || item.count > 0);
  }, [kpis]);

  // Export Analytics Summary CSV
  const handleExportAnalyticsCSV = () => {
    const lines: string[] = [];
    lines.push("BilliQ Enterprise Analytics Report");
    lines.push(`Generated On,${new Date().toISOString()}`);
    lines.push(`Period Filter,${dateRange.toUpperCase()}`);
    lines.push(`Active Currency,${activeCurrency}`);
    lines.push("");
    lines.push("=== HIGH LEVEL KPIS ===");
    lines.push(`Total Revenue,${kpis.totalRevenue.toFixed(2)} ${activeCurrency}`);
    lines.push(`Total Documents Created,${kpis.totalDocuments}`);
    lines.push(`Tax Invoices,${kpis.invoiceCount}`);
    lines.push(`Quotations,${kpis.quotationCount}`);
    lines.push(`Delivery Challans,${kpis.challanCount}`);
    lines.push(`Purchase Orders,${kpis.poCount}`);
    lines.push(`Average Invoice Value,${kpis.avgInvoiceValue.toFixed(2)} ${activeCurrency}`);
    lines.push(`Paid Collection,${kpis.paidRevenue.toFixed(2)} ${activeCurrency} (${kpis.collectionRate.toFixed(1)}%)`);
    lines.push(`Pending Collection,${kpis.pendingRevenue.toFixed(2)} ${activeCurrency}`);
    lines.push(`Overdue Collection,${kpis.overdueRevenue.toFixed(2)} ${activeCurrency}`);
    lines.push("");
    lines.push("=== TOP CLIENTS BY REVENUE ===");
    lines.push("Client Name,Revenue,Invoices Count,Total Documents");
    topClientsData.forEach((c) => {
      lines.push(`"${c.name.replace(/"/g, '""')}",${c.revenue.toFixed(2)},${c.invoices},${c.docCount}`);
    });
    lines.push("");
    lines.push("=== REVENUE OVER TIME ===");
    lines.push("Time Period,Revenue,Invoices Count,Total Documents");
    timeSeriesData.forEach((t) => {
      lines.push(`"${t.label}",${t.revenue.toFixed(2)},${t.invoices},${t.totalDocs}`);
    });

    const csvContent = lines.join("\n");
    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `billiq_analytics_report_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card & Filter Toolbar */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-zinc-200/80 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-brand-50 text-brand-600 rounded-xl border border-brand-100">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight">
                Business Analytics & Financial Intelligence
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-zinc-500 mt-1">
              Real-time sales velocity, receivables tracking, customer volume rankings, and revenue breakdowns.
            </p>
          </div>

          {/* Quick Action Export Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportAnalyticsCSV}
              className="text-zinc-700 border-zinc-200 hover:bg-zinc-50 font-bold"
              title="Export complete analytics summary to CSV"
            >
              <Download className="w-4 h-4 mr-1.5 text-brand-600" />
              <span>Export Report (CSV)</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportHistoryItemizedToCSV(filteredHistory)}
              className="text-emerald-700 border-emerald-200 hover:bg-emerald-50 font-bold"
              title="Export line-item registers from filtered period"
            >
              <FileSpreadsheet className="w-4 h-4 mr-1.5 text-emerald-600" />
              <span>Export Items (CSV)</span>
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={onNewBill}
              className="bg-brand-600 hover:bg-brand-700 text-white font-bold"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              <span>Create Bill</span>
            </Button>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="mt-5 pt-5 border-t border-zinc-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 flex-wrap">
          {/* Date Range Selector Pills */}
          <div className="flex items-center gap-1 bg-zinc-100/80 p-1 rounded-xl border border-zinc-200/60 overflow-x-auto max-w-full">
            <button
              onClick={() => setDateRange("7d")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                dateRange === "7d" ? "bg-white text-brand-600 shadow-xs" : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              Last 7 Days
            </button>
            <button
              onClick={() => setDateRange("30d")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                dateRange === "30d" ? "bg-white text-brand-600 shadow-xs" : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              Last 30 Days
            </button>
            <button
              onClick={() => setDateRange("90d")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                dateRange === "90d" ? "bg-white text-brand-600 shadow-xs" : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              This Quarter (90d)
            </button>
            <button
              onClick={() => setDateRange("1y")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                dateRange === "1y" ? "bg-white text-brand-600 shadow-xs" : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              Past Year
            </button>
            <button
              onClick={() => setDateRange("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                dateRange === "all" ? "bg-white text-brand-600 shadow-xs" : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              All Time
            </button>
            <button
              onClick={() => setDateRange("custom")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                dateRange === "custom" ? "bg-white text-brand-600 shadow-xs" : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              Custom
            </button>
          </div>

          {/* Secondary Filters: Document Type & Search */}
          <div className="flex items-center gap-2.5 w-full md:w-auto">
            {/* Custom Date Pickers */}
            {dateRange === "custom" && (
              <div className="flex items-center gap-1.5">
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="px-2.5 py-1.5 text-xs font-medium bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-700"
                  title="Start Date"
                />
                <span className="text-zinc-400 text-xs">to</span>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="px-2.5 py-1.5 text-xs font-medium bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-700"
                  title="End Date"
                />
              </div>
            )}

            {/* Document Type Dropdown */}
            <select
              value={selectedDocType}
              onChange={(e) => setSelectedDocType(e.target.value)}
              className="px-3 py-1.5 text-xs font-bold bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
            >
              <option value="ALL">All Documents</option>
              <option value={DocumentType.TAX_INVOICE}>Tax Invoices</option>
              <option value={DocumentType.QUOTATION}>Quotations</option>
              <option value={DocumentType.DELIVERY_CHALLAN}>Delivery Challans</option>
              <option value={DocumentType.PURCHASE_ORDER}>Purchase Orders</option>
              <option value={DocumentType.COST_SHEET}>Cost Sheets</option>
            </select>

            {/* Customer Search Box */}
            <div className="relative flex-1 md:w-48">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Filter by client..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-brand-500/20 text-zinc-800"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 4 Primary High-Level KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Sales / Revenue */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-xs hover:border-brand-300 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-400">
              Total Revenue (Sales)
            </span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-zinc-900 tracking-tight">
              {formatCurrencyAmount(kpis.totalRevenue, activeCurrency)}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs">
              {kpis.revenueGrowthPct !== null ? (
                kpis.revenueGrowthPct >= 0 ? (
                  <span className="inline-flex items-center font-bold text-emerald-600">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    +{kpis.revenueGrowthPct.toFixed(1)}%
                  </span>
                ) : (
                  <span className="inline-flex items-center font-bold text-rose-600">
                    <ArrowDownRight className="w-3.5 h-3.5" />
                    {kpis.revenueGrowthPct.toFixed(1)}%
                  </span>
                )
              ) : (
                <span className="text-zinc-400 font-medium">In selected period</span>
              )}
              <span className="text-zinc-400 font-medium text-[11px]">
                ({kpis.invoiceCount} invoices issued)
              </span>
            </div>
          </div>
        </motion.div>

        {/* KPI 2: Total Documents Created */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.05 }}
          className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-xs hover:border-brand-300 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-400">
              Total Documents
            </span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-zinc-900 tracking-tight">
              {kpis.totalDocuments}
            </div>
            <div className="flex items-center gap-2 mt-1 text-[11px] text-zinc-500 font-medium truncate">
              <span>{kpis.invoiceCount} Invoices</span>
              <span>•</span>
              <span>{kpis.quotationCount} Quotes</span>
              <span>•</span>
              <span>{kpis.challanCount} Challans</span>
            </div>
          </div>
        </motion.div>

        {/* KPI 3: Average Invoice Value */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.1 }}
          className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-xs hover:border-brand-300 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-400">
              Avg. Invoice Value
            </span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-zinc-900 tracking-tight">
              {formatCurrencyAmount(kpis.avgInvoiceValue, activeCurrency)}
            </div>
            <div className="text-[11px] text-zinc-500 font-medium mt-1">
              Average billing per transaction
            </div>
          </div>
        </motion.div>

        {/* KPI 4: Payment Collection Rate */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.15 }}
          className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-xs hover:border-brand-300 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-400">
              Collection Rate
            </span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-zinc-900 tracking-tight flex items-baseline gap-1.5">
              <span>{kpis.collectionRate.toFixed(1)}%</span>
              <span className="text-xs font-semibold text-emerald-600">
                ({formatCurrencyAmount(kpis.paidRevenue, activeCurrency)} paid)
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1 text-[11px] font-medium text-zinc-500 truncate">
              <span className="text-amber-600 font-bold">
                {formatCurrencyAmount(kpis.pendingRevenue, activeCurrency)} pending
              </span>
              {kpis.overdueRevenue > 0 && (
                <>
                  <span>•</span>
                  <span className="text-rose-600 font-bold">
                    {formatCurrencyAmount(kpis.overdueRevenue, activeCurrency)} overdue
                  </span>
                </>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Main Charts Section (Row 1: Revenue Trends + Client Ranking) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Revenue Trend Over Time (Area / Bar Chart) */}
        <div className="lg:col-span-8 bg-white p-5 sm:p-6 rounded-2xl border border-zinc-200/80 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h2 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-brand-600" />
                Revenue & Activity Velocity
              </h2>
              <p className="text-xs text-zinc-500 font-medium mt-0.5">
                Financial performance trends across the selected timeline
              </p>
            </div>
            {/* View Mode Switcher */}
            <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-xl">
              <button
                onClick={() => setChartViewMode("revenue")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  chartViewMode === "revenue" ? "bg-white text-brand-600 shadow-xs" : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                Revenue ({currencySymbol})
              </button>
              <button
                onClick={() => setChartViewMode("count")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  chartViewMode === "count" ? "bg-white text-brand-600 shadow-xs" : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                Document Count
              </button>
            </div>
          </div>

          {timeSeriesData.length > 0 ? (
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                {chartViewMode === "revenue" ? (
                  <AreaChart data={timeSeriesData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis
                      dataKey="label"
                      stroke="#94a3b8"
                      fontSize={11}
                      tickLine={false}
                      axisLine={{ stroke: "#e2e8f0" }}
                    />
                    <YAxis
                      stroke="#94a3b8"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(val) => `${currencySymbol}${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-zinc-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1 border border-zinc-800">
                              <div className="font-bold text-zinc-300">{label}</div>
                              <div className="text-emerald-400 font-extrabold text-sm">
                                {formatCurrencyAmount(data.revenue, activeCurrency)}
                              </div>
                              <div className="text-zinc-400">
                                {data.invoices} Invoices • {data.totalDocs} Total Docs
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#2563eb"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#revenueGradient)"
                    />
                  </AreaChart>
                ) : (
                  <BarChart data={timeSeriesData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis
                      dataKey="label"
                      stroke="#94a3b8"
                      fontSize={11}
                      tickLine={false}
                      axisLine={{ stroke: "#e2e8f0" }}
                    />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-zinc-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1">
                              <div className="font-bold text-zinc-300">{label}</div>
                              <div className="text-blue-400 font-bold">{data.totalDocs} Total Documents</div>
                              <div className="text-zinc-400">
                                {data.invoices} Invoices • {data.quotations} Quotations
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="invoices" name="Invoices" fill="#2563eb" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="quotations" name="Quotations" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[280px] flex flex-col items-center justify-center text-center p-6 border border-dashed border-zinc-200 rounded-xl bg-zinc-50/50">
              <FileText className="w-8 h-8 text-zinc-300 mb-2" />
              <p className="text-xs font-bold text-zinc-600">No transactions recorded for this period</p>
              <p className="text-[11px] text-zinc-400 mt-0.5">Create your first invoice or quotation to populate insights.</p>
            </div>
          )}
        </div>

        {/* Right: Top 5 Clients by Revenue Volume */}
        <div className="lg:col-span-4 bg-white p-5 sm:p-6 rounded-2xl border border-zinc-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-600" />
                  Top Clients by Sales
                </h2>
                <p className="text-xs text-zinc-500 font-medium mt-0.5">Highest grossing customer accounts</p>
              </div>
            </div>

            {topClientsData.length > 0 ? (
              <div className="space-y-3.5">
                {topClientsData.map((client, idx) => {
                  const sharePct = kpis.totalRevenue > 0 ? (client.revenue / kpis.totalRevenue) * 100 : 0;
                  return (
                    <div key={client.name} className="p-3 rounded-xl bg-zinc-50/80 border border-zinc-100 hover:border-zinc-200 transition-colors">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 font-bold text-zinc-900">
                          <span className="w-5 h-5 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-[10px] font-black">
                            {idx + 1}
                          </span>
                          <span className="truncate max-w-[140px]" title={client.name}>
                            {client.name}
                          </span>
                        </div>
                        <div className="font-black text-zinc-900">
                          {formatCurrencyAmount(client.revenue, activeCurrency)}
                        </div>
                      </div>

                      {/* Share Progress Bar */}
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex-1 bg-zinc-200 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-brand-600 h-full rounded-full transition-all"
                            style={{ width: `${Math.min(100, Math.max(8, sharePct))}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-bold text-zinc-500 w-8 text-right">
                          {sharePct.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-48 flex flex-col items-center justify-center text-center p-6 border border-dashed border-zinc-200 rounded-xl bg-zinc-50/50">
                <Users className="w-6 h-6 text-zinc-300 mb-1.5" />
                <p className="text-xs font-bold text-zinc-600">No client billing data</p>
                <p className="text-[11px] text-zinc-400">Client rankings will appear as you issue invoices.</p>
              </div>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigate("customers")}
            className="w-full mt-4 text-zinc-700 font-bold border-zinc-200 hover:bg-zinc-50"
          >
            <span>Manage All Clients ({customers.length})</span>
            <ChevronRight className="w-4 h-4 ml-1.5" />
          </Button>
        </div>
      </div>

      {/* Row 2: Payment Collection Status & Document Type Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Panel 1: Payment Collection Status */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-zinc-200/80 shadow-xs">
          <h2 className="text-base font-bold text-zinc-900 flex items-center gap-2 mb-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Payment Status Distribution
          </h2>
          <p className="text-xs text-zinc-500 font-medium mb-4">
            Collection health of issued Tax Invoices
          </p>

          {paymentStatusData.length > 0 ? (
            <div>
              <div className="h-[180px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={paymentStatusData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={3}
                    >
                      {paymentStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: any) => [
                        formatCurrencyAmount(Number(val), activeCurrency),
                        "Amount"
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-2 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="text-zinc-600 font-medium">Paid ({kpis.paidCount})</span>
                  </div>
                  <span className="font-black text-zinc-900">
                    {formatCurrencyAmount(kpis.paidRevenue, activeCurrency)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span className="text-zinc-600 font-medium">Pending ({kpis.pendingCount})</span>
                  </div>
                  <span className="font-black text-zinc-900">
                    {formatCurrencyAmount(kpis.pendingRevenue, activeCurrency)}
                  </span>
                </div>
                {kpis.overdueRevenue > 0 && (
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                      <span className="text-rose-600 font-bold">Overdue ({kpis.overdueCount})</span>
                    </div>
                    <span className="font-black text-rose-700">
                      {formatCurrencyAmount(kpis.overdueRevenue, activeCurrency)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-44 flex flex-col items-center justify-center text-center p-4 border border-dashed border-zinc-200 rounded-xl bg-zinc-50/50">
              <CheckCircle2 className="w-6 h-6 text-zinc-300 mb-1" />
              <p className="text-xs font-bold text-zinc-600">No invoice records found</p>
            </div>
          )}
        </div>

        {/* Panel 2: Document Type Breakdown */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-zinc-200/80 shadow-xs">
          <h2 className="text-base font-bold text-zinc-900 flex items-center gap-2 mb-1">
            <PieChartIcon className="w-4 h-4 text-purple-600" />
            Document Composition
          </h2>
          <p className="text-xs text-zinc-500 font-medium mb-4">
            Breakdown across invoices, quotations & challans
          </p>

          {documentTypeDistribution.length > 0 ? (
            <div>
              <div className="h-[180px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={documentTypeDistribution}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={3}
                    >
                      {documentTypeDistribution.map((entry, index) => (
                        <Cell key={`type-cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val: any) => [`${val} documents`, "Count"]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                {documentTypeDistribution.map((item, idx) => (
                  <div key={item.name} className="flex items-center gap-1.5 truncate">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}
                    />
                    <span className="text-zinc-600 truncate text-[11px]" title={item.name}>
                      {item.name}: <strong>{item.value}</strong>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-44 flex flex-col items-center justify-center text-center p-4 border border-dashed border-zinc-200 rounded-xl bg-zinc-50/50">
              <Layers className="w-6 h-6 text-zinc-300 mb-1" />
              <p className="text-xs font-bold text-zinc-600">No documents in timeline</p>
            </div>
          )}
        </div>

        {/* Panel 3: Currency & Multi-Market Distribution */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-zinc-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-zinc-900 flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-blue-600" />
              Currency & Global Trade
            </h2>
            <p className="text-xs text-zinc-500 font-medium mb-4">
              Volume distributed by billing currencies
            </p>

            {currencyDistribution.length > 0 ? (
              <div className="space-y-2.5">
                {currencyDistribution.map((curr) => {
                  const symbol = getCurrencySymbol(curr.currency);
                  return (
                    <div key={curr.currency} className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-zinc-200 text-zinc-800 text-[10px] font-black">
                          {curr.currency}
                        </span>
                        <span className="text-xs text-zinc-500 font-medium">
                          {curr.count} {curr.count === 1 ? "doc" : "docs"}
                        </span>
                      </div>
                      <div className="text-xs font-black text-zinc-900">
                        {formatCurrencyAmount(curr.totalAmount, curr.currency)}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-32 flex flex-col items-center justify-center text-center p-4 border border-dashed border-zinc-200 rounded-xl bg-zinc-50/50">
                <DollarSign className="w-6 h-6 text-zinc-300 mb-1" />
                <p className="text-xs font-bold text-zinc-600">No currency data</p>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-100 text-[11px] text-zinc-500 flex items-center justify-between">
            <span>Active base currency:</span>
            <span className="font-black text-brand-600">{activeCurrency}</span>
          </div>
        </div>
      </div>

      {/* Row 3: Filtered Recent Records List */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-zinc-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-zinc-600" />
              Transactions in this Analytics Period ({filteredHistory.length})
            </h2>
            <p className="text-xs text-zinc-500 font-medium mt-0.5">
              Click any transaction to open in editor or preview PDF
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportHistorySummaryToCSV(filteredHistory)}
            className="text-zinc-700 border-zinc-200 hover:bg-zinc-50 font-bold"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            <span>Export Period Summary (CSV)</span>
          </Button>
        </div>

        {filteredHistory.length > 0 ? (
          <div className="divide-y divide-zinc-100 max-h-[400px] overflow-y-auto">
            {filteredHistory.slice(0, 15).map((doc) => {
              const docCurrency = (doc.currency || "INR").trim().toUpperCase();
              const symbol = getCurrencySymbol(docCurrency);
              const amount = Number(doc.total || doc.totalAmount || 0);

              return (
                <div
                  key={doc.id}
                  onClick={() => onOpenDocument(doc)}
                  className="p-4 hover:bg-zinc-50 transition-colors flex items-center justify-between gap-4 cursor-pointer"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-zinc-100 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4 text-zinc-600" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs text-zinc-900">
                          {doc.documentNumber || doc.id}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-600 text-[10px] font-bold">
                          {doc.type}
                        </span>
                        {doc.paymentStatus === "paid" && (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                            Paid
                          </span>
                        )}
                        {doc.paymentStatus === "overdue" && (
                          <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 text-[10px] font-bold">
                            Overdue
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-zinc-500 font-medium truncate mt-0.5">
                        {doc.customerName || doc.partyName || "Unnamed Customer"} • {doc.date}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <div className="text-sm font-black text-zinc-900">
                        {formatCurrencyAmount(amount, docCurrency)}
                      </div>
                      {doc.itemsCount !== undefined && (
                        <div className="text-[10px] text-zinc-400 font-medium">
                          {doc.itemsCount} items
                        </div>
                      )}
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-400" />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-10 text-center text-zinc-400 text-xs">
            No transactions found matching the selected filters.
          </div>
        )}
      </div>
    </div>
  );
};
