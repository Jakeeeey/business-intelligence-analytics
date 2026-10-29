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
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { MonthlyCustomerAggregate } from "../types/customer-annual-sales.schema";
import { formatCurrency } from "../utils/customer-annual-sales.utils";

interface CustomerAnnualSalesChartProps {
  data: MonthlyCustomerAggregate[];
  isLoading: boolean;
  unitName?: string;
  amountType?: "netAmount" | "soldAmount" | "returnedAmount";
}

/**
 * Abbreviates numeric value for chart data labels.
 * e.g. 1283860 -> "₱1.28M", 76167 -> "₱76.2K", -50000 -> "-₱50.0K"
 */
function abbreviateValue(value: number, unitName?: string): string {
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);
  const prefix = unitName ? "" : "₱";
  const suffix = unitName ? ` ${unitName}` : "";

  if (abs >= 1_000_000) {
    return `${sign}${prefix}${(abs / 1_000_000).toFixed(2)}M${suffix}`;
  }
  if (abs >= 1_000) {
    return `${sign}${prefix}${(abs / 1_000).toFixed(1)}K${suffix}`;
  }
  return `${sign}${prefix}${abs.toFixed(0)}${suffix}`;
}

interface CustomLabelProps {
  x?: number | string;
  y?: number | string;
  value?: number | string;
  index?: number;
}

/**
 * Renders dual-layer text with SVG paint-order stroke to ensure readability and contrast in dark/light mode
 */
function renderLabel(
  text: string,
  x: number,
  y: number,
  color: string,
  anchor: "middle" | "start" | "end" = "middle"
) {
  return (
    <g>
      {/* Background outline to avoid line & text collision */}
      <text
        x={x}
        y={y}
        fontSize={10}
        fontWeight={700}
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
      {/* High-contrast foreground text */}
      <text
        x={x}
        y={y}
        fontSize={10}
        fontWeight={700}
        textAnchor={anchor}
        fill={color}
      >
        {text}
      </text>
    </g>
  );
}

/**
 * Builds relative label positioning with collision avoidance
 */
function makeLabelRenderer(
  series: "primary" | "returns",
  chartData: { primary: number; returns: number }[],
  maxValue: number,
  color: string,
  unitName?: string
) {
  const otherKey = series === "primary" ? "returns" : "primary";
  const isPrimary = series === "primary";

  return function CustomLabel(props: CustomLabelProps) {
    const { x, y, value, index } = props;
    if (value === undefined || value === null) return null;

    const val = Number(value);
    // Suppress zero labels so baseline doesn't get flooded with ₱0
    if (val === 0) return null;

    const text = abbreviateValue(val, unitName);
    const cx = Number(x) || 0;
    const cy = Number(y) || 0;
    const otherVal = index !== undefined ? (chartData[index]?.[otherKey] ?? 0) : 0;

    let isHigher = val > otherVal;
    const diff = Math.abs(val - otherVal);
    const isVeryClose = diff < maxValue * 0.06;

    if (isVeryClose) {
      isHigher = isPrimary;
    }

    let labelY = isHigher ? cy - 14 : cy + 16;

    // Boundary protection: If Returns value is small (close to baseline), push it UP slightly to avoid colliding with X-axis month names
    if (!isPrimary && val < maxValue * 0.1) {
      labelY = cy - 12;
    }

    return renderLabel(text, cx, labelY, color, "middle");
  };
}

