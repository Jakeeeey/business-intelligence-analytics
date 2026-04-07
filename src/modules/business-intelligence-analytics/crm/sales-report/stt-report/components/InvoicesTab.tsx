// src/modules/business-intelligence-analytics/sales-report/sales-report-summary/components/InvoicesTab.tsx
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
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Sector,
  Cell,
  Legend,
} from "recharts";
import { useTheme } from "next-themes";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { InvoiceSummary } from "../types";

const phpFmt = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const numFmt = new Intl.NumberFormat("en-US");

const CHART_COLORS = [
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#f97316",
  "#22c55e",
  "#14b8a6",
  "#eab308",
  "#ef4444",
];

type LineDotProps = {
  cx: number;
  cy: number;
  r: number;
  fill: string;
  stroke: string;
  index: number;
};

const MONTH_NAMES = [
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

type Granularity =
  | "daily"
  | "weekly"
  | "bi-weekly"
  | "monthly"
  | "bi-monthly"
  | "quarterly"
  | "semi-annually"
  | "yearly";

const GRANULARITY_OPTIONS: { label: string; value: Granularity }[] = [
  { label: "Daily", value: "daily" },
  { label: "Weekly", value: "weekly" },
  { label: "Bi-Weekly", value: "bi-weekly" },
  { label: "Monthly", value: "monthly" },
  { label: "Bi-Monthly", value: "bi-monthly" },
  { label: "Quarterly", value: "quarterly" },
  { label: "Semi-Annually", value: "semi-annually" },
  { label: "Yearly", value: "yearly" },
];

function parseDateLocal(s: string): Date {
  if (!s) return new Date(NaN);
  const part = s.slice(0, 10);
  const m = part.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return new Date(NaN);
}

function fmtPeriodLabel(period: string, granularity: Granularity): string {
  const m = period.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return period;
  const y = Number(m[1]),
    mo = Number(m[2]),
    d = Number(m[3]);
  const start = new Date(y, mo - 1, d);
  const mn = (dt: Date) => MONTH_NAMES[dt.getMonth()];
  switch (granularity) {
    case "daily":
      return `${mn(start)} ${d}`;
    case "weekly": {
      const e = new Date(y, mo - 1, d + 6);
      return start.getMonth() === e.getMonth()
        ? `${mn(start)} ${d}-${e.getDate()}`
        : `${mn(start)} ${d} - ${mn(e)} ${e.getDate()}`;
    }
    case "bi-weekly": {
      const e = new Date(y, mo - 1, d + 13);
      return start.getMonth() === e.getMonth()
        ? `${mn(start)} ${d}-${e.getDate()}`
        : `${mn(start)} ${d} - ${mn(e)} ${e.getDate()}`;
    }
    case "monthly":
      return `${mn(start)} ${y}`;
    case "bi-monthly": {
      const endMonth = new Date(y, mo + 1, 0);
      return `${mn(start)}-${mn(endMonth)} ${y}`;
    }
    case "quarterly":
      return `Q${Math.floor((mo - 1) / 3) + 1} ${y}`;
    case "semi-annually":
      return `H${mo <= 6 ? 1 : 2} ${y}`;
    case "yearly":
      return `${y}`;
    default:
      return period;
  }
}

function fmtPeriodHuman(period: string): string {
  const m = period.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return period;
  const [, y, mo, d] = m;
  return `${MONTH_NAMES[Number(mo) - 1]} ${Number(d)}, ${y}`;
}

function getBucketStartFor(d: Date, granularity: Granularity): Date {
  const dt = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  switch (granularity) {
    case "daily":
      return dt;
    case "weekly": {
      const diff = (dt.getDay() + 6) % 7;
      return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate() - diff);
    }
    case "bi-weekly": {
      const diffW = (dt.getDay() + 6) % 7;
      const weekStart = new Date(
        dt.getFullYear(),
        dt.getMonth(),
        dt.getDate() - diffW,
      );
      const yearStart = new Date(dt.getFullYear(), 0, 1);
      const ysDiff = (yearStart.getDay() + 6) % 7;
      const firstMon = new Date(
        yearStart.getFullYear(),
        yearStart.getMonth(),
        yearStart.getDate() - ysDiff,
      );
      const weekIdx = Math.floor(
        (weekStart.getTime() - firstMon.getTime()) / (7 * 864e5),
      );
      const biIdx = Math.floor(weekIdx / 2);
      const bs = new Date(firstMon.getTime() + biIdx * 14 * 864e5);
      return new Date(bs.getFullYear(), bs.getMonth(), bs.getDate());
    }
    case "monthly":
      return new Date(dt.getFullYear(), dt.getMonth(), 1);
    case "bi-monthly":
      return new Date(dt.getFullYear(), dt.getMonth() - (dt.getMonth() % 2), 1);
    case "quarterly":
      return new Date(dt.getFullYear(), Math.floor(dt.getMonth() / 3) * 3, 1);
    case "semi-annually":
      return new Date(dt.getFullYear(), dt.getMonth() < 6 ? 0 : 6, 1);
    case "yearly":
      return new Date(dt.getFullYear(), 0, 1);
  }
}

