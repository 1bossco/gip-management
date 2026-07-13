// ============================================================
// useApplicants — Fetches ALL applicants once, filters client-side
// Monitoring tabs filter locally for instant switching
// ============================================================

"use client";

import { useState, useEffect, useCallback } from "react";
import { getApplicants, isApiSuccess }       from "@/lib/api";
import type { ApplicantRow }                 from "@/types";

interface UseApplicantsReturn {
  rows:           ApplicantRow[];
  total:          number;
  page:           number;
  pageSize:       number;
  totalPages:     number;
  loading:        boolean;
  error:          string | null;
  filters:        Record<string, string>;
  setFilters:     (f: Record<string, string>) => void;
  setPage:        (p: number) => void;
  setPageSize:    (s: number) => void;
  refresh:        () => void;
  updateRowLocally: (gipId: string, patch: Partial<ApplicantRow>) => void;
}

export function useApplicants(): UseApplicantsReturn {
  const [rows,    setRows]    = useState<ApplicantRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch all records in one call (large pageSize)
      const res = await getApplicants({ page: 1, pageSize: 9999 });
      if (isApiSuccess(res)) {
        setRows(res.data.data);
      } else {
        setError(res.error);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load applicants");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const updateRowLocally = useCallback((gipId: string, patch: Partial<ApplicantRow>) => {
    setRows(prev => prev.map(r => r.GIP_ID === gipId ? { ...r, ...patch } : r));
  }, []);

  return {
    rows,
    total:      rows.length,
    page:       1,
    pageSize:   9999,
    totalPages: 1,
    loading,
    error,
    filters:    {},
    setFilters: () => {},
    setPage:    () => {},
    setPageSize: () => {},
    refresh:    fetchAll,
    updateRowLocally,
  };
}