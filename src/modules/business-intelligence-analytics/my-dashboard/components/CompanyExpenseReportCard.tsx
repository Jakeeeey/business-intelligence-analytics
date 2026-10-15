"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Receipt,
  AlertCircle,
  RefreshCw,
  WalletCards,
  Landmark,
  Percent,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import type { DashboardCardItem } from "../types";

export interface CompanyExpenseMetricData {
  period: "this-month" | "this-year" | "all";
  totalDisbursementAmount: number;
  totalPaidAmount: number;
  outstandingBalance: number;
  settlementRate: number;
  taxWithholdingImpact: number;
  totalTransactions: number;
  totalLineItems: number;
  topCategories: Array<{
    title: string;
    amount: number;
    percentage: number;
  }>;
  topDivisions: Array<{
    name: string;
    amount: number;
    percentage: number;
  }>;
  topPayees: Array<{
    name: string;
    amount: number;
    percentage: number;
  }>;
}

const phpFmt = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const numFmt = new Intl.NumberFormat("en-US");

interface CompanyExpenseReportCardProps {
  card: DashboardCardItem;
}

type PeriodType = "this-month" | "this-year" | "all";

export default function CompanyExpenseReportCard({
  card,
}: CompanyExpenseReportCardProps) {
  const isCacheEnabled = card.cached !== false;
  const cacheTtlMs =
    typeof card.cached_time === "number" && card.cached_time > 0
      ? card.cached_time > 10000
        ? card.cached_time
        : card.cached_time * 1000
      : 360000;

  const [period, setPeriod] = useState<PeriodType>("this-month");
  const [data, setData] = useState<CompanyExpenseMetricData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const getCacheKey = useCallback(
    (p: PeriodType) => `bia_company_expense_cache_${p}`,
    []
  );

  const fetchMetric = useCallback(
    async (targetPeriod: PeriodType, forceRefresh = false) => {
      if (forceRefresh || !data || data.period !== targetPeriod) {
        setLoading(true);
      }
      setError(null);
      try {
        const url = forceRefresh
          ? `/api/bia/my-dashboard/metrics/company-expense-report?period=${targetPeriod}&force=true`
          : `/api/bia/my-dashboard/metrics/company-expense-report?period=${targetPeriod}`;

        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) {
          const errData = await res.json().catch(() => null);
          const errMessage =
            errData?.message || errData?.error || `HTTP ${res.status}`;
          throw new Error(errMessage);
        }
        const json: CompanyExpenseMetricData = await res.json();
        setData(json);

        if (isCacheEnabled && typeof window !== "undefined") {
          try {
            const entry = JSON.stringify({
              data: json,
              timestamp: Date.now(),
            });
            localStorage.setItem(getCacheKey(targetPeriod), entry);
            sessionStorage.setItem(getCacheKey(targetPeriod), entry);
          } catch {
            // ignore quota errors
          }
        }
      } catch (err) {
        console.error("[CompanyExpenseReportCard] Fetch error:", err);
        const errMsg =
          err instanceof Error
            ? err.message
            : "Unable to load company expense data";
        setError(errMsg);
      } finally {
        setLoading(false);
      }
    },
    [isCacheEnabled, data, getCacheKey]
  );

  const hasMountCheckedRef = useRef<Record<string, boolean>>({});

  useEffect(() => {
    if (hasMountCheckedRef.current[period]) return;
    hasMountCheckedRef.current[period] = true;

    let hasCachedData = false;
    if (isCacheEnabled && typeof window !== "undefined") {
      try {
        const cacheKey = getCacheKey(period);
        const raw =
          localStorage.getItem(cacheKey) || sessionStorage.getItem(cacheKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed.timestamp && Date.now() - parsed.timestamp < cacheTtlMs) {
            setData(parsed.data as CompanyExpenseMetricData);
            setLoading(false);
            hasCachedData = true;
          } else if (
            !parsed.timestamp &&
            typeof parsed.totalDisbursementAmount === "number"
          ) {
            setData(parsed as CompanyExpenseMetricData);
            setLoading(false);
            hasCachedData = true;
          }
        }
      } catch {
        // ignore cache parse issues
      }
    }

    if (!hasCachedData) {
      fetchMetric(period, false);
    }
  }, [period, fetchMetric, isCacheEnabled, cacheTtlMs, getCacheKey]);

  const handlePeriodChange = (newPeriod: PeriodType) => {
    if (newPeriod === period) return;
    setPeriod(newPeriod);
    hasMountCheckedRef.current[newPeriod] = false;
  };

  return (
    <Card className="col-span-2 row-span-2 flex flex-col border border-border/80 bg-gradient-to-br from-card via-card to-muted/20 shadow-xs transition-all duration-300 hover:shadow-sm dark:border-zinc-800 dark:from-zinc-900/90 dark:via-zinc-900/70 dark:to-zinc-950/90 overflow-hidden py-0 gap-0 h-full justify-between">
      {/* Top Rose / Violet / Indigo Gradient Bar */}
      <div className="h-0.5 w-full bg-gradient-to-r from-rose-500 via-violet-500 to-indigo-500 shrink-0" />

      {/* Header */}
      <div className="px-3 py-2 border-b border-border/40 dark:border-zinc-800/60 flex flex-wrap items-center justify-between gap-1.5 shrink-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-rose-200/70 bg-rose-50 text-rose-600 dark:border-rose-800/50 dark:bg-rose-950/60 dark:text-rose-400">
            <Receipt className="h-3 w-3" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs sm:text-sm font-semibold tracking-tight text-foreground truncate">
                Expense Report
              </span>
              <Badge
                variant="secondary"
                className="shrink-0 text-[9px] font-mono uppercase px-1 py-0 bg-muted text-muted-foreground dark:bg-zinc-800"
              >
                #{card.id}
              </Badge>
            </div>
          </div>
        </div>

        {/* Period Selector & Controls */}
        <div className="flex items-center gap-1 shrink-0 flex-wrap">
          {/* Period Toggle */}
          <div className="flex items-center rounded-md border border-border/60 bg-muted/40 p-0.5 dark:border-zinc-800 dark:bg-zinc-800/50">
            <button
              type="button"
              onClick={() => handlePeriodChange("this-month")}
              className={`rounded px-1.5 py-0.5 text-[9px] sm:text-[10px] font-medium transition-colors ${
                period === "this-month"
                  ? "bg-background text-foreground shadow-2xs dark:bg-zinc-700 dark:text-zinc-100"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Month
            </button>
            <button
              type="button"
              onClick={() => handlePeriodChange("this-year")}
              className={`rounded px-1.5 py-0.5 text-[9px] sm:text-[10px] font-medium transition-colors ${
                period === "this-year"
                  ? "bg-background text-foreground shadow-2xs dark:bg-zinc-700 dark:text-zinc-100"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              YTD
            </button>
            <button
              type="button"
              onClick={() => handlePeriodChange("all")}
              className={`rounded px-1.5 py-0.5 text-[9px] sm:text-[10px] font-medium transition-colors ${
                period === "all"
                  ? "bg-background text-foreground shadow-2xs dark:bg-zinc-700 dark:text-zinc-100"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              All
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchMetric(period, true)}
            disabled={loading}
            className="h-6 w-6 p-0 sm:w-auto sm:h-6 sm:px-1.5 text-[10px] dark:border-zinc-700 dark:bg-zinc-800"
            title="Refresh metrics"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden xl:inline ml-1">Refresh</span>
          </Button>

          <Button
            size="sm"
            variant="default"
            asChild
            className="h-6 gap-0.5 px-2 text-[10px] font-medium shadow-2xs"
          >
            <Link href="/bia/expense-report">
              <span>Report</span>
              <ArrowUpRight className="h-2.5 w-2.5" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-2 sm:p-2.5 flex-1 flex flex-col justify-center">
        {loading && !data ? (
          <div className="flex flex-1 items-center justify-center py-6 gap-2 text-muted-foreground my-auto">
            <Spinner className="h-4 w-4 text-primary" />
            <p className="text-xs">Aggregating records...</p>
          </div>
        ) : error && !data ? (
          <div className="flex items-center justify-between gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-2 text-xs text-destructive dark:border-destructive/40 my-auto">
            <div className="flex items-center gap-1.5 min-w-0">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate text-[11px]">{error}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchMetric(period, true)}
              className="h-5 px-1.5 text-[9px] shrink-0 dark:border-destructive/40"
            >
              Retry
            </Button>
          </div>
        ) : !data ? null : (
          <div className="grid grid-cols-2 gap-2 flex-1">
            {/* Pillar 1: Total Disbursement Amount */}
            <div className="relative flex flex-col justify-between overflow-hidden rounded-lg border border-border/70 bg-card/70 p-2 sm:p-2.5 shadow-2xs transition-colors hover:border-rose-500/40 dark:border-zinc-800 dark:bg-zinc-800/40">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-[10px] font-semibold uppercase tracking-wider">
                    Total Gross Expenses
                  </span>
                  <span className="flex h-5 w-5 items-center justify-center rounded-md bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
                    <Receipt className="h-3 w-3" />
                  </span>
                </div>
                <div className="mt-1 text-xs sm:text-sm md:text-base font-bold tracking-tight text-rose-600 dark:text-rose-400 tabular-nums">
                  {phpFmt.format(data.totalDisbursementAmount)}
                </div>
                <div className="mt-0.5 flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>Gross disbursement billings</span>
                </div>
                <div className="mt-1.5 flex items-center justify-between pt-1 border-t border-border/40 dark:border-zinc-800/60 text-[10px]">
                  <span className="font-medium text-rose-700 dark:text-rose-300">
                    {numFmt.format(data.totalTransactions)} vouchers
                  </span>
                  <span className="text-muted-foreground">
                    {numFmt.format(data.totalLineItems)} line items
                  </span>
                </div>
              </div>

              {/* Pillar 2: Total Paid Amount & Settlement Rate */}
              <div className="relative flex flex-col justify-between overflow-hidden rounded-lg border border-border/70 bg-card/70 p-2 sm:p-2.5 shadow-2xs transition-colors hover:border-indigo-500/40 dark:border-zinc-800 dark:bg-zinc-800/40">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-[10px] font-semibold uppercase tracking-wider">
                    Disbursed & Paid
                  </span>
                  <span className="flex h-5 w-5 items-center justify-center rounded-md bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
                    <WalletCards className="h-3 w-3" />
                  </span>
                </div>
                <div className="mt-1 text-xs sm:text-sm md:text-base font-bold tracking-tight text-foreground tabular-nums">
                  {phpFmt.format(data.totalPaidAmount)}
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

              {/* Pillar 3: Outstanding Unsettled Payables */}
              <div className="relative flex flex-col justify-between overflow-hidden rounded-lg border border-border/70 bg-card/70 p-2 sm:p-2.5 shadow-2xs transition-colors hover:border-amber-500/40 dark:border-zinc-800 dark:bg-zinc-800/40">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-[10px] font-semibold uppercase tracking-wider">
                    Unsettled Payables
                  </span>
                  <span className="flex h-5 w-5 items-center justify-center rounded-md bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
                    <Landmark className="h-3 w-3" />
                  </span>
                </div>
                <div className="mt-1 text-xs sm:text-sm md:text-base font-bold tracking-tight text-amber-600 dark:text-amber-400 tabular-nums">
                  {phpFmt.format(data.outstandingBalance)}
                </div>
                <div className="mt-0.5 text-[10px] text-muted-foreground truncate">
                  Unpaid expense obligations
                </div>
                <div className="mt-1.5 flex items-center gap-1.5 pt-1 border-t border-border/40 dark:border-zinc-800/60 text-[10px] text-muted-foreground">
                  <span
                    className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                      data.outstandingBalance > 0
                        ? "bg-amber-500"
                        : "bg-emerald-500"
                    }`}
                  />
                  <span className="truncate">
                    {data.outstandingBalance > 0
                      ? "Pending disbursement release"
                      : "All vouchers settled"}
                  </span>
                </div>
              </div>

              {/* Pillar 4: Tax Withholding Impact */}
              <div className="relative flex flex-col justify-between overflow-hidden rounded-lg border border-border/70 bg-card/70 p-2 sm:p-2.5 shadow-2xs transition-colors hover:border-emerald-500/40 dark:border-zinc-800 dark:bg-zinc-800/40">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-[10px] font-semibold uppercase tracking-wider">
                    Withholding Tax (EWT)
                  </span>
                  <span className="flex h-5 w-5 items-center justify-center rounded-md bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                    <Percent className="h-3 w-3" />
                  </span>
                </div>
                <div className="mt-1 text-xs sm:text-sm md:text-base font-bold tracking-tight text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {phpFmt.format(data.taxWithholdingImpact)}
                </div>
                <div className="mt-0.5 text-[10px] text-muted-foreground truncate">
                  Withholding tax deducted
                </div>
                <div className="mt-1.5 flex items-center justify-between pt-1 border-t border-border/40 dark:border-zinc-800/60 text-[10px]">
                  <span className="text-emerald-700 dark:text-emerald-300 font-medium">
                    Tax Compliance Impact
                  </span>
                  <span className="text-muted-foreground">
                    {data.totalDisbursementAmount > 0
                      ? (
                          (data.taxWithholdingImpact /
                            data.totalDisbursementAmount) *
                          100
                        ).toFixed(1)
                      : "0.0"}
                    % of total
                  </span>
                </div>
              </div>
            </div>
        )}
      </div>
    </Card>
  );
}
