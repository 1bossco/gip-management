"use client";

import { UseFormReturn, useWatch } from "react-hook-form";
import type { RegisterFormValues } from "@/lib/validators";
import {
  Input, Select, Checkbox, SectionHeader, FormGrid, FormSpan
} from "@/components/ui";
import {
  EDUCATIONAL_STATUS_OPTIONS,
  SHS_TRACKS,
  YEAR_LEVELS,
} from "@/lib/constants";

interface Props {
  form: UseFormReturn<RegisterFormValues>;
}

export function EducationSection({ form }: Props) {
  const { register, control, setValue, formState: { errors } } = form;

  const eduStatus      = useWatch({ control, name: "EDUCATIONAL_STATUS" });
  const withSummer     = useWatch({ control, name: "WITH_SUMMER_CLASS" });
  const graduatingNext = useWatch({ control, name: "GRADUATING_NEXT_YEAR" });

  const isCollege = eduStatus === "COLLEGE" || eduStatus === "GRADUATE" || eduStatus === "VOCATIONAL";
  const isSHS     = eduStatus === "SHS";

  return (
    <div>
      <SectionHeader
        step={5}
        title="Educational Information"
        description="Provide the applicant's current school and academic details."
        icon="🎓"
      />

      <FormGrid cols={2}>
        <Select
          label="Educational Status"
          required
          placeholder="— Select Status —"
          options={EDUCATIONAL_STATUS_OPTIONS}
          error={errors.EDUCATIONAL_STATUS?.message}
          {...register("EDUCATIONAL_STATUS")}
        />

        <FormSpan cols={2}>
          <Input
            label="School Name"
            required
            placeholder="Full name of school or university"
            error={errors.SCHOOL_NAME?.message}
            {...register("SCHOOL_NAME")}
          />
        </FormSpan>

        {isCollege && (
          <FormSpan cols={2}>
            <Input
              label="Course / Program"
              required={eduStatus === "COLLEGE"}
              placeholder="e.g. BS Agriculture, BS Nursing"
              error={errors.COURSE?.message}
              {...register("COURSE")}
            />
          </FormSpan>
        )}

        {isCollege && (
          <Select
            label="Year Level"
            placeholder="— Select Year Level —"
            options={YEAR_LEVELS.map(v => ({ value: v, label: v }))}
            error={errors.YEAR_LEVEL?.message}
            {...register("YEAR_LEVEL")}
          />
        )}

        {isSHS && (
          <>
            <Select
              label="SHS Track / Strand"
              required
              placeholder="— Select Track —"
              options={SHS_TRACKS.map(v => ({ value: v, label: v }))}
              error={errors.SHS_TRACK?.message}
              {...register("SHS_TRACK")}
            />
            <Select
              label="Grade Level"
              placeholder="— Select Grade —"
              options={[
                { value: "Grade 11", label: "Grade 11" },
                { value: "Grade 12", label: "Grade 12" },
              ]}
              error={errors.YEAR_LEVEL?.message}
              {...register("YEAR_LEVEL")}
            />
          </>
        )}

        {/* Boolean toggles */}
        <div className="col-span-full mt-2 space-y-3">
          <Checkbox
            id="with-summer"
            label="Enrolled in Summer Class"
            description="Check if the applicant is currently taking a summer class"
            checked={!!withSummer}
            onChange={(v) => setValue("WITH_SUMMER_CLASS", v)}
          />
          <Checkbox
            id="graduating-next"
            label="Graduating Next School Year"
            description="Check if the applicant is expected to graduate in the next academic year"
            checked={!!graduatingNext}
            onChange={(v) => setValue("GRADUATING_NEXT_YEAR", v)}
          />
        </div>
      </FormGrid>
    </div>
  );
}
