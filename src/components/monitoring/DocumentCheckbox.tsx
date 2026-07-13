"use client";

import { cn } from "@/lib/utils";

interface DocumentCheckboxProps {
  field:       string;     // field key for aria label
  checked:     boolean;
  updating:    boolean;    // true while API call in flight
  disabled?:  boolean;
  onChange:    (value: boolean) => void;
  shortLabel:  string;
}

export function DocumentCheckbox({
  field, checked, updating, disabled, onChange, shortLabel,
}: DocumentCheckboxProps) {
  return (
    <button
      type="button"
      disabled={updating || disabled}
      onClick={() => !updating && !disabled && onChange(!checked)}
      aria-label={`${checked ? "Unmark" : "Mark"} ${shortLabel} as submitted`}
      title={shortLabel}
      className={cn(
        "relative w-5 h-5 rounded flex items-center justify-center",
        "transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1",
        updating
          ? "opacity-60 cursor-wait"
          : disabled
          ? "opacity-30 cursor-not-allowed"
          : "cursor-pointer hover:scale-110 active:scale-95",
        checked
          ? "bg-emerald-500 border-0 focus:ring-emerald-400 shadow-sm shadow-emerald-200"
          : "bg-white border-2 border-gray-200 hover:border-emerald-400 focus:ring-gray-300",
      )}
    >
      {updating ? (
        /* Spinner overlay */
        <span className={cn(
          "absolute inset-0 flex items-center justify-center rounded",
          checked ? "bg-emerald-500" : "bg-white"
        )}>
          <span className={cn(
            "w-2.5 h-2.5 border-2 border-t-transparent rounded-full animate-spin",
            checked ? "border-white" : "border-gray-400"
          )} />
        </span>
      ) : checked ? (
        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24"
          stroke="currentColor" strokeWidth={3.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      ) : null}
    </button>
  );
}

// ── DocProgressPill — compact "3/7" pill shown in table row ──

interface DocProgressPillProps {
  submitted: number;
  required:  number;
}

export function DocProgressPill({ submitted, required }: DocProgressPillProps) {
  const complete = submitted === required;
  return (
    <span className={cn(
      "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black tabular-nums",
      complete
        ? "bg-emerald-100 text-emerald-700"
        : submitted > 0
        ? "bg-amber-100 text-amber-700"
        : "bg-gray-100 text-gray-400"
    )}>
      {submitted}/{required}
    </span>
  );
}
