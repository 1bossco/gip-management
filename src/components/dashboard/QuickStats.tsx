"use client";

import { cn } from "@/lib/utils";

interface QuickStatItem {
  label:  string;
  value:  number;
  icon:   string;
  color:  string;
}

interface QuickStatsProps {
  today:      number;
  thisMonth:  number;
  thisYear:   number;
  pending:    number;
}

export function QuickStats({ today, thisMonth, thisYear, pending }: QuickStatsProps) {
  const items: QuickStatItem[] = [
    { label: "Today",       value: today,     icon: "📅", color: "text-[#0f3460]" },
    { label: "This Month",  value: thisMonth, icon: "📆", color: "text-[#0f3460]" },
    { label: "This Year",   value: thisYear,  icon: "🗓️", color: "text-[#0f3460]" },
    { label: "Pending",     value: pending,   icon: "⏳", color: "text-amber-600"  },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {items.map((item, i) => (
        <div
          key={item.label}
          className={cn(
            "bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3",
            "flex items-center gap-3",
            "animate-slide-up"
          )}
          style={{ animationDelay: `${i * 50}ms` }}
        >
          <span className="text-xl flex-shrink-0">{item.icon}</span>
          <div className="min-w-0">
            <p
              className={cn("text-xl font-black leading-none tabular-nums", item.color)}
              style={{ fontFamily: "var(--font-display, serif)" }}
            >
              {item.value.toLocaleString()}
            </p>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-0.5 truncate">
              {item.label}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
