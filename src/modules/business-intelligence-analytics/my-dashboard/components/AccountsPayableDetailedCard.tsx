"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  ArrowUpRight,
  Receipt,
  ClockAlert,
  AlertCircle,
  RefreshCw,
  Landmark,
  Building2,
  TrendingDown,
  Layers,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import type { DashboardCardItem } from "../types";

export interface AccountsPayableMetricData {
  totalPayable: number;
  totalPaid: number;
  outstandingBalance: number;
  realOutstanding: number;
  settlementRate: number;
  activeVouchersCount: number;
  activeSuppliersCount: number;
  overdueAmount: number;
  averageOverdueDays: number;
  overdueCount: number;
  categories: {
    trade: {
      count: number;
      payable: number;
      paid: number;
      outstanding: number;
      overdue: number;
      overdueCount: number;
      fulfillmentRate: number;
    };
    nonTrade: {
      count: number;
      payable: number;
      paid: number;
      outstanding: number;
      overdue: number;
      overdueCount: number;
      fulfillmentRate: number;
    };
  };
  agingBuckets: {
    b0_30: number;
    b31_60: number;
    b61_90: number;
    b90Plus: number;
  };
  agingCounts: {
    b0_30: number;
    b31_60: number;
    b61_90: number;
    b90Plus: number;
  };
  topSuppliers: Array<{
    name: string;
    balance: number;
  }>;
}

const phpFmt = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const numFmt = new Intl.NumberFormat("en-US");

interface AccountsPayableDetailedCardProps {
  card: DashboardCardItem;
}

const CACHE_KEY = "bia_ap_detailed_cache";

