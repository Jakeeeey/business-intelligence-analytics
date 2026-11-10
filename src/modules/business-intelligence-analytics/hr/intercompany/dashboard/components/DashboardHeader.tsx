"use client";

import React from "react";
import {
  RefreshCw,
  Building2,
  Calendar,
  Search,
  Sparkles,
} from "lucide-react";
import { DashboardFilters } from "../types";

interface DashboardHeaderProps {
  filters: DashboardFilters;
  onFilterChange: <K extends keyof DashboardFilters>(
    field: K,
    value: DashboardFilters[K]
  ) => void;
  onRefresh: (force?: boolean) => void;
  loading: boolean;
  lastUpdated?: string;
  companiesList: { companyId: number; companyName: string; companyCode: string }[];
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  filters,
  onFilterChange,
  onRefresh,
  loading,
  lastUpdated,
  companiesList,
}) => {
  return (
    <div className="flex flex-col gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        {/* Title & Badge */}
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  Intercompany HR Manager Dashboard
                </h1>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  Executive View
                </span>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Consolidated real-time analytics across all 8 HR report domains &amp; operating entities
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons & Last Updated */}
        <div className="flex flex-wrap items-center gap-3">
          {lastUpdated && (
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono bg-slate-50 dark:bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
              Synced: {lastUpdated}
            </span>
          )}

          <button
            onClick={() => onRefresh(true)}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors shadow-sm disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            title="Force reload all intercompany data"
          >
            <RefreshCw
              className={`w-4 h-4 text-slate-500 dark:text-slate-400 ${
                loading ? "animate-spin text-indigo-600 dark:text-indigo-400" : ""
              }`}
            />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filter Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
        {/* Operating Entity Selector */}
        <div className="lg:col-span-4 relative">
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
            Operating Entity
          </label>
          <div className="relative">
            <Building2 className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={filters.company}
              onChange={(e) => onFilterChange("company", e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-sm bg-slate-50 dark:bg-slate-800/90 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition"
            >
              <option value="ALL">All Operating Companies (Consolidated)</option>
              {companiesList.map((comp) => (
                <option key={comp.companyId} value={comp.companyCode}>
                  {comp.companyName} ({comp.companyCode})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Date Range / Horizon */}
        <div className="lg:col-span-3">
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
            Reporting Horizon
          </label>
          <div className="relative">
            <Calendar className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={filters.dateRange}
              onChange={(e) =>
                onFilterChange(
                  "dateRange",
                  e.target.value as DashboardFilters["dateRange"]
                )
              }
              className="w-full pl-9 pr-8 py-2 text-sm bg-slate-50 dark:bg-slate-800/90 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition"
            >
              <option value="all">All Available Records</option>
              <option value="today">Today</option>
              <option value="week">Past 7 Days</option>
              <option value="month">Current Month (MTD)</option>
              <option value="quarter">Current Quarter (QTD)</option>
              <option value="year">Current Year (YTD)</option>
              <option value="custom">Custom Date Range...</option>
            </select>
          </div>
        </div>

        {/* Quick Filter Search */}
        <div className="lg:col-span-5">
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
            Quick Filter Search
          </label>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Filter companies, tickets, positions, or keywords..."
              value={filters.search || ""}
              onChange={(e) => onFilterChange("search", e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/90 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition"
            />
            {filters.search && (
              <button
                onClick={() => onFilterChange("search", "")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Custom Date Range Picker Row */}
      {filters.dateRange === "custom" && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 rounded-xl transition-all animate-in fade-in-50 duration-200">
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-900 dark:text-indigo-200">
            <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span>Select Custom Horizon:</span>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-1.5">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                From:
              </label>
              <input
                type="date"
                value={filters.startDate || ""}
                onChange={(e) => onFilterChange("startDate", e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition shadow-2xs"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                To:
              </label>
              <input
                type="date"
                value={filters.endDate || ""}
                onChange={(e) => onFilterChange("endDate", e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition shadow-2xs"
              />
            </div>

            {/* Quick Horizon Presets */}
            <div className="flex items-center gap-1 ml-auto sm:ml-2">
              <button
                type="button"
                onClick={() => {
                  const now = new Date();
                  const end = now.toISOString().slice(0, 10);
                  const past = new Date(now);
                  past.setDate(past.getDate() - 14);
                  onFilterChange("startDate", past.toISOString().slice(0, 10));
                  onFilterChange("endDate", end);
                }}
                className="px-2 py-1 text-xs font-medium text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-md transition cursor-pointer"
              >
                Past 14d
              </button>
              <button
                type="button"
                onClick={() => {
                  const now = new Date();
                  const end = now.toISOString().slice(0, 10);
                  const past = new Date(now);
                  past.setDate(past.getDate() - 30);
                  onFilterChange("startDate", past.toISOString().slice(0, 10));
                  onFilterChange("endDate", end);
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
                  past.setDate(past.getDate() - 60);
                  onFilterChange("startDate", past.toISOString().slice(0, 10));
                  onFilterChange("endDate", end);
                }}
                className="px-2 py-1 text-xs font-medium text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-md transition cursor-pointer"
              >
                Past 60d
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

