"use client";

import React from "react";
import {
  CheckCircle2,
  AlertTriangle,
  FileText,
  TrendingDown,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface FulfillmentRateMetricsProps {
  metrics: {
    avgFulfillmentRate: number;
    suppliersBelow95Count: number;
    totalSuppliers: number;
    totalPOs: number;
    totalFulfillmentPct: number;
  };
}

export function FulfillmentRateMetrics({
  metrics,
}: FulfillmentRateMetricsProps) {
  const cards = [
    {
      title: "Avg Fulfillment Rate",
      value: `${metrics.avgFulfillmentRate.toFixed(1)}%`,
      subtitle: metrics.avgFulfillmentRate >= 95 ? "On Target" : "Below Target",
      icon: CheckCircle2,
      badge: {
        variant:
          metrics.avgFulfillmentRate >= 95
            ? ("outline" as const)
            : ("destructive" as const),
        showTrendingDown: metrics.avgFulfillmentRate < 95,
      },
    },
    {
      title: "Suppliers Below 95%",
      value: metrics.suppliersBelow95Count.toString(),
      subtitle: `of ${metrics.totalSuppliers} total suppliers`,
      icon: AlertTriangle,
      iconColor: "text-amber-500",
    },
    {
      title: "Total Purchase Orders",
      value: metrics.totalPOs.toLocaleString(),
      subtitle: "in selected period",
      icon: FileText,
    },
    {
      title: "Total Fulfillment",
      value: `${metrics.totalFulfillmentPct.toFixed(1)}%`,
      subtitle: "across all suppliers",
      icon: CheckCircle2, // Simplified for consistency
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card
            key={card.title}
            className={`@container/card bg-transparent bg-linear-to-t shadow-sm relative col-span-1`}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardDescription className="text-sm font-medium">
                {card.title}
              </CardDescription>
              <Icon
                className={`h-4 w-4 ${card.iconColor || "text-muted-foreground"}`}
              />
            </CardHeader>
            <CardContent>
              <CardTitle className="text-2xl font-bold tabular-nums text-foreground">
                {card.value}
              </CardTitle>
              <div className="flex items-center gap-2 mt-1">
                {card.badge ? (
                  <>
                    <Badge
                      variant={card.badge.variant}
                      className="text-[10px] h-4"
                    >
                      {card.subtitle}
                    </Badge>
                    {card.badge.showTrendingDown && (
                      <TrendingDown className="h-3 w-3 text-destructive" />
                    )}
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    {card.subtitle}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
