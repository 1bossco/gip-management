import { cn } from "@/lib/utils";

interface PageWrapperProps {
  children:   React.ReactNode;
  className?: string;
  // Optional: render action buttons in top-right of page header
  actions?:   React.ReactNode;
  // Optional: page-level alert/banner (e.g. "X applicants incomplete")
  banner?:    React.ReactNode;
  // Max width override — defaults to full width with padding
  maxWidth?:  "sm" | "md" | "lg" | "xl" | "full";
  // Remove default padding (for full-bleed table layouts)
  noPadding?: boolean;
}

const MAX_WIDTHS = {
  sm:   "max-w-2xl",
  md:   "max-w-4xl",
  lg:   "max-w-6xl",
  xl:   "max-w-7xl",
  full: "max-w-none",
};

export function PageWrapper({
  children,
  className,
  actions,
  banner,
  maxWidth = "full",
  noPadding = false,
}: PageWrapperProps) {
  return (
    <main className="flex-1 overflow-y-auto bg-[#f7f8fc] min-h-0">
      {/* Optional banner */}
      {banner && (
        <div className="sticky top-0 z-10">
          {banner}
        </div>
      )}

      <div className={cn(
        "mx-auto",
        MAX_WIDTHS[maxWidth],
        noPadding ? "" : "px-4 lg:px-6 py-6",
        className
      )}>
        {/* Optional page-level actions row */}
        {actions && (
          <div className="flex items-center justify-end mb-4 gap-2">
            {actions}
          </div>
        )}

        {children}
      </div>
    </main>
  );
}

// ── Section dividers used inside pages ───────────────────────

export function PageSection({
  title,
  description,
  actions,
  children,
  className,
}: {
  title?:       string;
  description?: string;
  actions?:     React.ReactNode;
  children:     React.ReactNode;
  className?:   string;
}) {
  return (
    <section className={cn("mb-6", className)}>
      {(title || actions) && (
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            {title && (
              <h2 className="text-base font-black text-[#1a1a2e] leading-tight">{title}</h2>
            )}
            {description && (
              <p className="text-xs text-gray-400 mt-0.5">{description}</p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

// ── Empty state ───────────────────────────────────────────────

export function EmptyState({
  icon = "📭",
  title,
  description,
  action,
}: {
  icon?:        string;
  title:        string;
  description?: string;
  action?:      React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="text-5xl mb-4 opacity-40">{icon}</div>
      <h3 className="text-sm font-bold text-gray-500 mb-1">{title}</h3>
      {description && (
        <p className="text-xs text-gray-400 max-w-xs">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// ── Loading skeleton ──────────────────────────────────────────

export function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div className={cn(
      "bg-gray-200 rounded-lg animate-pulse",
      className
    )} />
  );
}

export function PageSkeleton() {
  return (
    <div className="space-y-4 p-6">
      <div className="flex gap-4">
        {[1,2,3,4].map(i => (
          <SkeletonBlock key={i} className="h-28 flex-1 rounded-xl" />
        ))}
      </div>
      <SkeletonBlock className="h-64 w-full rounded-xl" />
      <SkeletonBlock className="h-48 w-full rounded-xl" />
    </div>
  );
}
