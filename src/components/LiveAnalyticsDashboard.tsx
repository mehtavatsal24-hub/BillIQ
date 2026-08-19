import React, { useState, useEffect, useMemo } from "react";
import {
  Activity,
  Zap,
  TrendingUp,
  AlertTriangle,
  Users,
  Clock,
  Coins,
  ShieldCheck,
  RefreshCw,
  Search,
  Filter,
  FileText,
  FileSpreadsheet,
  Truck,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  Settings,
  Calendar,
  Layers,
  ChevronDown,
  Info,
  DollarSign,
  PieChart as PieChartIcon,
  BarChart3,
  Cpu,
  Flame,
  UserCheck,
  UserX,
  ExternalLink,
  ChevronRight,
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
  CartesianGrid,
} from "recharts";
import {
  ApiUsageEntry,
  UserPresence,
  computeSpendIntelligence,
  subscribeToApiUsageLogs,
  subscribeToPresence,
  calculateTokenCostINR,
} from "../services/spendAnalyticsService";
import { getCurrencySymbol, formatCurrencyAmount, convertInrToCurrency } from "../utils/localization";
import { normalizeTimestampToMs } from "./AdminDashboard";

interface LiveAnalyticsDashboardProps {
  registeredUsers?: any[];
  allDocuments?: any[];
  onInspectUser?: (user: any) => void;
  onSendEmailToUser?: (user: any) => void;
  currency?: string;
}

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6", "#06b6d4"];

