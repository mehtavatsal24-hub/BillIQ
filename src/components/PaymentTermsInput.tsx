import React, { useState, useEffect } from "react";
import { Calendar, Clock } from "lucide-react";
import { calculateDueDate } from "../utils/dateUtils";

interface PaymentTermsInputProps {
  label?: string;
  value: string;
  onChange: (val: string) => void;
  invoiceDate?: string;
  className?: string;
}

const PRESETS = [
  "Due on Receipt",
  "100% Advance",
  "Immediate Payment",
  "50% Advance / 50% Against Delivery",
  "7 Days",
  "15 Days",
  "30 Days",
  "45 Days",
  "60 Days",
  "90 Days",
];

export const PaymentTermsInput: React.FC<PaymentTermsInputProps> = ({
  label = "Payment Terms",
  value = "",
  onChange,
  invoiceDate,
  className = "",
}) => {
  const [customNum, setCustomNum] = useState<string>("");
  const [customUnit, setCustomUnit] = useState<"Days" | "Months" | "Years">("Days");

  // Sync internal custom duration state when `value` prop changes
  useEffect(() => {
    if (!value) {
      setCustomNum("");
      return;
    }

    const trimmed = value.trim();

    // Try matching Years
    const yearMatch = trimmed.match(/^(\d+)\s*(year|yr)s?$/i);
    if (yearMatch) {
      setCustomNum(yearMatch[1]);
      setCustomUnit("Years");
      return;
    }

    // Try matching Months
    const monthMatch = trimmed.match(/^(\d+)\s*(month|mon|mth)s?$/i);
    if (monthMatch) {
      setCustomNum(monthMatch[1]);
      setCustomUnit("Months");
      return;
    }

    // Try matching Days
    const dayMatch = trimmed.match(/^(\d+)\s*(day|d)s?$/i) || trimmed.match(/^(\d+)$/);
    if (dayMatch) {
      setCustomNum(dayMatch[1]);
      setCustomUnit("Days");
      return;
    }

    // If it's a standard preset like "Due on Receipt", clear custom num
    if (PRESETS.includes(trimmed)) {
      // Check if preset itself is X Days
      const presetDayMatch = trimmed.match(/^(\d+)\s*Days$/i);
      if (presetDayMatch) {
        setCustomNum(presetDayMatch[1]);
        setCustomUnit("Days");
      } else {
        setCustomNum("");
      }
    }
  }, [value]);

  const handlePresetSelect = (presetVal: string) => {
    if (presetVal === "CUSTOM") {
      // Focus/trigger custom duration formatting
      if (customNum) {
        formatAndEmitCustom(customNum, customUnit);
      } else {
        formatAndEmitCustom("30", "Days");
      }
      return;
    }

    onChange(presetVal);
  };

  const formatAndEmitCustom = (numStr: string, unit: "Days" | "Months" | "Years") => {
    const num = parseInt(numStr, 10);
    if (isNaN(num) || num <= 0) {
      onChange("");
      return;
    }

    let unitLabel = unit;
    if (num === 1) {
      if (unit === "Days") unitLabel = "Days"; // keep Days or Day, e.g., "1 Day" or "1 Days"
      if (unit === "Months") unitLabel = "Months";
      if (unit === "Years") unitLabel = "Years";
    }

    // Format string: e.g. "3 Days", "1 Month", "2 Years"
    const formatted = `${num} ${unit === "Days" && num === 1 ? "Day" : unit === "Months" && num === 1 ? "Month" : unit === "Years" && num === 1 ? "Year" : unit}`;
    onChange(formatted);
  };

  const handleNumChange = (newNumStr: string) => {
    setCustomNum(newNumStr);
    formatAndEmitCustom(newNumStr, customUnit);
  };

  const handleUnitChange = (newUnit: "Days" | "Months" | "Years") => {
    setCustomUnit(newUnit);
    formatAndEmitCustom(customNum || "30", newUnit);
  };

  // Determine current preset selection for <select>
  const currentPreset = PRESETS.includes(value) ? value : "CUSTOM";

  // Calculate live due date preview if invoiceDate is provided
  const computedDueDate = invoiceDate ? calculateDueDate(invoiceDate, value, "Tax Invoice") : null;
  const formattedDueDateStr = computedDueDate
    ? computedDueDate.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : null;

  return (
    <div className={`w-full space-y-1.5 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-zinc-500 uppercase">
          {label}
        </label>
        {formattedDueDateStr && (
          <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md flex items-center gap-1 border border-indigo-100">
            <Calendar className="w-3 h-3 text-indigo-500" /> Due: {formattedDueDateStr}
          </span>
        )}
      </div>

      <div className="space-y-2">
        {/* Preset Selector Dropdown */}
        <div className="relative">
          <select
            value={currentPreset}
            onChange={(e) => handlePresetSelect(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-white border border-zinc-200 rounded-xl shadow-2xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-zinc-800 font-medium cursor-pointer"
          >
            <optgroup label="Standard Presets">
              {PRESETS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </optgroup>
            <option value="CUSTOM">Custom Duration (Days / Months / Years)...</option>
          </select>
        </div>

        {/* Custom Duration Controls (Number Input + Unit Dropdown) */}
        <div className="p-2.5 bg-zinc-50/80 rounded-xl border border-zinc-200/80 flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="number"
                min="1"
                max="999"
                placeholder="Number (e.g. 3, 7, 15, 30)"
                value={customNum}
                onChange={(e) => handleNumChange(e.target.value)}
                className="w-full px-3 py-1.5 text-sm bg-white border border-zinc-300 rounded-lg shadow-2xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-zinc-900 font-semibold"
              />
            </div>
            <select
              value={customUnit}
              onChange={(e) => handleUnitChange(e.target.value as "Days" | "Months" | "Years")}
              className="px-3 py-1.5 text-sm bg-white border border-zinc-300 rounded-lg shadow-2xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-zinc-800 font-semibold cursor-pointer"
            >
              <option value="Days">Days</option>
              <option value="Months">Months</option>
              <option value="Years">Years</option>
            </select>
          </div>
          {value && (
            <div className="hidden sm:block text-xs font-bold text-zinc-600 bg-white px-2.5 py-1.5 rounded-lg border border-zinc-200 whitespace-nowrap">
              Active: <span className="text-indigo-600">{value}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
