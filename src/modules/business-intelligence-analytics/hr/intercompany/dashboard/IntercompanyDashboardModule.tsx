"use client";

import React from "react";
import { AlertCircle, LayoutDashboard } from "lucide-react";
import { useHrManagerDashboard } from "./hooks/useHrManagerDashboard";
import { DashboardHeader } from "./components/DashboardHeader";
import { PillarKpiCards } from "./components/PillarKpiCards";
import { ReportDomainsOverview } from "./components/ReportDomainsOverview";
import { CompanyMatrixTable } from "./components/CompanyMatrixTable";
import { ActionCenterQueue } from "./components/ActionCenterQueue";
import { DashboardCharts } from "./components/DashboardCharts";

export function IntercompanyDashboardModule() {
  const {
    data,
    rawData,
    loading,
    error,
    refresh,
    filters,
    setFilters,
    actionCategoryTab,
    setActionCategoryTab,
    matrixSortField,
    matrixSortOrder,
    handleMatrixSort,
    filteredCompanyMatrix,
    filteredActionItems,
  } = useHrManagerDashboard();

  const handleFilterChange = (field: string, value: unknown) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Error Banner */}
      {error && (
        <div className="rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 p-4 text-xs text-rose-800 dark:text-rose-300 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => refresh(true)}
            className="px-3 py-1 rounded-lg bg-rose-100 hover:bg-rose-200 dark:bg-rose-900/80 dark:hover:bg-rose-800 text-rose-900 dark:text-rose-100 font-medium transition cursor-pointer text-xs"
          >
            Retry Sync
          </button>
        </div>
      )}

      {/* Header with Filters */}
      <DashboardHeader
        filters={filters}
        onFilterChange={handleFilterChange}
        onRefresh={refresh}
        loading={loading}
        lastUpdated={data?.lastUpdated}
        companiesList={rawData?.companiesList || data?.companiesList || []}
      />

      {loading && !data ? (
        /* Full Skeleton Loading */
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div
                key={i}
                className="h-32 bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl animate-pulse"
              />
            ))}
          </div>
          <div className="h-64 bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl animate-pulse" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-80 bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl animate-pulse" />
            <div className="h-80 bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl animate-pulse" />
          </div>
        </div>
      ) : data ? (
        <>
          {/* 1. Executive Pillar KPI Cards (8 Pillars) */}
          <PillarKpiCards data={data} />

          {/* 2. Direct Report Launch Directory (All 8 Intercompany Modules) */}
          <ReportDomainsOverview data={data} />

          {/* 3. Deep-Dive Analytics & Visual Intelligence */}
          <DashboardCharts
            talentFlowTrends={data.talentFlowTrends}
            attendanceTrends={data.attendanceTrends}
            companyDistribution={data.companyDistribution}
            concernsDistribution={data.concernsDistribution}
          />

          {/* 4. Cross-Entity Comparative Matrix */}
          <CompanyMatrixTable
            rows={filteredCompanyMatrix}
            sortField={matrixSortField}
            sortOrder={matrixSortOrder}
            onSort={handleMatrixSort}
          />

          {/* 5. HR Action Center & Escalation Queue */}
          <ActionCenterQueue
            items={filteredActionItems}
            activeCategory={actionCategoryTab}
            onSelectCategory={setActionCategoryTab}
          />
        </>
      ) : (
        <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
          <LayoutDashboard className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            No Dashboard Data Available
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            Unable to fetch aggregated statistics across the operating entities. Please check the network or retry.
          </p>
          <button
            onClick={() => refresh(true)}
            className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer"
          >
            Load Dashboard
          </button>
        </div>
      )}
    </div>
  );
}
