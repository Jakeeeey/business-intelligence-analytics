"use client";

import React from "react";
import {
  IntercompanyVacancyRecord,
  VacancyUrgency,
} from "../types";
import { VacancySortField, SortOrder } from "../hooks/useIntercompanyVacancies";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Briefcase,
} from "lucide-react";

interface VacanciesTableProps {
  vacancies: IntercompanyVacancyRecord[];
  totalItems: number;
  page: number;
  pageSize: number;
  totalPages: number;
  sortField: VacancySortField;
  sortOrder: SortOrder;
  onSort: (field: VacancySortField) => void;
  onPageChange: (newPage: number) => void;
  onPageSizeChange: (newPageSize: number) => void;
  onSelectVacancy: (record: IntercompanyVacancyRecord) => void;
}

export const VacanciesTable: React.FC<VacanciesTableProps> = ({
  vacancies,
  totalItems,
  page,
  pageSize,
  totalPages,
  sortField,
  sortOrder,
  onSort,
  onPageChange,
  onPageSizeChange,
  onSelectVacancy,
}) => {
  const getSortIcon = (field: VacancySortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-60" />;
    }
    return sortOrder === "asc" ? (
      <ArrowUp className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
    );
  };

  const getUrgencyBadge = (urgency: VacancyUrgency) => {
    switch (urgency) {
      case "Critical":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            Critical
          </span>
        );
      case "Moderate":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            Moderate
          </span>
        );
      case "Normal":
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            Normal
          </span>
        );
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden transition-colors">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[950px]">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
              <th
                onClick={() => onSort("requestNo")}
                className="py-3.5 pl-4 pr-3 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <div className="flex items-center gap-1.5">
                  <span>Req #</span>
                  {getSortIcon("requestNo")}
                </div>
              </th>

              <th
                onClick={() => onSort("companyName")}
                className="py-3.5 px-3 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <div className="flex items-center gap-1.5">
                  <span>Operating Entity</span>
                  {getSortIcon("companyName")}
                </div>
              </th>

              <th
                onClick={() => onSort("position")}
                className="py-3.5 px-3 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <div className="flex items-center gap-1.5">
                  <span>Open Position Title</span>
                  {getSortIcon("position")}
                </div>
              </th>

              <th
                onClick={() => onSort("department")}
                className="py-3.5 px-3 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <div className="flex items-center gap-1.5">
                  <span>Department</span>
                  {getSortIcon("department")}
                </div>
              </th>

              <th
                onClick={() => onSort("openVacancies")}
                className="py-3.5 px-3 text-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <div className="flex items-center justify-center gap-1.5">
                  <span>Vacancies</span>
                  {getSortIcon("openVacancies")}
                </div>
              </th>

              <th
                onClick={() => onSort("urgency")}
                className="py-3.5 px-3 text-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <div className="flex items-center justify-center gap-1.5">
                  <span>Urgency</span>
                  {getSortIcon("urgency")}
                </div>
              </th>

              <th
                onClick={() => onSort("agingDays")}
                className="py-3.5 px-3 text-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <div className="flex items-center justify-center gap-1.5">
                  <span>Aging</span>
                  {getSortIcon("agingDays")}
                </div>
              </th>

              <th
                onClick={() => onSort("rate")}
                className="py-3.5 px-3 text-right cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Salary Rate</span>
                  {getSortIcon("rate")}
                </div>
              </th>

              <th className="py-3.5 pr-4 pl-3 text-right">
                <span>Action</span>
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs text-slate-800 dark:text-slate-200">
            {vacancies.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-400 dark:text-slate-500">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Briefcase className="w-8 h-8 opacity-40 text-slate-400" />
                    <p className="text-sm font-semibold">No active vacancies match your filters</p>
                    <p className="text-xs">Adjust your search query or reset filter controls</p>
                  </div>
                </td>
              </tr>
            ) : (
              vacancies.map((v) => (
                <tr
                  key={v.id}
                  className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition group"
                >
                  {/* Req # */}
                  <td className="py-3 pl-4 pr-3 whitespace-nowrap font-mono text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                    {v.requestNo}
                  </td>

                  {/* Company */}
                  <td className="py-3 px-3 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {v.companyCode}
                      </span>
                      <span className="text-slate-400 text-[11px] truncate max-w-[130px]" title={v.companyName}>
                        • {v.companyName}
                      </span>
                    </div>
                  </td>

                  {/* Position */}
                  <td className="py-3 px-3">
                    <div className="font-semibold text-slate-900 dark:text-slate-100">
                      {v.position}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                      <span>{v.purpose}</span>
                      {v.replacementName && (
                        <span className="text-amber-600 dark:text-amber-400 font-mono">
                          (for {v.replacementName})
                        </span>
                      )}
                      <span>• {v.employmentType}</span>
                    </div>
                  </td>

                  {/* Department */}
                  <td className="py-3 px-3 whitespace-nowrap">
                    <div className="font-medium text-slate-800 dark:text-slate-200">
                      {v.department}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">
                      {v.division}
                    </div>
                  </td>

                  {/* Vacancies count */}
                  <td className="py-3 px-3 text-center whitespace-nowrap">
                    <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-lg text-xs font-mono font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                      {v.openVacancies} / {v.totalNeeded}
                    </span>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {v.hiredCount} hired
                    </div>
                  </td>

                  {/* Urgency */}
                  <td className="py-3 px-3 text-center whitespace-nowrap">
                    {getUrgencyBadge(v.urgency)}
                  </td>

                  {/* Aging */}
                  <td className="py-3 px-3 text-center whitespace-nowrap font-mono text-[11px]">
                    <span
                      className={`font-semibold ${
                        v.agingDays > 60
                          ? "text-rose-600 dark:text-rose-400"
                          : v.agingDays > 30
                          ? "text-amber-600 dark:text-amber-400"
                          : "text-slate-600 dark:text-slate-300"
                      }`}
                    >
                      {v.agingDays}d
                    </span>
                  </td>

                  {/* Rate */}
                  <td className="py-3 px-3 text-right whitespace-nowrap font-mono">
                    <div className="font-semibold text-slate-900 dark:text-slate-100 text-xs">
                      {v.rateFormatted}
                    </div>
                    {v.candidates.length > 0 && (
                      <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-sans">
                        {v.candidates.length} candidates
                      </div>
                    )}
                  </td>

                  {/* Action */}
                  <td className="py-3 pr-4 pl-3 text-right whitespace-nowrap">
                    <button
                      onClick={() => onSelectVacancy(v)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 rounded-lg transition cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Details</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-xs text-slate-600 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <span>Rows per page:</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="px-2 py-1 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
          <span className="text-slate-400">•</span>
          <span>
            Showing {totalItems === 0 ? 0 : (page - 1) * pageSize + 1} -{" "}
            {Math.min(page * pageSize, totalItems)} of {totalItems}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page <= 1}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 disabled:opacity-40 transition cursor-pointer disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-mono text-xs px-2 text-slate-700 dark:text-slate-300">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 disabled:opacity-40 transition cursor-pointer disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

