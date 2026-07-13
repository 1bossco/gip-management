"use client";

import { useState, useMemo }         from "react";
import { useDashboard }               from "@/hooks/useDashboard";
import type { DashboardDateRange }    from "@/hooks/useDashboard";
import { PageWrapper }                from "@/components/layout/PageWrapper";
import { StatCard }                   from "@/components/dashboard/StatCard";
import { DonutChart }                 from "@/components/dashboard/DonutChart";
import { MunicipalityBarChart, SectorBarChart } from "@/components/dashboard/BarChart";
import { TimelineChart }              from "@/components/dashboard/TimelineChart";
import { QuickStats }                 from "@/components/dashboard/QuickStats";
import { DashboardHeader }            from "@/components/dashboard/DashboardHeader";
import { cn }                         from "@/lib/utils";

// ── Skeleton ──────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={cn("bg-gray-200/70 rounded-2xl animate-pulse", className)} />;
}

function DashboardSkeleton() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-14" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[1,2,3,4].map(i => <Skeleton key={i} className="h-16" />)}
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => <Skeleton key={i} className="h-36" />)}
      </div>
      <div className="grid grid-cols-2 gap-4">
        {[1,2].map(i => <Skeleton key={i} className="h-36" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {[1,2,3].map(i => <Skeleton key={i} className="h-64" />)}
      </div>
      <Skeleton className="h-64" />
    </div>
  );
}

function DashboardError({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="text-5xl mb-4">⚠️</div>
      <h3 className="text-sm font-bold text-gray-600 mb-2">Failed to load dashboard</h3>
      <p className="text-xs text-gray-400 max-w-xs mb-5">{error}</p>
      <button onClick={onRetry}
        className="px-4 py-2 bg-[#0f3460] text-white text-xs font-bold rounded-lg hover:bg-[#16213e] transition-colors">
        Try Again
      </button>
    </div>
  );
}

// ── Date Range Filter Bar ─────────────────────────────────────

type RangeMode = "all" | "year" | "month" | "day" | "custom";

function DateRangeFilter({
  onChange, loading,
}: {
  onChange: (r: DashboardDateRange) => void;
  loading:  boolean;
}) {
  const now    = new Date();
  const [mode, setMode]   = useState<RangeMode>("all");
  const [year, setYear]   = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [day,   setDay]   = useState(now.toISOString().split("T")[0]);
  const [customFrom, setCustomFrom] = useState("");
  const [customTo,   setCustomTo]   = useState("");

  const years  = Array.from({ length: 6 }, (_, i) => now.getFullYear() - i);
  const months = ["January","February","March","April","May","June",
                  "July","August","September","October","November","December"];

  // Compute from/to dates and call onChange whenever any selector changes
  const apply = (
    m: RangeMode,
    y = year, mo = month, d = day,
    cf = customFrom, ct = customTo
  ) => {
    let from = "";
    let to   = "";

    if (m === "year") {
      from = `${y}-01-01`;
      to   = `${y}-12-31`;
    } else if (m === "month") {
      const lastDay = new Date(y, mo, 0).getDate();
      from = `${y}-${String(mo).padStart(2,"0")}-01`;
      to   = `${y}-${String(mo).padStart(2,"0")}-${String(lastDay).padStart(2,"0")}`;
    } else if (m === "day") {
      from = d;
      to   = d;
    } else if (m === "custom") {
      from = cf;
      to   = ct;
    }
    // "all" → from/to stay ""
    onChange({ from, to });
  };

  const setModeAndApply = (m: RangeMode) => {
    setMode(m);
    apply(m);
  };

  const tabClass = (m: RangeMode) => cn(
    "px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all duration-150 whitespace-nowrap",
    mode === m
      ? "bg-[#0f3460] text-white shadow-md"
      : "bg-white text-gray-500 border border-gray-200 hover:border-[#0f3460]/30 hover:text-[#0f3460]"
  );

  const selectClass = "h-8 px-2.5 text-xs font-semibold rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#0f3460]/20 focus:border-[#0f3460]";

  // Active label shown as a pill
  const activeLabel = useMemo(() => {
    if (mode === "year")   return `Year ${year}`;
    if (mode === "month")  return `${months[month-1]} ${year}`;
    if (mode === "day")    return day;
    if (mode === "custom" && customFrom && customTo) return `${customFrom} → ${customTo}`;
    return null;
  }, [mode, year, month, day, customFrom, customTo]);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-3.5">
      <div className="flex flex-wrap items-center gap-2">

        {/* Loading indicator */}
        {loading && (
          <span className="w-4 h-4 border-2 border-[#0f3460] border-t-transparent rounded-full animate-spin flex-shrink-0" />
        )}

        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex-shrink-0">
          Filter:
        </p>

        {/* Mode tabs */}
        {(["all","year","month","day","custom"] as RangeMode[]).map(m => (
          <button key={m} type="button" className={tabClass(m)}
            onClick={() => setModeAndApply(m)}>
            {m === "all" ? "All Time" : m.charAt(0).toUpperCase() + m.slice(1)}
          </button>
        ))}

        {/* Year picker */}
        {(mode === "year" || mode === "month" || mode === "day") && (
          <select value={year} className={selectClass}
            onChange={e => {
              const y = Number(e.target.value);
              setYear(y);
              apply(mode, y);
            }}>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        )}

        {/* Month picker */}
        {(mode === "month" || mode === "day") && (
          <select value={month} className={selectClass}
            onChange={e => {
              const mo = Number(e.target.value);
              setMonth(mo);
              apply(mode, year, mo);
            }}>
            {months.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
          </select>
        )}

        {/* Day picker */}
        {mode === "day" && (
          <input type="date" value={day} className={selectClass}
            onChange={e => {
              setDay(e.target.value);
              apply(mode, year, month, e.target.value);
            }}
          />
        )}

        {/* Custom range */}
        {mode === "custom" && (
          <div className="flex items-center gap-2">
            <input type="date" value={customFrom} className={selectClass}
              onChange={e => {
                setCustomFrom(e.target.value);
                apply(mode, year, month, day, e.target.value, customTo);
              }}
            />
            <span className="text-xs text-gray-400 font-semibold">to</span>
            <input type="date" value={customTo} className={selectClass}
              onChange={e => {
                setCustomTo(e.target.value);
                apply(mode, year, month, day, customFrom, e.target.value);
              }}
            />
          </div>
        )}

        {/* Active filter pill */}
        {activeLabel && (
          <span className="text-[10px] font-bold text-[#0f3460] bg-[#f0f4ff] border border-[#0f3460]/20 px-2.5 py-1 rounded-lg">
            {activeLabel}
          </span>
        )}
      </div>
    </div>
  );
}

