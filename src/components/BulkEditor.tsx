import React, { useState } from "react";
import { Card, CardContent } from "./Card";
import { Button } from "./Button";
import { Wand2, Loader2, Zap } from "lucide-react";
import { motion } from "motion/react";
import { editLineItemsWithAI } from "../services/geminiService";
import { LineItem, DocumentType } from "../types";
import { getDisplayErrorMessage } from "../utils/errorUtils";

interface BulkEditorProps {
  items: LineItem[];
  onApply: (newItems: LineItem[], explanation: string, docUpdates?: Record<string, any>) => void;
  docType: DocumentType;
  currency: string;
  docContext?: Record<string, any>;
  className?: string;
}

export const BulkEditor: React.FC<BulkEditorProps> = ({
  items,
  onApply,
  docType,
  currency,
  docContext,
  className = "",
}) => {
  const [command, setCommand] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");

  const sanitizeResultItems = (rawItems: LineItem[]): LineItem[] => {
    return rawItems.map((item, idx) => {
      const q = typeof item.quantity === "number" ? item.quantity : parseFloat(String(item.quantity || "1").replace(/,/g, ""));
      const r = typeof item.rate === "number" ? item.rate : parseFloat(String(item.rate || "0").replace(/,/g, ""));
      const t = typeof item.taxRate === "number" ? item.taxRate : parseFloat(String(item.taxRate || "18").replace(/,/g, ""));

      return {
        ...item,
        id: item.id || String(idx + 1),
        description: (item.description || "").trim() || `Item ${idx + 1}`,
        quantity: isNaN(q) || q <= 0 ? 1 : q,
        rate: isNaN(r) || r < 0 ? 0 : r,
        taxRate: isNaN(t) || t < 0 ? 18 : Math.min(100, t),
        unit: (item.unit || "NOS").trim().toUpperCase() || "NOS",
        hsn: (item.hsn || "").trim(),
      };
    });
  };

  const handleApply = async () => {
    if (!command.trim() || isLoading) return;
    setIsLoading(true);
    setFeedback("");
    setError("");

    try {
      const result = await editLineItemsWithAI(items, command, docType, currency, docContext);
      if (result && Array.isArray(result.items)) {
        const sanitized = sanitizeResultItems(result.items);
        onApply(sanitized, result.explanation || "Document updated successfully.", result.docUpdates);
        setFeedback(result.explanation || "Document updated successfully.");
        setCommand("");
      } else {
        setError("Could not process command. Please rephrase your request.");
      }
    } catch (err: any) {
      console.error("Bulk Line Item Editor Error:", err);
      const friendly = getDisplayErrorMessage(err, null, "Unable to generate details at this moment. Please try again or fill in the fields manually.");
      setError(friendly);
    } finally {
      setIsLoading(false);
    }
  };

  const getDynamicPlaceholder = () => {
    if (items && items.length > 0) {
      const validItems = items.filter(i => i.description && i.description.trim().length > 0);
      if (validItems.length > 0) {
        const first = validItems[0].description.trim();
        const shortName = first.length > 20 ? first.substring(0, 18) + "..." : first;
        return `Say e.g.: 'Add 2 items: ${shortName} (Pack B) Qty 25 Rate 1200, Supplemental Item Qty 50 Rate 450...', 'Increase all rates by 10%', 'Apply 18% tax to all rows', 'Delete line 2'...`;
      }
    }
    return "Say e.g.: 'Add 3 items: Item A Qty 50 Rate 1200, Item B Qty 100 Rate 450...', 'Increase all rates by 10%', 'Apply 18% tax to all rows'...";
  };

  const getQuickPrompts = () => {
    const hasItems = items && items.length > 0;
    const validItems = hasItems ? items.filter(i => i.description && i.description.trim().length > 0) : [];
    const sampleItem = validItems.length > 0 ? validItems[0].description.trim() : "";
    const cleanSampleName = sampleItem.length > 18 ? sampleItem.substring(0, 16) + "..." : (sampleItem || "Item A");

    switch (docType) {
      case DocumentType.COST_SHEET:
        if (hasItems) {
          return [
            { label: "Supplier 2 Rate 500", prompt: "In supplier 2 put 500 in all line items" },
            { label: "Add Supplier", prompt: "Add supplier in cost sheet" },
            { label: "+10% Rate Increase", prompt: "Increase rates of all items by 10%" },
            { label: "Add 2 Items", prompt: `Add 2 items: ${cleanSampleName} (Tier 2) Qty 50 Rate 120, Supplemental Item Qty 100 Rate 80` },
            { label: "Add 1000 to all fields", prompt: "Add 1000 to all fields" },
          ];
        }
        return [
          { label: "Add Product Items", prompt: "Add 2 items: Product Alpha Qty 50 Rate 120, Product Beta Qty 100 Rate 80" },
          { label: "Add Supplier", prompt: "Add supplier in cost sheet" },
          { label: "+10% Rate Increase", prompt: "Increase rates of all items by 10%" },
          { label: "Supplier 2 Rate 500", prompt: "In supplier 2 put 500 in all line items" },
          { label: "Add 1000 to all fields", prompt: "Add 1000 to all fields" },
        ];
      case DocumentType.PACKING_LIST:
        if (hasItems) {
          return [
            { label: "Add 2 Packing Items", prompt: `Add 2 items: ${cleanSampleName} Qty 50, Item B Qty 100` },
            { label: "Assign Box #1 to all", prompt: "Set box number to Box 1 for all items" },
            { label: "Set Qty Packed to 100", prompt: "Set quantity packed to 100 for all items" },
            { label: "Set Box Range 1-5", prompt: "Assign packaging box numbers Box 1 to Box 5 evenly across all items" },
          ];
        }
        return [
          { label: "Add Packing Items", prompt: "Add 2 items: Item A Qty 50, Item B Qty 100" },
          { label: "Assign Box #1 to all", prompt: "Set box number to Box 1 for all items" },
          { label: "Set Qty Packed to 100", prompt: "Set quantity packed to 100 for all items" },
        ];
      default:
        if (hasItems) {
          return [
            { label: "Add 2 Items", prompt: `Add 2 items: ${cleanSampleName} (Grade B) Qty 25 Rate 1200, Additional Item Qty 50 Rate 450` },
            { label: "+10% Rate Increase", prompt: "Increase rates of all items by 10%" },
            { label: "-5% Discount on all", prompt: "Reduce rates of all items by 5%" },
            { label: "Apply 18% Tax", prompt: "Apply 18% tax to all rows" },
            { label: "Delete last row", prompt: "Delete the last line item" },
          ];
        }
        return [
          { label: "Add 3 Items", prompt: "Add 3 items: Item A Qty 50 Rate 1200, Item B Qty 100 Rate 450, Item C Qty 200 Rate 80" },
          { label: "Add & Adjust Rates", prompt: "Add 2 items: Product Alpha Qty 50 Rate 1000, Service Beta Qty 20 Rate 300, then increase line 1 rate by 15% and decrease line 2 rate by 10%" },
          { label: "+10% Rate Increase", prompt: "Increase rates of all items by 10%" },
          { label: "-5% Discount on all", prompt: "Reduce rates of all items by 5%" },
          { label: "Apply 18% Tax", prompt: "Apply 18% tax to all rows" },
        ];
    }
  };

  return (
    <Card className={`border-t-4 border-t-zinc-900 bg-gradient-to-r from-zinc-50/60 via-zinc-100/40 to-white shadow-xs ${className}`}>
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-zinc-900 flex items-center gap-1.5">
              <Wand2 className="h-3.5 w-3.5 text-zinc-800" />
              AI Bulk Line Item Editor
            </h3>
            <p className="text-[11px] text-zinc-500 font-medium">
              Add new line items, batch adjust rates & quantities, apply taxes, or transform rows via AI
            </p>
          </div>
          <div className="text-[10px] text-zinc-500 font-extrabold uppercase tracking-wider bg-zinc-200/60 px-2 py-0.5 rounded-md border border-zinc-300/40 shrink-0">
            Smart AI Active
          </div>
        </div>

        <div className="space-y-3">
          <div className="relative">
            <textarea
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              placeholder={getDynamicPlaceholder()}
              className="w-full text-xs bg-white p-3 pr-24 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-500 shadow-xs min-h-[65px] placeholder:text-zinc-400 font-medium"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleApply();
                }
              }}
            />
            <div className="absolute right-2 bottom-2 flex items-center gap-1.5">
              {command && (
                <button
                  type="button"
                  onClick={() => setCommand("")}
                  className="px-2 py-1 text-zinc-400 hover:text-zinc-700 transition-colors text-[10px] font-bold uppercase tracking-wider cursor-pointer"
                >
                  Clear
                </button>
              )}
              <Button
                type="button"
                disabled={isLoading || !command.trim()}
                onClick={handleApply}
                className="px-3 py-1.5 !rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1 disabled:opacity-50 cursor-pointer shadow-2xs"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Applying...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-3 w-3" />
                    Apply AI
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Quick Suggestions Tags */}
          <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
            <span className="text-zinc-400 font-extrabold text-[10px]">Quick Prompts:</span>
            {getQuickPrompts().map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCommand(p.prompt)}
                className="px-2 py-1 bg-white hover:bg-zinc-100 text-zinc-700 rounded-md transition-all border border-zinc-200/80 cursor-pointer text-[9.5px] font-bold shadow-2xs"
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Success Banner */}
          {feedback && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-zinc-950 text-emerald-400 border border-emerald-900/40 rounded-xl text-xs flex items-start gap-2 shadow-xs"
            >
              <Zap className="h-3.5 w-3.5 text-yellow-300 shrink-0 mt-0.5" />
              <div>
                <div className="font-extrabold text-white text-[10px] uppercase tracking-wider mb-0.5">
                  AI Applied Successfully
                </div>
                <span className="font-semibold text-emerald-300 text-xs">{feedback}</span>
              </div>
            </motion.div>
          )}

          {/* Error Banner */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs font-bold shadow-xs"
            >
              ⚠️ {error}
            </motion.div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
