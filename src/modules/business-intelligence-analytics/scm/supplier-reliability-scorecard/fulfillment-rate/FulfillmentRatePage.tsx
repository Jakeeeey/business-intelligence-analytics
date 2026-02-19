"use client";

import React, { useMemo } from "react";
import { Filter, Calendar, ChevronRight } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/new-data-table";
import { ColumnDef } from "@tanstack/react-table";

import { useScmFilters } from "@/modules/business-intelligence-analytics/scm/providers/ScmFilterProvider";
import { useFulfillmentRate } from "./hooks/useFulfillmentRate";
import FulfillmentRateSkeleton from "@/app/(business-intelligence-analytics)/bia/_components/FulfillmentRateSkeleton";

// Sub-components
import { FulfillmentRateMetrics } from "./components/cards/FulfillmentRateMetrics";
import { FulfillmentRateChart } from "./components/charts/FulfillmentRateChart";

export default function FulfillmentRatePage() {
  const {
    fromMonth,
    setFromMonth,
    toMonth,
    setToMonth,
    selectedSupplier,
    setSelectedSupplier,
  } = useScmFilters();

  const { data, isLoading } = useFulfillmentRate();

  const suppliers = useMemo(() => {
    const set = new Set(data.map((d) => d.supplierName));
    return Array.from(set).sort();
  }, [data]);

  const metrics = useMemo(() => {
    if (data.length === 0)
      return {
        avgFulfillmentRate: 0,
        suppliersBelow95Count: 0,
        totalSuppliers: 0,
        totalPOs: 0,
        totalFulfillmentPct: 0,
      };

    const totalFulfillment = data.reduce(
      (acc, curr) => acc + curr.fulfillmentPct,
      0,
    );
    const avgFulfillmentRate = totalFulfillment / data.length;

    const supplierStats = new Map<
      string,
      { totalPct: number; count: number }
    >();
    data.forEach((d) => {
      const current = supplierStats.get(d.supplierName) || {
        totalPct: 0,
        count: 0,
      };
      supplierStats.set(d.supplierName, {
        totalPct: current.totalPct + d.fulfillmentPct,
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
      totalPOs: data.length,
      totalFulfillmentPct: avgFulfillmentRate,
    };
  }, [data]);

  const chartData = useMemo(() => {
    const supplierMap = new Map<string, { totalPct: number; count: number }>();
    data.forEach((d) => {
      const current = supplierMap.get(d.supplierName) || {
        totalPct: 0,
        count: 0,
      };
      supplierMap.set(d.supplierName, {
        totalPct: current.totalPct + d.fulfillmentPct,
        count: current.count + 1,
      });
    });

    return Array.from(supplierMap.entries())
      .map(([name, val]) => ({
        name,
        fulfillmentRate: val.totalPct / val.count,
      }))
      .sort((a, b) => a.fulfillmentRate - b.fulfillmentRate);
  }, [data]);

  const tableData = useMemo(() => {
    const supplierMap = new Map<
      string,
      {
        totalPOs: number;
        totalOrdered: number;
        totalReceived: number;
        totalFulfillment: number;
      }
    >();

    data.forEach((d) => {
      const current = supplierMap.get(d.supplierName) || {
        totalPOs: 0,
        totalOrdered: 0,
        totalReceived: 0,
        totalFulfillment: 0,
      };
      supplierMap.set(d.supplierName, {
        totalPOs: current.totalPOs + 1,
        totalOrdered: current.totalOrdered + d.totalOrderedQty,
        totalReceived: current.totalReceived + d.totalReceivedQty,
        totalFulfillment: current.totalFulfillment + d.fulfillmentPct,
      });
    });

    return Array.from(supplierMap.entries()).map(([name, val]) => {
      const rate = val.totalFulfillment / val.totalPOs;
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
  }, [data]);

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "supplierName",
      header: "Supplier Name",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.supplierName}</span>
      ),
    },
    {
      accessorKey: "totalPOs",
      header: "Total POs",
    },
    {
      accessorKey: "fulfillmentRate",
      header: "Fulfillment Rate",
      cell: ({ row }) => (
        <span
          className={
            row.original.fulfillmentRate < 95
              ? "text-destructive font-bold"
              : "text-emerald-600 font-bold"
          }
        >
          {row.original.fulfillmentRate.toFixed(1)}%
        </span>
      ),
    },
    {
      accessorKey: "totalOrdered",
      header: "Total Ordered",
      cell: ({ row }) => row.original.totalOrdered.toLocaleString(),
    },
    {
      accessorKey: "totalReceived",
      header: "Total Received",
      cell: ({ row }) => row.original.totalReceived.toLocaleString(),
    },
    {
      accessorKey: "shortfall",
      header: "Shortfall",
      cell: ({ row }) => (
        <span className={row.original.shortfall > 0 ? "text-destructive" : ""}>
          {row.original.shortfall.toLocaleString()}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge
          variant={row.original.status === "Good" ? "outline" : "destructive"}
          className={
            row.original.status === "Good"
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : ""
          }
        >
          {row.original.status}
        </Badge>
      ),
    },
  ];

  if (isLoading) return <FulfillmentRateSkeleton />;

  return (
    <div className="space-y-6 p-4 md:p-8 pt-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Fulfillment Rate Report
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-3 bg-card border rounded-xl p-2 shadow-sm">
          <div className="flex items-center gap-2 px-2 border-r">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Input
              type="month"
              value={fromMonth}
              onChange={(e) => setFromMonth(e.target.value)}
              className="w-32 border-none h-8 text-sm focus-visible:ring-0"
            />
            <span className="text-muted-foreground text-xs">-</span>
            <Input
              type="month"
              value={toMonth}
              onChange={(e) => setToMonth(e.target.value)}
              className="w-32 border-none h-8 text-sm focus-visible:ring-0"
            />
          </div>
          <div className="flex items-center gap-2 px-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select
              value={selectedSupplier}
              onValueChange={setSelectedSupplier}
            >
              <SelectTrigger className="w-[180px] h-8 border-none shadow-none text-sm font-medium">
                <SelectValue placeholder="Select Supplier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Suppliers</SelectItem>
                {suppliers.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <FulfillmentRateMetrics metrics={metrics} />

      <FulfillmentRateChart data={chartData} />

      <Card className="shadow-sm border-none bg-transparent">
        <CardHeader className="px-0">
          <CardTitle>Detailed Fulfillment Performance</CardTitle>
          <CardDescription>
            Complete metrics for all suppliers in selected period
          </CardDescription>
        </CardHeader>
        <DataTable
          columns={columns}
          data={tableData}
          searchKey="supplierName"
          isLoading={isLoading}
        />
      </Card>
    </div>
  );
}
