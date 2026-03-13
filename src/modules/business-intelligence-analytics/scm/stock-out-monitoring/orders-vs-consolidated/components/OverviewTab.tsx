"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Legend,
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
import { useTheme } from "next-themes";
import type {
  OrdersByPeriod,
  ProductOrdersSummary,
  SupplierOrdersSummary,
  Granularity,
  LineTooltipProps,
  ProductTrend,
} from "../types";

/* ─── Helpers ────────────────────────────────────────────────── */

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

const COLORS = {
  total: "#6366f1",
  consolidated: "#10b981",
  pending: "#f59e0b",
};

const STATUS_COLORS = ["#10b981", "#f59e0b", "#ef4444", "#6366f1", "#06b6d4"];

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

/* ─── Tooltips ───────────────────────────────────────────────── */

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

/* ─── Custom Axis Ticks ──────────────────────────────────────── */

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
  const maxChars = 12;
  const words = fullName.split(/\s+/);
  let line1 = "",
    line2 = "";
  for (const w of words) {
    if (!line1 || line1.length + w.length + 1 <= maxChars)
      line1 += (line1 ? " " : "") + w;
    else if (!line2 || line2.length + w.length + 1 <= maxChars)
      line2 += (line2 ? " " : "") + w;
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
 // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
  let line1 = "",
    line2 = "";
  for (const w of words) {
    if (!line1 || line1.length + w.length + 1 <= maxChars)
      line1 += (line1 ? " " : "") + w;
    else if (!line2 || line2.length + w.length + 1 <= maxChars)
      line2 += (line2 ? " " : "") + w;
  }
  if (line2.length > maxChars) line2 = line2.slice(0, maxChars - 1) + "…";
  const hasTwoLines = !!line2;
  return (
    <g transform={`translate(${x},${y})`}>
      <text
        textAnchor="end"
        fill="currentColor"
        fontSize={10}
        cursor={onClick ? "pointer" : "default"}
        onClick={onClick ? () => onClick(fullName) : undefined}
      >
        <tspan x={0} dy={hasTwoLines ? -6 : 4}>
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

/* ─── InsightStat ────────────────────────────────────────────── */

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

/* ─── Types ──────────────────────────────────────────────────── */

type CategorySummary = {
  name: string;
  totalOrdered: number;
  orderCount: number;
  pendingOrders: number;
};

type OverviewTabProps = {
  ordersByPeriod: OrdersByPeriod[];
  consolidationStatusDistribution: { name: string; value: number }[];
  productSummaries: ProductOrdersSummary[];
  productTrends: ProductTrend[];
  supplierSummaries: SupplierOrdersSummary[];
  categorySummaries: CategorySummary[];
  granularity: Granularity;
  setGranularity: (g: Granularity) => void;
  onNavigateToTab?: (tab: string) => void;
};

/* ─── Component ──────────────────────────────────────────────── */

export function OverviewTab({
  ordersByPeriod,
  consolidationStatusDistribution,
  productSummaries,
  productTrends,
  supplierSummaries,
  categorySummaries,
  granularity,
  setGranularity,
  onNavigateToTab,
}: OverviewTabProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const activeChartColors = isDark ? chartColorsDark : chartColors;

  /* ─── Hover & Selection State ────────────────────────────── */
  const [hoveredBar, setHoveredBar] = React.useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = React.useState<string | null>(
    null,
  );
   // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [selectedSupplier, setSelectedSupplier] = React.useState<string | null>(
    null,
  );
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(
    null,
  );

  /* ─── Modals ─────────────────────────────────────────────── */
  const [productModal, setProductModal] =
    React.useState<ProductOrdersSummary | null>(null);
  const [supplierModal, setSupplierModal] =
    React.useState<SupplierOrdersSummary | null>(null);
  const [categoryModal, setCategoryModal] =
    React.useState<CategorySummary | null>(null);

  /* ─── Donut ──────────────────────────────────────────────── */
  const [hoveredDonutIdx, setHoveredDonutIdx] = React.useState<number | null>(
    null,
  );
  const [activeDonutIdx, setActiveDonutIdx] = React.useState<number | null>(
    null,
  );
  const effectiveDonutIdx = hoveredDonutIdx ?? activeDonutIdx;

  /* ─── Line chart active series ───────────────────────────── */
  const [activeTrendSeries, setActiveTrendSeries] = React.useState<
    string | null
  >(null);

  /* ─── Memoized data ─────────────────────────────────────── */
  const chartData = React.useMemo(
    () =>
      ordersByPeriod.map((d) => ({
        ...d,
        period: humanizePeriodKey(d.period, granularity),
      })),
    [ordersByPeriod, granularity],
  );
  const top10Products = React.useMemo(
    () => productSummaries.slice(0, 10),
    [productSummaries],
  );
  const pendingBySupplier = React.useMemo(
    () =>
      supplierSummaries
        .filter((s) => s.pendingOrders > 0)
        .sort((a, b) => b.pendingOrders - a.pendingOrders)
        .slice(0, 10),
    [supplierSummaries],
  );
  const top10Categories = React.useMemo(
    () => categorySummaries.slice(0, 10),
    [categorySummaries],
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
 // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleSupplierBarClick = React.useCallback(
    (data: { supplierName: string }) => {
      const name = data.supplierName;
      setSelectedSupplier((prev) => (prev === name ? null : name));
      const found = supplierSummaries.find((s) => s.supplierName === name);
      if (found) setSupplierModal(found);
    },
    [supplierSummaries],
  );

  const handleCategoryBarClick = React.useCallback(
    (data: { name: string }) => {
      const name = data.name;
      setSelectedCategory((prev) => (prev === name ? null : name));
      const found = categorySummaries.find((c) => c.name === name);
      if (found) setCategoryModal(found);
    },
    [categorySummaries],
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

  /* ─── Donut legend ───────────────────────────────────────── */
  const donutLegend = React.useMemo(
    () =>
      consolidationStatusDistribution.map((d, i) => {
        const displayName = d.name === "Pending" ? "For Consolidation" : d.name;
        return (
          <div
            key={d.name}
            className="flex items-center gap-2 text-xs cursor-pointer px-1 py-0.5 rounded-md select-none"
            style={{
              opacity:
                effectiveDonutIdx !== null && effectiveDonutIdx !== i
                  ? 0.32
                  : 1,
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
                color:
                  effectiveDonutIdx === i ? "var(--foreground)" : undefined,
                fontWeight: effectiveDonutIdx === i ? 600 : undefined,
              }}
            >
              {displayName}
            </span>
            <span className="font-medium tabular-nums">{numFmt(d.value)}</span>
          </div>
        );
      }),
    [consolidationStatusDistribution, effectiveDonutIdx],
  );

  /* ─── Trend series ───────────────────────────────────────── */
  const trendSeries = [
    { key: "totalOrders", label: "Total Orders", color: COLORS.total },
    { key: "consolidated", label: "Consolidated", color: COLORS.consolidated },
    { key: "pending", label: "For Consolidation", color: COLORS.pending },
  ];

  /* ─── Render ─────────────────────────────────────────────── */
  return (
    <div className="space-y-4">
      {/* ── Orders Trend (Area/Line Chart) ── */}
      <Card className="border-muted dark:border-zinc-700 dark:bg-white/13">
        <CardHeader>
          <CardTitle>Orders Trend</CardTitle>
          <CardDescription>
            Order inflow over time — hover legend to isolate a series
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
                    {trendSeries.map(({ key, color }) => (
                      <linearGradient
                        key={key}
                        id={`ovc-grad-${key}`}
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor={color}
                          stopOpacity={0.15}
                        />
                        <stop offset="95%" stopColor={color} stopOpacity={0} />
                      </linearGradient>
                    ))}
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
                    allowDecimals={false}
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={<TrendTooltip />} />
                  {trendSeries.map(({ key, label, color }) => (
                    <Area
                      key={key}
                      type="monotone"
                      dataKey={key}
                      name={label}
                      stroke={color}
                      fill={`url(#ovc-grad-${key})`}
                      strokeWidth={
                        activeTrendSeries && activeTrendSeries !== key ? 1 : 2
                      }
                      strokeOpacity={
                        activeTrendSeries && activeTrendSeries !== key ? 0.2 : 1
                      }
                      fillOpacity={
                        activeTrendSeries && activeTrendSeries !== key ? 0.3 : 1
                      }
                      dot={false}
                    />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            </>
          )}
        </CardContent>
      </Card>

      {/* ── Orders by Status (Donut) + Pending Orders by Supplier ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Status Donut */}
        <Card className="lg:col-span-2 border-muted dark:border-zinc-700 dark:bg-white/13">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Orders by Status</CardTitle>
            <CardDescription>
              Distribution of order processing stages
            </CardDescription>
          </CardHeader>
          <CardContent>
            {consolidationStatusDistribution.every((d) => d.value === 0) ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No data
              </p>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={consolidationStatusDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={52}
                      outerRadius={78}
                      dataKey="value"
                      paddingAngle={3}
                      activeIndex={effectiveDonutIdx ?? undefined}
                      activeShape={<PieActiveShape />}
                      onMouseEnter={(_, idx) => setHoveredDonutIdx(idx)}
                      onMouseLeave={() => setHoveredDonutIdx(null)}
                      onClick={(_, idx) =>
                        setActiveDonutIdx((prev) => (prev === idx ? null : idx))
                      }
                      style={{ cursor: "pointer" }}
                    >
                      {consolidationStatusDistribution.map((_, i) => (
                        <Cell
                          key={i}
                          fill={STATUS_COLORS[i % STATUS_COLORS.length]}
                          opacity={
                            effectiveDonutIdx !== null &&
                            effectiveDonutIdx !== i
                              ? 0.4
                              : 1
                          }
                          style={{ transition: "opacity 0.15s ease" }}
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => [numFmt(v), "Orders"]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-col gap-1 w-full px-2">
                  {donutLegend}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Orders by Supplier — Summary Card */}
        <Card className="lg:col-span-3 border-muted dark:border-zinc-700 dark:bg-white/13">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">
                  For Consolidation Orders by Supplier
                </CardTitle>
                <CardDescription>
                  Suppliers with For Consolidation orders — click a row for
                  insights
                </CardDescription>
              </div>
              {onNavigateToTab && (
                <button
                  onClick={() => onNavigateToTab("suppliers")}
                  className="text-xs text-primary hover:underline shrink-0"
                >
                  Full breakdown →
                </button>
              )}
            </div>
          </CardHeader>
          <CardContent className="pb-3">
            {pendingBySupplier.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                🎉 No For Consolidation orders
              </p>
            ) : (
              <div className="divide-y divide-border/50">
                {pendingBySupplier.map((s) => (
                  <div
                    key={s.supplierId}
                    className="flex items-center justify-between gap-3 py-2 px-1 cursor-pointer rounded hover:bg-muted/30 transition-colors"
                    onClick={() => {
                      setSelectedSupplier((prev) =>
                        prev === s.supplierName ? null : s.supplierName,
                      );
                      setSupplierModal(s);
                    }}
                  >
                    <span className="text-sm truncate flex-1">
                      {s.supplierName}
                    </span>
                    <span className="shrink-0 inline-flex items-center rounded-full border border-amber-500 px-2.5 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400 tabular-nums">
                      {s.pendingOrders} For Consolidation
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Orders by Category (Bar) ── */}
      <Card className="border-muted dark:border-zinc-700 dark:bg-white/13">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Orders by Category</CardTitle>
              <CardDescription>
                Demand distribution by category — click for insights
              </CardDescription>
            </div>
            {selectedCategory && (
              <Button
                variant="outline"
                size="sm"
                className="dark:border-zinc-700"
                onClick={() => setSelectedCategory(null)}
              >
                Clear
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {top10Categories.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No data available
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={top10Categories}
                margin={{ top: 5, right: 20, left: 10, bottom: 70 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="currentColor"
                  strokeOpacity={0.1}
                />
                <XAxis
                  dataKey="name"
                  tick={(props) => (
                    <CustomXAxisTick
                      {...props}
                      onClick={(name) => {
                        setSelectedCategory((prev) =>
                          prev === name ? null : name,
                        );
                        const found = categorySummaries.find(
                          (c) => c.name === name,
                        );
                        if (found) setCategoryModal(found);
                      }}
                    />
                  )}
                  tickLine={false}
                  axisLine={false}
                  interval={0}
                  height={70}
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
                        top10Categories as unknown as Array<
                          Record<string, unknown>
                        >
                      }
                      valueKey="totalOrdered"
                      nameKey="name"
                      valueLabel="Qty Ordered"
                    />
                  )}
                />
                <Bar
                  dataKey="totalOrdered"
                  name="Qty Ordered"
                  radius={[4, 4, 0, 0]}
                  onMouseEnter={(data) => setHoveredBar(`cat::${data.name}`)}
                  onMouseLeave={() => setHoveredBar(null)}
                  onClick={handleCategoryBarClick}
                  cursor="pointer"
                >
                  {top10Categories.map((e, i) => (
                    <Cell
                      key={`cat-${i}`}
                      fill={activeChartColors[i % activeChartColors.length]}
                      opacity={
                        selectedCategory && selectedCategory !== e.name
                          ? 0.25
                          : 1
                      }
                      style={cellStyle("cat", e.name)}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* ── Top Products by Qty Ordered (Bar) ── */}
      <Card className="border-muted dark:border-zinc-700 dark:bg-white/13">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">
                Top Products by Quantity Ordered
              </CardTitle>
              <CardDescription>
                Highest ordered products — click for insights
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
                  Clear
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
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={top10Products}
                margin={{ top: 5, right: 20, left: 10, bottom: 70 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="currentColor"
                  strokeOpacity={0.1}
                />
                <XAxis
                  dataKey="productName"
                  tick={(props) => (
                    <CustomXAxisTick
                      {...props}
                      onClick={(name) => {
                        setSelectedProduct((prev) =>
                          prev === name ? null : name,
                        );
                        const found = productSummaries.find(
                          (p) => p.productName === name,
                        );
                        if (found) setProductModal(found);
                      }}
                    />
                  )}
                  tickLine={false}
                  axisLine={false}
                  interval={0}
                  height={70}
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
                      valueKey="totalOrdered"
                      nameKey="productName"
                      valueLabel="Qty Ordered"
                    />
                  )}
                />
                <Bar
                  dataKey="totalOrdered"
                  name="Qty Ordered"
                  radius={[4, 4, 0, 0]}
                  onMouseEnter={(data) =>
                    setHoveredBar(`prod::${data.productName}`)
                  }
                  onMouseLeave={() => setHoveredBar(null)}
                  onClick={handleProductBarClick}
                  cursor="pointer"
                >
                  {top10Products.map((e, i) => (
                    <Cell
                      key={`prod-${i}`}
                      fill={activeChartColors[i % activeChartColors.length]}
                      opacity={
                        selectedProduct && selectedProduct !== e.productName
                          ? 0.25
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
      </Card>

      {/* ── Product Insight Modal ── */}
      <Dialog
        open={!!productModal}
        onOpenChange={(o) => {
          if (!o) {
            setProductModal(null);
            setSelectedProduct(null);
          }
        }}
      >
        <DialogContent className="max-w-md dark:border-zinc-700">
          <DialogHeader>
            <DialogTitle className="leading-snug">
              {productModal?.productName}
            </DialogTitle>
            <DialogDescription>Quick product insights</DialogDescription>
          </DialogHeader>
          {productModal && (
            <div className="space-y-0.5 pt-1">
              <InsightStat
                label="Brand"
                value={productModal.brandName || "—"}
              />
              <InsightStat
                label="Category"
                value={productModal.categoryName || "—"}
              />
              <InsightStat label="Unit" value={productModal.unit || "—"} />
              <InsightStat
                label="Qty Ordered"
                value={numFmt(productModal.totalOrdered)}
              />
              <InsightStat
                label="Order Count"
                value={numFmt(productModal.orderCount)}
              />
              <InsightStat
                label="Share %"
                value={pctFmt(productModal.percentShare)}
              />
              <InsightStat
                label="Net Amount"
                value={`₱${numFmt(productModal.netAmount)}`}
              />
              <InsightStat label="Rank" value={`#${productModal.rank}`} />
            </div>
          )}
          {productModal &&
            (() => {
              const rows = productTrends
                .filter((t) => t.productName === productModal.productName)
                .sort((a, b) => a.period.localeCompare(b.period));
              if (!rows.length) return null;
              const chartData = rows.map((r) => ({
                period: humanizePeriodKey(r.period, granularity),
                totalOrdered: r.totalOrdered,
                totalConsolidated: r.totalConsolidated,
                consolidationRate: Number(r.consolidationRate.toFixed(2)),
              }));
              return (
                <div className="pt-2">
                  <div style={{ height: 200 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={chartData}
                        margin={{ top: 6, right: 20, left: 0, bottom: 6 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          strokeOpacity={0.08}
                        />
                        <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                        <YAxis
                          yAxisId="left"
                          tickFormatter={(v) => numFmt(Number(v))}
                        />
                        <YAxis
                          yAxisId="right"
                          orientation="right"
                          domain={[0, 100]}
                          tickFormatter={(v) => `${v}%`}
                        />
                        <Tooltip />
                        <Legend />
                        <Line
                          yAxisId="left"
                          type="monotone"
                          dataKey="totalOrdered"
                          name="Qty Ordered"
                          stroke={COLORS.total}
                          strokeWidth={2}
                          dot={false}
                        />
                        <Line
                          yAxisId="left"
                          type="monotone"
                          dataKey="totalConsolidated"
                          name="Consolidated"
                          stroke={COLORS.consolidated}
                          strokeWidth={2}
                          dot={false}
                        />
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="consolidationRate"
                          name="Consolidation Rate"
                          stroke={COLORS.pending}
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              );
            })()}
        </DialogContent>
      </Dialog>

      {/* ── Supplier Insight Modal ── */}
      <Dialog
        open={!!supplierModal}
        onOpenChange={(o) => {
          if (!o) {
            setSupplierModal(null);
            setSelectedSupplier(null);
          }
        }}
      >
        <DialogContent className="max-w-md dark:border-zinc-700">
          <DialogHeader>
            <DialogTitle>{supplierModal?.supplierName}</DialogTitle>
            <DialogDescription>Quick supplier insights</DialogDescription>
          </DialogHeader>
          {supplierModal && (
            <div className="space-y-0.5 pt-1">
              <InsightStat
                label="Total Orders"
                value={numFmt(supplierModal.totalOrders)}
              />
              <InsightStat
                label="Consolidated"
                value={numFmt(supplierModal.totalConsolidated)}
                color="text-emerald-600 dark:text-emerald-400"
              />
              <InsightStat
                label="For Consolidation"
                value={numFmt(supplierModal.pendingOrders)}
                color={
                  supplierModal.pendingOrders > 0
                    ? "text-amber-600 dark:text-amber-400"
                    : ""
                }
              />
              <InsightStat
                label="Consolidation Rate"
                value={pctFmt(
                  supplierModal.totalOrders > 0
                    ? (supplierModal.totalConsolidated /
                        supplierModal.totalOrders) *
                        100
                    : 0,
                )}
              />
              <InsightStat
                label="Qty Ordered"
                value={numFmt(supplierModal.totalOrdered)}
              />
              <InsightStat
                label="Net Amount"
                value={`₱${numFmt(supplierModal.totalNetAmount)}`}
              />
              <InsightStat
                label="Share %"
                value={pctFmt(supplierModal.percentShare)}
              />
              <InsightStat label="Rank" value={`#${supplierModal.rank}`} />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Category Insight Modal ── */}
      <Dialog
        open={!!categoryModal}
        onOpenChange={(o) => {
          if (!o) {
            setCategoryModal(null);
            setSelectedCategory(null);
          }
        }}
      >
        <DialogContent className="max-w-md dark:border-zinc-700">
          <DialogHeader>
            <DialogTitle>{categoryModal?.name}</DialogTitle>
            <DialogDescription>Quick category insights</DialogDescription>
          </DialogHeader>
          {categoryModal && (
            <div className="space-y-0.5 pt-1">
              <InsightStat
                label="Total Ordered Qty"
                value={numFmt(categoryModal.totalOrdered)}
              />
              <InsightStat
                label="Order Count"
                value={numFmt(categoryModal.orderCount)}
              />
              <InsightStat
                label="For Consolidation Orders"
                value={numFmt(categoryModal.pendingOrders)}
                color={
                  categoryModal.pendingOrders > 0
                    ? "text-amber-600 dark:text-amber-400"
                    : ""
                }
              />
              {categoryModal.orderCount > 0 && (
                <InsightStat
                  label="For Consolidation Rate"
                  value={pctFmt(
                    (categoryModal.pendingOrders / categoryModal.orderCount) *
                      100,
                  )}
                />
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
