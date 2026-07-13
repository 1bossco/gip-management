"use client";

import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/utils";

interface DashboardHeaderProps {
  lastUpdated:  Date | null;
  loading:      boolean;
  onRefresh:    () => void;
}

export function DashboardHeader({ lastUpdated, loading, onRefresh }: DashboardHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-xl font-black text-[#1a1a2e] tracking-tight leading-tight">
          Overview
        </h1>
        <p className="text-xs text-gray-400 mt-0.5">
          {lastUpdated
            ? `Last updated ${formatDateTime(lastUpdated.toISOString())}`
            : "Loading data…"}
        </p>
      </div>

      <div className="flex items-center gap-3">
        {/* Live indicator */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 border border-emerald-100">
          <span className={cn(
            "w-1.5 h-1.5 rounded-full flex-shrink-0",
            loading ? "bg-amber-400 animate-pulse" : "bg-emerald-500 animate-pulse"
          )} />
          <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
            {loading ? "Updating" : "Live"}
          </span>
        </div>

        {/* Refresh button */}
        <button
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#0f3460] bg-white border border-gray-200 rounded-lg hover:border-[#0f3460]/30 hover:bg-[#f0f4ff] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className={cn("text-sm", loading && "animate-spin")}>↻</span>
          Refresh
        </button>
      </div>
    </div>
  );
}
