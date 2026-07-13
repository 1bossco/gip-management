"use client";

import { useState, useCallback }    from "react";
import { cn }                        from "@/lib/utils";
import { StatusBadge }               from "@/components/ui";
import { DocumentCheckbox, DocProgressPill } from "./DocumentCheckbox";
import { useDocumentUpdate }         from "@/hooks/useDocumentUpdate";
import type { ApplicantRow }         from "@/types";
import type { DocumentField }        from "@/types";
import { DOCUMENT_FIELDS }           from "@/lib/constants";
import { formatDate }                from "@/lib/utils";

// ── Sort state ────────────────────────────────────────────────

type SortKey = keyof ApplicantRow;
type SortDir = "asc" | "desc";

interface SortState { key: SortKey; dir: SortDir }

// ── Column header ─────────────────────────────────────────────

function ColHeader({
  label, sortKey, current, onSort,
}: {
  label:   string;
  sortKey?: SortKey;
  current: SortState;
  onSort:  (k: SortKey) => void;
}) {
  const active = sortKey && current.key === sortKey;
  return (
    <th
      className={cn(
        "px-3 py-2.5 text-left text-[10px] font-black uppercase tracking-widest whitespace-nowrap",
        "border-b border-gray-100 bg-[#f9fafb]",
        sortKey ? "cursor-pointer select-none hover:bg-gray-100 transition-colors" : "",
        active ? "text-[#0f3460]" : "text-gray-400"
      )}
      onClick={() => sortKey && onSort(sortKey)}
    >
      <span className="flex items-center gap-1">
        {label}
        {sortKey && (
          <span className={cn("text-[9px]", active ? "opacity-100" : "opacity-30")}>
            {active && current.dir === "asc" ? "▲" : "▼"}
          </span>
        )}
      </span>
    </th>
  );
}

// ── Empty / Loading rows ──────────────────────────────────────

