// ============================================================
// GIP MANAGEMENT SYSTEM — TYPE DEFINITIONS
// Single source of truth for all data shapes across the app
// ============================================================

// ── Enumerations ─────────────────────────────────────────────

export type RegistrationStatus = "COMPLETE" | "INCOMPLETE";
export type DocumentStatus = "COMPLETE" | "INCOMPLETE";
export type ApplicationStatus = "PENDING" | "APPROVED" | "DISAPPROVED";

export type EducationalStatus = "COLLEGE" | "SHS" | "ALS" | "GRADUATE" | "VOCATIONAL";
export type Sex = "MALE" | "FEMALE";
export type CivilStatus = "SINGLE" | "MARRIED" | "WIDOWED" | "SEPARATED";

export type Sector =
  | "AGRICULTURE"
  | "TOURISM"
  | "HEALTH"
  | "EDUCATION"
  | "INFRASTRUCTURE"
  | "SOCIAL SERVICES"
  | "ENVIRONMENT"
  | "LIVELIHOOD"
  | "OTHERS";

export type TargetGroup = "YOUTH" | "PWD" | "SENIOR" | "FARMER" | "FISHERFOLK";

export type UserRole = "SUPER_ADMIN" | "ADMIN" | "ENCODER" | "VIEWER";

export type BatchStatus = "OPEN" | "CLOSED" | "CANCELLED";

// ── Document Fields ───────────────────────────────────────────

export interface DocumentCheckboxes {
  DOC_RESUME: boolean;
  DOC_BIRTH_CERTIFICATE: boolean;
  DOC_SCHOOL_ID: boolean;
  DOC_CERTIFICATE_OF_ENROLLMENT: boolean;
  DOC_BARANGAY_CERTIFICATE: boolean;
  DOC_PARENT_CONSENT: boolean;
  DOC_MEDICAL_CERTIFICATE: boolean;
}

export type DocumentField = keyof DocumentCheckboxes;

// ── Core Applicant (matches MASTER sheet columns exactly) ─────

export interface Applicant {
  // SYSTEM
  GIP_ID: string;
  TIMESTAMP: string;
  DATE_REGISTERED: string;
  BATCH_DATE: string;
  BATCH_NAME: string;
  REGISTRATION_STATUS: RegistrationStatus;
  DOCUMENT_STATUS: DocumentStatus;
  APPLICATION_STATUS: ApplicationStatus;
  DATE_COMPLETED: string;
  APPROVED_BY: string;
  DATE_APPROVED: string;

  // PERSONAL
  SURNAME: string;
  FIRST_NAME: string;
  MIDDLE_NAME: string;
  EXTENSION_NAME: string;
  DATE_OF_BIRTH: string;
  PLACE_OF_BIRTH: string;
  CITIZENSHIP: string;
  SEX: Sex;
  CIVIL_STATUS: CivilStatus;

  // CONTACT
  CONTACT_NUMBER: string;
  EMAIL: string;
  FACEBOOK_NAME: string;

  // ADDRESS
  PRESENT_ADDRESS: string;
  PERMANENT_ADDRESS: string;
  MUNICIPALITY: string;
  BARANGAY: string;

  // FAMILY
  FATHER_NAME: string;
  FATHER_OCCUPATION: string;
  FATHER_CONTACT: string;
  MOTHER_NAME: string;
  MOTHER_OCCUPATION: string;
  MOTHER_CONTACT: string;

  // EDUCATION
  EDUCATIONAL_STATUS: EducationalStatus;
  SCHOOL_NAME: string;
  COURSE: string;
  YEAR_LEVEL: string;
  SHS_TRACK: string;
  WITH_SUMMER_CLASS: boolean;
  GRADUATING_NEXT_YEAR: boolean;

  // PROGRAM
  SECTOR: Sector;
  TARGET_GROUP: TargetGroup;
  FIRST_TIME_APPLICANT: boolean;
  PREVIOUS_GIP_AVAILMENT: string;

  // DOCUMENTS (checkboxes)
  DOC_RESUME: boolean;
  DOC_BIRTH_CERTIFICATE: boolean;
  DOC_SCHOOL_ID: boolean;
  DOC_CERTIFICATE_OF_ENROLLMENT: boolean;
  DOC_BARANGAY_CERTIFICATE: boolean;
  DOC_PARENT_CONSENT: boolean;
  DOC_MEDICAL_CERTIFICATE: boolean;

  // TRACKING
  TOTAL_REQUIRED_DOCS: number;
  TOTAL_SUBMITTED_DOCS: number;
  MISSING_DOCUMENTS: string;

  // VALIDATION
  AUTHORIZATION_AGREEMENT: boolean;
  REMARKS: string;
}

// ── Registration Form Payload ─────────────────────────────────
// Omits system-computed fields; sent from /register form

export type RegisterPayload = Omit<
  Applicant,
  | "GIP_ID"
  | "TIMESTAMP"
  | "DATE_REGISTERED"
  | "BATCH_DATE"
  | "BATCH_NAME"
  | "REGISTRATION_STATUS"
  | "DOCUMENT_STATUS"
  | "APPLICATION_STATUS"
  | "DATE_COMPLETED"
  | "APPROVED_BY"
  | "DATE_APPROVED"
  | "TOTAL_REQUIRED_DOCS"
  | "TOTAL_SUBMITTED_DOCS"
  | "MISSING_DOCUMENTS"