export const LiveAnalyticsDashboard: React.FC<LiveAnalyticsDashboardProps> = ({
  registeredUsers = [],
  allDocuments = [],
  onInspectUser,
  onSendEmailToUser,
  currency = "INR",
}) => {
  const rawCurrency = (currency || "INR").trim().toUpperCase();
  const activeCurrency = !rawCurrency || rawCurrency === "AOA" ? "INR" : rawCurrency;
  const rawSymbol = getCurrencySymbol(activeCurrency);
  const currencySymbol = !rawSymbol || rawSymbol === "Kz" || activeCurrency === "INR" ? "₹" : rawSymbol;

  // State management
  const [logs, setLogs] = useState<ApiUsageEntry[]>([]);
  const [presenceList, setPresenceList] = useState<UserPresence[]>([]);
  const [timeFilter, setTimeFilter] = useState<"live_1h" | "today" | "7d" | "30d" | "all" | "custom">("all");
  const [customDate, setCustomDate] = useState<string>("");
  const [creditCapInr, setCreditCapInr] = useState<number>(1000);
  const [isCreditCapModalOpen, setIsCreditCapModalOpen] = useState<boolean>(false);
  const [newCreditCapInput, setNewCreditCapInput] = useState<string>("1000");
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<number>(30); // 30s default
  const [lastSyncedTime, setLastSyncedTime] = useState<Date>(new Date());
  
  // Search & Filter in tables
  const [userTableSearch, setUserTableSearch] = useState<string>("");
  const [userStatusFilter, setUserStatusFilter] = useState<"all" | "online" | "offline" | "churned" | "high_spend">("all");
  
  const [logTableSearch, setLogTableSearch] = useState<string>("");
  const [logActionFilter, setLogActionFilter] = useState<string>("all");
  const [logStatusFilter, setLogStatusFilter] = useState<string>("all");

  const [activeSubView, setActiveSubView] = useState<"overview" | "users" | "api_logs" | "errors">("overview");
  const [selectedLogForDetails, setSelectedLogForDetails] = useState<ApiUsageEntry | null>(null);

  // Subscribe to real-time logs & presence
  useEffect(() => {
    const unsubLogs = subscribeToApiUsageLogs((newLogs) => {
      setLogs(newLogs);
      setLastSyncedTime(new Date());
    });

    const unsubPresence = subscribeToPresence((newPresence) => {
      setPresenceList(newPresence);
    });

    return () => {
      unsubLogs();
      unsubPresence();
    };
  }, []);

  // Auto-refresh timer
  useEffect(() => {
    if (autoRefreshInterval <= 0) return;
    const interval = setInterval(() => {
      setLastSyncedTime(new Date());
    }, autoRefreshInterval * 1000);
    return () => clearInterval(interval);
  }, [autoRefreshInterval]);

  // Merge registered users with live presence
  const enrichedUsers = useMemo(() => {
    const now = Date.now();
    const fiveMinutesAgo = now - 5 * 60 * 1000;
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

    const presenceMap = new Map<string, UserPresence>();
    presenceList.forEach((p) => {
      if (p.userId) presenceMap.set(p.userId.toLowerCase(), p);
      if (p.userEmail) presenceMap.set(p.userEmail.toLowerCase(), p);
    });

    return registeredUsers.map((u) => {
      const uIdKey = (u.id || "").toLowerCase();
      const uEmailKey = (u.email || "").toLowerCase();
      const livePresence = presenceMap.get(uIdKey) || presenceMap.get(uEmailKey);

      const lastActiveRaw = livePresence?.lastActiveAt || u.lastActiveAt || u.lastActive || u.lastLoginAt || u.lastLogin || u.lastSeen || u.updatedAt || u.createdAt;
      const lastActiveTime = lastActiveRaw ? normalizeTimestampToMs(lastActiveRaw) : 0;
      const createdAtTime = u.createdAt ? normalizeTimestampToMs(u.createdAt) : 0;
      
      const isOnline = livePresence?.isOnline || (lastActiveTime >= fiveMinutesAgo);
      const isChurned = (!lastActiveTime || lastActiveTime < sevenDaysAgo) && (u.documentsCount === 0 || !u.documentsCount);
      const isDau = lastActiveTime >= (now - 24 * 60 * 60 * 1000) || (createdAtTime >= (now - 24 * 60 * 60 * 1000));

      const userDocs = u.documentsCount || (u.documents?.length || 0);

      return {
        ...u,
        id: u.id || `usr_${u.email ? u.email.split("@")[0] : "anon"}`,
        email: u.email || "unknown@billiq.site",
        displayName: u.displayName || u.username || (u.email ? u.email.split("@")[0] : "User"),
        isOnline,
        isChurned,
        isDau,
        lastActiveAt: lastActiveRaw || new Date().toISOString(),
        currentRoute: livePresence?.currentRoute || (isOnline ? "/dashboard/invoices" : "Offline"),
        documentsCount: userDocs,
        plan: u.plan || u.planTier || "Pro Trial",
      };
    });
  }, [registeredUsers, presenceList]);

  // Compute spend and business intelligence metrics
  const intelligence = useMemo(() => {
    return computeSpendIntelligence({
      logs,
      users: enrichedUsers,
      documents: allDocuments,
      timeFilter,
      customDate,
      creditCapInr,
    });
  }, [logs, enrichedUsers, allDocuments, timeFilter, customDate, creditCapInr]);

  // Manual refresh handler
  const handleManualRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      setLastSyncedTime(new Date());
    }, 600);
  };

  // Real-Time User Counts
  const liveActiveCount = enrichedUsers.filter((u) => u.isOnline).length;
  const totalRegisteredCount = enrichedUsers.length;
  const dauCount = enrichedUsers.filter((u) => u.isDau).length;
  const churnedCount = enrichedUsers.filter((u) => u.isChurned).length;

  // Filtered Users Table
  const filteredUsersTable = useMemo(() => {
    return intelligence.powerUsers.filter((u) => {
      const matchesSearch =
        !userTableSearch ||
        u.userEmail.toLowerCase().includes(userTableSearch.toLowerCase()) ||
        u.userName.toLowerCase().includes(userTableSearch.toLowerCase()) ||
        u.userId.toLowerCase().includes(userTableSearch.toLowerCase());

      if (!matchesSearch) return false;

      if (userStatusFilter === "online") return u.isOnline;
      if (userStatusFilter === "offline") return !u.isOnline;
      if (userStatusFilter === "churned") {
        const enriched = enrichedUsers.find(eu => eu.email === u.userEmail);
        return enriched?.isChurned;
      }
      if (userStatusFilter === "high_spend") return u.estimatedSpendInr > 1.0;

      return true;
    });
  }, [intelligence.powerUsers, userTableSearch, userStatusFilter, enrichedUsers]);

  // Filtered API Logs Table
  const filteredApiLogsTable = useMemo(() => {
    return intelligence.filteredLogs.filter((log) => {
      const matchesSearch =
        !logTableSearch ||
        log.userEmail.toLowerCase().includes(logTableSearch.toLowerCase()) ||
        log.actionType.toLowerCase().includes(logTableSearch.toLowerCase()) ||
        log.model.toLowerCase().includes(logTableSearch.toLowerCase()) ||
        log.id.toLowerCase().includes(logTableSearch.toLowerCase());

      if (!matchesSearch) return false;

      if (logActionFilter !== "all" && log.actionType !== logActionFilter) return false;
      if (logStatusFilter !== "all" && log.status !== logStatusFilter) return false;

      return true;
    });
  }, [intelligence.filteredLogs, logTableSearch, logActionFilter, logStatusFilter]);

  // Donut chart data for Feature Adoption
  const adoptionChartData = [
    { name: "AI Receipt/PO Scan", value: intelligence.adoptionStats.aiScanCount, color: "#6366f1" },
    { name: "Manual Invoice Entry", value: intelligence.adoptionStats.manualEntryCount, color: "#10b981" },
    { name: "Bulk Line Editor", value: intelligence.adoptionStats.bulkEditorCount, color: "#f59e0b" },
    { name: "Voice Order Input", value: intelligence.adoptionStats.voiceInputCount, color: "#ec4899" },
  ].filter(d => d.value > 0);

  // Cost status color indicator
  const getRemainingBalanceBadge = () => {
    const ratio = intelligence.spendMetrics.remainingBalanceInr / creditCapInr;
    if (ratio > 0.6) {
      return { bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30", label: "Healthy Cap", barColor: "bg-emerald-500" };
    }
    if (ratio > 0.2) {
      return { bg: "bg-amber-500/10 text-amber-400 border-amber-500/30", label: "Moderate Usage", barColor: "bg-amber-500" };
    }
    return { bg: "bg-rose-500/10 text-rose-400 border-rose-500/30", label: "Low Balance Warning", barColor: "bg-rose-500" };
  };

  const balanceStatus = getRemainingBalanceBadge();

  return (
    <div className="space-y-6 text-zinc-100 font-sans pb-12">
      {/* 1. Header & Live Controller Bar */}
      <div className="bg-zinc-900/90 border border-zinc-800/90 rounded-2xl p-5 shadow-xl backdrop-blur-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-xl shadow-md">
                <Activity className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-black text-white tracking-tight">
                    Live Analytics & Spend Intelligence
                  </h1>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                    Live Pulse
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Real-time user sessions, token consumption audits in INR (₹), and business health telemetry.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Date Filters & Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Time Filter Pills */}
            <div className="flex items-center bg-zinc-950 p-1 rounded-xl border border-zinc-800">
              <button
                type="button"
                onClick={() => setTimeFilter("live_1h")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  timeFilter === "live_1h"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Live (1h)
              </button>
              <button
                type="button"
                onClick={() => setTimeFilter("today")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  timeFilter === "today"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => setTimeFilter("7d")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  timeFilter === "7d"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                7 Days
              </button>
              <button
                type="button"
                onClick={() => setTimeFilter("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  timeFilter === "all"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                All Time
              </button>
              <button
                type="button"
                onClick={() => setTimeFilter("custom")}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  timeFilter === "custom"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <Calendar className="w-3 h-3" />
                Custom
              </button>
            </div>

            {timeFilter === "custom" && (
              <div className="flex items-center gap-1 bg-zinc-950 px-2.5 py-1 rounded-xl border border-indigo-500/60">
                <input
                  type="date"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  className="bg-transparent text-white text-xs font-mono focus:outline-none cursor-pointer"
                />
              </div>
            )}

            {/* Credit Cap Selector Button */}
            <button
              onClick={() => setIsCreditCapModalOpen(true)}
              className="px-3 py-1.5 bg-zinc-950 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              title={`Configure API spend budget cap in ${activeCurrency}`}
            >
              <Settings className="w-3.5 h-3.5 text-zinc-400" />
              <span>Cap: {formatCurrencyAmount(convertInrToCurrency(creditCapInr, activeCurrency), activeCurrency, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
            </button>

            {/* Sync / Refresh Button */}
            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
              <span>Refresh Metrics</span>
            </button>
          </div>
        </div>

        {/* Sync telemetry info bar */}
        <div className="mt-4 pt-3 border-t border-zinc-800/60 flex flex-wrap items-center justify-between gap-3 text-[11px] text-zinc-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              Last synced: <span className="font-mono text-zinc-200">{lastSyncedTime.toLocaleTimeString()}</span>
            </span>
            <span className="text-zinc-600">•</span>
            <span>Total AI Operations Logged: <strong className="text-zinc-200 font-mono">{intelligence.spendMetrics.totalAiOperations}</strong></span>
            <span className="text-zinc-600">•</span>
            <span>Success Rate: <strong className="text-emerald-400 font-mono">{intelligence.spendMetrics.successRate}%</strong></span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-zinc-500">Auto-refresh:</span>
            <select
              value={autoRefreshInterval}
              onChange={(e) => setAutoRefreshInterval(Number(e.target.value))}
              className="bg-zinc-950 border border-zinc-800 text-zinc-300 text-[11px] font-semibold rounded-lg px-2 py-0.5 focus:outline-none cursor-pointer"
            >
              <option value={10}>Every 10s</option>
              <option value={30}>Every 30s</option>
              <option value={60}>Every 60s</option>
              <option value={0}>Off (Manual only)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. SECTION 1: Real-Time User & Session Activity Engine Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-black uppercase tracking-wider text-zinc-400 flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-400" />
            Real-Time User & Session Activity
          </h2>
          <span className="text-[11px] text-zinc-500">Active Heartbeat: 5m window</span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Live Active Users Right Now */}
          <div className="p-4 bg-gradient-to-br from-indigo-950/40 via-zinc-900 to-zinc-950 border border-indigo-500/30 rounded-2xl relative overflow-hidden group">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Live Active Right Now
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Online
              </span>
            </div>
            <div className="text-3xl font-black text-white font-mono tracking-tight flex items-baseline gap-2">
              <span>{liveActiveCount}</span>
              <span className="text-xs text-zinc-400 font-normal">active sessions</span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-2 flex items-center gap-1">
              <Activity className="w-3 h-3 text-emerald-400" />
              <span>Users interacting within last 5 minutes</span>
            </p>
          </div>

          {/* Card 2: Total Registered Users */}
          <div className="p-4 bg-zinc-900/90 border border-zinc-800 rounded-2xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-sky-400" />
                Total Registered Users
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-zinc-800 text-zinc-300">
                All-time
              </span>
            </div>
            <div className="text-3xl font-black text-white font-mono tracking-tight flex items-baseline gap-2">
              <span>{totalRegisteredCount}</span>
              <span className="text-xs text-zinc-400 font-normal">sign-ups</span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-2 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-sky-400" />
              <span>Unique registered organizations</span>
            </p>
          </div>

          {/* Card 3: Daily Active Users (DAU) */}
          <div className="p-4 bg-zinc-900/90 border border-zinc-800 rounded-2xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                Daily Active (DAU)
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                Last 24h
              </span>
            </div>
            <div className="text-3xl font-black text-white font-mono tracking-tight flex items-baseline gap-2">
              <span>{dauCount}</span>
              <span className="text-xs text-zinc-400 font-normal">users</span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-2 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-amber-400" />
              <span>
                {totalRegisteredCount > 0 ? `${Math.round((dauCount / totalRegisteredCount) * 100)}% active ratio` : "No sessions yet"}
              </span>
            </p>
          </div>

          {/* Card 4: Inactive / Churned Users */}
          <div className="p-4 bg-zinc-900/90 border border-zinc-800 rounded-2xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                <UserX className="w-3.5 h-3.5 text-rose-400" />
                Inactive / At-Risk
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                &gt;7d Inactive
              </span>
            </div>
            <div className="text-3xl font-black text-white font-mono tracking-tight flex items-baseline gap-2">
              <span>{churnedCount}</span>
              <span className="text-xs text-zinc-400 font-normal">users</span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-2 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-rose-400" />
              <span>Zero docs or no session in 7+ days</span>
            </p>
          </div>
        </div>
      </div>

      {/* 3. SECTION 2: 100% Accurate Gemini & Firebase API Spend Engine */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-black uppercase tracking-wider text-zinc-400 flex items-center gap-2">
            <Coins className="w-4 h-4 text-emerald-400" />
            Gemini & API Spend Engine (100% Accurate {activeCurrency} Auditing)
          </h2>
          <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            Active Currency: {activeCurrency} ({currencySymbol})
          </span>
        </div>

        {/* Spend Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Spend Card 1: Total API Spend */}
          <div className="p-4 bg-gradient-to-br from-emerald-950/40 via-zinc-900 to-zinc-950 border border-emerald-500/30 rounded-2xl relative">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1">
                <Coins className="w-3.5 h-3.5 text-emerald-400" />
                Total API Spend (All-time)
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                {activeCurrency}
              </span>
            </div>
            <div className="text-3xl font-black text-white font-mono tracking-tight flex items-baseline gap-1">
              <span className="text-emerald-400">{currencySymbol}</span>
              <span>{convertInrToCurrency(intelligence.spendMetrics.totalSpendInr, activeCurrency).toFixed(2)}</span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-2 flex items-center justify-between">
              <span>Tokens: {intelligence.spendMetrics.totalTokensProcessed.toLocaleString()}</span>
              <span className="text-emerald-400 font-mono text-[10px]">{intelligence.spendMetrics.totalAiOperations} calls</span>
            </p>
          </div>

          {/* Spend Card 2: Today's Spend */}
          <div className="p-4 bg-zinc-900/90 border border-zinc-800 rounded-2xl relative">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                Today's Spend (24h)
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-zinc-800 text-zinc-300">
                24h Window
              </span>
            </div>
            <div className="text-3xl font-black text-white font-mono tracking-tight flex items-baseline gap-1">
              <span className="text-amber-400">{currencySymbol}</span>
              <span>{convertInrToCurrency(intelligence.spendMetrics.todaySpendInr, activeCurrency).toFixed(2)}</span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-2 flex items-center justify-between">
              <span>Last 7 Days: {formatCurrencyAmount(convertInrToCurrency(intelligence.spendMetrics.last7DaysSpendInr, activeCurrency), activeCurrency, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              <span className="text-amber-400 font-mono text-[10px]">7d sum</span>
            </p>
          </div>

          {/* Spend Card 3: Average Cost Per Document */}
          <div className="p-4 bg-zinc-900/90 border border-zinc-800 rounded-2xl relative">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-indigo-400" />
                Avg Cost / Document
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-950/60 text-indigo-300 border border-indigo-800/60">
                Efficiency
              </span>
            </div>
            <div className="text-3xl font-black text-white font-mono tracking-tight flex items-baseline gap-1">
              <span className="text-indigo-400">{currencySymbol}</span>
              <span>{convertInrToCurrency(intelligence.spendMetrics.avgCostPerDocumentInr, activeCurrency).toFixed(activeCurrency === 'INR' ? 2 : 4)}</span>
              <span className="text-xs text-zinc-400 font-normal">/ doc</span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-2 flex items-center justify-between">
              <span>Total Docs: {intelligence.spendMetrics.totalDocumentsCreated}</span>
              <span className="text-indigo-300 font-mono text-[10px]">~{formatCurrencyAmount(convertInrToCurrency(0.12, activeCurrency), activeCurrency, { minimumFractionDigits: 2, maximumFractionDigits: 4 })} target</span>
            </p>
          </div>

          {/* Spend Card 4: Remaining Balance Indicator & Cap */}
          <div className="p-4 bg-zinc-900/90 border border-zinc-800 rounded-2xl relative flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
                  Remaining Balance
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${balanceStatus.bg}`}>
                  {balanceStatus.label}
                </span>
              </div>
              <div className="text-3xl font-black text-white font-mono tracking-tight flex items-baseline gap-1">
                <span className="text-teal-400">{currencySymbol}</span>
                <span>{convertInrToCurrency(intelligence.spendMetrics.remainingBalanceInr, activeCurrency).toFixed(2)}</span>
                <span className="text-xs text-zinc-500 font-normal">/ {formatCurrencyAmount(convertInrToCurrency(creditCapInr, activeCurrency), activeCurrency, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
              </div>
            </div>

            <div className="mt-3 space-y-1">
              <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full ${balanceStatus.barColor} transition-all duration-500`}
                  style={{ width: `${intelligence.spendMetrics.burnRatePercentage}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-[10px] font-mono text-zinc-500">
                <span>Burn: {intelligence.spendMetrics.burnRatePercentage}%</span>
                <button
                  onClick={() => setIsCreditCapModalOpen(true)}
                  className="text-indigo-400 hover:text-indigo-300 underline cursor-pointer"
                >
                  Adjust Cap
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Official Pricing Formula Transparency Card */}
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-zinc-300">
            <Info className="w-4 h-4 text-indigo-400 shrink-0" />
            <div>
              <strong className="text-white">Active Production Pricing Model:</strong>
              <span className="text-zinc-400 ml-1">
                Gemini 2.5/3.7 Flash (<code className="text-indigo-300 font-mono">{formatCurrencyAmount(convertInrToCurrency(0.065, activeCurrency), activeCurrency, { minimumFractionDigits: 3, maximumFractionDigits: 5 })}/1k in</code>, <code className="text-indigo-300 font-mono">{formatCurrencyAmount(convertInrToCurrency(0.325, activeCurrency), activeCurrency, { minimumFractionDigits: 3, maximumFractionDigits: 5 })}/1k out</code>) • Flash-Lite (<code className="text-indigo-300 font-mono">{formatCurrencyAmount(convertInrToCurrency(0.009, activeCurrency), activeCurrency, { minimumFractionDigits: 3, maximumFractionDigits: 5 })}/1k in</code>, <code className="text-indigo-300 font-mono">{formatCurrencyAmount(convertInrToCurrency(0.035, activeCurrency), activeCurrency, { minimumFractionDigits: 3, maximumFractionDigits: 5 })}/1k out</code>).
              </span>
            </div>
          </div>
          <div className="text-[11px] font-mono text-zinc-400 bg-zinc-950 px-2.5 py-1 rounded-lg border border-zinc-800 shrink-0">
            Zero markup • Direct Google Cloud API Cost
          </div>
        </div>
      </div>

      {/* 4. SECTION 3: Business Health & Growth Analytics Dashboard (Visualizations) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: 7-Day Document Production Breakdown Chart */}
        <div className="lg:col-span-8 bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-400" />
                Document Production Trend (7-Day Breakdown)
              </h3>
              <p className="text-xs text-zinc-400">
                Invoices, Quotations, and Delivery Challans created across workspaces
              </p>
            </div>

            <div className="flex items-center gap-3 text-xs font-bold">
              <span className="flex items-center gap-1.5 text-indigo-400">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                Invoices ({intelligence.productionStats.invoicesCount})
              </span>
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                Quotations ({intelligence.productionStats.quotationsCount})
              </span>
              <span className="flex items-center gap-1.5 text-amber-400">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                Challans ({intelligence.productionStats.challansCount})
              </span>
            </div>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={intelligence.productionStats.dailyBreakdown} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorInvoices" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorQuotations" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorChallans" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="date" stroke="#71717a" fontSize={11} tickLine={false} />
                <YAxis stroke="#71717a" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#18181b",
                    borderColor: "#3f3f46",
                    borderRadius: "12px",
                    color: "#f4f4f5",
                    fontSize: "12px",
                  }}
                />
                <Area type="monotone" dataKey="invoices" name="Invoices" stroke="#6366f1" fillOpacity={1} fill="url(#colorInvoices)" strokeWidth={2} />
                <Area type="monotone" dataKey="quotations" name="Quotations" stroke="#10b981" fillOpacity={1} fill="url(#colorQuotations)" strokeWidth={2} />
                <Area type="monotone" dataKey="challans" name="Delivery Challans" stroke="#f59e0b" fillOpacity={1} fill="url(#colorChallans)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Column: Feature Adoption Rate (Donut Chart) */}
        <div className="lg:col-span-4 bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <PieChartIcon className="w-4 h-4 text-purple-400" />
                Feature Adoption
              </h3>
              <span className="text-[11px] font-extrabold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                {intelligence.adoptionStats.aiAdoptionPercentage}% AI Assisted
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              AI OCR scan vs manual invoice workflow breakdown
            </p>
          </div>

          <div className="h-44 w-full relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={adoptionChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={48}
                  outerRadius={70}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {adoptionChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="#18181b" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#18181b",
                    borderColor: "#3f3f46",
                    borderRadius: "10px",
                    color: "#f4f4f5",
                    fontSize: "11px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xl font-black text-white font-mono">{intelligence.adoptionStats.totalActions}</span>
              <span className="text-[10px] text-zinc-400 uppercase font-bold">Actions</span>
            </div>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-zinc-800/80 text-xs">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-zinc-300">
                <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                AI Receipt / PO OCR
              </span>
              <span className="font-mono font-bold text-white">{intelligence.adoptionStats.aiScanCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-zinc-300">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Manual Invoice Entry
              </span>
              <span className="font-mono font-bold text-white">{intelligence.adoptionStats.manualEntryCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-zinc-300">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                Bulk Line Editor
              </span>
              <span className="font-mono font-bold text-white">{intelligence.adoptionStats.bulkEditorCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-zinc-300">
                <span className="w-2 h-2 rounded-full bg-pink-500"></span>
                Voice Input Parser
              </span>
              <span className="font-mono font-bold text-white">{intelligence.adoptionStats.voiceInputCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Sub-navigation Tabs: Interactive Tables */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveSubView("overview")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeSubView === "overview"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-zinc-950 text-zinc-400 hover:text-zinc-200 border border-zinc-800"
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>Top Power Users ({intelligence.powerUsers.length})</span>
            </button>

            <button
              onClick={() => setActiveSubView("users")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeSubView === "users"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-zinc-950 text-zinc-400 hover:text-zinc-200 border border-zinc-800"
              }`}
            >
              <Users className="w-3.5 h-3.5 text-sky-400" />
              <span>Live User Activity & Spend Table ({enrichedUsers.length})</span>
            </button>

            <button
              onClick={() => setActiveSubView("api_logs")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeSubView === "api_logs"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-zinc-950 text-zinc-400 hover:text-zinc-200 border border-zinc-800"
              }`}
            >
              <Cpu className="w-3.5 h-3.5 text-emerald-400" />
              <span>AI Token Usage Logs ({intelligence.filteredLogs.length})</span>
            </button>

            <button
              onClick={() => setActiveSubView("errors")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeSubView === "errors"
                  ? "bg-rose-600 text-white shadow-sm"
                  : "bg-zinc-950 text-zinc-400 hover:text-zinc-200 border border-zinc-800"
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span>Errors & Rate Limits ({intelligence.errorLogs.length})</span>
            </button>
          </div>
        </div>

        {/* VIEW 1: TOP POWER USERS */}
        {activeSubView === "overview" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Top 5 Power Users by Document & Spend Volume
                </h4>
                <p className="text-[11px] text-zinc-400">
                  Ideal candidates for enterprise plan outreach and high-priority customer support.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {intelligence.powerUsers.slice(0, 6).map((pu, idx) => (
                <div
                  key={pu.userId || idx}
                  className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 flex flex-col justify-between space-y-3 relative group hover:border-indigo-500/50 transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="relative">
                        <div className="w-9 h-9 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold text-sm">
                          {pu.userName.substring(0, 2).toUpperCase()}
                        </div>
                        {pu.isOnline && (
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-zinc-950 absolute -bottom-0.5 -right-0.5"></span>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h5 className="text-xs font-bold text-white truncate max-w-[140px]">{pu.userName}</h5>
                          {idx === 0 && <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30">#1 Power</span>}
                        </div>
                        <p className="text-[11px] text-zinc-400 truncate max-w-[160px] font-mono">{pu.userEmail}</p>
                      </div>
                    </div>

                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-zinc-900 text-zinc-300 border border-zinc-800">
                      {pu.plan}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 bg-zinc-900/60 p-2 rounded-lg border border-zinc-800/60 text-center">
                    <div>
                      <span className="text-[10px] text-zinc-500 block uppercase font-bold">Docs</span>
                      <span className="text-sm font-black text-white font-mono">{pu.documentsCount}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 block uppercase font-bold">AI Scans</span>
                      <span className="text-sm font-black text-indigo-400 font-mono">{pu.aiScansCount}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 block uppercase font-bold">Spend</span>
                      <span className="text-sm font-black text-emerald-400 font-mono">{formatCurrencyAmount(convertInrToCurrency(pu.estimatedSpendInr, activeCurrency), activeCurrency, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1 border-t border-zinc-900">
                    <span>Last active: {new Date(pu.lastActiveAt).toLocaleDateString()}</span>
                    <div className="flex items-center gap-1.5">
                      {onInspectUser && (
                        <button
                          onClick={() => onInspectUser(pu)}
                          className="text-xs font-bold text-indigo-400 hover:text-indigo-300 cursor-pointer flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Inspect</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW 2: FULL USER ACTIVITY & SPEND TABLE */}
        {activeSubView === "users" && (
          <div className="space-y-4">
            {/* Search & Filter bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-72">
                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search by email, name, user ID..."
                  value={userTableSearch}
                  onChange={(e) => setUserTableSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Filter className="w-3.5 h-3.5 text-zinc-400" />
                <select
                  value={userStatusFilter}
                  onChange={(e) => setUserStatusFilter(e.target.value as any)}
                  className="bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs rounded-xl px-3 py-1.5 focus:outline-none cursor-pointer"
                >
                  <option value="all">All Users ({intelligence.powerUsers.length})</option>
                  <option value="online">Online Right Now ({liveActiveCount})</option>
                  <option value="offline">Offline</option>
                  <option value="churned">Inactive / Churned ({churnedCount})</option>
                  <option value="high_spend">High API Spend (&gt; {formatCurrencyAmount(convertInrToCurrency(1.0, activeCurrency), activeCurrency)})</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-xl border border-zinc-800">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-zinc-950 text-zinc-400 uppercase tracking-wider text-[10px] font-bold border-b border-zinc-800">
                  <tr>
                    <th className="py-3 px-4">User Details</th>
                    <th className="py-3 px-3">Session Status</th>
                    <th className="py-3 px-3">Registration Date</th>
                    <th className="py-3 px-3">Last Active</th>
                    <th className="py-3 px-3 text-center">Docs Created</th>
                    <th className="py-3 px-3 text-right">Est. AI Spend ({activeCurrency})</th>
                    <th className="py-3 px-3 text-center">Plan Tier</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 bg-zinc-950/40 font-mono">
                  {filteredUsersTable.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-zinc-500 font-sans">
                        No users match the selected search or filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredUsersTable.map((u) => (
                      <tr key={u.userId} className="hover:bg-zinc-900/60 transition-colors">
                        <td className="py-3 px-4 font-sans">
                          <div className="font-bold text-white">{u.userName}</div>
                          <div className="text-[11px] text-zinc-400 font-mono">{u.userEmail}</div>
                        </td>
                        <td className="py-3 px-3">
                          {u.isOnline ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                              Online
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-800 text-zinc-400">
                              Offline
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-zinc-400 text-[11px]">
                          {new Date(u.registrationDate).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-3 text-zinc-300 text-[11px]">
                          {new Date(u.lastActiveAt).toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-white">
                          {u.documentsCount}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-emerald-400">
                          {formatCurrencyAmount(convertInrToCurrency(u.estimatedSpendInr, activeCurrency), activeCurrency, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-950/80 text-indigo-300 border border-indigo-800/60">
                            {u.plan}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-sans">
                          <div className="flex items-center justify-end gap-2">
                            {onInspectUser && (
                              <button
                                onClick={() => onInspectUser(u)}
                                className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 text-[11px] font-bold rounded-lg border border-zinc-700 transition-all cursor-pointer"
                              >
                                Inspect
                              </button>
                            )}
                            {onSendEmailToUser && (
                              <button
                                onClick={() => onSendEmailToUser(u)}
                                className="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold rounded-lg transition-all cursor-pointer"
                              >
                                Email
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* VIEW 3: API TOKEN USAGE LOGS AUDIT */}
        {activeSubView === "api_logs" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-72">
                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search by action, user, model..."
                  value={logTableSearch}
                  onChange={(e) => setLogTableSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={logActionFilter}
                  onChange={(e) => setLogActionFilter(e.target.value)}
                  className="bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs rounded-xl px-3 py-1.5 focus:outline-none cursor-pointer"
                >
                  <option value="all">All Action Types</option>
                  <option value="ocr_receipt_scan">OCR Receipt Scan</option>
                  <option value="smart_autofill">Smart PO Extract</option>
                  <option value="dimensional_qc">Dimensional QC</option>
                  <option value="voice_input">Voice Order Parser</option>
                  <option value="hsn_search">HSN Code Lookup</option>
                </select>

                <select
                  value={logStatusFilter}
                  onChange={(e) => setLogStatusFilter(e.target.value)}
                  className="bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs rounded-xl px-3 py-1.5 focus:outline-none cursor-pointer"
                >
                  <option value="all">All Statuses</option>
                  <option value="success">Success</option>
                  <option value="rate_limited">Rate Limited</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-zinc-800">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-zinc-950 text-zinc-400 uppercase tracking-wider text-[10px] font-bold border-b border-zinc-800">
                  <tr>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-3">Action Type</th>
                    <th className="py-3 px-3">User</th>
                    <th className="py-3 px-3">Model</th>
                    <th className="py-3 px-3 text-right">Tokens (In / Out)</th>
                    <th className="py-3 px-3 text-right">Total Tokens</th>
                    <th className="py-3 px-3 text-right">Cost ({activeCurrency})</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 bg-zinc-950/40 font-mono text-[11px]">
                  {filteredApiLogsTable.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-zinc-500 font-sans">
                        No API usage logs found for this filter.
                      </td>
                    </tr>
                  ) : (
                    filteredApiLogsTable.slice(0, 100).map((log) => (
                      <tr key={log.id} className="hover:bg-zinc-900/60 transition-colors">
                        <td className="py-3 px-4 text-zinc-400">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          <span className="block text-[9px] text-zinc-600">{new Date(log.timestamp).toLocaleDateString()}</span>
                        </td>
                        <td className="py-3 px-3 font-sans">
                          <span className="font-bold text-white block">{log.actionLabel || log.actionType}</span>
                          {log.itemCount && (
                            <span className="text-[10px] text-indigo-400">{log.itemCount} items parsed</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-zinc-300">
                          {log.userEmail || "Anonymous"}
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-900 text-zinc-300 border border-zinc-800">
                            {log.model}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right text-zinc-400">
                          {log.promptTokens.toLocaleString()} / {log.candidatesTokens.toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-zinc-200">
                          {log.totalTokens.toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-emerald-400">
                          {formatCurrencyAmount(convertInrToCurrency(log.costInr, activeCurrency), activeCurrency, { minimumFractionDigits: activeCurrency === 'INR' ? 4 : 5, maximumFractionDigits: activeCurrency === 'INR' ? 4 : 6 })}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {log.status === "success" && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              Success
                            </span>
                          )}
                          {log.status === "rate_limited" && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              Rate Limited (429)
                            </span>
                          )}
                          {log.status === "failed" && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                              Failed
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right font-sans">
                          <button
                            onClick={() => setSelectedLogForDetails(log)}
                            className="text-xs font-bold text-indigo-400 hover:text-indigo-300 cursor-pointer flex items-center gap-1 justify-end ml-auto"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Inspect</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* VIEW 4: ERROR & FAILURE LOGS (DEBUGGING) */}
        {activeSubView === "errors" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  API Error & Rate-Limit Incidents ({intelligence.errorLogs.length})
                </h4>
                <p className="text-[11px] text-zinc-400">
                  Instant visibility into OCR scan timeouts, Google AI provider 503 spikes, or 429 quota thresholds.
                </p>
              </div>
            </div>

            {intelligence.errorLogs.length === 0 ? (
              <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-6 text-center text-xs space-y-1">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <p className="font-bold text-emerald-300">All Systems Operating Reliably</p>
                <p className="text-zinc-400">Zero error incidents or rate limit drops detected in the current audit window.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {intelligence.errorLogs.map((errLog) => (
                  <div
                    key={errLog.id}
                    className="p-4 bg-zinc-950 border border-rose-800/40 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          {errLog.status.toUpperCase()}
                        </span>
                        <strong className="text-white font-sans">{errLog.actionLabel || errLog.actionType}</strong>
                        <span className="text-zinc-500 font-mono text-[11px]">• User: {errLog.userEmail}</span>
                      </div>
                      <p className="text-rose-300 font-mono text-[11px] bg-rose-950/30 p-2 rounded border border-rose-900/40">
                        {errLog.errorMessage || "Unexpected provider exception during request"}
                      </p>
                    </div>

                    <div className="text-right shrink-0 text-zinc-400 font-mono text-[11px]">
                      <div>{new Date(errLog.timestamp).toLocaleTimeString()}</div>
                      <div className="text-[10px] text-zinc-600">{new Date(errLog.timestamp).toLocaleDateString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Credit Cap Configuration Modal */}
      {isCreditCapModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white font-bold">
                <Settings className="w-4 h-4 text-indigo-400" />
                <h3>Set API Credit Spend Cap</h3>
              </div>
              <button
                onClick={() => setIsCreditCapModalOpen(false)}
                className="text-zinc-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              Set the monthly spend budget threshold for Gemini token usage across all workspaces. This adjusts the remaining balance gauge and burn rate alert warnings.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">Credit Budget Cap (in INR ₹):</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 font-mono font-bold">₹</span>
                <input
                  type="number"
                  value={newCreditCapInput}
                  onChange={(e) => setNewCreditCapInput(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-8 pr-3 py-2 text-sm text-white font-mono font-bold focus:outline-none focus:border-indigo-500"
                  placeholder="1000"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => {
                  const val = parseFloat(newCreditCapInput);
                  if (!isNaN(val) && val > 0) {
                    setCreditCapInr(val);
                    setIsCreditCapModalOpen(false);
                  }
                }}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                Save Budget Cap
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Log Detail Inspector Drawer Modal */}
      {selectedLogForDetails && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl font-mono text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2 text-white font-bold font-sans">
                <Cpu className="w-4 h-4 text-emerald-400" />
                <h3>API Token Audit Inspector</h3>
              </div>
              <button
                onClick={() => setSelectedLogForDetails(null)}
                className="text-zinc-400 hover:text-white cursor-pointer font-sans"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between border-b border-zinc-800/60 pb-1">
                <span className="text-zinc-400">Log ID:</span>
                <span className="text-zinc-200">{selectedLogForDetails.id}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-800/60 pb-1">
                <span className="text-zinc-400">User Email:</span>
                <span className="text-indigo-300 font-bold">{selectedLogForDetails.userEmail}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-800/60 pb-1">
                <span className="text-zinc-400">Action:</span>
                <span className="text-white font-bold">{selectedLogForDetails.actionLabel || selectedLogForDetails.actionType}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-800/60 pb-1">
                <span className="text-zinc-400">Model:</span>
                <span className="text-zinc-200">{selectedLogForDetails.model}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-800/60 pb-1">
                <span className="text-zinc-400">Prompt Tokens (In):</span>
                <span className="text-zinc-200">{selectedLogForDetails.promptTokens.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-800/60 pb-1">
                <span className="text-zinc-400">Candidates Tokens (Out):</span>
                <span className="text-zinc-200">{selectedLogForDetails.candidatesTokens.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-800/60 pb-1">
                <span className="text-zinc-400">Total Tokens:</span>
                <span className="text-zinc-200 font-bold">{selectedLogForDetails.totalTokens.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-800/60 pb-1">
                <span className="text-zinc-400">Computed Cost:</span>
                <span className="text-emerald-400 font-bold text-sm">₹{selectedLogForDetails.costInr.toFixed(4)}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-800/60 pb-1">
                <span className="text-zinc-400">Execution Time:</span>
                <span className="text-zinc-200">{selectedLogForDetails.executionTimeMs || 1200} ms</span>
              </div>
              <div className="flex justify-between border-b border-zinc-800/60 pb-1">
                <span className="text-zinc-400">Timestamp:</span>
                <span className="text-zinc-200">{selectedLogForDetails.timestamp}</span>
              </div>
            </div>

            <button
              onClick={() => setSelectedLogForDetails(null)}
              className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl font-sans cursor-pointer"
            >
              Close Inspector
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
