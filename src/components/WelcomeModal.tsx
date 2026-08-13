import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Rocket, HeartHandshake, MessageSquare, ArrowRight, X, Zap } from "lucide-react";
import { Button } from "./Button";

interface WelcomeModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  onTryAIExtraction?: () => void;
  onExploreDashboard?: () => void;
  onShareFeedback?: () => void;
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({
  isOpen: externalIsOpen,
  onClose: externalOnClose,
  onTryAIExtraction,
  onExploreDashboard,
  onShareFeedback,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (externalIsOpen !== undefined) {
      setIsOpen(externalIsOpen);
    } else {
      const hasSeen = localStorage.getItem("hasSeenWelcomeModal");
      if (!hasSeen) {
        setIsOpen(true);
      }
    }
  }, [externalIsOpen]);

  const handleDismiss = () => {
    localStorage.setItem("hasSeenWelcomeModal", "true");
    setIsOpen(false);
    if (externalOnClose) {
      externalOnClose();
    }
  };

  const handleTryAI = () => {
    handleDismiss();
    if (onTryAIExtraction) {
      onTryAIExtraction();
    }
  };

  const handleDashboard = () => {
    handleDismiss();
    if (onExploreDashboard) {
      onExploreDashboard();
    }
  };

  const handleFeedback = () => {
    handleDismiss();
    if (onShareFeedback) {
      onShareFeedback();
    } else {
      window.dispatchEvent(new CustomEvent("open-footer-modal", { detail: "feedback" }));
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleDismiss}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-md"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
          className="relative w-full max-w-xl bg-white/95 backdrop-blur-xl border border-white/40 rounded-3xl shadow-2xl overflow-hidden z-10 my-auto"
        >
          {/* Top Decorative Header Accent */}
          <div className="h-2 w-full bg-gradient-to-r from-brand-500 via-indigo-500 to-amber-500" />

          {/* Close Button */}
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100/80 rounded-full transition-colors cursor-pointer z-20"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="p-6 sm:p-8 space-y-6">
            {/* Header Badge & Title */}
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 border border-brand-200/80 text-brand-700 text-xs font-bold uppercase tracking-wider">
                <Rocket className="w-3.5 h-3.5 text-brand-600" />
                <span>Welcome Aboard</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">
                Welcome to BillIQ! 🚀
              </h2>
            </div>

            {/* Body */}
            <p className="text-sm sm:text-base text-zinc-600 leading-relaxed">
              Thank you for trying our platform and helping us grow. As fellow entrepreneurs, we know how tedious manual line-item entry can be—so we built BillIQ to give you time back.
            </p>

            {/* Feature Highlight Box */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-brand-50/90 via-indigo-50/70 to-purple-50/80 border border-brand-200/80 shadow-xs relative overflow-hidden group">
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-brand-600 text-white rounded-xl shadow-sm shrink-0">
                  <Zap className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-brand-700">Instant AI Assistant</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">5 FREE Extractions</span>
                  </div>
                  <p className="text-xs sm:text-sm text-zinc-700 font-medium leading-relaxed">
                    With <strong className="text-zinc-900">Smart AI Extraction</strong>, just drag, drop, or screenshot your document to auto-fill line items instantly. Enjoy 5 Free Document Extractions on us!
                  </p>
                </div>
              </div>
            </div>

            {/* Founder Request Callout Box */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50/90 via-orange-50/80 to-amber-50/90 border border-amber-200/90 text-amber-900 shadow-2xs space-y-2">
              <div className="flex items-center gap-2">
                <HeartHandshake className="w-4 h-4 text-amber-700 shrink-0" />
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-amber-800">
                  From One Founder to Another
                </h4>
              </div>
              <p className="text-xs sm:text-sm text-amber-900/90 leading-relaxed font-medium">
                If BillIQ saves you time today, please take 30 seconds to drop us a quick note. Your feedback directly shapes what we build next!
              </p>
            </div>

            {/* Actions */}
            <div className="pt-2 space-y-3">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <Button
                  onClick={handleTryAI}
                  className="flex-1 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 text-white font-bold py-3 px-5 rounded-xl shadow-lg shadow-brand-500/20 hover:shadow-brand-500/35 transition-all flex items-center justify-center gap-2 text-sm"
                >
                  <Zap className="w-4 h-4 fill-white/20" />
                  <span>Try AI Extraction Now</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>

                <Button
                  variant="outline"
                  onClick={handleDashboard}
                  className="border-zinc-200 hover:border-zinc-300 text-zinc-700 font-bold py-3 px-5 rounded-xl hover:bg-zinc-50 transition-colors text-sm"
                >
                  Explore Dashboard
                </Button>
              </div>

              {/* Text Link: Share Quick Feedback */}
              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={handleFeedback}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-brand-600 transition-colors cursor-pointer group underline underline-offset-4 decoration-zinc-300 hover:decoration-brand-600"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-zinc-400 group-hover:text-brand-600 transition-colors" />
                  <span>Share Quick Feedback</span>
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
