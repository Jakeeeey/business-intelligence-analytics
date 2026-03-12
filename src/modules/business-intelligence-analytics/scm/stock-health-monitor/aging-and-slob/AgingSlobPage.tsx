"use client";

import React from "react";
import { useAgingSlob } from "./hooks/useAgingSlob";
import { SlobMetricsCards } from "./components/SlobMetricsCards";
import { DataTable } from "@/components/ui/new-data-table";
import { columns } from "./components/Columns";
import { AgingSlobCharts } from "./components/AgingSlobCharts";
import { ScmAdvancedFilters } from "./components/ScmAdvancedFilters";
import { Skeleton } from "@/components/ui/skeleton";

export default function AgingSlobPage() {
  const { data, rawData, isLoading, metrics } = useAgingSlob();

  // Extract unique suppliers and branches for filters
  const suppliers = React.useMemo(() => {
    const set = new Set(rawData.map((d) => d.supplierShortcut).filter(Boolean));
    return Array.from(set).sort() as string[];
  }, [rawData]);

  const branches = React.useMemo(() => {
    const set = new Set(rawData.map((d) => d.branchName).filter(Boolean));
    return Array.from(set).sort() as string[];
  }, [rawData]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-96" />
        </div>
        <Skeleton className="h-64 w-full" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Aging & SLOB (Slow-Moving/Obsolete)</h2>
          <p className="text-sm text-muted-foreground">Identify dead stock utilizing valuable warehouse space</p>
        </div>

        <ScmAdvancedFilters 
          suppliers={suppliers} 
          branches={branches} 
          showBranch={true} 
          showRiskStatus={true}
        />
      </div>

      <AgingSlobCharts data={data} />

      <SlobMetricsCards metrics={metrics} />

      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">Slow-Moving & Obsolete (SLOB) Items Detail</h3>
          <p className="text-xs text-muted-foreground">Items with no outbound movement for more than 60 days</p>
        </div>
        
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
