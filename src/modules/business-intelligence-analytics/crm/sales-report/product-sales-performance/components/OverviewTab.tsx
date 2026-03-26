// src/modules/business-intelligence-analytics/sales-report/product-sales-performance/components/OverviewTab.tsx
"use client";

import * as React from "react";
// ArrowRight removed (unused)
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
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TruncateText } from "./TruncateText";
import type {
  RevenueByPeriod,
  TopItem,
  ProductSaleRecord,
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
import { useTheme } from "next-themes";
const QuickInsightModalLazy = React.lazy(
  () => import("./QuickInsightModal.lazy"),
);

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

function CustomBarTooltip({
  active,
  payload,
  data,
  valueKey,
  countKey,
  valueLabel = "Revenue",
  countLabel = "Transactions",
}: {
  active?: boolean;
  payload?: Array<{
    payload?: Record<string, unknown>;
    name?: string;
    value?: number;
  }>;
  data: Array<Record<string, unknown>>;
  valueKey: string;
  countKey?: string;
  valueLabel?: string;
  countLabel?: string;
}) {
  if (!active || !payload?.length) return null;
  const item = (payload[0].payload || {}) as Record<string, unknown>;
  const total = data.reduce(
    (sum: number, d) =>
      sum +
      (Number((d as Record<string, unknown>)[valueKey] as unknown as number) ||
        0),
    0,
  );
  const value = Number(item[valueKey] as unknown as number) || 0;
  const contribution = total > 0 ? ((value / total) * 100).toFixed(1) : "0.0";
  const rank =
    data.findIndex(
      (d) => String((d as Record<string, unknown>).name) === String(item.name),
    ) + 1;
  const count =
    countKey !== undefined
      ? Number(item[countKey] as unknown as number)
      : undefined;
  const fmt = fmtPHP;
  return (
    <div className="rounded-lg border bg-background p-3 shadow-md text-sm min-w-50 space-y-1">
      <p className="font-semibold text-foreground leading-snug">
        {String(item.name)}
      </p>
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

// Module-scoped DateInsightModal (moved here to avoid creating components during render)
function DateInsightModal({
  period,
  revenue,
  transactions,
  topProducts,
  onClose,
}: {
  period: string;
  revenue: number;
  transactions?: number;
  topProducts: { name: string; revenue: number; transactions: number }[];
  onClose: () => void;
}) {
  return (
    <Dialog
      open
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <DialogContent className="max-w-xl p-0 gap-0 overflow-hidden dark:border-zinc-700">
        <DialogHeader className="px-6 pt-6 pb-4 space-y-1">
          <div className="min-w-0">
            <DialogTitle className="text-base font-semibold leading-tight">
              Revenue summary for {period}
            </DialogTitle>
          </div>
        </DialogHeader>
        <Separator className="dark:bg-zinc-700" />
        <ScrollArea className="max-h-[60vh]">
          <div className="px-6 py-4 space-y-4 ">
            <div className="grid grid-cols-2 gap-3 ">
              <div className="rounded-lg border dark:border-zinc-700 bg-muted/30 dark:bg-white/5 px-3 py-3 text-center">
                <p className="text-[11px] text-muted-foreground mb-1 leading-tight">
                  Revenue
                </p>
                <p className="text-sm font-semibold tabular-nums">
                  {fmtPHP(revenue)}
                </p>
              </div>
              <div className="rounded-lg border dark:border-zinc-700 bg-muted/30 dark:bg-white/5 px-3 py-3 text-center">
                <p className="text-[11px] text-muted-foreground mb-1 leading-tight">
                  Transactions
                </p>
                <p className="text-sm font-semibold tabular-nums">
                  {(transactions || 0).toLocaleString()}
                </p>
              </div>
              <div />
            </div>
            {topProducts.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                  Top Products this period
                </p>
                <div className="rounded-md border dark:border-zinc-700 overflow-hidden">
                  <table className="w-full table-fixed text-xs">
                    <thead>
                      <tr className="border-b dark:border-zinc-700 bg-muted/30">
                        <th className="w-[58%] text-left px-3 py-2 font-medium text-muted-foreground">
                          Product
                        </th>
                        <th className="w-[20%] text-right px-3 py-2 font-medium text-muted-foreground">
                          Transactions
                        </th>
                        <th className="w-[22%] text-right px-3 py-2 font-medium text-muted-foreground">
                          Revenue
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {topProducts.map((p, i) => (
                        <tr
                          key={p.name}
                          className={i % 2 === 0 ? "" : "bg-muted/20"}
                        >
                          <td className="px-3 py-2 max-w-0">
                            <TruncateText title={p.name}>{p.name}</TruncateText>
                          </td>
                          <td className="px-3 py-2 text-right">
                            {p.transactions}
                          </td>
                          <td className="px-3 py-2 text-right font-medium tabular-nums">
                            {fmtPHP(p.revenue)}
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

// type ModalItem = { name: string; revenue: number; count: number };
// type ModalConfig = {
//   type: "product" | "supplier" | "customer" | "location" | "salesman" | "division" | "operation";
//   item: ModalItem;
//   rank: number;
//   color: string;
// };

// CustomizedDot moved to module scope — defining inside a component creates a new type each render,
// causing React to unmount/remount on every parent re-render
type CustomizedDotProps = {
  cx?: number;
  cy?: number;
  onClick?: (p: unknown) => void;
  r?: number;
  fill?: string;
  stroke?: string;
  [key: string]: unknown;
};

function CustomizedDot(props: CustomizedDotProps): React.JSX.Element | null {
  const { cx, cy, onClick, r = 6, fill: pFill, stroke: pStroke } = props;
  if (cx === undefined || cy === undefined) return null;
  // prefer stroke/fill from recharts props when available (keeps theme colors)
  const fill = pFill ?? pStroke ?? "#3b82f6";
  const stroke = pStroke ?? "#3b82f6";
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
  revenueByPeriod: RevenueByPeriod[];
  topProducts: TopItem[];
  topSuppliers: TopItem[];
  filteredData: ProductSaleRecord[];
  onNavigateToTab: (tab: string, opts?: { openDropdownFor?: string }) => void;
};

export function OverviewTab({
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
  const isDark = (theme ? theme : theme) === "dark";
  const activeChartColors = isDark ? chartColorsDark : chartColors;

  const fmt = fmtPHP;

  const getYAxisWidth = React.useCallback((data: { revenue?: number }[]) => {
    if (!data?.length) return 60;
    const max = Math.max(...data.map((d) => d.revenue || 0));
    return Math.max(60, fmtPHP(max).length * 13);
  }, []);

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

  const revenueBySalesman = React.useMemo(() => {
    const map = new Map<string, { revenue: number; count: number }>();
    filteredData.forEach((r) => {
      if (!r.salesmanName) return;
      const prev = map.get(r.salesmanName) || { revenue: 0, count: 0 };
      map.set(r.salesmanName, {
        revenue: prev.revenue + r.amount,
        count: prev.count + 1,
      });
    });
    return Array.from(map.entries())
      .map(([name, d]) => ({ name, ...d }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 15);
  }, [filteredData]);

  const revenueByDivision = React.useMemo(() => {
    const map = new Map<string, { revenue: number; count: number }>();
    filteredData.forEach((r) => {
      if (!r.divisionName) return;
      const prev = map.get(r.divisionName) || { revenue: 0, count: 0 };
      map.set(r.divisionName, {
        revenue: prev.revenue + r.amount,
        count: prev.count + 1,
      });
    });
    return Array.from(map.entries())
      .map(([name, d]) => ({ name, ...d }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [filteredData]);

  const revenueByOperation = React.useMemo(() => {
    const map = new Map<string, { revenue: number; count: number }>();
    filteredData.forEach((r) => {
      if (!r.operationName) return;
      const prev = map.get(r.operationName) || { revenue: 0, count: 0 };
      map.set(r.operationName, {
        revenue: prev.revenue + r.amount,
        count: prev.count + 1,
      });
    });
    return Array.from(map.entries())
      .map(([name, d]) => ({ name, ...d }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [filteredData]);

  const revenueByCustomer = React.useMemo(() => {
    const map = new Map<string, { revenue: number; count: number }>();
    filteredData.forEach((r) => {
      if (!r.customerName) return;
      const prev = map.get(r.customerName) || { revenue: 0, count: 0 };
      map.set(r.customerName, {
        revenue: prev.revenue + r.amount,
        count: prev.count + 1,
      });
    });
    return Array.from(map.entries())
      .map(([name, d]) => ({ name, ...d }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
  }, [filteredData]);

  const revenueByLocation = React.useMemo(() => {
    const map = new Map<string, { revenue: number; count: number }>();
    filteredData.forEach((r) => {
      const loc = `${r.city}, ${r.province}`;
      const prev = map.get(loc) || { revenue: 0, count: 0 };
      map.set(loc, { revenue: prev.revenue + r.amount, count: prev.count + 1 });
    });
    return Array.from(map.entries())
      .map(([name, d]) => ({ name, ...d }))
      .sort((a, b) => b.revenue - a.revenue)
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
  const [dateModal, setDateModal] = React.useState<{
    period: string;
    revenue: number;
    transactions?: number;
    topProducts: { name: string; revenue: number; transactions: number }[];
  } | null>(null);

  // CustomizedDot is defined at module scope above (avoids new type each render)

  const periodIndex = React.useMemo(() => {
    const groups = new Map<
      string,
      {
        revenue: number;
        transactions: number;
        productMap: Map<string, { revenue: number; transactions: number }>;
      }
    >();
    filteredData.forEach((r) => {
      if (!r.date) return;
      const key = getPeriodKey(r.date);
      const g = groups.get(key) || {
        revenue: 0,
        transactions: 0,
        productMap: new Map(),
      };
      g.revenue += Number(r.amount) || 0;
      g.transactions += 1;
      const pm = g.productMap;
      const prev = pm.get(r.productName) || { revenue: 0, transactions: 0 };
      pm.set(r.productName, {
        revenue: prev.revenue + (Number(r.amount) || 0),
        transactions: prev.transactions + 1,
      });
      groups.set(key, g);
    });

    const map = new Map<
      string,
      {
        period: string;
        revenue: number;
        transactions: number;
        topProducts: { name: string; revenue: number; transactions: number }[];
      }
    >();
    groups.forEach((v, k) => {
      const topProducts = Array.from(v.productMap.entries())
        .map(([name, d]) => ({
          name,
          revenue: d.revenue,
          transactions: d.transactions,
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);
      map.set(k, {
        period: k,
        revenue: v.revenue,
        transactions: v.transactions,
        topProducts,
      });
    });
    return map;
  }, [filteredData, getPeriodKey]);

  // DateInsightModal removed from inner scope (now module-scoped above)

  const handlePointClick = React.useCallback(
    (raw: unknown) => {
      if (!raw) return;
      // normalize possible recharts shapes safely
      const unwrap = (x: unknown): Record<string, unknown> | undefined => {
        if (!x) return undefined;
        if (
          typeof x === "object" &&
          x !== null &&
          "payload" in (x as Record<string, unknown>)
        )
          return (x as Record<string, unknown>).payload as
            | Record<string, unknown>
            | undefined;
        return x as Record<string, unknown> | undefined;
      };
      const point = unwrap(unwrap(raw));
      const rawObj = raw as Record<string, unknown> | undefined;
      const period =
        point?.period ??
        rawObj?.period ??
        (rawObj?.payload as Record<string, unknown> | undefined)?.period;
      const revenue = Number(
        point?.revenue ??
          rawObj?.revenue ??
          (rawObj?.payload as Record<string, unknown> | undefined)?.revenue ??
          rawObj?.value ??
          0,
      );
      const transactions =
        point?.transactions ??
        rawObj?.transactions ??
        (rawObj?.payload as Record<string, unknown> | undefined)?.transactions;
      if (!period) return;
      const pre = periodIndex.get(String(period));
      if (pre) {
        setDateModal({
          period: pre.period,
          revenue: Number(pre.revenue) || Number(revenue) || 0,
          transactions:
            pre.transactions ?? (transactions as number | undefined),
          topProducts: pre.topProducts,
        });
      }
    },
    [periodIndex],
  );

  const aggregatedPeriods = React.useMemo(() => {
    const map = new Map<string, { revenue: number; transactions: number }>();
    filteredData.forEach((r) => {
      if (!r.date) return;
      const key = getPeriodKey(r.date);
      const existing = map.get(key) || { revenue: 0, transactions: 0 };
      map.set(key, {
        revenue: existing.revenue + (Number(r.amount) || 0),
        transactions: existing.transactions + 1,
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
  return (
    <div className="space-y-4">
      {modal && (
        <QuickInsightModalLazy
          config={modal}
          filteredData={filteredData}
          onClose={() => setModal(null)}
          onNavigateToTab={onNavigateToTab}
        />
      )}
      {dateModal && (
        <DateInsightModal
          period={formatPeriodLabel(dateModal.period)}
          revenue={dateModal.revenue}
          transactions={dateModal.transactions}
          topProducts={dateModal.topProducts}
          onClose={() => setDateModal(null)}
        />
      )}

      {/* Revenue Trend */}
      <Card className="dark:border-zinc-700 dark:bg-white/13">
        <CardHeader>
          <CardTitle>Revenue Trend Over Time</CardTitle>
          <CardDescription>Monthly revenue performance</CardDescription>
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
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{ revenue: { label: "Revenue", color: "#3b82f6" } }}
            className="h-75 w-full"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={aggregatedPeriods}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="period"
                  tickFormatter={formatPeriodLabel}
                  tick={{ fontSize: 10, fill: "#64748b" }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  domain={[0, "auto"]}
                  width={getYAxisWidth(aggregatedPeriods)}
                  tickFormatter={fmt}
                />
                <ChartTooltip
                  content={({
                    active,
                    payload,
                    label,
                  }: {
                    active?: boolean;
                    payload?: Array<{
                      value?: number;
                      payload?: { count?: number };
                    }>;
                    label?: string;
                  }) => {
                    if (!active || !payload?.length) return null;
                    return (
                      <div className="rounded-lg border bg-background p-3 shadow-md text-sm space-y-1">
                        <p className="text-xs text-muted-foreground">
                          {label ? formatPeriodLabel(String(label)) : ""}
                        </p>
                        <div className="flex justify-between gap-4">
                          <span className="text-muted-foreground">Revenue</span>
                          <span className="font-medium">
                            {fmt(payload[0].value ?? 0)}
                          </span>
                        </div>
                        {payload[0]?.payload?.count !== undefined && (
                          <div className="flex justify-between gap-4">
                            <span className="text-muted-foreground">
                              Transactions
                            </span>
                            <span className="font-medium">
                              {payload[0].payload.count}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={(props: unknown) => {
                    const p = (props as Record<string, unknown>) || {};
                    const { key: _k, ...rest } = p as Record<string, unknown>;
                    return (
                      <CustomizedDot
                        key={String(_k)}
                        {...(rest as Record<string, unknown>)}
                        onClick={handlePointClick}
                      />
                    );
                  }}
                  activeDot={(props: unknown) => {
                    const p = (props as Record<string, unknown>) || {};
                    const { key: _k, ...rest } = p as Record<string, unknown>;
                    return (
                      <CustomizedDot
                        key={String(_k)}
                        {...(rest as Record<string, unknown>)}
                        r={8}
                        onClick={handlePointClick}
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
      <div className="grid gap-4 sm:block lg:grid-cols-2 ">
        <Card className="dark:border-zinc-700 dark:bg-white/13">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Top 10 Products by Revenue</CardTitle>
                <CardDescription>
                  Highest performing products click bar for insights
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
              config={{ revenue: { label: "Revenue", color: "#3b82f6" } }}
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
                    tickFormatter={(v) => v.substring(0, 20)}
                    onClick={(data: { value?: string }) => {
                      const name = data?.value;
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
                        valueKey="revenue"
                        countKey="count"
                        valueLabel="Revenue"
                        countLabel="Transactions"
                      />
                    )}
                  />
                  <Bar
                    dataKey="revenue"
                    radius={[0, 4, 4, 0]}
                    onMouseEnter={(data) => setHoveredBar(`prod::${data.name}`)}
                    onMouseLeave={() => setHoveredBar(null)}
                    onClick={(data) => {
                      setSelectedProduct(data.name);
                      openModal(
                        "product",
                        {
                          name: data.name,
                          revenue: data.revenue,
                          count: data.count,
                        },
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

        <Card className="dark:border-zinc-700 dark:bg-white/13">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Top 10 Suppliers by Revenue</CardTitle>
                <CardDescription>
                  Leading supplier partnerships click bar for insights
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
              config={{ revenue: { label: "Revenue", color: "#8b5cf6" } }}
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
                    tickFormatter={(v) => v.substring(0, 30)}
                    onClick={(data: { value?: string }) => {
                      const name = data?.value;
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
                        valueKey="revenue"
                        countKey="count"
                        valueLabel="Revenue"
                        countLabel="Transactions"
                      />
                    )}
                  />
                  <Bar
                    dataKey="revenue"
                    radius={[0, 4, 4, 0]}
                    onMouseEnter={(data) => setHoveredBar(`sup::${data.name}`)}
                    onMouseLeave={() => setHoveredBar(null)}
                    onClick={(data) => {
                      setSelectedSupplier(data.name);
                      openModal(
                        "supplier",
                        {
                          name: data.name,
                          revenue: data.revenue,
                          count: data.count,
                        },
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
        {revenueByCustomer.length > 0 && (
          <Card className="dark:border-zinc-700 dark:bg-white/13">
            <CardHeader>
              <CardTitle>Top 10 Customers by Revenue</CardTitle>
              <CardDescription>
                Highest revenue-generating customers click bar for insights
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{ revenue: { label: "Revenue", color: "#f97316" } }}
                className="h-87.5 w-full"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueByCustomer} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      type="number"
                      domain={[0, "auto"]}
                      tickFormatter={fmt}
                    />
                    <YAxis
                      width={getYAxisWidth(revenueByCustomer)}
                      dataKey="name"
                      type="category"
                      tickFormatter={(v: string) =>
                        v.length > 22 ? v.slice(0, 22) + "..." : v
                      }
                      onClick={(data: { value?: string }) => {
                        const name = data?.value;
                        if (!name) return;
                        const item = revenueByCustomer.find(
                          (c) => c.name === name,
                        );
                        if (!item) return;
                        openModal(
                          "customer",
                          item,
                          revenueByCustomer,
                          revenueByCustomer.findIndex((c) => c.name === name),
                        );
                      }}
                      style={{ cursor: "pointer" }}
                    />
                    <ChartTooltip
                      content={(props: unknown) => (
                        <CustomBarTooltip
                          {...(props as Parameters<typeof CustomBarTooltip>[0])}
                          data={revenueByCustomer}
                          valueKey="revenue"
                          countKey="count"
                          valueLabel="Revenue"
                          countLabel="Transactions"
                        />
                      )}
                    />
                    <Bar
                      dataKey="revenue"
                      radius={[0, 4, 4, 0]}
                      onMouseEnter={(data) =>
                        setHoveredBar(`cust::${data.name}`)
                      }
                      onMouseLeave={() => setHoveredBar(null)}
                      onClick={(data) =>
                        openModal(
                          "customer",
                          {
                            name: data.name,
                            revenue: data.revenue,
                            count: data.count,
                          },
                          revenueByCustomer,
                          revenueByCustomer.findIndex(
                            (c) => c.name === data.name,
                          ),
                        )
                      }
                      cursor="pointer"
                    >
                      {revenueByCustomer.map((e, i) => (
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
        {revenueByLocation.length > 0 && (
          <Card className="dark:border-zinc-700 dark:bg-white/13">
            <CardHeader>
              <CardTitle>Top 10 Locations by Revenue</CardTitle>
              <CardDescription>
                Highest revenue-generating cities click bar for insights
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{ revenue: { label: "Revenue", color: "#eab308" } }}
                className="h-87.5 w-full"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueByLocation} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      type="number"
                      domain={[0, "auto"]}
                      tickFormatter={fmt}
                    />
                    <YAxis
                      width={getYAxisWidth(revenueByLocation)}
                      dataKey="name"
                      type="category"
                      tickFormatter={(v: string) =>
                        v.length > 24 ? v.slice(0, 24) + "..." : v
                      }
                      onClick={(data: { value?: string }) => {
                        const name = data?.value;
                        if (!name) return;
                        const item = revenueByLocation.find(
                          (l) => l.name === name,
                        );
                        if (!item) return;
                        openModal(
                          "location",
                          item,
                          revenueByLocation,
                          revenueByLocation.findIndex((l) => l.name === name),
                        );
                      }}
                      style={{ cursor: "pointer" }}
                    />
                    <ChartTooltip
                      content={(props: unknown) => (
                        <CustomBarTooltip
                          {...(props as Parameters<typeof CustomBarTooltip>[0])}
                          data={revenueByLocation}
                          valueKey="revenue"
                          countKey="count"
                          valueLabel="Revenue"
                          countLabel="Transactions"
                        />
                      )}
                    />
                    <Bar
                      dataKey="revenue"
                      radius={[0, 4, 4, 0]}
                      onMouseEnter={(data) =>
                        setHoveredBar(`loc::${data.name}`)
                      }
                      onMouseLeave={() => setHoveredBar(null)}
                      onClick={(data) =>
                        openModal(
                          "location",
                          {
                            name: data.name,
                            revenue: data.revenue,
                            count: data.count,
                          },
                          revenueByLocation,
                          revenueByLocation.findIndex(
                            (l) => l.name === data.name,
                          ),
                        )
                      }
                      cursor="pointer"
                    >
                      {revenueByLocation.map((e, i) => (
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

      {/* Revenue by Salesman */}
      {revenueBySalesman.length > 0 && (
        <Card className="dark:border-zinc-700 dark:bg-white/13">
          <CardHeader>
            <CardTitle>Revenue by Salesman</CardTitle>
            <CardDescription>Top 15 salesmen by revenue</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{ revenue: { label: "Revenue", color: "#ef4444" } }}
              className="h-85 w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueBySalesman}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    angle={-45}
                    textAnchor="end"
                    height={120}
                    interval={0}
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    tickFormatter={(v: string) =>
                      v.length > 20 ? v.slice(0, 20) + "..." : v
                    }
                    onClick={(d: { value?: string }) => {
                      const name = d?.value;
                      if (!name) return;
                      const item = revenueBySalesman.find(
                        (s) => s.name === name,
                      );
                      if (!item) return;
                      openModal(
                        "salesman",
                        item,
                        revenueBySalesman,
                        revenueBySalesman.findIndex((s) => s.name === name),
                      );
                    }}
                    style={{ cursor: "pointer" }}
                  />
                  <YAxis
                    domain={[0, "auto"]}
                    width={getYAxisWidth(revenueBySalesman)}
                    tickFormatter={fmt}
                  />
                  <ChartTooltip
                    content={(props: unknown) => (
                      <CustomBarTooltip
                        {...(props as Parameters<typeof CustomBarTooltip>[0])}
                        data={revenueBySalesman}
                        valueKey="revenue"
                        countKey="count"
                        valueLabel="Revenue"
                        countLabel="Transactions"
                      />
                    )}
                  />
                  <Bar
                    dataKey="revenue"
                    radius={[4, 4, 0, 0]}
                    onMouseEnter={(data) =>
                      setHoveredBar(`sales::${data.name}`)
                    }
                    onMouseLeave={() => setHoveredBar(null)}
                    onClick={(data) =>
                      openModal(
                        "salesman",
                        {
                          name: data.name,
                          revenue: data.revenue,
                          count: data.count,
                        },
                        revenueBySalesman,
                        revenueBySalesman.findIndex(
                          (s) => s.name === data.name,
                        ),
                      )
                    }
                    cursor="pointer"
                  >
                    {revenueBySalesman.map((e, i) => (
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

      {/* Revenue by Division & Operation */}
      <div className="grid gap-4 lg:grid-cols-2">
        {revenueByDivision.length > 0 && (
          <Card className="dark:border-zinc-700 dark:bg-white/13">
            <CardHeader>
              <CardTitle>Revenue by Division</CardTitle>
              <CardDescription>
                Revenue contribution per division
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{ revenue: { label: "Revenue", color: "#f97316" } }}
                className="h-75 w-full"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueByDivision}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="name"
                      angle={-45}
                      textAnchor="end"
                      height={120}
                      interval={0}
                      tick={{ fontSize: 11, fill: "#64748b" }}
                      tickFormatter={(v: string) =>
                        v.length > 20 ? v.slice(0, 20) + "..." : v
                      }
                      onClick={(d: { value?: string }) => {
                        const name = d?.value;
                        if (!name) return;
                        const item = revenueByDivision.find(
                          (s) => s.name === name,
                        );
                        if (!item) return;
                        openModal(
                          "division",
                          item,
                          revenueByDivision,
                          revenueByDivision.findIndex((s) => s.name === name),
                        );
                      }}
                      style={{ cursor: "pointer" }}
                    />
                    <YAxis
                      domain={[0, "auto"]}
                      width={getYAxisWidth(revenueByDivision)}
                      tickFormatter={fmt}
                    />
                    <ChartTooltip
                      content={(props: unknown) => (
                        <CustomBarTooltip
                          {...(props as Parameters<typeof CustomBarTooltip>[0])}
                          data={revenueByDivision}
                          valueKey="revenue"
                          countKey="count"
                          valueLabel="Revenue"
                          countLabel="Transactions"
                        />
                      )}
                    />
                    <Bar
                      dataKey="revenue"
                      radius={[4, 4, 0, 0]}
                      onMouseEnter={(data) =>
                        setHoveredBar(`div::${data.name}`)
                      }
                      onMouseLeave={() => setHoveredBar(null)}
                      onClick={(data) =>
                        openModal(
                          "division",
                          {
                            name: data.name,
                            revenue: data.revenue,
                            count: data.count,
                          },
                          revenueByDivision,
                          revenueByDivision.findIndex(
                            (d) => d.name === data.name,
                          ),
                        )
                      }
                      cursor="pointer"
                    >
                      {revenueByDivision.map((e, i) => (
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
        {revenueByOperation.length > 0 && (
          <Card className="dark:border-zinc-700 dark:bg-white/13">
            <CardHeader>
              <CardTitle>Revenue by Operation</CardTitle>
              <CardDescription>
                Revenue contribution per operation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{ revenue: { label: "Revenue", color: "#eab308" } }}
                className="h-75 w-full"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueByOperation}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="name"
                      angle={-45}
                      textAnchor="end"
                      height={120}
                      interval={0}
                      tick={{ fontSize: 11, fill: "#64748b" }}
                      tickFormatter={(v: string) =>
                        v.length > 20 ? v.slice(0, 20) + "..." : v
                      }
                      onClick={(d: { value?: string }) => {
                        const name = d?.value;
                        if (!name) return;
                        const item = revenueByOperation.find(
                          (s) => s.name === name,
                        );
                        if (!item) return;
                        openModal(
                          "operation",
                          item,
                          revenueByOperation,
                          revenueByOperation.findIndex((s) => s.name === name),
                        );
                      }}
                      style={{ cursor: "pointer" }}
                    />
                    <YAxis
                      domain={[0, "auto"]}
                      width={getYAxisWidth(revenueByOperation)}
                      tickFormatter={fmt}
                    />
                    <ChartTooltip
                      content={(props: unknown) => (
                        <CustomBarTooltip
                          {...(props as Parameters<typeof CustomBarTooltip>[0])}
                          data={revenueByOperation}
                          valueKey="revenue"
                          countKey="count"
                          valueLabel="Revenue"
                          countLabel="Transactions"
                        />
                      )}
                    />
                    <Bar
                      dataKey="revenue"
                      radius={[4, 4, 0, 0]}
                      onMouseEnter={(data) => setHoveredBar(`op::${data.name}`)}
                      onMouseLeave={() => setHoveredBar(null)}
                      onClick={(data) =>
                        openModal(
                          "operation",
                          {
                            name: data.name,
                            revenue: data.revenue,
                            count: data.count,
                          },
                          revenueByOperation,
                          revenueByOperation.findIndex(
                            (o) => o.name === data.name,
                          ),
                        )
                      }
                      cursor="pointer"
                    >
                      {revenueByOperation.map((e, i) => (
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
