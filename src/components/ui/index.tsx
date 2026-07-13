"use client";

import React from "react";
import { cn } from "@/lib/utils";

// ── Button ────────────────────────────────────────────────────

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", loading, icon, children, className, disabled, ...props }, ref) => {
    const base = "inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
    const variants = {
      primary:   "bg-[#0f3460] text-white hover:bg-[#16213e] focus:ring-[#0f3460] shadow-md hover:shadow-lg active:scale-[0.98]",
      secondary: "bg-white text-[#0f3460] border-2 border-[#0f3460] hover:bg-[#f0f4ff] focus:ring-[#0f3460] active:scale-[0.98]",
      ghost:     "bg-transparent text-[#0f3460] hover:bg-[#f0f4ff] focus:ring-[#0f3460]",
      danger:    "bg-red-600 text-white hover:bg-red-700 focus:ring-red-600 shadow-md",
    };
    const sizes = {
      sm:  "px-3 py-1.5 text-sm",
      md:  "px-5 py-2.5 text-sm",
      lg:  "px-7 py-3.5 text-base",
    };
    return (
      <button ref={ref} className={cn(base, variants[variant], sizes[size], className)} disabled={disabled || loading} {...props}>
        {loading ? <Spinner size="sm" color={variant === "primary" ? "white" : "primary"} /> : icon}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

// ── Input ─────────────────────────────────────────────────────

// Free-text entries are shown upper-cased as the applicant types; the Zod schema
// applies the same transform on submit, so the stored value matches what's shown.
// Placeholders stay in normal case so the examples/hints remain readable.
export const UPPERCASE_INPUT = "uppercase placeholder:normal-case";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, required, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={inputId} className="text-xs font-semibold text-[#1a1a2e] tracking-wide uppercase">
            {label}{required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "w-full px-3.5 py-2.5 rounded-lg border text-sm text-[#1a1a2e] bg-white",
            "placeholder:text-gray-400 transition-all duration-150",
            "focus:outline-none focus:ring-2 focus:ring-[#0f3460]/30 focus:border-[#0f3460]",
            error ? "border-red-400 bg-red-50 focus:ring-red-200 focus:border-red-400" : "border-gray-200 hover:border-gray-300",
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-red-600 flex items-center gap-1"><span>⚠</span>{error}</p>}
        {hint && !error && <p className="text-xs text-gray-400">{hint}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";

// ── Select ────────────────────────────────────────────────────

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, required, options, placeholder, className, id, ...props }, ref) => {
    const selectId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={selectId} className="text-xs font-semibold text-[#1a1a2e] tracking-wide uppercase">
            {label}{required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={cn(
            "w-full px-3.5 py-2.5 rounded-lg border text-sm text-[#1a1a2e] bg-white appearance-none",
            "transition-all duration-150 cursor-pointer",
            "focus:outline-none focus:ring-2 focus:ring-[#0f3460]/30 focus:border-[#0f3460]",
            error ? "border-red-400 bg-red-50" : "border-gray-200 hover:border-gray-300",
            className
          )}
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23666' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center" }}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        {error && <p className="text-xs text-red-600 flex items-center gap-1"><span>⚠</span>{error}</p>}
        {hint && !error && <p className="text-xs text-gray-400">{hint}</p>}
      </div>
    );
  }
);
Select.displayName = "Select";

// ── Checkbox ──────────────────────────────────────────────────

interface CheckboxProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: string;
  id?: string;
  description?: string;
}

