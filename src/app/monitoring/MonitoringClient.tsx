"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useApplicants }          from "@/hooks/useApplicants";
import { getBatches, isApiSuccess, approveApplicant } from "@/lib/api";
import { PageWrapper }            from "@/components/layout/PageWrapper";
import { ApplicantDrawer }        from "@/components/monitoring/ApplicantDrawer";
import { Pagination }             from "@/components/monitoring/Pagination";
import { StatusBadge }            from "@/components/ui";
import { useAuth }                from "@/hooks/useAuth";
import { formatDate }             from "@/lib/utils";
import { cn }                     from "@/lib/utils";
import { MUNICIPALITIES }         from "@/lib/constants";
import type { ApplicantRow }      from "@/types";

// ── Tab type ──────────────────────────────────────────────────
type TabKey = "all" | "pending" | "completed" | "approved";

// ── Stats bar ─────────────────────────────────────────────────
function StatsBar({ rows }: { rows: ApplicantRow[] }) {
  const total     = rows.length;
  const pending   = rows.filter(r => r.DOCUMENT_STATUS === "INCOMPLETE").length;
  const completed = rows.filter(r => r.DOCUMENT_STATUS === "COMPLETE").length;
  const approved  = rows.filter(r => r.APPLICATION_STATUS === "APPROVED").length;

  const stats = [
    { label: "TOTAL",     value: total,     color: "text-white" },
    { label: "PENDING",   value: pending,   color: "text-amber-400" },
    { label: "COMPLETED", value: completed, color: "text-emerald-400" },
    { label: "APPROVED",  value: approved,  color: "text-orange-400" },
  ];

  return (
    <div className="bg-[#0f3460] rounded-2xl shadow-lg overflow-hidden">
      <div className="grid grid-cols-4 divide-x divide-white/10">
        {stats.map((s, i) => (
          <div key={s.label} className="flex flex-col items-center py-5 px-4">
            <p className={cn("text-3xl font-black leading-none", s.color)}
              style={{ fontFamily: "var(--font-display, serif)" }}>
              {s.value}
            </p>
            <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mt-1.5">
              {s.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Tab bar ───────────────────────────────────────────────────
function TabBar({
  active, onChange, counts,
}: {
  active:   TabKey;
  onChange: (t: TabKey) => void;
  counts:   Record<TabKey, number>;
}) {
  const tabs: { key: TabKey; label: string; icon: string }[] = [
    { key: "all",       label: "Submitted", icon: "📋" },
    { key: "pending",   label: "Pending",   icon: "⏳" },
    { key: "completed", label: "Completed", icon: "✓"  },
    { key: "approved",  label: "Approved",  icon: "🎓" },
  ];

  return (
    <div className="flex gap-2 flex-wrap">
      {tabs.map(t => (
        <button
          key={t.key}
          type="button"
          onClick={() => onChange(t.key)}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-150",
            "border focus:outline-none",
            active === t.key
              ? "bg-[#0f3460] text-white border-[#0f3460] shadow-md shadow-[#0f3460]/20"
              : "bg-white text-gray-500 border-gray-200 hover:border-[#0f3460]/30 hover:text-[#0f3460]"
          )}
        >
          <span className="text-base leading-none">{t.icon}</span>
          {t.label}
          <span className={cn(
            "text-xs font-black px-1.5 py-0.5 rounded-full",
            active === t.key
              ? "bg-white/20 text-white"
              : "bg-gray-100 text-gray-500"
          )}>
            {counts[t.key]}
          </span>
        </button>
      ))}
    </div>
  );
}

// ── Sub-filter bar (municipality, sex, search) ────────────────
function SubFilter({
  search, municipality, sex,
  onSearch, onMunicipality, onSex,
}: {
  search:          string;
  municipality:    string;
  sex:             string;
  onSearch:        (v: string) => void;
  onMunicipality:  (v: string) => void;
  onSex:           (v: string) => void;
}) {
  const selectClass = cn(
    "h-8 px-2.5 pr-7 text-[11px] font-semibold rounded-lg border bg-white appearance-none",
    "focus:outline-none focus:ring-2 focus:ring-[#0f3460]/20 focus:border-[#0f3460]",
    "transition-colors duration-150 cursor-pointer"
  );
  const arrowStyle = {
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 10 10'%3E%3Cpath fill='%23666' d='M5 7L1 3h8z'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat" as const,
    backgroundPosition: "right 8px center" as const,
  };

  const hasFilter = search || municipality || sex;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3 flex flex-wrap items-center gap-2">
      {/* Search */}
      <div className="flex-1 min-w-[200px] relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 text-sm pointer-events-none">⌕</span>
        <input
          type="text"
          value={search}
          onChange={e => onSearch(e.target.value)}
          placeholder="Search by name or GIP ID…"
          className="w-full h-9 pl-8 pr-3 text-sm rounded-xl border border-gray-200 bg-gray-50
            placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0f3460]/20
            focus:border-[#0f3460] focus:bg-white transition-all duration-150"
        />
        {search && (
          <button onClick={() => onSearch("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 text-xs">✕</button>
        )}
      </div>

      {/* Municipality */}
      <select value={municipality} onChange={e => onMunicipality(e.target.value)}
        className={cn(selectClass, municipality ? "border-[#0f3460]/40 text-[#0f3460] bg-[#f0f4ff]" : "border-gray-200 text-gray-500")}
        style={arrowStyle}>
        <option value="">All Municipalities</option>
        {MUNICIPALITIES.map(m => <option key={m} value={m}>{m}</option>)}
      </select>

      {/* Sex */}
      <select value={sex} onChange={e => onSex(e.target.value)}
        className={cn(selectClass, sex ? "border-[#0f3460]/40 text-[#0f3460] bg-[#f0f4ff]" : "border-gray-200 text-gray-500")}
        style={arrowStyle}>
        <option value="">All (Male & Female)</option>
        <option value="MALE">👨 Male</option>
        <option value="FEMALE">👩 Female</option>
      </select>

      {/* Clear */}
      {hasFilter && (
        <button onClick={() => { onSearch(""); onMunicipality(""); onSex(""); }}
          className="h-8 px-3 text-[11px] font-bold text-red-500 border border-red-200 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">
          ✕ Clear
        </button>
      )}
    </div>
  );
}

// ── Approve/Disapprove inline buttons ─────────────────────────
function ApprovalButtons({
  row, onUpdate,
}: {
  row:      ApplicantRow;
  onUpdate: (gipId: string, patch: Partial<ApplicantRow>) => void;
}) {
  const { user }              = useAuth();
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const handle = async (e: React.MouseEvent, action: "APPROVE" | "DISAPPROVE") => {
    e.stopPropagation(); // prevent row click / drawer open
    setLoading(true);
    setError(null);

    // Use user name if available, fall back to "Admin"
    const approvedBy = user?.FULL_NAME || user?.USERNAME || "Admin";

    try {
      const res = await approveApplicant({
        GIP_ID:     row.GIP_ID,
        action,
        approvedBy,
      });

      if (isApiSuccess(res)) {
        // Update row locally — triggers re-render and tab count update
        onUpdate(row.GIP_ID, {
          APPLICATION_STATUS: res.data.APPLICATION_STATUS,
          APPROVED_BY:        res.data.APPROVED_BY   as never,
          DATE_APPROVED:      res.data.DATE_APPROVED  as never,
        });
      } else {
        setError(res.error ?? "Action failed");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setLoading(false);
    }
  };

  // Already approved
  if (row.APPLICATION_STATUS === "APPROVED") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
        ✓ Approved
      </span>
    );
  }

  // Already disapproved
  if (row.APPLICATION_STATUS === "DISAPPROVED") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-50 border border-red-200 px-2.5 py-1 rounded-lg">
        ✕ Disapproved
      </span>
    );
  }

  return (
    <div className="flex flex-col gap-1.5 min-w-[140px]">
      {error && (
        <p className="text-[9px] text-red-500 font-medium">{error}</p>
      )}
      <div className="flex gap-1.5">
        <button
          disabled={loading}
          onClick={e => handle(e, "APPROVE")}
          className="flex-1 px-3 py-1.5 text-[11px] font-bold bg-emerald-500 text-white rounded-lg
            hover:bg-emerald-600 active:scale-95 transition-all disabled:opacity-40
            disabled:cursor-not-allowed whitespace-nowrap shadow-sm shadow-emerald-200"
        >
          {loading ? (
            <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : "✓ Approve"}
        </button>
        <button
          disabled={loading}
          onClick={e => handle(e, "DISAPPROVE")}
          className="flex-1 px-3 py-1.5 text-[11px] font-bold bg-red-500 text-white rounded-lg
            hover:bg-red-600 active:scale-95 transition-all disabled:opacity-40
            disabled:cursor-not-allowed whitespace-nowrap shadow-sm shadow-red-200"
        >
          {loading ? (
            <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : "✕ Reject"}
        </button>
      </div>
    </div>
  );
}

// ── Applicant table per tab ───────────────────────────────────
function MonitoringTable({
  rows, loading, tab, onRowClick, onUpdate, selectedId,
}: {
  rows:       ApplicantRow[];
  loading:    boolean;
  tab:        TabKey;
  onRowClick: (r: ApplicantRow) => void;
  onUpdate:   (gipId: string, patch: Partial<ApplicantRow>) => void;
  selectedId?: string;
}) {
  const showApproval = tab === "completed";

  if (loading && rows.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {[1,2,3,4,5].map(i => (
          <div key={i} className="flex gap-4 px-4 py-3 border-b border-gray-50">
            {[1,2,3,4,5].map(j => (
              <div key={j} className="h-3.5 bg-gray-100 rounded animate-pulse flex-1" />
            ))}
          </div>
        ))}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-16 text-center">
        <p className="text-3xl mb-3 opacity-20">📋</p>
        <p className="text-sm text-gray-400 font-medium">No applicants in this section.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full min-w-[700px] text-sm">
          <thead>
            <tr className="bg-[#f9fafb] border-b border-gray-100">
              <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">GIP ID</th>
              <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Name</th>
              <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Municipality</th>
              <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Sex</th>
              <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Batch</th>
              <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Doc Status</th>
              <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Registered</th>
              {tab === "pending" && (
                <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Missing</th>
              )}
              {showApproval && (
                <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Action</th>
              )}
              {tab === "approved" && (
                <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Status</th>
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr
                key={row.GIP_ID}
                onClick={() => onRowClick(row)}
                className={cn(
                  "border-b border-gray-50 transition-colors duration-100 cursor-pointer",
                  row.GIP_ID === selectedId
                    ? "bg-[#f0f4ff] border-l-2 border-l-[#0f3460]"
                    : "hover:bg-gray-50/80"
                )}
              >
                <td className="px-4 py-3">
                  <span className="font-mono text-[11px] font-bold text-[#0f3460]">{row.GIP_ID}</span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <p className="text-xs font-bold text-[#1a1a2e]">{row.SURNAME}, {row.FIRST_NAME}</p>
                  {row.MIDDLE_NAME && <p className="text-[10px] text-gray-400">{row.MIDDLE_NAME}</p>}
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs text-gray-600">{row.MUNICIPALITY}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded-full",
                    row.SEX === "MALE"
                      ? "bg-blue-50 text-blue-700"
                      : row.SEX === "FEMALE"
                      ? "bg-pink-50 text-pink-700"
                      : "bg-gray-50 text-gray-400"
                  )}>
                    {row.SEX || "—"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-[10px] font-mono text-gray-500">{row.BATCH_NAME || "—"}</span>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={row.DOCUMENT_STATUS} size="sm" />
                </td>
                <td className="px-4 py-3">
                  <span className="text-[11px] text-gray-400 whitespace-nowrap">{formatDate(row.DATE_REGISTERED)}</span>
                </td>
                {tab === "pending" && (
                  <td className="px-4 py-3 max-w-[180px]">
                    <p className="text-[10px] text-amber-600 font-medium truncate">
                      {row.MISSING_DOCUMENTS || "—"}
                    </p>
                  </td>
                )}
                {showApproval && (
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                    <ApprovalButtons row={row} onUpdate={onUpdate} />
                  </td>
                )}
                {tab === "approved" && (
                  <td className="px-4 py-3">
                    <StatusBadge status={row.APPLICATION_STATUS} size="sm" />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Main MonitoringClient ─────────────────────────────────────
export default function MonitoringClient() {
  const {
    rows, total, page, pageSize, totalPages,
    loading, error, refresh, updateRowLocally,
  } = useApplicants();

  const [activeTab,    setActiveTab]    = useState<TabKey>("all");
  const [selectedRow,  setSelectedRow]  = useState<ApplicantRow | null>(null);
  const [search,       setSearch]       = useState("");
  const [municipality, setMunicipality] = useState("");
  const [sex,          setSex]          = useState("");

  // Keep drawer in sync with optimistic updates
  const handleUpdate = useCallback((gipId: string, patch: Partial<ApplicantRow>) => {
    updateRowLocally(gipId, patch);
    setSelectedRow(prev => prev?.GIP_ID === gipId ? { ...prev, ...patch } : prev);
  }, [updateRowLocally]);

  // Filter rows by tab
  const tabRows = useMemo(() => {
    switch (activeTab) {
      case "pending":   return rows.filter(r => r.DOCUMENT_STATUS === "INCOMPLETE");
      case "completed": return rows.filter(r => r.DOCUMENT_STATUS === "COMPLETE");
      case "approved":  return rows.filter(r => r.APPLICATION_STATUS === "APPROVED");
      default:          return rows;
    }
  }, [rows, activeTab]);

  // Apply sub-filters (search, municipality, sex)
  const filteredRows = useMemo(() => {
    return tabRows.filter(r => {
      if (search) {
        const q = search.toLowerCase();
        const hay = `${r.GIP_ID} ${r.SURNAME} ${r.FIRST_NAME} ${r.MIDDLE_NAME}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (municipality && r.MUNICIPALITY !== municipality) return false;
      if (sex          && r.SEX          !== sex)          return false;
      return true;
    });
  }, [tabRows, search, municipality, sex]);

  // Tab counts (from all rows, not filtered)
  const counts: Record<TabKey, number> = useMemo(() => ({
    all:       rows.length,
    pending:   rows.filter(r => r.DOCUMENT_STATUS === "INCOMPLETE").length,
    completed: rows.filter(r => r.DOCUMENT_STATUS === "COMPLETE").length,
    approved:  rows.filter(r => r.APPLICATION_STATUS === "APPROVED").length,
  }), [rows]);

  // Reset sub-filters when switching tabs
  const handleTabChange = (t: TabKey) => {
    setActiveTab(t);
    setSearch("");
    setMunicipality("");
    setSex("");
  };

  return (
    <PageWrapper noPadding>
      <div className="px-4 lg:px-6 py-5 space-y-4">

        {/* ── Heading ──────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-[#1a1a2e] tracking-tight">Monitoring</h1>
            <p className="text-xs text-gray-400 mt-0.5">Track and manage applicant status in real time.</p>
          </div>
          <button onClick={refresh} disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#0f3460]
              bg-white border border-gray-200 rounded-lg hover:border-[#0f3460]/30
              hover:bg-[#f0f4ff] transition-all duration-150 disabled:opacity-50">
            <span className={loading ? "animate-spin" : ""}>↻</span>
            Refresh
          </button>
        </div>

        {/* ── Stats bar ────────────────────────────────── */}
        {rows.length > 0 && <StatsBar rows={rows} />}

        {/* ── Error ────────────────────────────────────── */}
        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-start gap-3">
            <span className="text-lg flex-shrink-0">⚠️</span>
            <div>
              <p className="font-semibold">Failed to load applicants</p>
              <p className="text-red-600 mt-0.5 text-xs">{error}</p>
            </div>
          </div>
        )}

        {/* ── Tabs ─────────────────────────────────────── */}
        <TabBar active={activeTab} onChange={handleTabChange} counts={counts} />

        {/* ── Sub-filters ──────────────────────────────── */}
        <SubFilter
          search={search} municipality={municipality} sex={sex}
          onSearch={setSearch} onMunicipality={setMunicipality} onSex={setSex}
        />

        {/* ── Table ────────────────────────────────────── */}
        <MonitoringTable
          rows={filteredRows}
          loading={loading}
          tab={activeTab}
          onRowClick={setSelectedRow}
          onUpdate={handleUpdate}
          selectedId={selectedRow?.GIP_ID}
        />

        {/* ── Pagination ───────────────────────────────── */}
        {total > 0 && (
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>Showing <strong className="text-[#1a1a2e]">{filteredRows.length}</strong> of <strong className="text-[#1a1a2e]">{rows.length}</strong> applicants</span>
          </div>
        )}
      </div>

      {/* ── Drawer ───────────────────────────────────────  */}
      <ApplicantDrawer
        row={selectedRow}
        onClose={() => setSelectedRow(null)}
        onUpdate={handleUpdate}
      />
    </PageWrapper>
  );
}