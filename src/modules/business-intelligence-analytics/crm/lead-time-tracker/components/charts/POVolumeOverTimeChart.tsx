"use client";

import * as React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  LabelList,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from "@/components/ui/chart";
import type { LeadTimeFilters, LeadTimeRow } from "../../types";

interface Props {
  rows: LeadTimeRow[];
  filters: LeadTimeFilters;
}

const chartConfig = {
  volume: { label: "Orders", color: "#2563eb" },
} satisfies ChartConfig;

type VolumeDatum = {
  periodKey: number;
  period: string;
  periodLong: string;
  count: number;
  previousPeriod: string | null;
  previousCount: number | null;
  delta: number | null;
  changePct: number | null;
  trend:
    | "Increasing"
    | "Decreasing"
    | "Stable"
    | "Starting Demand Period"
    | "No Orders";
};

function formatMonthLabelShort(key: number) {
  const d = new Date(key);
  try {
    return d.toLocaleString(undefined, { month: "short", year: "numeric" });
  } catch {
    return new Date(key).toISOString().slice(0, 7);
  }
}

function formatMonthLabelLong(key: number) {
  const d = new Date(key);
  try {
    return d.toLocaleString(undefined, { month: "long", year: "numeric" });
  } catch {
    return new Date(key).toISOString().slice(0, 7);
  }
}

function POVolumeTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload?: VolumeDatum }>;
}) {
  const datum = payload?.[0]?.payload;

  if (!active || !datum) return null;
  const hasPrevious = datum.previousCount != null;
  const isNewFromZeroBaseline =
    hasPrevious && datum.previousCount === 0 && datum.count > 0;

  const delta = datum.delta ?? 0;
  const pct = datum.changePct;
  const comparisonLine = !hasPrevious
    ? null
    : isNewFromZeroBaseline
      ? `vs ${datum.previousPeriod}: +${delta} (initial demand spike)`
      : `vs ${datum.previousPeriod}: ${delta > 0 ? "+" : ""}${delta} (${
          pct != null ? `${Math.round(pct)}%` : "0%"
        })`;
  return (
    <div className="border-border/50 bg-background min-w-55 rounded-lg border px-3 py-2 text-xs shadow-xl">
      <div className="font-semibold text-foreground">{datum.periodLong}</div>

      <div className="text-muted-foreground">
        Orders: {datum.count.toLocaleString()}
      </div>

      <div className="text-muted-foreground">
        {comparisonLine ?? "Starting Demand Period"}
      </div>

      <div className="text-muted-foreground">
        Trend:{" "}
        <span className="font-medium text-foreground">{datum.trend}</span>
      </div>
    </div>
  );
}

function parseLocalDate(value?: string | null) {
  if (!value) return null;
  const datePart = String(value).slice(0, 10);
  const match = datePart.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) {
    return new Date(
      Number(match[1]),
      Number(match[2]) - 1,
      Number(match[3]),
    );
  }
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function POVolumeOverTimeChart({ rows, filters }: Props) {
  const data = React.useMemo<VolumeDatum[]>(() => {
    const map = new Map<number, number>();

    // 1. Aggregate actual PO counts
    for (const r of rows) {
      if (!r.poDate) continue;

      const d = new Date(r.poDate);
      if (isNaN(d.getTime())) continue;

      const key = new Date(d.getFullYear(), d.getMonth(), 1).getTime();
      map.set(key, (map.get(key) ?? 0) + 1);
    }

    // 2. Define time range (min → current month OR max data month)
    const filterStart = parseLocalDate(filters.dateFrom);
    const filterEnd = parseLocalDate(filters.dateTo);
    const startDate = filterStart
      ? new Date(filterStart.getFullYear(), filterStart.getMonth(), 1)
      : new Date();
    const endDate = filterEnd
      ? new Date(filterEnd.getFullYear(), filterEnd.getMonth(), 1)
      : startDate;

    const minKey = startDate.getTime();
    const maxKey = endDate.getTime();
    // 3. Build FULL month sequence (no gaps)
    const fullMonths: number[] = [];
    const cursor = new Date(minKey);

    while (cursor.getTime() <= maxKey) {
      fullMonths.push(cursor.getTime());
      cursor.setMonth(cursor.getMonth() + 1);
    }

    // 4. Map into chart-ready structure (fill missing with 0)
    return fullMonths.map((k, index) => {
      const count = map.get(k) ?? 0;

      const prevKey = index > 0 ? fullMonths[index - 1] : null;
      const previousCount = prevKey != null ? (map.get(prevKey) ?? 0) : null;

      const delta = previousCount == null ? null : count - previousCount;

      const changePct =
        previousCount != null && previousCount !== 0 && delta != null
          ? (delta / previousCount) * 100
          : null;

      const trend: VolumeDatum["trend"] =
        previousCount == null
          ? count === 0
            ? "No Orders"
            : "Starting Demand Period"
          : count === 0 && previousCount === 0
            ? "No Orders"
            : (delta ?? 0) > 0
              ? "Increasing"
              : (delta ?? 0) < 0
                ? "Decreasing"
                : count === 0
                  ? "No Orders"
                  : "Stable";

      return {
        periodKey: k,
        period: formatMonthLabelShort(k),
        periodLong: formatMonthLabelLong(k),
        count,
        previousPeriod: prevKey != null ? formatMonthLabelShort(prevKey) : null,
        previousCount,
        delta,
        changePct,
        trend,
      };
    });
  }, [filters.dateFrom, filters.dateTo, rows]);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Product Order Frequency (Monthly)</CardTitle>
        <CardDescription>
          How often this product is ordered over time
        </CardDescription>
      </CardHeader>

      <CardContent>
        <ChartContainer config={chartConfig} className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{
                top: 20,
                right: 10,
                left: 0,
                bottom: 20,
              }}
            >
              <XAxis dataKey="period" angle={-30} textAnchor="end" />

              <YAxis
                allowDecimals={false}
                width={56}
                label={{
                  value: "Orders",
                  angle: -90,
                  position: "insideLeft",
                }}
              />

              <ChartTooltip content={<POVolumeTooltip />} />

              <Bar dataKey="count" fill={chartConfig.volume.color}>
                <LabelList dataKey="count" position="top" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

export default POVolumeOverTimeChart;
