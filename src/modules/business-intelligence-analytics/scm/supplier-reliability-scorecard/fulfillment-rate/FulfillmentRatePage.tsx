"use client";

import React, { useMemo } from "react";

import { DataTable } from "@/components/ui/new-data-table";

import { parse } from "date-fns";
import { useScmFilters } from "@/modules/business-intelligence-analytics/scm/providers/ScmFilterProvider";
import { useFulfillmentRate } from "./hooks/useFulfillmentRate";
import FulfillmentRateSkeleton from "@/app/(business-intelligence-analytics)/bia/_components/FulfillmentRateSkeleton";

// Sub-components
import { FulfillmentRateMetrics } from "./components/cards/FulfillmentRateMetricsCard";
import { FulfillmentRateChart } from "./components/charts/FulfillmentRateChart";
import { columns } from "./components/data-table/Columns";
import { ScmAdvancedFilters } from "@/modules/business-intelligence-analytics/scm/components/filters/ScmAdvancedFilters";

export default function FulfillmentRatePage() {
  const { dateRange, setDateRange, selectedSupplier, setSelectedSupplier } =
    useScmFilters();

  const { data, isLoading } = useFulfillmentRate();

  // Derives the full list of suppliers from the date-filtered data
  const suppliers = useMemo(() => {
    const set = new Set(data.map((d) => d.supplierName));
    return Array.from(set).sort();
  }, [data]);

  // Local filtering by supplier and date
  const filteredData = useMemo(() => {
    let result = data;

    if (selectedSupplier !== "all") {
      result = result.filter((d) => d.supplierName === selectedSupplier);
    }

    if (dateRange?.from || dateRange?.to) {
      result = result.filter((d) => {
        try {
          const poDate = parse(d.poDate, "yyyy-MM-dd", new Date());
          const isAfterFrom = !dateRange.from || poDate >= dateRange.from;
          const isBeforeTo = !dateRange.to || poDate <= dateRange.to;
          return isAfterFrom && isBeforeTo;
        } catch {
          return true;
        }
      });
    }

    return result;
  }, [data, selectedSupplier, dateRange]);

  const metrics = useMemo(() => {
    if (filteredData.length === 0)
      return {
        avgFulfillmentRate: 0,
        suppliersBelow95Count: 0,
        totalSuppliers: 0,
        totalPOs: 0,
        totalFulfillmentPct: 0,
      };

    const poFulfillmentRates = filteredData.map((d) =>
      d.totalOrderedQty > 0
        ? (d.totalReceivedQty / d.totalOrderedQty) * 100
        : 0,
    );

    const totalFulfillment = poFulfillmentRates.reduce(
      (acc, curr) => acc + curr,
      0,
    );
    const avgFulfillmentRate = totalFulfillment / filteredData.length;

    const supplierStats = new Map<
      string,
      { totalPct: number; count: number }
    >();
    filteredData.forEach((d) => {
      const current = supplierStats.get(d.supplierName) || {
        totalPct: 0,
        count: 0,
      };
      const poRate =
        d.totalOrderedQty > 0
          ? (d.totalReceivedQty / d.totalOrderedQty) * 100
          : 0;
      supplierStats.set(d.supplierName, {
        totalPct: current.totalPct + poRate,
        count: current.count + 1,
      });
    });

    let below95Count = 0;
    supplierStats.forEach((val) => {
      if (val.totalPct / val.count < 95) below95Count++;
    });

    return {
      avgFulfillmentRate,
      suppliersBelow95Count: below95Count,
      totalSuppliers: supplierStats.size,
      totalPOs: filteredData.length,
      totalFulfillmentPct: avgFulfillmentRate,
    };
  }, [filteredData]);

  const chartData = useMemo(() => {
    const supplierMap = new Map<string, { totalPct: number; count: number }>();
    filteredData.forEach((d) => {
      const current = supplierMap.get(d.supplierName) || {
        totalPct: 0,
        count: 0,
      };
      const poRate =
        d.totalOrderedQty > 0
          ? (d.totalReceivedQty / d.totalOrderedQty) * 100
          : 0;
      supplierMap.set(d.supplierName, {
        totalPct: current.totalPct + poRate,
        count: current.count + 1,
      });
    });

    return Array.from(supplierMap.entries())
      .map(([name, val]) => ({
        name,
        fulfillmentRate: val.totalPct / val.count,
      }))
      .sort((a, b) => a.fulfillmentRate - b.fulfillmentRate);
  }, [filteredData]);

  const tableData = useMemo(() => {
    const supplierMap = new Map<
      string,
      {
        totalPOs: number;
        totalOrdered: number;
        totalReceived: number;
        totalFulfillmentPct: number;
      }
    >();

    filteredData.forEach((d) => {
      const current = supplierMap.get(d.supplierName) || {
        totalPOs: 0,
        totalOrdered: 0,
        totalReceived: 0,
        totalFulfillmentPct: 0,
      };

      const poRate =
        d.totalOrderedQty > 0
          ? (d.totalReceivedQty / d.totalOrderedQty) * 100
          : 0;

      supplierMap.set(d.supplierName, {
        totalPOs: current.totalPOs + 1,
        totalOrdered: current.totalOrdered + d.totalOrderedQty,
        totalReceived: current.totalReceived + d.totalReceivedQty,
        totalFulfillmentPct: current.totalFulfillmentPct + poRate,
      });
    });

    return Array.from(supplierMap.entries()).map(([name, val]) => {
      const rate = val.totalFulfillmentPct / val.totalPOs;
      const shortfall = val.totalOrdered - val.totalReceived;
      return {
        supplierName: name,
        totalPOs: val.totalPOs,
        fulfillmentRate: rate,
        totalOrdered: val.totalOrdered,
        totalReceived: val.totalReceived,
        shortfall: shortfall > 0 ? shortfall : 0,
        status: rate >= 95 ? "Good" : "Below Target",
      };
    });
  }, [filteredData]);

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
