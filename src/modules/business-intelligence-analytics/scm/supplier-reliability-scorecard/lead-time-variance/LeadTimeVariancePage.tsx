"use client";

import React, { useMemo } from "react";

import { DataTable } from "@/components/ui/new-data-table";

import { useScmFilters } from "@/modules/business-intelligence-analytics/scm/providers/ScmFilterProvider";
import { useLeadTimeVariance } from "./hooks/useLeadTimeVariance";
import LeadTimeVarianceSkeleton from "@/app/(business-intelligence-analytics)/bia/_components/LeadTimeVarianceSkeleton";
import { ErrorPage } from "@/app/(business-intelligence-analytics)/bia/_components/ErrorPage";

import { LeadTimeVarianceMetricsCard } from "./components/cards/LeadTimeVarianceMetricsCard";
import { LeadTimeVarianceChart } from "./components/charts/LeadTimeVarianceChart";
import { columns } from "./components/data-table/Columns";
import { ScmAdvancedFilters } from "@/modules/business-intelligence-analytics/scm/components/filters/ScmAdvancedFilters";

import {
  calculateLeadTimeVarianceMetrics,
  filterLeadTimeVarianceData,
  prepareSupplierTrendData,
  prepareTableData,
} from "./utils/lead-time-variance.utils";

/**
 * Lead Time Variance Page component.
 * Displays metrics, charts, and table for supplier lead time variance.
 */
export default function LeadTimeVariancePage() {
  const { dateRange, selectedSupplier } = useScmFilters();

  const { data, isLoading, error, refresh } = useLeadTimeVariance();

  // Extract unique suppliers for the filter
  const suppliers = useMemo(() => {
    const set = new Set(data.map((d) => d.supplierName));
    return Array.from(set).sort();
  }, [data]);

  // Apply local filtering based on ScmFilterProvider state
  const filteredData = useMemo(
    () => filterLeadTimeVarianceData(data, selectedSupplier, dateRange),
    [data, selectedSupplier, dateRange],
  );

  // Calculate metrics for cards
  const metrics = useMemo(
    () => calculateLeadTimeVarianceMetrics(filteredData),
    [filteredData],
  );

  // Prepare data for the trend chart
  const trendData = useMemo(
    () => prepareSupplierTrendData(filteredData),
    [filteredData],
  );

  // Prepare data for the data table
  const tableData = useMemo(
    () => prepareTableData(filteredData),
    [filteredData],
  );

  if (isLoading) return <LeadTimeVarianceSkeleton />;
  if (error) return <ErrorPage message={error} onRefresh={refresh} />;

  return (
    <div className="space-y-6 p-4 md:p-8 pt-6 h-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Lead Time Variance Report
          </h2>
        </div>

        <ScmAdvancedFilters suppliers={suppliers} />
      </div>

      <LeadTimeVarianceMetricsCard metrics={metrics} />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4 lg:col-span-7">
          <LeadTimeVarianceChart data={trendData} />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={tableData}
        searchKey="supplierName"
        isLoading={isLoading}
      />
    </div>
  );
}
