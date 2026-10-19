"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  Building2,
  RefreshCw,
  ArrowUpRight,
  AlertCircle,
  CheckCircle2,
  Clock,
  CalendarDays,
  UserX,
  UserCheck,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Spinner } from "@/components/ui/spinner";
import { DashboardCardItem } from "../types";
import { DepartmentHeadSummaryData } from "@/app/api/bia/my-dashboard/metrics/department-head-summary/route";

interface DepartmentHeadSummaryCardProps {
  card: DashboardCardItem;
}

export default function DepartmentHeadSummaryCard({
  card,
}: DepartmentHeadSummaryCardProps) {
  const [data, setData] = useState<DepartmentHeadSummaryData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const hasMountCheckedRef = useRef(false);

  const fetchMetric = useCallback(async (force = false) => {
    setLoading(true);
    setError(null);
    try {
      const url = force
        ? "/api/bia/my-dashboard/metrics/department-head-summary?force=true"
        : "/api/bia/my-dashboard/metrics/department-head-summary";

      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || `HTTP ${res.status}`);
      }
      const json: DepartmentHeadSummaryData = await res.json();
      setData(json);
    } catch (err: unknown) {
      console.error("[DepartmentHeadSummaryCard] Fetch error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load department attendance data"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!hasMountCheckedRef.current) {
      hasMountCheckedRef.current = true;
      fetchMetric(false);
    }
  }, [fetchMetric]);

  const formatTodayDisplay = (dateStr?: string) => {
    if (!dateStr) return "Today";
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    }
    return dateStr;
  };

  return (
    <Card className="col-span-2 sm:col-span-3 md:col-span-3 lg:col-span-3 row-span-1 flex flex-col border border-border/80 bg-gradient-to-r from-card via-card to-muted/20 shadow-xs transition-all duration-300 hover:shadow-sm dark:border-zinc-800 dark:from-zinc-900/90 dark:via-zinc-900/70 dark:to-zinc-950/90 overflow-hidden py-0 gap-0 h-full justify-between">
      {/* Top Blue-Indigo-Emerald Accent Bar */}
      <div className="h-0.5 w-full bg-gradient-to-r from-blue-600 via-indigo-500 to-emerald-500 shrink-0" />

      {/* Header */}
      <div className="px-3 sm:px-3.5 py-2 border-b border-border/40 dark:border-zinc-800/60 flex flex-wrap items-center justify-between gap-1.5 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-blue-200/80 bg-blue-50/80 text-blue-600 shadow-2xs dark:border-blue-800/60 dark:bg-blue-950/60 dark:text-blue-400">
            <Building2 className="h-3.5 w-3.5" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs sm:text-sm font-bold tracking-tight text-foreground truncate">
                Departamental Report: {data?.departmentName || "..."}
              </span>
              <Badge
                variant="secondary"
                className="shrink-0 text-[9px] font-mono uppercase px-1 py-0 bg-muted text-muted-foreground dark:bg-zinc-800"
              >
                #{card.id}
              </Badge>
            </div>
            {data && (
              <p className="text-[11px] text-muted-foreground truncate">
                Head: <span className="font-medium text-foreground">{data.departmentHeadName}</span>
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchMetric(true)}
            disabled={loading}
            className="h-7 w-7 p-0 text-[10px] dark:border-zinc-700 dark:bg-zinc-800"
            title="Refresh attendance"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
          </Button>

          <Button
            size="sm"
            variant="default"
            asChild
            className="h-7 gap-1 px-2.5 text-[10px] font-medium shadow-2xs"
          >
            <Link href="/hr/attendance-monitoring">
              <span>Attendance</span>
              <ArrowUpRight className="h-2.5 w-2.5" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Main Content: 3 Sub-Cards */}
      <div className="p-3 sm:p-3.5 flex-1 flex flex-col justify-center">
        {loading && !data ? (
          <div className="flex items-center justify-center py-4 gap-2 text-muted-foreground my-auto">
            <Spinner className="h-4 w-4 text-blue-600" />
            <p className="text-xs">Loading department attendance & punctuality...</p>
          </div>
        ) : error && !data ? (
          <div className="flex items-center justify-between py-2 px-3 rounded-md border border-destructive/20 bg-destructive/10 text-destructive text-xs">
            <div className="flex items-center gap-1.5">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchMetric(true)}
              className="h-6 text-[10px] dark:border-zinc-700"
            >
              Retry
            </Button>
          </div>
        ) : data ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 flex-1">
            {/* 1. Today's Attendance Sub-Card */}
            <div className="rounded-xl border border-border/70 bg-card/70 dark:bg-zinc-900/70 p-2.5 sm:p-3 flex flex-col justify-between shadow-2xs hover:border-emerald-500/40 transition-colors">
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="font-semibold text-muted-foreground flex items-center gap-1.5 text-[11px] truncate">
                  <UserCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  Today&apos;s Attendance
                </span>
                <span className="font-bold text-foreground text-xs sm:text-sm font-mono shrink-0">
                  {data.attendanceRate}%
                </span>
              </div>

              <Progress value={data.attendanceRate} className="h-1.5 my-1.5 bg-muted dark:bg-zinc-800" />

              <div className="mt-1 flex items-center justify-between text-[10px] gap-1 flex-wrap">
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/40 font-medium">
                  <CheckCircle2 className="h-2.5 w-2.5 shrink-0" />
                  {data.presentCount} / {data.totalEmployees} Present
                </span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200/60 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/40 font-medium">
                  <UserX className="h-2.5 w-2.5 shrink-0" />
                  {data.absentCount} Absent
                </span>
              </div>
            </div>

            {/* 2. Punctuality Rate Sub-Card */}
            <div className="rounded-xl border border-border/70 bg-card/70 dark:bg-zinc-900/70 p-2.5 sm:p-3 flex flex-col justify-between shadow-2xs hover:border-blue-500/40 transition-colors">
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="font-semibold text-muted-foreground flex items-center gap-1.5 text-[11px] truncate">
                  <Clock className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                  Punctuality Rate
                </span>
                <span className="font-bold text-foreground text-xs sm:text-sm font-mono shrink-0">
                  {data.punctualityRate}%
                </span>
              </div>

              <Progress value={data.punctualityRate} className="h-1.5 my-1.5 bg-muted dark:bg-zinc-800" />

              <div className="mt-1 flex items-center justify-between text-[10px] gap-1 flex-wrap">
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200/60 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800/40 font-medium">
                  <Clock className="h-2.5 w-2.5 shrink-0" />
                  {data.onTimeCount} On Time
                </span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/40 font-medium">
                  <Clock className="h-2.5 w-2.5 shrink-0" />
                  {data.lateCount} Late
                </span>
              </div>
            </div>

            {/* 3. On Leave Today Sub-Card */}
            <div className="rounded-xl border border-border/70 bg-card/70 dark:bg-zinc-900/70 p-2.5 sm:p-3 flex flex-col justify-between shadow-2xs hover:border-purple-500/40 transition-colors">
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="font-semibold text-muted-foreground flex items-center gap-1.5 text-[11px] truncate">
                  <CalendarDays className="h-3.5 w-3.5 text-purple-500 shrink-0" />
                  On Leave Today
                </span>
                <span className="font-bold text-foreground text-xs sm:text-sm font-mono shrink-0">
                  {data.leaveCount}
                </span>
              </div>

              <div className="my-1.5 flex items-center justify-between text-[11px] text-muted-foreground">
                <span className="truncate">
                  {data.leaveCount === 1 ? "1 Employee" : `${data.leaveCount} Employees`}
                </span>
                <span className="font-mono text-[10px] text-muted-foreground/80 shrink-0">
                  {formatTodayDisplay(data.todayDate)}
                </span>
              </div>

              <div className="mt-1 flex items-center justify-between text-[10px] gap-1 flex-wrap">
                {data.leaveCount > 0 ? (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200/60 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-800/40 font-medium">
                    <CalendarDays className="h-2.5 w-2.5 shrink-0" />
                    Approved Leave
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground border border-border/60 font-medium">
                    No active leaves
                  </span>
                )}
                <span className="text-[10px] text-muted-foreground/90 font-mono">
                  Roster: {data.totalEmployees}
                </span>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </Card>
  );
}
