import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Truck, Package, FileText, Calendar, MapPin, Tag, Eye } from 'lucide-react';
import { Button } from './Button';

interface GenerateChallanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (data: {
    numberOfPackages: string;
    despatchDocNo: string;
    transport: string;
    reasonForTransportation: string;
    dispatchDate: string;
    finalDestination: string;
    showPricesInChallan: boolean;
  }) => void;
  initialData: {
    numberOfPackages?: string;
    despatchDocNo?: string;
    transport?: string;
    reasonForTransportation?: string;
    dispatchDate?: string;
    finalDestination?: string;
    showPricesInChallan?: boolean;
  };
}

const REASON_OPTIONS = [
  "Supply",
  "Job Work",
  "Supply on Approval / Demo",
  "Returnable Goods / Repair",
  "Branch / Stock Transfer",
  "Line Sale",
  "Export",
  "Other"
];

export const GenerateChallanModal: React.FC<GenerateChallanModalProps> = ({
  isOpen,
  onClose,
  onGenerate,
  initialData,
}) => {
  const [numberOfPackages, setNumberOfPackages] = useState(initialData.numberOfPackages || "");
  const [despatchDocNo, setDespatchDocNo] = useState(initialData.despatchDocNo || "");
  const [transport, setTransport] = useState(initialData.transport || "");
  const [reasonForTransportation, setReasonForTransportation] = useState(initialData.reasonForTransportation || "Supply");
  const [customReason, setCustomReason] = useState("");
  const [dispatchDate, setDispatchDate] = useState(initialData.dispatchDate || new Date().toISOString().split("T")[0]);
  const [finalDestination, setFinalDestination] = useState(initialData.finalDestination || "");
  const [showPricesInChallan, setShowPricesInChallan] = useState(initialData.showPricesInChallan ?? false);

  useEffect(() => {
    if (isOpen) {
      setNumberOfPackages(initialData.numberOfPackages || "");
      setDespatchDocNo(initialData.despatchDocNo || "");
      setTransport(initialData.transport || "");
      const initReason = initialData.reasonForTransportation || "Supply";
      if (REASON_OPTIONS.includes(initReason)) {
        setReasonForTransportation(initReason);
        setCustomReason("");
      } else {
        setReasonForTransportation("Other");
        setCustomReason(initReason);
      }
      setDispatchDate(initialData.dispatchDate || new Date().toISOString().split("T")[0]);
      setFinalDestination(initialData.finalDestination || "");
      setShowPricesInChallan(initialData.showPricesInChallan ?? false);
    }
  }, [isOpen, initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalReason = reasonForTransportation === "Other" ? (customReason.trim() || "Supply") : reasonForTransportation;
    onGenerate({
      numberOfPackages,
      despatchDocNo,
      transport,
      reasonForTransportation: finalReason,
      dispatchDate,
      finalDestination,
      showPricesInChallan,
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden z-10 border border-zinc-200 my-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 backdrop-blur-md rounded-xl text-white">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold leading-tight">Generate Delivery Challan</h3>
                  <p className="text-xs text-blue-100 font-normal">
                    Enter package, transport, and valuation options for the challan
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Row 1: Package Count & Dispatch Ref */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1.5 flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-blue-600" />
                    Number of Packages / Cartons
                  </label>
                  <input
                    type="text"
                    value={numberOfPackages}
                    onChange={(e) => setNumberOfPackages(e.target.value)}
                    placeholder="e.g. 5 Cartons / 2 Boxes"
                    className="w-full text-xs bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2.5 text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1.5 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    Dispatch Ref / Waybill / LR No.
                  </label>
                  <input
                    type="text"
                    value={despatchDocNo}
                    onChange={(e) => setDespatchDocNo(e.target.value)}
                    placeholder="e.g. LR-987654 / WB-102"
                    className="w-full text-xs bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2.5 text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Row 2: Vehicle/Transporter & Dispatch Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1.5 flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-blue-600" />
                    Vehicle No. / Transporter Name
                  </label>
                  <input
                    type="text"
                    value={transport}
                    onChange={(e) => setTransport(e.target.value)}
                    placeholder="e.g. MH-04-AB-1234 / VRL Logistics"
                    className="w-full text-xs bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2.5 text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1.5 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                    Challan / Dispatch Date
                  </label>
                  <input
                    type="date"
                    value={dispatchDate}
                    onChange={(e) => setDispatchDate(e.target.value)}
                    className="w-full text-xs bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2.5 text-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Row 3: Reason for Transportation & Destination */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1.5 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-blue-600" />
                    Reason for Transportation
                  </label>
                  <select
                    value={reasonForTransportation}
                    onChange={(e) => setReasonForTransportation(e.target.value)}
                    className="w-full text-xs bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2.5 text-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  >
                    {REASON_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                  {reasonForTransportation === "Other" && (
                    <input
                      type="text"
                      value={customReason}
                      onChange={(e) => setCustomReason(e.target.value)}
                      placeholder="Specify reason..."
                      className="mt-2 w-full text-xs bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1.5 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-blue-600" />
                    Destination / Delivery Location
                  </label>
                  <input
                    type="text"
                    value={finalDestination}
                    onChange={(e) => setFinalDestination(e.target.value)}
                    placeholder="e.g. Pune, Maharashtra"
                    className="w-full text-xs bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2.5 text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Price / Amount Visibility Switch */}
              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50/50 border border-blue-200/70 rounded-xl">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex gap-3">
                    <div className="p-2 bg-blue-100/80 text-blue-700 rounded-lg shrink-0 mt-0.5">
                      <Eye className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-zinc-900">
                        Include Price / Amount in Delivery Challan
                      </div>
                      <p className="text-[11px] text-zinc-500 leading-snug mt-0.5">
                        When unchecked, unit rates, taxes, subtotal, and total amounts will be hidden on the generated Delivery Challan.
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                    <input
                      type="checkbox"
                      checked={showPricesInChallan}
                      onChange={(e) => setShowPricesInChallan(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-zinc-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-3 flex items-center justify-end gap-3 border-t border-zinc-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-bold text-zinc-600 hover:bg-zinc-100 border-zinc-200"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  <span>Generate & View Challan</span>
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
