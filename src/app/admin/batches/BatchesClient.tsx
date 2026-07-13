"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { PageWrapper }             from "@/components/layout/PageWrapper";
import { ConfirmDialog }           from "@/components/admin/ConfirmDialog";
import { CreateBatchModal }        from "@/components/admin/CreateBatchModal";
import type { CreateBatchPayload } from "@/components/admin/CreateBatchModal";
import { cn }                      from "@/lib/utils";
import { formatDate }              from "@/lib/utils";
import { BATCH_MUNICIPALITIES, getNextBatchNumber } from "@/lib/constants";
import type { Batch }              from "@/types";

// ── Toast ─────────────────────────────────────────────────────

interface Toast { id: number; message: string; type: "success" | "error" }

function ToastList({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: number) => void }) {
  return (
    <div className="fixed bottom-5 right-5 z-[70] flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <div key={t.id} className={cn(
          "flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl border text-sm font-semibold pointer-events-auto",
          t.type === "success"
            ? "bg-white border-emerald-200 text-emerald-700"
            : "bg-white border-red-200 text-red-700"
        )}>
          <span>{t.type === "success" ? "✓" : "⚠"}</span>
          {t.message}
          <button onClick={() => onRemove(t.id)} className="ml-2 text-xs opacity-50 hover:opacity-100">✕</button>
        </div>
      ))}
    </div>
  );
}

// ── Slot progress bar ─────────────────────────────────────────

function SlotBar({ filled, total }: { filled: number; total: number }) {
  const pct  = total > 0 ? Math.min((filled / total) * 100, 100) : 0;
  const over = filled > total;
  return (
    <div className="flex items-center gap-2">
      <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden flex-shrink-0">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            over ? "bg-red-500" : pct >= 90 ? "bg-amber-400" : "bg-emerald-500"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={cn(
        "text-[10px] font-black tabular-nums whitespace-nowrap",
        over ? "text-red-600" : "text-gray-600"
      )}>
        {filled}/{total}
      </span>
      {over && (
        <span className="text-[9px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded">
          FULL
        </span>
      )}
    </div>
  );
}

// ── Batch card ────────────────────────────────────────────────

