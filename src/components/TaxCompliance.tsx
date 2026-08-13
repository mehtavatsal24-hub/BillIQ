import React from "react";
import { motion } from "motion/react";
import { 
  ChevronLeft, 
  Scale, 
  Calculator, 
  Globe2, 
  ShieldCheck, 
  Receipt, 
  FileSpreadsheet
} from "lucide-react";
import { Button } from "./Button";
import { Card, CardContent } from "./Card";
import { openSupportModal } from "./ContactSupportModal";

interface TaxComplianceProps {
  onBack: () => void;
}

export const TaxCompliance: React.FC<TaxComplianceProps> = ({ onBack }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="max-w-4xl mx-auto space-y-8 pb-20"
    >
      {/* Top Bar Navigation */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack} className="cursor-pointer">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-black text-zinc-900 tracking-tight">Global Tax & Statutory Compliance</h1>
          <p className="text-zinc-500 font-medium text-xs">VAT, GST, Statutory Tax Calculations, and Cross-Border Standards</p>
        </div>
      </div>

      <Card className="border-none shadow-xl shadow-zinc-200/50 overflow-hidden bg-white">
        <div className="h-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600" />
        <CardContent className="p-8 md:p-12 space-y-10">

          {/* Intro Section */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 text-blue-600">
              <Scale className="h-6 w-6 shrink-0" />
              <h2 className="text-xl font-bold text-zinc-900">Tax Compliance Infrastructure Overview</h2>
            </div>
            <p className="text-zinc-600 leading-relaxed">
              <strong>BillIQ</strong> is engineered from the ground up to support modern tax compliance requirements across domestic and international trade jurisdictions. Whether you are generating domestic tax invoices under Indian GST, cross-border EU VAT OSS documents, GCC VAT, or US State Sales Tax invoices, BillIQ provides structured GSTIN/VAT field validation, HSN/SAC code tracking, Place of Supply (POS) detection, multi-currency conversion, and automated tax calculations.
            </p>
          </section>

          {/* SECTION 1: VAT / GST Calculation Engine */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 text-indigo-600">
              <Calculator className="h-6 w-6 shrink-0" />
              <h2 className="text-xl font-bold text-zinc-900">1. Multi-Rate VAT & GST Calculation Engine</h2>
            </div>
            <p className="text-zinc-600 leading-relaxed">
              BillIQ automates itemized tax splits and subtotal computations tailored to regional tax regimes:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/80 space-y-2">
                <div className="flex items-center gap-2 text-zinc-900 font-bold text-sm">
                  <Receipt className="w-4 h-4 text-indigo-600" />
                  <span>Indian GST Regime</span>
                </div>
                <p className="text-xs text-zinc-600 leading-relaxed">
                  Automatic intra-state vs. inter-state detection for CGST + SGST vs. IGST splitting based on Buyer and Seller POS (Place of Supply). Full support for GSTIN format validation, HSN/SAC code categorization, Cess, and Reverse Charge Mechanism (RCM) indicators.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/80 space-y-2">
                <div className="flex items-center gap-2 text-zinc-900 font-bold text-sm">
                  <Globe2 className="w-4 h-4 text-indigo-600" />
                  <span>Global VAT & Sales Tax</span>
                </div>
                <p className="text-xs text-zinc-600 leading-relaxed">
                  EU VAT One Stop Shop (OSS) multi-rate support, UK VAT (20% standard / reduced / zero-rated), GCC VAT (UAE/KSA 5%/15%), and US State/County compound sales tax rates with VAT/Tax ID format validation.
                </p>
              </div>
            </div>

            <ul className="list-disc pl-6 space-y-2 text-zinc-600 text-xs sm:text-sm pt-2">
              <li><strong>Tax-Inclusive & Exclusive Pricing:</strong> Toggle calculation modes per line item or globally across invoice drafts.</li>
              <li><strong>Line-Item Discounting & Tax Base:</strong> Tax is computed strictly on the post-discount taxable value to maintain compliance with tax authority guidelines.</li>
              <li><strong>Exemption Certificate Tracking:</strong> Record Tax Exemption Reason codes and Tax Identification numbers directly on issued invoices.</li>
            </ul>
          </section>

          {/* SECTION 2: Cross-Border Trade & Incoterms */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 text-indigo-600">
              <Globe2 className="h-6 w-6 shrink-0" />
              <h2 className="text-xl font-bold text-zinc-900">2. Cross-Border Trade & Incoterms 2020</h2>
            </div>
            <p className="text-zinc-600 leading-relaxed">
              For commercial invoices, shipping manifests, and customs export documentation:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-zinc-600 text-xs sm:text-sm">
              <li><strong>Incoterms 2020 Compliance:</strong> Built-in selection for official International Commercial Terms (FOB, CIF, DDP, EXW, DAP, CFR) with designated ports of loading and discharge.</li>
              <li><strong>Multi-Currency Conversion:</strong> Real-time FX conversion and historical rate locking for statutory reporting in base accounting currency.</li>
              <li><strong>Zero-Rated Export Documentation:</strong> Automatic inclusion of LUT (Letter of Undertaking) details, Shipping Bill numbers, and Export Duty Disclaimers for tax-exempt international exports.</li>
            </ul>
          </section>

          {/* SECTION 3: Statutory Audit Registers */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 text-indigo-600">
              <FileSpreadsheet className="h-6 w-6 shrink-0" />
              <h2 className="text-xl font-bold text-zinc-900">3. Audit Registers & Tax Filing Exports</h2>
            </div>
            <p className="text-zinc-600 leading-relaxed">
              Easily export structured transaction logs to share with your chartered accountants or tax advisors:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1 text-xs">
              <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50 space-y-1">
                <p className="font-bold text-zinc-900">GST Return Formats (GSTR-1 / 3B)</p>
                <p className="text-zinc-600">One-click CSV/Excel exports containing itemized B2B, B2C, HSN summary, and Document Issue registers.</p>
              </div>
              <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50 space-y-1">
                <p className="font-bold text-zinc-900">SAF-T & VAT Summaries</p>
                <p className="text-zinc-600">Standard Audit File for Tax structure readiness and quarterly VAT summary breakdowns.</p>
              </div>
            </div>
          </section>

          {/* SECTION 4: Data Integrity & Disclaimer */}
          <section className="space-y-4 pt-4 border-t border-zinc-100">
            <div className="flex items-center gap-3 text-indigo-600">
              <ShieldCheck className="h-6 w-6 shrink-0" />
              <h2 className="text-xl font-bold text-zinc-900">4. Verification Disclaimer & Support</h2>
            </div>
            <p className="text-zinc-600 leading-relaxed text-xs sm:text-sm">
              While BillIQ automates tax rules and structured field checks, tax laws are subject to local legislative changes. Users are advised to review all tax rates, place of supply determinations, and GSTIN/VAT registrations with qualified tax professionals prior to filing statutory returns.
            </p>
          </section>

          {/* Footer note */}
          <div className="pt-6 text-center space-y-2 border-t border-zinc-100">
            <p className="text-xs text-zinc-500">
              Need custom tax schema configuration or enterprise tax compliance support? Contact our compliance engineering team at <button type="button" onClick={(e) => { e.preventDefault(); openSupportModal({ subject: 'Enterprise Tax Compliance Support' }); }} className="text-indigo-600 underline font-semibold cursor-pointer">support@billiq.site</button>.
            </p>
          </div>

        </CardContent>
      </Card>
    </motion.div>
  );
};
