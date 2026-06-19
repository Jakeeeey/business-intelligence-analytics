"use client";

import * as React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Cell,
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
import type { CustomerLeadTimeRow } from "../../types";
import { computeKpis } from "../../utils/computeKpis";

interface Props {
  rows: CustomerLeadTimeRow[];
}

const chartConfig = {
  approval: { label: "Approval (Days)", color: "#6366F1" },
  picking: { label: "Picking (Days)", color: "#8B5CF6" },
  dispatch: { label: "Dispatch (Days)", color: "#F97316" },
  delivery: { label: "Delivery (Days)", color: "#10B981" },
} satisfies ChartConfig;

type StageDatum = {
  key: "approval" | "picking" | "dispatch" | "delivery";
  stage: string;
  days: number;
  count: number;
  color: string;
};

export function AverageDaysByStageChart({ rows }: Props) {
  const data = React.useMemo<StageDatum[]>(() => {
    const kpis = computeKpis(rows);

    // Count how many rows have valid values for each stage
    let approvalCount = 0,
      pickingCount = 0,
      dispatchCount = 0,
      deliveryCount = 0;

    for (const r of rows) {
      if (typeof r.approvalDays === "number") approvalCount++;
      if (typeof r.pickingDays === "number") pickingCount++;
      if (typeof r.dispatchDays === "number") dispatchCount++;
      if (typeof r.deliveryDays === "number") deliveryCount++;
    }

    return [
      {
        key: "approval",
        stage: "Approval",
        days: Number((kpis.avgApprovalDays ?? 0).toFixed(2)),
        count: approvalCount,
        color: chartConfig.approval.color,
      },
      {
        key: "picking",
        stage: "Picking",
        days: Number((kpis.avgPickingDays ?? 0).toFixed(2)),
        count: pickingCount,
        color: chartConfig.picking.color,
      },
      {
        key: "dispatch",
        stage: "Dispatch",
        days: Number((kpis.avgDispatchDays ?? 0).toFixed(2)),
        count: dispatchCount,
        color: chartConfig.dispatch.color,
      },
      {
        key: "delivery",
        stage: "Delivery",
        days: Number((kpis.avgDeliveryDays ?? 0).toFixed(2)),
        count: deliveryCount,
        color: chartConfig.delivery.color,
      },
    ];
  }, [rows]);

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Average Days by Stage</CardTitle>
          <CardDescription>Where delays most frequently occur</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="aspect-auto h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 20, right: 10, left: 0, bottom: 20 }}
            >
              <XAxis dataKey="stage" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(v) => `${Number(v).toFixed(1)}d`} />
              <ChartTooltip
                content={({ active, payload }) => {
                  const datum = payload?.[0]?.payload as StageDatum | undefined;
                  if (!active || !datum) return null;
                  return (
                    <div className="border-border/50 bg-background min-w-55 rounded-lg border px-3 py-2 text-xs shadow-xl">
                      <div className="font-semibold text-foreground">
                        {datum.stage}
                      </div>
                      <div className="text-muted-foreground">
                        Average: {datum.days.toFixed(1)} Days
                      </div>
                      <div className="text-muted-foreground">
                        Based on: {datum.count.toLocaleString()} Order
                        {datum.count === 1 ? "" : "s"}
                      </div>
                    </div>
                  );
                }}
              />
              <Bar dataKey="days" fill="#2563eb">
                {data.map((entry, i) => (
                  <Cell key={`cell-${i}`} fill={entry.color} />
                ))}
                <LabelList
                  dataKey="days"
                  position="top"
                  formatter={(v: number) =>
                    v == null ? "" : `${Number(v).toFixed(1)}d`
                  }
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

export default AverageDaysByStageChart;
