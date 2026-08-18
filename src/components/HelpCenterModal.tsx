import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  BookOpen,
  HelpCircle,
  Keyboard,
  Zap,
  FileText,
  Scan,
  Building2,
  Bot,
  Palette,
  Share2,
  Mail,
  X,
  ExternalLink,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  Globe,
  ArrowRight
} from "lucide-react";
import { openSupportModal } from "./ContactSupportModal";

export interface HelpCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenHowToUse?: () => void;
  onEnterDemo?: () => void;
  onSignUp?: () => void;
}

// Global dispatcher for opening Help Center from anywhere
export const openHelpCenter = () => {
  window.dispatchEvent(new CustomEvent("billiq-open-help-center"));
};

interface GuideItem {
  id: string;
  category: "guide" | "faq" | "shortcut" | "action";
  title: string;
  description: string;
  badge?: string;
  icon: any;
  action?: () => void;
  shortcut?: string;
  details?: string[];
}

export const HelpCenterModal: React.FC<HelpCenterModalProps> = ({
  isOpen,
  onClose,
  onOpenHowToUse,
  onEnterDemo,
  onSignUp
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<"all" | "guides" | "faq" | "shortcuts">("all");
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  // Reset state on open/close
  useEffect(() => {
    if (isOpen) {
      setSearchQuery("");
      setActiveCategory("all");
      setExpandedItemId(null);
    }
  }, [isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const allItems: GuideItem[] = useMemo(() => [
    // Quick Actions
    {
      id: "action-demo",
      category: "action",
      title: "Launch Interactive Workspace Demo",
      description: "Explore the live bill creator with sample data, multi-currency conversion, and PDF preview.",
      badge: "Interactive",
      icon: Zap,
      action: () => {
        onClose();
        if (onEnterDemo) onEnterDemo();
      }
    },
    {
      id: "action-support",
      category: "action",
      title: "Contact Dedicated Support Team",
      description: "Send a ticket to support@billiq.site for billing questions, custom tax rules, or enterprise inquiries.",
      badge: "Direct Support",
      icon: Mail,
      action: () => {
        onClose();
        openSupportModal({ subject: "Help Center In-App Inquiry" });
      }
    },

    // Guides
    {
      id: "guide-doc-setup",
      category: "guide",
      title: "Document Setup & Party Auto-Fill",
      description: "Learn how to select document types (Tax Invoice, Proforma, Challan) and pull party details from your directory.",
      badge: "Step 1",
      icon: FileText,
      details: [
        "Select your document type: Tax Invoice, Proforma Invoice, Delivery Challan, Commercial Bill, or Credit Note.",
        "Choose or search from saved customers/suppliers to auto-populate Tax ID / GSTIN / VAT ID and billing addresses.",
        "Set invoice numbers, PO references, and payment terms in seconds."
      ]
    },
    {
      id: "guide-ai-extract",
      category: "guide",
      title: "Smart AI OCR Data Extraction",
      description: "Upload PDFs, images, or paste raw purchase orders to auto-extract line items, rates, and HSN codes without typing.",
      badge: "Step 2",
      icon: Scan,
      details: [
        "Upload PDF inquiry files, photos of bills, or paste order text into the AI Extractor.",
        "The AI recognizes item descriptions, HSN/SAC codes, quantities, and rates automatically.",
        "Batch review extracted items and insert them into your live draft with a single click."
      ]
    },
    {
      id: "guide-letterhead",
      category: "guide",
      title: "Official Letterhead & Digital Signatures",
      description: "Add company branding, custom letterhead backgrounds, and authorized digital signatures.",
      badge: "Step 3",
      icon: Building2,
      details: [
        "Upload high-resolution letterhead images (portrait A4) to frame your invoice with official graphics.",
        "Add company logo and transparent digital signatures for paperless authorized billing.",
        "Adjust top/bottom margin padding for perfect alignment on physical printouts."
      ]
    },
    {
      id: "guide-bulk-editor",
      category: "guide",
      title: "Natural Language AI Batch Editor",
      description: "Apply blanket discounts, adjust tax percentages, and re-order dozens of line items using plain English prompts.",
      badge: "Step 4",
      icon: Bot,
      details: [
        "Type commands like: 'Apply 5% discount across all rows' or 'Update tax rate to 18%'.",
        "Delete, duplicate, or re-sequence line items without manual edits.",
        "Automatically set delivery clauses and payment terms with simple voice/text prompts."
      ]
    },
    {
      id: "guide-pdf-customizer",
      category: "guide",
      title: "Custom PDF Layouts & Visual Themes",
      description: "Switch color themes, toggle table columns (HSN, GST, Unit, Discount), and inspect real-time vector previews.",
      badge: "Step 5",
      icon: Palette,
      details: [
        "Choose between theme styles (Royal Blue, Emerald Green, Slate, and Custom Accents).",
        "Show or hide columns like HSN/SAC, Tax %, Unit types, and item discounts.",
        "Adjust font scaling and layout density to fit single or multi-page formats."
      ]
    },
    {
      id: "guide-export-challan",
      category: "guide",
      title: "Delivery Challans, Incoterms & PDF Export",
      description: "Download vector-rendered PDFs, generate matching Delivery Challans for shipments, and share via WhatsApp/Email.",
      badge: "Step 6",
      icon: Share2,
      details: [
        "Export crisp vector PDFs optimized for both digital viewing and sharp A4 printing.",
        "Create matching Delivery Challans, Packing Lists, and Shipping Declarations in 1 click.",
        "Auto-populate Incoterms 2020 rules (FOB, CIF, DDP) for cross-border export compliance."
      ]
    },

    // FAQs
    {
      id: "faq-free-plan",
      category: "faq",
      title: "Is BillIQ free to use for international billing?",
      description: "Yes! BillIQ provides a Free Forever Tier ($0 Zero Cost) with No Credit Card Required for all core invoicing tools.",
      badge: "Pricing FAQ",
      icon: HelpCircle,
      details: [
        "Freelancers, traders, exporters, and small businesses can generate tax invoices, delivery challans, and quotes for free.",
        "Includes multi-currency support, tax ID validation, and instant PDF download with zero hidden fees."
      ]
    },
    {
      id: "faq-multi-curr",
      category: "faq",
      title: "Which currencies and foreign exchange rates are supported?",
      description: "BillIQ supports USD ($), EUR (€), GBP (£), INR (₹), AED, CAD, AUD, and more with automated FX conversion.",
      badge: "Currencies FAQ",
      icon: Globe,
      details: [
        "Real-time FX exchange rate conversion for multi-currency export invoices.",
        "Automated currency symbol placement and localized decimal formatting for international buyers."
      ]
    },
    {
      id: "faq-tax-rules",
      category: "faq",
      title: "How does international tax compliance work (VAT, GST, US Sales Tax)?",
      description: "BillIQ applies localized tax schemas including EU VAT Reverse Charge (Art. 138), Indian IGST zero-rated export, and US Sales Tax exemptions.",
      badge: "Tax FAQ",
      icon: ShieldCheck,
      details: [
        "Customs Exemption Filings and LUT / ARN export tracking.",
        "Validation for GSTIN (India), VAT (EU/UK), EIN (USA), and TRN (UAE)."
      ]
    },
    {
      id: "faq-security",
      category: "faq",
      title: "Is my invoice and financial data securely stored?",
      description: "Yes! BillIQ utilizes 100% secure cloud storage with enterprise-grade encryption and automated database backups.",
      badge: "Security FAQ",
      icon: ShieldCheck,
      details: [
        "Strict user partition ensures your invoices and party database are private to your account.",
        "Local offline fallback storage ensures zero work is lost even if your internet disconnects temporarily."
      ]
    },

    // Keyboard Shortcuts
    {
      id: "sc-new",
      category: "shortcut",
      title: "Create New Invoice Draft",
      description: "Start a fresh invoice or document draft instantly.",
      shortcut: "Ctrl + N / Alt + N",
      icon: Keyboard
    },
    {
      id: "sc-save",
      category: "shortcut",
      title: "Save Current Invoice Draft",
      description: "Persist your current invoice to cloud and local history.",
      shortcut: "Ctrl + S",
      icon: Keyboard
    },
    {
      id: "sc-pdf",
      category: "shortcut",
      title: "Generate & Download PDF",
      description: "Render high-definition vector PDF and initiate download.",
      shortcut: "Ctrl + P",
      icon: Keyboard
    },
    {
      id: "sc-ai",
      category: "shortcut",
      title: "Open Smart AI OCR Extractor",
      description: "Launch image/PDF document scanner and line item parser.",
      shortcut: "Ctrl + Shift + A",
      icon: Keyboard
    },
    {
      id: "sc-help",
      category: "shortcut",
      title: "Open Help Center / Command Palette",
      description: "Search documentation, FAQs, and keyboard shortcuts.",
      shortcut: "Cmd + K / Ctrl + K",
      icon: Keyboard
    },
    {
      id: "sc-esc",
      category: "shortcut",
      title: "Close Modal / Cancel Action",
      description: "Dismiss active overlays and dialog windows.",
      shortcut: "Esc",
      icon: Keyboard
    }
  ], [onClose, onEnterDemo]);

  // Filter items based on active category and search query
  const filteredItems = useMemo(() => {
    let list = allItems;
    if (activeCategory === "guides") {
      list = list.filter((i) => i.category === "guide" || i.category === "action");
    } else if (activeCategory === "faq") {
      list = list.filter((i) => i.category === "faq");
    } else if (activeCategory === "shortcuts") {
      list = list.filter((i) => i.category === "shortcut");
    }

    if (!searchQuery.trim()) return list;

    const q = searchQuery.toLowerCase().trim();
    return list.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.badge?.toLowerCase().includes(q) ||
        item.shortcut?.toLowerCase().includes(q) ||
        item.details?.some((d) => d.toLowerCase().includes(q))
    );
  }, [allItems, activeCategory, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -10 }}
        transition={{ duration: 0.18 }}
        className="relative w-full max-w-3xl max-h-[90vh] bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col my-auto text-slate-800"
      >
        {/* Top Header & Search Input */}
        <div className="p-5 sm:p-6 bg-slate-900 text-white shrink-0 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black shadow-md shadow-blue-500/30">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black text-white tracking-tight">Help Center & Documentation</h2>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    ⌘K / Ctrl+K
                  </span>
                </div>
                <p className="text-xs text-slate-400">Search guides, tax compliance, keyboard shortcuts, and FAQs</p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Close (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search Bar Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search user guides, tax rules, export documents, shortcuts..."
              autoFocus
              className="w-full bg-slate-800/90 text-white placeholder-slate-400 pl-10 pr-4 py-3 rounded-2xl text-sm font-medium border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Category Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pt-1">
            {[
              { id: "all", label: "All Topics", icon: Sparkles },
              { id: "guides", label: "User Guides", icon: BookOpen },
              { id: "faq", label: "FAQs", icon: HelpCircle },
              { id: "shortcuts", label: "Shortcuts", icon: Keyboard }
            ].map((tab) => {
              const TabIcon = tab.icon;
              const isActive = activeCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveCategory(tab.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap border ${
                    isActive
                      ? "bg-blue-600 text-white border-blue-500 shadow-sm"
                      : "bg-slate-800/60 text-slate-300 border-slate-700 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <TabIcon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Results List */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-3 bg-slate-50">
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center mx-auto">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">No matching help articles</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Couldn't find anything for "{searchQuery}". Try searching for keywords like "VAT", "Extract", "Letterhead", or contact support directly.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    openSupportModal({ subject: `Help Inquiry: ${searchQuery}` });
                  }}
                  className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl shadow-sm hover:bg-blue-700 transition-colors inline-flex items-center gap-2 cursor-pointer"
                >
                  <Mail className="w-4 h-4" />
                  <span>Ask Support Directly</span>
                </button>
              </div>
            </div>
          ) : (
            filteredItems.map((item) => {
              const ItemIcon = item.icon;
              const isExpanded = expandedItemId === item.id;
              const isAction = item.category === "action";
              const isShortcut = item.category === "shortcut";

              return (
                <div
                  key={item.id}
                  className={`bg-white border rounded-2xl transition-all shadow-sm overflow-hidden ${
                    isAction
                      ? "border-blue-200 bg-blue-50/40 hover:bg-blue-50/70"
                      : "border-slate-200 hover:border-blue-300"
                  }`}
                >
                  <div
                    onClick={() => {
                      if (item.action) {
                        item.action();
                      } else if (item.details) {
                        setExpandedItemId(isExpanded ? null : item.id);
                      }
                    }}
                    className={`p-4 flex items-start justify-between gap-3 cursor-pointer ${
                      isAction ? "hover:bg-blue-50/60" : "hover:bg-slate-50/80"
                    }`}
                  >
                    <div className="flex items-start gap-3.5 flex-1">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold shrink-0 mt-0.5 ${
                          isAction
                            ? "bg-blue-600 text-white"
                            : item.category === "guide"
                            ? "bg-blue-50 text-blue-600 border border-blue-200"
                            : item.category === "faq"
                            ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                            : "bg-slate-100 text-slate-700 border border-slate-200"
                        }`}
                      >
                        <ItemIcon className="w-4 h-4" />
                      </div>

                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-bold text-slate-900 leading-tight">{item.title}</h4>
                          {item.badge && (
                            <span
                              className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                                isAction
                                  ? "bg-blue-100 text-blue-800"
                                  : item.category === "guide"
                                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                                  : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed font-normal">{item.description}</p>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-2 self-center">
                      {isShortcut && item.shortcut && (
                        <kbd className="px-2.5 py-1 bg-slate-100 border border-slate-300 rounded-lg font-mono text-[11px] font-bold text-slate-800 shadow-2xs">
                          {item.shortcut}
                        </kbd>
                      )}
                      {isAction && (
                        <span className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm">
                          <span>Open</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      )}
                      {item.details && (
                        <button
                          type="button"
                          className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                        >
                          <ChevronRight
                            className={`w-5 h-5 transition-transform ${isExpanded ? "rotate-90 text-blue-600" : ""}`}
                          />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expanded Step/Details View */}
                  {isExpanded && item.details && (
                    <div className="px-4 pb-4 pt-1 bg-slate-50/70 border-t border-slate-100 space-y-2">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block pt-1">
                        Step Details & Instructions:
                      </span>
                      <ul className="space-y-1.5">
                        {item.details.map((detail, dIdx) => (
                          <li key={dIdx} className="text-xs text-slate-700 flex items-start gap-2 leading-relaxed">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0 mt-1.5" />
                            <span>{detail}</span>
                          </li>
                        ))}
                      </ul>
                      {item.category === "guide" && onOpenHowToUse && (
                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onOpenHowToUse();
                            }}
                            className="text-xs font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
                          >
                            <span>Open full Interactive Step-by-Step Guide</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer Support Quick Strip */}
        <div className="p-4 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-2 text-slate-600 text-center sm:text-left">
            <Mail className="w-4 h-4 text-blue-600 shrink-0" />
            <span>Need human support? Email us anytime at</span>
            <a
              href="mailto:support@billiq.site?subject=BillIQ%20Support%20Inquiry"
              className="font-bold text-blue-600 hover:underline"
            >
              support@billiq.site
            </a>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                openSupportModal({ subject: "Support Inquiry from Help Center" });
              }}
              className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold transition-colors cursor-pointer"
            >
              Open Support Ticket
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-black text-white font-bold transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
