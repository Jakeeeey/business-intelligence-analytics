"use client";

import React from "react";
import { usePHAudit } from "./hooks/usePHAudit";
import { SchedulingFilters } from "./components/SchedulingFilters";
import { AuditCalendarGrid } from "./components/AuditCalendarGrid";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export default function PHAuditSchedulingModule() {
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
    daysInMonth,
    refresh,
    error,
  } = usePHAudit();

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

      {/* Calendar Matrix View (Branch-only rows) */}
      <AuditCalendarGrid
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
        daysInMonth={daysInMonth}
        branches={filteredBranches}
        records={records}
        loading={loading}
      />
    </div>
  );
}

