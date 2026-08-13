import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  Wand2, 
  TrendingUp, 
  Trash2, 
  Zap,
  ArrowUpRight
} from 'lucide-react';

const FULL_PROMPT = "Increase rate by +10% on lines 2, 5 & 7, delete 6th line item, remove 'Dried' from all descriptions";

interface LineItem {
  id: number;
  lineNo: number;
  originalName: string;
  updatedName: string;
  hsn: string;
  qty: number;
  originalRate: number;
  updatedRate: number;
  isRateIncreased: boolean;
  isDeleted: boolean;
}

const INITIAL_ITEMS: LineItem[] = [
  { id: 1, lineNo: 1, originalName: "Raw Almonds", updatedName: "Raw Almonds", hsn: "080211", qty: 10, originalRate: 750, updatedRate: 750, isRateIncreased: false, isDeleted: false },
  { id: 2, lineNo: 2, originalName: "Dried Apricots", updatedName: "Apricots", hsn: "081310", qty: 20, originalRate: 400, updatedRate: 440, isRateIncreased: true, isDeleted: false },
  { id: 3, lineNo: 3, originalName: "Cashew Nuts", updatedName: "Cashew Nuts", hsn: "080131", qty: 15, originalRate: 900, updatedRate: 900, isRateIncreased: false, isDeleted: false },
  { id: 4, lineNo: 4, originalName: "Pistachios", updatedName: "Pistachios", hsn: "080251", qty: 5, originalRate: 1200, updatedRate: 1200, isRateIncreased: false, isDeleted: false },
  { id: 5, lineNo: 5, originalName: "Dried Figs", updatedName: "Figs", hsn: "080420", qty: 10, originalRate: 800, updatedRate: 880, isRateIncreased: true, isDeleted: false },
  { id: 6, lineNo: 6, originalName: "Dried Raisins", updatedName: "Dried Raisins", hsn: "080620", qty: 25, originalRate: 300, updatedRate: 300, isRateIncreased: false, isDeleted: true },
  { id: 7, lineNo: 7, originalName: "Dried Cranberries", updatedName: "Cranberries", hsn: "081340", qty: 12, originalRate: 500, updatedRate: 550, isRateIncreased: true, isDeleted: false },
];

