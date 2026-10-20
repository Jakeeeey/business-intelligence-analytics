"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Users,
  RefreshCw,
  ArrowUpRight,
  AlertCircle,
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { DashboardCardItem } from "../types";
import { CompanyAttendanceReportData } from "@/app/api/bia/my-dashboard/metrics/company-attendance-report/route";

interface CompanyAttendanceReportCardProps {
  card: DashboardCardItem;
}

export default function CompanyAttendanceReportCard({
  card,
}: CompanyAttendanceReportCardProps) {
  const [data, setData] = useState<CompanyAttendanceReportData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const hasMountCheckedRef = useRef(false);

  const fetchMetric = useCallback(async (force = false) => {
    setLoading(true);
    setError(null);
    try {
      const url = force
        ? "/api/bia/my-dashboard/metrics/company-attendance-report?force=true"
        : "/api/bia/my-dashboard/metrics/company-attendance-report";

      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || `HTTP ${res.status}`);
      }
      const json: CompanyAttendanceReportData = await res.json();
      setData(json);
    } catch (err: unknown) {
      console.error("[CompanyAttendanceReportCard] Fetch error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load attendance"
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

  return (
    <a
      href="/hr/attendance-monitoring"
      className="block w-full aspect-square no-underline text-inherit focus:outline-none select-none"
    >
      <Card className="flex flex-col border border-border/80 bg-gradient-to-br from-card via-card to-muted/20 shadow-xs hover:shadow-md hover:border-emerald-500/60 transition-all duration-300 overflow-hidden py-0 gap-0 dark:border-zinc-800 w-full h-full aspect-square justify-between cursor-pointer group">
        {/* Top Emerald-Teal Accent Bar */}
        <div className="h-0.5 w-full bg-gradient-to-r from-emerald-500 via-teal-400 to-indigo-500 shrink-0" />

        {/* Compact Header matching Sales Order cards */}
        <div className="px-3 py-2 border-b border-border/40 dark:border-zinc-800/60 flex items-center justify-between gap-1.5 shrink-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
              <Users className="h-3 w-3" />
            </div>
            <span className="text-[11px] font-semibold text-foreground truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              Attendance
            </span>
          </div>

          <Badge
            variant="outline"
            className="shrink-0 gap-0.5 border-emerald-500/30 bg-emerald-50/80 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-950/40 dark:text-emerald-300 text-[9px] px-1 py-0 font-medium"
          >
            <span>Today</span>
            <ArrowUpRight className="h-2.5 w-2.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Badge>
        </div>

        {/* Square Center Donut Chart & Hero Metrics */}
        <div className="px-2 py-1 flex-1 flex flex-col items-center justify-center min-h-0 relative">
          {loading && !data ? (
            <div className="flex flex-col items-center gap-1 text-muted-foreground my-auto">
              <Spinner className="h-4 w-4 text-emerald-500" />
              <span className="text-[10px]">Loading...</span>
            </div>
          ) : error && !data ? (
            <div className="flex flex-col items-center gap-1 p-1.5 rounded-md border border-destructive/20 bg-destructive/10 text-destructive text-[10px] w-full my-auto">
              <div className="flex items-center gap-1 max-w-full">
                <AlertCircle className="h-3 w-3 shrink-0" />
                <span className="truncate">{error}</span>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  fetchMetric(true);
                }}
                className="text-[9px] underline hover:no-underline font-semibold cursor-pointer"
              >
                Retry
              </button>
            </div>
          ) : data ? (
            (() => {
              const isZeroData = !data.chartData || data.chartData.every((d) => d.value === 0);
              const displayChartData = isZeroData
                ? [{ name: "No Activity", value: 1, color: "hsl(var(--muted))" }]
                : data.chartData;

              return (
                <div className="flex flex-col items-center justify-center w-full h-full">
                  {/* Donut Graph with Centered Large Rate */}
                  <div className="relative w-full h-[88px] sm:h-[96px] flex items-center justify-center shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                        {!isZeroData && (
                          <Tooltip
                            content={({ active, payload }) => {
                              if (!active || !payload || !payload.length) return null;
                              const item = payload[0];
                              const payloadData = item.payload as { name: string; value: number; percentage: number };
                              return (
                                <div className="rounded border border-border/80 bg-background/95 px-2 py-1 shadow-md text-[10px] dark:border-zinc-800">
                                  <span className="font-semibold text-foreground flex items-center gap-1">
                                    <span
                                      className="h-1.5 w-1.5 rounded-full inline-block"
                                      style={{ backgroundColor: item.color }}
                                    />
                                    {payloadData.name}: {payloadData.value} ({payloadData.percentage}%)
                                  </span>
                                </div>
                              );
                            }}
                          />
                        )}
                        <Pie
                          data={displayChartData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={33}
                          outerRadius={45}
                          paddingAngle={!isZeroData && data.totalEmployees > 0 ? 3 : 0}
                          stroke="none"
                        >
                          {displayChartData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={isZeroData ? undefined : entry.color}
                              className={isZeroData ? "fill-muted/70 dark:fill-zinc-800" : undefined}
                            />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>

                    {/* Donut Center Large Label */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-xl sm:text-2xl font-black tracking-tight text-foreground font-mono leading-none group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {data.attendanceRate}%
                      </span>
                      <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-wider mt-0.5">
                        Present
                      </span>
                    </div>
                  </div>

                  {/* Present / Absent Sub-counts */}
                  <div className="flex items-center justify-center gap-2 sm:gap-2.5 text-[9px] sm:text-[10px] font-mono mt-0.5 shrink-0 flex-wrap px-1">
                    <span className="text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-0.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                      {data.presentCount} <span className="text-[8px] font-normal text-muted-foreground">Pres</span>
                    </span>
                    <span className="text-rose-700 dark:text-rose-400 font-bold flex items-center gap-0.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0" />
                      {data.absentCount} <span className="text-[8px] font-normal text-muted-foreground">Abs</span>
                    </span>
                    {data.leaveCount > 0 && (
                      <span className="text-purple-700 dark:text-purple-400 font-bold flex items-center gap-0.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-purple-500 shrink-0" />
                        {data.leaveCount} <span className="text-[8px] font-normal text-muted-foreground">Leave</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })()
          ) : null}
        </div>

        {/* Compact Footer matching Sales Order cards */}
        <div className="px-2.5 py-1.5 border-t border-border/40 dark:border-zinc-800/60 flex items-center justify-between text-[9px] text-muted-foreground bg-muted/20 dark:bg-zinc-900/30 shrink-0">
          <span className="font-mono text-muted-foreground/80 truncate">
            #{card.id}
          </span>
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-[9px]">
              Roster: {data?.totalEmployees ?? 0}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                fetchMetric(true);
              }}
              className="text-muted-foreground hover:text-foreground transition-colors p-0.5"
              title="Refresh attendance"
            >
              <RefreshCw className={`h-2.5 w-2.5 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      </Card>
    </a>
  );
}
