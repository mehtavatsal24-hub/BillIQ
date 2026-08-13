import React from "react";
import { motion } from "motion/react";
import { ChevronLeft, Cookie, ShieldCheck, Database, HardDrive, Settings, HelpCircle } from "lucide-react";
import { Button } from "./Button";
import { Card, CardContent } from "./Card";
import { openSupportModal } from "./ContactSupportModal";

interface CookiePolicyProps {
  onBack: () => void;
}

export const CookiePolicy: React.FC<CookiePolicyProps> = ({ onBack }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-4xl mx-auto space-y-8 pb-20"
    >
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack} className="cursor-pointer">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-black text-zinc-900 tracking-tight">Cookie & Local Storage Policy</h1>
          <p className="text-zinc-500 font-medium">Last updated: August 10, 2026</p>
        </div>
      </div>

      <Card className="border-none shadow-xl shadow-zinc-200/50 overflow-hidden bg-white">
        <div className="h-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600" />
        <CardContent className="p-8 md:p-12 space-y-10">

          {/* SECTION 1 */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 text-indigo-600">
              <Cookie className="h-6 w-6 shrink-0" />
              <h2 className="text-xl font-bold text-zinc-900">1. Overview & Privacy First Approach</h2>
            </div>
            <p className="text-zinc-600 leading-relaxed">
              At <strong>BillIQ</strong>, we respect your privacy and believe in complete transparency. Unlike traditional websites that use cookies to track your activity across the web or serve targeted advertisements, <strong>BillIQ strictly uses functional local storage and minimal session cookies</strong> solely to deliver core application functionality, high-speed document drafting, and secure user authentication.
            </p>
          </section>

          {/* SECTION 2 */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 text-indigo-600">
              <HardDrive className="h-6 w-6 shrink-0" />
              <h2 className="text-xl font-bold text-zinc-900">2. How We Use Browser Local Storage</h2>
            </div>
            <p className="text-zinc-600 leading-relaxed">
              We leverage browser <strong>Local Storage</strong> and <strong>Session Storage</strong> rather than intrusive tracking cookies. This provides instant page loading, offline document drafting, and uninterrupted workflow:
            </p>
            <ul className="list-disc pl-6 space-y-3 text-zinc-600">
              <li>
                <strong>Draft State & Offline Persistence:</strong> Local storage caches your un-saved invoice line items, party details, and customization options so you never lose work during internet interruptions or browser refreshes.
              </li>
              <li>
                <strong>User Settings & Preferences:</strong> Stores your functional currency preferences ($ USD, € EUR, £ GBP, ₹ INR, AED), default tax templates, letterhead layouts, and active workspace theme options.
              </li>
              <li>
                <strong>Authentication Tokens:</strong> Securely holds active session tokens (via Firebase Auth) to keep you signed in seamlessly across app reloads.
              </li>
            </ul>
          </section>

          {/* SECTION 3 */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 text-indigo-600">
              <ShieldCheck className="h-6 w-6 shrink-0" />
              <h2 className="text-xl font-bold text-zinc-900">3. Third-Party Services & Analytics</h2>
            </div>
            <p className="text-zinc-600 leading-relaxed">
              We maintain strict operational boundaries regarding third-party trackers:
            </p>
            <ul className="list-disc pl-6 space-y-2.5 text-zinc-600">
              <li>
                <strong>Zero Third-Party Advertising Trackers:</strong> We do NOT run ad network scripts, cross-site profiling tags, or monetization cookies (e.g. Meta Pixel, doubleclick).
              </li>
              <li>
                <strong>Essential Infrastructure Cookies:</strong> Essential session cookies are served strictly by our backend partners (such as Firebase for user authentication state and Razorpay/Stripe for secure subscription processing).
              </li>
              <li>
                <strong>Performance Monitoring:</strong> Standard aggregated browser metrics (e.g., page load speeds, API latency) are tracked without capturing confidential business billing records or personal identifiers.
              </li>
            </ul>
          </section>

          {/* SECTION 4 */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 text-indigo-600">
              <Settings className="h-6 w-6 shrink-0" />
              <h2 className="text-xl font-bold text-zinc-900">4. User Control & Clearing Storage</h2>
            </div>
            <p className="text-zinc-600 leading-relaxed">
              You retain 100% control over all data stored in your browser:
            </p>
            <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl space-y-2">
              <p className="text-xs font-bold text-zinc-800 uppercase tracking-wider">
                How to Clear Local Data
              </p>
              <p className="text-xs text-zinc-600 leading-relaxed">
                You can inspect or delete all local storage records at any time directly through your browser settings (Chrome: Settings &gt; Privacy and security &gt; Site settings &gt; Storage; Firefox / Safari: Options &gt; Privacy &gt; Cookies and Site Data). Note that clearing local storage will log you out and clear un-synced offline invoice drafts.
              </p>
            </div>
          </section>

          {/* SECTION 5 */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 text-indigo-600">
              <HelpCircle className="h-6 w-6 shrink-0" />
              <h2 className="text-xl font-bold text-zinc-900">5. Contact Support</h2>
            </div>
            <p className="text-zinc-600 leading-relaxed">
              If you have any questions or requests regarding our storage practices or privacy policies, please reach our technical support team at{" "}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  openSupportModal({ subject: "Cookie & Storage Policy Query" });
                }}
                className="text-indigo-600 underline font-semibold cursor-pointer"
              >
                support@billiq.site
              </button>.
            </p>
          </section>

          <div className="pt-10 border-t border-zinc-100 space-y-2 text-center">
            <p className="text-xs text-zinc-400">
              BillIQ Inc. — Functional Privacy & Data Transparency Standards.
            </p>
          </div>

        </CardContent>
      </Card>
    </motion.div>
  );
};
