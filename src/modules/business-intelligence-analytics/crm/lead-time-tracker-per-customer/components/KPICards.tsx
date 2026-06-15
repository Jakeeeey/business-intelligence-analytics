"use client";

import * as React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatNumber } from "@/lib/utils";
import type { CustomerLeadTimeRow } from "../types";
import { computeKpis } from "../utils/computeKpis";

type KPICardsProps = {
  rows: CustomerLeadTimeRow[];
  loading?: boolean;
};

export default function KPICards({ rows, loading = false }: KPICardsProps) {
  const kpiData = React.useMemo(() => computeKpis(rows), [rows]);

  const kpis = [
    {
      title: "Total Orders",
      desc: "Number of SO records",
      value: kpiData.totalOrders,
      suffix: "",
      isTotalDays: false,
    },
    {
      title: "Average Total Days",
      desc: "Mean of totalDays across all orders",
      value: kpiData.avgTotalDays,
      suffix: " Days",
      isTotalDays: true,
    },
    {
      title: "Fastest Order",
      desc: "Minimum totalDays",
      value: kpiData.fastestOrder,
      suffix: " Days",
      isTotalDays: true,
    },
    {
      title: "Slowest Order",
      desc: "Maximum totalDays",
      value: kpiData.slowestOrder,
      suffix: " Days",
      isTotalDays: true,
    },
  ];

  return (
    <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      {kpis.map((k, i) => {
        const val = k.value;
        // Determine card styling based on metric type
        let cardClass = "shadow-sm gap-0";
        let valueClass = "";

        if (k.isTotalDays && val != null) {
          if (val <= 3) {
            cardClass +=
              " bg-emerald-50 dark:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-600";
            valueClass = "text-emerald-800 dark:text-emerald-100";
          } else if (val <= 7) {
            cardClass +=
              " bg-orange-50 dark:bg-orange-900/40 border border-orange-100 dark:border-orange-600";
            valueClass = "text-orange-700 dark:text-orange-100";
          } else {
            cardClass +=
              " bg-red-50 dark:bg-red-900/40 border border-red-100 dark:border-red-600";
            valueClass = "text-red-700 dark:text-red-100";
          }
        } else {
          cardClass += " bg-white dark:bg-transparent";
        }

        return (
          <Card key={i} className={cardClass}>
            <CardHeader className="flex items-center justify-between px-4">
              <div className="text-sm text-muted-foreground">{k.title}</div>
              <div className="flex items-center gap-2">
                {k.isTotalDays && val != null ? (
                  val <= 3 ? (
                    <span className="flex items-center gap-2">
                      <span
                        className="inline-block h-3 w-3 rounded-full bg-emerald-500"
                        aria-hidden
                      />
                      <span className="text-xs text-emerald-600 dark:text-emerald-200">
                        Excellent
                      </span>
                    </span>
                  ) : val <= 7 ? (
                    <span className="flex items-center gap-2">
                      <span
                        className="inline-block h-3 w-3 rounded-full bg-orange-500"
                        aria-hidden
                      />
                      <span className="text-xs text-orange-700 dark:text-orange-200">
                        Acceptable
                      </span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <span
                        className="inline-block h-3 w-3 rounded-full bg-red-500"
                        aria-hidden
                      />
                      <span className="text-xs text-red-700 dark:text-red-200">
                        Needs Attention
                      </span>
                    </span>
                  )
                ) : null}
              </div>
            </CardHeader>
            <CardContent className="px-4 py-4">
              <div className={`text-2xl font-bold tabular-nums ${valueClass}`}>
                {loading ? (
                  <Skeleton className="h-6 w-16" />
                ) : val == null ? (
                  "—"
                ) : (
                  formatNumber(val, "en-PH", k.isTotalDays ? 1 : 0) + k.suffix
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
