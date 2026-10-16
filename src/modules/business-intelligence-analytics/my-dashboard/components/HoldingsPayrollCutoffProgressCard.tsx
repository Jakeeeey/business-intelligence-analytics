"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  Building2,
  RefreshCw,
  ArrowUpRight,
  AlertCircle,
  Users,
  Wallet,
  CheckCircle2,
  Clock,
  WifiOff,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Spinner } from "@/components/ui/spinner";
import { DashboardCardItem } from "../types";
import { HoldingsPayrollProgressData, CompanyPayrollStatusItem } from "@/app/api/bia/my-dashboard/metrics/holdings-payroll-cutoff-progress/route";

const pesoFmt = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const numFmt = new Intl.NumberFormat("en-US");

interface HoldingsPayrollCutoffProgressCardProps {
  card: DashboardCardItem;
}

export default function HoldingsPayrollCutoffProgressCard({
  card,
}: HoldingsPayrollCutoffProgressCardProps) {
  const isCacheEnabled = card.cached !== false;
  const cacheTtlMs =
    typeof card.cached_time === "number" && card.cached_time > 0
      ? card.cached_time > 10000
        ? card.cached_time
        : card.cached_time * 1000
      : 180000;

  const [data, setData] = useState<HoldingsPayrollProgressData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const hasMountCheckedRef = useRef(false);

  const CACHE_KEY = "bia_holdings_cutoff_progress_cache";

  const fetchMetric = useCallback(
    async (forceRefresh = false) => {
      if (forceRefresh || !data) {
        setLoading(true);
      }
      setError(null);
      try {
        const url = forceRefresh
          ? "/api/bia/my-dashboard/metrics/holdings-payroll-cutoff-progress?force=true"
          : "/api/bia/my-dashboard/metrics/holdings-payroll-cutoff-progress";

        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) {
          const errData = await res.json().catch(() => null);
          const errMessage =
            errData?.message || errData?.error || `HTTP ${res.status}`;
          throw new Error(errMessage);
        }
        const json: HoldingsPayrollProgressData = await res.json();
        setData(json);

        if (isCacheEnabled && typeof window !== "undefined") {
          try {
            sessionStorage.setItem(
              CACHE_KEY,
              JSON.stringify({ data: json, timestamp: Date.now() })
            );
          } catch {
            // ignore sessionStorage quota errors
          }
        }
      } catch (err: unknown) {
        console.error("[HoldingsPayrollCutoffProgressCard] Fetch error:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load holdings payroll progress data"
        );
      } finally {
        setLoading(false);
      }
    },
    [isCacheEnabled, data]
  );

  useEffect(() => {
    if (hasMountCheckedRef.current) return;
    hasMountCheckedRef.current = true;

    if (isCacheEnabled && typeof window !== "undefined") {
      try {
        const raw = sessionStorage.getItem(CACHE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (
            parsed?.data &&
            typeof parsed.timestamp === "number" &&
            Date.now() - parsed.timestamp < cacheTtlMs
          ) {
            setData(parsed.data);
            setLoading(false);
            return;
          }
        }
      } catch {
        // ignore parse issue
      }
    }

    fetchMetric(false);
  }, [fetchMetric, isCacheEnabled, cacheTtlMs]);

  const formatPeriodDisplay = (startStr: string | null, endStr: string | null) => {
    if (!startStr && !endStr) return "No cutoff";
    const parse = (s: string) => {
      const parts = s.split("-");
      return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    };
    const sDate = startStr ? parse(startStr) : null;
    const eDate = endStr ? parse(endStr) : null;
    const sFmt = sDate
      ? sDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })
      : "";
    const eFmt = eDate
      ? eDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })
      : "";
    return sFmt && eFmt ? `${sFmt} – ${eFmt}` : startStr || endStr || "Active";
  };

  const getStatusBadge = (company: CompanyPayrollStatusItem) => {
    if (!company.isReachable || company.statusCode === "OFFLINE") {
      return (
        <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium border border-rose-500/30 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-950/40 dark:text-rose-400">
          <WifiOff className="h-2.5 w-2.5" />
          Offline
        </span>
      );
    }
    if (company.statusCode === "COMPLETED") {
      return (
        <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium border border-emerald-500/30 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-950/40 dark:text-emerald-400">
          <CheckCircle2 className="h-2.5 w-2.5" />
          Completed
        </span>
      );
    }
    if (company.statusCode === "IN_PROGRESS") {
      return (
        <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium border border-blue-500/30 bg-blue-50 text-blue-700 dark:border-blue-500/30 dark:bg-blue-950/40 dark:text-blue-400">
          <Clock className="h-2.5 w-2.5" />
          In Progress
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium border border-amber-500/30 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-400">
        Pending
      </span>
    );
  };

  return (
    <Card className="col-span-2 row-span-2 flex flex-col border border-border/80 bg-gradient-to-br from-card via-card to-muted/20 shadow-xs transition-all duration-300 hover:shadow-sm dark:border-zinc-800 dark:from-zinc-900/90 dark:via-zinc-900/70 dark:to-zinc-950/90 overflow-hidden py-0 gap-0 h-full justify-between">
      {/* Top Indigo / Violet / Emerald Gradient Bar */}
      <div className="h-0.5 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500 shrink-0" />

      {/* Header */}
      <div className="px-3 py-2 border-b border-border/40 dark:border-zinc-800/60 flex flex-wrap items-center justify-between gap-1.5 shrink-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-indigo-200/70 bg-indigo-50 text-indigo-600 dark:border-indigo-800/50 dark:bg-indigo-950/60 dark:text-indigo-400">
            <Building2 className="h-3 w-3" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs sm:text-sm font-semibold tracking-tight text-foreground truncate">
                Holdings Payroll Progress
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

        {/* Controls */}
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchMetric(true)}
            disabled={loading}
            className="h-6 w-6 p-0 sm:w-auto sm:h-6 sm:px-1.5 text-[10px] dark:border-zinc-700 dark:bg-zinc-800"
            title="Refresh holdings progress"
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
            <Link href="/payroll-approvals">
              <span>Payroll</span>
              <ArrowUpRight className="h-2.5 w-2.5" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-2.5 sm:p-3 flex-1 flex flex-col justify-between overflow-hidden gap-2">
        {loading && !data ? (
          <div className="flex flex-1 items-center justify-center py-6 gap-2 text-muted-foreground my-auto">
            <Spinner className="h-4 w-4 text-indigo-600" />
            <p className="text-xs">Loading holdings progress...</p>
          </div>
        ) : error && !data ? (
          <div className="flex flex-1 flex-col items-center justify-center py-6 gap-2 text-center my-auto">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <p className="text-xs text-muted-foreground px-2">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchMetric(true)}
              className="mt-1 h-6 text-[10px] dark:border-zinc-700"
            >
              Retry
            </Button>
          </div>
        ) : data ? (
          <>
            {/* Top Aggregation Summary */}
            <div className="rounded-lg border border-border/60 bg-muted/20 p-2 dark:border-zinc-800/80 dark:bg-zinc-950/40 shrink-0">
              <div className="flex items-center justify-between text-xs mb-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="font-medium text-foreground">Group Completion</span>
                  {data.groupStartDate && data.groupEndDate && (
                    <span className="text-[10px] text-muted-foreground truncate font-mono">
                      ({formatPeriodDisplay(data.groupStartDate, data.groupEndDate)})
                    </span>
                  )}
                </div>
                <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                  {data.overallPercentage}%
                </span>
              </div>
              <Progress value={data.overallPercentage} className="h-1.5 bg-muted dark:bg-zinc-800" />

              <div className="grid grid-cols-3 gap-1.5 pt-2 mt-1 border-t border-border/40 dark:border-zinc-800/60 text-center">
                <div className="flex flex-col items-center">
                  <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                    <Building2 className="h-2.5 w-2.5" />
                    Companies
                  </span>
                  <span className="text-xs font-semibold text-foreground">
                    {data.completedCompanies}/{data.totalCompanies} Done
                  </span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                    <Wallet className="h-2.5 w-2.5" />
                    Group Net
                  </span>
                  <span className="text-xs font-semibold text-foreground truncate max-w-full">
                    {pesoFmt.format(data.totalGroupNet)}
                  </span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                    <Users className="h-2.5 w-2.5" />
                    Headcount
                  </span>
                  <span className="text-xs font-semibold text-foreground">
                    {numFmt.format(data.totalGroupHeadcount)}
                  </span>
                </div>
              </div>
            </div>

            {/* Scrollable Company List */}
            <div className="flex-1 overflow-y-auto min-h-0 space-y-1.5 pr-0.5 max-h-[175px]">
              {data.companies.map((comp) => (
                <div
                  key={comp.companyId}
                  className="rounded-md border border-border/50 bg-background/60 p-2 transition-colors hover:bg-muted/30 dark:border-zinc-800/60 dark:bg-zinc-900/50"
                >
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="rounded bg-muted px-1 py-0.5 text-[9px] font-bold font-mono text-muted-foreground dark:bg-zinc-800">
                        {comp.companyCode}
                      </span>
                      <span className="text-xs font-medium text-foreground truncate" title={comp.companyName}>
                        {comp.companyName}
                      </span>
                    </div>
                    {getStatusBadge(comp)}
                  </div>

                  <div className="mt-1.5 flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>{formatPeriodDisplay(comp.startDate, comp.endDate)}</span>
                    <span>
                      {comp.completedDepartments}/{comp.totalDepartments} depts ({comp.percentage}%)
                    </span>
                  </div>

                  <div className="mt-1">
                    <Progress
                      value={comp.percentage}
                      className="h-1 bg-muted dark:bg-zinc-800"
                    />
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : null}
      </div>
    </Card>
  );
}