function SkeletonRows() {
  return (
    <>
      {[1,2,3,4,5,6,7,8].map(i => (
        <tr key={i} className="border-b border-gray-50">
          {[1,2,3,4,5,6,7,8,9].map(j => (
            <td key={j} className="px-3 py-3">
              <div className="h-3.5 bg-gray-100 rounded animate-pulse" style={{ width: `${50 + (i*j*7 % 40)}%` }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

// ── ApplicantTable ────────────────────────────────────────────

interface ApplicantTableProps {
  rows:           ApplicantRow[];
  loading:        boolean;
  onRowClick:     (row: ApplicantRow) => void;
  onRowUpdate:    (gipId: string, patch: Partial<ApplicantRow>) => void;
  selectedId?:    string;
}

export function ApplicantTable({
  rows, loading, onRowClick, onRowUpdate, selectedId,
}: ApplicantTableProps) {
  const [sort, setSort] = useState<SortState>({ key: "DATE_REGISTERED", dir: "desc" });
  const { updating, update } = useDocumentUpdate();

  // ── Sorting ───────────────────────────────────────────────
  const handleSort = useCallback((key: SortKey) => {
    setSort(prev =>
      prev.key === key
        ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "asc" }
    );
  }, []);

  const sorted = [...rows].sort((a, b) => {
    const va = a[sort.key];
    const vb = b[sort.key];
    if (va == null) return 1;
    if (vb == null) return -1;
    const cmp = String(va).localeCompare(String(vb), undefined, { numeric: true });
    return sort.dir === "asc" ? cmp : -cmp;
  });

  // ── Doc checkbox handler ──────────────────────────────────
  const handleDocChange = useCallback(async (
    row: ApplicantRow,
    field: DocumentField,
    value: boolean
  ) => {
    // Optimistic update
    const updatedDocs = { ...row, [field]: value };
    const submittedCount = DOCUMENT_FIELDS.filter(d => !!updatedDocs[d.field]).length;
    onRowUpdate(row.GIP_ID, {
      [field]: value,
      TOTAL_SUBMITTED_DOCS: submittedCount,
      DOCUMENT_STATUS: submittedCount === DOCUMENT_FIELDS.length ? "COMPLETE" : "INCOMPLETE",
    });

    await update(
      row.GIP_ID,
      field,
      value,
      (result) => {
        // Reconcile with server response
        onRowUpdate(row.GIP_ID, {
          DOCUMENT_STATUS:    result.DOCUMENT_STATUS,
          REGISTRATION_STATUS: result.REGISTRATION_STATUS,
          TOTAL_SUBMITTED_DOCS: result.TOTAL_SUBMITTED_DOCS,
          MISSING_DOCUMENTS:  result.MISSING_DOCUMENTS,
          [field]: value,
        });
      },
      (_err) => {
        // Roll back on error
        onRowUpdate(row.GIP_ID, { [field]: !value });
      }
    );
  }, [update, onRowUpdate]);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full min-w-[900px] text-sm">
          <thead>
            <tr>
              <ColHeader label="GIP ID"      sortKey="GIP_ID"           current={sort} onSort={handleSort} />
              <ColHeader label="Name"        sortKey="SURNAME"          current={sort} onSort={handleSort} />
              <ColHeader label="Municipality" sortKey="MUNICIPALITY"    current={sort} onSort={handleSort} />
              <ColHeader label="Batch"       sortKey="BATCH_NAME"       current={sort} onSort={handleSort} />
              {/* Doc checkbox columns — abbreviated */}
              <th className="px-2 py-2.5 text-center text-[9px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-100 bg-[#f9fafb] whitespace-nowrap">
                <span title="Resume">Res</span>
              </th>
              <th className="px-2 py-2.5 text-center text-[9px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-100 bg-[#f9fafb] whitespace-nowrap">
                <span title="Birth Certificate">BC</span>
              </th>
              <th className="px-2 py-2.5 text-center text-[9px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-100 bg-[#f9fafb] whitespace-nowrap">
                <span title="School ID">SID</span>
              </th>
              <th className="px-2 py-2.5 text-center text-[9px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-100 bg-[#f9fafb] whitespace-nowrap">
                <span title="Certificate of Enrollment">COE</span>
              </th>
              <th className="px-2 py-2.5 text-center text-[9px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-100 bg-[#f9fafb] whitespace-nowrap">
                <span title="Barangay Certificate">Brgy</span>
              </th>
              <th className="px-2 py-2.5 text-center text-[9px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-100 bg-[#f9fafb] whitespace-nowrap">
                <span title="Parent Consent">Con</span>
              </th>
              <th className="px-2 py-2.5 text-center text-[9px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-100 bg-[#f9fafb] whitespace-nowrap">
                <span title="Medical Certificate">Med</span>
              </th>
              <ColHeader label="Docs"        sortKey="TOTAL_SUBMITTED_DOCS" current={sort} onSort={handleSort} />
              <ColHeader label="Doc Status"  sortKey="DOCUMENT_STATUS"  current={sort} onSort={handleSort} />
              <ColHeader label="App Status"  sortKey="APPLICATION_STATUS" current={sort} onSort={handleSort} />
              <ColHeader label="Registered"  sortKey="DATE_REGISTERED"  current={sort} onSort={handleSort} />
            </tr>
          </thead>
          <tbody>
            {loading && rows.length === 0 ? (
              <SkeletonRows />
            ) : sorted.length === 0 ? (
              <tr>
                <td colSpan={16} className="py-16 text-center text-xs text-gray-400">
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-3xl opacity-30">☰</span>
                    <span>No applicants match your current filters.</span>
                  </div>
                </td>
              </tr>
            ) : (
              sorted.map((row) => {
                const isSelected = row.GIP_ID === selectedId;
                return (
                  <tr
                    key={row.GIP_ID}
                    className={cn(
                      "border-b border-gray-50 transition-colors duration-100",
                      isSelected
                        ? "bg-[#f0f4ff] border-l-2 border-l-[#0f3460]"
                        : "hover:bg-gray-50/80 cursor-pointer"
                    )}
                    onClick={() => onRowClick(row)}
                  >
                    {/* GIP ID */}
                    <td className="px-3 py-2.5">
                      <span className="font-mono text-[11px] font-bold text-[#0f3460]">{row.GIP_ID}</span>
                    </td>

                    {/* Name */}
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <p className="text-xs font-bold text-[#1a1a2e]">
                        {row.SURNAME}, {row.FIRST_NAME}
                      </p>
                      {row.MIDDLE_NAME && (
                        <p className="text-[10px] text-gray-400">{row.MIDDLE_NAME}</p>
                      )}
                    </td>

                    {/* Municipality */}
                    <td className="px-3 py-2.5">
                      <span className="text-xs text-gray-600">{row.MUNICIPALITY}</span>
                    </td>

                    {/* Batch */}
                    <td className="px-3 py-2.5">
                      <span className="text-[10px] font-mono text-gray-500 whitespace-nowrap">{row.BATCH_NAME || "—"}</span>
                    </td>

                    {/* Doc checkboxes — stop propagation so row click doesn't fire */}
                    {(["DOC_RESUME","DOC_BIRTH_CERTIFICATE","DOC_SCHOOL_ID","DOC_CERTIFICATE_OF_ENROLLMENT","DOC_BARANGAY_CERTIFICATE","DOC_PARENT_CONSENT","DOC_MEDICAL_CERTIFICATE"] as DocumentField[]).map(field => {
                      const doc = DOCUMENT_FIELDS.find(d => d.field === field)!;
                      return (
                        <td key={field} className="px-2 py-2.5 text-center" onClick={e => e.stopPropagation()}>
                          <DocumentCheckbox
                            field={field}
                            shortLabel={doc.shortLabel}
                            checked={!!row[field]}
                            updating={!!updating[`${row.GIP_ID}:${field}`]}
                            onChange={val => handleDocChange(row, field, val)}
                          />
                        </td>
                      );
                    })}

                    {/* Doc count pill */}
                    <td className="px-3 py-2.5 text-center" onClick={e => e.stopPropagation()}>
                      <DocProgressPill submitted={row.TOTAL_SUBMITTED_DOCS} required={row.TOTAL_REQUIRED_DOCS} />
                    </td>

                    {/* Doc status */}
                    <td className="px-3 py-2.5">
                      <StatusBadge status={row.DOCUMENT_STATUS} size="sm" />
                    </td>

                    {/* App status */}
                    <td className="px-3 py-2.5">
                      <StatusBadge status={row.APPLICATION_STATUS} size="sm" />
                    </td>

                    {/* Date */}
                    <td className="px-3 py-2.5">
                      <span className="text-[11px] text-gray-400 whitespace-nowrap">
                        {formatDate(row.DATE_REGISTERED)}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
