"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

// ── Nav structure ─────────────────────────────────────────────

interface NavItem {
  label:    string;
  href:     string;
  icon:     string;
  badge?:   string;
  roles?:   string[]; // if set, only these roles see the item
}

interface NavGroup {
  group:  string;
  items:  NavItem[];
}

const NAV: NavGroup[] = [
  {
    group: "Overview",
    items: [
      { label: "Dashboard",    href: "/dashboard",   icon: "▦" },
    ],
  },
  {
    group: "Applicants",
    items: [
      { label: "Register",     href: "/register",    icon: "✚" },
      { label: "Monitoring",   href: "/monitoring",  icon: "☰" },
      { label: "Transmittal",  href: "/transmittal", icon: "⎙" },
    ],
  },
  {
    group: "Administration",
    items: [
      { label: "Batches",      href: "/admin/batches", icon: "⊞", roles: ["SUPER_ADMIN", "ADMIN"] },
    ],
  },
];

// ── Sidebar ───────────────────────────────────────────────────

interface SidebarProps {
  collapsed:    boolean;
  onCollapse:   (v: boolean) => void;
  mobileOpen:   boolean;
  onMobileClose: () => void;
}

export function Sidebar({ collapsed, onCollapse, mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  function canSee(item: NavItem) {
    if (!item.roles) return true;
    if (!user) return false;
    return item.roles.includes(user.ROLE);
  }

  const sidebarContent = (
    <div className="flex flex-col h-full">

      {/* ── Logo / Brand ──────────────────────────────────── */}
      <div className={cn(
        "flex items-center border-b border-white/10 transition-all duration-300",
        collapsed ? "px-3 py-4 justify-center" : "px-5 py-4 gap-3"
      )}>
        <div className="w-9 h-9 rounded-lg bg-[#e94560] flex items-center justify-center text-white font-black text-base flex-shrink-0 shadow-lg shadow-[#e94560]/40">
          G
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="text-white font-black text-sm leading-tight tracking-tight">
              GIP System
            </p>
            <p className="text-white/40 text-[10px] font-medium tracking-widest uppercase">
              {process.env.NEXT_PUBLIC_PROVINCE ?? "Provincial Gov't"}
            </p>
          </div>
        )}
      </div>

      {/* ── Nav Groups ────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1 scrollbar-none">
        {NAV.map((group) => {
          const visibleItems = group.items.filter(canSee);
          if (visibleItems.length === 0) return null;
          return (
            <div key={group.group} className="mb-1">
              {!collapsed && (
                <p className="text-white/30 text-[9px] font-black uppercase tracking-[0.15em] px-3 mb-1.5 mt-3">
                  {group.group}
                </p>
              )}
              {collapsed && (
                <div className="my-1 mx-3 border-t border-white/10" />
              )}
              {visibleItems.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onMobileClose}
                    className={cn(
                      "flex items-center rounded-lg transition-all duration-150 group relative",
                      collapsed ? "px-0 py-2.5 justify-center" : "px-3 py-2.5 gap-3",
                      active
                        ? "bg-[#e94560] text-white shadow-md shadow-[#e94560]/30"
                        : "text-white/60 hover:text-white hover:bg-white/8"
                    )}
                  >
                    {/* Active left-edge bar */}
                    {active && !collapsed && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-white rounded-r-full" />
                    )}

                    <span className={cn(
                      "text-base leading-none flex-shrink-0 transition-transform duration-150",
                      "group-hover:scale-110",
                      active ? "text-white" : "text-white/50 group-hover:text-white"
                    )}>
                      {item.icon}
                    </span>

                    {!collapsed && (
                      <>
                        <span className="text-sm font-semibold flex-1">{item.label}</span>
                        {item.badge && (
                          <span className="text-[10px] font-black bg-[#e94560] text-white px-1.5 py-0.5 rounded-full">
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}

                    {/* Tooltip on collapsed */}
                    {collapsed && (
                      <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-[#1a1a2e] text-white text-xs font-semibold rounded-lg whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 shadow-xl z-50 border border-white/10">
                        {item.label}
                        <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-[#1a1a2e]" />
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* ── User Info + Logout ────────────────────────────── */}
      <div className={cn(
        "border-t border-white/10",
        collapsed ? "p-2" : "p-3"
      )}>
        {user && !collapsed && (
          <div className="px-2 py-2 mb-1">
            <p className="text-white/90 text-xs font-bold truncate">{user.FULL_NAME}</p>
            <p className="text-white/40 text-[10px] font-medium mt-0.5">{user.ROLE} · {user.MUNICIPALITY}</p>
          </div>
        )}
        <button
          onClick={logout}
          className={cn(
            "w-full flex items-center rounded-lg text-white/50 hover:text-white hover:bg-white/8 transition-all duration-150 group",
            collapsed ? "justify-center p-2.5" : "px-3 py-2.5 gap-3"
          )}
        >
          <span className="text-base group-hover:scale-110 transition-transform duration-150">⏻</span>
          {!collapsed && <span className="text-sm font-semibold">Sign Out</span>}
          {collapsed && (
            <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-[#1a1a2e] text-white text-xs font-semibold rounded-lg whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 shadow-xl z-50 border border-white/10">
              Sign Out
            </div>
          )}
        </button>
      </div>

      {/* ── Collapse Toggle (desktop only) ────────────────── */}
      <button
        onClick={() => onCollapse(!collapsed)}
        className="hidden lg:flex absolute -right-3 top-20 w-6 h-6 rounded-full bg-[#0f3460] border-2 border-white/20 items-center justify-center text-white/60 hover:text-white hover:border-white/40 transition-all duration-150 shadow-lg z-10"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        <span className={cn(
          "text-[10px] font-bold transition-transform duration-300",
          collapsed ? "rotate-0" : "rotate-180"
        )}>›</span>
      </button>
    </div>
  );

  return (
    <>
      {/* ── Desktop Sidebar ─────────────────────────────── */}
      <aside
        className={cn(
          "hidden lg:flex flex-col relative bg-[#0f3460] transition-all duration-300 ease-in-out flex-shrink-0",
          // Subtle diagonal texture overlay
          "before:absolute before:inset-0 before:opacity-[0.03]",
          "before:bg-[repeating-linear-gradient(45deg,#fff_0px,#fff_1px,transparent_1px,transparent_8px)]",
          "before:pointer-events-none",
          collapsed ? "w-16" : "w-60"
        )}
      >
        {sidebarContent}
      </aside>

      {/* ── Mobile Drawer ────────────────────────────────── */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onMobileClose}
          />
          {/* Panel */}
          <aside className="relative w-64 bg-[#0f3460] flex flex-col z-10 shadow-2xl animate-in slide-in-from-left duration-300">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
