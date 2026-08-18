import React, { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, Check, RotateCcw, SlidersHorizontal, FileSpreadsheet, DollarSign, Calculator, Layers, Tag, Users, Award, AlertCircle, X, Package, Scale, Download, Wand2, Save, CheckCircle2, FolderOpen, ChevronDown, Bookmark, Sparkles, FolderPlus } from "lucide-react";
import { LineItem, CostSheetSupplierSummary, CostSheetRowSummary } from "../types";
import { exportLandedCostSheetToExcel } from "../services/excelService";

export interface CostSheetRow {
  id: string;
  categoryKey: string;
  costHead: string;
  badgeText?: string;
  description: string;
  placeholder: string;
  type: "Flat" | "%" | "Per Unit" | "By Weight";
  typeValue?: number;
  amount: number;
  isCustomHead?: boolean;
  isProductItem?: boolean;
  quantity?: number;
  unitRate?: number;
  unit?: string;
  isVisible?: boolean;
  isEditingName?: boolean;
  supplierAmounts?: Record<string, number>;
  supplierTypeValues?: Record<string, number>;
  supplierQuantities?: Record<string, number>;
  supplierUnitRates?: Record<string, number>;
  isAiEdited?: boolean;
}

export interface SupplierColumn {
  id: string;
  name: string;
  profitType: "%" | "Flat";
  profitValue: number;
  discountType: "%" | "Flat";
  discountValue: number;
}

interface LandedCostSheetProps {
  items: LineItem[];
  onChangeItems: (newItems: LineItem[]) => void;
  currencySymbol: string;
  currency: string;
  freightAmount?: number;
  setFreightAmount?: (val: number) => void;
  packagingAmount?: number;
  setPackagingAmount?: (val: number) => void;
  docId?: string;
  docDate?: string;
  businessName?: string;
  customerName?: string;
  projectName?: string;
  onUpdateTotals?: (totals: { 
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
  }) => void;
}

export const STANDARD_COST_HEAD_DEFAULTS: Omit<CostSheetRow, "id">[] = [
  {
    categoryKey: "product",
    costHead: "Product Cost",
    badgeText: "PRODUCT COST",
    description: "",
    placeholder: "Purchase price from supplier",
    type: "Flat",
    typeValue: 0,
    amount: 0,
    isVisible: true,
  },
  {
    categoryKey: "freight",
    costHead: "Freight / Transportation",
    description: "",
    placeholder: "Cost to bring goods to warehouse or customer",
    type: "Flat",
    typeValue: 0,
    amount: 0,
    isVisible: true,
  },
  {
    categoryKey: "loading",
    costHead: "Loading & Unloading",
    description: "",
    placeholder: "Handling charges",
    type: "Flat",
    typeValue: 0,
    amount: 0,
    isVisible: true,
  },
  {
    categoryKey: "packaging",
    costHead: "Packaging",
    description: "",
    placeholder: "Boxes, pallets, labels, repacking, etc.",
    type: "Flat",
    typeValue: 0,
    amount: 0,
    isVisible: true,
  },
  {
    categoryKey: "labour",
    costHead: "Labour Charges",
    description: "",
    placeholder: "Labour cost for handling, loading, assembly",
    type: "Flat",
    typeValue: 0,
    amount: 0,
    isVisible: true,
  },
  {
    categoryKey: "insurance",
    costHead: "Insurance",
    description: "",
    placeholder: "Cargo or transit insurance",
    type: "Flat",
    typeValue: 0,
    amount: 0,
    isVisible: true,
  },
  {
    categoryKey: "customs",
    costHead: "Duties & Taxes",
    description: "",
    placeholder: "Customs duty, import duty, local taxes",
    type: "Flat",
    typeValue: 0,
    amount: 0,
    isVisible: true,
  },
  {
    categoryKey: "bank",
    costHead: "Bank & Payment Charges",
    description: "",
    placeholder: "Bank transfer fees, LC charges, forex charges",
    type: "Flat",
    typeValue: 0,
    amount: 0,
    isVisible: true,
  },
  {
    categoryKey: "warehousing",
    costHead: "Warehousing / Storage",
    description: "",
    placeholder: "Warehouse rent or storage allocation",
    type: "Flat",
    typeValue: 0,
    amount: 0,
    isVisible: true,
  },
  {
    categoryKey: "inspection",
    costHead: "Inspection / Quality",
    description: "",
    placeholder: "Third-party inspection, testing, QC",
    type: "Flat",
    typeValue: 0,
    amount: 0,
    isVisible: true,
  },
  {
    categoryKey: "other",
    costHead: "Other Expenses",
    description: "",
    placeholder: "Any miscellaneous cost",
    type: "Flat",
    typeValue: 0,
    amount: 0,
    isVisible: true,
  },
];

export interface SavedCostSheetTemplate {
  id: string;
  name: string;
  description?: string;
  rows: CostSheetRow[];
  savedAt: string;
  isBuiltIn?: boolean;
}

export const BUILT_IN_CUSTOM_PRESETS: SavedCostSheetTemplate[] = [
  {
    id: "preset-import-logistics",
    name: "Import & Overseas Logistics",
    description: "Base product cost, sea/air freight, port handling, customs duty & insurance",
    savedAt: "Built-in Preset",
    isBuiltIn: true,
    rows: [
      {
        id: "cust-imp-1",
        categoryKey: "product",
        costHead: "Base Cost (FOB Overseas Purchase)",
        badgeText: "BASE COST",
        description: "Direct unit purchase price from overseas supplier",
        placeholder: "Supplier quote amount",
        type: "Flat",
        typeValue: 0,
        amount: 0,
        supplierAmounts: { "sup-1": 0 },
        supplierTypeValues: { "sup-1": 0 },
        isVisible: true,
      },
      {
        id: "cust-imp-2",
        categoryKey: "freight",
        costHead: "Sea / Air Freight & Logistics",
        description: "International cargo transportation & forwarder fee",
        placeholder: "Freight forwarder charge",
        type: "%",
        typeValue: 8,
        amount: 0,
        supplierAmounts: { "sup-1": 0 },
        supplierTypeValues: { "sup-1": 8 },
        isVisible: true,
      },
      {
        id: "cust-imp-3",
        categoryKey: "customs",
        costHead: "Customs Duty & Tariff Taxes",
        description: "Import tariffs & local customs duty assessment",
        placeholder: "Customs duty estimate",
        type: "%",
        typeValue: 12,
        amount: 0,
        supplierAmounts: { "sup-1": 0 },
        supplierTypeValues: { "sup-1": 12 },
        isVisible: true,
      },
      {
        id: "cust-imp-4",
        categoryKey: "loading",
        costHead: "Port Handling & Terminal Charges (THC)",
        description: "Container drayage, port clearance & handling fees",
        placeholder: "Port clearance charges",
        type: "Flat",
        typeValue: 0,
        amount: 0,
        supplierAmounts: { "sup-1": 0 },
        supplierTypeValues: { "sup-1": 0 },
        isVisible: true,
      },
      {
        id: "cust-imp-5",
        categoryKey: "insurance",
        costHead: "Transit & Cargo Marine Insurance",
        description: "Transit risk policy & marine cover",
        placeholder: "Insurance premium",
        type: "%",
        typeValue: 1.5,
        amount: 0,
        supplierAmounts: { "sup-1": 0 },
        supplierTypeValues: { "sup-1": 1.5 },
        isVisible: true,
      },
      {
        id: "cust-imp-6",
        categoryKey: "warehousing",
        costHead: "Inland Transport & Storage",
        description: "Trucking from port to distribution warehouse",
        placeholder: "Local trucking cost",
        type: "Flat",
        typeValue: 0,
        amount: 0,
        supplierAmounts: { "sup-1": 0 },
        supplierTypeValues: { "sup-1": 0 },
        isVisible: true,
      },
    ],
  },
  {
    id: "preset-manufacturing",
    name: "Manufacturing & Production",
    description: "Raw material base cost, direct labour, tooling wear, packaging & QC inspection",
    savedAt: "Built-in Preset",
    isBuiltIn: true,
    rows: [
      {
        id: "cust-mfg-1",
        categoryKey: "product",
        costHead: "Base Raw Material Cost (BOM)",
        badgeText: "DIRECT MATERIAL",
        description: "Raw materials and component purchase allocation",
        placeholder: "BOM / material cost",
        type: "Flat",
        typeValue: 0,
        amount: 0,
        supplierAmounts: { "sup-1": 0 },
        supplierTypeValues: { "sup-1": 0 },
        isVisible: true,
      },
      {
        id: "cust-mfg-2",
        categoryKey: "labour",
        costHead: "Direct Labour & Assembly",
        description: "Machining, assembly line & technician charges",
        placeholder: "Assembly labor cost",
        type: "%",
        typeValue: 15,
        amount: 0,
        supplierAmounts: { "sup-1": 0 },
        supplierTypeValues: { "sup-1": 15 },
        isVisible: true,
      },
      {
        id: "cust-mfg-3",
        categoryKey: "other",
        costHead: "Tooling & Machine Overhead Allocation",
        description: "Equipment depreciation & tooling allocation per unit",
        placeholder: "Machine overhead rate",
        type: "Per Unit",
        typeValue: 0,
        amount: 0,
        supplierAmounts: { "sup-1": 0 },
        supplierTypeValues: { "sup-1": 0 },
        isVisible: true,
      },
      {
        id: "cust-mfg-4",
        categoryKey: "packaging",
        costHead: "Export Packaging & Labelling",
        description: "Cartons, pallets, strapping & barcode labelling",
        placeholder: "Packaging per unit",
        type: "Flat",
        typeValue: 0,
        amount: 0,
        supplierAmounts: { "sup-1": 0 },
        supplierTypeValues: { "sup-1": 0 },
        isVisible: true,
      },
      {
        id: "cust-mfg-5",
        categoryKey: "inspection",
        costHead: "Quality Assurance & Batch Testing",
        description: "Lab testing, ISO compliance & QA inspection fee",
        placeholder: "QA fee",
        type: "Flat",
        typeValue: 0,
        amount: 0,
        supplierAmounts: { "sup-1": 0 },
        supplierTypeValues: { "sup-1": 0 },
        isVisible: true,
      },
    ],
  },
  {
    id: "preset-distribution",
    name: "Distribution & Wholesale",
    description: "Base wholesale unit price, logistics, pallet storage & credit transaction fees",
    savedAt: "Built-in Preset",
    isBuiltIn: true,
    rows: [
      {
        id: "cust-dist-1",
        categoryKey: "product",
        costHead: "Base Wholesale Unit Price",
        badgeText: "WHOLESALE BASE",
        description: "Base purchase price per wholesale unit",
        placeholder: "Wholesale unit rate",
        type: "Flat",
        typeValue: 0,
        amount: 0,
        supplierAmounts: { "sup-1": 0 },
        supplierTypeValues: { "sup-1": 0 },
        isVisible: true,
      },
      {
        id: "cust-dist-2",
        categoryKey: "freight",
        costHead: "Logistics & Delivery Freight",
        description: "Courier freight & last-mile delivery fee",
        placeholder: "Delivery fee per unit",
        type: "Per Unit",
        typeValue: 0,
        amount: 0,
        supplierAmounts: { "sup-1": 0 },
        supplierTypeValues: { "sup-1": 0 },
        isVisible: true,
      },
      {
        id: "cust-dist-3",
        categoryKey: "warehousing",
        costHead: "Pallet Storage & Handling",
        description: "3PL warehouse rack storage and pick-pack charges",
        placeholder: "Storage allocation",
        type: "Flat",
        typeValue: 0,
        amount: 0,
        supplierAmounts: { "sup-1": 0 },
        supplierTypeValues: { "sup-1": 0 },
        isVisible: true,
      },
      {
        id: "cust-dist-4",
        categoryKey: "bank",
        costHead: "Payment & Financial Gateway Charges",
        description: "Bank transfer fees, credit terms & payment gateway",
        placeholder: "Bank transaction %",
        type: "%",
        typeValue: 2,
        amount: 0,
        supplierAmounts: { "sup-1": 0 },
        supplierTypeValues: { "sup-1": 2 },
        isVisible: true,
      },
    ],
  },
];

const INITIAL_CUSTOM_SHEET_ROWS: CostSheetRow[] = [
  {
    id: "cust-row-1",
    categoryKey: "product",
    costHead: "Base Cost (Product Cost)",
    badgeText: "",
    description: "The base reference value for all subsequent percentage costs",
    placeholder: "Description (cost details)",
    type: "Flat",
    typeValue: 0,
    amount: 0,
    supplierAmounts: { "sup-1": 0 },
    supplierTypeValues: { "sup-1": 0 },
    isVisible: true,
  },
];

interface TemplateLoadDropdownMenuProps {
  savedTemplatesList: SavedCostSheetTemplate[];
  activeTemplateName: string;
  onApplyTemplate: (template: SavedCostSheetTemplate) => void;
  onDeleteTemplate: (id: string, e: React.MouseEvent) => void;
  onOpenSaveModal: () => void;
  buttonClassName?: string;
  dropDirection?: "up" | "down";
}

