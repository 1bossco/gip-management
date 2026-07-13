"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

// ── Animated number counter ───────────────────────────────────

function useCountUp(target: number, duration = 900, enabled = true) {
  const [value, setValue] = useState(0);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled || target === 0) { setValue(target); return; }
    const start     = performance.now();
    const startVal  = 0;

    function tick(now: number) {
      const elapsed  = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased    = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(startVal + (target - startVal) * eased));
      if (progress < 1) frameRef.current = requestAnimationFrame(tick);
    }

    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target, duration, enabled]);

  return value;
}

// ── StatCard ──────────────────────────────────────────────────

interface StatCardProps {
  label:       string;
  value:       number;
  icon:        string;
  color:       "navy" | "red" | "emerald" | "amber" | "sky" | "slate";
  // Optional: percentage of total for mini progress bar
  total?:      number;
  // Optional: sub-label beneath the number
  subLabel?:   string;
  // Optional: +/- delta from previous period
  delta?:      number;
  // Stagger delay index
  delay?:      number;
}

const COLOR_MAP = {
  navy:    { bg: "bg-[#0f3460]",    text: "text-white",          bar: "bg-white/30",       accent: "bg-white",         icon: "bg-white/15",       badge: "bg-white/20 text-white" },
  red:     { bg: "bg-[#e94560]",    text: "text-white",          bar: "bg-white/30",       accent: "bg-white",         icon: "bg-white/15",       badge: "bg-white/20 text-white" },
  emerald: { bg: "bg-white",        text: "text-[#1a1a2e]",      bar: "bg-gray-100",       accent: "bg-emerald-500",   icon: "bg-emerald-50",     badge: "bg-emerald-100 text-emerald-700" },
  amber:   { bg: "bg-white",        text: "text-[#1a1a2e]",      bar: "bg-gray-100",       accent: "bg-amber-400",     icon: "bg-amber-50",       badge: "bg-amber-100 text-amber-700" },
  sky:     { bg: "bg-white",        text: "text-[#1a1a2e]",      bar: "bg-gray-100",       accent: "bg-sky-500",       icon: "bg-sky-50",         badge: "bg-sky-100 text-sky-700" },
  slate:   { bg: "bg-white",        text: "text-[#1a1a2e]",      bar: "bg-gray-100",       accent: "bg-slate-400",     icon: "bg-slate-50",       badge: "bg-slate-100 text-slate-600" },
};

export function StatCard({
  label, value, icon, color, total, subLabel, delta, delay = 0,
}: StatCardProps) {
  const [visible, setVisible] = useState(false);
  const c = COLOR_MAP[color];
  const count = useCountUp(value, 900, visible);
  const pct   = total && total > 0 ? Math.round((value / total) * 100) : null;

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  const isDark = color === "navy" || color === "red";

  return (
    <div
      className={cn(
        "relative rounded-2xl overflow-hidden border transition-all duration-200",
        "hover:shadow-md hover:-translate-y-0.5",
        c.bg,
        isDark ? "border-transparent shadow-lg" : "border-gray-100 shadow-sm",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3",
        "transition-[opacity,transform] duration-500"
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {/* Top accent bar */}
      <div className={cn("h-0.5 w-full", c.accent)} />

      <div className="p-5">
        {/* Icon + delta row */}
        <div className="flex items-start justify-between mb-3">
          <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0", c.icon)}>
            {icon}
          </div>
          {delta !== undefined && (
            <span className={cn(
              "text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-0.5",
              c.badge
            )}>
              {delta >= 0 ? "▲" : "▼"} {Math.abs(delta)}
            </span>
          )}
        </div>

        {/* Number — serif display weight */}
        <p
          className={cn(
            "text-4xl font-black leading-none mb-1 tabular-nums",
            isDark ? "text-white" : "text-[#1a1a2e]"
          )}
          style={{ fontFamily: "var(--font-display, serif)" }}
        >
          {count.toLocaleString()}
        </p>

        {/* Label */}
        <p className={cn(
          "text-[11px] font-bold uppercase tracking-widest",
          isDark ? "text-white/70" : "text-gray-400"
        )}>
          {label}
        </p>

        {subLabel && (
          <p className={cn(
            "text-xs mt-0.5",
            isDark ? "text-white/50" : "text-gray-400"
          )}>
            {subLabel}
          </p>
        )}

        {/* Progress bar */}
        {pct !== null && (
          <div className="mt-4">
            <div className={cn("w-full h-1.5 rounded-full overflow-hidden", c.bar)}>
              <div
                className={cn("h-full rounded-full transition-all duration-1000", c.accent)}
                style={{
                  width: visible ? `${pct}%` : "0%",
                  transitionDelay: `${delay + 300}ms`,
                }}
              />
            </div>
            <p className={cn(
              "text-[10px] font-semibold mt-1",
              isDark ? "text-white/50" : "text-gray-400"
            )}>
              {pct}% of total
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
