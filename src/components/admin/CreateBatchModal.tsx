"use client";

import { useEffect, useRef, useState } from "react";
import { cn }                           from "@/lib/utils";
import { BATCH_MUNICIPALITIES, generateBatchName } from "@/lib/constants";

// ── Types ─────────────────────────────────────────────────────

export interface MunicipalitySlot {
  municipality: string;
  targetSlots:  number;
}

export interface CreateBatchPayload {
  BATCH_NAME: string;
  BATCH_DATE: string;
  SLOTS:      MunicipalitySlot[];
  REMARKS:    string;
}

interface CreateBatchModalProps {
  open:            boolean;
  onClose:         () => void;
  onSubmit:        (payload: CreateBatchPayload) => Promise<void>;
  isSubmitting:    boolean;
  nextBatchNumber: number;
}

// ── CreateBatchModal ──────────────────────────────────────────

export function CreateBatchModal({
  open, onClose, onSubmit, isSubmitting, nextBatchNumber,
}: CreateBatchModalProps) {
  const year = new Date().getFullYear();

  const [batchNumber, setBatchNumber] = useState(nextBatchNumber);
  const [batchDate,   setBatchDate]   = useState(new Date().toISOString().split("T")[0]);
  const [remarks,     setRemarks]     = useState("");
  const [slots, setSlots] = useState<Record<string, number>>(
    Object.fromEntries(BATCH_MUNICIPALITIES.map(m => [m.key, 0]))
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const firstInputRef = useRef<HTMLInputElement>(null);

  // Reset on open
  useEffect(() => {
    if (open) {
      setBatchNumber(nextBatchNumber);
      setBatchDate(new Date().toISOString().split("T")[0]);
      setRemarks("");
      setSlots(Object.fromEntries(BATCH_MUNICIPALITIES.map(m => [m.key, 0])));
      setErrors({});
      setTimeout(() => firstInputRef.current?.focus(), 100);
    }
  }, [open, nextBatchNumber]);

  // Escape to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSubmitting) onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose, isSubmitting]);

  const previewName = generateBatchName(batchNumber, year);
  const totalSlots  = Object.values(slots).reduce((s, v) => s + (v || 0), 0);

  const handleSlotChange = (key: string, val: string) => {
    const num = Math.max(0, parseInt(val) || 0);
    setSlots(prev => ({ ...prev, [key]: num }));
  };

  const handleSetAll = (val: number) => {
    setSlots(Object.fromEntries(BATCH_MUNICIPALITIES.map(m => [m.key, val])));
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!batchNumber || batchNumber < 1) errs.batchNumber = "Required";
    if (!batchDate)                       errs.batchDate   = "Required";
    if (totalSlots === 0)                 errs.slots       = "Set at least 1 slot for any municipality";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const slotRows: MunicipalitySlot[] = BATCH_MUNICIPALITIES
      .filter(m => (slots[m.key] || 0) > 0)
      .map(m => ({ municipality: m.key, targetSlots: slots[m.key] }));

    await onSubmit({
      BATCH_NAME: previewName,
      BATCH_DATE: batchDate,
      SLOTS:      slotRows,
      REMARKS:    remarks,
    });
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-[2px] z-50"
        onClick={!isSubmitting ? onClose : undefined}
      />

      {/* Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl pointer-events-auto
            animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-[#0f3460] rounded-t-2xl px-6 py-4 flex items-center justify-between flex-shrink-0">
            <div>
              <p className="text-blue-200 text-[10px] font-bold uppercase tracking-widest">
                GIP Administration
              </p>
              <h2 className="text-white font-black text-base tracking-tight">
                Create New Batch
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center
                text-white/60 hover:text-white hover:bg-white/20 transition-colors text-sm
                disabled:opacity-40"
            >
              ✕
            </button>
          </div>

          {/* Body — scrollable */}
          <form onSubmit={handleSubmit} noValidate className="flex flex-col flex-1 min-h-0">
            <div className="overflow-y-auto flex-1 p-6 space-y-5 scrollbar-thin">

              {/* Batch name preview */}
              <div className="p-4 rounded-xl bg-[#f0f4ff] border border-[#0f3460]/20 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-[#0f3460]/60 uppercase tracking-widest mb-0.5">
                    Batch Name Preview
                  </p>
                  <p className="text-xl font-black text-[#0f3460] font-mono tracking-widest">
                    {previewName}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">
                    Total Slots
                  </p>
                  <p className="text-2xl font-black text-[#0f3460]"
                    style={{ fontFamily: "var(--font-display, serif)" }}>
                    {totalSlots}
                  </p>
                </div>
              </div>

              {/* Batch number + date */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-[#1a1a2e] uppercase tracking-widest mb-1.5">
                    Batch Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    ref={firstInputRef}
                    type="number"
                    min={1}
                    max={99}
                    value={batchNumber}
                    onChange={e => setBatchNumber(parseInt(e.target.value) || 1)}
                    className={cn(
                      "w-full h-9 px-3 text-sm font-bold rounded-xl border bg-white",
                      "focus:outline-none focus:ring-2 focus:ring-[#0f3460]/20 focus:border-[#0f3460]",
                      errors.batchNumber ? "border-red-300 bg-red-50" : "border-gray-200"
                    )}
                  />
                  {errors.batchNumber && (
                    <p className="text-[10px] text-red-600 mt-1">{errors.batchNumber}</p>
                  )}
                  <p className="text-[10px] text-gray-400 mt-1">
                    Auto-resets to 1 every new year.
                  </p>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-[#1a1a2e] uppercase tracking-widest mb-1.5">
                    Batch Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={batchDate}
                    onChange={e => setBatchDate(e.target.value)}
                    className={cn(
                      "w-full h-9 px-3 text-sm rounded-xl border bg-white",
                      "focus:outline-none focus:ring-2 focus:ring-[#0f3460]/20 focus:border-[#0f3460]",
                      errors.batchDate ? "border-red-300 bg-red-50" : "border-gray-200"
                    )}
                  />
                  {errors.batchDate && (
                    <p className="text-[10px] text-red-600 mt-1">{errors.batchDate}</p>
                  )}
                </div>
              </div>

              {/* Municipality slots table */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[10px] font-black text-[#1a1a2e] uppercase tracking-widest">
                    Target Slots per Municipality <span className="text-red-500">*</span>
                  </label>
                  {/* Quick-fill buttons */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-gray-400">Set all:</span>
                    {[10, 20, 30, 50].map(n => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => handleSetAll(n)}
                        className="px-2 py-0.5 text-[10px] font-bold bg-gray-100 text-gray-600
                          rounded hover:bg-[#0f3460] hover:text-white transition-colors"
                      >
                        {n}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => handleSetAll(0)}
                      className="px-2 py-0.5 text-[10px] font-bold bg-red-50 text-red-500
                        rounded hover:bg-red-100 transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {errors.slots && (
                  <p className="text-[10px] text-red-600 mb-2 flex items-center gap-1">
                    <span>⚠</span> {errors.slots}
                  </p>
                )}

                <div className="border border-gray-100 rounded-xl overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-[#f9fafb] border-b border-gray-100">
                        <th className="px-4 py-2.5 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">
                          Municipality / Office
                        </th>
                        <th className="px-4 py-2.5 text-center text-[10px] font-black uppercase tracking-widest text-gray-400 w-32">
                          Target Slots
                        </th>
                        <th className="px-4 py-2.5 text-center text-[10px] font-black uppercase tracking-widest text-gray-400 w-24">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {BATCH_MUNICIPALITIES.map((m, i) => {
                        const val   = slots[m.key] || 0;
                        const isPgb = m.key === "PGB";
                        return (
                          <tr
                            key={m.key}
                            className={cn(
                              "border-b border-gray-50 last:border-0",
                              i % 2 === 0 ? "bg-white" : "bg-gray-50/40",
                              isPgb ? "bg-blue-50/30" : ""
                            )}
                          >
                            <td className="px-4 py-2.5">
                              <div className="flex items-center gap-2">
                                {isPgb && (
                                  <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                                    PROV
                                  </span>
                                )}
                                <span className={cn(
                                  "text-sm font-semibold",
                                  isPgb ? "text-blue-700" : "text-[#1a1a2e]"
                                )}>
                                  {m.label}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-2 text-center">
                              <input
                                type="number"
                                min={0}
                                max={9999}
                                value={val === 0 ? "" : val}
                                placeholder="0"
                                onChange={e => handleSlotChange(m.key, e.target.value)}
                                className="w-20 h-8 px-2 text-center text-sm font-bold rounded-lg
                                  border border-gray-200 bg-white focus:outline-none
                                  focus:ring-2 focus:ring-[#0f3460]/20 focus:border-[#0f3460]
                                  transition-colors"
                              />
                            </td>
                            <td className="px-4 py-2 text-center">
                              {val > 0 ? (
                                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                                  ✓ Set
                                </span>
                              ) : (
                                <span className="text-[10px] font-medium text-gray-300">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="bg-[#f0f4ff] border-t-2 border-[#0f3460]/20">
                        <td className="px-4 py-3 text-sm font-black text-[#0f3460]">
                          TOTAL
                        </td>
                        <td className="px-4 py-3 text-center text-lg font-black text-[#0f3460]"
                          style={{ fontFamily: "var(--font-display, serif)" }}>
                          {totalSlots}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={cn(
                            "text-[10px] font-bold px-2 py-0.5 rounded-full",
                            totalSlots > 0
                              ? "text-emerald-700 bg-emerald-50"
                              : "text-gray-400 bg-gray-50"
                          )}>
                            {totalSlots > 0
                              ? `${BATCH_MUNICIPALITIES.filter(m => (slots[m.key] || 0) > 0).length} areas`
                              : "None set"}
                          </span>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-[10px] font-black text-[#1a1a2e] uppercase tracking-widest mb-1.5">
                  Remarks
                </label>
                <textarea
                  rows={2}
                  value={remarks}
                  onChange={e => setRemarks(e.target.value)}
                  placeholder="Optional notes about this batch..."
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 bg-white
                    resize-none focus:outline-none focus:ring-2 focus:ring-[#0f3460]/20
                    focus:border-[#0f3460] placeholder:text-gray-300 transition-colors"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50
              flex-shrink-0 rounded-b-2xl">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 h-10 text-sm font-bold rounded-xl border border-gray-200
                  text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || totalSlots === 0}
                className="flex-1 h-10 text-sm font-bold rounded-xl bg-[#0f3460] text-white
                  hover:bg-[#16213e] transition-all shadow-md shadow-[#0f3460]/20
                  disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]
                  flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Creating...
                  </>
                ) : (
                  `Create ${previewName}`
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}