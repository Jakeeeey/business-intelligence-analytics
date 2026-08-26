"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Line,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  LabelList,
} from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { formatCurrency } from "@/lib/utils";
import type { MonthlyAggregate } from "../types/annual-report.schema";

interface AnnualReportV2ChartProps {
  data: MonthlyAggregate[];
  isLoading: boolean;
}

const chartConfig = {
  sellOut: {
    label: "Sell-Out (Sales)",
    color: "#3b82f6",
  },
  sellIn: {
    label: "Sell-In (Purchases)",
    color: "#dc2626",
  },
} satisfies ChartConfig;

/**
 * Abbreviates a numeric value for chart data labels.
 * e.g. 9410000 → "₱9.41M", 536000 → "₱536K"
 */
function abbreviateValue(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) {
    return `₱${(value / 1_000_000).toFixed(2)}M`;
  }
  if (abs >= 1_000) {
    return `₱${(value / 1_000).toFixed(0)}K`;
  }
  return `₱${value.toFixed(0)}`;
}

const CustomSellOutLabel = (props: any) => {
  const { x, y, value, maxValue } = props;
  if (value === undefined || value === null) return null;
  const isLow = Number(value) < (maxValue || 0) * 0.15;
  if (isLow) {
    return (
      <text
        x={x - 24}
        y={y + 4}
        fill="currentColor"
        fontSize={10}
        fontWeight={500}
        textAnchor="end"
        className="fill-foreground"
      >
        {abbreviateValue(Number(value))}
      </text>
    );
  }
  return (
    <text
      x={x}
      y={y - 10}
      fill="currentColor"
      fontSize={10}
      fontWeight={500}
      textAnchor="middle"
      className="fill-foreground"
    >
      {abbreviateValue(Number(value))}
    </text>
  );
};

const CustomSellInLabel = (props: any) => {
  const { x, y, value, maxValue } = props;
  if (value === undefined || value === null) return null;
  const isLow = Number(value) < (maxValue || 0) * 0.15;
  if (isLow) {
    return (
      <text
        x={x + 24}
        y={y + 4}
        fill="currentColor"
        fontSize={10}
        fontWeight={500}
        textAnchor="start"
        className="fill-foreground"
      >
        {abbreviateValue(Number(value))}
      </text>
    );
  }
  return (
    <text
      x={x}
      y={y + 16}
      fill="currentColor"
      fontSize={10}
      fontWeight={500}
      textAnchor="middle"
      className="fill-foreground"
    >
      {abbreviateValue(Number(value))}
    </text>
  );
};

export function AnnualReportV2Chart({ data, isLoading }: AnnualReportV2ChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-3 w-64 mt-1" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[350px] w-full rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map((d) => ({
    period: d.monthLabel,
    sellOut: d.totalSales,
    sellIn: d.totalPurchases,
  }));

  const totalSellOut = data.reduce((s, d) => s + d.totalSales, 0);
  const totalSellIn = data.reduce((s, d) => s + d.totalPurchases, 0);
  const netDirection = totalSellOut >= totalSellIn ? "positive" : "negative";

  const maxValue = Math.max(
    ...data.map((d) => Math.max(d.totalSales, d.totalPurchases)),
    1,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sell-In vs Sell-Out by Month</CardTitle>
        <CardDescription>
          {chartData.length > 0
            ? `${chartData.length} ${chartData.length === 1 ? "month" : "months"} — Sell-Out: ${formatCurrency(totalSellOut)} vs Sell-In: ${formatCurrency(totalSellIn)}`
            : "No chart data available for the selected filters"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="aspect-auto h-[350px]">
          <LineChart
            accessibilityLayer
            data={chartData}
            margin={{ left: 12, right: 12, top: 24, bottom: 1 }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="period"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tick={{ fontSize: 12, fontWeight: 500 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tick={{ fontSize: 11 }}
              tickFormatter={(value: number) =>
                value >= 1e6
                  ? `${(value / 1e6).toFixed(1)}M`
                  : value >= 1e3
                    ? `${(value / 1e3).toFixed(1)}K`
                    : String(value)
              }
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  formatter={(value, name) => {
                    const label =
                      chartConfig[name as keyof typeof chartConfig]?.label ??
                      name;
                    return [
                      label,
                      formatCurrency(Number(value), "PHP", "en-PH"),
                    ];
                  }}
                />
              }
            />
            <ChartLegend
              verticalAlign="top"
              content={<ChartLegendContent />}
            />
            <Line
              dataKey="sellOut"
              type="monotone"
              stroke="var(--color-sellOut)"
              strokeWidth={2}
              dot={{
                r: 4,
                fill: "var(--color-sellOut)",
                stroke: "var(--color-sellOut)",
              }}
              activeDot={{ r: 6 }}
            >
              <LabelList
                dataKey="sellOut"
                content={<CustomSellOutLabel maxValue={maxValue} />}
              />
            </Line>
            <Line
              dataKey="sellIn"
              type="monotone"
              stroke="var(--color-sellIn)"
              strokeWidth={2}
              dot={{
                r: 4,
                fill: "var(--color-sellIn)",
                stroke: "var(--color-sellIn)",
              }}
              activeDot={{ r: 6 }}
            >
              <LabelList
                dataKey="sellIn"
                content={<CustomSellInLabel maxValue={maxValue} />}
              />
            </Line>
          </LineChart>
        </ChartContainer>
        {chartData.length > 0 && (
          <div className="mt-4 flex items-center justify-center gap-6 text-sm text-muted-foreground border-t pt-4">
            <span>
              Net:{" "}
              <span className={netDirection === "positive" ? "text-green-600 dark:text-green-400 font-medium" : "text-red-600 dark:text-red-400 font-medium"}>
                {formatCurrency(Math.abs(totalSellOut - totalSellIn))}
              </span>{" "}
              {netDirection === "positive" ? "more Sell-Out" : "more Sell-In"}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
