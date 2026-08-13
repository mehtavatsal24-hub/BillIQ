import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Zap, 
  FileText, 
  Scan, 
  Building2, 
  Bot, 
  Palette, 
  Share2, 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Info,
  CheckCircle2,
  ArrowRight,
  Lightbulb,
  FileCheck
} from "lucide-react";

interface HowToUseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartInvoice?: () => void;
}

const steps = [
  {
    id: 1,
    title: "Choose Document & Fill Details",
    icon: FileText,
    badge: "Document Setup",
    description: "Start by selecting your target document type and pulling customer details instantly.",
    details: [
      "Select document type: Tax Invoice, Proforma Invoice, Commercial Bill, Delivery Challan, or Credit Note.",
      "Search or select from your saved Party Database to auto-fill Tax ID / VAT / GSTIN, billing address, and shipping locations.",
      "Set invoice numbers, PO numbers, and payment due dates easily."
    ],
    tips: "You can save customer profiles to auto-populate Tax ID / VAT / GSTIN and address fields with one click."
  },
  {
    id: 2,
    title: "Smart AI Extraction",
    icon: Scan,
    badge: "Instant Parsing",
    description: "Extract line items from inquiry documents, spreadsheets, or images without typing.",
    details: [
      "Upload PDF inquiry files, captured photos, or paste raw text straight into the AI Extractor.",
      "The AI auto-detects Item Descriptions, HSN/SAC codes, Quantities, Unit Rates, and Tax Rates.",
      "Review extracted rows and insert them into your live invoice draft with a single click.",
      "If you have a document with 50-70+ line items, we highly recommend taking screenshots of 30-40 items at a time and performing multiple batch uploads for higher extraction accuracy and speed."
    ],
    tips: "For large inquiries (50+ line items), take screenshots in batches of 30–40 items at a time and upload sequentially for optimal accuracy."
  },
  {
    id: 3,
    title: "Add Company Letterhead",
    icon: Building2,
    badge: "Official Branding",
    description: "Incorporate your company's official letterhead header and footer graphics for professional branding.",
    details: [
      "Upload your pre-designed company letterhead image or company logo.",
      "Adjust top and bottom margin padding so the document content sits perfectly within your print margins.",
      "Optionally use standard built-in header templates if you don't have a pre-printed letterhead image."
    ],
    tips: "For the crispest PDF exports, upload high-resolution letterhead images (PNG or JPG format)."
  },
  {
    id: 4,
    title: "Fast Editing with AI Bulk Editor",
    icon: Bot,
    badge: "Natural Language AI",
    description: "Modify dozens of line items simultaneously using plain English instructions.",
    details: [
      "Type natural commands like: 'Apply 5% discount across all items' or 'Remove line 3'.",
      "Bulk update rates, tax percentages, or item units without opening individual edit dialogs.",
      "Re-order line items or adjust HSN codes across the entire invoice instantly."
    ],
    tips: "Use phrases like 'Set delivery terms to 7 days' or 'Add payment terms' to auto-populate footer clauses."
  },
  {
    id: 5,
    title: "Customize PDF Layout & Appearance",
    icon: Palette,
    badge: "PDF Styling",
    description: "Tailor the visual presentation of your exported document in real time.",
    details: [
      "Switch color themes (Royal Blue, Emerald Green, Slate, Custom accent colors).",
      "Toggle visible table columns such as HSN/SAC code, GST rate, unit, or discount columns.",
      "Adjust typography size, table line spacing, and summary box placement."
    ],
    tips: "Use the live PDF preview panel to inspect layout changes before downloading."
  },
  {
    id: 6,
    title: "Generate & Share PDF",
    icon: Share2,
    badge: "Instant Export",
    description: "Download vector-rendered PDFs or send documents directly to customers.",
    details: [
      "Download high-definition vector PDFs optimized for both print and digital viewing.",
      "Generate a matching Delivery Challan (India) directly from your tax invoice data with one click.",
      "Share bills instantly via WhatsApp or Email directly to your client's registered contacts."
    ],
    tips: "All generated bills are saved in your local history so you can track payment status anytime."
  }
];

