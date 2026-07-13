"use client";

import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { cn } from "@/lib/utils";

// ── Custom tooltip ────────────────────────────────────────────

function CustomTooltip({ active, payload }: { active?: boolean; payload?: { name: string; value: number; payload: { color: string } }[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="bg-[#1a1a2e] text-white text-xs px-3 py-2 rounded-lg shadow-xl">
      <p className="font-bold">{d.name}</p>
      <p className="text-white/70 mt-0.5">{d.value.toLocaleString()} applicants</p>
    </div>
  );
}

// ── Custom legend ─────────────────────────────────────────────

function CustomLegend({ data }: { data: { name: string; value: number; color: string }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div className="space-y-2 mt-4">
      {data.map((d) => (
        <div key={d.name} className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
            <span className="text-xs font-medium text-gray-600">{d.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-[#1a1a2e]">{d.value.toLocaleString()}</span>
            <span className="text-[10px] text-gray-400 w-10 text-right">
              {total > 0 ? Math.round((d.value / total) * 100) : 0}%
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── DonutChart ────────────────────────────────────────────────

interface DonutChartProps {
  title:       string;
  description?: string;
  data:        { name: string; value: number; color: string }[];
  centerLabel?: string;
  centerValue?: number;
}

export function DonutChart({ title, description, data, centerLabel, centerValue }: DonutChartProps) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const displayCenter = centerValue ?? total;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      {/* Header */}
      <div className="mb-4 pb-4 border-b border-gray-50">
        <h3 className="text-sm font-black text-[#1a1a2e] tracking-tight">{title}</h3>
        {description && (
          <p className="text-xs text-gray-400 mt-0.5">{description}</p>
        )}
      </div>

      {/* Chart */}
      <div className="relative h-44">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={52}
              outerRadius={72}
              paddingAngle={3}
              dataKey="value"
              strokeWidth={0}
              animationBegin={200}
              animationDuration={900}
            >
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        {/* Center text overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <p
            className="text-2xl font-black text-[#1a1a2e] leading-none"
            style={{ fontFamily: "var(--font-display, serif)" }}
          >
            {displayCenter.toLocaleString()}
          </p>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
            {centerLabel ?? "Total"}
          </p>
        </div>
      </div>

      {/* Legend */}
      <CustomLegend data={data} />
    </div>
  );
}
