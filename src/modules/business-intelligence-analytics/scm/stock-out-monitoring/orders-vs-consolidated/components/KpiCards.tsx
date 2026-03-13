"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { OrdersKpis } from "../types";
import {
  ShoppingCart,
  PackageCheck,
  PackageSearch,
  BarChart2,
  DollarSign,
  Box,
} from "lucide-react";

type Props = { kpis: OrdersKpis };

const numFmt = new Intl.NumberFormat("en-PH", { maximumFractionDigits: 2 });
const phpFmt = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 2,
});
const pctFmt = (n: number) => `${n.toFixed(1)}%`;

function rateColorClass(rate: number) {
  if (rate >= 90) return "text-emerald-600 dark:text-emerald-400";
  if (rate >= 70) return "text-amber-500 dark:text-amber-400";
  return "text-rose-600 dark:text-rose-400";
}

const KpiCard = React.memo(
  ({
    title,
    value,
    icon: Icon,
    tooltip,
    tooltipLines,
    valueClassName,
  }: {
    title: string;
    value: string;
    icon: React.ElementType;
    tooltip: string;
    tooltipLines: { label: string; val: string }[];
    valueClassName?: string;
  }) => (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Card className="dark:border-zinc-700 dark:bg-white/13 cursor-default hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium leading-tight">
                {title}
              </CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold tabular-nums ${valueClassName ?? ""}`}
              >
                {value}
              </div>
            </CardContent>
          </Card>
        </TooltipTrigger>
        <TooltipContent
          side="right"
          className="max-w-xs rounded-lg border bg-background text-muted-foreground p-3 shadow-lg text-sm"
        >
          <div className="space-y-1">
            <span className="font-medium text-foreground">{tooltip}</span>
            {tooltipLines.map((line, i) => (
              <div key={i} className="flex justify-between gap-6">
                <span className="text-muted-foreground">{line.label}</span>
                <span className="font-medium tabular-nums">{line.val}</span>
              </div>
            ))}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ),
);
KpiCard.displayName = "KpiCard";

export function KpiCards({ kpis }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      <KpiCard
        title="Total Orders"
        value={numFmt.format(kpis.totalOrders)}
        icon={ShoppingCart}
        tooltip="Count of unique orders (canonical order IDs) in the selected period."
        tooltipLines={[
          { label: "Total Orders", val: numFmt.format(kpis.totalOrders) },
        ]}
      />

      <KpiCard
        title="Consolidated"
        value={numFmt.format(kpis.totalConsolidated)}
        icon={PackageCheck}
        tooltip="Orders with a status other than 'For Consolidation' — meaning they have been consolidated into delivery batches."
        tooltipLines={[
          { label: "Consolidated", val: numFmt.format(kpis.totalConsolidated) },
          {
            label: "% of Total",
            val:
              kpis.totalOrders > 0
                ? pctFmt((kpis.totalConsolidated / kpis.totalOrders) * 100)
                : "0%",
          },
        ]}
        valueClassName={
          kpis.totalConsolidated > 0
            ? "text-emerald-600 dark:text-emerald-400"
            : ""
        }
      />

      <KpiCard
        title="Pending"
        value={numFmt.format(kpis.pendingOrders)}
        icon={PackageSearch}
        tooltip="Orders still in 'For Consolidation' status — these are the processing backlog that need attention."
        tooltipLines={[
          { label: "Pending Orders", val: numFmt.format(kpis.pendingOrders) },
          {
            label: "% of Total",
            val:
              kpis.totalOrders > 0
                ? pctFmt((kpis.pendingOrders / kpis.totalOrders) * 100)
                : "0%",
          },
        ]}
        valueClassName={
          kpis.pendingOrders > 0 ? "text-rose-600 dark:text-rose-400" : ""
        }
      />

      <KpiCard
        title="Consolidation Rate"
        value={pctFmt(kpis.consolidationRate)}
        icon={BarChart2}
        tooltip="Percentage of orders that have been consolidated. Formula: (Consolidated ÷ Total Orders) × 100. Target: ≥90% (green), 70-89% (amber), <70% (red)."
        tooltipLines={[
          { label: "Rate", val: pctFmt(kpis.consolidationRate) },
          {
            label: "Status",
            val:
              kpis.consolidationRate >= 90
                ? "Healthy"
                : kpis.consolidationRate >= 70
                  ? "Warning"
                  : "Critical",
          },
        ]}
        valueClassName={rateColorClass(kpis.consolidationRate)}
      />

      <KpiCard
        title="Total Net Amount"
        value={phpFmt.format(kpis.totalNetAmount)}
        icon={DollarSign}
        tooltip="Sum of net amounts across all product line rows for the filtered period."
        tooltipLines={[
          { label: "Net Amount", val: phpFmt.format(kpis.totalNetAmount) },
        ]}
      />

      <KpiCard
        title="Total Ordered Qty"
        value={numFmt.format(kpis.totalOrderedQuantity)}
        icon={Box}
        tooltip="Sum of ordered quantities across all product line rows for the filtered period."
        tooltipLines={[
          {
            label: "Ordered Qty",
            val: numFmt.format(kpis.totalOrderedQuantity),
          },
        ]}
      />
    </div>
  );
}
