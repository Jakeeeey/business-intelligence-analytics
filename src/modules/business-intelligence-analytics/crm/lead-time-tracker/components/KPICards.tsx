"use client";

import * as React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatNumber } from "@/lib/utils";
import type { LeadTimeRow } from "../types";

type KPICardsProps = {
  rows: LeadTimeRow[];
  loading?: boolean;
};

function mean(values: Array<number | null | undefined>): number | null {
  const nums = values.filter((v): v is number => typeof v === "number");
  if (nums.length === 0) return null;
  return nums.reduce((s, n) => s + n, 0) / nums.length;
}

export default function KPICards({ rows, loading = false }: KPICardsProps) {
  const approvalAvg = mean(rows.map((r) => r.approval));
  const dispatchAvg = mean(rows.map((r) => r.dispatch));
  const deliveredAvg = mean(rows.map((r) => r.delivered));

  const kpis = [
    {
      title: "Average Approval",
      desc: "Mean of approvalDays",
      value: approvalAvg,
    },
    {
      title: "Average Dispatch",
      desc: "Mean of fulfillmentDays",
      value: dispatchAvg,
    },
    {
      title: "Average Delivered",
      desc: "Mean of deliveryDays",
      value: deliveredAvg,
    },
  ];

  return (
    <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {kpis.map((k, i) => {
        const avg = k.value;
        // Determine card background + border and value color based on ranges
        let cardClass = "shadow-sm gap-0";
        let valueClass = "";
        if (avg == null) {
          cardClass += " bg-white dark:bg-transparent";
        } else if (avg <= 1) {
          cardClass +=
            " bg-emerald-50 dark:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-600";
          valueClass = "text-emerald-800 dark:text-emerald-100";
        } else if (avg <= 3) {
          cardClass +=
            " bg-orange-50 dark:bg-orange-900/40 border border-orange-100 dark:border-orange-600";
          valueClass = "text-orange-700 dark:text-orange-100";
        } else {
          cardClass +=
            " bg-red-50 dark:bg-red-900/40 border border-red-100 dark:border-red-600";
          valueClass = "text-red-700 dark:text-red-100";
        }

        return (
          <Card key={i} className={cardClass}>
            <CardHeader className="flex items-center justify-between px-4">
              <div className="text-sm text-muted-foreground">{k.title}</div>
              <div className="flex items-center gap-2">
                {avg == null ? (
                  <span className="text-xs text-muted-foreground">N/A</span>
                ) : avg <= 1 ? (
                  <span className="flex items-center gap-2">
                    <span
                      className="inline-block h-3 w-3 rounded-full bg-emerald-500"
                      aria-hidden
                    />
                    <span className="text-xs text-emerald-600 dark:text-emerald-200">
                      Excellent
                    </span>
                  </span>
                ) : avg <= 3 ? (
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
                      Poor
                    </span>
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent className="px-4 py-4">
              <div className={`text-2xl font-bold tabular-nums ${valueClass}`}>
                {loading ? (
                  <Skeleton className="h-6 w-16" />
                ) : k.value == null ? (
                  "—"
                ) : (
                  formatNumber(k.value, "en-PH", 1) + " Days"
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
