"use client";

import * as React from "react";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
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
  approval: { label: "Approval (Days)", color: "var(--primary)" },
  dispatch: { label: "Dispatch (Days)", color: "#64748b" },
  delivered: { label: "Delivered (Days)", color: "#0ea5a4" },
} satisfies ChartConfig;

function fmtDateLabel(d: string) {
  try {
    const t = new Date(d);
    if (isNaN(t.getTime())) return d;
    return t.toLocaleDateString();
  } catch {
    return d;
  }
}

export function LeadTimeTrendChart({ rows }: Props) {
  const data = React.useMemo(() => {
    // group by poDate (YYYY-MM-DD) and compute averages
    const map = new Map<
      string,
      {
        approvalSum: number;
        approvalCount: number;
        dispatchSum: number;
        dispatchCount: number;
        deliveredSum: number;
        deliveredCount: number;
      }
    >();

    for (const r of rows) {
      const key = (r.poDate || "").slice(0, 10) || "Unknown";
      const entry = map.get(key) ?? {
        approvalSum: 0,
        approvalCount: 0,
        dispatchSum: 0,
        dispatchCount: 0,
        deliveredSum: 0,
        deliveredCount: 0,
      };
      if (typeof r.approval === "number") {
        entry.approvalSum += r.approval;
        entry.approvalCount += 1;
      }
      if (typeof r.dispatch === "number") {
        entry.dispatchSum += r.dispatch;
        entry.dispatchCount += 1;
      }
      if (typeof r.delivered === "number") {
        entry.deliveredSum += r.delivered;
        entry.deliveredCount += 1;
      }
      map.set(key, entry);
    }

    const arr: Array<Record<string, unknown>> = [];
    for (const [k, v] of map.entries()) {
      arr.push({
        date: k,
        approval: v.approvalCount ? v.approvalSum / v.approvalCount : null,
        dispatch: v.dispatchCount ? v.dispatchSum / v.dispatchCount : null,
        delivered: v.deliveredCount ? v.deliveredSum / v.deliveredCount : null,
      });
    }

    arr.sort((a, b) => {
      const at = new Date(String(a.date)).getTime();
      const bt = new Date(String(b.date)).getTime();
      return Number.isNaN(at) || Number.isNaN(bt) ? 0 : at - bt;
    });

    return arr;
  }, [rows]);

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Lead Time Trend</CardTitle>
          <CardDescription>
            Average lead time over time (by PO Date)
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-90 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 10, right: 20, left: 0, bottom: 40 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={fmtDateLabel}
                angle={-30}
                textAnchor="end"
                height={60}
              />
              <YAxis
                tickFormatter={(v) =>
                  v == null ? "-" : `${Math.round(Number(v))}d`
                }
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend />
              <Line
                type="monotone"
                dataKey="approval"
                dot={false}
                stroke="var(--color-approval)"
                strokeWidth={2}
                connectNulls
              >
                <LabelList
                  dataKey="approval"
                  position="top"
                  formatter={(v: number) =>
                    v == null ? "" : `${v.toFixed(1)}d`
                  }
                />
              </Line>
              <Line
                type="monotone"
                dataKey="dispatch"
                dot={false}
                stroke="var(--color-dispatch)"
                strokeWidth={2}
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="delivered"
                dot={false}
                stroke="var(--color-delivered)"
                strokeWidth={2}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

export default LeadTimeTrendChart;
