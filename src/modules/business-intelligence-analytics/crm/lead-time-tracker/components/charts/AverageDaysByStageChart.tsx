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
import type { LeadTimeRow } from "../../types";

interface Props {
  rows: LeadTimeRow[];
}

const chartConfig = {
  approval: { label: "Approval (Days)", color: "#6366F1" },
  dispatch: { label: "Dispatch (Days)", color: "#F97316" },
  delivered: { label: "Delivery (Days)", color: "#10B981" },
} satisfies ChartConfig;

type StageDatum = {
  key: "approval" | "dispatch" | "delivered";
  stage: "Approval" | "Dispatch" | "Delivery";
  days: number;
  count: number;
  color: string;
  status: "Pending" | "On Time" | "Warning" | "Delayed";
};

function interpretStageStatus(
  days: number,
  count: number,
): StageDatum["status"] {
  if (!count) return "Pending";
  if (days <= 1) return "On Time";
  if (days <= 3) return "Warning";
  return "Delayed";
}

function formatDurationForTooltip(days: number) {
  const totalHours = Math.max(0, Math.round(days * 24));
  const dayPart = Math.floor(totalHours / 24);
  const hourPart = totalHours % 24;

  const chunks: string[] = [];
  if (dayPart > 0) chunks.push(`${dayPart} Day${dayPart === 1 ? "" : "s"}`);
  if (hourPart > 0) chunks.push(`${hourPart} Hour${hourPart === 1 ? "" : "s"}`);
  if (!chunks.length) return "0 Hours";
  return chunks.join(" ");
}

function AverageDaysByStageTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload?: StageDatum }>;
}) {
  const datum = payload?.[0]?.payload;

  if (!active || !datum) return null;

  return (
    <div className="border-border/50 bg-background min-w-55 rounded-lg border px-3 py-2 text-xs shadow-xl">
      <div className="font-semibold text-foreground">{datum.stage} Stage</div>
      <div className="text-muted-foreground">
        Average: {formatDurationForTooltip(datum.days)}
      </div>
      <div className="text-muted-foreground">
        Based on: {datum.count.toLocaleString()} Order
        {datum.count === 1 ? "" : "s"}
      </div>
      <div className="text-muted-foreground">
        Status:{" "}
        <span className="font-medium text-foreground">{datum.status}</span>
      </div>
    </div>
  );
}

export function AverageDaysByStageChart({ rows }: Props) {
  const data = React.useMemo<StageDatum[]>(() => {
    let approvalSum = 0,
      approvalCount = 0,
      dispatchSum = 0,
      dispatchCount = 0,
      deliveredSum = 0,
      deliveredCount = 0;

    for (const r of rows) {
      if (typeof r.approval === "number") {
        approvalSum += r.approval;
        approvalCount += 1;
      }
      if (typeof r.dispatch === "number") {
        dispatchSum += r.dispatch;
        dispatchCount += 1;
      }
      if (typeof r.delivered === "number") {
        deliveredSum += r.delivered;
        deliveredCount += 1;
      }
    }

    const approvalAvg = approvalCount ? approvalSum / approvalCount : 0;
    const dispatchAvg = dispatchCount ? dispatchSum / dispatchCount : 0;
    const deliveredAvg = deliveredCount ? deliveredSum / deliveredCount : 0;

    const arr: StageDatum[] = [
      {
        key: "approval",
        stage: "Approval",
        days: Number(approvalAvg.toFixed(2)),
        count: approvalCount,
        color: chartConfig.approval.color,
        status: interpretStageStatus(approvalAvg, approvalCount),
      },
      {
        key: "dispatch",
        stage: "Dispatch",
        days: Number(dispatchAvg.toFixed(2)),
        count: dispatchCount,
        color: chartConfig.dispatch.color,
        status: interpretStageStatus(dispatchAvg, dispatchCount),
      },
      {
        key: "delivered",
        stage: "Delivery",
        days: Number(deliveredAvg.toFixed(2)),
        count: deliveredCount,
        color: chartConfig.delivered.color,
        status: interpretStageStatus(deliveredAvg, deliveredCount),
      },
    ];

    return arr;
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
        <ChartContainer config={chartConfig} className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 20, right: 10, left: 0, bottom: 20 }}
            >
              <XAxis dataKey="stage" />
              <YAxis tickFormatter={(v) => `${Number(v).toFixed(1)}d`} />
              <ChartTooltip content={<AverageDaysByStageTooltip />} />
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
