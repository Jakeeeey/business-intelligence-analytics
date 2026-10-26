"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  Clock,
  RefreshCw,
  ArrowUpRight,
  AlertCircle,
  UserCheck,
  UserX,
  Award,
  AlertTriangle,
  Calendar,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Spinner } from "@/components/ui/spinner";
import { DashboardCardItem } from "../types";
import {
  CompanyPunctualityDetailedData,
  EmployeePunctualityRankItem,
} from "@/app/api/bia/my-dashboard/metrics/company-punctuality-detailed/route";

interface CompanyPunctualityDetailedCardProps {
  card: DashboardCardItem;
}

export default function CompanyPunctualityDetailedCard({
  card,
}: CompanyPunctualityDetailedCardProps) {
  const [data, setData] = useState<CompanyPunctualityDetailedData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [viewPeriod, setViewPeriod] = useState<"month" | "today">("month");
  const hasMountCheckedRef = useRef(false);

  const fetchMetric = useCallback(async (force = false) => {
    setLoading(true);
    setError(null);
    try {
      const url = force
        ? "/api/bia/my-dashboard/metrics/company-punctuality-detailed?force=true"
        : "/api/bia/my-dashboard/metrics/company-punctuality-detailed";

      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || `HTTP ${res.status}`);
      }
      const json: CompanyPunctualityDetailedData = await res.json();
      setData(json);
    } catch (err: unknown) {
      console.error("[CompanyPunctualityDetailedCard] Fetch error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load punctuality details"
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

  const activeStats = data ? (viewPeriod === "month" ? data.month : data.today) : null;

  const renderRankList = (
    items: EmployeePunctualityRankItem[],
    type: "early" | "late"
  ) => {
    if (!items || items.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-5 text-center text-muted-foreground text-xs bg-muted/20 dark:bg-zinc-900/30 rounded-lg border border-border/40">
          <p className="font-medium">
            {type === "early"
              ? "No on-time check-ins recorded"
              : "No late check-ins recorded (100% on-time)"}
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-1.5">
        {items.map((emp, index) => {
          const rank = index + 1;
          const isEarly = type === "early";

          return (
            <div
              key={emp.userId}
              className={`flex items-center justify-between p-2 rounded-lg border transition-all duration-200 text-xs ${
                isEarly
                  ? "border-emerald-200/50 bg-emerald-50/40 dark:border-emerald-950/60 dark:bg-emerald-950/20 hover:border-emerald-400/60"
                  : "border-amber-200/50 bg-amber-50/40 dark:border-amber-950/60 dark:bg-amber-950/20 hover:border-amber-400/60"
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full font-mono text-[10px] font-bold ${
                    rank === 1
                      ? isEarly
                        ? "bg-emerald-600 text-white"
                        : "bg-amber-600 text-white"
                      : "bg-muted text-foreground"
                  }`}
                >
                  #{rank}
                </span>

                <div className="min-w-0">
                  <p className="font-semibold text-foreground truncate" title={emp.name}>
                    {emp.name}
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {emp.departmentName}
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0 pl-2">
                {viewPeriod === "month" ? (
                  <div>
                    <span
                      className={`font-mono font-bold text-xs ${
                        isEarly
                          ? "text-emerald-700 dark:text-emerald-400"
                          : "text-amber-700 dark:text-amber-400"
                      }`}
                    >
                      {isEarly ? `${emp.onTimeCount} Days` : `${emp.lateCount} Late`}
                    </span>
                    <p className="text-[9px] text-muted-foreground font-mono">
                      {emp.punctualityRate}% Rate
                    </p>
                  </div>
                ) : (
                  <div>
                    <span
                      className={`font-mono font-bold text-xs ${
                        isEarly
                          ? "text-emerald-700 dark:text-emerald-400"
                          : "text-amber-700 dark:text-amber-400"
                      }`}
                    >
                      {emp.timeIn || "--:--"}
                    </span>
                    <p className="text-[9px] text-muted-foreground">
                      {isEarly ? "Arrival" : "Late In"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Card className="col-span-2 sm:col-span-3 md:col-span-3 lg:col-span-3 row-span-2 flex flex-col border border-border/80 bg-gradient-to-br from-card via-card to-muted/20 shadow-xs transition-all duration-300 hover:shadow-sm dark:border-zinc-800 dark:from-zinc-900/90 dark:via-zinc-900/70 dark:to-zinc-950/90 overflow-hidden py-0 gap-0 h-full justify-between">
      {/* Top Blue-Indigo-Amber Accent Bar */}
      <div className="h-0.5 w-full bg-gradient-to-r from-blue-600 via-indigo-500 to-amber-500 shrink-0" />

      {/* Header */}
      <div className="px-3 sm:px-4 py-2 border-b border-border/40 dark:border-zinc-800/60 flex flex-wrap items-center justify-between gap-1.5 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-blue-200/80 bg-blue-50/80 text-blue-600 shadow-2xs dark:border-blue-800/60 dark:bg-blue-950/60 dark:text-blue-400">
            <Clock className="h-3.5 w-3.5" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs sm:text-sm font-bold tracking-tight text-foreground truncate">
                Company Punctuality Detailed
              </span>
              <Badge
                variant="secondary"
                className="shrink-0 text-[9px] font-mono uppercase px-1 py-0 bg-muted text-muted-foreground dark:bg-zinc-800"
              >
                #{card.id}
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground truncate">
              {viewPeriod === "month"
                ? data?.monthDisplay || "Month-to-Date"
                : `Today • ${data?.todayDate || "Current"}`}
            </p>
          </div>
        </div>

        {/* View Switcher & Action Buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="flex items-center bg-muted/60 dark:bg-zinc-800/80 p-0.5 rounded-lg border border-border/50 text-[10px] font-medium">
            <button
              type="button"
              onClick={() => setViewPeriod("month")}
              className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                viewPeriod === "month"
                  ? "bg-background text-foreground shadow-2xs font-bold dark:bg-zinc-700"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              This Month
            </button>
            <button
              type="button"
              onClick={() => setViewPeriod("today")}
              className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                viewPeriod === "today"
                  ? "bg-background text-foreground shadow-2xs font-bold dark:bg-zinc-700"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Today
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchMetric(true)}
            disabled={loading}
            className="h-7 w-7 p-0 text-[10px] dark:border-zinc-700 dark:bg-zinc-800"
            title="Refresh punctuality data"
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

      {/* Main Body */}
      <div className="p-3 sm:p-3.5 flex-1 flex flex-col justify-between overflow-hidden">
        {loading && !data ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2 text-muted-foreground my-auto">
            <Spinner className="h-5 w-5 text-blue-600" />
            <p className="text-xs">Analyzing company punctuality rankings...</p>
          </div>
        ) : error && !data ? (
          <div className="flex items-center justify-between py-2 px-3 rounded-md border border-destructive/20 bg-destructive/10 text-destructive text-xs my-auto">
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
        ) : data && activeStats ? (
          <div className="flex flex-col h-full justify-between gap-3 overflow-hidden">
            {/* Top Punctuality Metric Bar */}
            <div className="p-2.5 rounded-xl border border-border/70 bg-card/70 dark:bg-zinc-900/60 shadow-2xs">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-semibold text-muted-foreground flex items-center gap-1.5 text-[11px]">
                  <Clock className="h-3.5 w-3.5 text-blue-500" />
                  {viewPeriod === "month"
                    ? "Month-to-Date Punctuality Rate"
                    : "Today's Punctuality Rate"}
                </span>
                <span className="text-base sm:text-lg font-black text-foreground font-mono leading-none">
                  {activeStats.punctualityRate}%
                </span>
              </div>

              <Progress
                value={activeStats.punctualityRate}
                className="h-1.5 bg-muted dark:bg-zinc-800"
              />

              <div className="mt-1.5 flex items-center justify-between text-[10px] gap-1.5">
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200/60 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800/40 font-medium font-mono">
                  <UserCheck className="h-2.5 w-2.5" />
                  {activeStats.onTimeCount} On Time
                </span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/40 font-medium font-mono">
                  <UserX className="h-2.5 w-2.5" />
                  {activeStats.lateCount} Late
                </span>
              </div>
            </div>

            {/* Bottom Split Columns: Top 3 Early vs Top 3 Always Late */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 flex-1 overflow-y-auto">
              {/* Left Column: Top 3 Early */}
              <div className="flex flex-col justify-between">
                <div className="flex items-center justify-between mb-1.5 px-0.5">
                  <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                    <Award className="h-3.5 w-3.5" />
                    Top 3 Early / On-Time
                  </span>
                  <span className="text-[9px] text-muted-foreground uppercase font-semibold">
                    {viewPeriod === "month" ? "MTD Count" : "Earliest In"}
                  </span>
                </div>
                {renderRankList(activeStats.topEarly, "early")}
              </div>

              {/* Right Column: Top 3 Always Late */}
              <div className="flex flex-col justify-between">
                <div className="flex items-center justify-between mb-1.5 px-0.5">
                  <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Top 3 Always Late
                  </span>
                  <span className="text-[9px] text-muted-foreground uppercase font-semibold">
                    {viewPeriod === "month" ? "Late Count" : "Latest In"}
                  </span>
                </div>
                {renderRankList(activeStats.topLate, "late")}
              </div>
            </div>

            {/* Bottom Meta */}
            <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-border/40 dark:border-zinc-800/60 px-0.5">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Active Staff Roster: <strong className="font-mono text-foreground">{data.totalEmployees}</strong>
              </span>
              <span className="text-muted-foreground/80">
                Punctuality Analytics
              </span>
            </div>
          </div>
        ) : null}
      </div>
    </Card>
  );
}
