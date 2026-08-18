/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { 
  Plus, 
  FileText, 
  Settings, 
  Download, 
  Building2, 
  Package, 
  ChevronRight,
  ChevronLeft,
  History,
  CheckCircle2,
  AlertCircle,
  LayoutDashboard,
  Users,
  Truck,
  Trash2,
  Clock,
  Zap,
  Bot,
  Shield,
  Scale,
  Loader2,
  LogIn,
  Eye,
  EyeOff,
  Check,
  X,
  PlusCircle,
  XCircle,
  ShieldCheck,
  Sparkles,
  Camera,
  Box,
  Wand2,
  Cloud,
  Database,
  RefreshCw,
  AlertTriangle,
  Globe,
  Receipt,
  MapPin,
  LogOut,
  Save,
  User as UserIcon,
  Lock,
  Mail,
  UserCheck,
  HelpCircle,
  FileSpreadsheet,
  BarChart3,
  TrendingUp,
  Gift,
  ArrowRight
} from "lucide-react";
import { Analytics } from "@vercel/analytics/react";
import { smartAnalyzeDimensionalReport, checkTolerances, smartGenerateMtcData } from './services/geminiService';
import { motion, AnimatePresence } from "motion/react";
import JSZip from "jszip";
import { getUniquePhysicalBoxesCount } from "./lib/boxUtils";
import { getDisplayErrorMessage, isDeveloperAccount, formatDetailedDeveloperError } from "./utils/errorUtils";
import { 
  BusinessDetails, 
  CustomerDetails, 
  LineItem, 
  DocumentType, 
  InvoiceData,
  SavedCustomer,
  SavedSupplier,
  DocumentHistoryItem,
  PriceHistoryItem,
  AIDocumentAnalysis,
  PDFLayoutSettings,
  BUSINESS_INDUSTRIES,
  UserOverrides,
  UserOverrideAuditLog,
  LastUsedNotesAndTerms,
  PackagingDispatchItem,
  InspectionParameter,
  NcrItem,
  EvidenceItem,
  DimensionalOrderItem,
  MeasuredValue,
  CostSheetSupplierSummary,
  CostSheetRowSummary
} from "./types";
import { 
  FLANGE_STANDARDS_75_B,
  FLANGE_STANDARDS_150, 
  FLANGE_STANDARDS_300, 
  FLANGE_STANDARDS_600, 
  FLANGE_STANDARDS_900,
  FLANGE_STANDARDS_150_A,
  FLANGE_STANDARDS_150_B,
  FLANGE_STANDARDS_300_A,
  FLANGE_STANDARDS_300_B,
  FLANGE_STANDARDS_400,
  FLANGE_STANDARDS_400_A,
  FLANGE_STANDARDS_400_B,
  FLANGE_STANDARDS_600_A,
  FLANGE_STANDARDS_600_B,
  FLANGE_STANDARDS_900_A,
  FLANGE_STANDARDS_900_B,
  FLANGE_STANDARDS_1500,
  FLANGE_STANDARDS_2500,
  FITTING_STANDARDS,
  FORGED_FITTING_STANDARDS
} from "./data/dimensionalStandards";
import { validateGSTIN, validateEmail, validatePhone, validateRequired } from "./lib/validation";
import { DEFAULT_TERMS, DOCUMENT_TYPE_OPTIONS, CURRENCY_SYMBOLS, OWNER_EMAIL, normalizeUnit } from "./constants";
import { Input } from "./components/Input";
import { Button } from "./components/Button";
import { Card, CardHeader, CardContent } from "./components/Card";
import { LineItemRow } from "./components/LineItemRow";
import { VoiceInput } from "./components/VoiceInput";
import { DocumentUpload } from "./components/DocumentUpload";
import { LandedCostSheet } from "./components/LandedCostSheet";
import { BulkEditor } from "./components/BulkEditor";
import { CustomerSelector } from "./components/CustomerSelector";
import { Dashboard } from "./components/Dashboard";
import { AnalyticsView } from "./components/AnalyticsView";
import { PartyList } from "./components/PartyList";
import { generateInvoicePDF, downloadInvoicePDF } from "./services/pdfService";
import { exportLandedCostSheetToExcel, exportInvoiceDataToLandedCostExcel } from "./services/excelService";
import { exportCurrentDocumentItemsToCSV } from "./utils/csvExport";
import { generateInvoiceNotes, analyzeCustomerPatterns, analyzeLetterhead, editLineItemsWithAI } from "./services/geminiService";
import { markEditedLineItems } from "./utils/itemUtils";
import { HistoryList } from "./components/HistoryList";
import { Footer } from "./components/Footer";
import { PDFCustomizer } from "./components/PDFCustomizer";
import { GenerateChallanModal } from "./components/GenerateChallanModal";
import { BoxDimensionsTable, BoxDimension } from "./components/BoxDimensionsTable";
import { aggregateLineItemsForBoxes, convertAggregatedBoxesToPackingBoxes, AggregatedBoxRow } from "./utils/packingListAggregation";
import { AIChat } from "./components/AIChat";
import { 
  saveToCloud, 
  loadFromCloud, 
  deleteUserAccount, 
  handleFirestoreError, 
  OperationType, 
  getUserDocumentsFromCloud, 
  getLocalCachedDocuments, 
  subscribeToUserDoc,
  saveDocumentRecordToCloud,
  deleteDocumentRecordFromCloud,
  subscribeToUserDocuments
} from "./services/dbService";
import { logUserActivity, logErrorEvent } from "./services/auditLogger";
import { isConfigValid, db, auth } from "./services/firebase";
import { logoutUser, syncUserProfileToFirestore } from "./services/auth";
import { doc, setDoc, getDoc, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import { Auth } from "./components/Auth";
import { EmailVerificationScreen } from "./components/EmailVerificationScreen";
import { LandingPage } from "./components/LandingPage";
import { FeaturesPage } from "./components/FeaturesPage";
import { PrivacyPolicy } from "./components/PrivacyPolicy";
import { TermsAndConditions } from "./components/TermsAndConditions";
import { CookiePolicy } from "./components/CookiePolicy";
import { TaxCompliance } from "./components/TaxCompliance";
import { TermsManager } from "./components/TermsManager";
import { Modal } from "./components/Modal";
import { TaxSummaryModal } from "./components/TaxSummaryModal";
import { FeedbackModal } from "./components/FeedbackModal";
import { ContactSupportModal } from "./components/ContactSupportModal";
import { TrialLimitModal } from "./components/TrialLimitModal";
import { WelcomeModal } from "./components/WelcomeModal";
import { HistoryInput } from "./components/HistoryInput";
import { PaymentTermsInput } from "./components/PaymentTermsInput";
import { calculateDueDate, formatDateToYYYYMMDD } from "./utils/dateUtils";
import { autoSaveContactIfNew, getUserContacts, saveUserContact, ContactEntity } from "./utils/contactUtils";
import { seedReferenceHistoryFromDocumentHistory, saveReferenceValue } from "./utils/referenceHistory";
import { COUNTRIES, ALL_CURRENCIES, getCountryConfig, getCurrencySymbol, getTaxName, getRegionTaxLabel } from "./utils/localization";
import { AdminDashboard, ADMIN_UID, isAdminUser } from "./components/AdminDashboard";
import { AdminPinModal, ADMIN_DEFAULT_PIN, ADMIN_RESET_EMAIL } from "./components/AdminPinModal";
import { Logo } from "./components/Logo";
import { getPlanDetails } from "./utils/planUtils";
import { 
  consumeUserDocumentCredit, 
  getEffectiveLifetimeDocCount, 
  setLocalUserDocCount, 
  getLocalUserDocCount, 
  incrementLocalUserDocCount 
} from "./services/trialService";

const QA_QC_RISK_ITEMS = [
  "Mixed Heat Prevention Physical Segregation & Heat Code Verification",
  "Material Drift Control – Grade verification strategy implemented through PMI and MTC correlation",
  "Geometric Control – Dimensional accuracy ensured through calibrated inspection methods",
  "Documentation Consistency MTC, inspection records, and packing list cross-aligned",
  "Marking Integrity control Cross verification of heat no, size, and grade with MTC"
];

const INSPECTION_SUMMARY_OPTIONS = [
  { parameter: "Material Identification", method: "PMI Testing", tool: "Handheld XRF Analyzer" },
  { parameter: "Dimensional Accuracy", method: "Measurement", tool: "Vernier / Micrometer" },
  { parameter: "Thread Accuracy (where applicable)", method: "Gauge Check", tool: "Thread Gauge" },
  { parameter: "Surface Integrity", method: "Visual Inspection", tool: "Manual Check" },
  { parameter: "Marking Verification", method: "Cross Check", tool: "MTC vs Physical Marking" },
  { parameter: "Quantity Verification", method: "Physical Count", tool: "Packing List Match" }
];

const INSPECTION_TOOL_OPTIONS: Record<string, string[]> = {
  "Material Identification": ["Handheld XRF Analyzer", "Spectro Analyzer"],
  "Dimensional Accuracy": ["Vernier / Micrometer", "Micrometer / Caliper"],
  "Thread Accuracy (where applicable)": ["Thread Gauge"],
  "Surface Integrity": ["Visual Inspection", "Manual Check"],
  "Marking Verification": ["Cross Check", "MTC vs Physical Marking"],
  "Quantity Verification": ["Physical Count", "Packing List Match"]
};

const PACKAGING_DISPATCH_OPTIONS = [
  { controlArea: "Packaging Integrity", method: "Export-grade packing applied as per material type", verification: "Visual inspection", status: "Confirmed" },
  { controlArea: "Product Protection", method: "Items secured to prevent damage during transit", verification: "Handling check", status: "Ensured" },
  { controlArea: "Identification & Labeling", method: "Each package marked with PO, item details, and traceability reference", verification: "Label verification", status: "Verified" },
  { controlArea: "Quantity Reconciliation", method: "Packed quantity cross-checked with packing list and PO", verification: "Physical count", status: "Matched" },
  { controlArea: "Dispatch Readiness", method: "Material inspected, packed, and cleared for shipment", verification: "Final QC review", status: "Approved" }
];

const PACKAGING_METHOD_OPTIONS: Record<string, string[]> = {
  "Packaging Integrity": ["Export-grade packing applied as per material type", "Gunny Bag", "Wooden Box", "Standard Packing"],
  "Product Protection": ["Items secured to prevent damage during transit", "Secured with plastic cap protection", "Rust preventive oil applied", "Bubble wrapped"]
};

const EVIDENCE_CONTROL_OPTIONS = [
  { docType: "Mill Test Certificate (EN 10204 3.1)", description: "Verified against material grade, heat number, and applicable standards", status: "Cross-Verified" },
  { docType: "Material Marking Records", description: "Physical marking matched with MTC and traceability data", status: "Confirmed" },
  { docType: "Dimensional Inspection Records", description: "Measurements verified using calibrated instruments as per applicable standards", status: "Verified" },
  { docType: "Visual Inspection Records", description: "Surface condition and workmanship inspected and documented", status: "Accepted" }
];

const FITTING_SCHEDULES = [
  { label: "5s", value: "5S" },
  { label: "5", value: "5" },
  { label: "10s", value: "10S" },
  { label: "10", value: "10" },
  { label: "20", value: "20" },
  { label: "30", value: "30" },
  { label: "40s", value: "40S" },
  { label: "STD", value: "STD" },
  { label: "40", value: "40" },
  { label: "60", value: "60" },
  { label: "80s", value: "80S" },
  { label: "XS", value: "XS" },
  { label: "80", value: "80" },
  { label: "100", value: "100" },
  { label: "120", value: "120" },
  { label: "140", value: "140" },
  { label: "160", value: "160" },
  { label: "XXS", value: "XXS" }
];

const EVIDENCE_STATUS_OPTIONS = ["Cross-Verified", "Confirmed", "Verified", "Accepted", "Checked", "Verified & OK", "Matched"];

const NCR_ACTION_STATUS_OPTIONS = ["AGREED", "ACCEPTED", "COMPLIANT"];

const QA_QC_STANDARD_NOTES = `• All inspection and verification activities have been carried out under controlled conditions in accordance with internal QA procedures and applicable standards.
• Full traceability has been maintained through heat number identification, material marking, and correlation with mill test certificates.
• Inspection results are based on the defined sampling methodology and are representative of the supplied batch.
• All dimensional and measurement checks have been performed using calibrated instruments traceable to recognized standards.
• All documents have been reviewed and verified against purchase order requirements and applicable technical standards.
• Materials have been handled, stored, and packed under controlled conditions to prevent damage, contamination, or mix-up.
• In case any non-conformance is identified after dispatch, evaluation will be carried out based on inspection records, sampling method used, and traceability documents available at the time of inspection. All inspection activities are performed as per defined procedures and applicable standards.`;

// Helper to sanitize keys for Firebase (no . # $ / [ ])
const sanitizeKey = (key: string) => {
  return key.replace(/[\.#\$\/\[\]]/g, '_');
};

// Helper to compress images before saving to state/localStorage with smart aspect ratio and MIME type preservation
const compressImage = (
  base64Str: string, 
  maxWidth = 800, 
  maxHeight = 800, 
  quality = 0.8, 
  format?: string
): Promise<string> => {
  return new Promise((resolve) => {
    // If it's empty or extremely small, don't touch it
    if (!base64Str || base64Str.length < 5000) {
      resolve(base64Str);
      return;
    }

    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      // Keep aspect ratio perfectly and fit within boundaries
      const ratio = Math.min(maxWidth / width, maxHeight / height, 1);
      width = width * ratio;
      height = height * ratio;

      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(base64Str);
        return;
      }

      // Detect original format if not explicitly passed
      const detectedFormat = format || (base64Str.startsWith('data:image/png') ? 'image/png' : 'image/jpeg');

      if (detectedFormat === 'image/jpeg') {
        // Fill canvas with white background to prevent transparent parts of PNGs converting to black in JPEGs
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
      } else {
        // Transparent background for PNG/WebP
        ctx.clearRect(0, 0, width, height);
      }

      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL(detectedFormat, quality));
    };
    img.onerror = () => resolve(base64Str); // Fallback to original on error
  });
};

// Smart signature processor: Removes light backgrounds (paper) and converts to transparent PNG
const processSignature = (base64Str: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const maxWidth = 800;
      const maxHeight = 500;
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height *= maxWidth / width;
        width = maxWidth;
      }
      if (height > maxHeight) {
        width *= maxHeight / height;
        height = maxHeight;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(base64Str);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      
      const imgData = ctx.getImageData(0, 0, width, height);
      const data = imgData.data;
      
      // Algorithm to remove background:
      // If the pixel is very bright (likely paper), make it transparent.
      // We use a luma-based approach.
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        // Calculate brightness
        const brightness = (0.299 * r + 0.587 * g + 0.114 * b);
        
        // If brightness is high (white/grey paper), increase transparency
        if (brightness > 200) {
          // Linear transparency from 200 (opaque) to 255 (fully transparent)
          const alpha = Math.max(0, 255 - (brightness - 200) * 5);
          data[i + 3] = Math.min(data[i + 3], alpha);
        }
      }
      
      ctx.putImageData(imgData, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => resolve(base64Str);
  });
};

// Helper to get user-specific storage keys (strict billiq_user_${uid}_* prefixing)
const getStorageKey = (key: string, userId?: string | null) => {
  if (userId) {
    const prefixed = `billiq_user_${userId}_${key}`;
    try {
      if (typeof localStorage !== "undefined" && !localStorage.getItem(prefixed)) {
        const legacy = localStorage.getItem(`${userId}_${key}`);
        if (legacy) {
          localStorage.setItem(prefixed, legacy);
          localStorage.removeItem(`${userId}_${key}`);
        }
      }
    } catch {}
    return prefixed;
  }
  return `billiq_user_guest_${key}`;
};

const VALID_ROUTES = ["dashboard", "analytics", "workspace", "invoice", "history", "customers", "suppliers", "profile", "privacy", "terms", "compliance", "admin", "landing", "features", "auth", "login", "signup"];

const getSavedRoute = (userId?: string | null): string | null => {
  try {
    if (typeof window !== "undefined" && window.location) {
      const urlParams = new URLSearchParams(window.location.search);
      const urlView = urlParams.get("view") || urlParams.get("route") || urlParams.get("tab") || urlParams.get("step");
      if (urlView) {
        let normalized = urlView.toLowerCase().trim();
        if (normalized === "documents") normalized = "history";
        if (normalized === "workspace") normalized = "invoice";
        if (normalized === "login" || normalized === "signup") normalized = "auth";
        if (VALID_ROUTES.includes(normalized)) {
          // If logged in, ignore "landing" or "auth" parameter in URL so refreshing stays in workspace
          if (!(userId && (normalized === "landing" || normalized === "auth"))) {
            return normalized;
          }
        }
      }
    }

    if (userId) {
      const userRoute = localStorage.getItem(`billiq_user_${userId}_billiq_active_view`) ||
                        localStorage.getItem(`billiq_user_${userId}_active_app_route`) ||
                        localStorage.getItem(`billiq_user_${userId}_active_app_step`) ||
                        localStorage.getItem(`${userId}_active_app_route`) ||
                        localStorage.getItem(`${userId}_active_app_step`);
      if (userRoute) {
        let normalized = userRoute.toLowerCase().trim();
        if (normalized === "documents") normalized = "history";
        if (normalized === "workspace") normalized = "invoice";
        if (normalized === "login" || normalized === "signup") normalized = "auth";
        if (VALID_ROUTES.includes(normalized) && normalized !== "landing" && normalized !== "auth") return normalized;
      }
    }

    const globalRoute = localStorage.getItem("billiq_active_view") ||
                        localStorage.getItem("active_app_route") ||
                        localStorage.getItem("active_app_step");
    if (globalRoute) {
      let normalized = globalRoute.toLowerCase().trim();
      if (normalized === "documents") normalized = "history";
      if (normalized === "workspace") normalized = "invoice";
      if (normalized === "login" || normalized === "signup") normalized = "auth";
      if (VALID_ROUTES.includes(normalized) && (!userId || (normalized !== "landing" && normalized !== "auth"))) return normalized;
    }
  } catch (e) {
    console.error("Error reading saved route:", e);
  }
  return null;
};

// Helper functions moved outside for global accessibility
const normalizationMap: Record<string, string> = {
  "1.25": "1 1/4", "1.5": "1 1/2", "2.5": "2 1/2", "3.5": "3 1/2",
  "11/2": "1 1/2", "11/4": "1 1/4", "21/2": "2 1/2", "31/2": "3 1/2"
};

const dnNBMap: Record<string, string> = {
  "15": "1/2\"", "20": "3/4\"", "25": "1\"", "32": "1 1/4\"", "40": "1 1/2\"",
  "50": "2\"", "65": "2 1/2\"", "80": "3\"", "100": "4\"", "125": "5\"", "150": "6\"",
  "200": "8\"", "250": "10\"", "300": "12\"", "350": "14\"", "400": "16\"",
  "450": "18\"", "500": "20\"", "600": "24\"", "700": "28\"", "750": "30\"",
  "800": "32\"", "900": "36\"", "1000": "40\"", "1200": "48\""
};

const extractSize = (descriptionString: string): { size1: string; size2: string } => {
  const desc = (descriptionString || "").toUpperCase();

  // Helper to clean and normalize a size string
  const normalize = (s: string) => {
    let val = s.trim().replace(/[\s-]+/g, " ");
    if (normalizationMap[val.replace(" ", "")] && !normalizationMap[val]) {
      val = normalizationMap[val.replace(" ", "")];
    }
    return val;
  };

  // Priority 1: X to X size (e.g. 10" X 8" or 10X8)
  const rangeMatch = desc.match(/\b(\d+(?:\/\d+)?(?:\s?\d+\/\d+)?(?:"|IN|INCH)?)\s*[X]\s*(\d+(?:\/\d+)?(?:\s?\d+\/\d+)?(?:"|IN|INCH)?)\b/i);
  if (rangeMatch) {
    const s1 = normalize(rangeMatch[1]);
    const s2 = normalize(rangeMatch[2]);
    
    // Check if s2 is likely a schedule instead of a size (e.g. 10" X 80)
    // Most reducing sizes are between 1/2 and 24, definitely not 40, 80, 160 etc.
    const s2Num = parseFloat(s2.replace(/[^0-9.]/g, ''));
    const isS2Schedule = (s2Num === 40 || s2Num === 80 || s2Num === 160 || s2Num === 140 || s2Num === 5 || s2Num === 10 || s2Num === 20) && !rangeMatch[2].includes('"');
    
    if (!isS2Schedule) {
      return { 
        size1: s1.includes('"') ? s1 : `${s1}"`, 
        size2: s2.includes('"') ? s2 : `${s2}"` 
      };
    }
  }

  // Priority 1.5: Look for "SIZE" or "NB" keywords specifically
  const sizeKeywordMatch = desc.match(/(?:SIZE|SIZE\s*:|NB|NB\s*:|DN|DIMENSIONS|DIA|DIAMETER)\s*(\d+(?:[\s.-]*\d+\/\d+)?(?:\s?\"|IN|INCH)?)\b/i);
  if (sizeKeywordMatch) {
    const val = normalize(sizeKeywordMatch[1]);
    if (dnNBMap[val]) return { size1: dnNBMap[val], size2: "" };
    // Try without mapping if mapping fails (e.g. SIZE: 1/2) 
    return { size1: val.includes('"') ? val : `${val}"`, size2: "" };
  }

  // Priority 2: Standard sizes with units
  const units = ["\"", "IN", "INCH", "NB", "DN", "MM"];
  for (const unit of units) {
    // If unit is a quote, don't use trailing word boundary as it fails if followed by space/non-word
    const trailingBoundary = (unit === "\"" || unit === "MM" || unit === "") ? "" : "\\b";
    const regex = new RegExp(`\\b(\\d+(?:\\s?\\d+\\/\\d+)?)\\s*${unit}${trailingBoundary}`, "i");
    const unitMatch = desc.match(regex);
    if (unitMatch) {
      const val = normalize(unitMatch[1]);
      if (unit === "NB" || unit === "DN" || unit === "MM") {
        if (dnNBMap[val]) return { size1: dnNBMap[val], size2: "" };
        return { size1: `${val}"`, size2: "" };
      }
      return { size1: val.includes('"') ? val : `${val}"`, size2: "" };
    }
  }

  // Priority 2.1: Look specifically for NB/DN/MM if Priority 2 was skipped
  const forcedUnitMatch = desc.match(/(\d+)\s*(?:NB|DN|MM)\b/i);
  if (forcedUnitMatch) {
    const val = normalize(forcedUnitMatch[1]);
    if (dnNBMap[val]) return { size1: dnNBMap[val], size2: "" };
    return { size1: `${val}"`, size2: "" };
  }

  // Priority 3: Lone fractions (high probability of being size)
  const loneFraction = desc.match(/\b(\d+[\s-]*\d+\/\d+|\d+\/\d+)\b/);
  if (loneFraction) {
    const val = normalize(loneFraction[1]);
    return { size1: val.includes('"') ? val : `${val}"`, size2: "" };
  }

  return { size1: "Unknown", size2: "" };
};

const getFlangeID = (std: any, s: string, type?: string) => {
  if (!s) return null;
  
  // SORF flanges have fixed IDs and don't depend on pipe schedule/bore
  if (type === "SORF") return std.id || null;
  // BLRF doesn't have an ID
  if (type === "BLRF") return null;

  const clean = s.toUpperCase().replace("SCH ", "").trim();
  
  // 1. Try explicit schedules in the flange standard definition
  if (std?.schedules) {
    if (std.schedules[s]) return std.schedules[s];
    if (std.schedules[`SCH ${s}`]) return std.schedules[`SCH ${s}`];
    if (std.schedules[clean]) return std.schedules[clean];
    if (std.schedules[`SCH ${clean}`]) return std.schedules[`SCH ${clean}`];

    if ((clean === "STD" || clean === "40" || clean === "40S") && std.schedules["SCH 40 (STD)"]) return std.schedules["SCH 40 (STD)"];
    if ((clean === "XS" || clean === "80" || clean === "80S") && std.schedules["SCH 80 (XS)"]) return std.schedules["SCH 80 (XS)"];
    if (clean === "XXS" && std.schedules["SCH XXS"]) return std.schedules["SCH XXS"];
    if ((clean === "10" || clean === "10S") && std.schedules["SCH 10S"]) return std.schedules["SCH 10S"];
    if ((clean === "5" || clean === "5S") && std.schedules["SCH 5S"]) return std.schedules["SCH 5S"];
  }

  // 2. Fallback: Calculate from pipe dimensions (Bore = OD - 2 * WT)
  const pipeStd = (FITTING_STANDARDS as any)[std.size];
  if (pipeStd && pipeStd.schedules) {
    const getWT = (pStd: any, sch: string) => {
      const c = sch.toUpperCase().replace("SCH ", "").trim();
      if (pStd.schedules[sch]) return pStd.schedules[sch];
      if (pStd.schedules[`SCH ${sch}`]) return pStd.schedules[`SCH ${sch}`];
      if (pStd.schedules[c]) return pStd.schedules[c];
      if (pStd.schedules[`SCH ${c}`]) return pStd.schedules[`SCH ${c}`];

      if ((c === "STD" || c === "40" || c === "40S") && pStd.schedules["SCH 40 (STD)"]) return pStd.schedules["SCH 40 (STD)"];
      if ((c === "XS" || c === "80" || c === "80S") && pStd.schedules["SCH 80 (XS)"]) return pStd.schedules["SCH 80 (XS)"];
      if (c === "XXS" && pStd.schedules["SCH XXS"]) return pStd.schedules["SCH XXS"];
      return null;
    };

    const wt = getWT(pipeStd, clean);
    if (wt && std.hubSmall) {
      const id = (parseFloat(std.hubSmall) - 2 * parseFloat(wt)).toFixed(1);
      return id;
    }
  }

  return null;
};

const extractSchedule = (desc: string): string => {
  if (!desc || typeof desc !== 'string') return "STD";
  const schRegex = /(?:SCH|SCH\.|S\/|X|SH|SCHEDULE|S|WT|W.T.|THK|THICKNESS)\s*[:\-.]?\s*(5S|10S|20|30|40S|STD|40|60|80S|XS|80|100|120|140|160|XXS|5|40S)\b/i;
  const schMatch = desc.match(schRegex);
  if (schMatch) {
     return schMatch[1].toUpperCase();
  }
  
  const standaloneMatch = desc.match(/\b(STD|XS|XXS|SCH\d+S?|5S|10S|40S|80S)\b/i);
  if (standaloneMatch) return standaloneMatch[1].toUpperCase().replace("SCH", "");
  
  const commonSchedules = ["5", "10", "20", "30", "40", "60", "80", "100", "120", "140", "160"];
  for (const schVal of commonSchedules) {
     if (new RegExp(`\\b${schVal}\\b`).test(desc)) {
        const idx = desc.indexOf(schVal);
        const context = desc.substring(Math.max(0, idx - 15), Math.min(desc.length, idx + 15));
        if (context.includes("\"") || context.includes("CL") || context.includes("#") || context.includes("ASME") || context.includes("PIPE") || context.includes("SCH") || context.includes("WT")) {
           return schVal;
        }
     }
  }
  return "";
};

const extractRating = (desc: string): string => {
  if (!desc || typeof desc !== 'string') return "";
  const classMatch = desc.match(/\b(150|300|400|600|900|1500|2000|2500|3000|6000|9000)\s*(?:#|lb|class|cl|rating)\b|(#|class|cl)\s*(150|300|400|600|900|1500|2000|2500|3000|6000|9000)\b/i);
  if (classMatch) {
     return classMatch[1] || classMatch[3];
  }
  return "";
};

const getFlangeDimensionsObject = (
  size: string,
  classVal: string,
  type: string,
  schedule: string,
  description: string,
  existingDims: Record<string, MeasuredValue>
) => {
  let container = FLANGE_STANDARDS_150;
  if (classVal === "75B") container = FLANGE_STANDARDS_75_B;
  else if (classVal === "300") container = FLANGE_STANDARDS_300;
  else if (classVal === "300A") container = FLANGE_STANDARDS_300_A;
  else if (classVal === "300B") container = FLANGE_STANDARDS_300_B;
  else if (classVal === "400") container = FLANGE_STANDARDS_400;
  else if (classVal === "400A") container = FLANGE_STANDARDS_400_A;
  else if (classVal === "400B") container = FLANGE_STANDARDS_400_B;
  else if (classVal === "600") container = FLANGE_STANDARDS_600;
  else if (classVal === "600A") container = FLANGE_STANDARDS_600_A;
  else if (classVal === "600B") container = FLANGE_STANDARDS_600_B;
  else if (classVal === "900") container = FLANGE_STANDARDS_900;
  else if (classVal === "900A") container = FLANGE_STANDARDS_900_A;
  else if (classVal === "900B") container = FLANGE_STANDARDS_900_B;
  else if (classVal === "150A") container = FLANGE_STANDARDS_150_A;
  else if (classVal === "150B") container = FLANGE_STANDARDS_150_B;
  else if (classVal === "1500") container = FLANGE_STANDARDS_1500;
  else if (classVal === "2500") container = FLANGE_STANDARDS_2500;

  const stds = (container as any)[size];
  const typeKey = type as any;
  const spec = stds ? (stds[typeKey] || (typeKey === "LWNRF" ? (stds["WNRF"] || stds["SORF"]) : (stds["SORF"] || stds["WNRF"]))) : null;

  if (!spec) return existingDims;

  return {
    "OD": { standard: spec.od, measured: existingDims["OD"]?.measured || "" },
    "PCD": { standard: spec.pcd, measured: existingDims["PCD"]?.measured || "" },
    "Thk": { standard: spec.thk, measured: existingDims["Thk"]?.measured || "" },
    "ID": getFlangeID(spec, schedule, type) ? { standard: getFlangeID(spec, schedule, type), measured: existingDims["ID"]?.measured || "" } : (spec.id ? { standard: spec.id, measured: existingDims["ID"]?.measured || "" } : { standard: "---", measured: "" }),
    "Hub OD (Large)": type === "LWNRF" && spec.hubSmall ? { standard: spec.hubSmall, measured: existingDims["Hub OD (Large)"]?.measured || "" } : (spec.hubLarge ? { standard: spec.hubLarge, measured: existingDims["Hub OD (Large)"]?.measured || "" } : { standard: "---", measured: "" }),
    "Hub OD (Small)": spec.hubSmall ? { standard: spec.hubSmall, measured: existingDims["Hub OD (Small)"]?.measured || "" } : { standard: "---", measured: "" },
    "Hub Length": (() => {
      const neckMatch = (description || "").match(/NECK\s*LENGTH\s*[:\-]?\s*(\d+)/i);
      if (type === "LWNRF" && neckMatch) {
         return { standard: neckMatch[1], measured: existingDims["Hub Length"]?.measured || "" };
      }
      return spec.hubLength ? { standard: spec.hubLength, measured: existingDims["Hub Length"]?.measured || "" } : { standard: "---", measured: "" };
    })(),
    "RF": spec.rf ? { standard: spec.rf, measured: existingDims["RF"]?.measured || "" } : { standard: "---", measured: "" },
  };
};

const getFittingDimensionsObject = (
  size: string,
  size2: string,
  type: string,
  schedule: string,
  existingDims: Record<string, MeasuredValue>
) => {
  const standard1 = (FITTING_STANDARDS as any)[size];
  const lowerType = (type || "").toLowerCase();
  let subCategory: "ELBOW" | "TEE" | "REDUCER" | "CAP" | "STUB END" | "OTHER" = "ELBOW";

  if (lowerType.includes("elbow")) subCategory = "ELBOW";
  else if (lowerType.includes("tee")) subCategory = "TEE";
  else if (lowerType.includes("reducer")) subCategory = "REDUCER";
  else if (lowerType.includes("cap")) subCategory = "CAP";
  else if (lowerType.includes("stub end")) subCategory = "STUB END";
  else subCategory = "OTHER";

  const effectiveSize2 = size2 || (subCategory === "TEE" || subCategory === "REDUCER" ? size : null);
  const standard2 = effectiveSize2 ? (FITTING_STANDARDS as any)[effectiveSize2] : null;

  const getWT = (pStd: any, sch: string) => {
    if (!sch || !pStd?.schedules) return "---";
    const clean = sch.toUpperCase().replace("SCH ", "").trim();
    if (pStd.schedules[sch]) return pStd.schedules[sch];
    if (pStd.schedules[`SCH ${sch}`]) return pStd.schedules[`SCH ${sch}`];
    if (pStd.schedules[clean]) return pStd.schedules[clean];
    if (pStd.schedules[`SCH ${clean}`]) return pStd.schedules[`SCH ${clean}`];

    if ((clean === "STD" || clean === "40" || clean === "40S") && pStd.schedules["SCH 40 (STD)"]) return pStd.schedules["SCH 40 (STD)"];
    if ((clean === "XS" || clean === "80" || clean === "80S") && pStd.schedules["SCH 80 (XS)"]) return pStd.schedules["SCH 80 (XS)"];
    if (clean === "XXS" && pStd.schedules["SCH XXS"]) return pStd.schedules["SCH XXS"];
    if (clean === "10S" && pStd.schedules["SCH 10S"]) return pStd.schedules["SCH 10S"];
    if (clean === "5S" && pStd.schedules["SCH 5S"]) return pStd.schedules["SCH 5S"];
    
    return "---";
  };

  const dimensions: Record<string, MeasuredValue> = {};

  if (subCategory === "ELBOW") {
    let c2e = "---";
    let label = "Center to End";

    if (lowerType.includes("90") && lowerType.includes("lr")) {
      c2e = standard1?.centerToEnd_90_LR_Elbow;
    } else if (lowerType.includes("90") && lowerType.includes("sr")) {
      c2e = standard1?.centerToEnd_90_SR_Elbow;
    } else if (lowerType.includes("45") && lowerType.includes("lr")) {
      c2e = standard1?.centerToEnd_45_LR_Elbow || standard1?.centerToEnd_45_Elbow;
    } else if (lowerType.includes("45") && lowerType.includes("sr")) {
      c2e = standard1?.centerToEnd_45_SR_Elbow;
    } else if (lowerType.includes("180") && lowerType.includes("lr")) {
      c2e = standard1?.centerToCenter_180_LR_Elbow;
      label = "Center to Center";
    } else if (lowerType.includes("180") && lowerType.includes("sr")) {
      c2e = standard1?.centerToCenter_180_SR_Elbow;
      label = "Center to Center";
    } else if (lowerType.includes("45")) {
      c2e = standard1?.centerToEnd_45_LR_Elbow || standard1?.centerToEnd_45_Elbow;
    } else if (lowerType.includes("90")) {
      c2e = standard1?.centerToEnd_90_LR_Elbow;
    }
    
    dimensions["OD"] = { standard: standard1?.od || "---", measured: existingDims["OD"]?.measured || "" };
    dimensions["WT"] = { standard: getWT(standard1, schedule), measured: existingDims["WT"]?.measured || "" };
    dimensions["CenterToCenter"] = { standard: c2e || "---", measured: existingDims["CenterToCenter"]?.measured || "", label };
  } else if (subCategory === "TEE") {
    dimensions["RunOD"] = { standard: standard1?.od || "---", measured: existingDims["RunOD"]?.measured || "" };
    dimensions["BranchOD"] = { standard: standard2?.od || standard1?.od || "---", measured: existingDims["BranchOD"]?.measured || "" };
    dimensions["RunWT"] = { standard: getWT(standard1, schedule), measured: existingDims["RunWT"]?.measured || "" };
    dimensions["BranchWT"] = { standard: getWT(standard2 || standard1, schedule), measured: existingDims["BranchWT"]?.measured || "" };
    dimensions["CenterToCenter"] = { standard: standard1?.centerToEnd_Tee || "---", measured: existingDims["CenterToCenter"]?.measured || "" };
  } else if (subCategory === "REDUCER") {
    dimensions["LargeEndOD"] = { standard: standard1?.od || "---", measured: existingDims["LargeEndOD"]?.measured || "" };
    dimensions["SmallEndOD"] = { standard: standard2?.od || "---", measured: existingDims["SmallEndOD"]?.measured || "" };
    dimensions["LargeWT"] = { standard: getWT(standard1, schedule), measured: existingDims["LargeWT"]?.measured || "" };
    dimensions["SmallWT"] = { standard: getWT(standard2, schedule), measured: existingDims["SmallWT"]?.measured || "" };
    dimensions["Length"] = { standard: standard1?.length || "---", measured: existingDims["Length"]?.measured || "" };
  } else if (subCategory === "CAP") {
    dimensions["OD"] = { standard: standard1?.od || "---", measured: existingDims["OD"]?.measured || "" };
    dimensions["WT"] = { standard: getWT(standard1, schedule), measured: existingDims["WT"]?.measured || "" };
    dimensions["Height"] = { standard: standard1?.height || standard1?.length || "---", measured: existingDims["Height"]?.measured || "" };
  } else if (subCategory === "STUB END") {
    dimensions["OD"] = { standard: standard1?.od || "---", measured: existingDims["OD"]?.measured || "" };
    dimensions["WT"] = { standard: getWT(standard1, schedule), measured: existingDims["WT"]?.measured || "" };
    const isShort = lowerType.includes("short");
    dimensions["Length"] = { standard: (isShort ? standard1?.stubEndLengthShort : standard1?.stubEndLength) || standard1?.stubEndLength || "---", measured: existingDims["Length"]?.measured || "" };
  } else {
    dimensions["OD"] = { standard: standard1?.od || "---", measured: existingDims["OD"]?.measured || "" };
    dimensions["WT"] = { standard: getWT(standard1, schedule), measured: existingDims["WT"]?.measured || "" };
    dimensions["CenterToCenter"] = { standard: standard1?.length || "---", measured: existingDims["CenterToCenter"]?.measured || "" };
  }

  return dimensions;
};

const getForgedFittingDimensionsObject = (
  size: string,
  type: string,
  rating: string,
  existingDims: Record<string, MeasuredValue>
) => {
  const safeType = type || "";
  const standard = (FORGED_FITTING_STANDARDS as any)[size];
  const ratingData = standard?.[rating];
  
  let centerVal = "---";
  let heightVal = "---";
  
  if (ratingData) {
    if (safeType.includes("90 Elbow") || safeType.includes("Tee") || safeType.includes("Cross")) {
      centerVal = safeType.startsWith("SW") ? ratingData.sw_elbow_tee_cross_c2center : ratingData.thd_elbow_tee_cross_c2center;
    } else if (safeType.includes("45 Elbow")) {
      centerVal = safeType.startsWith("SW") ? ratingData.sw_45_elbow_c2center : ratingData.thd_45_elbow_c2center;
    } else if (safeType.includes("Coupling") || safeType.includes("Cap")) {
      centerVal = safeType.startsWith("SW") ? ratingData.sw_coupling_length : ratingData.thd_coupling_length;
    } else if (safeType.includes("Street Elbow")) {
      centerVal = ratingData.thd_street_elbow_c2e || "---";
    } else if (safeType.includes("olet")) {
      centerVal = ratingData.olet_height || "---";
    } else if (safeType.includes("Plug")) {
      centerVal = ratingData.plug_length || "---";
    } else if (safeType.includes("Bushing")) {
      centerVal = ratingData.bushing_length || "---";
    }
    
    heightVal = safeType.includes("Cap") ? (safeType.startsWith("SW") ? ratingData.sw_cap_height : ratingData.thd_cap_height) : (ratingData.height || "---");
  }

  return {
    "OD": { standard: ratingData?.hub_od || "---", measured: existingDims["OD"]?.measured || "" },
    "WT": { standard: ratingData?.wt || "---", measured: existingDims["WT"]?.measured || "" },
    "CenterToCenter": { standard: centerVal || "---", measured: existingDims["CenterToCenter"]?.measured || "" },
    "Height": { standard: heightVal || "---", measured: existingDims["Height"]?.measured || "" }
  };
};

const getPipeDimensionsObject = (
  size: string,
  schedule: string,
  existingDims: Record<string, MeasuredValue>
) => {
  const standard = (FITTING_STANDARDS as any)[size];
  
  const getWT = (pStd: any, sch: string) => {
    if (!sch || !pStd?.schedules) return "---";
    const clean = sch.toUpperCase().replace("SCH ", "").trim();
    if (pStd.schedules[sch]) return pStd.schedules[sch];
    if (pStd.schedules[`SCH ${sch}`]) return pStd.schedules[`SCH ${sch}`];
    if (pStd.schedules[clean]) return pStd.schedules[clean];
    if (pStd.schedules[`SCH ${clean}`]) return pStd.schedules[`SCH ${clean}`];

    if ((clean === "STD" || clean === "40" || clean === "40S") && pStd.schedules["SCH 40 (STD)"]) return pStd.schedules["SCH 40 (STD)"];
    if ((clean === "XS" || clean === "80" || clean === "80S") && pStd.schedules["SCH 80 (XS)"]) return pStd.schedules["SCH 80 (XS)"];
    if (clean === "XXS" && pStd.schedules["SCH XXS"]) return pStd.schedules["SCH XXS"];
    if (clean === "10S" && pStd.schedules["SCH 10S"]) return pStd.schedules["SCH 10S"];
    if (clean === "5S" && pStd.schedules["SCH 5S"]) return pStd.schedules["SCH 5S"];
    
    return "---";
  };

  return {
    "OD": { standard: standard?.od || "---", measured: existingDims["OD"]?.measured || "" },
    "WT": { standard: getWT(standard, schedule), measured: existingDims["WT"]?.measured || "" }
  };
};

const getOletDimensionsObject = (
  size: string,
  type: string,
  schedule: string,
  rating: string,
  existingDims: Record<string, MeasuredValue>
) => {
  const isWeldolet = (type || "").includes("WELDOLET");
  const standard = (FITTING_STANDARDS as any)[size];
  
  const getWT = (std: any, s: string) => {
    if (!s || !std?.schedules) return "---";
    if (std.schedules[s]) return std.schedules[s];
    if (std.schedules[`SCH ${s}`]) return std.schedules[`SCH ${s}`];
    if ((s === "STD" || s === "40") && std.schedules["SCH 40 (STD)"]) return std.schedules["SCH 40 (STD)"];
    if ((s === "XS" || s === "80") && std.schedules["SCH 80 (XS)"]) return std.schedules["SCH 80 (XS)"];
    if (s === "XXS" && std.schedules["SCH XXS"]) return std.schedules["SCH XXS"];
    if (s.startsWith("SCH ") && std.schedules[s.replace("SCH ", "")]) return std.schedules[s.replace("SCH ", "")];
    if (/^\d+$/.test(s) && std.schedules[`SCH ${s}`]) return std.schedules[`SCH ${s}`];
    return "---";
  };

  let wt = "---";
  let centerVal = "---";
  if (isWeldolet && standard) {
    wt = getWT(standard, schedule);
  } else if (!isWeldolet && rating) {
    const forgedRating = rating.replace("#", "");
    const forgedStd = (FORGED_FITTING_STANDARDS as any)[size];
    if (forgedStd && forgedStd[forgedRating]) {
      wt = forgedStd[forgedRating].wt || "---";
      centerVal = forgedStd[forgedRating].olet_height || "---";
    }
  }
  
  if (isWeldolet && centerVal === "---") {
    const forgedStdForOlet = (FORGED_FITTING_STANDARDS as any)[size];
    if (forgedStdForOlet) {
      centerVal = forgedStdForOlet["3000"]?.olet_height || forgedStdForOlet["6000"]?.olet_height || "---";
    }
  }

  return {
    "OD": { standard: standard?.od || "---", measured: existingDims["OD"]?.measured || "" },
    "WT": { standard: wt, measured: existingDims["WT"]?.measured || "" },
    "Height": { standard: centerVal, measured: existingDims["Height"]?.measured || "" }
  };
};

const DimensionCell = ({ 
  dim, 
  onUpdate, 
  isInvalid 
}: { 
  dim: MeasuredValue; 
  onUpdate: (val: string) => void;
  isInvalid?: boolean;
}) => (
  <td className={`p-0 border-r border-zinc-100 align-top transition-colors ${isInvalid ? 'bg-red-50/20' : ''}`}>
    <div className="flex flex-col min-h-[52px]">
      <div className="flex-1 px-2 py-1.5 flex flex-col justify-center items-center gap-0.5 bg-zinc-50/20">
         <div className="flex items-center gap-1">
           <span className="text-[7px] text-zinc-400 font-bold uppercase tracking-tighter leading-none">STD</span>
           {dim.tolerance && <span className="text-[7px] text-brand-500 font-bold leading-none">±{dim.tolerance}</span>}
         </div>
         <span className="font-bold text-zinc-700 leading-none text-center">{dim.standard}</span>
      </div>
      <div className="flex-1 bg-white px-1 py-1.5 border-t border-zinc-100 relative group">
        <input
          type="text"
          className={`w-full text-center bg-transparent focus:outline-none focus:bg-brand-50 rounded font-black placeholder:text-zinc-300 placeholder:text-[7px] transition-all min-h-[22px] ${isInvalid ? 'text-red-700' : 'text-brand-700'}`}
          placeholder="MEASURED"
          value={dim.measured}
          onChange={(e) => onUpdate(e.target.value)}
        />
        {dim.aiFeedback && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-50 w-40 bg-zinc-800 text-white text-[8px] p-2 rounded shadow-2xl pointer-events-none border border-zinc-700">
            <div className="flex items-start gap-1.5">
              <Zap className="w-3 h-3 text-brand-400 shrink-0 mt-0.5" />
              <span>{dim.aiFeedback}</span>
            </div>
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-zinc-800"></div>
          </div>
        )}
      </div>
    </div>
  </td>
);

const ResultCell = ({ 
  result, 
  onUpdate, 
  onValidate, 
  isProcessing 
}: { 
  result: string; 
  onUpdate: (val: string) => void;
  onValidate: () => void;
  isProcessing: boolean;
}) => (
  <td className="px-3 py-3 text-center align-middle">
    <div className="flex flex-col items-center gap-1.5">
      <select 
        className={`text-[9px] font-black uppercase rounded border px-2 py-1 focus:outline-none transition-all cursor-pointer ${
          result === "PASSED" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
          result === "FAILED" ? "bg-red-50 text-red-700 border-red-200" :
          "bg-zinc-100 text-zinc-500 border-zinc-200"
        }`}
        value={result}
        onChange={(e) => onUpdate(e.target.value)}
      >
        <option value="PENDING">PENDING</option>
        <option value="PASSED">PASSED</option>
        <option value="FAILED">FAILED</option>
      </select>
      <Button 
        variant="ghost" 
        size="sm" 
        className="h-6 w-6 p-0 text-zinc-400 hover:text-brand-600"
        onClick={onValidate}
        disabled={isProcessing}
        title="Verify with AI Tolerance Check"
      >
        {isProcessing ? <Loader2 className="w-3 h-3 animate-spin text-brand-500" /> : <Wand2 className="w-3 h-3" />}
      </Button>
    </div>
  </td>
);

const DEFAULT_LAST_USED_NOTES_AND_TERMS: LastUsedNotesAndTerms = {
  customer: {
    standard: { notes: "", terms: DEFAULT_TERMS },
    export: { notes: "", terms: DEFAULT_TERMS },
  },
  supplier: {
    standard: { notes: "", terms: DEFAULT_TERMS },
    export: { notes: "", terms: DEFAULT_TERMS },
  },
};

const sanitizeNotesAndTerms = (raw: any): LastUsedNotesAndTerms => {
  return {
    customer: {
      standard: {
        notes: raw?.customer?.standard?.notes ?? "",
        terms: raw?.customer?.standard?.terms ?? DEFAULT_TERMS,
      },
      export: {
        notes: raw?.customer?.export?.notes ?? "",
        terms: raw?.customer?.export?.terms ?? DEFAULT_TERMS,
      },
    },
    supplier: {
      standard: {
        notes: raw?.supplier?.standard?.notes ?? "",
        terms: raw?.supplier?.standard?.terms ?? DEFAULT_TERMS,
      },
      export: {
        notes: raw?.supplier?.export?.notes ?? "",
        terms: raw?.supplier?.export?.terms ?? DEFAULT_TERMS,
      },
    },
  };
};

export default function App() {
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [showLanding, setShowLanding] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const savedRoute = getSavedRoute(null);
      if (savedRoute === "landing") return true;
      if (savedRoute === "auth" || savedRoute === "login" || savedRoute === "signup" || savedRoute === "features") return false;
      const isLoggedIn = localStorage.getItem("billiq_is_logged_in") === "true";
      if (isLoggedIn) return false;
      if (savedRoute && ["dashboard", "profile", "history", "customers", "suppliers", "workspace", "invoice", "admin"].includes(savedRoute)) {
        return false;
      }
    }
    return true;
  });
  const [showFeatures, setShowFeatures] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return getSavedRoute(null) === "features";
    }
    return false;
  });
  const [showAuthScreen, setShowAuthScreen] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const savedRoute = getSavedRoute(null);
      const isLoggedIn = localStorage.getItem("billiq_is_logged_in") === "true";
      if (!isLoggedIn && savedRoute && ["auth", "login", "signup", "dashboard", "profile", "history", "customers", "suppliers", "workspace", "invoice", "admin"].includes(savedRoute)) {
        return true;
      }
    }
    return false;
  });
  const [authInitialSignUp, setAuthInitialSignUp] = useState<boolean>(false);

  // Admin & Impersonation state
  const [isAdminConsoleActive, setIsAdminConsoleActive] = useState<boolean>(() => {
    const saved = getSavedRoute(null);
    return saved === "admin";
  });
  const [isAdminPinVerified, setIsAdminPinVerified] = useState<boolean>(false);
  const [showAdminPinModal, setShowAdminPinModal] = useState<boolean>(false);
  const [impersonatedUser, setImpersonatedUser] = useState<any | null>(null);

  const handleImpersonateUser = (userData: any) => {
    setImpersonatedUser(userData);
    setIsAdminConsoleActive(false);
    if (userData.business) {
      setBusiness({
        name: userData.business.companyName || userData.business.name || "",
        gstin: userData.business.gstin || "",
        address: userData.business.address || "",
        phone: userData.business.phone || "",
        email: userData.business.email || "",
        ...userData.business
      });
    }
    if (userData.savedCustomers) setSavedCustomers(userData.savedCustomers);
    if (userData.savedSuppliers) setSavedSuppliers(userData.savedSuppliers);
    if (userData.history) setHistory(userData.history);
    if (userData.lastUsedNumbers) setLastUsedNumbers(userData.lastUsedNumbers);
    if (userData.priceHistory) setPriceHistory(userData.priceHistory);
    setStep("dashboard");
    logUserActivity(user?.uid, "Impersonation Activated", `Admin started inspecting user ${userData.id}`, false, "auth");
  };

  const handleExitImpersonation = () => {
    setImpersonatedUser(null);
    setIsAdminConsoleActive(true);
    resetAllState();
    logUserActivity(user?.uid, "Impersonation Exited", `Admin returned to global console`, false, "auth");
  };

  // State
  const [step, setStep] = useState<"dashboard" | "analytics" | "invoice" | "customers" | "suppliers" | "profile" | "history" | "privacy" | "terms" | "compliance" | "cookie">(
    () => {
      const saved = getSavedRoute(null);
      if (saved && ["dashboard", "analytics", "invoice", "customers", "suppliers", "profile", "history", "privacy", "terms", "compliance"].includes(saved)) {
        return saved as any;
      }
      return "dashboard";
    }
  );

  const navigateToStep = useCallback((newStep: "dashboard" | "analytics" | "invoice" | "customers" | "suppliers" | "profile" | "history" | "privacy" | "terms" | "compliance") => {
    try {
      localStorage.setItem("billiq_has_entered_app", "true");
    } catch {}
    setShowLanding(false);
    setShowFeatures(false);
    setShowAuthScreen(false);
    setIsAdminConsoleActive(false);
    setStep(newStep);
  }, []);
  const [business, setBusiness] = useState<BusinessDetails>(() => {
    try {
      const activeUid = typeof localStorage !== "undefined" ? (localStorage.getItem("activeUserId") || localStorage.getItem("billiq_active_user_id")) : null;
      let local: string | null = null;
      if (typeof localStorage !== "undefined") {
        if (activeUid && activeUid !== "guest") {
          local = localStorage.getItem(getStorageKey("business_details", activeUid));
        }
        if (!local) {
          local = localStorage.getItem("billiq_user_guest_business_details") || localStorage.getItem("business_details");
        }
      }
      if (local) {
        const parsed = JSON.parse(local);
        if (parsed && typeof parsed === "object") {
          return {
            ...parsed,
            country: parsed.country || "India",
            currency: parsed.currency || "INR",
          };
        }
      }
    } catch (e) {}
    return {
      name: "",
      gstin: "",
      address: "",
      phone: "",
      email: "",
      country: "India",
      currency: "INR",
    };
  });

  const [customer, setCustomer] = useState<CustomerDetails>({
    name: "",
    gstin: "",
    address: "",
    phone: "",
    email: "",
  });

  const [savedCustomers, setSavedCustomers] = useState<SavedCustomer[]>([]);
  const [savedSuppliers, setSavedSuppliers] = useState<SavedSupplier[]>([]);
  const [history, setHistory] = useState<DocumentHistoryItem[]>([]);
  const historyRef = useRef<DocumentHistoryItem[]>([]);
  useEffect(() => {
    historyRef.current = history;
  }, [history]);
  const [businessErrors, setBusinessErrors] = useState<Record<string, string | undefined>>({});
  const [logoError, setLogoError] = useState<string | null>(null);
  const [letterheadError, setLetterheadError] = useState<string | null>(null);
  const [signatureError, setSignatureError] = useState<string | null>(null);
  const [customerErrors, setCustomerErrors] = useState<Record<string, string | undefined>>({});
  const [docErrors, setDocErrors] = useState<Record<string, string | undefined>>({});
  const [lastUsedNumbers, setLastUsedNumbers] = useState<Record<string, number>>({});
  const [priceHistory, setPriceHistory] = useState<PriceHistoryItem[]>([]);
  const [lastExportTimestamp, setLastExportTimestamp] = useState<number>(0);
  const [layoutSettings, setLayoutSettings] = useState<PDFLayoutSettings>({
    template: "classic",
    sectionOrder: ["header", "party_details", "items_table", "totals", "bank_details", "incoterms", "terms", "signature"],
    accentColor: "#1e1e1e",
  });

  const lastSyncedDataHashRef = useRef<string>("");
  const isSyncInProgressRef = useRef<boolean>(false);
  const isIncomingCloudSyncRef = useRef<boolean>(false);
  const incomingSyncTimerRef = useRef<NodeJS.Timeout | null>(null);
  const syncCooldownUntilRef = useRef<number>(0);

  const computeDataHash = useCallback((obj: any): string => {
    if (!obj) return "";
    try {
      const copy = JSON.parse(JSON.stringify(obj));
      delete copy.updatedAt;
      delete copy.email;
      delete copy.signupEmail;
      delete copy.authEmail;
      delete copy.username;
      delete copy.authUsername;
      delete copy.displayName;
      return JSON.stringify(copy);
    } catch {
      return "";
    }
  }, []);

  const [items, setItems] = useState<LineItem[]>([
    { id: "1", description: "", hsn: "", quantity: 1, unit: "NOS", rate: 0, taxRate: 18 }
  ]);

  const [docType, setDocType] = useState<DocumentType>(DocumentType.TAX_INVOICE);
  const [isExport, setIsExport] = useState(false);
  const [autoExportBadge, setAutoExportBadge] = useState(false);
  const [isTaxEnabled, setIsTaxEnabled] = useState(true);
  const [isIgst, setIsIgst] = useState(false);
  const [currency, setCurrency] = useState(() => business.currency || "INR");

  // Keep active currency synced with business profile settings when updated
  useEffect(() => {
    if (business.currency) {
      setCurrency(business.currency);
    }
  }, [business.currency]);
  const [exchangeRate, setExchangeRate] = useState(1);
  const [docId, setDocId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [discountRate, setDiscountRate] = useState(0);
  const [targetMarginPercent, setTargetMarginPercent] = useState<number>(0);
  const [transport, setTransport] = useState("");
  const [poNumber, setPoNumber] = useState("");
  // Packing List specific states
  const [preCarriageBy, setPreCarriageBy] = useState("");
  const [placeOfReceipt, setPlaceOfReceipt] = useState("");
  const [vesselFlightNo, setVesselFlightNo] = useState("");
  const [portOfLoading, setPortOfLoading] = useState("");
  const [portOfDischarge, setPortOfDischarge] = useState("");
  const [finalDestination, setFinalDestination] = useState("");
  const [countryOfOrigin, setCountryOfOrigin] = useState(() => business.country || "India");

  useEffect(() => {
    if (business.country) {
      setCountryOfOrigin(business.country);
    }
  }, [business.country]);
  const [countryOfDestination, setCountryOfDestination] = useState("");

  const [hasSubmittedFeedback, setHasSubmittedFeedback] = useState<boolean>(() => {
    try {
      return localStorage.getItem("has_submitted_feedback") === "true";
    } catch {
      return false;
    }
  });
  const [showFeedbackModal, setShowFeedbackModal] = useState<boolean>(false);
  const [showContactSupportModal, setShowContactSupportModal] = useState<boolean>(false);
  const [showTrialLimitModal, setShowTrialLimitModal] = useState<boolean>(false);
  const [trialModalCustomMessage, setTrialModalCustomMessage] = useState<string | undefined>(undefined);
  const [showWelcomeModal, setShowWelcomeModal] = useState<boolean>(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState<boolean>(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState<boolean>(false);

  const handleCloseWelcomeModal = async () => {
    setShowWelcomeModal(false);
    const targetUid = impersonatedUser ? impersonatedUser.id : user?.uid;
    if (targetUid) {
      try {
        localStorage.setItem(getStorageKey("hasSeenWelcomeModal", targetUid), "true");
      } catch (e) {}
      if (isConfigValid && db) {
        try {
          await saveToCloud(`users/${targetUid}`, { hasSeenWelcome: true }, true);
        } catch (err) {
          console.error("Failed to save hasSeenWelcome to Firestore:", err);
        }
      }
    }
  };

  const handleDeleteUserAccount = async () => {
    if (!user?.uid) return;
    setIsDeletingAccount(true);
    try {
      const uidToDelete = impersonatedUser ? impersonatedUser.id : user.uid;
      await deleteUserAccount(uidToDelete);
      setShowDeleteAccountModal(false);
      loadedUserIdRef.current = Symbol("account_deleted");
      resetAllState();

      if (!impersonatedUser && auth?.currentUser) {
        try {
          await auth.currentUser.delete();
        } catch (authDelErr) {
          console.info("Firebase Auth user delete attempt:", authDelErr);
        }
      }

      await logoutUser();
      setUser(null);
      setShowLanding(true);
      setStep("dashboard");
      showShortcutToast("Your account and all associated records have been permanently deleted.");
    } catch (err) {
      console.error("Failed to delete account:", err);
      alert("Failed to delete account. Please try again.");
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const handleFeedbackSurveySuccess = async (surveyPayload: any) => {
    setHasSubmittedFeedback(true);
    setShowFeedbackModal(false);
    try {
      localStorage.setItem("has_submitted_feedback", "true");
    } catch (e) {
      console.error(e);
    }

    if (user?.uid) {
      try {
        await saveToCloud(`users/${user.uid}`, {
          hasSubmittedFeedback: true,
          feedbackSurvey: surveyPayload,
        });
      } catch (err) {
        console.warn("Cloud save survey note:", err);
      }
    }

    showShortcutToast("🎉 Thank you for your feedback! Document creation unlocked.");
  };

  const activeCountryConfig = getCountryConfig(business.country || countryOfOrigin || "India");
  const isIndia = activeCountryConfig.code === "IN";

  // Automatically reset docType if Delivery Challan is selected but active country is not India
  useEffect(() => {
    if (!isIndia && docType === DocumentType.DELIVERY_CHALLAN) {
      setDocType(DocumentType.TAX_INVOICE);
    }
  }, [isIndia, docType]);
  const [buyerDetails, setBuyerDetails] = useState("");
  const [consigneeName, setConsigneeName] = useState("");
  const [consigneeAddress, setConsigneeAddress] = useState("");
  const [consigneeGstin, setConsigneeGstin] = useState("");
  const [buyerOrderDate, setBuyerOrderDate] = useState("");
  const [despatchDocNo, setDespatchDocNo] = useState("");
  const [boxDimensions, setBoxDimensions] = useState<Record<string, string>>({});
  const [boxNetWeights, setBoxNetWeights] = useState<Record<string, string>>({});
  const [boxGrossWeights, setBoxGrossWeights] = useState<Record<string, string>>({});
  const [boxQtyPacked, setBoxQtyPacked] = useState<Record<string, string>>({});
  const [customBoxes, setCustomBoxes] = useState<string[]>([]);
  const [commonGrossPercent, setCommonGrossPercent] = useState<string>("");
  const [paymentTerms, setPaymentTerms] = useState("");
  const [paymentMode, setPaymentMode] = useState("");
  const [numberOfPackages, setNumberOfPackages] = useState("");
  const [reasonForTransportation, setReasonForTransportation] = useState("Supply");
  const [showPricesInChallan, setShowPricesInChallan] = useState(false);
  const [isGenerateChallanModalOpen, setIsGenerateChallanModalOpen] = useState(false);
  const [advancePercentage, setAdvancePercentage] = useState<number>(0);
  const [freightOption, setFreightOption] = useState<"none" | "extra" | "inclusive">("none");
  const [freightAmount, setFreightAmount] = useState<number>(0);
  const [freightTaxTiming, setFreightTaxTiming] = useState<"before_tax" | "after_tax">("before_tax");
  const [freightTaxRate, setFreightTaxRate] = useState<number | undefined>(undefined);
  const [packagingOption, setPackagingOption] = useState<"none" | "extra" | "inclusive">("none");
  const [packagingAmount, setPackagingAmount] = useState<number>(0);
  const [packagingTaxTiming, setPackagingTaxTiming] = useState<"before_tax" | "after_tax">("before_tax");
  const [packagingTaxRate, setPackagingTaxRate] = useState<number | undefined>(undefined);
  // Incoterms Export State
  const [incotermRule, setIncotermRule] = useState<string>("");
  const [incotermNamedPlace, setIncotermNamedPlace] = useState<string>("");
  const [incotermPortOfLoading, setIncotermPortOfLoading] = useState<string>("");
  const [incotermCountryOfOrigin, setIncotermCountryOfOrigin] = useState<string>("");
  const [incotermCountryOfDestination, setIncotermCountryOfDestination] = useState<string>("");
  const [incotermFreightTerms, setIncotermFreightTerms] = useState<string>("");
  const [incotermInsuranceDetails, setIncotermInsuranceDetails] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [terms, setTerms] = useState(DEFAULT_TERMS);
  const [showNotes, setShowNotes] = useState<boolean>(true);
  const [showTerms, setShowTerms] = useState<boolean>(true);
  const [isNotesManuallyEdited, setIsNotesManuallyEdited] = useState(false);
  const [isTermsManuallyEdited, setIsTermsManuallyEdited] = useState(false);
  const [lastUsedNotesAndTerms, setLastUsedNotesAndTerms] = useState<LastUsedNotesAndTerms>({
    customer: {
      standard: { notes: "", terms: DEFAULT_TERMS },
      export: { notes: "", terms: DEFAULT_TERMS },
    },
    supplier: {
      standard: { notes: "", terms: DEFAULT_TERMS },
      export: { notes: "", terms: DEFAULT_TERMS },
    },
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiLineCommand, setAiLineCommand] = useState("");
  const [isAiLineEditing, setIsAiLineEditing] = useState(false);
  const [aiLineFeedback, setAiLineFeedback] = useState("");
  const [aiLineError, setAiLineError] = useState("");
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [showQAImportModal, setShowQAImportModal] = useState(false);
  const [isAnalyzingPatterns, setIsAnalyzingPatterns] = useState(false);
  const [isCloudLoading, setIsCloudLoading] = useState(false);
  const [isCloudLoadedSuccessfully, setIsCloudLoadedSuccessfully] = useState(false);
  const [isQuotaExceeded, setIsQuotaExceeded] = useState(false);
  const [suggestedNotes, setSuggestedNotes] = useState<{ notes: string; terms: string } | null>(null);
  const [loadedTimestamp, setLoadedTimestamp] = useState<number | null>(null);
  const [autoSaveTime, setAutoSaveTime] = useState<string | null>(null);
  const [shortcutToast, setShortcutToast] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "success" | "error">("idle");
  const [lastAutoSyncTime, setLastAutoSyncTime] = useState<Date | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [userProfile, setUserProfile] = useState<{
    signupEmail?: string;
    authEmail?: string;
    username?: string;
    authUsername?: string;
    displayName?: string;
    accountStatus?: string;
    role?: string;
    provider?: string;
    plan?: string;
    planTier?: string;
    planName?: string;
    docQuota?: number;
    maxDocs?: number;
    documentsRemaining?: number;
    trialCreditsGranted?: number;
    founderGrantNotice?: any;
    documentsUsed?: number;
    lifetimeCreatedCount?: number;
    totalGeneratedDocsCount?: number;
    trialUsed?: boolean;
    trialExhausted?: boolean;
    isReRegisteredUser?: boolean;
    hasSeenWelcome?: boolean;
    overrides?: UserOverrides;
    overrideAuditLogs?: UserOverrideAuditLog[];
    forceSyncTimestamp?: string;
    sessionRevokedAt?: string;
    resetCacheTimestamp?: string;
    updatedAt?: string;
  } | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [isInitializingAuth, setIsInitializingAuth] = useState<boolean>(true);
  const loadedUserIdRef = useRef<string | null | symbol>(Symbol("uninitialized"));

  // Update global user context for ErrorBoundary and global error handlers
  useEffect(() => {
    const activeUserId = impersonatedUser?.id || user?.uid;
    const activeUserEmail = impersonatedUser?.email || user?.email;
    (window as any).__CURRENT_USER_CONTEXT__ = {
      userId: activeUserId,
      userEmail: activeUserEmail,
      screenName: isAdminConsoleActive ? "Admin Console" : step,
    };
  }, [user, impersonatedUser, step, isAdminConsoleActive]);

  // Global window error and unhandled promise rejection listeners
  useEffect(() => {
    const handleGlobalError = (event: ErrorEvent) => {
      console.warn("Global runtime error caught gracefully:", event.error || event.message);
      const ctx = (window as any).__CURRENT_USER_CONTEXT__ || {};
      try {
        logErrorEvent(
          ctx.userId,
          ctx.userEmail,
          ctx.screenName || "Workspace Window",
          "Unhandled UI Script Error",
          event.error || event.message || "Unknown runtime error",
          "ui"
        ).catch(() => {});
      } catch (e) {
        // Safe fallback
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      try {
        if (event && typeof event.preventDefault === "function") {
          event.preventDefault();
        }

        const reason = event?.reason;
        console.warn("Global promise rejection caught gracefully:", reason);

        const ctx = (window as any).__CURRENT_USER_CONTEXT__ || {};
        if (reason) {
          logErrorEvent(
            ctx.userId,
            ctx.userEmail,
            ctx.screenName || "Async Service Task",
            "Captured Async Promise Rejection",
            reason || "Unhandled Promise Failure",
            "sync"
          ).catch(() => {});
        }
      } catch (e) {
        // Safe fallback
      }
    };

    window.addEventListener("error", handleGlobalError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener("error", handleGlobalError);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    };
  }, [user, impersonatedUser]);

  const checkIsQuotaExceededError = (error: any) => {
    const errStr = String(error?.message || error);
    if (
      errStr.toLowerCase().includes("quota exceeded") ||
      errStr.toLowerCase().includes("resource-exhausted") ||
      errStr.toLowerCase().includes("quota limit") ||
      errStr.toLowerCase().includes("free daily write units") ||
      errStr.toLowerCase().includes("free daily read units")
    ) {
      setIsQuotaExceeded(true);
      return true;
    }
    return false;
  };

  const handleAIClearForm = () => {
    setItems([{ id: Date.now().toString(), description: "", hsn: "", quantity: 1, unit: "NOS", rate: 0, taxRate: 18 }]);
    setCustomer({ name: "", gstin: "", address: "", phone: "", email: "" });
  };

  const handleAIAddItem = (newItem: Partial<LineItem>) => {
    const item: LineItem = {
      id: Date.now().toString(),
      description: newItem.description || "",
      hsn: newItem.hsn || "",
      quantity: newItem.quantity || 1,
      unit: newItem.unit || "NOS",
      rate: newItem.rate || 0,
      taxRate: newItem.taxRate || 18,
    };
    
    setItems(prev => {
      // If the last item is empty, replace it
      if (prev.length === 1 && !prev[0].description) {
        return [item];
      }
      return [...prev, item];
    });
    setStep("invoice");
  };

  const handleAISetCustomer = (newCustomer: Partial<CustomerDetails>) => {
    setCustomer({
      name: newCustomer.name || "",
      gstin: newCustomer.gstin || "",
      address: newCustomer.address || "",
      phone: newCustomer.phone || "",
      email: newCustomer.email || "",
    });
    setStep("invoice");
  };

  const handleAISetDocType = (type: DocumentType) => {
    if (type === DocumentType.DELIVERY_CHALLAN && !isIndia) {
      setDocType(DocumentType.TAX_INVOICE);
    } else {
      setDocType(type);
    }
    setStep("invoice");
  };
  const [scopeOfWork, setScopeOfWork] = useState("");
  const [materialType, setMaterialType] = useState("");

  const handleApplyAiLineChanges = async () => {
    if (!aiLineCommand.trim()) return;
    setIsAiLineEditing(true);
    setAiLineFeedback("");
    setAiLineError("");
    try {
      const result = await editLineItemsWithAI(items, aiLineCommand, docType, currency);
      if (result && Array.isArray(result.items)) {
        const markedItems = markEditedLineItems(items, result.items);
        setItems(markedItems);
        setAiLineFeedback(result.explanation || "Line items updated successfully.");
        setAiLineCommand("");
      } else {
        setAiLineError("Error processing commands. Please specify more clearly.");
      }
    } catch (err: any) {
      console.error("AI command failed:", err);
      const activeEmail = impersonatedUser?.email || user?.email;
      setAiLineError(getDisplayErrorMessage(err, activeEmail, "An error occurred. Please try again or contact support."));
    } finally {
      setIsAiLineEditing(false);
    }
  };

  const handleQAImport = (doc: DocumentHistoryItem) => {
    if (!doc || !doc.fullData) return;

    const data = doc.fullData;

    // Basic fields
    if (data.customer) {
      setCustomer(data.customer);
    }
    
    if (data.poNumber) setPoNumber(data.poNumber);
    
    // Line items
    if (data.items && Array.isArray(data.items)) {
      setItems(prevItems => {
        let currentItems = [...prevItems];
        if (currentItems.length === 1 && currentItems[0].description.trim() === "") {
          currentItems = [];
        }
        const imported = data.items.map(item => ({
          ...item,
          id: Math.random().toString(36).substr(2, 9)
        }));
        return [...currentItems, ...imported];
      });
    }

    if ((data as any).dimensionalReports) {
      setDimensionalReports((data as any).dimensionalReports);
    }

    setShowQAImportModal(false);
  };

  // Auto-detect Scope of Work and Material Type from items
  useEffect(() => {
    if (false) {
      let detectedScope = "";
      let detectedMaterial = "";

      const SCOPE_KEYWORDS = [
        { keywords: ["flange", "flg"], value: "Flanges" },
        { keywords: ["fitting", "elbow", "tee", "reducer", "cap", "coupling", "union", "nipple", "swage", "bend", "stub end"], value: "Pipe Fittings" },
        { keywords: ["olet", "weldolet", "sockolet", "threadolet", "latrolet", "elbolet"], value: "Olets" },
        { keywords: ["forged"], value: "Forged Fittings" },
        { keywords: ["valve", "ball valve", "gate valve", "check valve", "globe valve", "butterfly valve"], value: "Valves" },
        { keywords: ["gasket"], value: "Gaskets" },
        { keywords: ["bolt", "nut", "stud", "fastener", "washer", "screw", "u-bolt", "anchor", "fastners"], value: "Bolting Products" },
        { keywords: ["pipe", "tubing", "tube"], value: "Pipes & Tubes" },
        { keywords: ["sheet", "plate", "coil"], value: "Sheets & Plates" },
        { keywords: ["bar", "round bar", "hex bar", "rod"], value: "Bars & Rods" },
        { keywords: ["beam", "channel", "angle", "structure"], value: "Structural Steel" }
      ];

      const MATERIAL_KEYWORDS = [
        { keywords: ["stainless", "ss", "f304", "f316", "f321", "gr 304", "gr 316", "304l", "316l", "f347", "347", "310", "317", "904l", "s304", "s316"], value: "Stainless Steel" },
        { keywords: ["carbon", "cs", "a105", "wpb", "a234", "a106", "low temp", "lf2", "a333", "a350", "gr 6", "gr b", "sa105"], value: "Carbon Steel" },
        { keywords: ["alloy", "f11", "f22", "f5", "f9", "f91", "a182", "p11", "p22", "p5", "p9", "p91", "4130", "4140"], value: "Alloy Steel" },
        { keywords: ["duplex", "f51", "f53", "f60", "2205", "2507", "s31803", "s32750", "s32760"], value: "Duplex Steel" },
        { keywords: ["monel", "inconel", "hastelloy", "nickel", "copper", "cupro", "brass", "titanium", "incoloy", "alloy 625", "alloy 825", "alloy 400", "alloy c276"], value: "Nickel & Special Alloys" }
      ];

      for (const item of items) {
        const desc = (item.description || "").toLowerCase();
        if (!desc || desc.trim().length < 2) continue;

        if (!detectedScope) {
          const match = SCOPE_KEYWORDS.find(sk => sk.keywords.some(k => desc.includes(k)));
          if (match) detectedScope = match.value;
        }

        if (!detectedMaterial) {
          const match = MATERIAL_KEYWORDS.find(mk => mk.keywords.some(k => desc.includes(k)));
          if (match) detectedMaterial = match.value;
        }

        if (detectedScope && detectedMaterial) break;
      }

      if (detectedScope && !scopeOfWork?.trim()) setScopeOfWork(detectedScope);
      if (detectedMaterial && !materialType?.trim()) setMaterialType(detectedMaterial);
    }
  }, [items, scopeOfWork, materialType, docType]);

  const [riskMitigation, setRiskMitigation] = useState<Record<string, string>>({
    "Mixed Heat Prevention Physical Segregation & Heat Code Verification": "PASSED",
    "Material Drift Control – Grade verification strategy implemented through PMI and MTC correlation": "PASSED",
    "Geometric Control – Dimensional accuracy ensured through calibrated inspection methods": "PASSED",
    "Documentation Consistency MTC, inspection records, and packing list cross-aligned": "PASSED",
    "Marking Integrity control Cross verification of heat no, size, and grade with MTC": "PASSED",
  });
  const [inspectionSummary, setInspectionSummary] = useState<InspectionParameter[]>(
    INSPECTION_SUMMARY_OPTIONS.map(opt => ({ ...opt, isVerified: true }))
  );
  const [packagingDispatch, setPackagingDispatch] = useState<PackagingDispatchItem[]>(
    PACKAGING_DISPATCH_OPTIONS.map(opt => ({ ...opt }))
  );
  const [heatId, setHeatId] = useState("");
  const [hasRawMaterialTC, setHasRawMaterialTC] = useState(false);
  const [mtcType, setMtcType] = useState<"3.1" | "3.2">("3.1");
  const [tpiEngagement, setTpiEngagement] = useState("");
  const [samplingType, setSamplingType] = useState("AQL Level II");
  const [samplingProtocol, setSamplingProtocol] = useState("AQL Level II sampling methodology applied to ensure representative inspection across supplied materials. Sampling conducted across different sizes, material grades, and heat batches where applicable to verify consistency, traceability, and compliance with specified standards. The applied sampling approach ensures effective coverage of supplied lot and minimizes the risk of undetected deviations during inspection.");
  const [ncrStatus, setNcrStatus] = useState("COMPLIANT");
  const [ncrItems, setNcrItems] = useState<NcrItem[]>([]);
  const [evidenceControl, setEvidenceControl] = useState<EvidenceItem[]>(
    EVIDENCE_CONTROL_OPTIONS.map(opt => ({ ...opt }))
  );
  const [evidenceRepo, setEvidenceRepo] = useState<string[]>([
    "MTC (EN 10204 3.1) verification completed.",
    "Visual Archetype Logs archived.",
    "Calibrated Dimensional Registry verified."
  ]);
  const [technicalNotes, setTechnicalNotes] = useState(QA_QC_STANDARD_NOTES);
  const [qualityDeclaration, setQualityDeclaration] = useState("Material is certified to be in 100% compliance with PO requirements and relevant technical specifications.\nCertified fit for intended installation and industrial application.");
  const [finalRemarksStatus, setFinalRemarksStatus] = useState<"satisfactory" | "satisfactory_remarks" | "unsatisfactory">("satisfactory");
  const [finalRemarksText, setFinalRemarksText] = useState("");
  const [dimensionalReports, setDimensionalReports] = useState<DimensionalOrderItem[]>([]);
  const [deletedDimensionalItemIds, setDeletedDimensionalItemIds] = useState<string[]>([]);

  // MTC Certificate-level states
  const [mtcCertificateNo, setMtcCertificateNo] = useState("VESCO/PL/E/23476/2023-24");
  const [mtcSpecification, setMtcSpecification] = useState("ASME SA420M GR.WPL6-2021/ASTM A420M WPL6-2019");
  const [mtcDimension, setMtcDimension] = useState("ASME B16.9-2018 ED.");
  const [mtcRemarks, setMtcRemarks] = useState(
    "1. Material is Fully Killed & Fine Grained Practice\n" +
    "2. Raw material manufacturing Process Route: EF-AOD\n" +
    "3. U.T. as per SA388 & acceptance as per CL.3.3.4.2 OF ASME SEC VIII DIV. 2 ED.2021\n" +
    "4. No welding has been performed on forging Component.\n" +
    "5. Location of Test Specimen: 1/2T & tangential\n" +
    "6. MPT.as per SA275 & acceptance as per Appendix-6 OF ASME SEC VIII DIV. 1 ED.2021\n" +
    "7. General Requirements as per ASME SA960 ED.2021.\n" +
    "8. Material confirm to ASTM A420 GR.WPL6 ED.2019 (NACE MR0175/ISO 15156-15)\n" +
    "9. Marking: Logo/Description/Size/Material/Heat No.\n" +
    "10. Visual and Dimension as per B16.9-2018 ED.: Satisfactory"
  );

  const [isGeneratingMtc, setIsGeneratingMtc] = useState(false);
  const [activeMtcTabs, setActiveMtcTabs] = useState<Record<string, string>>({});
  const [projectName, setProjectName] = useState("");

  const [costSheetTotals, setCostSheetTotals] = useState<{
    totalProductCost: number;
    totalLogistics: number;
    totalLandedCost: number;
    profitAmount: number;
    discountAmount: number;
    finalSellingPrice: number;
    profitType?: "%" | "Flat";
    profitValue?: number;
    discountType?: "%" | "Flat";
    discountValue?: number;
    directMaterialLaborTotal?: number;
    suppliersData?: CostSheetSupplierSummary[];
    rowsSummary?: CostSheetRowSummary[];
    totalQuantity?: number;
    totalWeight?: number;
    weightUnit?: "kg" | "lbs";
  }>({
    totalProductCost: 0,
    totalLogistics: 0,
    totalLandedCost: 0,
    profitAmount: 0,
    discountAmount: 0,
    finalSellingPrice: 0,
    profitType: "%",
    profitValue: 0,
    discountType: "Flat",
    discountValue: 0,
    directMaterialLaborTotal: 0,
  });

  // States for Quick Manual Add Row
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [qaCategory, setQaCategory] = useState<"flange" | "fitting" | "pipe" | "forged_fitting" | "olet">("pipe");
  const [qaSize, setQaSize] = useState("2\"");
  const [qaSize2, setQaSize2] = useState("1-1/2\"");
  const [qaType, setQaType] = useState("PIPE");
  const [qaSchedule, setQaSchedule] = useState("SCH 40");
  const [qaRating, setQaRating] = useState("150#");
  const [qaQty, setQaQty] = useState(1);
  const [qaCustomDesc, setQaCustomDesc] = useState("");

  const handleQuickAddRow = () => {
    let generatedDesc = "";
    if (qaCategory === "flange") {
      generatedDesc = `FLANGE ${qaSize} ${qaRating} ${qaType}`.trim();
    } else if (qaCategory === "fitting") {
      if (qaType === "REDUCER") {
        generatedDesc = `${qaSize} X ${qaSize2} CONCENTRIC REDUCER ${qaSchedule} BW`.trim();
      } else {
        generatedDesc = `${qaType} ${qaSize} ${qaSchedule} BW`.trim();
      }
    } else if (qaCategory === "pipe") {
      generatedDesc = `PIPE ${qaSize} ${qaSchedule} SMLS`.trim();
    } else if (qaCategory === "forged_fitting") {
      const isThd = (qaType || "").toUpperCase().includes('THREADED') || (qaType || "").toUpperCase().includes('THD');
      generatedDesc = `FORGED ${qaType} ${qaSize} ${qaRating} ${isThd ? 'THD' : 'SW'}`.trim();
    } else if (qaCategory === "olet") {
      generatedDesc = `${qaType} ${qaSize} ${qaSchedule}`.trim();
    }

    const finalDescription = qaCustomDesc.trim() || generatedDesc;
    const newId = "manual-" + Math.random().toString(36).substr(2, 9);
    
    const newItem: LineItem = {
      id: newId,
      description: finalDescription,
      hsn: "8424",
      quantity: qaQty,
      unit: "NOS",
      rate: 0,
      taxRate: 18,
    };
    
    setDeletedDimensionalItemIds(prev => prev.filter(id => id !== newId));
    setItems(prev => [...prev, newItem]);
    setQaCustomDesc("");
    
    showModal({
      title: "Product Row Added",
      message: `Manually added "${finalDescription}" successfully. Checked and mapped dimensions against standard catalogs.`,
      type: "success"
    });
  };

  const deleteMeasurementItem = (itemId: string) => {
    setDeletedDimensionalItemIds(prev => [...prev, itemId]);
    setDimensionalReports(prev => prev.filter(r => r.itemId !== itemId));
  };

  const deleteMeasurementSegment = (itemIds: string[]) => {
    setDeletedDimensionalItemIds(prev => [...prev, ...itemIds]);
    setDimensionalReports(prev => prev.filter(r => !itemIds.includes(r.itemId)));
  };

  // Auto-detect Dimensional Reports from items
  useEffect(() => {
    return;

    const rxTee = /\btees?\b/i;
    const rxElbow = /\belbows?\b/i;
    const rxReducer = /\breducers?\b/i;
    const rxCap = /\bcaps?\b/i;
    const rxStubEnd = /\bstub\s*ends?\b/i;

    setDimensionalReports(prev => {
      const updatedReports = [...prev];
      let hasChanges = false;
      
      items.forEach((item, index) => {
        if (deletedDimensionalItemIds.includes(item.id)) return;
        const desc = (item.description || "").toLowerCase();
        let category: "flange" | "fitting" | "forged_fitting" | "pipe" | "olet" | "other" = "other";
        
        if (desc.includes("b16.11") || desc.includes("mss sp-83") || desc.includes("mss sp-79") || desc.includes("3000lb") || desc.includes("3000#") || desc.includes("6000lb") || desc.includes("6000#") || desc.includes("9000lb") || desc.includes("9000#") || desc.includes("sw ") || desc.includes("socket weld") || desc.includes("npt") || desc.includes("threaded") || desc.includes("thd")) {
          if (desc.includes("olet") || desc.includes("wol") || desc.includes("sol") || desc.includes("tol") || desc.includes("mss sp-97")) {
            category = "olet";
          } else {
            category = "forged_fitting";
          }
        } 
        else if (desc.includes("olet") || desc.includes("wol") || desc.includes("sol") || desc.includes("tol") || desc.includes("branch connection") || desc.includes("mss sp-97")) {
          category = "olet";
        } else if (desc.includes("flange") || desc.includes("flg") || desc.includes("wnrf") || desc.includes("sorf") || desc.includes("blrf") || desc.includes("wn") || desc.includes("so") || desc.includes("blind") || desc.includes("swrf") || desc.includes("lwnrf") || desc.includes("b16.5") || desc.includes("b16.47") || desc.includes("#150") || desc.includes("#300") || desc.includes("#600") || desc.includes("150lb") || desc.includes("300lb") || desc.includes("600lb")) {
          category = "flange";
        } else if (desc.includes("bw") || desc.includes("butt weld") || desc.includes("butt-weld") || desc.includes("b16.9") || rxElbow.test(desc) || rxTee.test(desc) || rxReducer.test(desc) || rxCap.test(desc) || rxStubEnd.test(desc)) {
          category = "fitting";
        } else if (desc.includes("pipe") || desc.includes("tubing") || desc.includes("smls") || desc.includes("erw") || desc.includes("sml pipe") || desc.includes("b16.10") || desc.includes("b36.10") || desc.includes("b36.19")) {
          category = "pipe";
        }

        if (category === "other") {
          if (desc.includes("b16.9")) category = "fitting";
          else if (desc.includes("b16.11")) category = "forged_fitting";
          // If in Dimensional Report mode, we should include ALL items even if 'other'
          // to prevent products from disappearing.
        }

        const itemDesc = item.description || "";
        const { size1, size2 } = extractSize(itemDesc);
        let sizeText = size1;
        if (sizeText === "Unknown") {
          const loneSizeMatch = itemDesc.match(/(?:^|\s)(\d+(?:\/\d+)?)(?:\"|\b)/);
          if (loneSizeMatch) sizeText = loneSizeMatch[1].includes('"') ? loneSizeMatch[1] : `${loneSizeMatch[1]}"`;
        }

        const itemNo = (index + 1).toString();
        const existingIdx = updatedReports.findIndex(r => r.itemId === item.id);
        const existingReport = existingIdx !== -1 ? updatedReports[existingIdx] : null;

        const schedule = extractSchedule(itemDesc);
        const rating = extractRating(itemDesc);
        let type = "";
        let dims: Record<string, MeasuredValue> = existingReport ? { ...existingReport.dimensions } : {};

        if (category === "flange") {
          type = itemDesc.toUpperCase().includes("LWNRF") ? "LWNRF" : itemDesc.toUpperCase().includes("WNRF") ? "WNRF" : itemDesc.toUpperCase().includes("BLRF") ? "BLRF" : "SORF";
          dims = getFlangeDimensionsObject(sizeText, rating || "150", type, schedule, itemDesc, dims);
        } else if (category === "pipe") {
          type = "PIPE";
          dims = getPipeDimensionsObject(sizeText, schedule, dims);
        } else if (category === "olet") {
          type = itemDesc.toUpperCase().includes("WELDOLET") ? "WELDOLET" : itemDesc.toUpperCase().includes("SOCKOLET") ? "SOCKOLET" : "THREDOLET";
          dims = getOletDimensionsObject(sizeText, type, schedule, rating, dims);
        } else if (category === "fitting") {
          if (rxElbow.test(itemDesc)) {
            type = (() => {
              const d = itemDesc.toLowerCase();
              const is180 = d.includes("180");
              const is45 = d.includes("45");
              const isSR = d.includes("sr") || d.includes("short radius");
              if (is180) return isSR ? "Elbow 180 SR" : "Elbow 180 LR";
              if (is45) return isSR ? "Elbow 45 SR" : "Elbow 45 LR";
              return isSR ? "Elbow 90 SR" : "Elbow 90 LR";
            })();
          } else if (rxTee.test(itemDesc)) {
            type = (itemDesc.toLowerCase().includes("reducing") || !!size2) ? "Reducing Tee" : "Tee";
          } else if (rxReducer.test(itemDesc)) {
            type = itemDesc.toLowerCase().includes("ecc") ? "Eccentric Reducer" : "Concentric Reducer";
          } else if (rxCap.test(itemDesc)) {
            type = "BW Cap";
          } else if (rxStubEnd.test(itemDesc)) {
            type = "Stub End";
          } else {
            type = "Fitting";
          }
          dims = getFittingDimensionsObject(sizeText, size2, type, schedule, dims);
        } else if (category === "forged_fitting") {
          if (rxElbow.test(itemDesc)) type = "SW 90 Elbow";
          else if (rxTee.test(itemDesc)) type = "SW Tee";
          else type = "Forged Fitting";
          dims = getForgedFittingDimensionsObject(sizeText, type, rating || "3000", dims);
        }

        if (existingIdx !== -1) {
          const report = updatedReports[existingIdx];
          if (report.extractedDescription !== item.description || report.itemNo !== itemNo) {
            updatedReports[existingIdx] = {
              ...report,
              itemNo,
              extractedDescription: item.description,
              size: sizeText,
              size2: size2,
              schedule,
              standardClass: rating,
              dimensions: dims,
              type,
              category
            };
            hasChanges = true;
          }
        } else {
          updatedReports.push({
            itemId: item.id,
            itemNo,
            extractedDescription: item.description,
            category,
            size: sizeText,
            size2: size2,
            type,
            standardClass: rating,
            schedule,
            dimensions: dims,
            result: "PENDING"
          });
          hasChanges = true;
        }
      });

      const itemIds = new Set(items.map(i => i.id).filter(id => !deletedDimensionalItemIds.includes(id)));
      const filteredReports = updatedReports.filter(r => itemIds.has(r.itemId) && !deletedDimensionalItemIds.includes(r.itemId));
      if (filteredReports.length !== updatedReports.length) hasChanges = true;

      return hasChanges ? filteredReports : prev;
    });
  }, [items, docType, deletedDimensionalItemIds]);

  const updateDimensionalReport = (itemId: string, key: string, value: string) => {
    setDimensionalReports(prev => prev.map(report => {
      if (report.itemId === itemId) {
        return {
          ...report,
          dimensions: {
            ...report.dimensions,
            [key]: { ...report.dimensions[key], measured: value }
          }
        };
      }
      return report;
    }));
  };

  const [isAiProcessing, setIsAiProcessing] = useState(false);

  const runAISmartCheck = async () => {
    if (items.length === 0) return;
    setIsAiProcessing(true);
    try {
      const aiReports = await smartAnalyzeDimensionalReport(items, dimensionalReports);
      
      if (!aiReports || aiReports.length === 0) {
        showModal({
          title: "Smart Sync Warning",
          message: "AI returned no analysis data. Keeping current report state.",
          type: "warning"
        });
        return;
      }
      
      setDimensionalReports(prev => {
        const aiMap = new Map(aiReports.filter(r => !!r.itemId).map(r => [r.itemId, r]));
        // Fallback map by itemNo if itemId fails
        const noMap = new Map(aiReports.filter(r => !!r.itemNo).map(r => [r.itemNo, r]));
        
        const updated = prev.map(existing => {
          const aiUpdate = aiMap.get(existing.itemId) || noMap.get(existing.itemNo);
          if (!aiUpdate) return existing;
          
          // Merge dimensions to ensure measured values are preserved
          let mergedDims = { ...aiUpdate.dimensions };
          Object.keys(existing.dimensions).forEach(key => {
            if (existing.dimensions[key].measured) {
              if (mergedDims[key]) {
                mergedDims[key].measured = existing.dimensions[key].measured;
              } else {
                mergedDims[key] = existing.dimensions[key];
              }
            }
          });
          
          // Local Enrichment: Fix missing or invalid standards using our local DB as truth
          try {
            if (aiUpdate.category === "flange") {
              mergedDims = getFlangeDimensionsObject(aiUpdate.size, aiUpdate.standardClass || "150", aiUpdate.type || "SORF", aiUpdate.schedule || "", aiUpdate.extractedDescription || "", mergedDims);
            } else if (aiUpdate.category === "pipe") {
              mergedDims = getPipeDimensionsObject(aiUpdate.size, aiUpdate.schedule || "", mergedDims);
            } else if (aiUpdate.category === "fitting") {
              mergedDims = getFittingDimensionsObject(aiUpdate.size, aiUpdate.size2 || "", aiUpdate.type || "", aiUpdate.schedule || "", mergedDims);
            } else if (aiUpdate.category === "forged_fitting") {
              mergedDims = getForgedFittingDimensionsObject(aiUpdate.size, aiUpdate.type || "", aiUpdate.rating || "3000", mergedDims);
            } else if (aiUpdate.category === "olet") {
              mergedDims = getOletDimensionsObject(aiUpdate.size, aiUpdate.type || "Weldolet", aiUpdate.schedule || "", aiUpdate.rating || "3000", mergedDims);
            }
          } catch (e) {
            console.warn("Local enrichment failed for item", aiUpdate.itemId, e);
          }
          
          // Re-calculate overall result based on merged dimensions
          const anyInvalidMerged = Object.values(mergedDims).some(d => d.isValid === false);
          const allValidMerged = Object.values(mergedDims).every(d => d.isValid === true);
          
          let calcResult: "PASSED" | "FAILED" | "PENDING" = "PENDING";
          if (anyInvalidMerged) calcResult = "FAILED";
          else if (allValidMerged && Object.keys(mergedDims).length > 0) calcResult = "PASSED";

          return { 
            ...aiUpdate, 
            dimensions: mergedDims,
            // Honor manual overrides from existing, otherwise use calculated or AI's result
            result: (existing.result !== "PENDING" && existing.result !== aiUpdate.result) ? existing.result : calcResult
          };
        });

        // Add any new items identified by AI that weren't in the list
        const prevIds = new Set(prev.map(p => p.itemId));
        const additional = aiReports.filter(r => !prevIds.has(r.itemId));
        
        return [...updated, ...additional];
      });
      
      showModal({
        title: "AI Smart sync Complete",
        message: "AI has re-verified technical standards. Your existing measured values have been preserved.",
        type: "success"
      });
    } catch (err) {
      showModal({
        title: "AI Support Error",
        message: "Failed to process AI analysis. Please try again later.",
        type: "warning"
      });
    } finally {
      setIsAiProcessing(false);
    }
  };

  const validateWithAI = async (itemId: string) => {
    const report = dimensionalReports.find(r => r.itemId === itemId);
    if (!report) return;

    setIsAiProcessing(true);
    try {
      const result = await checkTolerances(report);
      const keyMapping: Record<string, string> = {
        "Outside Diameter": "OD",
        "Wall Thickness": "WT",
        "Center to End": "CenterToCenter",
        "Center To Center": "CenterToCenter",
        "Thickness": "Thk",
        "thickness": "Thk",
        "P.C.D": "PCD"
      };

      setDimensionalReports(prev => prev.map(r => {
        if (r.itemId === itemId) {
          const newDims = { ...r.dimensions };
          Object.keys(result.dimensions).forEach(aiKey => {
            const targetKey = keyMapping[aiKey] || aiKey;
            if (newDims[targetKey]) {
              newDims[targetKey] = {
                ...newDims[targetKey],
                tolerance: result.dimensions[aiKey].tolerance,
                isValid: result.dimensions[aiKey].status === 'valid',
                aiFeedback: result.dimensions[aiKey].message
              };
            }
          });
          
          // Determine overall result based on all dimensions - MUST HAVE ALL DIMENSIONS VALIDATED
          // If any dimension is strictly invalid, set to FAILED
          // If all are strictly valid, set to PASSED
          // Otherwise keep as PENDING
          const anyInvalid = Object.values(newDims).some(d => d.isValid === false);
          const allValid = Object.values(newDims).every(d => d.isValid === true);
          
          let finalResult: "PASSED" | "FAILED" | "PENDING" = "PENDING";
          if (anyInvalid) finalResult = "FAILED";
          else if (allValid && Object.keys(newDims).length > 0) finalResult = "PASSED";
          
          return { 
            ...r, 
            dimensions: newDims, 
            result: finalResult
          };
        }
        return r;
      }));
    } finally {
      setIsAiProcessing(false);
    }
  };

  const updateDimensionalResult = (itemId: string, result: "PASSED" | "FAILED" | "PENDING") => {
    setDimensionalReports(prev => prev.map(report => {
      if (report.itemId === itemId) {
        return { ...report, result };
      }
      return report;
    }));
  };
  const hasErrors = useMemo(() => {
    const hasBusinessErrors = Object.values(businessErrors).some(e => e !== undefined);
    const hasCustomerErrors = Object.values(customerErrors).some(e => e !== undefined);
    const hasDocErrors = Object.values(docErrors).some(e => e !== undefined);
    
    // Check items
    const hasItemErrors = items.some(item => {
      if (!item.description) return true;
      if (item.quantity <= 0) return true;
      if (!item.isRegret && item.rate < 0) return true;
      return false;
    });

    return hasBusinessErrors || hasCustomerErrors || hasDocErrors || hasItemErrors;
  }, [businessErrors, customerErrors, docErrors, items]);

  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'confirm';
    onConfirm?: () => void;
    confirmText?: string;
    cancelText?: string;
  }>({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
  });

  const showModal = (config: Omit<typeof modalConfig, 'isOpen'>) => {
    setModalConfig({ ...config, isOpen: true });
  };

  const closeModal = () => {
    setModalConfig(prev => ({ ...prev, isOpen: false }));
  };

  useEffect(() => {
    if (customer.name && history.length > 0) {
      const fetchPatterns = async () => {
        setIsAnalyzingPatterns(true);
        const patterns = await analyzeCustomerPatterns(customer.name, history);
        setSuggestedNotes(patterns);
        setIsAnalyzingPatterns(false);
      };
      fetchPatterns();
    } else {
      setSuggestedNotes(null);
    }
  }, [customer.name, history]);

  useEffect(() => {
    // Validate business profile
    setBusinessErrors({
      name: validateRequired(business.name, "Business Name"),
      gstin: validateGSTIN(business.gstin),
      phone: validatePhone(business.phone),
      email: validateEmail(business.email)
    });
  }, [business.name, business.gstin, business.phone, business.email]);

  useEffect(() => {
    // Validate customer details
    setCustomerErrors({
      name: validateRequired(customer.name, "Customer Name"),
      gstin: validateGSTIN(customer.gstin),
      phone: validatePhone(customer.phone),
      email: validateEmail(customer.email)
    });
  }, [customer.name, customer.gstin, customer.phone, customer.email]);

  useEffect(() => {
    // Validate document settings
    setDocErrors({
      docId: validateRequired(docId, "Document Number"),
      discountRate: (discountRate < 0 || discountRate > 100) ? "Discount must be between 0 and 100" : undefined
    });
  }, [docId, discountRate]);

  const getMostCommonNotesAndTerms = useCallback(() => {
    if (history.length === 0) return { notes: "", terms: DEFAULT_TERMS };
    
    const notesCount: Record<string, number> = {};
    const termsCount: Record<string, number> = {};
    
    history.forEach(h => {
      if (h.fullData?.notes) {
        notesCount[h.fullData.notes] = (notesCount[h.fullData.notes] || 0) + 1;
      }
      if (h.fullData?.terms) {
        termsCount[h.fullData.terms] = (termsCount[h.fullData.terms] || 0) + 1;
      }
    });
    
    const mostCommonNote = Object.keys(notesCount).reduce((a, b) => notesCount[a] > notesCount[b] ? a : b, "");
    const mostCommonTerms = Object.keys(termsCount).reduce((a, b) => termsCount[a] > termsCount[b] ? a : b, DEFAULT_TERMS);
    
    return { notes: mostCommonNote, terms: mostCommonTerms };
  }, [history]);

  // Safe LocalStorage helper
  const safeSave = (key: string, value: any, userId?: string | null) => {
    const fullKey = getStorageKey(key, userId);
    try {
      localStorage.setItem(fullKey, JSON.stringify(value));
    } catch (e) {
      if (e instanceof DOMException && e.name === 'QuotaExceededError') {
        console.warn(`QuotaExceededError for ${key}, attempting multi-tier recovery...`);
        
        try {
          // Tier 1: Try to clear other users' / guest keys to free up space (very safe)
          const keys = Object.keys(localStorage);
          const currentUserPrefix = userId ? `billiq_user_${userId}_` : "billiq_user_guest_";
          const legacyUserPrefix = userId ? `${userId}_` : "guest_";
          let otherKeysCleared = false;
          keys.forEach(k => {
            if (!k.startsWith(currentUserPrefix) && !k.startsWith(legacyUserPrefix)) {
              localStorage.removeItem(k);
              otherKeysCleared = true;
            }
          });
          if (otherKeysCleared) {
            try {
              localStorage.setItem(fullKey, JSON.stringify(value));
              console.info("Successfully saved key after clearing other users' cache.");
              return;
            } catch {}
          }

          // Tier 2: Truncate current user's document history (keep only recent 10, remove fullData from those)
          const historyKey = getStorageKey("document_history", userId);
          const historyDataStr = localStorage.getItem(historyKey);
          if (historyDataStr) {
            try {
              const hist = JSON.parse(historyDataStr);
              if (Array.isArray(hist) && hist.length > 5) {
                const truncated = hist.slice(-5).map(item => {
                  const { fullData, ...rest } = item;
                  return rest;
                });
                localStorage.setItem(historyKey, JSON.stringify(truncated));
                console.warn("Truncated local document history to free up space.");
                try {
                  localStorage.setItem(fullKey, JSON.stringify(value));
                  return;
                } catch {}
              }
            } catch {}
          }

          // Tier 3: If key is document_history, truncate it directly
          if (key === "document_history" && Array.isArray(value)) {
            const truncated = value.slice(-10).map(item => {
              const { fullData, ...rest } = item;
              return rest;
            });
            localStorage.setItem(fullKey, JSON.stringify(truncated));
            console.warn("Truncated and stripped document history to stay within quota.");
            return;
          }

          // Tier 4: Strip active business profile images only as an absolute, desperate last resort
          if (key !== "business_details") {
            const bizKey = getStorageKey("business_details", userId);
            const bizDataStr = localStorage.getItem(bizKey);
            if (bizDataStr) {
              try {
                const bizData = JSON.parse(bizDataStr);
                if (bizData.letterhead || bizData.logo || bizData.signature) {
                  console.warn("QuotaExceeded: Stripping large images from local business details as final resort.");
                  const minimizedBiz = {
                    ...bizData,
                    letterhead: undefined,
                    logo: undefined,
                    signature: undefined
                  };
                  localStorage.setItem(bizKey, JSON.stringify(minimizedBiz));
                  
                  // Now retry saving our original key/value
                  localStorage.setItem(fullKey, JSON.stringify(value));
                  console.info(`Successfully saved ${key} after clearing profile image cache.`);
                  return;
                }
              } catch (innerErr) {
                console.error("Failed to minimize business details during recovery:", innerErr);
              }
            }
          }

          // Tier 5: Direct stripping on business_details itself
          if (key === "business_details") {
            const { letterhead, logo, signature, ...rest } = value;
            localStorage.setItem(fullKey, JSON.stringify(rest));
            console.warn("Removed all profile images to stay within quota.");
            return;
          }

          // Tier 6: Emergency cleanup of other items for this user
          keys.forEach(k => {
            if ((k.startsWith(currentUserPrefix) || k.startsWith(legacyUserPrefix)) && k !== fullKey && !k.includes("business_details") && !k.includes("document_history")) {
              localStorage.removeItem(k);
            }
          });
          
          // Try original one last time
          localStorage.setItem(fullKey, JSON.stringify(value));
          console.warn("Recovered quota by clearing other user data items.");
        } catch (innerError) {
          console.error("Critical: Storage recovery failed completely.", innerError);
          // Last resort: Minimal business details or notify user
          if (key === "business_details") {
            try {
              // Try to keep as much as possible, but strip images if we must
              const minimal = { ...value, letterhead: undefined, logo: undefined, signature: undefined };
              localStorage.setItem(fullKey, JSON.stringify(minimal));
              console.warn("Storage Critically Full: Letterhead/Logo removed from business profile to save core details.");
            } catch (f) {
              const veryMinimal = { name: value.name, gstin: value.gstin };
              localStorage.setItem(fullKey, JSON.stringify(veryMinimal));
            }
          }
          
          showModal({
            title: "Storage Space Notice",
            message: "Your device storage is nearly full. We've organized your local cache safely, but recommend checking uploaded images or exporting your documents.",
            type: "warning"
          });
        }
      } else {
        console.error(`Local storage Error [${key}]:`, e);
      }
    }
  };

  // Reset all state to defaults (for data isolation)
  const resetAllState = useCallback(() => {
    setBusiness(prev => ({
      name: "",
      gstin: "",
      address: "",
      phone: "",
      email: "",
      country: prev.country || "India",
      industry: "",
      logo: undefined,
      letterhead: undefined,
      signature: undefined,
      bankName: "",
      accountNumber: "",
      ifscCode: "",
      branchCode: "",
      showBankDetailsInDocs: DOCUMENT_TYPE_OPTIONS,
    }));
    setCustomer({
      name: "",
      gstin: "",
      address: "",
      phone: "",
      email: "",
      contactPerson: "",
    });
    setSavedCustomers([]);
    setSavedSuppliers([]);
    setHistory([]);
    setLastUsedNumbers({});
    setPriceHistory([]);
    setLastExportTimestamp(0);
    setItems([{ id: "1", description: "", hsn: "", quantity: 1, unit: "NOS", rate: 0, taxRate: 18 }]);
    setDocType(DocumentType.TAX_INVOICE);
    setIsExport(false);
    setScopeOfWork("");
    setMaterialType("");
    setRiskMitigation({
      "Mixed Heat Prevention Physical Segregation & Heat Code Verification": "PASSED",
      "Material Drift Control – Grade verification strategy implemented through PMI and MTC correlation": "PASSED",
      "Geometric Control – Dimensional accuracy ensured through calibrated inspection methods": "PASSED",
      "Documentation Consistency MTC, inspection records, and packing list cross-aligned": "PASSED",
      "Marking Integrity control Cross verification of heat no, size, and grade with MTC": "PASSED",
    });
    setInspectionSummary(INSPECTION_SUMMARY_OPTIONS.map(opt => ({ ...opt, isVerified: true })));
    setPackagingDispatch(PACKAGING_DISPATCH_OPTIONS.map(opt => ({ ...opt })));
    setHeatId("");
    setHasRawMaterialTC(false);
    setMtcType("3.1");
    setTpiEngagement("");
    setSamplingType("AQL Level II");
    setSamplingProtocol("AQL Level II sampling methodology applied to ensure representative inspection across supplied materials. Sampling conducted across different sizes, material grades, and heat batches where applicable to verify consistency, traceability, and compliance with specified standards. The applied sampling approach ensures effective coverage of supplied lot and minimizes the risk of undetected deviations during inspection.");
    setNcrStatus("COMPLIANT");
    setNcrItems([]);
    setEvidenceControl(EVIDENCE_CONTROL_OPTIONS.map(opt => ({ ...opt })));
    setTechnicalNotes(QA_QC_STANDARD_NOTES);
    setEvidenceRepo([
      "MTC (EN 10204 3.1) verification completed.",
      "Visual Archetype Logs archived.",
      "Calibrated Dimensional Registry verified."
    ]);
    setQualityDeclaration("Material is certified to be in 100% compliance with PO requirements and relevant technical specifications.\nCertified fit for intended installation and industrial application.");
    setCurrency(business?.currency || "INR");
    setExchangeRate(1);
    setDocId("");
    setDate(new Date().toISOString().split("T")[0]);
    setDiscountRate(0);
    setTargetMarginPercent(0);
    setTransport("");
    setPoNumber("");
    setPaymentTerms("");
    setPaymentMode("");
    setNumberOfPackages("");
    setAdvancePercentage(0);
    setFreightOption("none");
    setFreightAmount(0);
    setPackagingOption("none");
    setPackagingAmount(0);
    setNotes("");
    setTerms(DEFAULT_TERMS);
    setShowNotes(true);
    setShowTerms(true);
    setIsNotesManuallyEdited(false);
    setIsTermsManuallyEdited(false);
    setLastUsedNotesAndTerms({
      customer: {
        standard: { notes: "", terms: DEFAULT_TERMS },
        export: { notes: "", terms: DEFAULT_TERMS },
      },
      supplier: {
        standard: { notes: "", terms: DEFAULT_TERMS },
        export: { notes: "", terms: DEFAULT_TERMS },
      },
    });
    setLoadedTimestamp(null);
  }, [business?.currency]);

  const purgeUnpartitionedCache = useCallback((currentUid?: string | null) => {
    try {
      if (typeof window === "undefined" || !window.localStorage) return;

      const allowedPrefixes = currentUid ? [`billiq_user_${currentUid}_`, `${currentUid}_`] : [];
      const globalWhiteList = [
        "has_submitted_feedback",
        "theme",
        "language",
        "billiq_is_logged_in",
        "billiq_has_entered_app",
        "billiq_active_view",
        "active_app_route",
        "active_app_step",
        "activeUserId",
        "billiq_has_entered_app"
      ];

      const unpartitionedKeys = [
        "business_details",
        "saved_customers",
        "saved_suppliers",
        "document_history",
        "last_used_numbers",
        "price_history",
        "autosave_invoice_draft",
        "last_used_notes_and_terms",
        "pdf_layout_settings"
      ];

      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;

        // NEVER purge Firebase system auth keys or whitelisted app preferences
        if (
          key.startsWith("firebase:") || 
          key.includes("firebase") || 
          key.includes("firestore") ||
          globalWhiteList.includes(key)
        ) {
          continue;
        }

        // 1. Remove exact unpartitioned legacy keys
        if (unpartitionedKeys.includes(key)) {
          keysToRemove.push(key);
          continue;
        }

        // 2. Remove unpartitioned reference history keys
        if (key.startsWith("billiq_ref_history_")) {
          keysToRemove.push(key);
          continue;
        }

        // 3. Remove keys belonging to other users or guest sessions when logged in as currentUid
        if (currentUid) {
          const isAllowed = allowedPrefixes.some(p => key.startsWith(p));
          if (!isAllowed) {
            keysToRemove.push(key);
          }
        }
      }

      keysToRemove.forEach(k => {
        try {
          localStorage.removeItem(k);
        } catch {}
      });

      // Clear indexedDB databases if any un-partitioned database exists (NEVER touch Firebase/Firestore DBs!)
      if (typeof indexedDB !== "undefined" && indexedDB.databases) {
        indexedDB.databases().then(dbs => {
          dbs.forEach(dbInfo => {
            const dbName = (dbInfo.name || "").toLowerCase();
            // Strictly protect Firebase Auth & Firestore system databases
            if (
              dbName.includes("firebase") || 
              dbName.includes("firestore") || 
              dbName.includes("auth") ||
              dbName.includes("billiq_system")
            ) {
              return;
            }
            if (dbInfo.name && (!currentUid || !dbInfo.name.includes(currentUid))) {
              try {
                indexedDB.deleteDatabase(dbInfo.name);
              } catch {}
            }
          });
        }).catch(() => {});
      }
    } catch (err) {
      console.warn("Notice during cache purge:", err);
    }
  }, []);

  // Synchronous active view persistence effect
  useEffect(() => {
    if (user?.uid) {
      try {
        const routeToSave = (isAdminConsoleActive && !impersonatedUser && isAdminUser(user, userProfile)) ? "admin" : (step || "dashboard");
        localStorage.setItem(`billiq_user_${user.uid}_billiq_active_view`, routeToSave);
        localStorage.setItem("billiq_active_view", routeToSave);
      } catch (e) {}
    }
  }, [user?.uid, step, isAdminConsoleActive, impersonatedUser, userProfile]);

  // Auth listener with Synchronous Auth Lock Guard
  useEffect(() => {
    if (!auth) {
      setAuthLoading(false);
      setIsInitializingAuth(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        try {
          localStorage.setItem("billiq_is_logged_in", "true");
          localStorage.setItem("billiq_has_entered_app", "true");
        } catch {}
        setShowLanding(false);
        setUser((prevUser: any) => {
          // ONLY reset state if switching from an existing user session to a DIFFERENT user account
          if (prevUser?.uid && prevUser.uid !== currentUser?.uid) {
            resetAllState();
            purgeUnpartitionedCache(currentUser?.uid);
            loadedUserIdRef.current = Symbol("uninitialized");
          }
          if (prevUser?.uid === currentUser?.uid && prevUser?.email === currentUser?.email) {
            return prevUser;
          }
          return currentUser;
        });
        setAuthLoading(false);
        setIsInitializingAuth(false);

        // Run profile sync and account status validation asynchronously in background without blocking UI
        if (isConfigValid && db) {
          (async () => {
            try {
              await syncUserProfileToFirestore(currentUser);
              const userDocRef = doc(db, "users", currentUser.uid);
              const userDocSnap = await getDoc(userDocRef);
              if (userDocSnap.exists()) {
                const uData = userDocSnap.data();
                if (uData?.accountStatus === "Deleted" || uData?.isDeleted === true) {
                  await logoutUser();
                  try {
                    localStorage.removeItem("billiq_is_logged_in");
                    localStorage.removeItem("billiq_has_entered_app");
                    localStorage.removeItem("billiq_active_view");
                    localStorage.removeItem("activeUserId");
                  } catch {}
                  setUser(null);
                  setShowLanding(true);
                  alert("This account was deleted by an administrator. Please create a new account.");
                }
              }
            } catch (checkErr) {
              console.warn("Background Firestore user sync notice:", checkErr);
            }
          })();
        }
      } else {
        try {
          localStorage.removeItem("billiq_is_logged_in");
        } catch {}
        setUser(null);
        setAuthLoading(false);
        setIsInitializingAuth(false);
      }
    });
    return () => unsubscribe();
  }, [resetAllState, purgeUnpartitionedCache]);

  // Fetch user-specific contact data strictly belonging to the active user
  useEffect(() => {
    if (!user || !user.uid) {
      setSavedSuppliers([]);
      setSavedCustomers([]);
      return;
    }

    const loadUserData = async () => {
      try {
        const suppliers = await getUserContacts(user.uid, 'Supplier');
        const customers = await getUserContacts(user.uid, 'Customer');
        
        if (suppliers) {
          setSavedSuppliers(suppliers as any);
        }
        if (customers) {
          setSavedCustomers(customers as any);
        }
      } catch (err) {
        console.error('Failed to load user-specific party data:', err);
      }
    };

    loadUserData();
  }, [user?.uid]);

  // Primary Route Restoration Effect: Ensures session restoration completes BEFORE determining initial route
  useEffect(() => {
    if (authLoading || isInitializingAuth) return;

    const savedRoute = getSavedRoute(user?.uid);
    const isAdmin = isAdminUser(user, userProfile);

    if (user) {
      setShowAuthScreen(false);
      // Authenticated User: Restore active view (default to dashboard, never landing page)
      if (savedRoute === "admin" && isAdmin) {
        setShowLanding(false);
        setShowFeatures(false);
        setIsAdminConsoleActive(true);
      } else if (savedRoute === "features") {
        setShowLanding(false);
        setShowFeatures(true);
      } else if (savedRoute === "analytics") {
        setShowLanding(false);
        setShowFeatures(false);
        setIsAdminConsoleActive(false);
        setStep("analytics");
      } else if (savedRoute === "workspace" || savedRoute === "invoice") {
        setShowLanding(false);
        setShowFeatures(false);
        setIsAdminConsoleActive(false);
        setStep("invoice");
      } else if (savedRoute === "history") {
        setShowLanding(false);
        setShowFeatures(false);
        setIsAdminConsoleActive(false);
        setStep("history");
      } else if (savedRoute === "customers") {
        setShowLanding(false);
        setShowFeatures(false);
        setIsAdminConsoleActive(false);
        setStep("customers");
      } else if (savedRoute === "suppliers") {
        setShowLanding(false);
        setShowFeatures(false);
        setIsAdminConsoleActive(false);
        setStep("suppliers");
      } else if (savedRoute === "profile") {
        setShowLanding(false);
        setShowFeatures(false);
        setIsAdminConsoleActive(false);
        setStep("profile");
      } else if (savedRoute === "privacy") {
        setShowLanding(false);
        setShowFeatures(false);
        setIsAdminConsoleActive(false);
        setStep("privacy");
      } else if (savedRoute === "terms") {
        setShowLanding(false);
        setShowFeatures(false);
        setIsAdminConsoleActive(false);
        setStep("terms");
      } else if (savedRoute === "compliance") {
        setShowLanding(false);
        setShowFeatures(false);
        setIsAdminConsoleActive(false);
        setStep("compliance");
      } else if (savedRoute === "dashboard") {
        setShowLanding(false);
        setShowFeatures(false);
        setIsAdminConsoleActive(false);
        setStep("dashboard");
      } else {
        // Default route for logged in users (or if savedRoute was "landing" or empty)
        setShowLanding(false);
        setShowFeatures(false);
        if (isAdmin && savedRoute === "admin") {
          setIsAdminConsoleActive(true);
        } else {
          setIsAdminConsoleActive(false);
          setStep("dashboard");
        }
      }
    } else {
      // Unauthenticated Visitor: Redirect to Auth screen if trying to access protected app routes, or show Landing/Features
      if (savedRoute === "auth" || savedRoute === "login" || savedRoute === "signup") {
        setShowFeatures(false);
        setShowLanding(false);
        setShowAuthScreen(true);
      } else if (savedRoute === "features") {
        setShowFeatures(true);
        setShowLanding(false);
        setShowAuthScreen(false);
      } else if (savedRoute && ["dashboard", "profile", "history", "customers", "suppliers", "workspace", "invoice", "admin", "privacy", "terms", "compliance"].includes(savedRoute)) {
        // Protected app routes accessed without being logged in -> Redirect to Auth screen
        setShowFeatures(false);
        setShowLanding(false);
        setShowAuthScreen(true);
      } else {
        setShowFeatures(false);
        setShowAuthScreen(false);
        setShowLanding(true);
      }
    }
  }, [authLoading, isInitializingAuth, user]);

  // Real-Time Session Presence / Heartbeat Tracking Effect
  useEffect(() => {
    if (!user && !userProfile) return;

    const email = userProfile?.authEmail || userProfile?.signupEmail || user?.email || "";
    const username = userProfile?.authUsername || userProfile?.username || user?.displayName || "";
    const userId = impersonatedUser?.id || user?.uid || "";

    const sendHeartbeat = (status: "online" | "offline" = "online") => {
      try {
        const payload = JSON.stringify({ email, username, userId, status });
        if (status === "offline" && typeof navigator !== "undefined" && navigator.sendBeacon) {
          const blob = new Blob([payload], { type: "application/json" });
          navigator.sendBeacon("/api/heartbeat", blob);
        } else {
          fetch("/api/heartbeat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: payload,
          }).catch(() => {});
        }
      } catch (err) {
        // ignore presence errors
      }
    };

    sendHeartbeat("online");

    const heartbeatInterval = setInterval(() => {
      sendHeartbeat("online");
    }, 30000);

    const handleUserActivity = () => {
      sendHeartbeat("online");
    };

    window.addEventListener("focus", handleUserActivity);
    window.addEventListener("click", handleUserActivity);

    const handleUnload = () => {
      sendHeartbeat("offline");
    };

    window.addEventListener("pagehide", handleUnload);
    window.addEventListener("beforeunload", handleUnload);

    return () => {
      clearInterval(heartbeatInterval);
      window.removeEventListener("focus", handleUserActivity);
      window.removeEventListener("click", handleUserActivity);
      window.removeEventListener("pagehide", handleUnload);
      window.removeEventListener("beforeunload", handleUnload);
      sendHeartbeat("offline");
    };
  }, [user, userProfile, impersonatedUser]);

  // Data isolation: Load user-specific data when user changes
  useEffect(() => {
    if (authLoading) return;

    const userId = user?.uid || "guest";

    // Prevent state reset / re-fetch when returning from background or when user reference re-evaluates
    if (loadedUserIdRef.current === userId) {
      return;
    }
    loadedUserIdRef.current = userId;

    setIsFirstLoad(true); // Prevent immediate save-back during load
    resetAllState(); // Clear all state before loading new user data

    const loadData = async () => {
      // 1. Load from localStorage as initial state (fallback)
      const businessData = localStorage.getItem(getStorageKey("business_details", userId));
      if (businessData) {
        const parsed = JSON.parse(businessData);
        setBusiness(parsed);
        if (parsed.currency) setCurrency(parsed.currency);
      }

      const customersData = localStorage.getItem(getStorageKey("saved_customers", userId));
      if (customersData) setSavedCustomers(JSON.parse(customersData));

      const suppliersData = localStorage.getItem(getStorageKey("saved_suppliers", userId));
      if (suppliersData) setSavedSuppliers(JSON.parse(suppliersData));

      const historyData = localStorage.getItem(getStorageKey("document_history", userId));
      if (historyData) {
        try {
          const parsed = JSON.parse(historyData);
          setHistory(parsed);
          seedReferenceHistoryFromDocumentHistory(parsed, userId);
        } catch (e) {
          console.error("Failed to parse history data", e);
        }
      }

      const lastUsedData = localStorage.getItem(getStorageKey("last_used_numbers", userId));
      if (lastUsedData) {
        try {
          const data = JSON.parse(lastUsedData);
          const sanitized: Record<string, number> = {};
          Object.entries(data).forEach(([key, val]) => {
            sanitized[sanitizeKey(key)] = val as number;
          });
          setLastUsedNumbers(sanitized);
        } catch (e) {
          setLastUsedNumbers({});
        }
      }

      const priceData = localStorage.getItem(getStorageKey("price_history", userId));
      if (priceData) setPriceHistory(JSON.parse(priceData));

      const lastExportData = localStorage.getItem(getStorageKey("last_export_timestamp", userId));
      if (lastExportData) setLastExportTimestamp(Number(lastExportData));

      const notesData = localStorage.getItem(getStorageKey("last_used_notes_and_terms", userId));
      if (notesData) {
        try {
          setLastUsedNotesAndTerms(sanitizeNotesAndTerms(JSON.parse(notesData)));
        } catch (e) {
          setLastUsedNotesAndTerms(DEFAULT_LAST_USED_NOTES_AND_TERMS);
        }
      }

      const layoutData = localStorage.getItem(getStorageKey("pdf_layout_settings", userId));
      if (layoutData) {
        setLayoutSettings(JSON.parse(layoutData));
      } else {
        setLayoutSettings({
          template: "classic",
          sectionOrder: ["header", "party_details", "items_table", "totals", "bank_details", "incoterms", "terms", "signature"],
          accentColor: "#1e1e1e",
        });
      }

      // 2. If logged in, try to restore from cloud (priority)
      if (user && isConfigValid) {
        setIsCloudLoading(true);
        setIsCloudLoadedSuccessfully(false);
        try {
          const cloudPath = `users/${user.uid}`;
          const cloudData = await loadFromCloud(cloudPath);
          
          if (cloudData) {
            // Overwrite with cloud data if it exists, preserving local assets if cloud has stripped them
            if (cloudData.business) {
              setBusiness(prev => {
                const bizCountry = prev.country || cloudData.business.country || countryOfOrigin || "India";
                const bizCurrency = prev.currency || cloudData.business.currency || "INR";
                const bizName = prev.name || cloudData.business.name || cloudData.business.companyName || "";
                const merged = {
                  ...cloudData.business,
                  ...prev,
                  name: bizName,
                  companyName: bizName,
                  country: bizCountry,
                  currency: bizCurrency,
                  state: prev.state !== undefined && prev.state !== "" ? prev.state : (cloudData.business.state || ""),
                  letterhead: prev.letterhead || cloudData.business.letterhead,
                  logo: prev.logo || cloudData.business.logo,
                  signature: prev.signature || cloudData.business.signature,
                };
                safeSave("business_details", merged, user.uid);
                try {
                  localStorage.setItem("business_details", JSON.stringify(merged));
                  localStorage.setItem(getStorageKey("business_details", user.uid), JSON.stringify(merged));
                } catch {}
                if (merged.currency) {
                  setCurrency(merged.currency);
                }
                if (merged.country) setCountryOfOrigin(merged.country);
                return merged;
              });
            }
            if (cloudData.savedCustomers) {
              setSavedCustomers(cloudData.savedCustomers);
              safeSave("saved_customers", cloudData.savedCustomers, user.uid);
            }
            if (cloudData.savedSuppliers) {
              setSavedSuppliers(cloudData.savedSuppliers);
              safeSave("saved_suppliers", cloudData.savedSuppliers, user.uid);
            }
            // Always fetch & merge fallback user documents (subcollections, partitioned queries, local cache)
            const fallbackDocs = await getUserDocumentsFromCloud(user.uid);
            const historyMap = new Map<string, DocumentHistoryItem>();

            if (Array.isArray(fallbackDocs)) {
              fallbackDocs.forEach(doc => {
                if (doc && doc.id) {
                  historyMap.set(`${doc.id}_${doc.type || ''}`, doc);
                }
              });
            }

            if (cloudData && Array.isArray(cloudData.history)) {
              cloudData.history.forEach((doc: DocumentHistoryItem) => {
                if (doc && doc.id) {
                  const key = `${doc.id}_${doc.type || ''}`;
                  const existing = historyMap.get(key);
                  if (!existing || (doc.timestamp || 0) > (existing.timestamp || 0)) {
                    historyMap.set(key, doc);
                  }
                }
              });
            }

            if (historyData) {
              try {
                const localParsed = JSON.parse(historyData);
                if (Array.isArray(localParsed)) {
                  localParsed.forEach((doc: DocumentHistoryItem) => {
                    if (doc && doc.id) {
                      const key = `${doc.id}_${doc.type || ''}`;
                      const existing = historyMap.get(key);
                      if (!existing) {
                        historyMap.set(key, doc);
                      } else if (doc.fullData && !existing.fullData) {
                        historyMap.set(key, { ...existing, fullData: doc.fullData });
                      }
                    }
                  });
                }
              } catch (e) {}
            }

            const mergedHistory = Array.from(historyMap.values()).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
            if (mergedHistory.length > 0) {
              setHistory(mergedHistory);
              seedReferenceHistoryFromDocumentHistory(mergedHistory, user.uid);
              safeSave("document_history", mergedHistory, user.uid);
            }
            if (cloudData.lastUsedNumbers) {
              setLastUsedNumbers(cloudData.lastUsedNumbers);
              safeSave("last_used_numbers", cloudData.lastUsedNumbers, user.uid);
            }
            if (cloudData.priceHistory) {
              setPriceHistory(cloudData.priceHistory);
              safeSave("price_history", cloudData.priceHistory, user.uid);
            }
            if (cloudData.pdf_layout_settings) {
              setLayoutSettings(cloudData.pdf_layout_settings);
              safeSave("pdf_layout_settings", cloudData.pdf_layout_settings, user.uid);
            }
            if (cloudData.hasSubmittedFeedback) {
              setHasSubmittedFeedback(true);
              try {
                localStorage.setItem("has_submitted_feedback", "true");
              } catch (e) {
                console.error(e);
              }
            }
          }
          setIsCloudLoadedSuccessfully(true);
        } catch (error) {
          const errStr = error instanceof Error ? error.message : String(error);
          if (
            errStr.includes("shutting down") ||
            errStr.includes("offline") ||
            errStr.includes("terminated") ||
            errStr.includes("client is offline") ||
            errStr.includes("unavailable") ||
            errStr.includes("Firestore shutting down")
          ) {
            console.warn("Notice: Cloud restore offline or shutting down:", errStr);
          } else {
            console.error("Cloud restore error:", error);
            checkIsQuotaExceededError(error);
          }
          setIsCloudLoadedSuccessfully(false);
        } finally {
          setIsCloudLoading(false);
        }
      } else {
        setIsCloudLoadedSuccessfully(true);
      }

      // Restore auto-saved draft if available
      const autoSaveDraftStr = localStorage.getItem(getStorageKey("autosave_invoice_draft", userId));
      if (autoSaveDraftStr) {
        try {
          const draft = JSON.parse(autoSaveDraftStr);
          if (draft && draft.data) {
            const data = draft.data;
            if (data.type) setDocType(data.type);
            if (data.id) setDocId(data.id);
            if (data.date) setDate(data.date);
            if (data.customer) setCustomer(data.customer);
            if (data.items && data.items.length > 0) setItems(data.items);
            if (data.notes !== undefined) setNotes(data.notes);
            if (data.terms !== undefined) setTerms(data.terms);
            if (data.showNotesInPdf !== undefined) setShowNotes(data.showNotesInPdf);
            if (data.showTermsInPdf !== undefined) setShowTerms(data.showTermsInPdf);
            if (data.transport) setTransport(data.transport);
            if (data.poNumber) setPoNumber(data.poNumber);
            if (data.preCarriageBy) setPreCarriageBy(data.preCarriageBy);
            if (data.placeOfReceipt) setPlaceOfReceipt(data.placeOfReceipt);
            if (data.vesselFlightNo) setVesselFlightNo(data.vesselFlightNo);
            if (data.portOfLoading) setPortOfLoading(data.portOfLoading);
            if (data.portOfDischarge) setPortOfDischarge(data.portOfDischarge);
            if (data.finalDestination) setFinalDestination(data.finalDestination);
            if (data.buyerDetails) setBuyerDetails(data.buyerDetails);
            if (data.consigneeName) setConsigneeName(data.consigneeName);
            if (data.consigneeAddress) setConsigneeAddress(data.consigneeAddress);
            if (data.consigneeGstin) setConsigneeGstin(data.consigneeGstin);
            if (data.buyerOrderDate) setBuyerOrderDate(data.buyerOrderDate);
            if (data.despatchDocNo) setDespatchDocNo(data.despatchDocNo);
            if (data.countryOfOrigin) setCountryOfOrigin(data.countryOfOrigin);
            if (data.countryOfDestination) setCountryOfDestination(data.countryOfDestination);
            if (data.paymentTerms) setPaymentTerms(data.paymentTerms);
            if (data.paymentMode) setPaymentMode(data.paymentMode);
            if (data.numberOfPackages) setNumberOfPackages(data.numberOfPackages);
            if (data.currency) setCurrency(data.currency);
            if (data.exchangeRate) setExchangeRate(data.exchangeRate);
            if (data.isExport !== undefined) setIsExport(data.isExport);
            if (data.isTaxEnabled !== undefined) setIsTaxEnabled(data.isTaxEnabled);
            if (data.isIgst !== undefined) setIsIgst(data.isIgst);
            if (data.discountRate !== undefined) setDiscountRate(data.discountRate);
            if (data.targetMarginPercent !== undefined) setTargetMarginPercent(data.targetMarginPercent);
            if (data.advancePercentage !== undefined) setAdvancePercentage(data.advancePercentage);
            if (data.freightOption) setFreightOption(data.freightOption);
            if (data.freightAmount !== undefined) setFreightAmount(data.freightAmount);
            if (data.freightTaxTiming) setFreightTaxTiming(data.freightTaxTiming);
            if (data.freightTaxRate !== undefined) setFreightTaxRate(data.freightTaxRate);
            if (data.packagingOption) setPackagingOption(data.packagingOption);
            if (data.packagingAmount !== undefined) setPackagingAmount(data.packagingAmount);
            if (data.packagingTaxTiming) setPackagingTaxTiming(data.packagingTaxTiming);
            if (data.packagingTaxRate !== undefined) setPackagingTaxRate(data.packagingTaxRate);
            if (data.scopeOfWork) setScopeOfWork(data.scopeOfWork);
            if (data.materialType) setMaterialType(data.materialType);
            if (data.riskMitigation) setRiskMitigation(data.riskMitigation);
            if (data.inspectionSummary) setInspectionSummary(data.inspectionSummary);
            if (data.heatId) setHeatId(data.heatId);
            if (data.hasRawMaterialTC !== undefined) setHasRawMaterialTC(data.hasRawMaterialTC);
            if (data.mtcType) setMtcType(data.mtcType);
            if (data.tpiEngagement) setTpiEngagement(data.tpiEngagement);
            if (data.samplingProtocol) setSamplingProtocol(data.samplingProtocol);
            if (data.samplingType) setSamplingType(data.samplingType);
            if (data.ncrStatus) setNcrStatus(data.ncrStatus);
            if (data.ncrItems) setNcrItems(data.ncrItems);
            if (data.evidenceControl) setEvidenceControl(data.evidenceControl);
            if (data.evidenceRepo) setEvidenceRepo(data.evidenceRepo);
            if (data.technicalNotes) setTechnicalNotes(data.technicalNotes);
            if (data.qualityDeclaration) setQualityDeclaration(data.qualityDeclaration);
            if (data.packagingDispatch) setPackagingDispatch(data.packagingDispatch);
            if (data.finalRemarksStatus) setFinalRemarksStatus(data.finalRemarksStatus);
            if (data.finalRemarksText) setFinalRemarksText(data.finalRemarksText);
            if (data.dimensionalReports) setDimensionalReports(data.dimensionalReports);
            if (data.mtcCertificateNo) setMtcCertificateNo(data.mtcCertificateNo);
            if (data.mtcSpecification) setMtcSpecification(data.mtcSpecification);
            if (data.mtcDimension) setMtcDimension(data.mtcDimension);
            if (data.mtcRemarks) setMtcRemarks(data.mtcRemarks);

            if (draft.timestamp) {
              const formattedTime = new Date(draft.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              setAutoSaveTime(formattedTime);
            }
          }
        } catch (e) {
          console.error("Failed to restore auto-save draft", e);
        }
      }

      // Restore active app step if saved (checking URL params & localStorage)
      const restoredRoute = getSavedRoute(userId);
      const hasEnteredApp = localStorage.getItem("billiq_has_entered_app") === "true";
      if ((user || hasEnteredApp) && restoredRoute !== "features" && restoredRoute !== "landing") {
        setShowLanding(false);
      }
      if (restoredRoute && ["dashboard", "invoice", "customers", "suppliers", "profile", "history", "privacy", "terms", "compliance"].includes(restoredRoute)) {
        setStep(restoredRoute as any);
      }

      // 3. Mark load as complete
      setIsFirstLoad(false);
    };

    loadData();
  }, [user, authLoading]);

  // Real-time Firestore sync for logged-in user profile & business details
  useEffect(() => {
    if (!user || !isConfigValid || !db) return;

    const targetUid = impersonatedUser ? impersonatedUser.id : user.uid;
    const userDocRef = doc(db, "users", targetUid);

    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (!docSnap.exists()) {
        // Document deleted by admin
        if (!impersonatedUser && user) {
          alert("Your account status has been updated by an administrator.");
          handleLogout();
        }
        return;
      }

      if (docSnap.exists()) {
        isIncomingCloudSyncRef.current = true;
        const cloudData = docSnap.data();

        // Check account status: Suspended or Deleted
        const st = (cloudData.accountStatus || cloudData.status || "").toLowerCase();
        const isSuspendedOrDeleted = st === "suspended" || st === "deleted" || cloudData.isDeleted === true;
        if (isSuspendedOrDeleted && !impersonatedUser && user) {
          alert("Your account has been suspended by an administrator.");
          handleLogout();
          return;
        }

        // Check session revocation
        if (cloudData.sessionRevokedAt && !impersonatedUser && user) {
          const sessionStart = Number(localStorage.getItem("billiq_session_start_time") || 0);
          const revokedTime = new Date(cloudData.sessionRevokedAt).getTime();
          if (!isNaN(revokedTime) && revokedTime > sessionStart) {
            alert("Your session has been signed out by an administrator.");
            handleLogout();
            return;
          }
        }

        const activeEmail = impersonatedUser?.email || user?.email || "";
        const activeNameFallback = impersonatedUser
          ? (impersonatedUser.displayName || impersonatedUser.username || impersonatedUser.email?.split('@')[0] || "User")
          : (user?.displayName || (user?.email ? user.email.split('@')[0] : "User"));

        const syncedPlanTier = cloudData.planTier || cloudData.planName || cloudData.plan || "free-trial";
        const syncedPlanName = cloudData.planName || cloudData.plan || cloudData.planTier || "Free Trial";
        const docQuotaVal = cloudData.docQuota !== undefined ? cloudData.docQuota : cloudData.documentsRemaining;
        const maxDocsVal = cloudData.maxDocs !== undefined ? cloudData.maxDocs : docQuotaVal;

        const targetUid = impersonatedUser ? impersonatedUser.id : user?.uid;
        const currentHistoryLen = Array.isArray(cloudData.history) ? cloudData.history.length : (Array.isArray(history) ? history.length : 0);
        const syncedLifetime = getEffectiveLifetimeDocCount(cloudData, targetUid, currentHistoryLen);
        const bonusGranted = cloudData.trialCreditsGranted || 0;
        const syncedRemaining = cloudData.documentsRemaining !== undefined 
          ? cloudData.documentsRemaining 
          : Math.max(0, 5 + bonusGranted - syncedLifetime);
        const isTrialExhausted = syncedRemaining <= 0 && syncedPlanTier !== "pro" && syncedPlanTier !== "enterprise";

        // Sync core user profile & permanent signup credentials
        setUserProfile({
          signupEmail: cloudData.signupEmail || cloudData.authEmail || cloudData.email || activeEmail,
          authEmail: cloudData.authEmail || cloudData.signupEmail || cloudData.email || activeEmail,
          username: cloudData.username || cloudData.authUsername || cloudData.displayName || activeNameFallback,
          authUsername: cloudData.authUsername || cloudData.username || cloudData.displayName || activeNameFallback,
          displayName: cloudData.displayName || (impersonatedUser ? impersonatedUser.displayName : user?.displayName) || "",
          accountStatus: cloudData.accountStatus || "Active",
          role: cloudData.role || (syncedPlanTier === "enterprise" ? "admin" : "staff"),
          provider: cloudData.provider || cloudData.authProvider || "email",
          plan: syncedPlanName,
          planTier: syncedPlanTier,
          planName: syncedPlanName,
          docQuota: docQuotaVal,
          maxDocs: maxDocsVal,
          documentsRemaining: syncedRemaining,
          trialCreditsGranted: bonusGranted,
          founderGrantNotice: cloudData.founderGrantNotice,
          documentsUsed: syncedLifetime,
          lifetimeCreatedCount: syncedLifetime,
          totalGeneratedDocsCount: syncedLifetime,
          trialUsed: cloudData.trialUsed !== undefined ? cloudData.trialUsed : true,
          trialExhausted: isTrialExhausted,
          isReRegisteredUser: isTrialExhausted && (cloudData.isReRegisteredUser || false),
          hasSeenWelcome: cloudData.hasSeenWelcome || false,
          overrides: cloudData.overrides,
          overrideAuditLogs: cloudData.overrideAuditLogs || cloudData.overrideLogs,
          forceSyncTimestamp: cloudData.forceSyncTimestamp,
          sessionRevokedAt: cloudData.sessionRevokedAt,
          resetCacheTimestamp: cloudData.resetCacheTimestamp,
          updatedAt: cloudData.updatedAt
        });

        // Compute merged business details
        let mergedBusiness = business;
        if (cloudData.business) {
          setBusiness(prev => {
            const bizCountry = prev.country || cloudData.business.country || countryOfOrigin || "India";
            const bizCurrency = prev.currency || cloudData.business.currency || "INR";
            const bizName = prev.name || cloudData.business.name || cloudData.business.companyName || "";
            mergedBusiness = {
              ...cloudData.business,
              ...prev,
              name: bizName,
              companyName: bizName,
              country: bizCountry,
              currency: bizCurrency,
              state: prev.state !== undefined && prev.state !== "" ? prev.state : (cloudData.business.state || ""),
              letterhead: prev.letterhead || cloudData.business.letterhead,
              logo: prev.logo || cloudData.business.logo,
              signature: prev.signature || cloudData.business.signature,
            };
            safeSave("business_details", mergedBusiness, targetUid);
            try {
              localStorage.setItem("business_details", JSON.stringify(mergedBusiness));
              if (targetUid) {
                localStorage.setItem(getStorageKey("business_details", targetUid), JSON.stringify(mergedBusiness));
              }
            } catch {}
            if (mergedBusiness.currency) {
              setCurrency(mergedBusiness.currency);
            }
            if (mergedBusiness.country) setCountryOfOrigin(mergedBusiness.country);
            return mergedBusiness;
          });
        }

        // Compute merged history documents
        let mergedHistory = historyRef.current && historyRef.current.length > 0 ? historyRef.current : history;
        if (Array.isArray(cloudData.history)) {
          setHistory((prevHistory) => {
            const map = new Map<string, DocumentHistoryItem>();
            
            // Add cloud history items
            cloudData.history.forEach((item: DocumentHistoryItem) => {
              if (item && item.id) {
                map.set(`${item.id}_${item.type || ''}`, item);
              }
            });

            // Preserve local history items from current state, ref, and localStorage if missing in cloud or if local has newer/fullData
            const localSources = [...(prevHistory || []), ...(historyRef.current || []), ...getLocalCachedDocuments(targetUid)];
            localSources.forEach((localItem) => {
              if (localItem && localItem.id) {
                const key = `${localItem.id}_${localItem.type || ''}`;
                const cloudItem = map.get(key);
                if (!cloudItem) {
                  map.set(key, localItem);
                } else {
                  if (localItem.fullData && !cloudItem.fullData) {
                    map.set(key, { ...cloudItem, fullData: localItem.fullData });
                  } else if ((localItem.timestamp || 0) > (cloudItem.timestamp || 0)) {
                    map.set(key, localItem);
                  }
                }
              }
            });

            mergedHistory = Array.from(map.values()).sort((a, b) => {
              const tA = typeof a.timestamp === "number" ? a.timestamp : (a.timestamp ? new Date(a.timestamp).getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0));
              const tB = typeof b.timestamp === "number" ? b.timestamp : (b.timestamp ? new Date(b.timestamp).getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0));
              return tB - tA;
            });
            historyRef.current = mergedHistory;
            seedReferenceHistoryFromDocumentHistory(mergedHistory);
            safeSave("document_history", mergedHistory, targetUid);
            return mergedHistory;
          });
        }

        // Sync Saved Customers
        let mergedCustomers = savedCustomers;
        if (Array.isArray(cloudData.savedCustomers)) {
          mergedCustomers = cloudData.savedCustomers;
          setSavedCustomers(mergedCustomers);
          safeSave("saved_customers", mergedCustomers, targetUid);
        }

        // Sync Saved Suppliers
        let mergedSuppliers = savedSuppliers;
        if (Array.isArray(cloudData.savedSuppliers)) {
          mergedSuppliers = cloudData.savedSuppliers;
          setSavedSuppliers(mergedSuppliers);
          safeSave("saved_suppliers", mergedSuppliers, targetUid);
        }

        // Sync PDF Layout Settings
        let mergedLayout = layoutSettings;
        if (cloudData.pdf_layout_settings) {
          mergedLayout = cloudData.pdf_layout_settings;
          setLayoutSettings(mergedLayout);
          safeSave("pdf_layout_settings", mergedLayout, targetUid);
        }

        // Sync Notes & Terms
        let mergedNotes = lastUsedNotesAndTerms;
        if (cloudData.last_used_notes_and_terms) {
          mergedNotes = sanitizeNotesAndTerms(cloudData.last_used_notes_and_terms);
          setLastUsedNotesAndTerms(mergedNotes);
          safeSave("last_used_notes_and_terms", mergedNotes, targetUid);
        }

        // Sync Price History
        let mergedPriceHistory = priceHistory;
        if (Array.isArray(cloudData.priceHistory)) {
          mergedPriceHistory = cloudData.priceHistory;
          setPriceHistory(mergedPriceHistory);
          safeSave("price_history", mergedPriceHistory, targetUid);
        }

        const sanitizedLastUsed: Record<string, number> = {};
        if (cloudData.lastUsedNumbers) {
          Object.entries(cloudData.lastUsedNumbers).forEach(([key, val]) => {
            sanitizedLastUsed[sanitizeKey(key)] = Number(val);
          });
          setLastUsedNumbers(sanitizedLastUsed);
        }

        // Real-time unblock check: if upgraded to Enterprise / Pro, credits added, or bypassDocLimit active, immediately dismiss limit modal
        const planDetails = getPlanDetails(syncedPlanTier || syncedPlanName);
        const hasBypass = cloudData.overrides?.bypassDocLimit === true;
        const isUnlimitedOrHasQuota = hasBypass || planDetails.isUnlimited || syncedPlanTier === "enterprise" || syncedPlanTier === "pro" || syncedRemaining > 0;

        if (isUnlimitedOrHasQuota) {
          setShowTrialLimitModal(false);
          setTrialModalCustomMessage(undefined);
        } else if (
          isTrialExhausted ||
          (cloudData.isReRegisteredUser && syncedRemaining <= 0)
        ) {
          setShowWelcomeModal(false);
          setShowTrialLimitModal(true);
        } else if (
          cloudData.hasSeenWelcome === false ||
          (cloudData.hasSeenWelcome === undefined && !localStorage.getItem(getStorageKey("hasSeenWelcomeModal", targetUid)))
        ) {
          setShowWelcomeModal(true);
        } else if (cloudData.hasSeenWelcome === true) {
          setShowWelcomeModal(false);
        }

        // Update lastSyncedDataHashRef using the exact state object structure so auto-sync detects no mismatch
        const cloudDataObj = {
          business: mergedBusiness,
          savedCustomers: mergedCustomers,
          savedSuppliers: mergedSuppliers,
          history: mergedHistory,
          lastUsedNumbers: sanitizedLastUsed,
          priceHistory: mergedPriceHistory,
          pdf_layout_settings: mergedLayout,
          last_used_notes_and_terms: mergedNotes
        };
        lastSyncedDataHashRef.current = computeDataHash(cloudDataObj);

        // Reset incoming sync flag after 15 seconds
        if (incomingSyncTimerRef.current) clearTimeout(incomingSyncTimerRef.current);
        incomingSyncTimerRef.current = setTimeout(() => {
          isIncomingCloudSyncRef.current = false;
        }, 15000);
      }
    }, (error) => {
      console.warn("Real-time profile snapshot listener notice:", error);
    });

    return () => unsubscribe();
  }, [user, impersonatedUser, isConfigValid, computeDataHash]);

  // Real-time listener for user documents in Firestore subcollection users/{userId}/documents
  useEffect(() => {
    const targetUid = impersonatedUser ? impersonatedUser.id : user?.uid;
    if (!targetUid || !isConfigValid) return;

    const unsubscribeDocs = subscribeToUserDocuments(targetUid, (cloudDocs) => {
      if (Array.isArray(cloudDocs) && cloudDocs.length > 0) {
        setHistory((prev) => {
          const docMap = new Map<string, DocumentHistoryItem>();
          // Add cloud documents
          cloudDocs.forEach(d => {
            if (d && d.id) docMap.set(`${d.id}_${d.type || ''}`, d);
          });
          // Preserve local documents not yet in cloud or preserving newer / fullData
          const localSources = [...(prev || []), ...(historyRef.current || []), ...getLocalCachedDocuments(targetUid)];
          localSources.forEach(d => {
            if (d && d.id) {
              const key = `${d.id}_${d.type || ''}`;
              const existing = docMap.get(key);
              if (!existing) {
                docMap.set(key, d);
              } else if (d.fullData && !existing.fullData) {
                docMap.set(key, { ...existing, fullData: d.fullData });
              } else if ((d.timestamp || 0) > (existing.timestamp || 0)) {
                docMap.set(key, d);
              }
            }
          });
          const merged = Array.from(docMap.values()).sort((a, b) => {
            const tA = typeof a.timestamp === "number" ? a.timestamp : (a.timestamp ? new Date(a.timestamp).getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0));
            const tB = typeof b.timestamp === "number" ? b.timestamp : (b.timestamp ? new Date(b.timestamp).getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0));
            return tB - tA;
          });
          historyRef.current = merged;
          safeSave("document_history", merged, targetUid);
          seedReferenceHistoryFromDocumentHistory(merged);
          return merged;
        });
      }
    });

    return () => unsubscribeDocs();
  }, [user, impersonatedUser, isConfigValid]);

  const handleAdminUpdatedUser = useCallback((updatedUserData: any) => {
    if (!updatedUserData) return;

    const activeEmail = (impersonatedUser?.email || user?.email || userProfile?.signupEmail || userProfile?.authEmail || "").toLowerCase().trim();
    const updatedEmail = (updatedUserData.email || updatedUserData.signupEmail || updatedUserData.authEmail || "").toLowerCase().trim();

    const activeUid = impersonatedUser ? impersonatedUser.id : user?.uid;
    const isTargetUser = (activeUid && updatedUserData.id === activeUid) || (activeEmail && updatedEmail === activeEmail);

    if (isTargetUser) {
      const rawTier = updatedUserData.planTier || updatedUserData.planName || updatedUserData.plan || "free-trial";
      const rawName = updatedUserData.planName || updatedUserData.plan || updatedUserData.planTier || "Free Trial";

      const planInfo = getPlanDetails(rawTier || rawName);
      const docQuotaVal = updatedUserData.docQuota !== undefined ? updatedUserData.docQuota : updatedUserData.documentsRemaining;
      const maxDocsVal = updatedUserData.maxDocs !== undefined ? updatedUserData.maxDocs : docQuotaVal;

      setUserProfile((prev: any) => ({
        ...prev,
        ...updatedUserData,
        plan: planInfo.badgeText,
        planTier: planInfo.tier,
        planName: planInfo.badgeText,
        docQuota: docQuotaVal,
        maxDocs: maxDocsVal,
        documentsRemaining: updatedUserData.documentsRemaining !== undefined ? updatedUserData.documentsRemaining : (planInfo.isUnlimited ? 999999 : prev?.documentsRemaining),
        trialCreditsGranted: updatedUserData.trialCreditsGranted !== undefined ? updatedUserData.trialCreditsGranted : prev?.trialCreditsGranted,
        founderGrantNotice: updatedUserData.founderGrantNotice || prev?.founderGrantNotice,
        trialExhausted: updatedUserData.documentsRemaining !== undefined ? (updatedUserData.documentsRemaining <= 0) : prev?.trialExhausted,
        accountStatus: updatedUserData.accountStatus || prev?.accountStatus || "Active",
        updatedAt: updatedUserData.updatedAt || new Date().toISOString(),
      }));

      if (planInfo.isUnlimited || planInfo.tier === "enterprise" || planInfo.tier === "pro" || (updatedUserData.documentsRemaining !== undefined && updatedUserData.documentsRemaining > 0)) {
        setShowTrialLimitModal(false);
        setTrialModalCustomMessage(undefined);
      }
    }
  }, [impersonatedUser, user, userProfile]);

  const handleLogout = async () => {
    try {
      purgeUnpartitionedCache(null);
      await logoutUser();
      loadedUserIdRef.current = Symbol("logged_out");
      resetAllState();
      setUser(null);
      setUserProfile(null);
      setImpersonatedUser(null);
      setShowAuthScreen(false);
      setShowLanding(true);
      setStep("dashboard");
    } catch (error) {
      console.warn("Logout notice:", error);
    }
  };

  // Generate or get Sync ID
  const syncId = useMemo(() => {
    if (impersonatedUser) return impersonatedUser.id;
    if (user) return user.uid;
    let id = localStorage.getItem(getStorageKey("sync_id", null));
    if (!id) {
      id = "user_" + Math.random().toString(36).substring(2, 15);
      localStorage.setItem(getStorageKey("sync_id", null), id);
    }
    return id;
  }, [user, impersonatedUser]);

  const syncToCloudData = async (overrideHistory?: DocumentHistoryItem[]) => {
    if (!syncId || isSyncInProgressRef.current || isIncomingCloudSyncRef.current) return;
    if (Date.now() < syncCooldownUntilRef.current) return;

    // Sanitize lastUsedNumbers keys before syncing
    const sanitizedLastUsed: Record<string, number> = {};
    Object.entries(lastUsedNumbers).forEach(([key, val]) => {
      sanitizedLastUsed[sanitizeKey(key)] = val;
    });

    let syncHistory = overrideHistory ? [...overrideHistory] : (historyRef.current && historyRef.current.length > 0 ? [...historyRef.current] : [...history]);
    if (syncHistory.length === 0 && syncId) {
      const cachedHist = localStorage.getItem(getStorageKey("document_history", syncId));
      if (cachedHist) {
        try {
          const parsed = JSON.parse(cachedHist);
          if (Array.isArray(parsed) && parsed.length > 0) {
            syncHistory = parsed;
            setHistory(parsed);
          }
        } catch {}
      }
      if (syncHistory.length === 0) {
        const fallbackDocs = getLocalCachedDocuments(syncId);
        if (fallbackDocs.length > 0) {
          syncHistory = fallbackDocs;
          setHistory(fallbackDocs);
        }
      }
    }
    let syncBusiness = { ...business };

    const dataObj = {
      business: syncBusiness,
      savedCustomers,
      savedSuppliers,
      history: syncHistory,
      lastUsedNumbers: sanitizedLastUsed,
      priceHistory,
      pdf_layout_settings: layoutSettings,
      last_used_notes_and_terms: lastUsedNotesAndTerms,
    };

    const currentHash = computeDataHash(dataObj);
    if (currentHash === lastSyncedDataHashRef.current) {
      // Current state matches cloud state; no write needed
      return;
    }

    // Set hash immediately to avoid re-triggering while write is in flight
    lastSyncedDataHashRef.current = currentHash;
    isSyncInProgressRef.current = true;
    setSyncStatus("syncing");
    try {
      const activeAccountEmail = impersonatedUser?.email || user?.email || userProfile?.signupEmail || userProfile?.authEmail;
      const activeAccountUsername = impersonatedUser?.username || userProfile?.username || userProfile?.authUsername || user?.displayName || (activeAccountEmail ? activeAccountEmail.split('@')[0] : "");
      const activeDisplayName = impersonatedUser?.displayName || userProfile?.displayName || user?.displayName || activeAccountUsername;

      let data: any = {
        ...dataObj,
        updatedAt: new Date().toISOString()
      };

      if (activeAccountEmail) {
        data.email = activeAccountEmail;
        data.signupEmail = activeAccountEmail;
        data.authEmail = activeAccountEmail;
      }
      if (activeAccountUsername) {
        data.username = activeAccountUsername;
        data.authUsername = activeAccountUsername;
      }
      if (activeDisplayName) {
        data.displayName = activeDisplayName;
      }

      const currentLifetime = getEffectiveLifetimeDocCount(userProfile, syncId, (history || []).length);
      data.lifetimeCreatedCount = currentLifetime;
      data.totalGeneratedDocsCount = currentLifetime;
      data.documentsUsed = currentLifetime;
      if (userProfile?.documentsRemaining !== undefined) {
        data.documentsRemaining = userProfile.documentsRemaining;
      }

      // Target size in characters (approx bytes). Limit is 1,048,576. We target safe ~850,000.
      let currentSize = JSON.stringify(data).length;
      const MAX_SAFE_SIZE = 850000;

      if (currentSize > MAX_SAFE_SIZE) {
        console.warn(`Initial sync payload size (${currentSize} bytes) exceeds safety limit. Optimizing sizes...`);
        
        // Step 1: Sort history by timestamp descending so we keep the newest invoices first
        syncHistory.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

        // Step 2: Strip fullData from oldest history items instead of deleting the history items completely
        for (let i = syncHistory.length - 1; i >= 5; i--) {
          if (currentSize <= MAX_SAFE_SIZE) break;
          if (syncHistory[i] && syncHistory[i].fullData) {
            const { fullData, ...rest } = syncHistory[i];
            syncHistory[i] = rest;
            data.history = syncHistory;
            currentSize = JSON.stringify(data).length;
          }
        }

        // Step 3: If STILL too large, pop oldest history items as a last resort
        while (syncHistory.length > 5 && currentSize > MAX_SAFE_SIZE) {
          syncHistory.pop();
          data.history = syncHistory;
          currentSize = JSON.stringify(data).length;
        }

        // Step 4: If STILL too large, strip the company letterhead base64
        if (currentSize > MAX_SAFE_SIZE && syncBusiness.letterhead) {
          console.warn("Optimizing: Stripping company letterhead base64 to save cloud storage space.");
          syncBusiness.letterhead = undefined;
          data.business = syncBusiness;
          currentSize = JSON.stringify(data).length;
        }

        // Step 5: If STILL too large, strip business logo
        if (currentSize > MAX_SAFE_SIZE && syncBusiness.logo) {
          console.warn("Optimizing: Stripping company logo base64 to save cloud storage space.");
          syncBusiness.logo = undefined;
          data.business = syncBusiness;
          currentSize = JSON.stringify(data).length;
        }

        // Step 6: If STILL too large, strip business signature
        if (currentSize > MAX_SAFE_SIZE && syncBusiness.signature) {
          console.warn("Optimizing: Stripping business signature base64 to save cloud storage space.");
          syncBusiness.signature = undefined;
          data.business = syncBusiness;
          currentSize = JSON.stringify(data).length;
        }
      }
      
      // Save to user's private path
      const saveSuccess = await saveToCloud(`users/${syncId}`, data);
      if (saveSuccess) {
        lastSyncedDataHashRef.current = currentHash;
        syncCooldownUntilRef.current = 0;
        setSyncStatus("success");
        setLastAutoSyncTime(new Date());
      } else {
        syncCooldownUntilRef.current = Date.now() + 120000;
        lastSyncedDataHashRef.current = currentHash;
        setSyncStatus("idle");
      }
    } catch (error) {
      console.error("Sync Error:", error);
      syncCooldownUntilRef.current = Date.now() + 120000;
      lastSyncedDataHashRef.current = currentHash;
      setSyncStatus("error");
      checkIsQuotaExceededError(error);
      logErrorEvent(syncId, impersonatedUser?.email || user?.email, "Cloud Workspace", "Firestore Cloud Sync Error", error, "sync");
    } finally {
      isSyncInProgressRef.current = false;
      setTimeout(() => setSyncStatus("idle"), 3000);
    }
  };

  const restoreFromCloud = async () => {
    if (!syncId) return;
    
    showModal({
      title: "Restore from Cloud",
      message: "This will overwrite your local data with cloud data. Continue?",
      type: "confirm",
      onConfirm: async () => {
        closeModal();
        setSyncStatus("syncing");
        try {
          const data = await loadFromCloud(`users/${syncId}`);
          if (data) {
            let mergedBusiness = data.business;
            if (data.business) {
              setBusiness(prev => {
                mergedBusiness = {
                  ...data.business,
                  letterhead: prev.letterhead || data.business.letterhead,
                  logo: prev.logo || data.business.logo,
                  signature: prev.signature || data.business.signature,
                };
                return mergedBusiness;
              });
            }
            if (data.savedCustomers) setSavedCustomers(data.savedCustomers);
            if (data.savedSuppliers) setSavedSuppliers(data.savedSuppliers);
            if (data.history) setHistory(data.history);
            if (data.lastUsedNumbers) setLastUsedNumbers(data.lastUsedNumbers);
            if (data.priceHistory) setPriceHistory(data.priceHistory);
            if (data.pdf_layout_settings) setLayoutSettings(data.pdf_layout_settings);
            if (data.last_used_notes_and_terms) {
              const sanitizedNotes = sanitizeNotesAndTerms(data.last_used_notes_and_terms);
              setLastUsedNotesAndTerms(sanitizedNotes);
              safeSave("last_used_notes_and_terms", sanitizedNotes, user?.uid);
            }
            
            // Update localStorage too
            if (mergedBusiness) safeSave("business_details", mergedBusiness, user?.uid);
            safeSave("saved_customers", data.savedCustomers, user?.uid);
            safeSave("saved_suppliers", data.savedSuppliers, user?.uid);
            safeSave("document_history", data.history, user?.uid);
            safeSave("last_used_numbers", data.lastUsedNumbers, user?.uid);
            safeSave("price_history", data.priceHistory, user?.uid);
            safeSave("pdf_layout_settings", data.pdf_layout_settings, user?.uid);
            
            setIsCloudLoadedSuccessfully(true);
            setSyncStatus("success");
            showModal({
              title: "Success",
              message: "Data restored successfully!",
              type: "success"
            });
          } else {
            showModal({
              title: "No Data",
              message: "No data found in cloud for this ID.",
              type: "info"
            });
          }
          setTimeout(() => setSyncStatus("idle"), 3000);
        } catch (error) {
          console.error("Restore Error:", error);
          setSyncStatus("error");
          const isQuota = checkIsQuotaExceededError(error);
          const activeEmail = impersonatedUser?.email || user?.email;
          const isDev = isDeveloperAccount(activeEmail);
          
          showModal({
            title: isQuota ? (isDev ? "Database Quota Exceeded" : "Connection Notice") : "Sync Notice",
            message: isQuota
              ? (isDev
                  ? "The cloud database's free daily write/read units quota has been exceeded. The application will continue to run in Offline Mode using your browser's local storage safely."
                  : "Unable to sync with cloud. Your document has been saved safely to your device.")
              : getDisplayErrorMessage(error, activeEmail, "Connection issue. Changes saved locally and will sync once reconnected."),
            type: "warning"
          });
        }
      }
    });
  };

  // Auto-sync logic (5-second inactivity debounce)
  useEffect(() => {
    if (isFirstLoad || isCloudLoading || !isCloudLoadedSuccessfully || !user || !isConfigValid) return;

    const timeoutId = setTimeout(() => {
      syncToCloudData();
    }, 5000); // Sync after 5 seconds of inactivity

    return () => clearTimeout(timeoutId);
  }, [business, savedCustomers, savedSuppliers, history, lastUsedNumbers, priceHistory, layoutSettings, lastUsedNotesAndTerms, user, isConfigValid, isFirstLoad, isCloudLoading, isCloudLoadedSuccessfully]);

  // Recurring 30-minute interval auto-sync for cloud storage
  useEffect(() => {
    if (isFirstLoad || isCloudLoading || !isCloudLoadedSuccessfully || !user || !isConfigValid) return;

    // Recurring interval every 30 minutes (30 * 60 * 1000 ms = 1,800,000 ms)
    const AUTO_SYNC_INTERVAL_MS = 30 * 60 * 1000;
    const intervalId = setInterval(() => {
      console.log("Executing 30-minute recurring cloud auto-sync...");
      syncToCloudData();
    }, AUTO_SYNC_INTERVAL_MS);

    // Immediate sync on window beforeunload to guard against unexpected tab close
    const handleBeforeUnload = () => {
      syncToCloudData();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [user, isConfigValid, isFirstLoad, isCloudLoading, isCloudLoadedSuccessfully]);

  // Auto-restore logic on login is now integrated into the main user-change effect

  const resetSyncKeys = () => {
    showModal({
      title: "Reset Sync Keys",
      message: "This will reset your invoice numbering counters to fix sync errors. Your invoices will NOT be deleted. Continue?",
      type: "confirm",
      onConfirm: () => {
        setLastUsedNumbers({});
        localStorage.removeItem(getStorageKey("last_used_numbers", user?.uid));
        showModal({
          title: "Success",
          message: "Sync keys reset successfully. Please try syncing again.",
          type: "success"
        });
      }
    });
  };

  // Set isFirstLoad to false on mount is now handled by the user-change effect
  const getShortForm = (name: string) => {
    if (!name) return "DOC";
    const words = name.trim().split(/\s+/);
    if (words.length === 1) {
      return words[0].substring(0, 2).toUpperCase();
    }
    return words.map(w => w[0]).join('').toUpperCase();
  };

  // Helper for next number
  const getNextNumber = (type: DocumentType, bizName: string) => {
    const prefix = getShortForm(bizName);
    const typeCode = type === DocumentType.TAX_INVOICE ? "INV" : 
                    type === DocumentType.QUOTATION ? "QT" : 
                    type === DocumentType.PURCHASE_ORDER ? "PO" : 
                    type === DocumentType.COST_SHEET ? "CS" : "DC";
    
    const fullPrefix = `${prefix}/${typeCode}/`;
    const safeKey = sanitizeKey(fullPrefix);
    
    // Get max from history
    const historyNumbers = history
      .filter(h => h.id.startsWith(fullPrefix))
      .map(h => {
        const parts = h.id.split('/');
        const lastPart = parts[parts.length - 1];
        return parseInt(lastPart) || 0;
      });
    
    const maxInHistory = historyNumbers.length > 0 ? Math.max(...historyNumbers) : 0;
    
    // Get max from lastUsedNumbers
    const maxUsed = lastUsedNumbers[safeKey] || 0;
    
    const nextNum = Math.max(maxInHistory, maxUsed) + 1;
    return nextNum.toString().padStart(3, '0');
  };

  // Auto-generate Doc ID
  useEffect(() => {
    if (!business.name || step !== "invoice") return;

    const prefix = getShortForm(business.name);
    const typeCode = docType === DocumentType.TAX_INVOICE ? "INV" : 
                    docType === DocumentType.QUOTATION ? "QT" : 
                    docType === DocumentType.PURCHASE_ORDER ? "PO" : 
                    docType === DocumentType.COST_SHEET ? "CS" : "DC";
    const currentPrefix = `${prefix}/${typeCode}/`;

    // Only auto-generate if docId is empty OR if it's an auto-generated one for a different type/prefix
    const isAutoGenerated = (id: string) => {
      const parts = id.split('/');
      return parts.length === 3 && ["INV", "QT", "PO", "DC"].includes(parts[1]);
    };

    if (!docId || isAutoGenerated(docId)) {
      if (!docId.startsWith(currentPrefix)) {
        const nextNum = getNextNumber(docType, business.name);
        setDocId(`${currentPrefix}${nextNum}`);
      }
    }
  }, [business.name, docType, step, history, docId]);

  // Exchange Rate Logic
  useEffect(() => {
    if (isExport) {
      fetchExchangeRate();
    }
  }, [isExport, currency, business.currency]);

  const fetchExchangeRate = async () => {
    try {
      const homeCurr = business.currency || countryOfOrigin || "INR";
      if (currency === homeCurr) {
        setExchangeRate(1);
        return 1;
      }
      const res = await fetch(`https://api.exchangerate-api.com/v4/latest/${currency}`);
      const data = await res.json();
      if (data.rates && data.rates[homeCurr]) {
        const rate = data.rates[homeCurr];
        setExchangeRate(rate);
        return rate;
      }
    } catch (err) {
      console.error("Failed to fetch exchange rate", err);
    }
    return exchangeRate;
  };

  const convertRatesToInvoiceCurrency = (rateToUse?: number) => {
    const rate = rateToUse || exchangeRate;
    if (rate <= 0) return;
    setItems(prev => prev.map(item => ({
      ...item,
      rate: Math.round((item.rate / rate) * 100) / 100
    })));
  };

  const convertRatesToHomeCurrency = (rateToUse?: number) => {
    const rate = rateToUse || exchangeRate;
    if (rate <= 0) return;
    setItems(prev => prev.map(item => ({
      ...item,
      rate: Math.round((item.rate * rate) * 100) / 100
    })));
  };



  const handleNewDocument = () => {
    const rawTier = userProfile?.planTier || userProfile?.planName || userProfile?.plan;
    const planInfo = getPlanDetails(rawTier);
    const isProOrEnterprise = planInfo.isUnlimited || planInfo.tier === "pro" || planInfo.tier === "enterprise" || (typeof rawTier === "string" && (rawTier.toLowerCase().includes("pro") || rawTier.toLowerCase().includes("enterprise")));

    if (!hasSubmittedFeedback && (history || []).length >= 1) {
      setShowFeedbackModal(true);
      showShortcutToast("📝 Please complete the mandatory survey to unlock creation of Document #2!");
      return;
    }

    if (!isProOrEnterprise) {
      const docCount = (history || []).length;
      const effectiveLimit = userProfile?.documentsRemaining !== undefined
        ? Math.max(planInfo.documentLimit, userProfile.documentsRemaining)
        : planInfo.documentLimit;

      if (docCount >= effectiveLimit) {
        setShowTrialLimitModal(true);
        showShortcutToast(`⚠️ ${planInfo.badgeText} Limit Reached (${docCount}/${effectiveLimit} Documents Created).`);
        return;
      }
    }

    setLoadedTimestamp(null);
    setAutoSaveTime(null);
    try {
      localStorage.removeItem(getStorageKey("autosave_invoice_draft", user?.uid));
    } catch (e) {
      console.error(e);
    }
    setIsExport(false);
    setIsTaxEnabled(true);
    setCurrency(business.currency || "INR");
    setExchangeRate(1);
    setItems([{ id: "1", description: "", hsn: "", quantity: 1, unit: "NOS", rate: 0, taxRate: 18 }]);
    setCustomer({
      name: "",
      gstin: "",
      address: "",
      phone: "",
      email: "",
      contactPerson: "",
    });
    setDocId("");
    setDiscountRate(0);
    setTargetMarginPercent(0);
    setTransport("");
    setPoNumber("");
    setPaymentTerms("");
    setNumberOfPackages("");
    setAdvancePercentage(0);
    setIncotermRule("");
    setIncotermNamedPlace("");
    setIncotermPortOfLoading("");
    setIncotermCountryOfOrigin("");
    setIncotermCountryOfDestination("");
    setIncotermFreightTerms("");
    setIncotermInsuranceDetails("");
    
    // Apply remembered notes and terms
    const category = docType === DocumentType.PURCHASE_ORDER ? "supplier" : "customer";
    const subCategory = isExport ? "export" : "standard";
    const safeNotesTerms = sanitizeNotesAndTerms(lastUsedNotesAndTerms);
    const remembered = safeNotesTerms[category][subCategory];
    setNotes(remembered.notes);
    setTerms(remembered.terms);
    setIsNotesManuallyEdited(false);
    setIsTermsManuallyEdited(false);
    setAiLineCommand("");
    setAiLineFeedback("");
    setAiLineError("");
    
    setDocType(DocumentType.TAX_INVOICE);
    setStep("invoice");
    window.scrollTo(0, 0);
  };

  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsSavedToast, setSettingsSavedToast] = useState(false);

  const handleSaveSettings = async () => {
    if (!business.name || !business.name.trim()) {
      setBusinessErrors({ name: "Business Name is required" });
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setBusinessErrors({});
    setIsSavingSettings(true);

    try {
      isIncomingCloudSyncRef.current = false;
      syncCooldownUntilRef.current = 0;

      const effectiveCurrency = business.currency || currency || "INR";
      const effectiveCountry = business.country || countryOfOrigin || "India";
      const finalBiz: BusinessDetails = {
        ...business,
        currency: effectiveCurrency,
        country: effectiveCountry,
      };
      setBusiness(finalBiz);
      setCurrency(effectiveCurrency);
      setCountryOfOrigin(effectiveCountry);

      const targetUid = impersonatedUser ? impersonatedUser.id : user?.uid;

      // Explicitly save business details and PDF customizer settings on user trigger
      safeSave("business_details", finalBiz, targetUid);
      safeSave("pdf_layout_settings", layoutSettings, targetUid);
      try {
        localStorage.setItem("business_details", JSON.stringify(finalBiz));
        if (targetUid) {
          localStorage.setItem(getStorageKey("business_details", targetUid), JSON.stringify(finalBiz));
        }
      } catch {}

      if (targetUid && isConfigValid && db) {
        try {
          await saveToCloud(`users/${targetUid}`, {
            business: finalBiz,
            pdf_layout_settings: layoutSettings,
            updatedAt: new Date().toISOString()
          }, true);
        } catch (cloudErr) {
          console.warn("Notice saving business to cloud:", cloudErr);
        }
        await syncToCloudData();
      }

      setSettingsSavedToast(true);
      setTimeout(() => setSettingsSavedToast(false), 4000);
    } catch (err) {
      console.error("Error saving settings:", err);
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Persistence (Business details are saved ONLY when user clicks 'Save Settings')
  useEffect(() => {
    if (!isFirstLoad) {
      safeSave("saved_customers", savedCustomers, user?.uid);
    }
  }, [savedCustomers, isFirstLoad]);

  useEffect(() => {
    if (!isFirstLoad) {
      safeSave("saved_suppliers", savedSuppliers, user?.uid);
    }
  }, [savedSuppliers, isFirstLoad]);

  useEffect(() => {
    if (!isFirstLoad) {
      safeSave("document_history", history, user?.uid);
    }
  }, [history, isFirstLoad]);

  useEffect(() => {
    if (!isFirstLoad) {
      safeSave("last_used_numbers", lastUsedNumbers, user?.uid);
    }
  }, [lastUsedNumbers, isFirstLoad]);

  useEffect(() => {
    if (!isFirstLoad) {
      safeSave("price_history", priceHistory, user?.uid);
    }
  }, [priceHistory, isFirstLoad]);

  useEffect(() => {
    if (!isFirstLoad) {
      safeSave("last_export_timestamp", lastExportTimestamp, user?.uid);
    }
  }, [lastExportTimestamp, isFirstLoad]);

  // Persist active view route whenever it changes and sync with URL
  useEffect(() => {
    if (authLoading || isFirstLoad) return;

    let currentRoute = "dashboard";
    if (showAuthScreen && !user) {
      currentRoute = "auth";
    } else if (showFeatures) {
      currentRoute = "features";
    } else if (showLanding && !user) {
      currentRoute = "landing";
    } else if (isAdminUser(user, userProfile) && isAdminConsoleActive && !impersonatedUser) {
      currentRoute = "admin";
    } else if (step === "invoice") {
      currentRoute = "workspace";
    } else {
      currentRoute = step;
    }

    try {
      localStorage.setItem("active_app_route", currentRoute);
      localStorage.setItem("active_app_step", step);
      localStorage.setItem("billiq_active_view", currentRoute);

      if (user?.uid) {
        localStorage.setItem(getStorageKey("active_app_route", user.uid), currentRoute);
        localStorage.setItem(getStorageKey("active_app_step", user.uid), step);
        localStorage.setItem(getStorageKey("billiq_active_view", user.uid), currentRoute);
      }

      if (typeof window !== "undefined" && window.location) {
        const url = new URL(window.location.href);
        if (url.searchParams.get("view") !== currentRoute) {
          url.searchParams.set("view", currentRoute);
          window.history.replaceState({}, "", url.toString());
        }
      }
    } catch (e) {
      console.error("Error persisting view route:", e);
    }
  }, [step, showLanding, showFeatures, showAuthScreen, isAdminConsoleActive, user, authLoading, isFirstLoad, impersonatedUser]);

  // Calculations
  const handleBusinessChange = async (updates: Partial<BusinessDetails>) => {
    isIncomingCloudSyncRef.current = false;
    syncCooldownUntilRef.current = 0;

    const targetUid = impersonatedUser ? impersonatedUser.id : user?.uid;

    if (updates.country) {
      setCountryOfOrigin(updates.country);
      saveReferenceValue("countryOfOrigin", updates.country);
      if (!updates.currency) {
        const countryCfg = getCountryConfig(updates.country);
        if (countryCfg && countryCfg.currencyCode) {
          updates.currency = countryCfg.currencyCode;
        }
      }
    }

    if (updates.currency) {
      setCurrency(updates.currency);
    }

    setBusiness(prev => {
      const updated = { ...prev, ...updates };
      safeSave("business_details", updated, targetUid);
      try {
        localStorage.setItem("business_details", JSON.stringify(updated));
        if (targetUid) {
          localStorage.setItem(getStorageKey("business_details", targetUid), JSON.stringify(updated));
        }
      } catch {}
      return updated;
    });
    
    if (updates.letterhead) {
      try {
        const analysis = await analyzeLetterhead(updates.letterhead);
        setLayoutSettings(prev => ({
          ...prev,
          headerHeight: analysis?.headerHeight || prev?.headerHeight || 65,
          footerHeight: analysis?.footerHeight || prev?.footerHeight || 35
        }));
      } catch (e) {
        setLayoutSettings(prev => ({
          ...prev,
          headerHeight: prev?.headerHeight || 65,
          footerHeight: prev?.footerHeight || 35
        }));
      }
    }
  };

  const totals = useMemo(() => {
    const isQuotation = docType === DocumentType.QUOTATION;
    const isCostSheet = docType === DocumentType.COST_SHEET;

    const actualFreight = freightOption === "extra" ? (freightAmount || 0) : 0;
    const actualPackaging = packagingOption === "extra" ? (packagingAmount || 0) : 0;

    if (isCostSheet) {
      let totalDirectMaterialLaborCost = 0;
      let totalOverheadsCost = 0;
      let totalQty = 0;

      items.forEach(item => {
        if (item.isRegret) return;
        const qty = item.quantity || 1;
        const rate = item.rate || 0;
        const descLower = (item.description || "").toLowerCase();

        const raw = item.rawMaterialCost !== undefined ? item.rawMaterialCost : (descLower.includes("product") ? rate : 0);
        const lab = item.laborCost !== undefined ? item.laborCost : (descLower.includes("labour") || descLower.includes("labor") ? rate : 0);
        const ovh = item.overheadCost !== undefined ? item.overheadCost : (!descLower.includes("product") && !descLower.includes("labour") && !descLower.includes("labor") ? rate : 0);

        totalDirectMaterialLaborCost += (raw + lab) * qty;
        totalOverheadsCost += ovh * qty;
        totalQty += qty;
      });

      const totalOverheadsFreight = totalOverheadsCost + actualFreight + actualPackaging;
      const baseCost = totalDirectMaterialLaborCost + totalOverheadsFreight;
      const marginPct = targetMarginPercent || 0;
      const profitMarkupAmount = (baseCost * marginPct) / 100;
      const grandTotalCost = Math.round((baseCost + profitMarkupAmount) * 100) / 100;
      const finalQuotedUnitPrice = totalQty > 0 ? (grandTotalCost / totalQty) : 0;
      const convertedTotal = grandTotalCost;
      const inrTotal = isExport ? convertedTotal * exchangeRate : convertedTotal;

      return {
        subtotal: baseCost,
        tax: 0,
        grossTotal: grandTotalCost,
        roundOff: 0,
        total: grandTotalCost,
        convertedTotal,
        inrTotal,
        discount: 0,
        discountRate: 0,
        freight: actualFreight,
        packaging: actualPackaging,
        freightTax: 0,
        packagingTax: 0,
        totalDirectMaterialLaborCost,
        totalOverheadsCost,
        totalOverheadsFreight,
        targetMarginPercent: marginPct,
        profitMarkupAmount,
        grandTotalCost,
        finalQuotedUnitPrice
      };
    }

    let subtotal = 0;
    let itemTax = 0;

    items.forEach(item => {
      if (item.isRegret) return;
      
      const itemAmount = item.quantity * item.rate;
      subtotal += itemAmount;
      
      if (isTaxEnabled) {
        itemTax += (itemAmount * item.taxRate) / 100;
      }
    });

    const avgTaxRate = subtotal > 0 ? (itemTax / subtotal) : 0.18;

    const effectiveFreightTaxRate = (freightTaxRate !== undefined && !isNaN(freightTaxRate)) ? freightTaxRate : (avgTaxRate * 100);
    const effectivePackagingTaxRate = (packagingTaxRate !== undefined && !isNaN(packagingTaxRate)) ? packagingTaxRate : (avgTaxRate * 100);

    const freightTax = (isTaxEnabled && freightOption === "extra" && freightTaxTiming === "before_tax") ? (actualFreight * (effectiveFreightTaxRate / 100)) : 0;
    const packagingTax = (isTaxEnabled && packagingOption === "extra" && packagingTaxTiming === "before_tax") ? (actualPackaging * (effectivePackagingTaxRate / 100)) : 0;

    const totalTax = itemTax + freightTax + packagingTax;

    const totalBeforeDiscount = subtotal + totalTax;
    const discountAmount = (totalBeforeDiscount * discountRate) / 100;
    const netBeforeCharges = Math.max(0, totalBeforeDiscount - discountAmount);

    const grossTotal = Math.round((netBeforeCharges + actualFreight + actualPackaging) * 100) / 100;
    const roundedGrandTotal = Math.round(grossTotal);
    const roundOff = Math.round((roundedGrandTotal - grossTotal) * 100) / 100;

    const convertedTotal = roundedGrandTotal;
    const inrTotal = isExport ? convertedTotal * exchangeRate : convertedTotal;

    return { 
      subtotal, 
      tax: totalTax, 
      grossTotal,
      roundOff,
      total: roundedGrandTotal, 
      convertedTotal, 
      inrTotal, 
      discount: discountAmount, 
      discountRate,
      freight: actualFreight,
      packaging: actualPackaging,
      freightTax,
      packagingTax
    };
  }, [items, docType, isExport, isTaxEnabled, exchangeRate, discountRate, targetMarginPercent, freightOption, freightAmount, freightTaxTiming, freightTaxRate, packagingOption, packagingAmount, packagingTaxTiming, packagingTaxRate]);

  const applyCommonGrossPercentage = useCallback((pctStr: string) => {
    const cleanPct = pctStr.replace('%', '').trim();
    const percentValue = parseFloat(cleanPct);
    if (isNaN(percentValue) || percentValue < 0) return;
    
    setItems(prev => prev.map(item => {
      const net = item.netWeight || 0;
      const computedGross = net + (net * percentValue) / 100;
      const roundedGross = Math.round(computedGross * 100) / 100;
      return {
        ...item,
        grossWeight: roundedGross,
        grossWeightPercent: `${percentValue}%`
      };
    }));
  }, []);

  // Handlers
  const addItem = useCallback(() => {
    const countryCfg = getCountryConfig(business.country || countryOfOrigin || "India");
    const defaultRate = countryCfg.defaultTaxRate ?? 18;
    const newItem: any = { id: Math.random().toString(36).substr(2, 9), description: "", hsn: "", quantity: 1, unit: "NOS", rate: 0, taxRate: defaultRate };
    if (commonGrossPercent) {
      newItem.grossWeightPercent = `${commonGrossPercent}%`;
    }
    setItems(prev => [...prev, newItem]);
  }, [commonGrossPercent, business.country, countryOfOrigin]);

  const updateItem = useCallback((id: string, updates: Partial<LineItem>) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, ...updates, isAiEdited: false } : item));
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  }, []);

  const reorderItems = useCallback((fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return;
    setItems(prevItems => {
      if (fromIndex >= prevItems.length || toIndex >= prevItems.length) return prevItems;
      const updated = [...prevItems];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      return updated;
    });
  }, []);

  const handleAIAnalysis = useCallback((analysis: AIDocumentAnalysis, mergeSimilar: boolean = false) => {
    if (analysis.customer) {
      setCustomer(prev => {
        const updated = { ...prev };
        if (analysis.customer?.name && analysis.customer.name.trim().length > 0) {
          updated.name = analysis.customer.name.trim();
        }
        if (analysis.customer?.address && analysis.customer.address.trim().length > 0) {
          updated.address = analysis.customer.address.trim();
        }
        if (analysis.customer?.email && analysis.customer.email.trim().length > 0) {
          updated.email = analysis.customer.email.trim();
        }
        if (analysis.customer?.phone && analysis.customer.phone.trim().length > 0) {
          updated.phone = analysis.customer.phone.trim();
        }
        if (analysis.customer?.gstin && analysis.customer.gstin.trim().length > 0) {
          updated.gstin = analysis.customer.gstin.trim();
        }
        if (analysis.customer?.contactPerson && analysis.customer.contactPerson.trim().length > 0) {
          updated.contactPerson = analysis.customer.contactPerson.trim();
        }
        return updated;
      });
    }

    if (analysis.scopeOfWork) setScopeOfWork(analysis.scopeOfWork);
    if (analysis.materialType) setMaterialType(analysis.materialType);

    if (analysis.products && analysis.products.length > 0) {
      const originalCount = analysis.products.length;
      let processedProducts = [...analysis.products];

      if (mergeSimilar) {
        const merged: Record<string, any> = {};
        processedProducts.forEach(p => {
          const name = (p.name || "").toLowerCase().trim();
          const unit = (p.unit || "NOS").toLowerCase().trim();
          const key = `${name}_${unit}`;
          if (merged[key]) {
            merged[key].quantity = (merged[key].quantity || 0) + (p.quantity || 0);
          } else {
            merged[key] = { ...p };
          }
        });
        processedProducts = Object.values(merged);
      }

      const finalCount = processedProducts.length;
      
      showModal({
        title: "Analysis Complete",
        message: `Extracted ${originalCount} product line items${mergeSimilar && finalCount < originalCount ? ` (merged into ${finalCount} unique entries)` : ""}.${analysis.itemCount && analysis.itemCount > originalCount ? ` Note: AI identified ${analysis.itemCount} items in text but could only fully resolve ${originalCount}.` : ""}`,
        type: "success"
      });

      setItems(prevItems => {
        let currentItems = [...prevItems];
        
        // Filter out empty placeholder if it's the only one
        if (currentItems.length === 1 && currentItems[0].description === "") {
          currentItems = [];
        }

        processedProducts.forEach(suggestion => {
          // Suggested rate is already in the active currency from the document
          const suggestedRate = suggestion.rate || 0;
          const normalizedUom = normalizeUnit(suggestion.unit);
          const rawQty = suggestion.quantity;
          const parsedQuantity = typeof rawQty === 'number' ? rawQty : (parseFloat(String(rawQty || 1).replace(/,/g, '')) || 1);
          
          currentItems.push({
            id: Math.random().toString(36).substr(2, 9),
            description: suggestion.name || "",
            hsn: suggestion.hsn || "",
            quantity: parsedQuantity,
            unit: normalizedUom,
            rate: suggestedRate,
            taxRate: suggestion.suggestedTaxRate || 18
          });
        });
        
        return currentItems;
      });
    }
  }, [showModal]);

  const importFromDocument = (doc: DocumentHistoryItem) => {
    if (doc.fullData) {
      setItems(prevItems => {
        let currentItems = [...prevItems];
        if (currentItems.length === 1 && currentItems[0].description.trim() === "") {
          currentItems = [];
        }
        const imported = doc.fullData.items.map(item => ({
          ...item,
          id: Math.random().toString(36).substr(2, 9),
          qtyPacked: item.quantity,
          remarks: item.remarks || "",
          heatNo: ""
        }));
        return [...currentItems, ...imported];
      });
      setCustomer(doc.fullData.customer);
      setPoNumber(doc.fullData.poNumber || doc.fullData.id);
      
      // Import QA fields if they exist
      const full = doc.fullData as any;
      if (full.projectName) setProjectName(full.projectName);
      if (full.scopeOfWork) setScopeOfWork(full.scopeOfWork);
      if (full.materialType) setMaterialType(full.materialType);
      if (full.riskMitigation) setRiskMitigation(full.riskMitigation);
      if (full.inspectionSummary) setInspectionSummary(full.inspectionSummary);
      if (full.heatId) setHeatId(full.heatId);
      if (full.hasRawMaterialTC !== undefined) setHasRawMaterialTC(full.hasRawMaterialTC);
      if (full.mtcType) setMtcType(full.mtcType);
      if (full.tpiEngagement) setTpiEngagement(full.tpiEngagement);
      if (full.samplingProtocol) setSamplingProtocol(full.samplingProtocol);
      if (full.ncrStatus) setNcrStatus(full.ncrStatus);
      if (full.evidenceControl) setEvidenceControl(full.evidenceControl);
      if (full.technicalNotes) setTechnicalNotes(full.technicalNotes);
      if (full.evidenceRepo) setEvidenceRepo(full.evidenceRepo);
      if (full.qualityDeclaration) setQualityDeclaration(full.qualityDeclaration);
      if (full.finalRemarksStatus) setFinalRemarksStatus(full.finalRemarksStatus);
      if (full.finalRemarksText) setFinalRemarksText(full.finalRemarksText);

      setIsImportModalOpen(false);
      showModal({
        title: "Import Successful",
        message: `Imported ${doc.fullData.items.length} items from ${doc.type} ${doc.id}.`,
        type: "success"
      });
    }
  };

  const handleVoiceSuggestion = useCallback((suggestion: any) => {
    handleAIAnalysis({ products: [suggestion] });
  }, [handleAIAnalysis]);

  // Smart Notes & Terms logic: Update when docType, isExport, or customer changes for a NEW document
  // Only auto-populates if current notes/terms are empty or default to prevent overwriting user edits
  useEffect(() => {
    if (step === "invoice" && !loadedTimestamp) {
      if (isNotesManuallyEdited && isTermsManuallyEdited) return;

      // Check if current fields are "untouched" (empty or default)
      const safeNotesTerms = sanitizeNotesAndTerms(lastUsedNotesAndTerms);
      const isNotesUntouched = !isNotesManuallyEdited && (!notes || notes === "" || notes === safeNotesTerms.customer.standard.notes || notes === safeNotesTerms.customer.export.notes);
      const isTermsUntouched = !isTermsManuallyEdited && (!terms || terms === DEFAULT_TERMS || terms === safeNotesTerms.customer.standard.terms || terms === safeNotesTerms.customer.export.terms);

      if (isNotesUntouched || isTermsUntouched) {
        if (customer.name) {
          const common = getMostCommonNotesAndTerms();
          if (isNotesUntouched && common.notes !== undefined) setNotes(common.notes);
          if (isTermsUntouched && common.terms !== undefined) setTerms(common.terms);
        } else {
          const category = docType === DocumentType.PURCHASE_ORDER ? "supplier" : "customer";
          const subCategory = isExport ? "export" : "standard";
          const remembered = safeNotesTerms[category][subCategory];
          if (isNotesUntouched && remembered.notes !== undefined) setNotes(remembered.notes);
          if (isTermsUntouched && remembered.terms !== undefined) setTerms(remembered.terms);
        }
      }
    }
    // We intentionally exclude notes/terms from dependencies to avoid triggering on manual edits
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docType, isExport, step, loadedTimestamp, customer.name, lastUsedNotesAndTerms, isNotesManuallyEdited, isTermsManuallyEdited]);

  const getInvoiceData = (finalDocId: string): InvoiceData => {
    // Save all reference field values to remembered history
    if (poNumber) saveReferenceValue("poNumber", poNumber);
    if (paymentMode) saveReferenceValue("paymentMode", paymentMode);
    if (paymentTerms) saveReferenceValue("paymentTerms", paymentTerms);
    if (numberOfPackages) saveReferenceValue("numberOfPackages", numberOfPackages);
    if (despatchDocNo) saveReferenceValue("despatchDocNo", despatchDocNo);
    if (transport) saveReferenceValue("transport", transport);
    if (finalDestination) saveReferenceValue("finalDestination", finalDestination);
    if (consigneeName) saveReferenceValue("consigneeName", consigneeName);
    if (consigneeGstin) saveReferenceValue("consigneeGstin", consigneeGstin);
    if (consigneeAddress) saveReferenceValue("consigneeAddress", consigneeAddress);
    if (preCarriageBy) saveReferenceValue("preCarriageBy", preCarriageBy);
    if (placeOfReceipt) saveReferenceValue("placeOfReceipt", placeOfReceipt);
    if (vesselFlightNo) saveReferenceValue("vesselFlightNo", vesselFlightNo);
    if (portOfLoading) saveReferenceValue("portOfLoading", portOfLoading);
    if (portOfDischarge) saveReferenceValue("portOfDischarge", portOfDischarge);
    if (countryOfOrigin) saveReferenceValue("countryOfOrigin", countryOfOrigin);
    if (countryOfDestination) saveReferenceValue("countryOfDestination", countryOfDestination);

    return {
      id: finalDocId,
      type: docType,
      date,
      dueDate: docType === DocumentType.TAX_INVOICE 
        ? formatDateToYYYYMMDD(calculateDueDate(date, paymentTerms, docType))
        : date,
      business,
      customer,
      items,
      notes,
      terms,
      showNotesInPdf: showNotes,
      showTermsInPdf: showTerms,
      transport,
      poNumber,
      isExport,
      isTaxEnabled,
      isIgst,
      currency: currency || business.currency || "INR",
      exchangeRate: isExport ? exchangeRate : 1,
      discount: totals.discount,
      discountRate,
      targetMarginPercent,
      projectName: docType === DocumentType.COST_SHEET ? projectName : undefined,
      costSheetProfitType: costSheetTotals.profitType,
      costSheetProfitValue: costSheetTotals.profitValue,
      costSheetProfitAmount: costSheetTotals.profitAmount,
      costSheetDiscountType: costSheetTotals.discountType,
      costSheetDiscountValue: costSheetTotals.discountValue,
      costSheetDiscountAmount: costSheetTotals.discountAmount,
      costSheetTotalLandedCost: costSheetTotals.totalLandedCost,
      costSheetFinalSellingPrice: costSheetTotals.finalSellingPrice,
      costSheetProductCostTotal: costSheetTotals.totalProductCost,
      costSheetLogisticsTotal: costSheetTotals.totalLogistics,
      costSheetDirectMaterialLaborTotal: costSheetTotals.directMaterialLaborTotal,
      costSheetSuppliers: costSheetTotals.suppliersData,
      costSheetRowsSummary: costSheetTotals.rowsSummary,
      costSheetTotalQuantity: costSheetTotals.totalQuantity,
      costSheetTotalWeight: costSheetTotals.totalWeight,
      costSheetWeightUnit: costSheetTotals.weightUnit,
      paymentMode,
      paymentTerms,
      numberOfPackages,
      reasonForTransportation,
      showPricesInChallan,
      advancePercentage,
      freightOption,
      freightAmount: freightOption === "extra" ? freightAmount : 0,
      freightTaxTiming,
      freightTaxRate: freightOption === "extra" && freightTaxTiming === "before_tax" ? freightTaxRate : undefined,
      packagingOption,
      packagingAmount: packagingOption === "extra" ? packagingAmount : 0,
      packagingTaxTiming,
      packagingTaxRate: packagingOption === "extra" && packagingTaxTiming === "before_tax" ? packagingTaxRate : undefined,
      incotermRule,
      incotermNamedPlace,
      incotermPortOfLoading,
      incotermCountryOfOrigin,
      incotermCountryOfDestination,
      incotermFreightTerms,
      incotermInsuranceDetails,
      layoutSettings,
      // Packing List specific
      preCarriageBy,
      placeOfReceipt,
      vesselFlightNo,
      portOfLoading,
      portOfDischarge,
      finalDestination,
      countryOfOrigin,
      countryOfDestination,
      buyerDetails,
      consigneeName,
      consigneeAddress,
      consigneeGstin,
      buyerOrderDate,
      despatchDocNo,
      packingBoxes: (() => {
        const isPackingList = docType === DocumentType.PACKING_LIST;
        if (!isPackingList) {
          // Restore legacy fallback behavior entirely for other documents to avoid side-effects
          const boxesMap: Record<string, { gross: number; net: number; qty: number }> = {};
          if (!boxesMap["Box 1"]) {
            boxesMap["Box 1"] = { gross: 0, net: 0, qty: 0 };
          }
          items.forEach(item => {
            const bNo = (item.boxNo || "").trim() || "Box 1";
            if (!boxesMap[bNo]) {
              boxesMap[bNo] = { gross: 0, net: 0, qty: 0 };
            }
            const q = item.qtyPacked || item.quantity || 0;
            boxesMap[bNo].qty += q;
            boxesMap[bNo].net += (item.netWeight || 0);
            boxesMap[bNo].gross += (item.grossWeight || 0);
          });
          return Object.entries(boxesMap).map(([boxNo, metrics]) => {
            const netOverride = boxNetWeights[boxNo];
            const grossOverride = boxGrossWeights[boxNo];
            const qtyOverride = boxQtyPacked[boxNo];

            const finalNet = (netOverride !== undefined && netOverride !== "") 
              ? parseFloat(netOverride) 
              : Math.round(metrics.net * 100) / 100;
            
            const finalGross = (grossOverride !== undefined && grossOverride !== "") 
              ? parseFloat(grossOverride) 
              : Math.round(metrics.gross * 100) / 100;

            const finalQty = (qtyOverride !== undefined && qtyOverride !== "") 
              ? parseInt(qtyOverride) 
              : metrics.qty;

            return {
              boxNo,
              quantityText: `${boxNo} X ${finalQty}`,
              grossWeight: isNaN(finalGross) ? 0 : Math.round(finalGross * 100) / 100,
              netWeight: isNaN(finalNet) ? 0 : Math.round(finalNet * 100) / 100,
              dimensions: boxDimensions[boxNo] || "",
            };
          });
        }

        // Dedicated intelligent aggregation for Packing List
        const aggregated = aggregateLineItemsForBoxes(
          items,
          customBoxes,
          boxDimensions,
          boxNetWeights,
          boxGrossWeights,
          boxQtyPacked
        );
        return convertAggregatedBoxesToPackingBoxes(aggregated);
      })(),
    };
  };

  // Synchronous, un-debounced active draft & step save helper
  const saveActiveDraftNow = useCallback(() => {
    if (isFirstLoad) return;
    try {
      const draftData = getInvoiceData(docId || "DRAFT");
      const hasContent =
        (items || []).some(i => (i.description || "").trim().length > 0 || i.rate > 0) ||
        (customer?.name || "").trim().length > 0 ||
        (docId && docId !== "TAX-") ||
        (notes || "").trim().length > 0;

      if (hasContent) {
        const now = Date.now();
        const timeStr = new Date(now).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        safeSave("autosave_invoice_draft", { timestamp: now, data: draftData }, user?.uid);
        setAutoSaveTime(timeStr);
      }
      if (step) {
        safeSave("active_app_step", step, user?.uid);
      }
    } catch (err) {
      console.error("Auto-save draft error:", err);
    }
  }, [
    isFirstLoad, docId, docType, date, customer, items, notes, terms, transport, poNumber,
    currency, exchangeRate, isExport, isTaxEnabled, isIgst, consigneeName,
    consigneeAddress, consigneeGstin, buyerDetails, buyerOrderDate, despatchDocNo,
    preCarriageBy, placeOfReceipt, vesselFlightNo, portOfLoading, portOfDischarge,
    finalDestination, countryOfOrigin, countryOfDestination, paymentMode, paymentTerms, numberOfPackages,
    freightOption, freightAmount, packagingOption, packagingAmount, step, user?.uid, getInvoiceData
  ]);

  const saveActiveDraftNowRef = useRef(saveActiveDraftNow);
  useEffect(() => {
    saveActiveDraftNowRef.current = saveActiveDraftNow;
  }, [saveActiveDraftNow]);

  // Page Visibility Lifecycle Guard: Immediately trigger inline autosave when page is hidden / backgrounded on mobile
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        saveActiveDraftNowRef.current();
      }
    };

    const handlePageHide = () => {
      saveActiveDraftNowRef.current();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handlePageHide);
    window.addEventListener("beforeunload", handlePageHide);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handlePageHide);
      window.removeEventListener("beforeunload", handlePageHide);
    };
  }, []);

  // Real-time debounced auto-save (500ms) for draft invoices & form inputs
  useEffect(() => {
    if (isFirstLoad) return;

    const timer = setTimeout(() => {
      saveActiveDraftNowRef.current();
    }, 500);

    return () => clearTimeout(timer);
  }, [
    docId, docType, date, customer, items, notes, terms, transport, poNumber,
    currency, exchangeRate, isExport, isTaxEnabled, isIgst, consigneeName,
    consigneeAddress, consigneeGstin, buyerDetails, buyerOrderDate, despatchDocNo,
    preCarriageBy, placeOfReceipt, vesselFlightNo, portOfLoading, portOfDischarge,
    finalDestination, countryOfOrigin, countryOfDestination, paymentMode, paymentTerms, numberOfPackages,
    freightOption, freightAmount, packagingOption, packagingAmount,
    scopeOfWork, materialType, riskMitigation, heatId, step, user?.uid, isFirstLoad
  ]);



  const [isTaxSummaryModalOpen, setIsTaxSummaryModalOpen] = useState(false);

  const handleOpenTaxSummary = () => {
    if (!business.name || !customer.name) {
      showModal({
        title: "Missing Details",
        message: "Please fill in business and customer details.",
        type: "warning"
      });
      return;
    }
    setIsTaxSummaryModalOpen(true);
  };

  const checkSaveQuotaAndEdits = (checkDocId: string): { 
    allowed: boolean; 
    isEditingExisting: boolean;
    consumesQuota: boolean;
    nextEditCount: number; 
    existingDoc?: DocumentHistoryItem 
  } | null => {
    const rawTier = userProfile?.planTier || userProfile?.planName || userProfile?.plan;
    const planInfo = getPlanDetails(rawTier);
    const isPro = planInfo.tier === "pro" || planInfo.tier === "enterprise" || planInfo.isUnlimited || (typeof rawTier === "string" && (rawTier.toLowerCase().includes("pro") || rawTier.toLowerCase().includes("enterprise")));
    const bonusCredits = userProfile?.trialCreditsGranted || 0;
    const maxQuota = isPro ? Infinity : ((planInfo.documentLimit || 5) + bonusCredits);
    const activeUid = impersonatedUser ? impersonatedUser.id : user?.uid;
    const usedCount = getEffectiveLifetimeDocCount(userProfile, activeUid, (history || []).length);
    const remaining = userProfile?.documentsRemaining !== undefined ? userProfile.documentsRemaining : Math.max(0, maxQuota - usedCount);

    // Check if the loaded document matches the current document being saved
    const loadedDoc = loadedTimestamp ? (history || []).find(item => item.timestamp === loadedTimestamp) : undefined;
    
    // If the document type was changed (e.g. Tax Invoice -> Quotation), or if doc ID changed from loadedDoc, it is NOT the same existing document!
    const isSameAsLoaded = loadedDoc && loadedDoc.type === docType && (loadedDoc.id === checkDocId || loadedDoc.documentNumber === checkDocId || (docType === DocumentType.QUOTATION && checkDocId.startsWith(loadedDoc.id)));
    
    const existingDoc = isSameAsLoaded
      ? loadedDoc
      : (history || []).find(item => (item.id === checkDocId || item.documentNumber === checkDocId) && item.type === docType);

    const isEditingExisting = !!existingDoc;
    const currentEdits = existingDoc?.editCount || 0;

    if (isPro) {
      // Enterprise or Pro: immediately unblock document creation and editing
      return {
        allowed: true,
        isEditingExisting,
        consumesQuota: false,
        nextEditCount: isEditingExisting ? currentEdits + 1 : 0,
        existingDoc
      };
    }

    if (!isEditingExisting) {
      // Brand new document generation
      if (remaining <= 0) {
        setTrialModalCustomMessage(`Maximum Free Documents Reached (${usedCount} Documents Created). Upgrade to Pro to create more documents.`);
        setShowTrialLimitModal(true);
        showShortcutToast(`⚠️ Free Limit Reached (${usedCount} Documents Created).`);
        return null;
      }
      if (usedCount >= 1 && !hasSubmittedFeedback && bonusCredits === 0) {
        setShowFeedbackModal(true);
        showShortcutToast("📝 Please complete the mandatory survey to unlock creation of Document #2!");
        return null;
      }
      return { 
        allowed: true, 
        isEditingExisting: false, 
        consumesQuota: true, 
        nextEditCount: 0, 
        existingDoc: undefined 
      };
    } else {
      if (currentEdits === 0) {
        // 1st edit is free (editCount 0 -> 1): updates existing doc in place without consuming quota credit
        return { 
          allowed: true, 
          isEditingExisting: true, 
          consumesQuota: false, 
          nextEditCount: 1, 
          existingDoc 
        };
      } else {
        // 2nd edit and beyond (editCount >= 1): counts as a new document generation and consumes a quota credit
        if (remaining <= 0) {
          setTrialModalCustomMessage(`Your free document quota is full (0 documents remaining) and you have already used your 1 free edit for this document. Upgrade to Pro to save further edits or create new documents.`);
          setShowTrialLimitModal(true);
          showShortcutToast(`⚠️ Free quota full. Free edit already consumed.`);
          return null;
        }
        return { 
          allowed: true, 
          isEditingExisting: true, 
          consumesQuota: true, 
          nextEditCount: currentEdits + 1, 
          existingDoc 
        };
      }
    }
  };

  const saveDocumentToHistory = async (options?: { silent?: boolean; showToast?: boolean }): Promise<{ success: boolean; data?: InvoiceData; item?: DocumentHistoryItem }> => {
    if (!business.name || !customer.name) {
      showModal({
        title: "Missing Details",
        message: "Please fill in business and customer details.",
        type: "warning"
      });
      return { success: false };
    }

    let finalDocId = docId;
    if (loadedTimestamp && docType === DocumentType.QUOTATION && !finalDocId.includes("(R)")) {
      const loadedDoc = (history || []).find(item => item.timestamp === loadedTimestamp);
      if (loadedDoc && loadedDoc.type === DocumentType.QUOTATION) {
        finalDocId = `${finalDocId} (R)`;
        setDocId(finalDocId);
      }
    }

    const quotaCheck = checkSaveQuotaAndEdits(finalDocId);
    if (!quotaCheck) return { success: false };

    const { isEditingExisting, consumesQuota, nextEditCount, existingDoc } = quotaCheck;
    const isFirstDoc = (history || []).length === 0;

    // Save customer / supplier contact
    const customerPreferences = { isExport, currency, notes, terms };
    if (docType === DocumentType.PURCHASE_ORDER) {
      await autoSaveContactIfNew(
        {
          name: customer.name,
          type: 'Supplier',
          gstin: customer.gstin,
          email: customer.email,
          phone: customer.phone,
          address: customer.address,
          country: customer.country,
          attentionPerson: customer.attentionPerson,
        },
        savedSuppliers as unknown as ContactEntity[],
        async (newContact) => {
          const exists = savedSuppliers.find(c => (c.name || "").toLowerCase() === (customer.name || "").toLowerCase());
          let updatedSuppliers;
          if (!exists) {
            updatedSuppliers = [...savedSuppliers, { ...customer, ...customerPreferences, id: newContact.id || Math.random().toString(36).substr(2, 9) }];
          } else {
            updatedSuppliers = savedSuppliers.map(c => c.id === exists.id ? { ...customer, ...customerPreferences, id: c.id } : c);
          }
          setSavedSuppliers(updatedSuppliers);
          safeSave("saved_suppliers", updatedSuppliers, user?.uid);
          if (user?.uid) {
            saveUserContact(user.uid, {
              name: customer.name,
              type: 'Supplier',
              gstin: customer.gstin,
              email: customer.email,
              phone: customer.phone,
              address: customer.address,
              country: customer.country,
              attentionPerson: customer.attentionPerson,
            }).catch(e => console.warn("Cloud contact save fallback", e));
          }
        }
      );
    } else {
      await autoSaveContactIfNew(
        {
          name: customer.name,
          type: 'Customer',
          gstin: customer.gstin,
          email: customer.email,
          phone: customer.phone,
          address: customer.address,
          country: customer.country,
        },
        savedCustomers as unknown as ContactEntity[],
        async (newContact) => {
          const exists = savedCustomers.find(c => (c.name || "").toLowerCase() === (customer.name || "").toLowerCase());
          let updatedCustomers;
          if (!exists) {
            updatedCustomers = [...savedCustomers, { ...customer, ...customerPreferences, id: newContact.id || Math.random().toString(36).substr(2, 9) }];
          } else {
            updatedCustomers = savedCustomers.map(c => c.id === exists.id ? { ...customer, ...customerPreferences, id: c.id } : c);
          }
          setSavedCustomers(updatedCustomers);
          safeSave("saved_customers", updatedCustomers, user?.uid);
          if (user?.uid) {
            saveUserContact(user.uid, {
              name: customer.name,
              type: 'Customer',
              gstin: customer.gstin,
              email: customer.email,
              phone: customer.phone,
              address: customer.address,
              country: customer.country,
            }).catch(e => console.warn("Cloud contact save fallback", e));
          }
        }
      );
    }

    const data: InvoiceData = getInvoiceData(finalDocId);
    const syncId = impersonatedUser ? impersonatedUser.id : user?.uid;
    const saveTimestamp = Date.now();
    const currentIsoDate = new Date().toISOString();

    const baseHistoryItem = {
      id: finalDocId,
      documentNumber: finalDocId,
      type: docType,
      date,
      createdAt: currentIsoDate,
      updatedAt: currentIsoDate,
      partyName: customer.name || "Customer",
      customerName: customer.name || "Customer",
      customerCountry: customer.country || "",
      total: totals.convertedTotal,
      totalAmount: totals.convertedTotal,
      inrTotal: totals.inrTotal,
      currency: currency || business.currency || "INR",
      lineItemsCount: items.length,
      itemsCount: items.length,
      status: docType === DocumentType.TAX_INVOICE ? "Pending" : "Issued",
      paymentStatus: "pending" as const,
      userId: syncId,
      fullData: {
        ...data,
        id: finalDocId,
        business: { 
          ...business, 
          letterhead: undefined,
          logo: undefined,
          signature: undefined
        }
      }
    };

    let savedHistoryItem: DocumentHistoryItem;
    let updatedHistoryList: DocumentHistoryItem[] = [];

    if (isEditingExisting && existingDoc) {
      const targetTimestamp = existingDoc.timestamp;
      savedHistoryItem = {
        ...baseHistoryItem,
        timestamp: targetTimestamp, // Preserve original timestamp for stable document identity & cloud syncing
        createdAt: existingDoc.createdAt || currentIsoDate,
        updatedAt: currentIsoDate,
        editCount: nextEditCount,
      };

      const list = historyRef.current && historyRef.current.length > 0 ? historyRef.current : (history || []);
      const index = list.findIndex(item => item.timestamp === targetTimestamp);
      if (index !== -1) {
        updatedHistoryList = [...list];
        updatedHistoryList[index] = savedHistoryItem;
      } else {
        updatedHistoryList = [savedHistoryItem, ...list.filter(item => !(item.id === finalDocId && item.type === docType))];
      }
      historyRef.current = updatedHistoryList;
      setHistory(updatedHistoryList);
      safeSave("document_history", updatedHistoryList, user?.uid);
      seedReferenceHistoryFromDocumentHistory(updatedHistoryList);
      setLoadedTimestamp(targetTimestamp);
    } else {
      savedHistoryItem = {
        ...baseHistoryItem,
        timestamp: saveTimestamp,
        createdAt: currentIsoDate,
        updatedAt: currentIsoDate,
        editCount: 0
      };
      const list = historyRef.current && historyRef.current.length > 0 ? historyRef.current : (history || []);
      const filtered = list.filter(item => 
        !(item.id === finalDocId && item.type === docType)
      );
      updatedHistoryList = [savedHistoryItem, ...filtered];
      historyRef.current = updatedHistoryList;
      setHistory(updatedHistoryList);
      safeSave("document_history", updatedHistoryList, user?.uid);
      seedReferenceHistoryFromDocumentHistory(updatedHistoryList);
      setLoadedTimestamp(saveTimestamp);
    }

    // Consume quota credit for trial users when creating a new document or on 2nd+ edit
    if (consumesQuota) {
      const targetUid = impersonatedUser ? impersonatedUser.id : user?.uid;
      const targetEmail = impersonatedUser?.email || user?.email || userProfile?.signupEmail || userProfile?.authEmail || "";
      const optCount = incrementLocalUserDocCount(targetUid);
      const optRemaining = Math.max(0, 5 - optCount);
      const optExhausted = optRemaining <= 0;
      setUserProfile((prev: any) => prev ? ({
        ...prev,
        documentsRemaining: optRemaining,
        documentsUsed: optCount,
        lifetimeCreatedCount: optCount,
        totalGeneratedDocsCount: optCount,
        trialExhausted: optExhausted,
        ...(optExhausted && prev.planTier !== "pro" && prev.planTier !== "enterprise" ? {
          planTier: "expired",
          planName: "Trial Expired",
          plan: "Trial Expired"
        } : {})
      }) : prev);

      if (targetUid && targetEmail) {
        consumeUserDocumentCredit(targetUid, targetEmail).then(({ remaining, exhausted, lifetimeCreatedCount }) => {
          setUserProfile((prev: any) => prev ? ({
            ...prev,
            documentsRemaining: remaining,
            documentsUsed: lifetimeCreatedCount,
            lifetimeCreatedCount: lifetimeCreatedCount,
            totalGeneratedDocsCount: lifetimeCreatedCount,
            trialExhausted: exhausted,
            ...(exhausted && prev.planTier !== "pro" && prev.planTier !== "enterprise" ? {
              planTier: "expired",
              planName: "Trial Expired",
              plan: "Trial Expired"
            } : {})
          }) : prev);
        }).catch(() => {});
      }
    }

    // Persist to Cloud subcollection (Firestore users/{userId}/documents/{safeDocId})
    if (syncId && savedHistoryItem) {
      saveDocumentRecordToCloud(syncId, savedHistoryItem).catch(e => 
        console.warn("Notice saving document to cloud subcollection:", e)
      );
    }

    // Update last used numbers
    const prefix = getShortForm(business.name);
    const typeCode = docType === DocumentType.TAX_INVOICE ? "INV" : 
                    docType === DocumentType.QUOTATION ? "QT" : 
                    docType === DocumentType.PURCHASE_ORDER ? "PO" : 
                    docType === DocumentType.COST_SHEET ? "CS" : "DC";
    const fullPrefix = `${prefix}/${typeCode}/`;
    const safeKey = sanitizeKey(fullPrefix);
    const parts = finalDocId.split('/');
    const lastPart = parts[parts.length - 1];
    const num = parseInt(lastPart) || 0;
    
    if (num > 0) {
      setLastUsedNumbers(prev => ({
        ...prev,
        [safeKey]: Math.max(prev[safeKey] || 0, num)
      }));
    }

    // Update price history
    const historyEntries: PriceHistoryItem[] = items
      .filter(item => item.description && item.rate > 0)
      .map(item => ({
        description: item.description,
        rate: item.rate,
        date,
        customerName: customer.name
      }));
    
    setPriceHistory(prev => [...historyEntries, ...prev].slice(0, 500)); // Keep last 500 entries

    // Update remembered notes and terms
    const category = docType === DocumentType.PURCHASE_ORDER ? "supplier" : "customer";
    const subCategory = isExport ? "export" : "standard";
    const safeCurrentNotes = sanitizeNotesAndTerms(lastUsedNotesAndTerms);
    const newLastUsed = {
      ...safeCurrentNotes,
      [category]: {
        ...safeCurrentNotes[category],
        [subCategory]: { notes, terms }
      }
    };
    setLastUsedNotesAndTerms(newLastUsed);
    safeSave("last_used_notes_and_terms", newLastUsed, user?.uid);

    syncToCloudData(updatedHistoryList).catch(() => {});

    if (options?.showToast) {
      showShortcutToast("💾 Document saved to history successfully!");
    }

    if (isFirstDoc && !hasSubmittedFeedback) {
      setShowFeedbackModal(true);
    }

    return { success: true, data, item: savedHistoryItem };
  };

  const generatePDF = async () => {
    setIsGenerating(true);
    try {
      // 1. Mandatorily save document to History, Local Storage, and Firestore before rendering PDF
      const saveResult = await saveDocumentToHistory({ silent: true });
      if (!saveResult.success || !saveResult.data) {
        return;
      }

      setIsTaxSummaryModalOpen(false);

      // 2. Download generated PDF
      await downloadInvoicePDF(saveResult.data);

      showShortcutToast("📄 PDF generated & document saved to history!");

      // 3. Reset form states for next new document
      setDocId(""); 
      setDiscountRate(0);
      setPaymentTerms("");
      setNumberOfPackages("");
      setAdvancePercentage(0);
      setLoadedTimestamp(null);
    } catch (error) {
      const syncId = impersonatedUser ? impersonatedUser.id : user?.uid;
      console.error("PDF Generation Error:", error);
      logErrorEvent(syncId, impersonatedUser?.email || user?.email, "Document Designer", "PDF Generation Error", error, "document");
      showModal({
        title: "Generation Notice",
        message: "Failed to generate document. Please check your inputs and try again.",
        type: "warning"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const generateChallan = () => {
    setIsGenerateChallanModalOpen(true);
  };

  const handleConfirmGenerateChallan = async (modalData: {
    numberOfPackages: string;
    despatchDocNo: string;
    transport: string;
    reasonForTransportation: string;
    dispatchDate: string;
    finalDestination: string;
    showPricesInChallan: boolean;
  }) => {
    setIsGenerateChallanModalOpen(false);

    if (modalData.numberOfPackages !== undefined) setNumberOfPackages(modalData.numberOfPackages);
    if (modalData.despatchDocNo !== undefined) setDespatchDocNo(modalData.despatchDocNo);
    if (modalData.transport !== undefined) setTransport(modalData.transport);
    if (modalData.reasonForTransportation !== undefined) setReasonForTransportation(modalData.reasonForTransportation);
    if (modalData.showPricesInChallan !== undefined) setShowPricesInChallan(modalData.showPricesInChallan);
    if (modalData.dispatchDate) setDate(modalData.dispatchDate);
    if (modalData.finalDestination) setFinalDestination(modalData.finalDestination);

    const nextChallanId = docId.startsWith("DC-") 
      ? docId 
      : `DC-${docId.split('-')[1] || Date.now().toString().slice(-6)}`;
    setDocId(nextChallanId);
    setDocType(DocumentType.DELIVERY_CHALLAN);

    setIsGenerating(true);
    try {
      if (customer.name && customer.name.trim()) {
        const customerPreferences = { isExport, currency, notes, terms };
        await autoSaveContactIfNew(
          {
            name: customer.name,
            type: 'Customer',
            gstin: customer.gstin,
            email: customer.email,
            phone: customer.phone,
            address: customer.address,
            country: customer.country,
          },
          savedCustomers as unknown as ContactEntity[],
          async (newContact) => {
            const exists = savedCustomers.find(c => (c.name || "").toLowerCase() === (customer.name || "").toLowerCase());
            let updatedCustomers;
            if (!exists) {
              updatedCustomers = [...savedCustomers, { ...customer, ...customerPreferences, id: newContact.id || Math.random().toString(36).substr(2, 9) }];
            } else {
              updatedCustomers = savedCustomers.map(c => c.id === exists.id ? { ...customer, ...customerPreferences, id: c.id } : c);
            }
            setSavedCustomers(updatedCustomers);
            safeSave("saved_customers", updatedCustomers, user?.uid);
            if (user?.uid) {
              saveUserContact(user.uid, {
                name: customer.name,
                type: 'Customer',
                gstin: customer.gstin,
                email: customer.email,
                phone: customer.phone,
                address: customer.address,
                country: customer.country,
              }).catch(e => console.warn("Cloud contact save fallback", e));
            }
          }
        );
      }

      const dataToGenerate: InvoiceData = {
        ...getInvoiceData(nextChallanId),
        id: nextChallanId,
        type: DocumentType.DELIVERY_CHALLAN,
        date: modalData.dispatchDate || date,
        dueDate: modalData.dispatchDate || date,
        numberOfPackages: modalData.numberOfPackages,
        despatchDocNo: modalData.despatchDocNo,
        transport: modalData.transport,
        reasonForTransportation: modalData.reasonForTransportation,
        showPricesInChallan: modalData.showPricesInChallan,
        finalDestination: modalData.finalDestination || finalDestination,
      };

      const newTimestamp = Date.now();
      const syncId = impersonatedUser ? impersonatedUser.id : user?.uid;
      const baseHistoryItem: DocumentHistoryItem = {
        id: nextChallanId,
        documentNumber: nextChallanId,
        timestamp: newTimestamp,
        type: DocumentType.DELIVERY_CHALLAN,
        date: modalData.dispatchDate || date,
        createdAt: new Date().toISOString(),
        partyName: customer.name || dataToGenerate.customer?.name || "Customer",
        customerName: customer.name || dataToGenerate.customer?.name || "Customer",
        customerCountry: customer.country || dataToGenerate.customer?.country || "",
        total: totals.convertedTotal,
        totalAmount: totals.convertedTotal,
        inrTotal: totals.inrTotal,
        currency: currency || business.currency || "INR",
        lineItemsCount: items.length,
        itemsCount: items.length,
        status: "Issued",
        paymentStatus: "pending" as const,
        userId: syncId,
        editCount: 0,
        fullData: {
          ...dataToGenerate,
          business: { 
            ...business, 
            letterhead: undefined,
            logo: undefined,
            signature: undefined
          }
        }
      };

      let savedChallanItem = baseHistoryItem;
      let updatedChallanList: DocumentHistoryItem[] = [];

      const list = historyRef.current && historyRef.current.length > 0 ? historyRef.current : (history || []);
      const existingIdx = list.findIndex(item => item.id === nextChallanId);
      if (existingIdx !== -1) {
        savedChallanItem = {
          ...baseHistoryItem,
          timestamp: list[existingIdx].timestamp || newTimestamp,
          editCount: (list[existingIdx].editCount || 0) + 1,
        };
        updatedChallanList = [...list];
        updatedChallanList[existingIdx] = savedChallanItem;
      } else {
        updatedChallanList = [baseHistoryItem, ...list];
      }
      historyRef.current = updatedChallanList;
      setHistory(updatedChallanList);
      safeSave("document_history", updatedChallanList, user?.uid);
      seedReferenceHistoryFromDocumentHistory(updatedChallanList);

      if (syncId && savedChallanItem) {
        saveDocumentRecordToCloud(syncId, savedChallanItem).catch(e => console.warn("Notice saving delivery challan to cloud:", e));
      }

      await downloadInvoicePDF(dataToGenerate);
      await syncToCloudData(updatedChallanList);
      showShortcutToast("🚚 Delivery Challan generated successfully!");
    } catch (error) {
      console.error("Challan Generation Error:", error);
      showModal({
        title: "Challan Loaded",
        message: "Delivery Challan has been loaded into the workspace.",
        type: "info"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const showShortcutToast = useCallback((msg: string) => {
    setShortcutToast(msg);
    setTimeout(() => {
      setShortcutToast(prev => (prev === msg ? null : prev));
    }, 2800);
  }, []);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCtrlOrCmd = e.ctrlKey || e.metaKey;
      const key = (e.key || "").toLowerCase();

      // 1. Save Current Invoice: Ctrl + S or Cmd + S
      if (isCtrlOrCmd && key === "s") {
        e.preventDefault();
        try {
          const currentData = getInvoiceData(docId);
          safeSave("autosave_invoice_draft", currentData, user?.uid);
          const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          setAutoSaveTime(time);
        } catch (err) {
          console.error(err);
        }
        showShortcutToast("💾 Invoice saved to local draft!");
        return;
      }

      // 2. Create New Invoice: Ctrl + N or Cmd + N or Alt + N
      if ((isCtrlOrCmd || e.altKey) && key === "n") {
        e.preventDefault();
        handleNewDocument();
        showShortcutToast("✨ Started a new invoice draft!");
        return;
      }

      // 3. Generate & Download PDF: Ctrl + P or Cmd + P
      if (isCtrlOrCmd && key === "p") {
        e.preventDefault();
        showShortcutToast("📄 Preparing invoice PDF export...");
        generatePDF();
        return;
      }

      // 4. Open AI Extractor: Ctrl + Shift + A or Alt + A
      if ((isCtrlOrCmd && e.shiftKey && key === "a") || (e.altKey && key === "a")) {
        e.preventDefault();
        setShowQAImportModal(true);
        showShortcutToast("🤖 Opened AI Smart Extractor!");
        return;
      }

      // 5. Search Party / Customer: Ctrl + K or Ctrl + F
      if (isCtrlOrCmd && (key === "k" || key === "f")) {
        e.preventDefault();
        const searchEl = document.getElementById("party-search-input") || document.querySelector("input[type='text']");
        if (searchEl) {
          (searchEl as HTMLElement).focus();
          showShortcutToast("🔍 Focused Party Search");
        }
        return;
      }

      // 6. Open How to Use Guide: Ctrl + Shift + H or Alt + H
      if ((isCtrlOrCmd && e.shiftKey && key === "h") || (e.altKey && key === "h")) {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent("open-footer-modal", { detail: "howToUse" }));
        showShortcutToast("📖 Opened How to Use Guide");
        return;
      }

      // 7. Open Keyboard Shortcuts: Ctrl + / or Cmd + /
      if (isCtrlOrCmd && e.key === "/") {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent("open-footer-modal", { detail: "shortcuts" }));
        showShortcutToast("⌨️ Opened Keyboard Shortcuts");
        return;
      }

      // 8. Close Modals on Escape
      if (e.key === "Escape") {
        setShowQAImportModal(false);
        setShowQuickAdd(false);
        setIsTaxSummaryModalOpen(false);
        setIsImportModalOpen(false);
        window.dispatchEvent(new CustomEvent("open-footer-modal", { detail: null }));
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [docId, user, items, customer, business, docType, date, generatePDF, handleNewDocument, getInvoiceData, safeSave, showShortcutToast]);

  const loadDocument = (doc: DocumentHistoryItem) => {
    if (!doc.fullData) {
      showModal({
        title: "Legacy Document",
        message: "Full data not available for this legacy document.",
        type: "info"
      });
      return;
    }
    const data = doc.fullData;
    setDocType(data.type);
    setDocId(data.id);
    setDate(data.date);
    setCustomer(data.customer);
    setItems(data.items);
    setNotes(data.notes);
    setTerms(data.terms || DEFAULT_TERMS);
    setShowNotes(data.showNotesInPdf !== undefined ? data.showNotesInPdf : true);
    setShowTerms(data.showTermsInPdf !== undefined ? data.showTermsInPdf : true);
    setIsNotesManuallyEdited(true);
    setIsTermsManuallyEdited(true);
    setTransport(data.transport || "");
    setPaymentMode(data.paymentMode || "");
    setPaymentTerms(data.paymentTerms || "");
    setNumberOfPackages(data.numberOfPackages || "");
    setReasonForTransportation(data.reasonForTransportation || "Supply");
    setShowPricesInChallan(data.showPricesInChallan ?? false);
    setAdvancePercentage(data.advancePercentage || 0);
    setPoNumber(data.poNumber || "");
    setDiscountRate(data.discountRate || 0);
    setFreightOption(data.freightOption || "none");
    setFreightAmount(data.freightAmount || 0);
    setFreightTaxTiming(data.freightTaxTiming || "before_tax");
    setFreightTaxRate(data.freightTaxRate !== undefined ? data.freightTaxRate : undefined);
    setPackagingOption(data.packagingOption || "none");
    setPackagingAmount(data.packagingAmount || 0);
    setPackagingTaxTiming(data.packagingTaxTiming || "before_tax");
    setPackagingTaxRate(data.packagingTaxRate !== undefined ? data.packagingTaxRate : undefined);
    setIsExport(data.isExport || false);
    setIsTaxEnabled(data.isTaxEnabled !== undefined ? data.isTaxEnabled : !data.isExport);
    setIsIgst(data.isIgst || false);
    setCurrency(data.currency || business.currency || "INR");
    setExchangeRate(data.exchangeRate || 1);
    
    // Restore Incoterm fields
    setIncotermRule(data.incotermRule || "");
    setIncotermNamedPlace(data.incotermNamedPlace || "");
    setIncotermPortOfLoading(data.incotermPortOfLoading || "");
    setIncotermCountryOfOrigin(data.incotermCountryOfOrigin || "");
    setIncotermCountryOfDestination(data.incotermCountryOfDestination || "");
    setIncotermFreightTerms(data.incotermFreightTerms || "");
    setIncotermInsuranceDetails(data.incotermInsuranceDetails || "");
    
    // Restore QA fields
    const legacyData = data as any;
    if (legacyData.scopeOfWork) setScopeOfWork(legacyData.scopeOfWork);
    if (legacyData.materialType) setMaterialType(legacyData.materialType);
    
    // Restore Packing List fields
    setPreCarriageBy(data.preCarriageBy || "");
    setPlaceOfReceipt(data.placeOfReceipt || "");
    setVesselFlightNo(data.vesselFlightNo || "");
    setPortOfLoading(data.portOfLoading || "");
    setPortOfDischarge(data.portOfDischarge || "");
    setFinalDestination(data.finalDestination || "");
    setCountryOfOrigin(data.countryOfOrigin || business.country || "India");
    setCountryOfDestination(data.countryOfDestination || "");
    setBuyerDetails(data.buyerDetails || "");
    setConsigneeName(data.consigneeName || "");
    setConsigneeAddress(data.consigneeAddress || "");
    setConsigneeGstin(data.consigneeGstin || "");
    setBuyerOrderDate(data.buyerOrderDate || "");
    setDespatchDocNo(data.despatchDocNo || "");
    if (data.packingBoxes) {
      const dimensionsMap: Record<string, string> = {};
      const netWeightsMap: Record<string, string> = {};
      const grossWeightsMap: Record<string, string> = {};
      const qtyPackedMap: Record<string, string> = {};

      data.packingBoxes.forEach(box => {
        dimensionsMap[box.boxNo] = box.dimensions || "";
        if (box.netWeight !== undefined && box.netWeight !== null) {
          netWeightsMap[box.boxNo] = String(box.netWeight);
        }
        if (box.grossWeight !== undefined && box.grossWeight !== null) {
          grossWeightsMap[box.boxNo] = String(box.grossWeight);
        }
        if (box.quantityText) {
          const qtyPart = box.quantityText.split('X')[1]?.trim();
          if (qtyPart) {
            qtyPackedMap[box.boxNo] = qtyPart;
          }
        }
      });
      setBoxDimensions(dimensionsMap);
      setBoxNetWeights(netWeightsMap);
      setBoxGrossWeights(grossWeightsMap);
      setBoxQtyPacked(qtyPackedMap);
    } else {
      setBoxDimensions({});
      setBoxNetWeights({});
      setBoxGrossWeights({});
      setBoxQtyPacked({});
    }
    if (legacyData.riskMitigation) {
      const migrated = { ...legacyData.riskMitigation };
      const mapping: Record<string, string> = {
        "Material Drift PMI Sampling & Spectro Correlation": "Material Drift Control – Grade verification strategy implemented through PMI and MTC correlation",
        "Geometric Precision 100% Calibrated Dimensional Audit": "Geometric Control – Dimensional accuracy ensured through calibrated inspection methods"
      };
      
      for (const [oldKey, newKey] of Object.entries(mapping)) {
        if (migrated[oldKey] && !migrated[newKey]) {
          migrated[newKey] = migrated[oldKey];
          delete migrated[oldKey];
        }
      }
      setRiskMitigation(migrated);
    }
    if (legacyData.riskMitigation) setRiskMitigation(legacyData.riskMitigation);
    if (legacyData.inspectionSummary) setInspectionSummary(legacyData.inspectionSummary);
    if (legacyData.heatId) setHeatId(legacyData.heatId);
    if (legacyData.hasRawMaterialTC !== undefined) setHasRawMaterialTC(legacyData.hasRawMaterialTC);
    if (legacyData.tpiEngagement) setTpiEngagement(legacyData.tpiEngagement);
    if (legacyData.samplingProtocol) setSamplingProtocol(legacyData.samplingProtocol);
    if (legacyData.samplingType) setSamplingType(legacyData.samplingType);
    if (legacyData.ncrStatus) setNcrStatus(legacyData.ncrStatus);
    if (legacyData.ncrItems) setNcrItems(legacyData.ncrItems);
    if (legacyData.evidenceControl) setEvidenceControl(legacyData.evidenceControl);
    if (legacyData.technicalNotes) setTechnicalNotes(legacyData.technicalNotes);
    if (legacyData.evidenceRepo) setEvidenceRepo(legacyData.evidenceRepo);
    if (legacyData.qualityDeclaration) setQualityDeclaration(legacyData.qualityDeclaration);
    if (legacyData.packagingDispatch) setPackagingDispatch(legacyData.packagingDispatch);
    if (legacyData.finalRemarksStatus) setFinalRemarksStatus(legacyData.finalRemarksStatus);
    if (legacyData.finalRemarksText) setFinalRemarksText(legacyData.finalRemarksText);

    setLoadedTimestamp(doc.timestamp);
    setStep("invoice");
    window.scrollTo(0, 0);
  };

  const deleteDocument = (timestamp: number) => {
    if (!timestamp) {
      console.error("Cannot delete document: Missing timestamp");
      return;
    }
    const docToDelete = (historyRef.current || history || []).find(h => String(h.timestamp) === String(timestamp));
    showModal({
      title: "Delete Document",
      message: "Are you sure you want to delete this document? This will also remove it from your cloud backup.",
      type: "confirm",
      onConfirm: async () => {
        const list = historyRef.current && historyRef.current.length > 0 ? historyRef.current : (history || []);
        const updated = list.filter(h => String(h.timestamp) !== String(timestamp));
        historyRef.current = updated;
        setHistory(updated);
        safeSave("document_history", updated, user?.uid);
        seedReferenceHistoryFromDocumentHistory(updated);
        closeModal();
        const syncId = impersonatedUser ? impersonatedUser.id : user?.uid;
        if (syncId && docToDelete?.id) {
          deleteDocumentRecordFromCloud(syncId, docToDelete.id, timestamp).catch(e => console.warn("Notice deleting doc from cloud subcollection:", e));
        }
        await syncToCloudData(updated);
      }
    });
  };

  const handleUpdatePaymentStatus = (timestamp: number, newStatus: "pending" | "paid" | "overdue" | "due_soon") => {
    let updatedItem: DocumentHistoryItem | undefined;
    const list = historyRef.current && historyRef.current.length > 0 ? historyRef.current : (history || []);
    const updated = list.map(item => {
      if (String(item.timestamp) === String(timestamp)) {
        updatedItem = {
          ...item,
          paymentStatus: newStatus,
          status: newStatus === "paid" ? "Paid" : "Issued",
        };
        return updatedItem;
      }
      return item;
    });
    historyRef.current = updated;
    setHistory(updated);
    safeSave("document_history", updated, user?.uid);
    seedReferenceHistoryFromDocumentHistory(updated);

    const syncId = impersonatedUser ? impersonatedUser.id : user?.uid;
    if (syncId && updatedItem) {
      saveDocumentRecordToCloud(syncId, updatedItem).catch(e => console.warn("Notice updating payment status in cloud:", e));
    }
    syncToCloudData(updated);
  };

  const downloadPDF = async (doc: DocumentHistoryItem) => {
    if (doc.fullData) {
      setIsGenerating(true);
      try {
        // Merge current business letterhead/logo if missing in saved data
        const dataToGenerate = {
          ...doc.fullData,
          business: {
            ...doc.fullData.business,
            letterhead: doc.fullData.business.letterhead || business.letterhead,
            logo: doc.fullData.business.logo || business.logo,
            signature: doc.fullData.business.signature || business.signature,
          },
          layoutSettings: doc.fullData.layoutSettings || layoutSettings,
        };
        await downloadInvoicePDF(dataToGenerate);
      } finally {
        setIsGenerating(false);
      }
    } else {
      showModal({
        title: "Data Missing",
        message: "Full data not available for this document.",
        type: "info"
      });
    }
  };

  const clearHistory = () => {
    showModal({
      title: "Clear History",
      message: "Are you sure you want to clear all document history? This cannot be undone.",
      type: "confirm",
      onConfirm: async () => {
        setHistory([]);
        safeSave("document_history", [], user?.uid);
        closeModal();
        await syncToCloudData();
      }
    });
  };

  const clearAllLocalData = () => {
    showModal({
      title: "Clear All Local Data",
      message: "This will clear all locally saved data (Business Profile, Customers, Suppliers, History) for the current user. If you are logged in, your data will be restored from the cloud on next sync. Continue?",
      type: "confirm",
      onConfirm: () => {
        const keys = ["business_details", "saved_customers", "saved_suppliers", "document_history", "last_used_numbers", "price_history"];
        keys.forEach(k => localStorage.removeItem(getStorageKey(k, user?.uid)));
        
        // Reset state to defaults
        resetAllState();
        
        closeModal();
        showModal({
          title: "Success",
          message: "Local data cleared successfully.",
          type: "success"
        });
      }
    });
  };

  const exportData = async () => {
    const newDocs = history.filter(item => item.timestamp > lastExportTimestamp);
    
    if (newDocs.length === 0) {
      showModal({
        title: "No New Data",
        message: "There are no new documents created since the last export.",
        type: "info"
      });
      return;
    }

    showModal({
      title: "Exporting Data",
      message: `Preparing ${newDocs.length} documents for export. Please wait...`,
      type: "info"
    });

    try {
      const zip = new JSZip();
      const folder = zip.folder(`export-${new Date().toISOString().split('T')[0]}`);
      
      for (const item of newDocs) {
        if (item.fullData) {
          // Inject current business letterhead/logo/signature if missing in saved data
          const dataToGenerate = {
            ...item.fullData,
            business: {
              ...item.fullData.business,
              letterhead: item.fullData.business.letterhead || business.letterhead,
              logo: item.fullData.business.logo || business.logo,
              signature: item.fullData.business.signature || business.signature,
            },
            layoutSettings: item.fullData.layoutSettings || layoutSettings,
          };
          const doc = await generateInvoicePDF(dataToGenerate);
          const blob = doc.output('blob');
          const fileName = `${item.type.replace(/\s+/g, '_')}_${item.id}_${item.date}.pdf`;
          folder?.file(fileName, blob);
        }
      }

      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const a = document.createElement("a");
      a.href = url;
      a.download = `billing-app-export-${new Date().toISOString().split('T')[0]}.zip`;
      a.click();
      URL.revokeObjectURL(url);

      const now = Date.now();
      setLastExportTimestamp(now);
      safeSave("last_export_timestamp", now, user?.uid);

      closeModal();
      showModal({
        title: "Success",
        message: `${newDocs.length} documents exported successfully.`,
        type: "success"
      });
    } catch (error) {
      console.error("Export error:", error);
      closeModal();
      showModal({
        title: "Export Failed",
        message: "An error occurred while generating the export. Please try again.",
        type: "warning"
      });
    }
  };

  const importData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.business) {
          setBusiness(data.business);
          safeSave("business_details", data.business, user?.uid);
        }
        if (data.history) {
          setHistory(data.history);
          safeSave("document_history", data.history, user?.uid);
        }
        if (data.priceHistory) {
          setPriceHistory(data.priceHistory);
          safeSave("price_history", data.priceHistory, user?.uid);
        }
        if (data.savedCustomers) {
          setSavedCustomers(data.savedCustomers);
          safeSave("saved_customers", data.savedCustomers, user?.uid);
        }
        if (data.savedSuppliers) {
          setSavedSuppliers(data.savedSuppliers);
          safeSave("saved_suppliers", data.savedSuppliers, user?.uid);
        }
        showModal({
          title: "Success",
          message: "Data imported successfully!",
          type: "success"
        });
      } catch (err) {
        showModal({
          title: "Import Error",
          message: "Failed to import data. Invalid file format.",
          type: "warning"
        });
      }
    };
    reader.readAsText(file);
  };

  const autoGenerateNotes = async () => {
    setIsGenerating(true);
    try {
      const newNotes = await generateInvoiceNotes(items, business.name || "General");
      setNotes(newNotes);
      setIsNotesManuallyEdited(true);
    } finally {
      setIsGenerating(false);
    }
  };

  if (authLoading || isInitializingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-gray-400">Restoring session...</p>
        </div>
      </div>
    );
  }

  // Render Features Page if requested
  if (showFeatures) {
    return (
      <FeaturesPage
        onBackToHome={() => setShowFeatures(false)}
        onSignIn={() => {
          try { localStorage.setItem("billiq_has_entered_app", "true"); } catch {}
          setAuthInitialSignUp(false);
          setShowFeatures(false);
          setShowAuthScreen(true);
        }}
        onSignUp={() => {
          try { localStorage.setItem("billiq_has_entered_app", "true"); } catch {}
          setAuthInitialSignUp(true);
          setShowFeatures(false);
          setShowAuthScreen(true);
        }}
        onEnterDemo={() => {
          setAuthInitialSignUp(false);
          setShowFeatures(false);
          setShowAuthScreen(true);
        }}
        isLoggedIn={!!user}
      />
    );
  }

  // Render Auth screen ONLY IF explicitly requested
  if (showAuthScreen) {
    return (
      <Auth
        onSuccess={() => {
          try {
            localStorage.setItem("billiq_is_logged_in", "true");
            localStorage.setItem("billiq_has_entered_app", "true");
          } catch {}
          setShowAuthScreen(false);
          setShowLanding(false);
          setStep("dashboard");
        }}
        initialSignUp={authInitialSignUp}
        onBackToLanding={() => {
          setShowAuthScreen(false);
          setShowLanding(true);
        }}
      />
    );
  }

  // Strict Auth Guard: Unauthenticated visitors MUST NOT access inner app views
  if (!user) {
    return (
      <LandingPage
        onSignIn={() => {
          try { localStorage.setItem("billiq_has_entered_app", "true"); } catch {}
          setAuthInitialSignUp(false);
          setShowAuthScreen(true);
        }}
        onSignUp={() => {
          try { localStorage.setItem("billiq_has_entered_app", "true"); } catch {}
          setAuthInitialSignUp(true);
          setShowAuthScreen(true);
        }}
        onEnterDemo={() => {
          setAuthInitialSignUp(false);
          setShowLanding(false);
          setShowAuthScreen(true);
        }}
        onOpenFeatures={() => setShowFeatures(true)}
        isLoggedIn={false}
      />
    );
  }

  // Check if email verification is required for password-registered user accounts
  if (user && (() => {
    const lowerEmail = String(user.email || "").toLowerCase();
    if (lowerEmail === "support@billiq.site") return false;
    const isPhoneUser = user.providerData?.some(
      (p: any) => p?.providerId === "phone"
    );
    if (isPhoneUser) return false;
    if (user.emailVerified === true) return false;
    if (user.uid && sessionStorage.getItem(`verified_${user.uid}`) === "true") return false;
    return true;
  })()) {
    return (
      <EmailVerificationScreen
        userEmail={user.email || ""}
        onVerified={() => {
          if (auth?.currentUser) {
            setUser({ ...auth.currentUser });
          }
        }}
        onSignOut={async () => {
          purgeUnpartitionedCache(null);
          await logoutUser();
          setUser(null);
          setUserProfile(null);
          setImpersonatedUser(null);
          setShowLanding(true);
        }}
      />
    );
  }

  // Render Landing Page if logged in user explicitly requested it
  if (user && showLanding) {
    return (
      <LandingPage
        onSignIn={() => setShowLanding(false)}
        onSignUp={() => setShowLanding(false)}
        onEnterDemo={() => setShowLanding(false)}
        onOpenFeatures={() => setShowFeatures(true)}
        isLoggedIn={true}
        userEmail={user.email || ""}
      />
    );
  }

  // If Admin User is logged in, and Admin Console is active, and NOT impersonating
  if (isAdminUser(user) && isAdminConsoleActive && !impersonatedUser) {
    if (!isAdminPinVerified) {
      return (
        <div className="w-full min-h-screen bg-zinc-950 flex items-center justify-center p-4">
          <AdminPinModal
            isOpen={true}
            userEmail={user?.email || userProfile?.signupEmail || userProfile?.authEmail || "admin"}
            onSuccess={() => {
              setIsAdminPinVerified(true);
              setShowAdminPinModal(false);
            }}
            onCancel={() => {
              setIsAdminConsoleActive(false);
              setStep("dashboard");
              setShowAdminPinModal(false);
              if (user?.uid) {
                try {
                  localStorage.setItem(`billiq_user_${user.uid}_billiq_active_view`, "dashboard");
                  localStorage.setItem("billiq_active_view", "dashboard");
                } catch {}
              }
            }}
          />
        </div>
      );
    }

    return (
      <AdminDashboard
        adminUser={user}
        onImpersonateUser={handleImpersonateUser}
        onExitAdminView={() => {
          setIsAdminConsoleActive(false);
          setIsAdminPinVerified(false);
          setStep("dashboard");
          if (user?.uid) {
            try {
              localStorage.setItem(`billiq_user_${user.uid}_billiq_active_view`, "dashboard");
              localStorage.setItem("billiq_active_view", "dashboard");
            } catch {}
          }
        }}
        currentUserHistory={history}
        onUserUpdated={handleAdminUpdatedUser}
        currency={currency || business.currency || "INR"}
      />
    );
  }

  return (
    <div className="w-full min-h-screen bg-zinc-50 font-sans text-zinc-900 pb-20 selection:bg-brand-100 selection:text-brand-900">
      {/* Impersonation Banner */}
      {impersonatedUser && (
        <div className="bg-gradient-to-r from-amber-600 via-indigo-600 to-indigo-700 text-white px-4 py-2.5 text-xs font-bold flex flex-wrap items-center justify-between gap-2 shadow-lg sticky top-0 z-50">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-amber-200 animate-pulse" />
            <span>
              IMPERSONATING USER: <strong className="font-mono underline">{impersonatedUser.email || impersonatedUser.id}</strong> (Company: {impersonatedUser.business?.companyName || impersonatedUser.displayName || "N/A"})
            </span>
          </div>
          <button
            onClick={handleExitImpersonation}
            className="px-3 py-1 bg-zinc-950/80 hover:bg-zinc-900 text-amber-200 hover:text-white rounded-lg text-xs font-bold border border-amber-400/40 transition-all cursor-pointer"
          >
            Exit Impersonation & Return to Admin Console
          </button>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md border-b border-zinc-100 px-4 sm:px-6 md:px-8 lg:px-10 py-4">
        {isQuotaExceeded && (
          <div className="mb-4 -mx-4 sm:-mx-6 md:-mx-8 lg:-mx-10 -mt-4 bg-amber-50 border-b border-amber-200 px-4 sm:px-6 md:px-8 lg:px-10 py-2.5">
            <div className="w-full max-w-[1600px] mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5 sm:mt-0" />
                <div className="text-amber-900 text-xs font-semibold">
                  <span>Connection issue. Changes saved locally and will sync once reconnected.</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {isDeveloperAccount(impersonatedUser?.email || user?.email) && (
                  <a 
                    href="https://console.firebase.google.com/project/smart-bill-dd587/firestore/databases/ai-studio-9990095e-cbc6-4c8e-ade2-17ef7e3aa885/data?openUpgradeDialog=true" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="bg-amber-100 hover:bg-amber-200 text-amber-950 px-2.5 py-1 rounded text-xs font-bold transition-all whitespace-nowrap"
                  >
                    Manage Database
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setIsQuotaExceeded(false)}
                  className="text-amber-700 hover:text-amber-900 text-xs font-bold px-1 py-0.5 cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}
        <div className="w-full max-w-[1600px] mx-auto flex items-center justify-between gap-4">
          {/* Brand Logo */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Logo onClick={() => navigateToStep("dashboard")} />
          </motion.div>

          {/* Top Navigation Menu (Desktop) */}
          <nav className="hidden xl:flex items-center gap-1 bg-zinc-100/90 p-1 rounded-xl border border-zinc-200/80">
            <button
              onClick={() => navigateToStep("dashboard")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                step === "dashboard"
                  ? "bg-white text-brand-600 shadow-xs"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </button>
            <button
              onClick={() => navigateToStep("analytics")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                step === "analytics"
                  ? "bg-white text-brand-600 shadow-xs"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Analytics</span>
            </button>
            <button
              onClick={() => navigateToStep("history")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                step === "history"
                  ? "bg-white text-brand-600 shadow-xs"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>History</span>
            </button>
            <button
              onClick={() => navigateToStep("customers")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                step === "customers"
                  ? "bg-white text-brand-600 shadow-xs"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Customers</span>
            </button>
            <button
              onClick={() => navigateToStep("suppliers")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                step === "suppliers"
                  ? "bg-white text-brand-600 shadow-xs"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Suppliers</span>
            </button>
            <button
              onClick={() => navigateToStep("profile")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                step === "profile"
                  ? "bg-white text-brand-600 shadow-xs"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Profile & Settings</span>
            </button>
          </nav>

          {/* Right Group: Auto-save status, Country/Currency, New Bill CTA, User Sign Out */}
          <div className="flex items-center gap-2.5 shrink-0">
            {isAdminUser(user) && (
              <button
                type="button"
                onClick={() => {
                  if (impersonatedUser) {
                    handleExitImpersonation();
                  } else {
                    // ALWAYS prompt the PIN modal on every click to enter Admin Console
                    setShowAdminPinModal(true);
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Admin Console</span>
              </button>
            )}

            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setShowContactSupportModal(true);
              }}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-xs font-bold text-zinc-700 transition-colors border border-zinc-200 cursor-pointer"
              title="Contact Support"
            >
              <HelpCircle className="h-3.5 w-3.5 text-brand-600" />
              <span>Support</span>
            </button>

            {(() => {
              const activeUid = impersonatedUser ? impersonatedUser.id : user?.uid;
              const rawPlan = userProfile?.planTier || userProfile?.planName || userProfile?.plan;
              const planInfo = getPlanDetails(rawPlan);
              const isPaidTier = planInfo.isUnlimited || planInfo.tier === "enterprise" || planInfo.tier === "pro";
              const usedCount = getEffectiveLifetimeDocCount(userProfile, activeUid, (history || []).length);
              const bonusCredits = userProfile?.trialCreditsGranted || 0;
              const docLimit = (planInfo.documentLimit || 5) + bonusCredits;
              const remaining = userProfile?.documentsRemaining !== undefined
                ? userProfile.documentsRemaining
                : Math.max(0, docLimit - usedCount);
              const isAtLimit = !isPaidTier && remaining <= 0;

              let badgeText = "";
              if (planInfo.tier === "enterprise") {
                badgeText = "Enterprise Plan";
              } else if (planInfo.tier === "pro") {
                badgeText = "Pro Plan";
              } else if (isAtLimit) {
                badgeText = `Trial Expired (${usedCount}/${docLimit})`;
              } else if (bonusCredits > 0 || userProfile?.founderGrantNotice) {
                badgeText = `Bonus Free: ${remaining} Left`;
              } else {
                // Free Trial or unpaid tier: display counter (e.g. "Free Trial: 2/5")
                badgeText = `${planInfo.shortLabel}: ${remaining} Left`;
              }

              return (
                <button
                  onClick={() => {
                    if (isAtLimit) {
                      setShowTrialLimitModal(true);
                    } else {
                      setStep("profile");
                    }
                  }}
                  className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all border cursor-pointer ${
                    isAtLimit
                      ? "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                      : bonusCredits > 0 || userProfile?.founderGrantNotice
                      ? "bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100"
                      : `${planInfo.badgeBg} ${planInfo.badgeTextColor} ${planInfo.badgeBorderColor} ${planInfo.badgeHoverBg}`
                  }`}
                  title={bonusCredits > 0 ? `Founder Granted +${bonusCredits} Extra Docs! (${remaining} remaining)` : planInfo.description}
                >
                  {planInfo.tier === "enterprise" ? (
                    <Sparkles className="h-3.5 w-3.5 text-purple-600 animate-pulse" />
                  ) : planInfo.tier === "pro" ? (
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                  ) : bonusCredits > 0 ? (
                    <Gift className="h-3.5 w-3.5 text-amber-600" />
                  ) : (
                    <Zap className="h-3.5 w-3.5 text-amber-600" />
                  )}
                  <span>{badgeText}</span>
                </button>
              );
            })()}

            <Button 
              variant="primary" 
              size="sm"
              onClick={handleNewDocument}
              className="bg-brand-600 hover:bg-brand-700 text-white font-bold shadow-xs"
            >
              <Plus className="h-4 w-4 sm:mr-1.5" />
              <span className="hidden sm:inline">New Bill</span>
              <span className="sm:hidden">Bill</span>
            </Button>

            {user && (
              <div className="flex items-center gap-2 pl-2 border-l border-zinc-200">
                <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-100 text-xs font-medium text-zinc-700">
                  <UserIcon className="w-3.5 h-3.5 text-brand-600" />
                  <span className="max-w-[120px] truncate font-semibold">
                    {impersonatedUser
                      ? (impersonatedUser.displayName || impersonatedUser.username || impersonatedUser.email?.split('@')[0] || impersonatedUser.business?.companyName || "User")
                      : (user.displayName || user.email?.split('@')[0])}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold transition-colors border border-red-200 cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 lg:px-10 py-6 sm:py-8 pb-24 sm:pb-8">
        {step !== "invoice" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Vertical Navigation Sidebar */}
            <aside className="lg:col-span-3 xl:col-span-2.5 bg-white p-3.5 rounded-2xl border border-zinc-200/80 shadow-xs space-y-1.5 lg:sticky lg:top-20">
              <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-widest text-zinc-400">
                Navigation
              </div>

              <button
                onClick={() => navigateToStep("dashboard")}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                  step === "dashboard"
                    ? "bg-brand-600 text-white shadow-md shadow-brand-500/20"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                }`}
              >
                <LayoutDashboard className="w-4 h-4 shrink-0" />
                <span>Dashboard</span>
              </button>

              <button
                onClick={() => navigateToStep("analytics")}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                  step === "analytics"
                    ? "bg-brand-600 text-white shadow-md shadow-brand-500/20"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                }`}
              >
                <BarChart3 className="w-4 h-4 shrink-0" />
                <span>Analytics</span>
              </button>

              <button
                onClick={() => navigateToStep("history")}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                  step === "history"
                    ? "bg-brand-600 text-white shadow-md shadow-brand-500/20"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                }`}
              >
                <Clock className="w-4 h-4 shrink-0" />
                <span>History</span>
              </button>

              <button
                onClick={() => navigateToStep("customers")}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                  step === "customers"
                    ? "bg-brand-600 text-white shadow-md shadow-brand-500/20"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                }`}
              >
                <Users className="w-4 h-4 shrink-0" />
                <span>Customers</span>
              </button>

              <button
                onClick={() => navigateToStep("suppliers")}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                  step === "suppliers"
                    ? "bg-brand-600 text-white shadow-md shadow-brand-500/20"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                }`}
              >
                <Truck className="w-4 h-4 shrink-0" />
                <span>Suppliers</span>
              </button>

              <div className="my-2 border-t border-zinc-100" />

              <button
                onClick={() => navigateToStep("profile")}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                  step === "profile"
                    ? "bg-brand-600 text-white shadow-md shadow-brand-500/20"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                }`}
              >
                <Settings className="w-4 h-4 shrink-0" />
                <span>Profile & Settings</span>
              </button>

              <button
                onClick={handleNewDocument}
                className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold transition-all shadow-md shadow-brand-500/20 mt-3 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Bill</span>
              </button>
            </aside>

            {/* Right Main Content View Area */}
            <div className="lg:col-span-9 xl:col-span-9.5">
              {/* Founder Free Documents Gift Banner */}
              {userProfile?.documentsRemaining !== undefined && userProfile.documentsRemaining > 0 && (userProfile?.trialCreditsGranted || userProfile?.founderGrantNotice) && (
                <div className="w-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white p-4 rounded-2xl shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 border border-amber-300/40">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 shadow-inner">
                      <Sparkles className="w-5 h-5 text-amber-100" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-wider bg-white/25 px-2 py-0.5 rounded-full text-white">
                          Special Gift from Founder
                        </span>
                        <span className="text-xs font-bold text-amber-100">
                          {userProfile.documentsRemaining} Free {userProfile.documentsRemaining === 1 ? "Document" : "Documents"} Available
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm font-extrabold text-white mt-0.5">
                        🎉 Hurray! Founder gave you {userProfile.trialCreditsGranted || userProfile.founderGrantNotice?.grantedCount || 5} docs creation for free! Enjoy creating your invoices.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      handleNewDocument();
                      setStep("invoice");
                    }}
                    className="px-4 py-2 bg-white hover:bg-amber-50 text-amber-900 rounded-xl text-xs font-black shadow-md transition-all cursor-pointer whitespace-nowrap self-start sm:self-auto shrink-0 flex items-center gap-1.5"
                  >
                    <span>Create Document Now</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <AnimatePresence mode="wait">
                {step === "dashboard" ? (
                  <motion.div
                    key="dashboard"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                  >
                    <Dashboard 
                      history={history} 
                      priceHistory={priceHistory}
                      customers={savedCustomers} 
                      suppliers={savedSuppliers} 
                      industry={business.industry}
                      letterhead={business.letterhead}
                      currency={currency || business.currency || "INR"}
                      onNavigate={(s) => navigateToStep(s as any)}
                      onOpenDocument={loadDocument}
                      onDownloadPDF={downloadPDF}
                      onDeleteDocument={deleteDocument}
                      onClearHistory={clearHistory}
                      onViewAll={() => navigateToStep("history")}
                      onUpdatePaymentStatus={handleUpdatePaymentStatus}
                    />
                  </motion.div>
                ) : step === "analytics" ? (
                  <motion.div
                    key="analytics"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                  >
                    <AnalyticsView 
                      history={history}
                      customers={savedCustomers}
                      currency={currency || business.currency || "INR"}
                      onOpenDocument={loadDocument}
                      onNavigate={(s) => navigateToStep(s as any)}
                      onNewBill={handleNewDocument}
                    />
                  </motion.div>
                ) : step === "history" ? (
            <motion.div
              key="history"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <HistoryList 
                history={history}
                onOpenDocument={loadDocument}
                onDownloadPDF={downloadPDF}
                onDeleteDocument={deleteDocument}
                onUpdatePaymentStatus={handleUpdatePaymentStatus}
                onBack={() => setStep("dashboard")}
              />
            </motion.div>
          ) : step === "customers" ? (
            <motion.div
              key="customers"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <PartyList 
                title="Customers" 
                parties={savedCustomers} 
                taxLabel={getCountryConfig(business.country || countryOfOrigin || "India").taxLabel}
                onRemove={(id) => {
                  setSavedCustomers(prev => prev.filter(c => c.id !== id));
                }}
                onAdd={(party) => {
                  const updated = [...savedCustomers, party];
                  setSavedCustomers(updated);
                  safeSave("saved_customers", updated, user?.uid);
                }}
                onUpdate={(party) => {
                  const updated = savedCustomers.map(c => c.id === party.id ? party : c);
                  setSavedCustomers(updated);
                  safeSave("saved_customers", updated, user?.uid);
                }}
                type="customer"
              />
            </motion.div>
          ) : step === "suppliers" ? (
            <motion.div
              key="suppliers"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <PartyList 
                title="Suppliers" 
                parties={savedSuppliers} 
                taxLabel={getCountryConfig(business.country || countryOfOrigin || "India").taxLabel}
                onRemove={(id) => {
                  setSavedSuppliers(prev => prev.filter(c => c.id !== id));
                }}
                onAdd={(party) => {
                  const updated = [...savedSuppliers, party];
                  setSavedSuppliers(updated);
                  safeSave("saved_suppliers", updated, user?.uid);
                }}
                onUpdate={(party) => {
                  const updated = savedSuppliers.map(s => s.id === party.id ? party : s);
                  setSavedSuppliers(updated);
                  safeSave("saved_suppliers", updated, user?.uid);
                }}
                type="supplier"
              />
            </motion.div>
          ) : step === "profile" ? (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <Card>
                <div className="p-6 border-b border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-50/50 rounded-t-2xl">
                  <div>
                    <h2 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-brand-600" />
                      Business Profile & Settings
                    </h2>
                    <p className="text-xs text-zinc-500 font-medium mt-0.5">
                      Configure your official company details, tax defaults, and PDF styling options.
                    </p>
                  </div>
                </div>
                <CardContent className="space-y-6 pt-6">
                  {/* Account Credentials (Clean 2-Column Grid directly above Business Name) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input 
                      label="Account Email" 
                      value={userProfile?.signupEmail || userProfile?.authEmail || user?.email || "No Email"} 
                      disabled={true}
                      readOnly={true}
                      className="bg-zinc-100/80 text-zinc-500 cursor-not-allowed select-none border-zinc-200"
                    />
                    <Input 
                      label="Account Username" 
                      value={userProfile?.username || userProfile?.authUsername || userProfile?.displayName || user?.displayName || (user?.email ? user.email.split('@')[0] : "User")} 
                      disabled={true}
                      readOnly={true}
                      className="bg-zinc-100/80 text-zinc-500 cursor-not-allowed select-none border-zinc-200"
                    />
                  </div>

                  {/* Real-Time Subscription Plan Status Banner */}
                  {(() => {
                    const activeUid = impersonatedUser ? impersonatedUser.id : user?.uid;
                    const planInfo = getPlanDetails(userProfile?.planTier || userProfile?.plan);
                    const usedCount = getEffectiveLifetimeDocCount(userProfile, activeUid, (history || []).length);
                    return (
                      <div className="p-4 sm:p-5 rounded-2xl border border-zinc-200 bg-gradient-to-r from-zinc-50 via-white to-zinc-50 shadow-xs space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-200/80">
                          <div className="flex items-center gap-2.5">
                            <div className={`p-2 rounded-xl ${planInfo.badgeBg} ${planInfo.badgeBorderColor} border`}>
                              {planInfo.tier === "enterprise" ? (
                                <Sparkles className="w-5 h-5 text-purple-600 animate-pulse" />
                              ) : planInfo.tier === "pro" ? (
                                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                              ) : (
                                <Zap className="w-5 h-5 text-amber-600" />
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400">Subscription Plan Status</span>
                                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                  Real-Time Sync Active
                                </span>
                              </div>
                              <h4 className="text-base font-black text-zinc-900 mt-0.5">{planInfo.badgeText}</h4>
                            </div>
                          </div>

                          <span className={`px-3 py-1.5 rounded-xl text-xs font-black border ${planInfo.badgeBg} ${planInfo.badgeTextColor} ${planInfo.badgeBorderColor}`}>
                            {userProfile?.planTier || userProfile?.plan || "Free Trial"}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                          <div>
                            <span className="text-xs font-bold text-zinc-500">Document Usage Limit:</span>
                            <p className="text-xs font-black text-zinc-800 mt-0.5">
                              {planInfo.isUnlimited ? (
                                <span className="text-emerald-700 font-extrabold flex items-center gap-1">
                                  <ShieldCheck className="w-4 h-4 text-emerald-600 inline" />
                                  Unlimited Document Creation Unlocked
                                </span>
                              ) : (
                                <span>{usedCount} of {planInfo.documentLimit} Documents Created</span>
                              )}
                            </p>
                          </div>

                          <div>
                            <span className="text-xs font-bold text-zinc-500">Document Edit Policy:</span>
                            <p className="text-xs text-zinc-600 mt-0.5 font-semibold">
                              {planInfo.isUnlimited || planInfo.tier === "pro" || planInfo.tier === "enterprise"
                                ? "Pro Tier: Up to 2 free edits per document included without quota consumption."
                                : "Free Tier: 1 free edit per document included. Subsequent edits consume 1 document credit against your 5-doc limit."}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input 
                      label="Business Name" 
                      value={business.name} 
                      onChange={(e) => handleBusinessChange({ name: e.target.value })}
                      placeholder="e.g. Acme Industrial Traders"
                      error={businessErrors.name}
                    />
                    {/* Industry / Business Line Selector Dropdown */}
                    <div>
                      <label className="block text-xs font-extrabold text-zinc-500 uppercase tracking-widest mb-1.5 ml-1 flex items-center justify-between">
                        <span>Industry / Business Line</span>
                        <span className="text-[10px] text-brand-700 font-bold bg-brand-50 border border-brand-200 px-2 py-0.5 rounded-md">
                          Select Industry
                        </span>
                      </label>
                      <select
                        value={
                          BUSINESS_INDUSTRIES.some(i => i.value === business.industry)
                            ? business.industry
                            : (business.industry ? "Other" : "")
                        }
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === "Other") {
                            handleBusinessChange({ industry: "Custom / Other Industry" });
                          } else {
                            handleBusinessChange({ industry: val });
                          }
                        }}
                        className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl text-sm font-semibold text-zinc-800 focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 hover:border-zinc-300 transition-all duration-200 cursor-pointer shadow-sm"
                      >
                        <option value="" disabled>-- Select Your Industry / Business Line --</option>
                        {BUSINESS_INDUSTRIES.map((ind) => (
                          <option key={ind.value} value={ind.value} className="text-zinc-900 font-medium py-1">
                            {ind.icon} {ind.label}
                          </option>
                        ))}
                        <option value="Other" className="text-zinc-900 font-medium py-1">
                          ✏️ Other / Custom Industry...
                        </option>
                      </select>

                      {/* Custom text input if 'Other' or a non-predefined custom industry is set */}
                      {(business.industry === "Custom / Other Industry" || (!BUSINESS_INDUSTRIES.some(i => i.value === business.industry) && business.industry)) && (
                        <div className="mt-2">
                          <input
                            type="text"
                            value={business.industry === "Custom / Other Industry" ? "" : business.industry || ""}
                            onChange={(e) => handleBusinessChange({ industry: e.target.value || "Custom / Other Industry" })}
                            placeholder="Type custom industry name (e.g. Fine Chemicals, Aerospace)..."
                            className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium text-zinc-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                          />
                        </div>
                      )}
                    </div>

                    {/* Country / Region */}
                    <div>
                      <label className="block text-xs font-extrabold text-zinc-500 uppercase tracking-widest mb-1.5 ml-1">
                        Country / Region
                      </label>
                      <select
                        value={business.country || countryOfOrigin || "India"}
                        onChange={(e) => {
                          const selectedCountry = e.target.value;
                          const config = getCountryConfig(selectedCountry);
                          
                          handleBusinessChange({
                            country: selectedCountry,
                            currency: config.currencyCode,
                            taxSystem: config.taxSystem,
                            state: "" // Clear state when switching country so new country state suggestions apply cleanly
                          });
                          setCountryOfOrigin(selectedCountry);
                          setCurrency(config.currencyCode);
                          
                          // Apply new country default tax rate to existing line items
                          setItems(prevItems => prevItems.map(item => ({
                            ...item,
                            taxRate: config.defaultTaxRate
                          })));
                        }}
                        className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl text-sm font-medium text-zinc-800 focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 hover:border-zinc-300 transition-all duration-200"
                      >
                        {COUNTRIES.map((c) => (
                          <option key={c.name} value={c.name} className="text-zinc-900 font-medium">
                            {c.flag} {c.name} ({c.currencyCode})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* State / Region (Country-dependent recommendations) */}
                    <div>
                      <label className="block text-xs font-extrabold text-zinc-500 uppercase tracking-widest mb-1.5 ml-1 flex items-center justify-between">
                        <span>State / Region</span>
                        <span className="text-[10px] text-zinc-400 font-normal">
                          {getCountryConfig(business.country || countryOfOrigin || "India").name} States
                        </span>
                      </label>
                      <input
                        list="business-state-opts"
                        value={business.state || ""}
                        onChange={(e) => handleBusinessChange({ state: e.target.value })}
                        placeholder={`e.g. ${getCountryConfig(business.country || countryOfOrigin || "India").states[0]?.name || "State / Region"}`}
                        className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl text-sm font-medium text-zinc-800 focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 hover:border-zinc-300 placeholder:text-zinc-300 transition-all duration-200"
                      />
                      <datalist id="business-state-opts">
                        {getCountryConfig(business.country || countryOfOrigin || "India").states.map((st) => (
                          <option key={st.code || st.name} value={st.name}>
                            {st.name} {st.code ? `(${st.code})` : ''}
                          </option>
                        ))}
                      </datalist>
                    </div>

                    {/* Invoice Currency */}
                    <div>
                      <label className="block text-xs font-extrabold text-zinc-500 uppercase tracking-widest mb-1.5 ml-1">
                        Invoice Currency
                      </label>
                      <select
                        value={business.currency || currency || "INR"}
                        onChange={(e) => {
                          const newCurr = e.target.value;
                          setCurrency(newCurr);
                          handleBusinessChange({ currency: newCurr });
                        }}
                        className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl text-sm font-medium text-zinc-800 focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 hover:border-zinc-300 transition-all duration-200"
                      >
                        {ALL_CURRENCIES.map((c) => (
                          <option key={c.code} value={c.code} className="text-zinc-900 font-medium">
                            {c.symbol} {c.code} - {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Tax ID */}
                    <Input 
                      label={getCountryConfig(business.country || countryOfOrigin || "India").taxLabel} 
                      value={business.gstin} 
                      onChange={(e) => handleBusinessChange({ gstin: e.target.value })}
                      placeholder={`e.g. ${getCountryConfig(business.country || countryOfOrigin || "India").taxLabel}`}
                      error={businessErrors.gstin}
                    />

                    <div className="md:col-span-2">
                      <Input 
                        label="Address" 
                        value={business.address} 
                        onChange={(e) => handleBusinessChange({ address: e.target.value })}
                        placeholder="Full business address"
                      />
                    </div>
                    <Input 
                      label="Phone" 
                      value={business.phone} 
                      onChange={(e) => handleBusinessChange({ phone: e.target.value })}
                      placeholder="e.g. +1 (555) 019-2834"
                      error={businessErrors.phone}
                    />
                    <Input 
                      label="Company Email (for Invoices)" 
                      value={business.email || ""} 
                      onChange={(e) => handleBusinessChange({ email: e.target.value })}
                      placeholder="e.g. billing@company.com"
                      error={businessErrors.email}
                    />
                    <div className="md:col-span-2">
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider">Business Logo (Optional)</label>
                        <span className="text-[10px] text-zinc-400 font-medium">Max size: 1 MB</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <input 
                            type="file" 
                            accept="image/*"
                            className="hidden" 
                            id="logo-upload"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                if (file.size > 1024 * 1024) {
                                  setLogoError(`Logo image size (${(file.size / (1024 * 1024)).toFixed(2)} MB) exceeds the 1 MB maximum limit.`);
                                  e.target.value = "";
                                  return;
                                }
                                setLogoError(null);
                                const reader = new FileReader();
                                reader.onloadend = async () => {
                                  // Optimize logo size to keep it sharp and clear in printing without bloat
                                  const compressed = await compressImage(reader.result as string, 400, 400, 0.90, 'image/png');
                                  handleBusinessChange({ logo: compressed });
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                          <label 
                            htmlFor="logo-upload"
                            className={`flex items-center justify-center gap-2 p-4 border-2 border-dashed ${logoError ? 'border-rose-300 bg-rose-50/50' : 'border-zinc-200'} rounded-xl transition-colors cursor-pointer hover:bg-zinc-50`}
                          >
                            <Building2 className="h-5 w-5 text-zinc-400" />
                            <span className="text-sm font-semibold text-zinc-600">
                              {business.logo ? "Change Logo" : "Upload Logo"}
                            </span>
                          </label>
                        </div>
                        {business.logo && (
                          <div className="relative w-20 h-20 border border-zinc-200 rounded-lg overflow-hidden group bg-white">
                            <img src={business.logo} className="w-full h-full object-contain" alt="Logo Preview" />
                            <button 
                              onClick={() => {
                                handleBusinessChange({ logo: undefined });
                                setLogoError(null);
                              }}
                              className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 className="h-4 w-4 text-white" />
                            </button>
                          </div>
                        )}
                      </div>
                      {logoError && (
                        <p className="text-xs font-medium text-rose-600 mt-2 flex items-center gap-1.5">
                          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                          {logoError}
                        </p>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider">COMPANY LETTERHEAD (PORTRAIT ONLY - HIGHLY RECOMMENDED)</label>
                        <span className="text-[10px] text-zinc-400 font-medium">Max size: 1 MB</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <input 
                            type="file" 
                            accept="image/*"
                            className="hidden" 
                            id="letterhead-upload"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                if (file.size > 1024 * 1024) {
                                  setLetterheadError(`Letterhead image size (${(file.size / (1024 * 1024)).toFixed(2)} MB) exceeds the 1 MB maximum limit.`);
                                  e.target.value = "";
                                  return;
                                }
                                setLetterheadError(null);
                                const reader = new FileReader();
                                reader.onloadend = async () => {
                                  // Keep high-resolution letterhead sharp and clear for A4 paper print
                                  const compressed = await compressImage(reader.result as string, 2000, 2800, 0.90, 'image/png');
                                  handleBusinessChange({ letterhead: compressed });
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                          <label 
                            htmlFor="letterhead-upload"
                            className={`flex items-center justify-center gap-2 p-4 border-2 border-dashed ${letterheadError ? 'border-rose-300 bg-rose-50/50' : 'border-zinc-200'} rounded-xl transition-colors cursor-pointer hover:bg-zinc-50`}
                          >
                            <Building2 className="h-5 w-5 text-zinc-400" />
                            <span className="text-sm font-semibold text-zinc-600">
                              {business.letterhead ? "Change Letterhead Image" : "Upload Letterhead Image"}
                            </span>
                          </label>
                        </div>
                        {business.letterhead && (
                          <div className="relative w-20 h-20 border border-zinc-200 rounded-lg overflow-hidden group">
                            <img src={business.letterhead} className="w-full h-full object-cover" alt="Letterhead Preview" />
                            <button 
                              onClick={() => {
                                handleBusinessChange({ letterhead: undefined });
                                setLetterheadError(null);
                              }}
                              className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 className="h-4 w-4 text-white" />
                            </button>
                          </div>
                        )}
                      </div>
                      <p className="text-[10px] text-zinc-400 mt-2">Upload a full A4 size image (or header/footer) to be used as background. Max limit: 1 MB.</p>
                      {letterheadError && (
                        <p className="text-xs font-medium text-rose-600 mt-2 flex items-center gap-1.5">
                          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                          {letterheadError}
                        </p>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider">Authorized Signature (Optional)</label>
                        <span className="text-[10px] text-zinc-400 font-medium">Max size: 1 MB</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <input 
                            type="file" 
                            accept="image/*"
                            className="hidden" 
                            id="signature-upload"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                if (file.size > 1024 * 1024) {
                                  setSignatureError(`Signature image size (${(file.size / (1024 * 1024)).toFixed(2)} MB) exceeds the 1 MB maximum limit.`);
                                  e.target.value = "";
                                  return;
                                }
                                setSignatureError(null);
                                const reader = new FileReader();
                                reader.onloadend = async () => {
                                  // Use smart processor for signatures
                                  const processed = await processSignature(reader.result as string);
                                  handleBusinessChange({ signature: processed });
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                          <label 
                            htmlFor="signature-upload"
                            className={`flex items-center justify-center gap-2 p-4 border-2 border-dashed ${signatureError ? 'border-rose-300 bg-rose-50/50' : 'border-zinc-200'} rounded-xl transition-colors cursor-pointer hover:bg-zinc-50`}
                          >
                            <FileText className="h-5 w-5 text-zinc-400" />
                            <span className="text-sm font-semibold text-zinc-600">
                              {business.signature ? "Change Signature" : "Upload Signature"}
                            </span>
                          </label>
                        </div>
                        {business.signature && (
                          <div className="relative w-32 h-16 border border-zinc-200 rounded-lg overflow-hidden group bg-white p-1.5 flex items-center justify-center">
                            <img src={business.signature} className="max-h-12 max-w-[110px] w-auto h-auto object-contain" alt="Signature Preview" />
                            <button 
                              onClick={() => {
                                handleBusinessChange({ signature: undefined });
                                setSignatureError(null);
                              }}
                              className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 className="h-4 w-4 text-white" />
                            </button>
                          </div>
                        )}
                      </div>
                      <p className="text-[10px] text-zinc-400 mt-2">Upload a clear image of your signature on a white background. Max limit: 1 MB.</p>
                      {signatureError && (
                        <p className="text-xs font-medium text-rose-600 mt-2 flex items-center gap-1.5">
                          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                          {signatureError}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="pt-6 border-t border-zinc-100 space-y-4">
                    <h4 className="text-xs font-bold text-zinc-400 uppercase">Bank Details (Optional)</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                      <Input 
                        label="Bank Name" 
                        value={business.bankName || ""} 
                        onChange={(e) => handleBusinessChange({ bankName: e.target.value })}
                        placeholder="e.g. HDFC Bank"
                      />
                      <Input 
                        label="Account Number" 
                        value={business.accountNumber || ""} 
                        onChange={(e) => handleBusinessChange({ accountNumber: e.target.value })}
                        placeholder="e.g. 50100012345678"
                      />
                      <Input 
                        label="IFSC Code" 
                        value={business.ifscCode || ""} 
                        onChange={(e) => handleBusinessChange({ ifscCode: e.target.value })}
                        placeholder="e.g. HDFC0001234"
                      />
                      <Input 
                        label="Branch Code / SWIFT" 
                        value={business.branchCode || ""} 
                        onChange={(e) => handleBusinessChange({ branchCode: e.target.value })}
                        placeholder="e.g. BR001 / HDFCINBB"
                      />
                    </div>

                    <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200/80 space-y-2.5">
                      <div className="flex justify-between items-center flex-wrap gap-2">
                        <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">
                          Show Bank Details In Documents:
                        </label>
                        <div className="flex gap-2 text-xs font-bold">
                          <button
                            type="button"
                            onClick={() => handleBusinessChange({ showBankDetailsInDocs: [...DOCUMENT_TYPE_OPTIONS] })}
                            className="text-brand-600 hover:underline uppercase text-[10px]"
                          >
                            Select All
                          </button>
                          <span className="text-zinc-300">|</span>
                          <button
                            type="button"
                            onClick={() => handleBusinessChange({ showBankDetailsInDocs: [] })}
                            className="text-zinc-500 hover:underline uppercase text-[10px]"
                          >
                            Clear All
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 pt-1">
                        {DOCUMENT_TYPE_OPTIONS.map((docOpt) => {
                          const selectedDocs = business.showBankDetailsInDocs ?? DOCUMENT_TYPE_OPTIONS;
                          const isChecked = selectedDocs.includes(docOpt);
                          return (
                            <button
                              type="button"
                              key={docOpt}
                              onClick={() => {
                                let updated: DocumentType[];
                                if (isChecked) {
                                  updated = selectedDocs.filter(d => d !== docOpt);
                                } else {
                                  updated = [...selectedDocs, docOpt];
                                }
                                handleBusinessChange({ showBankDetailsInDocs: updated });
                              }}
                              className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                                isChecked 
                                  ? "bg-zinc-900 text-white border-zinc-900 shadow-sm" 
                                  : "bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-100"
                              }`}
                            >
                              <span className={`w-2 h-2 rounded-full ${isChecked ? "bg-emerald-400" : "bg-zinc-300"}`} />
                              {docOpt}
                            </button>
                          );
                        })}
                      </div>
                      <p className="text-[10px] text-zinc-400 font-medium">
                        Bank details will ONLY be printed on PDF outputs for the selected document types above.
                      </p>
                    </div>
                  </div>

                  <div className="pt-8 border-t border-zinc-100">
                    <PDFCustomizer 
                      settings={layoutSettings}
                      onChange={(newSettings) => {
                        setLayoutSettings(newSettings);
                        safeSave("pdf_layout_settings", newSettings, user?.uid);
                      }}
                    />
                  </div>

                  <div className="pt-6 border-t border-zinc-100 flex flex-col sm:flex-row items-center gap-4">
                    <Button 
                      onClick={handleSaveSettings}
                      disabled={isSavingSettings}
                      className="w-full sm:w-auto bg-brand-600 hover:bg-brand-700 text-white font-bold px-8 py-3 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                      {isSavingSettings ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Saving Settings...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4" />
                          Save Settings & Business Profile
                        </>
                      )}
                    </Button>
                    
                    {settingsSavedToast && (
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-4 py-2.5 rounded-xl flex items-center gap-2 animate-in fade-in duration-200">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                        Settings & Business Profile saved successfully!
                      </span>
                    )}
                  </div>

                  <div className="pt-4 border-t border-zinc-100">
                    <Button 
                      variant="outline" 
                      onClick={handleLogout}
                      className="w-full mb-6 border-red-100 text-red-600 hover:bg-red-50"
                    >
                      <LogIn className="mr-2 h-4 w-4 rotate-180" />
                      Sign Out
                    </Button>
                  </div>



                    <h4 className="text-xs font-bold text-zinc-400 uppercase mb-4">Local Data Management</h4>
                    <div className="flex flex-wrap gap-4">
                      <Button variant="outline" onClick={exportData}>
                        <Download className="mr-2 h-4 w-4" />
                        Export All Data (Backup)
                      </Button>
                    </div>
                    <p className="text-[10px] text-zinc-400 mt-2">Export your data regularly to keep it safe for years.</p>



                  <div className="pt-8 border-t border-zinc-100">
                    <h4 className="text-xs font-bold text-zinc-400 uppercase mb-4 text-center">Legal & Privacy</h4>
                    <div className="flex justify-center gap-6">
                      <button 
                        onClick={() => setStep("privacy")}
                        className="text-xs font-bold text-zinc-600 hover:text-brand-600 transition-colors flex items-center gap-1"
                      >
                        <Shield className="h-3 w-3" />
                        Privacy Policy
                      </button>
                      <button 
                        onClick={() => setStep("terms")}
                        className="text-xs font-bold text-zinc-600 hover:text-indigo-600 transition-colors flex items-center gap-1"
                      >
                        <Scale className="h-3 w-3" />
                        Terms & Conditions
                      </button>
                    </div>
                    <p className="text-[10px] text-zinc-400 text-center mt-4">
                      Compliant with Information Technology Act, 2000 and DPDP Act, 2023 of India.
                    </p>
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button onClick={() => {
                      setStep("invoice");
                    }}>
                      Save & Continue
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ) : step === "privacy" ? (
            <PrivacyPolicy onBack={() => setStep("profile")} />
          ) : step === "terms" ? (
            <TermsAndConditions onBack={() => setStep("profile")} />
          ) : step === "cookie" ? (
            <CookiePolicy onBack={() => setStep("profile")} />
          ) : step === "compliance" ? (
            <TaxCompliance onBack={() => setStep("dashboard")} />
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  )}

  {step === "invoice" && (
    <AnimatePresence mode="wait">
      <motion.div
        key="invoice"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="space-y-6"
      >
        {/* Founder Free Documents Gift Banner inside Invoice workspace */}
        {userProfile?.documentsRemaining !== undefined && userProfile.documentsRemaining > 0 && (userProfile?.trialCreditsGranted || userProfile?.founderGrantNotice) && (
          <div className="w-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white px-4 py-3 rounded-2xl shadow-md flex items-center justify-between gap-3 border border-amber-300/40">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-amber-100" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-extrabold text-white">
                  🎉 Hurray! Founder gave you {userProfile.trialCreditsGranted || userProfile.founderGrantNotice?.grantedCount || 5} docs creation for free! ({userProfile.documentsRemaining} documents remaining)
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Back to dashboard header CTA inside invoice mode */}
        <div className="flex items-center justify-between pb-2 border-b border-zinc-200/60">
          <button
            onClick={() => setStep("dashboard")}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-600 hover:text-brand-600 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>
          <div className="text-xs text-zinc-400 font-semibold">
            Creating & Editing Document
          </div>
        </div>
              {/* AI Auto Line Item Batch Editor */}
              <BulkEditor 
                items={items}
                docType={docType}
                currency={currency}
                docContext={{
                  customer,
                  notes,
                  terms,
                  incoterms: {
                    code: incotermRule,
                    location: incotermNamedPlace,
                    origin: incotermCountryOfOrigin,
                    destination: incotermCountryOfDestination,
                    freightTerms: incotermFreightTerms,
                    insuranceDetails: incotermInsuranceDetails,
                  },
                  countryOfOrigin,
                  countryOfDestination,
                  poNumber,
                  paymentTerms,
                  freightAmount,
                  packagingAmount,
                }}
                onApply={(newItems, _explanation, docUpdates) => {
                  const markedItems = markEditedLineItems(items, newItems);
                  setItems(markedItems);
                  if (docUpdates && typeof docUpdates === "object") {
                    if (docUpdates.customer && typeof docUpdates.customer === "object") {
                      setCustomer(prev => ({ ...prev, ...docUpdates.customer }));
                    }
                    if (typeof docUpdates.notes === "string") setNotes(docUpdates.notes);
                    if (typeof docUpdates.terms === "string") setTerms(docUpdates.terms);
                    if (typeof docUpdates.poNumber === "string") setPoNumber(docUpdates.poNumber);
                    if (typeof docUpdates.paymentTerms === "string") setPaymentTerms(docUpdates.paymentTerms);
                    if (typeof docUpdates.paymentMode === "string") setPaymentMode(docUpdates.paymentMode);
                    if (typeof docUpdates.countryOfOrigin === "string") setCountryOfOrigin(docUpdates.countryOfOrigin);
                    if (typeof docUpdates.countryOfDestination === "string") setCountryOfDestination(docUpdates.countryOfDestination);
                    if (typeof docUpdates.freightAmount === "number") setFreightAmount(docUpdates.freightAmount);
                    if (typeof docUpdates.packagingAmount === "number") setPackagingAmount(docUpdates.packagingAmount);
                    if (typeof docUpdates.isTaxEnabled === "boolean") setIsTaxEnabled(docUpdates.isTaxEnabled);
                    if (typeof docUpdates.isExport === "boolean") setIsExport(docUpdates.isExport);
                    if (typeof docUpdates.currency === "string") setCurrency(docUpdates.currency);
                    
                    if (typeof docUpdates.incotermCode === "string") setIncotermRule(docUpdates.incotermCode);
                    if (typeof docUpdates.incotermRule === "string") setIncotermRule(docUpdates.incotermRule);
                    if (typeof docUpdates.incotermLocation === "string") setIncotermNamedPlace(docUpdates.incotermLocation);
                    if (typeof docUpdates.incotermNamedPlace === "string") setIncotermNamedPlace(docUpdates.incotermNamedPlace);
                    if (typeof docUpdates.incotermCountryOfOrigin === "string") setIncotermCountryOfOrigin(docUpdates.incotermCountryOfOrigin);
                    if (typeof docUpdates.incotermCountryOfDestination === "string") setIncotermCountryOfDestination(docUpdates.incotermCountryOfDestination);
                  }
                }}
              />

              {/* QA Report Specific Sections */}
              {false && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="space-y-6"
                >
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowQAImportModal(true)}
                      className="flex items-center gap-2 border-brand-200 text-brand-700 hover:bg-brand-50 font-bold"
                    >
                      <History size={14} />
                      Import from Quotation/Invoice
                    </Button>
                  </div>

                  <Card>
                    <CardHeader title="1. PROJECT OVERVIEW & COMPLIANCE" />
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input 
                        label="Scope of Work" 
                        value={scopeOfWork} 
                        onChange={(e) => setScopeOfWork(e.target.value)} 
                        placeholder="e.g. Flanges, Pipe Fittings, Olets, Forged Fittings"
                      />
                      <Input 
                        label="Material Type" 
                        value={materialType} 
                        onChange={(e) => setMaterialType(e.target.value)} 
                        placeholder="e.g. Carbon Steel / Stainless Steel / Alloy Steel"
                      />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader 
                      title="2. RISK MITIGATION SUMMARY" 
                      action={
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => {
                            const allPassed = { ...riskMitigation };
                            QA_QC_RISK_ITEMS.forEach(item => allPassed[item] = "PASSED");
                            setRiskMitigation(allPassed);
                          }}
                        >
                          Select All PASSED
                        </Button>
                      }
                    />
                    <CardContent className="space-y-4">
                      {QA_QC_RISK_ITEMS.map(item => (
                        <div key={item} className="flex flex-col md:flex-row md:items-center justify-between gap-2 p-2 rounded hover:bg-zinc-50 transition-colors">
                          <span className="text-sm font-medium text-zinc-700">{item}</span>
                          <select 
                            className="bg-zinc-100 rounded px-2 py-1 text-xs font-bold focus:outline-none border border-zinc-200"
                            value={riskMitigation[item] || "PASSED"}
                            onChange={(e) => setRiskMitigation({ ...riskMitigation, [item]: e.target.value })}
                          >
                            <option value="PASSED">PASSED</option>
                            <option value="FAILED">FAILED</option>
                            <option value="N/A">N/A</option>
                            <option value="PENDING">PENDING</option>
                          </select>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader 
                      title="3. INSPECTION & VERIFICATION SUMMARY" 
                      action={
                        <div className="flex gap-2">
                           <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setInspectionSummary(inspectionSummary.map(i => ({ ...i, isVerified: true })))}
                          >
                            Verify All
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setInspectionSummary(inspectionSummary.map(i => ({ ...i, isVerified: false })))}
                          >
                            Unverify All
                          </Button>
                        </div>
                      }
                    />
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="bg-zinc-50 text-zinc-500 uppercase tracking-wider font-bold">
                              <th className="px-3 py-2 text-left border-b border-zinc-100">Parameter</th>
                              <th className="px-3 py-2 text-left border-b border-zinc-100">Method Used</th>
                              <th className="px-3 py-2 text-left border-b border-zinc-100">Tool / Standard</th>
                              <th className="px-3 py-2 text-center border-b border-zinc-100">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-100">
                            {inspectionSummary.map((item, idx) => (
                              <tr key={idx} className="hover:bg-zinc-50/50 transition-colors">
                                <td className="px-3 py-2.5 font-bold text-zinc-700">{item.parameter}</td>
                                <td className="px-3 py-2.5 text-zinc-600">{item.method}</td>
                                <td className="px-3 py-2.5 text-zinc-600 font-medium italic">
                                  {INSPECTION_TOOL_OPTIONS[item.parameter] ? (
                                    <select 
                                      className="bg-transparent border-none p-0 focus:ring-0 cursor-pointer text-xs"
                                      value={item.tool}
                                      onChange={(e) => {
                                        const newList = [...inspectionSummary];
                                        newList[idx] = { ...item, tool: e.target.value };
                                        setInspectionSummary(newList);
                                      }}
                                    >
                                      {INSPECTION_TOOL_OPTIONS[item.parameter].map(opt => (
                                        <option key={opt} value={opt}>{opt}</option>
                                      ))}
                                      {/* Allow custom if not in list */}
                                      {!INSPECTION_TOOL_OPTIONS[item.parameter].includes(item.tool) && (
                                        <option value={item.tool}>{item.tool}</option>
                                      )}
                                    </select>
                                  ) : (
                                    <span>{item.tool}</span>
                                  )}
                                </td>
                                <td className="px-3 py-2.5 text-center">
                                  <button 
                                    onClick={() => {
                                      const newList = [...inspectionSummary];
                                      newList[idx] = { ...item, isVerified: !item.isVerified };
                                      setInspectionSummary(newList);
                                    }}
                                    className={`flex items-center justify-center gap-1.5 px-2 py-1 rounded transition-colors ${
                                      item.isVerified 
                                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                                        : "bg-zinc-50 text-zinc-400 border border-zinc-200"
                                    }`}
                                  >
                                    <Check className={`w-3.5 h-3.5 ${item.isVerified ? "opacity-100" : "opacity-0"}`} />
                                    <span className="text-[10px] font-bold uppercase tracking-wider">
                                      {item.isVerified ? "Verified" : "Verify"}
                                    </span>
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader title="4. TRACEABILITY INFRASTRUCTURE" />
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input 
                        label="Primary Heat ID" 
                        value={heatId} 
                        onChange={(e) => setHeatId(e.target.value)} 
                        placeholder="Enter Heat Number"
                      />
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Raw Material TC</label>
                        <select 
                          className="w-full bg-zinc-100 rounded-lg px-3 py-2 text-sm font-bold focus:outline-none border border-zinc-200"
                          value={hasRawMaterialTC ? "true" : "false"}
                          onChange={(e) => setHasRawMaterialTC(e.target.value === "true")}
                        >
                          <option value="true">Provided</option>
                          <option value="false">N/A</option>
                        </select>
                      </div>
                      <div className="flex flex-col gap-1">
                         <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">MTC Type</label>
                         <div className="flex gap-2">
                           {["3.1", "3.2"].map(type => (
                             <button
                                key={type}
                                onClick={() => setMtcType(type as "3.1" | "3.2")}
                                className={`px-4 py-2 rounded-lg text-sm font-bold border transition-all ${mtcType === type ? "bg-brand-600 text-white border-brand-600" : "bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50"}`}
                             >
                               {type}
                             </button>
                           ))}
                         </div>
                      </div>
                      <Input 
                        label="Third Party Inspection (TPI)" 
                        value={tpiEngagement} 
                        onChange={(e) => setTpiEngagement(e.target.value)} 
                        placeholder="e.g. SGS - PENDING"
                      />
                    </CardContent>
                    <div className="px-6 pb-6 mt-2">
                       <div className="bg-zinc-100 p-3 rounded-lg border border-zinc-200 text-xs font-bold text-zinc-600 italic">
                        Status: Full traceability loop established from raw material to finished product.
                      </div>
                    </div>
                  </Card>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader title="6. SAMPLING PROTOCOL" />
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                             <span className="text-xs font-bold text-zinc-500">Methodology:</span>
                             <select 
                              className="bg-zinc-50 rounded px-2 py-1 text-xs font-bold border border-zinc-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
                              value={samplingType}
                              onChange={(e) => {
                                const type = e.target.value;
                                setSamplingType(type);
                                setSamplingProtocol(`${type} sampling methodology applied to ensure representative inspection across supplied materials. Sampling conducted across different sizes, material grades, and heat batches where applicable to verify consistency, traceability, and compliance with specified standards. The applied sampling approach ensures effective coverage of supplied lot and minimizes the risk of undetected deviations during inspection.`);
                              }}
                            >
                              <option value="AQL Level II">AQL Level II</option>
                              <option value="Random">Random</option>
                              <option value="Batch-wise">Batch-wise</option>
                            </select>
                          </div>
                          <textarea
                            className="w-full h-24 bg-zinc-50 rounded-lg px-3 py-2 text-xs text-zinc-600 focus:outline-none border border-zinc-200 resize-none italic"
                            value={samplingProtocol}
                            onChange={(e) => setSamplingProtocol(e.target.value)}
                          />
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader title="7. NON-CONFORMANCE REPORT (NCR)" />
                      <CardContent>
                         <div className="flex items-center gap-2 mb-3">
                           <span className="text-xs font-bold text-zinc-500">Status:</span>
                           <select 
                            className={`px-4 py-2 rounded-xl text-sm font-black border transition-all shadow-sm ${
                              ncrStatus === 'COMPLIANT' 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-4 ring-emerald-500/5' 
                              : 'bg-red-50 text-red-700 border-red-200 ring-4 ring-red-500/5'
                            }`}
                            value={ncrStatus}
                            onChange={(e) => {
                              const val = e.target.value;
                              setNcrStatus(val);
                              if (val === 'REJECTION' && ncrItems.length === 0) {
                                // Default behavior requested by user
                                if (items.length > 0) {
                                  const firstItem = items[0];
                                  setNcrItems([{
                                    product: firstItem.description,
                                    quantity: firstItem.quantity.toString(),
                                    deviation: "Slight surface irregularity detected",
                                    actionTaken: "Reworked and re-inspected. Final status PASSED.",
                                    status: "COMPLIANT"
                                  }]);
                                }
                              }
                            }}
                          >
                            <option value="COMPLIANT">FULLY COMPLIANT</option>
                            <option value="REJECTION">NON-CONFORMANCE DETECTED</option>
                          </select>
                        </div>
                        
                        {ncrStatus === 'REJECTION' && (
                          <div className="space-y-4">
                             {ncrItems.length > 0 ? (
                               <div className="space-y-3">
                                 {ncrItems.map((item, idx) => (
                                   <div key={idx} className="p-4 bg-red-50/50 rounded-2xl border border-red-100 space-y-3 relative group">
                                     <button 
                                      className="absolute top-2 right-2 text-red-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                      onClick={() => {
                                        const newList = [...ncrItems];
                                        newList.splice(idx, 1);
                                        setNcrItems(newList);
                                      }}
                                     >
                                      <Trash2 className="w-3.5 h-3.5" />
                                     </button>

                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div className="flex flex-col gap-1">
                                          <label className="text-[10px] font-black text-red-700 uppercase">Product Selection</label>
                                          <select 
                                            className="w-full bg-white border border-red-200 rounded-lg px-2 py-1.5 text-xs font-bold text-zinc-700 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                                            value={item.product}
                                            onChange={(e) => {
                                              const newList = [...ncrItems];
                                              newList[idx] = { ...item, product: e.target.value };
                                              setNcrItems(newList);
                                            }}
                                          >
                                            <option value="">Select a product...</option>
                                            {items.map((it, i) => (
                                              <option key={i} value={it.description}>{it.description}</option>
                                            ))}
                                            <option value="CUSTOM">-- OTHER (TYPE MANUALLY) --</option>
                                          </select>
                                          {item.product === "CUSTOM" && (
                                            <input 
                                              type="text"
                                              placeholder="Type product name..."
                                              className="mt-1 w-full bg-white border border-red-200 rounded-lg px-2 py-1.5 text-xs font-medium text-zinc-700 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                                              onChange={(e) => {
                                                const newList = [...ncrItems];
                                                newList[idx] = { ...item, product: e.target.value };
                                                setNcrItems(newList);
                                              }}
                                            />
                                          )}
                                        </div>

                                        <div className="flex flex-col gap-1">
                                          <label className="text-[10px] font-black text-red-700 uppercase">Quantity</label>
                                          <input 
                                            type="text"
                                            className="w-full bg-white border border-red-200 rounded-lg px-2 py-1.5 text-xs font-bold text-zinc-700 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                                            value={item.quantity}
                                            placeholder="e.g. 5 Nos"
                                            onChange={(e) => {
                                              const newList = [...ncrItems];
                                              newList[idx] = { ...item, quantity: e.target.value };
                                              setNcrItems(newList);
                                            }}
                                          />
                                        </div>
                                     </div>

                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div className="flex flex-col gap-1">
                                          <label className="text-[10px] font-black text-red-700 uppercase">Deviation Observed</label>
                                          <textarea 
                                            className="w-full bg-white border border-red-200 rounded-lg px-2 py-1.5 text-xs text-red-600 font-medium focus:outline-none focus:ring-2 focus:ring-red-500/20 min-h-[60px] resize-none"
                                            value={item.deviation}
                                            placeholder="Describe the non-conformance..."
                                            onChange={(e) => {
                                              const newList = [...ncrItems];
                                              newList[idx] = { ...item, deviation: e.target.value };
                                              setNcrItems(newList);
                                            }}
                                          />
                                        </div>

                                        <div className="flex flex-col gap-1">
                                          <label className="text-[10px] font-black text-red-700 uppercase">Action Taken / Resolution</label>
                                          <textarea 
                                            className="w-full bg-white border border-red-200 rounded-lg px-2 py-1.5 text-xs text-zinc-600 italic focus:outline-none focus:ring-2 focus:ring-red-500/20 min-h-[60px] resize-none"
                                            value={item.actionTaken}
                                            placeholder="Describe how it was resolved..."
                                            onChange={(e) => {
                                              const newList = [...ncrItems];
                                              newList[idx] = { ...item, actionTaken: e.target.value };
                                              setNcrItems(newList);
                                            }}
                                          />
                                        </div>
                                     </div>

                                     <div className="flex flex-col gap-1 pt-1">
                                        <label className="text-[10px] font-black text-red-700 uppercase">Resolution Status</label>
                                        <select 
                                          className="bg-white border border-red-200 rounded-lg px-2 py-1.5 text-xs font-black text-red-700 uppercase focus:outline-none focus:ring-2 focus:ring-red-500/20"
                                          value={item.status}
                                          onChange={(e) => {
                                            const newList = [...ncrItems];
                                            newList[idx] = { ...item, status: e.target.value };
                                            setNcrItems(newList);
                                          }}
                                        >
                                          {NCR_ACTION_STATUS_OPTIONS.map(opt => (
                                            <option key={opt} value={opt}>{opt}</option>
                                          ))}
                                        </select>
                                     </div>
                                   </div>
                                 ))}
                               </div>
                             ) : (
                               <div className="py-8 text-center border-2 border-dashed border-red-100 rounded-2xl bg-red-50/20 transition-all hover:bg-red-50/40">
                                 <AlertCircle className="w-8 h-8 text-red-200 mx-auto mb-2" />
                                 <p className="text-xs text-red-400 font-bold uppercase tracking-widest">No deviations recorded yet</p>
                               </div>
                             )}
                             <Button 
                               variant="outline" 
                               size="sm" 
                               onClick={() => {
                                 setNcrItems([...ncrItems, { product: "", quantity: "1", deviation: "", actionTaken: "", status: "COMPLIANT" }]);
                               }}
                               className="w-full border-red-200 text-red-600 hover:bg-red-50 text-xs font-black uppercase tracking-widest mt-4"
                             >
                               <PlusCircle className="w-3.5 h-3.5 mr-2" />
                               Record New Deviation
                             </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader title="8. PHOTOGRAPHIC EVIDENCE CONTROL" />
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-zinc-50 border-y border-zinc-200">
                            <tr>
                              <th className="px-3 py-2 text-left font-black text-zinc-500 uppercase tracking-wider text-[10px]">Document Type</th>
                              <th className="px-3 py-2 text-left font-black text-zinc-500 uppercase tracking-wider text-[10px]">Description</th>
                              <th className="px-3 py-2 text-center font-black text-zinc-500 uppercase tracking-wider text-[10px]">Verification Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {evidenceControl.map((item, idx) => (
                              <tr key={idx} className="hover:bg-zinc-50/50 transition-colors border-b border-zinc-100 last:border-b-0">
                                <td className="px-3 py-2.5 font-bold text-zinc-700">
                                  <input 
                                    className="bg-transparent border-none p-0 focus:ring-0 w-full font-bold text-zinc-700" 
                                    value={item.docType}
                                    onChange={(e) => {
                                      const newEvidence = [...evidenceControl];
                                      newEvidence[idx].docType = e.target.value;
                                      setEvidenceControl(newEvidence);
                                    }}
                                  />
                                </td>
                                <td className="px-3 py-2.5 text-zinc-600 text-xs italic">
                                  <textarea 
                                    className="bg-transparent border-none p-0 focus:ring-0 w-full text-xs italic text-zinc-600 resize-none" 
                                    value={item.description}
                                    onChange={(e) => {
                                      const newEvidence = [...evidenceControl];
                                      newEvidence[idx].description = e.target.value;
                                      setEvidenceControl(newEvidence);
                                    }}
                                    rows={1}
                                  />
                                </td>
                                <td className="px-3 py-2.5 text-center">
                                  <select 
                                    className="bg-transparent border-none p-0 focus:ring-0 cursor-pointer text-xs font-black text-brand-700 text-center uppercase"
                                    value={item.status}
                                    onChange={(e) => {
                                      const newEvidence = [...evidenceControl];
                                      newEvidence[idx].status = e.target.value;
                                      setEvidenceControl(newEvidence);
                                    }}
                                  >
                                    {EVIDENCE_STATUS_OPTIONS.map(opt => (
                                      <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                  </select>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader 
                      title="9. PACKAGING & DISPATCH CONTROL" 
                      action={
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setPackagingDispatch(packagingDispatch.map(p => ({ ...p, status: "Confirmed" })))}
                        >
                          Confirm All
                        </Button>
                      }
                    />
                    <CardContent>
                      <div className="overflow-x-auto border border-zinc-100 rounded-xl">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="bg-zinc-50 text-zinc-500 font-bold uppercase tracking-tighter">
                              <th className="px-3 py-3 text-left border-b border-zinc-100">Control Area</th>
                              <th className="px-3 py-3 text-left border-b border-zinc-100">Methodology</th>
                              <th className="px-3 py-3 text-left border-b border-zinc-100">Verification</th>
                              <th className="px-3 py-3 text-center border-b border-zinc-100">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-100">
                            {packagingDispatch.map((item, idx) => (
                              <tr key={idx} className="hover:bg-zinc-50/50 transition-colors">
                                <td className="px-3 py-3 font-black text-brand-700">{item.controlArea}</td>
                                <td className="px-3 py-3">
                                  {PACKAGING_METHOD_OPTIONS[item.controlArea] ? (
                                    <select 
                                      className="bg-transparent text-xs font-medium text-zinc-600 focus:outline-none cursor-pointer w-full"
                                      value={item.method}
                                      onChange={(e) => {
                                        const newList = [...packagingDispatch];
                                        newList[idx] = { ...item, method: e.target.value };
                                        setPackagingDispatch(newList);
                                      }}
                                    >
                                      {PACKAGING_METHOD_OPTIONS[item.controlArea].map(opt => (
                                        <option key={opt} value={opt}>{opt}</option>
                                      ))}
                                    </select>
                                  ) : (
                                    <span className="text-zinc-600">{item.method}</span>
                                  )}
                                </td>
                                <td className="px-3 py-3 text-zinc-500 font-medium italic">{item.verification}</td>
                                <td className="px-3 py-3 text-center">
                                  <select 
                                    className={`text-[10px] font-black uppercase rounded-lg border px-2 py-1 focus:outline-none transition-all ${
                                      item.status === "Confirmed" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                                      item.status === "Ensured" || item.status === "Verified" ? "bg-brand-50 text-brand-700 border-brand-200" :
                                      "bg-zinc-100 text-zinc-500 border-zinc-200"
                                    }`}
                                    value={item.status}
                                    onChange={(e) => {
                                      const newList = [...packagingDispatch];
                                      newList[idx] = { ...item, status: e.target.value };
                                      setPackagingDispatch(newList);
                                    }}
                                  >
                                    <option value="Confirmed">Confirmed</option>
                                    <option value="Ensured">Ensured</option>
                                    <option value="Verified">Verified</option>
                                    <option value="Matched">Matched</option>
                                    <option value="Approved">Approved</option>
                                    <option value="Pending">Pending</option>
                                  </select>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader title="10. INSPECTION BODY DECLARATION" />
                    <CardContent className="space-y-4">
                       <textarea 
                        className="w-full h-24 bg-zinc-50 rounded-xl px-4 py-3 text-sm italic font-medium text-zinc-600 border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                        value={qualityDeclaration}
                        onChange={(e) => setQualityDeclaration(e.target.value)}
                       />

                      <div className="flex flex-col md:flex-row gap-6 p-6 bg-brand-50/50 rounded-2xl border border-brand-100">
                        <div className="flex-1 space-y-2">
                           <label className="text-[10px] font-black text-brand-600 uppercase tracking-widest">Final Inspection Verdict</label>
                           <div className="flex gap-2">
                             {[
                               { id: "satisfactory", label: "Satisfactory", color: "emerald" },
                               { id: "satisfactory_remarks", label: "With Remarks", color: "amber" },
                               { id: "unsatisfactory", label: "Rejected", color: "red" }
                             ].map(verdict => (
                               <button
                                 key={verdict.id}
                                 onClick={() => setFinalRemarksStatus(verdict.id as any)}
                                 className={`flex-1 px-4 py-3 rounded-xl text-xs font-black uppercase transition-all border ${
                                   finalRemarksStatus === verdict.id 
                                     ? `bg-${verdict.color}-600 text-white border-${verdict.color}-600 shadow-lg shadow-${verdict.color}-600/20` 
                                     : `bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50`
                                 }`}
                               >
                                 {verdict.label}
                               </button>
                             ))}
                           </div>
                        </div>
                        <div className="flex-1 space-y-2">
                           <label className="text-[10px] font-black text-brand-600 uppercase tracking-widest">Additonal Remarks (Optional)</label>
                           <input 
                            type="text"
                            className="w-full bg-white rounded-xl px-4 py-3 text-sm font-bold border border-brand-100 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                            placeholder="e.g. Cleared for immediate dispatch"
                            value={finalRemarksText}
                            onChange={(e) => setFinalRemarksText(e.target.value)}
                           />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}



              {/* Dimensional Inspection Report Specific Sections */}
              {false && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="space-y-6"
                >
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowQAImportModal(true)}
                      className="flex items-center gap-2 border-brand-200 text-brand-700 hover:bg-brand-50 font-bold"
                    >
                      <History size={14} />
                      Import from Quotation/Invoice
                    </Button>
                  </div>

                  <Card>
                    <CardHeader title="1. TRACEABILITY INFRASTRUCTURE" />
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input 
                        label="Primary Heat ID" 
                        value={heatId} 
                        onChange={(e) => setHeatId(e.target.value)} 
                        placeholder="Enter Heat Number"
                      />
                      <Input 
                        label="Material Type" 
                        value={materialType} 
                        onChange={(e) => setMaterialType(e.target.value)} 
                        placeholder="e.g. Carbon Steel / Stainless Steel"
                      />
                    </CardContent>
                  </Card>

                  {/* Dimensional Inspection Report Section */}
                  <Card>
                    <CardHeader 
                      title="2. DIMENSIONAL INSPECTION REPORT (TABULATED)" 
                      action={
                        <div className="flex gap-2">
                          <Button
                            variant={showQuickAdd ? "primary" : "outline"}
                            size="sm"
                            onClick={() => setShowQuickAdd(p => !p)}
                            className={`flex items-center gap-1.5 font-bold ${showQuickAdd ? 'text-white' : 'border-brand-200 text-brand-700 hover:bg-brand-50 bg-white'}`}
                          >
                            <PlusCircle className="w-3.5 h-3.5" />
                            {showQuickAdd ? "Hide Add Row" : "Add Row"}
                          </Button>
                          <Button 
                            variant="primary" 
                            size="sm" 
                            onClick={runAISmartCheck}
                            disabled={isAiProcessing || items.length === 0}
                            className="flex items-center gap-2"
                          >
                            {isAiProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                            AI Smart Sync
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => dimensionalReports.forEach(r => updateDimensionalResult(r.itemId, "PASSED"))}
                          >
                            Pass All
                          </Button>
                        </div>
                      }
                    />
                    <CardContent className="space-y-8 pt-0">
                      {/* Quick Add Manual Product Row form panel */}
                      {showQuickAdd && (
                        <motion.div
                          initial={{ opacity: 0, height: 0, y: -10 }}
                          animate={{ opacity: 1, height: "auto", y: 0 }}
                          className="bg-zinc-50 border border-zinc-200 rounded-xl p-5 mb-6 shadow-sm space-y-4"
                        >
                          <div className="flex justify-between items-center pb-2 border-b border-zinc-200">
                            <div className="flex items-center gap-2">
                              <PlusCircle className="w-4 h-4 text-brand-600" />
                              <h4 className="text-xs font-black text-zinc-800 uppercase tracking-wider">Quick Add Product Row</h4>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-5 text-[9px] text-zinc-400 hover:text-zinc-600 p-1"
                              onClick={() => setShowQuickAdd(false)}
                            >
                              Close
                            </Button>
                          </div>

                          <div className={`grid grid-cols-1 sm:grid-cols-2 ${qaCategory === "fitting" && qaType === "REDUCER" ? "md:grid-cols-6" : "md:grid-cols-5"} gap-3`}>
                            {/* Category Selection */}
                            <div className="flex flex-col gap-1.5">
                              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">Category</label>
                              <select
                                value={qaCategory}
                                onChange={(e) => {
                                  const cat = e.target.value as any;
                                  setQaCategory(cat);
                                  // Auto preset standard type based on category
                                  if (cat === "flange") { setQaType("SORF"); setQaSize("2\""); }
                                  else if (cat === "fitting") { setQaType("90 ELBOW"); setQaSize("2\""); }
                                  else if (cat === "pipe") { setQaType("PIPE"); setQaSize("2\""); }
                                  else if (cat === "forged_fitting") { setQaType("SW 90 ELBOW"); setQaSize("1\""); }
                                  else if (cat === "olet") { setQaType("WELDOLET"); setQaSize("2\""); }
                                }}
                                className="w-full text-xs bg-white border border-zinc-300 rounded-lg px-2.5 py-2 font-medium focus:ring-1 focus:ring-brand-500 outline-none"
                              >
                                <option value="pipe">Pipe (NPS)</option>
                                <option value="fitting">Butt-Weld Fitting</option>
                                <option value="flange">Flange (ASME B16.5)</option>
                                <option value="forged_fitting">Forged Socket/Threaded</option>
                                <option value="olet">Branch Connection (Olet)</option>
                              </select>
                            </div>

                            {/* Size Selection */}
                            <div className="flex flex-col gap-1.5">
                              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">Size</label>
                              <select
                                value={qaSize}
                                onChange={(e) => setQaSize(e.target.value)}
                                className="w-full text-xs bg-white border border-zinc-300 rounded-lg px-2.5 py-2 font-medium focus:ring-1 focus:ring-brand-500 outline-none"
                              >
                                {qaCategory === "forged_fitting" ? (
                                  <>
                                    <option value={"1/2\""}>1/2"</option>
                                    <option value={"3/4\""}>3/4"</option>
                                    <option value={"1\""}>1"</option>
                                    <option value={"1-1/2\""}>1-1/2"</option>
                                    <option value={"2\""}>2"</option>
                                    <option value={"3\""}>3"</option>
                                    <option value={"4\""}>4"</option>
                                  </>
                                ) : (
                                  <>
                                    <option value={"1/2\""}>1/2"</option>
                                    <option value={"3/4\""}>3/4"</option>
                                    <option value={"1\""}>1"</option>
                                    <option value={"1-1/2\""}>1-1/2"</option>
                                    <option value={"2\""}>2"</option>
                                    <option value={"3\""}>3"</option>
                                    <option value={"4\""}>4"</option>
                                    <option value={"6\""}>6"</option>
                                    <option value={"8\""}>8"</option>
                                    <option value={"10\""}>10"</option>
                                    <option value={"12\""}>12"</option>
                                  </>
                                )}
                              </select>
                            </div>

                            {/* Second Size Selection (Only for Reducer) */}
                            {qaCategory === "fitting" && qaType === "REDUCER" && (
                              <div className="flex flex-col gap-1.5 animate-fadeIn">
                                <label className="text-[10px] font-black text-brand-600 uppercase tracking-wider">Second Size (Small End)</label>
                                <select
                                  value={qaSize2}
                                  onChange={(e) => setQaSize2(e.target.value)}
                                  className="w-full text-xs bg-white border border-zinc-300 rounded-lg px-2.5 py-2 font-medium focus:ring-1 focus:ring-brand-500 outline-none"
                                >
                                  <option value={"1/2\""}>1/2"</option>
                                  <option value={"3/4\""}>3/4"</option>
                                  <option value={"1\""}>1"</option>
                                  <option value={"1-1/2\""}>1-1/2"</option>
                                  <option value={"2\""}>2"</option>
                                  <option value={"3\""}>3"</option>
                                  <option value={"4\""}>4"</option>
                                  <option value={"6\""}>6"</option>
                                  <option value={"8\""}>8"</option>
                                  <option value={"10\""}>10"</option>
                                  <option value={"12\""}>12"</option>
                                </select>
                              </div>
                            )}

                            {/* Dynamic Type/Style dropdown */}
                            <div className="flex flex-col gap-1.5">
                              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">Type / Style</label>
                              <select
                                value={qaType}
                                onChange={(e) => setQaType(e.target.value)}
                                className="w-full text-xs bg-white border border-zinc-300 rounded-lg px-2.5 py-2 font-medium focus:ring-1 focus:ring-brand-500 outline-none"
                              >
                                {qaCategory === "pipe" && (
                                  <option value="PIPE">Line Pipe</option>
                                )}
                                {qaCategory === "flange" && (
                                  <>
                                    <option value="SORF">Slip-On RF (SORF)</option>
                                    <option value="WNRF">Weld Neck RF (WNRF)</option>
                                    <option value="BLRF">Blind RF (BLRF)</option>
                                    <option value="LWNRF">Long Weld Neck (LWNRF)</option>
                                  </>
                                )}
                                {qaCategory === "fitting" && (
                                  <>
                                    <option value="90 ELBOW">90° Elbow (LR)</option>
                                    <option value="45 ELBOW">45° Elbow (LR)</option>
                                    <option value="EQUAL TEE">Equal Tee</option>
                                    <option value="REDUCER">Concentric Reducer</option>
                                    <option value="CAP">Butt-Weld Cap</option>
                                  </>
                                )}
                                {qaCategory === "forged_fitting" && (
                                  <>
                                    <option value="SW 90 ELBOW">SW 90° Elbow</option>
                                    <option value="THREADED 90 ELBOW">Threaded 90° Elbow</option>
                                    <option value="SW TEE">SW Equal Tee</option>
                                    <option value="THREADED TEE">Threaded Equal Tee</option>
                                    <option value="SW COUPLING">SW Full Coupling</option>
                                    <option value="THREADED COUPLING">Threaded Full Coupling</option>
                                    <option value="SW CAP">SW Cap</option>
                                  </>
                                )}
                                {qaCategory === "olet" && (
                                  <>
                                    <option value="WELDOLET">Weldolet</option>
                                    <option value="SOCKOLET">Sockolet</option>
                                    <option value="THREADOLET">Threadolet</option>
                                  </>
                                )}
                              </select>
                            </div>

                            {/* Schedule / Wall Thickness */}
                            <div className="flex flex-col gap-1.5">
                              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">
                                {qaCategory === "flange" || qaCategory === "forged_fitting" ? "Rating Class" : "Schedule (Wall)"}
                              </label>
                              {qaCategory === "flange" ? (
                                <select
                                  value={qaRating}
                                  onChange={(e) => setQaRating(e.target.value)}
                                  className="w-full text-xs bg-white border border-zinc-300 rounded-lg px-2.5 py-2 font-medium focus:ring-1 focus:ring-brand-500 outline-none"
                                >
                                  <option value="150#">Class 150 (150#)</option>
                                  <option value="300#">Class 300 (300#)</option>
                                  <option value="600#">Class 600 (600#)</option>
                                  <option value="900#">Class 900 (900#)</option>
                                  <option value="1500#">Class 1500 (1500#)</option>
                                  <option value="2500#">Class 2500 (2500#)</option>
                                </select>
                              ) : qaCategory === "forged_fitting" ? (
                                <select
                                  value={qaRating}
                                  onChange={(e) => setQaRating(e.target.value)}
                                  className="w-full text-xs bg-white border border-zinc-300 rounded-lg px-2.5 py-2 font-medium focus:ring-1 focus:ring-brand-500 outline-none"
                                >
                                  <option value="3000#">3000 lb (3000#)</option>
                                  <option value="6000#">6000 lb (6000#)</option>
                                  <option value="9000#">9000 lb (9000#)</option>
                                </select>
                              ) : (
                                <select
                                  value={qaSchedule}
                                  onChange={(e) => setQaSchedule(e.target.value)}
                                  className="w-full text-xs bg-white border border-zinc-300 rounded-lg px-2.5 py-2 font-medium focus:ring-1 focus:ring-brand-500 outline-none"
                                >
                                  <option value="SCH 40">SCH 40 (STD)</option>
                                  <option value="SCH 80">SCH 80 (XS)</option>
                                  <option value="SCH 10S">SCH 10S</option>
                                  <option value="SCH XS">SCH XS</option>
                                  <option value="SCH XXS">SCH XXS</option>
                                  <option value="SCH 160">SCH 160</option>
                                </select>
                              )}
                            </div>

                            {/* Quantity and Actions */}
                            <div className="flex flex-col gap-1.5">
                              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">Quantity</label>
                              <div className="flex gap-2">
                                <input
                                  type="number"
                                  min="1"
                                  value={qaQty}
                                  onChange={(e) => setQaQty(Math.max(1, parseInt(e.target.value) || 1))}
                                  className="w-14 text-xs bg-white border border-zinc-300 rounded-lg py-2 font-medium focus:ring-1 focus:ring-brand-500 text-center outline-none"
                                />
                                <Button
                                  variant="primary"
                                  onClick={handleQuickAddRow}
                                  className="flex-1 text-xs font-black uppercase text-white tracking-widest flex items-center justify-center gap-1 h-9"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  Add
                                </Button>
                              </div>
                            </div>
                          </div>

                          {/* Custom Override and Help Text */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                            <div className="flex flex-col gap-1">
                              <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Description Override (Optional Manual Entry)</span>
                              <input
                                type="text"
                                value={qaCustomDesc}
                                onChange={(e) => setQaCustomDesc(e.target.value)}
                                placeholder="Type a custom description (e.g. TEE 4 INCH SCH 40)..."
                                className="w-full text-xs bg-white border border-zinc-300 rounded-lg px-2.5 py-1.5 font-medium focus:ring-1 focus:ring-brand-500 outline-none"
                              />
                            </div>
                            <div className="bg-zinc-100 rounded-lg px-3 py-2 border border-zinc-200/60 flex flex-col justify-center">
                              <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Active Spec String Pattern</span>
                              <p className="text-[10px] font-mono text-brand-700 font-bold truncate">
                                {qaCustomDesc.trim() || (() => {
                                  if (qaCategory === "flange") {
                                    return `FLANGE ${qaSize} ${qaRating} ${qaType}`.trim();
                                  } else if (qaCategory === "fitting") {
                                    if (qaType === "REDUCER") {
                                      return `${qaSize} X ${qaSize2} CONCENTRIC REDUCER ${qaSchedule} BW`.trim();
                                    }
                                    return `${qaType} ${qaSize} ${qaSchedule} BW`.trim();
                                  } else if (qaCategory === "pipe") {
                                    return `PIPE ${qaSize} ${qaSchedule} SMLS`.trim();
                                  } else if (qaCategory === "forged_fitting") {
                                    const isThd = (qaType || "").toUpperCase().includes('THREADED') || (qaType || "").toUpperCase().includes('THD');
                                    return `FORGED ${qaType} ${qaSize} ${qaRating} ${isThd ? 'THD' : 'SW'}`.trim();
                                  } else if (qaCategory === "olet") {
                                    return `${qaType} ${qaSize} ${qaSchedule}`.trim();
                                  }
                                  return "";
                                })()}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {/* AI Intelligence Hub */}
                      {dimensionalReports.some(r => r.aiSummary || r.aiInsights) && (
                        <motion.div 
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-brand-50/50 rounded-xl border border-brand-100 p-4 mb-4"
                        >
                          <div className="flex items-center gap-2 mb-3">
                            <div className="p-1.5 bg-brand-100 rounded-lg">
                              <Zap className="w-4 h-4 text-brand-600" />
                            </div>
                            <h5 className="text-[10px] font-black text-brand-700 uppercase tracking-widest">AI Intelligence Hub & Insights</h5>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {dimensionalReports.filter(r => r.aiSummary || r.aiInsights).slice(0, 3).map((report, idx) => (
                              <div key={idx} className="bg-white/80 rounded-lg p-2.5 border border-brand-200/50 shadow-sm flex flex-col gap-1.5 line-clamp-3">
                                <div className="flex items-center gap-2 pb-1 border-b border-brand-50">
                                  <span className="text-[8px] font-black text-brand-800 bg-brand-50 px-1.5 py-0.5 rounded uppercase shrink-0">Item {report.itemNo}</span>
                                  <span className="text-[8px] font-bold text-zinc-400 uppercase truncate">{report.extractedDescription || report.type}</span>
                                </div>
                                <p className="text-[9px] text-zinc-600 leading-relaxed italic">"{report.aiSummary || report.aiInsights}"</p>
                              </div>
                            ))}
                            {dimensionalReports.filter(r => r.aiSummary || r.aiInsights).length > 3 && (
                              <div className="bg-brand-100/30 rounded-lg p-2.5 border border-dashed border-brand-200 flex items-center justify-center">
                                <span className="text-[9px] font-black text-brand-600 uppercase">+ {dimensionalReports.filter(r => r.aiSummary || r.aiInsights).length - 3} More AI Insights</span>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                      {/* Flanges Table */}
                      {dimensionalReports.filter(r => r.category === "flange").length > 0 && (
                        <div className="space-y-6">
                           <h4 className="text-xs font-black text-brand-600 uppercase tracking-widest flex items-center gap-2 px-1">
                            <PlusCircle className="w-4 h-4" />
                            DIMENSIONAL VERIFICATION: FLANGES (ASME B16.5)
                          </h4>

                          {(() => {
                            const flanges = dimensionalReports.filter(r => r.category === "flange");
                            const lwnrf = flanges.filter(r => r.type === "LWNRF");
                            const standardFlanges = flanges.filter(r => r.type !== "LWNRF");

                            const renderFlangeTable = (title: string, items: typeof flanges, columns: {key: string, label: string}[]) => {
                              if (items.length === 0) return null;
                              return (
                                <div className="space-y-1.5" key={title}>
                                  <div className="flex items-center justify-between gap-2 px-1">
                                    <div className="flex items-center gap-2">
                                      <div className="h-4 w-1 bg-brand-500 rounded-full"></div>
                                      <span className="text-[10px] font-black text-zinc-700 uppercase tracking-widest">{title}</span>
                                      <span className="text-[8px] font-bold text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded-full">{items.length} ITEMS</span>
                                    </div>
                                    {false && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-5 text-[8px] font-bold text-red-500 hover:text-red-700 p-1 flex items-center gap-1 hover:bg-red-50 rounded"
                                        onClick={() => {
                                          const itemIdsToDelete = items.map(r => r.itemId);
                                          deleteMeasurementSegment(itemIdsToDelete);
                                        }}
                                        title={`Delete entire ${title} segment`}
                                      >
                                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                                        Delete Section
                                      </Button>
                                    )}
                                  </div>
                                  <div className="overflow-x-auto border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
                                    <table className="w-full text-[10px] border-collapse bg-white">
                                      <thead>
                                        <tr className="bg-zinc-50/80 text-zinc-500 font-bold uppercase tracking-tighter text-[8px] border-b border-zinc-200">
                                          <th className="px-2 py-2.5 text-center border-r border-zinc-200 w-8">S.No</th>
                                          <th className="px-3 py-2.5 text-left border-r border-zinc-200 w-28">Item / Size</th>
                                          {columns.map(col => (
                                            <th key={col.key} className="px-2 py-2.5 text-center border-r border-zinc-200">{col.label}</th>
                                          ))}
                                          <th className="px-3 py-2.5 text-center border-r border-zinc-200">Result</th>
                                          <th className="px-2 py-2.5 text-center w-10"></th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-zinc-200">
                                        {items.map((report, idx) => (
                                          <tr key={report.itemId} className="hover:bg-brand-50/20 transition-colors">
                                            <td className="px-2 py-3 border-r border-zinc-100 font-black text-zinc-400 text-center bg-zinc-50/10">
                                              {idx + 1}
                                            </td>
                                            <td className="px-3 py-3 border-r border-zinc-100 bg-white">
                                                <div className="flex flex-col gap-1">
                                                  <div className="flex flex-col">
                                                    <div className="flex items-center gap-1">
                                                       {false ? (
                                                         <select 
                                                           className="text-[10px] font-black bg-transparent border-none focus:ring-0 p-0 text-zinc-800 cursor-pointer"
                                                           value={report.size}
                                                         onChange={(e) => {
                                                           const newSize = e.target.value;
                                                           const newDims = getFlangeDimensionsObject(
                                                             newSize,
                                                             report.standardClass || "150",
                                                             report.type || "SORF",
                                                             report.schedule || "",
                                                             report.extractedDescription || "",
                                                             report.dimensions
                                                           );

                                                           setDimensionalReports(prev => prev.map(r => r.itemId === report.itemId ? {
                                                             ...r,
                                                             size: newSize,
                                                             dimensions: newDims
                                                           } : r));
                                                         }}
                                                       >
                                                         {Object.keys(FLANGE_STANDARDS_150).map(s => <option key={s} value={s}>{s}</option>)}
                                                       </select>
                                                       ) : (
                                                         <span className="text-[10px] font-black text-zinc-800">{report.size}</span>
                                                       )}
                                                    </div>
                                                    <div className="flex flex-col gap-0.5">
                                                      <select 
                                                        className="text-[8px] bg-white border border-zinc-200 rounded px-1 py-0.5 font-bold uppercase text-brand-700 mt-0.5"
                                                        value={report.standardClass}
                                                        onChange={(e) => {
                                                          const newClass = e.target.value;
                                                          const newDims = getFlangeDimensionsObject(
                                                            report.size,
                                                            newClass,
                                                            report.type || "SORF",
                                                            report.schedule || "",
                                                            report.extractedDescription || "",
                                                            report.dimensions
                                                          );

                                                          setDimensionalReports(prev => prev.map(r => r.itemId === report.itemId ? {
                                                            ...r,
                                                            standardClass: newClass,
                                                            dimensions: newDims
                                                          } : r));
                                                        }}
                                                      >
                                                        <option value="150">CL 150</option>
                                                        <option value="150A">150 Ser A</option>
                                                        <option value="150B">150 Ser B</option>
                                                        <option value="75B">CL 75 Ser B</option>
                                                        <option value="300">CL 300</option>
                                                        <option value="300A">300 Ser A</option>
                                                        <option value="300B">300 Ser B</option>
                                                        <option value="400">CL 400</option>
                                                        <option value="400A">400 Ser A</option>
                                                        <option value="400B">400 Ser B</option>
                                                        <option value="600">CL 600</option>
                                                        <option value="600A">600 Ser A</option>
                                                        <option value="600B">600 Ser B</option>
                                                        <option value="900">CL 900</option>
                                                        <option value="900A">900 Ser A</option>
                                                        <option value="900B">900 Ser B</option>
                                                        <option value="1500">CL 1500</option>
                                                        <option value="2500">CL 2500</option>
                                                      </select>
                                                      
                                                      <select 
                                                        className="text-[8px] bg-white border border-zinc-200 rounded px-1 py-0.5 font-bold uppercase text-zinc-500 mt-0.5"
                                                        value={report.type}
                                                        onChange={(e) => {
                                                          const newType = e.target.value as any;
                                                          const newDims = getFlangeDimensionsObject(
                                                            report.size,
                                                            report.standardClass || "150",
                                                            newType,
                                                            report.schedule || "",
                                                            report.extractedDescription || "",
                                                            report.dimensions
                                                          );

                                                          setDimensionalReports(prev => prev.map(r => r.itemId === report.itemId ? {
                                                            ...r,
                                                            type: newType,
                                                            dimensions: newDims
                                                          } : r));
                                                        }}
                                                      >
                                                        <option value="SORF">SORF</option>
                                                        <option value="WNRF">WNRF</option>
                                                        <option value="BLRF">BLRF</option>
                                                        <option value="SWRF">SWRF</option>
                                                        <option value="THRD">THRD</option>
                                                        <option value="LAP JOINT">LAP JOINT</option>
                                                        <option value="LWNRF">LWNRF</option>
                                                      </select>

                                                      <select 
                                                        className="text-[8px] bg-white border border-zinc-200 rounded px-1 py-0.5 font-bold uppercase text-brand-600 mt-0.5"
                                                        value={report.schedule}
                                                        onChange={(e) => {
                                                          const newSch = e.target.value;
                                                          const newDims = getFlangeDimensionsObject(
                                                            report.size,
                                                            report.standardClass || "150",
                                                            report.type || "SORF",
                                                            newSch,
                                                            report.extractedDescription || "",
                                                            report.dimensions
                                                          );

                                                          setDimensionalReports(prev => prev.map(r => r.itemId === report.itemId ? {
                                                            ...r,
                                                            schedule: newSch,
                                                            dimensions: newDims
                                                          } : r));
                                                        }}
                                                      >
                                                        <option value="">SCH</option>
                                                        {FITTING_SCHEDULES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                                                      </select>
                                                   </div>
                                                </div>
                                                  </div>
                                              </td>
                                            {columns.map(col => {
                                              const dim = report.dimensions[col.key] || { standard: "---", measured: "" };
                                              return (
                                                <DimensionCell 
                                                  key={col.key} 
                                                  dim={dim} 
                                                  onUpdate={(val) => updateDimensionalReport(report.itemId, col.key, val)}
                                                  isInvalid={dim.isValid === false}
                                                />
                                              );
                                            })}
                                            <ResultCell 
                                              result={report.result} 
                                              onUpdate={(val) => updateDimensionalResult(report.itemId, val as any)}
                                              onValidate={() => validateWithAI(report.itemId)}
                                              isProcessing={isAiProcessing}
                                            />
                                            <td className="px-2 py-3 text-center align-middle">
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 w-6 p-0 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                onClick={() => deleteMeasurementItem(report.itemId)}
                                                title="Delete this row"
                                              >
                                                <Trash2 className="w-3.5 h-3.5 text-red-500" />
                                              </Button>
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              );
                            }

                            return (
                              <div className="space-y-6">
                                {renderFlangeTable("STANDARD FLANGES", standardFlanges, [
                                  { key: "OD", label: "OD" },
                                  { key: "PCD", label: "PCD" },
                                  { key: "Thk", label: "THK" },
                                  { key: "ID", label: "ID" },
                                  { key: "Hub OD (Large)", label: "HUB OD (L)" },
                                  { key: "Hub OD (Small)", label: "HUB OD (S)" },
                                  { key: "Hub Length", label: "HUB L" },
                                  { key: "RF", label: "RF" }
                                ])}
                                {renderFlangeTable("LWNRF FLANGES", lwnrf, [
                                  { key: "OD", label: "OD" },
                                  { key: "PCD", label: "PCD" },
                                  { key: "Thk", label: "THK" },
                                  { key: "ID", label: "ID" },
                                  { key: "Hub OD (Large)", label: "HUB OD (L)" },
                                  { key: "Hub OD (Small)", label: "SMALL HUB" },
                                  { key: "Hub Length", label: "NECK LENGTH" },
                                  { key: "RF", label: "RF" }
                                ])}
                              </div>
                            );
                          })()}
                        </div>
                      )}

                      {/* Fittings Table */}
                      {dimensionalReports.filter(r => r.category === "fitting").length > 0 && (
                        <div className="space-y-4">
                          <h4 className="text-xs font-black text-indigo-700 uppercase tracking-widest flex items-center gap-2 px-1">
                              <Package className="w-4 h-4" />
                              PIPE FITTINGS (ASME B16.9)
                          </h4>
                          
                          {(() => {
                            const fittings = dimensionalReports.filter(r => r.category === "fitting");
                            const elbows = fittings.filter(r => (r.type || "").toLowerCase().includes("elbow"));
                            const tees = fittings.filter(r => (r.type || "").toLowerCase().includes("tee"));
                            const reducers = fittings.filter(r => (r.type || "").toLowerCase().includes("reducer"));
                            const caps = fittings.filter(r => (r.type || "").toLowerCase().includes("cap"));
                            const stubEnds = fittings.filter(r => (r.type || "").toLowerCase().includes("stub end"));
                            const others = fittings.filter(r => 
                              !(r.type || "").toLowerCase().includes("elbow") && 
                              !(r.type || "").toLowerCase().includes("tee") && 
                              !(r.type || "").toLowerCase().includes("reducer") && 
                              !(r.type || "").toLowerCase().includes("cap") &&
                              !(r.type || "").toLowerCase().includes("stub end")
                            );

                            const renderTable = (title: string, items: typeof fittings, columns: {key: string, label: string}[]) => {
                              if (items.length === 0) return null;
                              return (
                                <div className="space-y-1.5" key={title}>
                                  <div className="flex items-center justify-between gap-2 px-1">
                                    <div className="flex items-center gap-2">
                                      <div className="h-4 w-1 bg-indigo-500 rounded-full"></div>
                                      <span className="text-[10px] font-black text-zinc-700 uppercase tracking-widest">{title}</span>
                                      <span className="text-[8px] font-bold text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded-full">{items.length} ITEMS</span>
                                    </div>
                                    {false && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-5 text-[8px] font-bold text-red-500 hover:text-red-700 p-1 flex items-center gap-1 hover:bg-red-50 rounded"
                                        onClick={() => {
                                          const itemIdsToDelete = items.map(r => r.itemId);
                                          deleteMeasurementSegment(itemIdsToDelete);
                                        }}
                                        title={`Delete entire ${title} segment`}
                                      >
                                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                                        Delete Section
                                      </Button>
                                    )}
                                  </div>
                                  <div className="overflow-x-auto border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
                                    <table className="w-full text-[10px] border-collapse bg-white">
                                      <thead>
                                        <tr className="bg-zinc-50/80 text-zinc-500 font-bold uppercase tracking-tighter text-[8px] border-b border-zinc-200">
                                          <th className="px-2 py-2.5 text-center border-r border-zinc-200 w-8">S.No</th>
                                          <th className="px-3 py-2.5 text-left border-r border-zinc-200 w-28">Item / Size</th>
                                          {columns.map(col => (
                                            <th key={col.key} className="px-3 py-2.5 text-center border-r border-zinc-200">{col.label}</th>
                                          ))}
                                          <th className="px-3 py-2.5 text-center border-r border-zinc-200">Result</th>
                                          <th className="px-2 py-2.5 text-center w-10"></th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-zinc-200">
                                        {items.map((report, idx) => (
                                          <tr key={report.itemId} className="hover:bg-indigo-50/20 transition-colors">
                                            <td className="px-2 py-3 border-r border-zinc-100 font-black text-zinc-400 text-center bg-zinc-50/10">
                                              {idx + 1}
                                            </td>
                                            <td className="px-3 py-3 border-r border-zinc-100 bg-white">
                                              <div className="flex flex-col gap-1">
                                                <div className="flex flex-col">
                                                   <div className="flex items-center gap-1">
                                                      <select 
                                                        className="text-[10px] font-black bg-transparent border-none focus:ring-0 p-0 text-zinc-800 cursor-pointer"
                                                        value={report.size}
                                                        onChange={(e) => {
                                                          const newSize = e.target.value;
                                                          const newDims = getFittingDimensionsObject(
                                                            newSize,
                                                            report.size2 || "",
                                                            report.type || "",
                                                            report.schedule || "",
                                                            report.dimensions
                                                          );
                                                          setDimensionalReports(prev => prev.map(r => r.itemId === report.itemId ? { 
                                                            ...r, 
                                                            size: newSize,
                                                            dimensions: newDims 
                                                          } : r));
                                                        }}
                                                      >
                                                        {Object.keys(FITTING_STANDARDS).map(s => <option key={s} value={s}>{s}</option>)}
                                                      </select>
                                                      {(report.size2 || (report.type || "").toLowerCase().includes("reducer") || (report.type || "").toLowerCase().includes("tee")) && (
                                                        <div className="flex items-center gap-1">
                                                          <span className="text-[9px] text-zinc-400 font-bold">×</span>
                                                          <select 
                                                            className="text-[10px] font-black bg-transparent border-none focus:ring-0 p-0 text-indigo-600 cursor-pointer"
                                                            value={report.size2 || ""}
                                                            onChange={(e) => {
                                                              const newSize2 = e.target.value;
                                                              const newDims = getFittingDimensionsObject(
                                                                report.size,
                                                                newSize2,
                                                                report.type || "",
                                                                report.schedule || "",
                                                                report.dimensions
                                                              );
                                                              setDimensionalReports(prev => prev.map(r => r.itemId === report.itemId ? { 
                                                                ...r, 
                                                                size2: newSize2,
                                                                dimensions: newDims
                                                              } : r));
                                                            }}
                                                          >
                                                            <option value="">Size 2</option>
                                                            {Object.keys(FITTING_STANDARDS).map(s => <option key={s} value={s}>{s}</option>)}
                                                          </select>
                                                        </div>
                                                      )}
                                                    <span className="text-[7px] font-bold text-zinc-400 uppercase leading-none mt-0.5 tracking-tighter">
                                                      {report.type}
                                                    </span>
                                                 </div>
                                               </div>
                                               <div className="flex">
                                                     <select 
                                                        className="text-[8px] bg-indigo-50 border border-indigo-100 rounded px-1.5 py-0.5 font-black uppercase text-indigo-700 cursor-pointer hover:bg-indigo-100 transition-colors"
                                                        value={report.schedule}
                                                        onChange={(e) => {
                                                          const sch = e.target.value;
                                                          const newDims = getFittingDimensionsObject(
                                                            report.size,
                                                            report.size2 || "",
                                                            report.type || "",
                                                            sch,
                                                            report.dimensions
                                                          );
                                                          setDimensionalReports(prev => prev.map(r => r.itemId === report.itemId ? { 
                                                            ...r, 
                                                            schedule: sch,
                                                            dimensions: newDims 
                                                          } : r));
                                                        }}
                                                      >
                                                        {FITTING_SCHEDULES.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                                      </select>
                                                  </div>
                                              </div>
                                            </td>
                                            {columns.map(col => {
                                              const dim = report.dimensions[col.key] || { standard: "---", measured: "" };
                                              return (
                                                <DimensionCell 
                                                  key={col.key} 
                                                  dim={dim} 
                                                  onUpdate={(val) => updateDimensionalReport(report.itemId, col.key, val)}
                                                  isInvalid={dim.isValid === false}
                                                />
                                              );
                                            })}
                                            <ResultCell 
                                              result={report.result} 
                                              onUpdate={(val) => updateDimensionalResult(report.itemId, val as any)}
                                              onValidate={() => validateWithAI(report.itemId)}
                                              isProcessing={isAiProcessing}
                                            />
                                            <td className="px-2 py-3 text-center align-middle">
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 w-6 p-0 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                onClick={() => deleteMeasurementItem(report.itemId)}
                                                title="Delete this row"
                                              >
                                                <Trash2 className="w-3.5 h-3.5 text-red-500" />
                                              </Button>
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              );
                            }

                            return (
                              <div className="space-y-6">
                                {renderTable("ELBOWS", elbows, [
                                  { key: "OD", label: "OD" },
                                  { key: "WT", label: "WT" },
                                  { key: "CenterToCenter", label: "Center to End" }
                                ])}
                                {renderTable("TEES", tees, [
                                  { key: "RunOD", label: "Run OD" },
                                  { key: "BranchOD", label: "Branch OD" },
                                  { key: "RunWT", label: "Run WT" },
                                  { key: "BranchWT", label: "Branch WT" },
                                  { key: "CenterToCenter", label: "Center to End" }
                                ])}
                                {renderTable("REDUCERS", reducers, [
                                  { key: "LargeEndOD", label: "Large End OD" },
                                  { key: "SmallEndOD", label: "Small End OD" },
                                  { key: "LargeWT", label: "Large WT" },
                                  { key: "SmallWT", label: "Small WT" },
                                  { key: "Length", label: "Length" }
                                ])}
                                {renderTable("BW CAPS", caps, [
                                  { key: "OD", label: "OD" },
                                  { key: "WT", label: "WT" },
                                  { key: "Height", label: "Height" }
                                ])}
                                {renderTable("STUB ENDS", stubEnds, [
                                  { key: "OD", label: "OD" },
                                  { key: "WT", label: "WT" },
                                  { key: "Length", label: "Length" }
                                ])}
                                {renderTable("OTHER FITTINGS", others, [
                                  { key: "OD", label: "OD" },
                                  { key: "WT", label: "WT" },
                                  { key: "CenterToCenter", label: "Length" }
                                ])}
                              </div>
                            );
                          })()}
                        </div>
                      )}

                      {/* Pipes Table */}
                      {dimensionalReports.filter(r => r.category === "pipe").length > 0 && (
                        <div className="space-y-3 mt-6">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="text-xs font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2">
                               <CheckCircle2 className="w-3 h-3" />
                               Dimensional Verification: Pipes (ASME B36.10/B36.19)
                            </h4>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-5 text-[8px] font-bold text-red-500 hover:text-red-700 p-1 flex items-center gap-1 hover:bg-red-50 rounded"
                              onClick={() => {
                                const pipeIds = dimensionalReports.filter(r => r.category === "pipe").map(r => r.itemId);
                                deleteMeasurementSegment(pipeIds);
                              }}
                              title="Delete entire Pipes segment"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-red-500" />
                              Delete Section
                            </Button>
                          </div>
                          <div className="overflow-x-auto border border-zinc-200 rounded-xl">
                            <table className="w-full text-[10px] border-collapse text-center">
                              <thead>
                                <tr className="bg-zinc-50 text-zinc-500 font-bold uppercase tracking-tighter text-[9px]">
                                  <th className="px-2 py-3 text-center border-r border-zinc-200 w-8">S.No</th>
                                  <th className="px-3 py-3 text-left border-r border-zinc-200 w-24">Item / Size</th>
                                  <th className="px-3 py-3 text-center border-r border-zinc-200">Outer Diameter (OD)</th>
                                  <th className="px-3 py-3 text-center border-r border-zinc-200">Thickness (WT)</th>
                                  <th className="px-3 py-3 text-center border-r border-zinc-200">Result</th>
                                  <th className="px-2 py-3 text-center w-10"></th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-zinc-200">
                                {dimensionalReports.filter(r => r.category === "pipe").map((report, idx) => (
                                  <tr key={report.itemId} className="hover:bg-emerald-50/30 transition-colors">
                                    <td className="px-3 py-3 border-r border-zinc-100 font-black text-zinc-400 bg-zinc-50/30 text-center">
                                      {idx + 1}
                                    </td>
                                    <td className="px-3 py-3 border-r border-zinc-100 font-black text-zinc-800 bg-zinc-50/50 text-left">
                                      <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-1">
                                          <select 
                                            className="text-[10px] font-black bg-transparent border-none focus:ring-0 p-0 cursor-pointer text-zinc-800"
                                            value={report.size}
                                            onChange={(e) => {
                                              const newSize = e.target.value;
                                              const newDims = getPipeDimensionsObject(
                                                newSize,
                                                report.schedule || "",
                                                report.dimensions
                                              );

                                              setDimensionalReports(prev => prev.map(r => r.itemId === report.itemId ? {
                                                ...r,
                                                size: newSize,
                                                dimensions: newDims
                                              } : r));
                                            }}
                                          >
                                            <option value="Unknown">Select Size 1</option>
                                            {Object.keys(FITTING_STANDARDS).map(s => (
                                              <option key={s} value={s}>{s}</option>
                                            ))}
                                          </select>
                                          {(report.type?.includes("Reducer") || report.type?.includes("Tee")) && (
                                            <>
                                              <span className="text-zinc-400">x</span>
                                              <select 
                                                className="text-[10px] font-black bg-transparent border-none focus:ring-0 p-0 cursor-pointer text-amber-600"
                                                value={report.size2 || ""}
                                                onChange={(e) => {
                                                  const newSize2 = e.target.value;
                                                  const std1 = (FITTING_STANDARDS as any)[report.size];
                                                  const std2 = (FITTING_STANDARDS as any)[newSize2];
                                                  
                                                  const getWT = (std: any, s: string) => {
                                                    if (!s || !std?.schedules) return "---";
                                                    if (std.schedules[s]) return std.schedules[s];
                                                    if (std.schedules[`SCH ${s}`]) return std.schedules[`SCH ${s}`];
                                                    if ((s === "STD" || s === "40") && std.schedules["SCH 40 (STD)"]) return std.schedules["SCH 40 (STD)"];
                                                    if ((s === "XS" || s === "80") && std.schedules["SCH 80 (XS)"]) return std.schedules["SCH 80 (XS)"];
                                                    if (s === "XXS" && std.schedules["SCH XXS"]) return std.schedules["SCH XXS"];
                                                    if (s.startsWith("SCH ") && std.schedules[s.replace("SCH ", "")]) return std.schedules[s.replace("SCH ", "")];
                                                    if (/^\d+$/.test(s) && std.schedules[`SCH ${s}`]) return std.schedules[`SCH ${s}`];
                                                    return "---";
                                                  };

                                                  let odVal = std1?.od || "---";
                                                  if (std2) odVal = `${odVal} x ${std2.od || "---"}`;

                                                  let wtVal = getWT(std1, report.schedule || "");
                                                  if (std2) wtVal = `${wtVal} x ${getWT(std2, report.schedule || "")}`;

                                                  setDimensionalReports(prev => prev.map(r => r.itemId === report.itemId ? {
                                                    ...r,
                                                    size2: newSize2,
                                                    dimensions: {
                                                      ...r.dimensions,
                                                      "OD": { standard: odVal, measured: r.dimensions["OD"]?.measured || "" },
                                                      "WT": { standard: wtVal, measured: r.dimensions["WT"]?.measured || "" }
                                                    }
                                                  } : r));
                                                }}
                                              >
                                                <option value="">Size 2</option>
                                                {Object.keys(FITTING_STANDARDS).map(s => (
                                                  <option key={s} value={s}>{s}</option>
                                                ))}
                                              </select>
                                            </>
                                          )}
                                        </div>
                                        <div className="flex flex-col gap-1">
                                          <div className="text-[8px] bg-emerald-50 border border-emerald-200 rounded px-1 py-0.5 font-bold uppercase text-emerald-800 text-center">
                                            PIPE
                                          </div>
                                          {(() => {
                                            const std1 = (FITTING_STANDARDS as any)[report.size];
                                            const std2 = report.size2 ? (FITTING_STANDARDS as any)[report.size2] : null;
                                            if (std1?.schedules) {
                                              return (
                                                <select 
                                                  className="text-[8px] bg-emerald-50 border border-emerald-200 rounded px-1 py-0.5 font-bold uppercase text-emerald-800 w-full"
                                                  value={report.schedule || ""}
                                                  onChange={(e) => {
                                                    const sch = e.target.value;
                                                    const newDims = getPipeDimensionsObject(
                                                      report.size,
                                                      sch,
                                                      report.dimensions
                                                    );
                                                    setDimensionalReports(prev => prev.map(r => r.itemId === report.itemId ? {
                                                      ...r,
                                                      schedule: sch,
                                                      dimensions: newDims
                                                    } : r));
                                                  }}
                                                >
                                                  <option value="">SELECT SCH</option>
                                                  {FITTING_SCHEDULES.map(opt => (
                                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                  ))}
                                                </select>
                                            );
                                          }
                                          return null;
                                        })()}
                                        </div>
                                      </div>
                                    </td>
                                    {["OD", "WT"].map(key => (
                                      <DimensionCell 
                                        key={key}
                                        dim={report.dimensions[key] || { standard: "---", measured: "" }} 
                                        onUpdate={(val) => updateDimensionalReport(report.itemId, key, val)}
                                        isInvalid={report.dimensions[key]?.isValid === false}
                                      />
                                    ))}
                                    <ResultCell 
                                      result={report.result} 
                                      onUpdate={(val) => updateDimensionalResult(report.itemId, val as any)}
                                      onValidate={() => validateWithAI(report.itemId)}
                                      isProcessing={isAiProcessing}
                                    />
                                    <td className="px-2 py-3 text-center align-middle">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 w-6 p-0 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        onClick={() => deleteMeasurementItem(report.itemId)}
                                        title="Delete this row"
                                      >
                                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                                      </Button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {dimensionalReports.filter(r => r.category === "forged_fitting").length > 0 && (
                        <div className="space-y-3 mt-6">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="text-xs font-black text-brand-600 uppercase tracking-widest flex items-center gap-2">
                               <Box className="w-3 h-3" />
                               Dimensional Verification: Forged Fittings (ASME B16.11)
                            </h4>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-5 text-[8px] font-bold text-red-500 hover:text-red-700 p-1 flex items-center gap-1 hover:bg-red-50 rounded"
                              onClick={() => {
                                const forgedIds = dimensionalReports.filter(r => r.category === "forged_fitting").map(r => r.itemId);
                                deleteMeasurementSegment(forgedIds);
                              }}
                              title="Delete entire Forged Fittings segment"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-red-500" />
                              Delete Section
                            </Button>
                          </div>
                          <div className="overflow-x-auto border border-zinc-200 rounded-xl">
                            <table className="w-full text-[10px] border-collapse text-center">
                              <thead>
                                <tr className="bg-zinc-50 text-zinc-500 font-bold uppercase tracking-tighter text-[9px]">
                                  <th className="px-2 py-3 text-center border-r border-zinc-200 w-8">S.No</th>
                                  <th className="px-3 py-3 text-left border-r border-zinc-200 w-24">Item / Size</th>
                                  <th className="px-3 py-3 text-center border-r border-zinc-200">OD (Hub)</th>
                                  <th className="px-3 py-3 text-center border-r border-zinc-200">WT (Wall)</th>
                                  <th className="px-3 py-3 text-center border-r border-zinc-200">Center-to-Center / Length</th>
                                  <th className="px-3 py-3 text-center border-r border-zinc-200">Height</th>
                                  <th className="px-3 py-3 text-center border-r border-zinc-200">Result</th>
                                  <th className="px-2 py-3 text-center w-10"></th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-zinc-200">
                                {dimensionalReports.filter(r => r.category === "forged_fitting").map((report, idx) => (
                                  <tr key={report.itemId} className="hover:bg-brand-50/30 transition-colors">
                                    <td className="px-3 py-3 border-r border-zinc-100 font-black text-zinc-400 bg-zinc-50/30 text-center">
                                      {idx + 1}
                                    </td>
                                    <td className="px-3 py-3 border-r border-zinc-100 font-black text-zinc-800 bg-zinc-50/50">
                                      <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-1 text-[10px]">
                                          <select 
                                            className="text-[10px] font-black bg-transparent border-none focus:ring-0 p-0 cursor-pointer text-zinc-800"
                                            value={report.size}
                                            onChange={(e) => {
                                              const newSize = e.target.value;
                                              const newDims = getForgedFittingDimensionsObject(
                                                newSize,
                                                report.type || "",
                                                report.standardClass || "",
                                                report.dimensions
                                              );
                                              setDimensionalReports(prev => prev.map(r => r.itemId === report.itemId ? {
                                                ...r,
                                                size: newSize,
                                                dimensions: newDims
                                              } : r));
                                            }}
                                          >
                                            <option value="Unknown">Select Size</option>
                                            {Object.keys(FORGED_FITTING_STANDARDS).map(s => (
                                              <option key={s} value={s}>{s}</option>
                                            ))}
                                          </select>
                                          <span className="text-[7px] bg-brand-100 text-brand-700 px-1 py-0.5 rounded font-bold">#{report.standardClass}</span>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                          <select 
                                            className="text-[8px] bg-white border border-zinc-200 rounded px-1 py-0.5 font-bold uppercase text-brand-700 w-full"
                                            value={report.type}
                                            onChange={(e) => {
                                              const newType = e.target.value;
                                              const newDims = getForgedFittingDimensionsObject(
                                                report.size,
                                                newType,
                                                report.standardClass || "",
                                                report.dimensions
                                              );
                                              setDimensionalReports(prev => prev.map(r => r.itemId === report.itemId ? {
                                                ...r,
                                                type: newType,
                                                dimensions: newDims
                                              } : r));
                                            }}
                                          >
                                            <optgroup label="SOCKET WELD">
                                              <option value="SW 90 Elbow">SW 90° ELBOW</option>
                                              <option value="SW 45 Elbow">SW 45° ELBOW</option>
                                              <option value="SW Tee">SW EQUAL TEE</option>
                                              <option value="SW Cross">SW CROSS</option>
                                              <option value="SW Coupling">SW COUPLING</option>
                                              <option value="SW Half Coupling">SW HALF COUPLING</option>
                                              <option value="SW Cap">SW CAP</option>
                                            </optgroup>
                                            <optgroup label="THREADED">
                                              <option value="THD 90 Elbow">THD 90° ELBOW</option>
                                              <option value="THD 45 Elbow">THD 45° ELBOW</option>
                                              <option value="THD Street Elbow">THD STREET ELBOW</option>
                                              <option value="THD Tee">THD EQUAL TEE</option>
                                              <option value="THD Cross">THD CROSS</option>
                                              <option value="THD Coupling">THD COUPLING</option>
                                              <option value="THD Cap">THD CAP</option>
                                              <option value="THD Hex Plug">THD HEX PLUG</option>
                                              <option value="THD Square Head Plug">THD SQUARE PLUG</option>
                                              <option value="THD Round Head Plug">THD ROUND PLUG</option>
                                              <option value="THD Hex Head Bushing">THD HEX BUSHING</option>
                                              <option value="THD Flush Bushing">THD FLUSH BUSHING</option>
                                            </optgroup>
                                            </select>
                                          <select 
                                            className="text-[8px] bg-brand-50 border border-brand-200 rounded px-1 py-0.5 font-bold uppercase text-brand-800 w-full"
                                            value={report.standardClass}
                                            onChange={(e) => {
                                              const newRating = e.target.value;
                                              const newDims = getForgedFittingDimensionsObject(
                                                report.size,
                                                report.type || "",
                                                newRating,
                                                report.dimensions
                                              );

                                              setDimensionalReports(prev => prev.map(r => r.itemId === report.itemId ? {
                                                ...r,
                                                standardClass: newRating,
                                                dimensions: newDims
                                              } : r));
                                            }}
                                          >
                                            <option value="2000">2000#</option>
                                            <option value="3000">3000#</option>
                                            <option value="6000">6000#</option>
                                            <option value="9000">9000#</option>
                                          </select>
                                        </div>
                                      </div>
                                    </td>
                                    {["OD", "WT", "CenterToCenter", "Height"].map(key => (
                                      <DimensionCell 
                                        key={key}
                                        dim={report.dimensions[key] || { standard: "---", measured: "" }} 
                                        onUpdate={(val) => updateDimensionalReport(report.itemId, key, val)}
                                        isInvalid={report.dimensions[key]?.isValid === false}
                                      />
                                    ))}
                                    <ResultCell 
                                      result={report.result} 
                                      onUpdate={(val) => updateDimensionalResult(report.itemId, val as any)}
                                      onValidate={() => validateWithAI(report.itemId)}
                                      isProcessing={isAiProcessing}
                                    />
                                    <td className="px-2 py-3 text-center align-middle">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 w-6 p-0 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        onClick={() => deleteMeasurementItem(report.itemId)}
                                        title="Delete this row"
                                      >
                                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                                      </Button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* Branch Connections (Olets) Table */}
                      {dimensionalReports.filter(r => r.category === "olet").length > 0 && (
                        <div className="space-y-3 mt-6">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="text-xs font-black text-amber-600 uppercase tracking-widest flex items-center gap-2">
                               <Box className="w-3 h-3" />
                               Dimensional Verification: Branch Connections (MSS SP-97 / ASME B31.3)
                            </h4>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-5 text-[8px] font-bold text-red-500 hover:text-red-700 p-1 flex items-center gap-1 hover:bg-red-50 rounded"
                              onClick={() => {
                                const oletIds = dimensionalReports.filter(r => r.category === "olet").map(r => r.itemId);
                                deleteMeasurementSegment(oletIds);
                              }}
                              title="Delete entire Branch Connections segment"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-red-500" />
                              Delete Section
                            </Button>
                          </div>
                          <div className="overflow-x-auto border border-zinc-200 rounded-xl">
                            <table className="w-full text-[10px] border-collapse text-center">
                              <thead>
                                <tr className="bg-zinc-50 text-zinc-500 font-bold uppercase tracking-tighter text-[9px]">
                                  <th className="px-2 py-3 text-center border-r border-zinc-200 w-8">S.No</th>
                                  <th className="px-3 py-3 text-left border-r border-zinc-200 w-24">Item / Size</th>
                                  <th className="px-3 py-3 text-center border-r border-zinc-200">Outer Diameter (OD)</th>
                                  <th className="px-3 py-3 text-center border-r border-zinc-200">Thickness (WT)</th>
                                  <th className="px-3 py-3 text-center border-r border-zinc-200">Height (L)</th>
                                  <th className="px-3 py-3 text-center border-r border-zinc-200">Result</th>
                                  <th className="px-2 py-3 text-center w-10"></th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-zinc-200">
                                {dimensionalReports.filter(r => r.category === "olet").map((report, idx) => (
                                  <tr key={report.itemId} className="hover:bg-amber-50/30 transition-colors">
                                    <td className="px-3 py-3 border-r border-zinc-100 font-black text-zinc-400 bg-zinc-50/30 text-center">
                                      {idx + 1}
                                    </td>
                                    <td className="px-3 py-3 border-r border-zinc-100 font-black text-zinc-800 bg-zinc-50/50 text-left">
                                      <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-1">
                                          <select 
                                            className="text-[10px] font-black bg-transparent border-none focus:ring-0 p-0 cursor-pointer text-zinc-800"
                                            value={report.size}
                                            onChange={(e) => {
                                              const newSize = e.target.value;
                                              const newDims = getOletDimensionsObject(
                                                newSize,
                                                report.type || "",
                                                report.schedule || "",
                                                report.schedule || "",
                                                report.dimensions
                                              );

                                              setDimensionalReports(prev => prev.map(r => r.itemId === report.itemId ? {
                                                ...r,
                                                size: newSize,
                                                dimensions: newDims
                                              } : r));
                                            }}
                                          >
                                            <option value="Unknown">Select Size</option>
                                            {Object.keys(FITTING_STANDARDS).map(s => (
                                              <option key={s} value={s}>{s}</option>
                                            ))}
                                          </select>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                          <select 
                                            className="text-[8px] bg-white border border-zinc-200 rounded px-1 py-0.5 font-bold uppercase text-amber-700 w-full"
                                            value={report.type}
                                            onChange={(e) => {
                                              const nextType = e.target.value;
                                              const newDims = getOletDimensionsObject(
                                                report.size,
                                                nextType,
                                                report.schedule || "",
                                                report.schedule || "",
                                                report.dimensions
                                              );
                                              setDimensionalReports(prev => prev.map(r => r.itemId === report.itemId ? { 
                                                ...r, 
                                                type: nextType,
                                                dimensions: newDims
                                              } : r));
                                            }}
                                          >
                                            <option value="WELDOLET">WELDOLET</option>
                                            <option value="SOCKOLET">SOCKOLET</option>
                                            <option value="THREDOLET">THREDOLET</option>
                                          </select>
                                          {(() => {
                                            const isWeldolet = report.type === "WELDOLET";
                                            if (isWeldolet) {
                                              const std = (FITTING_STANDARDS as any)[report.size];
                                              if (std?.schedules) {
                                                return (
                                                  <select 
                                                    className="text-[8px] bg-amber-50 border border-amber-200 rounded px-1 py-0.5 font-bold uppercase text-amber-800 w-full"
                                                    value={report.schedule || ""}
                                                    onChange={(e) => {
                                                      const sch = e.target.value;
                                                      const newDims = getOletDimensionsObject(
                                                        report.size,
                                                        report.type || "",
                                                        sch,
                                                        sch,
                                                        report.dimensions
                                                      );
                                                      setDimensionalReports(prev => prev.map(r => r.itemId === report.itemId ? {
                                                        ...r,
                                                        schedule: sch,
                                                        dimensions: newDims
                                                      } : r));
                                                    }}
                                                  >
                                                    <option value="">SELECT SCH</option>
                                                    {FITTING_SCHEDULES.map(opt => (
                                                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                    ))}
                                                  </select>
                                                );
                                              }
                                            } else {
                                              const forgedStd = (FORGED_FITTING_STANDARDS as any)[report.size];
                                              if (forgedStd) {
                                                const ratings = Object.keys(forgedStd).filter(k => k === "2000" || k === "3000" || k === "6000" || k === "9000");
                                                return (
                                                  <select 
                                                    className="text-[8px] bg-blue-50 border border-blue-200 rounded px-1 py-0.5 font-bold uppercase text-blue-800 w-full"
                                                    value={(report.schedule || "").replace("#", "")}
                                                    onChange={(e) => {
                                                      const rating = e.target.value;
                                                      const schVal = `${rating}#`;
                                                      const newDims = getOletDimensionsObject(
                                                        report.size,
                                                        report.type || "",
                                                        schVal,
                                                        schVal,
                                                        report.dimensions
                                                      );
                                                      setDimensionalReports(prev => prev.map(r => r.itemId === report.itemId ? {
                                                        ...r,
                                                        schedule: schVal,
                                                        dimensions: newDims
                                                      } : r));
                                                    }}
                                                  >
                                                    <option value="">SELECT CLASS</option>
                                                    {ratings.map(r => (
                                                      <option key={r} value={r}>{r}#</option>
                                                    ))}
                                                  </select>
                                                );
                                              }
                                            }
                                            return null;
                                          })()}
                                        </div>
                                      </div>
                                    </td>
                                    {["OD", "WT", "Height"].map(key => (
                                      <DimensionCell 
                                        key={key}
                                        dim={report.dimensions[key] || { standard: "---", measured: "" }} 
                                        onUpdate={(val) => updateDimensionalReport(report.itemId, key, val)}
                                        isInvalid={report.dimensions[key]?.isValid === false}
                                      />
                                    ))}
                                    <ResultCell 
                                      result={report.result} 
                                      onUpdate={(val) => updateDimensionalResult(report.itemId, val as any)}
                                      onValidate={() => validateWithAI(report.itemId)}
                                      isProcessing={isAiProcessing}
                                    />
                                    <td className="px-2 py-3 text-center align-middle">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 w-6 p-0 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        onClick={() => deleteMeasurementItem(report.itemId)}
                                        title="Delete this row"
                                      >
                                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                                      </Button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {dimensionalReports.length === 0 && (
                        <div className="py-12 text-center border-2 border-dashed border-zinc-100 rounded-2xl">
                          <Eye className="w-10 h-10 text-zinc-200 mx-auto mb-3" />
                          <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest">No dimensional parameters detected</p>
                          <p className="text-[10px] text-zinc-400 mt-1">Add items like "Flange" or "Fitting" with size (e.g. 2") to generate this tab</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader title="3. INSPECTION BODY DECLARATION" />
                    <CardContent className="space-y-4">
                       <textarea 
                        className="w-full h-24 bg-zinc-50 rounded-xl px-4 py-3 text-sm italic font-medium text-zinc-600 border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                        value={qualityDeclaration}
                        onChange={(e) => setQualityDeclaration(e.target.value)}
                       />
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* MTC Certification Portal */}
              {false && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-6"
                >
                  <Card className="border border-zinc-200">
                    <CardHeader 
                      title="1. MTC CERTIFICATE METADATA" 
                      action={
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setMtcCertificateNo("VESCO/PL/E/" + Math.floor(10000 + Math.random() * 90000) + "/2023-24");
                          }}
                          className="text-xs font-black"
                        >
                          Auto generate Certificate No
                        </Button>
                      }
                    />
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input 
                        label="Certificate No" 
                        value={mtcCertificateNo} 
                        onChange={(e) => setMtcCertificateNo(e.target.value)} 
                        placeholder="e.g. VESCO/PL/E/23476/2023-24"
                      />
                      <div className="flex flex-col gap-1">
                         <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">MTC Type</label>
                         <div className="flex gap-2">
                           {["3.1", "3.2"].map(type => (
                             <button
                                key={type}
                                onClick={() => setMtcType(type as "3.1" | "3.2")}
                                className={`px-4 py-2 rounded-lg text-sm font-bold border transition-all ${mtcType === type ? "bg-zinc-800 text-white border-zinc-800" : "bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50"}`}
                             >
                               EN 10204 {type}
                             </button>
                           ))}
                         </div>
                      </div>
                      <Input 
                        label="Specification" 
                        value={mtcSpecification} 
                        onChange={(e) => setMtcSpecification(e.target.value)} 
                        placeholder="e.g. ASME SA420M GR.WPL6-2021/ASTM A420M WPL6-2019"
                      />
                      <Input 
                        label="Dimension standard Class" 
                        value={mtcDimension} 
                        onChange={(e) => setMtcDimension(e.target.value)} 
                        placeholder="e.g. ASME B16.9-2018 ED."
                      />
                    </CardContent>
                  </Card>

                  {/* AI Advanced Metallurgy Engine */}
                  <Card className="bg-zinc-950 text-white border border-zinc-800 shadow-xl overflow-hidden relative group">
                    <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none group-hover:scale-110 transition-transform duration-700 font-black">
                      MTC
                    </div>
                    <CardContent className="p-6 relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="space-y-1.5 md:max-w-xl">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-100 border border-zinc-700 text-[9px] font-black uppercase tracking-wider">
                          <Wand2 size={10} className="className" />
                          <span>Metallurgical Brain</span>
                        </div>
                        <h3 className="text-lg font-extrabold tracking-tight">AI Metallurgy Analysis & Traceability Engine</h3>
                        <p className="text-xs text-zinc-400 leading-relaxed font-medium">
                          Fills realistic chemical properties, material grades, mechanical values, and heat treatment conditions based on standard metallurgical guidelines using BillIQ AI. Runs complete calculations and auto-detects components!
                        </p>
                      </div>
                      <Button
                        onClick={async () => {
                          setIsGeneratingMtc(true);
                          try {
                            const updated = await smartGenerateMtcData(items);
                            if (updated && updated.length > 0) {
                              setItems(updated);
                              showModal({
                                title: "Metallurgical Data Generated",
                                message: "All chemical composition, mechanical limits, and heat treatment parameters have been simulated and formatted successfully.",
                                type: "success"
                              });
                            }
                          } catch (err: any) {
                            const activeEmail = impersonatedUser?.email || user?.email;
                            showModal({
                              title: "Generation failed",
                              message: getDisplayErrorMessage(err, activeEmail, "Unable to generate details at this moment. Please try again or fill in the fields manually."),
                              type: "warning"
                            });
                          } finally {
                            setIsGeneratingMtc(false);
                          }
                        }}
                        disabled={isGeneratingMtc}
                        className="bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-black px-6 py-3.5 rounded-xl shadow-lg shadow-white/5 flex items-center justify-center gap-2 cursor-pointer select-none"
                      >
                        {isGeneratingMtc ? (
                          <>
                            <Loader2 className="h-5 w-5 animate-spin shrink-0" />
                            <span>Computing Metallurgy...</span>
                          </>
                        ) : (
                          <>
                            <Zap className="h-5 w-5 text-zinc-950 shrink-0" />
                            <span>Auto-Fill MTC Parameters</span>
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Heat Treatment, Chemistry and Mechanical parameter table */}
                  <Card>
                    <CardHeader title="2. CHEMICAL & MECHANICAL TESTING LABORATORY REGISTRY" />
                    <CardContent className="space-y-6">
                      {items.map((item, index) => {
                        const tab = activeMtcTabs[item.id] || "chemistry";
                        return (
                          <div key={`${item.id || 'item'}-${index}`} className="p-4 bg-zinc-50 border border-zinc-200 rounded-2xl relative group/item">
                            <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-zinc-200 pb-3 mb-4 gap-3">
                              <div className="space-y-0.5">
                                <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-md bg-zinc-200 text-[10px] font-bold text-zinc-600 mr-2">
                                  ITEM #{index + 1}
                                </span>
                                <span className="text-sm font-extrabold text-zinc-800">{item.description || "Unnamed Material Specimen"}</span>
                                <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest leading-none">
                                  Quantity: {item.quantity} {item.unit || "NOS"}
                                </p>
                              </div>
                              {/* Sub tabs */}
                              <div className="flex gap-1.5 p-0.5 bg-zinc-250 rounded-xl border border-zinc-200">
                                {["chemistry", "mechanical", "treatment"].map((t) => (
                                  <button
                                    key={t}
                                    type="button"
                                    onClick={() => setActiveMtcTabs(prev => ({ ...prev, [item.id]: t }))}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all select-none cursor-pointer ${tab === t ? "bg-white text-zinc-800 shadow-sm" : "bg-transparent text-zinc-500 hover:text-zinc-800"}`}
                                  >
                                    {t}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Core Physical fields */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4 bg-white p-3.5 rounded-xl border border-zinc-200">
                              <div className="relative">
                                <Input 
                                  label="Heat No / Batch No" 
                                  value={item.heatNo || ""} 
                                  onChange={(e) => updateItem(item.id, { heatNo: e.target.value })} 
                                  placeholder="HT-1960"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    updateItem(item.id, { heatNo: "HT-" + Math.floor(100000 + Math.random() * 900000) });
                                  }}
                                  className="absolute right-2 top-6 text-[9px] font-black text-zinc-500 hover:text-zinc-800 select-none cursor-pointer"
                                >
                                  Gen
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>

                  {/* Certificate Footnotes */}
                  <Card>
                    <CardHeader title="3. OFFICIAL CERTIFICATE REMARKS & STANDARD FOOTNOTES" />
                    <CardContent>
                      <label className="block text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest mb-1.5 ml-1">Footnotes list (printed at the bottom-left)</label>
                      <textarea
                        className="w-full h-44 bg-zinc-50 rounded-xl px-4 py-3 text-xs text-zinc-700 focus:outline-none border border-zinc-200 resize-none font-medium leading-relaxed"
                        value={mtcRemarks}
                        onChange={(e) => setMtcRemarks(e.target.value)}
                        placeholder="Enter footnotes, one per line..."
                      />
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {docType === DocumentType.COST_SHEET && (
                <div className="bg-white p-4 rounded-2xl border border-zinc-200/80 shadow-sm flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-extrabold text-zinc-500 uppercase tracking-wider">Document Type:</span>
                    <select 
                      className="bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2 text-sm font-bold text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 cursor-pointer"
                      value={docType}
                      onChange={(e) => setDocType(e.target.value as DocumentType)}
                    >
                      {DOCUMENT_TYPE_OPTIONS.filter(opt => isIndia || opt !== DocumentType.DELIVERY_CHALLAN).map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-zinc-400">Currency:</span>
                    <select 
                      value={currency}
                      onChange={(e) => {
                        const newCurr = e.target.value;
                        setCurrency(newCurr);
                        if (!isExport) {
                          handleBusinessChange({ currency: newCurr });
                        }
                      }}
                      className="bg-zinc-50 text-zinc-800 px-3 py-1.5 rounded-xl text-xs font-bold focus:outline-none border border-zinc-200 cursor-pointer"
                    >
                      {ALL_CURRENCIES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.symbol} {c.code} - {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Document & Transport Reference Details (Grouped Card above Customer Details) */}
              {docType !== DocumentType.COST_SHEET && (
                <Card className={docErrors.docId ? "border-red-500" : ""}>
                <CardHeader 
                  title="Document & Reference Details" 
                  subtitle="Configure document type, export status, number, dates, and references"
                />
                <CardContent className="space-y-4">
                  {/* 1ST PLACE: Export Document & Tax Options Selection Bar */}
                  <div className="bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 text-white rounded-2xl p-4 border border-zinc-700 shadow-md space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-white/10 hover:bg-white/15 px-3 py-1.5 rounded-xl border border-white/20 transition-all cursor-pointer">
                          <input 
                            type="checkbox" 
                            id="is-export-top"
                            checked={isExport}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setIsExport(checked);
                              if (checked) {
                                setIsTaxEnabled(false);
                              } else {
                                setIsTaxEnabled(true);
                              }
                            }}
                            className="w-4 h-4 accent-brand-500 rounded border-white/30 cursor-pointer"
                          />
                          <label htmlFor="is-export-top" className="text-sm font-bold text-white flex items-center gap-2 cursor-pointer select-none">
                            <Globe className="h-4 w-4 text-brand-400" />
                            Export Document
                          </label>
                        </div>

                        {isExport && (
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-blue-500/20 text-blue-300 border border-blue-400/30">
                              Global / Export Mode
                            </span>
                            {autoExportBadge && (
                              <span className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1.5 shadow-sm">
                                <span>✨</span> Export Mode Auto-Enabled (Overseas Client)
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Currency & Exchange Rate when Export is active */}
                      {isExport && (
                        <div className="flex flex-wrap items-center gap-3 bg-white/10 p-1.5 px-3 rounded-xl border border-white/10">
                          <div className="flex items-center gap-1.5">
                            <label className="text-[10px] font-extrabold text-zinc-300 uppercase tracking-wider">Currency:</label>
                            <select 
                              value={currency}
                              onChange={(e) => setCurrency(e.target.value)}
                              className="bg-zinc-800 text-white px-2.5 py-1 rounded-lg text-xs font-bold focus:outline-none border border-zinc-600 cursor-pointer max-w-[200px]"
                            >
                              {ALL_CURRENCIES.map((c) => (
                                <option key={c.code} value={c.code}>
                                  {c.symbol} {c.code} - {c.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          {currency !== (business.currency || countryOfOrigin || "INR") && (
                            <>
                              <div className="flex items-center gap-1.5 border-l border-white/20 pl-3">
                                <label className="text-[10px] font-extrabold text-zinc-300 uppercase tracking-wider">1 {currency} =</label>
                                <input 
                                  type="number"
                                  step="any"
                                  value={exchangeRate || ""}
                                  onChange={(e) => setExchangeRate(parseFloat(e.target.value) || 1)}
                                  className="w-20 bg-zinc-800 text-white px-2 py-1 rounded-lg text-xs font-mono font-bold text-center border border-zinc-600 focus:outline-none"
                                  placeholder="1.0"
                                />
                                <span className="text-[10px] font-extrabold text-zinc-400">{business.currency || countryOfOrigin || "INR"}</span>
                                <button 
                                  type="button"
                                  onClick={fetchExchangeRate}
                                  className="p-1 text-brand-300 hover:text-white transition-colors cursor-pointer"
                                  title="Fetch Live Rate"
                                >
                                  <Zap className="h-3.5 w-3.5" />
                                </button>
                              </div>

                              <div className="flex items-center gap-1.5 border-l border-white/20 pl-3">
                                <span className="text-[10px] font-extrabold text-zinc-300 uppercase tracking-wider">Rate Convert:</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    convertRatesToInvoiceCurrency();
                                    showShortcutToast(`Item rates converted: ${business.currency || countryOfOrigin || "INR"} → ${currency} (÷ ${exchangeRate})`);
                                  }}
                                  className="px-2 py-1 rounded-md text-[10px] font-extrabold uppercase bg-indigo-600 hover:bg-indigo-500 text-white transition-colors flex items-center gap-1 cursor-pointer shadow-sm"
                                  title={`Divide all item rates by ${exchangeRate} (${business.currency || countryOfOrigin || "INR"} → ${currency})`}
                                >
                                  <RefreshCw className="w-3 h-3 text-indigo-200" />
                                  {business.currency || countryOfOrigin || "INR"} → {currency}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    convertRatesToHomeCurrency();
                                    showShortcutToast(`Item rates converted: ${currency} → ${business.currency || countryOfOrigin || "INR"} (× ${exchangeRate})`);
                                  }}
                                  className="px-2 py-1 rounded-md text-[10px] font-extrabold uppercase bg-emerald-600 hover:bg-emerald-500 text-white transition-colors flex items-center gap-1 cursor-pointer shadow-sm"
                                  title={`Multiply all item rates by ${exchangeRate} (${currency} → ${business.currency || countryOfOrigin || "INR"})`}
                                >
                                  <RefreshCw className="w-3 h-3 text-emerald-200" />
                                  {currency} → {business.currency || countryOfOrigin || "INR"}
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      )}

                      {/* Tax Controls */}
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <input 
                            type="checkbox" 
                            id="is-tax-enabled-top"
                            checked={isTaxEnabled}
                            onChange={(e) => setIsTaxEnabled(e.target.checked)}
                            className="w-4 h-4 accent-brand-500 rounded border-white/30 cursor-pointer"
                          />
                          <label htmlFor="is-tax-enabled-top" className="text-xs font-bold text-zinc-200 flex items-center gap-1.5 cursor-pointer select-none">
                            <Receipt className="h-3.5 w-3.5 text-zinc-400" />
                            Apply Tax ({getTaxName(business.country || countryOfOrigin || "India")})
                          </label>
                        </div>

                        {isTaxEnabled && (getCountryConfig(business.country || countryOfOrigin || "India").taxSystem === "GST_INDIA" || business.taxSystem === "GST_INDIA") && (
                          <div className="flex items-center gap-1.5 border-l border-white/20 pl-3">
                            <input 
                              type="checkbox" 
                              id="is-igst-enabled-top"
                              checked={isIgst}
                              onChange={(e) => setIsIgst(e.target.checked)}
                              className="w-4 h-4 accent-brand-500 rounded border-white/30 cursor-pointer"
                            />
                            <label htmlFor="is-igst-enabled-top" className="text-xs font-bold text-zinc-200 flex items-center gap-1 cursor-pointer select-none">
                              Apply IGST <span className="text-[10px] text-zinc-400 font-normal">(Inter-State)</span>
                            </label>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-500 uppercase mb-1">Document Type</label>
                      <select 
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-sm font-bold text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 disabled:opacity-50"
                        value={docType}
                        onChange={(e) => setDocType(e.target.value as DocumentType)}
                      >
                        {DOCUMENT_TYPE_OPTIONS.filter(opt => isIndia || opt !== DocumentType.DELIVERY_CHALLAN).map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>

                    <Input 
                      label={docType === DocumentType.QUOTATION ? "Quotation Number" : docType === DocumentType.PURCHASE_ORDER ? "P.O. Number" : "Document / Invoice Number"}
                      value={docId ?? ""}
                      onChange={(e) => setDocId(e.target.value)}
                      placeholder={docType === DocumentType.PURCHASE_ORDER ? "e.g. VI/PO/001" : "e.g. GTI-01"}
                      error={docErrors.docId}
                    />

                    <Input 
                      label={docType === DocumentType.QUOTATION ? "Quotation Date" : docType === DocumentType.PURCHASE_ORDER ? "P.O. Date" : "Document Date"}
                      type="date"
                      value={date ?? ""}
                      onChange={(e) => setDate(e.target.value)}
                    />

                    {docType === DocumentType.PACKING_LIST ? (
                      <>
                        <HistoryInput 
                          label="Buyer's Ref / P.O. Number"
                          historyKey="poNumber"
                          value={poNumber ?? ""}
                          onChange={setPoNumber}
                          placeholder="e.g. GTI-01 dt. 1-Jul-2017"
                        />

                        <Input 
                          label="Buyer's Order Date"
                          type="date"
                          value={buyerOrderDate ?? ""}
                          onChange={(e) => setBuyerOrderDate(e.target.value)}
                        />
                      </>
                    ) : docType === DocumentType.PURCHASE_ORDER ? (
                      <>
                        <Input 
                          label="Expected Delivery Date"
                          type="date"
                          value={buyerOrderDate ?? ""}
                          onChange={(e) => setBuyerOrderDate(e.target.value)}
                        />

                        <PaymentTermsInput 
                          label="Payment Terms"
                          value={paymentTerms ?? ""}
                          onChange={setPaymentTerms}
                          invoiceDate={undefined}
                        />

                        <HistoryInput 
                          label="Delivery Location / Destination"
                          historyKey="finalDestination"
                          value={finalDestination ?? ""}
                          onChange={setFinalDestination}
                          placeholder="e.g. Factory Warehouse, Mumbai"
                          defaultOptions={["Mumbai", "Delhi", "Pune", "Sharjah, UAE", "Dubai, UAE"]}
                        />
                      </>
                    ) : docType === DocumentType.QUOTATION ? (
                      <>
                        <Input 
                          label="Valid Until / Expiry Date"
                          type="date"
                          value={buyerOrderDate ?? ""}
                          onChange={(e) => setBuyerOrderDate(e.target.value)}
                        />

                        <PaymentTermsInput 
                          label="Payment Terms"
                          value={paymentTerms ?? ""}
                          onChange={setPaymentTerms}
                          invoiceDate={undefined}
                        />
                      </>
                    ) : (
                      <>
                        {docType === DocumentType.DELIVERY_CHALLAN ? (
                          <>
                            <HistoryInput 
                              label="Number of Packages / Bundles"
                              historyKey="numberOfPackages"
                              value={numberOfPackages ?? ""}
                              onChange={setNumberOfPackages}
                              placeholder="e.g. 5 Boxes / 2 Wooden Crates"
                              defaultOptions={["1 Box", "2 Boxes", "5 Boxes", "10 Boxes", "1 Wooden Crate", "2 Bundles", "5 Bags"]}
                            />

                            <HistoryInput 
                              label="Dispatch Ref / Waybill / LR No."
                              historyKey="despatchDocNo"
                              value={despatchDocNo ?? ""}
                              onChange={setDespatchDocNo}
                              placeholder="e.g. LR-987654 / WB-102"
                            />

                            <HistoryInput 
                              label="Reason for Transportation"
                              historyKey="reasonForTransportation"
                              value={reasonForTransportation ?? "Supply"}
                              onChange={setReasonForTransportation}
                              placeholder="e.g. Supply / Job Work / Demo"
                              defaultOptions={["Supply", "Job Work", "Supply on Approval / Demo", "Returnable Goods / Repair", "Branch / Stock Transfer", "Line Sale", "Export"]}
                            />
                          </>
                        ) : (
                          <HistoryInput 
                            label="Mode of Payment"
                            historyKey="paymentMode"
                            value={paymentMode ?? ""}
                            onChange={setPaymentMode}
                            placeholder="e.g. Bank Transfer / NEFT / RTGS / UPI / Cash"
                            defaultOptions={["Bank Transfer / NEFT / RTGS", "UPI / GPay / PhonePe", "Cheque / Demand Draft", "Cash", "Online Payment", "100% Advance", "Against Delivery"]}
                          />
                        )}

                        <HistoryInput 
                          label="Buyer's Ref / P.O. Number"
                          historyKey="poNumber"
                          value={poNumber ?? ""}
                          onChange={setPoNumber}
                          placeholder="e.g. GTI-01 dt. 1-Jul-2017"
                        />

                        <Input 
                          label="Buyer's Order Date"
                          type="date"
                          value={buyerOrderDate ?? ""}
                          onChange={(e) => setBuyerOrderDate(e.target.value)}
                        />

                        <PaymentTermsInput 
                          label="Payment Terms"
                          value={paymentTerms ?? ""}
                          onChange={setPaymentTerms}
                          invoiceDate={date}
                        />

                        <HistoryInput 
                          label="Despatched through / Vehicle / Transport"
                          historyKey="transport"
                          value={transport ?? ""}
                          onChange={setTransport}
                          placeholder="e.g. By Road / MH-04-AB-1234 / VRL Logistics"
                          defaultOptions={["By Road", "By Air", "By Sea", "Hand Delivery", "Courier"]}
                        />

                        <HistoryInput 
                          label="Destination / Final Destination"
                          historyKey="finalDestination"
                          value={finalDestination ?? ""}
                          onChange={setFinalDestination}
                          placeholder="e.g. Delhi, Code : 07"
                          defaultOptions={["Mumbai", "Delhi", "Pune", "Sharjah, UAE", "Dubai, UAE"]}
                        />

                        {docType === DocumentType.DELIVERY_CHALLAN && (
                          <div className="col-span-1 md:col-span-2 lg:col-span-3 bg-gradient-to-r from-blue-50/90 to-indigo-50/90 border border-blue-200/80 rounded-xl p-3.5 flex items-center justify-between shadow-2xs mt-1">
                            <div className="flex items-center gap-2.5">
                              <div className="p-2 bg-blue-100 text-blue-700 rounded-lg shrink-0">
                                <Eye className="w-4 h-4" />
                              </div>
                              <div>
                                <div className="text-xs font-bold text-zinc-900">Show Item Prices & Amounts in Delivery Challan</div>
                                <div className="text-[11px] text-zinc-500">When turned off, unit rates, taxes, subtotal, and total prices are hidden on the Delivery Challan document.</div>
                              </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer shrink-0">
                              <input 
                                type="checkbox" 
                                checked={showPricesInChallan} 
                                onChange={(e) => setShowPricesInChallan(e.target.checked)} 
                                className="sr-only peer" 
                              />
                              <div className="w-11 h-6 bg-zinc-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                          </div>
                        )}
                      </>
                    )}

                    {docType === DocumentType.PROFORMA_INVOICE && (
                      <div className="md:col-span-1">
                        <Input 
                          label="Advance (%)"
                          type="number"
                          value={advancePercentage || ""}
                          onChange={(e) => setAdvancePercentage(parseFloat(e.target.value) || 0)}
                          placeholder="0"
                        />
                      </div>
                    )}

                    {/* Consignee Details (Ship To) section */}
                    <div className="col-span-1 md:col-span-2 lg:col-span-3 pt-3 mt-1 border-t border-zinc-200">
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="h-4 w-4 text-zinc-500" />
                        <span className="text-xs font-bold text-zinc-700 uppercase tracking-wider">
                          Consignee Details (Ship To)
                        </span>
                        <span className="text-[10px] text-zinc-400 font-normal">
                          (Fill if different from Customer / Billed To details)
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <HistoryInput 
                          label="Consignee Name"
                          historyKey="consigneeName"
                          value={consigneeName ?? ""}
                          onChange={setConsigneeName}
                          placeholder="e.g. Acme Warehousing Ltd"
                        />
                        <HistoryInput 
                          label={`Consignee ${getRegionTaxLabel(customer.country || business.country || countryOfOrigin || "India")}`}
                          historyKey="consigneeGstin"
                          value={consigneeGstin ?? ""}
                          onChange={setConsigneeGstin}
                          placeholder="e.g. 27AAAAA0000A1Z5"
                        />
                        <HistoryInput 
                          multiline
                          label="Consignee Address"
                          historyKey="consigneeAddress"
                          value={consigneeAddress ?? ""}
                          onChange={setConsigneeAddress}
                          placeholder="e.g. Plot 12, Industrial Area, Sector 5, Pune - 411026"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              )}

              {/* Incoterms & Delivery Details (For Export Tax Invoices & Quotations) */}
              {isExport && (docType === DocumentType.TAX_INVOICE || docType === DocumentType.QUOTATION) && (
                <Card>
                  <CardHeader title="INCOTERMS & DELIVERY DETAILS (EXPORT)" />
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-zinc-500 uppercase mb-1">
                          Incoterm Rule (2020)
                        </label>
                        <select
                          value={incotermRule}
                          onChange={(e) => {
                            const rule = e.target.value;
                            setIncotermRule(rule);
                            if (!incotermFreightTerms) {
                              if (["EXW", "FCA", "FAS", "FOB"].includes(rule)) {
                                setIncotermFreightTerms("Freight Collect");
                              } else if (["CFR", "CIF", "CPT", "CIP", "DPU", "DAP", "DDP"].includes(rule)) {
                                setIncotermFreightTerms("Freight Prepaid");
                              }
                            }
                            if (!incotermCountryOfOrigin && countryOfOrigin) {
                              setIncotermCountryOfOrigin(countryOfOrigin);
                            }
                            if (!incotermCountryOfDestination && countryOfDestination) {
                              setIncotermCountryOfDestination(countryOfDestination);
                            }
                            if (!incotermPortOfLoading && portOfLoading) {
                              setIncotermPortOfLoading(portOfLoading);
                            }
                            if (!incotermNamedPlace && finalDestination) {
                              setIncotermNamedPlace(finalDestination);
                            }
                          }}
                          className="w-full bg-zinc-50 rounded-xl px-4 py-3 text-sm font-bold border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 cursor-pointer"
                        >
                          <option value="">-- Select Incoterm Rule --</option>
                          <option value="EXW">EXW - Ex Works</option>
                          <option value="FCA">FCA - Free Carrier</option>
                          <option value="FAS">FAS - Free Alongside Ship</option>
                          <option value="FOB">FOB - Free On Board</option>
                          <option value="CFR">CFR - Cost and Freight</option>
                          <option value="CIF">CIF - Cost, Insurance and Freight</option>
                          <option value="CPT">CPT - Carriage Paid To</option>
                          <option value="CIP">CIP - Carriage and Insurance Paid To</option>
                          <option value="DPU">DPU - Delivered at Place Unloaded</option>
                          <option value="DAP">DAP - Delivered at Place</option>
                          <option value="DDP">DDP - Delivered Duty Paid</option>
                        </select>
                      </div>

                      {incotermRule && (
                        <>
                          <HistoryInput
                            label="Named Place / Port of Delivery"
                            historyKey="incotermNamedPlace"
                            value={incotermNamedPlace}
                            onChange={setIncotermNamedPlace}
                            placeholder="e.g. Jebel Ali Port, Dubai / Rotterdam"
                            defaultOptions={["Jebel Ali Port, Dubai", "Rotterdam Port", "Hamburg Port", "New York Port", "Singapore Port", "Sharjah Port, UAE"]}
                          />
                          <HistoryInput
                            label="Port of Loading / Departure"
                            historyKey="incotermPortOfLoading"
                            value={incotermPortOfLoading}
                            onChange={setIncotermPortOfLoading}
                            placeholder="e.g. JNPT Nhava Sheva, India"
                            defaultOptions={["JNPT Nhava Sheva, India", "Mundra Port, India", "Chennai Port, India", "Mumbai Port, India"]}
                          />
                          <HistoryInput
                            label="Country of Origin"
                            historyKey="incotermCountryOfOrigin"
                            value={incotermCountryOfOrigin}
                            onChange={setIncotermCountryOfOrigin}
                            placeholder="e.g. India"
                            defaultOptions={["India", "Netherlands", "United Arab Emirates", "Saudi Arabia", "United States", "Germany"]}
                          />
                          <HistoryInput
                            label="Country of Destination"
                            historyKey="incotermCountryOfDestination"
                            value={incotermCountryOfDestination}
                            onChange={setIncotermCountryOfDestination}
                            placeholder="e.g. United Arab Emirates"
                            defaultOptions={["United Arab Emirates", "Saudi Arabia", "Netherlands", "United States", "Germany", "United Kingdom"]}
                          />
                          <HistoryInput
                            label="Freight Terms"
                            historyKey="incotermFreightTerms"
                            value={incotermFreightTerms}
                            onChange={setIncotermFreightTerms}
                            placeholder="e.g. Freight Prepaid / Freight Collect"
                            defaultOptions={["Freight Prepaid", "Freight Collect", "Prepaid by Seller", "Collect by Buyer"]}
                          />
                          <div className="md:col-span-2 lg:col-span-3">
                            <HistoryInput
                              label={`Insurance Details / Policy No. ${["CIF", "CIP"].includes(incotermRule) ? "(Required for CIF/CIP)" : "(Optional)"}`}
                              historyKey="incotermInsuranceDetails"
                              value={incotermInsuranceDetails}
                              onChange={setIncotermInsuranceDetails}
                              placeholder={["CIF", "CIP"].includes(incotermRule) ? "e.g. Covered under Marine Insurance Policy #POL-987654 by Seller" : "e.g. Covered by Buyer / Policy details if any"}
                              defaultOptions={["Covered under Marine Insurance Policy", "Covered by Seller", "Covered by Buyer", "Not Applicable"]}
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Shipping & Logistics Information (For Packaging List - Placed right after Document & Reference Details) */}
              {docType === DocumentType.PACKING_LIST && (
                <Card>
                  <CardHeader title="SHIPPING & LOGISTICS INFORMATION" />
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <HistoryInput 
                        label={isExport ? "Pre-Carriage By" : "Pre-Carriage By / Dispatch Mode"}
                        historyKey="preCarriageBy"
                        value={preCarriageBy}
                        onChange={setPreCarriageBy}
                        placeholder={isExport ? "e.g. Road / Air / Sea" : "e.g. Road / Train / Courier"}
                        defaultOptions={["Sea Freight", "Air Freight", "Road", "Train", "Courier"]}
                      />
                      <HistoryInput 
                        label={isExport ? "Place of Receipt by Pre-Carrier" : "Place of Receipt"}
                        historyKey="placeOfReceipt"
                        value={placeOfReceipt}
                        onChange={setPlaceOfReceipt}
                        placeholder={isExport ? "e.g. Mumbai, India / Nhava Sheva" : "e.g. Factory gate / Warehouse / Mumbai"}
                        defaultOptions={["Mumbai Nhava Sheva", "Nhava Sheva", "Mumbai Port", "JNPT Nhava Sheva", "Delhi ICD", "Ahmedabad ICD", "Chennai Port", "Mundra Port"]}
                      />
                      <HistoryInput 
                        label={isExport ? "Vessel / Flight No." : "Vehicle / Transport No."}
                        historyKey="vesselFlightNo"
                        value={vesselFlightNo}
                        onChange={setVesselFlightNo}
                        placeholder={isExport ? "e.g. AI-101 / Vessel name" : "e.g. MH-12-AB-1234 / Truck"}
                      />
                      {isExport && (
                        <>
                          <HistoryInput 
                            label="Port of Loading"
                            historyKey="portOfLoading"
                            value={portOfLoading}
                            onChange={setPortOfLoading}
                            placeholder="e.g. JNPT, Nhava Sheva"
                            defaultOptions={["JNPT Nhava Sheva", "Mundra Port", "Chennai Port", "Mumbai Port", "Kolkata Port"]}
                          />
                          <HistoryInput 
                            label="Port of Discharge"
                            historyKey="portOfDischarge"
                            value={portOfDischarge}
                            onChange={setPortOfDischarge}
                            placeholder="e.g. Sharjah Port, UAE"
                            defaultOptions={["Rotterdam", "Sharjah Port, UAE", "Jebel Ali, Dubai", "Antwerp", "Hamburg", "Singapore", "New York", "Houston", "Genoa", "Felixstowe"]}
                          />
                        </>
                      )}
                      <HistoryInput 
                        label="Final Destination"
                        historyKey="finalDestination"
                        value={finalDestination}
                        onChange={setFinalDestination}
                        placeholder={isExport ? "e.g. Sharjah, UAE" : "e.g. Pune, Maharashtra"}
                        defaultOptions={["Rotterdam", "Sharjah, UAE", "Dubai, UAE", "Antwerp, Belgium", "Hamburg, Germany", "Singapore", "New York, USA"]}
                      />
                      {isExport && (
                        <>
                          <HistoryInput 
                            label="Country of Origin of Goods"
                            historyKey="countryOfOrigin"
                            value={countryOfOrigin}
                            onChange={setCountryOfOrigin}
                            placeholder="e.g. India"
                            defaultOptions={["India", "Netherlands", "United Arab Emirates", "Saudi Arabia", "United States", "Germany", "Belgium", "United Kingdom"]}
                          />
                          <HistoryInput 
                            label="Country of Final Destination"
                            historyKey="countryOfDestination"
                            value={countryOfDestination}
                            onChange={setCountryOfDestination}
                            placeholder="e.g. UAE"
                            defaultOptions={["Netherlands", "United Arab Emirates", "Saudi Arabia", "United States", "Germany", "Belgium", "United Kingdom"]}
                          />
                        </>
                      )}
                      <div>
                        <label className="block text-xs font-semibold text-zinc-500 uppercase mb-1">Buyer's Order Date</label>
                        <input 
                          type="date"
                          className="w-full bg-zinc-50 rounded-xl px-4 py-3 text-sm font-bold border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                          value={buyerOrderDate}
                          onChange={(e) => setBuyerOrderDate(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-500 uppercase mb-1">Buyer / Client Details</label>
                        <textarea 
                          className="w-full bg-zinc-50 rounded-xl px-4 py-3 text-sm font-bold border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 min-h-[46px]"
                          rows={1}
                          value={buyerDetails}
                          onChange={(e) => setBuyerDetails(e.target.value)}
                          placeholder="Buyer / Client details if different from default customer address"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Customer/Consignee/Supplier Details */}
              <div className="w-full">
                {/* Customer/Supplier Details */}
                {docType === DocumentType.COST_SHEET ? (
                  <Card>
                    <CardHeader 
                      title="Customer & Project Details" 
                      subtitle="Select customer and enter project name"
                    />
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                        <CustomerSelector
                          customers={savedCustomers}
                          currentValue={customer.name}
                          currentUserId={user?.uid}
                          onChange={(val) => setCustomer({ ...customer, name: val })}
                          onSelect={(selected) => {
                            setCustomer({
                              ...selected,
                              country: selected.country || business.country || countryOfOrigin || "India"
                            });
                          }}
                          label="Customer Name"
                          placeholder="Search or enter customer name"
                        />

                        <Input 
                          label="Project Name"
                          value={projectName}
                          onChange={(e) => setProjectName(e.target.value)}
                          placeholder="e.g. Expansion Project Phase II"
                        />
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardHeader 
                      title={
                        docType === DocumentType.PURCHASE_ORDER 
                          ? "Supplier Details" 
                          : "Customer Details"
                      } 
                      action={
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => { 
                            showModal({
                              title: "Clear History",
                              message: "Clear customer history?",
                              type: "confirm",
                              onConfirm: () => {
                                setSavedCustomers([]);
                                closeModal();
                              }
                            });
                          }}
                        >
                          <History className="h-4 w-4 mr-2" />
                          Clear History
                        </Button>
                      }
                    />
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <CustomerSelector
                        customers={docType === DocumentType.PURCHASE_ORDER ? savedSuppliers : savedCustomers}
                        currentValue={customer.name}
                        currentUserId={user?.uid}
                        onChange={(val) => setCustomer({ ...customer, name: val })}
                        onSelect={(selected) => {
                          const sellerCountry = business.country || countryOfOrigin || "India";
                          const custCountry = selected.country || sellerCountry;
                          const isOverseas = custCountry.toLowerCase().trim() !== sellerCountry.toLowerCase().trim();

                          setCustomer({
                            ...selected,
                            country: custCountry
                          });

                          if (isOverseas) {
                            setIsExport(true);
                            setIsTaxEnabled(false);
                            setAutoExportBadge(true);
                            const targetCfg = getCountryConfig(custCountry);
                            if (selected.currency) {
                              setCurrency(selected.currency);
                            } else if (targetCfg && targetCfg.currencyCode) {
                              setCurrency(targetCfg.currencyCode);
                            }
                          } else {
                            setIsExport(!!selected.isExport);
                            if (selected.currency) {
                              setCurrency(selected.currency);
                            }
                            setAutoExportBadge(false);
                          }

                          // Apply customer/supplier specific notes and terms if saved
                          if (selected.notes && selected.notes.trim()) {
                            setNotes(selected.notes);
                            setIsNotesManuallyEdited(true);
                          }
                          if (selected.terms && selected.terms.trim()) {
                            setTerms(selected.terms);
                            setIsTermsManuallyEdited(true);
                          }
                        }}
                        label={docType === DocumentType.PURCHASE_ORDER ? "Supplier Name" : "Customer Name"}
                        placeholder={docType === DocumentType.PURCHASE_ORDER ? "Search or enter supplier name" : "Search or enter customer name"}
                      />
                      {true && (
                        <>
                          <div>
                            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                              {docType === DocumentType.PURCHASE_ORDER ? "Supplier Country" : "Customer / Client Country"}
                            </label>
                            <select
                              value={customer.country || (business.country || countryOfOrigin || "India")}
                              onChange={(e) => {
                                const selectedCountry = e.target.value;
                                const sellerCountry = business.country || countryOfOrigin || "India";
                                const isOverseas = selectedCountry.toLowerCase().trim() !== sellerCountry.toLowerCase().trim();

                                setCustomer(prev => ({ ...prev, country: selectedCountry }));

                                if (isOverseas) {
                                  setIsExport(true);
                                  setIsTaxEnabled(false);
                                  setAutoExportBadge(true);
                                  const countryCfg = getCountryConfig(selectedCountry);
                                  if (countryCfg && countryCfg.currencyCode) {
                                    setCurrency(countryCfg.currencyCode);
                                  }
                                } else {
                                  setIsExport(false);
                                  setIsTaxEnabled(true);
                                  setAutoExportBadge(false);
                                  const sellerCfg = getCountryConfig(sellerCountry);
                                  setCurrency(business.currency || (sellerCfg && sellerCfg.currencyCode) || "INR");
                                }
                              }}
                              className="w-full p-2.5 bg-white border border-zinc-200 rounded-xl text-sm font-semibold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/5 cursor-pointer"
                            >
                              {COUNTRIES.map((c) => (
                                <option key={c.code} value={c.name}>
                                  {c.flag} {c.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <Input 
                            label={docType === DocumentType.PURCHASE_ORDER 
                              ? `Supplier ${getRegionTaxLabel(customer.country || business.country || countryOfOrigin || "India")}` 
                              : `Customer ${getRegionTaxLabel(customer.country || business.country || countryOfOrigin || "India")}`} 
                            value={customer.gstin}
                            onChange={(e) => setCustomer({ ...customer, gstin: e.target.value })}
                            placeholder="Optional"
                            error={customerErrors.gstin}
                          />
                          <Input 
                            label="Attention / Contact Person" 
                            value={customer.contactPerson || ""}
                            onChange={(e) => setCustomer({ ...customer, contactPerson: e.target.value })}
                            placeholder="Name of contact person"
                          />
                          <Input 
                            label="Email" 
                            type="email"
                            value={customer.email}
                            onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                            placeholder="customer@example.com"
                            error={customerErrors.email}
                          />
                          <Input 
                            label="Phone" 
                            value={customer.phone}
                            onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                            placeholder="Phone number"
                            error={customerErrors.phone}
                          />
                          <div className="md:col-span-2">
                            <Input 
                              label={
                                docType === DocumentType.PURCHASE_ORDER 
                                  ? "Supplier Address" 
                                  : docType === DocumentType.QUOTATION 
                                    ? "Customer Address" 
                                    : "Billing Address"
                              } 
                              value={customer.address}
                              onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
                            />
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Document Currency Selection Option - Above Line Items */}
              <div className="bg-white p-3.5 px-5 rounded-2xl border border-zinc-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-brand-50 text-brand-600 rounded-xl">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-zinc-800 uppercase tracking-wider block">
                      Document Currency
                    </label>
                    <span className="text-[11px] text-zinc-500 font-medium">
                      Select currency for pricing & total amounts ({getCurrencySymbol(currency)} - {currency})
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Select Currency:</span>
                  <select
                    value={currency}
                    onChange={(e) => {
                      const newCurr = e.target.value;
                      setCurrency(newCurr);
                      if (!isExport) {
                        handleBusinessChange({ currency: newCurr });
                      }
                    }}
                    className="bg-zinc-50 hover:bg-zinc-100 text-zinc-900 border border-zinc-300 font-bold text-xs rounded-xl px-3.5 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500/20 cursor-pointer shadow-xs min-w-[220px]"
                  >
                    {ALL_CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.symbol} {c.code} - {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Line Items */}
              {docType === DocumentType.COST_SHEET ? (
                <LandedCostSheet 
                  items={items}
                  onChangeItems={setItems}
                  currencySymbol={getCurrencySymbol(currency)}
                  currency={currency}
                  freightAmount={freightAmount}
                  setFreightAmount={setFreightAmount}
                  packagingAmount={packagingAmount}
                  setPackagingAmount={setPackagingAmount}
                  docId={docId}
                  docDate={date}
                  businessName={business.name}
                  customerName={customer.name}
                  projectName={projectName}
                  onUpdateTotals={setCostSheetTotals}
                />
              ) : (
                <Card>
                  <CardHeader 
                    title="Line Items" 
                    action={
                      <div className="flex items-center gap-2">
                         {false && (
                          <div className="flex items-center gap-1 bg-zinc-100 rounded-lg p-1 mr-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-[10px] font-black uppercase h-7"
                              onClick={() => setItems(prev => prev.map(i => ({ ...i, qaHeat: true, qaDim: true, qaMark: true })))}
                            >
                              Tick All
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-[10px] font-black uppercase h-7"
                              onClick={() => setItems(prev => prev.map(i => ({ ...i, qaHeat: false, qaDim: false, qaMark: false })))}
                            >
                              Untick
                            </Button>
                          </div>
                        )}
                        <VoiceInput 
                          onSuggestion={handleVoiceSuggestion} 
                          onError={(msg) => showModal({ title: "Voice Input", message: getDisplayErrorMessage(msg, impersonatedUser?.email || user?.email), type: "warning" })}
                          industry={business.industry} 
                          letterhead={business.letterhead}
                        />
                        <div id="document-upload-section">
                          <DocumentUpload 
                            onAnalysisComplete={handleAIAnalysis} 
                            onError={(msg) => showModal({ title: "Smart Document Analysis", message: getDisplayErrorMessage(msg, impersonatedUser?.email || user?.email), type: "warning" })}
                            industry={business.industry}
                            history={history}
                            letterhead={business.letterhead}
                            businessName={business.name}
                          />
                        </div>
                      </div>
                    }
                  />
                  <CardContent className="p-0">
                    <div className="px-6">
                      {items.map((item, index) => (
                        <LineItemRow 
                          key={`${item.id || 'item'}-${index}`} 
                          item={item} 
                          index={index}
                          onUpdate={updateItem} 
                          onRemove={removeItem} 
                          priceHistory={priceHistory}
                          docType={docType}
                          isExport={isExport}
                          isTaxEnabled={isTaxEnabled}
                          currency={currency}
                          exchangeRate={exchangeRate}
                          business={business}
                          customerName={customer.name}
                          allItems={items}
                          customBoxes={customBoxes}
                          totalItemsCount={items.length}
                          onReorder={reorderItems}
                        />
                      ))}
                    </div>


                    <div className="p-4 bg-zinc-50 border-t border-zinc-100 flex justify-between items-center flex-wrap gap-4">
                      <div className="flex items-center gap-3 flex-wrap">
                        <Button variant="outline" size="sm" onClick={addItem} disabled={false}>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Item
                        </Button>
                        {items.length > 0 && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => {
                              exportCurrentDocumentItemsToCSV(items, {
                                docId,
                                docType,
                                date,
                                customerName: customer?.name,
                                currency
                              });
                              showShortcutToast("📊 Exported line items to CSV (Excel ready)!");
                            }}
                            className="bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50 font-semibold"
                            title="Export these line items directly to CSV / Excel spreadsheet"
                          >
                            <FileSpreadsheet className="h-4 w-4 mr-1.5 text-emerald-600" />
                            Export Items (CSV)
                          </Button>
                        )}
                        {currency !== (business.currency || countryOfOrigin || "INR") && (
                          <div className="flex items-center gap-1.5 border-l pl-3 border-zinc-200">
                            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">Currency Convert:</span>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => {
                                convertRatesToInvoiceCurrency();
                                showShortcutToast(`Item rates converted: ${business.currency || countryOfOrigin || "INR"} → ${currency} (÷ ${exchangeRate})`);
                              }}
                              className="text-[10px] font-bold uppercase h-7 bg-white text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                              title={`Divide all item rates by ${exchangeRate} (${business.currency || countryOfOrigin || "INR"} → ${currency})`}
                            >
                              <RefreshCw className="w-3 h-3 mr-1 text-indigo-500" />
                              {business.currency || countryOfOrigin || "INR"} → {currency}
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => {
                                convertRatesToHomeCurrency();
                                showShortcutToast(`Item rates converted: ${currency} → ${business.currency || countryOfOrigin || "INR"} (× ${exchangeRate})`);
                              }}
                              className="text-[10px] font-bold uppercase h-7 bg-white text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                              title={`Multiply all item rates by ${exchangeRate} (${currency} → ${business.currency || countryOfOrigin || "INR"})`}
                            >
                              <RefreshCw className="w-3 h-3 mr-1 text-emerald-500" />
                              {currency} → {business.currency || countryOfOrigin || "INR"}
                            </Button>
                          </div>
                        )}
                        {(docType === DocumentType.PACKING_LIST || docType === DocumentType.TAX_INVOICE) && (
                          <Button variant="ghost" size="sm" onClick={() => setIsImportModalOpen(true)} className="text-brand-600 hover:bg-brand-50">
                            <History className="h-4 w-4 mr-2" />
                            {docType === DocumentType.TAX_INVOICE ? "Import from Quotation" : "Import from Invoice/Quotation"}
                          </Button>
                        )}
                        {(docType === DocumentType.PACKING_LIST || docType === DocumentType.TAX_INVOICE) && (
                          <div className="flex items-center gap-2 border-l pl-3 border-zinc-200">
                            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">Common Gross %:</label>
                            <div className="flex items-center gap-1.5">
                              <input 
                                type="number" 
                                step="any"
                                placeholder="e.g. 10" 
                                value={commonGrossPercent}
                                onChange={(e) => setCommonGrossPercent(e.target.value)}
                                className="w-16 bg-white border border-zinc-200 rounded-lg px-2 py-1 text-xs font-bold text-center focus:outline-none focus:ring-1 focus:ring-brand-500"
                              />
                              <span className="text-xs font-bold text-zinc-500">%</span>
                              <Button 
                                variant="outline" 
                                className="text-[10px] uppercase font-bold py-1 bg-white hover:bg-zinc-100 text-brand-600 border border-zinc-200"
                                onClick={() => {
                                  if (commonGrossPercent) {
                                    applyCommonGrossPercentage(commonGrossPercent);
                                  }
                                }}
                              >
                                Apply to All
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                      {true && (
                        <div className="text-right">
                          <p className="text-xs text-zinc-500 uppercase font-semibold">
                            {docType === DocumentType.QUOTATION ? "Total" : "Subtotal"}
                          </p>
                          <p className="text-lg font-bold">
                            {getCurrencySymbol(currency)}
                            {totals.subtotal.toFixed(2)}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Box Dimensions & Packaging Details (For Packaging List - Placed after Line Items & above Freight Charges) */}
              {docType === DocumentType.PACKING_LIST && (() => {
                const aggregatedBoxes = aggregateLineItemsForBoxes(
                  items,
                  customBoxes,
                  boxDimensions,
                  boxNetWeights,
                  boxGrossWeights,
                  boxQtyPacked
                );

                const handleUpdateBox = (index: number, updatedBox: Partial<AggregatedBoxRow> & { boxNo?: string }) => {
                  const currentBox = aggregatedBoxes[index];
                  if (!currentBox) return;
                  const oldName = currentBox.boxNo;
                  const newName = (updatedBox.boxNo !== undefined ? updatedBox.boxNo.trim() : oldName) || oldName;

                  if (oldName && newName !== oldName) {
                    setCustomBoxes(prev => prev.map(b => b === oldName ? newName : b));

                    const newDims = { ...boxDimensions };
                    delete newDims[oldName];
                    if (updatedBox.dimensions !== undefined ? updatedBox.dimensions : currentBox.dimensions) {
                      newDims[newName] = updatedBox.dimensions !== undefined ? updatedBox.dimensions : currentBox.dimensions;
                    }
                    setBoxDimensions(newDims);

                    const newNets = { ...boxNetWeights };
                    delete newNets[oldName];
                    if (updatedBox.netWeightOverride !== undefined ? updatedBox.netWeightOverride : currentBox.netWeightOverride) {
                      newNets[newName] = updatedBox.netWeightOverride !== undefined ? updatedBox.netWeightOverride : currentBox.netWeightOverride;
                    }
                    setBoxNetWeights(newNets);

                    const newGross = { ...boxGrossWeights };
                    delete newGross[oldName];
                    if (updatedBox.grossWeightOverride !== undefined ? updatedBox.grossWeightOverride : currentBox.grossWeightOverride) {
                      newGross[newName] = updatedBox.grossWeightOverride !== undefined ? updatedBox.grossWeightOverride : currentBox.grossWeightOverride;
                    }
                    setBoxGrossWeights(newGross);

                    const newQty = { ...boxQtyPacked };
                    delete newQty[oldName];
                    if (updatedBox.packedQtyOverride !== undefined ? updatedBox.packedQtyOverride : currentBox.packedQtyOverride) {
                      newQty[newName] = updatedBox.packedQtyOverride !== undefined ? updatedBox.packedQtyOverride : currentBox.packedQtyOverride;
                    }
                    setBoxQtyPacked(newQty);
                  } else {
                    if (updatedBox.dimensions !== undefined) {
                      setBoxDimensions(prev => ({ ...prev, [oldName]: updatedBox.dimensions || '' }));
                    }
                    if (updatedBox.netWeightOverride !== undefined) {
                      setBoxNetWeights(prev => ({ ...prev, [oldName]: updatedBox.netWeightOverride || '' }));
                    }
                    if (updatedBox.grossWeightOverride !== undefined) {
                      setBoxGrossWeights(prev => ({ ...prev, [oldName]: updatedBox.grossWeightOverride || '' }));
                    }
                    if (updatedBox.packedQtyOverride !== undefined) {
                      setBoxQtyPacked(prev => ({ ...prev, [oldName]: updatedBox.packedQtyOverride || '' }));
                    }
                  }
                };

                const handleResetBox = (boxName: string) => {
                  setBoxNetWeights(prev => {
                    const next = { ...prev };
                    delete next[boxName];
                    return next;
                  });
                  setBoxGrossWeights(prev => {
                    const next = { ...prev };
                    delete next[boxName];
                    return next;
                  });
                  setBoxQtyPacked(prev => {
                    const next = { ...prev };
                    delete next[boxName];
                    return next;
                  });
                };

                const handleResetAll = () => {
                  setBoxNetWeights({});
                  setBoxGrossWeights({});
                  setBoxQtyPacked({});
                };

                const handleAutoSync = () => {
                  const itemBoxes = Array.from(new Set(items.map(i => (i.boxNo || '').trim()).filter(Boolean)));
                  setCustomBoxes(prev => Array.from(new Set([...prev, ...itemBoxes])));
                  setBoxNetWeights({});
                  setBoxGrossWeights({});
                  setBoxQtyPacked({});
                };

                const handleRemoveBox = (index: number) => {
                  const currentBox = aggregatedBoxes[index];
                  if (!currentBox) return;
                  const boxName = currentBox.boxNo;
                  setCustomBoxes(prev => prev.filter(b => b !== boxName));
                  const newDims = { ...boxDimensions }; delete newDims[boxName]; setBoxDimensions(newDims);
                  const newNets = { ...boxNetWeights }; delete newNets[boxName]; setBoxNetWeights(newNets);
                  const newGross = { ...boxGrossWeights }; delete newGross[boxName]; setBoxGrossWeights(newGross);
                  const newQty = { ...boxQtyPacked }; delete newQty[boxName]; setBoxQtyPacked(newQty);
                };

                const handleAddBox = () => {
                  const existingCount = aggregatedBoxes.length;
                  const newBox = `Box ${existingCount + 1}`;
                  if (!customBoxes.includes(newBox)) {
                    setCustomBoxes(prev => [...prev, newBox]);
                  }
                };

                return (
                  <BoxDimensionsTable 
                    boxes={aggregatedBoxes}
                    onUpdateBox={handleUpdateBox}
                    onResetBox={handleResetBox}
                    onResetAll={handleResetAll}
                    onAutoSync={handleAutoSync}
                    onRemoveBox={handleRemoveBox}
                    onAddBox={handleAddBox}
                  />
                );
              })()}

              {/* Freight Charge & Packaging Cost Section */}
              {docType !== DocumentType.COST_SHEET && (
                <Card>
                  <CardHeader 
                    title="Freight & Packaging Charges" 
                  />
                  <CardContent className="space-y-4 p-5">
                    <div className="space-y-3">
                      {/* Freight Charge Row */}
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-zinc-50 border border-zinc-200/80 rounded-xl p-3.5">
                        <div className="flex items-center gap-2 md:w-56 shrink-0">
                          <Truck className="h-4 w-4 text-zinc-500" />
                          <span className="text-xs font-bold text-zinc-800 uppercase tracking-wider">Freight Charge</span>
                        </div>

                        <div className="flex flex-1 flex-wrap items-center gap-3">
                          <select
                            value={freightOption}
                            onChange={(e) => setFreightOption(e.target.value as "none" | "extra" | "inclusive")}
                            className="bg-white border border-zinc-200 rounded-lg px-3 py-2 text-xs font-bold text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 cursor-pointer shadow-sm"
                          >
                            <option value="none">Not Included</option>
                            <option value="extra">Extra Charge</option>
                            <option value="inclusive">Inclusive</option>
                          </select>

                          {freightOption === "extra" && (
                            <>
                              <div className="relative w-36">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400">
                                  {getCurrencySymbol(currency)}
                                </span>
                                <input
                                  type="number"
                                  min="0"
                                  step="any"
                                  className="w-full pl-8 pr-3 py-1.5 bg-white border border-zinc-200 rounded-lg text-xs font-bold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono shadow-sm"
                                  placeholder="0.00"
                                  value={freightAmount || ""}
                                  onWheel={(e) => e.currentTarget.blur()}
                                  onChange={(e) => setFreightAmount(parseFloat(e.target.value) || 0)}
                                />
                              </div>

                              <select
                                value={freightTaxTiming}
                                onChange={(e) => setFreightTaxTiming(e.target.value as "before_tax" | "after_tax")}
                                className="bg-white border border-zinc-200 rounded-lg px-3 py-2 text-xs font-bold text-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 cursor-pointer shadow-sm"
                              >
                                <option value="before_tax">Add Before Tax (Taxable)</option>
                                <option value="after_tax">Add After Tax (Non-Taxable)</option>
                              </select>

                              {freightTaxTiming === "before_tax" && (
                                <div className="relative w-32 flex items-center">
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="any"
                                    className="w-full pl-3 pr-7 py-1.5 bg-white border border-zinc-200 rounded-lg text-xs font-bold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono shadow-sm"
                                    placeholder="Tax Rate %"
                                    value={freightTaxRate !== undefined ? freightTaxRate : ""}
                                    onWheel={(e) => e.currentTarget.blur()}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setFreightTaxRate(val === "" ? undefined : parseFloat(val));
                                    }}
                                  />
                                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400 pointer-events-none">
                                    %
                                  </span>
                                </div>
                              )}
                            </>
                          )}

                          {freightOption === "inclusive" && (
                            <span className="text-xs text-emerald-600 font-semibold italic">✓ Included in item rates</span>
                          )}
                          {freightOption === "none" && (
                            <span className="text-xs text-zinc-400 italic">Omitted from document</span>
                          )}
                        </div>
                      </div>

                      {/* Packaging & Forwarding Row */}
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-zinc-50 border border-zinc-200/80 rounded-xl p-3.5">
                        <div className="flex items-center gap-2 md:w-56 shrink-0">
                          <Package className="h-4 w-4 text-zinc-500" />
                          <span className="text-xs font-bold text-zinc-800 uppercase tracking-wider">Packaging & Forwarding</span>
                        </div>

                        <div className="flex flex-1 flex-wrap items-center gap-3">
                          <select
                            value={packagingOption}
                            onChange={(e) => setPackagingOption(e.target.value as "none" | "extra" | "inclusive")}
                            className="bg-white border border-zinc-200 rounded-lg px-3 py-2 text-xs font-bold text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 cursor-pointer shadow-sm"
                          >
                            <option value="none">Not Included</option>
                            <option value="extra">Extra Charge</option>
                            <option value="inclusive">Inclusive</option>
                          </select>

                          {packagingOption === "extra" && (
                            <>
                              <div className="relative w-36">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400">
                                  {getCurrencySymbol(currency)}
                                </span>
                                <input
                                  type="number"
                                  min="0"
                                  step="any"
                                  className="w-full pl-8 pr-3 py-1.5 bg-white border border-zinc-200 rounded-lg text-xs font-bold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono shadow-sm"
                                  placeholder="0.00"
                                  value={packagingAmount || ""}
                                  onWheel={(e) => e.currentTarget.blur()}
                                  onChange={(e) => setPackagingAmount(parseFloat(e.target.value) || 0)}
                                />
                              </div>

                              <select
                                value={packagingTaxTiming}
                                onChange={(e) => setPackagingTaxTiming(e.target.value as "before_tax" | "after_tax")}
                                className="bg-white border border-zinc-200 rounded-lg px-3 py-2 text-xs font-bold text-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 cursor-pointer shadow-sm"
                              >
                                <option value="before_tax">Add Before Tax (Taxable)</option>
                                <option value="after_tax">Add After Tax (Non-Taxable)</option>
                              </select>

                              {packagingTaxTiming === "before_tax" && (
                                <div className="relative w-32 flex items-center">
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="any"
                                    className="w-full pl-3 pr-7 py-1.5 bg-white border border-zinc-200 rounded-lg text-xs font-bold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono shadow-sm"
                                    placeholder="Tax Rate %"
                                    value={packagingTaxRate !== undefined ? packagingTaxRate : ""}
                                    onWheel={(e) => e.currentTarget.blur()}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setPackagingTaxRate(val === "" ? undefined : parseFloat(val));
                                    }}
                                  />
                                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400 pointer-events-none">
                                    %
                                  </span>
                                </div>
                              )}
                            </>
                          )}

                          {packagingOption === "inclusive" && (
                            <span className="text-xs text-emerald-600 font-semibold italic">✓ Included in item rates</span>
                          )}
                          {packagingOption === "none" && (
                            <span className="text-xs text-zinc-400 italic">Omitted from document</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Totals & Notes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <Card>
                    <CardHeader 
                      title="Notes & Terms" 
                    />
                    <CardContent className="space-y-6">
                      <div>
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider">Notes / Payment Instructions</label>
                            <button
                              type="button"
                              onClick={() => setShowNotes(!showNotes)}
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold transition-all cursor-pointer shadow-xs ${
                                showNotes
                                  ? "bg-slate-100 text-slate-800 border border-slate-300 hover:bg-slate-200"
                                  : "bg-zinc-100 text-zinc-500 border border-zinc-200 hover:bg-zinc-200"
                              }`}
                              title={showNotes ? "Notes are visible in PDF" : "Notes are hidden from PDF"}
                            >
                              {showNotes ? (
                                <Eye className="w-3.5 h-3.5 text-slate-700 shrink-0" />
                              ) : (
                                <EyeOff className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                              )}
                              <span>{showNotes ? "Show" : "Hide"}</span>
                            </button>
                          </div>
                          {notes && (
                            <button
                              type="button"
                              onClick={() => {
                                setNotes("");
                                setIsNotesManuallyEdited(true);
                              }}
                              className="text-[10px] text-red-500 hover:text-red-700 font-bold uppercase tracking-wider focus:outline-none cursor-pointer"
                            >
                              Clear
                            </button>
                          )}
                        </div>
                        <textarea 
                          className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm min-h-[70px] focus:outline-none focus:ring-2 focus:ring-zinc-900/5 resize-none overflow-hidden disabled:opacity-50 font-medium"
                          placeholder="Add any specific notes or payment instructions..."
                          value={notes ?? ""}
                          onChange={(e) => {
                            setNotes(e.target.value);
                            setIsNotesManuallyEdited(true);
                            e.target.style.height = 'auto';
                            e.target.style.height = e.target.scrollHeight + 'px';
                          }}
                          onInput={(e: any) => {
                            e.target.style.height = 'auto';
                            e.target.style.height = e.target.scrollHeight + 'px';
                          }}
                        />
                      </div>

                      <div className="pt-2 border-t border-zinc-100">
                        <TermsManager 
                          terms={terms}
                          showTerms={showTerms}
                          onToggleShowTerms={() => setShowTerms(!showTerms)}
                          onChange={(newTerms) => {
                            setTerms(newTerms);
                            setIsTermsManuallyEdited(true);
                          }}
                          onClearAll={() => {
                            setTerms("");
                            setIsTermsManuallyEdited(true);
                          }}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {false ? (
                  <div className="flex flex-col gap-4 bg-zinc-900 p-6 rounded-2xl border border-zinc-800 text-white shadow-xl">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold tracking-wide uppercase text-zinc-400">PDF Print Mode</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${layoutSettings?.hideForPreprintedLetterhead ? "bg-emerald-950 text-emerald-400 border border-emerald-900" : "bg-zinc-800 text-zinc-400 border border-zinc-700"}`}>
                          {layoutSettings?.hideForPreprintedLetterhead ? "Letterhead Mode" : "Plain Paper Mode"}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const newSettings = { ...layoutSettings, hideForPreprintedLetterhead: false };
                            setLayoutSettings(newSettings);
                            safeSave("pdf_layout_settings", newSettings, user?.uid);
                          }}
                          className={`py-2 px-3 rounded-lg border text-xs font-bold transition-all text-center flex flex-col items-center justify-center min-h-[48px] ${
                            !layoutSettings?.hideForPreprintedLetterhead
                              ? "bg-white text-zinc-900 border-white shadow-sm"
                              : "bg-zinc-900/40 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60"
                          }`}
                        >
                          <span>With Header</span>
                          <span className="text-[9px] opacity-65 font-normal leading-normal">Plain Paper</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const newSettings = { ...layoutSettings, hideForPreprintedLetterhead: true };
                            setLayoutSettings(newSettings);
                            safeSave("pdf_layout_settings", newSettings, user?.uid);
                          }}
                          className={`py-2 px-3 rounded-lg border text-xs font-bold transition-all text-center flex flex-col items-center justify-center min-h-[48px] ${
                            layoutSettings?.hideForPreprintedLetterhead
                              ? "bg-white text-zinc-900 border-white shadow-sm"
                              : "bg-zinc-900/40 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60"
                          }`}
                        >
                          <span>Without Header</span>
                          <span className="text-[9px] opacity-65 font-normal leading-normal">Preprinted Letterhead</span>
                        </button>
                      </div>

                      {/* Header & Footer Heights */}
                      <div className="mt-4 space-y-2 border-t border-white/10 pt-4">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold tracking-wide uppercase text-zinc-400">Header & Footer (mm)</span>
                          <span className="text-[10px] text-zinc-500 font-mono">Margins</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 font-sans">
                          <div>
                            <label className="text-[9px] uppercase tracking-wider font-bold text-zinc-500 block mb-1">
                              Header Height
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="200"
                              value={layoutSettings?.headerHeight ?? (layoutSettings?.hideForPreprintedLetterhead || !!business.letterhead ? 65 : 25)}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                const newSettings = { ...layoutSettings, headerHeight: val };
                                setLayoutSettings(newSettings);
                                safeSave("pdf_layout_settings", newSettings, user?.uid);
                              }}
                              className="w-full bg-zinc-900/60 border border-zinc-800 rounded-lg py-1.5 px-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-white/20 font-mono"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] uppercase tracking-wider font-bold text-zinc-500 block mb-1">
                              Footer Height
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="200"
                              value={layoutSettings?.footerHeight ?? (layoutSettings?.hideForPreprintedLetterhead || !!business.letterhead ? 40 : 20)}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                const newSettings = { ...layoutSettings, footerHeight: val };
                                setLayoutSettings(newSettings);
                                safeSave("pdf_layout_settings", newSettings, user?.uid);
                              }}
                              className="w-full bg-zinc-900/60 border border-zinc-800 rounded-lg py-1.5 px-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-white/20 font-mono"
                            />
                          </div>
                        </div>
                      </div>
                    </div>



                    <Button 
                      className="w-full bg-white text-zinc-900 hover:bg-zinc-100 h-14 text-lg font-bold rounded-xl"
                      onClick={generatePDF}
                      isLoading={isGenerating}
                      disabled={hasErrors}
                    >
                      <Download className="mr-2 h-5 w-5" />
                      Generate Report
                    </Button>
                  </div>
                ) : (
                  <Card className="bg-zinc-900 text-white border-zinc-800">
                    <CardContent className="p-8 flex flex-col justify-between h-full">
                      <div className="space-y-4">
                        {docType === DocumentType.PACKING_LIST ? (
                          <div className="space-y-3">
                            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Packing List Actions</h3>
                            <p className="text-xs text-zinc-400">Box dimensions and packaging details are managed in the table above.</p>
                          </div>
                        ) : docType === DocumentType.COST_SHEET ? (
                          <div className="space-y-4">
                            <div className="flex justify-between items-center text-sm">
                              <span className="uppercase tracking-wider font-semibold opacity-70">Direct Material & Labor</span>
                              <span className="font-mono font-bold text-base">
                                {getCurrencySymbol(currency)}{(totals.totalDirectMaterialLaborCost || 0).toFixed(2)}
                              </span>
                            </div>

                            <div className="flex justify-between items-center text-sm">
                              <span className="uppercase tracking-wider font-semibold opacity-70">Overheads & Logistics</span>
                              <span className="font-mono font-bold text-base">
                                {getCurrencySymbol(currency)}{(totals.totalOverheadsFreight || 0).toFixed(2)}
                              </span>
                            </div>

                            <div className="flex justify-between items-center text-sm pt-2 border-t border-white/10">
                              <span className="uppercase tracking-wider font-bold">Base Mfg. / Export Cost</span>
                              <span className="font-mono font-extrabold text-lg text-zinc-100">
                                {getCurrencySymbol(currency)}{totals.subtotal.toFixed(2)}
                              </span>
                            </div>

                            <div className="pt-3 border-t border-white/10 space-y-1.5">
                              <div className="flex justify-between items-center">
                                <label className="text-xs uppercase tracking-wider font-bold text-amber-300">Target Profit Margin / Markup (%)</label>
                                <span className="text-xs font-mono font-bold text-amber-300">
                                  +{getCurrencySymbol(currency)}{(totals.profitMarkupAmount || 0).toFixed(2)}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  step="any"
                                  min="0"
                                  value={targetMarginPercent === 0 ? "" : targetMarginPercent}
                                  onChange={(e) => setTargetMarginPercent(parseFloat(e.target.value) || 0)}
                                  placeholder="e.g. 20"
                                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm font-bold text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-amber-400"
                                />
                                <span className="text-sm font-bold text-amber-300">%</span>
                              </div>
                            </div>

                            {(totals.finalQuotedUnitPrice || 0) > 0 && (
                              <div className="flex justify-between items-center text-sm pt-3 border-t border-white/10">
                                <span className="uppercase tracking-wider font-bold text-emerald-400">Final Quoted Unit Price</span>
                                <span className="font-mono font-extrabold text-base text-emerald-300">
                                  {getCurrencySymbol(currency)}{(totals.finalQuotedUnitPrice || 0).toFixed(2)} / unit
                                </span>
                              </div>
                            )}

                            <div className="h-px bg-white/20 my-4" />
                            <div className="flex justify-between items-center">
                              <span className="text-lg uppercase tracking-wider font-extrabold text-white">Grand Total Cost</span>
                              <div className="text-right">
                                <span className="text-3xl font-black font-mono block text-white">
                                  {getCurrencySymbol(currency)}{totals.convertedTotal.toFixed(2)}
                                </span>
                                {isExport && currency !== "INR" && (
                                  <span className="text-[10px] opacity-40 font-mono">
                                    (₹{totals.inrTotal.toFixed(2)})
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <>
                            {/* Tax Selection Toggle directly inside Totals Summary Card */}
                            <div className="space-y-2 mb-2">
                              <div className="flex justify-between items-center bg-white/5 p-2.5 rounded-lg border border-white/10">
                                <label htmlFor="card-is-tax-enabled" className="text-xs uppercase tracking-wider font-bold text-white flex items-center gap-2 cursor-pointer select-none">
                                  <input 
                                    type="checkbox"
                                    id="card-is-tax-enabled"
                                    checked={isTaxEnabled}
                                    onChange={(e) => setIsTaxEnabled(e.target.checked)}
                                    className="w-4 h-4 accent-emerald-500 rounded border-white/20 focus:ring-emerald-500 cursor-pointer"
                                  />
                                  Apply Tax ({getTaxName(business.country || countryOfOrigin || "India")})
                                </label>
                                <span className={`text-[10px] font-extrabold tracking-wider px-2 py-0.5 rounded ${isTaxEnabled ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-white/10 text-zinc-400'}`}>
                                  {isTaxEnabled ? "TAX ON" : "TAX OFF"}
                                </span>
                              </div>

                              {isTaxEnabled && (getCountryConfig(business.country || countryOfOrigin || "India").taxSystem === "GST_INDIA" || business.taxSystem === "GST_INDIA") && (
                                <div className="flex justify-between items-center bg-white/5 p-2.5 rounded-lg border border-white/10">
                                  <label htmlFor="card-is-igst" className="text-xs uppercase tracking-wider font-bold text-zinc-200 flex items-center gap-2 cursor-pointer select-none">
                                    <input 
                                      type="checkbox"
                                      id="card-is-igst"
                                      checked={isIgst}
                                      onChange={(e) => setIsIgst(e.target.checked)}
                                      className="w-4 h-4 accent-blue-500 rounded border-white/20 focus:ring-blue-500 cursor-pointer"
                                    />
                                    Apply IGST (Inter-State Tax)
                                  </label>
                                  <span className={`text-[10px] font-extrabold tracking-wider px-2 py-0.5 rounded ${isIgst ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'}`}>
                                    {isIgst ? "IGST" : "CGST + SGST"}
                                  </span>
                                </div>
                              )}
                            </div>

                            <div className="flex justify-between items-center opacity-80 mb-2">
                              <span className="text-sm uppercase tracking-wider font-semibold">Discount (%)</span>
                              <div className={`flex items-center bg-white/10 rounded px-2 border ${docErrors.discountRate ? "border-red-500" : "border-white/10"} focus-within:border-white/30 transition-colors`}>
                                <input 
                                  type="number"
                                  className="bg-transparent border-none focus:outline-none text-right font-mono text-sm w-16 py-1 text-white disabled:opacity-50"
                                  value={discountRate ?? ""}
                                  onWheel={(e) => e.currentTarget.blur()}
                                  onChange={(e) => setDiscountRate(parseFloat(e.target.value) || 0)}
                                  placeholder="0"
                                />
                                <span className="text-xs ml-1 opacity-50">%</span>
                              </div>
                            </div>
                            {docErrors.discountRate && <p className="text-[10px] text-red-400 text-right">{docErrors.discountRate}</p>}
                            
                            {totals.discount > 0 && (
                              <div className="flex justify-between items-center opacity-60 text-xs mb-2">
                                <span className="uppercase tracking-wider">Discount Amount</span>
                                <span className="font-mono">
                                  -{getCurrencySymbol(currency)}
                                  {totals.discount.toFixed(2)}
                                </span>
                              </div>
                            )}
                            
                            <div className="flex justify-between items-center opacity-60">
                              <span className="text-sm uppercase tracking-wider font-semibold">Subtotal</span>
                              <span className="font-mono">
                                {getCurrencySymbol(currency)}
                                {totals.subtotal.toFixed(2)}
                              </span>
                            </div>

                            {isTaxEnabled && (
                              <>
                                {(() => {
                                  const countryCfg = getCountryConfig(business.country || countryOfOrigin || "India");
                                  const taxSys = business.taxSystem || countryCfg.taxSystem;
                                  const bizStateCode = business.gstin?.substring(0, 2);
                                  const custStateCode = customer.gstin?.substring(0, 2);
                                  const isValidBizState = bizStateCode && /^\d{2}$/.test(bizStateCode);
                                  const isValidCustState = custStateCode && /^\d{2}$/.test(custStateCode);
                                  const isInterState = isIgst || !!(isValidBizState && isValidCustState && bizStateCode !== custStateCode);

                                  if (taxSys === "GST_INDIA") {
                                    if (isInterState) {
                                      return (
                                        <div className="flex justify-between items-center opacity-60">
                                          <span className="text-sm uppercase tracking-wider font-semibold">Integrated GST (IGST)</span>
                                          <span className="font-mono">
                                            {getCurrencySymbol(currency)}
                                            {totals.tax.toFixed(2)}
                                          </span>
                                        </div>
                                      );
                                    } else {
                                      return (
                                        <>
                                          <div className="flex justify-between items-center opacity-60">
                                            <span className="text-sm uppercase tracking-wider font-semibold">Central GST (CGST)</span>
                                            <span className="font-mono">
                                              {getCurrencySymbol(currency)}
                                              {(totals.tax / 2).toFixed(2)}
                                            </span>
                                          </div>
                                          <div className="flex justify-between items-center opacity-60">
                                            <span className="text-sm uppercase tracking-wider font-semibold">State GST (SGST)</span>
                                            <span className="font-mono">
                                              {getCurrencySymbol(currency)}
                                              {(totals.tax / 2).toFixed(2)}
                                            </span>
                                          </div>
                                        </>
                                      );
                                    }
                                  } else if (taxSys === "SALES_TAX_US") {
                                    return (
                                      <div className="flex justify-between items-center opacity-60">
                                        <span className="text-sm uppercase tracking-wider font-semibold">Sales Tax</span>
                                        <span className="font-mono">
                                          {getCurrencySymbol(currency)}
                                          {totals.tax.toFixed(2)}
                                        </span>
                                      </div>
                                    );
                                  } else if (taxSys === "VAT_GLOBAL") {
                                    return (
                                      <div className="flex justify-between items-center opacity-60">
                                        <span className="text-sm uppercase tracking-wider font-semibold">VAT</span>
                                        <span className="font-mono">
                                          {getCurrencySymbol(currency)}
                                          {totals.tax.toFixed(2)}
                                        </span>
                                      </div>
                                    );
                                  } else {
                                    return (
                                      <div className="flex justify-between items-center opacity-60">
                                        <span className="text-sm uppercase tracking-wider font-semibold">GST</span>
                                        <span className="font-mono">
                                          {getCurrencySymbol(currency)}
                                          {totals.tax.toFixed(2)}
                                        </span>
                                      </div>
                                    );
                                  }
                                })()}
                              </>
                            )}

                            {/* Freight Charge */}
                            {freightOption === "extra" && (
                              <div className="flex justify-between items-center opacity-80 text-sm">
                                <span className="uppercase tracking-wider font-semibold">Freight Charge</span>
                                <span className="font-mono text-emerald-400">
                                  +{getCurrencySymbol(currency)}{freightAmount.toFixed(2)}
                                </span>
                              </div>
                            )}
                            {freightOption === "inclusive" && (
                              <div className="flex justify-between items-center text-sm">
                                <span className="uppercase tracking-wider font-semibold opacity-80">Freight Charge</span>
                                <span className="font-bold text-emerald-400">Inclusive</span>
                              </div>
                            )}

                            {/* Packaging Charges */}
                            {packagingOption === "extra" && (
                              <div className="flex justify-between items-center opacity-80 text-sm">
                                <span className="uppercase tracking-wider font-semibold">Packaging & Forwarding</span>
                                <span className="font-mono text-emerald-400">
                                  +{getCurrencySymbol(currency)}{packagingAmount.toFixed(2)}
                                </span>
                              </div>
                            )}
                            {packagingOption === "inclusive" && (
                              <div className="flex justify-between items-center text-sm">
                                <span className="uppercase tracking-wider font-semibold opacity-80">Packaging & Forwarding</span>
                                <span className="font-bold text-emerald-400">Inclusive</span>
                              </div>
                            )}

                            {/* Round Off */}
                            <div className="flex justify-between items-center opacity-80 text-sm">
                              <span className="uppercase tracking-wider font-semibold">Round Off</span>
                              <span className="font-mono text-zinc-200">
                                {totals.roundOff >= 0 ? "+" : "-"}
                                {getCurrencySymbol(currency)}
                                {Math.abs(totals.roundOff).toFixed(2)}
                              </span>
                            </div>

                            <div className="h-px bg-white/10 my-4" />
                            <div className="flex justify-between items-center">
                              <span className="text-lg uppercase tracking-wider font-bold">
                                {docType === DocumentType.QUOTATION ? "Total Amount" : "Grand Total"}
                              </span>
                              <div className="text-right">
                                <span className="text-3xl font-bold font-mono block">
                                  {getCurrencySymbol(currency)}
                                  {totals.convertedTotal.toFixed(2)}
                                </span>
                                {isExport && currency !== "INR" && (
                                  <span className="text-[10px] opacity-40 font-mono">
                                    (₹{totals.inrTotal.toFixed(2)})
                                  </span>
                                )}
                              </div>
                            </div>
                          </>
                        )}
                      </div>

                      <div className="mt-8 space-y-2 border-t border-white/10 pt-6">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold tracking-wide uppercase text-zinc-400">PDF Print Mode</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${layoutSettings?.hideForPreprintedLetterhead ? "bg-emerald-950 text-emerald-400 border border-emerald-900" : "bg-zinc-800 text-zinc-400 border border-zinc-700"}`}>
                            {layoutSettings?.hideForPreprintedLetterhead ? "Letterhead Mode" : "Plain Paper Mode"}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const defaultH = layoutSettings?.headerHeight && layoutSettings.headerHeight > 0 ? layoutSettings.headerHeight : 25;
                              const defaultF = layoutSettings?.footerHeight && layoutSettings.footerHeight > 0 ? layoutSettings.footerHeight : 20;
                              const newSettings = { 
                                ...layoutSettings, 
                                hideForPreprintedLetterhead: false,
                                headerHeight: defaultH,
                                footerHeight: defaultF
                              };
                              setLayoutSettings(newSettings);
                              safeSave("pdf_layout_settings", newSettings, user?.uid);
                            }}
                            className={`py-2 px-3 rounded-lg border text-xs font-bold transition-all text-center flex flex-col items-center justify-center min-h-[48px] ${
                              !layoutSettings?.hideForPreprintedLetterhead
                                ? "bg-white text-zinc-900 border-white shadow-sm"
                                : "bg-zinc-900/40 border-zinc-805 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60"
                            }`}
                          >
                            <span>With Header</span>
                            <span className="text-[9px] opacity-65 font-normal leading-normal">Plain Paper</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const defaultH = layoutSettings?.headerHeight && layoutSettings.headerHeight > 0 ? layoutSettings.headerHeight : 65;
                              const defaultF = layoutSettings?.footerHeight && layoutSettings.footerHeight > 0 ? layoutSettings.footerHeight : 40;
                              const newSettings = { 
                                ...layoutSettings, 
                                hideForPreprintedLetterhead: true,
                                headerHeight: defaultH,
                                footerHeight: defaultF
                              };
                              setLayoutSettings(newSettings);
                              safeSave("pdf_layout_settings", newSettings, user?.uid);
                            }}
                            className={`py-2 px-3 rounded-lg border text-xs font-bold transition-all text-center flex flex-col items-center justify-center min-h-[48px] ${
                              layoutSettings?.hideForPreprintedLetterhead
                                ? "bg-white text-zinc-900 border-white shadow-sm"
                                : "bg-zinc-900/40 border-zinc-805 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60"
                            }`}
                          >
                            <span>Without Header</span>
                            <span className="text-[9px] opacity-65 font-normal leading-normal">Preprinted Letterhead</span>
                          </button>
                        </div>
                      </div>

                      {/* Header & Footer Heights */}
                      <div className="mt-4 space-y-2 border-t border-white/10 pt-4 font-sans">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold tracking-wide uppercase text-zinc-400">Header & Footer (mm)</span>
                          <span className="text-[10px] text-zinc-500 font-mono">Margins</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[9px] uppercase tracking-wider font-bold text-zinc-500 block mb-1">
                              Header Height
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="200"
                              value={(layoutSettings?.headerHeight && layoutSettings.headerHeight > 0) ? layoutSettings.headerHeight : (layoutSettings?.hideForPreprintedLetterhead || !!business.letterhead ? 65 : 25)}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                const validVal = isNaN(val) || val < 0 ? 0 : val;
                                const newSettings = { ...layoutSettings, headerHeight: validVal };
                                setLayoutSettings(newSettings);
                                safeSave("pdf_layout_settings", newSettings, user?.uid);
                              }}
                              className="w-full bg-zinc-900/60 border border-zinc-805 rounded-lg py-1.5 px-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-white/20 font-mono"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] uppercase tracking-wider font-bold text-zinc-500 block mb-1">
                              Footer Height
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="200"
                              value={(layoutSettings?.footerHeight && layoutSettings.footerHeight > 0) ? layoutSettings.footerHeight : (layoutSettings?.hideForPreprintedLetterhead || !!business.letterhead ? 40 : 20)}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                const validVal = isNaN(val) || val < 0 ? 0 : val;
                                const newSettings = { ...layoutSettings, footerHeight: validVal };
                                setLayoutSettings(newSettings);
                                safeSave("pdf_layout_settings", newSettings, user?.uid);
                              }}
                              className="w-full bg-zinc-900/60 border border-zinc-850 rounded-lg py-1.5 px-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-white/20 font-mono"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Button 
                          type="button"
                          variant="outline"
                          className="w-full border-white/20 text-white hover:bg-white/10 h-13 text-sm font-bold flex items-center justify-center gap-2 cursor-pointer shadow-lg"
                          onClick={() => saveDocumentToHistory({ showToast: true })}
                          isLoading={isGenerating}
                          disabled={hasErrors}
                        >
                          <Save className="h-4 w-4 text-emerald-400" />
                          <span>Save to History</span>
                        </Button>
                        <Button 
                          className="w-full bg-white text-zinc-900 hover:bg-zinc-100 h-13 text-sm disabled:opacity-50 disabled:cursor-not-allowed font-bold flex items-center justify-center gap-2 cursor-pointer shadow-lg"
                          onClick={handleOpenTaxSummary}
                          isLoading={isGenerating}
                          disabled={hasErrors}
                        >
                          <Download className="h-5 w-5" />
                          <span>Generate & Download PDF</span>
                        </Button>
                      </div>

                      {docType !== DocumentType.DELIVERY_CHALLAN && isIndia && (
                        <Button 
                          variant="outline"
                          className="w-full mt-3 border-white/20 text-white hover:bg-white/10 h-12 flex items-center justify-center gap-2 font-medium cursor-pointer"
                          onClick={generateChallan}
                          isLoading={isGenerating}
                        >
                          <Truck className="h-4 w-4 text-blue-300" />
                          <span>Generate Delivery Challan</span>
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </main>

      {/* Footer */}
      <Footer 
        onNavigatePrivacy={() => navigateToStep("privacy")} 
        onNavigateTerms={() => navigateToStep("terms")} 
        onNavigateCompliance={() => navigateToStep("compliance")} 
        onNewBill={() => { navigateToStep("invoice"); window.scrollTo({ top: 0, behavior: 'smooth' }); }} 
      />

      {/* Mobile Bottom Nav (Quick Actions) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-zinc-200 py-2.5 px-2 sm:hidden flex justify-around items-center z-40 pb-safe">
        <button 
          className={`flex flex-col items-center gap-0.5 ${step === "dashboard" ? "text-brand-600 font-bold" : "text-zinc-400"}`}
          onClick={() => navigateToStep("dashboard")}
        >
          <LayoutDashboard className="h-5 w-5" />
          <span className="text-[9px] uppercase">Home</span>
        </button>
        <button 
          className={`flex flex-col items-center gap-0.5 ${step === "analytics" ? "text-brand-600 font-bold" : "text-zinc-400"}`}
          onClick={() => navigateToStep("analytics")}
        >
          <BarChart3 className="h-5 w-5" />
          <span className="text-[9px] uppercase">Analytics</span>
        </button>
        <button 
          className="w-12 h-12 bg-zinc-900 text-white rounded-full flex items-center justify-center -mt-8 shadow-xl shadow-zinc-900/20 border-4 border-white disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleNewDocument}
        >
          <Plus className="h-6 w-6" />
        </button>
        <button 
          className={`flex flex-col items-center gap-0.5 ${step === "history" ? "text-brand-600 font-bold" : "text-zinc-400"}`}
          onClick={() => navigateToStep("history")}
        >
          <Clock className="h-5 w-5" />
          <span className="text-[9px] uppercase">History</span>
        </button>
        <button 
          className={`flex flex-col items-center gap-0.5 ${step === "profile" ? "text-brand-600 font-bold" : "text-zinc-400"}`}
          onClick={() => navigateToStep("profile")}
        >
          <Settings className="h-5 w-5" />
          <span className="text-[9px] uppercase">Profile</span>
        </button>
      </div>

      {/* Custom Modal */}
      <Modal
        isOpen={modalConfig.isOpen}
        onClose={closeModal}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        onConfirm={modalConfig.onConfirm}
        confirmText={modalConfig.confirmText}
        cancelText={modalConfig.cancelText}
      />

      {/* Delivery Challan Modal */}
      <GenerateChallanModal
        isOpen={isGenerateChallanModalOpen}
        onClose={() => setIsGenerateChallanModalOpen(false)}
        onGenerate={handleConfirmGenerateChallan}
        initialData={{
          numberOfPackages,
          despatchDocNo,
          transport,
          reasonForTransportation,
          dispatchDate: date,
          finalDestination,
          showPricesInChallan,
        }}
      />

      {/* Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden"
          >
            <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold">Import Products</h3>
                <p className="text-xs text-zinc-500">Select a previous document to pull products from</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setIsImportModalOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {history.length === 0 ? (
                <div className="text-center py-12">
                  <History className="h-12 w-12 text-zinc-200 mx-auto mb-4" />
                  <p className="text-zinc-500 font-medium">No document history found</p>
                </div>
              ) : (
                history
                  .slice()
                  .sort((a, b) => b.timestamp - a.timestamp)
                  .map((doc, idx) => (
                    <button
                      key={`${doc.id || 'doc'}-${doc.timestamp || ''}-${idx}`}
                      onClick={() => importFromDocument(doc)}
                      className="w-full flex items-center justify-between p-4 rounded-xl border border-zinc-100 hover:border-brand-200 hover:bg-brand-50/30 transition-all text-left group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-zinc-100 flex items-center justify-center group-hover:bg-brand-100 transition-colors">
                          <FileText className="h-5 w-5 text-zinc-400 group-hover:text-brand-600" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-zinc-900">{doc.customerName}</p>
                          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                            {doc.type} • {doc.id} • {doc.date}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-zinc-300 group-hover:text-brand-600 group-hover:translate-x-1 transition-all" />
                    </button>
                  ))
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* QA Import Modal */}
      {showQAImportModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden"
          >
            <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold">Import for Quality Report</h3>
                <p className="text-xs text-zinc-500">Import company details and items from a previous Quotation or Invoice</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowQAImportModal(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {history.length === 0 ? (
                <div className="text-center py-12">
                  <History className="h-12 w-12 text-zinc-200 mx-auto mb-4" />
                  <p className="text-zinc-500 font-medium">No document history found</p>
                </div>
              ) : (
                history
                  .filter(h => h.type === DocumentType.QUOTATION || h.type === DocumentType.TAX_INVOICE)
                  .sort((a, b) => b.timestamp - a.timestamp)
                  .map((doc, idx) => (
                    <button
                      key={`${doc.id || 'doc'}-${doc.timestamp || ''}-${idx}`}
                      onClick={() => handleQAImport(doc)}
                      className="w-full p-4 flex items-center justify-between text-left rounded-xl border border-zinc-100 hover:border-brand-200 hover:bg-brand-50 transition-all group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-zinc-100 rounded-lg flex items-center justify-center group-hover:bg-brand-100 text-zinc-500 group-hover:text-brand-600 transition-colors">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-zinc-900">{doc.customerName || 'Unknown Customer'}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="px-1.5 py-0.5 bg-zinc-100 text-[8px] font-black uppercase rounded text-zinc-600 tracking-tighter">
                              {doc.type?.replace('_', ' ') || 'DOCUMENT'}
                            </span>
                            <p className="text-[10px] font-bold text-zinc-400 group-hover:text-brand-400 uppercase tracking-widest flex items-center gap-2">
                              <span>#{doc.fullData?.id || '---'}</span>
                              <span>•</span>
                              <span>{(doc.fullData?.items?.length || 0)} Items</span>
                            </p>
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-zinc-300 group-hover:text-brand-600" />
                    </button>
                  ))
              )}
            </div>
          </motion.div>
        </div>
      )}



      <TaxSummaryModal
        isOpen={isTaxSummaryModalOpen}
        onClose={() => setIsTaxSummaryModalOpen(false)}
        onConfirmDownload={generatePDF}
        onPrint={() => {
          setIsTaxSummaryModalOpen(false);
          generatePDF();
        }}
        docType={docType}
        docId={docId}
        date={date}
        items={items}
        customer={customer}
        business={business}
        discount={totals.discount}
        discountRate={discountRate}
        currency={currency}
        country={countryOfOrigin}
        advancePercentage={advancePercentage}
        isTaxEnabled={isTaxEnabled}
        isIgst={isIgst}
      />

      {/* Global Shortcut Toast Notification */}
      <AnimatePresence>
        {shortcutToast && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-20 sm:bottom-8 right-6 z-50 bg-zinc-900/95 text-white px-4 py-3 rounded-2xl shadow-2xl border border-zinc-700/80 backdrop-blur-md flex items-center gap-3 text-xs font-bold tracking-tight"
          >
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span>{shortcutToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <AIChat 
        history={history} 
        priceHistory={priceHistory} 
        customers={savedCustomers} 
        suppliers={savedSuppliers} 
        business={business}
        industry={business.industry}
        letterhead={business.letterhead}
        currency={currency}
        exchangeRate={exchangeRate}
        onAddItem={handleAIAddItem}
        onSetCustomer={handleAISetCustomer}
        onSetDocType={handleAISetDocType}
        onClearForm={handleAIClearForm}
      />

      <WelcomeModal 
        isOpen={showWelcomeModal}
        onClose={handleCloseWelcomeModal}
        onTryAIExtraction={() => {
          handleCloseWelcomeModal();
          setStep("invoice");
          setTimeout(() => {
            document.getElementById("document-upload-section")?.scrollIntoView({ behavior: "smooth" });
          }, 100);
        }}
        onExploreDashboard={() => {
          handleCloseWelcomeModal();
          setStep("dashboard");
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        onShareFeedback={() => {
          handleCloseWelcomeModal();
          window.dispatchEvent(new CustomEvent("open-footer-modal", { detail: "feedback" }));
        }}
      />

      {/* Delete Account Confirmation Modal */}
      <AnimatePresence>
        {showDeleteAccountModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-zinc-100 space-y-6"
            >
              <div className="flex items-center gap-3 text-red-600">
                <div className="p-3 bg-red-100 rounded-2xl">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-zinc-900">Confirm Account Deletion</h3>
                  <p className="text-xs text-zinc-500">This action cannot be undone.</p>
                </div>
              </div>

              <div className="p-4 bg-red-50/70 rounded-2xl border border-red-100 text-xs text-red-900 leading-relaxed font-medium">
                You are about to permanently delete your account (<strong className="font-bold">{userProfile?.signupEmail || userProfile?.authEmail || user?.email}</strong>). All created documents, invoice history, customer directories, and saved settings will be wiped from our database.
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteAccountModal(false)}
                  disabled={isDeletingAccount}
                  className="border-zinc-200 text-zinc-700 font-bold rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDeleteUserAccount}
                  disabled={isDeletingAccount}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-md flex items-center gap-2"
                >
                  {isDeletingAccount ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Deleting Account...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>Permanently Delete Account</span>
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <FeedbackModal
        isOpen={showFeedbackModal}
        userEmail={user?.email || customer.email}
        userId={user?.uid}
        onSubmitSuccess={handleFeedbackSurveySuccess}
      />

      <ContactSupportModal
        isOpen={showContactSupportModal}
        onClose={() => setShowContactSupportModal(false)}
        userEmail={user?.email || customer.email}
      />

      <TrialLimitModal
        isOpen={showTrialLimitModal}
        onClose={() => {
          setShowTrialLimitModal(false);
          setTrialModalCustomMessage(undefined);
        }}
        documentCount={getEffectiveLifetimeDocCount(userProfile, impersonatedUser ? impersonatedUser.id : user?.uid)}
        planName={getPlanDetails(userProfile?.planTier || userProfile?.plan).badgeText}
        planTier={userProfile?.planTier || userProfile?.plan}
        maxLimit={(getPlanDetails(userProfile?.planTier || userProfile?.plan).documentLimit || 5) + (userProfile?.trialCreditsGranted || 0)}
        documentsRemaining={userProfile?.documentsRemaining}
        isReRegisteredUser={userProfile?.isReRegisteredUser}
        customMessage={trialModalCustomMessage}
      />

      <AdminPinModal
        isOpen={showAdminPinModal}
        userEmail={user?.email || userProfile?.signupEmail || userProfile?.authEmail || "admin"}
        onSuccess={() => {
          setIsAdminPinVerified(true);
          setShowAdminPinModal(false);
          setIsAdminConsoleActive(true);
          if (user?.uid) {
            try {
              localStorage.setItem(`billiq_user_${user.uid}_billiq_active_view`, "admin");
              localStorage.setItem("billiq_active_view", "admin");
            } catch {}
          }
        }}
        onCancel={() => {
          setShowAdminPinModal(false);
        }}
      />

      {/* Vercel Web Analytics */}
      <Analytics />
    </div>
  );
}
