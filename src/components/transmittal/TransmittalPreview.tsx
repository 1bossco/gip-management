"use client";

import { useState, useEffect } from "react";
import { cn, formatDate }      from "@/lib/utils";
import { OFFICE_NAME, OFFICE_SHORT } from "@/lib/constants";
import type { TransmittalData } from "@/types";

interface TransmittalPreviewProps {
  data: TransmittalData;
}

// ── Paper sizes ───────────────────────────────────────────────
// Dimensions are given explicitly rather than by name (Legal, A4…) because the
// 8.5x13 "long bond"/folio size Philippine offices use has no CSS keyword.
// Landscape is produced by swapping the two dimensions — `size: <name> landscape`
// is unreliable once a custom size is involved.

const PAPER_SIZES = [
  { key: "FOLIO",  label: "8.5 × 13 in (Long/Folio)", width: "8.5in", height: "13in"  },
  { key: "LETTER", label: "8.5 × 11 in (Letter)",     width: "8.5in", height: "11in"  },
  { key: "LEGAL",  label: "8.5 × 14 in (Legal)",      width: "8.5in", height: "14in"  },
  { key: "A4",     label: "A4 (210 × 297 mm)",        width: "210mm", height: "297mm" },
] as const;

type PaperKey   = (typeof PAPER_SIZES)[number]["key"];
type Orientation = "portrait" | "landscape";

function pageRule(paper: PaperKey, orientation: Orientation): string {
  const size = PAPER_SIZES.find(p => p.key === paper) ?? PAPER_SIZES[0];
  const [w, h] = orientation === "landscape"
    ? [size.height, size.width]
    : [size.width, size.height];
  return `@page { size: ${w} ${h}; margin: 12mm 10mm; }`;
}

// ── Print trigger ─────────────────────────────────────────────
// Opens a bare window holding only the transmittal markup, so the app shell
// (sidebar, buttons) never lands on the page. "Save as PDF" in the print dialog
// is what produces the PDF download.

