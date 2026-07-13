"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import { Button, StatusBadge } from "@/components/ui";
import { DOCUMENT_FIELDS } from "@/lib/constants";
import { cn } from "@/lib/utils";

function SuccessContent() {
  const params  = useSearchParams();
  const router  = useRouter();

  const gipId     = params.get("gipId")     ?? "GIP-0000-00000";
  const batchName = params.get("batchName") ?? "—";
  const dateReg   = params.get("dateReg")   ?? "—";
  const docStatus = (params.get("docStatus") ?? "INCOMPLETE") as "COMPLETE" | "INCOMPLETE";
  const missing   = params.get("missing")   ?? "";
  const submitted = parseInt(params.get("submitted") ?? "0");
  const required  = parseInt(params.get("required")  ?? "7");
  const name      = params.get("name")      ?? "Applicant";

  const missingList   = missing ? missing.split(",").map(s => s.trim()).filter(Boolean) : [];
  const isComplete    = docStatus === "COMPLETE";
  const progressPct   = Math.round((submitted / required) * 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f3460] via-[#16213e] to-[#0f3460] flex items-center justify-center p-4">
      <div className="w-full max-w-lg">

        {/* ── Status Icon ──────────────────────────────────── */}
        <div className="flex flex-col items-center mb-8">
          <div className={cn(
            "w-20 h-20 rounded-full flex items-center justify-center text-4xl mb-4 shadow-2xl",
            isComplete ? "bg-emerald-500" : "bg-amber-400"
          )}>
            {isComplete ? "✓" : "⚡"}
          </div>
          <h1 className="text-2xl font-black text-white text-center">
            {isComplete ? "Registration Complete!" : "Application Received!"}
          </h1>
          <p className="text-blue-200 text-sm text-center mt-2 max-w-xs">
            {isComplete
              ? "All documents submitted. Your application is pending review."
              : "Your application has been saved. Please submit the remaining documents."}
          </p>
        </div>

        {/* ── Info Card ─────────────────────────────────────── */}
        <div className="bg-white rounded-2xl overflow-hidden shadow-2xl">

          {/* Applicant Name Banner */}
          <div className="bg-[#0f3460] px-6 py-4">
            <p className="text-blue-200 text-xs font-bold uppercase tracking-widest mb-1">Registered Applicant</p>
            <p className="text-white font-black text-lg uppercase tracking-wide">{name}</p>
          </div>

          <div className="p-6 space-y-4">
            {/* GIP ID — most important field */}
            <div className="bg-gradient-to-r from-[#f0f4ff] to-white border-2 border-[#0f3460]/20 rounded-xl p-4">
              <p className="text-xs font-bold text-[#0f3460] uppercase tracking-widest mb-1">
                Your GIP Application ID
              </p>
              <p className="text-2xl font-black text-[#0f3460] tracking-widest font-mono">
                {gipId}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Keep this ID — you will need it for follow-ups and inquiries.
              </p>
            </div>

            {/* Details grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-gray-50">
                <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-1">Batch</p>
                <p className="text-sm font-bold text-[#1a1a2e]">{batchName}</p>
              </div>
              <div className="p-3 rounded-xl bg-gray-50">
                <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-1">Date Registered</p>
                <p className="text-sm font-bold text-[#1a1a2e]">{dateReg}</p>
              </div>
              <div className="p-3 rounded-xl bg-gray-50">
                <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-1">Document Status</p>
                <StatusBadge status={docStatus} />
              </div>
              <div className="p-3 rounded-xl bg-gray-50">
                <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-1">Application Status</p>
                <StatusBadge status="PENDING" />
              </div>
            </div>

            {/* Document Progress Bar */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <p className="text-xs font-bold text-gray-600 uppercase tracking-wider">Documents Submitted</p>
                <span className="text-xs font-bold text-[#0f3460]">{submitted} / {required}</span>
              </div>
              <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-1000",
                    isComplete ? "bg-emerald-500" : "bg-amber-400"
                  )}
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>

            {/* Missing Documents */}
            {missingList.length > 0 && (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200">
                <p className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <span>📋</span> Missing Documents ({missingList.length})
                </p>
                <ul className="space-y-1">
                  {missingList.map((doc) => (
                    <li key={doc} className="text-xs text-amber-800 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                      {/* Match short label back to full label */}
                      {DOCUMENT_FIELDS.find(d => d.shortLabel === doc)?.label ?? doc}
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-amber-600 mt-2 pt-2 border-t border-amber-200">
                  Please bring these documents to the PESO office to complete your application.
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="px-6 pb-6 flex flex-col gap-2">
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={() => window.print()}
            >
              🖨️ Print This Receipt
            </Button>
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => router.push("/register")}
            >
              + Register Another Applicant
            </Button>
          </div>
        </div>

        {/* Footer note */}
        <p className="text-center text-blue-300/60 text-xs mt-6 px-4">
          For inquiries, contact the PESO office with your GIP ID: <strong className="text-blue-200">{gipId}</strong>
        </p>

      </div>

      {/* Print styles */}
      <style jsx global>{`
        @media print {
          body { background: white !important; }
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0f3460] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
