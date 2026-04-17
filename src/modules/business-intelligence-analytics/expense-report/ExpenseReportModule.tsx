"use client";

import * as React from "react";
import { useExpenseReport } from "./hooks/useExpenseReport";
import { exportToPDF } from "./utils/exportPDF";
import Filters from "./components/Filters";
import KpiCards from "./components/KpiCards";
import Charts from "./components/Charts";
import ExpenseTable from "./components/ExpenseTable";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { toast } from "sonner";
import type { ExportFormat } from "./type";

type ExpenseReportModuleProps = {
  userName: string;
};

export default function ExpenseReportModule({
  userName,
}: ExpenseReportModuleProps) {
  const {
    isLoading,
    error,
    filteredRecords,
    filters,
    setFilters,
    kpis,
    expensesByCategory,
    expensesByEmployee,
    expensesByDivision,
    dismissedSummaries,
    filterOptions,
  } = useExpenseReport("this-month");

  const handleExport = React.useCallback(
    async (format: ExportFormat, groupBy?: "coa" | "division") => {
      try {
        toast.loading("Generating PDF...");

        await exportToPDF({
          records: filteredRecords,
          filters,
          format,
          groupBy,
          userName,
        });

        toast.dismiss();
        toast.success("PDF exported successfully!");
      } catch (err) {
        toast.dismiss();
        toast.error("Failed to export PDF");
        console.error("Export error:", err);
      }
    },
    [filteredRecords, filters, userName],
  );

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Filters
        filters={filters}
        onFiltersChange={setFilters}
        records={filteredRecords}
        userName={userName}
        filterOptions={filterOptions}
        onExport={handleExport}
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner className="h-8 w-8" />
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <KpiCards kpis={kpis} />

          {/* Charts */}
          <Charts
            expensesByCategory={expensesByCategory}
            expensesByEmployee={expensesByEmployee}
            expensesByDivision={expensesByDivision}
            records={filteredRecords}
          />

          {/* Table */}
          <ExpenseTable data={dismissedSummaries} />
        </>
      )}
    </div>
  );
}