export const BatchEditorShowcase: React.FC = () => {
  const [typedText, setTypedText] = useState("");
  const [phase, setPhase] = useState<'typing' | 'trigger' | 'processing' | 'modifying' | 'success'>('typing');

  useEffect(() => {
    let charIndex = 0;
    let typingInterval: NodeJS.Timeout;
    let phaseTimeout: NodeJS.Timeout;

    if (phase === 'typing') {
      setTypedText("");
      typingInterval = setInterval(() => {
        if (charIndex < FULL_PROMPT.length) {
          setTypedText(FULL_PROMPT.slice(0, charIndex + 1));
          charIndex++;
        } else {
          clearInterval(typingInterval);
          // Wait 400ms then move to trigger (button click)
          phaseTimeout = setTimeout(() => setPhase('trigger'), 400);
        }
      }, 22);
    } else if (phase === 'trigger') {
      // Button click press animation (200ms) then processing
      phaseTimeout = setTimeout(() => setPhase('processing'), 250);
    } else if (phase === 'processing') {
      // Processing pulse for 1.2s then modifying
      phaseTimeout = setTimeout(() => setPhase('modifying'), 1200);
    } else if (phase === 'modifying') {
      // Live row modifications for 1.8s then success
      phaseTimeout = setTimeout(() => setPhase('success'), 1800);
    } else if (phase === 'success') {
      // Show success summary for 3.6s then loop back to typing
      phaseTimeout = setTimeout(() => setPhase('typing'), 3600);
    }

    return () => {
      clearInterval(typingInterval);
      clearTimeout(phaseTimeout);
    };
  }, [phase]);

  // Calculate Subtotals
  const isModified = phase === 'modifying' || phase === 'success';
  
  const currentTotal = INITIAL_ITEMS.reduce((sum, item) => {
    if (isModified) {
      if (item.isDeleted) return sum;
      return sum + (item.qty * item.updatedRate);
    } else {
      return sum + (item.qty * item.originalRate);
    }
  }, 0);

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 sm:p-4 mb-6 relative overflow-hidden shadow-inner group-hover:border-indigo-200 transition-all min-h-[265px] flex flex-col justify-between">
      {/* Top Header Step Indicator */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200 text-[10px] font-mono">
        <div className="flex items-center gap-1.5 font-bold text-slate-800">
          <Wand2 className="w-3.5 h-3.5 text-indigo-600" />
          <span>Batch & Bulk Line Item Assistant</span>
        </div>
        
        {/* Status Badge */}
        <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold transition-all shadow-sm ${
          phase === 'typing' ? 'bg-slate-200 text-slate-700' :
          phase === 'trigger' || phase === 'processing' ? 'bg-indigo-100 text-indigo-700 border border-indigo-300 animate-pulse' :
          phase === 'modifying' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
          'bg-emerald-100 text-emerald-800 border border-emerald-300'
        }`}>
          {phase === 'typing' && "User Typing Prompt..."}
          {(phase === 'trigger' || phase === 'processing') && "Processing Commands..."}
          {phase === 'modifying' && "Applying Batch Edits..."}
          {phase === 'success' && "3 Operations Applied"}
        </span>
      </div>

      {/* Smart Assistant Input Box with Animated Typing Effect */}
      <div className="mb-2.5">
        <div className={`bg-white border rounded-xl p-2 flex items-center justify-between gap-1.5 shadow-sm transition-all ${
          phase === 'trigger' ? 'border-indigo-500 ring-2 ring-indigo-200 scale-[0.99]' :
          phase === 'processing' ? 'border-indigo-400 bg-indigo-50/30' :
          phase === 'success' ? 'border-emerald-300 bg-emerald-50/20' :
          'border-slate-200'
        }`}>
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <Zap className={`w-3.5 h-3.5 shrink-0 ${phase === 'processing' ? 'text-indigo-600 animate-pulse' : 'text-indigo-500'}`} />
            <div className="text-[10px] text-slate-800 font-mono font-semibold truncate leading-tight">
              {typedText}
              {phase === 'typing' && <span className="animate-pulse font-bold text-indigo-600 ml-0.5">|</span>}
            </div>
          </div>

          <button className={`px-2.5 py-1 rounded-lg font-black text-[9px] shrink-0 transition-all flex items-center gap-1 ${
            phase === 'trigger' ? 'bg-indigo-700 text-white scale-95 shadow-inner' :
            phase === 'processing' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30 animate-pulse' :
            phase === 'success' ? 'bg-emerald-600 text-white shadow-sm' :
            'bg-indigo-600 text-white hover:bg-indigo-700'
          }`}>
            {phase === 'processing' ? (
              <span>EXECUTING...</span>
            ) : phase === 'success' ? (
              <>
                <CheckCircle2 className="w-3 h-3" />
                <span>DONE</span>
              </>
            ) : (
              <>
                <Zap className="w-3 h-3" />
                <span>APPLY</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Mini Line Item Preview Table */}
      <div className="bg-white border border-slate-200 rounded-xl p-2 shadow-sm flex-1 flex flex-col justify-between overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[9px] font-mono">
            <thead>
              <tr className="text-slate-400 font-extrabold border-b border-slate-200 text-[8px] uppercase tracking-wider">
                <th className="pb-1 pr-1 font-sans"># ITEM</th>
                <th className="pb-1 pr-1">HSN</th>
                <th className="pb-1 pr-1 text-center">QTY</th>
                <th className="pb-1 pr-1 text-right">RATE</th>
                <th className="pb-1 text-right">TOTAL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[8.5px]">
              {INITIAL_ITEMS.map((item) => {
                const showRowModified = isModified;
                const isDeleted = showRowModified && item.isDeleted;
                const isRateIncreased = showRowModified && item.isRateIncreased;
                const displayName = showRowModified ? item.updatedName : item.originalName;
                const displayRate = showRowModified ? item.updatedRate : item.originalRate;
                const rowTotal = item.qty * displayRate;

                if (isDeleted && phase === 'success') {
                  // Completely hidden in success state
                  return null;
                }

                return (
                  <tr 
                    key={item.id}
                    className={`transition-all duration-500 ${
                      isDeleted ? 'bg-rose-50 text-rose-400 line-through opacity-40 scale-95' :
                      isRateIncreased ? 'bg-emerald-50/80 text-slate-900 font-bold' :
                      'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <td className="py-0.5 pr-1 font-sans font-bold truncate max-w-[85px] flex items-center gap-1">
                      <span className="text-slate-400 font-mono text-[8px]">{item.lineNo}.</span>
                      <span className={isDeleted ? 'line-through text-rose-500' : 'text-slate-900'}>{displayName}</span>
                    </td>
                    <td className="py-0.5 pr-1 text-slate-500">{item.hsn}</td>
                    <td className="py-0.5 pr-1 text-center text-slate-600">{item.qty}</td>
                    <td className="py-0.5 pr-1 text-right">
                      <span className="font-mono">₹{displayRate}</span>
                      {isRateIncreased && (
                        <span className="ml-1 text-[7.5px] px-1 py-0.2 rounded bg-emerald-100 text-emerald-800 font-bold font-sans inline-block">
                          +10%
                        </span>
                      )}
                    </td>
                    <td className="py-0.5 text-right font-black font-mono text-slate-900">
                      {isDeleted ? <span className="text-rose-500">REMOVED</span> : `₹${rowTotal.toLocaleString('en-IN')}`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Subtotal & Action Badges */}
        <div className="pt-1.5 border-t border-slate-200 flex items-center justify-between text-[9.5px]">
          <div className="flex items-center gap-1">
            {phase === 'success' ? (
              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[9px] flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> +10% Rates • Row #6 Deleted • Text Cleaned
              </span>
            ) : (
              <span className="text-slate-500 font-medium text-[9px]">
                {phase === 'processing' ? 'Calculating new batch rates...' : '7 Active Line Items'}
              </span>
            )}
          </div>

          <div className="text-right font-mono font-black text-slate-900 text-[10px]">
            <span className="text-[8.5px] text-slate-400 font-normal mr-1">SUBTOTAL:</span>
            ₹{currentTotal.toLocaleString('en-IN')}
          </div>
        </div>
      </div>
    </div>
  );
};
