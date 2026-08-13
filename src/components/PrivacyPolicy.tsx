import React from "react";
import { motion } from "motion/react";
import { ChevronLeft, Shield, Lock, Eye, Database, UserCheck, Scale, Cpu, Server, FileText } from "lucide-react";
import { Button } from "./Button";
import { Card, CardContent } from "./Card";
import { openSupportModal } from "./ContactSupportModal";

interface PrivacyPolicyProps {
  onBack: () => void;
}

export const PrivacyPolicy = ({ onBack }: PrivacyPolicyProps) => {
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
          <h1 className="text-3xl font-black text-zinc-900 tracking-tight">Privacy Policy</h1>
          <p className="text-zinc-500 font-medium">Last updated: August 4, 2026</p>
        </div>
      </div>

      <Card className="border-none shadow-xl shadow-zinc-200/50 overflow-hidden bg-white">
        <div className="h-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600" />
        <CardContent className="p-8 md:p-12 space-y-10">

          {/* SECTION 1 */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 text-indigo-600">
              <Shield className="h-6 w-6 shrink-0" />
              <h2 className="text-xl font-bold text-zinc-900">1. Data Architecture & Privacy Philosophy</h2>
            </div>
            <p className="text-zinc-600 leading-relaxed">
              At <strong>BillIQ Inc.</strong> ("BillIQ", "we", "us", or "our"), safeguarding your corporate and personal data is a foundational priority. This Privacy Policy details our data collection, processing, and protection practices in full compliance with the <strong>Information Technology Act, 2000</strong>, the <strong>Digital Personal Data Protection Act (DPDP), 2023</strong> of India, and global data protection frameworks.
            </p>
            <p className="text-zinc-600 leading-relaxed">
              <strong>Hybrid Processing Architecture:</strong> BillIQ operates a secure, high-performance hybrid data model. User data is processed using client-side local caching and state management for instant offline responsiveness, combined with encrypted cloud synchronization via enterprise database infrastructure. This hybrid approach enables seamless multi-device account access, automated state backups, and robust data recovery.
            </p>
          </section>

          {/* SECTION 2 */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 text-indigo-600">
              <Database className="h-6 w-6 shrink-0" />
              <h2 className="text-xl font-bold text-zinc-900">2. Categories of Information Collected</h2>
            </div>
            <p className="text-zinc-600 leading-relaxed">
              We collect and process specific categories of data required to deliver core invoicing, taxation, and billing functionalities:
            </p>
            <ul className="list-disc pl-6 space-y-3 text-zinc-600">
              <li>
                <strong>Personal Identification Data:</strong> Full name, business email address, authenticated account credentials, profile preferences, and active subscription status.
              </li>
              <li>
                <strong>Business & Billing Information:</strong> Statutory Tax Identifiers (GSTIN, VAT, PAN, EIN), registered business addresses, functional currency settings, bank account/settlement details, and uploaded corporate logos.
              </li>
              <li>
                <strong>Document & Operational Content:</strong> Generated invoices, proforma bills, credit notes, quotations, customer directories, item catalogs, logistics parameters (Incoterms 2020), standard tax fields (GSTIN/VAT identifiers, HSN/SAC codes, Place of Supply), and optical character recognition (OCR) parsing metadata.
              </li>
            </ul>
          </section>

          {/* SECTION 3 */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 text-indigo-600">
              <Cpu className="h-6 w-6 shrink-0" />
              <h2 className="text-xl font-bold text-zinc-900">3. Automated AI & Document OCR Processing</h2>
            </div>
            <p className="text-zinc-600 leading-relaxed">
              BillIQ integrates advanced artificial intelligence (AI) vision and Optical Character Recognition (OCR) engines to automate document data extraction:
            </p>
            <div className="p-4 bg-indigo-50/60 border border-indigo-100 rounded-xl space-y-2">
              <p className="text-xs font-bold text-indigo-900 uppercase tracking-wider">
                Stateless & Secure Model Inference
              </p>
              <p className="text-xs text-indigo-800 leading-relaxed">
                When you upload a document or scan an invoice image for automated extraction, data is transmitted over TLS-encrypted channels to secure inference servers strictly to extract and populate invoice form fields. AI processing is completely user-directed and stateless; uploaded documents and parsed data are not submitted to external government portals or tax authority registration services.
              </p>
            </div>
            <ul className="list-disc pl-6 space-y-2 text-zinc-600">
              <li>
                <strong>No Foundational Model Training:</strong> Uploaded document content, extracted line items, customer names, and invoice values are <strong>NEVER used to train, fine-tune, or improve public AI models</strong>.
              </li>
              <li>
                <strong>User Audit Control:</strong> All AI-extracted fields remain staging proposals until reviewed and confirmed by the user.
              </li>
            </ul>
          </section>

          {/* SECTION 4 */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 text-indigo-600">
              <Lock className="h-6 w-6 shrink-0" />
              <h2 className="text-xl font-bold text-zinc-900">4. Data Security & Third-Party Integrations</h2>
            </div>
            <p className="text-zinc-600 leading-relaxed">
              We employ enterprise-grade technical and organizational safeguards to ensure data integrity:
            </p>
            <ul className="list-disc pl-6 space-y-2.5 text-zinc-600">
              <li>
                <strong>Encryption Protocols:</strong> All data in transit is protected using Industry Standard Transport Layer Security (TLS 1.3/SSL encryption). Data stored at rest within our enterprise cloud databases utilizes AES-256 encryption.
              </li>
              <li>
                <strong>Third-Party Service Providers:</strong> We engage certified third-party service providers (such as payment processing gateways, cloud database infrastructure, and transactional email processors) strictly to fulfill system functionality. Third parties are contractually bound to access data solely for designated operations and cannot monetize or re-share user information.
              </li>
              <li>
                <strong>Zero Commercial Monetization:</strong> BillIQ strictly does not sell, rent, lease, or trade user data to advertisers or third-party data brokers.
              </li>
            </ul>
          </section>

          {/* SECTION 5 */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 text-indigo-600">
              <UserCheck className="h-6 w-6 shrink-0" />
              <h2 className="text-xl font-bold text-zinc-900">5. Statutory User Rights (DPDP Act, 2023)</h2>
            </div>
            <p className="text-zinc-600 leading-relaxed">
              Under the <strong>Digital Personal Data Protection Act (DPDP), 2023</strong> and international privacy laws, you possess the following actionable data rights:
            </p>
            <ul className="list-disc pl-6 space-y-2.5 text-zinc-600">
              <li>
                <strong>Right to Access:</strong> You can inspect all personal data, business settings, and stored invoice history held in your account at any time.
              </li>
              <li>
                <strong>Right to Correction & Updating:</strong> You have full self-service capabilities to update or correct any personal or corporate information.
              </li>
              <li>
                <strong>Right to Erasure & Account Deletion:</strong> You can request permanent account deletion and data purge directly from account settings or by contacting our data protection team.
              </li>
              <li>
                <strong>Right to Withdraw Consent:</strong> You may revoke consent for cloud synchronization or email communications at any time, subject to essential account authentication operations.
              </li>
            </ul>
          </section>

          {/* SECTION 6 */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 text-indigo-600">
              <Server className="h-6 w-6 shrink-0" />
              <h2 className="text-xl font-bold text-zinc-900">6. Data Retention & Account Portability</h2>
            </div>
            <p className="text-zinc-600 leading-relaxed">
              We retain user records for as long as your account remains active or as required by applicable tax retention laws. Users can export their entire invoice history and client database at any time in standardized format (JSON / PDF) to ensure full data portability.
            </p>
          </section>

          {/* SECTION 7 */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 text-indigo-600">
              <Scale className="h-6 w-6 shrink-0" />
              <h2 className="text-xl font-bold text-zinc-900">7. Policy Updates & Contact Information</h2>
            </div>
            <p className="text-zinc-600 leading-relaxed">
              We may periodically update this Privacy Policy to reflect technical upgrades or legal requirements. Updated versions will be published with an adjusted timestamp. Continued use of BillIQ indicates acceptance of the revised terms.
            </p>
          </section>

          <div className="pt-10 border-t border-zinc-100 space-y-2 text-center">
            <p className="text-xs text-zinc-500">
              If you have any questions, privacy grievances, or data subject requests, please reach our Data Protection Officer at <button type="button" onClick={(e) => { e.preventDefault(); openSupportModal({ subject: 'Privacy Grievance & Data Request' }); }} className="text-indigo-600 underline font-semibold cursor-pointer">support@billiq.site</button>.
            </p>
            <p className="text-xs text-zinc-400">
              BillIQ Inc. — Enterprise-Grade Privacy & Compliance Security.
            </p>
          </div>

        </CardContent>
      </Card>
    </motion.div>
  );
};