function getKeyFor(start: Date): string {
  const y = start.getFullYear();
  const mo = String(start.getMonth() + 1).padStart(2, "0");
  const d = String(start.getDate()).padStart(2, "0");
  return `${y}-${mo}-${d}`;
}

function addPeriodFor(d: Date, granularity: Granularity): Date {
  const dt = new Date(d);
  switch (granularity) {
    case "daily":
      dt.setDate(dt.getDate() + 1);
      return dt;
    case "weekly":
      dt.setDate(dt.getDate() + 7);
      return dt;
    case "bi-weekly":
      dt.setDate(dt.getDate() + 14);
      return dt;
    case "monthly":
      return new Date(dt.getFullYear(), dt.getMonth() + 1, 1);
    case "bi-monthly":
      return new Date(dt.getFullYear(), dt.getMonth() + 2, 1);
    case "quarterly":
      return new Date(dt.getFullYear(), dt.getMonth() + 3, 1);
    case "semi-annually":
      return new Date(dt.getFullYear(), dt.getMonth() + 6, 1);
    case "yearly":
      return new Date(dt.getFullYear() + 1, 0, 1);
  }
}

function buildTrendData(
  invoiceSummaries: InvoiceSummary[],
  granularity: Granularity,
  dateFrom?: string,
  dateTo?: string,
) {
  const map = new Map<
    string,
    { start: Date; count: number; amount: number; collections: number }
  >();

  const now = new Date();

  // Compute startBound from filter's dateFrom
  const startBound = dateFrom ? parseDateLocal(dateFrom) : null;

  // Cap endBound at the end of the current granularity period (mirrors OverviewTab logic)
  const filterEnd = dateTo
    ? (() => {
        const d = parseDateLocal(dateTo);
        d.setHours(23, 59, 59, 999);
        return d;
      })()
    : null;

  const periodEnd = (() => {
    switch (granularity) {
      case "daily":
        return new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          23,
          59,
          59,
          999,
        );
      case "weekly": {
        const day = now.getDay();
        const daysToSunday = day === 0 ? 0 : 7 - day;
        return new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() + daysToSunday,
          23,
          59,
          59,
          999,
        );
      }
      case "bi-weekly": {
        const day = now.getDay();
        const daysFromMonday = (day + 6) % 7;
        const monday = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() - daysFromMonday,
        );
        return new Date(
          monday.getFullYear(),
          monday.getMonth(),
          monday.getDate() + 13,
          23,
          59,
          59,
          999,
        );
      }
      case "monthly":
        return new Date(
          now.getFullYear(),
          now.getMonth() + 1,
          0,
          23,
          59,
          59,
          999,
        );
      case "bi-monthly": {
        const biStart = now.getMonth() - (now.getMonth() % 2);
        return new Date(now.getFullYear(), biStart + 2, 0, 23, 59, 59, 999);
      }
      case "quarterly": {
        const q = Math.floor(now.getMonth() / 3);
        return new Date(now.getFullYear(), (q + 1) * 3, 0, 23, 59, 59, 999);
      }
      case "semi-annually": {
        const h = now.getMonth() < 6 ? 6 : 12;
        return new Date(now.getFullYear(), h, 0, 23, 59, 59, 999);
      }
      case "yearly":
        return new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
    }
  })();

  const endBound = filterEnd
    ? filterEnd.getTime() > periodEnd.getTime()
      ? periodEnd
      : filterEnd
    : periodEnd;

  // Prepopulate all buckets from startBound → endBound so empty periods render
  if (startBound && !isNaN(startBound.getTime())) {
    let cursor = getBucketStartFor(startBound, granularity);
    while (cursor.getTime() <= endBound.getTime()) {
      const key = getKeyFor(cursor);
      if (!map.has(key))
        map.set(key, {
          start: new Date(cursor),
          count: 0,
          amount: 0,
          collections: 0,
        });
      cursor = addPeriodFor(cursor, granularity);
    }
  }

  // Accumulate invoice data into buckets
  invoiceSummaries.forEach((inv) => {
    const d = parseDateLocal(inv.invoiceDate ?? "");
    if (isNaN(d.getTime())) return;
    if (d.getTime() > endBound.getTime()) return;
    if (
      startBound &&
      !isNaN(startBound.getTime()) &&
      d.getTime() < startBound.getTime()
    )
      return;
    const bs = getBucketStartFor(d, granularity);
    const key = getKeyFor(bs);
    if (!map.has(key))
      map.set(key, { start: bs, count: 0, amount: 0, collections: 0 });
    const e = map.get(key)!;
    e.count += 1;
    // Use net amount for revenue (API's `amount` appears to be totalAmount - discount)
    const invNet = Number(
      inv.amount ??
        Number(inv.totalAmount ?? 0) - Number(inv.discountAmount ?? 0),
    );
    e.amount += invNet;
    e.collections += inv.collection;
  });

  return Array.from(map.entries())
    .map(([period, v]) => ({
      period,
      count: v.count,
      amount: v.amount,
      collections: v.collections,
      start: v.start,
    }))
    .sort((a, b) => a.start.getTime() - b.start.getTime())
    .map(({ period, count, amount, collections }) => ({
      period,
      count,
      amount,
      collections,
    }));
}

