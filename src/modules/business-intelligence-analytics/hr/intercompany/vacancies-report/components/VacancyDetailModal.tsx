"use client";

import React from "react";
import {
  X,
  Briefcase,
  FileText,
  UserCheck,
} from "lucide-react";
import { IntercompanyVacancyRecord } from "../types";

interface VacancyDetailModalProps {
  record: IntercompanyVacancyRecord | null;
  open: boolean;
  onClose: () => void;
}

export const VacancyDetailModal: React.FC<VacancyDetailModalProps> = ({
  record,
  open,
  onClose,
}) => {
  if (!open || !record) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in-50 duration-200">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900">
              <Briefcase className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-lg border border-indigo-200 dark:border-indigo-800">
                  {record.requestNo}
                </span>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                    record.urgency === "Critical"
                      ? "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800"
                      : record.urgency === "Moderate"
                      ? "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                      : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                  }`}
                >
                  {record.urgency} Urgency
                </span>
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1">
                {record.position}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {record.companyName} ({record.companyCode}) • {record.department}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-800 dark:text-slate-200">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">
                Open Vacancies
              </span>
              <div className="text-lg font-bold font-mono text-indigo-600 dark:text-indigo-400 mt-0.5">
                {record.openVacancies} of {record.totalNeeded}
              </div>
              <span className="text-[10px] text-slate-400">
                {record.hiredCount} filled ({record.fulfillmentRate}%)
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">
                Purpose
              </span>
              <div className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                {record.purpose}
              </div>
              <span className="text-[10px] text-slate-400 truncate block">
                {record.replacementName ? `Replaces: ${record.replacementName}` : "New Seat"}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">
                Budget Rate
              </span>
              <div className="text-sm font-bold font-mono text-slate-900 dark:text-slate-100 mt-0.5">
                {record.rateFormatted}
              </div>
              <span className="text-[10px] text-slate-400">
                Total: ₱{record.totalAllocatedBudget.toLocaleString()}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">
                Aging
              </span>
              <div className="text-sm font-bold font-mono text-slate-900 dark:text-slate-100 mt-0.5">
                {record.agingDays} days
              </div>
              <span className="text-[10px] text-slate-400">
                Since {record.approvedAtFormatted || record.createdAtFormatted}
              </span>
            </div>
          </div>

          {/* Job Specifications */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-indigo-500" />
              Role Description &amp; Specifications
            </h4>

            {record.reasonJustification && (
              <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                  Reason / Business Justification
                </span>
                <p className="text-xs whitespace-pre-wrap leading-relaxed text-slate-800 dark:text-slate-200">
                  {record.reasonJustification}
                </p>
              </div>
            )}

            {record.qualificationDescription && (
              <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                  Qualifications &amp; Requirements
                </span>
                <p className="text-xs whitespace-pre-wrap leading-relaxed text-slate-800 dark:text-slate-200 font-mono">
                  {record.qualificationDescription}
                </p>
              </div>
            )}
          </div>

          {/* Candidate Pipeline */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-indigo-500" />
                Applicant Pipeline &amp; Recommendations ({record.candidates.length})
              </h4>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Direct candidate nominations
              </span>
            </div>

            {record.candidates.length === 0 ? (
              <div className="p-4 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-slate-400">
                No candidate recommendations attached to this requisition yet
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                {record.candidates.map((c) => (
                  <div
                    key={c.id}
                    className="p-3 bg-white dark:bg-slate-900 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-slate-100">
                        {c.applicantName}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Nominated {c.recommendedAtFormatted || "-"} {c.recommendedByName ? `by ${c.recommendedByName}` : ""}
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                        c.status.toLowerCase() === "hired"
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                          : c.status.toLowerCase() === "rejected"
                          ? "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800"
                          : "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800"
                      }`}
                    >
                      {c.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Signoff & Audit Trail */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
            <div>
              <span className="text-slate-400 block">Requested By</span>
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {record.requestedByName || "HR Admin"}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Approved By</span>
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {record.approvedByName || "Executive Board"}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Approved Date</span>
              <span className="font-medium text-slate-700 dark:text-slate-300 font-mono">
                {record.approvedAtFormatted || "-"}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Date Filed</span>
              <span className="font-medium text-slate-700 dark:text-slate-300 font-mono">
                {record.createdAtFormatted}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl transition cursor-pointer"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
};

