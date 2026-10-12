"use client";

import React from "react";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, DollarSign, Percent, ArrowUpRight, ArrowDownRight } from "lucide-react";
import {
  formatCurrencyDisplay,
} from "../utils/annual-report.utils";
import type { DashboardSummary } from "../types/annual-report.schema";

interface AnnualReportV2KPICardsProps {
  summary?: DashboardSummary;
  isLoading: boolean;
  unitName?: string;
}

const cards = [
  {
    title: "Total Sales (Sell-Out)",
    icon: TrendingUp,
    getAmount: (s: DashboardSummary) => s.totalSales,
    getTrend: () => 1 as const,
    isAverage: true,
  },
  {
    title: "Total Purchases (Sell-In)",
    icon: TrendingDown,
    getAmount: (s: DashboardSummary) => s.totalPurchases,
    getTrend: () => 1 as const,
    isAverage: true,
  },
  {
    title: "Net Variance",
    icon: DollarSign,
    getAmount: (s: DashboardSummary) => s.netVariance,
    getTrend: (s: DashboardSummary) => Math.sign(s.netVariance) as -1 | 0 | 1,
    isAverage: true,
  },
  {
    title: "Bias Percentage",
    icon: Percent,
    isAverage: true,
  },
];

export function AnnualReportV2KPICards({
  summary,
  isLoading,
  unitName,
}: AnnualReportV2KPICardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 auto-rows-min gap-4 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-32 mt-2" />
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  if (!summary) return null;

  return (
    <div className="grid grid-cols-2 auto-rows-min gap-4 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        const isBias = index === 3;
        const amount = isBias ? 0 : card.getAmount!(summary);
        const trend = isBias ? 0 : card.getTrend!(summary);

        return (
          <Card
            key={card.title}
            className="@container/card"
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardDescription className="text-sm font-medium">
                  {card.title}
                </CardDescription>
                <Icon className="hidden sm:flex size-5 text-muted-foreground" />
              </div>

              <div className="flex items-baseline gap-2">
                {isBias ? (
                  <CardTitle className="text-lg sm:text-2xl font-semibold tabular-nums text-foreground @[250px]/card:text-3xl">
                    {summary.biasPercentage.toFixed(2)}%
                  </CardTitle>
                ) : (
                  <CardTitle className="text-lg sm:text-2xl font-semibold tabular-nums text-foreground @[250px]/card:text-3xl" title={unitName ? `${amount.toLocaleString()} ${unitName}` : undefined}>
                    {unitName ? amount.toLocaleString(undefined, { maximumFractionDigits: 2 }) : formatCurrencyDisplay(amount, 15)}
                  </CardTitle>
                )}
                {trend > 0 && index === 2 && (
                  <ArrowUpRight className="h-4 w-4 text-green-500 shrink-0" />
                )}
                {trend < 0 && index === 2 && (
                  <ArrowDownRight className="h-4 w-4 text-red-500 shrink-0" />
                )}
              </div>
            </CardHeader>
          </Card>
        );
      })}
    </div>
  );
}
