"use client";

import * as React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
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
import type { SupplierOrdersSummary } from "../types";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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

/* ─── Custom Axis Ticks ───────────────────────────────────────── */
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

/* ─── Bar Tooltip ─────────────────────────────────────────────── */
const BarTooltip = React.memo(function BarTooltip({
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
          <span className="font-medium">{contribution}%</span>
        </div>
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
type Props = { supplierSummaries: SupplierOrdersSummary[] };

export function SuppliersTab({ supplierSummaries }: Props) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const colors = isDark ? chartColorsDark : chartColors;

  /* ─── Table state ── */
  const [sortKey, setSortKey] =
    React.useState<keyof SupplierOrdersSummary>("totalOrders");
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [itemsPerPage, setItemsPerPage] = React.useState(10);

  /* ─── Drill-down state ── */
  const [drillSupplier] = React.useState("all");
  const [drillStatus] = React.useState("all");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [appliedSearch, setAppliedSearch] = React.useState("");
  const [showFullyConsolidated, setShowFullyConsolidated] =
    React.useState<boolean>(true);

  /* ─── Chart state ── */
  const [hoveredBar, setHoveredBar] = React.useState<string | null>(null);
  const [selectedSupplier, setSelectedSupplier] = React.useState<string | null>(
    null,
  );
  const [modalSupplier, setModalSupplier] =
    React.useState<SupplierOrdersSummary | null>(null);

  const handleSort = React.useCallback(
    (key: keyof SupplierOrdersSummary) => {
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
  const sorted = React.useMemo(
    () =>
      [...supplierSummaries].sort((a, b) => {
        const va = a[sortKey] as number | string;
        const vb = b[sortKey] as number | string;
        if (typeof va === "number" && typeof vb === "number")
          return sortDir === "asc" ? va - vb : vb - va;
        return sortDir === "asc"
          ? String(va).localeCompare(String(vb))
          : String(vb).localeCompare(String(va));
      }),
    [supplierSummaries, sortKey, sortDir],
  );

  const top10ByOrders = React.useMemo(
    () => supplierSummaries.slice(0, 10),
    [supplierSummaries],
  );
  const top10ByPending = React.useMemo(
    () =>
      supplierSummaries
        .filter((s) => s.pendingOrders > 0)
        .sort((a, b) => b.pendingOrders - a.pendingOrders)
        .slice(0, 10),
    [supplierSummaries],
  );
  const top10ByQty = React.useMemo(
    () =>
      [...supplierSummaries]
        .sort((a, b) => b.totalOrdered - a.totalOrdered)
        .slice(0, 10),
    [supplierSummaries],
  );

  const filteredSorted = React.useMemo(() => {
    let data = sorted;
    if (drillSupplier !== "all")
      data = data.filter((s) => s.supplierName === drillSupplier);
    if (drillStatus === "pending")
      data = data.filter((s) => s.pendingOrders > 0);
    else if (drillStatus === "consolidated")
      data = data.filter(
        (s) => s.totalConsolidated === s.totalOrders && s.totalOrders > 0,
      );
    // Apply search (product/supplier/category) if provided
    if (appliedSearch && appliedSearch.trim() !== "") {
      const q = appliedSearch.trim().toLowerCase();
      data = data.filter((s) => s.supplierName.toLowerCase().includes(q));
    }
    // Exclude fully consolidated suppliers when toggle is off
    if (!showFullyConsolidated) {
      data = data.filter(
        (s) => !(s.totalConsolidated === s.totalOrders && s.totalOrders > 0),
      );
    }
    return data;
  }, [
    sorted,
    drillSupplier,
    drillStatus,
    appliedSearch,
    showFullyConsolidated,
  ]);

  const totalPages = Math.ceil(filteredSorted.length / itemsPerPage);
  const paginatedItems = filteredSorted.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  // Apply search dynamically while typing (debounced)
  React.useEffect(() => {
    const id = setTimeout(() => {
      setAppliedSearch(searchQuery);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(id);
  }, [searchQuery]);

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

  const openModal = React.useCallback(
    (name: string) => {
      setSelectedSupplier((prev) => (prev === name ? null : name));
      const found = supplierSummaries.find((s) => s.supplierName === name);
      if (found) setModalSupplier(found);
    },
    [supplierSummaries],
  );

  const sortIcon = (col: keyof SupplierOrdersSummary) => (
    <span className="ml-1 opacity-50 text-xs">
      {sortKey === col ? (sortDir === "asc" ? "↑" : "↓") : "↕"}
    </span>
  );

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
      {/* ── Chart Row 1: Orders by Supplier ── */}
      <Card className="border-muted dark:border-zinc-700 dark:bg-white/13">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Orders by Supplier</CardTitle>
          <CardDescription>
            Top 10 by quantity ordered — click for insights
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer
            width="100%"
            height={Math.max(240, top10ByOrders.length * 36)}
          >
            <BarChart
              data={top10ByOrders}
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
                allowDecimals={false}
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: "currentColor", strokeOpacity: 0.3 }}
              />
              <YAxis
                type="category"
                dataKey="supplierName"
                width={155}
                tick={(p) => <CustomYAxisTick {...p} onClick={openModal} />}
                tickLine={false}
                axisLine={{ stroke: "currentColor", strokeOpacity: 0.3 }}
              />
              <Tooltip
                content={(p: unknown) => (
                  <BarTooltip
                    {...(p as Parameters<typeof BarTooltip>[0])}
                    data={
                      top10ByOrders as unknown as Array<Record<string, unknown>>
                    }
                    valueKey="totalOrders"
                    nameKey="supplierName"
                    valueLabel="Total Orders"
                  />
                )}
              />
              <Bar
                dataKey="totalOrders"
                name="Orders"
                radius={[0, 4, 4, 0]}
                onMouseEnter={(d) => setHoveredBar(`ord::${d.supplierName}`)}
                onMouseLeave={() => setHoveredBar(null)}
                onClick={(d) => openModal(d.supplierName)}
                cursor="pointer"
              >
                {top10ByOrders.map((e, i) => (
                  <Cell
                    key={i}
                    fill={colors[i % colors.length]}
                    opacity={
                      selectedSupplier && selectedSupplier !== e.supplierName
                        ? 0.25
                        : 1
                    }
                    style={cellStyle("ord", e.supplierName)}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* ── Chart Row 2: For Consolidation Orders by Supplier ── */}
      {top10ByPending.length > 0 && (
        <Card className="border-muted dark:border-zinc-700 dark:bg-white/13">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              For Consolidation Orders by Supplier
            </CardTitle>
            <CardDescription>
              Suppliers with the most orders for consolidation — click for
              insights
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer
              width="100%"
              height={Math.max(200, top10ByPending.length * 36)}
            >
              <BarChart
                data={top10ByPending}
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
                  allowDecimals={false}
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: "currentColor", strokeOpacity: 0.3 }}
                />
                <YAxis
                  type="category"
                  dataKey="supplierName"
                  width={155}
                  tick={(p) => <CustomYAxisTick {...p} onClick={openModal} />}
                  tickLine={false}
                  axisLine={{ stroke: "currentColor", strokeOpacity: 0.3 }}
                />
                <Tooltip
                  content={(p: unknown) => (
                    <BarTooltip
                      {...(p as Parameters<typeof BarTooltip>[0])}
                      data={
                        top10ByPending as unknown as Array<
                          Record<string, unknown>
                        >
                      }
                      valueKey="pendingOrders"
                      nameKey="supplierName"
                      valueLabel="For Consolidation Orders"
                    />
                  )}
                />
                <Bar
                  dataKey="pendingOrders"
                  name="For Consolidation"
                  radius={[0, 4, 4, 0]}
                  fill="#f59e0b"
                  onMouseEnter={(d) => setHoveredBar(`pend::${d.supplierName}`)}
                  onMouseLeave={() => setHoveredBar(null)}
                  onClick={(d) => openModal(d.supplierName)}
                  cursor="pointer"
                >
                  {top10ByPending.map((e, i) => (
                    <Cell
                      key={i}
                      fill="#f59e0b"
                      opacity={
                        selectedSupplier && selectedSupplier !== e.supplierName
                          ? 0.25
                          : 1
                      }
                      style={cellStyle("pend", e.supplierName)}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* ── Chart Row 3: Ordered Qty by Supplier ── */}
      <Card className="border-muted dark:border-zinc-700 dark:bg-white/13">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            Ordered Quantity by Supplier
          </CardTitle>
          <CardDescription>
            Top 10 by quantity ordered — click for insights
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer
            width="100%"
            height={Math.max(240, top10ByQty.length * 36)}
          >
            <BarChart
              data={top10ByQty}
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
                axisLine={{ stroke: "currentColor", strokeOpacity: 0.3 }}
              />
              <YAxis
                type="category"
                dataKey="supplierName"
                width={155}
                tick={(p) => <CustomYAxisTick {...p} onClick={openModal} />}
                tickLine={false}
                axisLine={{ stroke: "currentColor", strokeOpacity: 0.3 }}
              />
              <Tooltip
                content={(p: unknown) => (
                  <BarTooltip
                    {...(p as Parameters<typeof BarTooltip>[0])}
                    data={
                      top10ByQty as unknown as Array<Record<string, unknown>>
                    }
                    valueKey="totalOrdered"
                    nameKey="supplierName"
                    valueLabel="Qty Ordered"
                  />
                )}
              />
              <Bar
                dataKey="totalOrdered"
                name="Qty Ordered"
                radius={[0, 4, 4, 0]}
                onMouseEnter={(d) => setHoveredBar(`qty::${d.supplierName}`)}
                onMouseLeave={() => setHoveredBar(null)}
                onClick={(d) => openModal(d.supplierName)}
                cursor="pointer"
              >
                {top10ByQty.map((e, i) => (
                  <Cell
                    key={i}
                    fill={colors[i % colors.length]}
                    opacity={
                      selectedSupplier && selectedSupplier !== e.supplierName
                        ? 0.25
                        : 1
                    }
                    style={cellStyle("qty", e.supplierName)}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* ── Suppliers Table ── */}
      <Card className="border-muted dark:border-zinc-700 dark:bg-white/13">
        <CardHeader className="pb-2">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                All Suppliers — {filteredSorted.length} of{" "}
                {supplierSummaries.length} suppliers
              </CardTitle>
              <span className="text-xs text-muted-foreground">
                Sorted by:{" "}
                <span className="font-medium">{String(sortKey)}</span>
              </span>
            </div>
            {/* Drill-down filters */}
            {/* <div className="flex flex-wrap items-center gap-2">
              <select
                className="h-8 rounded-md border border-input bg-background px-3 py-1 text-sm dark:border-zinc-700"
                value={drillSupplier}
                onChange={(e) => {
                  setDrillSupplier(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="all">All Suppliers</option>
                {supplierSummaries.map((s) => (
                  <option key={s.supplierId} value={s.supplierName}>
                    {s.supplierName}
                  </option>
                ))}
              </select>
              <select
                className="h-8 rounded-md border border-input bg-background px-3 py-1 text-sm dark:border-zinc-700"
                value={drillStatus}
                onChange={(e) => {
                  setDrillStatus(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="all">All Statuses</option>
                <option value="pending">Has Pending</option>
                <option value="consolidated">Fully Consolidated</option>
              </select>
              {(drillSupplier !== "all" || drillStatus !== "all") && (
                <button
                  className="text-xs text-muted-foreground hover:text-foreground underline"
                  onClick={() => {
                    setDrillSupplier("all");
                    setDrillStatus("all");
                    setCurrentPage(1);
                  }}
                >
                  Clear
                </button>
              )}
            </div> */}
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

              <div className="flex items-center gap-2 ml-4">
                <span className="text-sm text-muted-foreground">
                  Show fully consolidated
                </span>
                <Switch
                  checked={showFullyConsolidated}
                  onCheckedChange={(v) => {
                    setShowFullyConsolidated(Boolean(v));
                    setCurrentPage(1);
                  }}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ tableLayout: "fixed" }}>
              <colgroup>
                <col style={{ width: 200 }} />
                <col style={{ width: 110 }} />
                <col style={{ width: 110 }} />
                <col style={{ width: 90 }} />
                <col style={{ width: 80 }} />
                <col style={{ width: 110 }} />
                <col style={{ width: 80 }} />
                <col style={{ width: 130 }} />
              </colgroup>
              <thead>
                <tr className="border-b dark:border-zinc-700 bg-muted/30">
                  <th
                    className="py-3 pl-4 pr-2 text-left font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                    onClick={() => handleSort("supplierName")}
                  >
                    Supplier {sortIcon("supplierName")}
                  </th>
                  <th
                    className="py-3 px-2 text-right font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                    onClick={() => handleSort("totalOrders")}
                  >
                    Total Orders {sortIcon("totalOrders")}
                  </th>
                  <th
                    className="py-3 px-2 text-right font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                    onClick={() => handleSort("totalConsolidated")}
                  >
                    Consolidated {sortIcon("totalConsolidated")}
                  </th>
                  <th
                    className="py-3 px-2 text-right font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                    onClick={() => handleSort("pendingOrders")}
                  >
                    Pending {sortIcon("pendingOrders")}
                  </th>
                  <th className="py-3 px-2 text-right font-medium text-muted-foreground">
                    Rate
                  </th>
                  <th
                    className="py-3 px-2 text-right font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                    onClick={() => handleSort("totalOrdered")}
                  >
                    Qty Ordered {sortIcon("totalOrdered")}
                  </th>
                  <th
                    className="py-3 px-2 text-right font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                    onClick={() => handleSort("percentShare")}
                  >
                    Share {sortIcon("percentShare")}
                  </th>
                  <th
                    className="py-3 pr-4 pl-2 text-right font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                    onClick={() => handleSort("totalNetAmount")}
                  >
                    Net Amount {sortIcon("totalNetAmount")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedItems.map((row) => {
                  const rate =
                    row.totalOrders > 0
                      ? (row.totalConsolidated / row.totalOrders) * 100
                      : 0;
                  const hasPending = row.pendingOrders > 0;
                  return (
                    <tr
                      key={row.supplierId}
                      className={`border-b dark:border-zinc-800 hover:bg-muted/30 transition-colors ${hasPending && row.pendingOrders > 2 ? "bg-amber-50/30 dark:bg-amber-950/10" : ""}`}
                    >
                      <td className="py-2.5 pl-4 pr-2 font-medium">
                        <span
                          className="block truncate"
                          title={row.supplierName}
                        >
                          {row.supplierName}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-right tabular-nums font-medium">
                        {numFmt(row.totalOrders)}
                      </td>
                      <td className="py-2.5 px-2 text-right tabular-nums text-emerald-600 dark:text-emerald-400">
                        {numFmt(row.totalConsolidated)}
                      </td>
                      <td className="py-2.5 px-2 text-right tabular-nums">
                        {row.pendingOrders > 0 ? (
                          <span className="text-amber-600 dark:text-amber-400 font-medium">
                            {numFmt(row.pendingOrders)}
                          </span>
                        ) : (
                          <span className="text-emerald-600 dark:text-emerald-400">
                            —
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-2 text-right">
                        <Badge
                          variant="outline"
                          className={`text-xs font-medium ${rate >= 90 ? "border-emerald-500 text-emerald-600 dark:text-emerald-400" : rate >= 70 ? "border-amber-500 text-amber-600 dark:text-amber-400" : "border-rose-500 text-rose-600 dark:text-rose-400"}`}
                        >
                          {pctFmt(rate)}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-2 text-right tabular-nums">
                        {numFmt(row.totalOrdered)}
                      </td>
                      <td className="py-2.5 px-2 text-right text-muted-foreground text-xs">
                        {pctFmt(row.percentShare)}
                      </td>
                      <td className="py-2.5 pr-4 pl-2 text-right tabular-nums">
                        ₱{numFmt(row.totalNetAmount)}
                      </td>
                    </tr>
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
                {Math.min(currentPage * itemsPerPage, filteredSorted.length)} of{" "}
                {filteredSorted.length}
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
            <DialogDescription>
              Supplier consolidation insights
            </DialogDescription>
          </DialogHeader>
          {modalSupplier && (
            <div className="space-y-0.5 pt-1">
              <InsightStat
                label="Total Orders"
                value={numFmt(modalSupplier.totalOrders)}
              />
              <InsightStat
                label="Consolidated"
                value={numFmt(modalSupplier.totalConsolidated)}
                color="text-emerald-600 dark:text-emerald-400"
              />
              <InsightStat
                label="Pending"
                value={numFmt(modalSupplier.pendingOrders)}
                color={
                  modalSupplier.pendingOrders > 0
                    ? "text-amber-600 dark:text-amber-400"
                    : ""
                }
              />
              <InsightStat
                label="Consolidation Rate"
                value={pctFmt(
                  modalSupplier.totalOrders > 0
                    ? (modalSupplier.totalConsolidated /
                        modalSupplier.totalOrders) *
                        100
                    : 0,
                )}
              />
              <InsightStat
                label="Qty Ordered"
                value={numFmt(modalSupplier.totalOrdered)}
              />
              <InsightStat
                label="Net Amount"
                value={`₱${numFmt(modalSupplier.totalNetAmount)}`}
              />
              <InsightStat
                label="Share %"
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
