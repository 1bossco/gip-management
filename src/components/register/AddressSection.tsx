"use client";
import { UseFormReturn } from "react-hook-form";
import type { RegisterFormValues } from "@/lib/validators";
import { Input, Select, SectionHeader, FormGrid, FormSpan } from "@/components/ui";
import { MUNICIPALITIES } from "@/lib/constants";
interface Props { form: UseFormReturn<RegisterFormValues> }
export function AddressSection({ form }: Props) {
  const { register, formState: { errors } } = form;
  return (
    <div>
      <SectionHeader step={3} title="Address" description="Provide the current and permanent residence of the applicant." icon="🏠" />
      <FormGrid cols={2}>
        <FormSpan cols={2}>
          <Input label="Present Address" required placeholder="House No., Street, Barangay, Municipality" error={errors.PRESENT_ADDRESS?.message} {...register("PRESENT_ADDRESS")} />
        </FormSpan>
        <FormSpan cols={2}>
          <Input label="Permanent Address" placeholder="If same as present address, leave blank" error={errors.PERMANENT_ADDRESS?.message} {...register("PERMANENT_ADDRESS")} />
        </FormSpan>
        <Select label="Municipality" required placeholder="— Select Municipality —" options={MUNICIPALITIES.map(v => ({ value: v, label: v }))} error={errors.MUNICIPALITY?.message} {...register("MUNICIPALITY")} />
        <Input label="Barangay" required placeholder="e.g. Barangay Uno" error={errors.BARANGAY?.message} {...register("BARANGAY")} />
      </FormGrid>
    </div>
  );
}
