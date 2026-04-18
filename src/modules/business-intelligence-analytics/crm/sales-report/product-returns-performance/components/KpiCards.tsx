// src/modules/business-intelligence-analytics/sales-report/product-returns-performance/components/KpiCards.tsx
"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { ProductReturnsKpis } from "../types";
import {
  RotateCcw,
  PhilippinePeso,
  TrendingDown,
  Award,
  Package,
} from "lucide-react";

// Module-scope formatters — avoids creating Intl.NumberFormat instances on every render call
const phpFmt = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const numFmt = new Intl.NumberFormat("en-US");
const formatCurrency = (v: number) => phpFmt.format(v);
const formatNumber = (v: number) => numFmt.format(v);

type KpiCardsProps = {
  kpis: ProductReturnsKpis;
};

export function KPICards({ kpis }: KpiCardsProps) {
  const KpiCard = React.memo(
    ({
      explanation,
      title,
      value,
      icon: Icon,
      tooltipLines,
      valueClassName,
    }: {
      explanation: string;
      title: string;
      value: string;
      icon: React.ElementType;
      tooltipLines: { label: string; val: string }[];
      valueClassName?: string;
    }) => {
      return (
        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Card className="dark:border-zinc-700  cursor-default hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-sm font-medium pb-0 mb-0">
                    {title}
                  </CardTitle>
                  <div className="flex items-center gap-1">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
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
              <div className="space-y-1 ">
                <span className="font-medium ">{explanation}</span>
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
      );
    },
  );
  KpiCard.displayName = "KpiCard";

  const cards = [
    {
      title: "Total Returns",
      explanation: "Total number of returned transactions",
      value: formatNumber(kpis.totalReturns),
      icon: RotateCcw,
      tooltipLines: [
        { label: "Total Returns", val: formatNumber(kpis.totalReturns) },
        { label: "Return Value", val: formatCurrency(kpis.totalReturnValue) },
      ],
    },
    {
      title: "Total Return Value",
      explanation: "Total monetary value of all returns",
      value: formatCurrency(kpis.totalReturnValue),
      icon: PhilippinePeso,
      tooltipLines: [
        {
          label: "Total Return Value",
          val: formatCurrency(kpis.totalReturnValue),
        },
        { label: "Avg Return", val: formatCurrency(kpis.avgReturnValue) },
      ],
    },
    {
      title: "Avg Return Value",
      explanation: "Average monetary value of each return",
      value: formatCurrency(kpis.avgReturnValue),
      icon: TrendingDown,
      tooltipLines: [
        { label: "Avg Return", val: formatCurrency(kpis.avgReturnValue) },
        { label: "Total Returns", val: formatNumber(kpis.totalReturns) },
      ],
    },
    {
      title: "Top Returned Product",
      explanation: "The product with the highest number of returns",
      value: kpis.topReturnedProduct,
      icon: Award,
      tooltipLines: [
        { label: "Top Returned Product", val: kpis.topReturnedProduct },
      ],
    },
    {
      title: "Top Supplier (Returns)",
      explanation: "The supplier whose products are returned the most",
      value: kpis.topSupplier,
      icon: Package,
      tooltipLines: [{ label: "Top Supplier", val: kpis.topSupplier }],
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {cards.map((c) => (
        <KpiCard
          key={c.title}
          title={c.title}
          explanation={c.explanation}
          value={c.value}
          icon={c.icon}
          tooltipLines={c.tooltipLines}
        />
      ))}
    </div>
  );
}