>;

// ── API Response Wrappers ─────────────────────────────────────

export interface ApiSuccess<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  error: string;
  code?: string;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// ── Registration Success (returned after POST /register) ──────

export interface RegistrationResult {
  GIP_ID: string;
  BATCH_NAME: string;
  DATE_REGISTERED: string;
  DOCUMENT_STATUS: DocumentStatus;
  MISSING_DOCUMENTS: string;
  TOTAL_SUBMITTED_DOCS: number;
  TOTAL_REQUIRED_DOCS: number;
}

// ── Dashboard Stats ───────────────────────────────────────────

export interface DashboardStats {
  total: number;
  today: number;
  thisMonth: number;
  thisYear: number;
  complete: number;
  incomplete: number;
  approved: number;
  disapproved: number;
  pending: number;
  male: number;
  female: number;
  bySector: Record<string, number>;
  byMunicipality: Record<string, number>;
  byMonth: { month: string; count: number }[];
}

// ── Monitoring / Table Row ────────────────────────────────────

export interface ApplicantRow {
  GIP_ID: string;
  SURNAME: string;
  FIRST_NAME: string;
  MIDDLE_NAME: string;
  MUNICIPALITY: string;
  BARANGAY: string;
  SEX: Sex;
  CIVIL_STATUS: CivilStatus;
  SECTOR: Sector;
  DOCUMENT_STATUS: DocumentStatus;
  APPLICATION_STATUS: ApplicationStatus;
  REGISTRATION_STATUS: RegistrationStatus;
  MISSING_DOCUMENTS: string;
  TOTAL_SUBMITTED_DOCS: number;
  TOTAL_REQUIRED_DOCS: number;
  BATCH_NAME: string;
  DATE_REGISTERED: string;
  APPROVED_BY: string;
  DATE_APPROVED: string;
  // doc checkboxes for inline editing
  DOC_RESUME: boolean;
  DOC_BIRTH_CERTIFICATE: boolean;
  DOC_SCHOOL_ID: boolean;
  DOC_CERTIFICATE_OF_ENROLLMENT: boolean;
  DOC_BARANGAY_CERTIFICATE: boolean;
  DOC_PARENT_CONSENT: boolean;
  DOC_MEDICAL_CERTIFICATE: boolean;
}

// ── Monitoring Filters ────────────────────────────────────────

export interface MonitoringFilters {
  search: string;
  municipality: string;
  barangay: string;
  sector: string;
  documentStatus: DocumentStatus | "";
  applicationStatus: ApplicationStatus | "";
  batchName: string;
}

// ── Document Update Payload ───────────────────────────────────

export interface DocumentUpdatePayload {
  GIP_ID: string;
  field: DocumentField;
  value: boolean;
}

export interface DocumentUpdateResult {
  GIP_ID: string;
  DOCUMENT_STATUS: DocumentStatus;
  REGISTRATION_STATUS: RegistrationStatus;
  TOTAL_SUBMITTED_DOCS: number;
  MISSING_DOCUMENTS: string;
  DATE_COMPLETED: string;
}

// ── Approval Payload ──────────────────────────────────────────

export interface ApprovalPayload {
  GIP_ID: string;
  action: "APPROVE" | "DISAPPROVE";
  approvedBy: string;
  remarks?: string;
}

export interface ApprovalResult {
  GIP_ID: string;
  APPLICATION_STATUS: ApplicationStatus;
  APPROVED_BY: string;
  DATE_APPROVED: string;
}

// ── Batch ─────────────────────────────────────────────────────

export interface Batch {
  BATCH_ID: string;
  BATCH_NAME: string;
  BATCH_DATE: string;
  SECTOR: Sector | "ALL";
  MUNICIPALITY: string;
  TARGET_SLOTS: number;
  TOTAL_APPLICANTS: number;
  STATUS: BatchStatus;
  REMARKS: string;
}

// ── Transmittal ───────────────────────────────────────────────

export interface TransmittalFilters {
  batchName: string;
  sector: Sector | "ALL";
  municipality: string;
  applicationStatus: ApplicationStatus | "ALL";
  targetCount?: number;
}

export interface TransmittalEntry {
  GIP_ID: string;
  fullName: string;
  SEX: Sex;
  DATE_OF_BIRTH: string;
  MUNICIPALITY: string;
  BARANGAY: string;
  CONTACT_NUMBER: string;
  SECTOR: Sector;
  APPLICATION_STATUS: ApplicationStatus;
  DOCUMENT_STATUS: DocumentStatus;
}

export interface TransmittalData {
  transmittalId: string;
  dateGenerated: string;
  batchName: string;
  sector: string;
  municipality: string;
  totalIncluded: number;
  entries: TransmittalEntry[];
}

// ── Auth ──────────────────────────────────────────────────────

export interface LoginPayload {
  username: string;
  password: string;
}

export interface AuthUser {
  USER_ID: string;
  USERNAME: string;
  FULL_NAME: string;
  ROLE: UserRole;
  MUNICIPALITY: string;
}

export interface SessionData {
  user: AuthUser;
  token: string;
  expiresAt: number;
}

// ── Pagination ────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
}