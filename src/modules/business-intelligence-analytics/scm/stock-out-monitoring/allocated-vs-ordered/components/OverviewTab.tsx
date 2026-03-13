"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Sector,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "next-themes";
import type {
  AllocationByPeriod,
  ProductAllocationSummary,
  SupplierAllocationSummary,
  Granularity,
  LineTooltipProps,
} from "../types";

/* ─── Helpers ───────────────────────────────────────────────── */

function numFmt(n: number) {
  return n.toLocaleString("en-PH", { maximumFractionDigits: 2 });
}
function pctFmt(n: number) {
  return `${n.toFixed(1)}%`;
}

const MONTHS_SHORT = [
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

const GRANULARITY_LABELS: Record<Granularity, string> = {
  daily: "Daily",
  weekly: "Weekly",
  biweekly: "Bi-Weekly",
  monthly: "Monthly",
  bimonthly: "Bi-Monthly",
  quarterly: "Quarterly",
  semiannually: "Semi-Annually",
  yearly: "Yearly",
};

function humanizePeriodKey(key: string, granularity: Granularity): string {
  const m = String(key ?? "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return key;

  const y = Number(m[1]);
  const mo = Number(m[2]);
  const day = Number(m[3]);
  const start = new Date(y, mo - 1, day);
  const mon = (dt: Date) => MONTHS_SHORT[dt.getMonth()];

  if (granularity === "daily") {
    return `${mon(start)} ${day}`;
  }
  if (granularity === "weekly") {
    const end = new Date(y, mo - 1, day + 6);
    return start.getMonth() === end.getMonth()
      ? `${mon(start)} ${day}-${end.getDate()}`
      : `${mon(start)} ${day} - ${mon(end)} ${end.getDate()}`;
  }
  if (granularity === "biweekly") {
    const end = new Date(y, mo - 1, day + 13);
    return start.getMonth() === end.getMonth()
      ? `${mon(start)} ${day}-${end.getDate()}`
      : `${mon(start)} ${day} - ${mon(end)} ${end.getDate()}`;
  }
  if (granularity === "monthly") {
    return `${mon(start)} ${y}`;
  }
  if (granularity === "bimonthly") {
    const endMonth = new Date(y, mo + 1, 0);
    return `${mon(start)}-${mon(endMonth)} ${y}`;
  }
  if (granularity === "quarterly") {
    const q = Math.floor((mo - 1) / 3) + 1;
    return `Q${q} ${y}`;
  }
  if (granularity === "semiannually") {
    return `H${mo <= 6 ? 1 : 2} ${y}`;
  }
  if (granularity === "yearly") {
    return `${y}`;
  }
  return key;
}

/* ─── Colors ─────────────────────────────────────────────────── */

const ALLOCATION_COLORS = {
  totalOrdered: "#6366f1",
  totalAllocated: "#10b981",
  allocationGap: "#ef4444",
};

const STATUS_COLORS = ["#10b981", "#f59e0b", "#ef4444"];

const chartColors = [
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
const chartColorsDark = [
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

/* ─── Custom Tooltips ────────────────────────────────────────── */

const TrendTooltip = React.memo(function TrendTooltip({
  active,
  payload,
  label,
}: LineTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-background p-3 shadow-lg text-xs space-y-1 pointer-events-none">
      <p className="font-semibold text-muted-foreground mb-1">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex justify-between gap-4">
          <span style={{ color: p.color }}>{p.name}</span>
          <span className="font-medium tabular-nums">
            {numFmt(p.value ?? 0)}
          </span>
        </div>
      ))}
    </div>
  );
});

const GapTooltip = React.memo(function GapTooltip({
  active,
  payload,
  label,
}: LineTooltipProps) {
  if (!active || !payload?.length) return null;
  const gap = payload[0]?.value ?? 0;
  return (
    <div className="rounded-lg border bg-background p-3 shadow-lg text-xs space-y-1 pointer-events-none">
      <p className="font-semibold text-muted-foreground mb-1">{label}</p>
      <div className="flex justify-between gap-4">
        <span className="text-rose-500">Gap</span>
        <span className="font-medium text-rose-500 tabular-nums">
          {numFmt(gap)}
        </span>
      </div>
    </div>
  );
});

