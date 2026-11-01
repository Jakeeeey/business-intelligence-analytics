"use client";

import React from "react";
import { usePHWarehouse } from "./hooks/usePHWarehouse";
import { SchedulingFilters } from "./components/SchedulingFilters";
import { WarehouseCalendarGrid } from "./components/WarehouseCalendarGrid";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export default function PHWarehouseSchedulingModule() {
  const {
    selectedYear,
    setSelectedYear,
    selectedMonth,
    setSelectedMonth,
    selectedBranchIds,
    setSelectedBranchIds,
    selectedStatuses,
    setSelectedStatuses,
    loading,
    records,
    branches,
    filteredBranches,
    suppliers,
    daysInMonth,
    refresh,
    error,
  } = usePHWarehouse();

  return (
    <div className="space-y-4">
      {/* Filters Header (Month, Year, Searchable Multiselect Branch & Status, Refresh, Legend) */}
      <SchedulingFilters
        selectedYear={selectedYear}
        onYearChange={setSelectedYear}
        selectedMonth={selectedMonth}
        onMonthChange={setSelectedMonth}
        selectedBranchIds={selectedBranchIds}
        onBranchIdsChange={setSelectedBranchIds}
        selectedStatuses={selectedStatuses}
        onStatusesChange={setSelectedStatuses}
        branches={branches}
        onRefresh={refresh}
        loading={loading}
      />

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Calendar Matrix View */}
      <WarehouseCalendarGrid
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
        daysInMonth={daysInMonth}
        branches={filteredBranches}
        suppliers={suppliers}
        records={records}
        loading={loading}
      />
    </div>
  );
}
