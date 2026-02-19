"use client";

import React, { useMemo } from "react";

import { DataTable } from "@/components/ui/new-data-table";

import { useScmFilters } from "@/modules/business-intelligence-analytics/scm/providers/ScmFilterProvider";
import { useFulfillmentRate } from "./hooks/useFulfillmentRate";
import FulfillmentRateSkeleton from "@/app/(business-intelligence-analytics)/bia/_components/FulfillmentRateSkeleton";

import { FulfillmentRateMetrics } from "./components/cards/FulfillmentRateMetricsCard";
import { FulfillmentRateChart } from "./components/charts/FulfillmentRateChart";
import { columns } from "./components/data-table/Columns";
import { ScmAdvancedFilters } from "@/modules/business-intelligence-analytics/scm/components/filters/ScmAdvancedFilters";

import {
  calculateFulfillmentRateMetrics,
  filterFulfillmentRateData,
  prepareSupplierChartData,
  prepareSupplierTableData,
} from "./utils/fulfillment-rate.utils";

export default function FulfillmentRatePage() {
  const { dateRange, selectedSupplier } = useScmFilters();

  const { data, isLoading } = useFulfillmentRate();

  const suppliers = useMemo(() => {
    const set = new Set(data.map((d) => d.supplierName));
    return Array.from(set).sort();
  }, [data]);

  const filteredData = useMemo(
    () => filterFulfillmentRateData(data, selectedSupplier, dateRange),
    [data, selectedSupplier, dateRange],
  );

  const metrics = useMemo(
    () => calculateFulfillmentRateMetrics(filteredData),
    [filteredData],
  );

  const chartData = useMemo(
    () => prepareSupplierChartData(filteredData),
    [filteredData],
  );

  const tableData = useMemo(
    () => prepareSupplierTableData(filteredData),
    [filteredData],
  );

  if (isLoading) return <FulfillmentRateSkeleton />;

  return (
    <div className="space-y-6 p-4 md:p-8 pt-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Fulfillment Rate Report
          </h2>
        </div>

        <ScmAdvancedFilters suppliers={suppliers} />
      </div>

      <FulfillmentRateMetrics metrics={metrics} />
      <FulfillmentRateChart data={chartData} />

      <DataTable
        columns={columns}
        data={tableData}
        searchKey="supplierName"
        isLoading={isLoading}
      />
    </div>
  );
}
