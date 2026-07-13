"use client";

import { useState, useEffect, useCallback } from "react";
import { cn }                                from "@/lib/utils";
import { formatDate, computeAge }            from "@/lib/utils";
import { StatusBadge, Button }               from "@/components/ui";
import { DocumentCheckbox }                  from "./DocumentCheckbox";
import { useDocumentUpdate }                 from "@/hooks/useDocumentUpdate";
import { useAuth }                           from "@/hooks/useAuth";
import { approveApplicant, isApiSuccess }    from "@/lib/api";
import type { ApplicantRow, DocumentField }  from "@/types";
import { DOCUMENT_FIELDS }                   from "@/lib/constants";

// ── Detail row ────────────────────────────────────────────────

function DetailRow({ label, value }: { label: string; value?: string | number | boolean | null }) {
  const display = value === true ? "Yes" : value === false ? "No" : value || "—";
  return (
    <div className="flex items-start justify-between gap-3 py-2 border-b border-gray-50 last:border-0">
      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex-shrink-0 mt-0.5 w-28">
        {label}
      </span>
      <span className="text-xs font-medium text-[#1a1a2e] text-right break-words min-w-0 flex-1">
        {String(display)}
      </span>
    </div>
  );
}

// ── Section divider ───────────────────────────────────────────

function DrawerSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <p className="text-[9px] font-black text-[#0f3460] uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
        <span className="flex-1 h-px bg-[#0f3460]/10" />
        {title}
        <span className="flex-1 h-px bg-[#0f3460]/10" />
      </p>
      <div className="bg-gray-50/60 rounded-xl px-3 py-1">
        {children}
      </div>
    </div>
  );
}

// ── ApplicantDrawer ───────────────────────────────────────────

interface ApplicantDrawerProps {
  row:       ApplicantRow | null;
  onClose:   () => void;
  onUpdate:  (gipId: string, patch: Partial<ApplicantRow>) => void;
}

