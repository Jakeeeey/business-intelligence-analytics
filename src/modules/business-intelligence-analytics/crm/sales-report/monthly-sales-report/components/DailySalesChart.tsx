"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const formatVal = (v: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(v);
};

const formatDateRange = (fromStr: string, toStr: string) => {
  const parse = (str: string) => {
    if (!str) return null;
    const parts = str.split("-").map(Number);
    if (parts.length < 3) return null;
    return new Date(parts[0], parts[1] - 1, parts[2]);
  };

  const fromDate = parse(fromStr);
  const toDate = parse(toStr);

  const opt: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" };
  const fromFmt = fromDate ? fromDate.toLocaleDateString("en-US", opt) : fromStr;
  const toFmt = toDate ? toDate.toLocaleDateString("en-US", opt) : toStr;

  return `${fromFmt} – ${toFmt}`;
};

type DailySalesChartProps = {
  data: { dateKey: string; label: string; dateStr: string; amount: number }[];
  dateFrom: string;
  dateTo: string;
};

export default function DailySalesChart({ data, dateFrom, dateTo }: DailySalesChartProps) {
  const totalPeriodSales = React.useMemo(() => {
    return data.reduce((acc, item) => acc + item.amount, 0);
  }, [data]);

  return (
    <Card className="border shadow-xs overflow-hidden">
      <CardHeader className="bg-muted/30 border-b px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <CardTitle className="text-base font-bold tracking-tight text-foreground">
            Daily Sales Trend
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Performance for {formatDateRange(dateFrom, dateTo)}
          </p>
        </div>
        <div className="text-right">
          <span className="text-xs text-muted-foreground block">Total Period Sales</span>
          <span className="text-lg font-black tracking-tight text-primary">
            {formatVal(totalPeriodSales)}
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
            >
              <defs>
                <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted/40" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                dy={8}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0].payload as typeof data[0];
                    return (
                      <div className="bg-background/95 border shadow-md rounded-lg p-2.5 text-xs backdrop-blur-xs">
                        <span className="font-bold text-muted-foreground block mb-1">
                          {item.dateStr}
                        </span>
                        <span className={`font-black text-sm ${item.amount < 0 ? "text-destructive" : "text-primary"}`}>
                          {formatVal(item.amount)}
                        </span>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="amount"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#salesGrad)"
                activeDot={{ r: 5, strokeWidth: 0, fill: "hsl(var(--primary))" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
