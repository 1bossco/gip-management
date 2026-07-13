"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

// ── Breadcrumb map ────────────────────────────────────────────

const PAGE_META: Record<string, { title: string; icon: string; description: string }> = {
  "/dashboard":      { title: "Dashboard",          icon: "▦",  description: "System overview and analytics" },
  "/register":       { title: "Register Applicant", icon: "✚",  description: "Add a new GIP applicant" },
  "/monitoring":     { title: "Monitoring",          icon: "☰",  description: "Track applicants and documents" },
  "/transmittal":    { title: "Transmittal",         icon: "⎙",  description: "Generate and print transmittals" },
  "/admin/batches":  { title: "Batch Management",    icon: "⊞",  description: "Create and manage program batches" },
};

interface TopbarProps {
  onMobileMenuOpen: () => void;
}

export function Topbar({ onMobileMenuOpen }: TopbarProps) {
  const pathname        = usePathname();
  const { user }        = useAuth();
  const [time, setTime] = useState<string>("");

  // Live clock
  useEffect(() => {
    function tick() {
      setTime(new Date().toLocaleTimeString("en-PH", {
        hour:   "2-digit",
        minute: "2-digit",
        hour12: true,
      }));
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Match current page meta
  const meta = Object.entries(PAGE_META).find(([key]) =>
    key === "/register/success" ? false :   // exclude success page
    pathname === key || (key !== "/" && pathname.startsWith(key))
  )?.[1] ?? { title: "GIP System", icon: "🏛️", description: "" };

  const today = new Date().toLocaleDateString("en-PH", {
    weekday: "short",
    year:    "numeric",
    month:   "short",
    day:     "numeric",
  });

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center px-4 lg:px-6 gap-4 flex-shrink-0 shadow-sm z-10">

      {/* ── Mobile hamburger ───────────────────────────── */}
      <button
        onClick={onMobileMenuOpen}
        className="lg:hidden flex flex-col gap-1.5 p-1 rounded-md text-gray-500 hover:text-gray-800 transition-colors"
        aria-label="Open navigation"
      >
        <span className="w-5 h-0.5 bg-current rounded-full" />
        <span className="w-5 h-0.5 bg-current rounded-full" />
        <span className="w-3 h-0.5 bg-current rounded-full" />
      </button>

      {/* ── Page title ─────────────────────────────────── */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="w-8 h-8 rounded-lg bg-[#0f3460]/8 flex items-center justify-center text-sm flex-shrink-0">
          {meta.icon}
        </div>
        <div className="min-w-0">
          <h1 className="text-base font-black text-[#1a1a2e] truncate leading-tight">
            {meta.title}
          </h1>
          {meta.description && (
            <p className="text-[11px] text-gray-400 font-medium hidden sm:block truncate">
              {meta.description}
            </p>
          )}
        </div>
      </div>

      {/* ── Right side ─────────────────────────────────── */}
      <div className="flex items-center gap-3 flex-shrink-0">

        {/* Date + time pill — hidden on mobile */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-100">
          <span className="text-gray-300 text-xs">📅</span>
          <div className="text-right">
            <p className="text-[10px] font-bold text-gray-500 leading-tight">{today}</p>
            <p className="text-[10px] font-black text-[#0f3460] leading-tight font-mono">{time}</p>
          </div>
        </div>

        {/* User chip */}
        {user && (
          <div className="flex items-center gap-2.5 pl-3 border-l border-gray-100">
            {/* Avatar */}
            <div className="w-8 h-8 rounded-full bg-[#0f3460] flex items-center justify-center text-white text-xs font-black flex-shrink-0">
              {user.FULL_NAME.split(" ").map(n => n[0]).slice(0, 2).join("")}
            </div>
            <div className="hidden sm:block">
              <p className="text-xs font-bold text-[#1a1a2e] leading-tight">{user.FULL_NAME}</p>
              <p className="text-[10px] text-gray-400 font-medium leading-tight">{user.ROLE}</p>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