function printTransmittal(contentId: string, paper: PaperKey, orientation: Orientation) {
  const el = document.getElementById(contentId);
  if (!el) return;
  const printWindow = window.open("", "_blank", "width=900,height=700");
  if (!printWindow) { window.print(); return; }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>GIP Transmittal — ${contentId}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif:wght@400;700&family=DM+Sans:wght@400;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', sans-serif; font-size: 9pt; color: #000; background: white; }
        .transmittal { padding: 20mm 18mm; }
        /* Header */
        .doc-header { text-align: center; margin-bottom: 12pt; padding-bottom: 8pt; border-bottom: 2pt solid #000; }
        .doc-header .republic { font-size: 7pt; letter-spacing: 0.15em; text-transform: uppercase; }
        .doc-header .province { font-size: 13pt; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; margin: 3pt 0; }
        .doc-header .office { font-size: 8pt; text-transform: uppercase; letter-spacing: 0.1em; color: #444; }
        .doc-header .doc-title { font-family: 'Noto Serif', serif; font-size: 14pt; font-weight: 700; margin-top: 8pt; text-transform: uppercase; letter-spacing: 0.08em; }
        .doc-header .doc-sub { font-size: 8pt; color: #555; margin-top: 2pt; }
        /* Meta row */
        .meta-row { display: flex; justify-content: space-between; margin: 8pt 0; font-size: 8pt; }
        .meta-item { display: flex; gap: 6pt; }
        .meta-item .meta-label { font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #444; }
        /* Table */
        table { width: 100%; border-collapse: collapse; margin: 10pt 0; font-size: 8pt; }
        thead th { background: #0f3460; color: white; padding: 5pt 6pt; text-align: left; font-weight: 700; font-size: 7pt; text-transform: uppercase; letter-spacing: 0.08em; border: 1pt solid #0f3460; }
        tbody td { padding: 4pt 6pt; border: 0.5pt solid #d1d5db; vertical-align: top; }
        tbody tr:nth-child(even) td { background: #f9fafb; }
        tbody tr:last-child td { border-bottom: 1pt solid #666; }
        .num-col { text-align: center; width: 24pt; font-weight: 700; }
        .id-col { font-family: monospace; font-size: 7.5pt; }
        .name-col { font-weight: 600; }
        .sub-text { font-size: 7pt; color: #666; }
        /* Summary */
        .summary-box { border: 1pt solid #d1d5db; padding: 8pt; margin: 8pt 0; display: flex; gap: 16pt; }
        .sum-item { display: flex; flex-direction: column; align-items: center; }
        .sum-value { font-family: 'Noto Serif', serif; font-size: 16pt; font-weight: 700; color: #0f3460; }
        .sum-label { font-size: 6.5pt; text-transform: uppercase; letter-spacing: 0.1em; color: #666; margin-top: 1pt; }
        /* Signature — the print window has no Tailwind, so the side-by-side layout
           must come from these rules. Without them the two blocks are plain divs
           and stack vertically, putting one signatory under the other.
           nowrap keeps them on one line even on a narrow page; the fixed 50% basis
           keeps the two lines equal width regardless of name length. */
        .sig-grid {
          display: flex !important;
          flex-direction: row !important;
          flex-wrap: nowrap !important;
          gap: 36pt;
          margin-top: 12pt;
          page-break-inside: avoid;
          break-inside: avoid;
        }
        .sig-col { flex: 1 1 50%; min-width: 0; text-align: center; }
        .sig-label { font-size: 7.5pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; color: #555; }
        .sig-space { height: 34pt; }
        .sig-line { border-top: 1pt solid #000; padding-top: 3pt; }
        .sig-name { font-weight: 800; font-size: 9pt; text-transform: uppercase; letter-spacing: 0.05em; color: #000; }
        .sig-title { font-size: 7.5pt; color: #444; margin-top: 1pt; }
        .sig-date { font-size: 7pt; color: #666; margin-top: 2pt; }
        /* Footer */
        .doc-footer { margin-top: 16pt; padding-top: 6pt; border-top: 0.5pt solid #ccc; display: flex; justify-content: space-between; font-size: 6.5pt; color: #999; }
        ${pageRule(paper, orientation)}
        @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
      </style>
    </head>
    <body>
      ${el.innerHTML}
    </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => { printWindow.print(); printWindow.close(); }, 400);
}

// ── Signatories ───────────────────────────────────────────────

interface Signatories {
  preparedName:     string;
  preparedPosition: string;
  approvedName:     string;
  approvedPosition: string;
}

const DEFAULT_SIGNATORIES: Signatories = {
  preparedName:     "",
  preparedPosition: `${OFFICE_SHORT} Staff / Encoder`,
  approvedName:     "",
  approvedPosition: `${OFFICE_SHORT} Manager / Governor`,
};

// The same two people sign most transmittals, so remember them rather than making
// the encoder retype the names for every document.
const SIGNATORY_STORAGE_KEY = "gip_transmittal_signatories";

function loadSignatories(): Signatories {
  if (typeof window === "undefined") return DEFAULT_SIGNATORIES;
  try {
    const saved = window.localStorage.getItem(SIGNATORY_STORAGE_KEY);
    if (!saved) return DEFAULT_SIGNATORIES;

    const stored: Signatories = { ...DEFAULT_SIGNATORIES, ...JSON.parse(saved) };

    // The office was renamed from PESO to OPPESM. Positions saved before the
    // rename would otherwise keep printing the old name on every transmittal,
    // since a stored value always beats the default.
    return {
      ...stored,
      preparedPosition: stored.preparedPosition.replace(/\bPESO\b/g, OFFICE_SHORT),
      approvedPosition: stored.approvedPosition.replace(/\bPESO\b/g, OFFICE_SHORT),
    };
  } catch {
    return DEFAULT_SIGNATORIES;
  }
}

// One signature column. Both the sig-* classes (print) and Tailwind (screen) are
// needed — see the note at the call site.
function SignatureBlock({
  label, name, position,
}: { label: string; name: string; position: string }) {
  return (
    <div className="sig-col flex-1 basis-1/2 min-w-0 text-center">
      <p className="sig-label text-[9px] font-bold uppercase tracking-widest text-gray-500">
        {label}
      </p>

      {/* Blank space to sign in */}
      <div className="sig-space h-12" />

      <div className="sig-line border-t border-[#1a1a2e] pt-1.5">
        <p className="sig-name text-xs font-black uppercase tracking-wider text-[#1a1a2e] break-words">
          {name.trim() || "____________________________"}
        </p>
        <p className="sig-title text-[10px] text-gray-500 mt-1">{position}</p>
        <p className="sig-date text-[9px] text-gray-400 mt-0.5">Date: ________________</p>
      </div>
    </div>
  );
}

function SignatoryField({
  placeholder, value, onChange, uppercase,
}: {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  uppercase?: boolean;
}) {
  return (
    <input
      type="text"
      value={value}
      placeholder={placeholder}
      onChange={e => onChange(e.target.value)}
      className={cn(
        "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-[#1a1a2e]",
        "placeholder:text-gray-400 placeholder:normal-case",
        "focus:outline-none focus:ring-2 focus:ring-[#0f3460]/30 focus:border-[#0f3460]",
        uppercase && "uppercase font-semibold"
      )}
    />
  );
}

function PrintOption({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
        {label}
      </span>
      {children}
    </label>
  );
}

// ── Excel export ──────────────────────────────────────────────
// Header block mirrors the printed document so the spreadsheet is recognisable
// as the same transmittal, then the applicant rows as a plain table.

// SheetJS is ~90KB — loaded on click rather than with the page, so opening the
// transmittal doesn't pay for a library most viewings never use.
async function exportToExcel(data: TransmittalData, signatories: Signatories) {
  const XLSX = await import("xlsx");

  const header = [
    ["GOVERNMENT INTERNSHIP PROGRAM — TRANSMITTAL"],
    [],
    ["Transmittal No.", data.transmittalId],
    ["Date Generated",  formatDate(data.dateGenerated)],
    ["Batch",           data.batchName    || "All"],
    ["Sector",          data.sector       || "All"],
    ["Municipality",    data.municipality || "All"],
    ["Total Applicants", data.totalIncluded],
    [],
  ];

  const columns = [
    "No.", "GIP ID", "Name", "Sex", "Municipality", "Barangay",
    "Contact Number", "Sector", "Document Status", "Application Status",
  ];

  const rows = data.entries.map((e, i) => [
    i + 1,
    e.GIP_ID,
    e.fullName,
    e.SEX,
    e.MUNICIPALITY,
    e.BARANGAY,
    e.CONTACT_NUMBER,
    e.SECTOR,
    e.DOCUMENT_STATUS,
    e.APPLICATION_STATUS,
  ]);

  // Mirror the printed signature blocks so the spreadsheet is a faithful copy.
  const blank = "____________________________";
  const footer = [
    [],
    ["PREPARED BY:", "", "", "", "APPROVED BY:"],
    [signatories.preparedName.trim() || blank, "", "", "",
     signatories.approvedName.trim() || blank],
    [signatories.preparedPosition, "", "", "", signatories.approvedPosition],
    ["Date: ________________", "", "", "", "Date: ________________"],
  ];

  const sheet = XLSX.utils.aoa_to_sheet([...header, columns, ...rows, ...footer]);

  // Excel defaults every column to the same narrow width, which truncates names
  // and addresses on open. Size them to the content instead.
  sheet["!cols"] = [
    { wch: 5 }, { wch: 16 }, { wch: 32 }, { wch: 6 }, { wch: 16 },
    { wch: 22 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 18 },
  ];

  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, "Transmittal");
  XLSX.writeFile(book, `GIP-Transmittal-${data.transmittalId}.xlsx`);
}

// ── TransmittalPreview ────────────────────────────────────────

export function TransmittalPreview({ data }: TransmittalPreviewProps) {
  const contentId = `transmittal-${data.transmittalId}`;

  const [paper, setPaper]             = useState<PaperKey>("FOLIO");
  const [orientation, setOrientation] = useState<Orientation>("portrait");

  // Read from localStorage in an effect, not in useState — the server renders
  // this page and has no localStorage, so seeding state from it would hydrate
  // mismatched markup.
  const [signatories, setSignatories] = useState<Signatories>(DEFAULT_SIGNATORIES);

  useEffect(() => { setSignatories(loadSignatories()); }, []);

  const updateSignatory = (key: keyof Signatories, value: string) => {
    setSignatories(prev => {
      const next = { ...prev, [key]: value };
      try {
        window.localStorage.setItem(SIGNATORY_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Private browsing / storage full — the document still prints correctly,
        // the names just won't be remembered next time.
      }
      return next;
    });
  };

  const approvedCount    = data.entries.filter(e => e.APPLICATION_STATUS === "APPROVED").length;
  const pendingCount     = data.entries.filter(e => e.APPLICATION_STATUS === "PENDING").length;
  const completeDocCount = data.entries.filter(e => e.DOCUMENT_STATUS === "COMPLETE").length;

  return (
    <div className="space-y-4">

      {/* ── Action bar ───────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-3
        flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">

        <div>
          <p className="text-xs font-black text-[#1a1a2e]">
            Transmittal #{data.transmittalId}
          </p>
          <p className="text-[10px] text-gray-400 mt-0.5">
            {data.totalIncluded} applicant{data.totalIncluded !== 1 ? "s" : ""} ·
            Generated {formatDate(data.dateGenerated)}
          </p>
        </div>

        <div className="flex flex-wrap items-end gap-2">
          <PrintOption label="Paper Size">
            <select
              value={paper}
              onChange={e => setPaper(e.target.value as PaperKey)}
              className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-xs
                font-semibold text-[#1a1a2e] focus:outline-none focus:ring-2 focus:ring-[#0f3460]/30"
            >
              {PAPER_SIZES.map(p => (
                <option key={p.key} value={p.key}>{p.label}</option>
              ))}
            </select>
          </PrintOption>

          <PrintOption label="Orientation">
            <select
              value={orientation}
              onChange={e => setOrientation(e.target.value as Orientation)}
              className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-xs
                font-semibold text-[#1a1a2e] focus:outline-none focus:ring-2 focus:ring-[#0f3460]/30"
            >
              <option value="portrait">Portrait</option>
              <option value="landscape">Landscape</option>
            </select>
          </PrintOption>

          <button
            onClick={() => exportToExcel(data, signatories)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-xs font-bold
              rounded-xl hover:bg-emerald-700 transition-colors shadow-md shadow-emerald-600/20
              active:scale-[0.98]"
          >
            📊 Download Excel
          </button>

          <button
            onClick={() => printTransmittal(contentId, paper, orientation)}
            className="flex items-center gap-2 px-4 py-2 bg-[#0f3460] text-white text-xs font-bold
              rounded-xl hover:bg-[#16213e] transition-colors shadow-md shadow-[#0f3460]/20
              active:scale-[0.98]"
          >
            🖨️ Print / Save as PDF
          </button>
        </div>
      </div>

      {/* ── Signatories ──────────────────────────────────
          Sits outside the printable div, so these inputs never appear on the
          document — only the values they produce do. */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
          Signatories
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-[#0f3460] uppercase tracking-wider">
              Prepared by
            </p>
            <SignatoryField
              placeholder="Full name"
              value={signatories.preparedName}
              onChange={v => updateSignatory("preparedName", v)}
              uppercase
            />
            <SignatoryField
              placeholder="Position"
              value={signatories.preparedPosition}
              onChange={v => updateSignatory("preparedPosition", v)}
            />
          </div>

          <div className="space-y-2">
            <p className="text-[10px] font-bold text-[#0f3460] uppercase tracking-wider">
              Approved by
            </p>
            <SignatoryField
              placeholder="Full name"
              value={signatories.approvedName}
              onChange={v => updateSignatory("approvedName", v)}
              uppercase
            />
            <SignatoryField
              placeholder="Position"
              value={signatories.approvedPosition}
              onChange={v => updateSignatory("approvedPosition", v)}
            />
          </div>
        </div>

        <p className="text-[10px] text-gray-400 mt-3">
          Saved on this device and reused for the next transmittal. Leave the name
          blank to print a ruled line to sign over.
        </p>
      </div>

      {/* ── Summary pills ────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total",          value: data.totalIncluded, color: "bg-[#0f3460] text-white" },
          { label: "Approved",       value: approvedCount,      color: "bg-emerald-500 text-white" },
          { label: "Pending",        value: pendingCount,       color: "bg-amber-400 text-white" },
          { label: "Docs Complete",  value: completeDocCount,   color: "bg-sky-500 text-white" },
        ].map(s => (
          <div key={s.label} className={cn(
            "rounded-xl px-4 py-3 flex items-center gap-3",
            s.color
          )}>
            <p className="text-2xl font-black leading-none"
              style={{ fontFamily: "var(--font-display, serif)" }}>
              {s.value}
            </p>
            <p className="text-[10px] font-bold uppercase tracking-wider opacity-80">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Document preview (the printable content) ─ */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

        {/* Screen label */}
        <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Document Preview</p>
          <p className="text-[10px] text-gray-400">Scroll to review · Print button above</p>
        </div>

        {/* The actual transmittal document */}
        <div className="overflow-auto">
          <div
            id={contentId}
            className="transmittal min-w-[680px] p-10 text-[#1a1a2e]"
            style={{ fontFamily: "var(--font-body, 'DM Sans', sans-serif)" }}
          >

            {/* ── Letterhead ─────────────────────────── */}
            <div className="doc-header text-center mb-8 pb-6 border-b-2 border-[#1a1a2e]">
              <p className="text-[9px] font-semibold tracking-[0.18em] uppercase text-gray-500 mb-1">
                Republic of the Philippines
              </p>
              <p className="text-lg font-black uppercase tracking-widest text-[#0f3460] my-1"
                style={{ fontFamily: "var(--font-display, serif)" }}>
                {process.env.NEXT_PUBLIC_PROVINCE ?? "Province of Bataan"}
              </p>
              <p className="text-[10px] tracking-widest uppercase text-gray-500">
                {OFFICE_NAME}
              </p>

              {/* Decorative rule */}
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-0.5 bg-[#0f3460]" />
                <div className="w-2 h-2 rounded-full bg-[#e94560]" />
                <div className="w-2 h-2 rounded-full bg-[#0f3460]" />
                <div className="w-2 h-2 rounded-full bg-[#e94560]" />
                <div className="flex-1 h-0.5 bg-[#0f3460]" />
              </div>

              <p className="text-xl font-black uppercase tracking-[0.12em] text-[#1a1a2e]"
                style={{ fontFamily: "var(--font-display, serif)" }}>
                Transmittal List
              </p>
              <p className="text-[10px] text-gray-500 mt-1">
                Government Internship Program (GIP) — Applicant Endorsement
              </p>
            </div>

            {/* ── Transmittal metadata ───────────────── */}
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 mb-6 text-xs">
              {[
                ["Transmittal No.",   data.transmittalId],
                ["Date Generated",    formatDate(data.dateGenerated)],
                ["Batch",             data.batchName],
                ["Sector",            data.sector === "ALL" ? "All Sectors" : data.sector],
                ["Municipality",      data.municipality === "ALL" ? "All Municipalities" : data.municipality],
                ["Total Applicants",  String(data.totalIncluded)],
              ].map(([label, value]) => (
                <div key={label} className="flex items-baseline gap-2">
                  <span className="font-bold text-[10px] uppercase tracking-widest text-gray-500 w-32 flex-shrink-0">
                    {label}:
                  </span>
                  <span className={cn(
                    "font-semibold text-[#1a1a2e]",
                    label === "Transmittal No." ? "font-mono font-black" : ""
                  )}>
                    {value}
                  </span>
                </div>
              ))}
            </div>

            {/* ── Applicant table ────────────────────── */}
            <table className="w-full border-collapse text-xs mb-6">
              <thead>
                <tr>
                  <th className="bg-[#0f3460] text-white px-2 py-2 text-left text-[9px] font-black uppercase tracking-wider border border-[#0f3460] w-7 text-center">
                    #
                  </th>
                  <th className="bg-[#0f3460] text-white px-2 py-2 text-left text-[9px] font-black uppercase tracking-wider border border-[#0f3460]">
                    GIP ID
                  </th>
                  <th className="bg-[#0f3460] text-white px-2 py-2 text-left text-[9px] font-black uppercase tracking-wider border border-[#0f3460]">
                    Full Name
                  </th>
                  <th className="bg-[#0f3460] text-white px-2 py-2 text-left text-[9px] font-black uppercase tracking-wider border border-[#0f3460]">
                    Sex
                  </th>
                  <th className="bg-[#0f3460] text-white px-2 py-2 text-left text-[9px] font-black uppercase tracking-wider border border-[#0f3460]">
                    Municipality
                  </th>
                  <th className="bg-[#0f3460] text-white px-2 py-2 text-left text-[9px] font-black uppercase tracking-wider border border-[#0f3460]">
                    Barangay
                  </th>
                  <th className="bg-[#0f3460] text-white px-2 py-2 text-left text-[9px] font-black uppercase tracking-wider border border-[#0f3460]">
                    Contact
                  </th>
                  <th className="bg-[#0f3460] text-white px-2 py-2 text-left text-[9px] font-black uppercase tracking-wider border border-[#0f3460]">
                    Doc Status
                  </th>
                  <th className="bg-[#0f3460] text-white px-2 py-2 text-left text-[9px] font-black uppercase tracking-wider border border-[#0f3460]">
                    App Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.entries.map((entry, i) => (
                  <tr
                    key={entry.GIP_ID}
                    className={cn(
                      "border-b border-gray-100",
                      i % 2 === 0 ? "bg-white" : "bg-gray-50/60"
                    )}
                  >
                    <td className="px-2 py-2 text-center border border-gray-200 text-[10px] font-bold text-gray-400">
                      {i + 1}
                    </td>
                    <td className="px-2 py-2 border border-gray-200">
                      <span className="font-mono text-[10px] font-bold text-[#0f3460]">
                        {entry.GIP_ID}
                      </span>
                    </td>
                    <td className="px-2 py-2 border border-gray-200">
                      <p className="font-bold text-[11px] text-[#1a1a2e] uppercase">
                        {entry.fullName}
                      </p>
                    </td>
                    <td className="px-2 py-2 border border-gray-200 text-[10px] text-gray-600">
                      {entry.SEX}
                    </td>
                    <td className="px-2 py-2 border border-gray-200 text-[10px] text-gray-700">
                      {entry.MUNICIPALITY}
                    </td>
                    <td className="px-2 py-2 border border-gray-200 text-[10px] text-gray-700">
                      {entry.BARANGAY}
                    </td>
                    <td className="px-2 py-2 border border-gray-200 text-[10px] font-mono text-gray-600">
                      {entry.CONTACT_NUMBER}
                    </td>
                    <td className="px-2 py-2 border border-gray-200">
                      <span className={cn(
                        "text-[9px] font-black px-1.5 py-0.5 rounded",
                        entry.DOCUMENT_STATUS === "COMPLETE"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                      )}>
                        {entry.DOCUMENT_STATUS}
                      </span>
                    </td>
                    <td className="px-2 py-2 border border-gray-200">
                      <span className={cn(
                        "text-[9px] font-black px-1.5 py-0.5 rounded",
                        entry.APPLICATION_STATUS === "APPROVED"
                          ? "bg-emerald-100 text-emerald-800"
                          : entry.APPLICATION_STATUS === "DISAPPROVED"
                          ? "bg-red-100 text-red-800"
                          : "bg-sky-100 text-sky-800"
                      )}>
                        {entry.APPLICATION_STATUS}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>

              {/* Table footer total row */}
              <tfoot>
                <tr className="bg-[#f0f4ff]">
                  <td colSpan={7} className="px-3 py-2 border border-gray-300 text-right text-[10px] font-black uppercase tracking-wider text-[#0f3460]">
                    Total Applicants:
                  </td>
                  <td colSpan={2} className="px-3 py-2 border border-gray-300 text-[13px] font-black text-[#0f3460]"
                    style={{ fontFamily: "var(--font-display, serif)" }}>
                    {data.totalIncluded}
                  </td>
                </tr>
              </tfoot>
            </table>

            {/* ── Certification paragraph ────────────── */}
            <div className="border border-gray-200 rounded p-4 mb-8 bg-gray-50/50 text-[11px] leading-relaxed text-gray-700">
              <p>
                <span className="font-black uppercase tracking-wider text-[#1a1a2e]">Certification: </span>
                This is to certify that the above-listed applicants have been duly processed and
                evaluated by this office in accordance with the guidelines of the Government
                Internship Program (GIP). All information provided herein is true and correct to
                the best of our knowledge.
              </p>
            </div>

            {/* ── Signature blocks ───────────────────────────────
                sig-* class names carry the layout into the print window, which
                has no Tailwind. Keep both sets of classes on these elements. */}
            <div className="sig-grid flex flex-row flex-nowrap gap-12 mt-4">
              <SignatureBlock
                label="Prepared by:"
                name={signatories.preparedName}
                position={signatories.preparedPosition}
              />
              <SignatureBlock
                label="Approved by:"
                name={signatories.approvedName}
                position={signatories.approvedPosition}
              />
            </div>

            {/* ── Document footer ────────────────────── */}
            <div className="mt-10 pt-3 border-t border-gray-200 flex items-center justify-between">
              <p className="text-[8px] text-gray-400">
                GIP Management System · Generated {formatDate(data.dateGenerated)}
              </p>
              <p className="text-[8px] font-mono text-gray-400">
                {data.transmittalId}
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
