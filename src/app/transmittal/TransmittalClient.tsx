"use client";

import { useState, useCallback }       from "react";
import { PageWrapper }                  from "@/components/layout/PageWrapper";
import { TransmittalForm }              from "@/components/transmittal/TransmittalForm";
import { TransmittalPreview }           from "@/components/transmittal/TransmittalPreview";
import { generateTransmittal, isApiSuccess } from "@/lib/api";
import type { TransmittalData, TransmittalFilters } from "@/types";
import { cn }                           from "@/lib/utils";

// ── Empty state ───────────────────────────────────────────────

function EmptyPreview() {
  return (
    <div className="bg-white rounded-2xl border border-dashed border-gray-200 flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-3xl mb-4 shadow-inner">
        ⎙
      </div>
      <p className="text-sm font-bold text-gray-400 mb-1">No transmittal generated yet</p>
      <p className="text-xs text-gray-300 max-w-xs leading-relaxed">
        Select a batch and configure filters on the left, then click
        <strong className="text-gray-400"> Generate Transmittal</strong> to build
        the official endorsement list.
      </p>

      {/* Visual mock of table rows */}
      <div className="mt-8 w-full max-w-sm space-y-2 opacity-30 pointer-events-none">
        {[80, 60, 70, 50, 65].map((w, i) => (
          <div key={i} className="flex gap-2 items-center">
            <div className="w-5 h-3 bg-gray-300 rounded" />
            <div className="w-20 h-3 bg-gray-200 rounded" />
            <div className={`h-3 bg-gray-100 rounded flex-1`} style={{ maxWidth: `${w}%` }} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── History sidebar item ──────────────────────────────────────

function HistoryItem({
  item, onRestore,
}: {
  item:      TransmittalData;
  onRestore: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onRestore}
      className="w-full text-left p-3 rounded-xl border border-gray-100 bg-white
        hover:border-[#0f3460]/20 hover:bg-[#f0f4ff] transition-all duration-150
        group"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-[10px] font-mono font-bold text-[#0f3460] group-hover:text-[#0f3460]">
          {item.transmittalId}
        </p>
        <span className="text-[10px] font-black text-white bg-[#0f3460] px-1.5 py-0.5 rounded flex-shrink-0"
          style={{ fontFamily: "var(--font-display, serif)" }}>
          {item.totalIncluded}
        </span>
      </div>
      <p className="text-[10px] text-gray-500 mt-0.5 truncate">{item.batchName}</p>
      <p className="text-[9px] text-gray-400 mt-0.5">
        {item.sector !== "ALL" ? item.sector : "All Sectors"}
        {item.municipality !== "ALL" ? ` · ${item.municipality}` : ""}
      </p>
    </button>
  );
}

// ── TransmittalClient ─────────────────────────────────────────

export default function TransmittalClient() {
  const [current,      setCurrent]      = useState<TransmittalData | null>(null);
  const [history,      setHistory]      = useState<TransmittalData[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error,        setError]        = useState<string | null>(null);

  const handleGenerate = useCallback(async (filters: TransmittalFilters) => {
    setIsGenerating(true);
    setError(null);

    const res = await generateTransmittal(filters);

    if (isApiSuccess(res)) {
      setCurrent(res.data);
      // Keep last 10 in session history (most recent first)
      setHistory(prev => [res.data, ...prev.filter(h => h.transmittalId !== res.data.transmittalId)].slice(0, 10));
    } else {
      setError(res.error ?? "Failed to generate transmittal.");
    }

    setIsGenerating(false);
  }, []);

  return (
    <PageWrapper noPadding>
      <div className="px-4 lg:px-6 py-5">

        {/* ── Page heading ──────────────────────────── */}
        <div className="mb-5">
          <h1 className="text-xl font-black text-[#1a1a2e] tracking-tight">Transmittal</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Generate official GIP endorsement lists for submission to DOLE or partner agencies.
          </p>
        </div>

        {/* ── Main layout: form + preview + history ─── */}
        <div className="flex gap-4 items-start">

          {/* Left: form + history */}
          <div className="flex-shrink-0 w-64 space-y-4">
            <TransmittalForm
              onGenerate={handleGenerate}
              isGenerating={isGenerating}
            />

            {/* Session history */}
            {history.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
                  Recent · This Session
                </p>
                <div className="space-y-2">
                  {history.map(item => (
                    <HistoryItem
                      key={item.transmittalId}
                      item={item}
                      onRestore={() => setCurrent(item)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: preview area */}
          <div className="flex-1 min-w-0">

            {/* Error */}
            {error && (
              <div className="mb-4 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3">
                <span className="text-red-500 text-lg flex-shrink-0">⚠️</span>
                <div>
                  <p className="text-sm font-bold text-red-700">Generation Failed</p>
                  <p className="text-xs text-red-600 mt-0.5">{error}</p>
                </div>
              </div>
            )}

            {/* Generating overlay hint */}
            {isGenerating && (
              <div className="mb-4 p-4 rounded-xl bg-[#f0f4ff] border border-[#0f3460]/20 flex items-center gap-3">
                <span className="w-5 h-5 border-2 border-[#0f3460] border-t-transparent rounded-full animate-spin flex-shrink-0" />
                <p className="text-xs font-semibold text-[#0f3460]">
                  Building transmittal list from Google Sheets…
                </p>
              </div>
            )}

            {current ? (
              <TransmittalPreview data={current} />
            ) : (
              <EmptyPreview />
            )}
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
