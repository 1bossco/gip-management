"use client";
import { UseFormReturn } from "react-hook-form";
import type { RegisterFormValues } from "@/lib/validators";
import { Input, Select, SectionHeader, FormGrid } from "@/components/ui";
import { SEX_OPTIONS, CIVIL_STATUS_OPTIONS } from "@/lib/constants";
interface Props { form: UseFormReturn<RegisterFormValues> }
export function PersonalInfoSection({ form }: Props) {
  const { register, formState: { errors } } = form;
  return (
    <div>
      <SectionHeader step={1} title="Personal Information" description="Enter details exactly as they appear on official documents." icon="👤" />
      <FormGrid cols={2}>
        <Input label="Surname" required placeholder="e.g. DELA CRUZ" error={errors.SURNAME?.message} {...register("SURNAME")} />
        <Input label="First Name" required placeholder="e.g. JUAN" error={errors.FIRST_NAME?.message} {...register("FIRST_NAME")} />
        <Input label="Middle Name" placeholder="e.g. SANTOS" hint="Leave blank if none" error={errors.MIDDLE_NAME?.message} {...register("MIDDLE_NAME")} />
        <Input label="Extension Name" placeholder="JR., SR., III" hint="Leave blank if not applicable" error={errors.EXTENSION_NAME?.message} {...register("EXTENSION_NAME")} />
        <Input label="Date of Birth" type="date" required error={errors.DATE_OF_BIRTH?.message} hint="Applicant must be 15–40 years old" {...register("DATE_OF_BIRTH")} />
        <Input label="Place of Birth" required placeholder="e.g. Balanga City, Bataan" error={errors.PLACE_OF_BIRTH?.message} {...register("PLACE_OF_BIRTH")} />
        <Input label="Citizenship" placeholder="FILIPINO" error={errors.CITIZENSHIP?.message} {...register("CITIZENSHIP")} />
        <Select label="Sex" required placeholder="— Select Sex —" options={SEX_OPTIONS.map(v => ({ value: v, label: v }))} error={errors.SEX?.message} {...register("SEX")} />
        <Select label="Civil Status" required placeholder="— Select Civil Status —" options={CIVIL_STATUS_OPTIONS.map(v => ({ value: v, label: v }))} error={errors.CIVIL_STATUS?.message} {...register("CIVIL_STATUS")} />
      </FormGrid>
    </div>
  );
}
