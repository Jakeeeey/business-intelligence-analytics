"use client";

import React from "react";
import { useIntercompanyEmployeeMasterlist } from "./hooks/useIntercompanyEmployeeMasterlist";
import { EmployeeMasterlistFilters } from "./components/EmployeeMasterlistFilters";
import { EmployeeMasterlistKpiCards } from "./components/EmployeeMasterlistKpiCards";
import { CompanyEmployeeCards } from "./components/CompanyEmployeeCards";
import { EmployeeMasterlistCharts } from "./components/EmployeeMasterlistCharts";
import { EmployeeMasterlistTable } from "./components/EmployeeMasterlistTable";
import { EmployeeDetailModal } from "./components/EmployeeDetailModal";
import { exportEmployeeMasterlistToCsv } from "./utils/exportCsv";
import { AlertCircle, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

export function IntercompanyEmployeeMasterlistModule() {
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
    filteredGenderDistribution,
    filteredStatusDistribution,
    filteredTenureDistribution,
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
  } = useIntercompanyEmployeeMasterlist();

  const handleExportCsv = () => {
    const todayStr = new Date().toISOString().slice(0, 10);
    exportEmployeeMasterlistToCsv(
      filteredRecords,
      `intercompany_employee_masterlist_${todayStr}.csv`
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
      <EmployeeMasterlistFilters
        filters={filters}
        onChange={(updater) => {
          setFilters(updater);
          setPage(1);
        }}
        companies={data?.companiesList || []}
        departments={data?.departmentsList || []}
        statuses={data?.statusesList || []}
        totalRecords={totalRecords}
        loading={loading}
        onRefresh={handleRefresh}
        onReset={handleResetFilters}
        onExport={handleExportCsv}
      />

      {/* 2. Top Executive KPI Cards */}
      {filteredKpis && <EmployeeMasterlistKpiCards kpis={filteredKpis} />}

      {/* 3. Intercompany Entity Cards */}
      {data?.companySummaries && data.companySummaries.length > 0 && (
        <CompanyEmployeeCards
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
        <EmployeeMasterlistCharts
          companySummaries={filteredCompanySummaries}
          departmentSummaries={filteredDepartmentSummaries}
          genderDistribution={filteredGenderDistribution}
          statusDistribution={filteredStatusDistribution}
          tenureDistribution={filteredTenureDistribution}
        />
      )}

      {/* 5. Detailed Employee Masterlist Directory Table */}
      <EmployeeMasterlistTable
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

      {/* 6. Employee Detail Modal */}
      <EmployeeDetailModal
        record={selectedRecord}
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
      />

      {/* Loading Overlay Hint if initial load */}
      {loading && !data && (
        <div className="fixed inset-0 bg-background/60 backdrop-blur-xs flex items-center justify-center z-50">
          <div className="flex flex-col items-center gap-3 p-6 rounded-2xl border border-border bg-card shadow-2xl">
            <Users className="h-8 w-8 text-cyan-500 animate-pulse" />
            <p className="text-sm font-semibold text-foreground">
              Synthesizing intercompany employee masterlist...
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default IntercompanyEmployeeMasterlistModule;

