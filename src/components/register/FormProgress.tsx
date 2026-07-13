"use client";

import { cn } from "@/lib/utils";

export interface Step {
  id: number;
  label: string;
  icon: string;
  shortLabel: string;
}

export const FORM_STEPS: Step[] = [
  { id: 1, label: "Personal Information", shortLabel: "Personal",  icon: "👤" },
  { id: 2, label: "Contact Details",      shortLabel: "Contact",   icon: "📞" },
  { id: 3, label: "Address",              shortLabel: "Address",   icon: "🏠" },
  { id: 4, label: "Family Background",    shortLabel: "Family",    icon: "👨‍👩‍👧" },
  { id: 5, label: "Education",            shortLabel: "Education", icon: "🎓" },
  { id: 6, label: "Program Info",         shortLabel: "Program",   icon: "📋" },
  { id: 7, label: "Documents",            shortLabel: "Documents", icon: "📄" },
];

interface FormProgressProps {
  currentStep: number;
  completedSteps: Set<number>;
  onStepClick?: (step: number) => void;
}

export function FormProgress({ currentStep, completedSteps, onStepClick }: FormProgressProps) {
  return (
    <div className="w-full">
      <div className="hidden lg:flex items-center w-full">
        {FORM_STEPS.map((step, idx) => {
          const isCompleted = completedSteps.has(step.id);
          const isActive    = step.id === currentStep;
          const isClickable = isCompleted || step.id <= Math.max(currentStep, 1);
          return (
            <div key={step.id} className="flex items-center flex-1 last:flex-none">
              <button
                type="button"
                onClick={() => isClickable && onStepClick?.(step.id)}
                disabled={!isClickable}
                className={cn("flex flex-col items-center gap-1.5 transition-all duration-200", isClickable ? "cursor-pointer" : "cursor-not-allowed opacity-40")}
              >
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 border-2",
                  isCompleted && !isActive ? "bg-emerald-500 border-emerald-500 text-white" : "",
                  isActive ? "bg-[#0f3460] border-[#0f3460] text-white shadow-lg shadow-[#0f3460]/30 scale-110" : "",
                  !isActive && !isCompleted ? "bg-white border-gray-200 text-gray-400" : ""
                )}>
                  {isCompleted && !isActive ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : <span className="text-base leading-none">{step.icon}</span>}
                </div>
                <span className={cn("text-[10px] font-semibold tracking-wide whitespace-nowrap", isActive ? "text-[#0f3460]" : isCompleted ? "text-emerald-600" : "text-gray-400")}>
                  {step.shortLabel}
                </span>
              </button>
              {idx < FORM_STEPS.length - 1 && (
                <div className="flex-1 mx-2 h-0.5 rounded-full overflow-hidden bg-gray-100">
                  <div className={cn("h-full rounded-full transition-all duration-500", completedSteps.has(step.id) ? "w-full bg-emerald-400" : "w-0")} />
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="lg:hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-[#0f3460] uppercase tracking-widest">Step {currentStep} of {FORM_STEPS.length}</span>
          <span className="text-xs font-semibold text-gray-500">{FORM_STEPS.find(s => s.id === currentStep)?.label}</span>
        </div>
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-[#0f3460] to-[#e94560] rounded-full transition-all duration-500" style={{ width: `${((currentStep - 1) / (FORM_STEPS.length - 1)) * 100}%` }} />
        </div>
      </div>
    </div>
  );
}
