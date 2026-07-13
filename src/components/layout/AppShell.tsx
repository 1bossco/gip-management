"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Sidebar }   from "./Sidebar";
import { Topbar }    from "./Topbar";

// Routes that render WITHOUT the shell (full-page layouts)
const SHELL_EXCLUDED = ["/login", "/register"];

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const [collapsed,   setCollapsed]   = useState(false);
  const [mobileOpen,  setMobileOpen]  = useState(false);

  // Collapse sidebar on mobile by default, restore on desktop
  useEffect(() => {
    function handleResize() {
      if (window.innerWidth < 1024) setCollapsed(false);
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Render naked (no shell) for excluded routes
  const isExcluded = SHELL_EXCLUDED.some(p =>
    pathname === p || pathname.startsWith(p + "/")
  );
  if (isExcluded) return <>{children}</>;

  return (
    <div className="flex h-screen overflow-hidden bg-[#f7f8fc]">
      <Sidebar
        collapsed={collapsed}
        onCollapse={setCollapsed}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      {/* Main column */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar onMobileMenuOpen={() => setMobileOpen(true)} />

        {/* Page content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
