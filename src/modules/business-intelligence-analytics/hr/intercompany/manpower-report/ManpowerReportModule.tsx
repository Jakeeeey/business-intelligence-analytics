"use client";

import React, { useState } from "react";
import { useIntercompanyManpower } from "./hooks/useIntercompanyManpower";
import { ManpowerFiltersBar } from "./components/ManpowerFilters";
import { ManpowerKpiCards } from "./components/ManpowerKpiCards";
import { CompanyManpowerCards } from "./components/CompanyManpowerCards";
import { ManpowerCharts } from "./components/ManpowerCharts";
import { ManpowerTable } from "./components/ManpowerTable";
import { ManpowerDetailModal } from "./components/ManpowerDetailModal";
import { IntercompanyManpowerRecord } from "./types";
import { AlertCircle, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ManpowerReportModule() {
  const {
    data,
    loading,
    error,
    filters,
    setFilters,
    paginatedRecords,
    dynamicKpis,
    page,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    totalItems,
    sortField,
    sortOrder,
    handleSort,
    resetFilters,
    handleExport,
    loadData,
  } = useIntercompanyManpower();

  const [selectedRecord, setSelectedRecord] = useState<IntercompanyManpowerRecord | null>(null);
  const [modalOpen, setModalOpen] = useState<boolean>(false);

  const handleOpenDetail = (record: IntercompanyManpowerRecord) => {
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
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-xs text-destructive flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadData(true)}
            className="h-7 text-xs border-destructive/30"
          >
            Retry
          </Button>
        </div>
      )}

      {/* 1. Global Filter Controls */}
      <ManpowerFiltersBar
        filters={filters}
        setFilters={setFilters}
        companies={data?.companies || []}
        departments={data?.departments || []}
        divisions={data?.divisions || []}
        purposes={data?.purposes || []}
        employmentTypes={data?.employmentTypes || []}
        statuses={data?.statuses || []}
        onReset={resetFilters}
        onRefresh={() => loadData(true)}
        onExport={handleExport}
        loading={loading}
        totalFiltered={totalItems}
      />

      {/* 2. Top Executive KPI Cards */}
      <ManpowerKpiCards kpis={dynamicKpis} />

      {/* 3. Operating Entities Cards */}
      {data?.companySummaries && data.companySummaries.length > 0 && (
        <CompanyManpowerCards
          summaries={data.companySummaries}
          selectedCompany={filters.company}
          onSelectCompany={handleSelectCompanyCard}
        />
      )}

      {/* 4. Analytics Visualizations */}
      {data && (
        <ManpowerCharts
          companySummaries={data.companySummaries}
          departmentSummaries={data.departmentSummaries}
          purposeDistribution={data.purposeDistribution}
          employmentTypeDistribution={data.employmentTypeDistribution}
          trends={data.trends}
        />
      )}

      {/* 5. Detailed Requisitions Directory Table */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground tracking-tight">
              Detailed Manpower Requisition Log
            </h3>
            <p className="text-xs text-muted-foreground">
              Audit trail of open, approved, and fulfilled staffing requisitions
            </p>
          </div>
        </div>

        <ManpowerTable
          records={paginatedRecords}
          totalItems={totalItems}
          page={page}
          pageSize={pageSize}
          totalPages={totalPages}
          sortField={sortField}
          sortOrder={sortOrder}
          onSort={handleSort}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          onSelectRecord={handleOpenDetail}
        />
      </div>

      {/* 6. Requisition Detail Modal */}
      <ManpowerDetailModal
        record={selectedRecord}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />

      {/* Loading Overlay for initial load */}
      {loading && !data && (
        <div className="fixed inset-0 bg-background/60 backdrop-blur-xs flex items-center justify-center z-50">
          <div className="flex flex-col items-center gap-3 p-6 rounded-2xl border border-border bg-card shadow-2xl">
            <UserPlus className="h-8 w-8 text-blue-500 animate-pulse" />
            <p className="text-sm font-semibold text-foreground">
              Synthesizing intercompany manpower requisitions...
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManpowerReportModule;

