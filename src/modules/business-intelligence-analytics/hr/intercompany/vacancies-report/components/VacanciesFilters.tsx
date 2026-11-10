"use client";

import React from "react";
import {
  Search,
  RotateCcw,
  RefreshCw,
  Download,
  Building2,
  Calendar,
  Layers,
  Flame,
  Briefcase,
} from "lucide-react";
import { VacanciesFilters, VacancyCompanyOption } from "../types";

interface VacanciesFiltersProps {
  filters: VacanciesFilters;
  setFilters: React.Dispatch<React.SetStateAction<VacanciesFilters>>;
  companies: VacancyCompanyOption[];
  departments: string[];
  purposes: string[];
  employmentTypes: string[];
  onReset: () => void;
  onRefresh: () => void;
  onExport: () => void;
  loading: boolean;
  totalFiltered: number;
}

export const VacanciesFiltersBar: React.FC<VacanciesFiltersProps> = ({
  filters,
  setFilters,
  companies,
  departments,
  purposes,
  employmentTypes,
  onReset,
  onRefresh,
  onExport,
  loading,
  totalFiltered,
}) => {
  const handleFieldChange = <K extends keyof VacanciesFilters>(
    field: K,
    value: VacanciesFilters[K]
  ) => {
    setFilters((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "dateRange") {
        if (value === "custom" && !prev.startDate) {
          const now = new Date();
          const end = now.toISOString().slice(0, 10);
          const past = new Date(now);
          past.setDate(past.getDate() - 30);
          next.startDate = past.toISOString().slice(0, 10);
          next.endDate = end;
        } else if (value !== "custom") {
          next.startDate = "";
          next.endDate = "";
        }
      }
      return next;
    });
  };

  const hasActiveFilters =
    filters.company !== "ALL" ||
    filters.department !== "ALL" ||
    filters.purpose !== "ALL" ||
    filters.employmentType !== "ALL" ||
    filters.urgency !== "ALL" ||
    filters.dateRange !== "all" ||
    Boolean(filters.search.trim());

  return (
    <div className="flex flex-col gap-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs transition-colors">
      {/* Top row: Search input + Actions */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 min-w-[260px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Search open positions, request #, requirements, replacement name..."
            value={filters.search}
            onChange={(e) => handleFieldChange("search", e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/90 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition"
          />
          {filters.search && (
            <button
              onClick={() => handleFieldChange("search", "")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {hasActiveFilters && (
            <button
              onClick={onReset}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 border border-dashed border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset</span>
            </button>
          )}

          <button
            onClick={onRefresh}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/60 transition cursor-pointer disabled:opacity-50"
            title="Reload vacancies data"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-indigo-500" : ""}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={onExport}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </button>

          <span className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 font-mono">
            {totalFiltered} {totalFiltered === 1 ? "vacancy" : "vacancies"}
          </span>
        </div>
      </div>

      {/* Second row: Dropdown filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800/80">
        {/* Operating Entity */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1 uppercase tracking-wider">
            <Building2 className="h-3 w-3 text-slate-400" /> Entity
          </label>
          <select
            value={filters.company}
            onChange={(e) => handleFieldChange("company", e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/90 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition"
          >
            <option value="ALL">All Companies</option>
            {companies.map((c) => (
              <option key={c.companyId} value={c.companyCode}>
                {c.companyName} ({c.companyCode})
              </option>
            ))}
          </select>
        </div>

        {/* Reporting Horizon */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1 uppercase tracking-wider">
            <Calendar className="h-3 w-3 text-slate-400" /> Horizon
          </label>
          <select
            value={filters.dateRange}
            onChange={(e) =>
              handleFieldChange(
                "dateRange",
                e.target.value as VacanciesFilters["dateRange"]
              )
            }
            className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/90 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition"
          >
            <option value="all">All Horizons</option>
            <option value="today">Today</option>
            <option value="week">Past 7 Days</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
            <option value="custom">Custom Date Range...</option>
          </select>
        </div>

        {/* Department */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1 uppercase tracking-wider">
            <Layers className="h-3 w-3 text-slate-400" /> Department
          </label>
          <select
            value={filters.department}
            onChange={(e) => handleFieldChange("department", e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/90 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition"
          >
            <option value="ALL">All Departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        {/* Purpose */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1 uppercase tracking-wider">
            <Briefcase className="h-3 w-3 text-slate-400" /> Purpose
          </label>
          <select
            value={filters.purpose}
            onChange={(e) => handleFieldChange("purpose", e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/90 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition"
          >
            <option value="ALL">All Purposes</option>
            {purposes.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        {/* Urgency */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1 uppercase tracking-wider">
            <Flame className="h-3 w-3 text-slate-400" /> Urgency
          </label>
          <select
            value={filters.urgency}
            onChange={(e) => handleFieldChange("urgency", e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/90 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition"
          >
            <option value="ALL">All Urgencies</option>
            <option value="Critical">Critical (Replacements &gt; 60d)</option>
            <option value="Moderate">Moderate (30d - 60d)</option>
            <option value="Normal">Normal (&lt; 30d)</option>
          </select>
        </div>

        {/* Employment Type */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1 uppercase tracking-wider">
            <Layers className="h-3 w-3 text-slate-400" /> Emp. Type
          </label>
          <select
            value={filters.employmentType}
            onChange={(e) => handleFieldChange("employmentType", e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/90 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition"
          >
            <option value="ALL">All Types</option>
            {employmentTypes.map((et) => (
              <option key={et} value={et}>
                {et}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Custom Date Range Sub-Bar */}
      {filters.dateRange === "custom" && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 rounded-xl animate-in fade-in-50 duration-200">
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-900 dark:text-indigo-200">
            <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span>Custom Horizon Date Range:</span>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-1.5">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                From:
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFieldChange("startDate", e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                To:
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFieldChange("endDate", e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition"
              />
            </div>

            <div className="flex items-center gap-1 ml-auto sm:ml-2">
              <button
                type="button"
                onClick={() => {
                  const now = new Date();
                  const end = now.toISOString().slice(0, 10);
                  const past = new Date(now);
                  past.setDate(past.getDate() - 30);
                  handleFieldChange("startDate", past.toISOString().slice(0, 10));
                  handleFieldChange("endDate", end);
                }}
                className="px-2 py-1 text-xs font-medium text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-md transition cursor-pointer"
              >
                Past 30d
              </button>
              <button
                type="button"
                onClick={() => {
                  const now = new Date();
                  const end = now.toISOString().slice(0, 10);
                  const past = new Date(now);
                  past.setDate(past.getDate() - 90);
                  handleFieldChange("startDate", past.toISOString().slice(0, 10));
                  handleFieldChange("endDate", end);
                }}
                className="px-2 py-1 text-xs font-medium text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-md transition cursor-pointer"
              >
                Past 90d
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

