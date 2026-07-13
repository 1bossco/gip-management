"use client";
import { UseFormReturn } from "react-hook-form";
import type { RegisterFormValues } from "@/lib/validators";
import { Input, SectionHeader, FormGrid } from "@/components/ui";
interface Props { form: UseFormReturn<RegisterFormValues> }
export function FamilySection({ form }: Props) {
  const { register, formState: { errors } } = form;
  return (
    <div>
      <SectionHeader step={4} title="Family Background" description="Provide information about the applicant's parents or guardians." icon="👨‍👩‍👧" />
      <div className="space-y-6">
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Father / Guardian (Male)</p>
          <FormGrid cols={3}>
            <Input label="Father's Full Name" placeholder="Last, First Middle" error={errors.FATHER_NAME?.message} {...register("FATHER_NAME")} />
            <Input label="Occupation" placeholder="e.g. Farmer, Driver" error={errors.FATHER_OCCUPATION?.message} {...register("FATHER_OCCUPATION")} />
            <Input label="Contact Number" placeholder="09XXXXXXXXX" error={errors.FATHER_CONTACT?.message} {...register("FATHER_CONTACT")} />
          </FormGrid>
        </div>
        <div className="border-t border-dashed border-gray-100 pt-5">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Mother / Guardian (Female)</p>
          <FormGrid cols={3}>
            <Input label="Mother's Full Name" placeholder="Last, First Middle" error={errors.MOTHER_NAME?.message} {...register("MOTHER_NAME")} />
            <Input label="Occupation" placeholder="e.g. Housewife, Vendor" error={errors.MOTHER_OCCUPATION?.message} {...register("MOTHER_OCCUPATION")} />
            <Input label="Contact Number" placeholder="09XXXXXXXXX" error={errors.MOTHER_CONTACT?.message} {...register("MOTHER_CONTACT")} />
          </FormGrid>
        </div>
      </div>
    </div>
  );
}
