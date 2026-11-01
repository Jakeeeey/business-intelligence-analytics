"use client";

import React, { useState } from "react";
import { useIntercompanyResignations } from "./hooks/useIntercompanyResignations";
import { ResignationFiltersBar } from "./components/ResignationFilters";
import { ResignationKpiCards } from "./components/ResignationKpiCards";
import { CompanyResignationCards } from "./components/CompanyResignationCards";
import { ResignationCharts } from "./components/ResignationCharts";
import { ResignationTable } from "./components/ResignationTable";
import { ResignationDetailModal } from "./components/ResignationDetailModal";
import { IntercompanyResignationRecord } from "./types";
import { AlertCircle, UserMinus } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ResignationReportModule() {
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
  } = useIntercompanyResignations();

  const [selectedRecord, setSelectedRecord] = useState<IntercompanyResignationRecord | null>(null);
  const [modalOpen, setModalOpen] = useState<boolean>(false);

  const handleOpenDetail = (record: IntercompanyResignationRecord) => {
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
      <ResignationFiltersBar
        filters={filters}
        setFilters={setFilters}
        companies={data?.companies || []}
        departments={data?.departments || []}
        reasonCategories={data?.reasonCategories || []}
        onReset={resetFilters}
        onRefresh={() => loadData(true)}
        onExport={handleExport}
        loading={loading}
        totalFiltered={totalItems}
      />

      {/* 2. Top Executive KPI Cards */}
      <ResignationKpiCards kpis={dynamicKpis} />

      {/* 3. Operating Entities Cards */}
      {data?.companySummaries && data.companySummaries.length > 0 && (
        <CompanyResignationCards
          summaries={data.companySummaries}
          selectedCompany={filters.company}
          onSelectCompany={handleSelectCompanyCard}
        />
      )}

      {/* 4. Analytics Visualizations */}
      {data && (
        <ResignationCharts
          companySummaries={data.companySummaries}
          departmentSummaries={data.departmentSummaries}
          reasonDistribution={data.reasonDistribution}
          noticeDistribution={data.noticeDistribution}
          trends={data.trends}
        />
      )}

      {/* 5. Detailed Resignations Directory Table */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground tracking-tight">
              Detailed Resignation Log
            </h3>
            <p className="text-xs text-muted-foreground">
              Audit trail of filed and recorded employee resignations
            </p>
          </div>
        </div>

        <ResignationTable
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

      {/* 6. Resignation Detail Modal */}
      <ResignationDetailModal
        record={selectedRecord}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />

      {/* Loading Overlay for initial load */}
      {loading && !data && (
        <div className="fixed inset-0 bg-background/60 backdrop-blur-xs flex items-center justify-center z-50">
          <div className="flex flex-col items-center gap-3 p-6 rounded-2xl border border-border bg-card shadow-2xl">
            <UserMinus className="h-8 w-8 text-red-500 animate-pulse" />
            <p className="text-sm font-semibold text-foreground">
              Synthesizing intercompany resignation records...
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default ResignationReportModule;

