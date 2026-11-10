"use client";

import React from "react";
import {
  UserMinus,
  Clock,
  CheckCircle2,
  CalendarCheck2,
  TrendingDown,
  Building2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { IntercompanyResignationKpis } from "../types";

interface ResignationKpiCardsProps {
  kpis: IntercompanyResignationKpis;
}

export function ResignationKpiCards({ kpis }: ResignationKpiCardsProps) {
  const {
    totalResignations,
    pendingCount,
    approvedCount,
    completedCount,
    avgNoticeDays,
    compliantNoticeRate,
    turnoverRate,
    companiesWithResignationsCount,
    topResignationReason,
    topTurnoverDepartment,
  } = kpis;

  const resolvedTotal = approvedCount + completedCount;
  const resolutionRate =
    totalResignations > 0 ? Math.round((resolvedTotal / totalResignations) * 100) : 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
      {/* 1. Total Resignations */}
      <Card className="border-border bg-card shadow-xs hover:border-red-500/40 transition-all rounded-2xl">
        <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Resignations
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
              <UserMinus className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground tabular-nums">
              {totalResignations.toLocaleString()}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Across {companiesWithResignationsCount} operating {companiesWithResignationsCount === 1 ? "entity" : "entities"}
            </p>
          </div>
          <div className="pt-1">
            <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
              <span>Filing Volume</span>
              <span className="font-medium text-foreground">{totalResignations} total</span>
            </div>
            <Progress value={Math.min(100, totalResignations * 5)} className="h-1 bg-muted" />
          </div>
        </CardContent>
      </Card>

      {/* 2. Pending Approval */}
      <Card className="border-border bg-card shadow-xs hover:border-amber-500/40 transition-all rounded-2xl">
        <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Pending Review
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold tracking-tight text-amber-600 dark:text-amber-400 tabular-nums">
              {pendingCount.toLocaleString()}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Awaiting HR review & remarks
            </p>
          </div>
          <div className="pt-1">
            <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
              <span>Backlog Share</span>
              <span className="font-medium text-foreground">
                {totalResignations > 0 ? Math.round((pendingCount / totalResignations) * 100) : 0}%
              </span>
            </div>
            <Progress
              value={totalResignations > 0 ? (pendingCount / totalResignations) * 100 : 0}
              className="h-1 bg-muted"
            />
          </div>
        </CardContent>
      </Card>

      {/* 3. Approved / Resolved */}
      <Card className="border-border bg-card shadow-xs hover:border-emerald-500/40 transition-all rounded-2xl">
        <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Processed / Closed
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 tabular-nums">
              {resolvedTotal.toLocaleString()}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {resolutionRate}% processed rate
            </p>
          </div>
          <div className="pt-1">
            <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
              <span>Resolution Rate</span>
              <span className="font-medium text-emerald-600 dark:text-emerald-400">{resolutionRate}%</span>
            </div>
            <Progress value={resolutionRate} className="h-1 bg-muted" />
          </div>
        </CardContent>
      </Card>

      {/* 4. Notice Period Compliance */}
      <Card className="border-border bg-card shadow-xs hover:border-blue-500/40 transition-all rounded-2xl">
        <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Avg Notice Days
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              <CalendarCheck2 className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground tabular-nums">
              {avgNoticeDays} <span className="text-xs font-normal text-muted-foreground">days</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {compliantNoticeRate}% compliant (30+ days)
            </p>
          </div>
          <div className="pt-1">
            <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
              <span>30-Day Standard</span>
              <span className="font-medium text-blue-600 dark:text-blue-400">{compliantNoticeRate}%</span>
            </div>
            <Progress value={compliantNoticeRate} className="h-1 bg-muted" />
          </div>
        </CardContent>
      </Card>

      {/* 5. Turnover / Attrition Rate */}
      <Card className="border-border bg-card shadow-xs hover:border-purple-500/40 transition-all rounded-2xl">
        <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Turnover Rate
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
              <TrendingDown className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold tracking-tight text-purple-600 dark:text-purple-400 tabular-nums">
              {turnoverRate}%
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Workforce attrition ratio
            </p>
          </div>
          <div className="pt-1">
            <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
              <span>Top Attrition Dept</span>
              <span className="font-medium text-foreground truncate max-w-[90px]">{topTurnoverDepartment}</span>
            </div>
            <Progress value={Math.min(100, turnoverRate * 5)} className="h-1 bg-muted" />
          </div>
        </CardContent>
      </Card>

      {/* 6. Primary Reason Driver */}
      <Card className="border-border bg-card shadow-xs hover:border-cyan-500/40 transition-all rounded-2xl">
        <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Main Reason Driver
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
              <Building2 className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-base sm:text-lg font-bold tracking-tight text-foreground line-clamp-1">
              {topResignationReason}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Primary driver across companies
            </p>
          </div>
          <div className="pt-1">
            <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
              <span>Workforce Status</span>
              <span className="font-medium text-emerald-600 dark:text-emerald-400">Stable</span>
            </div>
            <Progress value={85} className="h-1 bg-muted" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

