import React, { useState, useEffect } from 'react';
import { ExtractionStepShowcase } from './ExtractionStepShowcase';
import { BatchEditorShowcase } from './BatchEditorShowcase';
import { Logo } from './Logo';
import { openSupportModal } from './ContactSupportModal';
import { PrivacyPolicy } from './PrivacyPolicy';
import { TermsAndConditions } from './TermsAndConditions';
import { CookiePolicy } from './CookiePolicy';
import { 
  FileText, 
  Shield, 
  Users, 
  Activity, 
  CheckCircle2, 
  ArrowRight, 
  Building2, 
  Globe, 
  Lock, 
  Receipt, 
  TrendingUp, 
  Zap, 
  ChevronDown, 
  Search, 
  Eye, 
  Check, 
  BarChart2, 
  Layers, 
  HelpCircle, 
  Mail, 
  ExternalLink,
  Crown,
  ShieldCheck,
  Radio,
  FileCheck,
  UploadCloud,
  Camera,
  LayoutDashboard,
  Plus,
  Download,
  Truck,
  Settings,
  Bot,
  Share2,
  CreditCard,
  MapPin,
  X
} from 'lucide-react';

const currencyData = {
  USD: {
    symbol: '$',
    code: 'USD',
    flag: '🇺🇸',
    name: 'US Dollar',
    fxRate: '1.0000 USD (Base Currency)',
    incoterm: 'FOB New York (Port of NY)',
    taxLabel: 'US Sales Tax Rules Applied: Out-of-State Commercial Export (0% Sales Tax Exempt)',
    taxNameShort: 'Sales Tax (0%)',
    taxAmount: '$0.00',
    subtotal: '$12,500.00',
    total: '$12,500.00',
    buyer: 'Apex Global Agri-Logistics LLC',
    address: 'Pier 90 Terminal, 12th Ave, New York, NY 10019, USA',
    taxId: 'EIN: 12-3456789',
    items: [
      { desc: 'Automated Drip Irrigation Systems (Agri-Grade)', hsn: '8424.82', qty: 50, rate: '$180.00', amount: '$9,000.00' },
      { desc: 'High-Yield Hybrid Crop Seeds (Grade A)', hsn: '1209.91', qty: 20, rate: '$175.00', amount: '$3,500.00' },
    ]
  },
  EUR: {
    symbol: '€',
    code: 'EUR',
    flag: '🇪🇺',
    name: 'Euro',
    fxRate: '1 USD = 0.9200 EUR',
    incoterm: 'CIF Rotterdam Port',
    taxLabel: 'EU VAT Directive: Intra-Community Supply Art. 138 (Reverse Charge 0% VAT)',
    taxNameShort: 'EU VAT (0% Exempt)',
    taxAmount: '€0.00',
    subtotal: '€11,500.00',
    total: '€11,500.00',
    buyer: 'Müller Agri-Logistics GmbH',
    address: 'Hafenstrasse 42, 60327 Frankfurt am Main, Germany',
    taxId: 'VAT ID: DE987654321',
    items: [
      { desc: 'Automated Drip Irrigation Systems (Agri-Grade)', hsn: '8424.82', qty: 50, rate: '€165.60', amount: '€8,280.00' },
      { desc: 'High-Yield Hybrid Crop Seeds (Grade A)', hsn: '1209.91', qty: 20, rate: '€161.00', amount: '€3,220.00' },
    ]
  },
  GBP: {
    symbol: '£',
    code: 'GBP',
    flag: '🇬🇧',
    name: 'British Pound',
    fxRate: '1 USD = 0.7800 GBP',
    incoterm: 'DDP London Gateway Port',
    taxLabel: 'UK HMRC Compliance: Zero-Rated Export Sale under Standard Tariff Exemption',
    taxNameShort: 'UK VAT (0% Zero-Rated)',
    taxAmount: '£0.00',
    subtotal: '£9,750.00',
    total: '£9,750.00',
    buyer: 'Thames Agri-Shipping & Freight Ltd',
    address: '100 Bishopsgate, London EC2N 4AG, United Kingdom',
    taxId: 'GB VAT: 456789123',
    items: [
      { desc: 'Automated Drip Irrigation Systems (Agri-Grade)', hsn: '8424.82', qty: 50, rate: '£140.40', amount: '£7,020.00' },
      { desc: 'High-Yield Hybrid Crop Seeds (Grade A)', hsn: '1209.91', qty: 20, rate: '£136.50', amount: '£2,730.00' },
    ]
  },
  INR: {
    symbol: '₹',
    code: 'INR',
    flag: '🇮🇳',
    name: 'Indian Rupee',
    fxRate: '1 USD = 83.5000 INR',
    incoterm: 'FOB Nhava Sheva (INNSA1)',
    taxLabel: 'IGST Export Rules: Zero-Rated Supply for Overseas Export',
    taxNameShort: 'IGST (0% Zero-Rated)',
    taxAmount: '₹0.00',
    subtotal: '₹10,43,750.00',
    total: '₹10,43,750.00',
    buyer: 'GreenField Agri Logistics Ltd',
    address: 'Plot 14, MIDC Industrial Area, Taloja, Navi Mumbai, Maharashtra 410208',
    taxId: 'GSTIN: 27AAACT108211Z5',
    items: [
      { desc: 'Automated Drip Irrigation Systems (Agri-Grade)', hsn: '8424.82', qty: 50, rate: '₹15,030.00', amount: '₹7,51,500.00' },
      { desc: 'High-Yield Hybrid Crop Seeds (Grade A)', hsn: '1209.91', qty: 20, rate: '₹14,612.50', amount: '₹2,92,250.00' },
    ]
  },
  AED: {
    symbol: 'AED ',
    code: 'AED',
    flag: '🇦🇪',
    name: 'UAE Dirham',
    fxRate: '1 USD = 3.6725 AED',
    incoterm: 'CIF Jebel Ali Freezone',
    taxLabel: 'FTA UAE Directive: Designated Free Zone Export Supply (0% Zero-Rated VAT)',
    taxNameShort: 'UAE VAT (0% Free Zone)',
    taxAmount: 'AED 0.00',
    subtotal: 'AED 45,875.00',
    total: 'AED 45,875.00',
    buyer: 'Gulf Agri Freight & Trade FZE',
    address: 'LOB 15, Office 204, Jebel Ali Free Zone, Dubai, UAE',
    taxId: 'TRN: 100293847500003',
    items: [
      { desc: 'Automated Drip Irrigation Systems (Agri-Grade)', hsn: '8424.82', qty: 50, rate: 'AED 661.05', amount: 'AED 33,052.50' },
      { desc: 'High-Yield Hybrid Crop Seeds (Grade A)', hsn: '1209.91', qty: 20, rate: 'AED 641.12', amount: 'AED 12,822.50' },
    ]
  }
};