export function ApplicantDrawer({ row, onClose, onUpdate }: ApplicantDrawerProps) {
  const { user, hasRole }         = useAuth();
  const { updating, update }      = useDocumentUpdate();
  const [approving, setApproving] = useState(false);
  const [approveError, setApproveError] = useState<string | null>(null);

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (row) document.body.style.overflow = "hidden";
    else      document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [row]);

  const handleDocChange = useCallback(async (field: DocumentField, value: boolean) => {
    if (!row) return;
    onUpdate(row.GIP_ID, { [field]: value });
    await update(row.GIP_ID, field, value,
      (result) => {
        onUpdate(row.GIP_ID, {
          [field]:              value,
          DOCUMENT_STATUS:      result.DOCUMENT_STATUS,
          REGISTRATION_STATUS:  result.REGISTRATION_STATUS,
          TOTAL_SUBMITTED_DOCS: result.TOTAL_SUBMITTED_DOCS,
          MISSING_DOCUMENTS:    result.MISSING_DOCUMENTS,
        });
      },
      () => { onUpdate(row.GIP_ID, { [field]: !value }); }
    );
  }, [row, update, onUpdate]);

  const handleApproval = useCallback(async (action: "APPROVE" | "DISAPPROVE") => {
    if (!row || !user) return;
    setApproving(true);
    setApproveError(null);
    const res = await approveApplicant({
      GIP_ID: row.GIP_ID,
      action,
      approvedBy: user.FULL_NAME,
    });
    if (isApiSuccess(res)) {
      onUpdate(row.GIP_ID, {
        APPLICATION_STATUS: res.data.APPLICATION_STATUS,
        APPROVED_BY:        res.data.APPROVED_BY as never,
        DATE_APPROVED:      res.data.DATE_APPROVED as never,
      });
    } else {
      setApproveError(res.error);
    }
    setApproving(false);
  }, [row, user, onUpdate]);

  const isOpen   = !!row;
  const canApprove = hasRole("SUPER_ADMIN", "ADMIN");

  const submittedCount = row
    ? DOCUMENT_FIELDS.filter(d => !!row[d.field as keyof ApplicantRow]).length
    : 0;

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 bg-black/40 backdrop-blur-[2px] z-40 transition-opacity duration-300",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Drawer panel */}
      <aside
        className={cn(
          "fixed top-0 right-0 h-full w-full sm:w-[420px] bg-white z-50 shadow-2xl",
          "flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {!row ? null : (
          <>
            {/* ── Drawer Header ─────────────────────────── */}
            <div className="bg-[#0f3460] px-5 py-4 flex-shrink-0">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-blue-200 text-[10px] font-bold uppercase tracking-widest mb-1">
                    Applicant Detail
                  </p>
                  <h2 className="text-white font-black text-base uppercase leading-tight tracking-tight truncate">
                    {row.SURNAME}, {row.FIRST_NAME} {row.MIDDLE_NAME}
                  </h2>
                  <p className="font-mono text-blue-300 text-xs mt-1">{row.GIP_ID}</p>
                </div>
                <button
                  onClick={onClose}
                  className="flex-shrink-0 w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center
                    text-white/70 hover:text-white hover:bg-white/20 transition-colors text-sm"
                >
                  ✕
                </button>
              </div>

              {/* Status pills */}
              <div className="flex items-center gap-2 mt-3">
                <StatusBadge status={row.DOCUMENT_STATUS}    size="sm" />
                <StatusBadge status={row.APPLICATION_STATUS} size="sm" />
                <StatusBadge status={row.REGISTRATION_STATUS} size="sm" />
              </div>
            </div>

            {/* ── Scrollable body ───────────────────────── */}
            <div className="flex-1 overflow-y-auto scrollbar-thin p-4">

              {/* Document checklist */}
              <DrawerSection title="Documents">
                <div className="py-2">
                  {/* Progress bar */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          submittedCount === DOCUMENT_FIELDS.length ? "bg-emerald-500" : "bg-amber-400"
                        )}
                        style={{ width: `${(submittedCount / DOCUMENT_FIELDS.length) * 100}%` }}
                      />
                    </div>
                    <span className={cn(
                      "text-[10px] font-black tabular-nums flex-shrink-0",
                      submittedCount === DOCUMENT_FIELDS.length ? "text-emerald-600" : "text-amber-600"
                    )}>
                      {submittedCount}/{DOCUMENT_FIELDS.length}
                    </span>
                  </div>

                  {/* Document rows */}
                  <div className="space-y-1.5">
                    {DOCUMENT_FIELDS.map(doc => {
                      const isChecked  = !!row[doc.field as keyof ApplicantRow];
                      const isUpdating = !!updating[`${row.GIP_ID}:${doc.field}`];
                      return (
                        <div
                          key={doc.field}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all duration-150 cursor-pointer",
                            isChecked
                              ? "bg-emerald-50 border-emerald-100"
                              : "bg-white border-gray-100 hover:border-gray-200"
                          )}
                          onClick={() => handleDocChange(doc.field, !isChecked)}
                        >
                          <DocumentCheckbox
                            field={doc.field}
                            shortLabel={doc.shortLabel}
                            checked={isChecked}
                            updating={isUpdating}
                            onChange={v => handleDocChange(doc.field, v)}
                          />
                          <div className="flex-1 min-w-0">
                            <p className={cn(
                              "text-xs font-semibold truncate",
                              isChecked ? "text-emerald-800" : "text-[#1a1a2e]"
                            )}>
                              {doc.label}
                            </p>
                          </div>
                          {doc.required && !isChecked && (
                            <span className="text-[9px] font-bold text-red-400 uppercase flex-shrink-0">
                              Required
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </DrawerSection>

              {/* Personal info */}
              <DrawerSection title="Personal Information">
                <DetailRow label="Date of Birth" value={formatDate(row.DATE_REGISTERED)} />
                <DetailRow label="Sex"           value={row.SEX as string} />
                <DetailRow label="Civil Status"  value={row.CIVIL_STATUS as string} />
                <DetailRow label="Barangay"      value={row.BARANGAY} />
                <DetailRow label="Municipality"  value={row.MUNICIPALITY} />
              </DrawerSection>

              {/* Program info */}
              <DrawerSection title="Program Information">
                <DetailRow label="Batch"      value={row.BATCH_NAME} />
                <DetailRow label="Sector"     value={row.SECTOR} />
                <DetailRow label="Registered" value={formatDate(row.DATE_REGISTERED)} />
              </DrawerSection>

              {/* Approval error */}
              {approveError && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
                  {approveError}
                </div>
              )}
            </div>

            {/* ── Footer — Approval actions ─────────────── */}
            {canApprove && row.APPLICATION_STATUS === "PENDING" && (
              <div className="flex-shrink-0 p-4 border-t border-gray-100 bg-gray-50/50 flex gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  className="flex-1"
                  loading={approving}
                  onClick={() => handleApproval("APPROVE")}
                  disabled={row.DOCUMENT_STATUS !== "COMPLETE"}
                >
                  ✓ Approve
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  className="flex-1"
                  loading={approving}
                  onClick={() => handleApproval("DISAPPROVE")}
                >
                  ✕ Disapprove
                </Button>
              </div>
            )}

            {/* Already processed */}
            {row.APPLICATION_STATUS !== "PENDING" && (
              <div className={cn(
                "flex-shrink-0 p-3 border-t text-center text-xs font-semibold",
                row.APPLICATION_STATUS === "APPROVED"
                  ? "bg-emerald-50 border-emerald-100 text-emerald-700"
                  : "bg-red-50 border-red-100 text-red-700"
              )}>
                {row.APPLICATION_STATUS === "APPROVED" ? "✓ Approved" : "✕ Disapproved"}
              </div>
            )}
          </>
        )}
      </aside>
    </>
  );
}