export function CustomerAnnualSalesChart({
  data,
  isLoading,
  unitName,
  amountType = "netAmount",
}: CustomerAnnualSalesChartProps) {
  const normUnit = unitName?.toLowerCase();
  const isUnitQty = normUnit === "pieces" || normUnit === "box";

  if (isLoading) {
    return (
      <Card className="border-border bg-card">
        <CardHeader>
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[350px] w-full rounded-xl" />
        </CardContent>
      </Card>
    );
  }

  const isNetMode = !isUnitQty && amountType === "netAmount";
  const primaryLabel = isUnitQty
    ? "Sold Quantity"
    : isNetMode
    ? "Net Sales"
    : "Sales Orders";
  const primaryColor = isNetMode ? "#10b981" : "#3b82f6";
  const returnsLabelText = isUnitQty ? "Returned Quantity" : "Returns";

  const chartData = data.map((d) => {
    let primaryVal = d.soldAmount;
    if (isUnitQty) {
      primaryVal = d.soldQuantity;
    } else if (isNetMode) {
      primaryVal = d.netAmount;
    }

    const retVal = isUnitQty ? d.returnedQuantity : d.returnedAmount;

    return {
      period: d.monthLabel.slice(0, 3),
      fullPeriod: d.monthLabel,
      primary: primaryVal,
      returns: retVal,
      net: isUnitQty ? d.soldQuantity - d.returnedQuantity : d.netAmount,
    };
  });

  const totalPrimary = chartData.reduce((s, d) => s + d.primary, 0);
  const totalReturns = chartData.reduce((s, d) => s + d.returns, 0);
  const netVariance = data.reduce(
    (s, d) => s + (isUnitQty ? d.soldQuantity - d.returnedQuantity : d.netAmount),
    0
  );

  const maxValue = Math.max(
    ...chartData.map((d) => Math.max(d.primary, d.returns)),
    1
  );

  const primaryLabelRenderer = makeLabelRenderer("primary", chartData, maxValue, primaryColor, unitName);
  const returnsLabelRenderer = makeLabelRenderer("returns", chartData, maxValue, "#dc2626", unitName);

  const dynamicChartConfig = {
    primary: {
      label: primaryLabel,
      color: primaryColor,
    },
    returns: {
      label: returnsLabelText,
      color: "#dc2626",
    },
  } satisfies ChartConfig;

  const chartTitle = isUnitQty
    ? "Monthly Quantity Volume: Sold vs Returned"
    : isNetMode
    ? "Net Sales vs Returns by Month"
    : "Gross Sales Orders vs Returns by Month";

  const chartDescription =
    chartData.length > 0
      ? `${chartData.length} ${chartData.length === 1 ? "month" : "months"} — ${primaryLabel}: ${
          isUnitQty
            ? `${totalPrimary.toLocaleString()} ${unitName}`
            : formatCurrency(totalPrimary)
        } vs ${returnsLabelText}: ${
          isUnitQty
            ? `${totalReturns.toLocaleString()} ${unitName}`
            : formatCurrency(totalReturns)
        }`
      : "No chart data available for the selected filters";

  return (
    <Card className="border-border bg-card text-card-foreground shadow-sm">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <CardTitle className="text-lg font-semibold tracking-tight">
            {chartTitle}
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground mt-0.5">
            {chartDescription}
          </CardDescription>
        </div>

        {/* Legend cleanly positioned in header */}
        <div className="flex items-center gap-4 text-xs font-medium">
          <div className="flex items-center gap-1.5">
            <span
              className="h-2.5 w-2.5 rounded-[2px]"
              style={{ backgroundColor: primaryColor }}
            />
            <span className="text-muted-foreground">{primaryLabel}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-[2px] bg-[#dc2626]" />
            <span className="text-muted-foreground">{returnsLabelText}</span>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <ChartContainer config={dynamicChartConfig} className="aspect-auto h-[350px]">
          <LineChart
            accessibilityLayer
            data={chartData}
            margin={{ left: 56, right: 32, top: 24, bottom: 28 }}
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-muted/40" />
            <XAxis
              dataKey="period"
              tickLine={false}
              axisLine={false}
              tickMargin={12}
              tick={{ fontSize: 12, fontWeight: 500 }}
              className="fill-muted-foreground"
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={12}
              tick={{ fontSize: 11 }}
              className="fill-muted-foreground"
              tickFormatter={(val) => abbreviateValue(val, unitName)}
              domain={[
                (dataMin: number) => (dataMin < 0 ? Math.floor(dataMin * 1.25) : 0),
                (dataMax: number) => Math.ceil(dataMax * 1.25),
              ]}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  formatter={(value, name) => {
                    const label =
                      dynamicChartConfig[name as keyof typeof dynamicChartConfig]?.label ?? name;
                    return [
                      label,
                      unitName
                        ? `${Number(value).toLocaleString()} ${unitName}`
                        : formatCurrency(Number(value)),
                    ];
                  }}
                />
              }
            />
            <Line
              dataKey="primary"
              type="monotone"
              stroke={primaryColor}
              strokeWidth={2}
              dot={{
                r: 4,
                fill: primaryColor,
                stroke: primaryColor,
              }}
              activeDot={{ r: 6 }}
            >
              <LabelList dataKey="primary" content={primaryLabelRenderer} />
            </Line>
            <Line
              dataKey="returns"
              type="monotone"
              stroke="#dc2626"
              strokeWidth={2}
              dot={{
                r: 4,
                fill: "#dc2626",
                stroke: "#dc2626",
              }}
              activeDot={{ r: 6 }}
            >
              <LabelList dataKey="returns" content={returnsLabelRenderer} />
            </Line>
          </LineChart>
        </ChartContainer>

        {chartData.length > 0 && (
          <div className="mt-4 flex items-center justify-center gap-6 text-sm text-muted-foreground border-t border-border pt-4">
            <span>
              Net:{" "}
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                {isUnitQty
                  ? `${netVariance.toLocaleString()} ${unitName}`
                  : formatCurrency(netVariance)}
              </span>{" "}
              Net Sales (Variance)
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
