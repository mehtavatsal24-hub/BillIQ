import React, { useState, useEffect } from 'react';
import { Logo } from './Logo';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileCheck, 
  ArrowLeft, 
  Camera, 
  UploadCloud, 
  Zap, 
  CheckCircle2, 
  Layers, 
  Globe, 
  FileText, 
  Download, 
  Truck, 
  ShieldCheck, 
  Database, 
  Lock, 
  RefreshCw, 
  Check, 
  ArrowRight,
  Sliders,
  DollarSign,
  Clock,
  ChevronRight,
  Shield,
  Table,
  Box,
  MapPin,
  Anchor,
  FileSpreadsheet,
  HardDrive
} from 'lucide-react';
import { ExtractionStepShowcase } from './ExtractionStepShowcase';
import { BatchEditorShowcase } from './BatchEditorShowcase';

interface FeaturesPageProps {
  onBackToHome: () => void;
  onSignIn?: () => void;
  onSignUp?: () => void;
  onEnterDemo?: () => void;
  isLoggedIn?: boolean;
}

export const FeaturesPage: React.FC<FeaturesPageProps> = ({
  onBackToHome,
  onSignIn,
  onSignUp,
  onEnterDemo,
  isLoggedIn = false
}) => {
  // Section 1: Ingestion Mode (Scanner vs Camera)
  const [ingestMode, setIngestMode] = useState<'scanner' | 'camera'>('camera');
  const [isCameraFlashing, setIsCameraFlashing] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState(false);

  // Section 4: Multi-Currency Billing Currency State
  const [selectedCurrency, setSelectedCurrency] = useState<'USD' | 'EUR' | 'INR' | 'GBP' | 'AED'>('USD');
  const rates = {
    USD: 1,
    EUR: 0.92,
    INR: 83.25,
    GBP: 0.79,
    AED: 3.67
  };

  // Section 5: Global Export Document Type Tabs
  const [exportDocTab, setExportDocTab] = useState<'invoice' | 'shipping' | 'packing' | 'declaration'>('invoice');

  // Section 6: Incoterm Selector
  const [selectedIncoterm, setSelectedIncoterm] = useState<'FOB' | 'CIF' | 'DDP' | 'EXW' | 'FCA'>('CIF');

  // Section 7: Export Progress Simulator
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportComplete, setExportComplete] = useState(false);

  const handleTriggerExport = () => {
    setIsExporting(true);
    setExportProgress(0);
    setExportComplete(false);

    let current = 0;
    const interval = setInterval(() => {
      current += 20;
      setExportProgress(current);
      if (current >= 100) {
        clearInterval(interval);
        setIsExporting(false);
        setExportComplete(true);
      }
    }, 250);
  };

  const triggerSnapPhoto = () => {
    setIsCameraFlashing(true);
    setTimeout(() => {
      setIsCameraFlashing(false);
      setCapturedPhoto(true);
    }, 300);
  };

  return (
    <div className="w-full min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-blue-600 selection:text-white pb-24">
      {/* ---------------- STICKY NAVBAR ---------------- */}
      <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-sm transition-all">
        <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 h-20 flex items-center justify-between gap-4">
          {/* Left: Back to Home + Logo */}
          <div className="flex items-center gap-4">
            <button
              onClick={onBackToHome}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm border border-slate-200 transition-all cursor-pointer group"
            >
              <ArrowLeft className="w-4 h-4 text-slate-500 group-hover:-translate-x-1 transition-transform" />
              <span>Back to Home</span>
            </button>

            <div className="h-6 w-px bg-slate-200 hidden sm:block" />

            <Logo size="md" variant="dark" subtitleText="Global Billing & Invoicing" />
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <button
                onClick={onEnterDemo}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-500/20 transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>Go to Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <>
                {onSignIn && (
                  <button
                    onClick={onSignIn}
                    className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-slate-700 hover:text-blue-600 hover:bg-slate-100 border border-slate-200 transition-all cursor-pointer"
                  >
                    Sign In
                  </button>
                )}
                {onSignUp && (
                  <button
                    onClick={onSignUp}
                    className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-500/20 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <span>Get Started Free</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </header>

      {/* ---------------- HERO HEADER ---------------- */}
      <section className="relative py-12 md:py-16 bg-gradient-to-b from-blue-50/80 via-white to-slate-50 border-b border-slate-200/80 overflow-hidden">
        <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 text-center relative z-10">
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200 text-xs font-extrabold uppercase tracking-widest mb-4">
            <Zap className="w-3.5 h-3.5 text-blue-600" /> Full Platform Capabilities
          </span>
          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight max-w-4xl mx-auto mb-4">
            Smart Invoicing & Export Compliance Engine
          </h1>
          <p className="text-slate-600 text-base sm:text-lg max-w-2xl mx-auto font-medium">
            Discover the powerful features powering BillIQ — from automated camera document ingest to AI batch editing, multi-currency conversion, Incoterms 2020 auto-filling, and Export Compliance.
          </p>
        </div>
      </section>

      {/* ---------------- MAIN FEATURES CONTAINER ---------------- */}
      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 pt-12 space-y-16">

        {/* SECTION 1: Automated Ingestion & Camera Ingest */}
        <section className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-10 shadow-sm relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Description */}
            <div className="lg:col-span-5 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold uppercase tracking-wider">
                <Camera className="w-3.5 h-3.5 text-blue-600" /> Capability 01
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Automated Ingestion & Camera Snap
              </h2>
              <p className="text-slate-600 text-sm leading-relaxed font-medium">
                Snap physical receipts, tax invoices, and vendor bills directly using your phone or desktop camera. Our OCR engine auto-detects edges, corrects perspective distortion, and feeds documents instantly into the extraction laser beam.
              </p>
              
              <div className="space-y-2.5 pt-2">
                <div className="flex items-center gap-2.5 text-xs font-bold text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Real-time optical viewfinder with laser scanning grid</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs font-bold text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Auto-perspective correction & contrast enhancement</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs font-bold text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Supports PDF, JPG, PNG & high-res physical paper scans</span>
                </div>
              </div>

              {/* Mode Toggle */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => setIngestMode('camera')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                    ingestMode === 'camera'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Camera Viewfinder</span>
                </button>
                <button
                  onClick={() => setIngestMode('scanner')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                    ingestMode === 'scanner'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Document Laser Scanner</span>
                </button>
              </div>
            </div>

            {/* Right Interactive Mockup */}
            <div className="lg:col-span-7 bg-slate-900 rounded-2xl p-4 sm:p-6 text-white relative min-h-[320px] flex flex-col justify-between overflow-hidden shadow-xl border border-slate-800">
              {/* Flash overlay effect */}
              {isCameraFlashing && (
                <div className="absolute inset-0 bg-white z-50 animate-pulse pointer-events-none" />
              )}

              {ingestMode === 'camera' ? (
                <div className="relative flex-1 flex flex-col items-center justify-center p-4">
                  {/* Camera Viewfinder Box */}
                  <div className="relative w-full max-w-sm aspect-[4/3] bg-slate-950 rounded-2xl border-2 border-dashed border-blue-500/80 flex flex-col items-center justify-center p-4 overflow-hidden shadow-2xl">
                    {/* Viewfinder Corners */}
                    <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-blue-400" />
                    <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-blue-400" />
                    <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-blue-400" />
                    <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-blue-400" />

                    {/* Laser Crosshair */}
                    <div className="absolute inset-x-0 h-0.5 bg-blue-500 shadow-[0_0_12px_#3b82f6] animate-laser-scan pointer-events-none" />

                    {capturedPhoto ? (
                      <div className="text-center space-y-2 animate-fade-in">
                        <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto border border-emerald-500/40">
                          <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <div className="text-xs font-bold text-white">Receipt Snap Captured!</div>
                        <p className="text-[10px] text-slate-400 font-mono">Invoice_Snap_2026_091.jpg (1.8 MB)</p>
                        <button
                          onClick={() => setCapturedPhoto(false)}
                          className="text-[10px] text-blue-400 underline hover:text-blue-300 font-bold"
                        >
                          Retake Photo
                        </button>
                      </div>
                    ) : (
                      <div className="text-center space-y-3">
                        <FileText className="w-10 h-10 text-blue-400/60 mx-auto animate-pulse" />
                        <div className="text-xs font-bold text-slate-300">Align Receipt / Invoice inside Frame</div>
                        <button
                          onClick={triggerSnapPhoto}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-extrabold shadow-lg shadow-blue-600/40 flex items-center gap-1.5 mx-auto cursor-pointer"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          <span>SNAP PHOTO</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="relative flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
                  <div className="w-full max-w-sm border-2 border-dashed border-blue-400/80 rounded-2xl p-6 bg-slate-950/60 relative overflow-hidden">
                    <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent shadow-[0_0_10px_#3b82f6] animate-laser-scan" />
                    <UploadCloud className="w-12 h-12 text-blue-400 mx-auto mb-2 animate-bounce" />
                    <div className="text-xs font-bold text-white">Drag & Drop Bill / PDF Here</div>
                    <div className="text-[10px] text-slate-400 mt-1">Automatic laser scanning & edge detection</div>
                  </div>
                </div>
              )}

              {/* Bottom Status bar */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-[10px] font-mono text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Camera/Scanner Engine Ready
                </span>
                <span>BillIQ Optical Lens</span>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: AI Automated Data Extraction */}
        <section className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-10 shadow-sm relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Description */}
            <div className="lg:col-span-5 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold uppercase tracking-wider">
                <Zap className="w-3.5 h-3.5 text-indigo-600" /> Capability 02
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                AI Automated Data Extraction
              </h2>
              <p className="text-slate-600 text-sm leading-relaxed font-medium">
                Our fine-tuned BillIQ AI multi-modal OCR engine reads line items, quantities, HSN/SAC codes, tax percentages, and totals automatically. Say goodbye to manual typing errors.
              </p>

              <div className="space-y-2.5 pt-2">
                <div className="flex items-center gap-2.5 text-xs font-bold text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Automatic HSN/SAC code classification</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs font-bold text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Automatic vendor Tax ID (VAT/GST/EIN) & party address matching</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs font-bold text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Populates draft invoice line-item table in seconds</span>
                </div>
              </div>
            </div>

            {/* Right Showcase Component */}
            <div className="lg:col-span-7">
              <ExtractionStepShowcase />
            </div>
          </div>
        </section>

        {/* SECTION 3: Smart Batch & Bulk Line Item Editor */}
        <section className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-10 shadow-sm relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Description */}
            <div className="lg:col-span-5 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold uppercase tracking-wider">
                <Sliders className="w-3.5 h-3.5 text-blue-600" /> Capability 03
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Batch & Bulk Line Item Editor
              </h2>
              <p className="text-slate-600 text-sm leading-relaxed font-medium">
                Modify dozens of line items at once using natural language prompts. Increase unit prices by percentages, delete specific lines, or adjust tax rates across all rows effortlessly.
              </p>

              <div className="space-y-2.5 pt-2">
                <div className="flex items-center gap-2.5 text-xs font-bold text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Natural language prompt execution engine</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs font-bold text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Real-time green highlight & red strikethrough preview</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs font-bold text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Undo and single-click batch rollbacks</span>
                </div>
              </div>
            </div>

            {/* Right Showcase Component */}
            <div className="lg:col-span-7">
              <BatchEditorShowcase />
            </div>
          </div>
        </section>

        {/* SECTION 4: Multi-Currency Billing & Document History */}
        <section className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-10 shadow-sm relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Description */}
            <div className="lg:col-span-5 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold uppercase tracking-wider">
                <Globe className="w-3.5 h-3.5 text-emerald-600" /> Capability 04
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Multi-Currency & Document History
              </h2>
              <p className="text-slate-600 text-sm leading-relaxed font-medium">
                Issue invoices globally in USD, EUR, INR, GBP, or AED with live daily exchange rates. Access complete document history, print logs, and audit trails in one unified dashboard.
              </p>

              {/* Currency Selector Buttons */}
              <div className="pt-2">
                <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block mb-2">
                  Select Preview Currency:
                </label>
                <div className="flex flex-wrap gap-2">
                  {(['USD', 'EUR', 'INR', 'GBP', 'AED'] as const).map(curr => (
                    <button
                      key={curr}
                      onClick={() => setSelectedCurrency(curr)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                        selectedCurrency === curr
                          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {curr}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Mockup Table */}
            <div className="lg:col-span-7 bg-slate-50 rounded-2xl p-5 border border-slate-200/90 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold text-slate-900">Recent Document History</span>
                </div>
                <div className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                  1 {selectedCurrency} = {rates[selectedCurrency]} Rate Ref
                </div>
              </div>

              {/* Interactive Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-extrabold uppercase text-[9px] tracking-wider">
                      <th className="pb-2">Doc ID</th>
                      <th className="pb-2">Customer</th>
                      <th className="pb-2">Type</th>
                      <th className="pb-2 text-right">Amount ({selectedCurrency})</th>
                      <th className="pb-2 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/60 font-medium">
                    <tr>
                      <td className="py-2.5 font-mono font-bold text-slate-900">INV-2026-001</td>
                      <td className="py-2.5 font-bold text-slate-800">Acme Global Ltd</td>
                      <td className="py-2.5 text-slate-600">Tax Invoice</td>
                      <td className="py-2.5 text-right font-mono font-bold text-slate-900">
                        {selectedCurrency === 'USD' ? '$' : selectedCurrency === 'EUR' ? '€' : selectedCurrency === 'INR' ? '₹' : selectedCurrency === 'GBP' ? '£' : 'AED ' }
                        {(14500 * rates[selectedCurrency]).toLocaleString('en-US', { maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800">
                          Paid
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 font-mono font-bold text-slate-900">QT-2026-089</td>
                      <td className="py-2.5 font-bold text-slate-800">Rotterdam Trading NV</td>
                      <td className="py-2.5 text-slate-600">Quotation</td>
                      <td className="py-2.5 text-right font-mono font-bold text-slate-900">
                        {selectedCurrency === 'USD' ? '$' : selectedCurrency === 'EUR' ? '€' : selectedCurrency === 'INR' ? '₹' : selectedCurrency === 'GBP' ? '£' : 'AED ' }
                        {(28900 * rates[selectedCurrency]).toLocaleString('en-US', { maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-100 text-blue-800">
                          Sent
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 font-mono font-bold text-slate-900">DC-2026-012</td>
                      <td className="py-2.5 font-bold text-slate-800">Jebel Ali Logistics LLC</td>
                      <td className="py-2.5 text-slate-600">Delivery Challan</td>
                      <td className="py-2.5 text-right font-mono font-bold text-slate-900">
                        {selectedCurrency === 'USD' ? '$' : selectedCurrency === 'EUR' ? '€' : selectedCurrency === 'INR' ? '₹' : selectedCurrency === 'GBP' ? '£' : 'AED ' }
                        {(8400 * rates[selectedCurrency]).toLocaleString('en-US', { maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-800">
                          Dispatched
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 5: Global Export & Customs Documentation */}
        <section className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-10 shadow-sm relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Description */}
            <div className="lg:col-span-5 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold uppercase tracking-wider">
                <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600" /> Capability 05
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Global Export & Customs Docs
              </h2>
              <p className="text-slate-600 text-sm leading-relaxed font-medium">
                Generate customs-ready Export Invoices, Shipping Bills, Duty Drawback declarations, and Packing Lists with container dimensions, net/gross weights, and customs compliance details.
              </p>

              {/* Document Type Selector */}
              <div className="flex flex-wrap gap-2 pt-2">
                {[
                  { id: 'invoice', label: 'Export Tax Invoice' },
                  { id: 'shipping', label: 'Shipping Bill' },
                  { id: 'packing', label: 'Packing List' },
                  { id: 'declaration', label: 'Export Declaration' },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setExportDocTab(tab.id as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      exportDocTab === tab.id
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Right Interactive Mockup Card */}
            <div className="lg:col-span-7 bg-slate-900 text-white rounded-2xl p-6 shadow-xl border border-slate-800 space-y-4 font-mono">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs">
                <span className="font-bold text-blue-400">DOCUMENT PREVIEW MODE</span>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-900/60 text-blue-300 border border-blue-700 text-[10px] uppercase font-bold">
                  {exportDocTab.toUpperCase()}
                </span>
              </div>

              {exportDocTab === 'invoice' && (
                <div className="space-y-2 text-xs">
                  <div className="text-slate-300 font-bold">EXPORT TAX INVOICE (SUPPLY MEANT FOR EXPORT WITHOUT PAYMENT OF IGST)</div>
                  <div className="grid grid-cols-2 gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px]">
                    <div><span className="text-slate-500">IEC No:</span> 0314089201</div>
                    <div><span className="text-slate-500">ARN No:</span> AD270324001982X</div>
                    <div><span className="text-slate-500">Port Code:</span> INNSA1 (JNPT)</div>
                    <div><span className="text-slate-500">Incoterms:</span> CIF Rotterdam</div>
                  </div>
                </div>
              )}

              {exportDocTab === 'shipping' && (
                <div className="space-y-2 text-xs">
                  <div className="text-slate-300 font-bold">CUSTOMS SHIPPING BILL & PORT DECLARATION</div>
                  <div className="grid grid-cols-2 gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px]">
                    <div><span className="text-slate-500">Customs House:</span> Nhava Sheva Sea</div>
                    <div><span className="text-slate-500">Country of Dest:</span> Netherlands</div>
                    <div><span className="text-slate-500">FOB Value:</span> $42,500.00</div>
                    <div><span className="text-slate-500">Freight Charge:</span> $2,800.00</div>
                  </div>
                </div>
              )}

              {exportDocTab === 'packing' && (
                <div className="space-y-2 text-xs">
                  <div className="text-slate-300 font-bold">EXPORT PACKING LIST & CONTAINER BREAKDOWN</div>
                  <div className="grid grid-cols-2 gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px]">
                    <div><span className="text-slate-500">Total Boxes:</span> 12 Wooden Crates</div>
                    <div><span className="text-slate-500">Net Weight:</span> 4,850.00 KGS</div>
                    <div><span className="text-slate-500">Gross Weight:</span> 5,210.00 KGS</div>
                    <div><span className="text-slate-500">CBM Volume:</span> 18.40 CBM</div>
                  </div>
                </div>
              )}

              {exportDocTab === 'declaration' && (
                <div className="space-y-2 text-xs">
                  <div className="text-slate-300 font-bold">EXPORT COMPLIANCE DECLARATION</div>
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px] text-slate-300 leading-relaxed font-sans">
                    "Export of Goods/Services for Zero-Rated Supply without payment of Integrated Tax (IGST) as per applicable Customs and Export Act regulations."
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* SECTION 6: Incoterms 2020 & Logistics Rules */}
        <section className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-10 shadow-sm relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Description */}
            <div className="lg:col-span-5 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold uppercase tracking-wider">
                <Truck className="w-3.5 h-3.5 text-indigo-600" /> Capability 06
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Incoterms 2020 & Logistics Rules
              </h2>
              <p className="text-slate-600 text-sm leading-relaxed font-medium">
                Embed official ICC Incoterms rules into your document workflow. Clearly outline freight responsibilities, insurance coverage, port of loading, and vessel numbers.
              </p>

              {/* Incoterms Selector Buttons */}
              <div className="flex flex-wrap gap-2 pt-2">
                {(['CIF', 'FOB', 'DDP', 'EXW', 'FCA'] as const).map(rule => (
                  <button
                    key={rule}
                    onClick={() => setSelectedIncoterm(rule)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      selectedIncoterm === rule
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {rule}
                  </button>
                ))}
              </div>
            </div>

            {/* Right Interactive Mockup */}
            <div className="lg:col-span-7 bg-slate-50 rounded-2xl p-6 border border-slate-200/90 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <Anchor className="w-4 h-4 text-indigo-600" />
                  <span className="text-xs font-bold text-slate-900">Incoterms Rule Matrix: {selectedIncoterm}</span>
                </div>
                <span className="text-[10px] font-mono font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full">
                  ICC 2020 Compliant
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Freight Payment</span>
                  <p className="font-bold text-slate-800">
                    {selectedIncoterm === 'CIF' || selectedIncoterm === 'DDP' ? 'Freight Prepaid by Seller' : 'Freight Collect by Buyer'}
                  </p>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Marine Insurance</span>
                  <p className="font-bold text-slate-800">
                    {selectedIncoterm === 'CIF' || selectedIncoterm === 'DDP' ? 'Seller Marine Policy Covered' : 'Buyer Insurance Responsibility'}
                  </p>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Port of Departure</span>
                  <p className="font-bold text-slate-800">JNPT Nhava Sheva, India (INNSA1)</p>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Port / Destination</span>
                  <p className="font-bold text-slate-800">Jebel Ali Port, Dubai, UAE</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 7: One-Click Excel / CSV & Backup Isolation */}
        <section className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-10 shadow-sm relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Description */}
            <div className="lg:col-span-5 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold uppercase tracking-wider">
                <Download className="w-3.5 h-3.5 text-blue-600" /> Capability 07
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                1-Click Export & Isolated Backup
              </h2>
              <p className="text-slate-600 text-sm leading-relaxed font-medium">
                Export all invoices, customer master data, and line items into structured CSV/JSON archives in a single click. Your data is protected by Isolated Tenant Security.
              </p>

              {/* Export Trigger Simulator Button */}
              <div className="pt-2">
                <button
                  onClick={handleTriggerExport}
                  disabled={isExporting}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-blue-500/20 transition-all flex items-center gap-2.5 cursor-pointer disabled:opacity-60"
                >
                  <Download className="w-4 h-4" />
                  <span>{isExporting ? 'Packaging Archive...' : 'SIMULATE 1-CLICK CSV EXPORT'}</span>
                </button>
              </div>
            </div>

            {/* Right Export Progress Simulator Mockup */}
            <div className="lg:col-span-7 bg-slate-900 text-white rounded-2xl p-6 shadow-xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold font-mono">Tenant Isolation: 100% Secure</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-bold">
                  AES-256 Encrypted
                </span>
              </div>

              {isExporting ? (
                <div className="space-y-3 py-4">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-300">Zipping Invoices & CSV Master...</span>
                    <span className="text-blue-400 font-bold">{exportProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-3 p-0.5 border border-slate-800">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full transition-all duration-300 shadow-md shadow-blue-500/30"
                      style={{ width: `${exportProgress}%` }}
                    />
                  </div>
                </div>
              ) : exportComplete ? (
                <div className="bg-emerald-950/60 border border-emerald-800/80 rounded-xl p-4 flex items-center gap-3 animate-fade-in">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-white">billiq_export_2026_09.zip Generated!</div>
                    <div className="text-[10px] text-emerald-300/80 font-mono">34 Invoices, 12 Customer Profiles, 1 CSV File</div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 space-y-2">
                  <HardDrive className="w-10 h-10 text-slate-600 mx-auto" />
                  <div className="text-xs font-bold text-slate-300">Click the button to test instant 1-click archiving</div>
                  <div className="text-[10px] text-slate-500">Auto-schedules local browser backups every session</div>
                </div>
              )}
            </div>
          </div>
        </section>

      </div>

      {/* ---------------- BOTTOM CTA SECTION ---------------- */}
      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 pt-16">
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 rounded-3xl p-8 sm:p-12 text-center text-white relative overflow-hidden shadow-xl shadow-blue-600/20">
          <div className="relative z-10 max-w-3xl mx-auto space-y-4">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
              Ready to Upgrade Your Invoicing?
            </h2>
            <p className="text-blue-100 text-sm sm:text-base font-medium">
              Start issuing multi-currency invoices, tax-compliant bills, and managing tenant security with BillIQ today.
            </p>
            <div className="pt-2">
              <button
                onClick={isLoggedIn ? onEnterDemo : onSignUp}
                className="px-8 py-4 rounded-2xl bg-white hover:bg-slate-100 text-blue-950 font-black text-base shadow-xl transition-all cursor-pointer hover:scale-[1.02] inline-flex items-center gap-2"
              >
                <span>{isLoggedIn ? 'Go to Workspace' : 'Get Started Free Now'}</span>
                <ArrowRight className="w-5 h-5 text-blue-600" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