// ── Main Dashboard Client ─────────────────────────────────────

export default function DashboardClient() {
  const { stats, loading, error, refresh, lastUpdated, setDateRange } = useDashboard();

  const documentStatusData = stats ? [
    { name: "Complete",   value: stats.complete,   color: "#10b981" },
    { name: "Incomplete", value: stats.incomplete, color: "#f59e0b" },
  ] : [];

  const applicationStatusData = stats ? [
    { name: "Approved",    value: stats.approved,    color: "#10b981" },
    { name: "Pending",     value: stats.pending,     color: "#0ea5e9" },
    { name: "Disapproved", value: stats.disapproved, color: "#ef4444" },
  ] : [];

  const genderData = stats ? [
    { name: "Male",   value: stats.male   ?? 0, color: "#0f3460" },
    { name: "Female", value: stats.female ?? 0, color: "#e94560" },
  ] : [];

  const municipalityData = stats
    ? Object.entries(stats.byMunicipality).map(([name, value]) => ({ name, value }))
    : [];

  const sectorData = stats
    ? Object.entries(stats.bySector)
        .map(([name, value]) => ({ name: name.length > 8 ? name.slice(0,7)+"…" : name, value }))
        .sort((a, b) => b.value - a.value).slice(0, 9)
    : [];

  const monthlyData = stats?.byMonth ?? [];

  return (
    <PageWrapper>
      <DashboardHeader lastUpdated={lastUpdated} loading={loading} onRefresh={refresh} />

      {error ? (
        <DashboardError error={error} onRetry={refresh} />
      ) : (
        <div className="space-y-5">

          {/* ── Date range filter ────────────────────── */}
          <DateRangeFilter onChange={setDateRange} loading={loading} />

          {/* Show skeleton overlay while loading but keep filter visible */}
          {loading && !stats ? (
            <DashboardSkeleton />
          ) : stats ? (
            <>
              {/* ── Quick stats ───────────────────────── */}
              <QuickStats
                today={stats.today}
                thisMonth={stats.thisMonth}
                thisYear={stats.thisYear}
                pending={stats.pending}
              />

              {/* ── Primary stat cards ────────────────── */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">
                <StatCard label="Total Applicants" value={stats.total}      icon="👥" color="navy"    delay={0}   />
                <StatCard label="Complete"          value={stats.complete}   icon="✓"  color="emerald" delay={60}  total={stats.total} subLabel="Documents submitted" />
                <StatCard label="Incomplete"        value={stats.incomplete} icon="⏳" color="amber"   delay={120} total={stats.total} subLabel="Awaiting documents" />
                <StatCard label="Approved"          value={stats.approved}   icon="🎓" color="sky"     delay={180} total={stats.total} subLabel="By admin" />
              </div>

              {/* ── Male / Female cards ───────────────── */}
              <div className="grid grid-cols-2 gap-4">
                <StatCard label="Male Applicants"   value={stats.male   ?? 0} icon="👨" color="navy" total={stats.total} subLabel="Male registrants"   delay={0}  />
                <StatCard label="Female Applicants" value={stats.female ?? 0} icon="👩" color="red"  total={stats.total} subLabel="Female registrants" delay={60} />
              </div>

              {/* ── Donut charts ──────────────────────── */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <DonutChart title="Document Status"    description="Complete vs incomplete"    data={documentStatusData}    centerLabel="Applicants" centerValue={stats.total} />
                <DonutChart title="Application Status" description="Approval pipeline"         data={applicationStatusData} centerLabel="Total"      centerValue={stats.total} />
                <DonutChart title="Gender Breakdown"   description="Male vs female applicants" data={genderData}            centerLabel="Total"      centerValue={stats.total} />
              </div>

              {/* ── Municipality bars ─────────────────── */}
              <MunicipalityBarChart
                title="By Municipality"
                description="Applicant distribution across towns"
                data={municipalityData}
              />

              {/* ── Monthly timeline ──────────────────── */}
              <TimelineChart
                title="Monthly Registrations"
                description="Registration activity by month"
                data={monthlyData}
              />

              {/* ── Sector chart ──────────────────────── */}
              {sectorData.length > 0 && (
                <SectorBarChart
                  title="By Sector"
                  description="Applicants across program sectors"
                  data={sectorData}
                />
              )}

              {/* ── Footer rule ───────────────────────── */}
              <div className="flex items-center gap-4 pt-2 pb-1">
                <div className="flex-1 h-px bg-gray-100" />
                <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest whitespace-nowrap">
                  End of Dashboard · {new Date().toLocaleDateString("en-PH", { year: "numeric", month: "long" })}
                </p>
                <div className="flex-1 h-px bg-gray-100" />
              </div>
            </>
          ) : null}
        </div>
      )}
    </PageWrapper>
  );
}