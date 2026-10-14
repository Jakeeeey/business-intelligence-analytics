"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  WalletCards,
  ArrowUpRight,
  Receipt,
  ClockAlert,
  AlertCircle,
  RefreshCw,
  Landmark,
  ShieldCheck,
  Users,
  UserCheck,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import type { DashboardCardItem } from "../types";

export interface AccountsReceivableMetricData {
  totalReceivable: number;
  outstandingBalance: number;
  unpostedCollections: number;
  realOutstanding: number;
  collectionRate: number;
  totalPaid: number;
  activeInvoicesCount: number;
  activeCustomersCount: number;
  overdueAmount: number;
  averageOverdueDays: number;
  overdueCount: number;
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
  topCustomers?: Array<{ name: string; code: string; outstanding: number }>;
  topSalesmen?: Array<{ name: string; code: string; id: number; outstanding: number }>;
}

const phpFmt = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const numFmt = new Intl.NumberFormat("en-US");

interface AccountsReceivableDetailedCardProps {
  card: DashboardCardItem;
}

const CACHE_KEY = "bia_ar_detailed_cache";

export default function AccountsReceivableDetailedCard({
  card,
}: AccountsReceivableDetailedCardProps) {
  const isCacheEnabled = card.cached !== false;
  const cacheTtlMs =
    typeof card.cached_time === "number" && card.cached_time > 0
      ? card.cached_time > 10000
        ? card.cached_time
        : card.cached_time * 1000
      : 360000;

  const [data, setData] = useState<AccountsReceivableMetricData | null>(null);
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
          ? "/api/bia/my-dashboard/metrics/accounts-receivable-detailed?force=true"
          : "/api/bia/my-dashboard/metrics/accounts-receivable-detailed";
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) {
          const errData = await res.json().catch(() => null);
          const errMessage =
            errData?.message || errData?.error || `HTTP ${res.status}`;
          throw new Error(errMessage);
        }
        const json: AccountsReceivableMetricData = await res.json();
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
        console.error("[AccountsReceivableDetailedCard] Fetch error:", err);
        const errMsg =
          err instanceof Error
            ? err.message
            : "Unable to load accounts receivable data";
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
        const raw = localStorage.getItem(CACHE_KEY) || sessionStorage.getItem(CACHE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed.timestamp && Date.now() - parsed.timestamp < cacheTtlMs) {
            setData(parsed.data as AccountsReceivableMetricData);
            setLoading(false);
            hasCachedData = true;
          } else if (!parsed.timestamp && typeof parsed.totalReceivable === "number") {
            setData(parsed as AccountsReceivableMetricData);
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

  return (
    <Card className="col-span-full flex flex-col border border-border/80 bg-gradient-to-br from-card via-card to-muted/20 shadow-xs transition-all duration-300 hover:shadow-sm dark:border-zinc-800 dark:from-zinc-900/90 dark:via-zinc-900/70 dark:to-zinc-950/90 overflow-hidden py-0 gap-0">
      {/* Top Emerald Accent Bar */}
      <div className="h-0.5 w-full bg-gradient-to-r from-emerald-500 via-teal-400 to-sky-500" />

      {/* Header - Compact without excess padding */}
      <div className="px-3.5 py-2 sm:px-4 sm:py-2 border-b border-border/40 dark:border-zinc-800/60 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-emerald-200/70 bg-emerald-50 text-emerald-600 dark:border-emerald-800/50 dark:bg-emerald-950/60 dark:text-emerald-400">
            <Landmark className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold tracking-tight text-foreground truncate">
                Accounts Receivable Detailed
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
                "Active portfolio exposure, in-transit remittances, and aging breakdown."}
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
            <a href="/fm/accounting/accounts-receivable">
              <span>Open AR Ledger</span>
              <ArrowUpRight className="h-3 w-3" />
            </a>
          </Button>
        </div>
      </div>

      {/* Content - Compact */}
      <div className="px-3.5 py-2.5 sm:px-4 sm:py-3">
        {loading ? (
          <div className="flex items-center justify-center py-6 gap-2 text-muted-foreground">
            <Spinner className="h-4 w-4 text-primary" />
            <p className="text-xs">Aggregating accounts receivable portfolio...</p>
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
            {/* 4 Core Metric Pillars in 1 Row */}
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {/* Pillar 1: Real Outstanding */}
              <div className="relative overflow-hidden rounded-lg border border-border/70 bg-card/70 p-2.5 shadow-2xs transition-colors hover:border-emerald-500/40 dark:border-zinc-800 dark:bg-zinc-800/40">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-[10px] font-semibold uppercase tracking-wider">
                    Real Outstanding
                  </span>
                  <span className="flex h-5 w-5 items-center justify-center rounded-md bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                    <WalletCards className="h-3 w-3" />
                  </span>
                </div>
                <div className="mt-1 text-base sm:text-lg font-bold tracking-tight text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {phpFmt.format(data.realOutstanding)}
                </div>
                <div className="mt-0.5 flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>Gross: {phpFmt.format(data.outstandingBalance)}</span>
                </div>
                <div className="mt-1.5 flex items-center justify-between pt-1 border-t border-border/40 dark:border-zinc-800/60 text-[10px]">
                  <span className="font-medium text-emerald-700 dark:text-emerald-300">
                    {numFmt.format(data.activeInvoicesCount)} invoices
                  </span>
                  <span className="text-muted-foreground">
                    {numFmt.format(data.activeCustomersCount)} accts
                  </span>
                </div>
              </div>

              {/* Pillar 2: Total Billed & Paid */}
              <div className="relative overflow-hidden rounded-lg border border-border/70 bg-card/70 p-2.5 shadow-2xs transition-colors hover:border-blue-500/40 dark:border-zinc-800 dark:bg-zinc-800/40">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-[10px] font-semibold uppercase tracking-wider">
                    Total Billed & Paid
                  </span>
                  <span className="flex h-5 w-5 items-center justify-center rounded-md bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                    <Receipt className="h-3 w-3" />
                  </span>
                </div>
                <div className="mt-1 text-base sm:text-lg font-bold tracking-tight text-foreground tabular-nums">
                  {phpFmt.format(data.totalReceivable)}
                </div>
                <div className="mt-0.5 flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>Paid: {phpFmt.format(data.totalPaid)}</span>
                  <span className="font-medium text-foreground">{data.collectionRate.toFixed(1)}%</span>
                </div>
                <div className="mt-1.5 pt-1 border-t border-border/40 dark:border-zinc-800/60">
                  <div className="h-1 w-full rounded-full bg-muted dark:bg-zinc-700 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-blue-500"
                      style={{ width: `${Math.min(100, Math.max(0, data.collectionRate))}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Pillar 3: In-Transit Collections */}
              <div className="relative overflow-hidden rounded-lg border border-border/70 bg-card/70 p-2.5 shadow-2xs transition-colors hover:border-violet-500/40 dark:border-zinc-800 dark:bg-zinc-800/40">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-[10px] font-semibold uppercase tracking-wider">
                    In-Transit Collections
                  </span>
                  <span className="flex h-5 w-5 items-center justify-center rounded-md bg-violet-50 text-violet-600 dark:bg-violet-950/60 dark:text-violet-400">
                    <ShieldCheck className="h-3 w-3" />
                  </span>
                </div>
                <div className="mt-1 text-base sm:text-lg font-bold tracking-tight text-violet-600 dark:text-violet-400 tabular-nums">
                  {phpFmt.format(data.unpostedCollections)}
                </div>
                <div className="mt-0.5 text-[10px] text-muted-foreground truncate">
                  Remittances awaiting GL posting
                </div>
                <div className="mt-1.5 flex items-center gap-1.5 pt-1 border-t border-border/40 dark:border-zinc-800/60 text-[10px] text-muted-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-violet-500 shrink-0" />
                  <span className="truncate">Secured cash flow pipeline</span>
                </div>
              </div>

              {/* Pillar 4: Aging & Overdue Risk */}
              <div className="relative overflow-hidden rounded-lg border border-border/70 bg-card/70 p-2.5 shadow-2xs transition-colors hover:border-rose-500/40 dark:border-zinc-800 dark:bg-zinc-800/40">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-[10px] font-semibold uppercase tracking-wider">
                    Overdue Exposure
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

            {/* Top 3 Customers & Top 3 Salesmen - Compact Dual Strip */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1 border-t border-border/40 dark:border-zinc-800/60">
              {/* Top 3 Customers */}
              <div className="rounded-lg border border-border/70 bg-card/50 p-2 dark:border-zinc-800 dark:bg-zinc-800/40">
                <div className="flex items-center justify-between pb-1 mb-1 border-b border-border/40 dark:border-zinc-800/60">
                  <div className="flex items-center gap-1.5">
                    <Users className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-[11px] font-semibold text-foreground">Top 3 Customers (Highest AR)</span>
                  </div>
                  <span className="text-[9px] text-muted-foreground uppercase font-medium">Balance</span>
                </div>
                {(!data.topCustomers || data.topCustomers.length === 0) ? (
                  <p className="text-[10px] text-muted-foreground py-1 text-center">No customer balances</p>
                ) : (
                  <div className="space-y-1">
                    {data.topCustomers.map((c, idx) => (
                      <div key={c.code || idx} className="flex items-center justify-between text-[11px] gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px] font-bold ${
                            idx === 0
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300"
                              : idx === 1
                              ? "bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300"
                              : "bg-orange-100 text-orange-800 dark:bg-orange-950/70 dark:text-orange-300"
                          }`}>
                            #{idx + 1}
                          </span>
                          <span className="font-medium text-foreground truncate max-w-[190px] sm:max-w-[240px]" title={c.name}>
                            {c.name}
                          </span>
                        </div>
                        <span className="font-semibold text-foreground tabular-nums shrink-0 text-[11px]">
                          {phpFmt.format(c.outstanding)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Top 3 Salesmen */}
              <div className="rounded-lg border border-border/70 bg-card/50 p-2 dark:border-zinc-800 dark:bg-zinc-800/40">
                <div className="flex items-center justify-between pb-1 mb-1 border-b border-border/40 dark:border-zinc-800/60">
                  <div className="flex items-center gap-1.5">
                    <UserCheck className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                    <span className="text-[11px] font-semibold text-foreground">Top 3 Sales Representatives</span>
                  </div>
                  <span className="text-[9px] text-muted-foreground uppercase font-medium">Exposure</span>
                </div>
                {(!data.topSalesmen || data.topSalesmen.length === 0) ? (
                  <p className="text-[10px] text-muted-foreground py-1 text-center">No salesman records</p>
                ) : (
                  <div className="space-y-1">
                    {data.topSalesmen.map((sm, idx) => (
                      <div key={sm.code || sm.id || idx} className="flex items-center justify-between text-[11px] gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px] font-bold ${
                            idx === 0
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300"
                              : idx === 1
                              ? "bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300"
                              : "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/70 dark:text-indigo-300"
                          }`}>
                            #{idx + 1}
                          </span>
                          <span className="font-medium text-foreground truncate max-w-[190px] sm:max-w-[240px]" title={sm.name}>
                            {sm.name}
                          </span>
                        </div>
                        <span className="font-semibold text-foreground tabular-nums shrink-0 text-[11px]">
                          {phpFmt.format(sm.outstanding)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
