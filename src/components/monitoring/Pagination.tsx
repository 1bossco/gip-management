"use client";

import { cn }                from "@/lib/utils";
import { PAGE_SIZE_OPTIONS } from "@/lib/constants";

interface PaginationProps {
  page:      number;
  pageSize:  number;
  total:     number;
  totalPages: number;
  onPage:    (p: number) => void;
  onSize:    (s: number) => void;
}

export function Pagination({
  page, pageSize, total, totalPages, onPage, onSize,
}: PaginationProps) {
  const from  = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to    = Math.min(page * pageSize, total);

  // Build page window: always show first, last, current ±1
  const pages = new Set([1, totalPages, page, page - 1, page + 1].filter(p => p >= 1 && p <= totalPages));
  const pageList = [...pages].sort((a, b) => a - b);

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white border border-gray-100 rounded-2xl shadow-sm">

      {/* Range + size selector */}
      <div className="flex items-center gap-3">
        <p className="text-xs text-gray-400 hidden sm:block">
          <span className="font-bold text-[#1a1a2e]">{from.toLocaleString()}–{to.toLocaleString()}</span>
          {" "}of{" "}
          <span className="font-bold text-[#1a1a2e]">{total.toLocaleString()}</span>
        </p>
        <select
          value={pageSize}
          onChange={e => onSize(Number(e.target.value))}
          className="h-7 px-2 text-[11px] font-semibold rounded-lg border border-gray-200 bg-white
            focus:outline-none focus:ring-2 focus:ring-[#0f3460]/20 cursor-pointer"
        >
          {PAGE_SIZE_OPTIONS.map(s => (
            <option key={s} value={s}>{s} / page</option>
          ))}
        </select>
      </div>

      {/* Page buttons */}
      <div className="flex items-center gap-1">
        <PageBtn
          label="←"
          onClick={() => onPage(page - 1)}
          disabled={page <= 1}
        />
        {pageList.map((p, i) => {
          const prev = pageList[i - 1];
          return (
            <div key={p} className="flex items-center gap-1">
              {/* Gap indicator */}
              {prev && p - prev > 1 && (
                <span className="text-gray-300 text-xs px-1">…</span>
              )}
              <PageBtn
                label={String(p)}
                onClick={() => onPage(p)}
                active={p === page}
              />
            </div>
          );
        })}
        <PageBtn
          label="→"
          onClick={() => onPage(page + 1)}
          disabled={page >= totalPages}
        />
      </div>
    </div>
  );
}

function PageBtn({
  label, onClick, disabled, active,
}: {
  label:     string;
  onClick:   () => void;
  disabled?: boolean;
  active?:   boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "w-7 h-7 text-[11px] font-bold rounded-lg transition-all duration-150",
        "focus:outline-none focus:ring-2 focus:ring-[#0f3460]/20",
        active
          ? "bg-[#0f3460] text-white shadow-md"
          : disabled
          ? "text-gray-200 cursor-not-allowed"
          : "text-gray-500 hover:bg-gray-100 hover:text-[#0f3460]"
      )}
    >
      {label}
    </button>
  );
}
