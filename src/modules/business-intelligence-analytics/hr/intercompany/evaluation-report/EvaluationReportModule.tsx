"use client";

import React, { useState } from "react";
import { useIntercompanyEvaluations } from "./hooks/useIntercompanyEvaluations";
import { EvaluationFiltersBar } from "./components/EvaluationFilters";
import { EvaluationKpiCards } from "./components/EvaluationKpiCards";
import { CompanyEvaluationCards } from "./components/CompanyEvaluationCards";
import { EvaluationCharts } from "./components/EvaluationCharts";
import { EvaluationTable } from "./components/EvaluationTable";
import { EvaluationDetailModal } from "./components/EvaluationDetailModal";
import { IntercompanyEvaluationRecord } from "./types";
import { AlertCircle, ClipboardCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EvaluationReportModule() {
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
  } = useIntercompanyEvaluations();

  const [selectedRecord, setSelectedRecord] = useState<IntercompanyEvaluationRecord | null>(null);
  const [modalOpen, setModalOpen] = useState<boolean>(false);

  const handleOpenDetail = (record: IntercompanyEvaluationRecord) => {
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
      <EvaluationFiltersBar
        filters={filters}
        setFilters={setFilters}
        companies={data?.companies || []}
        departments={data?.departments || []}
        evalTypes={data?.evalTypes || []}
        ratingBands={data?.ratingBands || []}
        results={data?.results || []}
        onReset={resetFilters}
        onRefresh={() => loadData(true)}
        onExport={handleExport}
        loading={loading}
        totalFiltered={totalItems}
      />

      {/* 2. Top Executive KPI Cards */}
      <EvaluationKpiCards kpis={dynamicKpis} />

      {/* 3. Operating Entities Cards */}
      {data?.companySummaries && data.companySummaries.length > 0 && (
        <CompanyEvaluationCards
          summaries={data.companySummaries}
          selectedCompany={filters.company}
          onSelectCompany={handleSelectCompanyCard}
        />
      )}

      {/* 4. Analytics Visualizations */}
      {data && (
        <EvaluationCharts
          companySummaries={data.companySummaries}
          departmentSummaries={data.departmentSummaries}
          ratingDistribution={data.ratingDistribution}
          typeDistribution={data.typeDistribution}
          categoryPerformance={data.categoryPerformance}
          trends={data.trends}
        />
      )}

      {/* 5. Detailed Evaluations Directory Table */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground tracking-tight">
              Detailed Performance Appraisals Log
            </h3>
            <p className="text-xs text-muted-foreground">
              Official records of employee evaluations, competencies, and regularization reviews
            </p>
          </div>
        </div>

        <EvaluationTable
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

      {/* 6. Evaluation Detail Modal */}
      <EvaluationDetailModal
        record={selectedRecord}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />

      {/* Loading Overlay for initial load */}
      {loading && !data && (
        <div className="fixed inset-0 bg-background/60 backdrop-blur-xs flex items-center justify-center z-50">
          <div className="flex flex-col items-center gap-3 p-6 rounded-2xl border border-border bg-card shadow-2xl">
            <ClipboardCheck className="h-8 w-8 text-blue-500 animate-pulse" />
            <p className="text-sm font-semibold text-foreground">
              Synthesizing intercompany performance evaluation records...
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default EvaluationReportModule;