export const HowToUseModal: React.FC<HowToUseModalProps> = ({
  isOpen,
  onClose,
  onStartInvoice
}) => {
  const [activeStep, setActiveStep] = useState<number>(1);

  if (!isOpen) return null;

  const currentStepData = steps.find((s) => s.id === activeStep) || steps[0];
  const StepIcon = currentStepData.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-zinc-950/70 backdrop-blur-sm overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="relative w-full max-w-3xl max-h-[90vh] bg-white rounded-2xl border border-zinc-200 shadow-2xl overflow-hidden flex flex-col my-auto text-zinc-900"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-zinc-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-600 text-white flex items-center justify-center font-bold shadow-md">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-extrabold tracking-tight text-white">How to Use BillIQ</h2>
              <p className="text-xs text-zinc-400">Step-by-step guide to creating, customizing & exporting invoices</p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Navigation Tabs */}
        <div className="px-6 py-3 bg-zinc-50 border-b border-zinc-200 overflow-x-auto scrollbar-none shrink-0">
          <div className="flex items-center gap-2 min-w-max">
            {steps.map((step) => {
              const Icon = step.icon;
              const isActive = activeStep === step.id;
              return (
                <button
                  key={step.id}
                  onClick={() => setActiveStep(step.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border ${
                    isActive
                      ? "bg-brand-600 text-white border-brand-600 shadow-sm"
                      : "bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-100 hover:text-zinc-900"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-zinc-500"}`} />
                  <span>Step {step.id}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Step Instructions Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-white">
          
          <AnimatePresence mode="wait">
            <motion.div
              key={activeStep}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* Step Title & Badge */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-200 text-brand-600 flex items-center justify-center font-bold shrink-0">
                    <StepIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-brand-600">
                      Step {currentStepData.id} of 6
                    </span>
                    <h3 className="text-lg font-extrabold text-zinc-900 leading-snug">
                      {currentStepData.title}
                    </h3>
                  </div>
                </div>

                <span className="self-start sm:self-auto px-3 py-1 rounded-full bg-zinc-100 text-zinc-700 text-xs font-bold border border-zinc-200">
                  {currentStepData.badge}
                </span>
              </div>

              {/* Step Summary Description */}
              <p className="text-sm text-zinc-700 font-medium leading-relaxed bg-zinc-50 p-3.5 rounded-xl border border-zinc-200/80">
                {currentStepData.description}
              </p>

              {/* Detailed Bullet Points */}
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-zinc-500">Key Capabilities & Instructions:</h4>
                <div className="space-y-2.5">
                  {currentStepData.details.map((point, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-white border border-zinc-200/90 shadow-2xs hover:border-zinc-300 transition-colors">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span className="text-xs text-zinc-800 font-medium leading-relaxed">
                        {point}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Special Tip Callout Box */}
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-900 text-xs flex items-start gap-3">
                <Lightbulb className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-extrabold text-amber-950 block">Pro Tip</span>
                  <p className="text-amber-900 leading-relaxed font-medium">{currentStepData.tips}</p>
                </div>
              </div>

            </motion.div>
          </AnimatePresence>

        </div>

        {/* Footer Navigation Actions */}
        <div className="px-6 py-4 bg-zinc-50 border-t border-zinc-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveStep((prev) => Math.max(1, prev - 1))}
              disabled={activeStep === 1}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                activeStep === 1
                  ? "opacity-40 cursor-not-allowed bg-zinc-100 text-zinc-400 border-zinc-200"
                  : "bg-white text-zinc-700 hover:bg-zinc-100 border-zinc-300"
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <button
              onClick={() => setActiveStep((prev) => Math.min(6, prev + 1))}
              disabled={activeStep === 6}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                activeStep === 6
                  ? "opacity-40 cursor-not-allowed bg-zinc-100 text-zinc-400 border-zinc-200"
                  : "bg-white text-zinc-700 hover:bg-zinc-100 border-zinc-300"
              }`}
            >
              <span>Next Step</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            {onStartInvoice && (
              <button
                onClick={() => {
                  onClose();
                  onStartInvoice();
                }}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-extrabold transition-all shadow-sm flex items-center gap-2 cursor-pointer"
              >
                <span>Start Creating Invoice</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="px-3.5 py-2 text-zinc-600 hover:text-zinc-900 text-xs font-bold cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>

      </motion.div>
    </div>
  );
};
