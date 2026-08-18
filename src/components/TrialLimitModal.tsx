import React from "react";
import { Lock, CheckCircle2, ShieldAlert, ArrowRight, FileText, Rocket } from "lucide-react";
import { openSupportModal } from "./ContactSupportModal";

interface TrialLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentCount: number;
  planName?: string;
  planTier?: string;
  maxLimit?: number;
  isReRegisteredUser?: boolean;
  documentsRemaining?: number;
  customMessage?: string;
}

export const TrialLimitModal: React.FC<TrialLimitModalProps> = ({
  isOpen,
  onClose,
  documentCount = 5,
  planName = "Free Trial",
  planTier,
  maxLimit = 5,
  isReRegisteredUser = false,
  documentsRemaining,
  customMessage,
}) => {
  if (!isOpen) return null;

  // If user has bonus/granted credits remaining or is on paid tier, never show limit modal
  if (documentsRemaining !== undefined && documentsRemaining > 0) {
    return null;
  }

  const pTier = (planTier || planName || "").toLowerCase();
  if (pTier.includes("pro") || pTier.includes("enterprise") || pTier.includes("admin") || maxLimit === Infinity) {
    return null;
  }

  const limitText = maxLimit === Infinity ? "Unlimited" : `${maxLimit}`;
  const isExpiredOrReReg = isReRegisteredUser || planName.toLowerCase().includes("expired") || maxLimit === 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-zinc-100 overflow-hidden my-8">
        {/* Top Header Badge */}
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 p-6 text-white text-center relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white bg-black/20 hover:bg-black/40 rounded-full w-8 h-8 flex items-center justify-center transition-colors cursor-pointer text-sm font-bold"
          >
            ✕
          </button>
          <div className="inline-flex items-center justify-center p-3.5 bg-white/20 backdrop-blur-md rounded-2xl mb-3 shadow-inner">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <span className="inline-block px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-black uppercase tracking-wider mb-2">
            {isExpiredOrReReg ? "Free Trial Expired" : `${planName} Limit Reached`}
          </span>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            {isExpiredOrReReg ? "Trial Expired on this Email" : "Document Limit Reached"}
          </h2>
          <p className="text-xs sm:text-sm text-amber-100 mt-1 font-semibold">
            {isExpiredOrReReg ? "0 Trial Credits Remaining" : `(${documentCount}/${limitText} Documents Created)`}
          </p>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-5 text-center">
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-xs sm:text-sm font-semibold leading-relaxed text-left flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-900">
                {isExpiredOrReReg ? "Free Trial Previously Consumed" : `Maximum ${limitText} Documents Allowed for ${planName}`}
              </p>
              <p className="text-amber-800 mt-1 text-xs font-medium">
                {customMessage || (
                  isExpiredOrReReg
                    ? "You have already used your free trial on this email address. Please upgrade to Pro to create new invoices."
                    : (
                      <>
                        You have reached your limit on the {planName}. Upgrade your subscription in the Admin Panel or{" "}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            onClose();
                            openSupportModal({ subject: `Quota Limit Support Request - ${planName}` });
                          }}
                          className="font-bold underline text-amber-900 hover:text-amber-950 cursor-pointer"
                        >
                          contact support
                        </button>{" "}
                        to increase your document creation limit.
                      </>
                    )
                )}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4 text-left">
            <div className="flex justify-between items-center text-xs font-bold text-zinc-700 mb-2">
              <span className="flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-amber-600" />
                Document Usage ({planName})
              </span>
              <span className="text-amber-600 font-black">{documentCount} / {limitText}</span>
            </div>
            <div className="w-full bg-zinc-200 h-3 rounded-full overflow-hidden">
              <div className="bg-gradient-to-r from-amber-500 to-red-500 h-full w-full rounded-full transition-all duration-500" />
            </div>
          </div>

          {/* Feature Highlights */}
          <div className="text-left space-y-2">
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">What happens next?</p>
            <div className="space-y-1.5 text-xs text-zinc-700">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Access all {documentCount} previously generated invoices & PDFs</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Export reports to Excel & CSV format anytime</span>
              </div>
              <div className="flex items-center gap-2">
                <Rocket className="w-4 h-4 text-blue-500 shrink-0" />
                <span>Instant real-time unlock when plan is upgraded</span>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={onClose}
            className="w-full py-3.5 px-6 bg-zinc-900 hover:bg-zinc-800 text-white font-bold rounded-2xl shadow-lg transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer text-sm"
          >
            <span>Manage My Created Documents</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