interface TrendTooltipProps {
  active?: boolean;
  payload?: Array<{
    dataKey: string;
    name: string;
    color: string;
    value: number;
  }>;
  label?: string | number;
  granularity: Granularity;
}

const TrendTooltip = React.memo(
  ({ active, payload, label, granularity }: TrendTooltipProps) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="rounded-lg border bg-background p-3 shadow-md text-sm min-w-48 space-y-1">
        <p className="font-semibold">
          {fmtPeriodHuman(String(label ?? ""))}{" "}
          <span className="text-muted-foreground font-normal">
            ({fmtPeriodLabel(String(label ?? ""), granularity)})
          </span>
        </p>
        <div className="border-t border-border pt-1.5 space-y-1">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {payload.map((p: any) => (
            <div key={p.dataKey} className="flex justify-between gap-4">
              <span
                style={{ color: p.color }}
                className="text-muted-foreground"
              >
                {p.name}
              </span>
              <span className="font-medium tabular-nums">
                {p.dataKey === "count"
                  ? numFmt.format(p.value)
                  : phpFmt.format(p.value)}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  },
);
TrendTooltip.displayName = "TrendTooltip";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const PieTooltipComp = React.memo(({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="rounded-lg border bg-background p-3 shadow-md text-sm space-y-1">
      <p className="font-semibold">{item.name}</p>
      <div className="flex justify-between gap-4">
        <span className="text-muted-foreground">Count</span>
        <span className="font-medium">{numFmt.format(item.value)}</span>
      </div>
      <div className="flex justify-between gap-4">
        <span className="text-muted-foreground">Share</span>
        <span className="font-medium">{item.payload.pct}%</span>
      </div>
    </div>
  );
});
PieTooltipComp.displayName = "PieTooltipComp";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ActivePieShape = (props: any) => {
  const RADIAN = Math.PI / 180;
  const {
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    startAngle,
    endAngle,
    fill,
  } = props;
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  const sx = cx + (outerRadius + 10) * cos;
  const sy = cy + (outerRadius + 10) * sin;
  const mx = cx + (outerRadius + 20) * cos;
  const my = cy + (outerRadius + 20) * sin;
  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 6}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        style={{ filter: `drop-shadow(0 0 4px ${fill})` }}
      />
      <path d={`M${sx},${sy}L${mx},${my}`} stroke={fill} fill="none" />
    </g>
  );
};

const StatusBadge = React.memo(({ status }: { status: string | null }) => {
  const s = status ?? "";
  const cls =
    s === "Dispatched"
      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
      : s === "Pending"
        ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
        : s === "Cancelled"
          ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
          : "bg-zinc-100 text-zinc-700 dark:bg-zinc-700/40 dark:text-zinc-300";
  return (
    <Badge variant="secondary" className={cls}>
      {s || "N/A"}
    </Badge>
  );
});
StatusBadge.displayName = "StatusBadge";

const PaymentBadge = React.memo(({ status }: { status: string | null }) => {
  const s = status ?? "";
  const cls =
    s === "Paid"
      ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
      : s === "Unpaid"
        ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
        : "bg-zinc-100 text-zinc-700 dark:bg-zinc-700/40 dark:text-zinc-300";
  return (
    <Badge variant="secondary" className={cls}>
      {s || "N/A"}
    </Badge>
  );
});
PaymentBadge.displayName = "PaymentBadge";

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return "N/A";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "N/A";
  return d.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

// Compute a reliable net amount for an invoice record.
function computeNetAmount(inv: Partial<InvoiceSummary>) {
  // 1) Prefer explicit `amount` provided by API
  if (inv.amount != null && !Number.isNaN(Number(inv.amount)))
    return Number(inv.amount);

  // 3) Fallback: totalAmount - discountAmount - returnNet (or derived return net)
  const total = Number(inv.totalAmount ?? 0);
  const disc = Number(inv.discountAmount ?? 0);
  const retTotal = Number(inv.returnTotalAmount ?? 0);
  const retDisc = Number(inv.returnDiscountAmount ?? 0);
  const retNet =
    inv.returnNetAmount != null && !Number.isNaN(Number(inv.returnNetAmount))
      ? Number(inv.returnNetAmount)
      : retTotal - retDisc;

  return total - disc - retNet;
}

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

