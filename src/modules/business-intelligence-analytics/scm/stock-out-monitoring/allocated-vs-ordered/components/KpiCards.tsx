// src/modules/business-intelligence-analytics/scm/stock-out-monitoring/allocated-vs-ordered/components/KpiCards.tsx
"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { AllocationKpis } from "../types";
import {
  PackageOpen,
  PackageCheck,
  AlertTriangle,
   // eslint-disable-next-line @typescript-eslint/no-unused-vars
  BarChart2,
  ShoppingCart,
  TrendingDown,
  DollarSign,
} from "lucide-react";

type KpiCardsProps = {
  kpis: AllocationKpis;
};

const numFmt = new Intl.NumberFormat("en-US");
const phpFmt = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 2,
});
const pct = (v: number) => `${v.toFixed(1)}%`;

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
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
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

/** Color class based on allocation rate health */
 // eslint-disable-next-line @typescript-eslint/no-unused-vars
function rateColorClass(rate: number): string {
  if (rate >= 90) return "text-green-600 dark:text-green-400";
  if (rate >= 70) return "text-yellow-600 dark:text-yellow-400";
  return "text-red-600 dark:text-red-400";
}

export function KpiCards({ kpis }: KpiCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-6">
      <KpiCard
        title="Total Ordered Quantity"
        value={numFmt.format(kpis.totalOrderedQuantity)}
        icon={PackageOpen}
        tooltip="Total quantity of items requested across all orders within the selected filters."
        tooltipLines={[
          { label: "Unique Orders", val: numFmt.format(kpis.totalOrders) },
          {
            label: "Ordered Quantity",
            val: numFmt.format(kpis.totalOrderedQuantity),
          },
        ]}
      />

      <KpiCard
        title="Total Allocated Quantity"
        value={numFmt.format(kpis.totalAllocatedQuantity)}
        icon={PackageCheck}
        tooltip="Total quantity of inventory currently reserved or allocated to fulfill orders."
        tooltipLines={[
          {
            label: "Allocated",
            val: numFmt.format(kpis.totalAllocatedQuantity),
          },
          {
            label: "vs Ordered",
            val: numFmt.format(kpis.totalOrderedQuantity),
          },
        ]}
      />

      <KpiCard
        title="Allocation Gap"
        value={numFmt.format(kpis.allocationGap)}
        icon={TrendingDown}
        tooltip="Total quantity of ordered items that have not yet been allocated from inventory."
        tooltipLines={[
          { label: "Gap (units)", val: numFmt.format(kpis.allocationGap) },
          {
            label: "Ordered",
            val: numFmt.format(kpis.totalOrderedQuantity),
          },
        ]}
        valueClassName={
          kpis.allocationGap > 0
            ? "text-red-600 dark:text-red-400"
            : "text-green-600 dark:text-green-400"
        }
      />

      {/* <KpiCard
        title="Allocation Rate"
        value={pct(kpis.allocationRate)}
        icon={BarChart2}
        tooltip="Percentage of ordered quantity that has been allocated. Formula: (AllocatedQty / OrderedQty) × 100."
        tooltipLines={[
          { label: "Rate", val: pct(kpis.allocationRate) },
          {
            label: "Status",
            val:
              kpis.allocationRate >= 90
                ? "Healthy"
                : kpis.allocationRate >= 70
                  ? "Warning"
                  : "Critical",
          },
        ]}
        valueClassName={rateColorClass(kpis.allocationRate)}
      /> */}

      <KpiCard
        title="Shortage Orders"
        value={numFmt.format(kpis.shortageOrders)}
        icon={AlertTriangle}
        tooltip="Number of orders that still have unallocated quantities. discrepancy gap > 0."
        tooltipLines={[
          {
            label: "Shortage Orders",
            val: numFmt.format(kpis.shortageOrders),
          },
          { label: "Total Orders", val: numFmt.format(kpis.totalOrders) },
          {
            label: "Shortage Rate",
            val:
              kpis.totalOrders > 0
                ? pct((kpis.shortageOrders / kpis.totalOrders) * 100)
                : "0%",
          },
        ]}
        valueClassName={
          kpis.shortageOrders > 0 ? "text-red-600 dark:text-red-400" : ""
        }
      />

      <KpiCard
        title="Total Orders"
        value={numFmt.format(kpis.totalOrders)}
        icon={ShoppingCart}
        tooltip="Total number of unique orders included in the report after filters are applied."
        tooltipLines={[
          { label: "Unique Orders", val: numFmt.format(kpis.totalOrders) },
        ]}
      />

      <KpiCard
        title="Net Amount"
        value={phpFmt.format(kpis.totalNetAmount)}
        icon={DollarSign}
        tooltip="Total monetary value of all orders included in the report. "
        tooltipLines={[
          { label: "Net Amount", val: phpFmt.format(kpis.totalNetAmount) },
        ]}
      />
    </div>
  );
}
