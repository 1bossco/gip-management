"use client";

import {
  BarChart as ReBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from "recharts";
import { cn } from "@/lib/utils";

// ── Custom tooltip ────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1a1a2e] text-white text-xs px-3 py-2 rounded-lg shadow-xl">
      <p className="font-bold">{label}</p>
      <p className="text-white/70 mt-0.5">{payload[0].value.toLocaleString()} applicants</p>
    </div>
  );
}

// ── MunicipalityBar ───────────────────────────────────────────

interface BarChartProps {
  title:        string;
  description?: string;
  data:         { name: string; value: number }[];
  color?:       string;
}

export function MunicipalityBarChart({ title, description, data, color = "#0f3460" }: BarChartProps) {
  const sorted = [...data].sort((a, b) => b.value - a.value);
  const max    = Math.max(...sorted.map(d => d.value), 1);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      {/* Header */}
      <div className="mb-4 pb-4 border-b border-gray-50">
        <h3 className="text-sm font-black text-[#1a1a2e] tracking-tight">{title}</h3>
        {description && (
          <p className="text-xs text-gray-400 mt-0.5">{description}</p>
        )}
      </div>

      {/* Horizontal bar chart — custom rendered for full control */}
      <div className="space-y-3">
        {sorted.map((item, i) => {
          const pct = (item.value / max) * 100;
          const isTop = i === 0;
          return (
            <div key={item.name}>
              <div className="flex items-center justify-between mb-1">
                <span className={cn(
                  "text-xs font-semibold",
                  isTop ? "text-[#0f3460]" : "text-gray-600"
                )}>
                  {item.name}
                </span>
                <span className={cn(
                  "text-xs font-black tabular-nums",
                  isTop ? "text-[#0f3460]" : "text-gray-700"
                )}
                  style={{ fontFamily: "var(--font-display, serif)" }}
                >
                  {item.value.toLocaleString()}
                </span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-700",
                    isTop ? "bg-[#0f3460]" : "bg-[#0f3460]/40"
                  )}
                  style={{
                    width: `${pct}%`,
                    transitionDelay: `${i * 80}ms`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {sorted.length === 0 && (
        <div className="py-8 text-center text-xs text-gray-400">No data available</div>
      )}
    </div>
  );
}

// ── SectorBarChart — vertical recharts bar chart ─────────────

interface SectorBarChartProps {
  title:        string;
  description?: string;
  data:         { name: string; value: number }[];
}

export function SectorBarChart({ title, description, data }: SectorBarChartProps) {
  const COLORS = [
    "#0f3460", "#16213e", "#1a4a8a", "#e94560",
    "#2563eb", "#0891b2", "#059669", "#d97706", "#7c3aed",
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="mb-4 pb-4 border-b border-gray-50">
        <h3 className="text-sm font-black text-[#1a1a2e] tracking-tight">{title}</h3>
        {description && (
          <p className="text-xs text-gray-400 mt-0.5">{description}</p>
        )}
      </div>

      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <ReBarChart
            data={data}
            margin={{ top: 16, right: 4, left: -24, bottom: 0 }}
            barSize={28}
          >
            <CartesianGrid
              vertical={false}
              strokeDasharray="3 3"
              stroke="#f3f4f6"
            />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 9, fontWeight: 700, fill: "#9ca3af", letterSpacing: "0.05em" }}
              tickLine={false}
              axisLine={false}
              interval={0}
              angle={-35}
              textAnchor="end"
              height={48}
            />
            <YAxis
              tick={{ fontSize: 9, fill: "#9ca3af" }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f9fafb" }} />
            <Bar
              dataKey="value"
              radius={[4, 4, 0, 0]}
              animationBegin={200}
              animationDuration={800}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
              <LabelList
                dataKey="value"
                position="top"
                style={{ fontSize: 9, fontWeight: 700, fill: "#6b7280" }}
              />
            </Bar>
          </ReBarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