const TemplateLoadDropdownMenu: React.FC<TemplateLoadDropdownMenuProps> = ({
  savedTemplatesList,
  activeTemplateName,
  onApplyTemplate,
  onDeleteTemplate,
  onOpenSaveModal,
  buttonClassName = "px-3.5 py-1.5 bg-white hover:bg-emerald-100/80 text-emerald-900 rounded-xl text-xs font-extrabold border border-emerald-300 shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer",
  dropDirection = "down",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!isOpen) return;

    const handlePointerDownOutside = (event: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDownOutside);
    document.addEventListener("touchstart", handlePointerDownOutside);

    return () => {
      document.removeEventListener("mousedown", handlePointerDownOutside);
      document.removeEventListener("touchstart", handlePointerDownOutside);
    };
  }, [isOpen]);

  const handleSelect = (template: SavedCostSheetTemplate) => {
    onApplyTemplate(template);
    setIsOpen(false);
  };

  const handleOpenSave = () => {
    onOpenSaveModal();
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={buttonClassName}
        title="Load a saved custom layout or industry preset"
      >
        <FolderOpen className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
        <span>Load Saved Template</span>
        <ChevronDown className={`w-3.5 h-3.5 text-emerald-600 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div
          className={`absolute ${
            dropDirection === "up" ? "bottom-full mb-2" : "top-full mt-2"
          } left-0 w-80 max-h-88 overflow-y-auto bg-white rounded-2xl border border-zinc-200 shadow-2xl z-50 p-2 text-xs divide-y divide-zinc-100 animate-in fade-in zoom-in-95 duration-150`}
        >
          {/* Saved Templates Section */}
          {savedTemplatesList.length > 0 ? (
            <div className="p-2 space-y-1">
              <div className="text-[10px] font-black uppercase text-emerald-800 tracking-wider flex items-center gap-1 px-2 py-1">
                <Bookmark className="w-3 h-3 text-emerald-600" /> Your Saved Custom Templates
              </div>
              {savedTemplatesList.map((tpl) => (
                <div
                  key={tpl.id}
                  onClick={() => handleSelect(tpl)}
                  className={`flex items-center justify-between p-2 rounded-xl cursor-pointer hover:bg-emerald-50/80 transition-colors ${
                    activeTemplateName === tpl.name ? "bg-emerald-50 border border-emerald-200 font-bold" : ""
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-extrabold text-zinc-900 truncate">{tpl.name}</div>
                    <div className="text-[10px] text-zinc-400 font-medium">
                      {tpl.rows.length} cost heads • {tpl.savedAt}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteTemplate(tpl.id, e);
                      }}
                      className="p-1 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded cursor-pointer"
                      title="Delete saved template"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-3 text-center text-zinc-500 text-[11px] font-medium italic">
              No custom templates saved yet. Customize your heads and click "Save Custom Template"!
            </div>
          )}

          {/* Industry Presets Section */}
          <div className="p-2 space-y-1">
            <div className="text-[10px] font-black uppercase text-zinc-400 tracking-wider flex items-center gap-1 px-2 py-1">
              <Sparkles className="w-3 h-3 text-blue-500" /> Industry Layout Presets
            </div>
            {BUILT_IN_CUSTOM_PRESETS.map((preset) => (
              <div
                key={preset.id}
                onClick={() => handleSelect(preset)}
                className={`p-2 rounded-xl cursor-pointer hover:bg-blue-50/80 transition-colors ${
                  activeTemplateName === preset.name ? "bg-blue-50 border border-blue-200 font-bold" : ""
                }`}
              >
                <div className="font-extrabold text-zinc-900">{preset.name}</div>
                <div className="text-[10px] text-zinc-500 font-medium line-clamp-1">{preset.description}</div>
              </div>
            ))}
          </div>

          {/* Action to Save Current as Named Template */}
          <div className="p-2 pt-1.5">
            <button
              type="button"
              onClick={handleOpenSave}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              <span>+ Save Current Layout as New Preset</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const INITIAL_SUPPLIERS: SupplierColumn[] = [
  {
    id: "sup-1",
    name: "Supplier 1",
    profitType: "%",
    profitValue: 0,
    discountType: "Flat",
    discountValue: 0,
  },
];

// Helper to safely extract total cost from item
const getItemAmount = (item: LineItem): number => {
  if (!item) return 0;
  if (item.costTypeValue !== undefined && item.costTypeValue !== null && !isNaN(item.costTypeValue)) {
    return item.costTypeValue;
  }
  if (item.rate !== undefined && item.rate !== null && !isNaN(item.rate)) {
    return item.rate;
  }
  if (item.quantity && item.rate) {
    return item.quantity * item.rate;
  }
  return 0;
};

// Helper to build initial rows ensuring standard cost heads exist
const buildInitialStandardRows = (items: LineItem[]): CostSheetRow[] => {
  const baseRows: CostSheetRow[] = STANDARD_COST_HEAD_DEFAULTS.map((def, idx) => ({
    ...def,
    id: `std-row-${idx + 1}`,
    amount: 0,
    typeValue: 0,
    description: "",
    supplierAmounts: { "sup-1": 0 },
    supplierTypeValues: { "sup-1": 0 },
  }));

  if (!items || items.length === 0) return baseRows;

  const isSingleBlank = items.length === 1 && !items[0].description && (items[0].rate === 0 || !items[0].rate);
  if (isSingleBlank) return baseRows;

  const usedCategoryKeys = new Set<string>();
  let totalProductSum = 0;
  const productDescriptions: string[] = [];

  items.forEach((item, idx) => {
    const itemDesc = (item.description || "").toLowerCase();
    const itemRemarks = item.remarks || "";
    const itemAmount = getItemAmount(item);

    const stdIndex = baseRows.findIndex((defRow) => {
      if (usedCategoryKeys.has(defRow.categoryKey)) return false;
      if (defRow.categoryKey === "product") return false;

      if (item.costCategoryKey && item.costCategoryKey === defRow.categoryKey) return true;
      if (item.costHead && item.costHead.toLowerCase() === defRow.costHead.toLowerCase()) return true;

      const headLower = defRow.costHead.toLowerCase();
      return itemDesc.includes(headLower) || headLower.includes(itemDesc);
    });

    if (stdIndex !== -1) {
      baseRows[stdIndex].amount = itemAmount;
      baseRows[stdIndex].typeValue = item.costTypeValue ?? itemAmount;
      baseRows[stdIndex].supplierAmounts = { "sup-1": itemAmount };
      baseRows[stdIndex].supplierTypeValues = { "sup-1": item.costTypeValue ?? itemAmount };
      if (itemRemarks) baseRows[stdIndex].description = itemRemarks;
      usedCategoryKeys.add(baseRows[stdIndex].categoryKey);
    } else if (item.isCustomHead && (item.costCategoryKey?.startsWith("custom-") || item.costHead)) {
      baseRows.push({
        id: item.id || `custom-row-${Date.now()}-${idx}`,
        categoryKey: item.costCategoryKey || `custom-${idx}`,
        costHead: item.costHead || item.description?.split(" (")[0] || `Cost Head ${idx + 1}`,
        description: item.remarks || "",
        placeholder: "Cost details",
        type: (item.costType as any) || "Flat",
        amount: itemAmount,
        typeValue: item.costTypeValue ?? itemAmount,
        supplierAmounts: { "sup-1": itemAmount },
        supplierTypeValues: { "sup-1": item.costTypeValue ?? itemAmount },
        isVisible: true,
        isCustomHead: true,
        isProductItem: item.isProductItem,
      });
    } else {
      totalProductSum += itemAmount;
      if (item.description && !item.description.startsWith("Product Cost")) {
        const cleanDesc = item.description.split(" (")[0].trim();
        if (cleanDesc && !productDescriptions.includes(cleanDesc)) {
          productDescriptions.push(cleanDesc);
        }
      }
    }
  });

  if (totalProductSum > 0 || productDescriptions.length > 0) {
    baseRows[0].amount = totalProductSum;
    baseRows[0].typeValue = totalProductSum;
    baseRows[0].supplierAmounts = { "sup-1": totalProductSum };
    baseRows[0].supplierTypeValues = { "sup-1": totalProductSum };
    if (productDescriptions.length > 0 && !baseRows[0].description) {
      baseRows[0].description = productDescriptions.join(", ");
    }
  }

  return baseRows;
};

