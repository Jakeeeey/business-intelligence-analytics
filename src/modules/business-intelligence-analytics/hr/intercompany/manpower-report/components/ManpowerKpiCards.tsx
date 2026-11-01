"use client";

import React from "react";
import {
  FileText,
  Users,
  UserCheck,
  CheckCircle2,
  Coins,
  Building2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { IntercompanyManpowerKpis } from "../types";

interface ManpowerKpiCardsProps {
  kpis: IntercompanyManpowerKpis;
}

export function ManpowerKpiCards({ kpis }: ManpowerKpiCardsProps) {
  const {
    totalRequests,
    totalHeadcountNeeded,
    totalHeadcountHired,
    approvedCount,
    overallApprovalRate,
    overallFulfillmentRate,
    totalBudgetCost,
    companiesWithRequestsCount,
    topRequestingDepartment,
    predominantPurpose,
  } = kpis;

  const formattedBudget = `₱${totalBudgetCost.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
      {/* 1. Total Requests */}
      <Card className="border-border bg-card shadow-xs hover:border-blue-500/40 transition-all rounded-2xl">
        <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Requisitions
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              <FileText className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground tabular-nums">
              {totalRequests.toLocaleString()}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Across {companiesWithRequestsCount} operating {companiesWithRequestsCount === 1 ? "entity" : "entities"}
            </p>
          </div>
          <div className="pt-1">
            <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
              <span>Filing Volume</span>
              <span className="font-medium text-foreground">{totalRequests} MRs</span>
            </div>
            <Progress value={Math.min(100, totalRequests * 10)} className="h-1 bg-muted" />
          </div>
        </CardContent>
      </Card>

      {/* 2. Headcount Needed */}
      <Card className="border-border bg-card shadow-xs hover:border-indigo-500/40 transition-all rounded-2xl">
        <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Headcount Needed
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground tabular-nums">
              {totalHeadcountNeeded.toLocaleString()}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Total positions requested
            </p>
          </div>
          <div className="pt-1">
            <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
              <span>Hiring Demand</span>
              <span className="font-medium text-indigo-600 dark:text-indigo-400">
                {totalHeadcountNeeded} positions
              </span>
            </div>
            <Progress value={Math.min(100, totalHeadcountNeeded * 8)} className="h-1 bg-muted" />
          </div>
        </CardContent>
      </Card>

      {/* 3. Positions Filled & Fulfillment Rate */}
      <Card className="border-border bg-card shadow-xs hover:border-emerald-500/40 transition-all rounded-2xl">
        <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Staffing Fulfillment
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <UserCheck className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 tabular-nums">
              {overallFulfillmentRate}%
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {totalHeadcountHired} of {totalHeadcountNeeded} hired
            </p>
          </div>
          <div className="pt-1">
            <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
              <span>Fulfillment Ratio</span>
              <span className="font-medium text-emerald-600 dark:text-emerald-400">
                {overallFulfillmentRate}%
              </span>
            </div>
            <Progress value={overallFulfillmentRate} className="h-1 bg-muted" />
          </div>
        </CardContent>
      </Card>

      {/* 4. Approval Rate */}
      <Card className="border-border bg-card shadow-xs hover:border-purple-500/40 transition-all rounded-2xl">
        <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Approval Rate
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold tracking-tight text-purple-600 dark:text-purple-400 tabular-nums">
              {overallApprovalRate}%
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {approvedCount} requisitions approved
            </p>
          </div>
          <div className="pt-1">
            <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
              <span>Sign-off Ratio</span>
              <span className="font-medium text-purple-600 dark:text-purple-400">{overallApprovalRate}%</span>
            </div>
            <Progress value={overallApprovalRate} className="h-1 bg-muted" />
          </div>
        </CardContent>
      </Card>

      {/* 5. Total Budget Required */}
      <Card className="border-border bg-card shadow-xs hover:border-amber-500/40 transition-all rounded-2xl">
        <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Estimated Payroll
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <Coins className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold tracking-tight text-foreground tabular-nums truncate">
              {formattedBudget}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Total rate expenditure
            </p>
          </div>
          <div className="pt-1">
            <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
              <span>Budget Status</span>
              <span className="font-medium text-amber-600 dark:text-amber-400">Allocated</span>
            </div>
            <Progress value={75} className="h-1 bg-muted" />
          </div>
        </CardContent>
      </Card>

      {/* 6. Primary Purpose & Department */}
      <Card className="border-border bg-card shadow-xs hover:border-cyan-500/40 transition-all rounded-2xl">
        <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Primary Driver
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
              <Building2 className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-base sm:text-lg font-bold tracking-tight text-foreground line-clamp-1">
              {predominantPurpose}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1 truncate">
              Top Dept: {topRequestingDepartment}
            </p>
          </div>
          <div className="pt-1">
            <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
              <span>Priority Status</span>
              <span className="font-medium text-foreground">Active</span>
            </div>
            <Progress value={85} className="h-1 bg-muted" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

