// src/modules/business-intelligence-analytics/sales-report/sales-report-summary/components/SalesmanTab.tsx
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { SalesmanSummary } from "../types";

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
const pct = (a: number, b: number) =>
  b > 0 ? `${((a / b) * 100).toFixed(2)}%` : "N/A";

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
          <span className="text-muted-foreground">Total Sales</span>
          <span className="font-medium tabular-nums">
            {phpFmt.format(item.totalSales)}
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Collections</span>
          <span className="font-medium tabular-nums">
            {phpFmt.format(item.totalCollections)}
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Invoices</span>
          <span className="font-medium">
            {numFmt.format(item.invoiceCount)}
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Collection Rate</span>
          <span className="font-medium">
            {pct(item.totalCollections, item.totalSales)}
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
  onClickName: (name: string) => void;
};

const CustomYTick = React.memo(
  ({
    x = 0,
    y = 0,
    payload,
    colors,
    chartData,
    onClickName,
  }: CustomYTickProps) => {
    if (!payload) return null;
    const item =
      chartData.find((d) => d.name === payload.value) ??
      chartData[payload.index];
    if (!item) return null;
    return (
      <g
        transform={`translate(${x},${y})`}
        style={{ cursor: "pointer" }}
        onClick={() => onClickName(item.fullName)}
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

type SalesmanTabProps = {
  salesmanSummaries: SalesmanSummary[];
};

const SortIndicator = ({
  k,
  sortKey,
  sortDir,
}: {
  k: keyof SalesmanSummary;
  sortKey: keyof SalesmanSummary;
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

function SalesmanTabComponent({ salesmanSummaries }: SalesmanTabProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const colors = isDark ? CHART_COLORS_DARK : CHART_COLORS;

  const [search, setSearch] = React.useState("");
  const [sortKey, setSortKey] =
    React.useState<keyof SalesmanSummary>("totalSales");
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("desc");
  const [activeBarIdx, setActiveBarIdx] = React.useState<number | null>(null);
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [animKey, setAnimKey] = React.useState(0);
  const [scrollTrigger, setScrollTrigger] = React.useState<string | null>(null);

  const toggleSort = (key: keyof SalesmanSummary) => {
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
      ? salesmanSummaries.filter((s) =>
          (s.name ?? "N/A").toLowerCase().includes(q),
        )
      : salesmanSummaries;
    return [...list].sort((a, b) => {
      const av = a[sortKey] as number;
      const bv = b[sortKey] as number;
      return sortDir === "asc" ? av - bv : bv - av;
    });
  }, [salesmanSummaries, search, sortKey, sortDir]);

  // Chart always shows top 10 by totalSales from original data â€” stable across sort changes
  const chartData = React.useMemo(
    () =>
      [...salesmanSummaries]
        .sort((a, b) => b.totalSales - a.totalSales)
        .slice(0, 10)
        .map((s) => ({
          name: s.name.length > 18 ? s.name.slice(0, 18) + "…" : s.name,
          fullName: s.name,
          totalSales: s.totalSales,
          totalCollections: s.totalCollections,
          invoiceCount: s.invoiceCount,
        })),
    [salesmanSummaries],
  );

  const gridColor = isDark ? "#3f3f46" : "#e4e4e7";
  const tickColor = isDark ? "#a1a1aa" : "#71717a";

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  React.useEffect(() => setPage(1), [search, pageSize]);

  const from = filtered.length === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, filtered.length);
  const pageNums = getPageNumbers(page, totalPages);

  // Fires after React commits all batched state updates (search clear + page change)
  React.useEffect(() => {
    if (!scrollTrigger) return;
    const id = scrollTrigger;
    setScrollTrigger(null);
    requestAnimationFrame(() => {
      document
        .getElementById(id)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }, [scrollTrigger]);

  const scrollToSalesman = React.useCallback(
    (fullName: string) => {
      setSearch(""); // clear any active search filter
      // Compute where this salesman sits in the fully-unfiltered sorted list
      // (which is exactly what `filtered` becomes once search is cleared)
      const sortedAll = [...salesmanSummaries].sort((a, b) => {
        const av = a[sortKey] as number;
        const bv = b[sortKey] as number;
        return sortDir === "asc" ? av - bv : bv - av;
      });
      const idx = sortedAll.findIndex((s) => s.name === fullName);
      if (idx < 0) return;
      const targetPage = Math.floor(idx / pageSize) + 1;
      setPage(targetPage);
      // Changing scrollTrigger guarantees the useEffect runs after all state settles
      setScrollTrigger(`salesman-row-${idx}`);
    },
    [salesmanSummaries, sortKey, sortDir, pageSize],
  );

  return (
    <div className="space-y-4">
      {/* Chart */}
      <Card className="dark:border-zinc-700 dark:bg-white/13">
        <CardHeader>
          <CardTitle>Top 10 Salesmen by Sales</CardTitle>
          <CardDescription>
            Click a bar or Y-axis label to jump to that salesman in the table
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
                    width={160}
                    interval={0}
                    tick={(props) => (
                      <CustomYTick
                        {...props}
                        colors={colors}
                        chartData={chartData}
                        onClickName={scrollToSalesman}
                      />
                    )}
                  />
                  <RechartsTooltip
                    content={<BarTooltip />}
                    cursor={{ fill: "transparent" }}
                  />
                  <Bar
                    dataKey="totalSales"
                    name="Sales"
                    radius={[0, 3, 3, 0]}
                    onMouseEnter={(_, idx) => setActiveBarIdx(idx)}
                    onClick={(data) =>
                      scrollToSalesman((data as (typeof chartData)[0]).fullName)
                    }
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
            </>
          )}
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="dark:border-zinc-700 dark:bg-white/13">
        <CardHeader>
          <CardTitle>Salesman Performance Table</CardTitle>
          <CardDescription>Click column headers to sort</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="px-4 pb-3 pt-2">
            <Input
              placeholder="Search salesman..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm dark:border-zinc-700"
            />
          </div>
          <div className="overflow-x-auto">
            <Table className="table-fixed min-w-220">
              <TableHeader>
                <TableRow className="dark:border-zinc-700">
                  <TableHead className="w-12">#</TableHead>
                  <TableHead className="w-50">Salesman</TableHead>
                  <TableHead
                    className="w-35 cursor-pointer hover:text-foreground text-right"
                    onClick={() => toggleSort("totalSales")}
                  >
                    Total Sales
                    <SortIndicator
                      k="totalSales"
                      sortKey={sortKey}
                      sortDir={sortDir}
                    />
                  </TableHead>
                  <TableHead
                    className="w-35 cursor-pointer hover:text-foreground text-right"
                    onClick={() => toggleSort("totalCollections")}
                  >
                    Collections
                    <SortIndicator
                      k="totalCollections"
                      sortKey={sortKey}
                      sortDir={sortDir}
                    />
                  </TableHead>
                  <TableHead className="w-25 text-right">Coll. Rate</TableHead>
                  <TableHead
                    className="w-32 cursor-pointer hover:text-foreground text-right"
                    onClick={() => toggleSort("totalReturns")}
                  >
                    Returns
                    <SortIndicator
                      k="totalReturns"
                      sortKey={sortKey}
                      sortDir={sortDir}
                    />
                  </TableHead>
                  <TableHead
                    className="w-22 cursor-pointer hover:text-foreground text-right"
                    onClick={() => toggleSort("invoiceCount")}
                  >
                    Invoices
                    <SortIndicator
                      k="invoiceCount"
                      sortKey={sortKey}
                      sortDir={sortDir}
                    />
                  </TableHead>
                  <TableHead
                    className="w-22 cursor-pointer hover:text-foreground text-right"
                    onClick={() => toggleSort("customerCount")}
                  >
                    Customers
                    <SortIndicator
                      k="customerCount"
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
                      colSpan={8}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No salesman data found
                    </TableCell>
                  </TableRow>
                )}
                {paginated.map((s, pageIdx) => {
                  const filteredIdx = (page - 1) * pageSize + pageIdx;
                  const collRate =
                    s.totalSales > 0
                      ? (s.totalCollections / s.totalSales) * 100
                      : 0;
                  return (
                    <TableRow
                      key={s.name}
                      id={`salesman-row-${filteredIdx}`}
                      className="dark:border-zinc-700"
                    >
                      <TableCell className="text-muted-foreground text-sm">
                        {filteredIdx + 1}
                      </TableCell>
                      <TableCell className="overflow-hidden">
                        <p className="truncate font-medium" title={s.name}>
                          {s.name}
                        </p>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {phpFmt.format(s.totalSales)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {phpFmt.format(s.totalCollections)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant="secondary"
                          className={
                            collRate >= 90
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                              : collRate >= 70
                                ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                                : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                          }
                        >
                          {collRate.toFixed(2)}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {phpFmt.format(s.totalReturns)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {numFmt.format(s.invoiceCount)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {numFmt.format(s.customerCount)}
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

export const SalesmanTab = React.memo(SalesmanTabComponent);
