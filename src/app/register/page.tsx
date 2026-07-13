"use client";

import { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { RegisterSchema, type RegisterFormValues } from "@/lib/validators";
import { registerApplicant, isApiSuccess } from "@/lib/api";

import { FormProgress, FORM_STEPS } from "@/components/register/FormProgress";
import { PersonalInfoSection }       from "@/components/register/PersonalInfoSection";
import { ContactSection }             from "@/components/register/ContactSection";
import { AddressSection }             from "@/components/register/AddressSection";
import { FamilySection }              from "@/components/register/FamilySection";
import { EducationSection }           from "@/components/register/EducationSection";
import { ProgramSection }             from "@/components/register/ProgramSection";
import { DocumentsSection }           from "@/components/register/DocumentsSection";
import { Button, Card }               from "@/components/ui";

// Fields to validate on each step before allowing Next
const STEP_FIELDS: Record<number, (keyof RegisterFormValues)[]> = {
  1: ["SURNAME", "FIRST_NAME", "DATE_OF_BIRTH", "PLACE_OF_BIRTH", "SEX", "CIVIL_STATUS"],
  2: ["CONTACT_NUMBER"],
  3: ["PRESENT_ADDRESS", "MUNICIPALITY", "BARANGAY"],
  4: [],
  5: ["EDUCATIONAL_STATUS", "SCHOOL_NAME"],
  6: ["SECTOR", "TARGET_GROUP"],
  7: ["AUTHORIZATION_AGREEMENT"],
};

export default function RegisterPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep]       = useState(1);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [isSubmitting, setIsSubmitting]     = useState(false);
  const [submitError, setSubmitError]       = useState<string | null>(null);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(RegisterSchema),
    mode: "onTouched",
    defaultValues: {
      CITIZENSHIP: "FILIPINO",
      FIRST_TIME_APPLICANT: true,
      WITH_SUMMER_CLASS: false,
      GRADUATING_NEXT_YEAR: false,
      DOC_RESUME: false,
      DOC_BIRTH_CERTIFICATE: false,
      DOC_SCHOOL_ID: false,
      DOC_CERTIFICATE_OF_ENROLLMENT: false,
      DOC_BARANGAY_CERTIFICATE: false,
      DOC_PARENT_CONSENT: false,
      DOC_MEDICAL_CERTIFICATE: false,
    },
  });

  const totalSteps = FORM_STEPS.length;

  const handleNext = useCallback(async () => {
    const fields = STEP_FIELDS[currentStep];
    const valid = fields.length === 0 ? true : await form.trigger(fields);
    if (!valid) return;
    setCompletedSteps((prev) => new Set([...prev, currentStep]));
    setCurrentStep((s) => Math.min(s + 1, totalSteps));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentStep, form, totalSteps]);

  const handleBack = useCallback(() => {
    setCurrentStep((s) => Math.max(s - 1, 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleStepClick = useCallback((step: number) => {
    setCurrentStep(step);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleSubmit = form.handleSubmit(async (data: RegisterFormValues) => {
    setIsSubmitting(true);
    setSubmitError(null);
    const res = await registerApplicant(data);
    if (isApiSuccess(res)) {
      const params = new URLSearchParams({
        gipId:     res.data.GIP_ID,
        batchName: res.data.BATCH_NAME,
        dateReg:   res.data.DATE_REGISTERED,
        docStatus: res.data.DOCUMENT_STATUS,
        missing:   res.data.MISSING_DOCUMENTS,
        submitted: String(res.data.TOTAL_SUBMITTED_DOCS),
        required:  String(res.data.TOTAL_REQUIRED_DOCS),
        name:      `${data.FIRST_NAME} ${data.SURNAME}`,
      });
      router.push(`/register/success?${params.toString()}`);
    } else {
      setSubmitError(res.error ?? "Submission failed. Please try again.");
      setIsSubmitting(false);
    }
  });

  const renderSection = () => {
    switch (currentStep) {
      case 1: return <PersonalInfoSection form={form} />;
      case 2: return <ContactSection form={form} />;
      case 3: return <AddressSection form={form} />;
      case 4: return <FamilySection form={form} />;
      case 5: return <EducationSection form={form} />;
      case 6: return <ProgramSection form={form} />;
      case 7: return <DocumentsSection form={form} />;
      default: return null;
    }
  };

  const isLastStep = currentStep === totalSteps;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f0f4ff] via-white to-[#fafbff]">

      {/* Header */}
      <div className="bg-[#0f3460] text-white">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-2xl flex-shrink-0">
              🏛️
            </div>
            <div>
              <p className="text-xs font-bold text-blue-200 uppercase tracking-widest">
                {process.env.NEXT_PUBLIC_PROVINCE ?? "Provincial Government"}
              </p>
              <h1 className="text-xl font-black tracking-tight">
                Government Internship Program
              </h1>
              <p className="text-xs text-blue-300 mt-0.5">Applicant Registration Form • {new Date().getFullYear()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky progress */}
      <div className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <FormProgress
            currentStep={currentStep}
            completedSteps={completedSteps}
            onStepClick={handleStepClick}
          />
        </div>
      </div>

      {/* Body */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} noValidate>
          <div key={currentStep} style={{ animation: "fadeSlideIn 0.25s ease-out" }}>
            <Card padding="lg">
              {renderSection()}
            </Card>
          </div>

          {submitError && (
            <div className="mt-4 p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-start gap-3">
              <span className="text-lg flex-shrink-0">⚠️</span>
              <div>
                <p className="font-semibold">Submission Failed</p>
                <p className="text-red-600 mt-0.5">{submitError}</p>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6">
            <div>
              {currentStep > 1 && (
                <Button type="button" variant="secondary" onClick={handleBack}>
                  ← Back
                </Button>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden sm:inline text-xs font-semibold text-gray-400">
                {currentStep} / {totalSteps}
              </span>
              {isLastStep ? (
                <Button type="submit" size="lg" loading={isSubmitting}>
                  {isSubmitting ? "Submitting..." : "✓ Submit Application"}
                </Button>
              ) : (
                <Button type="button" onClick={handleNext}>
                  Next →
                </Button>
              )}
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            Fields marked <span className="text-red-500 font-bold">*</span> are required.
            You may submit with incomplete documents and update later.
          </p>
        </form>
      </div>

      <style jsx global>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateX(12px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
