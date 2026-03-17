// src/modules/business-intelligence-analytics/sales-report/sales-report-summary/components/OverviewTab.tsx
"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Sector,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useTheme } from "next-themes";
import type {
  SalesByPeriod,
  SalesmanSummary,
  ProductSummary,
  BranchSummary,
  CustomerSummary,
  SalesTooltipProps,
  BarTooltipProps,
  PieTooltipProps,
  ActivePieShapeProps,
} from "../types";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const CHART_COLORS = [
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#f97316",
  "#22c55e",
  "#14b8a6",
  "#eab308",
  "#ef4444",
  "#6366f1",
  "#06b6d4",
];
const CHART_COLORS_DARK = [
  "#2563eb",
  "#6d28d9",
  "#be185d",
  "#c2410c",
  "#15803d",
  "#0f766e",
  "#a16207",
  "#b91c1c",
  "#4338ca",
  "#0e7490",
];

const phpFmt = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const phpFmtFull = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const numFmt = new Intl.NumberFormat("en-US");

type LineDotProps = {
  cx: number;
  cy: number;
  r: number;
  fill: string;
  stroke: string;
  index: number;
};

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function humanizePeriodKey(key: string): string {
  const m = String(key ?? "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return key;
  return `${MONTH_NAMES[Number(m[2]) - 1]} ${Number(m[3])}, ${m[1]}`;
}

const SalesTooltip = React.memo(
  ({ active, payload, label }: SalesTooltipProps) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="rounded-lg border bg-background p-3 shadow-md text-sm min-w-44 space-y-1">
        <p className="font-semibold">
          {humanizePeriodKey(String(label ?? ""))}
        </p>
        <div className="border-t border-border pt-1.5 space-y-1">
          {payload.map((p) => (
            <div key={String(p.name)} className="flex justify-between gap-4">
              <span
                className="text-muted-foreground"
                style={{ color: p.color ?? "inherit" }}
              >
                {String(p.name)}
              </span>
              <span className="font-medium tabular-nums">
                {phpFmt.format(Number(p.value))}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  },
);
SalesTooltip.displayName = "SalesTooltip";

const BarTooltip = React.memo(({ active, payload }: BarTooltipProps) => {
  if (!active || !payload?.length) return null;
  const item = payload[0]?.payload as
    | { name?: string; fullName?: string }
    | undefined;
  return (
    <div className="rounded-lg border bg-background p-3 shadow-md text-sm min-w-44 space-y-1">
      <p className="font-semibold leading-snug truncate max-w-56">
        {item?.name ?? item?.fullName ?? ""}
      </p>
      <div className="border-t border-border pt-1.5 space-y-1">
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Sales</span>
          <span className="font-medium tabular-nums">
            {phpFmtFull.format(Number(payload[0]?.value))}
          </span>
        </div>
      </div>
    </div>
  );
});
BarTooltip.displayName = "BarTooltip";

const PieTooltip = React.memo(({ active, payload }: PieTooltipProps) => {
  if (!active || !payload?.length) return null;
  const item = payload[0] as {
    name: string;
    value: number;
    payload?: { pct?: string } | Record<string, unknown>;
  };
  return (
    <div className="rounded-lg border bg-background p-3 shadow-md text-sm space-y-1">
      <p className="font-semibold">{item.name}</p>
      <div className="flex justify-between gap-4">
        <span className="text-muted-foreground">Count</span>
        <span className="font-medium">{numFmt.format(item.value)}</span>
      </div>
      <div className="flex justify-between gap-4">
        <span className="text-muted-foreground">Share</span>
        <span className="font-medium">
          {(item.payload as { pct?: string } | undefined)?.pct ?? "0.00"}%
        </span>
      </div>
    </div>
  );
});
PieTooltip.displayName = "PieTooltip";

const InvoiceVolumeTooltip = React.memo(
  ({
    active,
    payload,
    label,
    timePeriod,
  }: {
    active?: boolean;
    payload?: Array<{ value?: number }>;
    label?: string | number;
    timePeriod: string;
  }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="rounded-lg border bg-background p-3 shadow-md text-sm space-y-1 min-w-40">
        <p className="font-semibold">
          {formatPeriodLabel(String(label ?? ""), timePeriod)}
        </p>
        <div className="border-t border-border pt-1.5">
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Invoices</span>
            <span className="font-medium tabular-nums">
              {numFmt.format(Number(payload[0]?.value ?? 0))}
            </span>
          </div>
        </div>
      </div>
    );
  },
);
InvoiceVolumeTooltip.displayName = "InvoiceVolumeTooltip";

// Active pie slice: scale out + slight glow
const ActivePieShape = (props: unknown) => {
  const p = props as ActivePieShapeProps;
  const RADIAN = Math.PI / 180;
  const {
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    startAngle,
    endAngle,
    fill,
  } = p;
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  const sx = cx + (outerRadius + 10) * cos;
  const sy = cy + (outerRadius + 10) * sin;
  const mx = cx + (outerRadius + 20) * cos;
  const my = cy + (outerRadius + 20) * sin;
  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 6}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        style={{ filter: `drop-shadow(0 0 4px ${fill})` }}
      />
      <path d={`M${sx},${sy}L${mx},${my}`} stroke={fill} fill="none" />
    </g>
  );
};

