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
  unitName?: string;
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
function abbreviateValue(value: number, unitName?: string): string {
  const abs = Math.abs(value);
  const prefix = unitName ? "" : "₱";
  const suffix = unitName ? ` ${unitName}` : "";

  if (abs >= 1_000_000) {
    return `${prefix}${(value / 1_000_000).toFixed(2)}M${suffix}`;
  }
  if (abs >= 1_000) {
    return `${prefix}${(value / 1_000).toFixed(0)}K${suffix}`;
  }
  return `${prefix}${value.toFixed(0)}${suffix}`;
}

interface CustomLabelProps {
  x?: number | string;
  y?: number | string;
  value?: number | string;
  index?: number;
}

/**
 * Build a label renderer for one series.
 * Uses Relative Value Positioning:
 * - The HIGHER value gets pushed UP (above the dot)
 * - The LOWER value gets pushed DOWN (below the dot)
 * This guarantees the labels move away from each other and never overlap.
 */
function makeLabelRenderer(
  series: "sellOut" | "sellIn",
  chartData: { sellOut: number; sellIn: number }[],
  maxValue: number,
  unitName?: string,
) {
  const otherKey = series === "sellOut" ? "sellIn" : "sellOut";
  const isSellOut = series === "sellOut";

  return function CustomLabel(props: CustomLabelProps) {
    const { x, y, value, index } = props;
    if (value === undefined || value === null) return null;

    const text = abbreviateValue(Number(value), unitName);
    const cx = Number(x) || 0;
    const cy = Number(y) || 0;
    const val = Number(value);
    
    const otherVal = index !== undefined ? (chartData[index]?.[otherKey] ?? 0) : 0;

    // Determine position based on relative value
    let isHigher = val > otherVal;
    
    // Tie-breaker if values are very close (within 5% of max value)
    const diff = Math.abs(val - otherVal);
    const isVeryClose = diff < maxValue * 0.05;
    if (isVeryClose) {
      isHigher = isSellOut; // sellOut goes up, sellIn goes down
    }

    // Higher value goes ABOVE (cy - 14), Lower value goes BELOW (cy + 18)
    const labelY = isHigher ? cy - 14 : cy + 18;
    
    return renderLabel(text, cx, labelY, "middle");
  };
}

function renderLabel(
  text: string,
  x: number,
  y: number,
  anchor: "middle" | "start" | "end",
) {
  return (
    <g>
      {/* White outline for readability over lines */}
      <text
        x={x}
        y={y}
        fontSize={10}
        fontWeight={600}
        textAnchor={anchor}
        style={{
          paintOrder: "stroke",
          stroke: "var(--background, white)",
          strokeWidth: 4,
          strokeLinejoin: "round",
        }}
      >
        {text}
      </text>
      {/* Foreground */}
      <text
        x={x}
        y={y}
        fontSize={10}
        fontWeight={600}
        textAnchor={anchor}
        className="fill-foreground"
      >
        {text}
      </text>
    </g>
  );
}

export function AnnualReportV2Chart({ data, isLoading, unitName }: AnnualReportV2ChartProps) {
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

  const sellOutLabel = makeLabelRenderer("sellOut", chartData, maxValue, unitName);
  const sellInLabel = makeLabelRenderer("sellIn", chartData, maxValue, unitName);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sell-In vs Sell-Out by Month</CardTitle>
        <CardDescription>
          {chartData.length > 0
            ? `${chartData.length} ${chartData.length === 1 ? "month" : "months"} — Sell-Out: ${unitName ? totalSellOut.toLocaleString() + ' ' + unitName : formatCurrency(totalSellOut)} vs Sell-In: ${unitName ? totalSellIn.toLocaleString() + ' ' + unitName : formatCurrency(totalSellIn)}`
            : "No chart data available for the selected filters"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="aspect-auto h-[350px]">
          <LineChart
            accessibilityLayer
            data={chartData}
            margin={{ left: 16, right: 24, top: 32, bottom: 24 }}
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
              tickFormatter={(val) => abbreviateValue(val, unitName)}
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
                      unitName ? `${Number(value).toLocaleString()} ${unitName}` : formatCurrency(Number(value), "PHP", "en-PH"),
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
              <LabelList dataKey="sellOut" content={sellOutLabel} />
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
              <LabelList dataKey="sellIn" content={sellInLabel} />
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
