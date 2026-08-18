import React, { useState, useEffect, useRef } from "react";
import { Trash2, History, Wand2, Loader2, Zap, ChevronDown, GripVertical, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Input } from "./Input";
import { Button } from "./Button";
import { LineItem, PriceHistoryItem, DocumentType, BusinessDetails } from "../types";
import { TAX_RATES, UNITS, CURRENCY_SYMBOLS } from "../constants";
import { getCountryConfig, getTaxName, getCountryTaxRates, getCurrencySymbol } from "../utils/localization";
import { ProductAutocomplete } from "./ProductAutocomplete";
import { analyzePriceAnomaly, searchAndGetHSN, estimateItemWeight, checkForLocalOrCatalogWeight, getFriendlyGeminiError } from "../services/geminiService";
import { validateHSN, validatePositiveNumber } from "../lib/validation";

interface LineItemRowProps {
  item: LineItem;
  index: number;
  onUpdate: (id: string, updates: Partial<LineItem>) => void;
  onRemove: (id: string) => void;
  priceHistory?: PriceHistoryItem[];
  docType?: DocumentType;
  isExport?: boolean;
  isTaxEnabled?: boolean;
  currency?: string;
  exchangeRate?: number;
  business?: BusinessDetails;
  customerName?: string;
  allItems: LineItem[];
  customBoxes?: string[];
  totalItemsCount?: number;
  onReorder?: (fromIndex: number, toIndex: number) => void;
}

const getManualWeightMemory = (desc: string): number | null => {
  if (!desc) return null;
  try {
    const memoryStr = localStorage.getItem("manual_weight_overrides");
    if (memoryStr) {
      const memory = JSON.parse(memoryStr);
      const val = memory[(desc || "").trim().toLowerCase()];
      if (typeof val === 'number' && val > 0) {
        return val;
      }
    }
  } catch (e) {}
  return null;
};

const saveManualWeightMemory = (desc: string, netWeight: number) => {
  if (!desc || desc.trim().length < 3 || isNaN(netWeight) || netWeight <= 0) return;
  try {
    const memoryStr = localStorage.getItem("manual_weight_overrides");
    const memory = memoryStr ? JSON.parse(memoryStr) : {};
    memory[(desc || "").trim().toLowerCase()] = netWeight;
    localStorage.setItem("manual_weight_overrides", JSON.stringify(memory));
  } catch (e) {
    console.error("Failed to save weight memory:", e);
  }
};

interface TaxRateInputProps {
  taxRate: number;
  onUpdateTaxRate: (rate: number) => void;
  disabled?: boolean;
  country?: string;
  taxLabelName: string;
}

