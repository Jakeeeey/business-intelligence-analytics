"use client";

import React from "react";
import {
  Building2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Download,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { CompanyMatrixRow } from "../types";
import { MatrixSortField, SortOrder } from "../hooks/useHrManagerDashboard";

interface CompanyMatrixTableProps {
  rows: CompanyMatrixRow[];
  sortField: MatrixSortField;
  sortOrder: SortOrder;
  onSort: (field: MatrixSortField) => void;
}

export const CompanyMatrixTable: React.FC<CompanyMatrixTableProps> = ({
  rows,
  sortField,
  sortOrder,
  onSort,
}) => {
  const exportCsv = () => {
    if (!rows.length) return;
    const headers = [
      "Company Code",
      "Company Name",
      "Status",
      "Headcount",
      "Attendance Rate (%)",
      "Punctuality Rate (%)",
      "OT Hours",
      "Turnover Rate (%)",
      "Open Positions",
      "Avg Score (5.0)",
      "Open Concerns",
      "Health Index",
    ];

    const csvRows = rows.map((r) => [
      `"${r.companyCode}"`,
      `"${r.companyName}"`,
      r.status,
      r.headcount,
      r.attendanceRate,
      r.punctualityRate,
      r.overtimeHours,
      r.turnoverRate,
      r.openRequisitions,
      r.avgAppraisalScore,
      r.unresolvedConcerns,
      r.healthIndex,
    ]);

    const csvContent = [headers.join(","), ...csvRows.map((e) => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `intercompany_matrix_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const renderSortIcon = (field: MatrixSortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-60" />;
    }
    return sortOrder === "asc" ? (
      <ArrowUp className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
    );
  };

  const getHealthBadge = (health: CompanyMatrixRow["healthIndex"]) => {
    switch (health) {
      case "Optimal":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            Optimal
          </span>
        );
      case "Moderate":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <AlertTriangle className="w-3 h-3 text-amber-500" />
            Moderate
          </span>
        );
      case "Attention":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            <AlertCircle className="w-3 h-3 text-rose-500" />
            Attention
          </span>
        );
      case "Offline":
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
            Offline
          </span>
        );
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Operating Company Comparative Matrix
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Cross-entity benchmark comparing human capital health indicators side-by-side
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={exportCsv}
          disabled={rows.length === 0}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors shadow-xs disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
        >
          <Download className="w-3.5 h-3.5 text-slate-500" />
          <span>Export Matrix CSV</span>
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50/80 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 text-xs font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th
                onClick={() => onSort("companyName")}
                className="py-3.5 px-4 cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition"
              >
                <div className="flex items-center gap-1.5">
                  <span>Operating Entity</span>
                  {renderSortIcon("companyName")}
                </div>
              </th>
              <th
                onClick={() => onSort("headcount")}
                className="py-3.5 px-4 text-right cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Headcount</span>
                  {renderSortIcon("headcount")}
                </div>
              </th>
              <th
                onClick={() => onSort("attendanceRate")}
                className="py-3.5 px-4 text-right cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Attendance</span>
                  {renderSortIcon("attendanceRate")}
                </div>
              </th>
              <th
                onClick={() => onSort("punctualityRate")}
                className="py-3.5 px-4 text-right cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Punctuality</span>
                  {renderSortIcon("punctualityRate")}
                </div>
              </th>
              <th
                onClick={() => onSort("overtimeHours")}
                className="py-3.5 px-4 text-right cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>OT Hours</span>
                  {renderSortIcon("overtimeHours")}
                </div>
              </th>
              <th
                onClick={() => onSort("turnoverRate")}
                className="py-3.5 px-4 text-right cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Turnover</span>
                  {renderSortIcon("turnoverRate")}
                </div>
              </th>
              <th
                onClick={() => onSort("openRequisitions")}
                className="py-3.5 px-4 text-right cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Open Req</span>
                  {renderSortIcon("openRequisitions")}
                </div>
              </th>
              <th
                onClick={() => onSort("avgAppraisalScore")}
                className="py-3.5 px-4 text-right cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Appraisal Avg</span>
                  {renderSortIcon("avgAppraisalScore")}
                </div>
              </th>
              <th
                onClick={() => onSort("unresolvedConcerns")}
                className="py-3.5 px-4 text-right cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Open Grievances</span>
                  {renderSortIcon("unresolvedConcerns")}
                </div>
              </th>
              <th
                onClick={() => onSort("healthIndex")}
                className="py-3.5 px-4 text-center cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition"
              >
                <div className="flex items-center justify-center gap-1.5">
                  <span>Health Index</span>
                  {renderSortIcon("healthIndex")}
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-8 text-center text-slate-400">
                  No company records match the current filters.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={row.companyId}
                  className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs flex items-center justify-center border border-slate-200 dark:border-slate-700">
                        {row.companyCode}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-slate-100">
                          {row.companyName}
                        </div>
                        <div className="text-xs text-slate-400">
                          Code: {row.companyCode}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-right font-medium text-slate-900 dark:text-slate-100">
                    {row.status === "OFFLINE" && row.headcount === 0 ? "-" : row.headcount.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {row.status === "OFFLINE" || row.attendanceRate === 0 ? (
                      <span className="text-slate-400">-</span>
                    ) : (
                      <span
                        className={`font-semibold ${
                          row.attendanceRate >= 95
                            ? "text-emerald-600 dark:text-emerald-400"
                            : row.attendanceRate >= 90
                            ? "text-slate-700 dark:text-slate-200"
                            : "text-amber-600 dark:text-amber-400"
                        }`}
                      >
                        {row.attendanceRate}%
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {row.status === "OFFLINE" || row.punctualityRate === 0 ? (
                      <span className="text-slate-400">-</span>
                    ) : (
                      <span
                        className={`font-semibold ${
                          row.punctualityRate >= 90
                            ? "text-emerald-600 dark:text-emerald-400"
                            : row.punctualityRate >= 80
                            ? "text-slate-700 dark:text-slate-200"
                            : "text-rose-600 dark:text-rose-400"
                        }`}
                      >
                        {row.punctualityRate}%
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-xs">
                    {row.status === "OFFLINE" ? (
                      <span className="text-slate-400">-</span>
                    ) : (
                      `${row.overtimeHours.toLocaleString()} hrs`
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {row.status === "OFFLINE" ? (
                      <span className="text-slate-400">-</span>
                    ) : (
                      <span
                        className={`font-medium ${
                          row.turnoverRate > 5
                            ? "text-rose-600 dark:text-rose-400 font-semibold"
                            : "text-slate-600 dark:text-slate-400"
                        }`}
                      >
                        {row.turnoverRate}%
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {row.status === "OFFLINE" ? (
                      <span className="text-slate-400">-</span>
                    ) : (
                      <span
                        className={`font-semibold px-2 py-0.5 rounded-md text-xs ${
                          row.openRequisitions > 0
                            ? "bg-cyan-50 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800"
                            : "text-slate-400"
                        }`}
                      >
                        {row.openRequisitions}
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-medium">
                    {row.avgAppraisalScore > 0 ? (
                      <span>{row.avgAppraisalScore.toFixed(1)} / 5.0</span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {row.status === "OFFLINE" ? (
                      <span className="text-slate-400">-</span>
                    ) : (
                      <span
                        className={`font-semibold px-2 py-0.5 rounded-md text-xs ${
                          row.unresolvedConcerns > 0
                            ? "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                            : "text-slate-400"
                        }`}
                      >
                        {row.unresolvedConcerns}
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    {getHealthBadge(row.healthIndex)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

