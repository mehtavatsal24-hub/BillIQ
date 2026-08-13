import React, { useState, useEffect } from 'react';
import { 
  UploadCloud, 
  ScanText, 
  Zap,
  CheckCircle2, 
  FileText
} from 'lucide-react';

export const ExtractionStepShowcase: React.FC = () => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (step === 1) {
      // Step 1 (Upload): 2.8s -> Step 2
      timer = setTimeout(() => setStep(2), 2800);
    } else if (step === 2) {
      // Step 2 (AI Extraction): 2.4s -> Step 3
      timer = setTimeout(() => setStep(3), 2400);
    } else if (step === 3) {
      // Step 3 (Line Item Population): 3.2s -> Step 4
      timer = setTimeout(() => setStep(4), 3200);
    } else if (step === 4) {
      // Step 4 (Success Badge): 3.6s -> Loop back to Step 1
      timer = setTimeout(() => setStep(1), 3600);
    }

    return () => clearTimeout(timer);
  }, [step]);

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 sm:p-4 mb-6 relative overflow-hidden shadow-inner group-hover:border-blue-200 transition-all min-h-[265px] flex flex-col justify-between">
      {/* Top Header Step Indicator */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200 text-[10px] font-mono">
        <div className="flex items-center gap-1.5 font-bold text-slate-700">
          <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
          <span>BillIQ AI Ingestion</span>
        </div>
        
        {/* Step Badge */}
        <div className="flex items-center gap-1">
          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black font-sans transition-all shadow-sm ${
            step === 1 ? 'bg-blue-100 text-blue-700 border border-blue-300' :
            step === 2 ? 'bg-indigo-100 text-indigo-700 border border-indigo-300' :
            step === 3 ? 'bg-purple-100 text-purple-700 border border-purple-300' :
            'bg-emerald-100 text-emerald-800 border border-emerald-300'
          }`}>
            {step === 1 && "1. Upload & OCR"}
            {step === 2 && "2. AI Extraction"}
            {step === 3 && "3. Populating Rows"}
            {step === 4 && "4. Data Extracted"}
          </span>
        </div>
      </div>

      {/* Main Animated Step Content Container */}
      <div className="flex-1 flex flex-col justify-center relative my-1">
        {/* STEP 1: Upload & OCR Scanning */}
        {step === 1 && (
          <div className="border-2 border-dashed border-blue-400/80 rounded-xl p-3 bg-blue-50/40 relative overflow-hidden flex flex-col items-center justify-center text-center space-y-2.5 py-6 transition-all duration-300 min-h-[180px]">
            {/* Pulsing Scanning OCR Laser Beam */}
            <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent shadow-[0_0_10px_#3b82f6] animate-laser-scan pointer-events-none" />

            {/* Dropping Document Preview Card */}
            <div className="animate-bounce bg-white border border-blue-300 rounded-xl p-2.5 shadow-md flex items-center gap-2.5 max-w-[210px] w-full">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shrink-0 font-bold text-[10px]">
                PDF
              </div>
              <div className="text-left truncate">
                <div className="text-[11px] font-bold text-slate-900 truncate">Tax_Invoice_081.pdf</div>
                <div className="text-[9px] text-blue-600 font-mono font-semibold">Scanning OCR Beam...</div>
              </div>
            </div>

            <div className="text-[10px] font-bold text-slate-500 font-mono pt-1 flex items-center gap-1">
              <UploadCloud className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
              <span>Dropping into Upload Zone</span>
            </div>
          </div>
        )}

        {/* STEP 2: AI Extraction Loading */}
        {step === 2 && (
          <div className="border border-blue-300 rounded-xl p-4 bg-gradient-to-br from-blue-50/80 to-indigo-50/80 relative flex flex-col items-center justify-center text-center space-y-3 py-6 shadow-inner transition-all duration-300 min-h-[180px]">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/30">
                <ScanText className="w-5 h-5 animate-pulse" />
              </div>
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
              </span>
            </div>

            <div>
              <div className="text-xs font-black text-slate-900">Extracting line items & HSN codes...</div>
              <p className="text-[10px] text-slate-500 mt-0.5">Matching vendor data, quantities, rates & GST</p>
            </div>

            {/* Progress Bar */}
            <div className="w-full max-w-[180px] bg-slate-200 h-1.5 rounded-full overflow-hidden">
              <div className="bg-blue-600 h-full rounded-full animate-pulse w-3/4 transition-all duration-500" />
            </div>
          </div>
        )}

        {/* STEP 3 & STEP 4: Line Item Table Population & Success */}
        {(step === 3 || step === 4) && (
          <div className="border border-slate-200 rounded-xl p-2.5 bg-white space-y-2 relative shadow-sm transition-all duration-300 min-h-[180px] flex flex-col justify-between">
            {/* Header Badge in Step 4 vs Step 3 */}
            {step === 4 ? (
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-black flex items-center gap-1 shadow-sm">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Data Extracted Successfully
                </span>
                <span className="text-[10px] font-mono text-slate-500 font-bold">INV-2026/081</span>
              </div>
            ) : (
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 text-[10px] font-bold">
                <span className="flex items-center gap-1 text-blue-600 animate-pulse">
                  <Zap className="w-3.5 h-3.5" /> Populating Line Items...
                </span>
                <span className="text-slate-400 font-mono">Live Table</span>
              </div>
            )}

            {/* Replica of BillIQ Line Item Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-[9px] font-mono">
                <thead>
                  <tr className="text-slate-400 font-extrabold border-b border-slate-200 text-[8px] uppercase tracking-wider">
                    <th className="pb-1 pr-1 font-sans">DESCRIPTION</th>
                    <th className="pb-1 pr-1">HSN</th>
                    <th className="pb-1 pr-1 text-center">QTY</th>
                    <th className="pb-1 pr-1 text-center">UNIT</th>
                    <th className="pb-1 pr-1 text-right">RATE</th>
                    <th className="pb-1 pr-1 text-center">GST %</th>
                    <th className="pb-1 text-right">TOTAL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[9px]">
                  <tr className="bg-blue-50/50 hover:bg-blue-50 transition-colors">
                    <td className="py-1 pr-1 font-sans font-bold text-slate-900 truncate max-w-[75px]">Fresh Apples</td>
                    <td className="py-1 pr-1 text-slate-600">08081C</td>
                    <td className="py-1 pr-1 text-center text-slate-700">10</td>
                    <td className="py-1 pr-1 text-center text-slate-500">NOS</td>
                    <td className="py-1 pr-1 text-right text-slate-800">₹6,000</td>
                    <td className="py-1 pr-1 text-center text-blue-700 font-bold">18%</td>
                    <td className="py-1 text-right font-black text-slate-900">₹60,000</td>
                  </tr>
                  <tr className="bg-indigo-50/50 hover:bg-indigo-50 transition-colors">
                    <td className="py-1 pr-1 font-sans font-bold text-slate-900 truncate max-w-[75px]">Valencia Oranges</td>
                    <td className="py-1 pr-1 text-slate-600">08051C</td>
                    <td className="py-1 pr-1 text-center text-slate-700">20</td>
                    <td className="py-1 pr-1 text-center text-slate-500">NOS</td>
                    <td className="py-1 pr-1 text-right text-slate-800">₹1,700</td>
                    <td className="py-1 pr-1 text-center text-blue-700 font-bold">18%</td>
                    <td className="py-1 text-right font-black text-slate-900">₹34,000</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Totals Row */}
            <div className="pt-1.5 border-t border-slate-200 flex items-center justify-between text-[10px]">
              <span className="text-slate-500 font-semibold text-[9px]">SUBTOTAL: ₹94,000</span>
              <span className="text-emerald-700 font-black font-mono bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                ₹94,000 + GST
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Step Progress Dots at Bottom */}
      <div className="flex items-center justify-center gap-1.5 pt-1.5">
        <span className={`h-1.5 rounded-full transition-all duration-300 ${step === 1 ? 'w-6 bg-blue-600' : 'w-1.5 bg-slate-300'}`} />
        <span className={`h-1.5 rounded-full transition-all duration-300 ${step === 2 ? 'w-6 bg-indigo-600' : 'w-1.5 bg-slate-300'}`} />
        <span className={`h-1.5 rounded-full transition-all duration-300 ${step === 3 ? 'w-6 bg-purple-600' : 'w-1.5 bg-slate-300'}`} />
        <span className={`h-1.5 rounded-full transition-all duration-300 ${step === 4 ? 'w-6 bg-emerald-600' : 'w-1.5 bg-slate-300'}`} />
      </div>
    </div>
  );
};