const TaxRateInput: React.FC<TaxRateInputProps> = ({
  taxRate,
  onUpdateTaxRate,
  disabled,
  country,
  taxLabelName
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const countryCfg = getCountryConfig(country || "India");
  const countryRates = getCountryTaxRates(country || "India");

  const commonPresets = [0, 5, 6.25, 7, 8.25, 12, 18, 20, 28];
  const allSuggestions = Array.from(
    new Set([...commonPresets, countryCfg.defaultTaxRate || 0, ...countryRates])
  )
    .filter((r) => r !== undefined && r !== null && !isNaN(r))
    .sort((a, b) => a - b);

  const [inputValue, setInputValue] = useState<string>(
    taxRate !== undefined && taxRate !== null ? String(taxRate) : String(countryCfg.defaultTaxRate ?? 0)
  );

  useEffect(() => {
    const parsedCurrent = parseFloat(inputValue);
    if (isNaN(parsedCurrent) || parsedCurrent !== taxRate) {
      setInputValue(String(taxRate));
    }
  }, [taxRate]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    const parsed = parseFloat(val);
    onUpdateTaxRate(isNaN(parsed) ? 0 : parsed);
  };

  const handleSelectSuggestion = (rate: number) => {
    setInputValue(String(rate));
    onUpdateTaxRate(rate);
    setIsOpen(false);
  };

  const filteredSuggestions = inputValue.trim() === ""
    ? allSuggestions
    : allSuggestions.filter((s) => String(s).startsWith(inputValue.trim()) || String(s).includes(inputValue.trim()));

  return (
    <div className="relative" ref={containerRef}>
      <label className="block text-xs font-extrabold text-zinc-500 uppercase tracking-widest mb-1.5 ml-1 truncate">
        {taxLabelName} %
      </label>
      <div className="relative flex items-center">
        <input
          type="text"
          inputMode="decimal"
          draggable={false}
          onMouseDown={(e) => e.stopPropagation()}
          value={inputValue}
          onChange={handleChange}
          onFocus={() => setIsOpen(true)}
          disabled={disabled}
          placeholder="0"
          className="w-full pl-2.5 pr-10 py-3 bg-white border border-zinc-200 rounded-xl text-xs sm:text-sm font-semibold text-zinc-900 focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all duration-200 disabled:bg-zinc-50 disabled:text-zinc-400 select-text"
        />
        <div className="absolute right-2 flex items-center gap-1">
          <span className="text-xs font-bold text-zinc-400 pointer-events-none">%</span>
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            disabled={disabled}
            className="text-zinc-400 hover:text-zinc-600 cursor-pointer p-0.5 focus:outline-none"
            title="Toggle tax suggestions"
          >
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-50 left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white border border-zinc-200 rounded-xl shadow-xl py-1 text-xs font-semibold animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="px-3 py-1 text-[10px] uppercase font-extrabold text-zinc-400 tracking-wider border-b border-zinc-100 flex justify-between items-center">
            <span>Suggestions</span>
            <span className="text-[9px] text-zinc-400 font-normal">Click to apply</span>
          </div>
          {filteredSuggestions.length > 0 ? (
            filteredSuggestions.map((rate) => (
              <button
                key={rate}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSelectSuggestion(rate);
                }}
                className={`w-full text-left px-3 py-2 hover:bg-brand-50 hover:text-brand-700 flex items-center justify-between transition-colors cursor-pointer ${
                  parseFloat(inputValue) === rate ? "bg-brand-50/70 text-brand-700 font-bold" : "text-zinc-700"
                }`}
              >
                <span>{rate}%</span>
                {countryCfg.defaultTaxRate === rate && (
                  <span className="text-[9px] font-extrabold bg-zinc-100 text-zinc-500 px-1.5 py-0.5 rounded">Default</span>
                )}
              </button>
            ))
          ) : (
            <div className="px-3 py-2 text-zinc-400 text-center italic text-[11px]">
              Custom rate: {inputValue}%
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const LineItemRow = ({ 
  item, 
  index,
  onUpdate, 
  onRemove, 
  priceHistory = [], 
  docType,
  isExport = false,
  isTaxEnabled = !isExport,
  currency = "INR",
  exchangeRate = 1,
  business,
  customerName,
  allItems,
  customBoxes = [],
  totalItemsCount = 1,
  onReorder
}: LineItemRowProps) => {
  const [isSearchingHsn, setIsSearchingHsn] = useState(false);
  const [isCheckingPrice, setIsCheckingPrice] = useState(false);
  const [isEstimatingWeight, setIsEstimatingWeight] = useState(false);
  const [hsnSearchError, setHsnSearchError] = useState<string | null>(null);
  const [prevDescForWeight, setPrevDescForWeight] = useState(item.description || "");
  const [priceAlert, setPriceAlert] = useState<{ severity: string; message: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [isDragOver, setIsDragOver] = useState(false);
  const isQuotation = docType === DocumentType.QUOTATION;
  const isTaxVisible = isTaxEnabled;
  const isPackingList = docType === DocumentType.PACKING_LIST;
  const isCostSheet = docType === DocumentType.COST_SHEET;
  const isQA = false;
  const isDimensional = false;
  const currencySymbol = getCurrencySymbol(currency);
  
  // Internal rate is in the active currency (INR if not export, foreign if export)
  const displayRate = item.rate;
  
  const amount = item.isRegret ? 0 : item.quantity * item.rate;
  const tax = (!isTaxVisible || item.isRegret) ? 0 : (amount * item.taxRate) / 100;
  const total = amount + tax;
  
  const displayTotal = total;

  // Prioritize customer-specific history
  const customerSpecificHistory = priceHistory.filter(
    ph => ph.customerName === customerName && 
          ph.description && 
          item.description && 
          (ph.description || "").toLowerCase() === (item.description || "").toLowerCase() && 
          item.description !== ""
  );
  
  const lastQuotedForCustomer = customerSpecificHistory.length > 0 ? customerSpecificHistory[0] : null;

  const globalLastQuoted = priceHistory.find(
    ph => ph.description && 
          item.description && 
          (ph.description || "").toLowerCase() === (item.description || "").toLowerCase() && 
          item.description !== ""
  );

  const lastQuoted = lastQuotedForCustomer || globalLastQuoted;
  const isCustomerSpecific = !!lastQuotedForCustomer;

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (item.rate > 0 && item.description && item.description.length > 5) {
        setIsCheckingPrice(true);
        const alert = await analyzePriceAnomaly(item.rate, item.description, priceHistory, allItems, customerName, currency);
        setPriceAlert(alert);
        setIsCheckingPrice(false);
      } else {
        setPriceAlert(null);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [item.rate, item.description, customerName, allItems.length]);

  // 1. Resolve Weight instantly on description change from local catalog or manual memory
  useEffect(() => {
    if (!item.description || item.description.trim().length < 4) {
      return;
    }

    const hasWeight = (item.netWeight !== undefined && item.netWeight > 0) || (item.unitWeight !== undefined && item.unitWeight > 0);

    // If description has not changed, and we already have standard weight info, skip
    if (item.description === prevDescForWeight && hasWeight) {
      return;
    }

    const timer = setTimeout(() => {
      setPrevDescForWeight(item.description);
      
      // Check manual overrides memory first
      const rememberedWeight = getManualWeightMemory(item.description);
      if (rememberedWeight !== null && rememberedWeight > 0) {
        onUpdate(item.id, {
          netWeight: rememberedWeight,
          unitWeight: rememberedWeight
        });
        return;
      }

      // Check standard offline catalog
      const unitWeight = checkForLocalOrCatalogWeight(item.description);
      if (unitWeight !== null && unitWeight > 0) {
        onUpdate(item.id, { 
          netWeight: unitWeight,
          unitWeight: unitWeight
        });
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [item.description, prevDescForWeight, item.netWeight, item.unitWeight, item.qtyPacked]);

  // 3. Automatically update Gross Weight if percentage reference is active and Net Weight changes
  useEffect(() => {
    if (item.grossWeightPercent && item.netWeight) {
      const pctMatch = item.grossWeightPercent.match(/([\d.]+)\s*%/);
      if (pctMatch) {
         const percentageValue = parseFloat(pctMatch[1]) || 0;
         const computedGross = item.netWeight + (item.netWeight * percentageValue) / 100;
         const roundedGross = Math.round(computedGross * 100) / 100;
         if (roundedGross !== item.grossWeight) {
           onUpdate(item.id, { grossWeight: roundedGross });
         }
      }
    }
  }, [item.netWeight, item.grossWeightPercent, item.grossWeight]);

  const handleGrossWeightChange = (valStr: string) => {
    if (valStr.includes('%')) {
      const percentValue = parseFloat(valStr.replace('%', '').trim()) || 0;
      const net = item.netWeight || 0;
      const computedGross = net + (net * percentValue) / 100;
      const roundedGross = Math.round(computedGross * 100) / 100;
      onUpdate(item.id, { 
        grossWeight: roundedGross, 
        grossWeightPercent: valStr 
      });
    } else {
      const numValue = parseFloat(valStr) || 0;
      onUpdate(item.id, { 
        grossWeight: numValue, 
        grossWeightPercent: undefined 
      });
    }
  };

  useEffect(() => {
    // Real-time validation
    const hsnError = validateHSN(item.hsn);
    const qtyError = validatePositiveNumber(item.quantity, "Quantity");
    const rateError = item.isRegret ? undefined : validatePositiveNumber(item.rate, "Rate");
    
    setErrors({
      hsn: hsnError,
      quantity: qtyError,
      rate: rateError
    });
  }, [item.hsn, item.quantity, item.rate, item.isRegret]);

  const handleHsnSearch = async () => {
    if (!item.description || item.description.trim().length < 3) return;
    setIsSearchingHsn(true);
    setHsnSearchError(null);
    try {
      const hsnCode = await searchAndGetHSN(item.description);
      if (hsnCode) {
        onUpdate(item.id, { hsn: hsnCode });
      }
    } catch (err: any) {
      const msg = "Unable to find HSN code at this moment. Please enter manually.";
      setHsnSearchError(msg);
      console.warn("HSN Search failed action:", err);
    } finally {
      setIsSearchingHsn(false);
    }
  };

  return (
    <div 
      onDragOver={(e) => {
        if (!onReorder) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
      }}
      onDragEnter={(e) => {
        if (!onReorder) return;
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={(e) => {
        if (!onReorder) return;
        setIsDragOver(false);
      }}
      onDrop={(e) => {
        if (!onReorder) return;
        e.preventDefault();
        setIsDragOver(false);
        const fromIdxStr = e.dataTransfer.getData("text/plain");
        const fromIdx = parseInt(fromIdxStr, 10);
        if (!isNaN(fromIdx) && fromIdx !== index) {
          onReorder(fromIdx, index);
        }
      }}
      className={`grid grid-cols-12 gap-3 sm:gap-4 items-start py-4 sm:py-6 border-b border-zinc-100 last:border-0 group/row transition-all duration-300 ${
      item.isRegret ? 'bg-red-50/30' : ''
    } ${
      item.isAiEdited 
        ? 'bg-violet-50/50 border-l-4 border-l-violet-600 pl-3 sm:pl-4 my-2 rounded-r-2xl shadow-xs ring-1 ring-violet-200/80' 
        : ''
    } ${
      isDragOver ? 'bg-brand-50/80 ring-2 ring-brand-400/70 border-brand-200 rounded-xl' : ''
    }`}>
      <div className={(isQA || isDimensional) ? "col-span-12 md:col-span-7" : (isPackingList || isCostSheet ? "col-span-12 md:col-span-3" : (isTaxVisible ? "col-span-12 md:col-span-3" : "col-span-12 md:col-span-4"))}>
        <div className="relative group">
          <div className="flex items-center gap-1.5 mb-1.5 ml-1">
            {onReorder && (
              <div 
                draggable={true}
                onDragStart={(e) => {
                  e.dataTransfer.setData("text/plain", index.toString());
                  e.dataTransfer.effectAllowed = "move";
                }}
                className="flex items-center text-zinc-300 group-hover/row:text-zinc-600 cursor-grab active:cursor-grabbing p-0.5 rounded hover:bg-zinc-100 transition-colors select-none"
                title="Drag to reorder line items"
              >
                <GripVertical className="w-4 h-4 shrink-0 pointer-events-none" />
              </div>
            )}
            <span className={`flex items-center justify-center min-w-6 h-5 px-1.5 rounded-md text-[10px] font-black transition-all ${
              item.isAiEdited 
                ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white border border-violet-400 shadow-xs shadow-violet-500/30 ring-2 ring-violet-400/40 animate-pulse" 
                : "bg-zinc-100 text-zinc-500 border border-zinc-200"
            }`}>
              {index + 1}
            </span>

            {onReorder && totalItemsCount > 1 && (
              <div className="flex items-center gap-0.5 ml-0.5">
                <button
                  type="button"
                  onClick={() => index > 0 && onReorder(index, index - 1)}
                  disabled={index === 0}
                  className="p-0.5 text-zinc-400 hover:text-zinc-800 disabled:opacity-20 disabled:hover:text-zinc-400 rounded hover:bg-zinc-100 transition-all cursor-pointer"
                  title="Move Item Up"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => index < totalItemsCount - 1 && onReorder(index, index + 1)}
                  disabled={index >= totalItemsCount - 1}
                  className="p-0.5 text-zinc-400 hover:text-zinc-800 disabled:opacity-20 disabled:hover:text-zinc-400 rounded hover:bg-zinc-100 transition-all cursor-pointer"
                  title="Move Item Down"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {item.isAiEdited && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-violet-600 text-white text-[9.5px] font-black uppercase tracking-wider shadow-xs animate-in fade-in zoom-in duration-300">
                <Wand2 className="w-2.5 h-2.5 text-yellow-300 shrink-0" /> Modified
              </span>
            )}
            <label className="block text-xs font-extrabold text-zinc-500 uppercase tracking-widest">Description</label>
          </div>
          <ProductAutocomplete
            value={item.description}
            onChange={(val) => onUpdate(item.id, { description: val })}
            onSelect={(suggestion) => onUpdate(item.id, { 
              description: suggestion.description,
              rate: suggestion.rate,
              hsn: suggestion.hsn || item.hsn
            })}
            priceHistory={priceHistory}
            placeholder="Product name..."
            customerName={customerName}
          />
        </div>
      </div>

      {isDimensional ? (
        <>
          <div className="col-span-12 md:col-span-4">
             <div className="flex items-center justify-start h-full pt-7 ml-4">
                <label className="flex items-center gap-3 cursor-pointer group/regret px-4 py-2 bg-white border border-zinc-200 rounded-xl hover:border-red-200 hover:bg-red-50/50 transition-all duration-200">
                  <input 
                    type="checkbox" 
                    draggable={false}
                    onMouseDown={(e) => e.stopPropagation()}
                    checked={item.isRegret ?? false}
                    onChange={(e) => onUpdate(item.id, { isRegret: e.target.checked })}
                    className="w-4 h-4 rounded border-zinc-300 text-red-600 focus:ring-red-500 transition-colors"
                  />
                  <div className="flex flex-col">
                    <span className={`text-xs font-black uppercase tracking-widest transition-colors ${item.isRegret ? 'text-red-600' : 'text-zinc-500 group-hover/regret:text-zinc-700'}`}>Regret Option</span>
                    <span className="text-[9px] font-bold text-zinc-400 leading-none">Excludes from technical scope if checked</span>
                  </div>
                </label>
             </div>
          </div>
        </>
      ) : isQA ? (
        <>
          <div className="col-span-3 md:col-span-1">
            <Input
              label="Qty"
              type="number"
              value={item.quantity === 0 ? "" : item.quantity}
              onChange={(e) => onUpdate(item.id, { quantity: parseFloat(e.target.value) || 0 })}
            />
          </div>
        </>
      ) : isPackingList ? (
        <>
          <div className="col-span-4 md:col-span-1">
            <Input
              label="Pkd Qty"
              type="number"
              value={item.qtyPacked !== undefined ? (item.qtyPacked === 0 ? "" : item.qtyPacked) : (item.quantity === 0 ? "" : item.quantity)}
              onChange={(e) => onUpdate(item.id, { qtyPacked: parseFloat(e.target.value) || 0 })}
              placeholder="Packed"
            />
          </div>
          <div className="col-span-4 md:col-span-2 relative">
            <div className="flex justify-between items-center mb-1.5 ml-1">
              <label className="block text-xs font-extrabold text-zinc-500 uppercase tracking-widest">
                Net Wt (Kgs)
              </label>
              {item.description && item.description.trim().length >= 4 && (
                <button
                  type="button"
                  title="Estimate weight using AI"
                  disabled={isEstimatingWeight}
                  onClick={async () => {
                    setIsEstimatingWeight(true);
                    try {
                      const unitWeight = await estimateItemWeight(item.description);
                      if (unitWeight !== null && unitWeight > 0) {
                        onUpdate(item.id, { 
                          netWeight: unitWeight,
                          unitWeight: unitWeight
                        });
                      }
                    } catch (err) {
                      console.error("Manual weight estimation failed:", err);
                    } finally {
                      setIsEstimatingWeight(false);
                    }
                  }}
                  className="text-brand-600 hover:text-brand-800 transition-colors disabled:opacity-40"
                >
                  <Zap className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <Input
              type="number"
              value={item.netWeight === undefined || item.netWeight === 0 ? "" : item.netWeight}
              onChange={(e) => {
                const val = parseFloat(e.target.value) || 0;
                onUpdate(item.id, { netWeight: val, unitWeight: undefined });
                if (val > 0) {
                  saveManualWeightMemory(item.description, val);
                }
              }}
              placeholder="Net Wt"
            />
            {isEstimatingWeight && (
              <span className="absolute -bottom-4 left-1 text-[8px] font-bold text-brand-600 animate-pulse flex items-center gap-1">
                <Loader2 className="w-2 h-2 animate-spin" /> Estimating...
              </span>
            )}
            {!isEstimatingWeight && item.unitWeight && (
              <span className="absolute -bottom-4 left-1 text-[8px] font-bold text-zinc-400">
                1pc = {item.unitWeight} kg
              </span>
            )}
          </div>
          <div className="col-span-4 md:col-span-2 relative">
            <div className="flex justify-between items-center mb-1.5 ml-1">
              <label className="block text-xs font-extrabold text-zinc-500 uppercase tracking-widest">
                Gross Wt (Kgs)
              </label>
            </div>
            <Input
              type="text"
              value={item.grossWeight === undefined || item.grossWeight === 0 ? "" : String(item.grossWeight)}
              onChange={(e) => handleGrossWeightChange(e.target.value)}
              placeholder="e.g. 6000 or 20%"
            />
            {item.grossWeightPercent && (
              <span className="absolute -bottom-4 left-1 text-[8px] font-bold text-emerald-600">
                ({item.grossWeightPercent.includes('%') ? item.grossWeightPercent : `${item.grossWeightPercent}%`})
              </span>
            )}
          </div>
          <div className="col-span-12 md:col-span-3">
            <Input
              label="Packaging / Box No."
              value={item.boxNo || ""}
              onChange={(e) => onUpdate(item.id, { boxNo: e.target.value })}
              placeholder="e.g. Box 1-5"
              list={`box-suggestions-${item.id}`}
            />
            <datalist id={`box-suggestions-${item.id}`}>
              {/* Dynamic existing boxes from other items, custom manual boxes, and core defaults */}
              {Array.from(new Set([
                "Box 1",
                "Box 2",
                "Box 3",
                "Box 4",
                "Box 5",
                "Box 1-5",
                "Box 6-10",
                "Box 11-15",
                "Box 16-20",
                "Pallet 1",
                "Pallet 2",
                "Bundle 1",
                "Wooden Case",
                ...customBoxes,
                ...allItems.map(i => (i.boxNo || "").trim()).filter(Boolean)
              ]))
                .filter(box => (box || "").toLowerCase() !== "unspecified")
                .map(box => (
                  <option key={box} value={box} />
                ))}
            </datalist>
          </div>
        </>
      ) : isCostSheet ? (
        <>
          <div className="col-span-3 md:col-span-1">
            <Input
              label="Qty"
              type="number"
              step="any"
              value={item.quantity === 0 ? "" : item.quantity}
              onChange={(e) => {
                const val = parseFloat(e.target.value) || 0;
                onUpdate(item.id, { quantity: val });
              }}
              disabled={item.isRegret}
            />
          </div>
          <div className="col-span-3 md:col-span-1">
            <label className="block text-xs font-extrabold text-zinc-500 uppercase tracking-widest mb-1.5 ml-1">Unit</label>
            <select
              draggable={false}
              onMouseDown={(e) => e.stopPropagation()}
              className="w-full px-3 py-3 bg-white border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all duration-200 select-text"
              value={item.unit ?? "NOS"}
              onChange={(e) => onUpdate(item.id, { unit: e.target.value })}
              disabled={item.isRegret}
            >
              {Array.from(new Set([...UNITS, item.unit].filter(Boolean))).map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </select>
          </div>
          <div className="col-span-6 md:col-span-2">
            <Input
              label="Raw Material Cost"
              prefix={currencySymbol}
              type="number"
              step="any"
              value={item.rawMaterialCost === undefined || item.rawMaterialCost === 0 ? "" : item.rawMaterialCost}
              onChange={(e) => {
                const raw = parseFloat(e.target.value) || 0;
                const lab = item.laborCost || 0;
                const ovh = item.overheadCost || 0;
                const est = raw + lab + ovh;
                onUpdate(item.id, { rawMaterialCost: raw, estimatedUnitCost: est, rate: est });
              }}
              placeholder="0.00"
              disabled={item.isRegret}
            />
          </div>
          <div className="col-span-6 md:col-span-2">
            <Input
              label="Labor / Process"
              prefix={currencySymbol}
              type="number"
              step="any"
              value={item.laborCost === undefined || item.laborCost === 0 ? "" : item.laborCost}
              onChange={(e) => {
                const raw = item.rawMaterialCost || 0;
                const lab = parseFloat(e.target.value) || 0;
                const ovh = item.overheadCost || 0;
                const est = raw + lab + ovh;
                onUpdate(item.id, { laborCost: lab, estimatedUnitCost: est, rate: est });
              }}
              placeholder="0.00"
              disabled={item.isRegret}
            />
          </div>
          <div className="col-span-6 md:col-span-1">
            <Input
              label="Overhead"
              prefix={currencySymbol}
              type="number"
              step="any"
              value={item.overheadCost === undefined || item.overheadCost === 0 ? "" : item.overheadCost}
              onChange={(e) => {
                const raw = item.rawMaterialCost || 0;
                const lab = item.laborCost || 0;
                const ovh = parseFloat(e.target.value) || 0;
                const est = raw + lab + ovh;
                onUpdate(item.id, { overheadCost: ovh, estimatedUnitCost: est, rate: est });
              }}
              placeholder="0.00"
              disabled={item.isRegret}
            />
          </div>
          <div className="col-span-6 md:col-span-2 text-right">
            <p className="text-xs font-extrabold text-zinc-500 uppercase tracking-widest mb-1.5">Est. Unit / Total</p>
            <div className="h-11 flex flex-col justify-center items-end pr-1">
              <span className="text-xs font-bold text-zinc-600">
                {currencySymbol}{((item.rawMaterialCost || 0) + (item.laborCost || 0) + (item.overheadCost || 0)).toFixed(2)} / {item.unit || "NOS"}
              </span>
              <span className="text-sm font-black text-zinc-900">
                {currencySymbol}{((item.quantity || 0) * ((item.rawMaterialCost || 0) + (item.laborCost || 0) + (item.overheadCost || 0))).toLocaleString(currency === 'INR' ? 'en-IN' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="col-span-4 md:col-span-1">
            <div className="relative group">
              <Input
                label="HSN"
                value={item.hsn}
                onChange={(e) => onUpdate(item.id, { hsn: e.target.value })}
                placeholder="HSN"
                disabled={item.isRegret}
                error={errors.hsn}
              />
              {item.description && item.description.trim().length >= 3 && !item.isRegret && (
                <button
                  type="button"
                  onClick={handleHsnSearch}
                  disabled={isSearchingHsn}
                  className="mt-1 flex items-center gap-1 text-[10px] font-bold text-brand-600 hover:text-brand-800 transition-colors disabled:opacity-50 select-none cursor-pointer"
                  title="Search accurate HSN from Google via AI"
                >
                  {isSearchingHsn ? (
                    <>
                      <Loader2 className="h-2.5 w-2.5 animate-spin text-brand-500" />
                      <span>Searching...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="h-2.5 w-2.5 text-brand-500" />
                      <span>AI HSN Code</span>
                    </>
                  )}
                </button>
              )}
              {hsnSearchError && (
                <div className="mt-1 text-[9px] font-medium text-red-600 leading-tight bg-red-50 p-1.5 rounded-md border border-red-100">
                  {hsnSearchError}
                </div>
              )}
            </div>
          </div>
          <div className="col-span-4 md:col-span-1 relative">
            <Input
              label="Qty"
              type="number"
              step="any"
              value={item.quantity === 0 ? "" : item.quantity}
              onChange={(e) => {
                const val = parseFloat(e.target.value) || 0;
                onUpdate(item.id, { quantity: Math.round(val * 100) / 100 });
              }}
              disabled={item.isRegret}
              error={errors.quantity}
            />
          </div>
          <div className="col-span-4 md:col-span-1">
            <label className="block text-xs font-extrabold text-zinc-500 uppercase tracking-widest mb-1.5 ml-1">Unit</label>
            <select
              draggable={false}
              onMouseDown={(e) => e.stopPropagation()}
              className="w-full px-2.5 py-3 bg-white border border-zinc-200 rounded-xl text-xs sm:text-sm font-semibold text-zinc-800 focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all duration-200 disabled:bg-zinc-50 disabled:text-zinc-400 select-text cursor-pointer"
              value={item.unit ?? "NOS"}
              onChange={(e) => onUpdate(item.id, { unit: e.target.value })}
              disabled={item.isRegret}
            >
              {Array.from(new Set([...UNITS, item.unit].filter(Boolean))).map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </select>
          </div>
          <div className={!isTaxVisible ? "col-span-7 md:col-span-3" : "col-span-6 md:col-span-2"}>
            <div className="flex items-center justify-between mb-1.5 ml-1">
              <label className="block text-xs font-extrabold text-zinc-500 uppercase tracking-widest">Rate</label>
              <label className="flex items-center gap-1.5 cursor-pointer group/regret">
                <input 
                  type="checkbox" 
                  draggable={false}
                  onMouseDown={(e) => e.stopPropagation()}
                  checked={item.isRegret ?? false}
                  onChange={(e) => onUpdate(item.id, { isRegret: e.target.checked })}
                  className="w-3 h-3 rounded border-zinc-300 text-red-600 focus:ring-red-500 transition-colors"
                />
                <span className={`text-[10px] font-bold uppercase tracking-wider transition-colors ${item.isRegret ? 'text-red-600' : 'text-zinc-400 group-hover/regret:text-zinc-600'}`}>Regret</span>
              </label>
            </div>
            <div className="relative">
              <Input
                prefix={currencySymbol}
                type="number"
                step="any"
                value={item.isRegret ? "" : (displayRate === 0 ? "" : Math.round(displayRate * 100) / 100)}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0;
                  onUpdate(item.id, { rate: Math.round(val * 100) / 100 });
                }}
                disabled={item.isRegret}
                placeholder={item.isRegret ? "REGRET" : "0.00"}
                error={errors.rate}
              />
              
              <AnimatePresence>
                {priceAlert && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 10 }}
                    className={`absolute -bottom-10 left-0 right-0 z-10 px-2 py-1 rounded shadow-lg flex items-center gap-2 border text-[9px] font-bold uppercase tracking-wider ${
                      priceAlert.severity === 'high' ? 'bg-red-50 border-red-200 text-red-600' :
                      priceAlert.severity === 'medium' ? 'bg-amber-50 border-amber-200 text-amber-600' :
                      'bg-blue-50 border-blue-200 text-blue-600'
                    }`}
                  >
                    <Zap className="h-3 w-3 shrink-0" />
                    <span className="truncate">{priceAlert.message}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {isCheckingPrice && (
                <div className="absolute top-7 right-3">
                  <Loader2 className="h-3 w-3 animate-spin text-brand-500" />
                </div>
              )}
            </div>
            {!item.isRegret && lastQuoted && item.rate !== lastQuoted.rate && (
              <button 
                onClick={() => onUpdate(item.id, { rate: lastQuoted.rate })}
                className={`flex items-center gap-1 mt-1.5 ml-1 text-[10px] font-bold transition-colors ${isCustomerSpecific ? 'text-blue-600 hover:text-blue-800' : 'text-brand-600 hover:text-brand-800'}`}
              >
                <History className="h-3 w-3" />
                {isCustomerSpecific ? "Client Last: " : "Last: "}
                {currencySymbol}{lastQuoted.rate.toFixed(2)}
              </button>
            )}
          </div>
          {isTaxVisible && (() => {
            const countryCfg = getCountryConfig(business?.country || "India");
            const taxLabelName = getTaxName(business?.country || "India");

            return (
              <div className="col-span-6 md:col-span-1">
                <TaxRateInput
                  taxRate={item.taxRate ?? countryCfg.defaultTaxRate ?? 0}
                  onUpdateTaxRate={(rate) => onUpdate(item.id, { taxRate: rate })}
                  disabled={item.isRegret}
                  country={business?.country || "India"}
                  taxLabelName={taxLabelName}
                />
              </div>
            );
          })()}
          <div className={!isTaxVisible ? "col-span-6 md:col-span-2 text-right" : "col-span-6 md:col-span-2 text-right"}>
            <p className="text-xs font-extrabold text-zinc-500 uppercase tracking-widest mb-1.5">Total</p>
            <p className={`text-sm font-black h-11 flex items-center justify-end whitespace-nowrap overflow-hidden text-ellipsis ${item.isRegret ? 'text-red-600' : 'text-zinc-900'}`}>
              {item.isRegret ? (
                "REGRET"
              ) : (
                <>
                  {currencySymbol}
                  {displayTotal.toLocaleString(currency === 'INR' ? 'en-IN' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </>
              )}
            </p>
          </div>
        </>
      )}
      <div className="col-span-12 md:col-span-1 flex justify-end md:pt-7 border-t md:border-t-0 border-zinc-50 pt-2 mt-2 md:mt-0">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => onRemove(item.id)} 
          className="text-red-400 hover:bg-red-50 hover:text-red-600 rounded-xl md:opacity-0 group-hover/row:opacity-100 transition-opacity w-full md:w-auto justify-center"
        >
          <Trash2 className="h-4 w-4 mr-2 md:mr-0" />
          <span className="md:hidden font-bold text-xs uppercase tracking-widest">Remove Item</span>
        </Button>
      </div>
    </div>
  );
};
