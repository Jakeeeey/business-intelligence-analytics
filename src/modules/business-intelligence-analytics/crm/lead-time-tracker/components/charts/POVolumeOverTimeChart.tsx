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
import type { LeadTimeRow } from "../../types";

interface Props {
  rows: LeadTimeRow[];
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

  const comparisonLine = !hasPrevious
    ? null
    : datum.previousCount === 0
      ? `vs ${datum.previousPeriod}: +${datum.delta ?? 0} (new demand)`
      : `vs ${datum.previousPeriod}: ${
          datum.delta && datum.delta > 0 ? "+" : ""
        }${datum.delta ?? 0} (${
          datum.changePct != null ? `${Math.round(datum.changePct)}%` : "n/a"
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

export function POVolumeOverTimeChart({ rows }: Props) {
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
    const now = new Date();

    const minKey =
      rows.reduce(
        (min, r) => {
          if (!r.poDate) return min;
          const d = new Date(r.poDate);
          if (isNaN(d.getTime())) return min;
          const key = new Date(d.getFullYear(), d.getMonth(), 1).getTime();
          return min == null ? key : Math.min(min, key);
        },
        null as number | null,
      ) ?? new Date(now.getFullYear(), 0, 1).getTime();

    const maxKey = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

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
  }, [rows]);
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
