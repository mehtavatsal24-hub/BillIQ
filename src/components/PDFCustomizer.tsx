import React from "react";
import { PDFLayoutSettings } from "../types";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface PDFCustomizerProps {
  settings: PDFLayoutSettings;
  onChange: (settings: PDFLayoutSettings) => void;
}

export const PDFCustomizer: React.FC<PDFCustomizerProps> = ({ settings, onChange }) => {
  return (
    <div className="space-y-6 bg-white p-6 rounded-xl border border-zinc-200 shadow-sm">
      <div>
        <div className="space-y-3 mb-8 p-4 bg-zinc-50 rounded-xl border border-zinc-200">
          <label className="text-sm font-semibold text-zinc-800 block">
            Target Printing Paper
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => onChange({ 
                ...settings, 
                hideForPreprintedLetterhead: false,
                headerHeight: settings.headerHeight && settings.headerHeight > 0 ? settings.headerHeight : 25,
                footerHeight: settings.footerHeight && settings.footerHeight > 0 ? settings.footerHeight : 20
              })}
              className={cn(
                "p-3 rounded-lg border text-xs font-semibold transition-all text-center flex flex-col items-center justify-center min-h-[64px]",
                !settings.hideForPreprintedLetterhead
                  ? "border-emerald-600 bg-white text-emerald-800 shadow-sm ring-1 ring-emerald-500"
                  : "border-zinc-200 bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              )}
            >
              <span>Plain Paper</span>
              <span className="block text-[9px] text-zinc-500 font-normal mt-1 leading-normal">Include digital header & backgrounds</span>
            </button>
            <button
              type="button"
              onClick={() => onChange({ 
                ...settings, 
                hideForPreprintedLetterhead: true,
                headerHeight: settings.headerHeight && settings.headerHeight > 0 ? settings.headerHeight : 65,
                footerHeight: settings.footerHeight && settings.footerHeight > 0 ? settings.footerHeight : 40
              })}
              className={cn(
                "p-3 rounded-lg border text-xs font-semibold transition-all text-center flex flex-col items-center justify-center min-h-[64px]",
                settings.hideForPreprintedLetterhead
                  ? "border-emerald-600 bg-white text-emerald-800 shadow-sm ring-1 ring-emerald-500"
                  : "border-zinc-200 bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              )}
            >
              <span>Pre-printed Letterhead</span>
              <span className="block text-[9px] text-zinc-500 font-normal mt-1 leading-normal">Hide company identity, preserve gaps</span>
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-sm font-medium text-zinc-700 block mb-2">
            Letterhead Margins (mm)
          </label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] uppercase tracking-wider font-bold text-zinc-400 block mb-1">Header Height</label>
              <input 
                type="number" 
                min="0"
                max="200"
                value={settings.headerHeight && settings.headerHeight > 0 ? settings.headerHeight : (settings.hideForPreprintedLetterhead ? 65 : 25)} 
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  onChange({ ...settings, headerHeight: isNaN(val) ? 0 : val });
                }}
                className="w-full p-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none font-mono"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider font-bold text-zinc-400 block mb-1">Footer Height</label>
              <input 
                type="number" 
                min="0"
                max="200"
                value={settings.footerHeight && settings.footerHeight > 0 ? settings.footerHeight : (settings.hideForPreprintedLetterhead ? 40 : 20)} 
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  onChange({ ...settings, footerHeight: isNaN(val) ? 0 : val });
                }}
                className="w-full p-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none font-mono"
              />
            </div>
          </div>
          <p className="text-[10px] text-zinc-500 italic">
            Adjust these if your letterhead header or footer is being overlapped by content.
          </p>
        </div>
      </div>
      
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <p className="text-xs text-amber-800">
          <strong>Note:</strong> If you have uploaded a letterhead in Business Settings, 
          it will be used as the background for all pages, and the default business header will be hidden.
        </p>
      </div>
    </div>
  );
};
