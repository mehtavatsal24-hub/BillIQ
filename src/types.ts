export enum DocumentType {
  TAX_INVOICE = "Tax Invoice",
  DELIVERY_CHALLAN = "Delivery Challan",
  PROFORMA_INVOICE = "Proforma Invoice",
  QUOTATION = "Quotation",
  PURCHASE_ORDER = "Purchase Order",
  PACKING_LIST = "Packing List",
  COST_SHEET = "Cost Sheet",
}

export interface IndustryOption {
  value: string;
  label: string;
  icon: string;
}

export const BUSINESS_INDUSTRIES: IndustryOption[] = [
  { value: "Chemicals, Petrochemicals & Polymers", label: "Chemicals, Petrochemicals & Polymers", icon: "🧪" },
  { value: "Industrial Hardware, Piping & Valves", label: "Industrial Hardware, Piping & Valves", icon: "⚙️" },
  { value: "Electrical, Electronics & Automation", label: "Electrical, Electronics & Automation", icon: "⚡" },
  { value: "Engineering & Heavy Machinery", label: "Engineering & Heavy Machinery", icon: "🚜" },
  { value: "Metals, Steel & Fabrication", label: "Metals, Steel & Fabrication", icon: "🏗️" },
  { value: "Textiles, Apparel & Fabrics", label: "Textiles, Apparel & Fabrics", icon: "🧵" },
  { value: "Pharmaceuticals, Biotech & Healthcare", label: "Pharmaceuticals, Biotech & Healthcare", icon: "💊" },
  { value: "Food, Beverages & Agriculture", label: "Food, Beverages & Agriculture", icon: "🌾" },
  { value: "Construction, Building Materials & Real Estate", label: "Construction, Building Materials & Real Estate", icon: "🧱" },
  { value: "Automobiles, Auto Components & Spare Parts", label: "Automobiles, Auto Components & Spare Parts", icon: "🚗" },
  { value: "IT, Software & Digital Services", label: "IT, Software & Digital Services", icon: "💻" },
  { value: "General Trading, Wholesale & Retail", label: "General Trading, Wholesale & Retail", icon: "📦" },
  { value: "Logistics, Freight & Packaging", label: "Logistics, Freight & Packaging", icon: "🚚" },
  { value: "Furniture, Home Decor & Woodwork", label: "Furniture, Home Decor & Woodwork", icon: "🪑" },
  { value: "Paper, Printing & Publishing", label: "Paper, Printing & Publishing", icon: "📄" },
  { value: "Renewable Energy, Solar & Utilities", label: "Renewable Energy, Solar & Utilities", icon: "☀️" },
  { value: "Professional Services, Legal & Accounting", label: "Professional Services, Legal & Accounting", icon: "💼" },
];

export interface BusinessDetails {
  name: string;
  gstin: string;
  address: string;
  phone: string;
  email: string;
  country?: string;
  state?: string;
  currency?: string;
  taxSystem?: string;
  industry?: string;
  logo?: string; // base64
  letterhead?: string; // base64
  signature?: string; // base64
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  branchCode?: string;
  showBankDetailsInDocs?: DocumentType[];
  layoutSettings?: PDFLayoutSettings;
  headerHeight?: number;
  footerHeight?: number;
}

export type PDFSection = 
  | "header" 
  | "party_details" 
  | "items_table" 
  | "totals" 
  | "bank_details" 
  | "incoterms"
  | "terms" 
  | "signature";

export type PDFTemplate = "classic" | "modern" | "minimal";

export interface PDFLayoutSettings {
  template: PDFTemplate;
  sectionOrder: PDFSection[];
  accentColor?: string;
  fontFamily?: string;
  headerHeight?: number; // in mm
  footerHeight?: number; // in mm
  hideForPreprintedLetterhead?: boolean;
}

export interface CustomerDetails {
  name: string;
  gstin: string;
  address: string;
  phone: string;
  email: string;
  contactPerson?: string;
  attentionPerson?: string;
  country?: string;
}

export interface SavedCustomer extends CustomerDetails {
  id: string;
  isExport?: boolean;
  currency?: string;
  notes?: string;
  terms?: string;
}

