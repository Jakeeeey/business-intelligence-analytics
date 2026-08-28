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

interface CustomLabelProps {
  x?: number | string;
  y?: number | string;
  value?: number | string;
  index?: number;
  maxValue?: number;
  chartData?: { sellOut: number; sellIn: number }[];
  series?: "sellOut" | "sellIn";
}

// Proximity threshold: if the two values are within 8% of the max, labels get extra separation
const PROXIMITY_THRESHOLD = 0.08;

function makeLabelRenderer(
  series: "sellOut" | "sellIn",
  chartData: { sellOut: number; sellIn: number }[],
  maxValue: number,
) {
  return function CustomLabel(props: CustomLabelProps) {
    const { x, y, value, index } = props;
    if (value === undefined || value === null) return null;

    const text = abbreviateValue(Number(value));
    const cx = Number(x) || 0;
    const cy = Number(y) || 0;
    const val = Number(value);

    // Get the other series value at same index to check proximity
    const otherKey = series === "sellOut" ? "sellIn" : "sellOut";
    const otherVal = index !== undefined ? (chartData[index]?.[otherKey] ?? 0) : 0;
    const diff = Math.abs(val - otherVal);
    const isClose = diff / maxValue < PROXIMITY_THRESHOLD;
    const isLow = val < maxValue * 0.15;

    let labelX = cx;
    let labelY: number;
    let anchor: "middle" | "start" | "end" = "middle";

    if (isLow) {
      // Near bottom edge — push to the side
      labelY = cy + 4;
      labelX = series === "sellOut" ? cx - 26 : cx + 26;
      anchor = series === "sellOut" ? "end" : "start";
    } else if (isClose) {
      // Lines crossing / very close — force strong vertical separation
      labelY = series === "sellOut" ? cy - 20 : cy + 24;
    } else {
      // Normal: sellOut above dot, sellIn below dot
      labelY = series === "sellOut" ? cy - 14 : cy + 18;
    }

    return (
      <g>
        {/* Outline pass for readability over lines/dots */}
        <text
          x={labelX}
          y={labelY}
          fontSize={10}
          fontWeight={600}
          textAnchor={anchor}
          style={{
            paintOrder: "stroke",
            stroke: "var(--background, white)",
            strokeWidth: 3,
            strokeLinejoin: "round",
          }}
        >
          {text}
        </text>
        {/* Foreground pass */}
        <text
          x={labelX}
          y={labelY}
          fill="currentColor"
          fontSize={10}
          fontWeight={600}
          textAnchor={anchor}
          className="fill-foreground"
        >
          {text}
        </text>
      </g>
    );
  };
}


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

  const sellOutLabelRenderer = makeLabelRenderer("sellOut", chartData, maxValue);
  const sellInLabelRenderer = makeLabelRenderer("sellIn", chartData, maxValue);

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
          margin={{ left: 12, right: 40, top: 28, bottom: 4 }}
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
                content={sellOutLabelRenderer as any}
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
                content={sellInLabelRenderer as any}
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
