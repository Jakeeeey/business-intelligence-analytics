"use client";

import React from "react";
import {
  Clock,
  CheckCircle2,
  FileCheck2,
  TrendingUp,
  CalendarDays,
  Award,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { IntercompanyLeaveKpis } from "../types";

interface LeaveKpiCardsProps {
  kpis: IntercompanyLeaveKpis;
}

export function LeaveKpiCards({ kpis }: LeaveKpiCardsProps) {
  const {
    totalOtHours,
    totalOtRequests,
    totalApprovedOtRequests,
    totalApprovedOtHours,
    totalPendingOtRequests,
    totalRejectedOtRequests,
    otApprovalRate,
    totalLeaveRequests,
    totalApprovedLeaveRequests,
    totalApprovedLeaveDays,
    totalPendingLeaveRequests,
    topOtEmployee,
    topOtCompany,
    activeCompaniesCount,
    totalCompaniesCount,
  } = kpis;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
      {/* 1. Total Overtime Rendered */}
      <Card className="border-border bg-card shadow-xs hover:border-cyan-500/40 transition-all rounded-2xl">
        <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Overtime
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground tabular-nums">
                {totalOtHours.toLocaleString()}
              </span>
              <span className="text-xs font-medium text-muted-foreground">hrs</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Across all overtime filings
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 2. Total Overtime Requests */}
      <Card className="border-border bg-card shadow-xs hover:border-amber-500/40 transition-all rounded-2xl">
        <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              OT Requests
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <FileCheck2 className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground tabular-nums">
              {totalOtRequests.toLocaleString()}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              <span className="font-semibold text-amber-600 dark:text-amber-400">{totalPendingOtRequests}</span> pending • <span className="font-semibold text-rose-600 dark:text-rose-400">{totalRejectedOtRequests}</span> rejected
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 3. Total Approved Overtime */}
      <Card className="border-border bg-card shadow-xs hover:border-emerald-500/40 transition-all rounded-2xl">
        <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Approved Overtime
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 tabular-nums">
                {totalApprovedOtHours.toLocaleString()}
              </span>
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">hrs</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              <span className="font-semibold text-foreground">{totalApprovedOtRequests.toLocaleString()}</span> requests authorized
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 4. OT Approval Rate */}
      <Card className="border-border bg-card shadow-xs hover:border-emerald-500/40 transition-all rounded-2xl">
        <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              OT Approval Rate
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground tabular-nums">
              {otApprovalRate}%
            </div>
            <div className="mt-2 space-y-1">
              <Progress value={otApprovalRate} className="h-1.5 bg-muted" />
              <p className="text-[10px] text-muted-foreground font-medium flex justify-between">
                <span>{totalApprovedOtRequests} Approved</span>
                <span>{totalOtRequests} Total</span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 5. Leave Requests & Days */}
      <Card className="border-border bg-card shadow-xs hover:border-purple-500/40 transition-all rounded-2xl">
        <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Leave Filings
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
              <CalendarDays className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground tabular-nums">
                {totalApprovedLeaveDays}
              </span>
              <span className="text-xs font-medium text-muted-foreground">days</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {totalApprovedLeaveRequests} approved ({totalLeaveRequests} total, {totalPendingLeaveRequests} pending)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 6. Top OT Renderers */}
      <Card className="border-border bg-card shadow-xs hover:border-cyan-500/40 transition-all rounded-2xl">
        <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Top OT Contributor
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
              <Award className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-sm sm:text-base font-bold tracking-tight text-foreground truncate">
              {topOtEmployee || "None"}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1 truncate">
              {topOtCompany} ({activeCompaniesCount}/{totalCompaniesCount} Cos)
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