export interface SavedSupplier extends CustomerDetails {
  id: string;
  isExport?: boolean;
  currency?: string;
  notes?: string;
  terms?: string;
}

export interface DocumentHistoryItem {
  id: string;
  timestamp: number;
  type: DocumentType;
  date: string;
  customerName: string;
  customerCountry?: string;
  total: number;
  inrTotal?: number;
  currency?: string;
  fullData?: InvoiceData;
  paymentStatus?: "pending" | "paid" | "overdue" | "due_soon";
  dueDate?: string;
  editCount?: number;
}

export interface LineItem {
  id: string;
  description: string;
  hsn: string;
  quantity: number;
  unit?: string;
  rate: number;
  taxRate: number; // percentage
  isRegret?: boolean;
  heatNo?: string;
  qtyPacked?: number;
  remarks?: string;
  boxNo?: string;
  netWeight?: number;
  grossWeight?: number;
  unitWeight?: number;
  grossWeightPercent?: string;
  // Cost Sheet & Supplier fields
  rawMaterialCost?: number;
  laborCost?: number;
  overheadCost?: number;
  estimatedUnitCost?: number;
  costHead?: string;
  costType?: "Flat" | "%" | "Per Unit" | "By Weight";
  costTypeValue?: number;
  costCategoryKey?: string;
  isCustomHead?: boolean;
  isProductItem?: boolean;
  targetSupplierIndex?: number;
  addSupplierRequested?: boolean;
  supplierAmounts?: Record<string, number>;
  supplierTypeValues?: Record<string, number>;
  isAiEdited?: boolean;
}

export interface InspectionParameter {
  parameter: string;
  method: string;
  tool: string;
  isVerified: boolean;
}

export interface PackagingDispatchItem {
  controlArea: string;
  method: string;
  verification: string;
  status: string;
}

export interface NcrItem {
  product: string;
  quantity: string;
  deviation: string;
  actionTaken: string;
  status: string;
}

export interface EvidenceItem {
  docType: string;
  description: string;
  status: string;
}

export interface MeasuredValue {
  standard: string;
  measured: string;
  tolerance?: string;
  isValid?: boolean;
  aiFeedback?: string;
  label?: string;
}

export interface DimensionalOrderItem {
  itemId: string;
  itemNo?: string;
  extractedDescription?: string;
  category: "flange" | "fitting" | "forged_fitting" | "pipe" | "olet" | "other";
  size: string;
  size2?: string; // For reducing items like Reducers and Reducing Tees
  type?: string; 
  standardClass?: string; 
  schedule?: string;
  rating?: string; // Normalized rating like 150, 3000, etc.
  dimensions: Record<string, MeasuredValue>;
  result: "PASSED" | "FAILED" | "PENDING";
  aiInsights?: string;
  aiSummary?: string;
}

export interface PackingBox {
  boxNo: string; // e.g. "Box 1"
  quantityText?: string; // e.g. "BOX 1 X 275"
  grossWeight: number;
  netWeight: number;
  dimensions: string; // e.g. "24 X 18 X 4 Inches"
}

export interface CostSheetSupplierSummary {
  id: string;
  name: string;
  productCostTotal: number;
  logisticsTotal: number;
  totalLandedCost: number;
  profitType: "%" | "Flat";
  profitValue: number;
  profitAmount: number;
  discountType: "%" | "Flat";
  discountValue: number;
  discountAmount: number;
  finalSellingPrice: number;
  isLowestCost?: boolean;
  isBestValue?: boolean;
  productCost?: number;
  logisticsCost?: number;
  landedCost?: number;
}

export interface CostSheetRowSummary {
  id: string;
  costHead: string;
  description: string;
  type: "Flat" | "%" | "Per Unit" | "By Weight";
  typeValue?: number;
  basisDetail?: string;
  supplierAmounts: Record<string, number>;
  supplierTypeValues?: Record<string, number>;
  costType?: "Flat" | "%" | "Per Unit" | "By Weight";
  amountsBySupplier?: Record<string, number>;
  head?: string;
  remarks?: string;
}

