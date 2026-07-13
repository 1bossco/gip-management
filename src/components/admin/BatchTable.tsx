"use client";

import { useState }     from "react";
import { cn }           from "@/lib/utils";
import { formatDate }   from "@/lib/utils";
import { StatusBadge }  from "@/components/ui";
import type { Batch }   from "@/types";

interface BatchTableProps {
  batches:   Batch[];
  loading:   boolean;
  onOpen:    (batch: Batch) => void;
  onClose:   (batch: Batch) => void;
  onCancel:  (batch: Batch) => void;
  onSelect:  (batch: Batch) => void;
  selected?: string;
}

type SortKey = keyof Batch;
type SortDir = "asc" | "desc";

function ColHeader({
  label, sortKey, current, onSort, align = "left",
}: {
  label:    string;
  sortKey?: SortKey;
  current:  { key: SortKey; dir: SortDir };
  onSort:   (k: SortKey) => void;
  align?:   "left" | "center" | "right";
}) {
  const active = sortKey && current.key === sortKey;
  return (
    <th className={cn(
      "px-4 py-3 text-[10px] font-black uppercase tracking-widest whitespace-nowrap",
      "border-b border-gray-100 bg-[#f9fafb]",
      align === "center" ? "text-center" : align === "right" ? "text-right" : "text-left",
      sortKey ? "cursor-pointer select-none hover:bg-gray-100 transition-colors" : "",
      active ? "text-[#0f3460]" : "text-gray-400"
    )}
      onClick={() => sortKey && onSort(sortKey)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {sortKey && (
          <span className={cn("text-[9px]", active ? "opacity-100" : "opacity-20")}>
            {active && current.dir === "asc" ? "▲" : "▼"}
          </span>
        )}
      </span>
    </th>
  );
}

function SkeletonRows() {
  return (
    <>
      {[1,2,3,4,5].map(i => (
        <tr key={i} className="border-b border-gray-50">
          {[120, 100, 80, 60, 100, 80, 80, 90].map((w, j) => (
            <td key={j} className="px-4 py-3.5">
              <div className="h-3 bg-gray-100 rounded animate-pulse" style={{ width: w }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

// ── Slot progress bar ─────────────────────────────────────────

function SlotBar({ filled, total }: { filled: number; total: number }) {
  const pct  = total > 0 ? Math.min((filled / total) * 100, 100) : 0;
  const over = filled > total;
  return (
    <div className="flex items-center gap-2 min-w-[120px]">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            over        ? "bg-red-500"     :
            pct >= 90   ? "bg-amber-400"   :
            pct >= 50   ? "bg-[#0f3460]"   : "bg-emerald-400"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={cn(
        "text-[10px] font-black tabular-nums whitespace-nowrap",
        over ? "text-red-600" : "text-gray-500"
      )}>
        {filled}/{total}
      </span>
    </div>
  );
}

// ── Row action buttons ────────────────────────────────────────

function ActionBtn({
  label, onClick, variant,
}: {
  label:   string;
  onClick: (e: React.MouseEvent) => void;
  variant: "open" | "close" | "cancel";
}) {
  const styles = {
    open:   "text-emerald-600 hover:bg-emerald-50 border-emerald-200",
    close:  "text-amber-600   hover:bg-amber-50   border-amber-200",
    cancel: "text-red-500     hover:bg-red-50     border-red-200",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "px-2.5 py-1 text-[10px] font-bold rounded-lg border transition-all duration-150",
        styles[variant]
      )}
    >
      {label}
    </button>
  );
}

// ── BatchTable ────────────────────────────────────────────────

export function BatchTable({
  batches, loading, onOpen, onClose, onCancel, onSelect, selected,
}: BatchTableProps) {
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({
    key: "BATCH_DATE", dir: "desc",
  });

  const handleSort = (key: SortKey) => {
    setSort(prev =>
      prev.key === key
        ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "desc" }
    );
  };

  const sorted = [...batches].sort((a, b) => {
    const va = a[sort.key];
    const vb = b[sort.key];
    if (va == null) return 1;
    if (vb == null) return -1;
    const cmp = String(va).localeCompare(String(vb), undefined, { numeric: true });
    return sort.dir === "asc" ? cmp : -cmp;
  });

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full min-w-[700px]">
          <thead>
            <tr>
              <ColHeader label="Batch ID"   sortKey="BATCH_ID"        current={sort} onSort={handleSort} />
              <ColHeader label="Batch Name" sortKey="BATCH_NAME"      current={sort} onSort={handleSort} />
              <ColHeader label="Date"       sortKey="BATCH_DATE"      current={sort} onSort={handleSort} />
              <ColHeader label="Sector"     sortKey="SECTOR"          current={sort} onSort={handleSort} />
              <ColHeader label="Slots"      sortKey="TOTAL_APPLICANTS" current={sort} onSort={handleSort} />
              <ColHeader label="Status"     sortKey="STATUS"          current={sort} onSort={handleSort} align="center" />
              <ColHeader label="Remarks"    current={sort} onSort={handleSort} />
              <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-100 bg-[#f9fafb] text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {loading && batches.length === 0 ? (
              <SkeletonRows />
            ) : sorted.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-3xl opacity-20">⊞</span>
                    <span className="text-xs text-gray-400">No batches created yet.</span>
                  </div>
                </td>
              </tr>
            ) : (
              sorted.map(batch => {
                const isSelected = batch.BATCH_ID === selected;
                return (
                  <tr
                    key={batch.BATCH_ID}
                    onClick={() => onSelect(batch)}
                    className={cn(
                      "border-b border-gray-50 cursor-pointer transition-colors duration-100",
                      isSelected
                        ? "bg-[#f0f4ff] border-l-2 border-l-[#0f3460]"
                        : "hover:bg-gray-50/80"
                    )}
                  >
                    {/* Batch ID */}
                    <td className="px-4 py-3">
                      <span className="font-mono text-[11px] font-bold text-gray-400">
                        {batch.BATCH_ID}
                      </span>
                    </td>

                    {/* Batch Name */}
                    <td className="px-4 py-3">
                      <span className="text-xs font-black text-[#0f3460]">{batch.BATCH_NAME}</span>
                    </td>

                    {/* Date */}
                    <td className="px-4 py-3">
                      <span className="text-xs text-gray-500 whitespace-nowrap">
                        {formatDate(batch.BATCH_DATE)}
                      </span>
                    </td>

                    {/* Sector */}
                    <td className="px-4 py-3">
                      <span className="text-[11px] text-gray-600">
                        {batch.SECTOR === "ALL" ? "All Sectors" : batch.SECTOR}
                      </span>
                    </td>

                    {/* Slot bar */}
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <SlotBar filled={batch.TOTAL_APPLICANTS} total={batch.TARGET_SLOTS} />
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3 text-center">
                      <StatusBadge status={batch.STATUS} size="sm" />
                    </td>

                    {/* Remarks */}
                    <td className="px-4 py-3 max-w-[160px]">
                      <span className="text-[11px] text-gray-400 line-clamp-1">
                        {batch.REMARKS || "—"}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        {batch.STATUS === "CLOSED" && (
                          <ActionBtn label="Re-open" onClick={() => onOpen(batch)} variant="open" />
                        )}
                        {batch.STATUS === "OPEN" && (
                          <ActionBtn label="Close" onClick={() => onClose(batch)} variant="close" />
                        )}
                        {batch.STATUS !== "CANCELLED" && (
                          <ActionBtn label="Cancel" onClick={() => onCancel(batch)} variant="cancel" />
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
