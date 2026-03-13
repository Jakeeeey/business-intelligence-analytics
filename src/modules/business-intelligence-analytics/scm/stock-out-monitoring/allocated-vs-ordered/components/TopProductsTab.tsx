"use client";

import * as React from "react";
import {
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
import { Badge } from "@/components/ui/badge";
import { useTheme } from "next-themes";
// import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ProductAllocationSummary } from "../types";

/* ─── Helpers ───────────────────────────────────────────────── */

function numFmt(n: number) {
  return n.toLocaleString("en-PH", { maximumFractionDigits: 2 });
}
function pctFmt(n: number) {
  return `${n.toFixed(1)}%`;
}

/* ─── Colors ─────────────────────────────────────────────────── */

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

// Fully Allocated excluded — only 2 statuses shown in donut
const STATUS_COLORS = ["#f59e0b", "#ef4444"];

/* ─── Custom Tooltip ─────────────────────────────────────────── */

type ProductBarTooltipProps = {
  active?: boolean;
  payload?: Array<{ payload?: ProductAllocationSummary; value?: number }>;
  totalGap: number;
};

const ProductBarTooltip = React.memo(function ProductBarTooltip({
  active,
  payload,
  totalGap,
}: ProductBarTooltipProps) {
  if (!active || !payload?.length) return null;
  const item = payload[0]?.payload;
  if (!item) return null;
  const contribution =
    totalGap > 0 ? ((item.allocationGap / totalGap) * 100).toFixed(1) : "0.0";
  return (
    <div className="rounded-lg border bg-background p-3 shadow-md text-sm min-w-48 space-y-1 pointer-events-none">
      <p className="font-semibold text-foreground leading-snug line-clamp-2">
        {item.productName}
      </p>
      <div className="border-t border-border pt-1.5 space-y-1">
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Gap</span>
          <span className="font-medium tabular-nums text-rose-600">
            {numFmt(item.allocationGap)}
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Rate</span>
          <span className="font-medium">{pctFmt(item.allocationRate)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Contribution</span>
          <span className="font-medium">{contribution}%</span>
        </div>
        <p className="text-[10px] text-primary pt-0.5 italic">
          Click for quick insights
        </p>
      </div>
    </div>
  );
});

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

/* ─── Custom Y-axis tick (clickable, word-wrapped) ───────────── */

function CustomYTick({
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
  return (
    <g transform={`translate(${x},${y})`}>
      <text
        textAnchor="end"
        fill="currentColor"
        fontSize={10}
        cursor={onClick ? "pointer" : "default"}
        onClick={onClick ? () => onClick(fullName) : undefined}
      >
        <tspan x={0} dy={hasTwoLines ? -5 : 4}>
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

/* ─── Sort icon ──────────────────────────────────────────────── */

function SortIcon({
  col,
  sortKey,
  sortDir,
}: {
  col: keyof ProductAllocationSummary;
  sortKey: keyof ProductAllocationSummary;
  sortDir: "asc" | "desc";
}) {
  return (
    <span className="ml-1 text-xs opacity-50 select-none">
      {sortKey === col ? (sortDir === "asc" ? "↑" : "↓") : "↕"}
    </span>
  );
}

/* ─── Props ──────────────────────────────────────────────────── */

type Props = {
  productSummaries: ProductAllocationSummary[];
};

/* ─── Component ──────────────────────────────────────────────── */

export function TopProductsTab({ productSummaries }: Props) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const activeChartColors = isDark ? chartColorsDark : chartColors;

  /* ─── Table state ────────────────────────────────────────── */
  const [sortKey, setSortKey] =
    React.useState<keyof ProductAllocationSummary>("allocationGap");
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [itemsPerPage, setItemsPerPage] = React.useState(10);

  const [searchQuery, setSearchQuery] = React.useState("");
  const [appliedSearch, setAppliedSearch] = React.useState("");
  const [showFullyAllocated] =
    React.useState<boolean>(true);

  /* ─── Chart state ────────────────────────────────────────── */
  const [hoveredBar, setHoveredBar] = React.useState<number | null>(null);
  const [selectedBar, setSelectedBar] = React.useState<number | null>(null);
  const [hoveredDonutIdx, setHoveredDonutIdx] = React.useState<number | null>(
    null,
  );
  const [activeDonutIdx, setActiveDonutIdx] = React.useState<number | null>(
    null,
  );
  const effectiveDonutIdx = hoveredDonutIdx ?? activeDonutIdx;

  /* ─── Modal ──────────────────────────────────────────────── */
  const [modal, setModal] = React.useState<ProductAllocationSummary | null>(
    null,
  );

  /* ─── Sort handler ───────────────────────────────────────── */
  const handleSort = React.useCallback(
    (key: keyof ProductAllocationSummary) => {
      if (key === sortKey) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortKey(key);
        setSortDir("desc");
      }
    },
    [sortKey],
  );

  /* ─── Sorted data ────────────────────────────────────────── */
  const sorted = React.useMemo(() => {
    // Apply search and toggle filters before sorting
    let data = productSummaries;
    if (appliedSearch && appliedSearch.trim() !== "") {
      const q = appliedSearch.trim().toLowerCase();
      data = data.filter(
        (p) =>
          p.productName.toLowerCase().includes(q) ||
          p.brandName.toLowerCase().includes(q) ||
          p.categoryName.toLowerCase().includes(q),
      );
    }
    if (!showFullyAllocated) {
      data = data.filter(
        (p) =>
          !(
            p.allocationRate >= 99.999 ||
            (p.allocationGap === 0 && p.totalOrdered > 0)
          ),
      );
    }
    return [...data].sort((a, b) => {
      const va = a[sortKey] as number | string;
      const vb = b[sortKey] as number | string;
      if (typeof va === "number" && typeof vb === "number") {
        return sortDir === "asc" ? va - vb : vb - va;
      }
      return sortDir === "asc"
        ? String(va).localeCompare(String(vb))
        : String(vb).localeCompare(String(va));
    });
  }, [productSummaries, sortKey, sortDir, appliedSearch, showFullyAllocated]);

  /* ─── Reset page on sort change ──────────────────────────── */
  React.useEffect(() => {
    setCurrentPage(1);
  }, [sortKey, sortDir]);

  /* ─── Pagination ─────────────────────────────────────────── */
  const totalPages = Math.ceil(sorted.length / itemsPerPage);
  const paginatedItems = React.useMemo(
    () =>
      sorted.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage,
      ),
    [sorted, currentPage, itemsPerPage],
  );

  // Debounce appliedSearch from searchQuery
  React.useEffect(() => {
    const id = setTimeout(() => {
      setAppliedSearch(searchQuery);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(id);
  }, [searchQuery]);

  /* ─── Chart data ─────────────────────────────────────────── */
  const top10 = React.useMemo(
    () => productSummaries.slice(0, 10),
    [productSummaries],
  );
  const totalGap = React.useMemo(
    () => top10.reduce((s, p) => s + p.allocationGap, 0),
    [top10],
  );

  /* ─── Donut: allocation status breakdown (excludes Fully Allocated) ─────────────────── */
  const allocationStatusData = React.useMemo(() => {
    let partial = 0;
    let none = 0;
    for (const p of productSummaries) {
      if (p.allocationGap === 0) {
        /* Fully Allocated — intentionally excluded (always 0) */
      } else if (p.totalAllocated > 0) partial++;
      else none++;
    }
    return [
      { name: "Partially Allocated", value: partial },
      { name: "Not Allocated", value: none },
    ];
  }, [productSummaries]);

  /* ─── Handlers ───────────────────────────────────────────── */
  const handleBarClick = React.useCallback(
    (data: ProductAllocationSummary, index: number) => {
      setSelectedBar((prev) => (prev === index ? null : index));
      setModal(data);
    },
    [],
  );

  const handleLabelClick = React.useCallback(
    (name: string) => {
      const found = productSummaries.find((p) => p.productName === name);
      if (found) setModal(found);
    },
    [productSummaries],
  );

  /* ─── Empty state ────────────────────────────────────────── */
  if (productSummaries.length === 0) {
    return (
      <Card className="border-muted dark:border-zinc-700 dark:bg-white/13">
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          No product data available.
        </CardContent>
      </Card>
    );
  }

  /* ─── Donut legend ───────────────────────────────────────── */
  const donutLegend = allocationStatusData.map((d, i) => (
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
  ));

  return (
    <div className="space-y-4">
      {/* ── Charts row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Bar: Top 10 products by gap */}
        <Card className="lg:col-span-3 border-muted dark:border-zinc-700 dark:bg-white/13">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              Top 10 Products by Allocation Gap
            </CardTitle>
            <CardDescription>
              Click bar or label for quick insights
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={top10}
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
                  axisLine={{ stroke: "currentColor", strokeOpacity: 0.2 }}
                />
                <YAxis
                  type="category"
                  dataKey="productName"
                  tickLine={false}
                  axisLine={{ stroke: "currentColor", strokeOpacity: 0.2 }}
                  width={155}
                  tick={(props) => (
                    <CustomYTick {...props} onClick={handleLabelClick} />
                  )}
                />
                <Tooltip
                  content={(props: unknown) => {
                    const p = props as ProductBarTooltipProps;
                    return (
                      <ProductBarTooltip
                        active={p.active}
                        payload={p.payload}
                        totalGap={totalGap}
                      />
                    );
                  }}
                />
                <Bar
                  dataKey="allocationGap"
                  name="Allocation Gap"
                  radius={[0, 4, 4, 0]}
                  onMouseEnter={(_, index) => setHoveredBar(index)}
                  onMouseLeave={() => setHoveredBar(null)}
                  onClick={(data: ProductAllocationSummary, index: number) =>
                    handleBarClick(data, index)
                  }
                  cursor="pointer"
                  animationDuration={400}
                >
                  {top10.map((_, i) => (
                    <Cell
                      key={`prod-${i}`}
                      fill={activeChartColors[i % activeChartColors.length]}
                      opacity={
                        selectedBar !== null && selectedBar !== i
                          ? 0.2
                          : hoveredBar !== null && hoveredBar !== i
                            ? 0.65
                            : 1
                      }
                      style={{
                        filter:
                          hoveredBar === i
                            ? "brightness(1.25) drop-shadow(0 0 4px rgba(0,0,0,0.22))"
                            : undefined,
                        transition: "filter 0.1s ease, opacity 0.12s ease",
                        cursor: "pointer",
                      }}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Donut: Allocation status distribution */}
        <Card className="lg:col-span-2 border-muted dark:border-zinc-700 dark:bg-white/13">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              Product Allocation Status
            </CardTitle>
            <CardDescription>
              {productSummaries.length} product
              {productSummaries.length !== 1 ? "s" : ""} total
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center gap-2">
              <ResponsiveContainer width="100%" height={190}>
                <PieChart>
                  <Pie
                    data={allocationStatusData}
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
                    {allocationStatusData.map((_, i) => (
                      <Cell
                        key={i}
                        fill={STATUS_COLORS[i % STATUS_COLORS.length]}
                        opacity={
                          effectiveDonutIdx !== null && effectiveDonutIdx !== i
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
                    formatter={(v: number) => [numFmt(v), "Products"]}
                    contentStyle={{ fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-0.5 w-full px-2">
                {donutLegend}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Table ── */}
      <Card className="border-muted dark:border-zinc-700 dark:bg-white/13">
        <CardHeader className="pb-2">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                Products by Allocation — {productSummaries.length} items
              </CardTitle>
              <span className="text-xs text-muted-foreground">
                Sorted by:{" "}
                <span className="font-medium">{String(sortKey)}</span>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Input
                placeholder="Search products, brands, categories..."
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
                <span className="text-sm text-muted-foreground">
                  Show fully allocated
                </span>
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
            {/* table-layout: fixed prevents column width shifting on sort */}
            <table className="w-full text-sm" style={{ tableLayout: "fixed" }}>
              <colgroup>
                <col style={{ width: 240 }} /> {/* Product */}
                <col style={{ width: 120 }} /> {/* Brand */}
                <col style={{ width: 120 }} /> {/* Category */}
                <col style={{ width: 64 }} /> {/* Unit */}
                <col style={{ width: 90 }} /> {/* Ordered */}
                <col style={{ width: 90 }} /> {/* Allocated */}
                <col style={{ width: 80 }} /> {/* Gap */}
                <col style={{ width: 80 }} /> {/* Rate */}
                <col style={{ width: 110 }} /> {/* Net Amount */}
              </colgroup>
              <thead>
                <tr className="border-b dark:border-zinc-700 bg-muted/30">
                  <th
                    className="py-3 pl-4 px-2 text-left font-medium text-muted-foreground cursor-pointer hover:text-foreground select-none"
                    onClick={() => handleSort("productName")}
                  >
                    Product{" "}
                    <SortIcon
                      col="productName"
                      sortKey={sortKey}
                      sortDir={sortDir}
                    />
                  </th>
                  <th
                    className="py-3 px-2 text-left font-medium text-muted-foreground cursor-pointer hover:text-foreground select-none"
                    onClick={() => handleSort("brandName")}
                  >
                    Brand{" "}
                    <SortIcon
                      col="brandName"
                      sortKey={sortKey}
                      sortDir={sortDir}
                    />
                  </th>
                  <th
                    className="py-3 px-2 text-left font-medium text-muted-foreground cursor-pointer hover:text-foreground select-none"
                    onClick={() => handleSort("categoryName")}
                  >
                    Category{" "}
                    <SortIcon
                      col="categoryName"
                      sortKey={sortKey}
                      sortDir={sortDir}
                    />
                  </th>
                  <th className="py-3 px-2 text-left font-medium text-muted-foreground">
                    Unit
                  </th>
                  <th
                    className="py-3 px-2 text-right font-medium text-muted-foreground cursor-pointer hover:text-foreground select-none"
                    onClick={() => handleSort("totalOrdered")}
                  >
                    Ordered{" "}
                    <SortIcon
                      col="totalOrdered"
                      sortKey={sortKey}
                      sortDir={sortDir}
                    />
                  </th>
                  <th
                    className="py-3 px-2 text-right font-medium text-muted-foreground cursor-pointer hover:text-foreground select-none"
                    onClick={() => handleSort("totalAllocated")}
                  >
                    Allocated{" "}
                    <SortIcon
                      col="totalAllocated"
                      sortKey={sortKey}
                      sortDir={sortDir}
                    />
                  </th>
                  <th
                    className="py-3 px-2 text-right font-medium text-muted-foreground cursor-pointer hover:text-foreground select-none"
                    onClick={() => handleSort("allocationGap")}
                  >
                    Gap{" "}
                    <SortIcon
                      col="allocationGap"
                      sortKey={sortKey}
                      sortDir={sortDir}
                    />
                  </th>
                  <th
                    className="py-3 px-2 text-right font-medium text-muted-foreground cursor-pointer hover:text-foreground select-none"
                    onClick={() => handleSort("allocationRate")}
                  >
                    Rate{" "}
                    <SortIcon
                      col="allocationRate"
                      sortKey={sortKey}
                      sortDir={sortDir}
                    />
                  </th>
                  <th
                    className="py-3 pr-4 pl-2 text-right font-medium text-muted-foreground cursor-pointer hover:text-foreground select-none"
                    onClick={() => handleSort("netAmount")}
                  >
                    Net Amount{" "}
                    <SortIcon
                      col="netAmount"
                      sortKey={sortKey}
                      sortDir={sortDir}
                    />
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedItems.map((row) => {
                  const isShortage = row.allocationGap > 0;
                  const isFullyAllocated = row.allocationGap === 0;
                  return (
                    <tr
                      key={row.productId}
                      className={[
                        "border-b dark:border-zinc-800 hover:bg-muted/30 transition-colors",
                        isShortage ? "bg-rose-50/40 dark:bg-rose-950/20" : "",
                        isFullyAllocated
                          ? "bg-emerald-50/30 dark:bg-emerald-950/10"
                          : "",
                      ].join(" ")}
                    >
                      <td className="py-2.5 pl-4 px-2 font-medium overflow-hidden">
                        <span
                          className="block truncate"
                          title={row.productName}
                        >
                          {row.productName}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-sm text-muted-foreground overflow-hidden">
                        <span className="block truncate">{row.brandName}</span>
                      </td>
                      <td className="py-2.5 px-2 text-sm text-muted-foreground overflow-hidden">
                        <span className="block truncate">
                          {row.categoryName}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-xs text-muted-foreground">
                        {row.unit}
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
                          className={[
                            "text-xs font-medium",
                            row.allocationRate >= 90
                              ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
                              : row.allocationRate >= 70
                                ? "border-amber-500 text-amber-600 dark:text-amber-400"
                                : "border-rose-500 text-rose-600 dark:text-rose-400",
                          ].join(" ")}
                        >
                          {pctFmt(row.allocationRate)}
                        </Badge>
                      </td>
                      <td className="py-2.5 pr-4 pl-2 text-right tabular-nums">
                        ₱{numFmt(row.netAmount)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>

        {/* Pagination */}
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
                Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                {Math.min(currentPage * itemsPerPage, sorted.length)} of{" "}
                {sorted.length} items
              </span>
            </div>
            <div className="flex gap-1">
              <button
                className="inline-flex items-center justify-center rounded-md border border-input bg-background px-3 h-8 text-sm dark:border-zinc-700 disabled:opacity-50"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum = i + 1;
                if (totalPages > 5) {
                  if (currentPage <= 3) pageNum = i + 1;
                  else if (currentPage >= totalPages - 2)
                    pageNum = totalPages - 4 + i;
                  else pageNum = currentPage - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    className={`inline-flex items-center justify-center rounded-md border px-3 h-8 text-sm dark:border-zinc-700 ${currentPage === pageNum ? "bg-primary text-primary-foreground border-primary" : "border-input bg-background"}`}
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                className="inline-flex items-center justify-center rounded-md border border-input bg-background px-3 h-8 text-sm dark:border-zinc-700 disabled:opacity-50"
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* ── Product Quick Insight Modal ── */}
      <Dialog
        open={!!modal}
        onOpenChange={(open) => {
          if (!open) setModal(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">
              Product Quick Insights
            </DialogTitle>
            <DialogDescription className="text-sm font-semibold text-foreground line-clamp-2">
              {modal?.productName}
            </DialogDescription>
          </DialogHeader>
          {modal && (
            <div className="space-y-0 mt-1">
              <InsightStat label="Brand" value={modal.brandName} />
              <InsightStat label="Category" value={modal.categoryName} />
              <InsightStat label="Unit" value={modal.unit} />
              <InsightStat label="Rank" value={`#${modal.rank}`} />
              <InsightStat
                label="Total Ordered"
                value={numFmt(modal.totalOrdered)}
              />
              <InsightStat
                label="Total Allocated"
                value={numFmt(modal.totalAllocated)}
                color="text-emerald-600 dark:text-emerald-400"
              />
              <InsightStat
                label="Allocation Gap"
                value={numFmt(modal.allocationGap)}
                color={
                  modal.allocationGap > 0
                    ? "text-rose-600 dark:text-rose-400"
                    : "text-emerald-600 dark:text-emerald-400"
                }
              />
              <InsightStat
                label="Gap Share"
                value={pctFmt(modal.percentShare)}
              />
              <InsightStat
                label="Net Amount"
                value={`₱${numFmt(modal.netAmount)}`}
              />
              <div className="pt-3">
                <div className="flex justify-between items-center text-xs mb-1.5">
                  <span className="text-muted-foreground">Allocation Rate</span>
                  <Badge
                    variant="outline"
                    className={
                      modal.allocationRate >= 90
                        ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
                        : modal.allocationRate >= 70
                          ? "border-amber-500 text-amber-600 dark:text-amber-400"
                          : "border-rose-500 text-rose-600 dark:text-rose-400"
                    }
                  >
                    {pctFmt(modal.allocationRate)}
                  </Badge>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      modal.allocationRate >= 90
                        ? "bg-emerald-500"
                        : modal.allocationRate >= 70
                          ? "bg-amber-500"
                          : "bg-rose-500"
                    }`}
                    style={{
                      width: `${Math.min(100, modal.allocationRate)}%`,
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
