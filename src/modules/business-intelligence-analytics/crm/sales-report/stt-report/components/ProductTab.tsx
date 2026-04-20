// src/modules/business-intelligence-analytics/sales-report/sales-report-summary/components/ProductTab.tsx
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { useTheme } from "next-themes";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ProductSummary } from "../types";

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
const phpFmtShort = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const numFmt = new Intl.NumberFormat("en-US");

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const BarTooltip = React.memo(({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const item = payload[0]?.payload;
  return (
    <div className="rounded-lg border bg-background p-3 shadow-md text-sm space-y-1 min-w-52">
      <p className="font-semibold leading-snug">
        {item?.fullName ?? item?.name}
      </p>
      <div className="border-t border-border pt-1.5 space-y-1">
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Revenue</span>
          <span className="font-medium tabular-nums">
            {phpFmt.format(item.totalAmount)}
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Qty Sold</span>
          <span className="font-medium">
            {numFmt.format(item.totalQuantity)}
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Return Amt</span>
          <span className="font-medium tabular-nums">
            {phpFmt.format(item.returnAmount)}
          </span>
        </div>
      </div>
    </div>
  );
});
BarTooltip.displayName = "BarTooltip";

type CustomYTickProps = {
  x?: number;
  y?: number;
  payload?: { value: string; index: number };
  colors: string[];
  chartData: Array<{ name: string; fullName: string }>;
  onClickIdx: (idx: number) => void;
};

const CustomYTick = React.memo(
  ({
    x = 0,
    y = 0,
    payload,
    colors,
    chartData,
    onClickIdx,
  }: CustomYTickProps) => {
    if (!payload) return null;
    const itemIdx =
      chartData.findIndex((d) => d.name === payload.value) !== -1
        ? chartData.findIndex((d) => d.name === payload.value)
        : payload.index;
    const item = chartData[itemIdx];
    if (!item) return null;
    return (
      <g
        transform={`translate(${x},${y})`}
        style={{ cursor: "pointer" }}
        onClick={() => onClickIdx(itemIdx)}
      >
        <title>{item.fullName}</title>
        <text
          x={0}
          y={0}
          dy={4}
          textAnchor="end"
          fontSize={10}
          fill={colors[payload.index % colors.length]}
        >
          {payload.value}
        </text>
      </g>
    );
  },
);
CustomYTick.displayName = "CustomYTick";

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50, 100];

function getPageNumbers(page: number, totalPages: number): (number | "…")[] {
  if (totalPages <= 7)
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  const nums: (number | "…")[] = [1];
  if (page > 3) nums.push("…");
  for (
    let i = Math.max(2, page - 1);
    i <= Math.min(totalPages - 1, page + 1);
    i++
  )
    nums.push(i);
  if (page < totalPages - 2) nums.push("…");
  nums.push(totalPages);
  return nums;
}

type ProductTabProps = {
  productSummaries: ProductSummary[];
};

const SortIndicator = ({
  k,
  sortKey,
  sortDir,
}: {
  k: keyof ProductSummary;
  sortKey: keyof ProductSummary;
  sortDir: "asc" | "desc";
}) => (
  <span className="inline-block w-3 ml-0.5 text-xs select-none">
    {sortKey === k ? (
      sortDir === "asc" ? (
        "↑"
      ) : (
        "↓"
      )
    ) : (
      <span className="opacity-0">↓</span>
    )}
  </span>
);

