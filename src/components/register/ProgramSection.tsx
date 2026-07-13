"use client";

import { UseFormReturn, useWatch } from "react-hook-form";
import type { RegisterFormValues } from "@/lib/validators";
import {
  Select, Input, Checkbox, SectionHeader, FormGrid, FormSpan, UPPERCASE_INPUT
} from "@/components/ui";
import { SECTORS, TARGET_GROUPS } from "@/lib/constants";

interface Props {
  form: UseFormReturn<RegisterFormValues>;
}

export function ProgramSection({ form }: Props) {
  const { register, control, setValue, formState: { errors } } = form;

  const firstTime = useWatch({ control, name: "FIRST_TIME_APPLICANT" });

  return (
    <div>
      <SectionHeader
        step={6}
        title="Program Information"
        description="Specify the applicant's sector assignment and program eligibility details."
        icon="📋"
      />

      <FormGrid cols={2}>
        <Select
          label="Sector"
          required
          placeholder="— Select Sector —"
          options={SECTORS}
          error={errors.SECTOR?.message}
          {...register("SECTOR")}
        />
        <Select
          label="Target Group"
          required
          placeholder="— Select Target Group —"
          options={TARGET_GROUPS}
          error={errors.TARGET_GROUP?.message}
          {...register("TARGET_GROUP")}
        />

        <div className="col-span-full mt-2 space-y-3">
          <Checkbox
            id="first-time"
            label="First-Time GIP Applicant"
            description="Check if this is the applicant's first time applying for the Government Internship Program"
            checked={firstTime !== false}
            onChange={(v) => setValue("FIRST_TIME_APPLICANT", v)}
          />
        </div>

        {firstTime === false && (
          <FormSpan cols={2}>
            <Input
              label="Previous GIP Availment Details"
              className={UPPERCASE_INPUT}
              placeholder="e.g. Batch 2024-01, Agriculture Sector"
              hint="Provide batch and year of previous participation"
              error={errors.PREVIOUS_GIP_AVAILMENT?.message}
              {...register("PREVIOUS_GIP_AVAILMENT")}
            />
          </FormSpan>
        )}
      </FormGrid>

      {/* Info box */}
      <div className="mt-5 p-4 rounded-xl bg-blue-50 border border-blue-100">
        <p className="text-xs font-semibold text-blue-700 mb-1 flex items-center gap-1.5">
          <span>ℹ️</span> About the Program
        </p>
        <p className="text-xs text-blue-600 leading-relaxed">
          The Government Internship Program (GIP) provides qualified indigent youth with practical
          work experience in government offices. Participants receive a daily stipend and skills
          training for the duration of the program.
        </p>
      </div>
    </div>
  );
}
