import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  Users, 
  Clock, 
  Search, 
  Filter, 
  RefreshCw, 
  ChevronDown, 
  ChevronUp, 
  Terminal, 
  Check, 
  Zap, 
  ShieldAlert, 
  ShieldCheck, 
  Bug,
  FileCode,
  ExternalLink,
  Trash2
} from "lucide-react";
import { AppErrorLog, getRelativeTimeString } from "../services/errorMonitorService";

interface SystemHealthDashboardProps {
  errorLogs: AppErrorLog[];
  onResolveError: (logId: string) => Promise<void>;
  onClearAllLogs?: () => Promise<void>;
  onTriggerTestError?: () => Promise<void>;
}

export const SystemHealthDashboard: React.FC<SystemHealthDashboardProps> = ({
  errorLogs,
  onResolveError,
  onClearAllLogs,
  onTriggerTestError
}) => {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "resolved">("all");
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [resolvingIds, setResolvingIds] = useState<Record<string, boolean>>({});
  const [testErrorLoading, setTestErrorLoading] = useState<boolean>(false);
  const [testErrorSuccess, setTestErrorSuccess] = useState<boolean>(false);
  const [clearingLogs, setClearingLogs] = useState<boolean>(false);


  // Derived real-time metrics
  const activeErrors = useMemo(() => {
    return errorLogs.filter(e => e.status === "active");
  }, [errorLogs]);

  const activeErrorsCount = activeErrors.length;
  const resolvedErrorsCount = errorLogs.filter(e => e.status === "resolved").length;

  const affectedUsersSet = useMemo(() => {
    const set = new Set<string>();
    activeErrors.forEach(e => {
      if (e.affectedUserEmail) set.add(e.affectedUserEmail);
      else if (e.userId) set.add(e.userId);
    });
    return set;
  }, [activeErrors]);

  const affectedUsersCount = affectedUsersSet.size;
  const isSystemNormal = activeErrorsCount === 0;

  // Grouping duplicate active errors
  const groupedActiveErrors = useMemo(() => {
    const map = new Map<string, { log: AppErrorLog; totalOccurrences: number; users: Set<string> }>();
    activeErrors.forEach(log => {
      const key = log.errorSummary || log.rawError;
      if (!map.has(key)) {
        map.set(key, {
          log,
          totalOccurrences: log.occurrenceCount || 1,
          users: new Set([log.affectedUserEmail || log.userId])
        });
      } else {
        const item = map.get(key)!;
        item.totalOccurrences += (log.occurrenceCount || 1);
        item.users.add(log.affectedUserEmail || log.userId);
      }
    });
    return Array.from(map.values());
  }, [activeErrors]);

  // Filtered logs for the table
  const filteredLogs = useMemo(() => {
    return errorLogs.filter(log => {
      // Status filter
      if (statusFilter === "active" && log.status !== "active") return false;
      if (statusFilter === "resolved" && log.status !== "resolved") return false;

      // Search filter
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      return (
        log.errorSummary.toLowerCase().includes(term) ||
        log.rawError.toLowerCase().includes(term) ||
        (log.affectedUserEmail && log.affectedUserEmail.toLowerCase().includes(term)) ||
        (log.pageRoute && log.pageRoute.toLowerCase().includes(term)) ||
        (log.action && log.action.toLowerCase().includes(term))
      );
    });
  }, [errorLogs, statusFilter, searchTerm]);

  const handleResolve = async (logId: string) => {
    setResolvingIds(prev => ({ ...prev, [logId]: true }));
    try {
      await onResolveError(logId);
    } finally {
      setResolvingIds(prev => ({ ...prev, [logId]: false }));
    }
  };

  const handleTestError = async () => {
    if (!onTriggerTestError) return;
    setTestErrorLoading(true);
    setTestErrorSuccess(false);
    try {
      await onTriggerTestError();
      setTestErrorSuccess(true);
      setTimeout(() => setTestErrorSuccess(false), 3000);
    } finally {
      setTestErrorLoading(false);
    }
  };

  const handleClearAll = async () => {
    if (!onClearAllLogs) return;
    setClearingLogs(true);
    try {
      await onClearAllLogs();
    } finally {
      setClearingLogs(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Section Header */}
      <div className="bg-zinc-950/90 border border-zinc-800 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className={`p-3 rounded-2xl border ${
            isSystemNormal 
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" 
              : "bg-red-500/10 text-red-400 border-red-500/30 animate-pulse"
          }`}>
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg font-bold text-white tracking-wide">
                Application Health & Real-Time Error Monitor
              </h2>
              {isSystemNormal ? (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" /> Healthy
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-red-500/20 text-red-300 border border-red-500/40 flex items-center gap-1 animate-pulse">
                  <ShieldAlert className="w-3 h-3 text-red-400" /> Action Needed
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Live Firestore monitoring tracking uncaught runtime exceptions, API rate limits, and UI errors.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onClearAllLogs && (
            <button
              onClick={handleClearAll}
              disabled={clearingLogs || errorLogs.length === 0}
              className="px-3.5 py-2 bg-red-950/40 hover:bg-red-900/60 text-red-200 text-xs font-bold rounded-xl border border-red-800/60 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-40"
              title="Clear and reset all active and resolved error logs"
            >
              {clearingLogs ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-red-300" />
              ) : (
                <Trash2 className="w-3.5 h-3.5 text-red-400" />
              )}
              <span>{clearingLogs ? "Clearing..." : "Clear All Logs"}</span>
            </button>
          )}

          {onTriggerTestError && (
            <button
              onClick={handleTestError}
              disabled={testErrorLoading}
              className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white text-xs font-bold rounded-xl border border-zinc-700 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              title="Generate a sample test error to verify real-time monitoring"
            >
              {testErrorLoading ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
              ) : testErrorSuccess ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Bug className="w-3.5 h-3.5 text-indigo-400" />
              )}
              <span>{testErrorSuccess ? "Test Logged!" : "+ Trigger Test Error"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Real-Time Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat Card 1: System Status */}
        <div className={`p-5 rounded-2xl border transition-all ${
          isSystemNormal
            ? "bg-emerald-950/30 border-emerald-800/60"
            : "bg-red-950/40 border-red-800/80 shadow-lg shadow-red-950/50"
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              System Status
            </span>
            {isSystemNormal ? (
              <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500" />
            ) : (
              <div className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
            )}
          </div>
          <div className="mt-3">
            <p className={`text-xl font-black ${isSystemNormal ? "text-emerald-400" : "text-red-400"}`}>
              {isSystemNormal ? "All Systems Normal" : "Action Needed"}
            </p>
            <p className="text-xs text-zinc-400 mt-1 font-medium">
              {isSystemNormal 
                ? "100% Operational • No active errors" 
                : `${activeErrorsCount} active issue${activeErrorsCount === 1 ? "" : "s"} requiring attention`
              }
            </p>
          </div>
        </div>

        {/* Stat Card 2: Active Errors Count */}
        <div className="p-5 bg-zinc-950/80 border border-zinc-800 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Active Errors
            </span>
            <AlertTriangle className={`w-4 h-4 ${activeErrorsCount > 0 ? "text-amber-400" : "text-zinc-500"}`} />
          </div>
          <div className="mt-3">
            <p className="text-2xl font-mono font-black text-white">
              {activeErrorsCount}
            </p>
            <p className="text-xs text-zinc-400 mt-1 font-medium">
              Unresolved active incidents
            </p>
          </div>
        </div>

        {/* Stat Card 3: Affected Users */}
        <div className="p-5 bg-zinc-950/80 border border-zinc-800 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Affected Users
            </span>
            <Users className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-3">
            <p className="text-2xl font-mono font-black text-indigo-300">
              {affectedUsersCount}
            </p>
            <p className="text-xs text-zinc-400 mt-1 font-medium">
              Users impacted by active errors
            </p>
          </div>
        </div>

        {/* Stat Card 4: Total Logged */}
        <div className="p-5 bg-zinc-950/80 border border-zinc-800 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Resolved / Total
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-3">
            <p className="text-2xl font-mono font-black text-zinc-200">
              {resolvedErrorsCount} <span className="text-xs font-normal text-zinc-500">/ {errorLogs.length}</span>
            </p>
            <p className="text-xs text-zinc-400 mt-1 font-medium">
              Lifetime error logs recorded
            </p>
          </div>
        </div>
      </div>

      {/* Grouped Alert Cards (if active errors exist) */}
      {groupedActiveErrors.length > 0 && (
        <div className="bg-zinc-950/90 border border-red-900/50 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
            <div className="flex items-center gap-2 text-red-400 font-bold text-xs uppercase tracking-wider">
              <Zap className="w-4 h-4 animate-bounce" />
              <span>Active Incident Groups ({groupedActiveErrors.length})</span>
            </div>
            <span className="text-[11px] text-zinc-400 font-medium">
              Grouped by error signature
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {groupedActiveErrors.map(({ log, totalOccurrences, users }, idx) => (
              <div 
                key={idx}
                className="p-3.5 bg-red-950/20 border border-red-800/40 rounded-xl flex items-start justify-between gap-3 text-xs"
              >
                <div className="space-y-1.5 min-w-0">
                  <p className="text-white font-bold text-xs leading-snug line-clamp-2">
                    {log.errorSummary}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 text-[10px] text-zinc-400">
                    <span className="px-2 py-0.5 bg-zinc-900 border border-zinc-800 rounded font-mono text-amber-300">
                      Occurred {totalOccurrences} time{totalOccurrences === 1 ? "" : "s"}
                    </span>
                    <span className="px-2 py-0.5 bg-zinc-900 border border-zinc-800 rounded font-mono text-indigo-300">
                      {users.size} Affected User{users.size === 1 ? "" : "s"}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleResolve(log.id)}
                  disabled={resolvingIds[log.id]}
                  className="px-2.5 py-1.5 bg-red-900/40 hover:bg-emerald-600 text-red-200 hover:text-white font-semibold rounded-lg border border-red-700/60 hover:border-emerald-500 transition-all text-[11px] shrink-0 cursor-pointer flex items-center gap-1"
                >
                  {resolvingIds[log.id] ? (
                    <RefreshCw className="w-3 h-3 animate-spin" />
                  ) : (
                    <Check className="w-3 h-3" />
                  )}
                  <span>Resolve</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Error Logs Table Container */}
      <div className="bg-zinc-950/80 border border-zinc-800 rounded-2xl p-5 space-y-4">
        {/* Table Controls (Search & Filters) */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-3 border-b border-zinc-800/80">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by summary, email, route..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500 font-medium"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-zinc-900 p-1 rounded-xl border border-zinc-800 text-xs w-full sm:w-auto">
            <button
              onClick={() => setStatusFilter("all")}
              className={`flex-1 sm:flex-initial py-1.5 px-3 rounded-lg font-bold transition-all text-center cursor-pointer ${
                statusFilter === "all"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              All Logs ({errorLogs.length})
            </button>
            <button
              onClick={() => setStatusFilter("active")}
              className={`flex-1 sm:flex-initial py-1.5 px-3 rounded-lg font-bold transition-all text-center cursor-pointer ${
                statusFilter === "active"
                  ? "bg-red-600 text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Active ({activeErrorsCount})
            </button>
            <button
              onClick={() => setStatusFilter("resolved")}
              className={`flex-1 sm:flex-initial py-1.5 px-3 rounded-lg font-bold transition-all text-center cursor-pointer ${
                statusFilter === "resolved"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Resolved ({resolvedErrorsCount})
            </button>
          </div>
        </div>

        {/* Logs Table */}
        <div className="overflow-x-auto rounded-xl border border-zinc-800">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-zinc-900/90 border-b border-zinc-800 text-zinc-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4 w-28">Status</th>
                <th className="py-3 px-4">Error Description (Plain English)</th>
                <th className="py-3 px-4 w-48">Affected User</th>
                <th className="py-3 px-4 w-36">Last Occurred</th>
                <th className="py-3 px-4 w-36 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 font-medium">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-zinc-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <ShieldCheck className="w-8 h-8 text-emerald-500/50" />
                      <p className="text-xs font-semibold text-zinc-400">No error logs match the selected filter</p>
                      <p className="text-[11px] text-zinc-600">Your system is operating cleanly without recorded failures.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const isActive = log.status === "active";
                  const isExpanded = expandedLogId === log.id;
                  const isResolving = !!resolvingIds[log.id];

                  return (
                    <React.Fragment key={log.id}>
                      <tr className={`hover:bg-zinc-900/50 transition-colors ${
                        isActive ? "bg-red-950/10" : "bg-transparent"
                      }`}>
                        {/* Status Badge */}
                        <td className="py-3.5 px-4 align-top">
                          {isActive ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-red-950 text-red-400 border border-red-800/80">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-950 text-emerald-400 border border-emerald-800/80">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              Fixed
                            </span>
                          )}
                        </td>

                        {/* Error Description */}
                        <td className="py-3.5 px-4 align-top space-y-1">
                          <p className="text-white font-bold text-xs leading-relaxed">
                            {log.errorSummary}
                          </p>

                          <div className="flex flex-wrap items-center gap-2 text-[10px] text-zinc-400">
                            <span className="px-2 py-0.5 bg-zinc-900 rounded border border-zinc-800 font-mono text-zinc-300">
                              Page: {log.pageRoute || "Workspace"}
                            </span>
                            <span className="px-2 py-0.5 bg-zinc-900 rounded border border-zinc-800 font-mono text-zinc-300">
                              Action: {log.action || "System"}
                            </span>
                            {log.occurrenceCount > 1 && (
                              <span className="px-2 py-0.5 bg-amber-950 text-amber-300 rounded border border-amber-800/60 font-mono font-bold">
                                Occurred {log.occurrenceCount} times
                              </span>
                            )}
                          </div>

                          <button
                            onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                            className="mt-1 text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold cursor-pointer"
                          >
                            <Terminal className="w-3 h-3" />
                            <span>{isExpanded ? "Hide Technical Details" : "View Raw Stack Trace"}</span>
                            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </button>
                        </td>

                        {/* Affected User */}
                        <td className="py-3.5 px-4 align-top">
                          <div className="space-y-0.5">
                            <p className="text-zinc-200 font-semibold truncate max-w-[180px]" title={log.affectedUserEmail}>
                              {log.affectedUserEmail || "System / Unauth"}
                            </p>
                            <p className="text-[10px] text-zinc-500 font-mono truncate max-w-[180px]">
                              ID: {log.userId || "N/A"}
                            </p>
                          </div>
                        </td>

                        {/* Last Occurred */}
                        <td className="py-3.5 px-4 align-top whitespace-nowrap">
                          <div className="flex items-center gap-1.5 text-zinc-400 text-xs">
                            <Clock className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                            <span>{getRelativeTimeString(log.timestamp)}</span>
                          </div>
                        </td>

                        {/* Action Button */}
                        <td className="py-3.5 px-4 align-top text-right whitespace-nowrap">
                          {isActive ? (
                            <button
                              onClick={() => handleResolve(log.id)}
                              disabled={isResolving}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all text-xs cursor-pointer shadow-sm flex items-center gap-1.5 ml-auto disabled:opacity-50"
                            >
                              {isResolving ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Check className="w-3.5 h-3.5" />
                              )}
                              <span>Mark as Fixed</span>
                            </button>
                          ) : (
                            <span className="text-[11px] text-emerald-400 font-bold flex items-center justify-end gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Fixed
                            </span>
                          )}
                        </td>
                      </tr>

                      {/* Expandable Technical Stack Trace Row */}
                      {isExpanded && (
                        <tr className="bg-zinc-900/90 border-b border-zinc-800">
                          <td colSpan={5} className="p-4">
                            <div className="p-3.5 bg-zinc-950 border border-zinc-800 rounded-xl space-y-2 text-xs font-mono">
                              <div className="flex items-center justify-between text-zinc-400 text-[11px] pb-1 border-b border-zinc-800">
                                <span className="font-bold uppercase tracking-wider text-amber-400">
                                  Raw Error Output & Technical Stack
                                </span>
                                <span>Log ID: {log.id}</span>
                              </div>
                              <pre className="text-zinc-300 text-[11px] leading-relaxed overflow-x-auto whitespace-pre-wrap p-2 bg-black/50 rounded-lg border border-zinc-900">
                                {log.rawError || "No raw stack trace recorded."}
                              </pre>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
