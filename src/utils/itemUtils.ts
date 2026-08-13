import { LineItem } from "../types";

// Add a clean-up pattern to strip automatically extracted metadata like delivery and incoterms
export function sanitizeExtractedDescription(description: string): string {
  if (!description) return "";
  return description
    // Strip Delivery patterns like "| Delivery: 7–10 weeks"
    .replace(/\s*\|\s*(?:Delivery|Delivery Terms|Lead Time)\s*:\s*[^|]+/gi, '')
    // Strip Incoterm patterns like "| Incoterm: CIF"
    .replace(/\s*\|\s*(?:Incoterm|Incoterms)\s*:\s*[^|]+/gi, '')
    // Standalone Delivery/Incoterm trailing phrases
    .replace(/(?:^|\b)(?:Delivery|Incoterm|Incoterms)\s*:\s*[^|;,.]+(?=$|[;,|])/gi, '')
    // Clean orphan pipes
    .replace(/^\s*\|\s*/, '')
    .replace(/\s*\|\s*$/, '')
    .trim();
}

/**
 * Compares new line items against old line items and marks items that were
 * modified or newly added by AI with `isAiEdited: true`.
 */
export function markEditedLineItems(oldItems: LineItem[], newItems: LineItem[]): LineItem[] {
  if (!Array.isArray(newItems)) return [];

  const oldMap = new Map<string, LineItem>();
  if (Array.isArray(oldItems)) {
    oldItems.forEach((item) => {
      if (item && item.id) oldMap.set(item.id, item);
    });
  }

  return newItems.map((newItem, idx) => {
    const oldItem =
      (newItem.id && oldMap.get(newItem.id)) ||
      (Array.isArray(oldItems) ? oldItems[idx] : undefined);

    // Completely new item added by AI
    if (!oldItem) {
      return { ...newItem, isAiEdited: true };
    }

    // Compare key fields to determine if this item was modified
    const isDescriptionChanged =
      String(newItem.description || "") !== String(oldItem.description || "");
    const isRateChanged = Number(newItem.rate || 0) !== Number(oldItem.rate || 0);
    const isQuantityChanged = Number(newItem.quantity || 0) !== Number(oldItem.quantity || 0);
    const isHsnChanged = String(newItem.hsn || "").trim() !== String(oldItem.hsn || "").trim();
    const isTaxChanged = Number(newItem.taxRate || 0) !== Number(oldItem.taxRate || 0);
    const isUnitChanged = String(newItem.unit || "").trim() !== String(oldItem.unit || "").trim();
    const isHeatNoChanged = String(newItem.heatNo || "").trim() !== String(oldItem.heatNo || "").trim();
    const isBoxNoChanged = String(newItem.boxNo || "").trim() !== String(oldItem.boxNo || "").trim();
    const isCostHeadChanged = String(newItem.costHead || "").trim() !== String(oldItem.costHead || "").trim();
    const isCostTypeChanged = String(newItem.costType || "").trim() !== String(oldItem.costType || "").trim();
    const isCostTypeValueChanged = Number(newItem.costTypeValue || 0) !== Number(oldItem.costTypeValue || 0);
    const isRemarksChanged = String(newItem.remarks || "").trim() !== String(oldItem.remarks || "").trim();

    const wasModified =
      isDescriptionChanged ||
      isRateChanged ||
      isQuantityChanged ||
      isHsnChanged ||
      isTaxChanged ||
      isUnitChanged ||
      isHeatNoChanged ||
      isBoxNoChanged ||
      isCostHeadChanged ||
      isCostTypeChanged ||
      isCostTypeValueChanged ||
      isRemarksChanged ||
      Boolean(newItem.isAiEdited);

    return {
      ...newItem,
      isAiEdited: wasModified,
    };
  });
}