export const LandedCostSheet: React.FC<LandedCostSheetProps> = ({
  items,
  onChangeItems,
  currencySymbol = "₹",
  currency = "INR",
  freightAmount,
  setFreightAmount,
  packagingAmount,
  setPackagingAmount,
  docId,
  docDate,
  businessName,
  customerName,
  projectName,
  onUpdateTotals,
}) => {
  const [activeTab, setActiveTab] = useState<"standard" | "customize">("standard");

  // Quantity and Weight Controls State
  const initialQty = Math.max(1, items && items.length > 0 ? items.reduce((sum, item) => sum + (item.quantity || 0), 0) || 100 : 100);
  const initialWeight = items && items.length > 0 ? items.reduce((sum, item) => sum + (item.grossWeight || item.netWeight || 0), 0) : 0;

  const [totalQuantity, setTotalQuantity] = useState<number>(initialQty);
  const [totalWeight, setTotalWeight] = useState<number>(initialWeight);
  const [weightUnit, setWeightUnit] = useState<"kg" | "lbs">("kg");

  // Suppliers State (Max 5)
  const [suppliers, setSuppliers] = useState<SupplierColumn[]>(INITIAL_SUPPLIERS);

  // Notification Banner State for max supplier limit
  const [showMaxNotification, setShowMaxNotification] = useState<boolean>(false);

  // Ref to prevent two-way sync feedback loop
  const skipNextParentSyncRef = React.useRef<boolean>(false);

  // Custom Sheet Template Persistence Keys
  const CUSTOM_TEMPLATE_STORAGE_KEY = "billiq_custom_cost_sheet_template";
  const SAVED_TEMPLATES_LIST_KEY = "billiq_custom_cost_sheet_templates_list";
  const ACTIVE_TEMPLATE_NAME_KEY = "billiq_active_template_name";

  const [activeTemplateName, setActiveTemplateName] = useState<string>(() => {
    try {
      return localStorage.getItem(ACTIVE_TEMPLATE_NAME_KEY) || "My Custom Layout";
    } catch {
      return "My Custom Layout";
    }
  });

  const [savedTemplatesList, setSavedTemplatesList] = useState<SavedCostSheetTemplate[]>(() => {
    try {
      const listStr = localStorage.getItem(SAVED_TEMPLATES_LIST_KEY);
      if (listStr) {
        const parsed = JSON.parse(listStr);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn("Failed loading saved templates list", e);
    }
    return [];
  });

  const [newTemplateNameInput, setNewTemplateNameInput] = useState<string>("");
  const [showSaveNameModal, setShowSaveNameModal] = useState<boolean>(false);

  const [isTemplateSaved, setIsTemplateSaved] = useState<boolean>(() => {
    try {
      return !!localStorage.getItem(CUSTOM_TEMPLATE_STORAGE_KEY);
    } catch {
      return false;
    }
  });

  const [customTemplateMessage, setCustomTemplateMessage] = useState<string | null>(null);

  // Separate State for Standard Sheet and Custom Sheet
  const [standardRows, setStandardRows] = useState<CostSheetRow[]>(() => buildInitialStandardRows(items));
  const [customRows, setCustomRows] = useState<CostSheetRow[]>(() => {
    try {
      const savedStr = localStorage.getItem(CUSTOM_TEMPLATE_STORAGE_KEY);
      if (savedStr) {
        const parsed = JSON.parse(savedStr);
        if (parsed && Array.isArray(parsed.customRows) && parsed.customRows.length > 0) {
          return parsed.customRows;
        }
      }
    } catch (e) {
      console.warn("Failed loading saved custom cost sheet template", e);
    }
    return INITIAL_CUSTOM_SHEET_ROWS;
  });

  // Helper to sanitize rows when applying a new template to match active suppliers
  const sanitizeRowsForSuppliers = (rows: CostSheetRow[]): CostSheetRow[] => {
    return rows.map(r => {
      const sAmounts: Record<string, number> = { ...(r.supplierAmounts || {}) };
      const sTypeVals: Record<string, number> = { ...(r.supplierTypeValues || {}) };

      suppliers.forEach(s => {
        if (sAmounts[s.id] === undefined) sAmounts[s.id] = s.id === suppliers[0]?.id ? (r.amount || 0) : 0;
        if (sTypeVals[s.id] === undefined) sTypeVals[s.id] = s.id === suppliers[0]?.id ? (r.typeValue ?? (r.type === "%" ? 0 : r.amount || 0)) : 0;
      });

      return {
        ...r,
        supplierAmounts: sAmounts,
        supplierTypeValues: sTypeVals,
      };
    });
  };

  // Auto-Load Saved Custom Template from LocalStorage
  const autoLoadSavedCustomTemplate = () => {
    try {
      // 1. First check if primary custom template exists in localStorage
      const savedStr = localStorage.getItem(CUSTOM_TEMPLATE_STORAGE_KEY);
      if (savedStr) {
        const parsed = JSON.parse(savedStr);
        if (parsed && Array.isArray(parsed.customRows) && parsed.customRows.length > 0) {
          setCustomRows(sanitizeRowsForSuppliers(parsed.customRows));
          setIsTemplateSaved(true);
          const loadedName = parsed.name || localStorage.getItem(ACTIVE_TEMPLATE_NAME_KEY) || "My Custom Layout";
          setActiveTemplateName(loadedName);
          setCustomTemplateMessage(`Auto-Loaded Saved Custom Template: "${loadedName}"`);
          setTimeout(() => setCustomTemplateMessage(null), 3500);
          return;
        }
      }

      // 2. Otherwise check if savedTemplatesList has any items
      const listStr = localStorage.getItem(SAVED_TEMPLATES_LIST_KEY);
      if (listStr) {
        const parsedList: SavedCostSheetTemplate[] = JSON.parse(listStr);
        if (Array.isArray(parsedList) && parsedList.length > 0) {
          const latest = parsedList[0];
          setCustomRows(sanitizeRowsForSuppliers(latest.rows));
          setIsTemplateSaved(true);
          setActiveTemplateName(latest.name);
          setCustomTemplateMessage(`Auto-Loaded Saved Template: "${latest.name}"`);
          setTimeout(() => setCustomTemplateMessage(null), 3500);
          return;
        }
      }
    } catch (e) {
      console.warn("Error auto-loading saved custom cost sheet template", e);
    }
  };

  // Switch Tab Handler with Auto-Load
  const handleSelectCustomTab = () => {
    setActiveTab("customize");
    autoLoadSavedCustomTemplate();
  };

  // Apply Selected Saved Template or Preset
  const handleApplyTemplate = (template: SavedCostSheetTemplate) => {
    try {
      const sanitized = sanitizeRowsForSuppliers(template.rows);
      setCustomRows(sanitized);
      setActiveTemplateName(template.name);
      setIsTemplateSaved(!template.isBuiltIn);
      localStorage.setItem(ACTIVE_TEMPLATE_NAME_KEY, template.name);

      if (!template.isBuiltIn) {
        const payload = {
          name: template.name,
          customRows: sanitized,
          savedAt: template.savedAt || new Date().toISOString(),
        };
        localStorage.setItem(CUSTOM_TEMPLATE_STORAGE_KEY, JSON.stringify(payload));
      }

      setCustomTemplateMessage(`Applied Custom Layout: "${template.name}"`);
      setTimeout(() => setCustomTemplateMessage(null), 3500);
    } catch (e) {
      console.error("Failed applying custom template", e);
    }
  };

  // Save Custom Template Handler
  const handleSaveCustomTemplate = (customName?: string) => {
    try {
      const templateName = (customName || newTemplateNameInput || activeTemplateName || "My Custom Layout").trim();
      const nowFormatted = new Date().toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });

      const primaryPayload = {
        name: templateName,
        customRows,
        savedAt: nowFormatted,
      };
      localStorage.setItem(CUSTOM_TEMPLATE_STORAGE_KEY, JSON.stringify(primaryPayload));

      const newTemplateObj: SavedCostSheetTemplate = {
        id: `tpl-${Date.now()}`,
        name: templateName,
        rows: customRows,
        savedAt: nowFormatted,
      };

      const updatedList = [
        newTemplateObj,
        ...savedTemplatesList.filter(t => t.name.toLowerCase() !== templateName.toLowerCase()),
      ].slice(0, 10);

      setSavedTemplatesList(updatedList);
      localStorage.setItem(SAVED_TEMPLATES_LIST_KEY, JSON.stringify(updatedList));

      setActiveTemplateName(templateName);
      localStorage.setItem(ACTIVE_TEMPLATE_NAME_KEY, templateName);
      setIsTemplateSaved(true);
      setShowSaveNameModal(false);
      setNewTemplateNameInput("");

      setCustomTemplateMessage(`Saved Custom Template: "${templateName}"! This layout will automatically load whenever you switch to Custom Sheet.`);
      setTimeout(() => setCustomTemplateMessage(null), 4000);
    } catch (e) {
      console.error("Failed to save custom template", e);
      setCustomTemplateMessage("Failed to save custom template.");
      setTimeout(() => setCustomTemplateMessage(null), 3000);
    }
  };

  const handleDeleteSavedTemplate = (templateId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const updatedList = savedTemplatesList.filter(t => t.id !== templateId);
      setSavedTemplatesList(updatedList);
      localStorage.setItem(SAVED_TEMPLATES_LIST_KEY, JSON.stringify(updatedList));

      setCustomTemplateMessage("Saved custom template removed.");
      setTimeout(() => setCustomTemplateMessage(null), 2500);
    } catch (err) {
      console.error("Failed deleting template", err);
    }
  };

  const handleResetCustomTemplate = () => {
    try {
      localStorage.removeItem(CUSTOM_TEMPLATE_STORAGE_KEY);
      localStorage.removeItem(ACTIVE_TEMPLATE_NAME_KEY);
      setCustomRows(INITIAL_CUSTOM_SHEET_ROWS);
      setActiveTemplateName("Default Custom Layout");
      setIsTemplateSaved(false);
      setCustomTemplateMessage("Reset to Default Custom Sheet Layout.");
      setTimeout(() => setCustomTemplateMessage(null), 3000);
    } catch (e) {
      console.error("Failed to reset custom template", e);
    }
  };

  // Sync incoming external items changes (e.g. from AI Bulk Line Editor) into standardRows or customRows
  useEffect(() => {
    if (!items || items.length === 0) return;

    // Check if new supplier columns are required (e.g. targetSupplierIndex or addSupplierRequested)
    let requiredSupCount = suppliers.length;
    items.forEach(item => {
      if (item.targetSupplierIndex && item.targetSupplierIndex > requiredSupCount) {
        requiredSupCount = Math.min(5, item.targetSupplierIndex);
      }
      if (item.supplierAmounts) {
        Object.keys(item.supplierAmounts).forEach(key => {
          const idx = parseInt(key, 10);
          if (!isNaN(idx) && idx > requiredSupCount) {
            requiredSupCount = Math.min(5, idx);
          }
        });
      }
    });

    if (items.some(i => i.addSupplierRequested) && requiredSupCount === suppliers.length && suppliers.length < 5) {
      requiredSupCount = suppliers.length + 1;
    }

    let activeSuppliers = [...suppliers];
    if (requiredSupCount > activeSuppliers.length) {
      for (let i = activeSuppliers.length; i < requiredSupCount; i++) {
        const newSupId = `sup-${Date.now()}-${i}`;
        const newSupName = `Supplier ${i + 1}`;
        activeSuppliers.push({
          id: newSupId,
          name: newSupName,
          profitType: activeSuppliers[0]?.profitType || "%",
          profitValue: activeSuppliers[0]?.profitValue || 0,
          discountType: activeSuppliers[0]?.discountType || "Flat",
          discountValue: activeSuppliers[0]?.discountValue || 0,
        });
      }
      setSuppliers(activeSuppliers);
    }

    const primarySupId = activeSuppliers[0]?.id || "sup-1";
    const targetRows = activeTab === "customize" ? customRows : standardRows;

    let isDifferent = items.length !== targetRows.length;
    if (!isDifferent) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const row = targetRows[i];
        if (!row) { isDifferent = true; break; }

        if (item.targetSupplierIndex || item.addSupplierRequested || item.supplierAmounts || item.supplierTypeValues) {
          isDifferent = true;
          break;
        }

        const itemAmt = getItemAmount(item);
        const rowAmt = getRowAmount(row, primarySupId);
        if (Math.abs(itemAmt - rowAmt) > 0.01) {
          isDifferent = true;
          break;
        }
      }
    }

    if (isDifferent) {
      skipNextParentSyncRef.current = true;
      if (activeTab === "customize") {
        setCustomRows(prevRows => {
          return items.map((item, idx) => {
            const existingRow = prevRows[idx] || prevRows.find(r => r.id === item.id);
            const newAmt = getItemAmount(item);
            const newTypeVal = item.costTypeValue ?? (item.costType === "%" ? 0 : newAmt);

            const targetIdx = item.targetSupplierIndex ? (item.targetSupplierIndex - 1) : 0;
            const targetSupId = activeSuppliers[targetIdx]?.id || primarySupId;

            const curAmounts = { ...(existingRow?.supplierAmounts || {}) };
            const curTypeValues = { ...(existingRow?.supplierTypeValues || {}) };

            if (item.supplierAmounts && Object.keys(item.supplierAmounts).length > 0) {
              Object.entries(item.supplierAmounts).forEach(([sKey, sVal]) => {
                let sId = sKey;
                const sNum = parseInt(sKey, 10);
                if (!isNaN(sNum) && sNum >= 1 && sNum <= activeSuppliers.length) {
                  sId = activeSuppliers[sNum - 1].id;
                } else if (sKey.startsWith("sup-")) {
                  const supNum = parseInt(sKey.replace("sup-", ""), 10);
                  if (!isNaN(supNum) && supNum >= 1 && supNum <= activeSuppliers.length) {
                    sId = activeSuppliers[supNum - 1].id;
                  }
                }
                curAmounts[sId] = sVal;
              });
            } else {
              curAmounts[targetSupId] = newAmt;
            }

            if (item.supplierTypeValues && Object.keys(item.supplierTypeValues).length > 0) {
              Object.entries(item.supplierTypeValues).forEach(([sKey, sVal]) => {
                let sId = sKey;
                const sNum = parseInt(sKey, 10);
                if (!isNaN(sNum) && sNum >= 1 && sNum <= activeSuppliers.length) {
                  sId = activeSuppliers[sNum - 1].id;
                } else if (sKey.startsWith("sup-")) {
                  const supNum = parseInt(sKey.replace("sup-", ""), 10);
                  if (!isNaN(supNum) && supNum >= 1 && supNum <= activeSuppliers.length) {
                    sId = activeSuppliers[supNum - 1].id;
                  }
                }
                curTypeValues[sId] = sVal;
              });
            } else {
              curTypeValues[targetSupId] = newTypeVal;
            }

            if (item.targetSupplierIndex && activeSuppliers[item.targetSupplierIndex - 1]) {
              const explicitSupId = activeSuppliers[item.targetSupplierIndex - 1].id;
              const typeValToUse = item.costTypeValue !== undefined ? item.costTypeValue : (item.costType === "%" ? 0 : newTypeVal);
              curAmounts[explicitSupId] = item.rate !== undefined ? item.rate : newAmt;
              curTypeValues[explicitSupId] = typeValToUse;
            }

            return {
              id: item.id || `cust-row-${idx + 1}`,
              categoryKey: item.costCategoryKey || existingRow?.categoryKey || `custom-${idx}`,
              costHead: item.costHead || existingRow?.costHead || item.description?.split(' (')[0] || `Cost Head ${idx + 1}`,
              description: item.remarks || existingRow?.description || '',
              placeholder: existingRow?.placeholder || 'Cost details',
              type: (item.costType as any) || existingRow?.type || 'Flat',
              amount: targetSupId === primarySupId ? newAmt : (existingRow?.amount ?? newAmt),
              typeValue: targetSupId === primarySupId ? newTypeVal : (existingRow?.typeValue ?? newTypeVal),
              supplierAmounts: curAmounts,
              supplierTypeValues: curTypeValues,
              isVisible: true,
            };
          });
        });
      } else {
        setStandardRows(prevRows => {
          let currentBase = prevRows.length > 0 ? [...prevRows] : buildInitialStandardRows(items);

          STANDARD_COST_HEAD_DEFAULTS.forEach((def, defIdx) => {
            const exists = currentBase.some(r => r.categoryKey === def.categoryKey);
            if (!exists) {
              currentBase.splice(defIdx, 0, {
                ...def,
                id: `std-row-${defIdx + 1}`,
                amount: 0,
                typeValue: 0,
                description: "",
                supplierAmounts: { [primarySupId]: 0 },
                supplierTypeValues: { [primarySupId]: 0 },
              });
            }
          });

          const updatedBase = currentBase.map(r => ({ ...r }));
          let totalProdSum = 0;
          const prodDescs: string[] = [];

          items.forEach((item) => {
            const itemDesc = (item.description || "").toLowerCase();
            const itemAmt = getItemAmount(item);

            const matchedRowIndex = updatedBase.findIndex((row) => {
              if (item.costCategoryKey && item.costCategoryKey === row.categoryKey) return true;
              if (item.id && item.id === row.id) return true;
              if (item.costHead && item.costHead.toLowerCase() === row.costHead.toLowerCase()) return true;

              if (row.categoryKey === "product" && (item.isProductItem || itemDesc.includes("product cost") || itemDesc.includes("base cost"))) return true;
              if (row.categoryKey === "product") return false;

              const headLower = row.costHead.toLowerCase();
              return itemDesc.includes(headLower) || headLower.includes(itemDesc);
            });

            const targetIdx = item.targetSupplierIndex ? (item.targetSupplierIndex - 1) : 0;
            const targetSupId = activeSuppliers[targetIdx]?.id || primarySupId;

            if (matchedRowIndex !== -1) {
              const row = updatedBase[matchedRowIndex];
              const newTypeVal = item.costTypeValue ?? (item.costType === "%" ? 0 : itemAmt);

              const curAmounts = { ...(row.supplierAmounts || {}) };
              const curTypeValues = { ...(row.supplierTypeValues || {}) };

              if (item.supplierAmounts && Object.keys(item.supplierAmounts).length > 0) {
                Object.entries(item.supplierAmounts).forEach(([sKey, sVal]) => {
                  let sId = sKey;
                  const sNum = parseInt(sKey, 10);
                  if (!isNaN(sNum) && sNum >= 1 && sNum <= activeSuppliers.length) {
                    sId = activeSuppliers[sNum - 1].id;
                  } else if (sKey.startsWith("sup-")) {
                    const supNum = parseInt(sKey.replace("sup-", ""), 10);
                    if (!isNaN(supNum) && supNum >= 1 && supNum <= activeSuppliers.length) {
                      sId = activeSuppliers[supNum - 1].id;
                    }
                  }
                  curAmounts[sId] = sVal;
                });
              } else {
                curAmounts[targetSupId] = itemAmt;
              }

              if (item.supplierTypeValues && Object.keys(item.supplierTypeValues).length > 0) {
                Object.entries(item.supplierTypeValues).forEach(([sKey, sVal]) => {
                  let sId = sKey;
                  const sNum = parseInt(sKey, 10);
                  if (!isNaN(sNum) && sNum >= 1 && sNum <= activeSuppliers.length) {
                    sId = activeSuppliers[sNum - 1].id;
                  } else if (sKey.startsWith("sup-")) {
                    const supNum = parseInt(sKey.replace("sup-", ""), 10);
                    if (!isNaN(supNum) && supNum >= 1 && supNum <= activeSuppliers.length) {
                      sId = activeSuppliers[supNum - 1].id;
                    }
                  }
                  curTypeValues[sId] = sVal;
                });
              } else {
                curTypeValues[targetSupId] = newTypeVal;
              }

              if (item.targetSupplierIndex && activeSuppliers[item.targetSupplierIndex - 1]) {
                const explicitSupId = activeSuppliers[item.targetSupplierIndex - 1].id;
                const typeValToUse = item.costTypeValue !== undefined ? item.costTypeValue : (item.costType === "%" ? 0 : newTypeVal);
                curAmounts[explicitSupId] = item.rate !== undefined ? item.rate : itemAmt;
                curTypeValues[explicitSupId] = typeValToUse;
              }

              updatedBase[matchedRowIndex] = {
                ...row,
                amount: targetSupId === primarySupId ? itemAmt : row.amount,
                type: (item.costType as any) || row.type,
                typeValue: targetSupId === primarySupId ? newTypeVal : row.typeValue,
                description: item.remarks || row.description,
                supplierAmounts: curAmounts,
                supplierTypeValues: curTypeValues,
              };
            } else if (item.isCustomHead || item.isProductItem) {
              const existIdx = updatedBase.findIndex(r => r.id === item.id || (item.costHead && r.costHead.toLowerCase() === item.costHead.toLowerCase()));
              if (existIdx !== -1) {
                const row = updatedBase[existIdx];
                const newTypeVal = item.costTypeValue ?? itemAmt;

                const curAmounts = { ...(row.supplierAmounts || {}) };
                const curTypeValues = { ...(row.supplierTypeValues || {}) };

                if (item.supplierAmounts && Object.keys(item.supplierAmounts).length > 0) {
                  Object.entries(item.supplierAmounts).forEach(([sKey, sVal]) => {
                    let sId = sKey;
                    const sNum = parseInt(sKey, 10);
                    if (!isNaN(sNum) && sNum >= 1 && sNum <= activeSuppliers.length) {
                      sId = activeSuppliers[sNum - 1].id;
                    } else if (sKey.startsWith("sup-")) {
                      const supNum = parseInt(sKey.replace("sup-", ""), 10);
                      if (!isNaN(supNum) && supNum >= 1 && supNum <= activeSuppliers.length) {
                        sId = activeSuppliers[supNum - 1].id;
                      }
                    }
                    curAmounts[sId] = sVal;
                  });
                } else {
                  curAmounts[targetSupId] = itemAmt;
                }

                if (item.supplierTypeValues && Object.keys(item.supplierTypeValues).length > 0) {
                  Object.entries(item.supplierTypeValues).forEach(([sKey, sVal]) => {
                    let sId = sKey;
                    const sNum = parseInt(sKey, 10);
                    if (!isNaN(sNum) && sNum >= 1 && sNum <= activeSuppliers.length) {
                      sId = activeSuppliers[sNum - 1].id;
                    } else if (sKey.startsWith("sup-")) {
                      const supNum = parseInt(sKey.replace("sup-", ""), 10);
                      if (!isNaN(supNum) && supNum >= 1 && supNum <= activeSuppliers.length) {
                        sId = activeSuppliers[supNum - 1].id;
                      }
                    }
                    curTypeValues[sId] = sVal;
                  });
                } else {
                  curTypeValues[targetSupId] = newTypeVal;
                }

                if (item.targetSupplierIndex && activeSuppliers[item.targetSupplierIndex - 1]) {
                  const explicitSupId = activeSuppliers[item.targetSupplierIndex - 1].id;
                  const typeValToUse = item.costTypeValue !== undefined ? item.costTypeValue : (item.costType === "%" ? 0 : newTypeVal);
                  curAmounts[explicitSupId] = item.rate !== undefined ? item.rate : itemAmt;
                  curTypeValues[explicitSupId] = typeValToUse;
                }

                updatedBase[existIdx] = {
                  ...row,
                  amount: targetSupId === primarySupId ? itemAmt : row.amount,
                  supplierAmounts: curAmounts,
                  supplierTypeValues: curTypeValues,
                };
              } else {
                const newTypeVal = item.costTypeValue ?? itemAmt;
                const curAmounts: Record<string, number> = { [targetSupId]: itemAmt };
                const curTypeValues: Record<string, number> = { [targetSupId]: newTypeVal };

                updatedBase.push({
                  id: item.id || `custom-row-${Date.now()}`,
                  categoryKey: item.costCategoryKey || `custom-${Date.now()}`,
                  costHead: item.costHead || item.description?.split(" (")[0] || "Custom Cost",
                  description: item.remarks || "",
                  placeholder: "Cost details",
                  type: (item.costType as any) || "Flat",
                  amount: targetSupId === primarySupId ? itemAmt : 0,
                  typeValue: targetSupId === primarySupId ? newTypeVal : 0,
                  supplierAmounts: curAmounts,
                  supplierTypeValues: curTypeValues,
                  isVisible: true,
                  isCustomHead: true,
                  isProductItem: item.isProductItem,
                });
              }
            } else {
              totalProdSum += itemAmt;
              if (item.description && !item.description.startsWith("Product Cost")) {
                const cleanDesc = item.description.split(" (")[0].trim();
                if (cleanDesc && !prodDescs.includes(cleanDesc)) prodDescs.push(cleanDesc);
              }
            }
          });

          const prodRowIdx = updatedBase.findIndex(r => r.categoryKey === "product");
          if (prodRowIdx !== -1 && totalProdSum > 0) {
            const currentAmount = updatedBase[prodRowIdx].amount || 0;
            // Only set totalProdSum on initial load if row amount is 0
            if (currentAmount === 0) {
              updatedBase[prodRowIdx] = {
                ...updatedBase[prodRowIdx],
                amount: totalProdSum,
                typeValue: totalProdSum,
                supplierAmounts: {
                  ...(updatedBase[prodRowIdx].supplierAmounts || {}),
                  [primarySupId]: totalProdSum,
                },
                supplierTypeValues: {
                  ...(updatedBase[prodRowIdx].supplierTypeValues || {}),
                  [primarySupId]: totalProdSum,
                },
                description: prodDescs.length > 0 ? prodDescs.join(", ") : updatedBase[prodRowIdx].description,
              };
            }
          }

          return updatedBase;
        });
      }
    }
  }, [items, activeTab]);

  const isCustomTab = activeTab === "customize";
  const activeRowsList = isCustomTab ? customRows : standardRows;
  const activeRows = activeRowsList.filter(r => r.isVisible !== false);

  // Helper getters for row amounts and type values for a specific supplier
  const getRowAmount = (row: CostSheetRow, supplierId: string): number => {
    if (row.supplierAmounts && row.supplierAmounts[supplierId] !== undefined) {
      return row.supplierAmounts[supplierId];
    }
    return supplierId === suppliers[0]?.id ? (row.amount || 0) : 0;
  };

  const getRowTypeValue = (row: CostSheetRow, supplierId: string): number => {
    if (row.supplierTypeValues && row.supplierTypeValues[supplierId] !== undefined) {
      return row.supplierTypeValues[supplierId];
    }
    return supplierId === suppliers[0]?.id ? (row.typeValue ?? (row.type === "Flat" ? (row.amount || 0) : 0)) : 0;
  };

  const getRowQuantity = (row: CostSheetRow, supplierId: string): number => {
    if (row.supplierQuantities && row.supplierQuantities[supplierId] !== undefined) {
      return row.supplierQuantities[supplierId];
    }
    return row.quantity ?? 1;
  };

  const getRowUnitRate = (row: CostSheetRow, supplierId: string): number => {
    if (row.supplierUnitRates && row.supplierUnitRates[supplierId] !== undefined) {
      return row.supplierUnitRates[supplierId];
    }
    return row.unitRate ?? (row.supplierAmounts?.[supplierId] ?? row.amount ?? 0);
  };

  const updateRowProductItemQtyRate = (
    rowId: string,
    supplierId: string,
    qty: number,
    rate: number
  ) => {
    const calculatedAmt = Math.round((qty * rate) * 100) / 100;

    const updater = (prevRows: CostSheetRow[]) => prevRows.map(r => {
      if (r.id !== rowId) return r;

      const newQuantities = { ...(r.supplierQuantities || {}), [supplierId]: qty };
      const newUnitRates = { ...(r.supplierUnitRates || {}), [supplierId]: rate };
      const newAmounts = { ...(r.supplierAmounts || {}), [supplierId]: calculatedAmt };
      const newTypeValues = { ...(r.supplierTypeValues || {}), [supplierId]: calculatedAmt };

      const isPrimary = supplierId === suppliers[0]?.id;

      return {
        ...r,
        quantity: isPrimary ? qty : r.quantity,
        unitRate: isPrimary ? rate : r.unitRate,
        amount: isPrimary ? calculatedAmt : r.amount,
        typeValue: isPrimary ? calculatedAmt : r.typeValue,
        supplierQuantities: newQuantities,
        supplierUnitRates: newUnitRates,
        supplierAmounts: newAmounts,
        supplierTypeValues: newTypeValues,
      };
    });

    if (isCustomTab) setCustomRows(updater);
    else setStandardRows(updater);
  };

  const addProductItemRow = () => {
    const initSupAmounts: Record<string, number> = {};
    const initSupTypeValues: Record<string, number> = {};
    const initSupQuantities: Record<string, number> = {};
    const initSupUnitRates: Record<string, number> = {};

    suppliers.forEach(s => {
      initSupAmounts[s.id] = 0;
      initSupTypeValues[s.id] = 0;
      initSupQuantities[s.id] = 1;
      initSupUnitRates[s.id] = 0;
    });

    const newRowId = `prod-item-${Date.now()}`;
    const newRow: CostSheetRow = {
      id: newRowId,
      categoryKey: "product",
      costHead: `Product Item ${activeRows.filter(r => r.isProductItem).length + 1}`,
      badgeText: "ITEM",
      description: "",
      placeholder: "Item description, spec, or SKU",
      type: "Flat",
      typeValue: 0,
      amount: 0,
      quantity: 1,
      unitRate: 0,
      unit: "Pcs",
      isVisible: true,
      isCustomHead: true,
      isProductItem: true,
      supplierAmounts: initSupAmounts,
      supplierTypeValues: initSupTypeValues,
      supplierQuantities: initSupQuantities,
      supplierUnitRates: initSupUnitRates,
    };

    if (isCustomTab) {
      setCustomRows(prev => [...prev, newRow]);
    } else {
      setStandardRows(prev => {
        const lastProductIdx = prev.reduce((acc, r, idx) => (r.categoryKey === "product" || r.isProductItem ? idx : acc), -1);
        if (lastProductIdx !== -1) {
          const next = [...prev];
          next.splice(lastProductIdx + 1, 0, newRow);
          return next;
        }
        return [newRow, ...prev];
      });
    }
  };

  // Supplier Add Handler (Max 5 enforcement) - Defaults new supplier cost values to 0
  const handleAddSupplier = () => {
    if (suppliers.length >= 5) {
      setShowMaxNotification(true);
      return;
    }

    const newSupId = `sup-${Date.now()}`;
    const newSupName = `Supplier ${suppliers.length + 1}`;

    const initializeNewSupplierData = (rows: CostSheetRow[]) => rows.map(r => ({
      ...r,
      supplierAmounts: {
        ...(r.supplierAmounts || {}),
        [newSupId]: 0,
      },
      supplierTypeValues: {
        ...(r.supplierTypeValues || {}),
        [newSupId]: 0,
      }
    }));

    setStandardRows(initializeNewSupplierData);
    setCustomRows(initializeNewSupplierData);

    const newSupplier: SupplierColumn = {
      id: newSupId,
      name: newSupName,
      profitType: suppliers[0]?.profitType || "%",
      profitValue: suppliers[0]?.profitValue || 0,
      discountType: suppliers[0]?.discountType || "Flat",
      discountValue: suppliers[0]?.discountValue || 0,
    };

    setSuppliers(prev => [...prev, newSupplier]);
  };

  // Supplier Remove Handler
  const handleRemoveSupplier = (supplierId: string) => {
    if (suppliers.length <= 1) return;
    setSuppliers(prev => prev.filter(s => s.id !== supplierId));
    setShowMaxNotification(false);
  };

  // Update Supplier properties
  const updateSupplier = (supplierId: string, updates: Partial<SupplierColumn>) => {
    setSuppliers(prev => prev.map(s => s.id === supplierId ? { ...s, ...updates } : s));
  };

  // Update calculation basis for a specific row
  const updateRowType = (rowId: string, newType: "Flat" | "%" | "Per Unit" | "By Weight") => {
    const updater = (prevRows: CostSheetRow[]) => prevRows.map(r => {
      if (r.id !== rowId) return r;

      const newSupplierAmounts: Record<string, number> = {};

      suppliers.forEach(s => {
        const typeVal = getRowTypeValue(r, s.id);
        let computedAmt = getRowAmount(r, s.id);

        const prodRow = prevRows.find((item, idx) => item.categoryKey === "product" || (isCustomTab && idx === 0)) || prevRows[0];
        const prodRowAmt = getRowAmount(prodRow, s.id);
        const childItemsSum = prevRows.filter(item => item.isProductItem).reduce((acc, item) => acc + getRowAmount(item, s.id), 0);
        const prodCost = prodRowAmt > 0 ? prodRowAmt : childItemsSum;

        if (newType === "%") {
          computedAmt = Math.round(((prodCost * typeVal) / 100) * 100) / 100;
        } else if (newType === "Per Unit") {
          computedAmt = Math.round((typeVal * totalQuantity) * 100) / 100;
        } else if (newType === "By Weight") {
          computedAmt = Math.round((typeVal * totalWeight) * 100) / 100;
        } else {
          computedAmt = typeVal;
        }
        newSupplierAmounts[s.id] = computedAmt;
      });

      const primarySupId = suppliers[0]?.id || "sup-1";

      return {
        ...r,
        type: newType,
        supplierAmounts: newSupplierAmounts,
        amount: newSupplierAmounts[primarySupId] ?? r.amount,
      };
    });

    if (isCustomTab) setCustomRows(updater);
    else setStandardRows(updater);
  };

  // Update cell amount or typeValue for a specific row & supplier
  const updateRowSupplierAmount = (rowId: string, supplierId: string, amount: number) => {
    const updater = (prevRows: CostSheetRow[]) => prevRows.map(r => {
      if (r.id !== rowId) return r;
      const newSupplierAmounts = { ...(r.supplierAmounts || {}), [supplierId]: amount };
      const newSupplierTypeValues = { ...(r.supplierTypeValues || {}), [supplierId]: amount };
      const isPrimary = supplierId === suppliers[0]?.id;
      return {
        ...r,
        amount: isPrimary ? amount : r.amount,
        typeValue: isPrimary ? amount : r.typeValue,
        supplierAmounts: newSupplierAmounts,
        supplierTypeValues: newSupplierTypeValues,
      };
    });

    if (isCustomTab) setCustomRows(updater);
    else setStandardRows(updater);
  };

  const updateRowSupplierTypeValue = (rowId: string, supplierId: string, typeVal: number) => {
    const updater = (prevRows: CostSheetRow[]) => prevRows.map(r => {
      if (r.id !== rowId) return r;
      const newSupplierTypeValues = { ...(r.supplierTypeValues || {}), [supplierId]: typeVal };
      const isPrimary = supplierId === suppliers[0]?.id;

      let computedAmt = r.amount;
      const prodRow = prevRows.find((item, idx) => item.categoryKey === "product" || (isCustomTab && idx === 0)) || prevRows[0];
      const prodRowAmt = getRowAmount(prodRow, supplierId);
      const childItemsSum = prevRows.filter(item => item.isProductItem).reduce((acc, item) => acc + getRowAmount(item, supplierId), 0);
      const prodCost = prodRowAmt > 0 ? prodRowAmt : childItemsSum;

      if (r.type === "%") {
        computedAmt = Math.round(((prodCost * typeVal) / 100) * 100) / 100;
      } else if (r.type === "Per Unit") {
        computedAmt = Math.round((typeVal * totalQuantity) * 100) / 100;
      } else if (r.type === "By Weight") {
        computedAmt = Math.round((typeVal * totalWeight) * 100) / 100;
      } else {
        computedAmt = typeVal;
      }

      const newSupplierAmounts = { ...(r.supplierAmounts || {}), [supplierId]: computedAmt };

      return {
        ...r,
        typeValue: isPrimary ? typeVal : r.typeValue,
        amount: isPrimary ? computedAmt : r.amount,
        supplierTypeValues: newSupplierTypeValues,
        supplierAmounts: newSupplierAmounts,
      };
    });

    if (isCustomTab) setCustomRows(updater);
    else setStandardRows(updater);
  };

  // Compute metrics for all suppliers
  const supplierCalculations = suppliers.map(sup => {
    const prodRow = activeRows.find((r, idx) => r.categoryKey === "product" || (isCustomTab && idx === 0)) || activeRows[0];
    const prodRowAmt = prodRow ? getRowAmount(prodRow, sup.id) : 0;
    const childItemsSum = activeRows.filter(r => r.isProductItem).reduce((acc, r) => acc + getRowAmount(r, sup.id), 0);
    const prodCostTotal = prodRowAmt > 0 ? prodRowAmt : childItemsSum;

    const labourCostTotal = activeRows
      .filter(r => r.categoryKey === "labour")
      .reduce((acc, r) => acc + getRowAmount(r, sup.id), 0);

    const directMaterialLaborTotal = prodCostTotal + labourCostTotal;

    // Computed rows for percentage / per unit / by weight calculations
    const computedRows = activeRows.map((r) => {
      if (r.type === "%") {
        const pct = getRowTypeValue(r, sup.id);
        const computedAmt = Math.round(((prodCostTotal * pct) / 100) * 100) / 100;
        return { ...r, calculatedAmt: computedAmt };
      }
      if (r.type === "Per Unit") {
        const ratePerUnit = getRowTypeValue(r, sup.id);
        const computedAmt = Math.round((ratePerUnit * (totalQuantity || 1)) * 100) / 100;
        return { ...r, calculatedAmt: computedAmt };
      }
      if (r.type === "By Weight") {
        const ratePerWeight = getRowTypeValue(r, sup.id);
        const computedAmt = Math.round((ratePerWeight * (totalWeight || 0)) * 100) / 100;
        return { ...r, calculatedAmt: computedAmt };
      }
      return { ...r, calculatedAmt: getRowAmount(r, sup.id) };
    });

    const logisticsTotal = computedRows
      .filter((r, idx) => !(r.categoryKey === "product" || r.isProductItem || (isCustomTab && idx === 0)) && r.categoryKey !== "labour")
      .reduce((acc, r) => acc + r.calculatedAmt, 0);

    const totalLandedCost = prodCostTotal + labourCostTotal + logisticsTotal;

    const baseForPct = prodCostTotal > 0 ? prodCostTotal : totalLandedCost;

    const profitAmount = sup.profitType === "%" 
      ? (totalLandedCost * (Number(sup.profitValue) || 0)) / 100 
      : (Number(sup.profitValue) || 0);

    const discountAmount = sup.discountType === "%" 
      ? (baseForPct * (Number(sup.discountValue) || 0)) / 100 
      : (Number(sup.discountValue) || 0);

    const finalSellingPrice = Math.max(0, totalLandedCost + profitAmount - discountAmount);

    return {
      supplier: sup,
      prodCostTotal,
      labourCostTotal,
      directMaterialLaborTotal,
      logisticsTotal,
      totalLandedCost,
      profitAmount,
      discountAmount,
      finalSellingPrice,
      computedRows,
    };
  });

  // Identify Best / Lowest Cost Supplier
  const pricesList = supplierCalculations.map(c => c.finalSellingPrice).filter(p => p > 0);
  const minPrice = pricesList.length > 0 ? Math.min(...pricesList) : 0;

  const maxPrice = pricesList.length > 0 ? Math.max(...pricesList) : 0;
  const maxSavings = maxPrice - minPrice;

  const supplierSummaries: CostSheetSupplierSummary[] = supplierCalculations.map(c => ({
    id: c.supplier.id,
    name: c.supplier.name,
    productCostTotal: c.prodCostTotal,
    logisticsTotal: c.logisticsTotal,
    totalLandedCost: c.totalLandedCost,
    profitType: c.supplier.profitType,
    profitValue: c.supplier.profitValue,
    profitAmount: c.profitAmount,
    discountType: c.supplier.discountType,
    discountValue: c.supplier.discountValue,
    discountAmount: c.discountAmount,
    finalSellingPrice: c.finalSellingPrice,
    isLowestCost: suppliers.length > 1 && minPrice > 0 && c.finalSellingPrice === minPrice,
  }));

  const bestSupplier = supplierSummaries.find(s => s.isLowestCost);

  // Row summaries for parent & PDF export
  const rowSummaries: CostSheetRowSummary[] = activeRows.map(r => {
    const sAmounts: Record<string, number> = {};
    const sTypeValues: Record<string, number> = {};

    suppliers.forEach(s => {
      sAmounts[s.id] = getRowAmount(r, s.id);
      sTypeValues[s.id] = getRowTypeValue(r, s.id);
    });

    const primarySupId = suppliers[0]?.id || "sup-1";
    const primaryTypeVal = getRowTypeValue(r, primarySupId);

    let basisDetail = "Flat";
    if (r.type === "%") {
      basisDetail = primaryTypeVal ? `${primaryTypeVal}% on Base` : "% on Base";
    } else if (r.type === "Per Unit") {
      basisDetail = primaryTypeVal ? `${currencySymbol}${primaryTypeVal.toFixed(2)} / unit` : "Per Unit";
    } else if (r.type === "By Weight") {
      basisDetail = primaryTypeVal ? `${currencySymbol}${primaryTypeVal.toFixed(2)} / ${weightUnit}` : `By Weight`;
    } else {
      basisDetail = "Flat";
    }

    return {
      id: r.id,
      costHead: r.costHead,
      description: r.description || "",
      type: r.type,
      typeValue: primaryTypeVal,
      basisDetail,
      supplierAmounts: sAmounts,
      supplierTypeValues: sTypeValues,
    };
  });

  // Sync to Parent
  useEffect(() => {
    const primaryCalc = supplierCalculations[0];
    if (primaryCalc && onUpdateTotals) {
      onUpdateTotals({
        totalProductCost: primaryCalc.prodCostTotal,
        totalLogistics: primaryCalc.logisticsTotal,
        totalLandedCost: primaryCalc.totalLandedCost,
        profitAmount: primaryCalc.profitAmount,
        discountAmount: primaryCalc.discountAmount,
        finalSellingPrice: primaryCalc.finalSellingPrice,
        profitType: primaryCalc.supplier.profitType,
        profitValue: primaryCalc.supplier.profitValue,
        discountType: primaryCalc.supplier.discountType,
        discountValue: primaryCalc.supplier.discountValue,
        directMaterialLaborTotal: primaryCalc.directMaterialLaborTotal,
        suppliersData: supplierSummaries,
        rowsSummary: rowSummaries,
        totalQuantity,
        totalWeight,
        weightUnit,
      });
    }

    if (primaryCalc) {
      const updatedLineItems: LineItem[] = primaryCalc.computedRows.map((row, idx) => {
        const isProduct = row.categoryKey === "product" || (isCustomTab && idx === 0);
        const isLabour = row.categoryKey === "labour";
        const amt = row.calculatedAmt;

        return {
          id: row.id,
          description: `${row.costHead}${row.description ? ` (${row.description})` : ''}`,
          hsn: "",
          taxRate: 0,
          remarks: row.description || row.costHead,
          quantity: 1,
          rate: amt,
          unit: "NOS",
          rawMaterialCost: isProduct ? amt : 0,
          laborCost: isLabour ? amt : 0,
          overheadCost: (!isProduct && !isLabour) ? amt : 0,
          costHead: row.costHead,
          costType: row.type,
          costTypeValue: row.typeValue ?? (row.type === "%" ? 0 : amt),
          costCategoryKey: row.categoryKey,
          supplierAmounts: row.supplierAmounts,
          supplierTypeValues: row.supplierTypeValues,
        };
      });

      if (skipNextParentSyncRef.current) {
        skipNextParentSyncRef.current = false;
      } else {
        onChangeItems(updatedLineItems);
      }

      const freightRow = primaryCalc.computedRows.find(r => r.categoryKey === "freight");
      if (freightRow && setFreightAmount) {
        setFreightAmount(freightRow.calculatedAmt || 0);
      }

      const pkgRow = primaryCalc.computedRows.find(r => r.categoryKey === "packaging");
      if (pkgRow && setPackagingAmount) {
        setPackagingAmount(pkgRow.calculatedAmt || 0);
      }
    }
  }, [standardRows, customRows, activeTab, suppliers, isCustomTab]);

  // General Row Handlers
  const updateStandardRow = (id: string, updates: Partial<CostSheetRow>) => {
    setStandardRows(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const removeStandardRow = (id: string) => {
    setStandardRows(prev => {
      if (prev.length <= 1) return prev;
      return prev.filter(r => r.id !== id);
    });
  };

  const addStandardCostRow = () => {
    const newRowId = `std-custom-${Date.now()}`;
    const initSupAmounts: Record<string, number> = {};
    const initSupTypeValues: Record<string, number> = {};
    suppliers.forEach(s => {
      initSupAmounts[s.id] = 0;
      initSupTypeValues[s.id] = 0;
    });

    const newRow: CostSheetRow = {
      id: newRowId,
      categoryKey: `custom-${Date.now()}`,
      costHead: `Cost Head ${standardRows.length + 1}`,
      description: "",
      placeholder: "Description (cost details)",
      type: "Flat",
      typeValue: 0,
      amount: 0,
      isVisible: true,
      isCustomHead: true,
      supplierAmounts: initSupAmounts,
      supplierTypeValues: initSupTypeValues,
    };
    setStandardRows(prev => [...prev, newRow]);
  };

  const addStandardSubRow = (categoryKey: string, parentHead: string, placeholder: string) => {
    const newRowId = `std-sub-${Date.now()}`;
    const initSupAmounts: Record<string, number> = {};
    const initSupTypeValues: Record<string, number> = {};
    suppliers.forEach(s => {
      initSupAmounts[s.id] = 0;
      initSupTypeValues[s.id] = 0;
    });

    const newRow: CostSheetRow = {
      id: newRowId,
      categoryKey,
      costHead: parentHead,
      description: "",
      placeholder,
      type: "Flat",
      typeValue: 0,
      amount: 0,
      isVisible: true,
      isCustomHead: true,
      supplierAmounts: initSupAmounts,
      supplierTypeValues: initSupTypeValues,
    };

    setStandardRows(prev => {
      const lastIndex = prev.reduce((acc, r, idx) => (r.categoryKey === categoryKey ? idx : acc), -1);
      if (lastIndex !== -1) {
        const next = [...prev];
        next.splice(lastIndex + 1, 0, newRow);
        return next;
      }
      return [...prev, newRow];
    });
  };

  const updateCustomRow = (id: string, updates: Partial<CostSheetRow>) => {
    setCustomRows(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const removeCustomRow = (id: string) => {
    setCustomRows(prev => {
      if (prev.length <= 1) return prev;
      return prev.filter(r => r.id !== id);
    });
  };

  const duplicateCustomRow = (id: string) => {
    setCustomRows(prev => {
      const idx = prev.findIndex(r => r.id === id);
      if (idx === -1) return prev;
      const target = prev[idx];
      const newRow: CostSheetRow = {
        ...target,
        id: `cust-row-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        supplierAmounts: { ...(target.supplierAmounts || {}) },
        supplierTypeValues: { ...(target.supplierTypeValues || {}) },
      };
      const updated = [...prev];
      updated.splice(idx + 1, 0, newRow);
      return updated;
    });
  };

  const addCustomRow = () => {
    const initSupAmounts: Record<string, number> = {};
    const initSupTypeValues: Record<string, number> = {};
    suppliers.forEach(s => {
      initSupAmounts[s.id] = 0;
      initSupTypeValues[s.id] = 0;
    });

    setCustomRows(prev => [
      ...prev,
      {
        id: `cust-row-${Date.now()}`,
        categoryKey: `custom-${Date.now()}`,
        costHead: `Cost Head ${prev.length + 1}`,
        description: "",
        placeholder: "Description (cost details)",
        type: "Flat",
        typeValue: 0,
        amount: 0,
        supplierAmounts: initSupAmounts,
        supplierTypeValues: initSupTypeValues,
        isVisible: true,
      }
    ]);
  };

  const handleResetToDefault = () => {
    setStandardRows(STANDARD_COST_HEAD_DEFAULTS.map((def, idx) => ({
      ...def,
      id: `std-row-${idx + 1}`,
      amount: 0,
      typeValue: 0,
      description: "",
      supplierAmounts: { "sup-1": 0 },
      supplierTypeValues: { "sup-1": 0 },
    })));
    setCustomRows(INITIAL_CUSTOM_SHEET_ROWS.map(r => ({
      ...r,
      amount: 0,
      typeValue: 0,
      supplierAmounts: { "sup-1": 0 },
      supplierTypeValues: { "sup-1": 0 },
    })));
    setSuppliers(INITIAL_SUPPLIERS);
    setShowMaxNotification(false);
  };

  const handleExportExcel = () => {
    exportLandedCostSheetToExcel({
      docId: docId || "CS-1001",
      docDate: docDate || new Date().toISOString().split("T")[0],
      businessName: businessName || "Company",
      customerName: customerName || "-",
      projectName: projectName || "-",
      currencySymbol,
      currency: currency || "INR",
      totalQuantity,
      totalWeight,
      weightUnit,
      suppliers,
      rows: activeRowsList,
      activeTab,
    });
  };

  return (
    <div className="w-full space-y-6">
      {/* Top Header Bar with Supplier Comparison Trigger */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4.5 rounded-2xl border border-zinc-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-zinc-900 tracking-tight flex items-center gap-2">
              Landed Cost Analysis Sheet
              {suppliers.length > 1 && (
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider rounded-md border border-emerald-200">
                  {suppliers.length} Suppliers Side-by-Side
                </span>
              )}
            </h2>
            <p className="text-xs text-zinc-500 font-medium">
              Compare supplier quotes, manufacturing costs, logistics charges, and target profit margins
            </p>
          </div>
        </div>

        {/* Action Controls: Add Supplier & Tab Switcher */}
        <div className="flex flex-wrap items-center gap-3 self-start md:self-auto">
          {/* Add Supplier Button (Max 5) */}
          <button
            type="button"
            onClick={handleAddSupplier}
            disabled={suppliers.length >= 5}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
              suppliers.length >= 5
                ? "bg-zinc-100 text-zinc-400 border border-zinc-200 cursor-not-allowed opacity-75"
                : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-blue-500/10"
            }`}
            title={suppliers.length >= 5 ? "Maximum 5 suppliers allowed for comparison" : "Add supplier for side-by-side cost comparison"}
          >
            <Users className="w-3.5 h-3.5" />
            <Plus className="w-3.5 h-3.5" />
            <span>Add Supplier ({suppliers.length}/5)</span>
          </button>

          {/* Tab Switcher */}
          <div className="flex items-center bg-zinc-100/90 p-1 rounded-xl border border-zinc-200/60">
            <button
              type="button"
              onClick={() => setActiveTab("standard")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "standard"
                  ? "bg-white text-zinc-900 shadow-xs"
                  : "text-zinc-500 hover:text-zinc-800"
              }`}
            >
              Standard Sheet
            </button>
            <button
              type="button"
              onClick={handleSelectCustomTab}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === "customize"
                  ? "bg-white text-zinc-900 shadow-xs"
                  : "text-zinc-500 hover:text-zinc-800"
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Custom Sheet
            </button>
          </div>
        </div>
      </div>

      {/* Persistent Active Template Indicator Banner for Custom Sheet */}
      {isCustomTab && (
        <div className="bg-gradient-to-r from-emerald-50/90 via-teal-50/60 to-emerald-50/90 border border-emerald-200/90 p-3.5 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-2xs animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-600 text-white rounded-xl shadow-xs shrink-0">
              <CheckCircle2 className="w-4.5 h-4.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800">ACTIVE CUSTOM TEMPLATE</span>
                <span className="px-2 py-0.5 bg-emerald-600 text-white text-[9px] font-black uppercase rounded-md shadow-xs">
                  {isTemplateSaved ? "Saved & Persistent" : "Active Layout"}
                </span>
              </div>
              <h4 className="text-xs font-extrabold text-emerald-950 flex items-center gap-1.5 mt-0.5">
                Active Template: <span className="text-emerald-900 font-black underline underline-offset-2 decoration-emerald-400">{activeTemplateName}</span>
              </h4>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <TemplateLoadDropdownMenu
              savedTemplatesList={savedTemplatesList}
              activeTemplateName={activeTemplateName}
              onApplyTemplate={handleApplyTemplate}
              onDeleteTemplate={handleDeleteSavedTemplate}
              onOpenSaveModal={() => setShowSaveNameModal(true)}
              dropDirection="down"
              buttonClassName="px-3.5 py-1.5 bg-white hover:bg-emerald-100/80 text-emerald-900 rounded-xl text-xs font-extrabold border border-emerald-300 shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
            />

            <button
              type="button"
              onClick={() => setShowSaveNameModal(true)}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Template</span>
            </button>
          </div>
        </div>
      )}

      {/* Max Suppliers Alert Banner */}
      {showMaxNotification && (
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between text-amber-900 text-xs font-semibold animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Maximum Limit Reached:</strong> You can compare up to 5 suppliers side-by-side in a single Landed Cost Sheet.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowMaxNotification(false)}
            className="p-1 text-amber-600 hover:text-amber-900 rounded-lg hover:bg-amber-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Multi-Supplier Best Value Callout Banner */}
      {suppliers.length > 1 && bestSupplier && (
        <div className="p-4 bg-gradient-to-r from-emerald-900 via-zinc-900 to-zinc-900 text-white rounded-2xl border border-emerald-500/30 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30 shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">BEST VALUE / LOWEST OFFER</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                  Save {currencySymbol}{maxSavings.toFixed(2)}
                </span>
              </div>
              <h3 className="text-sm font-extrabold text-white mt-0.5">
                {bestSupplier.name} offers the lowest final quoted price at {currencySymbol}{bestSupplier.finalSellingPrice.toFixed(2)}
              </h3>
            </div>
          </div>

          <div className="text-right text-xs text-zinc-300 font-medium">
            <span className="text-[10px] text-zinc-400 uppercase font-bold block">Comparison Summary</span>
            {suppliers.length} active quotes evaluated
          </div>
        </div>
      )}

      {/* SUMMARY & CALCULATION CARDS BLOCK (1 Supplier View) */}
      {suppliers.length === 1 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Direct Material & Labor */}
          <div className="bg-white p-4 rounded-2xl border border-zinc-200/80 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-zinc-500 mb-2">
              <span className="text-[10px] font-black uppercase tracking-wider">Direct Material & Labor</span>
              <Layers className="w-4 h-4 text-blue-500" />
            </div>
            <div>
              <div className="text-xl font-extrabold font-sans text-zinc-900 tracking-tight">
                {currencySymbol}{supplierCalculations[0]?.directMaterialLaborTotal.toFixed(2)}
              </div>
              <p className="text-[10px] text-zinc-400 font-medium mt-0.5">Product + Labour Charges</p>
            </div>
          </div>

          {/* Card 2: Overheads & Logistics */}
          <div className="bg-white p-4 rounded-2xl border border-zinc-200/80 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-zinc-500 mb-2">
              <span className="text-[10px] font-black uppercase tracking-wider">Overheads & Logistics</span>
              <Tag className="w-4 h-4 text-amber-500" />
            </div>
            <div>
              <div className="text-xl font-extrabold font-sans text-zinc-900 tracking-tight">
                {currencySymbol}{supplierCalculations[0]?.logisticsTotal.toFixed(2)}
              </div>
              <p className="text-[10px] text-zinc-400 font-medium mt-0.5">Freight, Duties, Packaging, etc.</p>
            </div>
          </div>

          {/* Card 3: Total Landed Cost */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 p-4 rounded-2xl border border-blue-100 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-blue-700 mb-2">
              <span className="text-[10px] font-black uppercase tracking-wider">Total Landed Cost</span>
              <Calculator className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-extrabold font-sans text-blue-900 tracking-tight">
                {currencySymbol}{supplierCalculations[0]?.totalLandedCost.toFixed(2)}
              </div>
              <p className="text-[10px] text-blue-600 font-bold mt-0.5">Base Manufacturing / Export Subtotal</p>
            </div>
          </div>

          {/* Card 4: Final Quoted Selling Price */}
          <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 text-white p-4 rounded-2xl border border-zinc-800 shadow-md flex flex-col justify-between">
            <div className="flex items-center justify-between text-zinc-400 mb-2">
              <span className="text-[10px] font-black uppercase tracking-wider">Final Quoted Selling Price</span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <div className="text-2xl font-extrabold font-sans text-emerald-400 tracking-tight">
                {currencySymbol}{supplierCalculations[0]?.finalSellingPrice.toFixed(2)}
              </div>
              <p className="text-[10px] text-zinc-400 font-medium mt-0.5">
                Landed ({currencySymbol}{supplierCalculations[0]?.totalLandedCost.toFixed(0)}) + Margin - Discount
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Cost Basis Inputs Card (Quantity & Weight Controls) */}
      <div className="bg-gradient-to-r from-blue-50/90 via-indigo-50/50 to-white p-4 rounded-2xl border border-blue-100 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-xs shrink-0">
            <Package className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-black text-zinc-900 tracking-tight uppercase flex items-center gap-2">
              Cost Basis Calculation Parameters
            </h3>
            <p className="text-[11px] text-zinc-500 font-medium">
              Product Quantity and Weight drive automatic 'Per Unit' and 'By Weight' cost head calculations
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3.5">
          {/* Total Quantity */}
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-zinc-200 shadow-2xs">
            <span className="text-[11px] font-extrabold text-zinc-600">Total Quantity:</span>
            <input
              type="number"
              min="1"
              value={totalQuantity || ""}
              onChange={(e) => setTotalQuantity(Math.max(1, parseFloat(e.target.value) || 0))}
              className="w-20 font-extrabold text-xs text-zinc-900 focus:outline-none text-right bg-transparent border-b border-zinc-200 focus:border-blue-500 px-1 py-0.5"
              placeholder="100"
            />
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wide">Pcs / Units</span>
          </div>

          {/* Total Weight */}
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-zinc-200 shadow-2xs">
            <div className="flex items-center gap-1">
              <Scale className="w-3.5 h-3.5 text-zinc-400" />
              <span className="text-[11px] font-extrabold text-zinc-600">Total Weight:</span>
            </div>
            <input
              type="number"
              min="0"
              step="any"
              value={totalWeight === 0 ? "" : totalWeight}
              onChange={(e) => setTotalWeight(Math.max(0, parseFloat(e.target.value) || 0))}
              className="w-20 font-extrabold text-xs text-zinc-900 focus:outline-none text-right bg-transparent border-b border-zinc-200 focus:border-blue-500 px-1 py-0.5"
              placeholder="500"
            />
            <select
              value={weightUnit}
              onChange={(e) => setWeightUnit(e.target.value as "kg" | "lbs")}
              className="font-extrabold text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-1.5 py-0.5 focus:outline-none cursor-pointer"
            >
              <option value="kg">kg</option>
              <option value="lbs">lbs</option>
            </select>
          </div>
        </div>
      </div>

      {/* MAIN TABLE CONTAINER (Standard or Custom View) */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-sm overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse min-w-[700px]">
          {/* Table Header */}
          <thead>
            <tr className="bg-zinc-50/80 border-b border-zinc-200 text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">
              <th className="py-3 px-3 text-center w-10">#</th>
              <th className="py-3 px-3 min-w-[170px]">COST HEAD</th>
              <th className="py-3 px-3 min-w-[180px]">DESCRIPTION (COST DETAILS)</th>
              <th className="py-3 px-3 min-w-[140px]">CALCULATION BASIS</th>
              
              {/* Supplier Header Columns */}
              {suppliers.map((sup) => {
                const isBest = supplierSummaries.find(s => s.id === sup.id)?.isLowestCost;

                return (
                  <th
                    key={sup.id}
                    className={`py-3 px-3 min-w-[160px] text-right border-l border-zinc-200/60 ${
                      isBest ? "bg-emerald-50/80 text-emerald-900" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        <input
                          type="text"
                          value={sup.name}
                          onChange={(e) => updateSupplier(sup.id, { name: e.target.value })}
                          className={`w-full bg-transparent font-extrabold uppercase text-[11px] focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-500 rounded px-1 text-right ${
                            isBest ? "text-emerald-900" : "text-zinc-900"
                          }`}
                          placeholder="Supplier Name"
                        />
                      </div>

                      {suppliers.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveSupplier(sup.id)}
                          className="p-1 text-zinc-400 hover:text-red-500 rounded hover:bg-red-50 transition-colors cursor-pointer"
                          title="Remove supplier"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {isBest && suppliers.length > 1 && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-600 text-white text-[9px] font-black uppercase tracking-wider">
                        <Award className="w-3 h-3" /> BEST PRICE
                      </span>
                    )}
                  </th>
                );
              })}

              <th className="py-3 px-3 text-center min-w-[70px]">ACTION</th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-zinc-100">
            {(isCustomTab ? customRows : standardRows)
              .filter(r => r.isVisible !== false)
              .map((row, index) => {
                const isFirstRow = index === 0;

                return (
                  <tr key={row.id} className={`transition-all duration-300 group ${
                    row.isAiEdited 
                      ? "bg-violet-50/60 border-l-4 border-l-violet-600 font-bold" 
                      : "hover:bg-zinc-50/50"
                  }`}>
                    {/* Index Column */}
                    <td className="py-3 px-3 text-center text-xs font-bold text-zinc-400 font-sans">
                      {row.isAiEdited ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-black text-[10px] rounded-md shadow-xs animate-pulse">
                          #{index + 1}
                        </span>
                      ) : (
                        index + 1
                      )}
                    </td>

                    {/* Cost Head Column */}
                    <td className="py-3 px-3 font-semibold text-zinc-900">
                      {row.isProductItem ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              value={row.costHead}
                              onChange={(e) => {
                                if (isCustomTab) updateCustomRow(row.id, { costHead: e.target.value });
                                else updateStandardRow(row.id, { costHead: e.target.value });
                              }}
                              placeholder="Item Name (e.g. Product A, Product B)"
                              className="w-full bg-blue-50/50 border border-blue-200 rounded-lg px-2 py-1 text-xs font-bold text-zinc-900 focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-500"
                            />
                            {row.isAiEdited ? (
                              <span className="px-1.5 py-0.5 bg-violet-600 text-white text-[9px] font-black uppercase rounded shrink-0 flex items-center gap-1 animate-in fade-in">
                                <Wand2 className="w-2.5 h-2.5 text-yellow-300" /> AI EDITED
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 text-[9px] font-black uppercase rounded shrink-0">
                                ITEM
                              </span>
                            )}
                          </div>
                        </div>
                      ) : isCustomTab ? (
                        <div className="space-y-1">
                          <input
                            type="text"
                            value={row.costHead}
                            onChange={(e) => updateCustomRow(row.id, { costHead: e.target.value })}
                            placeholder="e.g. Base Cost (Product Cost)"
                            className="w-full bg-zinc-50/80 border border-zinc-200/80 rounded-xl px-2.5 py-1.5 text-xs font-bold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all"
                          />
                          <button
                            type="button"
                            onClick={() => duplicateCustomRow(row.id)}
                            className="text-[10px] font-extrabold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" /> Duplicate
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            {row.isEditingName ? (
                              <div className="flex items-center gap-1 w-full">
                                <input
                                  type="text"
                                  value={row.costHead}
                                  onChange={(e) => updateStandardRow(row.id, { costHead: e.target.value })}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") updateStandardRow(row.id, { isEditingName: false });
                                  }}
                                  className="w-full bg-white border border-blue-400 rounded-lg px-2 py-1 text-xs font-bold text-zinc-900 focus:outline-none"
                                  autoFocus
                                />
                                <button
                                  type="button"
                                  onClick={() => updateStandardRow(row.id, { isEditingName: false })}
                                  className="p-1 bg-blue-600 text-white rounded hover:bg-blue-700 cursor-pointer"
                                >
                                  <Check className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              <>
                                <span className="text-xs font-bold text-zinc-900">{row.costHead}</span>
                                {row.badgeText && (
                                  <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 text-[9px] font-black uppercase rounded border border-blue-100">
                                    {row.badgeText}
                                  </span>
                                )}
                                <button
                                  type="button"
                                  onClick={() => updateStandardRow(row.id, { isEditingName: true })}
                                  className="opacity-0 group-hover:opacity-100 p-1 text-zinc-400 hover:text-zinc-700 cursor-pointer transition-opacity"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>
                              </>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              if (isFirstRow || row.categoryKey === "product") {
                                addProductItemRow();
                              } else {
                                addStandardSubRow(row.categoryKey, row.costHead, row.placeholder);
                              }
                            }}
                            className="text-[10px] font-extrabold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" /> Add sub-cost line
                          </button>
                        </div>
                      )}
                    </td>

                    {/* Description Column */}
                    <td className="py-3 px-3">
                      <input
                        type="text"
                        value={row.description}
                        onChange={(e) => {
                          if (isCustomTab) updateCustomRow(row.id, { description: e.target.value });
                          else updateStandardRow(row.id, { description: e.target.value });
                        }}
                        placeholder={row.placeholder || "Cost details..."}
                        className="w-full bg-zinc-50/80 border border-zinc-200/80 rounded-xl px-3 py-1.5 text-xs font-medium text-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white"
                      />
                    </td>

                    {/* Calculation Basis Column */}
                    <td className="py-3 px-3">
                      <select
                        value={row.type || "Flat"}
                        onChange={(e) => updateRowType(row.id, e.target.value as "Flat" | "%" | "Per Unit" | "By Weight")}
                        className="w-full bg-zinc-50 border border-zinc-200/90 rounded-xl px-2.5 py-1.5 text-xs font-extrabold text-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white cursor-pointer"
                      >
                        <option value="Flat">Flat Price</option>
                        {!isFirstRow && <option value="%">Percentage (%)</option>}
                        <option value="Per Unit">Per Unit</option>
                        <option value="By Weight">By Weight (Per {weightUnit})</option>
                      </select>
                    </td>

                    {/* Supplier Amount Columns */}
                    {suppliers.map((sup) => {
                      const isBest = supplierSummaries.find(s => s.id === sup.id)?.isLowestCost;
                      const currentAmt = getRowAmount(row, sup.id);
                      const currentTypeVal = getRowTypeValue(row, sup.id);
                      const currentQty = getRowQuantity(row, sup.id);
                      const currentRate = getRowUnitRate(row, sup.id);

                      // Calculated row amount for this supplier
                      const supCalc = supplierCalculations.find(c => c.supplier.id === sup.id);
                      const computedAmt = supCalc?.computedRows[index]?.calculatedAmt ?? currentAmt;

                      return (
                        <td
                          key={sup.id}
                          className={`py-3 px-3 text-right border-l border-zinc-200/60 ${
                            isBest ? "bg-emerald-50/30" : ""
                          }`}
                        >
                          <div className="flex flex-col items-end gap-1">
                            {row.isProductItem ? (
                              <div className="space-y-1 text-right bg-blue-50/40 p-1.5 rounded-xl border border-blue-100/80 w-full">
                                <div className="flex items-center justify-end gap-1">
                                  <div className="flex items-center gap-0.5">
                                    <span className="text-[9px] font-extrabold text-zinc-400">Qty:</span>
                                    <input
                                      type="number"
                                      min="0"
                                      step="any"
                                      value={currentQty === 0 ? "" : currentQty}
                                      onChange={(e) => {
                                        const q = parseFloat(e.target.value) || 0;
                                        updateRowProductItemQtyRate(row.id, sup.id, q, currentRate);
                                      }}
                                      placeholder="1"
                                      className="w-12 px-1 py-0.5 bg-white border border-zinc-200 rounded text-right text-xs font-bold text-zinc-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                  </div>
                                  <span className="text-[10px] font-bold text-zinc-400">×</span>
                                  <div className="flex items-center gap-0.5">
                                    <span className="text-[9px] font-extrabold text-zinc-400">{currencySymbol}</span>
                                    <input
                                      type="number"
                                      min="0"
                                      step="any"
                                      value={currentRate === 0 ? "" : currentRate}
                                      onChange={(e) => {
                                        const r = parseFloat(e.target.value) || 0;
                                        updateRowProductItemQtyRate(row.id, sup.id, currentQty, r);
                                      }}
                                      placeholder="0.00"
                                      className="w-16 px-1 py-0.5 bg-white border border-zinc-200 rounded text-right text-xs font-bold text-zinc-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                  </div>
                                </div>
                                <div className="text-xs font-extrabold text-blue-900 font-sans">
                                  = {currencySymbol}{(currentQty * currentRate).toFixed(2)}
                                </div>
                              </div>
                            ) : row.type === "%" && !isFirstRow ? (
                              <div className="space-y-1 text-right">
                                <div className="relative inline-flex items-center">
                                  <span className="absolute left-2 text-xs font-bold text-blue-600">%</span>
                                  <input
                                    type="number"
                                    step="any"
                                    value={currentTypeVal === 0 ? "" : currentTypeVal}
                                    onChange={(e) => {
                                      const val = parseFloat(e.target.value) || 0;
                                      updateRowSupplierTypeValue(row.id, sup.id, val);
                                    }}
                                    placeholder="0"
                                    className="w-24 pl-5 pr-2 py-1 bg-blue-50/50 border border-blue-200 rounded-lg text-right text-xs font-bold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                  />
                                </div>
                                <div className="text-[10px] font-extrabold text-blue-700">
                                  = {currencySymbol}{computedAmt.toFixed(2)}
                                </div>
                              </div>
                            ) : row.type === "Per Unit" ? (
                              <div className="space-y-1 text-right">
                                <div className="relative inline-flex items-center">
                                  <span className="absolute left-2 text-[10px] font-bold text-indigo-500">{currencySymbol}</span>
                                  <input
                                    type="number"
                                    step="any"
                                    value={currentTypeVal === 0 ? "" : currentTypeVal}
                                    onChange={(e) => {
                                      const val = parseFloat(e.target.value) || 0;
                                      updateRowSupplierTypeValue(row.id, sup.id, val);
                                    }}
                                    placeholder="0.00"
                                    className="w-24 pl-5 pr-2 py-1 bg-indigo-50/50 border border-indigo-200 rounded-lg text-right text-xs font-bold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                  />
                                  <span className="ml-1 text-[10px] font-bold text-indigo-400">/u</span>
                                </div>
                                <div className="text-[10px] font-extrabold text-indigo-700">
                                  = {currencySymbol}{computedAmt.toFixed(2)}
                                </div>
                              </div>
                            ) : row.type === "By Weight" ? (
                              <div className="space-y-1 text-right">
                                <div className="relative inline-flex items-center">
                                  <span className="absolute left-2 text-[10px] font-bold text-emerald-600">{currencySymbol}</span>
                                  <input
                                    type="number"
                                    step="any"
                                    value={currentTypeVal === 0 ? "" : currentTypeVal}
                                    onChange={(e) => {
                                      const val = parseFloat(e.target.value) || 0;
                                      updateRowSupplierTypeValue(row.id, sup.id, val);
                                    }}
                                    placeholder="0.00"
                                    className="w-24 pl-5 pr-2 py-1 bg-emerald-50/50 border border-emerald-200 rounded-lg text-right text-xs font-bold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                                  />
                                  <span className="ml-1 text-[10px] font-bold text-emerald-500">/{weightUnit}</span>
                                </div>
                                <div className="text-[10px] font-extrabold text-emerald-700">
                                  = {currencySymbol}{computedAmt.toFixed(2)}
                                </div>
                              </div>
                            ) : (
                              <div className="relative inline-flex items-center">
                                <span className="absolute left-2.5 text-xs font-bold text-zinc-400">
                                  {currencySymbol}
                                </span>
                                <input
                                  type="number"
                                  step="any"
                                  value={currentAmt === 0 ? "" : currentAmt}
                                  onChange={(e) => {
                                    const val = parseFloat(e.target.value) || 0;
                                    updateRowSupplierAmount(row.id, sup.id, val);
                                  }}
                                  placeholder="0.00"
                                  className="w-28 pl-6 pr-2 py-1.5 bg-zinc-50/80 border border-zinc-200/80 rounded-xl text-right text-xs font-bold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white"
                                />
                              </div>
                            )}
                          </div>
                        </td>
                      );
                    })}

                    {/* Action Column: Delete Field */}
                    <td className="py-3 px-3 text-center border-l border-zinc-200/60">
                      {((isCustomTab && customRows.length > 1) || (!isCustomTab && standardRows.length > 1)) ? (
                        <button
                          type="button"
                          onClick={() => {
                            if (isCustomTab) removeCustomRow(row.id);
                            else removeStandardRow(row.id);
                          }}
                          className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer inline-flex items-center justify-center"
                          title="Delete field / cost head"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      ) : (
                        <span className="text-[10px] text-zinc-300">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>

        {/* Custom Template Toast Notification */}
        {isCustomTab && customTemplateMessage && (
          <div className="mx-4 my-3 p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl flex items-center justify-between text-xs font-bold animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{customTemplateMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setCustomTemplateMessage(null)}
              className="p-1 text-emerald-700 hover:bg-emerald-100 rounded-lg cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Table Bottom Action Bar (Add Line, Save Template, Load Template Dropdown & Reset) */}
        <div className="p-4 bg-zinc-50/50 border-t border-zinc-100 flex flex-wrap justify-between items-center gap-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={isCustomTab ? addCustomRow : addStandardCostRow}
              className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer border border-blue-200/60"
              title="Add a cost line / field for overhead or logistics"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Cost Line / Field</span>
            </button>

            {isCustomTab && (
              <TemplateLoadDropdownMenu
                savedTemplatesList={savedTemplatesList}
                activeTemplateName={activeTemplateName}
                onApplyTemplate={handleApplyTemplate}
                onDeleteTemplate={handleDeleteSavedTemplate}
                onOpenSaveModal={() => setShowSaveNameModal(true)}
                dropDirection="up"
                buttonClassName="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100/90 text-emerald-900 border border-emerald-300 rounded-xl text-xs font-extrabold shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
              />
            )}

            {isCustomTab && (
              <button
                type="button"
                onClick={() => setShowSaveNameModal(true)}
                className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-extrabold shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
                title="Save current custom cost heads, descriptions, and calculation rules"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Custom Template</span>
              </button>
            )}

            {isCustomTab && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-900 rounded-xl text-[11px] font-extrabold border border-emerald-200/80 shadow-2xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Active Template: <strong className="text-emerald-950 font-black underline underline-offset-2 decoration-emerald-400">{activeTemplateName}</strong></span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isCustomTab ? (
              <button
                type="button"
                onClick={handleResetCustomTemplate}
                className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-zinc-200/60"
                title="Reset sheet to default custom cost heads"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Layout
              </button>
            ) : (
              <button
                type="button"
                onClick={handleResetToDefault}
                className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                title="Reset sheet to default cost heads"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Sheet
              </button>
            )}
          </div>
        </div>

        {/* Save Template Name Modal */}
        {showSaveNameModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                    <Save className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-zinc-900">Save Custom Cost Template</h3>
                    <p className="text-xs text-zinc-500 font-medium">Save this layout for instant 1-click re-use</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSaveNameModal(false)}
                  className="p-1 text-zinc-400 hover:text-zinc-700 rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-zinc-700">Template Name</label>
                <input
                  type="text"
                  value={newTemplateNameInput}
                  onChange={(e) => setNewTemplateNameInput(e.target.value)}
                  placeholder={activeTemplateName || "e.g. Overseas Import & Duty Layout"}
                  className="w-full bg-zinc-50 border border-zinc-300 rounded-xl px-3.5 py-2.5 text-xs font-extrabold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:bg-white"
                  autoFocus
                />
                <p className="text-[11px] text-zinc-500">
                  This template will auto-load when you switch to Custom Sheet, and will be saved in your quick load dropdown.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setShowSaveNameModal(false)}
                  className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveCustomTemplate(newTemplateNameInput)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Template</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* TOTALS & SUPPLIER COMPARISON MATRIX FOOTER */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-sm p-5 space-y-6">
        <h3 className="text-xs font-black uppercase tracking-wider text-zinc-500 border-b border-zinc-100 pb-2 flex items-center gap-2">
          <Calculator className="w-4 h-4 text-blue-600" />
          {suppliers.length > 1 ? "Side-by-Side Supplier Totals & Profit Breakdown" : "Totals & Profit Breakdown"}
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b border-zinc-200 text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider">
                <th className="py-2 px-3 w-1/3">Calculation Metric</th>
                {suppliers.map(sup => {
                  const isBest = supplierSummaries.find(s => s.id === sup.id)?.isLowestCost;
                  return (
                    <th key={sup.id} className={`py-2 px-3 text-right font-extrabold ${isBest ? "text-emerald-700 bg-emerald-50/60" : "text-zinc-900"}`}>
                      {sup.name}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {/* Row 1: Direct Material & Labour */}
              <tr>
                <td className="py-2.5 px-3 font-semibold text-zinc-700">Direct Material & Labour</td>
                {supplierCalculations.map(c => (
                  <td key={c.supplier.id} className="py-2.5 px-3 text-right font-bold font-sans text-zinc-900">
                    {currencySymbol}{c.directMaterialLaborTotal.toFixed(2)}
                  </td>
                ))}
              </tr>

              {/* Row 2: Overheads & Logistics */}
              <tr>
                <td className="py-2.5 px-3 font-semibold text-zinc-700">Overheads & Logistics</td>
                {supplierCalculations.map(c => (
                  <td key={c.supplier.id} className="py-2.5 px-3 text-right font-bold font-sans text-zinc-900">
                    {currencySymbol}{c.logisticsTotal.toFixed(2)}
                  </td>
                ))}
              </tr>

              {/* Row 3: Total Landed Cost Subtotal */}
              <tr className="bg-blue-50/40">
                <td className="py-3 px-3 font-extrabold text-blue-900">Total Landed Cost</td>
                {supplierCalculations.map(c => (
                  <td key={c.supplier.id} className="py-3 px-3 text-right font-extrabold font-sans text-blue-900 text-sm">
                    {currencySymbol}{c.totalLandedCost.toFixed(2)}
                  </td>
                ))}
              </tr>

              {/* Row 4: Target Profit Margin / Markup */}
              <tr>
                <td className="py-3 px-3 font-semibold text-zinc-700">
                  <span className="block font-bold">Target Profit Margin / Markup (+)</span>
                  <span className="text-[10px] text-zinc-400 font-normal">Calculated on Total Landed Cost</span>
                </td>
                {supplierCalculations.map(c => (
                  <td key={c.supplier.id} className="py-3 px-3 text-right">
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-1">
                        {/* Mode Toggle % vs Flat */}
                        <div className="flex items-center bg-zinc-100 p-0.5 rounded border border-zinc-200">
                          <button
                            type="button"
                            onClick={() => updateSupplier(c.supplier.id, { profitType: "%" })}
                            className={`px-1 rounded text-[9px] font-bold cursor-pointer ${
                              c.supplier.profitType === "%" ? "bg-blue-600 text-white" : "text-zinc-500"
                            }`}
                          >
                            %
                          </button>
                          <button
                            type="button"
                            onClick={() => updateSupplier(c.supplier.id, { profitType: "Flat" })}
                            className={`px-1 rounded text-[9px] font-bold cursor-pointer ${
                              c.supplier.profitType === "Flat" ? "bg-blue-600 text-white" : "text-zinc-500"
                            }`}
                          >
                            {currencySymbol}
                          </button>
                        </div>

                        <input
                          type="number"
                          step="any"
                          value={c.supplier.profitValue === 0 ? "" : c.supplier.profitValue}
                          onChange={(e) => updateSupplier(c.supplier.id, { profitValue: parseFloat(e.target.value) || 0 })}
                          placeholder="0"
                          className="w-20 px-2 py-1 bg-zinc-50 border border-zinc-200 rounded-lg text-right text-xs font-bold text-zinc-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <span className="text-[11px] font-bold text-emerald-600 font-sans">
                        +{currencySymbol}{c.profitAmount.toFixed(2)}
                      </span>
                    </div>
                  </td>
                ))}
              </tr>

              {/* Row 5: Discount */}
              <tr>
                <td className="py-3 px-3 font-semibold text-zinc-700">
                  <span className="block font-bold">Discount (-)</span>
                  <span className="text-[10px] text-zinc-400 font-normal">Subtractions or trade rebate</span>
                </td>
                {supplierCalculations.map(c => (
                  <td key={c.supplier.id} className="py-3 px-3 text-right">
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-1">
                        <div className="flex items-center bg-zinc-100 p-0.5 rounded border border-zinc-200">
                          <button
                            type="button"
                            onClick={() => updateSupplier(c.supplier.id, { discountType: "%" })}
                            className={`px-1 rounded text-[9px] font-bold cursor-pointer ${
                              c.supplier.discountType === "%" ? "bg-blue-600 text-white" : "text-zinc-500"
                            }`}
                          >
                            %
                          </button>
                          <button
                            type="button"
                            onClick={() => updateSupplier(c.supplier.id, { discountType: "Flat" })}
                            className={`px-1 rounded text-[9px] font-bold cursor-pointer ${
                              c.supplier.discountType === "Flat" ? "bg-blue-600 text-white" : "text-zinc-500"
                            }`}
                          >
                            {currencySymbol}
                          </button>
                        </div>

                        <input
                          type="number"
                          step="any"
                          value={c.supplier.discountValue === 0 ? "" : c.supplier.discountValue}
                          onChange={(e) => updateSupplier(c.supplier.id, { discountValue: parseFloat(e.target.value) || 0 })}
                          placeholder="0"
                          className="w-20 px-2 py-1 bg-zinc-50 border border-zinc-200 rounded-lg text-right text-xs font-bold text-zinc-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <span className="text-[11px] font-bold text-red-500 font-sans">
                        -{currencySymbol}{c.discountAmount.toFixed(2)}
                      </span>
                    </div>
                  </td>
                ))}
              </tr>

              {/* Row 6: FINAL SELLING PRICE */}
              <tr className="bg-zinc-900 text-white font-extrabold border-t-2 border-zinc-900">
                <td className="py-3.5 px-3 text-xs uppercase tracking-wider text-zinc-200">
                  FINAL QUOTED SELLING PRICE
                </td>
                {supplierCalculations.map(c => {
                  const isBest = supplierSummaries.find(s => s.id === c.supplier.id)?.isLowestCost;
                  return (
                    <td
                      key={c.supplier.id}
                      className={`py-3.5 px-3 text-right font-sans text-base ${
                        isBest ? "text-emerald-400 font-black bg-emerald-950/60" : "text-emerald-400"
                      }`}
                    >
                      {currencySymbol}{c.finalSellingPrice.toFixed(2)}
                      {isBest && suppliers.length > 1 && (
                        <span className="block text-[9px] font-bold uppercase tracking-wider text-emerald-300">
                          Lowest Cost Option
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Export Excel Quick Action */}
      <div className="bg-emerald-50/70 border border-emerald-200/80 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-600 text-white rounded-xl shadow-xs">
            <FileSpreadsheet className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-zinc-900">Multi-Supplier Excel Export</h4>
            <p className="text-[11px] text-zinc-500">Exports all cost head rows, supplier columns, and live Excel calculation formulas (.xlsx)</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleExportExcel}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Download Excel (.xlsx)</span>
        </button>
      </div>
    </div>
  );
};
