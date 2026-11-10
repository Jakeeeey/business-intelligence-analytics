"use client";

import React from "react";
import { useIntercompanyConcerns } from "./hooks/useIntercompanyConcerns";
import { ConcernsFilters } from "./components/ConcernsFilters";
import { ConcernsKpiCards } from "./components/ConcernsKpiCards";
import { CompanyConcernsCards } from "./components/CompanyConcernsCards";
import { ConcernsCharts } from "./components/ConcernsCharts";
import { ConcernsTable } from "./components/ConcernsTable";
import { ConcernDetailModal } from "./components/ConcernDetailModal";
import { exportConcernsToCsv } from "./utils/exportCsv";
import { AlertCircle, MessageSquareWarning } from "lucide-react";
import { Button } from "@/components/ui/button";

export function IntercompanyConcernsModule() {
  const {
    data,
    loading,
    error,
    filters,
    setFilters,
    filteredRecords,
    paginatedRecords,
    totalRecords,
    filteredKpis,
    filteredCompanySummaries,
    filteredDepartmentSummaries,
    filteredStatusDistribution,
    filteredCategoryDistribution,
    filteredTrends,
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
  } = useIntercompanyConcerns();

  const handleExportCsv = () => {
    const todayStr = new Date().toISOString().slice(0, 10);
    exportConcernsToCsv(
      filteredRecords,
      `intercompany_employee_concerns_${todayStr}.csv`
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
      <ConcernsFilters
        filters={filters}
        onChange={(updater) => {
          setFilters(updater);
          setPage(1);
        }}
        companies={data?.companiesList || []}
        departments={data?.departmentsList || []}
        statuses={data?.statusesList || []}
        categories={data?.categoriesList || []}
        totalRecords={totalRecords}
        loading={loading}
        onRefresh={handleRefresh}
        onReset={handleResetFilters}
        onExport={handleExportCsv}
      />

      {/* 2. Top Executive KPI Cards */}
      {filteredKpis && <ConcernsKpiCards kpis={filteredKpis} />}

      {/* 3. Intercompany Entity Cards */}
      {data?.companySummaries && data.companySummaries.length > 0 && (
        <CompanyConcernsCards
          companies={data.companySummaries}
          selectedCompanyIds={filters.companyIds}
          onSelectCompany={handleSelectCompanyCard}
          onClearCompanySelection={() => {
            setFilters((prev) => ({ ...prev, companyIds: [] }));
            setPage(1);
          }}
        />
      )}

      {/* 4. Analytics Visualizations */}
      {data && (
        <ConcernsCharts
          companySummaries={filteredCompanySummaries}
          departmentSummaries={filteredDepartmentSummaries}
          statusDistribution={filteredStatusDistribution}
          categoryDistribution={filteredCategoryDistribution}
          trends={filteredTrends}
        />
      )}

      {/* 5. Detailed Employee Concerns Directory Table */}
      <ConcernsTable
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

      {/* 6. Concern Detail Review Modal */}
      <ConcernDetailModal
        record={selectedRecord}
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
      />

      {/* Loading Overlay Hint if initial load */}
      {loading && !data && (
        <div className="fixed inset-0 bg-background/60 backdrop-blur-xs flex items-center justify-center z-50">
          <div className="flex flex-col items-center gap-3 p-6 rounded-2xl border border-border bg-card shadow-2xl">
            <MessageSquareWarning className="h-8 w-8 text-amber-500 animate-pulse" />
            <p className="text-sm font-semibold text-foreground">
              Synthesizing intercompany employee concerns...
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default IntercompanyConcernsModule;

