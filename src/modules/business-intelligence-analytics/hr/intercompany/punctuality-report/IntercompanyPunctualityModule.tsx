"use client";

import React from "react";
import { useIntercompanyPunctuality } from "./hooks/useIntercompanyPunctuality";
import { PunctualityKpiCards } from "./components/PunctualityKpiCards";
import { CompanyPunctualityCards } from "./components/CompanyPunctualityCards";
import { PunctualityCharts } from "./components/PunctualityCharts";
import { PunctualityFilters } from "./components/PunctualityFilters";
import { PunctualityDirectoryTable } from "./components/PunctualityDirectoryTable";
import { PunctualityDetailModal } from "./components/PunctualityDetailModal";
import { exportPunctualityToCsv } from "./utils/exportCsv";
import { AlertCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

export function IntercompanyPunctualityModule() {
  const {
    data,
    loading,
    error,
    filters,
    setFilters,
    filteredRecords,
    paginatedRecords,
    totalRecords,
    page,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    sortField,
    sortOrder,
    handleSort,
    selectedRecord,
    detailModalOpen,
    setDetailModalOpen,
    handleOpenDetail,
    handleResetFilters,
    handleRefresh,
  } = useIntercompanyPunctuality();

  const handleExportCsv = () => {
    const filenameDate =
      filters.startDate && filters.endDate && filters.startDate !== filters.endDate
        ? `${filters.startDate}_to_${filters.endDate}`
        : filters.date || "all";
    exportPunctualityToCsv(
      filteredRecords,
      `intercompany_punctuality_${filenameDate}.csv`
    );
  };

  const handleSelectCompanyCard = (companyIdStr: string) => {
    setFilters((prev) => {
      const current = prev.companyIds || [];
      const exists = current.includes(companyIdStr);
      const updated = exists
        ? current.filter((id) => id !== companyIdStr)
        : [...current, companyIdStr];
      return {
        ...prev,
        companyIds: updated,
      };
    });
    setPage(1);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Error State Banner */}
      {error && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-xs text-destructive flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="h-7 text-xs border-destructive/30"
          >
            Retry
          </Button>
        </div>
      )}

      {/* 1. Global Filter Controls */}
      <PunctualityFilters
        filters={filters}
        onChange={setFilters}
        companies={data?.companiesList || []}
        departments={data?.departmentsList || []}
        totalRecords={totalRecords}
        loading={loading}
        onRefresh={handleRefresh}
        onReset={handleResetFilters}
        onExport={handleExportCsv}
      />

      {/* 2. Top Executive KPI Cards */}
      {data?.kpis && <PunctualityKpiCards kpis={data.kpis} />}

      {/* 3. Intercompany Entity Cards */}
      {data?.companySummaries && data.companySummaries.length > 0 && (
        <CompanyPunctualityCards
          companies={data.companySummaries}
          selectedCompanyIds={filters.companyIds}
          onSelectCompany={handleSelectCompanyCard}
        />
      )}

      {/* 4. Analytics Visualizations & Leaderboards */}
      {data && (
        <PunctualityCharts
          companySummaries={data.companySummaries || []}
          distribution={data.distribution || []}
          dailyTrends={data.dailyTrends || []}
          topPunctual={data.topPunctual || []}
          frequentLate={data.frequentLate || []}
        />
      )}

      {/* 5. Detailed Punctuality Log Directory Table */}
      <PunctualityDirectoryTable
        records={paginatedRecords}
        totalRecords={totalRecords}
        page={page}
        pageSize={pageSize}
        totalPages={totalPages}
        sortField={sortField}
        sortOrder={sortOrder}
        onSort={handleSort}
        onPageChange={setPage}
        onPageSizeChange={(sz) => {
          setPageSize(sz);
          setPage(1);
        }}
        onViewDetail={handleOpenDetail}
        loading={loading}
      />

      {/* 6. Detail View Modal */}
      <PunctualityDetailModal
        record={selectedRecord}
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
      />

      {/* Loading Overlay Hint if background syncing */}
      {loading && !data && (
        <div className="fixed inset-0 bg-background/60 backdrop-blur-xs flex items-center justify-center z-50">
          <div className="flex flex-col items-center gap-3 p-6 rounded-2xl border border-border bg-card shadow-2xl">
            <Clock className="h-8 w-8 text-cyan-500 animate-spin" />
            <p className="text-sm font-semibold text-foreground">
              Synthesizing intercompany punctuality data...
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
export default IntercompanyPunctualityModule;
