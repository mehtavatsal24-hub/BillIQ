import React, { useState } from 'react';
import { 
  Package, 
  Plus, 
  Trash2, 
  RotateCcw, 
  RefreshCw, 
  Layers, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import { AggregatedBoxRow } from '../utils/packingListAggregation';

// Maintain backward-compatible BoxDimension export type
export interface BoxDimension {
  boxNo: string;
  dimensions: string;
  netWeightOverride: string;
  grossWeightOverride: string;
  packedQty: number;
}

interface BoxDimensionsProps {
  boxes: AggregatedBoxRow[];
  onUpdateBox: (index: number, updatedBox: Partial<AggregatedBoxRow> & { boxNo?: string }) => void;
  onResetBox?: (boxNo: string) => void;
  onResetAll?: () => void;
  onAutoSync?: () => void;
  onRemoveBox: (index: number) => void;
  onAddBox: () => void;
}

export const BoxDimensionsTable: React.FC<BoxDimensionsProps> = ({
  boxes,
  onUpdateBox,
  onResetBox,
  onResetAll,
  onAutoSync,
  onRemoveBox,
  onAddBox,
}) => {
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  // Compute total aggregates across all packaging entries
  const totalPhysicalBoxes = boxes.reduce((acc, b) => acc + (b.isRange && b.rangeBoxCount ? b.rangeBoxCount : 1), 0);
  const totalPackedQty = boxes.reduce((acc, b) => acc + b.effectivePackedQty, 0);
  const totalNetWeight = boxes.reduce((acc, b) => acc + b.effectiveNetWeight, 0);
  const totalGrossWeight = boxes.reduce((acc, b) => acc + b.effectiveGrossWeight, 0);
  const overriddenCount = boxes.filter(b => b.isOverridden).length;

  const handleSyncClick = () => {
    if (onAutoSync) {
      onAutoSync();
      setSyncFeedback('Synced with line items!');
      setTimeout(() => setSyncFeedback(null), 3000);
    }
  };

  return (
    <div id="box-dimensions-packaging-details-container" className="bg-white p-5 md:p-6 rounded-2xl border border-zinc-200 shadow-sm space-y-4">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-zinc-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
              <Package className="w-4 h-4" />
            </span>
            <h3 className="text-sm md:text-base font-extrabold text-zinc-900 uppercase tracking-wide">
              Box Dimensions & Packaging Details
            </h3>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Auto-calculates weights and packed quantities from line items above. Manual edits override defaults.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {onAutoSync && (
            <button
              type="button"
              id="btn-auto-sync-packaging"
              onClick={handleSyncClick}
              className="px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
              title="Re-aggregate packaging details and refresh all calculations from line items"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Auto-Sync from Line Items</span>
            </button>
          )}

          <button
            type="button"
            id="btn-add-packaging-box"
            onClick={onAddBox}
            className="px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200/80 rounded-lg transition-colors flex items-center gap-1 cursor-pointer shadow-xs active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Box</span>
          </button>
        </div>
      </div>

      {/* Sync confirmation alert */}
      {syncFeedback && (
        <div className="flex items-center gap-2 p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-medium animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{syncFeedback}</span>
        </div>
      )}

      {/* Metrics Summary Strip */}
      {boxes.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-zinc-50/80 p-3.5 rounded-xl border border-zinc-200/70 text-xs">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Total Packaging</span>
            <span className="font-extrabold text-zinc-800 text-sm mt-0.5">
              {boxes.length} {boxes.length === 1 ? 'Entry' : 'Entries'} 
              {totalPhysicalBoxes !== boxes.length && (
                <span className="text-zinc-500 font-medium text-xs ml-1">({totalPhysicalBoxes} Boxes)</span>
              )}
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Total Packed Qty</span>
            <span className="font-extrabold text-blue-600 text-sm mt-0.5">
              {totalPackedQty.toLocaleString()} <span className="text-xs font-semibold text-zinc-500">NOS</span>
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Total Net Weight</span>
            <span className="font-extrabold text-zinc-800 text-sm mt-0.5">
              {totalNetWeight > 0 ? `${totalNetWeight.toFixed(2)} KGS` : '-'}
            </span>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Total Gross Wt</span>
              {overriddenCount > 0 && onResetAll && (
                <button
                  type="button"
                  onClick={onResetAll}
                  className="text-[10px] text-amber-700 hover:text-amber-900 font-bold underline cursor-pointer"
                  title="Reset all manual overrides back to line item calculations"
                >
                  Reset All
                </button>
              )}
            </div>
            <span className="font-extrabold text-zinc-800 text-sm mt-0.5">
              {totalGrossWeight > 0 ? `${totalGrossWeight.toFixed(2)} KGS` : '-'}
            </span>
          </div>
        </div>
      )}

      {/* Main Table */}
      {boxes.length === 0 ? (
        <div className="text-center py-8 px-4 bg-zinc-50 border border-dashed border-zinc-200 rounded-xl space-y-2">
          <Package className="w-8 h-8 text-zinc-400 mx-auto" />
          <p className="text-xs font-bold text-zinc-700">No boxes defined yet</p>
          <p className="text-[11px] text-zinc-500 max-w-md mx-auto">
            Assign <span className="font-semibold text-zinc-700">Packaging / Box No.</span> (e.g. "Box 1" or "Box 1-5") on any line item above, or click "+ Add Box" to create manual packaging entries.
          </p>
          <button
            type="button"
            onClick={onAddBox}
            className="mt-2 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors inline-flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create First Box</span>
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-200">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-zinc-100/80 text-zinc-700 font-extrabold uppercase border-b border-zinc-200 tracking-wider text-[11px]">
                <th className="p-3 w-3/12 min-w-[160px]">Packaging / Box No.</th>
                <th className="p-3 w-3/12 min-w-[160px]">Dimensions (L x W x H)</th>
                <th className="p-3 w-2/12 min-w-[120px]">Net Wt (KGS)</th>
                <th className="p-3 w-2/12 min-w-[120px]">Gross Wt (KGS)</th>
                <th className="p-3 w-1/12 min-w-[100px]">Packed Qty</th>
                <th className="p-3 text-center w-1/12 min-w-[70px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/70 bg-white">
              {boxes.map((box, index) => {
                const isOverridden = box.isOverridden;

                return (
                  <tr 
                    key={box.boxNo || `box-${index}`} 
                    className="hover:bg-zinc-50/70 transition-colors group"
                  >
                    {/* 1. Box Number & Range Badge */}
                    <td className="p-2.5 align-top">
                      <div className="space-y-1">
                        <input
                          type="text"
                          value={box.boxNo}
                          onChange={(e) =>
                            onUpdateBox(index, { boxNo: e.target.value })
                          }
                          placeholder="e.g. Box 1 or Box 1-5"
                          className="w-full px-2.5 py-1.5 font-bold text-zinc-800 bg-white border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs transition-all"
                        />
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {box.isRange && (
                            <span 
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/60"
                              title={`Range encompasses ${box.rangeBoxCount} physical boxes`}
                            >
                              <Layers className="w-2.5 h-2.5" />
                              {box.rangeBoxCount} Boxes
                            </span>
                          )}
                          {box.itemCount > 0 ? (
                            <span 
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-zinc-100 text-zinc-600 border border-zinc-200/60"
                              title={box.itemDescriptions.length > 0 ? `Linked items:\n• ${box.itemDescriptions.join('\n• ')}` : `${box.itemCount} line item(s) mapped`}
                            >
                              {box.itemCount} {box.itemCount === 1 ? 'item' : 'items'}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200/60">
                              Manual Box
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* 2. Dimensions Input */}
                    <td className="p-2.5 align-top">
                      <input
                        type="text"
                        value={box.dimensions}
                        onChange={(e) =>
                          onUpdateBox(index, { dimensions: e.target.value })
                        }
                        placeholder="e.g. 24 x 18 x 12 Inches"
                        className="w-full px-2.5 py-1.5 text-zinc-700 bg-white border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs transition-all"
                      />
                    </td>

                    {/* 3. Net Weight (Auto-calculated with Manual Override) */}
                    <td className="p-2.5 align-top">
                      <div className="space-y-1">
                        <div className="relative">
                          <input
                            type="number"
                            step="any"
                            value={box.isNetOverridden ? box.netWeightOverride : (box.effectiveNetWeight > 0 ? box.effectiveNetWeight : '')}
                            onChange={(e) =>
                              onUpdateBox(index, { netWeightOverride: e.target.value })
                            }
                            placeholder={box.calculatedNetWeight > 0 ? `${box.calculatedNetWeight}` : '0.00'}
                            className={`w-full px-2.5 py-1.5 font-medium rounded-lg text-xs transition-all focus:outline-none focus:ring-2 ${
                              box.isNetOverridden
                                ? 'bg-amber-50/60 border-amber-300 text-amber-900 font-bold focus:ring-amber-500/20 focus:border-amber-500'
                                : 'bg-white border-zinc-300 text-zinc-800 focus:ring-blue-500/20 focus:border-blue-500'
                            } border`}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[10px]">
                          {box.isNetOverridden ? (
                            <span className="text-amber-700 font-bold flex items-center gap-0.5">
                              <span>Override</span>
                              {box.calculatedNetWeight > 0 && (
                                <span className="text-zinc-400 font-normal"> (Auto: {box.calculatedNetWeight} kg)</span>
                              )}
                            </span>
                          ) : (
                            <span className="text-emerald-700 font-medium">
                              Auto-calculated
                            </span>
                          )}
                          {box.isNetOverridden && onResetBox && (
                            <button
                              type="button"
                              onClick={() => onUpdateBox(index, { netWeightOverride: '' })}
                              className="text-zinc-400 hover:text-zinc-700 font-semibold cursor-pointer"
                              title="Revert net weight to automatic calculation"
                            >
                              ↺ Auto
                            </button>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* 4. Gross Weight (Auto-calculated with Manual Override) */}
                    <td className="p-2.5 align-top">
                      <div className="space-y-1">
                        <div className="relative">
                          <input
                            type="number"
                            step="any"
                            value={box.isGrossOverridden ? box.grossWeightOverride : (box.effectiveGrossWeight > 0 ? box.effectiveGrossWeight : '')}
                            onChange={(e) =>
                              onUpdateBox(index, { grossWeightOverride: e.target.value })
                            }
                            placeholder={box.calculatedGrossWeight > 0 ? `${box.calculatedGrossWeight}` : '0.00'}
                            className={`w-full px-2.5 py-1.5 font-medium rounded-lg text-xs transition-all focus:outline-none focus:ring-2 ${
                              box.isGrossOverridden
                                ? 'bg-amber-50/60 border-amber-300 text-amber-900 font-bold focus:ring-amber-500/20 focus:border-amber-500'
                                : 'bg-white border-zinc-300 text-zinc-800 focus:ring-blue-500/20 focus:border-blue-500'
                            } border`}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[10px]">
                          {box.isGrossOverridden ? (
                            <span className="text-amber-700 font-bold flex items-center gap-0.5">
                              <span>Override</span>
                              {box.calculatedGrossWeight > 0 && (
                                <span className="text-zinc-400 font-normal"> (Auto: {box.calculatedGrossWeight} kg)</span>
                              )}
                            </span>
                          ) : (
                            <span className="text-emerald-700 font-medium">
                              Auto-calculated
                            </span>
                          )}
                          {box.isGrossOverridden && (
                            <button
                              type="button"
                              onClick={() => onUpdateBox(index, { grossWeightOverride: '' })}
                              className="text-zinc-400 hover:text-zinc-700 font-semibold cursor-pointer"
                              title="Revert gross weight to automatic calculation"
                            >
                              ↺ Auto
                            </button>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* 5. Packed Qty (Auto-calculated with Manual Override) */}
                    <td className="p-2.5 align-top">
                      <div className="space-y-1">
                        <input
                          type="number"
                          step="any"
                          value={box.isQtyOverridden ? box.packedQtyOverride : (box.effectivePackedQty > 0 ? box.effectivePackedQty : '')}
                          onChange={(e) =>
                            onUpdateBox(index, { packedQtyOverride: e.target.value })
                          }
                          placeholder={box.calculatedPackedQty > 0 ? `${box.calculatedPackedQty}` : '0'}
                          className={`w-full px-2.5 py-1.5 font-medium rounded-lg text-xs transition-all focus:outline-none focus:ring-2 ${
                            box.isQtyOverridden
                              ? 'bg-amber-50/60 border-amber-300 text-amber-900 font-bold focus:ring-amber-500/20 focus:border-amber-500'
                              : 'bg-white border-zinc-300 text-zinc-800 focus:ring-blue-500/20 focus:border-blue-500'
                          } border`}
                        />
                        <div className="flex items-center justify-between text-[10px]">
                          {box.isQtyOverridden ? (
                            <span className="text-amber-700 font-bold">Override</span>
                          ) : (
                            <span className="text-emerald-700 font-medium">Auto</span>
                          )}
                          {box.isQtyOverridden && (
                            <button
                              type="button"
                              onClick={() => onUpdateBox(index, { packedQtyOverride: '' })}
                              className="text-zinc-400 hover:text-zinc-700 font-semibold cursor-pointer"
                              title="Revert packed quantity to automatic calculation"
                            >
                              ↺ Auto
                            </button>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* 6. Actions Column */}
                    <td className="p-2.5 align-top text-center">
                      <div className="flex items-center justify-center gap-1 pt-1">
                        {isOverridden && onResetBox && (
                          <button
                            type="button"
                            onClick={() => onResetBox(box.boxNo)}
                            className="p-1.5 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                            title="Reset all overrides for this row back to automatic values"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onRemoveBox(index)}
                          className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Remove this box row"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
