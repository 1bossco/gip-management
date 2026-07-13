// ============================================================
// GIP MANAGEMENT SYSTEM — UTILITIES
// Pure functions used across the entire app
// ============================================================

import type { Applicant, ApplicantRow, DocumentCheckboxes, DocumentField } from "@/types";
import { DOCUMENT_FIELDS, TOTAL_REQUIRED_DOCS } from "./constants";

// ── Name Formatting ───────────────────────────────────────────

export function getFullName(
  surname: string,
  firstName: string,
  middleName?: string,
  extensionName?: string
): string {
  const parts = [surname.toUpperCase()];
  const given = [firstName];
  if (middleName) given.push(middleName);
  parts.push(given.join(" "));
  if (extensionName) parts.push(extensionName);
  return parts.join(", ");
}

export function getDisplayName(row: Pick<ApplicantRow, "SURNAME" | "FIRST_NAME" | "MIDDLE_NAME">): string {
  const mi = row.MIDDLE_NAME ? ` ${row.MIDDLE_NAME.charAt(0).toUpperCase()}.` : "";
  return `${row.FIRST_NAME}${mi} ${row.SURNAME}`;
}

// ── Date Formatting ───────────────────────────────────────────

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-PH", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  } catch {
    return "—";
  }
}

export function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleString("en-PH", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

export function toISODate(date: Date = new Date()): string {
  return date.toISOString().split("T")[0];
}

export function isToday(dateStr: string): boolean {
  return dateStr.startsWith(toISODate());
}

export function isThisMonth(dateStr: string): boolean {
  const today = new Date();
  const prefix = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  return dateStr.startsWith(prefix);
}

export function isThisYear(dateStr: string): boolean {
  return dateStr.startsWith(String(new Date().getFullYear()));
}

// ── Age Computation ───────────────────────────────────────────

export function computeAge(dobStr: string): number {
  const dob = new Date(dobStr);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
}

// ── Document Tracking ─────────────────────────────────────────

export function computeDocumentStatus(docs: DocumentCheckboxes): {
  totalSubmitted: number;
  totalRequired: number;
  missingDocuments: string;
  documentStatus: "COMPLETE" | "INCOMPLETE";
} {
  const submittedFields = DOCUMENT_FIELDS.filter((d) => docs[d.field] === true);
  const missingFields = DOCUMENT_FIELDS.filter((d) => d.required && docs[d.field] !== true);

  const totalSubmitted = submittedFields.length;
  const missingDocuments = missingFields.map((d) => d.shortLabel).join(", ");
  const documentStatus = missingFields.length === 0 ? "COMPLETE" : "INCOMPLETE";

  return {
    totalSubmitted,
    totalRequired: TOTAL_REQUIRED_DOCS,
    missingDocuments,
    documentStatus,
  };
}

export function extractDocCheckboxes(applicant: Applicant | ApplicantRow): DocumentCheckboxes {
  return {
    DOC_RESUME: !!applicant.DOC_RESUME,
    DOC_BIRTH_CERTIFICATE: !!applicant.DOC_BIRTH_CERTIFICATE,
    DOC_SCHOOL_ID: !!applicant.DOC_SCHOOL_ID,
    DOC_CERTIFICATE_OF_ENROLLMENT: !!applicant.DOC_CERTIFICATE_OF_ENROLLMENT,
    DOC_BARANGAY_CERTIFICATE: !!applicant.DOC_BARANGAY_CERTIFICATE,
    DOC_PARENT_CONSENT: !!applicant.DOC_PARENT_CONSENT,
    DOC_MEDICAL_CERTIFICATE: !!applicant.DOC_MEDICAL_CERTIFICATE,
  };
}

export function getMissingDocLabels(docs: DocumentCheckboxes): string[] {
  return DOCUMENT_FIELDS.filter((d) => d.required && !docs[d.field]).map((d) => d.label);
}

// ── Class Name Helper (Tailwind) ──────────────────────────────

export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ── Pagination ────────────────────────────────────────────────

export function paginate<T>(items: T[], page: number, pageSize: number): T[] {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

export function getTotalPages(total: number, pageSize: number): number {
  return Math.max(1, Math.ceil(total / pageSize));
}

// ── Search / Filter ───────────────────────────────────────────

export function matchesSearch(row: ApplicantRow, query: string): boolean {
  if (!query.trim()) return true;
  const q = query.toLowerCase();
  return (
    row.GIP_ID.toLowerCase().includes(q) ||
    row.SURNAME.toLowerCase().includes(q) ||
    row.FIRST_NAME.toLowerCase().includes(q) ||
    row.MUNICIPALITY.toLowerCase().includes(q) ||
    row.BARANGAY.toLowerCase().includes(q)
  );
}

// ── GIP ID Generator (client-side preview only) ───────────────
// Real ID is generated server-side in Apps Script

export function previewGipId(seq: number): string {
  const year = new Date().getFullYear();
  return `GIP-${year}-${String(seq).padStart(5, "0")}`;
}

// ── Percentage ────────────────────────────────────────────────

export function toPercent(value: number, total: number, decimals = 1): string {
  if (!total) return "0%";
  return ((value / total) * 100).toFixed(decimals) + "%";
}

// ── Truncate ──────────────────────────────────────────────────

export function truncate(str: string, max = 40): string {
  if (!str) return "—";
  return str.length > max ? str.slice(0, max) + "…" : str;
}

// ── Capitalize ────────────────────────────────────────────────

export function capitalize(str: string): string {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function titleCase(str: string): string {
  return str
    .toLowerCase()
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// ── Address ───────────────────────────────────────────────────

// The applicant only types the house no./street; barangay and municipality come
// from the dropdowns. This joins them into the single cell the sheet stores.
// Empty parts are dropped so a blank street never leaves a dangling comma.

export function composeAddress(
  street: string,
  barangay: string,
  municipality: string
): string {
  return [street, barangay, municipality, "BATAAN"]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(", ")
    .toUpperCase();
}

// ── Cookie Helpers (client-side) ──────────────────────────────

export function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? decodeURIComponent(match[2]) : null;
}

export function setCookie(name: string, value: string, maxAgeSeconds: number): void {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=${encodeURIComponent(value)}; max-age=${maxAgeSeconds}; path=/; SameSite=Strict`;
}

export function deleteCookie(name: string): void {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; max-age=0; path=/`;
}

// ── Debounce ──────────────────────────────────────────────────

export function debounce<T extends (...args: any[]) => void>(
  fn: T,
  delay: number
) {
  let timer: ReturnType<typeof setTimeout>;

  const debounced = (...args: Parameters<T>) => {
    clearTimeout(timer);

    timer = setTimeout(() => {
      fn(...args);
    }, delay);
  };

  debounced.cancel = () => {
    clearTimeout(timer);
  };

  return debounced as T & {
    cancel: () => void;
  };
}

// ── Sort Comparator ───────────────────────────────────────────

export function sortBy<T>(
  items: T[],
  key: keyof T,
  direction: "asc" | "desc" = "asc"
): T[] {
  return [...items].sort((a, b) => {
    const va = a[key];
    const vb = b[key];
    if (va == null) return 1;
    if (vb == null) return -1;
    const cmp = va < vb ? -1 : va > vb ? 1 : 0;
    return direction === "asc" ? cmp : -cmp;
  });
}
