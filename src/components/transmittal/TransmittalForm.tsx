"use client";

import { useEffect, useState }        from "react";
import { useForm, type Resolver }      from "react-hook-form";
import { z }                           from "zod";
import { zodResolver }                 from "@hookform/resolvers/zod";
import { TransmittalFilterSchema }     from "@/lib/validators";
import type { TransmittalFilters }     from "@/types";
import { getBatches, isApiSuccess }    from "@/lib/api";
import { SECTORS, MUNICIPALITIES }     from "@/lib/constants";
import { cn }                          from "@/lib/utils";

type FormValues = z.output<typeof TransmittalFilterSchema>;

interface TransmittalFormProps {
  onGenerate:  (filters: TransmittalFilters) => void;
  isGenerating: boolean;
}

// ── Compact form field ────────────────────────────────────────

function Field({
  label, required, error, children,
}: {
  label:    string;
  required?: boolean;
  error?:   string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-black text-[#1a1a2e] uppercase tracking-[0.12em]">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && (
        <p className="text-[10px] text-red-600 flex items-center gap-1">
          <span>⚠</span>{error}
        </p>
      )}
    </div>
  );
}

function StyledSelect({
  value, onChange, options, placeholder, hasValue,
}: {
  value:       string;
  onChange:    React.ChangeEventHandler<HTMLSelectElement>;
  options:     { value: string; label: string }[];
  placeholder: string;
  hasValue?:   boolean;
}) {
  return (
    <select
      value={value}
      onChange={onChange}
      className={cn(
        "w-full h-9 px-3 pr-8 text-xs font-semibold rounded-xl border bg-white appearance-none",
        "focus:outline-none focus:ring-2 focus:ring-[#0f3460]/20 focus:border-[#0f3460]",
        "transition-colors duration-150 cursor-pointer",
        hasValue
          ? "border-[#0f3460]/40 text-[#0f3460] bg-[#f0f4ff]"
          : "border-gray-200 text-gray-500 hover:border-gray-300"
      )}
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 10 10'%3E%3Cpath fill='%23666' d='M5 7L1 3h8z'/%3E%3C/svg%3E")`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 10px center",
      }}
    >
      <option value="">{placeholder}</option>
      {options.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

// ── TransmittalForm ───────────────────────────────────────────

export function TransmittalForm({ onGenerate, isGenerating }: TransmittalFormProps) {
  const [batches, setBatches] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    getBatches().then(res => {
      if (isApiSuccess(res)) {
        setBatches(res.data.map(b => ({ value: b.BATCH_NAME, label: `${b.BATCH_NAME} (${b.STATUS})` })));
      }
    });
  }, []);

  const {
    register, handleSubmit, watch, setValue,
    formState: { errors },
  } = useForm<FormValues>({
    // .default() fields are optional on the schema's input type but required on its
    // output type, so zodResolver's generic doesn't match the output-shaped FormValues.
    resolver: zodResolver(TransmittalFilterSchema) as Resolver<FormValues>,
    defaultValues: {
      batchName: "", sector: "ALL", municipality: "ALL",
      applicationStatus: "ALL", targetCount: undefined,
    },
  });

  const watched = watch();

  const onSubmit = (data: FormValues) => {
    onGenerate({
      batchName:         data.batchName,
      sector:            (data.sector || "ALL") as TransmittalFilters["sector"],
      municipality:      data.municipality || "ALL",
      applicationStatus: (data.applicationStatus || "ALL") as TransmittalFilters["applicationStatus"],
      targetCount:       data.targetCount,
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 pb-5 border-b border-gray-50">
        <div className="w-10 h-10 rounded-xl bg-[#0f3460] flex items-center justify-center text-white text-xl flex-shrink-0">
          ⎙
        </div>
        <div>
          <h2 className="text-sm font-black text-[#1a1a2e] tracking-tight">Generate Transmittal</h2>
          <p className="text-xs text-gray-400 mt-0.5">Configure filters then generate the official transmittal list.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">

        {/* Batch — required */}
        <Field label="Batch" required error={errors.batchName?.message}>
          <StyledSelect
            value={watched.batchName}
            onChange={e => setValue("batchName", e.target.value)}
            options={batches}
            placeholder="— Select Batch —"
            hasValue={!!watched.batchName}
          />
        </Field>

        {/* Sector */}
        <Field label="Sector">
          <StyledSelect
            value={watched.sector ?? "ALL"}
            onChange={e => setValue("sector", e.target.value)}
            options={[
              { value: "ALL", label: "All Sectors" },
              ...SECTORS,
            ]}
            placeholder="All Sectors"
            hasValue={watched.sector !== "ALL" && !!watched.sector}
          />
        </Field>

        {/* Municipality */}
        <Field label="Municipality">
          <StyledSelect
            value={watched.municipality ?? "ALL"}
            onChange={e => setValue("municipality", e.target.value)}
            options={[
              { value: "ALL", label: "All Municipalities" },
              ...MUNICIPALITIES.map(m => ({ value: m, label: m })),
            ]}
            placeholder="All Municipalities"
            hasValue={watched.municipality !== "ALL" && !!watched.municipality}
          />
        </Field>

        {/* Application Status */}
        <Field label="Application Status">
          <StyledSelect
            value={watched.applicationStatus ?? "ALL"}
            onChange={e => setValue("applicationStatus", e.target.value as FormValues["applicationStatus"])}
            options={[
              { value: "ALL",         label: "All Statuses"  },
              { value: "APPROVED",    label: "✓ Approved"    },
              { value: "PENDING",     label: "⏳ Pending"     },
              { value: "DISAPPROVED", label: "✕ Disapproved" },
            ]}
            placeholder="All Statuses"
            hasValue={watched.applicationStatus !== "ALL" && !!watched.applicationStatus}
          />
        </Field>

        {/* Target count */}
        <Field label="Limit Results" error={errors.targetCount?.message}>
          <input
            type="number"
            min={1}
            max={1000}
            placeholder="Leave blank for all"
            className="w-full h-9 px-3 text-xs font-semibold rounded-xl border border-gray-200
              bg-white placeholder:text-gray-300 focus:outline-none focus:ring-2
              focus:ring-[#0f3460]/20 focus:border-[#0f3460] transition-colors"
            {...register("targetCount", { valueAsNumber: true })}
          />
        </Field>

        {/* Divider */}
        <div className="pt-1 border-t border-gray-50" />

        {/* Submit */}
        <button
          type="submit"
          disabled={isGenerating || !watched.batchName}
          className={cn(
            "w-full py-3 text-sm font-bold rounded-xl transition-all duration-200",
            "focus:outline-none focus:ring-2 focus:ring-[#0f3460]/30 focus:ring-offset-2",
            "flex items-center justify-center gap-2 shadow-md",
            isGenerating || !watched.batchName
              ? "bg-gray-100 text-gray-400 cursor-not-allowed shadow-none"
              : "bg-[#0f3460] text-white hover:bg-[#16213e] active:scale-[0.99] shadow-[#0f3460]/20"
          )}
        >
          {isGenerating ? (
            <>
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Generating…
            </>
          ) : (
            <>⎙ Generate Transmittal</>
          )}
        </button>
      </form>
    </div>
  );
}
