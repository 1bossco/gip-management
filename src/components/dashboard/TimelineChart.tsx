"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

// ── Tooltip ───────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: { value: number; name: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1a1a2e] text-white px-3 py-2.5 rounded-xl shadow-2xl border border-white/10 min-w-[120px]">
      <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1.5">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center justify-between gap-4">
          <span className="text-xs text-white/70">{p.name}</span>
          <span className="text-xs font-black text-white">{p.value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

// ── TimelineChart ─────────────────────────────────────────────

interface MonthlyPoint {
  month: string;
  count: number;
}

interface TimelineChartProps {
  data:         MonthlyPoint[];
  title:        string;
  description?: string;
}

export function TimelineChart({ data, title, description }: TimelineChartProps) {
  // Find peak month
  const peak     = data.reduce((best, d) => d.count > best.count ? d : best, { month: "", count: 0 });
  const hasData  = data.some(d => d.count > 0);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      {/* Header */}
      <div className="flex items-start justify-between mb-5 pb-4 border-b border-gray-50">
        <div>
          <h3 className="text-sm font-black text-[#1a1a2e] tracking-tight">{title}</h3>
          {description && (
            <p className="text-xs text-gray-400 mt-0.5">{description}</p>
          )}
        </div>
        {peak.count > 0 && (
          <div className="text-right flex-shrink-0 ml-4">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Peak Month</p>
            <p className="text-sm font-black text-[#0f3460]"
              style={{ fontFamily: "var(--font-display, serif)" }}
            >
              {peak.month}
            </p>
            <p className="text-[10px] text-gray-400">{peak.count.toLocaleString()} registered</p>
          </div>
        )}
      </div>

      {/* Chart */}
      {!hasData ? (
        <div className="h-52 flex items-center justify-center">
          <p className="text-xs text-gray-400">No registration data yet for this year.</p>
        </div>
      ) : (
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 4, left: -24, bottom: 0 }}>
              <defs>
                <linearGradient id="gipAreaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#0f3460" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#0f3460" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gipLineGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%"   stopColor="#0f3460" />
                  <stop offset="100%" stopColor="#e94560" />
                </linearGradient>
              </defs>

              <CartesianGrid
                vertical={false}
                strokeDasharray="3 3"
                stroke="#f3f4f6"
              />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 9, fontWeight: 700, fill: "#9ca3af", letterSpacing: "0.05em" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 9, fill: "#9ca3af" }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#0f3460", strokeWidth: 1, strokeDasharray: "4 2" }} />

              {/* Peak reference line */}
              {peak.month && (
                <ReferenceLine
                  x={peak.month}
                  stroke="#e94560"
                  strokeDasharray="3 3"
                  strokeWidth={1.5}
                  label={{
                    value: "Peak",
                    position: "top",
                    fill: "#e94560",
                    fontSize: 9,
                    fontWeight: 700,
                  }}
                />
              )}

              <Area
                type="monotone"
                dataKey="count"
                name="Registrations"
                stroke="url(#gipLineGradient)"
                strokeWidth={2.5}
                fill="url(#gipAreaGradient)"
                dot={false}
                activeDot={{ r: 5, fill: "#0f3460", strokeWidth: 2, stroke: "white" }}
                animationBegin={300}
                animationDuration={1000}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Month pills row */}
      {hasData && (
        <div className="flex gap-1.5 mt-4 overflow-x-auto pb-1 scrollbar-none">
          {data.map((d) => (
            <div
              key={d.month}
              className={`flex-shrink-0 flex flex-col items-center px-2.5 py-1.5 rounded-lg border transition-colors
                ${d.month === peak.month
                  ? "bg-[#0f3460] border-[#0f3460]"
                  : d.count > 0
                  ? "bg-gray-50 border-gray-100"
                  : "bg-transparent border-transparent"
                }`}
            >
              <span className={`text-[9px] font-bold uppercase tracking-wider
                ${d.month === peak.month ? "text-white/70" : "text-gray-400"}`}>
                {d.month.slice(0, 3)}
              </span>
              <span className={`text-xs font-black tabular-nums
                ${d.month === peak.month ? "text-white" : d.count > 0 ? "text-[#1a1a2e]" : "text-gray-200"}`}
                style={{ fontFamily: "var(--font-display, serif)" }}
              >
                {d.count > 0 ? d.count : "—"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
