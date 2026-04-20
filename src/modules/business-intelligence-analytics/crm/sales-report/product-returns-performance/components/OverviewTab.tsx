// src/modules/business-intelligence-analytics/sales-report/product-returns-performance/components/OverviewTab.tsx
"use client";

import * as React from "react";
import { ArrowRight, ArrowUpDown } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import type {
  ReturnByPeriod,
  TopReturnItem,
  ProductReturnRecord,
  ModalConfig,
  ModalItem,
} from "../types";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { DotProps } from "recharts";
import { useTheme } from "next-themes";
import { useIsMobile } from "@/hooks/use-mobile";

// const QuickInsightModalLazy = React.lazy(() => import("./QuickInsightModal.lazy"));
// const DateInsightModalLazy = React.lazy(() => import("./DateInsightModal.lazy"));

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
  "#84cc16",
  "#a855f7",
  "#f43f5e",
  "#0ea5e9",
  "#10b981",
  "#f59e0b",
  "#64748b",
  "#9333ea",
  "#0891b2",
  "#dc2626",
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
  "#4d7c0f",
  "#7e22ce",
  "#9f1239",
  "#0369a1",
  "#047857",
  "#b45309",
  "#475569",
  "#5b21b6",
  "#155e75",
  "#991b1b",
];

const phpFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const fmtPHP = (v: number) => phpFormatter.format(v);
const formatShare = (value: number, total: number) =>
  total > 0 ? `${((value / total) * 100).toFixed(1)}%` : "0.0%";