const CustomBarTooltip = React.memo(function CustomBarTooltip({
  active,
  payload,
  data,
  valueKey,
  nameKey,
  valueLabel = "Value",
}: {
  active?: boolean;
  payload?: Array<{ payload?: Record<string, unknown>; value?: number }>;
  data: Array<Record<string, unknown>>;
  valueKey: string;
  nameKey: string;
  valueLabel?: string;
}) {
  if (!active || !payload?.length) return null;
  const item = (payload[0]?.payload || {}) as Record<string, unknown>;
  const name = String(item[nameKey] || "");
  const value = Number(item[valueKey] || 0);
  const total = data.reduce((s, d) => s + Number(d[valueKey] || 0), 0);
  const contribution = total > 0 ? ((value / total) * 100).toFixed(1) : "0.0";
  const rank = data.findIndex((d) => String(d[nameKey]) === name) + 1;
  return (
    <div className="rounded-lg border bg-background p-3 shadow-md text-sm min-w-48 space-y-1 pointer-events-none">
      <p className="font-semibold text-foreground leading-snug line-clamp-2">
        {name}
      </p>
      <div className="border-t border-border pt-1.5 space-y-1">
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">{valueLabel}</span>
          <span className="font-medium tabular-nums">{numFmt(value)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Contribution</span>
          <span className="font-medium">{contribution}%</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Rank</span>
          <span className="font-medium">#{rank}</span>
        </div>
        <p className="text-[10px] text-primary pt-0.5 italic">
          Click for quick insights
        </p>
      </div>
    </div>
  );
});

/* ─── Custom Axis Ticks (Clickable + Word-Wrapped) ───────────── */

function CustomXAxisTick({
  x,
  y,
  payload,
  onClick,
}: {
  x?: number;
  y?: number;
  payload?: { value: string };
  onClick?: (name: string) => void;
}) {
  if (!payload || x == null || y == null) return null;
  const fullName = payload.value || "";
  const maxChars = 13;
  const words = fullName.split(/\s+/);
  let line1 = "";
  let line2 = "";
  for (const w of words) {
    if (!line1 || line1.length + w.length + 1 <= maxChars) {
      line1 += (line1 ? " " : "") + w;
    } else if (!line2 || line2.length + w.length + 1 <= maxChars) {
      line2 += (line2 ? " " : "") + w;
    }
  }
  if (line2.length > maxChars) line2 = line2.slice(0, maxChars - 1) + "…";
  return (
    <g transform={`translate(${x},${y + 4})`}>
      <text
        textAnchor="end"
        fill="currentColor"
        fontSize={10}
        cursor={onClick ? "pointer" : "default"}
        onClick={onClick ? () => onClick(fullName) : undefined}
        transform="rotate(-30)"
        style={{ transition: "opacity 0.12s" }}
      >
        <tspan x={0} dy="0">
          {line1}
        </tspan>
        {line2 && (
          <tspan x={0} dy="11">
            {line2}
          </tspan>
        )}
      </text>
    </g>
  );
}

function CustomYAxisTick({
  x,
  y,
  payload,
  onClick,
}: {
  x?: number;
  y?: number;
  payload?: { value: string };
  onClick?: (name: string) => void;
}) {
  if (!payload || x == null || y == null) return null;
  const fullName = payload.value || "";
  const maxChars = 18;
  const words = fullName.split(/\s+/);
  let line1 = "";
  let line2 = "";
  for (const w of words) {
    if (!line1 || line1.length + w.length + 1 <= maxChars) {
      line1 += (line1 ? " " : "") + w;
    } else if (!line2 || line2.length + w.length + 1 <= maxChars) {
      line2 += (line2 ? " " : "") + w;
    }
  }
  if (line2.length > maxChars) line2 = line2.slice(0, maxChars - 1) + "…";
  const hasTwoLines = !!line2;
  const dy0 = hasTwoLines ? -6 : 4;
  return (
    <g transform={`translate(${x},${y})`}>
      <text
        textAnchor="end"
        fill="currentColor"
        fontSize={10}
        cursor={onClick ? "pointer" : "default"}
        onClick={onClick ? () => onClick(fullName) : undefined}
        style={{ transition: "opacity 0.12s" }}
      >
        <tspan x={0} dy={dy0}>
          {line1}
        </tspan>
        {hasTwoLines && (
          <tspan x={0} dy={13}>
            {line2}
          </tspan>
        )}
      </text>
    </g>
  );
}

/* ─── Donut Active Shape ─────────────────────────────────────── */

function PieActiveShape(props: unknown) {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } =
    props as {
      cx: number;
      cy: number;
      innerRadius: number;
      outerRadius: number;
      startAngle: number;
      endAngle: number;
      fill: string;
    };
  return (
    <Sector
      cx={cx}
      cy={cy}
      innerRadius={innerRadius - 4}
      outerRadius={outerRadius + 8}
      startAngle={startAngle}
      endAngle={endAngle}
      fill={fill}
      style={{
        filter: "brightness(1.15) drop-shadow(0 0 6px rgba(0,0,0,0.28))",
        transition: "all 0.15s ease",
      }}
    />
  );
}

