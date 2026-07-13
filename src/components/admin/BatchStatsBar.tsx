"use client";

import { cn }         from "@/lib/utils";
import type { Batch } from "@/types";

interface BatchStatsBarProps {
  batches: Batch[];
}

export function BatchStatsBar({ batches }: BatchStatsBarProps) {
  const total         = batches.length;
  const openCount     = batches.filter(b => b.STATUS === "OPEN").length;
  const closedCount   = batches.filter(b => b.STATUS === "CLOSED").length;
  const cancelledCount = batches.filter(b => b.STATUS === "CANCELLED").length;
  const totalSlots    = batches.reduce((s, b) => s + (b.TARGET_SLOTS ?? 0), 0);
  const filledSlots   = batches.reduce((s, b) => s + (b.TOTAL_APPLICANTS ?? 0), 0);
  const fillPct       = totalSlots > 0 ? Math.round((filledSlots / totalSlots) * 100) : 0;

  const stats = [
    { label: "Total Batches",    value: total,          color: "text-[#0f3460]",   bg: "bg-[#f0f4ff]",     icon: "⊞" },
    { label: "Open",             value: openCount,      color: "text-emerald-700", bg: "bg-emerald-50",    icon: "●" },
    { label: "Closed",           value: closedCount,    color: "text-amber-700",   bg: "bg-amber-50",      icon: "○" },
    { label: "Cancelled",        value: cancelledCount, color: "text-red-600",     bg: "bg-red-50",        icon: "✕" },
    { label: "Total Slots",      value: totalSlots,     color: "text-[#0f3460]",   bg: "bg-gray-50",       icon: "▣" },
    { label: "Filled",           value: filledSlots,    color: "text-[#0f3460]",   bg: "bg-gray-50",       icon: "▤" },
  ];

  return (
    <div className="space-y-3">
      {/* Stat pills */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-2">
        {stats.map(s => (
          <div
            key={s.label}
            className={cn(
              "rounded-xl border border-gray-100 px-3 py-2.5 flex items-center gap-2.5",
              "animate-slide-up",
              s.bg
            )}
          >
            <span className={cn("text-base leading-none flex-shrink-0", s.color)}>{s.icon}</span>
            <div className="min-w-0">
              <p
                className={cn("text-lg font-black leading-none tabular-nums", s.color)}
                style={{ fontFamily: "var(--font-display, serif)" }}
              >
                {s.value.toLocaleString()}
              </p>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mt-0.5 truncate">
                {s.label}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Overall fill bar */}
      {totalSlots > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
              Overall Slot Utilization
            </p>
            <span className="text-xs font-black text-[#0f3460]"
              style={{ fontFamily: "var(--font-display, serif)" }}>
              {fillPct}%
            </span>
          </div>
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-700",
                fillPct >= 90 ? "bg-amber-400" : fillPct >= 100 ? "bg-red-500" : "bg-[#0f3460]"
              )}
              style={{ width: `${Math.min(fillPct, 100)}%` }}
            />
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-[10px] text-gray-400">{filledSlots.toLocaleString()} applicants enrolled</span>
            <span className="text-[10px] text-gray-400">{totalSlots.toLocaleString()} total slots</span>
          </div>
        </div>
      )}
    </div>
  );
}