const complianceData = {
  GSTIN: {
    label: 'GSTIN (India)',
    id: '27AAACT108211Z5',
    flag: '🇮🇳',
    country: 'India (MH)',
    entityName: 'GreenField Agri Logistics Ltd',
    validationNote: 'Verified active GSTIN via Government Portal. Status: Regular Taxpayer.',
    taxTreatmentTitle: 'Zero-Rated IGST Export Supply',
    taxTreatmentDesc: 'Export ARN AD270326001234 active. 0% IGST payable at export clearance.'
  },
  VAT: {
    label: 'EU VAT (Germany)',
    id: 'DE987654321',
    flag: '🇪🇺',
    country: 'Germany (EU)',
    entityName: 'Müller Logistics GmbH',
    validationNote: 'VIES European Database Validated. Active Intra-Community VAT Entity.',
    taxTreatmentTitle: 'EU Reverse Charge Mechanism',
    taxTreatmentDesc: 'Art. 138 EU Directive applied. Recipient accounts for local VAT.'
  },
  EIN: {
    label: 'US EIN (USA)',
    id: '12-3456789',
    flag: '🇺🇸',
    country: 'United States (NY)',
    entityName: 'Apex Global Logistics LLC',
    validationNote: 'IRS Business Registry Matched. Active US Corporation.',
    taxTreatmentTitle: 'W-8BEN-E Tax Treaty Exemption',
    taxTreatmentDesc: 'Foreign commercial export exempt from US withholding tax.'
  },
  TRN: {
    label: 'UAE TRN (Dubai)',
    id: '100293847500003',
    flag: '🇦🇪',
    country: 'United Arab Emirates',
    entityName: 'Gulf Freight & Trade FZE',
    validationNote: 'FTA Tax Authority Verified. Registered Free Zone Entity.',
    taxTreatmentTitle: 'Designated Zone Export Supply',
    taxTreatmentDesc: 'Out-of-scope supply for FTA VAT under Freezone customs transit.'
  }
};

