"use client";
import { UseFormReturn } from "react-hook-form";
import type { RegisterFormValues } from "@/lib/validators";
import { Input, SectionHeader, FormGrid } from "@/components/ui";
interface Props { form: UseFormReturn<RegisterFormValues> }
export function ContactSection({ form }: Props) {
  const { register, formState: { errors } } = form;
  return (
    <div>
      <SectionHeader step={2} title="Contact Details" description="Provide reachable contact information for notifications and follow-ups." icon="📞" />
      <FormGrid cols={2}>
        <Input label="Contact Number" required placeholder="09XXXXXXXXX" hint="Philippine mobile number" error={errors.CONTACT_NUMBER?.message} {...register("CONTACT_NUMBER")} />
        <Input label="Email Address" type="email" placeholder="juan@email.com" hint="Optional but recommended" error={errors.EMAIL?.message} {...register("EMAIL")} />
        <Input label="Facebook Name" placeholder="Full name on Facebook" hint="Used for announcements" error={errors.FACEBOOK_NAME?.message} {...register("FACEBOOK_NAME")} />
      </FormGrid>
    </div>
  );
}
