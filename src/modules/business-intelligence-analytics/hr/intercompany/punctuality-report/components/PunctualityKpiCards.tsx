"use client";

import React from "react";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Flame,
  Award,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { IntercompanyPunctualityKpis } from "../types";

interface PunctualityKpiCardsProps {
  kpis: IntercompanyPunctualityKpis;
}

export function PunctualityKpiCards({ kpis }: PunctualityKpiCardsProps) {
  const {
    totalPresentLogs,
    onTimeCount,
    totalLateCount,
    gracePeriodCount,
    moderateLateCount,
    severeLateCount,
    overallPunctualityRate,
    averageDelayMinutes,
    totalDelayMinutes,
    activeCompaniesCount,
    totalCompaniesCount,
    mostPunctualCompany,
    mostPunctualDepartment,
  } = kpis;

  const onTimePct = totalPresentLogs > 0 ? Math.round((onTimeCount / totalPresentLogs) * 100) : 0;
  const latePct = totalPresentLogs > 0 ? Math.round((totalLateCount / totalPresentLogs) * 100) : 0;
  const severePct = totalLateCount > 0 ? Math.round((severeLateCount / totalLateCount) * 100) : 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
      {/* 1. Overall Punctuality Rate */}
      <Card className="border-border bg-card shadow-xs hover:border-emerald-500/40 transition-all rounded-2xl">
        <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Punctuality Rate
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 tabular-nums">
              {overallPunctualityRate}%
            </div>
            <div className="mt-2 space-y-1">
              <Progress value={overallPunctualityRate} className="h-1.5 bg-muted" />
              <p className="text-[11px] text-muted-foreground font-medium flex justify-between">
                <span>{onTimeCount.toLocaleString()} on-time</span>
                <span>{totalPresentLogs.toLocaleString()} logs</span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. On-Time Check-ins */}
      <Card className="border-border bg-card shadow-xs hover:border-emerald-500/40 transition-all rounded-2xl">
        <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              On-Time Arrivals
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground tabular-nums">
                {onTimeCount.toLocaleString()}
              </span>
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                ({onTimePct}%)
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Checked in ≤ 08:00 AM
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 3. Delayed / Late Arrivals */}
      <Card className="border-border bg-card shadow-xs hover:border-amber-500/40 transition-all rounded-2xl">
        <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Late Arrivals
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold tracking-tight text-amber-600 dark:text-amber-400 tabular-nums">
                {totalLateCount.toLocaleString()}
              </span>
              <span className="text-xs font-semibold text-muted-foreground tabular-nums">
                ({latePct}%)
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              <span className="font-semibold text-foreground">{gracePeriodCount}</span> grace • <span className="font-semibold text-amber-600 dark:text-amber-400">{moderateLateCount}</span> moderate
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 4. Average Delay Duration */}
      <Card className="border-border bg-card shadow-xs hover:border-cyan-500/40 transition-all rounded-2xl">
        <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Avg Late Delay
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
              <Flame className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground tabular-nums">
                {averageDelayMinutes}
              </span>
              <span className="text-xs font-medium text-muted-foreground">mins</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {totalDelayMinutes.toLocaleString()} total delayed minutes
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 5. Severe Lates (>30 mins) */}
      <Card className="border-border bg-card shadow-xs hover:border-rose-500/40 transition-all rounded-2xl">
        <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Severe Lates
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold tracking-tight text-rose-600 dark:text-rose-400 tabular-nums">
                {severeLateCount.toLocaleString()}
              </span>
              <span className="text-xs font-semibold text-rose-600/80 dark:text-rose-400/80 tabular-nums">
                ({severePct}% of lates)
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Arrived &gt; 30 mins after shift
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 6. Top Punctual Entity */}
      <Card className="border-border bg-card shadow-xs hover:border-purple-500/40 transition-all rounded-2xl">
        <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Punctuality Leader
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
              <Award className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-base sm:text-lg font-bold tracking-tight text-foreground truncate">
              {mostPunctualCompany}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1 truncate">
              {mostPunctualDepartment} ({activeCompaniesCount}/{totalCompaniesCount} Cos)
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
