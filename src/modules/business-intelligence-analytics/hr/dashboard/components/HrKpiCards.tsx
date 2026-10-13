"use client";

import React from "react";
import {
  Users,
  Building,
  UserPlus,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HrDashboardKpis } from "../types";

interface HrKpiCardsProps {
  kpis: HrDashboardKpis;
}

export function HrKpiCards({ kpis }: HrKpiCardsProps) {
  const total = kpis.totalEmployees || 1;
  const regularPct = Math.round((kpis.regularCount / total) * 100);
  const probationaryPct = Math.round((kpis.probationaryCount / total) * 100);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Active Employees */}
      <Card className="relative overflow-hidden rounded-2xl border-border/80 bg-card shadow-xs transition-all duration-200 hover:shadow-md hover:border-cyan-500/40 before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-linear-to-r before:from-cyan-500 before:to-blue-500">
        <CardContent className="p-4.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Total Personnel
            </span>
            <div className="flex h-8.5 w-8.5 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 shadow-2xs">
              <Users className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-black tracking-tight text-foreground">
              {kpis.totalEmployees.toLocaleString()}
            </span>
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0 h-4.5 border-cyan-500/30 text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 font-semibold"
            >
              Active Roster
            </Badge>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/50">
            <span>Regular: <strong className="text-foreground">{kpis.regularCount} ({regularPct}%)</strong></span>
            <span>Probationary: <strong className="text-foreground">{kpis.probationaryCount} ({probationaryPct}%)</strong></span>
          </div>
        </CardContent>
      </Card>

      {/* 2. Active Departments */}
      <Card className="relative overflow-hidden rounded-2xl border-border/80 bg-card shadow-xs transition-all duration-200 hover:shadow-md hover:border-emerald-500/40 before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-linear-to-r before:from-emerald-500 before:to-teal-400">
        <CardContent className="p-4.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Active Departments
            </span>
            <div className="flex h-8.5 w-8.5 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shadow-2xs">
              <Building className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-black tracking-tight text-foreground">
              {kpis.activeDepartments}
            </span>
            <span className="text-xs text-muted-foreground font-semibold">Divisions</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground pt-1 border-t border-border/50">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
            <span>Staff assigned across operational units</span>
          </div>
        </CardContent>
      </Card>

      {/* 3. New Hires This Year */}
      <Card className="relative overflow-hidden rounded-2xl border-border/80 bg-card shadow-xs transition-all duration-200 hover:shadow-md hover:border-amber-500/40 before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-linear-to-r before:from-amber-500 before:to-yellow-400">
        <CardContent className="p-4.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              New Hires (This Year)
            </span>
            <div className="flex h-8.5 w-8.5 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 shadow-2xs">
              <UserPlus className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-black tracking-tight text-foreground">
              {kpis.newHiresThisYear}
            </span>
            <span className="text-xs text-muted-foreground font-semibold">Onboarded</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/50">
            <span>Growth Rate: <strong className="text-amber-600 dark:text-amber-400">+{Math.round((kpis.newHiresThisYear / total) * 100)}%</strong></span>
            <span>Current Year</span>
          </div>
        </CardContent>
      </Card>

      {/* 4. Average Company Tenure */}
      <Card className="relative overflow-hidden rounded-2xl border-border/80 bg-card shadow-xs transition-all duration-200 hover:shadow-md hover:border-indigo-500/40 before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-linear-to-r before:from-indigo-500 before:to-purple-500">
        <CardContent className="p-4.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Avg Tenure
            </span>
            <div className="flex h-8.5 w-8.5 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shadow-2xs">
              <Clock className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-black tracking-tight text-foreground">
              {kpis.avgTenureYears}
            </span>
            <span className="text-xs text-muted-foreground font-semibold">Years in Company</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/50">
            <span>Female: <strong className="text-pink-500">{kpis.femaleCount}</strong></span>
            <span>Male: <strong className="text-blue-500">{kpis.maleCount}</strong></span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
