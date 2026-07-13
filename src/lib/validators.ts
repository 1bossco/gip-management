// ============================================================
// GIP MANAGEMENT SYSTEM — ZOD VALIDATORS
// Runtime validation for forms, API payloads, and responses
// ============================================================

import { z } from "zod";
import { ADDRESS_MUNICIPALITIES, SECTORS } from "./constants";
import type { Sector } from "@/types";

// ── Reusable primitives ───────────────────────────────────────

const phoneRegex = /^(09|\+639)\d{9}$/;

const requiredString = (label: string) =>
  z
    .string({
      required_error: `${label} is required`,
    })
    .min(1, `${label} is required`);

// Every free-text entry is stored upper-cased. EMAIL is excluded — addresses are
// case-sensitive before the @ and upper-casing them can break delivery.
const upper = (val: string) => val.toUpperCase();

// ── Personal Information ──────────────────────────────────────

export const PersonalInfoSchema = z.object({
  SURNAME: requiredString("Surname").max(60).transform(upper),

  FIRST_NAME: requiredString("First Name").max(60).transform(upper),

  MIDDLE_NAME: z.string().max(60).transform(upper).default(""),

  EXTENSION_NAME: z.string().max(10).transform(upper).default(""),

  DATE_OF_BIRTH: requiredString("Date of Birth").refine(
    (val) => {
      const dob = new Date(val);
      const today = new Date();

      let age = today.getFullYear() - dob.getFullYear();

      const monthDiff = today.getMonth() - dob.getMonth();

      if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < dob.getDate())
      ) {
        age--;
      }

      return age >= 15 && age <= 40;
    },
    {
      message: "Applicant must be 15–40 years old",
    }
  ),

  PLACE_OF_BIRTH: requiredString("Place of Birth").max(100).transform(upper),

  CITIZENSHIP: z.string().transform(upper).default("FILIPINO"),

  SEX: z.enum(["MALE", "FEMALE"], {
    required_error: "Sex is required",
  }),

  CIVIL_STATUS: z.enum(
    ["SINGLE", "MARRIED", "WIDOWED", "SEPARATED"],
    {
      required_error: "Civil Status is required",
    }
  ),
});

// ── Contact Details ───────────────────────────────────────────

export const ContactSchema = z.object({
  CONTACT_NUMBER: requiredString("Contact Number").regex(
    phoneRegex,
    "Invalid PH mobile number (e.g. 09171234567)"
  ),

  EMAIL: z
    .string()
    .email("Invalid email address")
    .or(z.literal(""))
    .default(""),

  FACEBOOK_NAME: z.string().max(100).transform(upper).default(""),
});

// ── Address ───────────────────────────────────────────────────

// The applicant types only the house no. / street. Barangay and municipality are
// picked from dependent dropdowns, and PRESENT_ADDRESS / PERMANENT_ADDRESS are
// composed from those parts on submit (see composeAddress).
//
// MUNICIPALITY / BARANGAY always describe the PRESENT address — the monitoring
// filters and dashboard group on them, so they must not drift to the permanent one.

export const AddressSchema = z.object({
  PRESENT_STREET: requiredString("House No. / Street").max(150).transform(upper),

  MUNICIPALITY: z.enum(ADDRESS_MUNICIPALITIES as [string, ...string[]], {
    required_error: "Municipality is required",
  }),

  BARANGAY: requiredString("Barangay").max(80).transform(upper),

  SAME_AS_PRESENT: z.boolean().default(true),

  PERMANENT_STREET: z.string().max(150).transform(upper).default(""),

  PERMANENT_MUNICIPALITY: z.string().max(60).transform(upper).default(""),

  PERMANENT_BARANGAY: z.string().max(80).transform(upper).default(""),
});

// ── Family Information ────────────────────────────────────────

export const FamilySchema = z.object({
  FATHER_NAME: z.string().max(120).transform(upper).default(""),

  FATHER_OCCUPATION: z.string().max(100).transform(upper).default(""),

  FATHER_CONTACT: z
    .string()
    .regex(phoneRegex, "Invalid contact number")
    .or(z.literal(""))
    .default(""),

  MOTHER_NAME: z.string().max(120).transform(upper).default(""),

  MOTHER_OCCUPATION: z.string().max(100).transform(upper).default(""),

  MOTHER_CONTACT: z
    .string()
    .regex(phoneRegex, "Invalid contact number")
    .or(z.literal(""))
    .default(""),
});

// ── Educational Information ───────────────────────────────────

export const EducationBaseSchema = z.object({
  EDUCATIONAL_STATUS: z.enum(
    ["COLLEGE", "SHS", "ALS", "GRADUATE", "VOCATIONAL"],
    {
      required_error: "Educational Status is required",
    }
  ),

  SCHOOL_NAME: requiredString("School Name").max(150).transform(upper),

  COURSE: z.string().max(100).transform(upper).default(""),

  YEAR_LEVEL: z.string().max(20).transform(upper).default(""),

  SHS_TRACK: z.string().max(80).transform(upper).default(""),

  WITH_SUMMER_CLASS: z.boolean().default(false),

  GRADUATING_NEXT_YEAR: z.boolean().default(false),
});

export const EducationSchema = EducationBaseSchema.superRefine(
  (data, ctx) => {
    if (data.EDUCATIONAL_STATUS === "COLLEGE" && !data.COURSE) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["COURSE"],
        message: "Course is required for college students",
      });
    }

    if (data.EDUCATIONAL_STATUS === "SHS" && !data.SHS_TRACK) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["SHS_TRACK"],
        message: "SHS Track is required for SHS students",
      });
    }
  }
);

