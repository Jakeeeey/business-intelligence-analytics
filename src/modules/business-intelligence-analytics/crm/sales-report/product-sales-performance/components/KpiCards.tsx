// src/modules/business-intelligence-analytics/sales-report/product-sales-performance/components/KPICards.tsx
"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { ProductPerformanceKpis } from "../types";
import {
  ShoppingCart,
  TrendingUp,
  Award,
  Package,
  PhilippinePeso,
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

type KPICardsProps = {
  kpis: ProductPerformanceKpis;
};

export function KPICards({ kpis }: KPICardsProps) {
  const KpiCard = React.memo(
    ({
      explaination,
      title,
      value,
      icon: Icon,
      tooltipLines,
      valueClassName,
    }: {
      explaination: string;
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
              <Card className="dark:border-zinc-700 dark:bg-white/13 cursor-default hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-sm font-medium">{title}</CardTitle>
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
              <div className="space-y-1">
                <span className="font-medium ">{explaination}</span>
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
      explaination: "Total sales revenue generated within the selected date range.",
      title: "Total Transactions",
      value: formatNumber(kpis.totalTransactions),
      icon: ShoppingCart,
      tooltipLines: [
        {
          label: "Total Transactions",
          val: formatNumber(kpis.totalTransactions),
        },
        { label: "Total Revenue", val: formatCurrency(kpis.totalRevenue) },
      ],
    },
    {
     explaination:"Total sales revenue generated within the selected date range.",
      title: "Total Revenue",
      value: formatCurrency(kpis.totalRevenue),
      icon: PhilippinePeso,
      tooltipLines: [
        { label: "Total Revenue", val: formatCurrency(kpis.totalRevenue) },
        {
          label: "Avg Transaction",
          val: formatCurrency(kpis.avgTransactionValue),
        },
      ],
    },
    {
      explaination:"The average revenue generated per transaction",
      title: "Avg Transaction",
      value: formatCurrency(kpis.avgTransactionValue),
      icon: TrendingUp,
      tooltipLines: [
        {
          label: "Avg Transaction",
          val: formatCurrency(kpis.avgTransactionValue),
        },
        { label: "Transactions", val: formatNumber(kpis.totalTransactions) },
      ],
    },
    {
      explaination:"The product with the highest number of sales transactions within the selected date range",
      title: "Top Product",
      value: kpis.topProduct,
      icon: Award,
      tooltipLines: [{ label: "Top Product", val: kpis.topProduct }],
    },
    {
      explaination:"The suplier with the highest number of sales transactions within the selected date range",
      title: "Top Supplier",
      value: kpis.topSupplier,
      icon: Package,
      tooltipLines: [{ label: "Top Supplier", val: kpis.topSupplier }],
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 ">
      {cards.map((c) => (
        <KpiCard
          explaination={c.explaination}
          key={c.title}
          title={c.title}
          value={c.value}
          icon={c.icon}
          tooltipLines={c.tooltipLines}
        />
      ))}
    </div>
  );
}