interface LandingPageProps {
  onSignIn: () => void;
  onSignUp: () => void;
  onEnterDemo: () => void;
  onOpenFeatures?: () => void;
  onNavigatePrivacy?: () => void;
  onNavigateTerms?: () => void;
  onNavigateCookie?: () => void;
  isLoggedIn?: boolean;
  userEmail?: string;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onSignIn,
  onSignUp,
  onEnterDemo,
  onOpenFeatures,
  onNavigatePrivacy,
  onNavigateTerms,
  onNavigateCookie,
  isLoggedIn = false,
  userEmail
}) => {
  const [activePolicyModal, setActivePolicyModal] = useState<'privacy' | 'terms' | 'cookie' | null>(null);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [heroTab, setHeroTab] = useState<'billing' | 'compliance'>('billing');
  const [selectedCurrency, setSelectedCurrency] = useState<'USD' | 'EUR' | 'GBP' | 'INR' | 'AED'>('USD');
  const [selectedTaxId, setSelectedTaxId] = useState<'GSTIN' | 'VAT' | 'EIN' | 'TRN'>('GSTIN');

  // Simulated live active users counter for hero preview
  const [liveUserCount, setLiveUserCount] = useState<number>(14);

  useEffect(() => {
    const interval = setInterval(() => {
      // Gentle fluctuation between 12 and 18 users
      setLiveUserCount(prev => {
        const delta = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
        return Math.min(22, Math.max(10, prev + delta));
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const faqList = [
    {
      q: "Is BillIQ free for international and cross-border billing?",
      a: "Yes! BillIQ offers a Free Forever Plan ($0 Zero Cost) with No Credit Card Required. Freelancers, global traders, exporters, small businesses, manufacturers, and agencies worldwide can create tax-compliant invoices, delivery challans, and packing lists with instant PDF download."
    },
    {
      q: "Does BillIQ support multi-currency invoices, VAT, GST, and Sales Tax?",
      a: "Yes! BillIQ provides universal multi-currency billing ($ USD, € EUR, £ GBP, ₹ INR, AED, CAD, AUD) with real-time FX exchange rate conversion and automated international tax compliance (VAT, GST, US Sales Tax, and zero-rated export tax rules)."
    },
    {
      q: "Can I generate Commercial Invoices, Packing Lists, and Delivery Challans for export?",
      a: "A complete Cross-Border Trade & Delivery Challan / Packing List Maker! With one click, you can generate Commercial Tax Invoices, Packing Lists, Delivery Challans, Shipping Bills, and LUT Declarations with automated Incoterms 2020 (FOB, CIF, DDP)."
    },
    {
      q: "How does multi-currency conversion work for international clients?",
      a: "BillIQ automatically calculates and displays foreign currency line items using real-time FX rates while printing clean multi-currency invoices with localized currency symbols and tax breakdown."
    },
    {
      q: "Is my business data safe with 100% Secure Cloud Storage?",
      a: "Yes! Your financial records, buyer databases, and invoice history are protected by 100% Secure Cloud Storage with enterprise-grade encryption and automated database backup."
    }
  ];

  return (
    <div className="w-full min-h-screen bg-white text-slate-800 font-sans selection:bg-blue-600 selection:text-white">
      {/* ---------------- SEO SCHEMA MARKUP (JSON-LD) ---------------- */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            {
              "@context": "https://schema.org",
              "@type": ["SoftwareApplication", "WebApplication"],
              "name": "BillIQ",
              "operatingSystem": "All (Web-based)",
              "applicationCategory": "BusinessApplication, FinanceApplication",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD",
                "description": "Free Forever Plan ($0 Zero Cost)"
              },
              "audience": {
                "@type": "Audience",
                "audienceType": "Freelancers, Global Traders, Exporters, Small Businesses, Distributors, Manufacturers, and Agencies worldwide"
              },
              "currenciesAccepted": "USD, EUR, GBP, INR, AED, CAD, AUD",
              "description": "Free & Fast Online Invoice Generator for Global Businesses, Exporters & Freelancers. Universal Invoicing & International Billing Software with Instant VAT, GST, Sales Tax & Commercial Invoice Generator, Cross-Border Trade & Delivery Challan / Packing List Maker with Fast B2B Invoicing with Multi-Currency & QR Payments."
            },
            {
              "@context": "https://schema.org",
              "@type": "FAQPage",
              "mainEntity": faqList.map(item => ({
                "@type": "Question",
                "name": item.q,
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": item.a
                }
              }))
            }
          ])
        }}
      />

      {/* ---------------- STICKY NAVBAR ---------------- */}
      <header className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur-md border-b border-slate-200/80 transition-all shadow-sm">
        <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 h-20 flex items-center justify-between">
          {/* Logo & Brand */}
          <Logo 
            size="lg"
            variant="dark"
            subtitleText="Global Billing & Invoicing Suite"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          />

          {/* Nav Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <button 
              onClick={() => onOpenFeatures ? onOpenFeatures() : scrollToSection('features')} 
              className="hover:text-blue-600 transition-colors cursor-pointer"
            >
              Features
            </button>
            <button 
              onClick={() => scrollToSection('how-it-works')} 
              className="hover:text-blue-600 transition-colors cursor-pointer"
            >
              How It Works
            </button>
            <button 
              onClick={() => scrollToSection('showcase')} 
              className="hover:text-blue-600 transition-colors cursor-pointer"
            >
              App Showcase
            </button>
            <button 
              onClick={() => scrollToSection('pricing')} 
              className="hover:text-blue-600 transition-colors cursor-pointer"
            >
              Pricing
            </button>
            <button 
              onClick={() => scrollToSection('faq')} 
              className="hover:text-blue-600 transition-colors cursor-pointer"
            >
              FAQ
            </button>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {isLoggedIn ? (
              <button
                onClick={onEnterDemo}
                className="px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <span>Workspace</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <>
                <button
                  onClick={onSignIn}
                  className="px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold text-slate-700 hover:text-blue-600 hover:bg-slate-100 border border-slate-200 transition-all cursor-pointer whitespace-nowrap"
                >
                  Sign In
                </button>
                <button
                  onClick={onSignUp}
                  className="px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <span className="hidden sm:inline">Get Started Free</span>
                  <span className="sm:hidden">Get Started</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ---------------- HERO SECTION ---------------- */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 overflow-hidden bg-gradient-to-b from-blue-50/70 via-white to-slate-50">
        {/* Background Gradients & Glow Effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-400/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-10 right-10 w-96 h-96 bg-indigo-400/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 relative z-10">
          <div className="text-center max-w-5xl mx-auto mb-12">
            {/* Top Pill Tag */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold mb-6 shadow-sm">
              <Zap className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
              <span>⚡ Universal Invoicing & International Billing Software • Free Forever Plan ($0)</span>
            </div>

            {/* Headline (H1) */}
            <h1 className="text-2xl sm:text-4xl lg:text-6xl font-black tracking-tight text-slate-900 leading-[1.15] mb-4 sm:mb-6">
              Free & Fast Online Invoice Generator for Global Businesses, Exporters & Freelancers
            </h1>

            {/* Subheadline */}
            <p className="text-lg sm:text-xl text-slate-600 leading-relaxed max-w-4xl mx-auto mb-8 font-normal">
              Instant VAT, GST, Sales Tax & Commercial Invoice Generator. Cross-Border Trade & Delivery Challan / Packing List Maker with Fast B2B Invoicing with Multi-Currency & QR Payments ($ USD, € EUR, £ GBP, ₹ INR, AED, CAD, AUD). Instant PDF Download & 100% Secure Cloud Storage.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
              <button
                onClick={onSignUp}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-base shadow-xl shadow-blue-600/25 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 cursor-pointer"
              >
                <Zap className="w-5 h-5 fill-current" />
                Access Free Forever Plan
              </button>
              <button
                onClick={onEnterDemo}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 hover:border-slate-300 font-bold text-base transition-all flex items-center justify-center gap-3 cursor-pointer shadow-sm"
              >
                <Eye className="w-5 h-5 text-blue-600" />
                Explore Interactive Demo
              </button>
            </div>

            {/* Trust Highlights */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-600 font-semibold">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Multi-Currency & FX Exchange Rate Support ($ USD, € EUR, £ GBP, ₹ INR, AED)
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> International Tax Compliance (VAT, Sales Tax, GST, Tax Exemption Rules)
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Incoterms 2020 Auto-Mapping (FOB, CIF, DDP)
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Zero Cost, Free Forever Plan • No Credit Card Required
              </span>
            </div>
          </div>

          {/* ---------------- HERO VISUAL FRAME (Stylized BillIQ Mockup - Global Business Hub) ---------------- */}
          <div className="relative max-w-6xl mx-auto rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-blue-900/10 overflow-hidden">
            {/* Window Topbar */}
            <div className="px-5 py-3.5 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-400" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-emerald-400" />
                <span className="ml-3 text-xs font-mono text-slate-500 font-medium hidden sm:inline-block">
                  https://billiq.site/hub/global-workspace
                </span>
              </div>

              {/* Live Status Badge in Header */}
              <div className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1 rounded-full text-xs shadow-sm">
                <Globe className="w-3.5 h-3.5 text-blue-600" />
                <span className="font-bold text-blue-600">Global Business Hub</span>
                <span className="text-slate-300">|</span>
                <span className="text-slate-700 font-mono font-semibold">Multi-Currency & Compliance Active</span>
              </div>
            </div>

            {/* Interactive Mockup Content */}
            <div className="p-5 sm:p-8 bg-slate-50/60">
              {/* Mockup Tab Switcher */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200 flex-wrap gap-4">
                <div className="flex items-center gap-1.5 sm:gap-2 bg-white p-1 rounded-xl border border-slate-200 shadow-sm overflow-x-auto max-w-full">
                  <button
                    onClick={() => setHeroTab('billing')}
                    className={`px-3.5 sm:px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                      heroTab === 'billing'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    Multi-Currency Billing
                  </button>
                  <button
                    onClick={() => setHeroTab('compliance')}
                    className={`px-3.5 sm:px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                      heroTab === 'compliance'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Global Tax Compliance
                  </button>
                </div>

                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Live Interactive Preview</span>
                </div>
              </div>

              {/* Tab 1: Multi-Currency Billing */}
              {heroTab === 'billing' && (
                <div className="space-y-5">
                  {/* Currency Selector Bar */}
                  <div className="bg-white border border-slate-200 p-3 sm:p-4 rounded-2xl shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Select Billing Currency:</span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {(['USD', 'EUR', 'GBP', 'INR', 'AED'] as const).map(curr => {
                        const active = selectedCurrency === curr;
                        const currInfo = currencyData[curr];
                        return (
                          <button
                            key={curr}
                            onClick={() => setSelectedCurrency(curr)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
                              active
                                ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm ring-2 ring-blue-500/20'
                                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                            }`}
                          >
                            <span>{currInfo.flag}</span>
                            <span>{curr}</span>
                            <span className="text-[10px] opacity-75">({currInfo.symbol.trim()})</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Commercial Invoice Live Mockup Card */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-bl-full pointer-events-none" />

                    {/* Invoice Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2.5 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[10px] font-mono font-bold uppercase tracking-wider">
                            Commercial Export Invoice
                          </span>
                          <span className="px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center gap-1">
                            <Check className="w-3 h-3" /> Verified Export
                          </span>
                        </div>
                        <h4 className="text-lg font-black text-slate-900 font-mono">#EXP-INV-2026-0891</h4>
                      </div>

                      <div className="bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl text-right">
                        <span className="text-[10px] uppercase font-bold text-slate-500 block">Real-Time FX Exchange Rate</span>
                        <span className="text-xs font-mono font-bold text-blue-700 flex items-center justify-end gap-1">
                          <Zap className="w-3 h-3 text-amber-500" />
                          {currencyData[selectedCurrency].fxRate}
                        </span>
                      </div>
                    </div>

                    {/* Buyer & Incoterms Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/80 space-y-1">
                        <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Billed To Overseas Buyer</span>
                        <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                          <span>{currencyData[selectedCurrency].flag}</span>
                          <span>{currencyData[selectedCurrency].buyer}</span>
                        </div>
                        <p className="text-slate-600 text-[11px] leading-tight">{currencyData[selectedCurrency].address}</p>
                        <div className="pt-1 flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-white border border-slate-200 font-mono font-bold text-[10px] text-slate-700">
                            {currencyData[selectedCurrency].taxId}
                          </span>
                        </div>
                      </div>

                      <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/80 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Incoterms 2020 Term</span>
                          <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded font-mono font-bold text-[10px]">
                            {currencyData[selectedCurrency].incoterm}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-600 font-medium">
                          Risk transfer & freight insurance automatically mapped to destination port rules.
                        </div>
                        <div className="flex items-center gap-2 pt-1">
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" /> Tax Rule Mapped
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Line Items Table */}
                    <div className="border border-slate-200 rounded-xl overflow-x-auto text-xs">
                      <div className="min-w-[460px]">
                        <div className="bg-slate-100 px-3.5 py-2 font-bold text-slate-700 grid grid-cols-12 gap-2 text-[11px] uppercase tracking-wider">
                          <div className="col-span-6">Item Description</div>
                          <div className="col-span-2 text-center">HS Code</div>
                          <div className="col-span-2 text-center">Qty</div>
                          <div className="col-span-2 text-right">Amount</div>
                        </div>

                        {currencyData[selectedCurrency].items.map((item, idx) => (
                          <div key={idx} className="px-3.5 py-2.5 border-t border-slate-100 grid grid-cols-12 gap-2 items-center bg-white">
                            <div className="col-span-6 font-medium text-slate-900 truncate">{item.desc}</div>
                            <div className="col-span-2 text-center font-mono text-slate-600 text-[11px]">{item.hsn}</div>
                            <div className="col-span-2 text-center font-mono text-slate-700">{item.qty}</div>
                            <div className="col-span-2 text-right font-mono font-bold text-slate-900">{item.amount}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Invoice Footer Totals */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-2 border-t border-slate-200 gap-4">
                      <div className="p-3 bg-blue-50/70 border border-blue-200/70 rounded-xl text-xs max-w-sm">
                        <div className="font-bold text-blue-900 flex items-center gap-1 mb-0.5">
                          <Globe className="w-3.5 h-3.5 text-blue-600" /> Localized Tax Regulation:
                        </div>
                        <div className="text-[11px] text-blue-800 leading-snug">
                          {currencyData[selectedCurrency].taxLabel}
                        </div>
                      </div>

                      <div className="w-full sm:w-64 space-y-1.5 text-xs">
                        <div className="flex justify-between text-slate-600">
                          <span>Subtotal:</span>
                          <span className="font-mono font-bold text-slate-900">{currencyData[selectedCurrency].subtotal}</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span className="truncate pr-2">{currencyData[selectedCurrency].taxNameShort}:</span>
                          <span className="font-mono font-bold text-emerald-600">{currencyData[selectedCurrency].taxAmount}</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-slate-200 font-extrabold text-sm text-slate-900">
                          <span>Grand Total ({selectedCurrency}):</span>
                          <span className="font-mono text-blue-600 text-base">{currencyData[selectedCurrency].total}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Global Tax Compliance */}
              {heroTab === 'compliance' && (
                <div className="space-y-5">
                  {/* Tax ID Validator Selection Bar */}
                  <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-blue-600" />
                        Automated International Tax ID & Customs Validator
                      </span>
                      <span className="text-[10px] font-mono text-emerald-600 font-bold bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" /> Real-Time API Connected
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {(['GSTIN', 'VAT', 'EIN', 'TRN'] as const).map(taxKey => {
                        const taxObj = complianceData[taxKey];
                        const active = selectedTaxId === taxKey;
                        return (
                          <button
                            key={taxKey}
                            onClick={() => setSelectedTaxId(taxKey)}
                            className={`p-2.5 rounded-xl text-left transition-all border ${
                              active
                                ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-500/20 shadow-sm'
                                : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-bold text-slate-900">{taxObj.label}</span>
                              <span className="text-xs">{taxObj.flag}</span>
                            </div>
                            <div className="text-[10px] font-mono text-slate-600 font-semibold truncate">{taxObj.id}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Active Tax Validation Card */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                            <span>{complianceData[selectedTaxId].entityName}</span>
                            <span className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded-md">VERIFIED ID</span>
                          </div>
                          <div className="text-[11px] font-mono text-slate-500">
                            {complianceData[selectedTaxId].label}: {complianceData[selectedTaxId].id}
                          </div>
                        </div>
                      </div>

                      <div className="px-3 py-1 bg-slate-100 rounded-lg text-slate-700 text-xs font-mono font-semibold self-start sm:self-auto">
                        Jurisdiction: {complianceData[selectedTaxId].country}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                        <span className="text-[10px] uppercase font-bold text-slate-500">Validation Status</span>
                        <div className="font-bold text-emerald-700 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Checked & Matched
                        </div>
                        <p className="text-[11px] text-slate-600">{complianceData[selectedTaxId].validationNote}</p>
                      </div>

                      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                        <span className="text-[10px] uppercase font-bold text-slate-500">Zero-Rated / Tax Treatment</span>
                        <div className="font-bold text-blue-700 flex items-center gap-1">
                          <Zap className="w-3.5 h-3.5 text-amber-500" /> {complianceData[selectedTaxId].taxTreatmentTitle}
                        </div>
                        <p className="text-[11px] text-slate-600">{complianceData[selectedTaxId].taxTreatmentDesc}</p>
                      </div>

                      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                        <span className="text-[10px] uppercase font-bold text-slate-500">Customs Exemption Filing</span>
                        <div className="font-bold text-purple-700 flex items-center gap-1">
                          <FileCheck className="w-3.5 h-3.5" /> ARN: AD270326001234
                        </div>
                        <p className="text-[11px] text-slate-600">Active Export Compliance Registration for zero IGST export.</p>
                      </div>
                    </div>

                    {/* Customs & Export Rules Bar */}
                    <div className="p-3.5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs gap-3">
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-blue-600 shrink-0" />
                        <span className="font-bold text-slate-800">Incoterms 2020 Rules Engine:</span>
                        <span className="text-slate-600">FOB, CIF, DDP, EXW duty formulas applied automatically.</span>
                      </div>
                      <span className="px-2.5 py-1 bg-white border border-blue-200 text-blue-700 rounded-lg font-mono text-[11px] font-bold shrink-0">
                        100% Audit Compliant
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- CORE FEATURES GRID ---------------- */}
      <section id="features" className="py-20 bg-slate-50 border-y border-slate-200 relative">
        <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12">
          <div className="text-center max-w-4xl mx-auto mb-16">
            <span className="text-blue-600 font-bold text-xs uppercase tracking-widest block mb-2">Automated AI OCR & International Tax Compliance</span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-4">
              Universal Invoicing & International Billing Software
            </h2>
            <p className="text-slate-600 text-base leading-relaxed">
              Instant VAT, GST, Sales Tax & Commercial Invoice Generator with cross-border trade compliance. Upload any order PDF or receipt image to automatically extract 10+ line items in seconds.
            </p>
          </div>

          {/* 3-Column Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1: Effortless Document Upload */}
            <div className="bg-white border border-slate-200 hover:border-blue-400 rounded-3xl p-6 transition-all group hover:-translate-y-1.5 shadow-md hover:shadow-xl flex flex-col justify-between">
              <div>
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-6 relative overflow-hidden shadow-inner group-hover:border-blue-200 transition-colors">
                  <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-200 text-[10px] font-mono text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                      <span>Document Ingestion</span>
                    </div>
                    <span>Camera / OCR</span>
                  </div>

                  <div className="border-2 border-dashed border-blue-300 rounded-xl p-4 text-center bg-white space-y-2 relative">
                    <div className="w-10 h-10 mx-auto rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                      <UploadCloud className="w-5 h-5 animate-bounce" />
                    </div>
                    <div className="text-xs font-bold text-slate-900">Drag & Drop Document Here</div>
                    <div className="text-[10px] text-slate-500 font-mono">OR PASTE (CTRL+V) ANYWHERE</div>

                    <div className="flex items-center justify-center gap-2 pt-1">
                      <span className="px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-lg text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                        <FileText className="w-3 h-3 text-blue-600" /> Select File
                      </span>
                      <span className="px-2.5 py-1 bg-blue-50 border border-blue-200 rounded-lg text-[11px] font-semibold text-blue-700 flex items-center gap-1">
                        <Camera className="w-3 h-3" /> Camera
                      </span>
                    </div>

                    <div className="absolute inset-x-0 top-1/2 h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent opacity-60 animate-pulse pointer-events-none" />
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 inline-block">
                    Camera & File Ingestion
                  </span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Instant Document Upload with 100% Secure Cloud Storage</h3>
                <p className="text-sm text-slate-600 leading-relaxed mb-4">
                  Snap a picture, paste a screenshot, or drop PDFs directly into BillIQ. Instantly ingest purchase orders, tax invoices, and receipts without manual file management.
                </p>
              </div>
            </div>

            {/* Card 2: Smart No-Typing Data Extraction */}
            <div className="bg-white border border-slate-200 hover:border-emerald-400 rounded-3xl p-6 transition-all group hover:-translate-y-1.5 shadow-md hover:shadow-xl flex flex-col justify-between">
              <div>
                {/* Animated Looping Extraction Demo */}
                <ExtractionStepShowcase />

                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 inline-block">
                    International Tax Compliance
                  </span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Instant VAT, GST, Sales Tax & Commercial Invoice Generator</h3>
                <p className="text-sm text-slate-600 leading-relaxed mb-4">
                  Extract vendor details, HSN/SAC codes, and 10+ line items in seconds. Automatically format VAT, GST, and US Sales Tax rules with zero manual typing.
                </p>
              </div>
            </div>

            {/* Card 3: Powerful Bulk Line Item Editor */}
            <div className="bg-white border border-slate-200 hover:border-indigo-400 rounded-3xl p-6 transition-all group hover:-translate-y-1.5 shadow-md hover:shadow-xl flex flex-col justify-between">
              <div>
                {/* Animated Looping Batch Editor Showcase */}
                <BatchEditorShowcase />

                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-700 px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 inline-block">
                    Cross-Border Shipping
                  </span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Cross-Border Trade & Delivery Challan / Packing List Maker</h3>
                <p className="text-sm text-slate-600 leading-relaxed mb-4">
                  Execute automated batch actions and generate matching Packing Lists, Delivery Challans, and Commercial Invoices with auto-populated Incoterms 2020 (FOB, CIF, DDP).
                </p>
              </div>
            </div>
          </div>

          {/* Primary CTA Button */}
          <div className="mt-14 text-center">
            <button
              onClick={isLoggedIn ? onEnterDemo : onSignUp}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-base rounded-2xl shadow-xl shadow-blue-500/20 hover:shadow-blue-500/35 transition-all hover:scale-105 inline-flex items-center gap-3 cursor-pointer border border-blue-400/30"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-5 h-5" />
            </button>
            <p className="text-xs text-slate-500 mt-3 font-medium">
              No credit card required • Instant access to full Global Billing & Invoicing Suite
            </p>
          </div>
        </div>
      </section>

      {/* ---------------- APP UI SHOWCASE SECTION (Laptop Device Mockup) ---------------- */}
      <section id="showcase" className="py-24 relative overflow-hidden bg-gradient-to-b from-blue-50/80 via-slate-50 to-white border-t border-slate-200">
        {/* Ambient Glow behind Laptop Mockup */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-gradient-to-tr from-blue-400/15 via-indigo-400/20 to-blue-300/15 rounded-full blur-[120px] opacity-70 pointer-events-none" />

        <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 relative z-10">
          <div className="text-center max-w-4xl mx-auto mb-12">
            <span className="text-blue-600 font-bold text-xs uppercase tracking-widest block mb-2">Interactive Global Workspace</span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-4">
              Fast B2B Invoicing with Multi-Currency & QR Payments
            </h2>
            <p className="text-slate-600 text-base">
              Toggle between live interactive application views inside our high-precision workspace interface mockup.
            </p>
          </div>

          {/* ---------------- LAPTOP DEVICE MOCKUP FRAME ---------------- */}
          <div className="relative max-w-6xl mx-auto group">
            {/* Laptop Display Screen (Upper Lid) */}
            <div className="relative rounded-t-[1.75rem] border-[10px] md:border-[14px] border-slate-800 bg-white shadow-[0_25px_60px_-15px_rgba(0,0,0,0.15)] overflow-hidden">
              {/* Webcam Notch Lens */}
              <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-slate-800 z-30 flex items-center justify-center">
                <div className="w-0.5 h-0.5 rounded-full bg-slate-500" />
              </div>

              {/* Glass Top Application Navigation Bar */}
              <div className="px-4 py-2.5 bg-slate-100 border-b border-slate-200 flex items-center justify-between text-xs z-20 relative">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  </div>
                  <span className="ml-2 font-mono text-[11px] text-slate-500 font-medium hidden sm:inline-block px-2 py-0.5 rounded bg-white border border-slate-200">
                    https://billiq.site/workspace/dashboard
                  </span>
                </div>

                {/* Right Status Badge */}
                <div className="flex items-center gap-2 bg-white border border-slate-200 px-2.5 py-1 rounded-full text-[11px] shadow-sm">
                  <Globe className="w-3.5 h-3.5 text-blue-600" />
                  <span className="font-bold text-blue-600">Export & Cross-Border Compliance Engine</span>
                </div>
              </div>

              {/* Screen Content Window Area (Full BillIQ Workspace Layout) */}
              <div className="p-3 md:p-5 bg-slate-50 min-h-[420px] md:min-h-[480px] text-slate-800 flex flex-col justify-between">
                
                {/* User Workspace Dashboard */}
                <div className="space-y-4">
                    {/* Top App Bar (Replicating Image 2 Top Navbar without Admin Console) */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-3 flex items-center justify-between shadow-sm">
                      <Logo size="sm" variant="dark" subtitleText="BILLING & INVOICING" />

                      {/* Right Header Buttons */}
                      <div className="flex items-center gap-2">
                        <div className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5">
                          <Globe className="w-3.5 h-3.5 text-blue-600" />
                          <span>IN INR</span>
                        </div>
                        <button className="px-3 py-1.5 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center gap-1 shadow-sm">
                          <Plus className="w-3.5 h-3.5" />
                          <span>New Bill</span>
                        </button>
                        <div className="px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-800 font-bold text-xs flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-slate-500" />
                          <span>User</span>
                        </div>
                        <button className="px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 font-bold text-xs flex items-center gap-1">
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>

                    {/* Main Workspace Layout (Image 2) */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                      {/* Left Navigation Card */}
                      <div className="md:col-span-3 bg-white border border-slate-200 rounded-2xl p-3.5 flex flex-col justify-between shadow-sm space-y-4">
                        <div>
                          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-3">
                            NAVIGATION
                          </span>
                          <nav className="space-y-1.5 text-xs font-semibold">
                            <div className="px-3 py-2 rounded-xl bg-blue-600 text-white font-bold flex items-center gap-2.5 shadow-sm">
                              <LayoutDashboard className="w-4 h-4" /> Dashboard
                            </div>
                            <div className="px-3 py-2 rounded-xl text-slate-600 hover:text-blue-600 flex items-center gap-2.5 transition-colors">
                              <Receipt className="w-4 h-4 text-slate-400" /> History
                            </div>
                            <div className="px-3 py-2 rounded-xl text-slate-600 hover:text-blue-600 flex items-center gap-2.5 transition-colors">
                              <Users className="w-4 h-4 text-slate-400" /> Customers
                            </div>
                            <div className="px-3 py-2 rounded-xl text-slate-600 hover:text-blue-600 flex items-center gap-2.5 transition-colors">
                              <Truck className="w-4 h-4 text-slate-400" /> Suppliers
                            </div>
                            <div className="px-3 py-2 rounded-xl text-slate-600 hover:text-blue-600 flex items-center gap-2.5 transition-colors pt-3 border-t border-slate-100 mt-2">
                              <Settings className="w-4 h-4 text-slate-400" /> Profile & Settings
                            </div>
                          </nav>
                        </div>

                        <button className="w-full py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/20">
                          <Plus className="w-4 h-4" /> Create New Bill
                        </button>
                      </div>

                      {/* Right Workspace Section */}
                      <div className="md:col-span-9 space-y-4">
                        {/* 4 Metric Cards (Image 2) */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-sm">
                            <div className="w-7 h-7 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mb-2">
                              <TrendingUp className="w-4 h-4" />
                            </div>
                            <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block mb-0.5">TOTAL SALES</span>
                            <div className="text-2xl font-black text-slate-900 font-mono">₹0</div>
                          </div>

                          <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-sm">
                            <div className="w-7 h-7 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mb-2">
                              <Truck className="w-4 h-4" />
                            </div>
                            <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block mb-0.5">TOTAL PURCHASES</span>
                            <div className="text-2xl font-black text-slate-900 font-mono">₹0</div>
                          </div>

                          <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-sm">
                            <div className="w-7 h-7 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 mb-2">
                              <Users className="w-4 h-4" />
                            </div>
                            <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block mb-0.5">SAVED CLIENTS</span>
                            <div className="text-2xl font-black text-slate-900 font-mono">0</div>
                          </div>

                          <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-sm">
                            <div className="w-7 h-7 rounded-full bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600 mb-2">
                              <Truck className="w-4 h-4" />
                            </div>
                            <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block mb-0.5">SAVED SUPPLIERS</span>
                            <div className="text-2xl font-black text-slate-900 font-mono">0</div>
                          </div>
                        </div>

                        {/* Recent Documents & Quick Actions */}
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                          {/* Recent Documents Table Card (Image 2) */}
                          <div className="sm:col-span-8 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
                            <div>
                              <h4 className="font-black text-sm text-slate-900">Recent Documents</h4>
                              <p className="text-[11px] text-slate-500 mb-3">Your latest invoices and orders</p>

                              <div className="grid grid-cols-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-200 pb-2 mb-6">
                                <span>DOCUMENT</span>
                                <span>PARTY</span>
                                <span>DATE</span>
                                <span className="text-right">AMOUNT</span>
                              </div>

                              <div className="py-6 text-center space-y-2">
                                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
                                  <Receipt className="w-6 h-6" />
                                </div>
                                <div className="font-bold text-sm text-slate-900">No documents yet</div>
                                <p className="text-xs text-slate-500 max-w-xs mx-auto">Start by creating your first invoice or order.</p>
                                <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition-all mt-1">
                                  Create New Bill
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Quick Actions Card (Image 2) */}
                          <div className="sm:col-span-4 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3 flex flex-col justify-between">
                            <div className="space-y-2.5">
                              <span className="font-black text-sm text-slate-900 block mb-1">Quick Actions</span>
                              <button className="w-full py-2.5 px-3 bg-blue-600 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/20">
                                <Zap className="w-3.5 h-3.5" /> New Invoice <ExternalLink className="w-3 h-3" />
                              </button>
                              <button className="w-full py-2 px-3 bg-white border border-slate-200 text-slate-800 font-bold text-xs rounded-xl flex items-center justify-between hover:bg-slate-50 transition-colors">
                                <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-slate-500" /> Add Customer</span>
                                <Plus className="w-3.5 h-3.5 text-slate-400" />
                              </button>
                              <button className="w-full py-2 px-3 bg-white border border-slate-200 text-slate-800 font-bold text-xs rounded-xl flex items-center justify-between hover:bg-slate-50 transition-colors">
                                <span className="flex items-center gap-1.5"><Truck className="w-3.5 h-3.5 text-slate-500" /> Add Supplier</span>
                                <Plus className="w-3.5 h-3.5 text-slate-400" />
                              </button>
                              <button className="w-full py-2 px-3 bg-emerald-50/70 border border-emerald-200 text-emerald-800 font-bold text-xs rounded-xl flex items-center justify-between hover:bg-emerald-100/50 transition-colors">
                                <span className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5 text-emerald-600" /> Export History (CSV)</span>
                                <Download className="w-3.5 h-3.5 text-emerald-600" />
                              </button>
                            </div>

                            <div className="bg-gradient-to-br from-blue-50/80 to-indigo-50/80 border border-blue-200/80 rounded-xl p-2.5">
                              <div className="flex items-center gap-1 text-blue-700 text-[10px] font-bold mb-0.5">
                                <Zap className="w-3 h-3" /> BillIQ AI
                              </div>
                              <p className="text-[9px] text-slate-600 leading-tight">
                                "Ask me to generate HSN codes, calculate tax, or format invoices..."
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
              </div>
            </div>

            {/* Laptop Base */}
            <div className="relative">
              {/* Screen Seam / Hinge Shadow */}
              <div className="h-1 bg-gradient-to-r from-slate-300 via-slate-400 to-slate-300 border-t border-slate-300" />
              
              {/* Metallic Laptop Body */}
              <div className="h-4 sm:h-5 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 rounded-b-2xl border-t border-slate-300 shadow-xl flex justify-center items-center relative">
                {/* Screen Opening Thumb Notch */}
                <div className="w-20 sm:w-28 h-1.5 sm:h-2 bg-slate-300 rounded-b-md border-t border-slate-400/80" />
              </div>

              {/* Surface Contact Shadow */}
              <div className="max-w-4xl mx-auto h-4 bg-slate-300/60 blur-md rounded-full -mt-1 pointer-events-none" />
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- HOW IT WORKS ---------------- */}
      <section id="how-it-works" className="py-20 bg-slate-50 border-t border-slate-200">
        <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-blue-600 font-bold text-xs uppercase tracking-widest block mb-2">Simple 3-Step Setup</span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-4">
              How to Generate Invoices, Delivery Challans & Export Bills in 3 Steps
            </h2>
            <p className="text-slate-600 text-base">
              Universal Invoicing & International Billing Software built for quick cross-border trade setup.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center relative shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white font-black text-xl flex items-center justify-center mx-auto mb-6 shadow-md shadow-blue-500/20">
                1
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">1. Configure Tax IDs & Company Profile</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Enter your company Tax ID (VAT, GSTIN, EIN, TRN), business address, and upload official letterheads with digital signatures for instant document branding.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center relative shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white font-black text-xl flex items-center justify-center mx-auto mb-6 shadow-md shadow-indigo-500/20">
                2
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">2. Multi-Currency Billing & Instant PDF Download</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Add line items with automatic VAT/GST/Sales Tax breakdown, choose foreign currencies ($ USD, € EUR, £ GBP, ₹ INR, AED), and download high-res PDFs in one click.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center relative shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white font-black text-xl flex items-center justify-center mx-auto mb-6 shadow-md shadow-emerald-500/20">
                3
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">3. Cross-Border Shipping & Fast QR Payments</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Instantly generate Commercial Invoices, Packing Lists, Delivery Challans, and Shipping Bills with auto-populated Incoterms (CIF, FOB, DDP) and custom QR payments.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- PRICING & PLANS SECTION ---------------- */}
      <section id="pricing" className="py-20 bg-white relative">
        <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-blue-600 font-bold text-xs uppercase tracking-widest block mb-2">Transparent Pricing</span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-4">
              Simple Pricing: Free Forever Plan & No Credit Card Required
            </h2>
            <p className="text-slate-600 text-base">
              Start free today and scale seamlessly as your business grows.
            </p>
          </div>

          <div className="relative max-w-6xl mx-auto">
            {/* Pricing Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Free Plan */}
              <div className="bg-slate-50 border border-slate-200 rounded-3xl p-8 flex flex-col justify-between shadow-sm">
                <div>
                  <span className="text-xs font-bold text-blue-600 uppercase tracking-wider block mb-2">Standard</span>
                  <h3 className="text-2xl font-black text-slate-900 mb-2">Standard Free Tier ($0)</h3>
                  <p className="text-xs text-slate-500 mb-6">Perfect for small businesses, freelancers, and traders</p>

                  <div className="mb-6">
                    <span className="text-4xl font-black text-slate-900 font-mono">₹0</span>
                    <span className="text-slate-500 text-xs"> / forever free</span>
                  </div>

                  <ul className="space-y-3 text-xs text-slate-700 mb-8">
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /> 5 Free Documents Included</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /> Quotations & Delivery Challans</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /> Export & Cross-Border Compliance Engine</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /> Local & Cloud database backup</li>
                  </ul>
                </div>

                <button
                  onClick={onSignUp}
                  className="w-full py-3 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-sm transition-all cursor-pointer"
                >
                  Get Started Free
                </button>
              </div>

              {/* Pro Plan (Highlighted) */}
              <div className="bg-white border-2 border-blue-600 rounded-3xl p-8 flex flex-col justify-between relative shadow-xl shadow-blue-500/10">
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[11px] font-black uppercase tracking-wider px-3.5 py-1 rounded-full shadow-md">
                  Most Popular
                </div>

                <div>
                  <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider block mb-2">Growth</span>
                  <h3 className="text-2xl font-black text-slate-900 mb-2">Pro Business</h3>
                  <p className="text-xs text-slate-500 mb-6">For growing manufacturers and export teams</p>

                  <div className="mb-6">
                    <span className="text-4xl font-black text-slate-900 font-mono">₹499</span>
                    <span className="text-slate-500 text-xs"> / month</span>
                  </div>

                  <ul className="space-y-3 text-xs text-slate-700 mb-8">
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /> Everything in Free</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /> Multi-Currency Export Challans</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /> Custom PDF Layout Customizer</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /> Priority Cloud Sync Storage</li>
                  </ul>
                </div>

                <button
                  onClick={onSignUp}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                >
                  Start Pro Free Trial
                </button>
              </div>

              {/* Enterprise Plan */}
              <div className="bg-slate-50 border border-slate-200 rounded-3xl p-8 flex flex-col justify-between shadow-sm">
                <div>
                  <span className="text-xs font-bold text-purple-600 uppercase tracking-wider block mb-2">Enterprise</span>
                  <h3 className="text-2xl font-black text-slate-900 mb-2">Enterprise Suite</h3>
                  <p className="text-xs text-slate-500 mb-6">For large organizations & custom billing workflows</p>

                  <div className="mb-6">
                    <span className="text-4xl font-black text-slate-900 font-mono">Custom</span>
                  </div>

                  <ul className="space-y-3 text-xs text-slate-700 mb-8">
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /> Everything in Pro</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /> Custom Export Workflows & SLAs</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /> Dedicated Account Manager</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /> Custom Audit Logs & Enterprise Security</li>
                  </ul>
                </div>

                <button
                  onClick={onSignUp}
                  className="w-full py-3 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-sm transition-all cursor-pointer"
                >
                  Contact Sales
                </button>
              </div>
            </div>

            {/* Early Access / Coming Soon Blur Overlay */}
            <div className="absolute inset-0 z-10 rounded-3xl bg-white/60 backdrop-blur-md border border-slate-200/80 shadow-xl flex items-center justify-center p-4 sm:p-8">
              <div className="bg-white/95 border border-slate-200 rounded-3xl p-6 sm:p-10 max-w-lg w-full shadow-2xl shadow-blue-500/10 text-center space-y-4">
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-black uppercase tracking-wider border border-blue-200 shadow-sm">
                  <Zap className="w-3.5 h-3.5 text-blue-600" /> EARLY ACCESS PHASE
                </span>

                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                  Get Started with 5 Free Documents
                </h3>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
                  Create tax invoices, quotations, and delivery challans instantly. Paid subscription tiers and expanded document limits will be launching soon.
                </p>

                <div className="pt-2">
                  <button
                    onClick={() => {
                      if (onSignUp) onSignUp();
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-sm shadow-lg shadow-blue-500/25 transition-all transform hover:-translate-y-0.5 cursor-pointer flex items-center justify-center gap-2 mx-auto"
                  >
                    <span>Get 5 Free Documents Now</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- INTERACTIVE FAQ ACCORDION ---------------- */}
      <section id="faq" className="py-20 bg-slate-50 border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-blue-600 font-bold text-xs uppercase tracking-widest block mb-2">Got Questions?</span>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">
              Frequently Asked Questions: Free Invoice Maker & Delivery Challans
            </h2>
          </div>

          <div className="space-y-4">
            {faqList.map((item, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div 
                  key={idx}
                  className="bg-white border border-slate-200 rounded-2xl overflow-hidden transition-all shadow-sm"
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full p-5 text-left flex items-center justify-between font-bold text-sm text-slate-900 hover:text-blue-600 transition-colors cursor-pointer"
                  >
                    <span>{item.q}</span>
                    <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${isOpen ? 'rotate-180 text-blue-600' : ''}`} />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 pt-0 text-sm text-slate-600 leading-relaxed border-t border-slate-100">
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ---------------- FOOTER & BOTTOM CTA BANNER ---------------- */}
      <footer className="bg-slate-50 border-t border-slate-200 pt-16 pb-12 relative overflow-hidden">
        {/* Bottom Banner */}
        <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 mb-16">
          <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 rounded-3xl p-8 sm:p-12 text-center text-white relative overflow-hidden shadow-xl shadow-blue-600/20">
            <div className="relative z-10 max-w-3xl mx-auto">
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-4">
                Invoicing & Global Compliance Made Simpler.
              </h2>
              <p className="text-blue-100 text-base mb-8">
                Join global businesses managing cross-border billing, tax compliance, and real-time user presence with BillIQ.
              </p>
              <button
                onClick={onSignUp}
                className="px-8 py-4 rounded-2xl bg-white hover:bg-slate-100 text-blue-950 font-black text-base shadow-xl transition-all cursor-pointer hover:scale-[1.02]"
              >
                Get Started Free Now
              </button>
            </div>
            {/* Background Accent Glow */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10 pb-12 border-b border-slate-200/80 text-xs">
            {/* Column 1: Brand */}
            <div className="space-y-3">
              <Logo size="md" variant="dark" subtitleText="Global Billing & Compliance" />
              <p className="text-slate-600 leading-relaxed font-normal">
                Global Billing & Invoicing Suite with Export & Cross-Border Compliance for International Businesses.
              </p>
            </div>

            {/* Column 2: Product */}
            <div className="space-y-3">
              <span className="font-bold text-slate-900 uppercase tracking-wider block">Product</span>
              <ul className="space-y-2.5 text-slate-600">
                <li>
                  <button 
                    type="button"
                    onClick={(e) => { e.preventDefault(); scrollToSection('features'); }} 
                    className="hover:text-blue-600 transition-colors cursor-pointer text-left"
                  >
                    Tax & Commercial Invoicing
                  </button>
                </li>
                <li>
                  <button 
                    type="button"
                    onClick={(e) => { e.preventDefault(); scrollToSection('features'); }} 
                    className="hover:text-blue-600 transition-colors cursor-pointer text-left"
                  >
                    Export & Cross-Border Compliance Engine
                  </button>
                </li>
                <li>
                  <button 
                    type="button"
                    onClick={(e) => { e.preventDefault(); onEnterDemo(); }} 
                    className="hover:text-blue-600 transition-colors cursor-pointer text-left inline-flex items-center gap-1.5"
                  >
                    <span>Interactive Demo</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-bold border border-blue-200">Guide</span>
                  </button>
                </li>
                <li>
                  <button 
                    type="button"
                    onClick={(e) => { e.preventDefault(); scrollToSection('pricing'); }} 
                    className="hover:text-blue-600 transition-colors cursor-pointer text-left"
                  >
                    Pricing Plans
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 3: Resources & Help */}
            <div className="space-y-3">
              <span className="font-bold text-slate-900 uppercase tracking-wider block">Resources & Help</span>
              <ul className="space-y-2.5 text-slate-600">
                <li>
                  <button 
                    type="button"
                    onClick={(e) => { e.preventDefault(); scrollToSection('features'); }} 
                    className="hover:text-blue-600 transition-colors cursor-pointer text-left"
                  >
                    Documentation / User Guide
                  </button>
                </li>
                <li>
                  <button 
                    type="button"
                    onClick={(e) => { e.preventDefault(); openSupportModal({ subject: 'Landing Page Help Center Inquiry' }); }} 
                    className="hover:text-blue-600 transition-colors cursor-pointer text-left inline-flex items-center gap-1.5"
                  >
                    <span>Help Center</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">⌘K</span>
                  </button>
                </li>
                <li>
                  <button 
                    type="button"
                    onClick={(e) => { e.preventDefault(); openSupportModal({ subject: 'Landing Page Contact Support' }); }} 
                    className="hover:text-blue-600 transition-colors cursor-pointer text-left"
                  >
                    Contact Support
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 4: Support & Direct Contact */}
            <div className="space-y-3">
              <span className="font-bold text-slate-900 uppercase tracking-wider block">Support & Direct Contact</span>
              <p className="text-slate-600 leading-relaxed font-normal">
                Our global compliance & technical support team is available to assist with your custom billing, tax schemas, and enterprise needs.
              </p>
              <div className="pt-1 flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-600 shrink-0" />
                <button 
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    openSupportModal({ subject: 'Landing Page Direct Contact Inquiry' });
                  }}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline select-all cursor-pointer"
                >
                  support@billiq.site
                </button>
              </div>
            </div>
          </div>

          <div className="pt-8 pb-8 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500 gap-4">
            <div className="space-y-1 text-center md:text-left">
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Disclaimer: BillIQ is 98% accurate and can make mistakes. Please verify important tax, HSN/SAC, and multi-currency values before official filing.
              </p>
              <p className="font-medium text-slate-600">
                © 2026 BillIQ. All rights reserved. Built for Global Businesses.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4 font-medium text-slate-500">
              <button 
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  if (onNavigatePrivacy) onNavigatePrivacy();
                  else setActivePolicyModal('privacy');
                }}
                className="hover:text-blue-600 transition-colors cursor-pointer"
              >
                Privacy Policy
              </button>
              <span className="text-slate-300">•</span>
              <button 
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  if (onNavigateTerms) onNavigateTerms();
                  else setActivePolicyModal('terms');
                }}
                className="hover:text-blue-600 transition-colors cursor-pointer"
              >
                Terms of Service
              </button>
              <span className="text-slate-300">•</span>
              <button 
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  if (onNavigateCookie) onNavigateCookie();
                  else setActivePolicyModal('cookie');
                }}
                className="hover:text-blue-600 transition-colors cursor-pointer"
              >
                Cookie Settings
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* Legal Document View Modal */}
      {activePolicyModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl p-6 md:p-8 my-8 max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setActivePolicyModal(null)}
              className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-zinc-800 rounded-xl hover:bg-zinc-100 transition-colors z-10 cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
            {activePolicyModal === 'terms' ? (
              <TermsAndConditions onBack={() => setActivePolicyModal(null)} />
            ) : activePolicyModal === 'cookie' ? (
              <CookiePolicy onBack={() => setActivePolicyModal(null)} />
            ) : (
              <PrivacyPolicy onBack={() => setActivePolicyModal(null)} />
            )}
          </div>
        </div>
      )}
    </div>
  );
};