// ── Program Information ───────────────────────────────────────

export const ProgramSchema = z.object({
  SECTOR: z.enum(
    SECTORS.map((s) => s.value) as [Sector, ...Sector[]],
    {
      required_error: "Sector is required",
    }
  ),

  TARGET_GROUP: z.enum(
    ["YOUTH", "PWD", "SENIOR", "FARMER", "FISHERFOLK"],
    {
      required_error: "Target Group is required",
    }
  ),

  FIRST_TIME_APPLICANT: z.boolean().default(true),

  PREVIOUS_GIP_AVAILMENT: z.string().max(100).transform(upper).default(""),
});

// ── Document Checkboxes ───────────────────────────────────────

export const DocumentSchema = z.object({
  DOC_RESUME: z.boolean().default(false),

  DOC_BIRTH_CERTIFICATE: z.boolean().default(false),

  DOC_VALID_ID: z.boolean().default(false),

  DOC_TOR: z.boolean().default(false),

  DOC_CERTIFICATE_OF_INDIGENCY: z.boolean().default(false),

  DOC_DIPLOMA: z.boolean().default(false),

  DOC_GIP_FORM: z.boolean().default(false),
});

// ── Authorization ─────────────────────────────────────────────

export const AuthorizationSchema = z.object({
  AUTHORIZATION_AGREEMENT: z.literal(true, {
    errorMap: () => ({
      message: "You must agree to the authorization agreement",
    }),
  }),

  REMARKS: z.string().max(500).default(""),
});

// ── Full Registration Schema ──────────────────────────────────

export const RegisterSchema = PersonalInfoSchema.merge(ContactSchema)
  .merge(AddressSchema)
  .merge(FamilySchema)
  .merge(EducationBaseSchema)
  .merge(ProgramSchema)
  .merge(DocumentSchema)
  .merge(AuthorizationSchema)
  .superRefine((data, ctx) => {
    if (data.EDUCATIONAL_STATUS === "COLLEGE" && !data.COURSE) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["COURSE"],
        message: "Course is required for college students",
      });
    }

    if (data.EDUCATIONAL_STATUS === "SHS" && !data.SHS_TRACK) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["SHS_TRACK"],
        message: "SHS Track is required for SHS students",
      });
    }

    // A separate permanent address must be complete, or it composes to a partial
    // cell like ", ORANI, BATAAN" with no street or barangay.
    if (!data.SAME_AS_PRESENT) {
      const permanent = [
        ["PERMANENT_STREET",       "House No. / Street"],
        ["PERMANENT_MUNICIPALITY", "Municipality"],
        ["PERMANENT_BARANGAY",     "Barangay"],
      ] as const;

      for (const [field, label] of permanent) {
        if (!data[field]) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [field],
            message: `Permanent ${label} is required`,
          });
        }
      }
    }
  });

export type RegisterFormValues = z.infer<typeof RegisterSchema>;

// ── Document Update Schema ────────────────────────────────────

export const DocumentUpdateSchema = z.object({
  GIP_ID: z
    .string()
    .regex(/^GIP-\d{4}-\d{5}$/, "Invalid GIP ID format"),

  field: z.enum([
    "DOC_RESUME",
    "DOC_BIRTH_CERTIFICATE",
    "DOC_VALID_ID",
    "DOC_TOR",
    "DOC_CERTIFICATE_OF_INDIGENCY",
    "DOC_DIPLOMA",
    "DOC_GIP_FORM",
  ]),

  value: z.boolean(),
});

// ── Approval Schema ───────────────────────────────────────────

export const ApprovalSchema = z.object({
  GIP_ID: z.string().min(1),

  action: z.enum(["APPROVE", "DISAPPROVE"]),

  approvedBy: z.string().min(1, "Approver name is required"),

  remarks: z.string().max(500).optional(),
});

// ── Login Schema ──────────────────────────────────────────────

export const LoginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),

  password: z.string().min(6, "Password must be at least 6 characters"),
});

// ── Transmittal Filter Schema ─────────────────────────────────

export const TransmittalFilterSchema = z.object({
  batchName: z.string().min(1, "Batch is required"),

  sector: z.string().default("ALL"),

  municipality: z.string().default("ALL"),

  applicationStatus: z
    .enum(["ALL", "PENDING", "APPROVED", "DISAPPROVED"])
    .default("ALL"),

  targetCount: z.number().int().min(1).max(1000).optional(),
});

// ── Monitoring Filter Schema ──────────────────────────────────

export const MonitoringFilterSchema = z.object({
  search: z.string().default(""),

  municipality: z.string().default(""),

  barangay: z.string().default(""),

  sector: z.string().default(""),

  documentStatus: z
    .enum(["", "COMPLETE", "INCOMPLETE"])
    .default(""),

  applicationStatus: z
    .enum(["", "PENDING", "APPROVED", "DISAPPROVED"])
    .default(""),

  batchName: z.string().default(""),
});

// ── Pagination Schema ─────────────────────────────────────────

export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),

  pageSize: z.coerce.number().int().min(1).max(200).default(25),
});

// ── Utility: Flatten Zod Errors ───────────────────────────────

export function flattenZodErrors(
  error: z.ZodError
): Record<string, string> {
  const result: Record<string, string> = {};

  for (const issue of error.issues) {
    const path = issue.path.join(".");

    if (!result[path]) {
      result[path] = issue.message;
    }
  }

  return result;
}