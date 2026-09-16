"use client";

import React, { useMemo } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ErrorPage } from "@/app/(business-intelligence-analytics)/bia/_components/ErrorPage";
import { useAnnualReportFilters } from "./providers/AnnualReportFilterProvider";
import { useAnnualReport } from "./hooks/useAnnualReport";
import { AnnualReportFilters } from "./components/AnnualReportFilters";
import { AnnualReportKPICards } from "./components/AnnualReportKPICards";
import { AnnualReportChart } from "./components/AnnualReportChart";
import { AnnualReportTable } from "./components/AnnualReportTable";
import { AnnualReportSkeleton } from "./components/AnnualReportSkeleton";

const MONTH_LABELS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function AnnualReportPage() {
  const { filters } = useAnnualReportFilters();

  const queryParams = useMemo(() => {
    const params: Record<string, string> = {};
    if (filters.dateFrom) params.dateFrom = filters.dateFrom;
    if (filters.dateTo) params.dateTo = filters.dateTo;
    if (filters.customerName) params.customerName = filters.customerName;
    if (filters.supplierName) params.supplierName = filters.supplierName;
    if (filters.categoryName) params.categoryName = filters.categoryName;
    if (filters.year) params.year = filters.year;
    if (filters.month) params.month = filters.month;
    return params;
  }, [filters]);

  const { data, isLoading, error, refresh } = useAnnualReport(queryParams);

  const monthlyData = useMemo(() => data?.monthlyData ?? [], [data]);
  const summary = useMemo(() => data?.summary, [data]);
  const customers = useMemo(() => data?.customers ?? [], [data]);
  const suppliers = useMemo(() => data?.suppliers ?? [], [data]);
  const categories = useMemo(() => data?.categories ?? [], [data]);
  const salesTransactions = useMemo(() => data?.salesTransactions ?? [], [data]);
  const purchaseTransactions = useMemo(() => data?.purchaseTransactions ?? [], [data]);

  const periodCount = monthlyData.length;
  const yearCount = useMemo(
    () => new Set(monthlyData.map((d) => d.year)).size,
    [monthlyData],
  );

  const monthLabel = filters.month
    ? MONTH_LABELS[Number(filters.month) - 1]
    : null;

  if (isLoading) return <AnnualReportSkeleton />;
  if (error) return <ErrorPage message={error} onRefresh={refresh} />;

  return (
    <div className="space-y-6 p-4 md:p-8 pt-6 h-full">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-bold tracking-tight">
              {monthLabel ? `${monthLabel} ${filters.year}` : `Annual Report ${filters.year}`}
            </h2>
            <span className="hidden sm:inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
              {periodCount > 0
                ? `${periodCount} ${periodCount === 1 ? "month" : "months"} · ${yearCount} ${yearCount === 1 ? "year" : "years"}`
                : "No data"}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {monthLabel
              ? `Sell-In vs Sell-Out performance for ${monthLabel} ${filters.year}`
              : "Sell-In vs Sell-Out performance by month"}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
          <AnnualReportFilters customers={customers} suppliers={suppliers} categories={categories} />
          <Button
            variant="ghost"
            size="icon"
            onClick={refresh}
            className="shrink-0 h-9 w-9"
            title="Refresh data"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <AnnualReportKPICards summary={summary} isLoading={isLoading} />

      <AnnualReportChart data={monthlyData} isLoading={isLoading} />

      <AnnualReportTable
        data={monthlyData}
        salesData={salesTransactions}
        purchaseData={purchaseTransactions}
        isLoading={isLoading}
      />
    </div>
  );
}
