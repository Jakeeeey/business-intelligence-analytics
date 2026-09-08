"use client";

import * as React from "react";
import { ExpirationFiltersBar } from "./components/ExpirationFiltersBar";
import { ExpirationSummaryCards } from "./components/ExpirationSummaryCards";
import { ExpirationChart } from "./components/ExpirationChart";
import { ExpirationBranchChart } from "./components/ExpirationBranchChart";
import { ExpirationTable } from "./components/ExpirationTable";
import { useExpirationMonitoring } from "./hooks/useExpirationMonitoring";

export default function ExpirationMonitoringModule() {
  const {
    data,
    loading,
    suppliers,
    branches,
    lots,
    batches,
    filters,
    searchQuery,
    setSearchQuery,
    handleApplyFilters,
    handleClearFilters,
    handleRefresh,
  } = useExpirationMonitoring();

  return (
    <div className="space-y-8 p-6 min-h-screen bg-background text-foreground">
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-2">
        <div className="space-y-2">
          <h2 className="text-4xl font-black tracking-tight text-foreground uppercase italic leading-none">
            Expiration <span className="text-primary">Monitoring</span>
          </h2>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">
            Track and monitor products nearing expiration
          </p>
        </div>
      </div>

      {/* FILTERS */}
      <ExpirationFiltersBar
        suppliers={suppliers}
        branches={branches}
        lots={lots}
        batches={batches}
        filters={filters}

        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        onApplyFilters={handleApplyFilters}
        onRefresh={handleRefresh}
        onClearFilters={handleClearFilters}
        loading={loading}
      />

      {/* SUMMARY CARDS */}
      <ExpirationSummaryCards data={data} />

      {/* MAIN CONTENT AREA */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* LEFT COLUMN: TABLE (Takes more space) */}
        <div className="xl:col-span-2 flex flex-col h-full">
          <ExpirationTable data={data} loading={loading} />
        </div>

        {/* RIGHT COLUMN: CHART */}
        <div className="xl:col-span-1 flex flex-col h-full gap-6">
          <ExpirationChart data={data} />
          <ExpirationBranchChart data={data} />
        </div>
      </div>
    </div>
  );
}