function ProductTabComponent({ productSummaries }: ProductTabProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const colors = isDark ? CHART_COLORS_DARK : CHART_COLORS;

  const [search, setSearch] = React.useState("");
  const [sortKey, setSortKey] =
    React.useState<keyof ProductSummary>("totalAmount");
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("desc");
  const [activeBarIdx, setActiveBarIdx] = React.useState<number | null>(null);
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [animKey, setAnimKey] = React.useState(0);
  const pendingScrollId = React.useRef<string | null>(null);

  const toggleSort = (key: keyof ProductSummary) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("desc");
    }
    setPage(1);
    setAnimKey((k) => k + 1);
  };

  const filtered = React.useMemo(() => {
    const q = search.toLowerCase();
    const list = q
      ? productSummaries.filter(
          (p) =>
            (p.name ?? "").toLowerCase().includes(q) ||
            (p.supplier ?? "").toLowerCase().includes(q) ||
            (p.category ?? "").toLowerCase().includes(q),
        )
      : productSummaries;
    return [...list].sort((a, b) => {
      const av = a[sortKey] as number;
      const bv = b[sortKey] as number;
      if (typeof av === "number") return sortDir === "asc" ? av - bv : bv - av;
      return 0;
    });
  }, [productSummaries, search, sortKey, sortDir]);

  // Chart reflects current sort order (top 10 of filtered)
  const chartData = React.useMemo(
    () =>
      filtered.slice(0, 10).map((p) => ({
        name: p.name.length > 28 ? p.name.slice(0, 28) + "…" : p.name,
        fullName: p.name,
        totalAmount: p.totalAmount,
        totalQuantity: p.totalQuantity,
        returnAmount: p.returnAmount,
      })),
    [filtered],
  );

  const gridColor = isDark ? "#3f3f46" : "#e4e4e7";
  const tickColor = isDark ? "#a1a1aa" : "#71717a";

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  React.useEffect(() => setPage(1), [search, pageSize]);

  const from = filtered.length === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, filtered.length);
  const pageNums = getPageNumbers(page, totalPages);

  // Scroll to product row after page change
  React.useEffect(() => {
    if (pendingScrollId.current) {
      const id = pendingScrollId.current;
      pendingScrollId.current = null;
      requestAnimationFrame(() => {
        document
          .getElementById(id)
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    }
  }, [page]);

  const scrollToProduct = React.useCallback(
    (barIdx: number) => {
      const rowId = `product-row-${barIdx}`;
      const el = document.getElementById(rowId);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      } else {
        const targetPage = Math.floor(barIdx / pageSize) + 1;
        pendingScrollId.current = rowId;
        setPage(targetPage);
      }
    },
    [pageSize],
  );

  return (
    <div className="space-y-4">
      {/* Chart */}
      <Card className="dark:border-zinc-700 ">
        <CardHeader>
          <CardTitle>Top 10 Products by Revenue</CardTitle>
          <CardDescription>
            Click a bar or Product label to jump to that product in the Product
            Performance Table
          </CardDescription>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No data
            </p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart
                  data={chartData}
                  layout="vertical"
                  margin={{ top: 4, right: 16, left: 0, bottom: 4 }}
                  onMouseLeave={() => setActiveBarIdx(null)}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={gridColor}
                    horizontal={false}
                  />
                  <XAxis
                    type="number"
                    tickFormatter={(v) => phpFmtShort.format(v)}
                    tick={{ fontSize: 10, fill: tickColor }}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={175}
                    interval={0}
                    tick={(props) => (
                      <CustomYTick
                        {...props}
                        colors={colors}
                        chartData={chartData}
                        onClickIdx={scrollToProduct}
                      />
                    )}
                  />
                  <RechartsTooltip
                    content={<BarTooltip />}
                    cursor={{ fill: "transparent" }}
                  />
                  <Bar
                    dataKey="totalAmount"
                    name="Revenue"
                    radius={[0, 3, 3, 0]}
                    onMouseEnter={(_, idx) => setActiveBarIdx(idx)}
                    onClick={(_, idx) => scrollToProduct(idx)}
                    style={{ cursor: "pointer" }}
                  >
                    {chartData.map((_, i) => (
                      <Cell
                        key={i}
                        fill={colors[i % colors.length]}
                        stroke={
                          activeBarIdx === i
                            ? colors[i % colors.length]
                            : "transparent"
                        }
                        strokeWidth={activeBarIdx === i ? 2 : 0}
                        style={{
                          transition: "stroke 0.15s, filter 0.15s",
                          filter:
                            activeBarIdx === i ? "brightness(1.15)" : "none",
                        }}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              {/* Clickable legend */}
              {/* <div className="flex flex-wrap gap-2 mt-3 px-1">
                {chartData.map((item, i) => (
                  <button
                    key={i}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer rounded px-1.5 py-0.5 hover:bg-muted"
                    onClick={() => scrollToProduct(i)}
                    title={item.fullName}
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-sm shrink-0 inline-block"
                      style={{ backgroundColor: colors[i % colors.length] }}
                    />
                    <span className="max-w-[120px] truncate">{item.name}</span>
                  </button>
                ))}
              </div> */}
            </>
          )}
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="dark:border-zinc-700 ">
        <CardHeader>
          <CardTitle>Product Performance Table</CardTitle>
          <CardDescription>
            All products — click headers to sort
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="px-4 pb-3 pt-2">
            <Input
              placeholder="Search product, supplier, category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm dark:border-zinc-700"
            />
          </div>
          <div className="overflow-x-auto">
            <Table className="table-fixed min-w-215">
              <TableHeader>
                <TableRow className="dark:border-zinc-700">
                  <TableHead className="w-12">#</TableHead>
                  <TableHead className="w-50">Product</TableHead>
                  <TableHead className="w-35">Supplier</TableHead>
                  <TableHead className="w-30">Category</TableHead>
                  <TableHead
                    className="w-22.5 cursor-pointer hover:text-foreground text-right"
                    onClick={() => toggleSort("totalQuantity")}
                  >
                    Qty
                    <SortIndicator
                      k="totalQuantity"
                      sortKey={sortKey}
                      sortDir={sortDir}
                    />
                  </TableHead>
                  <TableHead
                    className="w-32.5 cursor-pointer hover:text-foreground text-right"
                    onClick={() => toggleSort("totalAmount")}
                  >
                    Revenue
                    <SortIndicator
                      k="totalAmount"
                      sortKey={sortKey}
                      sortDir={sortDir}
                    />
                  </TableHead>
                  <TableHead
                    className="w-30 or-pointer hover:text-foreground text-right"
                    onClick={() => toggleSort("totalDiscount")}
                  >
                    Discount
                    <SortIndicator
                      k="totalDiscount"
                      sortKey={sortKey}
                      sortDir={sortDir}
                    />
                  </TableHead>
                  <TableHead
                    className="w-22.5 cursor-pointer hover:text-foreground text-right"
                    onClick={() => toggleSort("returnQuantity")}
                  >
                    Rtn Qty
                    <SortIndicator
                      k="returnQuantity"
                      sortKey={sortKey}
                      sortDir={sortDir}
                    />
                  </TableHead>
                  <TableHead
                    className="w-30 cursor-pointer hover:text-foreground text-right"
                    onClick={() => toggleSort("returnAmount")}
                  >
                    Rtn Amt
                    <SortIndicator
                      k="returnAmount"
                      sortKey={sortKey}
                      sortDir={sortDir}
                    />
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody
                key={animKey}
                className="animate-in fade-in-0 duration-200"
              >
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No products found
                    </TableCell>
                  </TableRow>
                )}
                {paginated.map((p, pageIdx) => {
                  const filteredIdx = (page - 1) * pageSize + pageIdx;
                  return (
                    <TableRow
                      key={p.name}
                      id={`product-row-${filteredIdx}`}
                      className="dark:border-zinc-700"
                    >
                      <TableCell className="text-muted-foreground text-sm">
                        {filteredIdx + 1}
                      </TableCell>
                      <TableCell className="overflow-hidden">
                        <p className="truncate font-medium" title={p.name}>
                          {p.name}
                        </p>
                      </TableCell>
                      <TableCell className="overflow-hidden">
                        <p
                          className="truncate text-muted-foreground"
                          title={p.supplier}
                        >
                          {p.supplier}
                        </p>
                      </TableCell>
                      <TableCell className="overflow-hidden">
                        <p
                          className="truncate text-muted-foreground"
                          title={p.category}
                        >
                          {p.category}
                        </p>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {numFmt.format(p.totalQuantity)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-medium">
                        {phpFmt.format(p.totalAmount)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {phpFmt.format(p.totalDiscount || 0)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {numFmt.format(p.returnQuantity)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {phpFmt.format(p.returnAmount)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Standard Pagination */}
          <div className="flex items-center justify-between px-4 py-3 border-t dark:border-zinc-700 gap-4 flex-wrap">
            <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
              <div className="flex items-center gap-1.5">
                <span>Show</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                  className="h-8 rounded-md border border-input bg-background px-2 py-1 text-xs ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-900"
                >
                  {PAGE_SIZE_OPTIONS.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
                <span>per page</span>
              </div>
              <span>
                Showing {from} to {to} of {filtered.length} results
              </span>
            </div>
            <div className="flex items-center gap-1 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2.5 text-xs dark:border-zinc-700"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="h-3 w-3 mr-0.5" />
                Previous
              </Button>
              {pageNums.map((p, i) =>
                p === "…" ? (
                  <span
                    key={`ellipsis-${i}`}
                    className="px-1 text-muted-foreground text-sm select-none"
                  >
                    …
                  </span>
                ) : (
                  <Button
                    key={p}
                    variant={p === page ? "default" : "outline"}
                    size="sm"
                    className="h-8 w-8 p-0 text-xs dark:border-zinc-700"
                    onClick={() => setPage(p as number)}
                  >
                    {p}
                  </Button>
                ),
              )}
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2.5 text-xs dark:border-zinc-700"
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
                <ChevronRight className="h-3 w-3 ml-0.5" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export const ProductTab = React.memo(ProductTabComponent);
