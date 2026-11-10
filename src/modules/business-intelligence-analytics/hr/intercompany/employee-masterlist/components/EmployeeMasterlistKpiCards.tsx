"use client";

import React from "react";
import {
  Users,
  UserCheck,
  UserPlus,
  Clock,
  Award,
  Building2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { IntercompanyEmployeeMasterlistKpis } from "../types";

interface EmployeeMasterlistKpiCardsProps {
  kpis: IntercompanyEmployeeMasterlistKpis;
}

export function EmployeeMasterlistKpiCards({ kpis }: EmployeeMasterlistKpiCardsProps) {
  const {
    totalEmployees,
    regularCount,
    probationaryCount,
    otherStatusCount,
    newHiresThisYear,
    departmentHeadsCount,
    avgTenureYears,
    maleCount,
    femaleCount,
    activeCompaniesCount,
    totalCompaniesCount,
    totalDepartmentsCount,
    largestCompanyName,
    largestCompanyCount,
  } = kpis;

  const regularPct =
    totalEmployees > 0 ? Math.round((regularCount / totalEmployees) * 100) : 0;
  const probPct =
    totalEmployees > 0 ? Math.round((probationaryCount / totalEmployees) * 100) : 0;
  const largestSharePct =
    totalEmployees > 0 ? Math.round((largestCompanyCount / totalEmployees) * 100) : 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
      {/* 1. Total Employees */}
      <Card className="border-border bg-card shadow-xs hover:border-cyan-500/40 transition-all rounded-2xl">
        <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Workforce
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground tabular-nums">
              {totalEmployees.toLocaleString()}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1 flex items-center justify-between">
              <span>{maleCount.toLocaleString()} Male</span>
              <span>•</span>
              <span>{femaleCount.toLocaleString()} Female</span>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 2. Regular Employees */}
      <Card className="border-border bg-card shadow-xs hover:border-emerald-500/40 transition-all rounded-2xl">
        <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Regular Staff
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <UserCheck className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 tabular-nums">
                {regularCount.toLocaleString()}
              </span>
              <span className="text-xs font-semibold text-muted-foreground tabular-nums">
                ({regularPct}%)
              </span>
            </div>
            <div className="mt-2">
              <Progress value={regularPct} className="h-1.5 bg-muted" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. Probationary & Other Status */}
      <Card className="border-border bg-card shadow-xs hover:border-amber-500/40 transition-all rounded-2xl">
        <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Probationary
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold tracking-tight text-amber-600 dark:text-amber-400 tabular-nums">
                {probationaryCount.toLocaleString()}
              </span>
              <span className="text-xs font-semibold text-muted-foreground tabular-nums">
                ({probPct}%)
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              +{otherStatusCount.toLocaleString()} contractual / other
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 4. New Hires This Year */}
      <Card className="border-border bg-card shadow-xs hover:border-blue-500/40 transition-all rounded-2xl">
        <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              New Hires ({new Date().getFullYear()})
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              <UserPlus className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold tracking-tight text-blue-600 dark:text-blue-400 tabular-nums">
              {newHiresThisYear.toLocaleString()}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Onboarded year-to-date
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 5. Average Tenure & Dept Heads */}
      <Card className="border-border bg-card shadow-xs hover:border-purple-500/40 transition-all rounded-2xl">
        <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Average Tenure
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
              <Award className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground tabular-nums">
                {avgTenureYears}
              </span>
              <span className="text-xs font-medium text-muted-foreground">years</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {departmentHeadsCount.toLocaleString()} Department Heads
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 6. Active Companies & Largest Entity */}
      <Card className="border-border bg-card shadow-xs hover:border-indigo-500/40 transition-all rounded-2xl">
        <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Operating Entities
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              <Building2 className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-base sm:text-lg font-bold tracking-tight text-foreground truncate" title={largestCompanyName}>
              {largestCompanyName}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1 truncate">
              {largestCompanyCount} staff ({largestSharePct}%) • {activeCompaniesCount}/{totalCompaniesCount} Cos • {totalDepartmentsCount} Depts
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