export interface InvoiceData {
  id: string;
  type: DocumentType;
  date: string;
  dueDate: string;
  business: BusinessDetails;
  customer: CustomerDetails;
  items: LineItem[];
  notes: string;
  terms: string;
  showNotesInPdf?: boolean;
  showTermsInPdf?: boolean;
  transport?: string;
  poNumber?: string;
  isExport?: boolean;
  isTaxEnabled?: boolean;
  isIgst?: boolean;
  currency?: string;
  exchangeRate?: number;
  discount?: number;
  discountRate?: number;
  layoutSettings?: PDFLayoutSettings;
  paymentMode?: string;
  paymentTerms?: string;
  numberOfPackages?: string;
  reasonForTransportation?: string;
  showPricesInChallan?: boolean;
  advancePercentage?: number;
  freightOption?: "none" | "extra" | "inclusive";
  freightAmount?: number;
  freightTaxTiming?: "before_tax" | "after_tax";
  freightTaxRate?: number;
  packagingOption?: "none" | "extra" | "inclusive";
  packagingAmount?: number;
  packagingTaxTiming?: "before_tax" | "after_tax";
  packagingTaxRate?: number;
  // Cost Sheet specific
  projectName?: string;
  targetMarginPercent?: number;
  costSheetProfitType?: "%" | "Flat";
  costSheetProfitValue?: number;
  costSheetProfitAmount?: number;
  costSheetDiscountType?: "%" | "Flat";
  costSheetDiscountValue?: number;
  costSheetDiscountAmount?: number;
  costSheetTotalLandedCost?: number;
  costSheetFinalSellingPrice?: number;
  costSheetProductCostTotal?: number;
  costSheetLogisticsTotal?: number;
  costSheetDirectMaterialLaborTotal?: number;
  costSheetSuppliers?: CostSheetSupplierSummary[];
  costSheetRowsSummary?: CostSheetRowSummary[];
  costSheetTotalQuantity?: number;
  costSheetTotalWeight?: number;
  costSheetWeightUnit?: "kg" | "lbs";
  // Incoterms Export Details
  incotermRule?: string;
  incotermNamedPlace?: string;
  incotermPortOfLoading?: string;
  incotermCountryOfOrigin?: string;
  incotermCountryOfDestination?: string;
  incotermFreightTerms?: string;
  incotermInsuranceDetails?: string;

  // Packing List specific
  packingBoxes?: PackingBox[];
  preCarriageBy?: string;
  placeOfReceipt?: string;
  vesselFlightNo?: string;
  portOfLoading?: string;
  portOfDischarge?: string;
  finalDestination?: string;
  countryOfOrigin?: string;
  countryOfDestination?: string;
  buyerDetails?: string;
  consigneeName?: string;
  consigneeAddress?: string;
  consigneeGstin?: string;
  buyerOrderDate?: string;
  despatchDocNo?: string;
}

export interface AIProductSuggestion {
  name: string;
  category: string;
  hsn: string;
  suggestedTaxRate: number;
  quantity?: number;
  rate?: number;
  unit?: string;
}

export interface AIDocumentAnalysis {
  itemCount?: number;
  products: AIProductSuggestion[];
  customer?: Partial<CustomerDetails>;
  scopeOfWork?: string;
  materialType?: string;
}

export interface PriceHistoryItem {
  description: string;
  rate: number;
  date: string;
  customerName: string;
  hsn?: string;
}

export interface RememberedNotes {
  notes: string;
  terms: string;
}

export interface LastUsedNotesAndTerms {
  customer: {
    standard: RememberedNotes;
    export: RememberedNotes;
  };
  supplier: {
    standard: RememberedNotes;
    export: RememberedNotes;
  };
}

export interface UserOverrides {
  bypassDocLimit?: boolean;
  forceRefreshState?: boolean;
  skipValidation?: boolean;
  enableBetaOCR?: boolean;
  forcedPlan?: string;
  customDocQuota?: number | null;
  bonusDocCredits?: number;
  accountLockStatus?: "Active" | "Soft Paused" | "Locked";
  lastSyncTriggeredAt?: string;
  sessionRevokedAt?: string;
  resetCacheTimestamp?: string;
}

export interface UserOverrideAuditLog {
  id: string;
  timestamp: string;
  adminId: string;
  action: string;
  parameter: string;
  oldValue?: any;
  newValue?: any;
  notes?: string;
}

