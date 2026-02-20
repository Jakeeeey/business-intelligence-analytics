"use client";

import React from "react";
import { useStockOutRisk } from "./hooks/useStockOutRisk";
import { StockOutRiskAlert } from "./components/StockOutRiskAlert";
import { DataTable } from "@/components/ui/new-data-table";
import { columns } from "./components/Columns";
import { StockOutRiskCharts } from "./components/StockOutRiskCharts";
import { ScmAdvancedFilters } from "@/modules/business-intelligence-analytics/scm/components/filters/ScmAdvancedFilters";
import { Skeleton } from "@/components/ui/skeleton";

export default function StockOutRiskPage() {
  const { data, criticalItems, isLoading, error } = useStockOutRisk();

  // Extract unique suppliers and branches for filters
  const suppliers = React.useMemo(() => {
    const set = new Set(data.map((d) => d.supplierShortcut).filter(Boolean));
    return Array.from(set).sort() as string[];
  }, [data]);

  const branches = React.useMemo(() => {
    const set = new Set(data.map((d) => d.branchName).filter(Boolean));
    return Array.from(set).sort() as string[];
  }, [data]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-96" />
        </div>
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Module 1: Stock-Out Risk (Predictive Flagging)</h2>
          <p className="text-sm text-muted-foreground">Automated early warnings for critical stock-outs</p>
        </div>

        <ScmAdvancedFilters 
          suppliers={suppliers} 
          branches={branches} 
          showBranch={true} 
          showRiskStatus={true}
        />
      </div>

      <StockOutRiskCharts data={data} />

      <StockOutRiskAlert criticalCount={criticalItems.length} />

      <div className="space-y-4">
        <DataTable
          columns={columns}
          data={data}
          searchKey="productName"
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
