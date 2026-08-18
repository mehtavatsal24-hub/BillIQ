import { LineItem, PackingBox } from '../types';

export interface AggregatedBoxRow {
  boxNo: string;
  dimensions: string;

  // Auto-calculated baselines from line items
  calculatedNetWeight: number;
  calculatedGrossWeight: number;
  calculatedPackedQty: number;
  itemCount: number;
  itemDescriptions: string[];

  // Manual overrides (empty string if using auto-calculation)
  netWeightOverride: string;
  grossWeightOverride: string;
  packedQtyOverride: string;

  // Effective values resolved for display & PDF
  effectiveNetWeight: number;
  effectiveGrossWeight: number;
  effectivePackedQty: number;

  // Override flags
  isNetOverridden: boolean;
  isGrossOverridden: boolean;
  isQtyOverridden: boolean;
  isOverridden: boolean;

  // Detected range metadata
  isRange: boolean;
  rangeBoxCount?: number;
  rangeStart?: number;
  rangeEnd?: number;
  rangePrefix?: string;
}

/**
 * Intelligent helper to parse box range strings (e.g. "Box 1-5", "Box 1 to 5", "Pallet 1-3", "1 to 10")
 */
export function parseBoxRange(boxLabel: string): {
  isRange: boolean;
  count: number;
  start?: number;
  end?: number;
  prefix?: string;
} {
  if (!boxLabel) return { isRange: false, count: 1 };
  const trimmed = boxLabel.trim();

  // Match formats like "Box 1-5", "Box 1 to 5", "Pallet 1-4", "1 - 10", "Case 1..5"
  const match = trimmed.match(/^(.*?)\s*(\d+)\s*(?:-|to|\.\.|\/)\s*(\d+)\s*$/i);
  if (match) {
    const prefix = match[1].trim() || 'Box';
    const start = parseInt(match[2], 10);
    const end = parseInt(match[3], 10);
    if (!isNaN(start) && !isNaN(end) && end >= start) {
      return {
        isRange: true,
        count: end - start + 1,
        start,
        end,
        prefix: prefix ? `${prefix} ` : 'Box ',
      };
    }
  }

  // Check for standalone "(X Boxes)" notation
  const countMatch = trimmed.match(/\((\d+)\s*(?:boxes|pkts|cases|pallets|units)\)/i);
  if (countMatch) {
    const c = parseInt(countMatch[1], 10);
    if (!isNaN(c) && c > 0) {
      return { isRange: true, count: c };
    }
  }

  return { isRange: false, count: 1 };
}

/**
 * Natural comparator for box identifiers (e.g., "Box 1", "Box 2", "Box 10", "Box 1-5", "Pallet 1")
 */
export function naturalBoxCompare(a: string, b: string): number {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}

/**
 * Parses and aggregates line items into box metrics
 */
