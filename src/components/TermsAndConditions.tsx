import React from "react";
import { motion } from "motion/react";
import { ChevronLeft, FileText, Scale, AlertTriangle, CreditCard, UserCheck, Gavel, Database, ShieldCheck } from "lucide-react";
import { Button } from "./Button";
import { Card, CardContent } from "./Card";
import { openSupportModal } from "./ContactSupportModal";

interface TermsAndConditionsProps {
  onBack: () => void;
}

export const TermsAndConditions = ({ onBack }: TermsAndConditionsProps) => {
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
          <h1 className="text-3xl font-black text-zinc-900 tracking-tight">Terms & Conditions</h1>
          <p className="text-zinc-500 font-medium">Last updated: August 4, 2026</p>
        </div>
      </div>

      <Card className="border-none shadow-xl shadow-zinc-200/50 overflow-hidden bg-white">
        <div className="h-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600" />
        <CardContent className="p-8 md:p-12 space-y-10">

          {/* SECTION 1 */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 text-indigo-600">
              <Gavel className="h-6 w-6 shrink-0" />
              <h2 className="text-xl font-bold text-zinc-900">1. Agreement to Terms & Definitions</h2>
            </div>
            <p className="text-zinc-600 leading-relaxed">
              By accessing, registering, or using the <strong>BillIQ</strong> software, web applications, mobile interfaces, or integrated artificial intelligence (AI) and Optical Character Recognition (OCR) tools (collectively, the "Services"), you agree to be bound by these Terms and Conditions.
            </p>
            <p className="text-zinc-600 leading-relaxed">
              These Terms constitute a legally binding agreement between you ("User", "you", or "your") and <strong>BillIQ Inc.</strong> ("BillIQ", "we", "us", or "our"). These terms operate in strict compliance with applicable statutory regulations, including the <strong>Information Technology Act, 2000</strong>, the <strong>Consumer Protection Act, 2019</strong> (and Consumer Protection E-Commerce Rules, 2020) of India, as well as recognized global data protection and privacy frameworks (including GDPR principles where applicable).
            </p>
            <p className="text-zinc-600 leading-relaxed text-sm bg-zinc-50 p-4 rounded-xl border border-zinc-200/80">
              If you do not agree to all provisions contained within these Terms, you are expressly prohibited from accessing or using the Services and must immediately cease all usage.
            </p>
          </section>

          {/* SECTION 2 */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 text-indigo-600">
              <UserCheck className="h-6 w-6 shrink-0" />
              <h2 className="text-xl font-bold text-zinc-900">2. User Responsibilities & Data Accuracy</h2>
            </div>
            <p className="text-zinc-600 leading-relaxed">
              As a user of BillIQ, you bear sole responsibility for ensuring the legal, regulatory, and fiscal validity of all generated financial documents. Your obligations include:
            </p>
            <ul className="list-disc pl-6 space-y-2.5 text-zinc-600">
              <li>
                <strong>Verification of Invoicing Details:</strong> You must explicitly verify all line items, sub-totals, tax rates (including GST, VAT, Sales Tax, and withholding taxes), currency conversions, GSTIN/VAT numbers, and shipping terms (Incoterms 2020) prior to finalizing and issuing any invoice or quotation to clients.
              </li>
              <li>
                <strong>Global Fiscal Compliance:</strong> Ensuring that issued invoices comply with regional tax authority regulations (e.g., applicable GST tax invoicing rules in India, statutory tax formatting standards, HSN/SAC code categorization, cross-border export compliance, and reverse charge mechanisms).
              </li>
              <li>
                <strong>AI & Automated OCR Disclaimer:</strong> Our AI vision and automated document extraction engines are provided strictly as auxiliary convenience tools. Automated field parsing is inherently probabilistic. You <strong>MUST AUDIT ALL PARSED FIELDS</strong> before saving or sending documents. BillIQ bears zero liability for incorrect tax filings, missed line items, OCR misreadings, penalties, or financial discrepancies resulting from unverified AI extractions.
              </li>
              <li>
                <strong>Accountability for Content:</strong> Ensuring that all data, items, and descriptions entered into BillIQ do not infringe upon third-party rights or violate applicable trade and export control laws.
              </li>
            </ul>
          </section>

          {/* SECTION 3 */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 text-indigo-600">
              <Database className="h-6 w-6 shrink-0" />
              <h2 className="text-xl font-bold text-zinc-900">3. Data Storage, Cloud Sync & Security</h2>
            </div>
            <p className="text-zinc-600 leading-relaxed">
              To provide seamless performance, offline resilience, and cross-device functionality, BillIQ utilizes a hybrid storage architecture:
            </p>
            <ul className="list-disc pl-6 space-y-2.5 text-zinc-600">
              <li>
                <strong>Hybrid Cloud & Local Synchronization:</strong> Your user profile, business preferences, customer records, and invoice data are processed through client-side local caching/storage for immediate offline responsiveness and securely synchronized with encrypted cloud servers (e.g., Firestore) to enable multi-device access, real-time presence, and administrator support.
              </li>
              <li>
                <strong>Credential Security:</strong> You are strictly responsible for maintaining the confidentiality of your account credentials, login tokens, and authentication sessions. You must immediately notify BillIQ of any unauthorized access or security breach regarding your account.
              </li>
              <li>
                <strong>Data Backups & Export Obligations:</strong> While BillIQ maintains cloud state redundancy, you are strongly encouraged to routinely download and archive your generated PDF invoices, JSON exports, and financial registers for accounting compliance and statutory record retention.
              </li>
            </ul>
          </section>

          {/* SECTION 4 */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 text-indigo-600">
              <ShieldCheck className="h-6 w-6 shrink-0" />
              <h2 className="text-xl font-bold text-zinc-900">4. Intellectual Property Rights</h2>
            </div>
            <p className="text-zinc-600 leading-relaxed">
              We respect your data rights while safeguarding our technological infrastructure:
            </p>
            <ul className="list-disc pl-6 space-y-2.5 text-zinc-600">
              <li>
                <strong>BillIQ Proprietary Assets:</strong> All software code, algorithms, user interface designs, logos, trademarks, brand collateral, and documentation associated with BillIQ are the exclusive intellectual property of <strong>BillIQ Inc.</strong> You may not reverse engineer, decompile, copy, modify, or create derivative works from any part of our platform.
              </li>
              <li>
                <strong>User Data Ownership:</strong> You retain complete, unencumbered ownership of all proprietary business data, customer details, product inventories, and uploaded invoice documents processed through the Services. BillIQ claims no ownership over your business content.
              </li>
            </ul>
          </section>

          {/* SECTION 5 */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 text-indigo-600">
              <CreditCard className="h-6 w-6 shrink-0" />
              <h2 className="text-xl font-bold text-zinc-900">5. Subscriptions, Billing & Cancellations</h2>
            </div>
            <p className="text-zinc-600 leading-relaxed">
              Access to enhanced capabilities, higher document quotas, and specialized AI features is governed by our subscription plans:
            </p>
            <ul className="list-disc pl-6 space-y-2.5 text-zinc-600">
              <li>
                <strong>Plan Tiers:</strong> BillIQ offers Free Trial/Tier plans, Pro Subscription tiers, and custom Enterprise suites. Plan specifications, document limits, and fee schedules are presented on our pricing page.
              </li>
              <li>
                <strong>Payment Processing:</strong> Subscriptions are processed via certified third-party payment gateway partners. By providing payment information, you authorize our processors to charge the applicable subscription fees and relevant statutory taxes.
              </li>
              <li>
                <strong>Auto-Renewal & Cancellation:</strong> Paid plans renew automatically at the end of each billing cycle unless cancelled prior to the renewal date. You may cancel your subscription at any time via your account settings. In compliance with the <strong>Consumer Protection (E-Commerce) Rules, 2020</strong>, cancellations take effect at the end of the current billing cycle, and access remains active until then. Partial-period refunds are not provided unless required by statutory law.
              </li>
            </ul>
          </section>

          {/* SECTION 6 */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 text-indigo-600">
              <AlertTriangle className="h-6 w-6 shrink-0" />
              <h2 className="text-xl font-bold text-zinc-900">6. Limitation of Liability & Disclaimers</h2>
            </div>
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
              <p className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                Warranty Disclaimer ("AS IS" & "AS AVAILABLE")
              </p>
              <p className="text-xs text-amber-800 leading-relaxed">
                THE SERVICES, INCLUDING ALL AI OCR TOOLS, DOCUMENT GENERATORS, AND TAX CALCULATORS, ARE PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.
              </p>
            </div>
            <p className="text-zinc-600 leading-relaxed">
              To the maximum extent permitted under applicable law:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-zinc-600">
              <li>
                BillIQ Inc. shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, revenue, business data, goodwill, or tax audit penalties arising from your reliance on generated invoices.
              </li>
              <li>
                <strong>Cap on Financial Liability:</strong> In any event, BillIQ's total aggregate liability arising out of or related to these Terms or the Services shall not exceed the total amount paid by you to BillIQ in the twelve (12) months immediately preceding the event giving rise to liability, or $50 USD (or equivalent in local currency) if on a free tier.
              </li>
            </ul>
          </section>

          {/* SECTION 7 */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 text-indigo-600">
              <Scale className="h-6 w-6 shrink-0" />
              <h2 className="text-xl font-bold text-zinc-900">7. Governing Law & Dispute Resolution</h2>
            </div>
            <p className="text-zinc-600 leading-relaxed">
              These Terms shall be governed by, interpreted, and construed in accordance with the <strong>Laws of India</strong>, without giving effect to conflicts of law principles. Any dispute, legal action, or proceeding arising out of or relating to these Terms or the Services shall be brought exclusively before the competent <strong>Courts in India</strong>.
            </p>
          </section>

          {/* SECTION 8 */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 text-indigo-600">
              <FileText className="h-6 w-6 shrink-0" />
              <h2 className="text-xl font-bold text-zinc-900">8. Modifications & Service Updates</h2>
            </div>
            <p className="text-zinc-600 leading-relaxed">
              BillIQ reserves the right to revise or update these Terms at any time to reflect software changes, regulatory updates, or operational enhancements. Significant revisions will be signaled by updating the "Last updated" timestamp at the top of this document. Your continued use of the Services following such updates signifies your binding acceptance of the revised Terms.
            </p>
          </section>

          <div className="pt-10 border-t border-zinc-100 space-y-2 text-center">
            <p className="text-xs text-zinc-500">
              For any legal inquiries regarding these Terms & Conditions, please contact our legal compliance team at <button type="button" onClick={(e) => { e.preventDefault(); openSupportModal({ subject: 'Legal & Terms Inquiry' }); }} className="text-indigo-600 underline font-semibold cursor-pointer">support@billiq.site</button>.
            </p>
            <p className="text-xs text-zinc-400">
              By using our software, you confirm that you have read, understood, and agreed to these Terms & Conditions.
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