// Formats a period bucket key (YYYY-MM-DD) into a readable label for a given granularity.
// e.g. weekly "2026-03-02" → "Mar 2-8", monthly "2026-03-01" → "Mar 2026"
function formatPeriodLabel(period: string, granularity: string): string {
  if (!period) return period;
  const parts = period.split("-");
  if (parts.length < 3) return period;
  const y = Number(parts[0]);
  const m = Number(parts[1]);
  const d = Number(parts[2]);
  const start = new Date(y, m - 1, d);
  const mon = (dt: Date) => MONTH_NAMES[dt.getMonth()];
  switch (granularity) {
    case "daily":
      return `${mon(start)} ${d}`;
    case "weekly": {
      const end = new Date(y, m - 1, d + 6);
      return start.getMonth() === end.getMonth()
        ? `${mon(start)} ${d}-${end.getDate()}`
        : `${mon(start)} ${d} - ${mon(end)} ${end.getDate()}`;
    }
    case "bi-weekly": {
      const end = new Date(y, m - 1, d + 13);
      return start.getMonth() === end.getMonth()
        ? `${mon(start)} ${d}-${end.getDate()}`
        : `${mon(start)} ${d} - ${mon(end)} ${end.getDate()}`;
    }
    case "monthly":
      return `${mon(start)} ${y}`;
    case "bi-monthly": {
      // bi-monthly spans 2 calendar months from bucket start
      const endMonth = new Date(y, m + 1, 0);
      return `${mon(start)}-${mon(endMonth)} ${y}`;
    }
    case "quarterly": {
      const q = Math.floor((m - 1) / 3) + 1;
      return `Q${q} ${y}`;
    }
    case "semi-annually":
      return `H${m <= 6 ? 1 : 2} ${y}`;
    case "yearly":
      return `${y}`;
    default:
      return period;
  }
}

type OverviewTabProps = {
  salesByPeriod: SalesByPeriod[];
  getSalesByPeriod?: (granularity: string) => SalesByPeriod[];
  topSalesmen: SalesmanSummary[];
  topProducts: ProductSummary[];
  topCustomers: CustomerSummary[];
  statusDistribution: { status: string; count: number }[];
  branchSummaries: BranchSummary[];
  onNavigateToTab: (tab: string) => void;
};

