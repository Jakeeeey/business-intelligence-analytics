"use client";

import * as React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
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
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { LeadTimeRow } from "../../types";

interface Props {
  rows: LeadTimeRow[];
}

const chartConfig = {
  volume: { label: "PO Volume", color: "#2563eb" },
} satisfies ChartConfig;

function formatMonthLabel(key: number) {
  const d = new Date(key);
  try {
    return d.toLocaleString(undefined, { month: "short", year: "numeric" });
  } catch {
    return new Date(key).toISOString().slice(0, 7);
  }
}

export function POVolumeOverTimeChart({ rows }: Props) {
  const data = React.useMemo(() => {
    const map = new Map<number, number>();

    for (const r of rows) {
      if (!r.poDate) continue;
      const d = new Date(r.poDate);
      if (isNaN(d.getTime())) continue;
      // group by month start
      const key = new Date(d.getFullYear(), d.getMonth(), 1).getTime();
      map.set(key, (map.get(key) ?? 0) + 1);
    }

    const arr = Array.from(map.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([k, v]) => ({
        periodKey: k,
        period: formatMonthLabel(k),
        count: v,
      }));

    return arr;
  }, [rows]);

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>PO Volume Over Time</CardTitle>
          <CardDescription>
            How often this product is ordered (monthly)
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 20, right: 10, left: 0, bottom: 20 }}
            >
              <XAxis
                dataKey="period"
                angle={-30}
                textAnchor="end"
                // height={60}
              />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
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