export function Checkbox({ label, checked, onChange, error, id, description }: CheckboxProps) {
  return (
    <div className="flex flex-col gap-0.5">
      <label htmlFor={id} className="flex items-start gap-3 cursor-pointer group">
        <div className={cn(
          "mt-0.5 w-5 h-5 flex-shrink-0 rounded border-2 flex items-center justify-center transition-all duration-150",
          checked ? "bg-[#0f3460] border-[#0f3460]" : "bg-white border-gray-300 group-hover:border-[#0f3460]"
        )}>
          {checked && (
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
        <div>
          <input id={id} type="checkbox" className="sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
          <span className="text-sm font-medium text-[#1a1a2e]">{label}</span>
          {description && <p className="text-xs text-gray-400 mt-0.5">{description}</p>}
        </div>
      </label>
      {error && <p className="text-xs text-red-600 ml-8">{error}</p>}
    </div>
  );
}

// ── Spinner ───────────────────────────────────────────────────

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  color?: "primary" | "white" | "gray";
}

export function Spinner({ size = "md", color = "primary" }: SpinnerProps) {
  const sizes = { sm: "w-4 h-4", md: "w-6 h-6", lg: "w-8 h-8" };
  const colors = { primary: "border-[#0f3460]", white: "border-white", gray: "border-gray-400" };
  return (
    <div className={cn("rounded-full border-2 border-t-transparent animate-spin", sizes[size], colors[color])} />
  );
}

// ── StatusBadge ───────────────────────────────────────────────

interface StatusBadgeProps {
  status: string;
  size?: "sm" | "md";
}

const STATUS_MAP: Record<string, { bg: string; text: string; dot: string }> = {
  COMPLETE:     { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  INCOMPLETE:   { bg: "bg-amber-50",   text: "text-amber-700",   dot: "bg-amber-500" },
  PENDING:      { bg: "bg-sky-50",     text: "text-sky-700",     dot: "bg-sky-500" },
  APPROVED:     { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  DISAPPROVED:  { bg: "bg-red-50",     text: "text-red-700",     dot: "bg-red-500" },
};

export function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const s = STATUS_MAP[status] ?? { bg: "bg-gray-100", text: "text-gray-600", dot: "bg-gray-400" };
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full font-semibold", s.bg, s.text, size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-xs")}>
      <span className={cn("rounded-full flex-shrink-0", s.dot, size === "sm" ? "w-1.5 h-1.5" : "w-2 h-2")} />
      {status}
    </span>
  );
}

// ── Card ──────────────────────────────────────────────────────

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: "sm" | "md" | "lg";
}

export function Card({ children, className, padding = "md" }: CardProps) {
  const pads = { sm: "p-4", md: "p-6", lg: "p-8" };
  return (
    <div className={cn("bg-white rounded-2xl border border-gray-100 shadow-sm", pads[padding], className)}>
      {children}
    </div>
  );
}

// ── SectionHeader ─────────────────────────────────────────────

interface SectionHeaderProps {
  step: number;
  title: string;
  description: string;
  icon: string;
}

export function SectionHeader({ step, title, description, icon }: SectionHeaderProps) {
  return (
    <div className="flex items-start gap-4 mb-6 pb-5 border-b border-gray-100">
      <div className="w-11 h-11 rounded-xl bg-[#0f3460] text-white flex items-center justify-center text-xl flex-shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-xs font-bold text-[#0f3460] uppercase tracking-widest mb-0.5">Step {step} of 7</p>
        <h2 className="text-lg font-bold text-[#1a1a2e]">{title}</h2>
        <p className="text-sm text-gray-500 mt-0.5">{description}</p>
      </div>
    </div>
  );
}

// ── FormGrid ──────────────────────────────────────────────────

export function FormGrid({ children, cols = 2 }: { children: React.ReactNode; cols?: 1 | 2 | 3 }) {
  const gridCols = { 1: "grid-cols-1", 2: "grid-cols-1 sm:grid-cols-2", 3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" };
  return <div className={cn("grid gap-4", gridCols[cols])}>{children}</div>;
}

export function FormSpan({ children, cols = 2 }: { children: React.ReactNode; cols?: 1 | 2 | 3 }) {
  const spans = { 1: "col-span-1", 2: "sm:col-span-2", 3: "sm:col-span-2 lg:col-span-3" };
  return <div className={spans[cols]}>{children}</div>;
}