export function aggregateLineItemsForBoxes(
  items: LineItem[],
  customBoxes: string[] = [],
  boxDimensions: Record<string, string> = {},
  boxNetWeights: Record<string, string> = {},
  boxGrossWeights: Record<string, string> = {},
  boxQtyPacked: Record<string, string> = {}
): AggregatedBoxRow[] {
  // Map of box label -> raw line item totals
  const itemTotalsMap: Record<
    string,
    {
      net: number;
      gross: number;
      qty: number;
      itemCount: number;
      itemDescriptions: string[];
    }
  > = {};

  // Extract metrics from all line items
  (items || []).forEach((item) => {
    const rawBox = (item.boxNo || '').trim();
    if (!rawBox || rawBox.toLowerCase() === 'unspecified') return;

    if (!itemTotalsMap[rawBox]) {
      itemTotalsMap[rawBox] = {
        net: 0,
        gross: 0,
        qty: 0,
        itemCount: 0,
        itemDescriptions: [],
      };
    }

    // 1. Packed Quantity (fallback to quantity)
    const q =
      item.qtyPacked !== undefined && item.qtyPacked !== null && !isNaN(Number(item.qtyPacked))
        ? Number(item.qtyPacked)
        : Number(item.quantity) || 0;

    // 2. Net Weight
    let net = 0;
    if (item.netWeight !== undefined && item.netWeight !== null && Number(item.netWeight) > 0) {
      net = Number(item.netWeight);
    } else if (item.unitWeight !== undefined && item.unitWeight !== null && Number(item.unitWeight) > 0) {
      net = Number(item.unitWeight) * q;
    }

    // 3. Gross Weight
    let gross = 0;
    if (item.grossWeight !== undefined && item.grossWeight !== null && Number(item.grossWeight) > 0) {
      gross = Number(item.grossWeight);
    } else if (item.grossWeightPercent && net > 0) {
      const pct = parseFloat(String(item.grossWeightPercent).replace('%', '')) || 0;
      gross = net * (1 + pct / 100);
    } else if (net > 0) {
      gross = net;
    }

    itemTotalsMap[rawBox].net += net;
    itemTotalsMap[rawBox].gross += gross;
    itemTotalsMap[rawBox].qty += q;
    itemTotalsMap[rawBox].itemCount += 1;
    if (item.description && item.description.trim()) {
      itemTotalsMap[rawBox].itemDescriptions.push(item.description.trim());
    }
  });

  // Combine unique box labels from items and custom boxes
  const allBoxNamesSet = new Set<string>();
  customBoxes.forEach((b) => {
    if (b && b.trim() && b.trim().toLowerCase() !== 'unspecified') {
      allBoxNamesSet.add(b.trim());
    }
  });
  Object.keys(itemTotalsMap).forEach((b) => allBoxNamesSet.add(b));

  const sortedBoxNames = Array.from(allBoxNamesSet).sort(naturalBoxCompare);

  return sortedBoxNames.map((boxNo) => {
    const rawMetrics = itemTotalsMap[boxNo] || {
      net: 0,
      gross: 0,
      qty: 0,
      itemCount: 0,
      itemDescriptions: [],
    };

    const calcNet = Math.round(rawMetrics.net * 100) / 100;
    const calcGross = Math.round(rawMetrics.gross * 100) / 100;
    const calcQty = rawMetrics.qty;

    const netOverride = boxNetWeights[boxNo] ?? '';
    const grossOverride = boxGrossWeights[boxNo] ?? '';
    const qtyOverride = boxQtyPacked[boxNo] ?? '';

    const isNetOverridden = netOverride !== undefined && netOverride.trim() !== '';
    const isGrossOverridden = grossOverride !== undefined && grossOverride.trim() !== '';
    const isQtyOverridden = qtyOverride !== undefined && qtyOverride.trim() !== '';
    const isOverridden = isNetOverridden || isGrossOverridden || isQtyOverridden;

    const parsedNet = isNetOverridden ? parseFloat(netOverride) : calcNet;
    const parsedGross = isGrossOverridden ? parseFloat(grossOverride) : calcGross;
    const parsedQty = isQtyOverridden ? parseFloat(qtyOverride) : calcQty;

    const effectiveNetWeight = isNaN(parsedNet) ? 0 : Math.round(parsedNet * 100) / 100;
    const effectiveGrossWeight = isNaN(parsedGross) ? 0 : Math.round(parsedGross * 100) / 100;
    const effectivePackedQty = isNaN(parsedQty) ? 0 : parsedQty;

    const rangeInfo = parseBoxRange(boxNo);

    return {
      boxNo,
      dimensions: boxDimensions[boxNo] || '',
      calculatedNetWeight: calcNet,
      calculatedGrossWeight: calcGross,
      calculatedPackedQty: calcQty,
      itemCount: rawMetrics.itemCount,
      itemDescriptions: rawMetrics.itemDescriptions,
      netWeightOverride: netOverride,
      grossWeightOverride: grossOverride,
      packedQtyOverride: qtyOverride,
      effectiveNetWeight,
      effectiveGrossWeight,
      effectivePackedQty,
      isNetOverridden,
      isGrossOverridden,
      isQtyOverridden,
      isOverridden,
      isRange: rangeInfo.isRange,
      rangeBoxCount: rangeInfo.count,
      rangeStart: rangeInfo.start,
      rangeEnd: rangeInfo.end,
      rangePrefix: rangeInfo.prefix,
    };
  });
}

/**
 * Converts aggregated box rows into PackingBox array for PDF / draft saving
 */
export function convertAggregatedBoxesToPackingBoxes(
  aggregatedRows: AggregatedBoxRow[]
): PackingBox[] {
  return aggregatedRows.map((row) => ({
    boxNo: row.boxNo,
    quantityText: `${row.boxNo} X ${row.effectivePackedQty}`,
    grossWeight: row.effectiveGrossWeight,
    netWeight: row.effectiveNetWeight,
    dimensions: row.dimensions,
  }));
}
