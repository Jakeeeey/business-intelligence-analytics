"use client";

import * as React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
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
import { getStatusHex } from "../../utils/getStatusColor";
import type { LeadTimeRow } from "../../types";

interface Props {
  rows: LeadTimeRow[];
}

const chartConfig = {
  pending: { label: "Pending", color: getStatusHex("pending") },
  "on-time": { label: "On Time", color: getStatusHex("on-time") },
  warning: { label: "Warning", color: getStatusHex("warning") },
  delayed: { label: "Delayed", color: getStatusHex("delayed") },
} satisfies ChartConfig;

export function StatusDistributionChart({ rows }: Props) {
  const counts = React.useMemo(() => {
    const map: Record<string, number> = {
      pending: 0,
      "on-time": 0,
      warning: 0,
      delayed: 0,
    };
    for (const r of rows) {
      const k = r.status ?? "pending";
      map[k] = (map[k] ?? 0) + 1;
    }
    return [
      {
        key: "on-time",
        name: "On Time",
        value: map["on-time"] ?? 0,
        color: chartConfig["on-time"].color,
      },
      {
        key: "warning",
        name: "Warning",
        value: map["warning"] ?? 0,
        color: chartConfig["warning"].color,
      },
      {
        key: "delayed",
        name: "Delayed",
        value: map["delayed"] ?? 0,
        color: chartConfig["delayed"].color,
      },
      {
        key: "pending",
        name: "Pending",
        value: map["pending"] ?? 0,
        color: chartConfig["pending"].color,
      },
    ];
  }, [rows]);

  const total = counts.reduce((s, i) => s + (i.value || 0), 0);

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Lead Time Status Breakdown</CardTitle>
          <CardDescription>Distribution of record statuses</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-75 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={counts}
                dataKey="value"
                nameKey="name"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                label={({ percent }) =>
                  percent ? `${(percent * 100).toFixed(0)}%` : ""
                }
              >
                {counts.map((entry, i) => (
                  <Cell key={`cell-${i}`} fill={entry.color} />
                ))}
              </Pie>
              <ChartTooltip content={<ChartTooltipContent />} />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>

        <div className="mt-3 text-sm text-muted-foreground">
          Showing <span className="font-medium">{total}</span> records
        </div>
      </CardContent>
    </Card>
  );
}

export default StatusDistributionChart;
