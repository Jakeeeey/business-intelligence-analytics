"use client";

import React, { useState } from "react";
import { useIntercompanyVacancies } from "./hooks/useIntercompanyVacancies";
import { VacanciesFiltersBar } from "./components/VacanciesFilters";
import { VacanciesKpiCards } from "./components/VacanciesKpiCards";
import { CompanyVacanciesCards } from "./components/CompanyVacanciesCards";
import { VacanciesCharts } from "./components/VacanciesCharts";
import { VacanciesTable } from "./components/VacanciesTable";
import { VacancyDetailModal } from "./components/VacancyDetailModal";
import { IntercompanyVacancyRecord } from "./types";
import { AlertCircle, Briefcase } from "lucide-react";

export function VacanciesReportModule() {
  const {
    data,
    loading,
    error,
    filters,
    setFilters,
    resetFilters,
    sortField,
    sortOrder,
    handleSort,
    page,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    totalItems,
    paginatedVacancies,
    dynamicKpis,
    handleExport,
    loadData,
  } = useIntercompanyVacancies();

  const [selectedRecord, setSelectedRecord] =
    useState<IntercompanyVacancyRecord | null>(null);
  const [modalOpen, setModalOpen] = useState<boolean>(false);

  const handleOpenDetail = (record: IntercompanyVacancyRecord) => {
    setSelectedRecord(record);
    setModalOpen(true);
  };

  const handleSelectCompanyCard = (companyCode: string) => {
    setFilters((prev) => ({
      ...prev,
      company: prev.company === companyCode ? "ALL" : companyCode,
    }));
    setPage(1);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Error State Banner */}
      {error && (
        <div className="rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 p-4 text-xs text-rose-800 dark:text-rose-300 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => loadData(true)}
            className="px-3 py-1 rounded-lg bg-rose-100 hover:bg-rose-200 dark:bg-rose-900/80 dark:hover:bg-rose-800 text-rose-900 dark:text-rose-100 font-medium transition cursor-pointer text-xs"
          >
            Retry Sync
          </button>
        </div>
      )}

      {/* Module Title Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Intercompany Vacancies Report
              </h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                Live Openings
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Consolidated staffing requisitions, unfilled vacancies, aging SLA &amp; candidate pipelines across entities
            </p>
          </div>
        </div>

        {data?.lastUpdated && (
          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono bg-slate-50 dark:bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
            Synced: {data.lastUpdated}
          </span>
        )}
      </div>

      {/* 1. Global Filter Controls */}
      <VacanciesFiltersBar
        filters={filters}
        setFilters={setFilters}
        companies={data?.companies || []}
        departments={data?.departments || []}
        purposes={data?.purposes || []}
        employmentTypes={data?.employmentTypes || []}
        onReset={resetFilters}
        onRefresh={() => loadData(true)}
        onExport={handleExport}
        loading={loading}
        totalFiltered={totalItems}
      />

      {loading && !data ? (
        /* Full Skeleton Loading */
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-28 bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl animate-pulse"
              />
            ))}
          </div>
          <div className="h-28 bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl animate-pulse" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-64 bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl animate-pulse"
              />
            ))}
          </div>
          <div className="h-80 bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl animate-pulse" />
        </div>
      ) : (
        <>
          {/* 2. Top Executive KPI Cards */}
          <VacanciesKpiCards kpis={dynamicKpis} />

          {/* 3. Operating Entities Cards */}
          {data?.companySummaries && data.companySummaries.length > 0 && (
            <CompanyVacanciesCards
              summaries={data.companySummaries}
              selectedCompany={filters.company}
              onSelectCompany={handleSelectCompanyCard}
            />
          )}

          {/* 4. Analytics Visualizations */}
          {data && (
            <VacanciesCharts
              departmentSummaries={data.departmentSummaries}
              urgencyDistribution={data.urgencyDistribution}
              purposeDistribution={data.purposeDistribution}
            />
          )}

          {/* 5. Detailed Requisitions Directory Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 tracking-tight">
                  Detailed Requisitions Directory
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Audit log of open staffing authorizations, candidate pipelines &amp; SLA aging
                </p>
              </div>
            </div>

            <VacanciesTable
              vacancies={paginatedVacancies}
              totalItems={totalItems}
              page={page}
              pageSize={pageSize}
              totalPages={totalPages}
              sortField={sortField}
              sortOrder={sortOrder}
              onSort={handleSort}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              onSelectVacancy={handleOpenDetail}
            />
          </div>

          {/* 6. Requisition Detail Modal */}
          <VacancyDetailModal
            record={selectedRecord}
            open={modalOpen}
            onClose={() => setModalOpen(false)}
          />
        </>
      )}
    </div>
  );
}

export default VacanciesReportModule;

