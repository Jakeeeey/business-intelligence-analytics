"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  CalendarCheck2,
  AlertCircle,
  RefreshCw,
  Users,
  CheckCircle2,
  Clock,
  Building2,
  CalendarDays,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import type { DashboardCardItem } from "../types";

export interface DepartmentProgressItem {
  id: number;
  name: string;
  isCompleted: boolean;
  status: "POSTED" | "PENDING";
}

export interface CutoffProgressData {
  cutoffId: number | null;
  cutoffTitle: string;
  cutoffType: string | null;
  startDate: string | null;
  endDate: string | null;
  payoutDate: string | null;
  paidDayPlusOne: string | null;
  isWindowActive: boolean;
  totalDepartments: number;
  completedDepartments: number;
  percentage: number;
  statusCode: "COMPLETED" | "IN_PROGRESS" | "PENDING";
  statusLabel: string;
  totalGross: number;
  totalNet: number;
  totalHeadcount: number;
  departments: DepartmentProgressItem[];
}

const phpFmt = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const numFmt = new Intl.NumberFormat("en-US");

interface CompanyPayrollCutoffProgressCardProps {
  card: DashboardCardItem;
}

export default function CompanyPayrollCutoffProgressCard({
  card,
}: CompanyPayrollCutoffProgressCardProps) {
  const isCacheEnabled = card.cached !== false;
  const cacheTtlMs =
    typeof card.cached_time === "number" && card.cached_time > 0
      ? card.cached_time > 10000
        ? card.cached_time
        : card.cached_time * 1000
      : 180000;

  const [data, setData] = useState<CutoffProgressData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const hasMountCheckedRef = useRef(false);

  const CACHE_KEY = "bia_company_cutoff_progress_cache";

  const fetchMetric = useCallback(
    async (forceRefresh = false) => {
      if (forceRefresh || !data) {
        setLoading(true);
      }
      setError(null);
      try {
        const url = forceRefresh
          ? "/api/bia/my-dashboard/metrics/company-payroll-cutoff-progress?force=true"
          : "/api/bia/my-dashboard/metrics/company-payroll-cutoff-progress";

        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) {
          const errData = await res.json().catch(() => null);
          const errMessage =
            errData?.message || errData?.error || `HTTP ${res.status}`;
          throw new Error(errMessage);
        }
        const json: CutoffProgressData = await res.json();
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
        console.error("[CompanyPayrollCutoffProgressCard] Fetch error:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load cutoff progress data"
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

  // Format date display (e.g. Oct 11 - Oct 25)
  const formatPeriodDisplay = (startStr: string | null, endStr: string | null) => {
    if (!startStr && !endStr) return "Current Cycle";
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
      ? eDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
      : "";
    return sFmt && eFmt ? `${sFmt} – ${eFmt}` : startStr || endStr || "Current Cycle";
  };

  const formatPayoutDisplay = (payoutStr: string | null) => {
    if (!payoutStr) return "Not set";
    const parts = payoutStr.split("-");
    if (parts.length === 3) {
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    }
    return payoutStr;
  };

  const getStatusBadgeVariant = (code: string) => {
    if (code === "COMPLETED") {
      return "border-emerald-500/30 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-950/40 dark:text-emerald-400";
    }
    if (code === "IN_PROGRESS") {
      return "border-blue-500/30 bg-blue-50 text-blue-700 dark:border-blue-500/30 dark:bg-blue-950/40 dark:text-blue-400";
    }
    return "border-amber-500/30 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-400";
  };

  return (
    <Card className="col-span-2 row-span-2 flex flex-col border border-border/80 bg-gradient-to-br from-card via-card to-muted/20 shadow-xs transition-all duration-300 hover:shadow-sm dark:border-zinc-800 dark:from-zinc-900/90 dark:via-zinc-900/70 dark:to-zinc-950/90 overflow-hidden py-0 gap-0 h-full justify-between">
      {/* Top Emerald / Teal / Cyan Gradient Bar */}
      <div className="h-0.5 w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 shrink-0" />

      {/* Header */}
      <div className="px-3 py-2 border-b border-border/40 dark:border-zinc-800/60 flex flex-wrap items-center justify-between gap-1.5 shrink-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-emerald-200/70 bg-emerald-50 text-emerald-600 dark:border-emerald-800/50 dark:bg-emerald-950/60 dark:text-emerald-400">
            <CalendarCheck2 className="h-3 w-3" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs sm:text-sm font-semibold tracking-tight text-foreground truncate">
                Payroll Progress
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
            title="Refresh progress"
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
      <div className="p-2.5 sm:p-3 flex-1 flex flex-col justify-between overflow-hidden">
        {loading && !data ? (
          <div className="flex flex-1 items-center justify-center py-6 gap-2 text-muted-foreground my-auto">
            <Spinner className="h-4 w-4 text-emerald-600" />
            <p className="text-xs">Computing cutoff progress...</p>
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
              onClick={() => fetchMetric(true)}
              className="h-5 px-1.5 text-[9px] shrink-0 dark:border-destructive/40"
            >
              Retry
            </Button>
          </div>
        ) : !data ? null : (
          <div className="flex flex-col h-full justify-between gap-2">
            {/* Cutoff Window Info Bar */}
            <div className="flex items-center justify-between gap-1 text-[11px] pb-1.5 border-b border-border/40 dark:border-zinc-800/60">
              <div className="flex items-center gap-1 min-w-0">
                <CalendarDays className="h-3 w-3 text-muted-foreground shrink-0" />
                <span className="font-semibold text-foreground truncate">
                  {data.cutoffTitle}
                </span>
                <span className="text-[10px] text-muted-foreground truncate hidden sm:inline">
                  ({formatPeriodDisplay(data.startDate, data.endDate)})
                </span>
              </div>
              <Badge
                variant="outline"
                className={`shrink-0 text-[9px] px-1.5 py-0 font-medium ${getStatusBadgeVariant(
                  data.statusCode
                )}`}
              >
                {data.statusLabel}
              </Badge>
            </div>

            {/* Main Progress Indicator */}
            <div className="rounded-lg border border-border/70 bg-card/70 p-2 sm:p-2.5 shadow-2xs dark:border-zinc-800 dark:bg-zinc-800/40">
              <div className="flex items-baseline justify-between mb-1">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl sm:text-2xl font-bold tracking-tight text-foreground tabular-nums">
                    {data.percentage}%
                  </span>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                    Finalized
                  </span>
                </div>
                <span className="text-[11px] font-medium text-foreground">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                    {data.completedDepartments}
                  </span>
                  <span className="text-muted-foreground">
                    {" "}/ {data.totalDepartments} Depts
                  </span>
                </span>
              </div>

              {/* Progress Bar */}
              <div className="h-2 w-full rounded-full bg-muted dark:bg-zinc-700 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    data.percentage === 100
                      ? "bg-emerald-500 shadow-sm shadow-emerald-500/50"
                      : data.percentage > 0
                      ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                      : "bg-muted-foreground/30"
                  }`}
                  style={{ width: `${Math.min(100, Math.max(0, data.percentage))}%` }}
                />
              </div>

              {/* Mini details below bar */}
              <div className="mt-1.5 flex items-center justify-between text-[10px] text-muted-foreground">
                <span className="truncate">
                  Payout: {formatPayoutDisplay(data.payoutDate)}
                </span>
                {data.totalHeadcount > 0 && (
                  <span className="flex items-center gap-1 font-medium text-foreground">
                    <Users className="h-2.5 w-2.5 text-muted-foreground" />
                    {numFmt.format(data.totalHeadcount)} staff
                  </span>
                )}
              </div>
            </div>

            {/* Department Breakdown Mini List */}
            <div className="flex-1 min-h-[70px] max-h-[110px] overflow-y-auto rounded-lg border border-border/60 bg-muted/20 p-1.5 dark:border-zinc-800/60 dark:bg-zinc-900/30 space-y-1">
              <div className="flex items-center justify-between px-1 pb-0.5 text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">
                <span>Department Breakdown</span>
                <span>Status</span>
              </div>
              {data.departments.length === 0 ? (
                <div className="text-center py-2 text-[10px] text-muted-foreground">
                  No active departments found.
                </div>
              ) : (
                data.departments.map((dept) => (
                  <div
                    key={dept.id}
                    className="flex items-center justify-between gap-1 px-1.5 py-0.5 rounded text-[10px] bg-card/60 dark:bg-zinc-800/40 border border-border/40 dark:border-zinc-800/50"
                  >
                    <div className="flex items-center gap-1 min-w-0">
                      <Building2 className="h-2.5 w-2.5 text-muted-foreground shrink-0" />
                      <span className="truncate text-foreground font-medium">
                        {dept.name}
                      </span>
                    </div>
                    {dept.isCompleted ? (
                      <span className="inline-flex items-center gap-0.5 text-[9px] font-medium text-emerald-600 dark:text-emerald-400 shrink-0">
                        <CheckCircle2 className="h-2.5 w-2.5" />
                        <span>POSTED</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-0.5 text-[9px] font-medium text-amber-600 dark:text-amber-400 shrink-0">
                        <Clock className="h-2.5 w-2.5" />
                        <span>PENDING</span>
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Bottom Footer Info */}
            {data.totalNet > 0 && (
              <div className="flex items-center justify-between pt-1 border-t border-border/40 dark:border-zinc-800/60 text-[10px]">
                <span className="text-muted-foreground truncate">
                  Disbursed Net Volume
                </span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {phpFmt.format(data.totalNet)}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