function OverviewTabComponent({
  salesByPeriod,
  getSalesByPeriod,
  topSalesmen,
  topProducts,
  topCustomers,
  statusDistribution,
  branchSummaries,
  onNavigateToTab,
}: OverviewTabProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const colors = isDark ? CHART_COLORS_DARK : CHART_COLORS;

  // Hover state for each chart
  const [activeSalesmanIdx, setActiveSalesmanIdx] = React.useState<
    number | null
  >(null);
  const [activeProductIdx, setActiveProductIdx] = React.useState<number | null>(
    null,
  );
  const [activeCustomerIdx, setActiveCustomerIdx] = React.useState<
    number | null
  >(null);
  const [activeInvoiceIdx, setActiveInvoiceIdx] = React.useState<number | null>(
    null,
  );
  const [activeBranchIdx, setActiveBranchIdx] = React.useState<number | null>(
    null,
  );
  const [activePieIdx, setActivePieIdx] = React.useState<number | undefined>(
    undefined,
  );
  const [hoveredLine, setHoveredLine] = React.useState<string | null>(null);

  const totalPieCount = statusDistribution.reduce((s, d) => s + d.count, 0);
  const pieData = statusDistribution.map((d) => {
    const name = d.status == null || d.status === "" ? "N/A" : d.status;
    return {
      name,
      value: d.count,
      pct:
        totalPieCount > 0
          ? ((d.count / totalPieCount) * 100).toFixed(2)
          : "0.00",
    };
  });

  const salesmanChartData = React.useMemo(
    () =>
      topSalesmen.slice(0, 8).map((s) => ({
        name: s.name.length > 20 ? s.name.slice(0, 20) + "…" : s.name,
        fullName: s.name,
        value: s.totalSales,
      })),
    [topSalesmen],
  );

  const productChartData = React.useMemo(
    () =>
      topProducts.slice(0, 8).map((p) => ({
        name: p.name.length > 22 ? p.name.slice(0, 22) + "…" : p.name,
        fullName: p.name,
        value: p.totalAmount,
      })),
    [topProducts],
  );

  const customerChartData = React.useMemo(
    () =>
      topCustomers.slice(0, 8).map((c) => ({
        name: c.name.length > 22 ? c.name.slice(0, 22) + "…" : c.name,
        fullName: c.name,
        value: c.totalSales,
      })),
    [topCustomers],
  );

  const branchChartData = React.useMemo(
    () =>
      branchSummaries.slice(0, 10).map((b) => ({
        name: b.name.length > 22 ? b.name.slice(0, 22) + "…" : b.name,
        fullName: b.name,
        value: b.totalSales,
      })),
    [branchSummaries],
  );

  const gridColor = isDark ? "#3f3f46" : "#e4e4e7";
  const tickColor = isDark ? "#a1a1aa" : "#71717a";

  const [timePeriod, setTimePeriod] = React.useState<string>("monthly");

  const displayedSalesByPeriod = React.useMemo(() => {
    if (typeof getSalesByPeriod === "function")
      return getSalesByPeriod(timePeriod);
    return salesByPeriod;
  }, [getSalesByPeriod, timePeriod, salesByPeriod]);

  return (
    <div className="space-y-4">
      {/* Revenue Trend */}
      <Card className="dark:border-zinc-700 dark:bg-white/13">
        <CardHeader className="flex items-start gap-4">
          <div className="flex-1">
            <CardTitle>Revenue & Collections Trend</CardTitle>
            <CardDescription>
              {`${timePeriod.charAt(0).toUpperCase()}${timePeriod.slice(1)}`}{" "}
              sales and collections over the selected period
            </CardDescription>
            <div className="flex flex-wrap gap-2  justify-end">
              <Button
                className="dark:border-zinc-700"
                variant={timePeriod === "daily" ? "default" : "outline"}
                size="sm"
                onClick={() => setTimePeriod("daily")}
              >
                Daily
              </Button>
              <Button
                className="dark:border-zinc-700"
                variant={timePeriod === "weekly" ? "default" : "outline"}
                size="sm"
                onClick={() => setTimePeriod("weekly")}
              >
                Weekly
              </Button>
              <Button
                className="dark:border-zinc-700"
                variant={timePeriod === "bi-weekly" ? "default" : "outline"}
                size="sm"
                onClick={() => setTimePeriod("bi-weekly")}
              >
                Bi-Weekly
              </Button>
              <Button
                className="dark:border-zinc-700"
                variant={timePeriod === "monthly" ? "default" : "outline"}
                size="sm"
                onClick={() => setTimePeriod("monthly")}
              >
                Monthly
              </Button>
              <Button
                className="dark:border-zinc-700"
                variant={timePeriod === "bi-monthly" ? "default" : "outline"}
                size="sm"
                onClick={() => setTimePeriod("bi-monthly")}
              >
                Bi-Monthly
              </Button>
              <Button
                className="dark:border-zinc-700"
                variant={timePeriod === "quarterly" ? "default" : "outline"}
                size="sm"
                onClick={() => setTimePeriod("quarterly")}
              >
                Quarterly
              </Button>
              <Button
                className="dark:border-zinc-700"
                variant={timePeriod === "semi-annually" ? "default" : "outline"}
                size="sm"
                onClick={() => setTimePeriod("semi-annually")}
              >
                Semi-Annually
              </Button>
              <Button
                className="dark:border-zinc-700"
                variant={timePeriod === "yearly" ? "default" : "outline"}
                size="sm"
                onClick={() => setTimePeriod("yearly")}
              >
                Yearly
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {displayedSalesByPeriod.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No data available
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart
                data={displayedSalesByPeriod}
                margin={{ top: 4, right: 16, left: 0, bottom: 4 }}
                onMouseLeave={() => setHoveredLine(null)}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis
                  dataKey="period"
                  tick={{ fontSize: 11, fill: tickColor }}
                  tickFormatter={(v) => formatPeriodLabel(v, timePeriod)}
                />
                <YAxis
                  tickFormatter={(v) => phpFmt.format(v)}
                  tick={{ fontSize: 11, fill: tickColor }}
                  width={80}
                />
                <RechartsTooltip
                  content={<SalesTooltip />}
                  cursor={{
                    stroke: gridColor,
                    strokeWidth: 1,
                    strokeDasharray: "4 2",
                  }}
                />
                <Legend
                  onMouseEnter={(e) =>
                    setHoveredLine((e as { dataKey?: string }).dataKey ?? null)
                  }
                  onMouseLeave={() => setHoveredLine(null)}
                />
                <Line
                  type="monotone"
                  dataKey="sales"
                  name="Sales"
                  stroke={colors[0]}
                  strokeWidth={hoveredLine === "sales" ? 3 : 2}
                  strokeOpacity={
                    hoveredLine === null || hoveredLine === "sales" ? 1 : 0.15
                  }
                  dot={(p: unknown) => {
                    const { cx, cy, r, fill, stroke, index } =
                      p as LineDotProps;
                    return (
                      <circle
                        key={`ds-${index}`}
                        cx={cx}
                        cy={cy}
                        r={r ?? 3}
                        fill={fill}
                        stroke={stroke}
                        strokeWidth={1}
                        style={{ cursor: "pointer" }}
                        onMouseEnter={() => setHoveredLine("sales")}
                        onMouseLeave={() => setHoveredLine(null)}
                      />
                    );
                  }}
                  activeDot={(p: unknown) => {
                    const { cx, cy, r, fill, stroke } = p as LineDotProps;
                    return (
                      <circle
                        cx={cx}
                        cy={cy}
                        r={(r ?? 4) + 2}
                        fill={fill}
                        stroke={stroke}
                        strokeWidth={2}
                        style={{ cursor: "pointer" }}
                        onMouseEnter={() => setHoveredLine("sales")}
                        onMouseLeave={() => setHoveredLine(null)}
                      />
                    );
                  }}
                  onMouseEnter={() => setHoveredLine("sales")}
                  onMouseLeave={() => setHoveredLine(null)}
                />
                <Line
                  type="monotone"
                  dataKey="collections"
                  name="Collections"
                  stroke={colors[1]}
                  strokeWidth={hoveredLine === "collections" ? 3 : 2}
                  strokeOpacity={
                    hoveredLine === null || hoveredLine === "collections"
                      ? 1
                      : 0.15
                  }
                  dot={(p: unknown) => {
                    const { cx, cy, r, fill, stroke, index } =
                      p as LineDotProps;
                    return (
                      <circle
                        key={`dc-${index}`}
                        cx={cx}
                        cy={cy}
                        r={r ?? 3}
                        fill={fill}
                        stroke={stroke}
                        strokeWidth={1}
                        style={{ cursor: "pointer" }}
                        onMouseEnter={() => setHoveredLine("collections")}
                        onMouseLeave={() => setHoveredLine(null)}
                      />
                    );
                  }}
                  activeDot={(p: unknown) => {
                    const { cx, cy, r, fill, stroke } = p as LineDotProps;
                    return (
                      <circle
                        cx={cx}
                        cy={cy}
                        r={(r ?? 4) + 2}
                        fill={fill}
                        stroke={stroke}
                        strokeWidth={2}
                        style={{ cursor: "pointer" }}
                        onMouseEnter={() => setHoveredLine("collections")}
                        onMouseLeave={() => setHoveredLine(null)}
                      />
                    );
                  }}
                  strokeDasharray="5 3"
                  onMouseEnter={() => setHoveredLine("collections")}
                  onMouseLeave={() => setHoveredLine(null)}
                />
                <Line
                  type="monotone"
                  dataKey="returns"
                  name="Returns"
                  stroke={colors[3]}
                  strokeWidth={hoveredLine === "returns" ? 3 : 2}
                  strokeOpacity={
                    hoveredLine === null || hoveredLine === "returns" ? 1 : 0.15
                  }
                  dot={(p: unknown) => {
                    const { cx, cy, r, fill, stroke, index } =
                      p as LineDotProps;
                    return (
                      <circle
                        key={`dr-${index}`}
                        cx={cx}
                        cy={cy}
                        r={r ?? 3}
                        fill={fill}
                        stroke={stroke}
                        strokeWidth={1}
                        style={{ cursor: "pointer" }}
                        onMouseEnter={() => setHoveredLine("returns")}
                        onMouseLeave={() => setHoveredLine(null)}
                      />
                    );
                  }}
                  activeDot={(p: unknown) => {
                    const { cx, cy, r, fill, stroke } = p as LineDotProps;
                    return (
                      <circle
                        cx={cx}
                        cy={cy}
                        r={(r ?? 4) + 2}
                        fill={fill}
                        stroke={stroke}
                        strokeWidth={2}
                        style={{ cursor: "pointer" }}
                        onMouseEnter={() => setHoveredLine("returns")}
                        onMouseLeave={() => setHoveredLine(null)}
                      />
                    );
                  }}
                  strokeDasharray="3 3"
                  onMouseEnter={() => setHoveredLine("returns")}
                  onMouseLeave={() => setHoveredLine(null)}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Top Salesmen + Top Products */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Top Salesmen */}
        <Card className="dark:border-zinc-700 dark:bg-white/13">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Top Salesmen</CardTitle>
              <CardDescription>By total sales amount</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 text-xs"
              onClick={() => onNavigateToTab("salesman")}
            >
              View all <ArrowRight className="h-3 w-3" />
            </Button>
          </CardHeader>
          <CardContent>
            {salesmanChartData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No data
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  data={salesmanChartData}
                  layout="vertical"
                  margin={{ top: 4, right: 16, left: 4, bottom: 4 }}
                  onMouseLeave={() => setActiveSalesmanIdx(null)}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={gridColor}
                    horizontal={false}
                  />
                  <XAxis
                    type="number"
                    tickFormatter={(v) => phpFmt.format(v)}
                    tick={{ fontSize: 10, fill: tickColor }}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 10, fill: tickColor }}
                    width={110}
                  />
                  <RechartsTooltip
                    content={<BarTooltip />}
                    cursor={{ fill: "transparent" }}
                  />
                  <Bar
                    dataKey="value"
                    name="Sales"
                    radius={[0, 3, 3, 0]}
                    onMouseEnter={(_, idx) => setActiveSalesmanIdx(idx)}
                  >
                    {salesmanChartData.map((_, i) => (
                      <Cell
                        key={i}
                        fill={colors[i % colors.length]}
                        stroke={
                          activeSalesmanIdx === i
                            ? colors[i % colors.length]
                            : "transparent"
                        }
                        strokeWidth={activeSalesmanIdx === i ? 2 : 0}
                        style={{
                          transition: "stroke 0.15s, filter 0.15s",
                          filter:
                            activeSalesmanIdx === i
                              ? "brightness(1.15)"
                              : "none",
                        }}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card className="dark:border-zinc-700 dark:bg-white/13">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Top Products</CardTitle>
              <CardDescription>By total revenue</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 text-xs"
              onClick={() => onNavigateToTab("product")}
            >
              View all <ArrowRight className="h-3 w-3" />
            </Button>
          </CardHeader>
          <CardContent>
            {productChartData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No data
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  data={productChartData}
                  layout="vertical"
                  margin={{ top: 4, right: 16, left: 4, bottom: 4 }}
                  onMouseLeave={() => setActiveProductIdx(null)}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={gridColor}
                    horizontal={false}
                  />
                  <XAxis
                    type="number"
                    tickFormatter={(v) => phpFmt.format(v)}
                    tick={{ fontSize: 10, fill: tickColor }}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 10, fill: tickColor }}
                    width={130}
                  />
                  <RechartsTooltip
                    content={<BarTooltip />}
                    cursor={{ fill: "transparent" }}
                  />
                  <Bar
                    dataKey="value"
                    name="Revenue"
                    radius={[0, 3, 3, 0]}
                    onMouseEnter={(_, idx) => setActiveProductIdx(idx)}
                  >
                    {productChartData.map((_, i) => (
                      <Cell
                        key={i}
                        fill={colors[i % colors.length]}
                        stroke={
                          activeProductIdx === i
                            ? colors[i % colors.length]
                            : "transparent"
                        }
                        strokeWidth={activeProductIdx === i ? 2 : 0}
                        style={{
                          transition: "stroke 0.15s, filter 0.15s",
                          filter:
                            activeProductIdx === i
                              ? "brightness(1.15)"
                              : "none",
                        }}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Customers + Sales by Branch */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Top Customers */}
        <Card className="dark:border-zinc-700 dark:bg-white/13">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Top Customers</CardTitle>
              <CardDescription>By total sales</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 text-xs"
              onClick={() => onNavigateToTab("customers")}
            >
              View all <ArrowRight className="h-3 w-3" />
            </Button>
          </CardHeader>
          <CardContent>
            {customerChartData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No data
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  data={customerChartData}
                  layout="vertical"
                  margin={{ top: 4, right: 16, left: 4, bottom: 4 }}
                  onMouseLeave={() => setActiveCustomerIdx(null)}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={gridColor}
                    horizontal={false}
                  />
                  <XAxis
                    type="number"
                    tickFormatter={(v) => phpFmt.format(v)}
                    tick={{ fontSize: 10, fill: tickColor }}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 10, fill: tickColor }}
                    width={130}
                  />
                  <RechartsTooltip
                    content={<BarTooltip />}
                    cursor={{ fill: "transparent" }}
                  />
                  <Bar
                    dataKey="value"
                    name="Sales"
                    radius={[0, 3, 3, 0]}
                    onMouseEnter={(_, idx) => setActiveCustomerIdx(idx)}
                  >
                    {customerChartData.map((_, i) => (
                      <Cell
                        key={i}
                        fill={colors[i % colors.length]}
                        stroke={
                          activeCustomerIdx === i
                            ? colors[i % colors.length]
                            : "transparent"
                        }
                        strokeWidth={activeCustomerIdx === i ? 2 : 0}
                        style={{
                          transition: "stroke 0.15s, filter 0.15s",
                          filter:
                            activeCustomerIdx === i
                              ? "brightness(1.15)"
                              : "none",
                        }}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Sales by Branch */}
        <Card className="dark:border-zinc-700 dark:bg-white/13">
          <CardHeader>
            <CardTitle>Sales by Branch</CardTitle>
            <CardDescription>
              Top branches by total sales amount
            </CardDescription>
          </CardHeader>
          <CardContent>
            {branchChartData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No data
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={branchChartData}
                  layout="vertical"
                  margin={{ top: 4, right: 16, left: 4, bottom: 4 }}
                  onMouseLeave={() => setActiveBranchIdx(null)}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={gridColor}
                    horizontal={false}
                  />
                  <XAxis
                    type="number"
                    tickFormatter={(v) => phpFmt.format(v)}
                    tick={{ fontSize: 10, fill: tickColor }}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 10, fill: tickColor }}
                    width={140}
                  />
                  <RechartsTooltip
                    content={<BarTooltip />}
                    cursor={{ fill: "transparent" }}
                  />
                  <Bar
                    dataKey="value"
                    name="Sales"
                    radius={[0, 3, 3, 0]}
                    onMouseEnter={(_, idx) => setActiveBranchIdx(idx)}
                  >
                    {branchChartData.map((_, i) => (
                      <Cell
                        key={i}
                        fill={colors[i % colors.length]}
                        stroke={
                          activeBranchIdx === i
                            ? colors[i % colors.length]
                            : "transparent"
                        }
                        strokeWidth={activeBranchIdx === i ? 2 : 0}
                        style={{
                          transition: "stroke 0.15s, filter 0.15s",
                          filter:
                            activeBranchIdx === i ? "brightness(1.15)" : "none",
                        }}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Status Distribution */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="dark:border-zinc-700 dark:bg-white/13">
          <CardHeader>
            <CardTitle>Transaction Status Distribution</CardTitle>
            <CardDescription>
              Invoice count by transaction status
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            {pieData.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8">No data</p>
            ) : (
              <div className="flex flex-col sm:flex-row items-center gap-6 w-full">
                <ResponsiveContainer width={220} height={220}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                      activeIndex={activePieIdx}
                      activeShape={ActivePieShape}
                      onMouseEnter={(_, idx) => setActivePieIdx(idx)}
                      onMouseLeave={() => setActivePieIdx(undefined)}
                    >
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={colors[i % colors.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip content={<PieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-col gap-2 min-w-0">
                  {pieData.map((d, i) => (
                    <div
                      key={d.name}
                      className="flex items-center gap-2 text-sm"
                    >
                      <div
                        className="h-3 w-3 rounded-full shrink-0"
                        style={{ backgroundColor: colors[i % colors.length] }}
                      />
                      <span className="text-muted-foreground truncate">
                        {d.name}
                      </span>
                      <span className="font-semibold ml-auto tabular-nums pl-3">
                        {numFmt.format(d.value)}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        ({d.pct}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Invoice count by period bar */}
        <Card className="dark:border-zinc-700 dark:bg-white/13">
          <CardHeader>
            <CardTitle>Invoice Volume by Period</CardTitle>
            <CardDescription>
              Number of invoices per{" "}
              {timePeriod === "daily"
                ? "day"
                : timePeriod === "weekly"
                  ? "week"
                  : timePeriod === "bi-weekly"
                    ? "bi-week"
                    : timePeriod === "monthly"
                      ? "month"
                      : timePeriod === "bi-monthly"
                        ? "bi-month"
                        : timePeriod === "quarterly"
                          ? "quarter"
                          : timePeriod === "semi-annually"
                            ? "half-year"
                            : "year"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {displayedSalesByPeriod.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No data
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={displayedSalesByPeriod}
                  margin={{ top: 4, right: 8, left: 0, bottom: 4 }}
                  onMouseLeave={() => setActiveInvoiceIdx(null)}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis
                    dataKey="period"
                    tick={{ fontSize: 11, fill: tickColor }}
                    tickFormatter={(v) => formatPeriodLabel(v, timePeriod)}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: tickColor }}
                  />
                  <RechartsTooltip
                    content={(props: {
                      active?: boolean;
                      payload?: Array<{ value?: number }>;
                      label?: string | number;
                    }) => (
                      <InvoiceVolumeTooltip
                        {...props}
                        timePeriod={timePeriod}
                      />
                    )}
                    cursor={{ fill: "transparent" }}
                  />
                  <Bar
                    dataKey="invoiceCount"
                    name="Invoices"
                    radius={[3, 3, 0, 0]}
                    onMouseEnter={(_, idx) => setActiveInvoiceIdx(idx)}
                  >
                    {displayedSalesByPeriod.map((_, i) => (
                      <Cell
                        key={i}
                        fill={colors[4]}
                        stroke={
                          activeInvoiceIdx === i ? colors[4] : "transparent"
                        }
                        strokeWidth={activeInvoiceIdx === i ? 2 : 0}
                        style={{
                          transition: "stroke 0.15s, filter 0.15s",
                          filter:
                            activeInvoiceIdx === i
                              ? "brightness(1.15)"
                              : "none",
                        }}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export const OverviewTab = React.memo(OverviewTabComponent);
