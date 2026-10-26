"use client";

import React, { useState } from "react";
import {
  AlertCircle,
  Building2,
  Users,
  BarChart3,
  Loader2,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { useIntercompanyAttendance } from "./hooks/useIntercompanyAttendance";
import { AttendanceFilters } from "./components/AttendanceFilters";
import { AttendanceKpiCards } from "./components/AttendanceKpiCards";
import { CompanySummaryCards } from "./components/CompanySummaryCards";
import { AttendanceCharts } from "./components/AttendanceCharts";
import { AttendanceDirectoryTable } from "./components/AttendanceDirectoryTable";
import { exportIntercompanyAttendanceCsv } from "./utils/exportCsv";

export default function IntercompanyAttendanceModule() {
  const {
    filters,
    setFilters,
    loading,
    error,
    reportData,
    filteredRecords,
    paginatedRecords,
    currentKpis,
    page,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    sortField,
    sortOrder,
    handleSort,
    loadData,
    resetFilters,
  } = useIntercompanyAttendance();

  const [activeTab, setActiveTab] = useState("roster");

  const handleExport = () => {
    if (!reportData || filteredRecords.length === 0) return;
    const dateStr = filters.date || new Date().toISOString().slice(0, 10);
    const compTag = filters.companyId !== "ALL" ? `_comp_${filters.companyId}` : "_all_companies";
    exportIntercompanyAttendanceCsv(
      filteredRecords,
      `intercompany_attendance_${dateStr}${compTag}.csv`
    );
  };

  return (
    <div className="space-y-5">
      {/* 1. Header Filter Controls */}
      <AttendanceFilters
        filters={filters}
        onChange={setFilters}
        companies={reportData?.companiesList || []}
        departments={reportData?.departmentsList || []}
        totalRecords={filteredRecords.length}
        loading={loading}
        onRefresh={() => loadData(true)}
        onReset={resetFilters}
        onExport={handleExport}
      />

      {/* 2. Error Display */}
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 3. Initial Loading Skeleton */}
      {loading && !reportData && (
        <Card className="border-border bg-card rounded-2xl">
          <CardContent className="flex items-center justify-center p-12">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
              <p className="text-sm font-medium text-muted-foreground">
                Synchronizing attendance telemetry across corporate subsidiary nodes...
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 4. KPI Summary Cards */}
      {currentKpis && <AttendanceKpiCards kpis={currentKpis} />}

      {/* 5. Company Summary Quick Selector */}
      {reportData && reportData.companySummaries.length > 0 && (
        <CompanySummaryCards
          summaries={reportData.companySummaries}
          selectedCompanyId={filters.companyId}
          onSelectCompany={(companyId) =>
            setFilters((prev) => ({ ...prev, companyId }))
          }
        />
      )}

      {/* 6. Main Content Tabs: Directory vs Analytics */}
      {reportData && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-2">
            <TabsList className="bg-muted/60 p-1 rounded-xl">
              <TabsTrigger
                value="roster"
                className="text-xs font-semibold gap-1.5 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs rounded-lg px-3 py-1.5"
              >
                <Users className="h-3.5 w-3.5" />
                <span>Personnel Attendance Roster ({filteredRecords.length.toLocaleString()})</span>
              </TabsTrigger>

              <TabsTrigger
                value="analytics"
                className="text-xs font-semibold gap-1.5 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs rounded-lg px-3 py-1.5"
              >
                <BarChart3 className="h-3.5 w-3.5" />
                <span>Intercompany Analytics & Telemetry</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Tab 1: Personnel Attendance Directory Table */}
          <TabsContent value="roster" className="space-y-4 m-0 outline-none">
            <AttendanceDirectoryTable
              data={paginatedRecords}
              totalCount={filteredRecords.length}
              currentPage={page}
              pageSize={pageSize}
              totalPages={totalPages}
              sortField={sortField}
              sortOrder={sortOrder}
              onSort={handleSort}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              loading={loading}
            />
          </TabsContent>

          {/* Tab 2: Visual Telemetry Charts */}
          <TabsContent value="analytics" className="space-y-4 m-0 outline-none">
            <AttendanceCharts
              companySummaries={reportData.companySummaries}
              kpis={currentKpis || reportData.kpis}
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
