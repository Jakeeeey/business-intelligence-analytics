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
import { Box, PackageCheck, AlertTriangle } from "lucide-react";

type Props = { kpis: OrdersKpis };

const numFmt = new Intl.NumberFormat("en-PH", { maximumFractionDigits: 2 });
const phpFmt = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 2,
});

export function KpiCards({ kpis }: Props) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {/* Total Ordered Qty */}
      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="dark:border-zinc-700 dark:bg-white/13 cursor-default hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium leading-tight">
                  Total Ordered Qty
                </CardTitle>
                <Box className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tabular-nums">
                  {numFmt.format(kpis.totalOrderedQuantity)}
                </div>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent
            side="right"
            className="max-w-xs rounded-lg border bg-background text-muted-foreground p-3 shadow-lg text-sm"
          >
            <div className="space-y-1">
              <span className="font-medium text-foreground">
                Total Ordered Qty
              </span>
              <div className="flex justify-between gap-6">
                <span className="text-muted-foreground">Ordered Qty</span>
                <span className="font-medium tabular-nums">
                  {numFmt.format(kpis.totalOrderedQuantity)}
                </span>
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Consolidated Qty */}
      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="dark:border-zinc-700 dark:bg-white/13 cursor-default hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium leading-tight">
                  Consolidated Qty
                </CardTitle>
                <PackageCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                  {numFmt.format(kpis.totalConsolidatedQuantity)}
                </div>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent
            side="right"
            className="max-w-xs rounded-lg border bg-background text-muted-foreground p-3 shadow-lg text-sm"
          >
            <div className="space-y-1">
              <span className="font-medium text-foreground">
                Consolidated Qty
              </span>
              <div className="flex justify-between gap-6">
                <span className="text-muted-foreground">Consolidated Qty</span>
                <span className="font-medium tabular-nums">
                  {numFmt.format(kpis.totalConsolidatedQuantity)}
                </span>
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Variance Qty + Variance Amount (combined card) */}
      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="dark:border-zinc-700 dark:bg-white/13 cursor-default hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium leading-tight">
                  Variance
                </CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="pt-1">
                <div className="flex items-start justify-start gap-25">
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5 text-start">Quantity</p>
                    <div className={`text-2xl font-bold tabular-nums ${kpis.varianceQty > 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                      {numFmt.format(kpis.varianceQty)}
                    </div>
                  </div>
                  <div className="text-start">
                    <p className="text-xs text-muted-foreground mb-0.5 text-start">Amount</p>
                    <div className={`text-2xl font-bold tabular-nums  ${kpis.varianceAmount > 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                      {phpFmt.format(kpis.varianceAmount)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent
            side="left"
            className="max-w-xs rounded-lg border bg-background text-muted-foreground p-3 shadow-lg text-sm"
          >
            <div className="space-y-1">
              <span className="font-medium text-foreground">Variance</span>
              <div className="flex justify-between gap-6">
                <span className="text-muted-foreground">Variance Qty</span>
                <span className="font-medium tabular-nums">
                  {numFmt.format(kpis.varianceQty)}
                </span>
              </div>
              <div className="flex justify-between gap-6">
                <span className="text-muted-foreground">Variance Amount</span>
                <span className="font-medium tabular-nums">
                  {phpFmt.format(kpis.varianceAmount)}
                </span>
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
