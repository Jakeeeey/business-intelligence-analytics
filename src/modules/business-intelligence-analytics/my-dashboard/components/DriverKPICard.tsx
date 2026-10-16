"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  Truck,
  RefreshCw,
  ArrowUpRight,
  AlertCircle,
  Clock,
  CheckCircle2,
  DollarSign,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Spinner } from "@/components/ui/spinner";
import { DashboardCardItem } from "../types";
import { DriverKPICardData } from "@/app/api/bia/my-dashboard/metrics/driver-kpi/route";

const pesoFmt = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

interface DriverKPICardProps {
  card: DashboardCardItem;
}

export default function DriverKPICard({ card }: DriverKPICardProps) {
  const isCacheEnabled = card.cached !== false;

  const now = new Date();
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const [selectedMonth, setSelectedMonth] = useState<string>(defaultMonth);
  const [data, setData] = useState<DriverKPICardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const hasMountCheckedRef = useRef(false);

  const CACHE_KEY = `bia_driver_kpi_cache_${selectedMonth}`;

  const fetchMetric = useCallback(
    async (targetMonth = selectedMonth) => {
      setLoading(true);
      setError(null);
      try {
        const url = `/api/bia/my-dashboard/metrics/driver-kpi?month=${encodeURIComponent(targetMonth)}`;
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) {
          const errData = await res.json().catch(() => null);
          const errMessage =
            errData?.message || errData?.error || `HTTP ${res.status}`;
          throw new Error(errMessage);
        }
        const json: DriverKPICardData = await res.json();
        setData(json);

        if (isCacheEnabled && typeof window !== "undefined") {
          try {
            sessionStorage.setItem(
              `bia_driver_kpi_cache_${targetMonth}`,
              JSON.stringify({ data: json, timestamp: Date.now() })
            );
          } catch {
            // ignore sessionStorage quota
          }
        }
      } catch (err: unknown) {
        console.error("[DriverKPICard] Fetch error:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load driver KPI data"
        );
      } finally {
        setLoading(false);
      }
    },
    [isCacheEnabled, selectedMonth]
  );

  useEffect(() => {
    if (!hasMountCheckedRef.current) {
      hasMountCheckedRef.current = true;
      if (isCacheEnabled && typeof window !== "undefined") {
        try {
          const raw = sessionStorage.getItem(CACHE_KEY);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed?.data && Date.now() - parsed.timestamp < 180000) {
              setData(parsed.data);
              setLoading(false);
              return;
            }
          }
        } catch {
          // ignore cache error
        }
      }
    }
    fetchMetric(selectedMonth);
  }, [fetchMetric, isCacheEnabled, selectedMonth, CACHE_KEY]);

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMonth = e.target.value;
    setSelectedMonth(newMonth);
    fetchMetric(newMonth);
  };

  const formatPeriodDisplay = (startStr: string, endStr: string) => {
    const parse = (s: string) => {
      const parts = s.split("-");
      return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    };
    const sDate = parse(startStr);
    const eDate = parse(endStr);
    const sFmt = sDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const eFmt = eDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return `${sFmt} – ${eFmt}`;
  };

  return (
    <Card className="col-span-2 row-span-2 flex flex-col border border-border/80 bg-gradient-to-br from-card via-card to-muted/20 shadow-xs transition-all duration-300 hover:shadow-sm dark:border-zinc-800 dark:from-zinc-900/90 dark:via-zinc-900/70 dark:to-zinc-950/90 overflow-hidden py-0 gap-0 h-full justify-between">
      {/* Top Amber / Orange / Emerald Gradient Bar */}
      <div className="h-0.5 w-full bg-gradient-to-r from-amber-500 via-orange-500 to-emerald-500 shrink-0" />

      {/* Header */}
      <div className="px-3 py-2 border-b border-border/40 dark:border-zinc-800/60 flex flex-wrap items-center justify-between gap-1.5 shrink-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-amber-200/70 bg-amber-50 text-amber-600 dark:border-amber-800/50 dark:bg-amber-950/60 dark:text-amber-400">
            <Truck className="h-3 w-3" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs sm:text-sm font-semibold tracking-tight text-foreground truncate">
                Driver KPI
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

        {/* Month Selector & Controls */}
        <div className="flex items-center gap-1 shrink-0">
          <div className="relative flex items-center">
            <select
              value={selectedMonth}
              onChange={handleMonthChange}
              disabled={loading}
              className="h-6 rounded-md border border-border bg-background px-1.5 py-0 text-[10px] font-medium text-foreground shadow-2xs hover:bg-muted/50 focus:outline-hidden dark:border-zinc-700 dark:bg-zinc-800 cursor-pointer"
              title="Select Month"
            >
              {(data?.availableMonths || [
                { value: defaultMonth, label: "Current Month (MTD)" },
              ]).map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchMetric(selectedMonth)}
            disabled={loading}
            className="h-6 w-6 p-0 sm:w-auto sm:h-6 sm:px-1.5 text-[10px] dark:border-zinc-700 dark:bg-zinc-800"
            title="Refresh driver KPI"
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
            <Link href="/scm/logistics-performance">
              <span>Logistics</span>
              <ArrowUpRight className="h-2.5 w-2.5" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-2.5 sm:p-3 flex-1 flex flex-col justify-between overflow-hidden gap-2">
        {loading && !data ? (
          <div className="flex flex-1 items-center justify-center py-6 gap-2 text-muted-foreground my-auto">
            <Spinner className="h-4 w-4 text-amber-600" />
            <p className="text-xs">Loading driver KPI...</p>
          </div>
        ) : error && !data ? (
          <div className="flex flex-1 flex-col items-center justify-center py-6 gap-2 text-center my-auto">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <p className="text-xs text-muted-foreground px-2">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchMetric(selectedMonth)}
              className="mt-1 h-6 text-[10px] dark:border-zinc-700"
            >
              Retry
            </Button>
          </div>
        ) : data ? (
          <>
            {/* Top Fulfillment & Revenue Overview */}
            <div className="rounded-lg border border-border/60 bg-muted/20 p-2 dark:border-zinc-800/80 dark:bg-zinc-950/40 shrink-0">
              <div className="flex items-center justify-between text-xs mb-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="font-medium text-foreground">Fulfillment Rate</span>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    ({formatPeriodDisplay(data.startDate, data.endDate)})
                  </span>
                </div>
                <span className="font-semibold text-amber-600 dark:text-amber-400">
                  {data.fulfillmentRate}%
                </span>
              </div>
              <Progress
                value={data.fulfillmentRate}
                className="h-1.5 bg-muted dark:bg-zinc-800"
              />

              <div className="grid grid-cols-3 gap-1.5 pt-2 mt-1 border-t border-border/40 dark:border-zinc-800/60 text-center">
                <div className="flex flex-col items-center">
                  <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                    <CheckCircle2 className="h-2.5 w-2.5" />
                    Deliveries
                  </span>
                  <span className="text-xs font-semibold text-foreground">
                    {data.fulfilledVisits}/{data.totalVisits} Done
                  </span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                    <DollarSign className="h-2.5 w-2.5" />
                    Fulfilled Value
                  </span>
                  <span className="text-xs font-semibold text-foreground truncate max-w-full">
                    {pesoFmt.format(data.totalFulfilledAmount)}
                  </span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                    <Clock className="h-2.5 w-2.5" />
                    Dispatch Var
                  </span>
                  <span className="text-xs font-semibold text-foreground">
                    {data.avgDispatchVarianceHours}h
                  </span>
                </div>
              </div>
            </div>

            {/* Drivers Breakdown List */}
            <div className="flex-1 overflow-y-auto min-h-0 space-y-1.5 pr-0.5 max-h-[175px]">
              {data.topDrivers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground">
                  <Truck className="h-6 w-6 opacity-30 mb-1" />
                  <p className="text-xs font-medium">No deliveries found for {data.monthLabel}</p>
                </div>
              ) : (
                data.topDrivers.map((driver, idx) => (
                  <div
                    key={`${driver.driverName}-${idx}`}
                    className="rounded-md border border-border/50 bg-background/60 p-2 transition-colors hover:bg-muted/30 dark:border-zinc-800/60 dark:bg-zinc-900/50"
                  >
                    <div className="flex items-center justify-between gap-1.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="rounded bg-muted px-1 py-0.5 text-[9px] font-bold font-mono text-muted-foreground dark:bg-zinc-800">
                          #{idx + 1}
                        </span>
                        <span className="text-xs font-medium text-foreground truncate" title={driver.driverName}>
                          {driver.driverName}
                        </span>
                      </div>
                      <span className="rounded px-1.5 py-0.5 text-[10px] font-semibold border border-amber-500/30 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-400">
                        {driver.fulfillmentRate}%
                      </span>
                    </div>

                    <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground">
                      <span>
                        {driver.fulfilledVisits}/{driver.totalVisits} orders
                      </span>
                      <span>{pesoFmt.format(driver.totalFulfilledAmount)}</span>
                    </div>

                    <div className="mt-1">
                      <Progress
                        value={driver.fulfillmentRate}
                        className="h-1 bg-muted dark:bg-zinc-800"
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        ) : null}
      </div>
    </Card>
  );
}
