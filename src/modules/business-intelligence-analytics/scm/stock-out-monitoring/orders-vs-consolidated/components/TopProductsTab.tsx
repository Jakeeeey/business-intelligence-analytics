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
import { useTheme } from "next-themes";
import type { ProductOrdersSummary } from "../types";
import { Switch } from "@/components/ui/switch";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
// import { Button } from "@/components/ui/button";
// import {
//   Popover,
//   PopoverTrigger,
//   PopoverContent,
// } from "@/components/ui/popover";
// import { ScrollArea } from "@/components/ui/scroll-area";
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
  const words = (payload.value || "").split(/\s+/);
  let line1 = "",
    line2 = "";
  for (const w of words) {
    if (!line1 || line1.length + w.length + 1 <= 12)
      line1 += (line1 ? " " : "") + w;
    else if (!line2 || line2.length + w.length + 1 <= 12)
      line2 += (line2 ? " " : "") + w;
  }
  if (line2.length > 12) line2 = line2.slice(0, 11) + "…";
  return (
    <g transform={`translate(${x},${y + 4})`}>
      <text
        textAnchor="end"
        fill="currentColor"
        fontSize={10}
        cursor={onClick ? "pointer" : "default"}
        onClick={onClick ? () => onClick(payload.value) : undefined}
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

/* ─── Tooltips ────────────────────────────────────────────────── */
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

/* ─── Brand Summary ───────────────────────────────────────────── */
// type BrandSummary = {
//   brandName: string;
//   totalOrdered: number;
//   orderCount: number;
// };

/* ─── Props ───────────────────────────────────────────────────── */
type Props = { productSummaries: ProductOrdersSummary[] };

/* ─── Pagination Helpers ──────────────────────────────────────── */
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
export function TopProductsTab({ productSummaries }: Props) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const colors = isDark ? chartColorsDark : chartColors;

  /* ─── Table state ── */
  const [sortKey, setSortKey] =
    React.useState<keyof ProductOrdersSummary>("totalOrdered");
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [itemsPerPage, setItemsPerPage] = React.useState(10);

  /* ─── Drill-down state ── */
  const [drillBrand, setDrillBrand] = React.useState("all");
  const [drillCategory, setDrillCategory] = React.useState("all");
  // Toggle: show/hide products that are fully consolidated (100%)
  const [showFullyConsolidated, setShowFullyConsolidated] =
    React.useState<boolean>(true);

  /* ─── Chart hover/modal ── */
  const [hoveredBar, setHoveredBar] = React.useState<string | null>(null);
  const [modalProduct, setModalProduct] =
    React.useState<ProductOrdersSummary | null>(null);
  const [selectedProduct, setSelectedProduct] = React.useState<string | null>(
    null,
  );
  // const [selectedBrand, setSelectedBrand] = React.useState<string | null>(null);
  // const [brandSearch] = React.useState("");
  // const [categorySearch] = React.useState("");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [appliedSearch, setAppliedSearch] = React.useState("");

  // Apply search dynamically while typing (debounced)
  React.useEffect(() => {
    const id = setTimeout(() => {
      setAppliedSearch(searchQuery);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(id);
  }, [searchQuery]);

  /* ─── Sort handler ── */
  const handleSort = React.useCallback(
    (key: keyof ProductOrdersSummary) => {
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
      [...productSummaries].sort((a, b) => {
        const va = a[sortKey] as number | string;
        const vb = b[sortKey] as number | string;
        if (typeof va === "number" && typeof vb === "number")
          return sortDir === "asc" ? va - vb : vb - va;
        return sortDir === "asc"
          ? String(va).localeCompare(String(vb))
          : String(vb).localeCompare(String(va));
      }),
    [productSummaries, sortKey, sortDir],
  );

  const top10Products = React.useMemo(
    () => productSummaries.slice(0, 10),
    [productSummaries],
  );
  const top10ByCount = React.useMemo(
    () =>
      [...productSummaries]
        .sort((a, b) => b.orderCount - a.orderCount)
        .slice(0, 10),
    [productSummaries],
  );
  // const brandSummaries = React.useMemo((): BrandSummary[] => {
  //   const map = new Map<string, BrandSummary>();
  //   for (const p of productSummaries) {
  //     const key = p.brandName || "Unknown";
  //     const existing = map.get(key);
  //     if (existing) {
  //       existing.totalOrdered += p.totalOrdered;
  //       existing.orderCount += p.orderCount;
  //     } else
  //       map.set(key, {
  //         brandName: key,
  //         totalOrdered: p.totalOrdered,
  //         orderCount: p.orderCount,
  //       });
  //   }
  //   return Array.from(map.values())
  //     .sort((a, b) => b.totalOrdered - a.totalOrdered)
  //     .slice(0, 10);
  // }, [productSummaries]);

  // const totalPages = Math.ceil(sorted.length / itemsPerPage);
  // const paginatedItems = sorted.slice(
  //   (currentPage - 1) * itemsPerPage,
  //   currentPage * itemsPerPage,
  // );

  /* NOTE: unique brand / category lists for dropdowns */
  // const uniqueBrands = React.useMemo(
  //   () =>
  //     [...new Set(productSummaries.map((p) => p.brandName))]
  //       .filter(Boolean)
  //       .sort(),
  //   [productSummaries],
  // );
  // const uniqueCategories = React.useMemo(
  //   () =>
  //     [...new Set(productSummaries.map((p) => p.categoryName))]
  //       .filter(Boolean)
  //       .sort(),
  //   [productSummaries],
  // );

  // const filteredBrands = React.useMemo(() => {
  //   if (!brandSearch) return uniqueBrands;
  //   return uniqueBrands.filter((b) =>
  //     b.toLowerCase().includes(brandSearch.toLowerCase()),
  //   );
  // }, [uniqueBrands, brandSearch]);

  // const filteredCategories = React.useMemo(() => {
  //   if (!categorySearch) return uniqueCategories;
  //   return uniqueCategories.filter((c) =>
  //     c.toLowerCase().includes(categorySearch.toLowerCase()),
  //   );
  // }, [uniqueCategories, categorySearch]);

  const filteredSorted = React.useMemo(() => {
    let data = sorted;
    if (drillBrand !== "all")
      data = data.filter((p) => p.brandName === drillBrand);
    if (drillCategory !== "all")
      data = data.filter((p) => p.categoryName === drillCategory);
    if (appliedSearch && appliedSearch.trim() !== "") {
      const q = appliedSearch.trim().toLowerCase();
      data = data.filter((p) => {
        const prod = (p.productName || "").toLowerCase();
        const brand = (p.brandName || "").toLowerCase();
        const cat = (p.categoryName || "").toLowerCase();
        return prod.includes(q) || brand.includes(q) || cat.includes(q);
      });
    }
    if (!showFullyConsolidated) {
      data = data.filter((p) => {
        const v = (p as unknown as ProductOrdersSummary).consolidationRate ?? 0;
        // If consolidationRate is given as a fraction (<= 1) treat 1 as 100%.
        // If given as percent (> 1) treat ~100 as 100%.
        const isFraction = Math.abs(v) <= 1;
        const isFully = isFraction ? v >= 0.999 : v >= 99.9;
        return !isFully;
      });
    }
    return data;
  }, [sorted, drillBrand, drillCategory, showFullyConsolidated, appliedSearch]);

  const filteredTotalPages = Math.ceil(filteredSorted.length / itemsPerPage);
  const filteredPaginatedItems = filteredSorted.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
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

  const sortIcon = (col: keyof ProductOrdersSummary) => (
    <span className="ml-1 opacity-50 text-xs">
      {sortKey === col ? (sortDir === "asc" ? "↑" : "↓") : "↕"}
    </span>
  );

  if (productSummaries.length === 0) {
    return (
      <Card className="border-muted dark:border-zinc-700 dark:bg-white/13">
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          No product data available. Generate a report to see results.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* ── Chart Row 1: Qty + Order Count ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top 10 by Qty Ordered */}
        <Card className="border-muted dark:border-zinc-700 dark:bg-white/13">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              Top Products by Qty Ordered
            </CardTitle>
            <CardDescription>Click a bar for insights</CardDescription>
          </CardHeader>
          <CardContent>
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
                  tick={(p) => (
                    <CustomXAxisTick
                      {...p}
                      onClick={(n) => {
                        setSelectedProduct((prev) => (prev === n ? null : n));
                        const f = productSummaries.find(
                          (x) => x.productName === n,
                        );
                        if (f) setModalProduct(f);
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
                  content={(p: unknown) => (
                    <CustomBarTooltip
                      {...(p as Parameters<typeof CustomBarTooltip>[0])}
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
                  onMouseEnter={(d) => setHoveredBar(`qty::${d.productName}`)}
                  onMouseLeave={() => setHoveredBar(null)}
                  onClick={(d) => {
                    setSelectedProduct((prev) =>
                      prev === d.productName ? null : d.productName,
                    );
                    const f = productSummaries.find(
                      (x) => x.productName === d.productName,
                    );
                    if (f) setModalProduct(f);
                  }}
                  cursor="pointer"
                >
                  {top10Products.map((e, i) => (
                    <Cell
                      key={i}
                      fill={colors[i % colors.length]}
                      opacity={
                        selectedProduct && selectedProduct !== e.productName
                          ? 0.25
                          : 1
                      }
                      style={cellStyle("qty", e.productName)}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top 10 by Order Count */}
        <Card className="border-muted dark:border-zinc-700 dark:bg-white/13">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              Top Products by Order Count
            </CardTitle>
            <CardDescription>Click a bar for insights</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={top10ByCount}
                margin={{ top: 5, right: 20, left: 10, bottom: 70 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="currentColor"
                  strokeOpacity={0.1}
                />
                <XAxis
                  dataKey="productName"
                  tick={(p) => (
                    <CustomXAxisTick
                      {...p}
                      onClick={(n) => {
                        setSelectedProduct((prev) => (prev === n ? null : n));
                        const f = productSummaries.find(
                          (x) => x.productName === n,
                        );
                        if (f) setModalProduct(f);
                      }}
                    />
                  )}
                  tickLine={false}
                  axisLine={false}
                  interval={0}
                  height={70}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  content={(p: unknown) => (
                    <CustomBarTooltip
                      {...(p as Parameters<typeof CustomBarTooltip>[0])}
                      data={
                        top10ByCount as unknown as Array<
                          Record<string, unknown>
                        >
                      }
                      valueKey="orderCount"
                      nameKey="productName"
                      valueLabel="Order Count"
                    />
                  )}
                />
                <Bar
                  dataKey="orderCount"
                  name="Order Count"
                  radius={[4, 4, 0, 0]}
                  onMouseEnter={(d) => setHoveredBar(`cnt::${d.productName}`)}
                  onMouseLeave={() => setHoveredBar(null)}
                  onClick={(d) => {
                    setSelectedProduct((prev) =>
                      prev === d.productName ? null : d.productName,
                    );
                    const f = productSummaries.find(
                      (x) => x.productName === d.productName,
                    );
                    if (f) setModalProduct(f);
                  }}
                  cursor="pointer"
                >
                  {top10ByCount.map((e, i) => (
                    <Cell
                      key={i}
                      fill={colors[i % colors.length]}
                      opacity={
                        selectedProduct && selectedProduct !== e.productName
                          ? 0.25
                          : 1
                      }
                      style={cellStyle("cnt", e.productName)}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* ── Chart Row 2: Brands ── */}
      {/* <Card className="border-muted dark:border-zinc-700 dark:bg-white/13">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Ordered Quantity by Brand</CardTitle>
          <CardDescription>Click a bar for insights</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              data={brandSummaries}
              margin={{ top: 5, right: 20, left: 10, bottom: 70 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="currentColor"
                strokeOpacity={0.1}
              />
              <XAxis
                dataKey="brandName"
                tick={(p) => (
                  <CustomXAxisTick
                    {...p}
                    onClick={(n) =>
                      setSelectedBrand((prev) => (prev === n ? null : n))
                    }
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
                content={(p: unknown) => (
                  <CustomBarTooltip
                    {...(p as Parameters<typeof CustomBarTooltip>[0])}
                    data={
                      brandSummaries as unknown as Array<
                        Record<string, unknown>
                      >
                    }
                    valueKey="totalOrdered"
                    nameKey="brandName"
                    valueLabel="Qty Ordered"
                  />
                )}
              />
              <Bar
                dataKey="totalOrdered"
                name="Qty Ordered"
                radius={[4, 4, 0, 0]}
                onMouseEnter={(d) => setHoveredBar(`brand::${d.brandName}`)}
                onMouseLeave={() => setHoveredBar(null)}
                onClick={(d) =>
                  setSelectedBrand((prev) =>
                    prev === d.brandName ? null : d.brandName,
                  )
                }
                cursor="pointer"
              >
                {brandSummaries.map((e, i) => (
                  <Cell
                    key={i}
                    fill={colors[i % colors.length]}
                    opacity={
                      selectedBrand && selectedBrand !== e.brandName ? 0.25 : 1
                    }
                    style={cellStyle("brand", e.brandName)}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card> */}

      {/* ── Product Table ── */}
      <Card className="border-muted dark:border-zinc-700 dark:bg-white/13">
        <CardHeader className="pb-2">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                All Products — {filteredSorted.length} of{" "}
                {productSummaries.length} items
              </CardTitle>
              <span className="text-xs text-muted-foreground">
                Sorted by:{" "}
                <span className="font-medium">{String(sortKey)}</span>
              </span>
            </div>
            {/* Drill-down filters + search */}
            <div className="pt-2">
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Search product, supplier, category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      setAppliedSearch(searchQuery);
                      setCurrentPage(1);
                    }
                  }}
                  className="max-w-sm dark:border-zinc-700"
                />
                {/* <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setAppliedSearch(searchQuery);
                    setCurrentPage(1);
                  }}
                >
                  Search
                </Button>
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
                </Button> */}
                <label className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                  <Switch
                    checked={showFullyConsolidated}
                    onCheckedChange={(v) => {
                      setShowFullyConsolidated(Boolean(v));
                      setCurrentPage(1);
                    }}
                    size="sm"
                  />
                  <span>Show fully consolidated</span>
                </label>
                {(drillBrand !== "all" || drillCategory !== "all") && (
                  <button
                    className="text-xs text-muted-foreground hover:text-foreground underline"
                    onClick={() => {
                      setDrillBrand("all");
                      setDrillCategory("all");
                      setCurrentPage(1);
                    }}
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
            {/* <div className="flex flex-wrap items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="min-w-40 justify-between dark:border-zinc-700"
                  >
                    {drillBrand !== "all" ? drillBrand : "All Brands"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-80 max-w-[20rem] p-0 dark:border-zinc-700 overflow-hidden"
                  align="start"
                >
                  <div className="p-2 border-b dark:border-zinc-700 dark:bg-white/13">
                    <Input
                      placeholder="Search brands..."
                      value={brandSearch}
                      onChange={(e) => setBrandSearch(e.target.value)}
                      className="h-8 dark:border-zinc-700"
                    />
                  </div>
                  <ScrollArea className="h-64 w-full">
                    <div className="p-2 space-y-1 dark:bg-white/13">
                      <div
                        className="px-2 py-1 hover:bg-muted rounded cursor-pointer"
                        onClick={() => {
                          setDrillBrand("all");
                          setCurrentPage(1);
                        }}
                      >
                        All Brands
                      </div>
                      {filteredBrands.map((b) => (
                        <div
                          key={b}
                          className="px-2 py-1 hover:bg-muted rounded cursor-pointer"
                          onClick={() => {
                            setDrillBrand(b);
                            setCurrentPage(1);
                          }}
                        >
                          {b}
                        </div>
                      ))}
                      {filteredBrands.length === 0 && (
                        <p className="text-xs text-muted-foreground py-2 text-center">
                          No options found
                        </p>
                      )}
                    </div>
                  </ScrollArea>
                </PopoverContent>
              </Popover>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="min-w-40 justify-between dark:border-zinc-700"
                  >
                    {drillCategory !== "all" ? drillCategory : "All Categories"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-80 max-w-[20rem] p-0 dark:border-zinc-700 overflow-hidden"
                  align="start"
                >
                  <div className="p-2 border-b dark:border-zinc-700 dark:bg-white/13">
                    <Input
                      placeholder="Search categories..."
                      value={categorySearch}
                      onChange={(e) => setCategorySearch(e.target.value)}
                      className="h-8 dark:border-zinc-700"
                    />
                  </div>
                  <ScrollArea className="h-64 w-full">
                    <div className="p-2 space-y-1 dark:bg-white/13">
                      <div
                        className="px-2 py-1 hover:bg-muted rounded cursor-pointer"
                        onClick={() => {
                          setDrillCategory("all");
                          setCurrentPage(1);
                        }}
                      >
                        All Categories
                      </div>
                      {filteredCategories.map((c) => (
                        <div
                          key={c}
                          className="px-2 py-1 hover:bg-muted rounded cursor-pointer"
                          onClick={() => {
                            setDrillCategory(c);
                            setCurrentPage(1);
                          }}
                        >
                          {c}
                        </div>
                      ))}
                      {filteredCategories.length === 0 && (
                        <p className="text-xs text-muted-foreground py-2 text-center">
                          No options found
                        </p>
                      )}
                    </div>
                  </ScrollArea>
                </PopoverContent>
              </Popover>
              <label className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                <Switch
                  checked={showFullyConsolidated}
                  onCheckedChange={(v) => {
                    setShowFullyConsolidated(Boolean(v));
                    setCurrentPage(1);
                  }}
                  size="sm"
                />
                <span>Show fully consolidated</span>
              </label>
              {(drillBrand !== "all" || drillCategory !== "all") && (
                <button
                  className="text-xs text-muted-foreground hover:text-foreground underline"
                  onClick={() => {
                    setDrillBrand("all");
                    setDrillCategory("all");
                    setCurrentPage(1);
                  }}
                >
                  Clear
                </button>
              )}
            </div> */}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ tableLayout: "fixed" }}>
              <colgroup>
                <col style={{ width: 220 }} />
                <col style={{ width: 130 }} />
                <col style={{ width: 130 }} />
                <col style={{ width: 70 }} />
                <col style={{ width: 110 }} />
                <col style={{ width: 110 }} />
                <col style={{ width: 120 }} />
                <col style={{ width: 90 }} />
                <col style={{ width: 80 }} />
                <col style={{ width: 120 }} />
              </colgroup>
              <thead>
                <tr className="border-b dark:border-zinc-700 bg-muted/30">
                  <th
                    className="py-3 pl-4 pr-2 text-left font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                    onClick={() => handleSort("productName")}
                  >
                    Product {sortIcon("productName")}
                  </th>
                  <th
                    className="py-3 px-2 text-left font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                    onClick={() => handleSort("brandName")}
                  >
                    Brand {sortIcon("brandName")}
                  </th>
                  <th
                    className="py-3 px-2 text-left font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                    onClick={() => handleSort("categoryName")}
                  >
                    Category {sortIcon("categoryName")}
                  </th>
                  <th className="py-3 px-2 text-left font-medium text-muted-foreground">
                    Unit
                  </th>
                  <th
                    className="py-3 px-2 text-right font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                    onClick={() => handleSort("totalOrdered")}
                  >
                    Qty Ordered {sortIcon("totalOrdered")}
                  </th>
                  <th
                    className="py-3 px-2 text-right font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                    onClick={() => handleSort("totalConsolidated")}
                  >
                    Consolidated {sortIcon("totalConsolidated")}
                  </th>
                  <th
                    className="py-3 px-2 text-right font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                    onClick={() => handleSort("consolidationRate")}
                  >
                    Consolidation Rate {sortIcon("consolidationRate")}
                  </th>

                  <th
                    className="py-3 px-2 text-right font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                    onClick={() => handleSort("orderCount")}
                  >
                    Orders {sortIcon("orderCount")}
                  </th>
                  <th
                    className="py-3 px-2 text-right font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                    onClick={() => handleSort("percentShare")}
                  >
                    Share {sortIcon("percentShare")}
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
                {filteredPaginatedItems.map((row) => (
                  <tr
                    key={row.productId}
                    className="border-b dark:border-zinc-800 hover:bg-muted/30 transition-colors"
                  >
                    <td className="py-2.5 pl-4 pr-2 font-medium">
                      <span className="block truncate" title={row.productName}>
                        {row.productName}
                      </span>
                    </td>
                    <td className="py-2.5 px-2 text-sm text-muted-foreground">
                      <span className="block truncate">{row.brandName}</span>
                    </td>
                    <td className="py-2.5 px-2 text-sm text-muted-foreground">
                      <span className="block truncate">{row.categoryName}</span>
                    </td>
                    <td className="py-2.5 px-2 text-xs text-muted-foreground">
                      {row.unit}
                    </td>
                    <td className="py-2.5 px-2 text-right tabular-nums font-medium">
                      {numFmt(row.totalOrdered)}
                    </td>
                    <td className="py-2.5 px-2 text-right tabular-nums font-medium">
                      {numFmt(
                        (row as unknown as ProductOrdersSummary)
                          .totalConsolidated ?? 0,
                      )}
                    </td>
                    <td className="py-2.5 px-2 text-right text-xs text-muted-foreground">
                      {pctFmt(
                        (row as unknown as ProductOrdersSummary)
                          .consolidationRate ?? 0,
                      )}
                    </td>
                    <td className="py-2.5 px-2 text-right tabular-nums">
                      {numFmt(row.orderCount)}
                    </td>
                    <td className="py-2.5 px-2 text-right text-muted-foreground text-xs">
                      {pctFmt(row.percentShare)}
                    </td>
                    <td className="py-2.5 pr-4 pl-2 text-right tabular-nums">
                      ₱{numFmt(row.netAmount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
        <div className="flex items-center justify-between px-4 py-4 border-t dark:border-zinc-700">
          <div className="flex items-center gap-4">
            <NativeSelect
              size="sm"
              value={String(itemsPerPage)}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="w-20"
            >
              <NativeSelectOption value="10">10</NativeSelectOption>
              <NativeSelectOption value="25">25</NativeSelectOption>
              <NativeSelectOption value="50">50</NativeSelectOption>
              <NativeSelectOption value="100">100</NativeSelectOption>
            </NativeSelect>
            <span className="text-sm text-muted-foreground">
              Showing {(currentPage - 1) * itemsPerPage + 1}–
              {Math.min(currentPage * itemsPerPage, filteredSorted.length)} of{" "}
              {filteredSorted.length}
            </span>
          </div>
          {filteredTotalPages > 1 && (
            <Pagination
              page={currentPage}
              total={filteredTotalPages}
              onChange={setCurrentPage}
            />
          )}
        </div>
      </Card>

      {/* ── Product Modal ── */}
      <Dialog
        open={!!modalProduct}
        onOpenChange={(o) => {
          if (!o) {
            setModalProduct(null);
            setSelectedProduct(null);
          }
        }}
      >
        <DialogContent className="max-w-md dark:border-zinc-700">
          <DialogHeader>
            <DialogTitle className="leading-snug">
              {modalProduct?.productName}
            </DialogTitle>
            <DialogDescription>Product order insights</DialogDescription>
          </DialogHeader>
          {modalProduct && (
            <div className="space-y-0.5 pt-1">
              <InsightStat
                label="Brand"
                value={modalProduct.brandName || "—"}
              />
              <InsightStat
                label="Category"
                value={modalProduct.categoryName || "—"}
              />
              <InsightStat label="Unit" value={modalProduct.unit || "—"} />
              <InsightStat
                label="Qty Ordered"
                value={numFmt(modalProduct.totalOrdered)}
              />
              <InsightStat
                label="Order Count"
                value={numFmt(modalProduct.orderCount)}
              />
              <InsightStat
                label="Share %"
                value={pctFmt(modalProduct.percentShare)}
              />
              <InsightStat
                label="Net Amount"
                value={`₱${numFmt(modalProduct.netAmount)}`}
              />
              <InsightStat label="Rank" value={`#${modalProduct.rank}`} />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
