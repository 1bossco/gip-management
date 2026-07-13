// ============================================================
// GIP MANAGEMENT SYSTEM — API CLIENT
// Calls /api/gip (Next.js proxy) instead of GAS directly.
// This eliminates ALL CORS and GAS permission issues.
// ============================================================

import type {
  ApiResponse, RegisterPayload, RegistrationResult,
  DashboardStats, ApplicantRow, Applicant,
  DocumentUpdatePayload, DocumentUpdateResult,
  ApprovalPayload, ApprovalResult, Batch,
  TransmittalFilters, TransmittalData, LoginPayload,
  AuthUser, PaginatedResponse, MonitoringFilters,
} from "@/types";
import { API_ACTIONS } from "./constants";

// ── Proxy endpoint — always /api/gip ─────────────────────────
// Never calls GAS directly from the browser.
// The Next.js server handles the GAS call privately.

const PROXY = "/api/gip";

const DEFAULT_TIMEOUT_MS = 30_000;

function withTimeout<T>(promise: Promise<T>, ms = DEFAULT_TIMEOUT_MS): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Request timed out after " + ms + "ms")), ms)
    ),
  ]);
}

// ── Base request — all params go as query string to the proxy ─

async function gasRequest<T>(
  action: string,
  payload?: object
): Promise<ApiResponse<T>> {
  try {
    const url = new URL(PROXY, window.location.origin);
    url.searchParams.set("action", action);
    if (payload) url.searchParams.set("data", JSON.stringify(payload));

    const res = await withTimeout(
      fetch(url.toString(), { method: "GET", cache: "no-store" })
    );

    if (!res.ok) {
      return { success: false, error: `HTTP ${res.status}: ${res.statusText}`, code: String(res.status) };
    }

    const json = await res.json();
    return json as ApiResponse<T>;
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

async function gasGet<T>(
  action: string,
  params?: Record<string, string | number | boolean>
): Promise<ApiResponse<T>> {
  try {
    const url = new URL(PROXY, window.location.origin);
    url.searchParams.set("action", action);
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        url.searchParams.set(k, String(v));
      }
    }

    const res = await withTimeout(
      fetch(url.toString(), { method: "GET", cache: "no-store" })
    );

    if (!res.ok) {
      return { success: false, error: `HTTP ${res.status}: ${res.statusText}`, code: String(res.status) };
    }

    const json = await res.json();
    return json as ApiResponse<T>;
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

// ── API Functions ─────────────────────────────────────────────

export async function registerApplicant(payload: RegisterPayload): Promise<ApiResponse<RegistrationResult>> {
  return gasRequest<RegistrationResult>(API_ACTIONS.REGISTER, payload);
}

export async function updateDocument(payload: DocumentUpdatePayload): Promise<ApiResponse<DocumentUpdateResult>> {
  return gasRequest<DocumentUpdateResult>(API_ACTIONS.UPDATE_DOCUMENT, payload);
}

export async function approveApplicant(payload: ApprovalPayload): Promise<ApiResponse<ApprovalResult>> {
  return gasRequest<ApprovalResult>(API_ACTIONS.APPROVE, payload);
}

export async function getDashboard(): Promise<ApiResponse<DashboardStats>> {
  return gasGet<DashboardStats>(API_ACTIONS.GET_DASHBOARD);
}

export interface GetApplicantsParams extends Partial<MonitoringFilters> {
  page?: number;
  pageSize?: number;
}

export async function getApplicants(params: GetApplicantsParams = {}): Promise<ApiResponse<PaginatedResponse<ApplicantRow>>> {
  return gasGet<PaginatedResponse<ApplicantRow>>(API_ACTIONS.GET_APPLICANTS, {
    ...params, page: params.page ?? 1, pageSize: params.pageSize ?? 25,
  } as Record<string, string | number | boolean>);
}

export async function getApplicant(gipId: string): Promise<ApiResponse<Applicant>> {
  return gasGet<Applicant>(API_ACTIONS.GET_APPLICANT, { gipId });
}

export async function getIncompleteApplicants(): Promise<ApiResponse<ApplicantRow[]>> {
  return gasGet<ApplicantRow[]>(API_ACTIONS.GET_INCOMPLETE);
}

export async function getBatches(): Promise<ApiResponse<Batch[]>> {
  return gasGet<Batch[]>(API_ACTIONS.GET_BATCHES);
}

export async function generateTransmittal(filters: TransmittalFilters): Promise<ApiResponse<TransmittalData>> {
  return gasRequest<TransmittalData>(API_ACTIONS.GENERATE_TRANSMITTAL, filters);
}

export async function loginUser(payload: LoginPayload): Promise<ApiResponse<{ user: AuthUser; token: string }>> {
  return gasRequest<{ user: AuthUser; token: string }>(API_ACTIONS.LOGIN, payload);
}

export function getErrorMessage(response: ApiResponse<unknown>): string {
  if (response.success) return "";
  return response.error ?? "An unexpected error occurred.";
}

export function isApiSuccess<T>(
  response: ApiResponse<T>
): response is { success: true; data: T; message?: string } {
  return response.success === true;
}