/* ─── Insight Stat Row ───────────────────────────────────────── */

const InsightStat = React.memo(function InsightStat({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <div className="flex justify-between items-center py-1.5 border-b border-border/50 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`text-sm font-semibold tabular-nums ${color ?? ""}`}>
        {value}
      </span>
    </div>
  );
});

/* ─── Props ──────────────────────────────────────────────────── */

type OverviewTabProps = {
  allocationByPeriod: AllocationByPeriod[];
  allocationStatusDistribution: { name: string; value: number }[];
  productSummaries: ProductAllocationSummary[];
  supplierSummaries: SupplierAllocationSummary[];
  granularity: Granularity;
  setGranularity: (g: Granularity) => void;
  onNavigateToTab?: (tab: string) => void;
};

/* ─── Component ──────────────────────────────────────────────── */

export function OverviewTab({
  allocationByPeriod,
  allocationStatusDistribution,
  productSummaries,
  supplierSummaries,
  granularity,
  setGranularity,
  onNavigateToTab,
}: OverviewTabProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const activeChartColors = isDark ? chartColorsDark : chartColors;

  /* ─── Bar hover ──────────────────────────────────────────── */
  const [hoveredBar, setHoveredBar] = React.useState<string | null>(null);

  /* ─── Selected bars ──────────────────────────────────────── */
  const [selectedProduct, setSelectedProduct] = React.useState<string | null>(
    null,
  );
  const [selectedSupplier, setSelectedSupplier] = React.useState<string | null>(
    null,
  );

  /* ─── Modals ──────────────────────────────────────────────── */
  const [productModal, setProductModal] =
    React.useState<ProductAllocationSummary | null>(null);
  const [supplierModal, setSupplierModal] =
    React.useState<SupplierAllocationSummary | null>(null);

  /* ─── Donut chart ─────────────────────────────────────────── */
  const [hoveredDonutIdx, setHoveredDonutIdx] = React.useState<number | null>(
    null,
  );
  const [activeDonutIdx, setActiveDonutIdx] = React.useState<number | null>(
    null,
  );
  const effectiveDonutIdx = hoveredDonutIdx ?? activeDonutIdx;

  /* ─── Area chart active series ────────────────────────────── */
  const [activeTrendSeries, setActiveTrendSeries] = React.useState<
    string | null
  >(null);

  /* ─── Memoized chart data ────────────────────────────────── */
  const chartData = React.useMemo(
    () =>
      allocationByPeriod.map((d) => ({
        ...d,
        period: humanizePeriodKey(d.period, granularity),
      })),
    [allocationByPeriod, granularity],
  );
  const top10Products = React.useMemo(
    () => productSummaries.slice(0, 10),
    [productSummaries],
  );
  const top10Suppliers = React.useMemo(
    () => supplierSummaries.slice(0, 10),
    [supplierSummaries],
  );

  /* ─── Handlers ───────────────────────────────────────────── */
  const handleProductBarClick = React.useCallback(
    (data: { productName: string }) => {
      const name = data.productName;
      setSelectedProduct((prev) => (prev === name ? null : name));
      const found = productSummaries.find((p) => p.productName === name);
      if (found) setProductModal(found);
    },
    [productSummaries],
  );

  const handleSupplierBarClick = React.useCallback(
    (data: { supplierName: string }) => {
      const name = data.supplierName;
      setSelectedSupplier((prev) => (prev === name ? null : name));
      const found = supplierSummaries.find((s) => s.supplierName === name);
      if (found) setSupplierModal(found);
    },
    [supplierSummaries],
  );

  const handleProductLabelClick = React.useCallback(
    (name: string) => {
      setSelectedProduct((prev) => (prev === name ? null : name));
      const found = productSummaries.find((p) => p.productName === name);
      if (found) setProductModal(found);
    },
    [productSummaries],
  );

  const handleSupplierLabelClick = React.useCallback(
    (name: string) => {
      setSelectedSupplier((prev) => (prev === name ? null : name));
      const found = supplierSummaries.find((s) => s.supplierName === name);
      if (found) setSupplierModal(found);
    },
    [supplierSummaries],
  );

  const cellStyle = React.useCallback(
    (prefix: string, name: string): React.CSSProperties => ({
      filter:
        hoveredBar === `${prefix}::${name}`
          ? "brightness(1.25) drop-shadow(0 0 4px rgba(0,0,0,0.22))"
          : undefined,
      transition: "filter 0.1s ease, opacity 0.12s ease",
      cursor: "pointer",
    }),
    [hoveredBar],
  );

  /* ─── Donut legend (memoized) ────────────────────────────── */
  const donutLegend = React.useMemo(
    () =>
      allocationStatusDistribution.map((d, i) => (
        <div
          key={d.name}
          className="flex items-center gap-2 text-xs cursor-pointer px-1 py-0.5 rounded-md select-none"
          style={{
            opacity:
              effectiveDonutIdx !== null && effectiveDonutIdx !== i ? 0.32 : 1,
            transition: "opacity 0.15s ease",
          }}
          onMouseEnter={() => setHoveredDonutIdx(i)}
          onMouseLeave={() => setHoveredDonutIdx(null)}
          onClick={() => setActiveDonutIdx((prev) => (prev === i ? null : i))}
        >
          <span
            className="inline-block rounded-full shrink-0"
            style={{
              background: STATUS_COLORS[i % STATUS_COLORS.length],
              width: effectiveDonutIdx === i ? 14 : 10,
              height: effectiveDonutIdx === i ? 14 : 10,
              transition: "all 0.15s ease",
              boxShadow:
                effectiveDonutIdx === i
                  ? `0 0 6px ${STATUS_COLORS[i % STATUS_COLORS.length]}80`
                  : "none",
            }}
          />
          <span
            className="flex-1 truncate"
            style={{
              color: effectiveDonutIdx === i ? "var(--foreground)" : undefined,
              fontWeight: effectiveDonutIdx === i ? 600 : undefined,
            }}
          >
            {d.name}
          </span>
          <span className="font-medium tabular-nums">{numFmt(d.value)}</span>
        </div>
      )),
    [allocationStatusDistribution, effectiveDonutIdx],
  );

  /* ─── Trend legend config ────────────────────────────────── */
  const trendSeries = [
    {
      key: "totalOrdered",
      label: "Ordered",
      color: ALLOCATION_COLORS.totalOrdered,
    },
    {
      key: "totalAllocated",
      label: "Allocated",
      color: ALLOCATION_COLORS.totalAllocated,
    },
  ];

  /* ─── Render ─────────────────────────────────────────────── */
  return (
    <div className="space-y-4">
      {/* ── Ordered vs Allocated Trend ── */}
      <Card className="border-muted dark:border-zinc-700 dark:bg-white/13">
        <CardHeader>
          <CardTitle>Ordered vs Allocated Quantity Trend</CardTitle>
          <CardDescription>
            Allocation performance over time — hover legend to isolate a series
          </CardDescription>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(GRANULARITY_LABELS) as Granularity[]).map((g) => (
              <Button
                key={g}
                size="sm"
                variant={granularity === g ? "default" : "outline"}
                className="dark:border-zinc-700"
                onClick={() => setGranularity(g)}
              >
                {GRANULARITY_LABELS[g]}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No data available
            </p>
          ) : (
            <>
              {/* Interactive series legend */}
              <div className="flex gap-6 justify-center flex-wrap mb-3">
                {trendSeries.map(({ key, label, color }) => (
                  <div
                    key={key}
                    className="flex items-center gap-2 cursor-pointer select-none"
                    style={{
                      opacity:
                        activeTrendSeries && activeTrendSeries !== key
                          ? 0.28
                          : 1,
                      transition: "opacity 0.15s ease",
                    }}
                    onMouseEnter={() => setActiveTrendSeries(key)}
                    onMouseLeave={() => setActiveTrendSeries(null)}
                  >
                    <span
                      style={{ background: color }}
                      className="inline-block w-8 h-0.5 rounded-full"
                    />
                    <span className="text-xs text-muted-foreground">
                      {label}
                    </span>
                  </div>
                ))}
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart
                  data={chartData}
                  margin={{ top: 10, right: 20, left: 10, bottom: 5 }}
                >
                  <defs>
                    <linearGradient
                      id="avo-colorOrdered"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor={ALLOCATION_COLORS.totalOrdered}
                        stopOpacity={0.15}
                      />
                      <stop
                        offset="95%"
                        stopColor={ALLOCATION_COLORS.totalOrdered}
                        stopOpacity={0}
                      />
                    </linearGradient>
                    <linearGradient
                      id="avo-colorAllocated"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor={ALLOCATION_COLORS.totalAllocated}
                        stopOpacity={0.15}
                      />
                      <stop
                        offset="95%"
                        stopColor={ALLOCATION_COLORS.totalAllocated}
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="currentColor"
                    strokeOpacity={0.1}
                  />
                  <XAxis
                    dataKey="period"
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tickFormatter={(v) => numFmt(v)}
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={<TrendTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="totalOrdered"
                    name="Ordered"
                    stroke={ALLOCATION_COLORS.totalOrdered}
                    fill="url(#avo-colorOrdered)"
                    strokeWidth={
                      activeTrendSeries === null ||
                      activeTrendSeries === "totalOrdered"
                        ? 2.5
                        : 1
                    }
                    strokeOpacity={
                      activeTrendSeries && activeTrendSeries !== "totalOrdered"
                        ? 0.18
                        : 1
                    }
                    fillOpacity={
                      activeTrendSeries && activeTrendSeries !== "totalOrdered"
                        ? 0.04
                        : 1
                    }
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 0 }}
                    animationDuration={400}
                  />
                  <Area
                    type="monotone"
                    dataKey="totalAllocated"
                    name="Allocated"
                    stroke={ALLOCATION_COLORS.totalAllocated}
                    fill="url(#avo-colorAllocated)"
                    strokeWidth={
                      activeTrendSeries === null ||
                      activeTrendSeries === "totalAllocated"
                        ? 2.5
                        : 1
                    }
                    strokeOpacity={
                      activeTrendSeries &&
                      activeTrendSeries !== "totalAllocated"
                        ? 0.18
                        : 1
                    }
                    fillOpacity={
                      activeTrendSeries &&
                      activeTrendSeries !== "totalAllocated"
                        ? 0.04
                        : 1
                    }
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 0 }}
                    animationDuration={400}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </>
          )}
        </CardContent>
      </Card>

      {/* ── Gap Trend + Status Distribution ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Gap Trend */}
        <Card className="lg:col-span-3 border-muted dark:border-zinc-700 dark:bg-white/13">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Allocation Gap Trend</CardTitle>
            <CardDescription>Unallocated quantity over time</CardDescription>
          </CardHeader>
          <CardContent>
            {chartData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No data available
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart
                  data={chartData}
                  margin={{ top: 10, right: 20, left: 10, bottom: 5 }}
                >
                  <defs>
                    <linearGradient
                      id="avo-colorGap"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor={ALLOCATION_COLORS.allocationGap}
                        stopOpacity={0.2}
                      />
                      <stop
                        offset="95%"
                        stopColor={ALLOCATION_COLORS.allocationGap}
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="currentColor"
                    strokeOpacity={0.1}
                  />
                  <XAxis
                    dataKey="period"
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tickFormatter={(v) => numFmt(v)}
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={<GapTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="allocationGap"
                    name="Gap"
                    stroke={ALLOCATION_COLORS.allocationGap}
                    fill="url(#avo-colorGap)"
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{
                      r: 4,
                      strokeWidth: 0,
                      fill: ALLOCATION_COLORS.allocationGap,
                    }}
                    animationDuration={400}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Status Distribution Donut */}
        <Card className="lg:col-span-2 border-muted dark:border-zinc-700 dark:bg-white/13">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Allocation Status</CardTitle>
            <CardDescription>Hover or click a segment or label</CardDescription>
          </CardHeader>
          <CardContent>
            {allocationStatusDistribution.every((d) => d.value === 0) ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No data available
              </p>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <ResponsiveContainer width="100%" height={190}>
                  <PieChart>
                    <Pie
                      data={allocationStatusDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={52}
                      outerRadius={78}
                      dataKey="value"
                      paddingAngle={3}
                      activeIndex={effectiveDonutIdx ?? undefined}
                      activeShape={PieActiveShape}
                      onMouseEnter={(_, index) => setHoveredDonutIdx(index)}
                      onMouseLeave={() => setHoveredDonutIdx(null)}
                      onClick={(_, index) =>
                        setActiveDonutIdx((prev) =>
                          prev === index ? null : index,
                        )
                      }
                    >
                      {allocationStatusDistribution.map((_, i) => (
                        <Cell
                          key={i}
                          fill={STATUS_COLORS[i % STATUS_COLORS.length]}
                          opacity={
                            effectiveDonutIdx !== null &&
                            effectiveDonutIdx !== i
                              ? 0.32
                              : 1
                          }
                          style={{
                            cursor: "pointer",
                            transition: "opacity 0.15s ease",
                          }}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v: number) => [numFmt(v), "Orders"]}
                      contentStyle={{ fontSize: 12 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Interactive legend */}
                <div className="flex flex-col gap-0.5 w-full px-2">
                  {donutLegend}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Top Products Bar Chart — hidden (covered by Product Allocation tab) ── */}
      {/* <Card className="border-muted dark:border-zinc-700 dark:bg-white/13">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">
                Top Products by Allocation Gap
              </CardTitle>
              <CardDescription>
                Click bar or label for quick insights
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {selectedProduct && (
                <Button
                  variant="outline"
                  size="sm"
                  className="dark:border-zinc-700"
                  onClick={() => setSelectedProduct(null)}
                >
                  Clear Selection
                </Button>
              )}
              {onNavigateToTab && (
                <button
                  onClick={() => onNavigateToTab("products")}
                  className="text-xs text-primary hover:underline"
                >
                  View all →
                </button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {top10Products.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No data available
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={top10Products}
                margin={{ top: 5, right: 20, left: 10, bottom: 80 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="currentColor"
                  strokeOpacity={0.1}
                />
                <XAxis
                  dataKey="productName"
                  tickLine={false}
                  axisLine={false}
                  interval={0}
                  tick={(props) => (
                    <CustomXAxisTick
                      {...props}
                      onClick={handleProductLabelClick}
                    />
                  )}
                />
                <YAxis
                  tickFormatter={(v) => numFmt(v)}
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  content={(props: unknown) => (
                    <CustomBarTooltip
                      {...(props as Parameters<typeof CustomBarTooltip>[0])}
                      data={
                        top10Products as unknown as Array<
                          Record<string, unknown>
                        >
                      }
                      valueKey="allocationGap"
                      nameKey="productName"
                      valueLabel="Allocation Gap"
                    />
                  )}
                />
                <Bar
                  dataKey="allocationGap"
                  name="Allocation Gap"
                  radius={[4, 4, 0, 0]}
                  onMouseEnter={(data) =>
                    setHoveredBar(`prod::${data.productName}`)
                  }
                  onMouseLeave={() => setHoveredBar(null)}
                  onClick={handleProductBarClick}
                  cursor="pointer"
                  animationDuration={400}
                >
                  {top10Products.map((e, i) => (
                    <Cell
                      key={`prod-${i}`}
                      fill={activeChartColors[i % activeChartColors.length]}
                      opacity={
                        selectedProduct && selectedProduct !== e.productName
                          ? 0.2
                          : 1
                      }
                      style={cellStyle("prod", e.productName)}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card> */}

      {/* ── Top Suppliers Horizontal Bar — hidden (covered by Supplier Allocation tab) ── */}
      {/* <Card className="border-muted dark:border-zinc-700 dark:bg-white/13">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">
                Top Suppliers by Allocation Gap
              </CardTitle>
              <CardDescription>
                Click bar or label for quick insights
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {selectedSupplier && (
                <Button
                  variant="outline"
                  size="sm"
                  className="dark:border-zinc-700"
                  onClick={() => setSelectedSupplier(null)}
                >
                  Clear Selection
                </Button>
              )}
              {onNavigateToTab && (
                <button
                  onClick={() => onNavigateToTab("suppliers")}
                  className="text-xs text-primary hover:underline"
                >
                  View all →
                </button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {top10Suppliers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No data available
            </p>
          ) : (
            <ResponsiveContainer
              width="100%"
              height={Math.max(240, top10Suppliers.length * 42)}
            >
              <BarChart
                data={top10Suppliers}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="currentColor"
                  strokeOpacity={0.1}
                />
                <XAxis
                  type="number"
                  tickFormatter={(v) => numFmt(v)}
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="supplierName"
                  tickLine={false}
                  axisLine={false}
                  width={160}
                  tick={(props) => (
                    <CustomYAxisTick
                      {...props}
                      onClick={handleSupplierLabelClick}
                    />
                  )}
                />
                <Tooltip
                  content={(props: unknown) => (
                    <CustomBarTooltip
                      {...(props as Parameters<typeof CustomBarTooltip>[0])}
                      data={
                        top10Suppliers as unknown as Array<
                          Record<string, unknown>
                        >
                      }
                      valueKey="allocationGap"
                      nameKey="supplierName"
                      valueLabel="Allocation Gap"
                    />
                  )}
                />
                <Bar
                  dataKey="allocationGap"
                  name="Gap"
                  radius={[0, 4, 4, 0]}
                  onMouseEnter={(data) =>
                    setHoveredBar(`sup::${data.supplierName}`)
                  }
                  onMouseLeave={() => setHoveredBar(null)}
                  onClick={handleSupplierBarClick}
                  cursor="pointer"
                  animationDuration={400}
                >
                  {top10Suppliers.map((e, i) => (
                    <Cell
                      key={`sup-${i}`}
                      fill={activeChartColors[i % activeChartColors.length]}
                      opacity={
                        selectedSupplier && selectedSupplier !== e.supplierName
                          ? 0.2
                          : 1
                      }
                      style={cellStyle("sup", e.supplierName)}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card> */}

      {/* ── Product Quick Insight Modal ── */}
      <Dialog
        open={!!productModal}
        onOpenChange={(open) => {
          if (!open) setProductModal(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">
              Product Quick Insights
            </DialogTitle>
            <DialogDescription className="text-sm font-semibold text-foreground line-clamp-2">
              {productModal?.productName}
            </DialogDescription>
          </DialogHeader>
          {productModal && (
            <div className="space-y-0 mt-1">
              <InsightStat label="Brand" value={productModal.brandName} />
              <InsightStat label="Category" value={productModal.categoryName} />
              <InsightStat label="Unit" value={productModal.unit} />
              <InsightStat label="Rank" value={`#${productModal.rank}`} />
              <InsightStat
                label="Total Ordered"
                value={numFmt(productModal.totalOrdered)}
              />
              <InsightStat
                label="Total Allocated"
                value={numFmt(productModal.totalAllocated)}
                color="text-emerald-600 dark:text-emerald-400"
              />
              <InsightStat
                label="Allocation Gap"
                value={numFmt(productModal.allocationGap)}
                color={
                  productModal.allocationGap > 0
                    ? "text-rose-600 dark:text-rose-400"
                    : "text-emerald-600 dark:text-emerald-400"
                }
              />
              <InsightStat
                label="Gap Share"
                value={pctFmt(productModal.percentShare)}
              />
              <InsightStat
                label="Net Amount"
                value={`₱${numFmt(productModal.netAmount)}`}
              />
              <div className="pt-3">
                <div className="flex justify-between items-center text-xs mb-1.5">
                  <span className="text-muted-foreground">Allocation Rate</span>
                  <Badge
                    variant="outline"
                    className={
                      productModal.allocationRate >= 90
                        ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
                        : productModal.allocationRate >= 70
                          ? "border-amber-500 text-amber-600 dark:text-amber-400"
                          : "border-rose-500 text-rose-600 dark:text-rose-400"
                    }
                  >
                    {pctFmt(productModal.allocationRate)}
                  </Badge>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      productModal.allocationRate >= 90
                        ? "bg-emerald-500"
                        : productModal.allocationRate >= 70
                          ? "bg-amber-500"
                          : "bg-rose-500"
                    }`}
                    style={{
                      width: `${Math.min(100, productModal.allocationRate)}%`,
                      transition: "width 0.4s ease",
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Supplier Quick Insight Modal ── */}
      <Dialog
        open={!!supplierModal}
        onOpenChange={(open) => {
          if (!open) setSupplierModal(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">
              Supplier Quick Insights
            </DialogTitle>
            <DialogDescription className="text-sm font-semibold text-foreground">
              {supplierModal?.supplierName}
            </DialogDescription>
          </DialogHeader>
          {supplierModal && (
            <div className="space-y-0 mt-1">
              <InsightStat label="Rank" value={`#${supplierModal.rank}`} />
              <InsightStat
                label="Total Orders"
                value={numFmt(supplierModal.orderCount)}
              />
              <InsightStat
                label="Total Ordered Qty"
                value={numFmt(supplierModal.totalOrdered)}
              />
              <InsightStat
                label="Total Allocated Qty"
                value={numFmt(supplierModal.totalAllocated)}
                color="text-emerald-600 dark:text-emerald-400"
              />
              <InsightStat
                label="Allocation Gap"
                value={numFmt(supplierModal.allocationGap)}
                color={
                  supplierModal.allocationGap > 0
                    ? "text-rose-600 dark:text-rose-400"
                    : "text-emerald-600 dark:text-emerald-400"
                }
              />
              <InsightStat
                label="Gap Share"
                value={pctFmt(supplierModal.percentShare)}
              />
              <InsightStat
                label="Net Amount"
                value={`₱${numFmt(supplierModal.netAmount)}`}
              />
              <div className="pt-3">
                <div className="flex justify-between items-center text-xs mb-1.5">
                  <span className="text-muted-foreground">Allocation Rate</span>
                  <Badge
                    variant="outline"
                    className={
                      supplierModal.allocationRate >= 90
                        ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
                        : supplierModal.allocationRate >= 70
                          ? "border-amber-500 text-amber-600 dark:text-amber-400"
                          : "border-rose-500 text-rose-600 dark:text-rose-400"
                    }
                  >
                    {pctFmt(supplierModal.allocationRate)}
                  </Badge>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      supplierModal.allocationRate >= 90
                        ? "bg-emerald-500"
                        : supplierModal.allocationRate >= 70
                          ? "bg-amber-500"
                          : "bg-rose-500"
                    }`}
                    style={{
                      width: `${Math.min(100, supplierModal.allocationRate)}%`,
                      transition: "width 0.4s ease",
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
