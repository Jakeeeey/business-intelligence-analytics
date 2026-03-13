"use client";

import * as React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
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
import { Badge } from "@/components/ui/badge";
import { useTheme } from "next-themes";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type {
  SupplierAllocationSummary,
  AllocatedOrderedRecord,
} from "../types";

/* ─── Helpers ─────────────────────────────────────────────────── */
function numFmt(n: number) {
  return n.toLocaleString("en-PH", { maximumFractionDigits: 2 });
}
function pctFmt(n: number) {
  return `${n.toFixed(1)}%`;
}

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

/* ─── Custom Y-Axis Tick ──────────────────────────────────────── */
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
  const words = (payload.value || "").split(/\s+/);
  let line1 = "",
    line2 = "";
  for (const w of words) {
    if (!line1 || line1.length + w.length + 1 <= 18)
      line1 += (line1 ? " " : "") + w;
    else if (!line2 || line2.length + w.length + 1 <= 18)
      line2 += (line2 ? " " : "") + w;
  }
  if (line2.length > 18) line2 = line2.slice(0, 17) + "…";
  const hasTwoLines = !!line2;
  return (
    <g transform={`translate(${x},${y})`}>
      <text
        textAnchor="end"
        fill="currentColor"
        fontSize={10}
        cursor={onClick ? "pointer" : "default"}
        onClick={onClick ? () => onClick(payload.value) : undefined}
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

/* ─── Custom X-Axis Tick (angled, for vertical chart) ─────────── */
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
  const maxChars = 14;
  const display =
    fullName.length > maxChars
      ? fullName.slice(0, maxChars - 1) + "…"
      : fullName;
  return (
    <g transform={`translate(${x},${y + 4})`}>
      <text
        textAnchor="end"
        fill="currentColor"
        fontSize={10}
        transform="rotate(-35)"
        cursor={onClick ? "pointer" : "default"}
        onClick={onClick ? () => onClick(fullName) : undefined}
      >
        {display}
      </text>
    </g>
  );
}

/* ─── Tooltips ────────────────────────────────────────────────── */
const SingleBarTooltip = React.memo(function SingleBarTooltip({
  active,
  payload,
  data,
  valueKey,
  nameKey,
  valueLabel = "Value",
}: {
  active?: boolean;
  payload?: Array<{ payload?: Record<string, unknown> }>;
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
  const pct = total > 0 ? ((value / total) * 100).toFixed(1) : "0.0";
  return (
    <div className="rounded-lg border bg-background p-3 shadow-md text-sm min-w-44 space-y-1 pointer-events-none">
      <p className="font-semibold leading-snug line-clamp-2">{name}</p>
      <div className="border-t border-border pt-1.5 space-y-1">
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">{valueLabel}</span>
          <span className="font-medium tabular-nums">{numFmt(value)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Share</span>
          <span className="font-medium">{pct}%</span>
        </div>
        <p className="text-[10px] text-primary italic">Click for insights</p>
      </div>
    </div>
  );
});

const GroupedBarTooltip = React.memo(function GroupedBarTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number; color?: string }>;
}) {
  if (!active || !payload?.length) return null;
  const name =
    (payload[0] as unknown as { payload: { supplierName: string } })?.payload
      ?.supplierName ?? "";
  return (
    <div className="rounded-lg border bg-background p-3 shadow-md text-sm min-w-44 space-y-1 pointer-events-none">
      <p className="font-semibold leading-snug line-clamp-2">{name}</p>
      <div className="border-t border-border pt-1.5 space-y-1">
        {payload.map((p) => (
          <div key={p.name} className="flex justify-between gap-4">
            <span style={{ color: p.color }}>{p.name}</span>
            <span className="font-medium tabular-nums">
              {numFmt(p.value ?? 0)}
            </span>
          </div>
        ))}
        <p className="text-[10px] text-primary italic">Click for insights</p>
      </div>
    </div>
  );
});

/* ─── InsightStat ─────────────────────────────────────────────── */
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

