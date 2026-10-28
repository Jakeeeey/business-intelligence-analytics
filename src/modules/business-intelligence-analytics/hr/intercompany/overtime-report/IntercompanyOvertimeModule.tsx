"use client";

import React, { useState } from "react";
import { useIntercompanyOvertime } from "./hooks/useIntercompanyOvertime";
import { OvertimeKpiCards } from "./components/OvertimeKpiCards";
import { CompanyOvertimeCards } from "./components/CompanyOvertimeCards";
import { CompanyOvertimeTable } from "./components/CompanyOvertimeTable";
import { OvertimeCharts } from "./components/OvertimeCharts";
import { OvertimeFilters } from "./components/OvertimeFilters";
import { EmployeeOvertimeTable } from "./components/EmployeeOvertimeTable";
import { DetailedOvertimeRequestsTable } from "./components/DetailedOvertimeRequestsTable";
import { OvertimeDetailModal } from "./components/OvertimeDetailModal";
import { OvertimeRankingLeaderboard } from "./components/OvertimeRankingLeaderboard";
import {
  exportOvertimeEmployeesToCsv,
  exportDetailedOvertimeToCsv,
  exportCompanyOvertimeToCsv,
} from "./utils/exportCsv";
import { AlertCircle, FileSpreadsheet, Users, Trophy, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function IntercompanyOvertimeModule() {
  const {
    data,
    loading,
    error,
    filters,
    setFilters,
    sortedEmployeeSummaries,
    paginatedEmployeeSummaries,
    filteredOtRecords,
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
  } = useIntercompanyOvertime();

  const [activeTab, setActiveTab] = useState<"rankings" | "company" | "summary" | "detailed">("rankings");

  const handleExportCsv = () => {
    const filenameDate =
      filters.startDate && filters.endDate && filters.startDate !== filters.endDate
        ? `${filters.startDate}_to_${filters.endDate}`
        : filters.startDate || "all";

    if (activeTab === "company") {
      exportCompanyOvertimeToCsv(
        filteredCompanySummaries,
        `intercompany_overtime_companies_${filenameDate}.csv`
      );
    } else if (activeTab === "summary") {
      exportOvertimeEmployeesToCsv(
        sortedEmployeeSummaries,
        `intercompany_overtime_employees_${filenameDate}.csv`
      );
    } else {
      exportDetailedOvertimeToCsv(
        filteredOtRecords,
        `intercompany_overtime_requests_${filenameDate}.csv`
      );
    }
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
      <OvertimeFilters
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

      {/* 2. Top Executive KPI Cards (Total Overtime Hours, Total OT Requests, Approved Overtime, Approval Rate %, etc.) */}
      {filteredKpis && <OvertimeKpiCards kpis={filteredKpis} />}

      {/* 3. Intercompany Entity Cards (Clickable for dynamic filtering) */}
      {data?.companySummaries && data.companySummaries.length > 0 && (
        <CompanyOvertimeCards
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
        <OvertimeCharts
          companySummaries={filteredCompanySummaries}
          dailyTrends={filteredDailyTrends}
          statusDistribution={filteredStatusDistribution}
          topEmployees={filteredTopEmployees}
          onViewEmployee={handleOpenDetail}
          onSelectRankings={() => setActiveTab("rankings")}
        />
      )}

      {/* 5. Directory Tables with Toggle Tabs */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
          <div className="inline-flex items-center p-1 rounded-xl bg-muted/60 border border-border/60">
            <button
              type="button"
              onClick={() => setActiveTab("rankings")}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "rankings"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Trophy className="h-3.5 w-3.5 text-amber-500" />
              Highest Overtime Rankings
              <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-amber-500/15 text-amber-700 dark:text-amber-300 font-mono font-bold">
                Leaderboard
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("company")}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "company"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Building2 className="h-3.5 w-3.5 text-blue-500" />
              Subsidiaries Table
              <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-muted font-mono font-medium">
                {filteredCompanySummaries.length}
              </span>
            </button>
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
              Employee Directory & Totals
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
                {filteredOtRecords.length}
              </span>
            </button>
          </div>

          <div className="text-xs text-muted-foreground">
            {activeTab === "rankings" ? (
              <span>Honor roll of employees ranked by overtime hours and rendering volume</span>
            ) : activeTab === "company" ? (
              <span>Subsidiary overtime metrics: Actual Overtime | Filed Overtime | Actual Approved | Request Count</span>
            ) : activeTab === "summary" ? (
              <span>Aggregated employee overtime hours and request approvals</span>
            ) : (
              <span>Full chronological list of submitted overtime filings</span>
            )}
          </div>
        </div>

        {activeTab === "rankings" ? (
          <OvertimeRankingLeaderboard
            employees={sortedEmployeeSummaries}
            onViewDetail={handleOpenDetail}
          />
        ) : activeTab === "company" ? (
          <CompanyOvertimeTable
            companies={filteredCompanySummaries}
            selectedCompanyIds={filters.companyIds}
            onSelectCompany={handleSelectCompanyCard}
            onClearCompanySelection={() => {
              setFilters((prev) => ({ ...prev, companyIds: [] }));
              setPage(1);
            }}
            loading={loading}
          />
        ) : activeTab === "summary" ? (
          <EmployeeOvertimeTable
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
          <DetailedOvertimeRequestsTable
            overtimeRecords={filteredOtRecords}
            loading={loading}
          />
        )}
      </div>

      {/* 6. Employee Overtime Details Modal */}
      <OvertimeDetailModal
        employee={selectedEmployee}
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
        overtimeRecords={data?.overtimeRecords || []}
      />
    </div>
  );
}
