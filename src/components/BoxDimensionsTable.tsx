import React from 'react';

export interface BoxDimension {
  boxNo: string;
  dimensions: string;
  netWeightOverride: string;
  grossWeightOverride: string;
  packedQty: number;
}

interface BoxDimensionsProps {
  boxes: BoxDimension[];
  onUpdateBox: (index: number, updatedBox: BoxDimension) => void;
  onRemoveBox: (index: number) => void;
  onAddBox: () => void;
}

export const BoxDimensionsTable: React.FC<BoxDimensionsProps> = ({
  boxes,
  onUpdateBox,
  onRemoveBox,
  onAddBox,
}) => {
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-base font-bold text-gray-900 uppercase tracking-wide">
            Box Dimensions & Packaging Details
          </h3>
          <p className="text-xs text-gray-500">
            Manage box measurements, net/gross weights, and custom box definitions
          </p>
        </div>
        <button
          type="button"
          onClick={onAddBox}
          className="px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
        >
          + Add Box
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-600 font-semibold uppercase border-b border-gray-200">
              <th className="p-3 w-1/5">Box No.</th>
              <th className="p-3 w-1/3">Dimensions (L x W x H)</th>
              <th className="p-3">Net Weight (kg)</th>
              <th className="p-3">Gross Weight (kg)</th>
              <th className="p-3">Packed Qty</th>
              <th className="p-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {boxes.map((box, index) => (
              <tr key={index} className="hover:bg-gray-50/50 transition-colors">
                {/* 1. Editable Box Number Input */}
                <td className="p-2">
                  <input
                    type="text"
                    value={box.boxNo}
                    onChange={(e) =>
                      onUpdateBox(index, { ...box, boxNo: e.target.value })
                    }
                    placeholder="e.g. Box 1 or Box 6-10"
                    className="w-full px-2 py-1.5 font-semibold text-gray-800 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs"
                  />
                </td>

                {/* 2. Dimensions Input */}
                <td className="p-2">
                  <input
                    type="text"
                    value={box.dimensions}
                    onChange={(e) =>
                      onUpdateBox(index, { ...box, dimensions: e.target.value })
                    }
                    placeholder="e.g. 24 x 18 x 12 Inches"
                    className="w-full px-2 py-1.5 text-gray-700 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                  />
                </td>

                {/* 3. Net Weight Override */}
                <td className="p-2">
                  <input
                    type="text"
                    value={box.netWeightOverride}
                    onChange={(e) =>
                      onUpdateBox(index, { ...box, netWeightOverride: e.target.value })
                    }
                    placeholder="Auto / Override"
                    className="w-full px-2 py-1.5 text-gray-700 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                  />
                </td>

                {/* 4. Gross Weight Override */}
                <td className="p-2">
                  <input
                    type="text"
                    value={box.grossWeightOverride}
                    onChange={(e) =>
                      onUpdateBox(index, { ...box, grossWeightOverride: e.target.value })
                    }
                    placeholder="Auto / Override"
                    className="w-full px-2 py-1.5 text-gray-700 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                  />
                </td>

                {/* 5. Packed Qty */}
                <td className="p-2">
                  <input
                    type="number"
                    value={box.packedQty || ''}
                    onChange={(e) =>
                      onUpdateBox(index, {
                        ...box,
                        packedQty: parseFloat(e.target.value) || 0,
                      })
                    }
                    placeholder="Auto"
                    className="w-full px-2 py-1.5 text-gray-700 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                  />
                </td>

                {/* 6. Delete Row Button */}
                <td className="p-2 text-center">
                  <button
                    type="button"
                    onClick={() => onRemoveBox(index)}
                    className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors cursor-pointer"
                    title="Remove Box"
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