function BatchCard({
  batchName, rows, approvedByMun, onClose, onCancel,
}: {
  batchName:     string;
  rows:          Batch[];
  approvedByMun: Record<string, number>;
  onClose:       (b: Batch) => void;
  onCancel:      (b: Batch) => void;
}) {
  const totalTarget   = rows.reduce((s, r) => s + (r.TARGET_SLOTS || 0), 0);
  const totalApproved = Object.values(approvedByMun).reduce((s, v) => s + v, 0);
  const overallStatus = rows[0]?.STATUS ?? "OPEN";
  const batchDate     = rows[0]?.BATCH_DATE ?? "";

  // Only show municipalities that have a target slot set
  const activeMunicipalities = BATCH_MUNICIPALITIES.filter(m => {
    const row = rows.find(r => r.MUNICIPALITY === m.key);
    return row && (row.TARGET_SLOTS || 0) > 0;
  });

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

      {/* Header */}
      <div className="bg-[#0f3460] px-5 py-4 flex items-center justify-between">
        <div>
          <p className="text-blue-200 text-[10px] font-bold uppercase tracking-widest mb-0.5">
            GIP Batch
          </p>
          <h3 className="text-white font-black text-lg font-mono tracking-widest">
            {batchName}
          </h3>
          <p className="text-blue-300 text-xs mt-0.5">{formatDate(batchDate)}</p>
        </div>

        <div className="flex items-center gap-4">
          {/* Slot counter */}
          <div className="text-right">
            <p className="text-blue-200 text-[10px] font-bold uppercase tracking-widest">
              Approved / Total Slots
            </p>
            <p
              className="text-white font-black text-2xl leading-tight"
              style={{ fontFamily: "var(--font-display, serif)" }}
            >
              {totalApproved}
              <span className="text-blue-300 text-base font-bold">/{totalTarget}</span>
            </p>
          </div>

          {/* Status badge */}
          <span className={cn(
            "text-[10px] font-bold px-3 py-1.5 rounded-full border",
            overallStatus === "OPEN"
              ? "bg-emerald-400/20 text-emerald-300 border-emerald-400/30"
              : overallStatus === "CLOSED"
              ? "bg-amber-400/20 text-amber-300 border-amber-400/30"
              : "bg-red-400/20 text-red-300 border-red-400/30"
          )}>
            {overallStatus}
          </span>
        </div>
      </div>

      {/* Municipality breakdown */}
      <div className="p-5">
        {activeMunicipalities.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 mb-5">
            {activeMunicipalities.map(m => {
              const batchRow = rows.find(r => r.MUNICIPALITY === m.key);
              const target   = batchRow?.TARGET_SLOTS ?? 0;
              const approved = approvedByMun[m.key] ?? 0;
              const isPgb    = m.key === "PGB";
              const isFull   = approved >= target && target > 0;

              return (
                <div
                  key={m.key}
                  className={cn(
                    "flex items-center justify-between px-3 py-2.5 rounded-xl border",
                    isFull
                      ? "bg-emerald-50 border-emerald-200"
                      : isPgb
                      ? "bg-blue-50/50 border-blue-100"
                      : "bg-gray-50/50 border-gray-100"
                  )}
                >
                  <div className="flex items-center gap-1.5 min-w-0 mr-2">
                    {isPgb && (
                      <span className="text-[9px] font-bold text-blue-600 bg-blue-100 px-1.5 rounded flex-shrink-0">
                        PGB
                      </span>
                    )}
                    <span className={cn(
                      "text-xs font-semibold truncate",
                      isPgb ? "text-blue-700" : "text-[#1a1a2e]"
                    )}>
                      {m.label}
                    </span>
                  </div>
                  <SlotBar filled={approved} total={target} />
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-gray-400 mb-4">No municipality slots configured.</p>
        )}

        {/* Action buttons */}
        {overallStatus === "CANCELLED" ? (
          <span className="text-xs text-red-400 font-semibold">
            This batch has been cancelled.
          </span>
        ) : (
          <div className="flex gap-2 flex-wrap">
            {overallStatus === "OPEN" && (
              <button
                onClick={() => onClose(rows[0])}
                className="px-4 py-2 text-xs font-bold text-amber-700 bg-amber-50
                  border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors"
              >
                Close Batch
              </button>
            )}
            {overallStatus === "CLOSED" && (
              <button
                onClick={() => onClose(rows[0])}
                className="px-4 py-2 text-xs font-bold text-emerald-700 bg-emerald-50
                  border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors"
              >
                Re-open Batch
              </button>
            )}
            <button
              onClick={() => onCancel(rows[0])}
              className="px-4 py-2 text-xs font-bold text-red-600 bg-red-50
                border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
            >
              Cancel Batch
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main BatchesClient ────────────────────────────────────────

export default function BatchesClient() {
  const [batches,       setBatches]       = useState<Batch[]>([]);
  const [applicants,    setApplicants]    = useState<{
    MUNICIPALITY: string;
    APPLICATION_STATUS: string;
    BATCH_NAME: string;
  }[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState<string | null>(null);
  const [showCreate,    setShowCreate]    = useState(false);
  const [isCreating,    setIsCreating]    = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    type: "close" | "cancel";
    batch: Batch;
  } | null>(null);
  const [isActioning,   setIsActioning]   = useState(false);
  const [toasts,        setToasts]        = useState<Toast[]>([]);
  const toastId = useRef(0);

  const addToast = useCallback((message: string, type: "success" | "error") => {
    const id = ++toastId.current;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // ── Load data ─────────────────────────────────────────────

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [bRes, aRes] = await Promise.all([
        fetch("/api/gip?action=getBatches",              { cache: "no-store" }),
        fetch("/api/gip?action=getApplicants&pageSize=9999", { cache: "no-store" }),
      ]);
      const bData = await bRes.json();
      const aData = await aRes.json();

      if (bData.success) setBatches(bData.data);
      else setError(bData.error ?? "Failed to load batches");

      if (aData.success) setApplicants(aData.data.data ?? []);
    } catch {
      setError("Network error — could not load data");
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Derived data ──────────────────────────────────────────

  // Group batches by BATCH_NAME (each batch = multiple rows, one per municipality)
  const groupedBatches = useMemo(() => {
    const groups: Record<string, Batch[]> = {};
    batches.forEach(b => {
      const name = b.BATCH_NAME;
      if (!groups[name]) groups[name] = [];
      groups[name].push(b);
    });
    // Sort newest first
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
  }, [batches]);

  // Next batch number for current year
  const nextBatchNumber = useMemo(() => {
    const names = [...new Set(batches.map(b => b.BATCH_NAME))];
    return getNextBatchNumber(names);
  }, [batches]);

  // Approved applicant count per batch per municipality
  const approvedCountsByBatch = useMemo(() => {
    const result: Record<string, Record<string, number>> = {};
    applicants
      .filter(a => a.APPLICATION_STATUS === "APPROVED")
      .forEach(a => {
        if (!result[a.BATCH_NAME]) result[a.BATCH_NAME] = {};
        const mun = a.MUNICIPALITY;
        result[a.BATCH_NAME][mun] = (result[a.BATCH_NAME][mun] || 0) + 1;
      });
    return result;
  }, [applicants]);

  // Summary stats
  const totalSlots    = batches.reduce((s, b) => s + (b.TARGET_SLOTS || 0), 0);
  const totalApproved = applicants.filter(a => a.APPLICATION_STATUS === "APPROVED").length;
  const openBatches   = [...new Set(
    batches.filter(b => b.STATUS === "OPEN").map(b => b.BATCH_NAME)
  )].length;

  // ── Create batch ──────────────────────────────────────────

  const handleCreate = useCallback(async (payload: CreateBatchPayload) => {
    setIsCreating(true);
    try {
      const url = `/api/gip?action=createBatch&data=${encodeURIComponent(JSON.stringify(payload))}`;
      const res  = await fetch(url, { method: "GET", cache: "no-store" });
      const data = await res.json();

      if (data.success) {
        addToast(`${payload.BATCH_NAME} created successfully`, "success");
        setShowCreate(false);
        await loadData();
      } else {
        addToast(data.error ?? "Failed to create batch", "error");
      }
    } catch {
      addToast("Network error — could not create batch", "error");
    }
    setIsCreating(false);
  }, [addToast, loadData]);

  // ── Close / Cancel batch ──────────────────────────────────

  const handleStatusChange = useCallback(async () => {
    if (!confirmAction) return;
    setIsActioning(true);

    const newStatus = confirmAction.type === "close" ? "CLOSED" : "CANCELLED";

    try {
      const payload = {
        BATCH_ID: confirmAction.batch.BATCH_ID,
        STATUS:   newStatus,
      };
      const url  = `/api/gip?action=updateBatchStatus&data=${encodeURIComponent(JSON.stringify(payload))}`;
      const res  = await fetch(url, { method: "GET", cache: "no-store" });
      const data = await res.json();

      if (data.success) {
        // Optimistic update — update all rows with this batch name
        setBatches(prev => prev.map(b =>
          b.BATCH_NAME === confirmAction.batch.BATCH_NAME
            ? { ...b, STATUS: newStatus }
            : b
        ));
        addToast(`${confirmAction.batch.BATCH_NAME} is now ${newStatus}`, "success");
      } else {
        addToast(data.error ?? "Update failed", "error");
      }
    } catch {
      addToast("Network error — status not updated", "error");
    }

    setIsActioning(false);
    setConfirmAction(null);
  }, [confirmAction, addToast]);

  // ─────────────────────────────────────────────────────────

  return (
    <PageWrapper>

      {/* Heading */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-black text-[#1a1a2e] tracking-tight">
            Batch Management
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Create batches with per-municipality slot targets.
            Approved applicants fill slots automatically.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#0f3460]
              bg-white border border-gray-200 rounded-lg hover:border-[#0f3460]/30
              hover:bg-[#f0f4ff] transition-all disabled:opacity-50"
          >
            <span className={loading ? "animate-spin" : ""}>↻</span>
            Refresh
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-1.5 text-xs font-bold text-white
              bg-[#0f3460] rounded-lg hover:bg-[#16213e] shadow-md shadow-[#0f3460]/20
              transition-all active:scale-[0.98]"
          >
            <span className="text-base leading-none">⊞</span>
            New Batch
          </button>
        </div>
      </div>

      {/* Summary stats */}
      {batches.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: "Open Batches",   value: openBatches,   color: "text-emerald-600" },
            { label: "Total Slots",    value: totalSlots,    color: "text-[#0f3460]"   },
            { label: "Total Approved", value: totalApproved, color: "text-orange-500"  },
          ].map(s => (
            <div
              key={s.label}
              className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3 text-center"
            >
              <p
                className={cn("text-2xl font-black", s.color)}
                style={{ fontFamily: "var(--font-display, serif)" }}
              >
                {s.value}
              </p>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-4 p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-start gap-3">
          <span className="text-lg flex-shrink-0">⚠️</span>
          <div>
            <p className="font-semibold">Failed to load batches</p>
            <p className="text-xs text-red-600 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && batches.length === 0 && (
        <div className="space-y-4">
          {[1, 2].map(i => (
            <div key={i} className="h-48 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && groupedBatches.length === 0 && (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 py-16 text-center">
          <p className="text-4xl mb-3 opacity-20">⊞</p>
          <p className="text-sm text-gray-400 font-medium">No batches created yet.</p>
          <p className="text-xs text-gray-300 mt-1">
            Click <strong className="text-gray-400">New Batch</strong> to create the first one.
          </p>
        </div>
      )}

      {/* Batch cards */}
      <div className="space-y-4">
        {groupedBatches.map(([batchName, rows]) => (
          <BatchCard
            key={batchName}
            batchName={batchName}
            rows={rows}
            approvedByMun={approvedCountsByBatch[batchName] ?? {}}
            onClose={b  => setConfirmAction({ type: "close",  batch: b })}
            onCancel={b => setConfirmAction({ type: "cancel", batch: b })}
          />
        ))}
      </div>

      {/* Create modal */}
      <CreateBatchModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onSubmit={handleCreate}
        isSubmitting={isCreating}
        nextBatchNumber={nextBatchNumber}
      />

      {/* Confirm dialog */}
      {confirmAction && (
        <ConfirmDialog
          open
          title={confirmAction.type === "close" ? "Close Batch" : "Cancel Batch"}
          message={
            confirmAction.type === "close"
              ? `Close "${confirmAction.batch.BATCH_NAME}"? No new registrations will be accepted.`
              : `Cancel "${confirmAction.batch.BATCH_NAME}"? This cannot be undone.`
          }
          confirmLabel={confirmAction.type === "close" ? "Close Batch" : "Cancel Batch"}
          variant={confirmAction.type === "close" ? "warning" : "danger"}
          isLoading={isActioning}
          onConfirm={handleStatusChange}
          onCancel={() => setConfirmAction(null)}
        />
      )}

      {/* Toasts */}
      <ToastList toasts={toasts} onRemove={removeToast} />

    </PageWrapper>
  );
}