export default function AccountsPayableDetailedCard({
  card,
}: AccountsPayableDetailedCardProps) {
  const isCacheEnabled = card.cached !== false;
  const cacheTtlMs =
    typeof card.cached_time === "number" && card.cached_time > 0
      ? card.cached_time > 10000
        ? card.cached_time
        : card.cached_time * 1000
      : 360000;

  const [data, setData] = useState<AccountsPayableMetricData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetric = useCallback(
    async (forceRefresh = false) => {
      if (forceRefresh || !data) {
        setLoading(true);
      }
      setError(null);
      try {
        const url = forceRefresh
          ? "/api/bia/my-dashboard/metrics/accounts-payable-detailed?force=true"
          : "/api/bia/my-dashboard/metrics/accounts-payable-detailed";
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) {
          const errData = await res.json().catch(() => null);
          const errMessage =
            errData?.message || errData?.error || `HTTP ${res.status}`;
          throw new Error(errMessage);
        }
        const json: AccountsPayableMetricData = await res.json();
        setData(json);

        if (isCacheEnabled) {
          try {
            const entry = JSON.stringify({ data: json, timestamp: Date.now() });
            localStorage.setItem(CACHE_KEY, entry);
            sessionStorage.setItem(CACHE_KEY, entry);
          } catch {
            // ignore quota issues
          }
        }
      } catch (err) {
        console.error("[AccountsPayableDetailedCard] Fetch error:", err);
        const errMsg =
          err instanceof Error
            ? err.message
            : "Unable to load accounts payable data";
        setError(errMsg);
      } finally {
        setLoading(false);
      }
    },
    [isCacheEnabled, data]
  );

  const hasMountCheckedRef = useRef(false);
  useEffect(() => {
    if (hasMountCheckedRef.current) return;
    hasMountCheckedRef.current = true;

    let hasCachedData = false;
    if (isCacheEnabled && typeof window !== "undefined") {
      try {
        const raw =
          localStorage.getItem(CACHE_KEY) || sessionStorage.getItem(CACHE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed.timestamp && Date.now() - parsed.timestamp < cacheTtlMs) {
            setData(parsed.data as AccountsPayableMetricData);
            setLoading(false);
            hasCachedData = true;
          } else if (
            !parsed.timestamp &&
            typeof parsed.totalPayable === "number"
          ) {
            setData(parsed as AccountsPayableMetricData);
            setLoading(false);
            hasCachedData = true;
          }
        }
      } catch {
        // ignore cache parse issues
      }
    }

    if (!hasCachedData) {
      fetchMetric(false);
    }
  }, [fetchMetric, isCacheEnabled, cacheTtlMs]);

  const totalAgingBucketsSum =
    data && data.overdueAmount > 0
      ? data.agingBuckets.b0_30 +
        data.agingBuckets.b31_60 +
        data.agingBuckets.b61_90 +
        data.agingBuckets.b90Plus
      : 0;

  const pct0_30 =
    totalAgingBucketsSum > 0
      ? ((data?.agingBuckets.b0_30 || 0) / totalAgingBucketsSum) * 100
      : 0;
  const pct31_60 =
    totalAgingBucketsSum > 0
      ? ((data?.agingBuckets.b31_60 || 0) / totalAgingBucketsSum) * 100
      : 0;
  const pct61_90 =
    totalAgingBucketsSum > 0
      ? ((data?.agingBuckets.b61_90 || 0) / totalAgingBucketsSum) * 100
      : 0;
  const pct90Plus =
    totalAgingBucketsSum > 0
      ? ((data?.agingBuckets.b90Plus || 0) / totalAgingBucketsSum) * 100
      : 0;

  const tradePct =
    data && data.outstandingBalance > 0
      ? (data.categories.trade.outstanding / data.outstandingBalance) * 100
      : 0;

  return (
    <Card className="col-span-2 sm:col-span-3 md:col-span-4 lg:col-span-4 row-span-2 flex flex-col border border-border/80 bg-gradient-to-br from-card via-card to-muted/20 shadow-xs transition-all duration-300 hover:shadow-sm dark:border-zinc-800 dark:from-zinc-900/90 dark:via-zinc-900/70 dark:to-zinc-950/90 overflow-hidden py-0 gap-0 h-full justify-between">
      {/* Top Sky / Indigo / Amber Gradient Bar */}
      <div className="h-0.5 w-full bg-gradient-to-r from-sky-500 via-indigo-500 to-amber-500 shrink-0" />

      {/* Header - Compact without excess padding */}
      <div className="px-3.5 py-2 sm:px-4 sm:py-2 border-b border-border/40 dark:border-zinc-800/60 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-sky-200/70 bg-sky-50 text-sky-600 dark:border-sky-800/50 dark:bg-sky-950/60 dark:text-sky-400">
            <Landmark className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold tracking-tight text-foreground truncate">
                Accounts Payable Detailed
              </span>
              <Badge
                variant="secondary"
                className="shrink-0 text-[10px] font-mono uppercase px-1.5 py-0 bg-muted text-muted-foreground dark:bg-zinc-800"
              >
                #{card.id}
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground truncate hidden sm:block">
              {card.description ||
                "Vendor liabilities, trade vs. non-trade distribution, and aging exposure."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchMetric(true)}
            disabled={loading}
            className="h-7 gap-1 px-2 text-[11px] dark:border-zinc-700 dark:bg-zinc-800"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          <Button
            size="sm"
            variant="default"
            asChild
            className="h-7 gap-1 px-2.5 text-[11px] font-medium shadow-2xs"
          >
            <a href="/fm/accounting/accounts-payable">
              <span>Open AP Ledger</span>
              <ArrowUpRight className="h-3 w-3" />
            </a>
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="px-3.5 py-2 sm:px-4 sm:py-2.5 flex-1 flex flex-col justify-between overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-6 gap-2 text-muted-foreground">
            <Spinner className="h-4 w-4 text-primary" />
            <p className="text-xs">Aggregating accounts payable obligations...</p>
          </div>
        ) : error ? (
          <div className="flex items-center justify-between gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive dark:border-destructive/40">
            <div className="flex items-center gap-2 min-w-0">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{error}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchMetric(true)}
              className="h-6 px-2 text-[10px] shrink-0 dark:border-destructive/40"
            >
              Retry
            </Button>
          </div>
        ) : !data ? null : (
          <div className="space-y-2.5">
            {/* Trade vs Non-Trade Quick Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* Trade Banner */}
              <div className="flex items-center justify-between rounded-lg border border-sky-200/60 bg-sky-50/50 p-2 dark:border-sky-900/40 dark:bg-sky-950/20">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300 shrink-0">
                    <Building2 className="h-3 w-3" />
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-bold text-sky-900 dark:text-sky-200">
                        Trade Payables
                      </span>
                      <Badge
                        variant="secondary"
                        className="text-[9px] px-1 py-0 bg-sky-100 text-sky-700 dark:bg-sky-900/60 dark:text-sky-300"
                      >
                        {data.categories.trade.fulfillmentRate.toFixed(1)}% paid
                      </Badge>
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {numFmt.format(data.categories.trade.count)} vouchers •{" "}
                      {numFmt.format(data.categories.trade.overdueCount)} overdue
                    </span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs sm:text-sm font-bold text-sky-700 dark:text-sky-300 tabular-nums">
                    {phpFmt.format(data.categories.trade.outstanding)}
                  </div>
                  <div className="text-[9px] text-muted-foreground">
                    Billed: {phpFmt.format(data.categories.trade.payable)}
                  </div>
                </div>
              </div>

              {/* Non-Trade Banner */}
              <div className="flex items-center justify-between rounded-lg border border-amber-200/60 bg-amber-50/50 p-2 dark:border-amber-900/40 dark:bg-amber-950/20">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 shrink-0">
                    <Layers className="h-3 w-3" />
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-bold text-amber-900 dark:text-amber-200">
                        Non-Trade Payables
                      </span>
                      <Badge
                        variant="secondary"
                        className="text-[9px] px-1 py-0 bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300"
                      >
                        {data.categories.nonTrade.fulfillmentRate.toFixed(1)}% paid
                      </Badge>
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {numFmt.format(data.categories.nonTrade.count)} vouchers •{" "}
                      {numFmt.format(data.categories.nonTrade.overdueCount)} overdue
                    </span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs sm:text-sm font-bold text-amber-700 dark:text-amber-300 tabular-nums">
                    {phpFmt.format(data.categories.nonTrade.outstanding)}
                  </div>
                  <div className="text-[9px] text-muted-foreground">
                    Billed: {phpFmt.format(data.categories.nonTrade.payable)}
                  </div>
                </div>
              </div>
            </div>

            {/* 4 Core Metric Pillars */}
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {/* Pillar 1: Total Outstanding */}
              <div className="relative overflow-hidden rounded-lg border border-border/70 bg-card/70 p-2.5 shadow-2xs transition-colors hover:border-sky-500/40 dark:border-zinc-800 dark:bg-zinc-800/40">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-[10px] font-semibold uppercase tracking-wider">
                    Total Outstanding
                  </span>
                  <span className="flex h-5 w-5 items-center justify-center rounded-md bg-sky-50 text-sky-600 dark:bg-sky-950/60 dark:text-sky-400">
                    <TrendingDown className="h-3 w-3" />
                  </span>
                </div>
                <div className="mt-1 text-base sm:text-lg font-bold tracking-tight text-sky-600 dark:text-sky-400 tabular-nums">
                  {phpFmt.format(data.outstandingBalance)}
                </div>
                <div className="mt-0.5 flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>Gross: {phpFmt.format(data.totalPayable)}</span>
                </div>
                <div className="mt-1.5 flex items-center justify-between pt-1 border-t border-border/40 dark:border-zinc-800/60 text-[10px]">
                  <span className="font-medium text-sky-700 dark:text-sky-300">
                    {numFmt.format(data.activeVouchersCount)} vouchers
                  </span>
                  <span className="text-muted-foreground">
                    {numFmt.format(data.activeSuppliersCount)} vendors
                  </span>
                </div>
              </div>

              {/* Pillar 2: Disbursed Payments */}
              <div className="relative overflow-hidden rounded-lg border border-border/70 bg-card/70 p-2.5 shadow-2xs transition-colors hover:border-indigo-500/40 dark:border-zinc-800 dark:bg-zinc-800/40">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-[10px] font-semibold uppercase tracking-wider">
                    Settled Payments
                  </span>
                  <span className="flex h-5 w-5 items-center justify-center rounded-md bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
                    <Receipt className="h-3 w-3" />
                  </span>
                </div>
                <div className="mt-1 text-base sm:text-lg font-bold tracking-tight text-foreground tabular-nums">
                  {phpFmt.format(data.totalPaid)}
                </div>
                <div className="mt-0.5 flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>Settlement Rate</span>
                  <span className="font-medium text-foreground">
                    {data.settlementRate.toFixed(1)}%
                  </span>
                </div>
                <div className="mt-1.5 pt-1 border-t border-border/40 dark:border-zinc-800/60">
                  <div className="h-1 w-full rounded-full bg-muted dark:bg-zinc-700 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-indigo-500"
                      style={{
                        width: `${Math.min(100, Math.max(0, data.settlementRate))}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Pillar 3: Trade vs Non-Trade Balance */}
              <div className="relative overflow-hidden rounded-lg border border-border/70 bg-card/70 p-2.5 shadow-2xs transition-colors hover:border-blue-500/40 dark:border-zinc-800 dark:bg-zinc-800/40">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-[10px] font-semibold uppercase tracking-wider">
                    Trade vs Non-Trade
                  </span>
                  <span className="flex h-5 w-5 items-center justify-center rounded-md bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                    <Layers className="h-3 w-3" />
                  </span>
                </div>
                <div className="mt-1 text-base sm:text-lg font-bold tracking-tight text-foreground tabular-nums">
                  {tradePct.toFixed(0)}% <span className="text-xs font-normal text-muted-foreground">Trade</span>
                </div>
                <div className="mt-0.5 flex items-center justify-between text-[10px] text-muted-foreground">
                  <span className="truncate">
                    Trade: {phpFmt.format(data.categories.trade.outstanding)}
                  </span>
                </div>
                <div className="mt-1.5 pt-1 border-t border-border/40 dark:border-zinc-800/60">
                  <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-amber-500">
                    <div
                      title={`Trade: ${tradePct.toFixed(1)}%`}
                      className="bg-sky-500 h-full"
                      style={{ width: `${tradePct}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Pillar 4: Aging & Overdue Exposure */}
              <div className="relative overflow-hidden rounded-lg border border-border/70 bg-card/70 p-2.5 shadow-2xs transition-colors hover:border-rose-500/40 dark:border-zinc-800 dark:bg-zinc-800/40">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-[10px] font-semibold uppercase tracking-wider">
                    Overdue Liabilities
                  </span>
                  <span className="flex h-5 w-5 items-center justify-center rounded-md bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
                    <ClockAlert className="h-3 w-3" />
                  </span>
                </div>
                <div className="mt-1 text-base sm:text-lg font-bold tracking-tight text-rose-600 dark:text-rose-400 tabular-nums">
                  {phpFmt.format(data.overdueAmount)}
                </div>
                <div className="mt-0.5 text-[10px] text-muted-foreground truncate">
                  Avg: {data.averageOverdueDays}d ({numFmt.format(data.overdueCount)} overdue)
                </div>
                <div className="mt-1.5 pt-1 border-t border-border/40 dark:border-zinc-800/60">
                  <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-muted dark:bg-zinc-700">
                    <div
                      title={`0-30d: ${phpFmt.format(data.agingBuckets.b0_30)}`}
                      className="bg-emerald-500 h-full"
                      style={{ width: `${pct0_30}%` }}
                    />
                    <div
                      title={`31-60d: ${phpFmt.format(data.agingBuckets.b31_60)}`}
                      className="bg-amber-400 h-full"
                      style={{ width: `${pct31_60}%` }}
                    />
                    <div
                      title={`61-90d: ${phpFmt.format(data.agingBuckets.b61_90)}`}
                      className="bg-orange-500 h-full"
                      style={{ width: `${pct61_90}%` }}
                    />
                    <div
                      title={`90+d: ${phpFmt.format(data.agingBuckets.b90Plus)}`}
                      className="bg-rose-600 h-full"
                      style={{ width: `${pct90Plus}%` }}
                    />
                  </div>
                  <div className="mt-0.5 flex items-center justify-between text-[8px] text-muted-foreground font-mono">
                    <span className="text-emerald-600 dark:text-emerald-400">0-30d</span>
                    <span className="text-amber-600 dark:text-amber-400">31-60d</span>
                    <span className="text-orange-600 dark:text-orange-400">61-90d</span>
                    <span className="text-rose-600 dark:text-rose-400 font-bold">90+d</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Row: Top 5 Suppliers & Aging Maturity Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1 border-t border-border/40 dark:border-zinc-800/60">
              {/* Top Suppliers */}
              <div className="rounded-lg border border-border/70 bg-card/50 p-2 dark:border-zinc-800 dark:bg-zinc-800/40">
                <div className="flex items-center justify-between pb-1 mb-1 border-b border-border/40 dark:border-zinc-800/60">
                  <div className="flex items-center gap-1.5">
                    <Building2 className="h-3 w-3 text-sky-600 dark:text-sky-400" />
                    <span className="text-[11px] font-semibold text-foreground">
                      Top Suppliers (Largest Payables)
                    </span>
                  </div>
                  <span className="text-[9px] text-muted-foreground uppercase font-medium">
                    Outstanding
                  </span>
                </div>
                {!data.topSuppliers || data.topSuppliers.length === 0 ? (
                  <p className="text-[10px] text-muted-foreground py-1 text-center">
                    No supplier balances
                  </p>
                ) : (
                  <div className="space-y-1">
                    {data.topSuppliers.map((s, idx) => (
                      <div
                        key={s.name || idx}
                        className="flex items-center justify-between text-[11px] gap-2"
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span
                            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px] font-bold ${
                              idx === 0
                                ? "bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300"
                                : idx === 1
                                ? "bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300"
                                : idx === 2
                                ? "bg-orange-100 text-orange-800 dark:bg-orange-950/70 dark:text-orange-300"
                                : "bg-muted text-muted-foreground dark:bg-zinc-800"
                            }`}
                          >
                            #{idx + 1}
                          </span>
                          <span
                            className="font-medium text-foreground truncate max-w-[190px] sm:max-w-[240px]"
                            title={s.name}
                          >
                            {s.name}
                          </span>
                        </div>
                        <span className="font-semibold text-foreground tabular-nums shrink-0 text-[11px]">
                          {phpFmt.format(s.balance)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Aging Maturity Summary */}
              <div className="rounded-lg border border-border/70 bg-card/50 p-2 dark:border-zinc-800 dark:bg-zinc-800/40">
                <div className="flex items-center justify-between pb-1 mb-1 border-b border-border/40 dark:border-zinc-800/60">
                  <div className="flex items-center gap-1.5">
                    <ClockAlert className="h-3 w-3 text-rose-600 dark:text-rose-400" />
                    <span className="text-[11px] font-semibold text-foreground">
                      Obligation Aging Breakdown
                    </span>
                  </div>
                  <span className="text-[9px] text-muted-foreground uppercase font-medium">
                    Balance (Count)
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                      <span className="text-muted-foreground">0–30 Days (Current)</span>
                    </div>
                    <span className="font-semibold text-foreground tabular-nums">
                      {phpFmt.format(data.agingBuckets.b0_30)}{" "}
                      <span className="text-[10px] font-normal text-muted-foreground">
                        ({data.agingCounts.b0_30})
                      </span>
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-amber-400 shrink-0" />
                      <span className="text-muted-foreground">31–60 Days (Aging)</span>
                    </div>
                    <span className="font-semibold text-foreground tabular-nums">
                      {phpFmt.format(data.agingBuckets.b31_60)}{" "}
                      <span className="text-[10px] font-normal text-muted-foreground">
                        ({data.agingCounts.b31_60})
                      </span>
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-orange-500 shrink-0" />
                      <span className="text-muted-foreground">61–90 Days (At Risk)</span>
                    </div>
                    <span className="font-semibold text-foreground tabular-nums">
                      {phpFmt.format(data.agingBuckets.b61_90)}{" "}
                      <span className="text-[10px] font-normal text-muted-foreground">
                        ({data.agingCounts.b61_90})
                      </span>
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-rose-600 shrink-0" />
                      <span className="font-medium text-rose-600 dark:text-rose-400">
                        91+ Days (Critical Priority)
                      </span>
                    </div>
                    <span className="font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                      {phpFmt.format(data.agingBuckets.b90Plus)}{" "}
                      <span className="text-[10px] font-normal text-muted-foreground">
                        ({data.agingCounts.b90Plus})
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
