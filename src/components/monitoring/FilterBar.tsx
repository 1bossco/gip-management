"use client";

import { useCallback } from "react";
import { cn }          from "@/lib/utils";
import type { MonitoringFilters } from "@/types";
import { MUNICIPALITIES, SECTORS } from "@/lib/constants";

interface FilterBarProps {
  filters:    MonitoringFilters;
  onChange:   (partial: Partial<MonitoringFilters>) => void;
  total:      number;
  filtered:   number;
  loading:    boolean;
  batches:    string[];          // batch name list from API
}

// ── Compact select ────────────────────────────────────────────

function FilterSelect({
  value, onChange, options, placeholder,
}: {
  value:       string;
  onChange:    (v: string) => void;
  options:     { value: string; label: string }[];
  placeholder: string;
}) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className={cn(
        "h-8 px-2.5 pr-7 text-[11px] font-semibold rounded-lg border bg-white appearance-none",
        "focus:outline-none focus:ring-2 focus:ring-[#0f3460]/20 focus:border-[#0f3460]",
        "transition-colors duration-150 cursor-pointer min-w-0",
        value
          ? "border-[#0f3460]/40 text-[#0f3460] bg-[#f0f4ff]"
          : "border-gray-200 text-gray-500 hover:border-gray-300"
      )}
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 10 10'%3E%3Cpath fill='%23666' d='M5 7L1 3h8z'/%3E%3C/svg%3E")`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 8px center",
      }}
    >
      <option value="">{placeholder}</option>
      {options.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

// ── FilterBar ─────────────────────────────────────────────────

export function FilterBar({ filters, onChange, total, filtered, loading, batches }: FilterBarProps) {
  const activeCount = [
    filters.search,
    filters.municipality,
    filters.sector,
    filters.documentStatus,
    filters.applicationStatus,
    filters.batchName,
  ].filter(Boolean).length;

  const clearAll = useCallback(() => {
    onChange({
      search: "", municipality: "", sector: "",
      documentStatus: "", applicationStatus: "", batchName: "",
    });
  }, [onChange]);

  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-3 space-y-3">

      {/* Top row: search + result count */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="flex-1 relative min-w-0">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 text-sm pointer-events-none">
            ⌕
          </span>
          <input
            type="text"
            value={filters.search}
            onChange={e => onChange({ search: e.target.value })}
            placeholder="Search by name, GIP ID, barangay…"
            className="w-full h-9 pl-8 pr-3 text-sm rounded-xl border border-gray-200 bg-gray-50
              placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0f3460]/20
              focus:border-[#0f3460] focus:bg-white transition-all duration-150"
          />
          {filters.search && (
            <button
              onClick={() => onChange({ search: "" })}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Result count */}
        <div className="flex-shrink-0 flex items-center gap-1.5">
          {loading ? (
            <span className="w-4 h-4 border-2 border-[#0f3460] border-t-transparent rounded-full animate-spin" />
          ) : (
            <span className="text-xs font-black text-[#0f3460]"
              style={{ fontFamily: "var(--font-display, serif)" }}>
              {filtered.toLocaleString()}
            </span>
          )}
          <span className="text-xs text-gray-400 hidden sm:inline">
            {filtered === total ? `of ${total.toLocaleString()}` : `/ ${total.toLocaleString()}`}
          </span>
        </div>
      </div>

      {/* Bottom row: filter dropdowns */}
      <div className="flex flex-wrap gap-2 items-center">
        <FilterSelect
          value={filters.documentStatus}
          onChange={v => onChange({ documentStatus: v as MonitoringFilters["documentStatus"] })}
          placeholder="Doc Status"
          options={[
            { value: "COMPLETE",   label: "✓ Complete"   },
            { value: "INCOMPLETE", label: "⏳ Incomplete" },
          ]}
        />
        <FilterSelect
          value={filters.applicationStatus}
          onChange={v => onChange({ applicationStatus: v as MonitoringFilters["applicationStatus"] })}
          placeholder="App Status"
          options={[
            { value: "PENDING",     label: "⏳ Pending"     },
            { value: "APPROVED",    label: "✓ Approved"    },
            { value: "DISAPPROVED", label: "✕ Disapproved" },
          ]}
        />
        <FilterSelect
          value={filters.municipality}
          onChange={v => onChange({ municipality: v })}
          placeholder="Municipality"
          options={MUNICIPALITIES.map(m => ({ value: m, label: m }))}
        />
        <FilterSelect
          value={filters.sector}
          onChange={v => onChange({ sector: v })}
          placeholder="Sector"
          options={SECTORS.map(s => ({ value: s.value, label: s.label }))}
        />
        {batches.length > 0 && (
          <FilterSelect
            value={filters.batchName}
            onChange={v => onChange({ batchName: v })}
            placeholder="Batch"
            options={batches.map(b => ({ value: b, label: b }))}
          />
        )}

        {/* Clear all */}
        {activeCount > 0 && (
          <button
            onClick={clearAll}
            className="h-8 px-3 text-[11px] font-bold text-red-500 border border-red-200 bg-red-50
              rounded-lg hover:bg-red-100 transition-colors duration-150 flex items-center gap-1.5"
          >
            <span>✕</span>
            Clear ({activeCount})
          </button>
        )}
      </div>
    </div>
  );
}