type InvoicesTabProps = {
  invoiceSummaries: InvoiceSummary[];
  dateFrom?: string;
  dateTo?: string;
};

function SortIndicator({
  k,
  sortKey,
  sortDir,
}: {
  k: keyof InvoiceSummary;
  sortKey: keyof InvoiceSummary;
  sortDir: "asc" | "desc";
}) {
  return (
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
}

function InvoicesTabComponent({
  invoiceSummaries,
  dateFrom,
  dateTo,
}: InvoicesTabProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const colors = isDark
    ? [
        "#2563eb",
        "#6d28d9",
        "#be185d",
        "#c2410c",
        "#15803d",
        "#0f766e",
        "#a16207",
        "#b91c1c",
      ]
    : CHART_COLORS;

  const [granularity, setGranularity] = React.useState<Granularity>("monthly");

  // Create an enriched invoices list with a reliable numeric `amount` field
  const enrichedInvoices = React.useMemo(() => {
    return invoiceSummaries.map((inv) => ({
      ...inv,
      amount:
        inv.amount != null && !Number.isNaN(Number(inv.amount))
          ? Number(inv.amount)
          : computeNetAmount(inv),
    }));
  }, [invoiceSummaries]);

  // Chart derived data (use enriched invoices)
  const trendData = React.useMemo(
    () => buildTrendData(enrichedInvoices, granularity, dateFrom, dateTo),
    [enrichedInvoices, granularity, dateFrom, dateTo],
  );

  const txStatusData = React.useMemo(() => {
    const map = new Map<string, number>();
    enrichedInvoices.forEach((inv) => {
      const k = inv.transactionStatus ?? "N/A";
      map.set(k, (map.get(k) ?? 0) + 1);
    });
    const total = enrichedInvoices.length || 1;
    return Array.from(map.entries())
      .map(([name, value]) => ({
        name,
        value,
        pct: ((value / total) * 100).toFixed(2),
      }))
      .sort((a, b) => b.value - a.value);
  }, [enrichedInvoices]);

  const payStatusData = React.useMemo(() => {
    const map = new Map<string, number>();
    enrichedInvoices.forEach((inv) => {
      const k = inv.paymentStatus ?? "N/A";
      map.set(k, (map.get(k) ?? 0) + 1);
    });
    const total = enrichedInvoices.length || 1;
    return Array.from(map.entries())
      .map(([name, value]) => ({
        name,
        value,
        pct: ((value / total) * 100).toFixed(2),
      }))
      .sort((a, b) => b.value - a.value);
  }, [enrichedInvoices]);

  const axisColor = isDark ? "#71717a" : "#a1a1aa";
  const gridColor = isDark ? "#3f3f46" : "#e4e4e7";
  const trendColor = colors[0];
  const amtColor = colors[1];
  const colColor = colors[4];

  const [activeTxPieIdx, setActiveTxPieIdx] = React.useState<
    number | undefined
  >(undefined);
  const [activePayPieIdx, setActivePayPieIdx] = React.useState<
    number | undefined
  >(undefined);
  const [hoveredLine, setHoveredLine] = React.useState<string | null>(null);

  // Status filters — clicking a pie slice or legend row filters the invoice table
  const [txStatusFilter, setTxStatusFilter] = React.useState<string | null>(
    null,
  );
  const [payStatusFilter, setPayStatusFilter] = React.useState<string | null>(
    null,
  );

  const [search, setSearch] = React.useState("");
  const [sortKey, setSortKey] =
    React.useState<keyof InvoiceSummary>("invoiceDate");
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("desc");
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [animKey, setAnimKey] = React.useState(0);

  const toggleSort = (key: keyof InvoiceSummary) => {
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
    let list = q
      ? enrichedInvoices.filter(
          (inv) =>
            (inv.invoiceNo ?? "N/A").toLowerCase().includes(q) ||
            (inv.customerName ?? "N/A").toLowerCase().includes(q) ||
            (inv.salesman ?? "N/A").toLowerCase().includes(q) ||
            (inv.branch ?? "N/A").toLowerCase().includes(q) ||
            (inv.transactionStatus ?? "N/A").toLowerCase().includes(q) ||
            (inv.paymentStatus ?? "N/A").toLowerCase().includes(q),
        )
      : enrichedInvoices;

    if (txStatusFilter)
      list = list.filter((inv) =>
        txStatusFilter === "N/A"
          ? inv.transactionStatus == null || inv.transactionStatus === ""
          : inv.transactionStatus === txStatusFilter,
      );
    if (payStatusFilter)
      list = list.filter((inv) =>
        payStatusFilter === "N/A"
          ? inv.paymentStatus == null || inv.paymentStatus === ""
          : inv.paymentStatus === payStatusFilter,
      );

    return [...list].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === "number" && typeof bv === "number") {
        return sortDir === "asc" ? av - bv : bv - av;
      }
      const as = String(av ?? "N/A");
      const bs = String(bv ?? "N/A");
      return sortDir === "asc" ? as.localeCompare(bs) : bs.localeCompare(as);
    });
  }, [
    enrichedInvoices,
    search,
    sortKey,
    sortDir,
    txStatusFilter,
    payStatusFilter,
  ]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  React.useEffect(
    () => setPage(1),
    [search, pageSize, txStatusFilter, payStatusFilter],
  );

  const from = filtered.length === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, filtered.length);
  const pageNums = getPageNumbers(page, totalPages);

  return (
    <div className="space-y-4">
      {/* ── Trend (3/4) + Status pies (1/4) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-stretch">
        {/* Invoice Volume & Revenue Trend — 3/4 */}
        <Card className="lg:col-span-3 flex flex-col">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <CardTitle>Invoice Volume &amp; Revenue Trend</CardTitle>
                <CardDescription>
                  Number of invoices and total amount per period
                </CardDescription>
              </div>
            </div>
            {/* Granularity buttons */}
            <div className="flex flex-wrap gap-1 justify-end">
              {GRANULARITY_OPTIONS.map((opt) => (
                <Button
                  key={opt.value}
                  size="sm"
                  variant={granularity === opt.value ? "default" : "outline"}
                  className={`h-7 px-2.5 text-xs  ${granularity === opt.value ? "" : "text-muted-foreground"}`}
                  onClick={() => setGranularity(opt.value)}
                >
                  {opt.label}
                </Button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col min-h-0">
            {trendData.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
                No data
              </div>
            ) : (
              <div className="flex-1 min-h-70">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={trendData}
                    margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
                    onMouseLeave={() => setHoveredLine(null)}
                  >
                    <CartesianGrid stroke={gridColor} strokeDasharray="3 3" />
                    <XAxis
                      dataKey="period"
                      tick={{ fontSize: 11, fill: axisColor }}
                      tickFormatter={(v) => fmtPeriodLabel(v, granularity)}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      yAxisId="left"
                      orientation="left"
                      tick={{ fontSize: 11, fill: axisColor }}
                      tickFormatter={(v: number) => numFmt.format(v)}
                      width={40}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      tick={{ fontSize: 11, fill: axisColor }}
                      tickFormatter={(v: number) =>
                        `₱${v >= 1e6 ? (v / 1e6).toFixed(1) + "M" : v >= 1e3 ? (v / 1e3).toFixed(0) + "K" : v}`
                      }
                      width={56}
                    />
                    <RechartsTooltip
                      content={<TrendTooltip granularity={granularity} />}
                    />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="count"
                      name="Invoices"
                      stroke={trendColor}
                      strokeWidth={hoveredLine === "count" ? 3 : 2}
                      strokeOpacity={
                        hoveredLine === null || hoveredLine === "count"
                          ? 1
                          : 0.15
                      }
                      dot={
                        trendData.length < 60
                          ? (p: unknown) => {
                              const { cx, cy, r, fill, stroke, index } =
                                p as LineDotProps;
                              return (
                                <circle
                                  key={`dc-${index}`}
                                  cx={cx}
                                  cy={cy}
                                  r={r ?? 3}
                                  fill={fill}
                                  stroke={stroke}
                                  strokeWidth={1}
                                  style={{ cursor: "pointer" }}
                                  onMouseEnter={() => setHoveredLine("count")}
                                  onMouseLeave={() => setHoveredLine(null)}
                                />
                              );
                            }
                          : false
                      }
                      activeDot={(p: unknown) => {
                        const { cx, cy, r, fill, stroke } = p as LineDotProps;
                        return (
                          <circle
                            cx={cx}
                            cy={cy}
                            r={(r ?? 4) + 2}
                            fill={fill}
                            stroke={stroke}
                            strokeWidth={2}
                            style={{ cursor: "pointer" }}
                            onMouseEnter={() => setHoveredLine("count")}
                            onMouseLeave={() => setHoveredLine(null)}
                          />
                        );
                      }}
                      onMouseEnter={() => setHoveredLine("count")}
                      onMouseLeave={() => setHoveredLine(null)}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="amount"
                      name="Amount"
                      stroke={amtColor}
                      strokeWidth={hoveredLine === "amount" ? 3 : 2}
                      strokeOpacity={
                        hoveredLine === null || hoveredLine === "amount"
                          ? 1
                          : 0.15
                      }
                      dot={false}
                      activeDot={(p: unknown) => {
                        const { cx, cy, r, fill, stroke } = p as LineDotProps;
                        return (
                          <circle
                            cx={cx}
                            cy={cy}
                            r={(r ?? 4) + 2}
                            fill={fill}
                            stroke={stroke}
                            strokeWidth={2}
                            style={{ cursor: "pointer" }}
                            onMouseEnter={() => setHoveredLine("amount")}
                            onMouseLeave={() => setHoveredLine(null)}
                          />
                        );
                      }}
                      onMouseEnter={() => setHoveredLine("amount")}
                      onMouseLeave={() => setHoveredLine(null)}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="collections"
                      name="Collections"
                      stroke={colColor}
                      strokeWidth={hoveredLine === "collections" ? 3 : 2}
                      strokeOpacity={
                        hoveredLine === null || hoveredLine === "collections"
                          ? 1
                          : 0.15
                      }
                      dot={false}
                      strokeDasharray="5 3"
                      activeDot={(p: unknown) => {
                        const { cx, cy, r, fill, stroke } = p as LineDotProps;
                        return (
                          <circle
                            cx={cx}
                            cy={cy}
                            r={(r ?? 4) + 2}
                            fill={fill}
                            stroke={stroke}
                            strokeWidth={2}
                            style={{ cursor: "pointer" }}
                            onMouseEnter={() => setHoveredLine("collections")}
                            onMouseLeave={() => setHoveredLine(null)}
                          />
                        );
                      }}
                      onMouseEnter={() => setHoveredLine("collections")}
                      onMouseLeave={() => setHoveredLine(null)}
                    />
                    <Legend
                      iconType="line"
                      iconSize={10}
                      wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                      onMouseEnter={(e) =>
                        setHoveredLine(
                          (e as { dataKey?: string }).dataKey ?? null,
                        )
                      }
                      onMouseLeave={() => setHoveredLine(null)}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right column: two pies stacked — 1/4 */}
        <div className="flex flex-col gap-4 lg:col-span-1">
          {/* Transaction Status */}
          <Card className=" ">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm">Transaction Status</CardTitle>
                  <CardDescription className="text-xs">
                    Click to filter invoices
                  </CardDescription>
                </div>
                {txStatusFilter && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => setTxStatusFilter(null)}
                  >
                    Clear
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-3 pt-0">
              {txStatusData.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6">No data</p>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie
                        data={txStatusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={42}
                        outerRadius={68}
                        paddingAngle={3}
                        dataKey="value"
                        activeIndex={activeTxPieIdx}
                        activeShape={ActivePieShape}
                        onMouseEnter={(_, idx) => setActiveTxPieIdx(idx)}
                        onMouseLeave={() => setActiveTxPieIdx(undefined)}
                        onClick={(entry) =>
                          setTxStatusFilter((prev) =>
                            prev === (entry as { name: string }).name
                              ? null
                              : (entry as { name: string }).name,
                          )
                        }
                        style={{ cursor: "pointer" }}
                      >
                        {txStatusData.map((d, i) => (
                          <Cell
                            key={i}
                            fill={colors[i % colors.length]}
                            opacity={
                              txStatusFilter === null ||
                              txStatusFilter === d.name
                                ? 1
                                : 0.3
                            }
                          />
                        ))}
                      </Pie>
                      <RechartsTooltip content={<PieTooltipComp />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-col gap-0.5 w-full">
                    {txStatusData.map((d, i) => (
                      <div
                        key={d.name}
                        role="button"
                        tabIndex={0}
                        onClick={() =>
                          setTxStatusFilter((prev) =>
                            prev === d.name ? null : d.name,
                          )
                        }
                        onKeyDown={(e) =>
                          e.key === "Enter" &&
                          setTxStatusFilter((prev) =>
                            prev === d.name ? null : d.name,
                          )
                        }
                        className={`flex items-center gap-2 text-xs rounded px-1.5 py-1 cursor-pointer select-none transition-colors ${
                          txStatusFilter === d.name
                            ? "bg-accent text-foreground font-semibold"
                            : "hover:bg-accent/60 text-muted-foreground"
                        } ${
                          txStatusFilter !== null && txStatusFilter !== d.name
                            ? "opacity-40"
                            : ""
                        }`}
                      >
                        <div
                          className={`h-2.5 w-2.5 rounded-full shrink-0 transition-all ${
                            txStatusFilter === d.name
                              ? "ring-2 ring-offset-1 ring-current"
                              : ""
                          }`}
                          style={{ backgroundColor: colors[i % colors.length] }}
                        />
                        <span className="truncate">{d.name}</span>
                        <span className="font-semibold ml-auto tabular-nums">
                          {numFmt.format(d.value)}
                        </span>
                        <span className="opacity-70">({d.pct}%)</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Payment Status */}
          <Card className=" ">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm">Payment Status</CardTitle>
                  <CardDescription className="text-xs">
                    Click to filter invoices
                  </CardDescription>
                </div>
                {payStatusFilter && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => setPayStatusFilter(null)}
                  >
                    Clear
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-3 pt-0">
              {payStatusData.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6">No data</p>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie
                        data={payStatusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={42}
                        outerRadius={68}
                        paddingAngle={3}
                        dataKey="value"
                        activeIndex={activePayPieIdx}
                        activeShape={ActivePieShape}
                        onMouseEnter={(_, idx) => setActivePayPieIdx(idx)}
                        onMouseLeave={() => setActivePayPieIdx(undefined)}
                        onClick={(entry) =>
                          setPayStatusFilter((prev) =>
                            prev === (entry as { name: string }).name
                              ? null
                              : (entry as { name: string }).name,
                          )
                        }
                        style={{ cursor: "pointer" }}
                      >
                        {payStatusData.map((d, i) => (
                          <Cell
                            key={i}
                            fill={colors[(i + 3) % colors.length]}
                            opacity={
                              payStatusFilter === null ||
                              payStatusFilter === d.name
                                ? 1
                                : 0.3
                            }
                          />
                        ))}
                      </Pie>
                      <RechartsTooltip content={<PieTooltipComp />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-col gap-0.5 w-full">
                    {payStatusData.map((d, i) => (
                      <div
                        key={d.name}
                        role="button"
                        tabIndex={0}
                        onClick={() =>
                          setPayStatusFilter((prev) =>
                            prev === d.name ? null : d.name,
                          )
                        }
                        onKeyDown={(e) =>
                          e.key === "Enter" &&
                          setPayStatusFilter((prev) =>
                            prev === d.name ? null : d.name,
                          )
                        }
                        className={`flex items-center gap-2 text-xs rounded px-1.5 py-1 cursor-pointer select-none transition-colors ${
                          payStatusFilter === d.name
                            ? "bg-accent text-foreground font-semibold"
                            : "hover:bg-accent/60 text-muted-foreground"
                        } ${
                          payStatusFilter !== null && payStatusFilter !== d.name
                            ? "opacity-40"
                            : ""
                        }`}
                      >
                        <div
                          className={`h-2.5 w-2.5 rounded-full shrink-0 transition-all ${
                            payStatusFilter === d.name
                              ? "ring-2 ring-offset-1 ring-current"
                              : ""
                          }`}
                          style={{
                            backgroundColor: colors[(i + 3) % colors.length],
                          }}
                        />
                        <span className="truncate">{d.name}</span>
                        <span className="font-semibold ml-auto tabular-nums">
                          {numFmt.format(d.value)}
                        </span>
                        <span className="opacity-70">({d.pct}%)</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Invoice Table ── */}
      <Card className=" ">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <CardTitle>Invoices</CardTitle>
              <CardDescription>
                {filtered.length} invoice{filtered.length !== 1 ? "s" : ""} —
                click headers to sort
              </CardDescription>
            </div>
            {(txStatusFilter || payStatusFilter) && (
              <div className="flex flex-wrap items-center gap-2">
                {txStatusFilter && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium dark:border-zinc-600">
                    Transaction Status: {txStatusFilter}
                    <button
                      onClick={() => setTxStatusFilter(null)}
                      className="rounded-full opacity-60 hover:opacity-100 hover:text-destructive transition-opacity"
                      aria-label="Clear transaction status filter"
                    >
                      ✕
                    </button>
                  </span>
                )}
                {payStatusFilter && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium dark:border-zinc-600">
                    Payment Status: {payStatusFilter}
                    <button
                      onClick={() => setPayStatusFilter(null)}
                      className="rounded-full opacity-60 hover:opacity-100 hover:text-destructive transition-opacity"
                      aria-label="Clear payment status filter"
                    >
                      ✕
                    </button>
                  </span>
                )}
                {txStatusFilter && payStatusFilter && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={() => {
                      setTxStatusFilter(null);
                      setPayStatusFilter(null);
                    }}
                  >
                    Clear all
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="px-4 pb-3 pt-2">
            <Input
              placeholder="Search invoice, customer, salesman, branch..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm "
            />
          </div>

          <div className="overflow-x-auto">
            <Table className="table-fixed min-w-300">
              <TableHeader>
                <TableRow className="">
                  <TableHead
                    className="w-40 cursor-pointer hover:text-foreground"
                    onClick={() => toggleSort("invoiceNo")}
                  >
                    Invoice No
                    <SortIndicator
                      k="invoiceNo"
                      sortKey={sortKey}
                      sortDir={sortDir}
                    />
                  </TableHead>
                  <TableHead
                    className="w-22 cursor-pointer hover:text-foreground"
                    onClick={() => toggleSort("invoiceDate")}
                  >
                    Invoice Date
                    <SortIndicator
                      k="invoiceDate"
                      sortKey={sortKey}
                      sortDir={sortDir}
                    />
                  </TableHead>
                  <TableHead
                    className="w-40 cursor-pointer hover:text-foreground"
                    onClick={() => toggleSort("customerName")}
                  >
                    Customer
                    <SortIndicator
                      k="customerName"
                      sortKey={sortKey}
                      sortDir={sortDir}
                    />
                  </TableHead>
                  <TableHead
                    className="w-32 cursor-pointer hover:text-foreground"
                    onClick={() => toggleSort("salesman")}
                  >
                    Salesman
                    <SortIndicator
                      k="salesman"
                      sortKey={sortKey}
                      sortDir={sortDir}
                    />
                  </TableHead>
                  <TableHead
                    className="w-30 cursor-pointer hover:text-foreground"
                    onClick={() => toggleSort("branch")}
                  >
                    Branch
                    <SortIndicator
                      k="branch"
                      sortKey={sortKey}
                      sortDir={sortDir}
                    />
                  </TableHead>
                  <TableHead
                    className="w-24 cursor-pointer hover:text-foreground"
                    onClick={() => toggleSort("totalAmount")}
                  >
                    Gross Amount
                    <SortIndicator
                      k="totalAmount"
                      sortKey={sortKey}
                      sortDir={sortDir}
                    />
                  </TableHead>
                  <TableHead
                    className="w-24 cursor-pointer hover:text-foreground"
                    onClick={() => toggleSort("discountAmount")}
                  >
                    Discount
                    <SortIndicator
                      k="discountAmount"
                      sortKey={sortKey}
                      sortDir={sortDir}
                    />
                  </TableHead>
                  <TableHead
                    className="w-24 cursor-pointer hover:text-foreground"
                    onClick={() => toggleSort("amount")}
                  >
                    Net Amount
                    <SortIndicator
                      k="amount"
                      sortKey={sortKey}
                      sortDir={sortDir}
                    />
                  </TableHead>
                  <TableHead
                    className="w-24 cursor-pointer hover:text-foreground"
                    onClick={() => toggleSort("collection")}
                  >
                    Collected Amount
                    <SortIndicator
                      k="collection"
                      sortKey={sortKey}
                      sortDir={sortDir}
                    />
                  </TableHead>
                  <TableHead
                    className="w-24 cursor-pointer hover:text-foreground"
                    onClick={() => toggleSort("transactionStatus")}
                  >
                    Transaction Status
                    <SortIndicator
                      k="transactionStatus"
                      sortKey={sortKey}
                      sortDir={sortDir}
                    />
                  </TableHead>
                  <TableHead
                    className="w-20 cursor-pointer hover:text-foreground"
                    onClick={() => toggleSort("paymentStatus")}
                  >
                    Payment Status
                    <SortIndicator
                      k="paymentStatus"
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
                {paginated.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={11}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No invoices found
                    </TableCell>
                  </TableRow>
                )}
                {paginated.map((inv) => (
                  <TableRow
                    key={inv.invoiceId}
                    className=""
                  >
                    <TableCell className="overflow-hidden font-mono text-sm font-medium">
                      <span className="truncate block">
                        {inv.invoiceNo ?? "N/A"}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(inv.invoiceDate)}
                    </TableCell>
                    <TableCell className="overflow-hidden">
                      <p className="truncate" title={inv.customerName ?? ""}>
                        {inv.customerName ?? "N/A"}
                      </p>
                    </TableCell>
                    <TableCell className="overflow-hidden">
                      <p className="truncate" title={inv.salesman ?? ""}>
                        {inv.salesman ?? "N/A"}
                      </p>
                    </TableCell>
                    <TableCell className="overflow-hidden">
                      <p
                        className="truncate text-sm text-muted-foreground"
                        title={inv.branch ?? ""}
                      >
                        {inv.branch ?? "N/A"}
                      </p>
                    </TableCell>
                    <TableCell className="tabular-nums font-medium">
                      {phpFmt.format(inv.totalAmount)}
                    </TableCell>
                    <TableCell className="tabular-nums text-muted-foreground">
                      {phpFmt.format(inv.discountAmount || 0)}
                    </TableCell>
                    <TableCell className="tabular-nums font-medium">
                      {phpFmt.format(
                        inv.amount ??
                          inv.totalAmount - (inv.discountAmount ?? 0),
                      )}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {phpFmt.format(inv.collection)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={inv.transactionStatus} />
                    </TableCell>
                    <TableCell>
                      <PaymentBadge status={inv.paymentStatus} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t ">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Show</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="border rounded px-2 py-0.5 text-sm bg-background "
              >
                {PAGE_SIZE_OPTIONS.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              <span>per page</span>
              <span className="mx-2 text-muted-foreground/40">|</span>
              <span>
                Showing {from} to {to} of {filtered.length} results
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-3 "
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              {pageNums.map((pn, i) =>
                pn === "…" ? (
                  <span
                    key={`ellipsis-${i}`}
                    className="px-2 text-muted-foreground"
                  >
                    …
                  </span>
                ) : (
                  <Button
                    key={pn}
                    variant={pn === page ? "default" : "outline"}
                    size="sm"
                    className="h-8 w-8 p-0 "
                    onClick={() => setPage(pn as number)}
                  >
                    {pn}
                  </Button>
                ),
              )}
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-3 "
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export const InvoicesTab = React.memo(InvoicesTabComponent);
