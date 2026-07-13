"use client";

import { useEffect }  from "react";
import { cn }         from "@/lib/utils";

interface ConfirmDialogProps {
  open:        boolean;
  title:       string;
  message:     string;
  confirmLabel: string;
  variant:     "danger" | "warning" | "success";
  isLoading:   boolean;
  onConfirm:   () => void;
  onCancel:    () => void;
}

const VARIANT_STYLES = {
  danger:  { icon: "⚠️", btn: "bg-red-600 hover:bg-red-700 shadow-red-200", border: "border-red-100" },
  warning: { icon: "⚠",  btn: "bg-amber-500 hover:bg-amber-600 shadow-amber-200", border: "border-amber-100" },
  success: { icon: "✓",  btn: "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200", border: "border-emerald-100" },
};

export function ConfirmDialog({
  open, title, message, confirmLabel, variant, isLoading, onConfirm, onCancel,
}: ConfirmDialogProps) {
  const s = VARIANT_STYLES[variant];

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === "Escape") onCancel();
      if (e.key === "Enter" && !isLoading) onConfirm();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, isLoading, onConfirm, onCancel]);

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-[2px] z-[60]"
        onClick={onCancel}
      />
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 pointer-events-none">
        <div
          className={cn(
            "bg-white rounded-2xl shadow-2xl border w-full max-w-sm pointer-events-auto",
            "animate-in fade-in zoom-in-95 duration-150",
            s.border
          )}
          onClick={e => e.stopPropagation()}
        >
          <div className="p-6 text-center">
            <div className="text-4xl mb-3">{s.icon}</div>
            <h3 className="text-base font-black text-[#1a1a2e] mb-2">{title}</h3>
            <p className="text-sm text-gray-500 leading-relaxed">{message}</p>
          </div>
          <div className="flex gap-2 px-6 pb-5">
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="flex-1 h-10 text-sm font-bold rounded-xl border border-gray-200
                text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className={cn(
                "flex-1 h-10 text-sm font-bold rounded-xl text-white transition-all",
                "shadow-md disabled:opacity-60 active:scale-[0.99] flex items-center justify-center gap-2",
                s.btn
              )}
            >
              {isLoading ? (
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