/* ─── Pagination ──────────────────────────────────────────────── */
function Pagination({
  page,
  total,
  onChange,
}: {
  page: number;
  total: number;
  onChange: (p: number) => void;
}) {
  if (total <= 1) return null;
  const pages = Array.from({ length: Math.min(5, total) }, (_, i) => {
    if (total <= 5) return i + 1;
    if (page <= 3) return i + 1;
    if (page >= total - 2) return total - 4 + i;
    return page - 2 + i;
  });
  return (
    <div className="flex gap-1">
      <button
        className="inline-flex items-center justify-center rounded-md border border-input bg-background px-3 h-8 text-sm dark:border-zinc-700 disabled:opacity-50"
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={page === 1}
      >
        Previous
      </button>
      {pages.map((p) => (
        <button
          key={p}
          className={`inline-flex items-center justify-center rounded-md border px-3 h-8 text-sm dark:border-zinc-700 ${page === p ? "bg-primary text-primary-foreground border-primary" : "border-input bg-background"}`}
          onClick={() => onChange(p)}
        >
          {p}
        </button>
      ))}
      <button
        className="inline-flex items-center justify-center rounded-md border border-input bg-background px-3 h-8 text-sm dark:border-zinc-700 disabled:opacity-50"
        onClick={() => onChange(Math.min(total, page + 1))}
        disabled={page === total}
      >
        Next
      </button>
    </div>
  );
}

/* ─── Main Component ──────────────────────────────────────────── */
type Props = {
  supplierSummaries: SupplierAllocationSummary[];
  allRecords: AllocatedOrderedRecord[];
};

