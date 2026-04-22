"use client";

import * as React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
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
  ChartTooltipContent,
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

export function AverageDaysByStageChart({ rows }: Props) {
  const data = React.useMemo(() => {
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

    const arr = [
      {
        key: "approval",
        stage: "Approval",
        days: Number(approvalAvg.toFixed(1)),
        color: chartConfig.approval.color,
      },
      {
        key: "dispatch",
        stage: "Dispatch",
        days: Number(dispatchAvg.toFixed(1)),
        color: chartConfig.dispatch.color,
      },
      {
        key: "delivered",
        stage: "Delivery",
        days: Number(deliveredAvg.toFixed(1)),
        color: chartConfig.delivered.color,
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
              margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
            >
              <XAxis dataKey="stage" />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="days" fill="#2563eb">
                {data.map((entry, i) => (
                  <Cell key={`cell-${i}`} fill={entry.color} />
                ))}
                <LabelList
                  dataKey="days"
                  position="top"
                  formatter={(v: number) => (v == null ? "" : `${v}d`)}
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
