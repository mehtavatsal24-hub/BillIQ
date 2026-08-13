import React, { useState } from "react";
import { MessageSquareHeart, Send, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

interface FeedbackModalProps {
  isOpen: boolean;
  userEmail?: string;
  userId?: string;
  onSubmitSuccess: (surveyData: any) => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  userEmail,
  userId,
  onSubmitSuccess,
}) => {
  const [q1TimeSaved, setQ1TimeSaved] = useState("Saved 15-30 mins");
  const [q2BetterSoftware, setQ2BetterSoftware] = useState("Much Better");
  const [q3LikedConcept, setQ3LikedConcept] = useState("Loved it!");
  const [q4PaidIntent, setQ4PaidIntent] = useState("Yes, definitely");
  const [q5RecommendedFeatures, setQ5RecommendedFeatures] = useState("");
  
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!q5RecommendedFeatures.trim()) {
      setError("Please share at least one feature recommendation or feedback note in Question 5.");
      return;
    }

    setError("");
    setIsSubmitting(true);

    const payload = {
      userId: userId || "Guest User",
      userEmail: userEmail || "Anonymous",
      q1_timeSaved: q1TimeSaved,
      q2_betterSoftware: q2BetterSoftware,
      q3_likedConcept: q3LikedConcept,
      q4_paidIntent: q4PaidIntent,
      q5_recommendedFeatures: q5RecommendedFeatures.trim(),
      timestamp: new Date().toISOString(),
    };

    try {
      // 1. Submit to API endpoint (triggers email to support@billiq.site)
      const response = await fetch("/api/survey-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        console.warn("Survey API returned non-200, proceeding with fallback local storage.");
      }
    } catch (err) {
      console.error("Failed to post feedback to API:", err);
    } finally {
      setIsSubmitting(false);
      onSubmitSuccess(payload);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-md p-4 overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-zinc-100 overflow-hidden my-8">
        {/* Top Gradient Banner */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-6 text-white text-center relative">
          <div className="inline-flex items-center justify-center p-3 bg-white/20 backdrop-blur-md rounded-2xl mb-3 shadow-inner">
            <MessageSquareHeart className="w-8 h-8 text-white animate-bounce" />
          </div>
          <span className="inline-block px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-black uppercase tracking-wider mb-2">
            1st Document Milestone Completed 🎉
          </span>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">Quick Feedback Survey</h2>
          <p className="text-xs sm:text-sm text-blue-100 mt-1 font-medium max-w-sm mx-auto">
            Congrats on creating your 1st document! Please take 30 seconds to answer 5 short questions to help us improve.
          </p>
        </div>

        {/* Survey Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs font-bold text-red-700 animate-shake">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Question 1 */}
          <div>
            <label className="block text-xs font-bold text-zinc-800 mb-1.5 flex items-center gap-1.5">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-[11px] font-black">1</span>
              Did this save your time, and by how much? <span className="text-red-500">*</span>
            </label>
            <select
              value={q1TimeSaved}
              onChange={(e) => setQ1TimeSaved(e.target.value)}
              className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-semibold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="Saved 5-10 mins">Saved 5-10 mins</option>
              <option value="Saved 15-30 mins">Saved 15-30 mins</option>
              <option value="Saved over 30 mins">Saved over 30 mins</option>
              <option value="Did not save time">Did not save time</option>
            </select>
          </div>

          {/* Question 2 */}
          <div>
            <label className="block text-xs font-bold text-zinc-800 mb-1.5 flex items-center gap-1.5">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-[11px] font-black">2</span>
              Is it better than your current software? <span className="text-red-500">*</span>
            </label>
            <select
              value={q2BetterSoftware}
              onChange={(e) => setQ2BetterSoftware(e.target.value)}
              className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-semibold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="Much Better">Much Better</option>
              <option value="Slightly Better">Slightly Better</option>
              <option value="About the Same">About the Same</option>
              <option value="Worse than current tool">Worse than current tool</option>
            </select>
          </div>

          {/* Question 3 */}
          <div>
            <label className="block text-xs font-bold text-zinc-800 mb-1.5 flex items-center gap-1.5">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-[11px] font-black">3</span>
              Did you like our idea & concept? <span className="text-red-500">*</span>
            </label>
            <select
              value={q3LikedConcept}
              onChange={(e) => setQ3LikedConcept(e.target.value)}
              className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-semibold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="Loved it!">Loved it!</option>
              <option value="Liked it">Liked it</option>
              <option value="Needs Improvement">Needs Improvement</option>
              <option value="Not useful for me">Not useful for me</option>
            </select>
          </div>

          {/* Question 4 */}
          <div>
            <label className="block text-xs font-bold text-zinc-800 mb-1.5 flex items-center gap-1.5">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-[11px] font-black">4</span>
              Would you use this app if it gets a paid subscription? <span className="text-red-500">*</span>
            </label>
            <select
              value={q4PaidIntent}
              onChange={(e) => setQ4PaidIntent(e.target.value)}
              className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-semibold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="Yes, definitely">Yes, definitely</option>
              <option value="Depends on pricing">Depends on pricing</option>
              <option value="Only if more features are added">Only if more features are added</option>
              <option value="No">No</option>
            </select>
          </div>

          {/* Question 5 */}
          <div>
            <label className="block text-xs font-bold text-zinc-800 mb-1.5 flex items-center gap-1.5">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-[11px] font-black">5</span>
              Any add-on feature you recommend for quicker document creation? <span className="text-red-500">*</span>
            </label>
            <textarea
              value={q5RecommendedFeatures}
              onChange={(e) => {
                setQ5RecommendedFeatures(e.target.value);
                if (error) setError("");
              }}
              rows={3}
              placeholder="e.g., Auto-fill customer details from GSTIN, AI batch extraction from WhatsApp PDF, Excel bulk export..."
              className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-normal text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-zinc-400 resize-none"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 px-6 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Submitting Feedback...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Submit Feedback & Unlock Creation</span>
              </>
            )}
          </button>
          
          <p className="text-[10px] text-center text-zinc-600 font-medium">
            Your input is sent directly to our product development team. Thank you!
          </p>
        </form>
      </div>
    </div>
  );
};
