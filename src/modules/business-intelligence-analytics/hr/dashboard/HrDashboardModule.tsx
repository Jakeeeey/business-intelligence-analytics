"use client";

import React, { useState } from "react";
import {
  AlertCircle,
  BarChart3,
  Users,
  Loader2,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { useHrDashboard } from "./hooks/useHrDashboard";
import { HrDashboardHeader } from "./components/HrDashboardHeader";
import { HrKpiCards } from "./components/HrKpiCards";
import { HrCharts } from "./components/HrCharts";
import { EmployeeDirectoryTable } from "./components/EmployeeDirectoryTable";
import { exportEmployeesCsv } from "./utils/exportCsv";

export default function HrDashboardModule() {
  const {
    filters,
    setFilters,
    loading,
    error,
    dashboardData,
    filteredEmployees,
    paginatedEmployees,
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
  } = useHrDashboard();

  const [activeTab, setActiveTab] = useState("directory");

  const handleExport = () => {
    if (!dashboardData) return;
    exportEmployeesCsv(
      filteredEmployees,
      `employee_directory_${new Date().toISOString().slice(0, 10)}.csv`
    );
  };

  return (
    <div className="space-y-5">
      {/* Header & Filter Controls */}
      <HrDashboardHeader
        filters={filters}
        onChange={setFilters}
        departments={dashboardData?.departments || []}
        statuses={dashboardData?.statuses || []}
        totalEmployees={dashboardData?.kpis.totalEmployees || 0}
        onReset={resetFilters}
        onReload={loadData}
        onExport={handleExport}
        loading={loading}
      />

      {/* Error Alert */}
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading Skeleton Indicator */}
      {loading && !dashboardData && (
        <Card className="border-border bg-card rounded-2xl">
          <CardContent className="flex items-center justify-center p-12">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
              <p className="text-sm font-medium text-muted-foreground">
                Connecting to corporate employee database...
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPI Cards */}
      {dashboardData && <HrKpiCards kpis={dashboardData.kpis} />}

      {/* Main Tabs Navigation */}
      {dashboardData && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-2">
            <TabsList className="bg-muted/60 p-1 rounded-xl">
              <TabsTrigger
                value="directory"
                className="text-xs font-semibold gap-1.5 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs rounded-lg px-3 py-1.5"
              >
                <Users className="h-3.5 w-3.5" />
                <span>Personnel Roster ({filteredEmployees.length.toLocaleString()})</span>
              </TabsTrigger>

              <TabsTrigger
                value="analytics"
                className="text-xs font-semibold gap-1.5 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs rounded-lg px-3 py-1.5"
              >
                <BarChart3 className="h-3.5 w-3.5" />
                <span>Staffing & Demographics Analytics</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Tab 1: Employee Directory Table */}
          <TabsContent value="directory" className="space-y-4 m-0 outline-none">
            <EmployeeDirectoryTable
              data={paginatedEmployees}
              totalCount={filteredEmployees.length}
              currentPage={page}
              pageSize={pageSize}
              totalPages={totalPages}
              sortField={sortField}
              sortOrder={sortOrder}
              searchQuery={filters.search}
              statusFilter={filters.status}
              statuses={dashboardData.statuses}
              onSort={handleSort}
              onSearchChange={(search) =>
                setFilters((prev) => ({ ...prev, search }))
              }
              onStatusFilterChange={(status) =>
                setFilters((prev) => ({ ...prev, status }))
              }
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              loading={loading}
            />
          </TabsContent>

          {/* Tab 2: Staffing & Demographics Charts */}
          <TabsContent value="analytics" className="space-y-4 m-0 outline-none">
            <HrCharts
              departmentStats={dashboardData.departmentStats}
              genderDistribution={dashboardData.genderDistribution}
              tenureDistribution={dashboardData.tenureDistribution}
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
