import React, { useState, useEffect, useRef } from "react";
import { History, X, ChevronDown, Clock } from "lucide-react";
import { getReferenceHistory, saveReferenceValue, removeReferenceValue, getActiveUserId } from "../utils/referenceHistory";

interface HistoryInputProps {
  label?: string;
  value: string;
  onChange: (val: string) => void;
  historyKey: string;
  defaultOptions?: string[];
  placeholder?: string;
  error?: string;
  type?: string;
  className?: string;
  multiline?: boolean;
  userId?: string;
}

export const HistoryInput: React.FC<HistoryInputProps> = ({
  label,
  value,
  onChange,
  historyKey,
  defaultOptions = [],
  placeholder,
  error,
  type = "text",
  className = "",
  multiline = false,
  userId,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [historyList, setHistoryList] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeUserId = getActiveUserId(userId) || undefined;

  // Load history list whenever historyKey changes or on mount or activeUserId changes
  useEffect(() => {
    if (!activeUserId) {
      setHistoryList([]);
      return;
    }
    const list = getReferenceHistory(historyKey, defaultOptions, activeUserId);
    setHistoryList(list);
  }, [historyKey, activeUserId]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleFocus = () => {
    if (!activeUserId) return;
    const updated = getReferenceHistory(historyKey, defaultOptions, activeUserId);
    setHistoryList(updated);
    if (updated.length > 0) {
      setIsOpen(true);
    }
  };

  const handleBlur = () => {
    if (activeUserId && value && value.trim()) {
      saveReferenceValue(historyKey, value, activeUserId);
      const updated = getReferenceHistory(historyKey, defaultOptions, activeUserId);
      setHistoryList(updated);
    }
  };

  const handleSelect = (selectedVal: string) => {
    onChange(selectedVal);
    if (activeUserId) {
      saveReferenceValue(historyKey, selectedVal, activeUserId);
    }
    setIsOpen(false);
  };

  const handleRemove = (e: React.MouseEvent, itemToRemove: string) => {
    e.stopPropagation();
    if (!activeUserId) return;
    const updated = removeReferenceValue(historyKey, itemToRemove, activeUserId);
    setHistoryList(updated);
  };

  // Filter history list based on what user typed
  const filteredList = historyList.filter((item) =>
    (item || "").toLowerCase().includes((value || "").toLowerCase().trim())
  );

  return (
    <div ref={containerRef} className="w-full relative">
      {label && (
        <label className="block text-xs font-semibold text-zinc-500 uppercase mb-1">
          {label}
        </label>
      )}

      <div className="relative group">
        {multiline ? (
          <textarea
            value={value || ""}
            onChange={(e) => {
              onChange(e.target.value);
              setIsOpen(true);
            }}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder}
            rows={2}
            autoComplete="off"
            className={`w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-sm font-bold text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 placeholder:text-zinc-400 font-normal transition-all pr-8 ${
              error ? "border-red-500 focus:ring-red-500/10" : ""
            } ${className}`}
          />
        ) : (
          <input
            type={type}
            value={value || ""}
            onChange={(e) => {
              onChange(e.target.value);
              setIsOpen(true);
            }}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder}
            autoComplete="off"
            className={`w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-sm font-bold text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 placeholder:text-zinc-400 font-normal transition-all pr-8 ${
              error ? "border-red-500 focus:ring-red-500/10" : ""
            } ${className}`}
          />
        )}

        {/* Indicator Icon for Dropdown History */}
        {historyList.length > 0 && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setIsOpen(!isOpen)}
            className={`absolute right-2.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors p-1 cursor-pointer ${
              multiline ? "top-2.5" : "top-1/2 -translate-y-1/2"
            }`}
            title="Toggle history options"
          >
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
          </button>
        )}
      </div>

      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}

      {/* Custom Remembered History Dropdown */}
      {isOpen && filteredList.length > 0 && (
        <div className="absolute z-50 left-0 right-0 w-full mt-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-800 animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800/80 flex items-center justify-between text-[10px] font-bold text-zinc-400 dark:text-zinc-400 uppercase tracking-wider sticky top-0 z-10 border-b border-zinc-100 dark:border-zinc-800 select-none">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-brand-500" />
              <span>Remembered History</span>
            </span>
            <span>{filteredList.length} saved</span>
          </div>

          <div className="max-h-48 overflow-y-auto">
            {filteredList.map((item, idx) => (
              <div
                key={`${item}-${idx}`}
                onClick={() => handleSelect(item)}
                className="group flex items-center justify-between px-3 py-2 text-xs font-medium text-zinc-800 dark:text-zinc-200 hover:bg-gray-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
              >
                <span className="truncate pr-2">{item}</span>
                <button
                  type="button"
                  onClick={(e) => handleRemove(e, item)}
                  className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-red-500 p-0.5 rounded transition-all cursor-pointer"
                  title="Remove from history"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