function CustomBarTooltip({
  active,
  payload,
  data,
  valueKey,
  countKey,
  valueLabel = "Value",
  countLabel = "Transactions",
}: {
  active?: boolean;
  payload?: Array<{ payload: Record<string, number | string> }>;
  data: Record<string, number | string>[];
  valueKey: string;
  countKey?: string;
  valueLabel?: string;
  countLabel?: string;
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  const total = data.reduce(
    (sum: number, d: Record<string, number | string>) =>
      sum + (Number(d[valueKey]) || 0),
    0,
  );
  const value = Number(item[valueKey]) || 0;
  const contribution = total > 0 ? ((value / total) * 100).toFixed(1) : "0.0";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rank = data.findIndex((d: any) => d.name === item.name) + 1;
  const count = countKey !== undefined ? Number(item[countKey]) : undefined;
  const fmt = fmtPHP;
  return (
    <div className="rounded-lg border bg-background p-3 shadow-md text-sm min-w-50 space-y-1">
      <p className="font-semibold text-foreground leading-snug">{item.name}</p>
      <div className="border-t border-border pt-1.5 space-y-1">
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">{valueLabel}</span>
          <span className="font-medium tabular-nums">{fmt(value)}</span>
        </div>
        {count !== undefined && (
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">{countLabel}</span>
            <span className="font-medium tabular-nums">
              {count.toLocaleString()}
            </span>
          </div>
        )}
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Contribution</span>
          <span className="font-medium">{contribution}%</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Rank</span>
          <span className="font-medium">#{rank}</span>
        </div>
        <p className="text-[10px] text-muted-foreground pt-0.5 italic">
          Click bar for quick insights
        </p>
      </div>
    </div>
  );
}

// type ModalItem = { name: string; returnValue: number; returnCount: number };
// type ModalConfig = {
//   type: "product" | "supplier" | "customer" | "location" | "salesman" | "division" | "operation";
//   item: ModalItem;
//   rank: number;
//   color: string;
// };

function QuickInsightModal({
  config,
  filteredData,
  onClose,
  onNavigateToTab,
}: {
  config: ModalConfig;
  filteredData: ProductReturnRecord[];
  onClose: () => void;
  onNavigateToTab: (tab: string) => void;
}) {
  const fmt = fmtPHP;
  const avg =
    config.item.returnCount > 0
      ? config.item.returnValue / config.item.returnCount
      : 0;

  const relatedRows = React.useMemo(() => {
    const { type, item } = config;
    const makeMap = (
      filterFn: (r: ProductReturnRecord) => boolean,
      keyFn: (r: ProductReturnRecord) => string,
    ) => {
      const map = new Map<
        string,
        { returnValue: number; returnCount: number }
      >();
      filteredData.forEach((r) => {
        if (!filterFn(r)) return;
        const k = keyFn(r);
        const prev = map.get(k) || { returnValue: 0, returnCount: 0 };
        map.set(k, {
          returnValue: prev.returnValue + r.amount,
          returnCount: prev.returnCount + 1,
        });
      });
      return Array.from(map.entries())
        .map(([name, d]) => ({ name, ...d }))
        .sort((a, b) => b.returnValue - a.returnValue)
        .slice(0, 5);
    };
    // top product return modal table
    if (type === "product")
      return makeMap(
        (r) => r.productName === item.name,
        (r) => r.customerName,
      );
    if (type === "supplier")
      return makeMap(
        (r) => r.supplier === item.name,
        (r) => r.productName,
      );
    if (type === "customer")
      return makeMap(
        (r) => r.customerName === item.name,
        (r) => r.productName,
      );
    if (type === "location") {
      const parts = item.name.split(", ");
      const city = parts[0];
      const province = parts.slice(1).join(", ");
      return makeMap(
        (r) => r.city === city && r.province === province,
        (r) => r.productName,
      );
    }
    return [];
  }, [config, filteredData]);

  const tableLabel =
    config.type === "product"
      ? "Top Customers"
      : config.type === "supplier"
        ? "Top Products Returned"
        : config.type === "customer"
          ? "Top Products Returned"
          : config.type === "location"
            ? "Top Products Returned"
            : "";

  const canNavigate =
    config.type === "product" ||
    config.type === "customer" ||
    config.type === "supplier" ||
    config.type === "location";

  const navTarget =
    config.type === "product"
      ? "product"
      : config.type === "customer"
        ? "product"
        : config.type === "supplier"
          ? "supplier"
          : "location";

  const navLabel =
    config.type === "product"
      ? "View in Product Tab"
      : config.type === "customer"
        ? "View in Product Tab"
        : config.type === "supplier"
          ? "View in Supplier Tab"
          : "View in Location Tab";

  const relatedRowsTotalCount = React.useMemo(
    () => relatedRows.reduce((sum, row) => sum + row.returnCount, 0),
    [relatedRows],
  );
  const relatedRowsTotalValue = React.useMemo(
    () => relatedRows.reduce((sum, row) => sum + row.returnValue, 0),
    [relatedRows],
  );
  const [relatedSortBy, setRelatedSortBy] = React.useState<"count" | "value">(
    "value",
  );
  const [relatedSortOrder, setRelatedSortOrder] = React.useState<
    "asc" | "desc"
  >("desc");
  const sortedRelatedRows = React.useMemo(() => {
    return [...relatedRows].sort((a, b) => {
      const cmp =
        relatedSortBy === "count"
          ? a.returnCount - b.returnCount
          : a.returnValue - b.returnValue;
      return relatedSortOrder === "asc" ? cmp : -cmp;
    });
  }, [relatedRows, relatedSortBy, relatedSortOrder]);

  return (
    <Dialog
      open
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <DialogContent className="max-w-xl p-0 gap-0 overflow-hidden ">
        <DialogHeader className="px-6 pt-6 pb-4 space-y-1">
          <div className="flex items-start gap-3 pr-6">
            <div
              className="mt-1 h-3 w-3 rounded-full shrink-0"
              style={{ backgroundColor: config.color }}
            />
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-base font-semibold leading-tight wrap-break-word">
                {config.item.name}
              </DialogTitle>
              <DialogDescription className="mt-0.5 text-xs capitalize">
                {config.type} Return Rank #{config.rank}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <Separator className="dark:bg-zinc-700" />
        <ScrollArea className="max-h-[60vh]">
          <div className="px-6 py-4 space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Return Value", value: fmt(config.item.returnValue) },
                {
                  label: "Return Count",
                  value: config.item.returnCount.toLocaleString(),
                },
                { label: "Avg / Return", value: fmt(avg) },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-lg border dark:border-zinc-700 bg-muted/30 dark:bg-white/5 px-3 py-3 text-center"
                >
                  <p className="text-[11px] text-muted-foreground mb-1 leading-tight">
                    {s.label}
                  </p>
                  <p className="text-sm font-semibold tabular-nums">
                    {s.value}
                  </p>
                </div>
              ))}
            </div>
            {relatedRows.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                  {tableLabel}
                </p>
                <div className="rounded-md border dark:border-zinc-700 overflow-hidden">
                  <table className="table-fixed w-full text-xs">
                    <thead>
                      <tr className="border-b dark:border-zinc-700 bg-muted/30">
                        <th className="text-left px-3 py-2 font-medium text-muted-foreground">
                          Name
                        </th>
                        <th className="text-right px-3 py-2 font-medium text-muted-foreground">
                          Count
                        </th>
                        <th className="text-right px-3 py-2 font-medium text-muted-foreground">
                          Return Value
                        </th>
                        <th className="text-right px-3 py-2 font-medium text-muted-foreground">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 gap-1 px-0 text-xs font-medium"
                            onClick={() => {
                              if (relatedSortBy === "count") {
                                setRelatedSortOrder((o) =>
                                  o === "asc" ? "desc" : "asc",
                                );
                              } else {
                                setRelatedSortBy("count");
                                setRelatedSortOrder("desc");
                              }
                            }}
                          >
                            Count Share (%) <ArrowUpDown className="h-3 w-3" />
                          </Button>
                        </th>
                        <th className="text-right px-3 py-2 font-medium text-muted-foreground">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 gap-1 px-0 text-xs font-medium"
                            onClick={() => {
                              if (relatedSortBy === "value") {
                                setRelatedSortOrder((o) =>
                                  o === "asc" ? "desc" : "asc",
                                );
                              } else {
                                setRelatedSortBy("value");
                                setRelatedSortOrder("desc");
                              }
                            }}
                          >
                            Value Share (%) <ArrowUpDown className="h-3 w-3" />
                          </Button>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedRelatedRows.map((row, i) => (
                        <tr
                          key={row.name}
                          className={i % 2 === 0 ? "" : "bg-muted/20"}
                        >
                          <td className="px-3 py-2">{row.name}</td>
                          <td className="px-3 py-2 text-right">
                            {row.returnCount}
                          </td>
                          <td className="px-3 py-2 text-right font-medium tabular-nums">
                            {fmt(row.returnValue)}
                          </td>
                          <td className="px-3 py-2 text-right text-muted-foreground">
                            {formatShare(
                              row.returnCount,
                              relatedRowsTotalCount,
                            )}
                          </td>
                          <td className="px-3 py-2 text-right text-muted-foreground">
                            {formatShare(
                              row.returnValue,
                              relatedRowsTotalValue,
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {canNavigate && (
              <Button
                className="w-full gap-2"
                size="sm"
                onClick={() => {
                  onClose();
                  let id = "";
                  if (config.type === "product") {
                    id = `product-row-${config.item.name.replace(/[^a-zA-Z0-9]/g, "-")}`;
                  } else if (config.type === "supplier") {
                    id = `supplier-row-${config.item.name.replace(/[^a-zA-Z0-9]/g, "-")}`;
                  } else if (config.type === "customer") {
                    id = `product-row-${config.item.name.replace(/[^a-zA-Z0-9]/g, "-")}`;
                  } else if (config.type === "location") {
                    id = `location-row-${config.item.name.replace(/[^a-zA-Z0-9]/g, "-")}`;
                  }
                  // Switch tab first so the target tab mounts and attaches its hash listener
                  onNavigateToTab(navTarget);
                  // Then set the hash shortly after to trigger auto-expand in the target tab
                  if (id) {
                    setTimeout(() => {
                      window.location.hash = `#${id}`;
                      // extra delay before attempting to scroll to give the tab content time to render
                      setTimeout(() => {
                        document.getElementById(id)?.scrollIntoView({
                          behavior: "smooth",
                          block: "center",
                        });
                      }, 150);
                    }, 80);
                  }
                }}
              >
                {navLabel}
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function DateInsightModal({
  period,
  returnValue,
  returnCount,
  topProducts,
  onClose,
}: {
  period: string;
  returnValue: number;
  returnCount?: number;
  topProducts: { name: string; returnValue: number; returnCount: number }[];
  onClose: () => void;
}) {
  const fmt = fmtPHP;
  const topProductsTotalCount = React.useMemo(
    () => topProducts.reduce((sum, product) => sum + product.returnCount, 0),
    [topProducts],
  );
  const topProductsTotalValue = React.useMemo(
    () => topProducts.reduce((sum, product) => sum + product.returnValue, 0),
    [topProducts],
  );
  const [topSortBy, setTopSortBy] = React.useState<"count" | "value">("value");
  const [topSortOrder, setTopSortOrder] = React.useState<"asc" | "desc">(
    "desc",
  );
  const sortedTopProducts = React.useMemo(() => {
    return [...topProducts].sort((a, b) => {
      const cmp =
        topSortBy === "count"
          ? a.returnCount - b.returnCount
          : a.returnValue - b.returnValue;
      return topSortOrder === "asc" ? cmp : -cmp;
    });
  }, [topProducts, topSortBy, topSortOrder]);
  return (
    <Dialog
      open
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <DialogContent className="max-w-xl sm:max-w-xl p-0 gap-0 overflow-hidden dark:border-zinc-700">
        <DialogHeader className="px-6 pt-6 pb-4 space-y-1">
          <div className="min-w-0">
            <DialogTitle className="text-base font-semibold leading-tight">
              Return Summary for {period}
            </DialogTitle>
            {/* <DialogDescription className="mt-0.5 text-xs">Return summary for selected period</DialogDescription> */}
          </div>
        </DialogHeader>
        <Separator className="dark:bg-zinc-700" />
        <ScrollArea className="max-h-[60vh]">
          <div className="px-6 py-4 space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg border dark:border-zinc-700 bg-muted/30 dark:bg-white/5 px-3 py-3 text-center">
                <p className="text-[11px] text-muted-foreground mb-1 leading-tight">
                  Return Value
                </p>
                <p className="text-sm font-semibold tabular-nums">
                  {fmt(returnValue)}
                </p>
              </div>
              <div className="rounded-lg border dark:border-zinc-700 bg-muted/30 dark:bg-white/5 px-3 py-3 text-center">
                <p className="text-[11px] text-muted-foreground mb-1 leading-tight">
                  Return Count
                </p>
                <p className="text-sm font-semibold tabular-nums">
                  {(returnCount || 0).toLocaleString()}
                </p>
              </div>
              <div />
            </div>

            {topProducts.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                  Top Return Products this period
                </p>
                <div className="rounded-md border dark:border-zinc-700 overflow-hidden">
                  <table className="table-fixed w-full text-xs">
                    <thead>
                      <tr className="border-b dark:border-zinc-700 bg-muted/30">
                        <th className="text-left px-3 py-2 font-medium text-muted-foreground">
                          Product
                        </th>
                        <th className="text-right px-3 py-2 font-medium text-muted-foreground">
                          Count
                        </th>
                        <th className="text-right px-3 py-2 font-medium text-muted-foreground">
                          Return Value
                        </th>
                        <th className="text-right px-3 py-2 font-medium text-muted-foreground">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 gap-1 px-0 text-xs font-medium"
                            onClick={() => {
                              if (topSortBy === "count") {
                                setTopSortOrder((o) =>
                                  o === "asc" ? "desc" : "asc",
                                );
                              } else {
                                setTopSortBy("count");
                                setTopSortOrder("desc");
                              }
                            }}
                          >
                            Count Share (%) <ArrowUpDown className="h-3 w-3" />
                          </Button>
                        </th>
                        <th className="text-right px-3 py-2 font-medium text-muted-foreground">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 gap-1 px-0 text-xs font-medium"
                            onClick={() => {
                              if (topSortBy === "value") {
                                setTopSortOrder((o) =>
                                  o === "asc" ? "desc" : "asc",
                                );
                              } else {
                                setTopSortBy("value");
                                setTopSortOrder("desc");
                              }
                            }}
                          >
                            Value Share (%) <ArrowUpDown className="h-3 w-3" />
                          </Button>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedTopProducts.map((p, i) => (
                        <tr
                          key={p.name}
                          className={i % 2 === 0 ? "" : "bg-muted/20"}
                        >
                          <td className="px-3 py-2">{p.name}</td>
                          <td className="px-3 py-2 text-right">
                            {p.returnCount}
                          </td>
                          <td className="px-3 py-2 text-right font-medium tabular-nums">
                            {fmt(p.returnValue)}
                          </td>
                          <td className="px-3 py-2 text-right text-muted-foreground">
                            {formatShare(p.returnCount, topProductsTotalCount)}
                          </td>
                          <td className="px-3 py-2 text-right text-muted-foreground">
                            {formatShare(p.returnValue, topProductsTotalValue)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

interface CustomizedDotProps {
  cx?: number;
  cy?: number;
  payload?: Record<string, unknown>;
  fill?: string;
  stroke?: string;
  onClick?: (props: CustomizedDotProps) => void;
  r?: number;
}

function CustomizedDot(props: CustomizedDotProps) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { cx, cy, payload, onClick, r = 6 } = props || {};
  if (cx === undefined || cy === undefined) return null;
  // use stroke/fill from recharts props to keep theme colours; fall back to red for returns
  const fill = props.fill ?? props.stroke ?? "#ef4444";
  const stroke = props.stroke ?? props.fill ?? "#ef4444";
  return (
    <g style={{ pointerEvents: "auto" }}>
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill={fill}
        stroke={stroke}
        strokeWidth={2}
        style={{ cursor: "pointer", display: "block" }}
        onClick={() => onClick && onClick(props)}
      />
    </g>
  );
}

type OverviewTabProps = {
  returnsByPeriod: ReturnByPeriod[];
  topProducts: TopReturnItem[];
  topSuppliers: TopReturnItem[];
  filteredData: ProductReturnRecord[];
  onNavigateToTab: (tab: string) => void;
};

export function OverviewTab({
  // returnsByPeriod,
  topProducts,
  topSuppliers,
  filteredData,
  onNavigateToTab,
}: OverviewTabProps) {
  const [selectedProduct, setSelectedProduct] = React.useState<string | null>(
    null,
  );
  const [selectedSupplier, setSelectedSupplier] = React.useState<string | null>(
    null,
  );
  const [modal, setModal] = React.useState<ModalConfig | null>(null);
  const [hoveredBar, setHoveredBar] = React.useState<string | null>(null);
  const [dateModal, setDateModal] = React.useState<{
    period: string;
    returnValue: number;
    returnCount?: number;
    topProducts: { name: string; returnValue: number; returnCount: number }[];
  } | null>(null);
  const [timePeriod, setTimePeriod] = React.useState<
    | "daily"
    | "weekly"
    | "bi-weekly"
    | "monthly"
    | "bi-monthly"
    | "quarterly"
    | "semi-annually"
    | "yearly"
  >("monthly");

  const { theme } = useTheme();
  const isDark = theme === "dark";
  const activeChartColors = isDark ? chartColorsDark : chartColors;

  const fmt = fmtPHP;
  const [trendMetric, setTrendMetric] = React.useState<
    "returnValue" | "returnCount"
  >("returnValue");
  const isMobile = useIsMobile();

  const getPeriodKey = React.useCallback(
    (dateStr: string) => {
      const [_y, _m, _d] = dateStr.split("T")[0].split("-").map(Number);
      const date = new Date(_y, _m - 1, _d);
      if (timePeriod === "daily") return dateStr.split("T")[0];
      if (timePeriod === "weekly") {
        const ws = new Date(date);
        ws.setDate(date.getDate() - date.getDay());
        return `${ws.getFullYear()}-${String(ws.getMonth() + 1).padStart(2, "0")}-${String(ws.getDate()).padStart(2, "0")}`;
      }
      if (timePeriod === "bi-weekly") {
        const weekNum = Math.floor(date.getDate() / 14);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-W${weekNum}`;
      }
      if (timePeriod === "monthly")
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      if (timePeriod === "bi-monthly") {
        const b = Math.floor(date.getMonth() / 2);
        return `${date.getFullYear()}-B${b + 1}`;
      }
      if (timePeriod === "quarterly") {
        const q = Math.floor(date.getMonth() / 3);
        return `${date.getFullYear()}-Q${q + 1}`;
      }
      if (timePeriod === "semi-annually") {
        const h = Math.floor(date.getMonth() / 6);
        return `${date.getFullYear()}-H${h + 1}`;
      }
      if (timePeriod === "yearly") return `${date.getFullYear()}`;
      return dateStr.split("T")[0];
    },
    [timePeriod],
  );

  const aggregatedPeriods = React.useMemo(() => {
    const map = new Map<string, { returnValue: number; returnCount: number }>();
    filteredData.forEach((r) => {
      if (!r.date) return;
      const key = getPeriodKey(r.date);
      const existing = map.get(key) || { returnValue: 0, returnCount: 0 };
      map.set(key, {
        returnValue: existing.returnValue + r.amount,
        returnCount: existing.returnCount + 1,
      });
    });
    const toSortable = Array.from(map.entries()).map(([period, d]) => ({
      period,
      ...d,
    }));
    const getDateValue = (periodKey: string) => {
      if (timePeriod === "daily" || timePeriod === "weekly")
        return new Date(periodKey).getTime();
      if (timePeriod === "monthly") {
        const [y, m] = periodKey.split("-");
        return new Date(Number(y), Number(m) - 1, 1).getTime();
      }
      const bw = periodKey.match(/(\d{4})-(\d{2})-W(\d+)/);
      if (bw)
        return new Date(
          Number(bw[1]),
          Number(bw[2]) - 1,
          Number(bw[3]) * 14,
        ).getTime();
      const q = periodKey.match(/(\d{4})-Q(\d+)/);
      if (q) return new Date(Number(q[1]), (Number(q[2]) - 1) * 3, 1).getTime();
      const b = periodKey.match(/(\d{4})-B(\d+)/);
      if (b) return new Date(Number(b[1]), (Number(b[2]) - 1) * 2, 1).getTime();
      const h = periodKey.match(/(\d{4})-H(\d+)/);
      if (h) return new Date(Number(h[1]), (Number(h[2]) - 1) * 6, 1).getTime();
      if (timePeriod === "yearly")
        return new Date(Number(periodKey), 0, 1).getTime();
      return 0;
    };
    return toSortable.sort(
      (a, b) => getDateValue(a.period) - getDateValue(b.period),
    );
  }, [filteredData, getPeriodKey, timePeriod]);

  const handlePointClick = React.useCallback(
    (rawPayload: unknown) => {
      if (!rawPayload) return;
      // payload shape varies by recharts version: try to find the data object containing `period`
      const get = (obj: unknown, key: string) => {
        if (!obj || typeof obj !== "object") return undefined;
        return (obj as Record<string, unknown>)[key];
      };

      let point: unknown = rawPayload;
      // unwrap common wrappers safely
      if (get(point, "payload")) point = get(point, "payload");
      if (get(point, "payload")) point = get(point, "payload");

      const period: string | undefined =
        (get(point, "period") as string | undefined) ??
        (get(rawPayload, "period") as string | undefined) ??
        ((get(rawPayload, "payload") as Record<string, unknown> | undefined)
          ?.period as string | undefined);

      const returnValue: number | undefined =
        (get(point, "returnValue") as number | undefined) ??
        (get(rawPayload, "returnValue") as number | undefined) ??
        ((get(rawPayload, "payload") as Record<string, unknown> | undefined)
          ?.returnValue as number | undefined) ??
        (get(rawPayload, "value") as number | undefined);

      const returnCount: number | undefined =
        (get(point, "returnCount") as number | undefined) ??
        (get(rawPayload, "returnCount") as number | undefined) ??
        ((get(rawPayload, "payload") as Record<string, unknown> | undefined)
          ?.returnCount as number | undefined);

      if (!period) return;

      const map = new Map<
        string,
        { returnValue: number; returnCount: number }
      >();
      filteredData.forEach((r) => {
        if (!r.date) return;
        const key = getPeriodKey(r.date);
        if (key !== period) return;
        const prev = map.get(r.productName) || {
          returnValue: 0,
          returnCount: 0,
        };
        map.set(r.productName, {
          returnValue: prev.returnValue + r.amount,
          returnCount: prev.returnCount + 1,
        });
      });
      const topProducts = Array.from(map.entries())
        .map(([name, d]) => ({ name, ...d }))
        .sort(
          (a, b) =>
            b.returnCount - a.returnCount || b.returnValue - a.returnValue,
        )
        .slice(0, 10);

      setDateModal({
        period,
        returnValue: Number(returnValue) || 0,
        returnCount,
        topProducts,
      });
    },
    [filteredData, getPeriodKey],
  );

  const getYAxisWidth = React.useCallback(
    (data: { returnValue?: number }[]) => {
      if (!data?.length) return isMobile ? 40 : 60;
      const max = Math.max(...data.map((d) => d.returnValue || 0));
      const calculatedWidth = Math.max(120, fmtPHP(max).length * 8);
      return isMobile ? Math.min(calculatedWidth, 80) : calculatedWidth;
    },
    [isMobile],
  );

  const formatPeriodLabel = React.useCallback(
    (key: string): string => {
      const MONTHS = [
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
      if (timePeriod === "daily") {
        const parts = key.split("T")[0].split("-");
        if (parts.length >= 3)
          return `${MONTHS[Number(parts[1]) - 1]} ${Number(parts[2])}`;
        return key;
      }
      if (timePeriod === "weekly") {
        const parts = key.split("-");
        if (parts.length === 3) {
          const y = Number(parts[0]),
            m = Number(parts[1]),
            d = Number(parts[2]);
          const start = new Date(y, m - 1, d);
          const end = new Date(y, m - 1, d + 6);
          const sm = MONTHS[start.getMonth()],
            em = MONTHS[end.getMonth()];
          return sm === em
            ? `${sm} ${start.getDate()}-${end.getDate()}`
            : `${sm} ${start.getDate()} - ${em} ${end.getDate()}`;
        }
        return key;
      }
      if (timePeriod === "bi-weekly") {
        const bw = key.match(/^(\d{4})-(\d{2})-W(\d+)$/);
        if (bw) {
          const y = Number(bw[1]),
            m = Number(bw[2]),
            n = Number(bw[3]);
          const startDay = n === 0 ? 1 : n * 14;
          const endDay =
            n === 0 ? 13 : n === 1 ? 27 : new Date(y, m, 0).getDate();
          const start = new Date(y, m - 1, startDay);
          const end = new Date(y, m - 1, endDay);
          const sm = MONTHS[start.getMonth()],
            em = MONTHS[end.getMonth()];
          return sm === em
            ? `${sm} ${startDay}-${endDay}`
            : `${sm} ${start.getDate()} - ${em} ${end.getDate()}`;
        }
        return key;
      }
      if (timePeriod === "monthly") {
        const parts = key.split("-");
        if (parts.length >= 2)
          return `${MONTHS[Number(parts[1]) - 1]} ${parts[0]}`;
        return key;
      }
      if (timePeriod === "bi-monthly") {
        const bm = key.match(/^(\d{4})-B(\d+)$/);
        if (bm) {
          const b = Number(bm[2]) - 1;
          return `${MONTHS[b * 2]}-${MONTHS[b * 2 + 1]} ${bm[1]}`;
        }
        return key;
      }
      if (timePeriod === "quarterly") {
        const q = key.match(/^(\d{4})-Q(\d+)$/);
        if (q) return `Q${q[2]} ${q[1]}`;
        return key;
      }
      if (timePeriod === "semi-annually") {
        const h = key.match(/^(\d{4})-H(\d+)$/);
        if (h) return `H${h[2]} ${h[1]}`;
        return key;
      }
      return key;
    },
    [timePeriod],
  );

  const openModal = React.useCallback(
    (
      type: ModalConfig["type"],
      item: ModalItem,
      allItems: ModalItem[],
      index: number,
    ) => {
      const rank = allItems.findIndex((i) => i.name === item.name) + 1;
      setModal({
        type,
        item,
        rank,
        color: activeChartColors[index % activeChartColors.length],
      });
    },
    [activeChartColors],
  );

  const returnsBySalesman = React.useMemo(() => {
    const map = new Map<string, { returnValue: number; returnCount: number }>();
    filteredData.forEach((r) => {
      if (!r.salesmanName) return;
      const prev = map.get(r.salesmanName) || {
        returnValue: 0,
        returnCount: 0,
      };
      map.set(r.salesmanName, {
        returnValue: prev.returnValue + r.amount,
        returnCount: prev.returnCount + 1,
      });
    });
    return Array.from(map.entries())
      .map(([name, d]) => ({ name, ...d }))
      .sort((a, b) => b.returnValue - a.returnValue)
      .slice(0, 15);
  }, [filteredData]);

  const returnsByDivision = React.useMemo(() => {
    const map = new Map<string, { returnValue: number; returnCount: number }>();
    filteredData.forEach((r) => {
      if (!r.divisionName) return;
      const prev = map.get(r.divisionName) || {
        returnValue: 0,
        returnCount: 0,
      };
      map.set(r.divisionName, {
        returnValue: prev.returnValue + r.amount,
        returnCount: prev.returnCount + 1,
      });
    });
    return Array.from(map.entries())
      .map(([name, d]) => ({ name, ...d }))
      .sort((a, b) => b.returnValue - a.returnValue);
  }, [filteredData]);

  const returnsByOperation = React.useMemo(() => {
    const map = new Map<string, { returnValue: number; returnCount: number }>();
    filteredData.forEach((r) => {
      if (!r.operationName) return;
      const prev = map.get(r.operationName) || {
        returnValue: 0,
        returnCount: 0,
      };
      map.set(r.operationName, {
        returnValue: prev.returnValue + r.amount,
        returnCount: prev.returnCount + 1,
      });
    });
    return Array.from(map.entries())
      .map(([name, d]) => ({ name, ...d }))
      .sort((a, b) => b.returnValue - a.returnValue);
  }, [filteredData]);

  const topCustomers = React.useMemo(() => {
    const map = new Map<string, { returnValue: number; returnCount: number }>();
    filteredData.forEach((r) => {
      if (!r.customerName) return;
      const prev = map.get(r.customerName) || {
        returnValue: 0,
        returnCount: 0,
      };
      map.set(r.customerName, {
        returnValue: prev.returnValue + r.amount,
        returnCount: prev.returnCount + 1,
      });
    });
    return Array.from(map.entries())
      .map(([name, d]) => ({ name, ...d }))
      .sort((a, b) => b.returnValue - a.returnValue)
      .slice(0, 10);
  }, [filteredData]);

  const topLocations = React.useMemo(() => {
    const map = new Map<string, { returnValue: number; returnCount: number }>();
    filteredData.forEach((r) => {
      const loc = `${r.city}, ${r.province}`;
      const prev = map.get(loc) || { returnValue: 0, returnCount: 0 };
      map.set(loc, {
        returnValue: prev.returnValue + r.amount,
        returnCount: prev.returnCount + 1,
      });
    });
    return Array.from(map.entries())
      .map(([name, d]) => ({ name, ...d }))
      .sort((a, b) => b.returnValue - a.returnValue)
      .slice(0, 10);
  }, [filteredData]);

  const cellStyle = React.useCallback(
    (prefix: string, name: string) => ({
      filter:
        hoveredBar === `${prefix}::${name}`
          ? "brightness(1.2) drop-shadow(0 0 3px rgba(0,0,0,0.25))"
          : undefined,
      transition: "filter 0.12s ease, opacity 0.12s ease",
      cursor: "pointer" as const,
    }),
    [hoveredBar],
  );

  return (
    <div className="space-y-4">
      {dateModal && (
        <DateInsightModal
          period={formatPeriodLabel(dateModal.period)}
          returnValue={dateModal.returnValue}
          returnCount={dateModal.returnCount}
          topProducts={dateModal.topProducts}
          onClose={() => setDateModal(null)}
        />
      )}
      {modal && (
        <QuickInsightModal
          config={modal}
          filteredData={filteredData}
          onClose={() => setModal(null)}
          onNavigateToTab={onNavigateToTab}
        />
      )}

      {/* Return Trend */}
      <Card className="dark:border-zinc-700 ">
        <CardHeader>
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>
                  {trendMetric === "returnValue"
                    ? "Return Value Trend Over Time"
                    : "Return Count Trend Over Time"}
                </CardTitle>
                <CardDescription className="capitalize">
                  {timePeriod}{" "}
                  {trendMetric === "returnValue"
                    ? "return value"
                    : "return count"}{" "}
                  performance
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant={trendMetric === "returnValue" ? "default" : "ghost"}
                  onClick={() => setTrendMetric("returnValue")}
                  className="dark:border-zinc-700"
                >
                  Value{" "}
                </Button>
                <Button
                  size="sm"
                  variant={trendMetric === "returnCount" ? "default" : "ghost"}
                  onClick={() => setTrendMetric("returnCount")}
                  className="dark:border-zinc-700"
                >
                  Count
                </Button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                className="dark:border-zinc-700"
                variant={timePeriod === "daily" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setTimePeriod("daily");
                }}
              >
                Daily
              </Button>
              <Button
                className="dark:border-zinc-700"
                variant={timePeriod === "weekly" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setTimePeriod("weekly");
                }}
              >
                Weekly
              </Button>
              <Button
                className="dark:border-zinc-700"
                variant={timePeriod === "bi-weekly" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setTimePeriod("bi-weekly");
                }}
              >
                Bi-Weekly
              </Button>
              <Button
                className="dark:border-zinc-700"
                variant={timePeriod === "monthly" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setTimePeriod("monthly");
                }}
              >
                Monthly
              </Button>
              <Button
                className="dark:border-zinc-700"
                variant={timePeriod === "bi-monthly" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setTimePeriod("bi-monthly");
                }}
              >
                Bi-Monthly
              </Button>
              <Button
                className="dark:border-zinc-700"
                variant={timePeriod === "quarterly" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setTimePeriod("quarterly");
                }}
              >
                Quarterly
              </Button>
              <Button
                className="dark:border-zinc-700"
                variant={timePeriod === "semi-annually" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setTimePeriod("semi-annually");
                }}
              >
                Semi-Annually
              </Button>
              <Button
                className="dark:border-zinc-700"
                variant={timePeriod === "yearly" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setTimePeriod("yearly");
                }}
              >
                Yearly
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              returnValue: { label: "Return Value", color: "#ef4444" },
            }}
            className="h-75 w-full"
          >
            <ResponsiveContainer>
              <LineChart
                data={aggregatedPeriods.map((p) => ({
                  period: p.period,
                  returnValue: p.returnValue,
                  returnCount: p.returnCount,
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="period"
                  tickFormatter={formatPeriodLabel}
                  tick={{ fontSize: 10, fill: "#64748b" }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  domain={[0, "auto"]}
                  width={(() => {
                    const values = aggregatedPeriods.map((d) =>
                      trendMetric === "returnValue"
                        ? Number(d.returnValue || 0)
                        : Number(d.returnCount || 0),
                    );
                    const max = values.length ? Math.max(...values) : 0;
                    if (trendMetric === "returnValue")
                      return Math.max(60, fmtPHP(max).length * 8);
                    return Math.max(60, String(max).length * 8);
                  })()}
                  tickFormatter={
                    trendMetric === "returnValue"
                      ? fmt
                      : (v: number) => (v ? v.toLocaleString() : "0")
                  }
                />
                <ChartTooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    const point = payload[0];
                    const value =
                      trendMetric === "returnValue"
                        ? (point?.value ?? point?.payload?.returnValue)
                        : (point?.payload?.returnCount ?? point?.value);
                    return (
                      <div className="rounded-lg border bg-background p-3 shadow-md text-sm space-y-1">
                        <p className="text-xs text-muted-foreground">
                          {label ? formatPeriodLabel(String(label)) : ""}
                        </p>
                        <div className="flex justify-between gap-4">
                          <span className="text-muted-foreground">
                            {trendMetric === "returnValue"
                              ? "Return Value"
                              : "Returns"}
                          </span>
                          <span className="font-medium">
                            {trendMetric === "returnValue"
                              ? fmt(Number(value))
                              : (Number(value) || 0).toLocaleString()}
                          </span>
                        </div>
                        {trendMetric === "returnValue" &&
                          payload[0]?.payload?.returnCount !== undefined && (
                            <div className="flex justify-between gap-4">
                              <span className="text-muted-foreground">
                                Returns
                              </span>
                              <span className="font-medium">
                                {payload[0].payload.returnCount}
                              </span>
                            </div>
                          )}
                      </div>
                    );
                  }}
                />
                <Line
                  type="monotone"
                  dataKey={trendMetric}
                  name={
                    trendMetric === "returnValue"
                      ? "Return Value"
                      : "Return Count"
                  }
                  stroke={trendMetric === "returnValue" ? "#ef4444" : "#ef4444"}
                  strokeWidth={2}
                  dot={(props: DotProps) => {
                    const { key: _k, ...rest } = props || {};
                    return (
                      <CustomizedDot
                        key={_k}
                        {...rest}
                        onClick={handlePointClick}
                      />
                    );
                  }}
                  activeDot={(props: DotProps) => {
                    const { key: _k, ...rest } = props || {};
                    return (
                      <CustomizedDot
                        key={_k}
                        {...rest}
                        onClick={handlePointClick}
                        r={9}
                      />
                    );
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Top Products & Suppliers */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="dark:border-zinc-700 ">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Top 10 Returned Products</CardTitle>
                <CardDescription>
                  By total return value click bar for insights
                </CardDescription>
              </div>
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
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                returnValue: { label: "Return Value", color: "#ef4444" },
              }}
              className="h-87.5 w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProducts.slice(0, 10)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    type="number"
                    domain={[0, "auto"]}
                    tickFormatter={fmt}
                  />
                  <YAxis
                    width={getYAxisWidth(topProducts)}
                    dataKey="name"
                    type="category"
                    tickFormatter={(v) =>
                      isMobile ? v.substring(0, 12) : v.substring(0, 20)
                    }
                    onClick={(d: { value?: string }) => {
                      const name = d?.value;
                      if (!name) return;
                      const item = topProducts.find((p) => p.name === name);
                      if (!item) return;
                      setSelectedProduct(name);
                      openModal(
                        "product",
                        item,
                        topProducts,
                        topProducts.findIndex((p) => p.name === name),
                      );
                    }}
                    style={{ cursor: "pointer" }}
                  />
                  <ChartTooltip
                    content={(props: unknown) => (
                      <CustomBarTooltip
                        {...(props as Parameters<typeof CustomBarTooltip>[0])}
                        data={topProducts}
                        valueKey="returnValue"
                        countKey="returnCount"
                        valueLabel="Return Value"
                        countLabel="Returns"
                      />
                    )}
                  />
                  <Bar
                    dataKey="returnValue"
                    radius={[0, 4, 4, 0]}
                    onMouseEnter={(data) => setHoveredBar(`prod::${data.name}`)}
                    onMouseLeave={() => setHoveredBar(null)}
                    onClick={(data) => {
                      setSelectedProduct(data.name);
                      openModal(
                        "product",
                        data,
                        topProducts,
                        topProducts.findIndex((p) => p.name === data.name),
                      );
                    }}
                    cursor="pointer"
                  >
                    {topProducts.slice(0, 10).map((e, i) => (
                      <Cell
                        key={`prod-${i}`}
                        fill={activeChartColors[i % activeChartColors.length]}
                        opacity={
                          selectedProduct && selectedProduct !== e.name
                            ? 0.25
                            : 1
                        }
                        style={cellStyle("prod", e.name)}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="dark:border-zinc-700 ">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Top 10 Suppliers by Return Value</CardTitle>
                <CardDescription>
                  Suppliers with highest return amounts click bar for insights
                </CardDescription>
              </div>
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
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                returnValue: { label: "Return Value", color: "#f97316" },
              }}
              className="h-87.5 w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topSuppliers.slice(0, 10)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    type="number"
                    domain={[0, "auto"]}
                    tickFormatter={fmt}
                  />
                  <YAxis
                    width={getYAxisWidth(topSuppliers)}
                    dataKey="name"
                    type="category"
                    tickFormatter={(v) =>
                      isMobile ? v.substring(0, 15) : v.substring(0, 30)
                    }
                    onClick={(d: { value?: string }) => {
                      const name = d?.value;
                      if (!name) return;
                      const item = topSuppliers.find((s) => s.name === name);
                      if (!item) return;
                      setSelectedSupplier(name);
                      openModal(
                        "supplier",
                        item,
                        topSuppliers,
                        topSuppliers.findIndex((s) => s.name === name),
                      );
                    }}
                    style={{ cursor: "pointer" }}
                  />
                  <ChartTooltip
                    content={(props: unknown) => (
                      <CustomBarTooltip
                        {...(props as Parameters<typeof CustomBarTooltip>[0])}
                        data={topSuppliers}
                        valueKey="returnValue"
                        countKey="returnCount"
                        valueLabel="Return Value"
                        countLabel="Returns"
                      />
                    )}
                  />
                  <Bar
                    dataKey="returnValue"
                    radius={[0, 4, 4, 0]}
                    onMouseEnter={(data) => setHoveredBar(`sup::${data.name}`)}
                    onMouseLeave={() => setHoveredBar(null)}
                    onClick={(data) => {
                      setSelectedSupplier(data.name);
                      openModal(
                        "supplier",
                        data,
                        topSuppliers,
                        topSuppliers.findIndex((s) => s.name === data.name),
                      );
                    }}
                    cursor="pointer"
                  >
                    {topSuppliers.slice(0, 10).map((e, i) => (
                      <Cell
                        key={`sup-${i}`}
                        fill={activeChartColors[i % activeChartColors.length]}
                        opacity={
                          selectedSupplier && selectedSupplier !== e.name
                            ? 0.25
                            : 1
                        }
                        style={cellStyle("sup", e.name)}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Customers & Locations */}
      <div className="grid gap-4 lg:grid-cols-2">
        {topCustomers.length > 0 && (
          <Card className="dark:border-zinc-700 ">
            <CardHeader>
              <CardTitle>Top 10 Customers by Return Value</CardTitle>
              <CardDescription>
                Customers with highest return amounts click bar for insights
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  returnValue: { label: "Return Value", color: "#f97316" },
                }}
                className="h-87.5 w-full"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topCustomers} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      type="number"
                      domain={[0, "auto"]}
                      tickFormatter={fmt}
                    />
                    <YAxis
                      width={getYAxisWidth(topCustomers)}
                      dataKey="name"
                      type="category"
                      tickFormatter={(v) =>
                        isMobile ? v.substring(0, 15) : v.substring(0, 30)
                      }
                      onClick={(d: { value?: string }) => {
                        const name = d?.value;
                        if (!name) return;
                        const item = topCustomers.find((c) => c.name === name);
                        if (!item) return;
                        openModal(
                          "customer",
                          item,
                          topCustomers,
                          topCustomers.findIndex((c) => c.name === name),
                        );
                      }}
                      style={{ cursor: "pointer" }}
                    />
                    <ChartTooltip
                      content={(props: unknown) => (
                        <CustomBarTooltip
                          {...(props as Parameters<typeof CustomBarTooltip>[0])}
                          data={topCustomers}
                          valueKey="returnValue"
                          countKey="returnCount"
                          valueLabel="Return Value"
                          countLabel="Returns"
                        />
                      )}
                    />
                    <Bar
                      dataKey="returnValue"
                      radius={[0, 4, 4, 0]}
                      onMouseEnter={(data) =>
                        setHoveredBar(`cust::${data.name}`)
                      }
                      onMouseLeave={() => setHoveredBar(null)}
                      onClick={(data) =>
                        openModal(
                          "customer",
                          data,
                          topCustomers,
                          topCustomers.findIndex((c) => c.name === data.name),
                        )
                      }
                      cursor="pointer"
                    >
                      {topCustomers.map((e, i) => (
                        <Cell
                          key={`cust-${i}`}
                          fill={activeChartColors[i % activeChartColors.length]}
                          style={cellStyle("cust", e.name)}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        )}
        {topLocations.length > 0 && (
          <Card className="dark:border-zinc-700 ">
            <CardHeader>
              <CardTitle>Top 10 Locations by Return Value</CardTitle>
              <CardDescription>
                Cities/provinces with highest returns click bar for insights
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  returnValue: { label: "Return Value", color: "#eab308" },
                }}
                className="h-87.5 w-full"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topLocations} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      type="number"
                      domain={[0, "auto"]}
                      tickFormatter={fmt}
                    />
                    <YAxis
                      width={getYAxisWidth(topLocations)}
                      dataKey="name"
                      type="category"
                      tickFormatter={(v) =>
                        isMobile ? v.substring(0, 15) : v.substring(0, 30)
                      }
                      onClick={(d: { value?: string }) => {
                        const name = d?.value;
                        if (!name) return;
                        const item = topLocations.find((l) => l.name === name);
                        if (!item) return;
                        openModal(
                          "location",
                          item,
                          topLocations,
                          topLocations.findIndex((l) => l.name === name),
                        );
                      }}
                      style={{ cursor: "pointer" }}
                    />
                    <ChartTooltip
                      content={(props: unknown) => (
                        <CustomBarTooltip
                          {...(props as Parameters<typeof CustomBarTooltip>[0])}
                          data={topLocations}
                          valueKey="returnValue"
                          countKey="returnCount"
                          valueLabel="Return Value"
                          countLabel="Returns"
                        />
                      )}
                    />
                    <Bar
                      dataKey="returnValue"
                      radius={[0, 4, 4, 0]}
                      onMouseEnter={(data) =>
                        setHoveredBar(`loc::${data.name}`)
                      }
                      onMouseLeave={() => setHoveredBar(null)}
                      onClick={(data) =>
                        openModal(
                          "location",
                          data,
                          topLocations,
                          topLocations.findIndex((l) => l.name === data.name),
                        )
                      }
                      cursor="pointer"
                    >
                      {topLocations.map((e, i) => (
                        <Cell
                          key={`loc-${i}`}
                          fill={activeChartColors[i % activeChartColors.length]}
                          style={cellStyle("loc", e.name)}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Returns by Salesman */}
      {returnsBySalesman.length > 0 && (
        <Card className="dark:border-zinc-700 ">
          <CardHeader>
            <CardTitle>Return Value by Salesman</CardTitle>
            <CardDescription>Top 15 salesmen by return value</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                returnValue: { label: "Return Value", color: "#ef4444" },
              }}
              className="h-85 w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={returnsBySalesman}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    interval={0}
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    tickFormatter={(v: string) =>
                      v.length > 20 ? v.slice(0, 20) + "" : v
                    }
                    onClick={(d: { value?: string }) => {
                      const name = d?.value;
                      if (!name) return;
                      const item = returnsBySalesman.find(
                        (s) => s.name === name,
                      );
                      if (!item) return;
                      openModal(
                        "salesman",
                        item,
                        returnsBySalesman,
                        returnsBySalesman.findIndex((s) => s.name === name),
                      );
                    }}
                    style={{ cursor: "pointer" }}
                  />
                  <YAxis
                    domain={[0, "auto"]}
                    width={getYAxisWidth(returnsBySalesman)-40}
                    tickFormatter={fmt}
                  />
                  <ChartTooltip
                    content={(props: unknown) => (
                      <CustomBarTooltip
                        {...(props as Parameters<typeof CustomBarTooltip>[0])}
                        data={returnsBySalesman}
                        valueKey="returnValue"
                        countKey="returnCount"
                        valueLabel="Return Value"
                        countLabel="Returns"
                      />
                    )}
                  />
                  <Bar
                    dataKey="returnValue"
                    radius={[4, 4, 0, 0]}
                    onMouseEnter={(data) =>
                      setHoveredBar(`sales::${data.name}`)
                    }
                    onMouseLeave={() => setHoveredBar(null)}
                    onClick={(data) =>
                      openModal(
                        "salesman",
                        data,
                        returnsBySalesman,
                        returnsBySalesman.findIndex(
                          (s) => s.name === data.name,
                        ),
                      )
                    }
                    cursor="pointer"
                  >
                    {returnsBySalesman.map((e, i) => (
                      <Cell
                        key={`salesman-${i}`}
                        fill={activeChartColors[i % activeChartColors.length]}
                        style={cellStyle("sales", e.name)}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      {/* Returns by Division & Operation */}
      <div className="grid gap-4 lg:grid-cols-2">
        {returnsByDivision.length > 0 && (
          <Card className="dark:border-zinc-700 ">
            <CardHeader>
              <CardTitle>Return Value by Division</CardTitle>
              <CardDescription>
                Return contribution per division
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  returnValue: { label: "Return Value", color: "#f97316" },
                }}
                className="h-75 w-full"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={returnsByDivision}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="name"
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      interval={0}
                      tick={{ fontSize: 11, fill: "#64748b" }}
                      tickFormatter={(v: string) =>
                        v.length > 35 ? v.slice(0, 35) + "" : v
                      }
                      onClick={(d: { value?: string }) => {
                        const name = d?.value;
                        if (!name) return;
                        const item = returnsByDivision.find(
                          (d2) => d2.name === name,
                        );
                        if (!item) return;
                        openModal(
                          "division",
                          item,
                          returnsByDivision,
                          returnsByDivision.findIndex((d2) => d2.name === name),
                        );
                      }}
                      style={{ cursor: "pointer" }}
                    />
                    <YAxis
                      domain={[0, "auto"]}
                      width={getYAxisWidth(returnsByDivision)-40}
                      tickFormatter={fmt}
                    />
                    <ChartTooltip
                      content={(props: unknown) => (
                        <CustomBarTooltip
                          {...(props as Parameters<typeof CustomBarTooltip>[0])}
                          data={returnsByDivision}
                          valueKey="returnValue"
                          countKey="returnCount"
                          valueLabel="Return Value"
                          countLabel="Returns"
                        />
                      )}
                    />
                    <Bar
                      dataKey="returnValue"
                      radius={[4, 4, 0, 0]}
                      onMouseEnter={(data) =>
                        setHoveredBar(`div::${data.name}`)
                      }
                      onMouseLeave={() => setHoveredBar(null)}
                      onClick={(data) =>
                        openModal(
                          "division",
                          data,
                          returnsByDivision,
                          returnsByDivision.findIndex(
                            (d) => d.name === data.name,
                          ),
                        )
                      }
                      cursor="pointer"
                    >
                      {returnsByDivision.map((e, i) => (
                        <Cell
                          key={`div-${i}`}
                          fill={activeChartColors[i % activeChartColors.length]}
                          style={cellStyle("div", e.name)}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        )}
        {returnsByOperation.length > 0 && (
          <Card className="dark:border-zinc-700 ">
            <CardHeader>
              <CardTitle>Return Value by Operation</CardTitle>
              <CardDescription>
                Return contribution per operation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  returnValue: { label: "Return Value", color: "#eab308" },
                }}
                className="h-75 w-full"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={returnsByOperation}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="name"
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      interval={0}
                      tick={{ fontSize: 11, fill: "#64748b" }}
                      tickFormatter={(v: string) =>
                        v.length > 35 ? v.slice(0, 35) + "" : v
                      }
                      onClick={(d: { value?: string }) => {
                        const name = d?.value;
                        if (!name) return;
                        const item = returnsByOperation.find(
                          (o) => o.name === name,
                        );
                        if (!item) return;
                        openModal(
                          "operation",
                          item,
                          returnsByOperation,
                          returnsByOperation.findIndex((o) => o.name === name),
                        );
                      }}
                      style={{ cursor: "pointer" }}
                    />
                    <YAxis
                      domain={[0, "auto"]}
                      width={getYAxisWidth(returnsByOperation)-40}
                      tickFormatter={fmt}
                    />
                    <ChartTooltip
                      content={(props: unknown) => (
                        <CustomBarTooltip
                          {...(props as Parameters<typeof CustomBarTooltip>[0])}
                          data={returnsByOperation}
                          valueKey="returnValue"
                          countKey="returnCount"
                          valueLabel="Return Value"
                          countLabel="Returns"
                        />
                      )}
                    />
                    <Bar
                      dataKey="returnValue"
                      radius={[4, 4, 0, 0]}
                      onMouseEnter={(data) => setHoveredBar(`op::${data.name}`)}
                      onMouseLeave={() => setHoveredBar(null)}
                      onClick={(data) =>
                        openModal(
                          "operation",
                          data,
                          returnsByOperation,
                          returnsByOperation.findIndex(
                            (o) => o.name === data.name,
                          ),
                        )
                      }
                      cursor="pointer"
                    >
                      {returnsByOperation.map((e, i) => (
                        <Cell
                          key={`op-${i}`}
                          fill={activeChartColors[i % activeChartColors.length]}
                          style={cellStyle("op", e.name)}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
