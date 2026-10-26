"use client";

import React, { useState } from "react";
import { useIntercompanyLeave } from "./hooks/useIntercompanyLeave";
import { LeaveKpiCards } from "./components/LeaveKpiCards";
import { CompanyLeaveCards } from "./components/CompanyLeaveCards";
import { LeaveCharts } from "./components/LeaveCharts";
import { LeaveFilters } from "./components/LeaveFilters";
import { EmployeeLeaveTable } from "./components/EmployeeLeaveTable";
import { DetailedRequestsTable } from "./components/DetailedRequestsTable";
import { LeaveDetailModal } from "./components/LeaveDetailModal";
import { exportLeaveOtToCsv } from "./utils/exportCsv";
import { AlertCircle, FileSpreadsheet, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

export function IntercompanyLeaveModule() {
  const {
    data,
    loading,
    error,
    filters,
    setFilters,
    sortedEmployeeSummaries,
    paginatedEmployeeSummaries,
    filteredOtRecords,
    filteredLeaveRecords,
    filteredKpis,
    filteredCompanySummaries,
    filteredStatusDistribution,
    filteredDailyTrends,
    filteredTopEmployees,
    totalRecords,
    page,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    sortField,
    sortOrder,
    handleSort,
    selectedEmployee,
    detailModalOpen,
    setDetailModalOpen,
    handleOpenDetail,
    handleResetFilters,
    handleRefresh,
  } = useIntercompanyLeave();

  const [activeTab, setActiveTab] = useState<"summary" | "detailed">("summary");

  const handleExportCsv = () => {
    const filenameDate =
      filters.startDate && filters.endDate && filters.startDate !== filters.endDate
        ? `${filters.startDate}_to_${filters.endDate}`
        : filters.startDate || "all";
    exportLeaveOtToCsv(
      sortedEmployeeSummaries,
      `intercompany_leave_overtime_${filenameDate}.csv`
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
      {/* Error Banner */}
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
      <LeaveFilters
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

      {/* 2. Top Executive KPI Cards (Total Overtime, OT Requests, Approved OT, Leave Days, etc.) */}
      {filteredKpis && <LeaveKpiCards kpis={filteredKpis} />}

      {/* 3. Intercompany Entity Cards (Clickable for dynamic filtering) */}
      {data?.companySummaries && data.companySummaries.length > 0 && (
        <CompanyLeaveCards
          companies={data.companySummaries}
          selectedCompanyIds={filters.companyIds}
          onSelectCompany={handleSelectCompanyCard}
          onClearCompanySelection={() => {
            setFilters((prev) => ({ ...prev, companyIds: [] }));
            setPage(1);
          }}
        />
      )}

      {/* 4. Analytics Visualizations & Charts */}
      {data && (
        <LeaveCharts
          companySummaries={filteredCompanySummaries}
          dailyTrends={filteredDailyTrends}
          statusDistribution={filteredStatusDistribution}
          topEmployees={filteredTopEmployees}
        />
      )}

      {/* 5. Directory Tables with Toggle Tabs */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
          <div className="inline-flex items-center p-1 rounded-xl bg-muted/60 border border-border/60">
            <button
              type="button"
              onClick={() => setActiveTab("summary")}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "summary"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Users className="h-3.5 w-3.5 text-indigo-500" />
              Employee Directory & Overtime Totals
              <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-muted font-mono font-medium">
                {totalRecords}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("detailed")}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "detailed"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-purple-500" />
              Individual Filings Log
              <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-muted font-mono font-medium">
                {filteredOtRecords.length + filteredLeaveRecords.length}
              </span>
            </button>
          </div>

          <div className="text-xs text-muted-foreground">
            {activeTab === "summary" ? (
              <span>Aggregated employee overtime hours and request approvals</span>
            ) : (
              <span>Full chronological list of submitted overtime and leave filings</span>
            )}
          </div>
        </div>

        {activeTab === "summary" ? (
          <EmployeeLeaveTable
            records={paginatedEmployeeSummaries}
            totalRecords={totalRecords}
            page={page}
            pageSize={pageSize}
            totalPages={totalPages}
            sortField={sortField}
            sortOrder={sortOrder}
            onSort={handleSort}
            onPageChange={setPage}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setPage(1);
            }}
            onViewDetail={handleOpenDetail}
            loading={loading}
          />
        ) : (
          <DetailedRequestsTable
            overtimeRecords={filteredOtRecords}
            leaveRecords={filteredLeaveRecords}
            typeFilter={filters.typeFilter}
            loading={loading}
          />
        )}
      </div>

      {/* 6. Employee Details Modal */}
      <LeaveDetailModal
        employee={selectedEmployee}
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
        overtimeRecords={data?.overtimeRecords || []}
        leaveRecords={data?.leaveRecords || []}
      />
    </div>
  );
}
