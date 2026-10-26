"use client";

import React from "react";
import {
  Users,
  CheckCircle2,
  Clock,
  UserX,
  CalendarDays,
  Percent,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { IntercompanyAttendanceKpis } from "../types";

interface AttendanceKpiCardsProps {
  kpis: IntercompanyAttendanceKpis;
}

export function AttendanceKpiCards({ kpis }: AttendanceKpiCardsProps) {
  const {
    totalWorkforce,
    totalPresent,
    totalLate,
    totalAbsent,
    totalOnLeave,
    totalFiledLeave = 0,
    totalPendingLeave = 0,
    overallAttendanceRate,
    overallPunctualityRate,
    activeCompaniesCount,
    totalCompaniesCount,
  } = kpis;

  const onTimeCount = Math.max(0, totalPresent - totalLate);
  const presentPct = totalWorkforce > 0 ? Math.round((totalPresent / totalWorkforce) * 100) : 0;
  const latePct = totalWorkforce > 0 ? Math.round((totalLate / totalWorkforce) * 100) : 0;
  const absentPct = totalWorkforce > 0 ? Math.round((totalAbsent / totalWorkforce) * 100) : 0;
  const leavePct = totalWorkforce > 0 ? Math.round((totalOnLeave / totalWorkforce) * 100) : 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
      {/* 1. Total Workforce */}
      <Card className="border-border bg-card shadow-xs hover:border-cyan-500/40 transition-all rounded-2xl">
        <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Active Workforce
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground tabular-nums">
              {totalWorkforce.toLocaleString()}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1 font-medium">
              Across <span className="font-semibold text-foreground">{activeCompaniesCount}</span> of {totalCompaniesCount} Companies
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 2. Total Present */}
      <Card className="border-border bg-card shadow-xs hover:border-emerald-500/40 transition-all rounded-2xl">
        <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Present Today
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 tabular-nums">
                {totalPresent.toLocaleString()}
              </span>
              <span className="text-xs font-semibold text-muted-foreground tabular-nums">
                ({presentPct}%)
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              <span className="font-semibold text-foreground">{onTimeCount.toLocaleString()}</span> strictly on time
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 3. Late Arrivals */}
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
                {totalLate.toLocaleString()}
              </span>
              <span className="text-xs font-semibold text-muted-foreground tabular-nums">
                ({latePct}%)
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Delayed check-ins logged
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 4. Absences */}
      <Card className="border-border bg-card shadow-xs hover:border-rose-500/40 transition-all rounded-2xl">
        <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Absences
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
              <UserX className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold tracking-tight text-rose-600 dark:text-rose-400 tabular-nums">
                {totalAbsent.toLocaleString()}
              </span>
              <span className="text-xs font-semibold text-muted-foreground tabular-nums">
                ({absentPct}%)
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Unaccounted / No log
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 5. Filed Leave */}
      <Card className="border-border bg-card shadow-xs hover:border-purple-500/40 transition-all rounded-2xl">
        <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Filed for Leave
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
              <CalendarDays className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold tracking-tight text-purple-600 dark:text-purple-400 tabular-nums">
                {totalFiledLeave.toLocaleString()}
              </span>
              <span className="text-xs font-semibold text-muted-foreground tabular-nums">
                ({totalWorkforce > 0 ? Math.round((totalFiledLeave / totalWorkforce) * 100) : 0}%)
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              <span className="font-semibold text-foreground">{totalOnLeave}</span> approved • <span className="font-semibold text-amber-600 dark:text-amber-400">{totalPendingLeave}</span> pending
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 6. Overall Attendance Rate */}
      <Card className="border-border bg-card shadow-xs hover:border-cyan-500/40 transition-all rounded-2xl">
        <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Attendance Rate
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              <Percent className="h-4 w-4" />
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground tabular-nums">
                {overallAttendanceRate}%
              </span>
              <span className="text-[11px] font-semibold text-cyan-600 dark:text-cyan-400">
                {overallPunctualityRate}% On-time
              </span>
            </div>
            <Progress value={overallAttendanceRate} className="h-1.5 bg-muted" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
