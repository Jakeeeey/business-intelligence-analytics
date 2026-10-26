"use client";

import React from "react";
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Building2,
  Users,
} from "lucide-react";
import { IntercompanyOvertimeKpis } from "../types";

interface OvertimeKpiCardsProps {
  kpis: IntercompanyOvertimeKpis;
}

export function OvertimeKpiCards({ kpis }: OvertimeKpiCardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5">
      {/* 1. Total Overtime Hours */}
      <div className="relative overflow-hidden rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-500/10 via-indigo-500/5 to-transparent p-4 shadow-sm hover:shadow-md transition-all">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold tracking-wider uppercase text-indigo-700 dark:text-indigo-300">
            Total Overtime
          </span>
          <div className="h-8 w-8 rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Clock className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-1">
          <span className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
            {kpis.totalOtHours.toLocaleString()}
          </span>
          <span className="text-xs font-medium text-muted-foreground">hrs</span>
        </div>
        <p className="text-[11px] text-muted-foreground mt-1">
          {kpis.totalOtMinutes.toLocaleString()} mins requested
        </p>
      </div>

      {/* 2. Total OT Requests */}
      <div className="relative overflow-hidden rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent p-4 shadow-sm hover:shadow-md transition-all">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold tracking-wider uppercase text-blue-700 dark:text-blue-300">
            Total OT Requests
          </span>
          <div className="h-8 w-8 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Users className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-1">
          <span className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
            {kpis.totalOtRequests.toLocaleString()}
          </span>
          <span className="text-xs font-medium text-muted-foreground">filed</span>
        </div>
        <p className="text-[11px] text-muted-foreground mt-1">
          Across {kpis.activeCompaniesCount} subsidiaries
        </p>
      </div>

      {/* 3. Total Approved Overtime */}
      <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent p-4 shadow-sm hover:shadow-md transition-all">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold tracking-wider uppercase text-emerald-700 dark:text-emerald-300">
            Approved Overtime
          </span>
          <div className="h-8 w-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-1">
          <span className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 tabular-nums">
            {kpis.totalApprovedOtHours.toLocaleString()}
          </span>
          <span className="text-xs font-medium text-muted-foreground">hrs</span>
        </div>
        <p className="text-[11px] text-muted-foreground mt-1">
          {kpis.totalApprovedOtRequests.toLocaleString()} approved requests
        </p>
      </div>

      {/* 4. Approval Rate */}
      <div className="relative overflow-hidden rounded-2xl border border-teal-500/20 bg-gradient-to-br from-teal-500/10 via-teal-500/5 to-transparent p-4 shadow-sm hover:shadow-md transition-all">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold tracking-wider uppercase text-teal-700 dark:text-teal-300">
            OT Approval Rate
          </span>
          <div className="h-8 w-8 rounded-xl bg-teal-500/15 text-teal-600 dark:text-teal-400 flex items-center justify-center">
            <TrendingUp className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-1">
          <span className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
            {kpis.otApprovalRate}
          </span>
          <span className="text-xs font-medium text-muted-foreground">%</span>
        </div>
        <div className="w-full bg-muted rounded-full h-1.5 mt-2 overflow-hidden">
          <div
            className="bg-teal-500 h-1.5 rounded-full transition-all"
            style={{ width: `${Math.min(100, Math.max(0, kpis.otApprovalRate))}%` }}
          />
        </div>
      </div>

      {/* 5. Pending & Rejected */}
      <div className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent p-4 shadow-sm hover:shadow-md transition-all">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold tracking-wider uppercase text-amber-700 dark:text-amber-300">
            Pending / Rejected
          </span>
          <div className="h-8 w-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <AlertTriangle className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-1">
          <span className="text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400 tabular-nums">
            {kpis.totalPendingOtRequests}
          </span>
          <span className="text-xs font-medium text-muted-foreground">
            / {kpis.totalRejectedOtRequests} rej
          </span>
        </div>
        <p className="text-[11px] text-muted-foreground mt-1">
          Awaiting manager review
        </p>
      </div>

      {/* 6. Top OT Contributor */}
      <div className="relative overflow-hidden rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-transparent p-4 shadow-sm hover:shadow-md transition-all">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold tracking-wider uppercase text-purple-700 dark:text-purple-300">
            Top Contributor
          </span>
          <div className="h-8 w-8 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <Building2 className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2">
          <span className="text-sm font-bold tracking-tight text-foreground truncate block" title={kpis.topOtEmployee || "N/A"}>
            {kpis.topOtEmployee || "None"}
          </span>
        </div>
        <p className="text-[11px] text-muted-foreground mt-1 truncate" title={kpis.topOtCompany || "N/A"}>
          Top Subsidiary: {kpis.topOtCompany || "N/A"}
        </p>
      </div>
    </div>
  );
}
