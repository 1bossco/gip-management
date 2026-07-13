"use client";
import { useEffect } from "react";
import { UseFormReturn, useWatch } from "react-hook-form";
import type { RegisterFormValues } from "@/lib/validators";
import {
  Input, Select, Checkbox, SectionHeader, FormGrid, FormSpan, UPPERCASE_INPUT
} from "@/components/ui";
import { ADDRESS_MUNICIPALITIES, BARANGAYS_BY_MUNICIPALITY } from "@/lib/constants";
import { composeAddress } from "@/lib/utils";

interface Props { form: UseFormReturn<RegisterFormValues> }

const toOptions = (values: string[]) => values.map(v => ({ value: v, label: v }));

export function AddressSection({ form }: Props) {
  const { register, control, setValue, formState: { errors } } = form;

  const municipality     = useWatch({ control, name: "MUNICIPALITY" });
  const barangay         = useWatch({ control, name: "BARANGAY" });
  const street           = useWatch({ control, name: "PRESENT_STREET" });
  const sameAsPresent    = useWatch({ control, name: "SAME_AS_PRESENT" });
  const permMunicipality = useWatch({ control, name: "PERMANENT_MUNICIPALITY" });
  const permBarangay     = useWatch({ control, name: "PERMANENT_BARANGAY" });
  const permStreet       = useWatch({ control, name: "PERMANENT_STREET" });

  const barangays     = BARANGAYS_BY_MUNICIPALITY[municipality] ?? [];
  const permBarangays = BARANGAYS_BY_MUNICIPALITY[permMunicipality] ?? [];

  // A barangay only exists within one municipality, so changing the municipality
  // invalidates the selected barangay — clear it rather than submit a mismatch.
  useEffect(() => {
    if (barangay && !barangays.includes(barangay)) {
      setValue("BARANGAY", "", { shouldValidate: false });
    }
  }, [municipality, barangay, barangays, setValue]);

  useEffect(() => {
    if (permBarangay && !permBarangays.includes(permBarangay)) {
      setValue("PERMANENT_BARANGAY", "", { shouldValidate: false });
    }
  }, [permMunicipality, permBarangay, permBarangays, setValue]);

  const presentPreview = composeAddress(street ?? "", barangay ?? "", municipality ?? "");
  const permanentPreview = sameAsPresent
    ? presentPreview
    : composeAddress(permStreet ?? "", permBarangay ?? "", permMunicipality ?? "");

  return (
    <div>
      <SectionHeader
        step={3}
        title="Address"
        description="Type only the house no. / street — the barangay and municipality are selected below."
        icon="🏠"
      />

      <FormGrid cols={2}>
        <FormSpan cols={2}>
          <Input
            label="House No. / Street"
            required
            className={UPPERCASE_INPUT}
            placeholder="e.g. 123 Mabini St."
            hint="Do not include the barangay or municipality — they are added automatically"
            error={errors.PRESENT_STREET?.message}
            {...register("PRESENT_STREET")}
          />
        </FormSpan>

        <Select
          label="Municipality"
          required
          placeholder="— Select Municipality —"
          options={toOptions(ADDRESS_MUNICIPALITIES)}
          error={errors.MUNICIPALITY?.message}
          {...register("MUNICIPALITY")}
        />

        <Select
          label="Barangay"
          required
          disabled={!municipality}
          placeholder={municipality ? "— Select Barangay —" : "— Select a municipality first —"}
          options={toOptions(barangays)}
          error={errors.BARANGAY?.message}
          {...register("BARANGAY")}
        />

        <FormSpan cols={2}>
          <AddressPreview label="Present Address" value={presentPreview} />
        </FormSpan>

        <FormSpan cols={2}>
          <div className="border-t border-dashed border-gray-100 pt-5">
            <Checkbox
              id="same-as-present"
              label="Permanent address is the same as present address"
              description="Uncheck if the applicant's permanent address is different"
              checked={sameAsPresent !== false}
              onChange={(v) => setValue("SAME_AS_PRESENT", v, { shouldValidate: true })}
            />
          </div>
        </FormSpan>

        {sameAsPresent === false && (
          <>
            <FormSpan cols={2}>
              <Input
                label="Permanent House No. / Street"
                required
                className={UPPERCASE_INPUT}
                placeholder="e.g. 456 Rizal St."
                error={errors.PERMANENT_STREET?.message}
                {...register("PERMANENT_STREET")}
              />
            </FormSpan>

            <Select
              label="Permanent Municipality"
              required
              placeholder="— Select Municipality —"
              options={toOptions(ADDRESS_MUNICIPALITIES)}
              error={errors.PERMANENT_MUNICIPALITY?.message}
              {...register("PERMANENT_MUNICIPALITY")}
            />

            <Select
              label="Permanent Barangay"
              required
              disabled={!permMunicipality}
              placeholder={permMunicipality ? "— Select Barangay —" : "— Select a municipality first —"}
              options={toOptions(permBarangays)}
              error={errors.PERMANENT_BARANGAY?.message}
              {...register("PERMANENT_BARANGAY")}
            />

            <FormSpan cols={2}>
              <AddressPreview label="Permanent Address" value={permanentPreview} />
            </FormSpan>
          </>
        )}
      </FormGrid>
    </div>
  );
}

// Shows exactly what will be written to the sheet, so the applicant can catch a
// wrong barangay before submitting.
function AddressPreview({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-blue-50 border border-blue-100 px-4 py-3">
      <p className="text-[10px] font-black text-blue-700 uppercase tracking-widest mb-1">
        {label}
      </p>
      <p className="text-sm font-semibold text-[#1a1a2e] break-words">
        {value || <span className="text-gray-400 font-normal">Fill in the fields above…</span>}
      </p>
    </div>
  );
}
