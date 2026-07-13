"use client";

import { UseFormReturn, useWatch } from "react-hook-form";
import type { RegisterFormValues } from "@/lib/validators";
import { Checkbox, SectionHeader } from "@/components/ui";
import { DOCUMENT_FIELDS } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface Props {
  form: UseFormReturn<RegisterFormValues>;
}

export function DocumentsSection({ form }: Props) {
  const { setValue, control, formState: { errors } } = form;

  // Watch all doc fields to compute live count
  const docValues = useWatch({
    control,
    name: [
      "DOC_RESUME",
      "DOC_BIRTH_CERTIFICATE",
      "DOC_SCHOOL_ID",
      "DOC_CERTIFICATE_OF_ENROLLMENT",
      "DOC_BARANGAY_CERTIFICATE",
      "DOC_PARENT_CONSENT",
      "DOC_MEDICAL_CERTIFICATE",
    ],
  });

  const authAgreed = useWatch({ control, name: "AUTHORIZATION_AGREEMENT" });

  const submittedCount = docValues.filter(Boolean).length;
  const totalDocs = DOCUMENT_FIELDS.length;
  const allSubmitted = submittedCount === totalDocs;

  return (
    <div>
      <SectionHeader
        step={7}
        title="Documents & Authorization"
        description="Check off the documents the applicant is submitting with this application."
        icon="📄"
      />

      {/* Live counter */}
      <div className={cn(
        "mb-5 p-4 rounded-xl border flex items-center gap-4 transition-all duration-300",
        allSubmitted
          ? "bg-emerald-50 border-emerald-200"
          : "bg-amber-50 border-amber-200"
      )}>
        <div className={cn(
          "w-12 h-12 rounded-full flex items-center justify-center text-lg font-black flex-shrink-0",
          allSubmitted ? "bg-emerald-500 text-white" : "bg-amber-400 text-white"
        )}>
          {submittedCount}/{totalDocs}
        </div>
        <div>
          <p className={cn(
            "text-sm font-bold",
            allSubmitted ? "text-emerald-700" : "text-amber-700"
          )}>
            {allSubmitted
              ? "All documents submitted — application is complete!"
              : `${totalDocs - submittedCount} document${totalDocs - submittedCount > 1 ? "s" : ""} still needed`}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            You can submit with incomplete documents and update later in the monitoring panel.
          </p>
        </div>
      </div>

      {/* Document checklist */}
      <div className="space-y-2 mb-6">
        {DOCUMENT_FIELDS.map((doc) => {
          const idx = DOCUMENT_FIELDS.indexOf(doc);
          const isChecked = !!docValues[idx];
          return (
            <div
              key={doc.field}
              className={cn(
                "flex items-center gap-4 p-3.5 rounded-xl border transition-all duration-200 cursor-pointer",
                isChecked
                  ? "bg-emerald-50 border-emerald-200"
                  : "bg-white border-gray-100 hover:border-gray-200"
              )}
              onClick={() => setValue(doc.field, !isChecked)}
            >
              {/* Custom large checkbox */}
              <div className={cn(
                "w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200",
                isChecked ? "bg-emerald-500 border-emerald-500" : "bg-white border-gray-300"
              )}>
                {isChecked && (
                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className={cn(
                  "text-sm font-semibold",
                  isChecked ? "text-emerald-800" : "text-[#1a1a2e]"
                )}>
                  {doc.label}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {isChecked ? "✓ Submitted" : "Not yet submitted"}
                </p>
              </div>

              {doc.required && (
                <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider flex-shrink-0">
                  Required
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Authorization Agreement */}
      <div className={cn(
        "p-4 rounded-xl border",
        errors.AUTHORIZATION_AGREEMENT ? "border-red-300 bg-red-50" : "border-gray-200 bg-gray-50"
      )}>
        <p className="text-xs font-bold text-gray-600 uppercase tracking-widest mb-3">
          Authorization Agreement
        </p>
        <p className="text-xs text-gray-600 leading-relaxed mb-4">
          I hereby certify that all information provided in this application is true and correct to
          the best of my knowledge. I authorize the Provincial Government to verify the information
          submitted and to use the same for GIP processing purposes. I understand that providing
          false information may result in disqualification from the program.
        </p>
        <Checkbox
          id="auth-agreement"
          label="I agree to the terms and authorization statement above"
          checked={!!authAgreed}
          onChange={(v) => setValue("AUTHORIZATION_AGREEMENT", v as true)}
          error={errors.AUTHORIZATION_AGREEMENT?.message}
        />
      </div>
    </div>
  );
}
