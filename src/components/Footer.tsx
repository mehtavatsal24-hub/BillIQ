import React, { useState, useEffect } from "react";
import { Logo } from "./Logo";
import { 
  BookOpen, 
  Keyboard, 
  MessageSquarePlus, 
  LifeBuoy, 
  ShieldCheck, 
  FileText, 
  CheckCircle2, 
  X, 
  Send, 
  Zap,
  Command,
  HelpCircle,
  Mail,
  ExternalLink,
  MessageCircle,
  Clock,
  ArrowRight,
  Globe
} from "lucide-react";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { Input } from "./Input";
import { HowToUseModal } from "./HowToUseModal";
import { ContactSupportModal, openSupportModal } from "./ContactSupportModal";
import { TaxCompliance } from "./TaxCompliance";
import { CookiePolicy } from "./CookiePolicy";
import { OWNER_EMAIL } from "../constants";

interface FooterProps {
  onNavigatePrivacy?: () => void;
  onNavigateTerms?: () => void;
  onNavigateCookie?: () => void;
  onNavigateCompliance?: () => void;
  onNewBill?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onNavigatePrivacy,
  onNavigateTerms,
  onNavigateCookie,
  onNavigateCompliance,
  onNewBill,
}) => {
  // Modal state
  const [activeModal, setActiveModal] = useState<"howToUse" | "shortcuts" | "feedback" | "support" | "compliance" | "cookie" | null>(null);

  useEffect(() => {
    const handleCustomModal = (e: any) => {
      if (e.detail) {
        setActiveModal(e.detail);
      } else {
        setActiveModal(null);
      }
    };
    window.addEventListener("open-footer-modal", handleCustomModal);
    return () => window.removeEventListener("open-footer-modal", handleCustomModal);
  }, []);

  // Feedback form state
  const [feedbackType, setFeedbackType] = useState<"general" | "bug" | "feature">("general");
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackRating, setFeedbackRating] = useState<number>(5);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  // Support form state
  const [supportEmail, setSupportEmail] = useState("");
  const [supportSubject, setSupportSubject] = useState("");
  const [supportMessage, setSupportMessage] = useState("");
  const [supportSubmitted, setSupportSubmitted] = useState(false);

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackText.trim()) return;

    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: feedbackType,
          rating: feedbackRating,
          feedbackText,
          userEmail: OWNER_EMAIL,
        }),
      });
    } catch (err) {
      console.error("Failed to post feedback to API:", err);
    }

    setFeedbackSubmitted(true);
  };

  const handleSupportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportMessage.trim()) return;

    try {
      await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: supportEmail || OWNER_EMAIL,
          subject: supportSubject,
          message: supportMessage,
        }),
      });
    } catch (err) {
      console.error("Failed to post support ticket to API:", err);
    }

    setSupportSubmitted(true);
  };

  const closeModal = () => {
    setActiveModal(null);
    setFeedbackSubmitted(false);
    setSupportSubmitted(false);
  };

  return (
    <>
      <footer className="w-full bg-white border-t border-zinc-200 mt-16 pb-20 sm:pb-8 pt-12">
        <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 lg:px-10">
          
          {/* 4-Column SaaS Layout Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10 pb-12 border-b border-zinc-200/80">
            
            {/* Column 1: Brand */}
            <div className="space-y-3">
              <Logo size="md" subtitleText="Global Billing & Compliance" />
              <p className="text-xs text-zinc-600 leading-relaxed font-normal">
                Global Billing & Invoicing Suite with Export & Cross-Border Compliance for International Businesses.
              </p>
            </div>

            {/* Column 2: Product */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
                <Zap className="w-4 h-4 text-brand-600" />
                <span>Product</span>
              </h3>
              <ul className="space-y-2.5 text-xs">
                <li>
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      if (onNewBill) onNewBill();
                    }}
                    className="group inline-flex items-center gap-2 text-zinc-600 hover:text-brand-600 transition-colors font-medium cursor-pointer"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-300 group-hover:bg-brand-600 transition-colors" />
                    <span>Tax & Commercial Invoicing</span>
                  </button>
                </li>
                <li>
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      if (onNavigateCompliance) {
                        onNavigateCompliance();
                      } else {
                        setActiveModal("compliance");
                      }
                    }}
                    className="group inline-flex items-center gap-2 text-zinc-600 hover:text-brand-600 transition-colors font-medium cursor-pointer text-left"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-300 group-hover:bg-brand-600 transition-colors shrink-0" />
                    <span>Export & Cross-Border Compliance Engine</span>
                  </button>
                </li>
                <li>
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveModal("howToUse");
                    }}
                    className="group inline-flex items-center gap-2 text-zinc-600 hover:text-brand-600 transition-colors font-medium cursor-pointer"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-300 group-hover:bg-brand-600 transition-colors" />
                    <span>Interactive Demo</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-50 text-brand-700 font-bold border border-brand-200">Guide</span>
                  </button>
                </li>
                <li>
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      openSupportModal({ subject: 'Pricing & Enterprise Plans Inquiry' });
                    }}
                    className="group inline-flex items-center gap-2 text-zinc-600 hover:text-brand-600 transition-colors font-medium cursor-pointer"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-300 group-hover:bg-brand-600 transition-colors" />
                    <span>Pricing Plans</span>
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 3: Resources & Help */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-brand-600" />
                <span>Resources & Help</span>
              </h3>
              <ul className="space-y-2.5 text-xs">
                <li>
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveModal("howToUse");
                    }}
                    className="group inline-flex items-center gap-2 text-zinc-600 hover:text-brand-600 transition-colors font-medium cursor-pointer"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-300 group-hover:bg-brand-600 transition-colors" />
                    <span>Documentation / User Guide</span>
                  </button>
                </li>
                <li>
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveModal("shortcuts");
                    }}
                    className="group inline-flex items-center gap-2 text-zinc-600 hover:text-brand-600 transition-colors font-medium cursor-pointer"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-300 group-hover:bg-brand-600 transition-colors" />
                    <span>Help Center</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-600 border border-zinc-200">⌘K</span>
                  </button>
                </li>
                <li>
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      openSupportModal({ subject: 'Contact Support Inquiry' });
                    }}
                    className="group inline-flex items-center gap-2 text-zinc-600 hover:text-brand-600 transition-colors font-medium cursor-pointer"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-300 group-hover:bg-brand-600 transition-colors" />
                    <span>Contact Support</span>
                  </button>
                </li>
                <li>
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveModal("feedback");
                    }}
                    className="group inline-flex items-center gap-2 text-zinc-600 hover:text-brand-600 transition-colors font-medium cursor-pointer"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-300 group-hover:bg-brand-600 transition-colors" />
                    <span>Give Feedback</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">Fast Response</span>
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 4: Support & Direct Contact */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
                <LifeBuoy className="w-4 h-4 text-brand-600" />
                <span>Support & Direct Contact</span>
              </h3>
              <p className="text-xs text-zinc-600 leading-relaxed font-normal">
                Our global compliance & technical support team is available to assist with your custom billing, tax schemas, and enterprise needs.
              </p>
              <div className="pt-1 flex items-center gap-2">
                <Mail className="w-4 h-4 text-brand-600 shrink-0" />
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    openSupportModal({ subject: 'Direct Support Inquiry' });
                  }}
                  className="text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline select-all cursor-pointer"
                >
                  support@billiq.site
                </button>
              </div>
            </div>

          </div>

          {/* Bottom Copyright Bar */}
          <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
            <div className="space-y-1 text-center md:text-left">
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Disclaimer: BillIQ is 98% accurate and can make mistakes. Please verify important tax, HSN/SAC, and multi-currency values before official filing.
              </p>
              <p className="font-medium text-zinc-600">
                © 2026 BillIQ. All rights reserved. Built for Global Businesses.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 text-zinc-500 font-medium">
              <button 
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  if (onNavigatePrivacy) onNavigatePrivacy();
                }}
                className="hover:text-brand-600 transition-colors cursor-pointer"
              >
                Privacy Policy
              </button>
              <span className="text-zinc-300">•</span>
              <button 
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  if (onNavigateTerms) onNavigateTerms();
                }}
                className="hover:text-brand-600 transition-colors cursor-pointer"
              >
                Terms of Service
              </button>
              <span className="text-zinc-300">•</span>
              <button 
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  if (onNavigateCookie) {
                    onNavigateCookie();
                  } else {
                    setActiveModal("cookie");
                  }
                }}
                className="hover:text-brand-600 transition-colors cursor-pointer"
              >
                Cookie Settings
              </button>
            </div>
          </div>

        </div>
      </footer>

      {/* MODAL 1: How to Use Guide */}
      <HowToUseModal 
        isOpen={activeModal === "howToUse"} 
        onClose={closeModal} 
        onStartInvoice={onNewBill} 
      />

      {/* MODAL 2: Keyboard Shortcuts */}
      {activeModal === "shortcuts" && (
        <Modal isOpen={true} onClose={closeModal} title="Keyboard Shortcuts">
          <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
            <p className="text-xs text-zinc-600">
              Accelerate your workflow with these active keyboard hotkeys:
            </p>

            <div className="divide-y divide-zinc-100 border border-zinc-200 rounded-xl overflow-hidden text-xs">
              <div className="flex items-center justify-between p-3 bg-zinc-50 font-bold text-zinc-700">
                <span>Action</span>
                <span>Hotkey</span>
              </div>
              <div className="flex items-center justify-between p-3 hover:bg-zinc-50/50">
                <span className="text-zinc-800 font-medium">Create New Invoice Draft</span>
                <div className="flex gap-1">
                  <kbd className="px-2 py-1 bg-zinc-100 border border-zinc-300 rounded font-mono text-[11px] font-bold text-zinc-700 shadow-2xs">Ctrl + N</kbd>
                  <span className="text-zinc-400 font-bold">/</span>
                  <kbd className="px-2 py-1 bg-zinc-100 border border-zinc-300 rounded font-mono text-[11px] font-bold text-zinc-700 shadow-2xs">Alt + N</kbd>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 hover:bg-zinc-50/50">
                <span className="text-zinc-800 font-medium">Save Current Invoice Draft</span>
                <kbd className="px-2 py-1 bg-zinc-100 border border-zinc-300 rounded font-mono text-[11px] font-bold text-zinc-700 shadow-2xs">Ctrl + S</kbd>
              </div>
              <div className="flex items-center justify-between p-3 hover:bg-zinc-50/50">
                <span className="text-zinc-800 font-medium">Generate & Download PDF</span>
                <kbd className="px-2 py-1 bg-zinc-100 border border-zinc-300 rounded font-mono text-[11px] font-bold text-zinc-700 shadow-2xs">Ctrl + P</kbd>
              </div>
              <div className="flex items-center justify-between p-3 hover:bg-zinc-50/50">
                <span className="text-zinc-800 font-medium">Open AI Smart Extractor</span>
                <div className="flex gap-1">
                  <kbd className="px-2 py-1 bg-zinc-100 border border-zinc-300 rounded font-mono text-[11px] font-bold text-zinc-700 shadow-2xs">Ctrl + Shift + A</kbd>
                  <span className="text-zinc-400 font-bold">/</span>
                  <kbd className="px-2 py-1 bg-zinc-100 border border-zinc-300 rounded font-mono text-[11px] font-bold text-zinc-700 shadow-2xs">Alt + A</kbd>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 hover:bg-zinc-50/50">
                <span className="text-zinc-800 font-medium">Search Customer / Party</span>
                <div className="flex gap-1">
                  <kbd className="px-2 py-1 bg-zinc-100 border border-zinc-300 rounded font-mono text-[11px] font-bold text-zinc-700 shadow-2xs">Ctrl + K</kbd>
                  <span className="text-zinc-400 font-bold">/</span>
                  <kbd className="px-2 py-1 bg-zinc-100 border border-zinc-300 rounded font-mono text-[11px] font-bold text-zinc-700 shadow-2xs">Ctrl + F</kbd>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 hover:bg-zinc-50/50">
                <span className="text-zinc-800 font-medium">Open How to Use Guide</span>
                <div className="flex gap-1">
                  <kbd className="px-2 py-1 bg-zinc-100 border border-zinc-300 rounded font-mono text-[11px] font-bold text-zinc-700 shadow-2xs">Ctrl + Shift + H</kbd>
                  <span className="text-zinc-400 font-bold">/</span>
                  <kbd className="px-2 py-1 bg-zinc-100 border border-zinc-300 rounded font-mono text-[11px] font-bold text-zinc-700 shadow-2xs">Alt + H</kbd>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 hover:bg-zinc-50/50">
                <span className="text-zinc-800 font-medium">Open Keyboard Shortcuts</span>
                <kbd className="px-2 py-1 bg-zinc-100 border border-zinc-300 rounded font-mono text-[11px] font-bold text-zinc-700 shadow-2xs">Ctrl + /</kbd>
              </div>
              <div className="flex items-center justify-between p-3 hover:bg-zinc-50/50">
                <span className="text-zinc-800 font-medium">Close Modal / Cancel</span>
                <kbd className="px-2 py-1 bg-zinc-100 border border-zinc-300 rounded font-mono text-[11px] font-bold text-zinc-700 shadow-2xs">Esc</kbd>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button onClick={closeModal} variant="secondary" size="sm">
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL 3: Give Feedback */}
      {activeModal === "feedback" && (
        <Modal isOpen={true} onClose={closeModal} title="Give Feedback">
          {feedbackSubmitted ? (
            <div className="p-6 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-zinc-900">Thank You for Your Feedback!</h3>
              <p className="text-xs text-zinc-600 max-w-sm mx-auto">
                Your feedback has been submitted to <span className="font-bold text-brand-600">{OWNER_EMAIL}</span>. We appreciate your input to make BillIQ better!
              </p>
              <div className="pt-2">
                <Button onClick={closeModal} variant="primary" size="sm">
                  Done & Close
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleFeedbackSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Feedback Category</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "general", label: "General" },
                    { id: "feature", label: "Feature Idea" },
                    { id: "bug", label: "Report Bug" }
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setFeedbackType(cat.id as any)}
                      className={`py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                        feedbackType === cat.id
                          ? "bg-brand-600 text-white border-brand-600 shadow-xs"
                          : "bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Rate Experience</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFeedbackRating(star)}
                      className={`flex-1 py-1.5 text-sm font-black rounded border transition-all cursor-pointer ${
                        feedbackRating >= star 
                          ? "bg-amber-500 text-white border-amber-500" 
                          : "bg-zinc-100 text-zinc-400 border-zinc-200"
                      }`}
                    >
                      ★ {star}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Your Feedback</label>
                <textarea
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="Tell us what you love or what we can improve..."
                  rows={4}
                  className="w-full text-xs p-3 rounded-lg border border-zinc-300 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button type="button" onClick={closeModal} variant="secondary" size="sm">
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  <Send className="w-3.5 h-3.5 mr-1" />
                  Submit Feedback
                </Button>
              </div>
            </form>
          )}
        </Modal>
      )}

      {/* MODAL 4: Contact Support */}
      <ContactSupportModal
        isOpen={activeModal === "support"}
        onClose={closeModal}
        userEmail={supportEmail}
      />

      {/* MODAL 5: Tax Compliance Overview */}
      {activeModal === "compliance" && (
        <Modal isOpen={true} onClose={closeModal} title="Tax & Statutory Compliance">
          <div className="max-h-[75vh] overflow-y-auto pr-1">
            <TaxCompliance onBack={closeModal} />
          </div>
        </Modal>
      )}

      {/* MODAL 6: Cookie & Local Storage Policy */}
      {activeModal === "cookie" && (
        <Modal isOpen={true} onClose={closeModal} title="Cookie & Local Storage Policy">
          <div className="max-h-[75vh] overflow-y-auto pr-1">
            <CookiePolicy onBack={closeModal} />
          </div>
        </Modal>
      )}
    </>
  );
};