export function SuppliersTab({ supplierSummaries, allRecords }: Props) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const barColor = isDark ? chartColorsDark[0] : chartColors[0];

  /* ─── Table state ── */
  const [sortKey, setSortKey] =
    React.useState<keyof SupplierAllocationSummary>("allocationGap");
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [itemsPerPage, setItemsPerPage] = React.useState(10);

  /* ─── Chart state ── */
  const [hoveredBar, setHoveredBar] = React.useState<string | null>(null);
  const [selectedSupplier, setSelectedSupplier] = React.useState<string | null>(
    null,
  );
  const [modalSupplier, setModalSupplier] =
    React.useState<SupplierAllocationSummary | null>(null);

  /* ─── Drill-down state ── */
  const [drillDownSupplier, setDrillDownSupplier] = React.useState<
    string | null
  >(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [appliedSearch, setAppliedSearch] = React.useState("");
  const [showFullyAllocated, setShowFullyAllocated] =
    React.useState<boolean>(true);

  const handleSort = React.useCallback(
    (key: keyof SupplierAllocationSummary) => {
      if (key === sortKey) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortKey(key);
        setSortDir("desc");
      }
      setCurrentPage(1);
    },
    [sortKey],
  );

  /* ─── Computed data ── */
  const sorted = React.useMemo(() => {
    let data = supplierSummaries;
    // Apply search (supplier name)
    if (appliedSearch && appliedSearch.trim() !== "") {
      const q = appliedSearch.trim().toLowerCase();
      data = data.filter((s) => s.supplierName.toLowerCase().includes(q));
    }
    // Exclude fully allocated suppliers when toggle is off
    if (!showFullyAllocated) {
      data = data.filter((s) => !(s.allocationGap === 0 && s.totalOrdered > 0));
    }
    return [...data].sort((a, b) => {
      const va = a[sortKey] as number | string;
      const vb = b[sortKey] as number | string;
      if (typeof va === "number" && typeof vb === "number")
        return sortDir === "asc" ? va - vb : vb - va;
      return sortDir === "asc"
        ? String(va).localeCompare(String(vb))
        : String(vb).localeCompare(String(va));
    });
  }, [supplierSummaries, sortKey, sortDir, appliedSearch, showFullyAllocated]);

  const top10ByGap = React.useMemo(
    () =>
      supplierSummaries
        .filter((s) => s.allocationGap > 0)
        .sort((a, b) => b.allocationGap - a.allocationGap)
        .slice(0, 10),
    [supplierSummaries],
  );
  const top10ByOrders = React.useMemo(
    () => supplierSummaries.slice(0, 10),
    [supplierSummaries],
  );

  /* ─── Drill-down products for selected supplier ── */
  const drillProducts = React.useMemo(() => {
    if (!drillDownSupplier) return [];
    const map = new Map<
      number,
      {
        productId: number;
        productName: string;
        brandName: string;
        totalOrdered: number;
        totalAllocated: number;
        allocationGap: number;
      }
    >();
    for (const r of allRecords) {
      if (r.supplierName !== drillDownSupplier) continue;
      const e = map.get(r.productId);
      if (e) {
        e.totalOrdered += r.orderedQuantity;
        e.totalAllocated += r.allocatedQuantity;
        e.allocationGap += r.discrepancyGap;
      } else {
        map.set(r.productId, {
          productId: r.productId,
          productName: r.productName,
          brandName: r.brandName,
          totalOrdered: r.orderedQuantity,
          totalAllocated: r.allocatedQuantity,
          allocationGap: r.discrepancyGap,
        });
      }
    }
    return [...map.values()]
      .map((p) => ({
        ...p,
        allocationRate:
          p.totalOrdered > 0 ? (p.totalAllocated / p.totalOrdered) * 100 : 0,
      }))
      .sort((a, b) => b.allocationGap - a.allocationGap);
  }, [drillDownSupplier, allRecords]);
  const top10ByRate = React.useMemo(
    () =>
      [...supplierSummaries]
        .sort((a, b) => a.allocationRate - b.allocationRate)
        .slice(0, 10),
    [supplierSummaries],
  );

  const totalPages = Math.ceil(sorted.length / itemsPerPage);
  const paginatedItems = sorted.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  // Debounce appliedSearch from searchQuery
  React.useEffect(() => {
    const id = setTimeout(() => {
      setAppliedSearch(searchQuery);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(id);
  }, [searchQuery]);

  const openModal = React.useCallback(
    (name: string) => {
      setSelectedSupplier((prev) => (prev === name ? null : name));
      const found = supplierSummaries.find((s) => s.supplierName === name);
      if (found) setModalSupplier(found);
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

  const sortIcon = (col: keyof SupplierAllocationSummary) => (
    <span className="ml-1 opacity-50 text-xs">
      {sortKey === col ? (sortDir === "asc" ? "↑" : "↓") : "↕"}
    </span>
  );

  // --- Dynamic bar sizing: measure chart container width and compute bar sizes
  const chartRef = React.useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = React.useState<number>(0);

  React.useEffect(() => {
    const el = chartRef.current;
    if (!el) {
      if (typeof window !== "undefined") setContainerWidth(window.innerWidth);
      return;
    }
    const update = () => setContainerWidth(Math.floor(el.getBoundingClientRect().width));
    const ro = new ResizeObserver(() => update());
    ro.observe(el);
    update();
    return () => ro.disconnect();
  }, []);

  const orderedBarSize = React.useMemo(() => {
    const n = Math.max(1, top10ByOrders.length);
    if (containerWidth <= 0) return 50;
    const gapFactor = 0.25; // matches barCategoryGap
    const availablePerCategory = (containerWidth / n) * (1 - gapFactor);
    const perBar = Math.max(8, Math.floor(availablePerCategory / 2));
    return Math.max(10, Math.min(60, perBar));
  }, [containerWidth, top10ByOrders.length]);

  const allocatedBarSize = React.useMemo(() => {
    return Math.max(8, Math.min(40, Math.round(orderedBarSize * 0.28)));
  }, [orderedBarSize]);

  if (supplierSummaries.length === 0) {
    return (
      <Card className="border-muted dark:border-zinc-700 dark:bg-white/13">
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          No supplier data available. Generate a report to see results.
        </CardContent>
      </Card>
    );
  }


  return (
    <div className="space-y-4">
      {/* ── Chart 1: Allocation Gap by Supplier ── */}
      {top10ByGap.length > 0 && (
        <Card className="border-muted dark:border-zinc-700 dark:bg-white/13">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              Allocation Gap by Supplier
            </CardTitle>
            <CardDescription>
              Units short-allocated — click for insights
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer
              width="100%"
              height={Math.max(240, top10ByGap.length * 36)}
            >
              <BarChart
                data={top10ByGap}
                layout="vertical"
                margin={{ top: 5, right: 60, left: 0, bottom: 5 }}
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
                  axisLine={{ stroke: "currentColor", strokeOpacity: 0.2 }}
                />
                <YAxis
                  type="category"
                  dataKey="supplierName"
                  width={155}
                  tick={(p) => <CustomYAxisTick {...p} onClick={openModal} />}
                  tickLine={false}
                  axisLine={{ stroke: "currentColor", strokeOpacity: 0.2 }}
                />
                <Tooltip
                  content={(p: unknown) => (
                    <SingleBarTooltip
                      {...(p as Parameters<typeof SingleBarTooltip>[0])}
                      data={
                        top10ByGap as unknown as Array<Record<string, unknown>>
                      }
                      valueKey="allocationGap"
                      nameKey="supplierName"
                      valueLabel="Allocation Gap"
                    />
                  )}
                />
                <Bar
                  dataKey="allocationGap"
                  name="Allocation Gap"
                  radius={[0, 4, 4, 0]}
                  onMouseEnter={(d) => setHoveredBar(`gap::${d.supplierName}`)}
                  onMouseLeave={() => setHoveredBar(null)}
                  onClick={(d) => openModal(d.supplierName)}
                  cursor="pointer"
                >
                  <LabelList
                    dataKey="allocationGap"
                    position="right"
                    formatter={(v: number) => numFmt(v)}
                    style={{ fontSize: 10, fill: "currentColor", opacity: 0.7 }}
                  />
                  {top10ByGap.map((e, i) => {
                    const severity =
                      i < 3 ? "#ef4444" : i < 6 ? "#f97316" : "#f59e0b";
                    return (
                      <Cell
                        key={i}
                        fill={severity}
                        opacity={
                          selectedSupplier &&
                          selectedSupplier !== e.supplierName
                            ? 0.25
                            : 1
                        }
                        style={cellStyle("gap", e.supplierName)}
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* ── Chart 2: Ordered vs Allocated by Supplier ── */}
      <Card className="border-muted dark:border-zinc-700 dark:bg-white/13">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            Ordered vs Allocated by Supplier
          </CardTitle>
          <CardDescription>
            Side-by-side comparison of top 10 suppliers — click for insights
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div ref={chartRef} className="w-full">
            <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={top10ByOrders}
              margin={{ top: 5, right: 20, left: 10, bottom: 70 }}
              barCategoryGap="25%"
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="currentColor"
                strokeOpacity={0.1}
              />
              <XAxis
                dataKey="supplierName"
                tick={(p) => <CustomXAxisTick {...p} onClick={openModal} />}
                tickLine={false}
                axisLine={{ stroke: "currentColor", strokeOpacity: 0.2 }}
                interval={0}
              />
              <YAxis
                tickFormatter={(v) => numFmt(v)}
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: "currentColor", strokeOpacity: 0.2 }}
              />
              <Tooltip
                content={(p: unknown) => (
                  <GroupedBarTooltip
                    {...(p as Parameters<typeof GroupedBarTooltip>[0])}
                  />
                )}
              />
              <Bar
                dataKey="totalOrdered"
                name="Ordered"
                fill="#6366f1"
                radius={[4, 4, 0, 0]}
                barSize={orderedBarSize}
                onMouseEnter={(d) => setHoveredBar(`ord::${d.supplierName}`)}
                onMouseLeave={() => setHoveredBar(null)}
                onClick={(d) => openModal(d.supplierName)}
                cursor="pointer"
              >
                {top10ByOrders.map((e, i) => (
                  <Cell
                    key={i}
                    fill="#6366f1"
                    opacity={
                      selectedSupplier && selectedSupplier !== e.supplierName
                        ? 0.25
                        : 1
                    }
                  />
                ))}
              </Bar>
              <Bar
                dataKey="totalAllocated"
                name="Allocated"
                fill="#10b981"
                radius={[4, 4, 0, 0]}
                barSize={orderedBarSize}
                onMouseEnter={(d) => setHoveredBar(`alc::${d.supplierName}`)}
                onMouseLeave={() => setHoveredBar(null)}
                onClick={(d) => openModal(d.supplierName)}
                cursor="pointer"
              >
                {top10ByOrders.map((e, i) => (
                  <Cell
                    key={i}
                    fill="#10b981"
                    opacity={
                      selectedSupplier && selectedSupplier !== e.supplierName
                        ? 0.25
                        : 1
                    }
                  />
                ))}
              </Bar>
            </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-2">
            <div className="flex items-center gap-2">
              <span
                className="inline-block w-8 h-0.5 rounded-full"
                style={{ background: "#6366f1" }}
              />
              <span className="text-xs text-muted-foreground">Ordered</span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className="inline-block w-8 h-0.5 rounded-full"
                style={{ background: "#10b981" }}
              />
              <span className="text-xs text-muted-foreground">Allocated</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Chart 3: Allocation Rate by Supplier (lowest first) ── */}
      {/* <Card className="border-muted dark:border-zinc-700 dark:bg-white/13">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            Allocation Rate by Supplier
          </CardTitle>
          <CardDescription>
            Suppliers with lowest fill-rate (most under-allocated) — click for
            insights
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer
            width="100%"
            height={Math.max(240, top10ByRate.length * 36)}
          >
            <BarChart
              data={top10ByRate}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="currentColor"
                strokeOpacity={0.1}
              />
              <XAxis
                type="number"
                domain={[0, 100]}
                tickFormatter={(v) => `${v}%`}
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                type="category"
                dataKey="supplierName"
                width={155}
                tick={(p) => <CustomYAxisTick {...p} onClick={openModal} />}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                formatter={(v: number) => [
                  `${v.toFixed(1)}%`,
                  "Allocation Rate",
                ]}
              />
              <Bar
                dataKey="allocationRate"
                name="Allocation Rate %"
                radius={[0, 4, 4, 0]}
                onMouseEnter={(d) => setHoveredBar(`rate::${d.supplierName}`)}
                onMouseLeave={() => setHoveredBar(null)}
                onClick={(d) => openModal(d.supplierName)}
                cursor="pointer"
              >
                {top10ByRate.map((e, i) => (
                  <Cell
                    key={i}
                    fill={
                      e.allocationRate >= 90
                        ? "#10b981"
                        : e.allocationRate >= 70
                          ? "#f59e0b"
                          : "#ef4444"
                    }
                    opacity={
                      selectedSupplier && selectedSupplier !== e.supplierName
                        ? 0.25
                        : 1
                    }
                    style={cellStyle("rate", e.supplierName)}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card> */}

      {/* ── Supplier Table ── */}
      <Card className="border-muted dark:border-zinc-700 dark:bg-white/13">
        <CardHeader className="pb-2">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                Suppliers by Allocation — {supplierSummaries.length} suppliers
              </CardTitle>
              <span className="text-xs text-muted-foreground">
                Sorted by:{" "}
                <span className="font-medium">{String(sortKey)}</span>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Input
                placeholder="Search suppliers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 w-64"
              />
              {searchQuery ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("");
                    setAppliedSearch("");
                    setCurrentPage(1);
                  }}
                >
                  Clear
                </Button>
              ) : null}

              {/* <div className="flex items-center gap-2 ml-4">
                  <span className="text-sm text-muted-foreground">Show fully allocated</span>
                  <Switch
                    checked={showFullyAllocated}
                    onCheckedChange={(v) => {
                      setShowFullyAllocated(Boolean(v));
                      setCurrentPage(1);
                    }}
                  />
                </div> */}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ tableLayout: "fixed" }}>
              <colgroup>
                <col style={{ width: 200 }} />
                <col style={{ width: 80 }} />
                <col style={{ width: 110 }} />
                <col style={{ width: 115 }} />
                <col style={{ width: 80 }} />
                <col style={{ width: 80 }} />
                <col style={{ width: 90 }} />
                <col style={{ width: 110 }} />
              </colgroup>
              <thead>
                <tr className="border-b dark:border-zinc-700 bg-muted/30">
                  <th
                    className="py-3 pl-4 px-2 text-left font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                    onClick={() => handleSort("supplierName")}
                  >
                    Supplier {sortIcon("supplierName")}
                  </th>
                  <th
                    className="py-3 px-2 text-right font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                    onClick={() => handleSort("orderCount")}
                  >
                    Orders {sortIcon("orderCount")}
                  </th>
                  <th
                    className="py-3 px-2 text-right font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                    onClick={() => handleSort("totalOrdered")}
                  >
                    Total Ordered {sortIcon("totalOrdered")}
                  </th>
                  <th
                    className="py-3 px-2 text-right font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                    onClick={() => handleSort("totalAllocated")}
                  >
                    Total Allocated {sortIcon("totalAllocated")}
                  </th>
                  <th
                    className="py-3 px-2 text-right font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                    onClick={() => handleSort("allocationGap")}
                  >
                    Gap {sortIcon("allocationGap")}
                  </th>
                  <th
                    className="py-3 px-2 text-right font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                    onClick={() => handleSort("allocationRate")}
                  >
                    Rate {sortIcon("allocationRate")}
                  </th>
                  <th
                    className="py-3 px-2 text-right font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                    onClick={() => handleSort("percentShare")}
                  >
                    Gap Share {sortIcon("percentShare")}
                  </th>
                  <th
                    className="py-3 pr-4 pl-2 text-right font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                    onClick={() => handleSort("netAmount")}
                  >
                    Net Amount {sortIcon("netAmount")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedItems.map((row) => {
                  const isHighGap = row.allocationGap > 0;
                  const isFullyAllocated = row.allocationGap === 0;
                  return (
                    <React.Fragment key={row.supplierId}>
                      <tr
                        className={`border-b dark:border-zinc-800 hover:bg-muted/30 transition-colors ${isHighGap && row.percentShare > 10 ? "bg-rose-50/40 dark:bg-rose-950/20" : ""} ${isFullyAllocated ? "bg-emerald-50/30 dark:bg-emerald-950/10" : ""}`}
                      >
                        <td className="py-2.5 pl-4 px-2 font-medium">
                          <button
                            className="block truncate text-left w-full hover:text-primary transition-colors"
                            title={`${row.supplierName} — click to view products`}
                            onClick={() =>
                              setDrillDownSupplier((prev) =>
                                prev === row.supplierName
                                  ? null
                                  : row.supplierName,
                              )
                            }
                          >
                            {drillDownSupplier === row.supplierName ? (
                              <span className="text-primary">
                                ▾ {row.supplierName}
                              </span>
                            ) : (
                              row.supplierName
                            )}
                          </button>
                        </td>
                        <td className="py-2.5 px-2 text-right tabular-nums">
                          {numFmt(row.orderCount)}
                        </td>
                        <td className="py-2.5 px-2 text-right tabular-nums">
                          {numFmt(row.totalOrdered)}
                        </td>
                        <td className="py-2.5 px-2 text-right tabular-nums text-emerald-600 dark:text-emerald-400">
                          {numFmt(row.totalAllocated)}
                        </td>
                        <td className="py-2.5 px-2 text-right tabular-nums">
                          {row.allocationGap > 0 ? (
                            <span className="text-rose-600 dark:text-rose-400 font-medium">
                              {numFmt(row.allocationGap)}
                            </span>
                          ) : (
                            <span className="text-emerald-600 dark:text-emerald-400">
                              0
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-2 text-right">
                          <Badge
                            variant="outline"
                            className={`text-xs font-medium ${row.allocationRate >= 90 ? "border-emerald-500 text-emerald-600 dark:text-emerald-400" : row.allocationRate >= 70 ? "border-amber-500 text-amber-600 dark:text-amber-400" : "border-rose-500 text-rose-600 dark:text-rose-400"}`}
                          >
                            {pctFmt(row.allocationRate)}
                          </Badge>
                        </td>
                        <td className="py-2.5 px-2 text-right text-muted-foreground text-xs">
                          {pctFmt(row.percentShare)}
                        </td>
                        <td className="py-2.5 pr-4 pl-2 text-right tabular-nums">
                          ₱{numFmt(row.netAmount)}
                        </td>
                      </tr>
                      {/* ── Drill-down row ── */}
                      {drillDownSupplier === row.supplierName && (
                        <tr
                          key={`drill-${row.supplierId}`}
                          className="bg-muted/20 dark:bg-white/5"
                        >
                          <td colSpan={8} className="px-4 py-3">
                            <p className="text-xs font-semibold text-muted-foreground mb-2">
                              Products for{" "}
                              <span className="text-foreground">
                                {row.supplierName}
                              </span>{" "}
                              ({drillProducts.length} SKUs)
                            </p>
                            {drillProducts.length === 0 ? (
                              <p className="text-xs text-muted-foreground">
                                No product data found.
                              </p>
                            ) : (
                              <div className="overflow-x-auto rounded border dark:border-zinc-700">
                                <table
                                  className="w-full text-xs"
                                  style={{ tableLayout: "auto" }}
                                >
                                  <thead>
                                    <tr className="border-b dark:border-zinc-700 bg-muted/40">
                                      <th className="py-1.5 pl-3 pr-2 text-left font-medium text-muted-foreground">
                                        Product
                                      </th>
                                      <th className="py-1.5 px-2 text-left font-medium text-muted-foreground">
                                        Brand
                                      </th>
                                      <th className="py-1.5 px-2 text-right font-medium text-muted-foreground">
                                        Ordered
                                      </th>
                                      <th className="py-1.5 px-2 text-right font-medium text-muted-foreground">
                                        Allocated
                                      </th>
                                      <th className="py-1.5 px-2 text-right font-medium text-muted-foreground">
                                        Gap
                                      </th>
                                      <th className="py-1.5 pr-3 pl-2 text-right font-medium text-muted-foreground">
                                        Rate
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {drillProducts.slice(0, 20).map((p) => (
                                      <tr
                                        key={p.productId}
                                        className="border-b dark:border-zinc-800 last:border-0"
                                      >
                                        <td className="py-1.5 pl-3 pr-2 font-medium max-w-55">
                                          <span
                                            className="block truncate"
                                            title={p.productName}
                                          >
                                            {p.productName}
                                          </span>
                                        </td>
                                        <td className="py-1.5 px-2 text-muted-foreground max-w-30">
                                          <span className="block truncate">
                                            {p.brandName}
                                          </span>
                                        </td>
                                        <td className="py-1.5 px-2 text-right tabular-nums">
                                          {numFmt(p.totalOrdered)}
                                        </td>
                                        <td className="py-1.5 px-2 text-right tabular-nums text-emerald-600 dark:text-emerald-400">
                                          {numFmt(p.totalAllocated)}
                                        </td>
                                        <td className="py-1.5 px-2 text-right tabular-nums">
                                          {p.allocationGap > 0 ? (
                                            <span className="text-rose-600 dark:text-rose-400 font-medium">
                                              {numFmt(p.allocationGap)}
                                            </span>
                                          ) : (
                                            <span className="text-emerald-600 dark:text-emerald-400">
                                              —
                                            </span>
                                          )}
                                        </td>
                                        <td className="py-1.5 pr-3 pl-2 text-right">
                                          <span
                                            className={`font-medium ${p.allocationRate >= 90 ? "text-emerald-600 dark:text-emerald-400" : p.allocationRate >= 70 ? "text-amber-600 dark:text-amber-400" : "text-rose-600 dark:text-rose-400"}`}
                                          >
                                            {pctFmt(p.allocationRate)}
                                          </span>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                                {drillProducts.length > 20 && (
                                  <p className="text-xs text-muted-foreground px-3 py-2">
                                    Showing 20 of {drillProducts.length}{" "}
                                    products
                                  </p>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-4 border-t dark:border-zinc-700">
            <div className="flex items-center gap-4">
              <select
                className="h-8 rounded-md border border-input bg-background px-3 py-1 text-sm dark:border-zinc-700"
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className="text-sm text-muted-foreground">
                Showing {(currentPage - 1) * itemsPerPage + 1}–
                {Math.min(currentPage * itemsPerPage, sorted.length)} of{" "}
                {sorted.length}
              </span>
            </div>
            <Pagination
              page={currentPage}
              total={totalPages}
              onChange={setCurrentPage}
            />
          </div>
        )}
      </Card>

      {/* ── Supplier Modal ── */}
      <Dialog
        open={!!modalSupplier}
        onOpenChange={(o) => {
          if (!o) {
            setModalSupplier(null);
            setSelectedSupplier(null);
          }
        }}
      >
        <DialogContent className="max-w-md dark:border-zinc-700">
          <DialogHeader>
            <DialogTitle>{modalSupplier?.supplierName}</DialogTitle>
            <DialogDescription>Supplier allocation insights</DialogDescription>
          </DialogHeader>
          {modalSupplier && (
            <div className="space-y-0.5 pt-1">
              <InsightStat
                label="Total Ordered"
                value={numFmt(modalSupplier.totalOrdered)}
              />
              <InsightStat
                label="Total Allocated"
                value={numFmt(modalSupplier.totalAllocated)}
                color="text-emerald-600 dark:text-emerald-400"
              />
              <InsightStat
                label="Allocation Gap"
                value={numFmt(modalSupplier.allocationGap)}
                color={
                  modalSupplier.allocationGap > 0
                    ? "text-rose-600 dark:text-rose-400"
                    : "text-emerald-600 dark:text-emerald-400"
                }
              />
              <InsightStat
                label="Allocation Rate"
                value={pctFmt(modalSupplier.allocationRate)}
                color={
                  modalSupplier.allocationRate >= 90
                    ? "text-emerald-600 dark:text-emerald-400"
                    : modalSupplier.allocationRate >= 70
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-rose-600 dark:text-rose-400"
                }
              />
              <InsightStat
                label="Order Count"
                value={numFmt(modalSupplier.orderCount)}
              />
              <InsightStat
                label="Net Amount"
                value={`₱${numFmt(modalSupplier.netAmount)}`}
              />
              <InsightStat
                label="Gap Share"
                value={pctFmt(modalSupplier.percentShare)}
              />
              <InsightStat label="Rank" value={`#${modalSupplier.rank}`} />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
