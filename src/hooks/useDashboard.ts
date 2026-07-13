// ============================================================
// useDashboard — Dashboard stats fetcher with date range filter
// Passes date range to API for exact server-side filtering
// ============================================================

"use client";

import { useState, useEffect, useCallback } from "react";
import { isApiSuccess } from "@/lib/api";
import type { ApiResponse, DashboardStats } from "@/types";

export interface DashboardDateRange {
  from: string; // yyyy-MM-dd or "" for all time
  to:   string; // yyyy-MM-dd or "" for all time
}

interface UseDashboardReturn {
  stats:       DashboardStats | null;
  loading:     boolean;
  error:       string | null;
  refresh:     () => Promise<void>;
  lastUpdated: Date | null;
  dateRange:   DashboardDateRange;
  setDateRange:(r: DashboardDateRange) => void;
}

const REFRESH_INTERVAL_MS = 5 * 60 * 1000;

export function useDashboard(): UseDashboardReturn {
  const [stats,       setStats]       = useState<DashboardStats | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [dateRange,   setDateRange]   = useState<DashboardDateRange>({ from: "", to: "" });

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Build query params — proxy route handles forwarding to GAS
      const params = new URLSearchParams({ action: "getDashboard" });
      if (dateRange.from) params.set("from", dateRange.from);
      if (dateRange.to)   params.set("to",   dateRange.to);

      const res = await fetch(`/api/gip?${params.toString()}`, {
        method: "GET",
        cache:  "no-store",
      });

      const data = (await res.json()) as ApiResponse<DashboardStats>;

      if (isApiSuccess(data)) {
        setStats(data.data);
        setLastUpdated(new Date());
      } else {
        setError(data.error ?? "Failed to load dashboard");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  // Re-fetch whenever date range changes
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Auto-refresh every 5 min (only when "all time" to avoid hammering API)
  useEffect(() => {
    if (dateRange.from || dateRange.to) return;
    const interval = setInterval(refresh, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [refresh, dateRange]);

  return { stats, loading, error, refresh, lastUpdated, dateRange, setDateRange };
}