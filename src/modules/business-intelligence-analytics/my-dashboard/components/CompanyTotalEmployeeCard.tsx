"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Users,
  RefreshCw,
  ArrowUpRight,
  AlertCircle,
  Building2,
  UserPlus,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { DashboardCardItem } from "../types";
import { CompanyTotalEmployeeData } from "@/app/api/bia/my-dashboard/metrics/company-total-employee/route";

interface CompanyTotalEmployeeCardProps {
  card: DashboardCardItem;
}

export default function CompanyTotalEmployeeCard({
  card,
}: CompanyTotalEmployeeCardProps) {
  const [data, setData] = useState<CompanyTotalEmployeeData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const hasMountCheckedRef = useRef(false);

  const fetchMetric = useCallback(async (force = false) => {
    setLoading(true);
    setError(null);
    try {
      const url = force
        ? "/api/bia/my-dashboard/metrics/company-total-employee?force=true"
        : "/api/bia/my-dashboard/metrics/company-total-employee";

      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || `HTTP ${res.status}`);
      }
      const json: CompanyTotalEmployeeData = await res.json();
      setData(json);
    } catch (err: unknown) {
      console.error("[CompanyTotalEmployeeCard] Fetch error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load employee count"
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
      href="/hr/dashboard"
      className="block w-full aspect-square no-underline text-inherit focus:outline-none select-none"
    >
      <Card className="flex flex-col border border-border/80 bg-gradient-to-br from-card via-card to-muted/20 shadow-xs hover:shadow-md hover:border-indigo-500/60 transition-all duration-300 overflow-hidden py-0 gap-0 dark:border-zinc-800 w-full h-full aspect-square justify-between cursor-pointer group">
        {/* Top Indigo-Purple-Pink Accent Bar */}
        <div className="h-0.5 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shrink-0" />

        {/* Compact Header */}
        <div className="px-3 py-2 border-b border-border/40 dark:border-zinc-800/60 flex items-center justify-between gap-1.5 shrink-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
              <Users className="h-3 w-3" />
            </div>
            <span className="text-[11px] font-semibold text-foreground truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              Total Employees
            </span>
          </div>

          <Badge
            variant="outline"
            className="shrink-0 gap-0.5 border-indigo-500/30 bg-indigo-50/80 text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-950/40 dark:text-indigo-300 text-[9px] px-1 py-0 font-medium"
          >
            <span>Company</span>
            <ArrowUpRight className="h-2.5 w-2.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Badge>
        </div>

        {/* Square Center Hero Count */}
        <div className="px-3 py-2 flex-1 flex flex-col justify-center items-center text-center">
          {loading && !data ? (
            <div className="flex flex-col items-center gap-1.5 text-muted-foreground">
              <Spinner className="h-4 w-4 text-indigo-500" />
              <span className="text-[10px]">Loading roster...</span>
            </div>
          ) : error && !data ? (
            <div className="flex flex-col items-center gap-1 p-1.5 rounded-md border border-destructive/20 bg-destructive/10 text-destructive text-[10px] w-full">
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
          ) : (
            <div className="flex flex-col items-center justify-center w-full">
              {/* Primary Count Hero */}
              <div className="flex flex-col items-center">
                <div className="text-3xl sm:text-4xl font-black tracking-tight text-foreground font-mono leading-none tabular-nums group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {data?.totalActive ?? 0}
                </div>
                <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider mt-1">
                  Active Staff
                </span>
              </div>

              <div className="w-14 my-1.5 border-t border-border/60 dark:border-zinc-800" />

              {/* Sub-Metric Summary */}
              <div className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground font-mono">
                <span className="flex items-center gap-1" title={`${data?.totalDepartments ?? 0} active departments`}>
                  <Building2 className="h-2.5 w-2.5 text-indigo-500" />
                  <strong className="text-foreground">{data?.totalDepartments ?? 0}</strong> Depts
                </span>
                {data && data.newHiresThisMonth > 0 && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold" title="New hires this month">
                      <UserPlus className="h-2.5 w-2.5" />
                      +{data.newHiresThisMonth} New
                    </span>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Compact Footer */}
        <div className="px-2.5 py-1.5 border-t border-border/40 dark:border-zinc-800/60 flex items-center justify-between text-[9px] text-muted-foreground bg-muted/20 dark:bg-zinc-900/30 shrink-0">
          <span className="font-mono text-muted-foreground/80 truncate">
            #{card.id}
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-[8px] font-mono text-muted-foreground/80">
              Workforce
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                fetchMetric(true);
              }}
              className="text-muted-foreground hover:text-foreground transition-colors p-0.5"
              title="Refresh employee count"
            >
              <RefreshCw className={`h-2.5 w-2.5 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      </Card>
    </a>
  );
}
