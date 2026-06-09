// src/modules/business-intelligence-analytics/scm/consolidator-audit/ConsolidatorAuditModule.tsx
"use client";

import React from "react";
import { Spinner } from "@/components/ui/spinner";
import {
  ClipboardList,
  Package,
  FileSpreadsheet,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useConsolidatorAudit } from "./hooks/useConsolidatorAudit";
import { Filters } from "./components/Filters";
import { AuditDataTable } from "./components/DataTable";
import { StatusDistributionCharts } from "./components/StatusDistributionCharts";

export default function ConsolidatorAuditModule() {
  const hook = useConsolidatorAudit();

  // First-load full-page spinner
  if (hook.loading && !hook.loadedOnce) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4 text-muted-foreground">
        <Spinner className="h-8 w-8 text-primary" />
        <p className="text-sm">Loading consolidator audit logs…</p>
      </div>
    );
  }

  // Calculate quick summary metrics
  const uniquePdps = new Set(hook.data.map((r) => r.pdpNo).filter(Boolean));
  const uniqueConsols = new Set(hook.data.map((r) => r.consolidatorNo).filter(Boolean));
  const uniqueDps = new Set(hook.data.map((r) => r.dpNo).filter(Boolean));

  const totalPdps = uniquePdps.size;
  const totalConsolidators = uniqueConsols.size;
  const totalDps = uniqueDps.size;

  // Compute status breakdowns for tooltips
  const pdpStatusCounts: Record<string, number> = {};
  const consolStatusCounts: Record<string, number> = {};
  const dpStatusCounts: Record<string, number> = {};
  hook.data.forEach((r) => {
    if (r.pdpStatus)
      pdpStatusCounts[r.pdpStatus] =
        (pdpStatusCounts[r.pdpStatus] || 0) + 1;
    if (r.consolidatorStatus)
      consolStatusCounts[r.consolidatorStatus] =
        (consolStatusCounts[r.consolidatorStatus] || 0) + 1;
    if (r.dpStatus)
      dpStatusCounts[r.dpStatus] = (dpStatusCounts[r.dpStatus] || 0) + 1;
  });

  return (
    <div className="space-y-4">
      {/* --- HEADER (Breadcrumb + Title unified) --- */}
      <div className="space-y-1">
        <h2 className="text-3xl font-black tracking-tight text-foreground uppercase italic leading-none">
          Consolidator <span className="text-primary">Report</span>
        </h2>
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">
          Real-time consolidator audit trail across pre-dispatch, consolidation,
          and dispatch plans
        </p>
      </div>

      {/* Filters Panel */}
      <Filters
        filters={hook.draftFilters}
        onChange={hook.setDraftFilters}
        uniqueStatuses={hook.uniqueStatuses}
        onSearch={hook.handleSearch}
        onClear={hook.handleClear}
        loading={hook.loading}
      />

      {/* Error Banner */}
      {hook.error && (
        <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive dark:border-destructive/40">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{hook.error}</span>
        </div>
      )}

      {hook.loadedOnce && (
        <>
          {/* Refresh Loader */}
          {hook.loading && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground px-1 animate-pulse">
              <Spinner className="h-3.5 w-3.5" />
              Updating audit records…
            </div>
          )}

          {/* --- KPI METRIC CARDS --- */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Pre-Dispatch Plans */}
            <TooltipProvider delayDuration={100}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Card className="relative overflow-hidden dark:border-zinc-700 cursor-default hover:shadow-lg transition-all duration-300 group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      <ClipboardList className="h-16 w-16 text-blue-500 -mr-4 -mt-4 rotate-12" />
                    </div>
                    <CardContent className="p-6 flex flex-col gap-1 relative z-10">
                      <p className="text-[12px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.2em] mb-1">
                        Pre-Dispatch Plans
                      </p>
                      <p className="text-3xl font-black tracking-tighter text-foreground tabular-nums italic">
                        {totalPdps}
                      </p>
                      <div className="mt-2 h-1 w-12 bg-blue-500/40 rounded-full" />
                      <p className="text-[10px] text-muted-foreground mt-1">
                        Unique PDPs in current dataset
                      </p>
                    </CardContent>
                  </Card>
                </TooltipTrigger>
                <TooltipContent
                  side="bottom"
                  className="max-w-xs rounded-lg border bg-background text-foreground p-3 shadow-lg text-sm dark:border-zinc-700"
                >
                  <div className="space-y-1">
                    <span className="font-medium">PDP Status Breakdown</span>
                    {Object.entries(pdpStatusCounts).length > 0 ? (
                      Object.entries(pdpStatusCounts).map(([status, count]) => (
                        <div
                          key={status}
                          className="flex justify-between gap-6"
                        >
                          <span className="text-muted-foreground">
                            {status}
                          </span>
                          <span className="font-medium tabular-nums">
                            {count}
                          </span>
                        </div>
                      ))
                    ) : (
                      <span className="text-muted-foreground">No data</span>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Consolidators Linked */}
            <TooltipProvider delayDuration={100}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Card className="relative overflow-hidden dark:border-zinc-700 cursor-default hover:shadow-lg transition-all duration-300 group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      <Package className="h-16 w-16 text-sky-500 -mr-4 -mt-4 rotate-12" />
                    </div>
                    <CardContent className="p-6 flex flex-col gap-1 relative z-10">
                      <p className="text-[12px] font-black text-sky-600 dark:text-sky-400 uppercase tracking-[0.2em] mb-1">
                        Consolidators Linked
                      </p>
                      <p className="text-3xl font-black tracking-tighter text-foreground tabular-nums italic">
                        {totalConsolidators}
                      </p>
                      <div className="mt-2 h-1 w-12 bg-sky-500/40 rounded-full" />
                      <p className="text-[10px] text-muted-foreground mt-1">
                        Linked across {totalPdps} PDP
                        {totalPdps !== 1 ? "s" : ""}
                      </p>
                    </CardContent>
                  </Card>
                </TooltipTrigger>
                <TooltipContent
                  side="bottom"
                  className="max-w-xs rounded-lg border bg-background text-foreground p-3 shadow-lg text-sm dark:border-zinc-700"
                >
                  <div className="space-y-1">
                    <span className="font-medium">
                      Consolidator Status Breakdown
                    </span>
                    {Object.entries(consolStatusCounts).length > 0 ? (
                      Object.entries(consolStatusCounts).map(
                        ([status, count]) => (
                          <div
                            key={status}
                            className="flex justify-between gap-6"
                          >
                            <span className="text-muted-foreground">
                              {status}
                            </span>
                            <span className="font-medium tabular-nums">
                              {count}
                            </span>
                          </div>
                        )
                      )
                    ) : (
                      <span className="text-muted-foreground">No data</span>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Dispatch Plans Tagged */}
            <TooltipProvider delayDuration={100}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Card className="relative overflow-hidden dark:border-zinc-700 cursor-default hover:shadow-lg transition-all duration-300 group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      <FileSpreadsheet className="h-16 w-16 text-emerald-500 -mr-4 -mt-4 rotate-12" />
                    </div>
                    <CardContent className="p-6 flex flex-col gap-1 relative z-10">
                      <p className="text-[12px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.2em] mb-1">
                        Dispatch Plans Tagged
                      </p>
                      <p className="text-3xl font-black tracking-tighter text-foreground tabular-nums italic">
                        {totalDps}
                      </p>
                      <div className="mt-2 h-1 w-12 bg-emerald-500/40 rounded-full" />
                      <p className="text-[10px] text-muted-foreground mt-1">
                        Linked across {totalConsolidators} consolidator
                        {totalConsolidators !== 1 ? "s" : ""}
                      </p>
                    </CardContent>
                  </Card>
                </TooltipTrigger>
                <TooltipContent
                  side="bottom"
                  className="max-w-xs rounded-lg border bg-background text-foreground p-3 shadow-lg text-sm dark:border-zinc-700"
                >
                  <div className="space-y-1">
                    <span className="font-medium">
                      Dispatch Plan Status Breakdown
                    </span>
                    {Object.entries(dpStatusCounts).length > 0 ? (
                      Object.entries(dpStatusCounts).map(([status, count]) => (
                        <div
                          key={status}
                          className="flex justify-between gap-6"
                        >
                          <span className="text-muted-foreground">
                            {status}
                          </span>
                          <span className="font-medium tabular-nums">
                            {count}
                          </span>
                        </div>
                      ))
                    ) : (
                      <span className="text-muted-foreground">No data</span>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* --- STATUS DISTRIBUTION CHARTS --- */}
          <StatusDistributionCharts data={hook.data} />

          {/* --- TABLE VIEW --- */}
          <div className="mt-4">
            <AuditDataTable data={hook.data} loading={hook.loading} />
          </div>
        </>
      )}

      {/* Empty State */}
      {!hook.loading && hook.loadedOnce && hook.data.length === 0 && (
        <Card className="dark:border-zinc-700">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <p className="text-lg font-semibold">No data loaded for this date range</p>
            <p className="text-sm text-muted-foreground">
              Try adjusting your dates and clicking Search.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Initial State (never loaded yet) */}
      {!hook.loading && !hook.loadedOnce && (
        <Card className="dark:border-zinc-700">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <p className="text-lg font-semibold">
              Welcome to Consolidator Report
            </p>
            <p className="text-sm text-muted-foreground">
              Select filters or a date range to load audit data and view
              insights
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
