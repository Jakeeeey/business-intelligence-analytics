"use client";

import React from "react";
import {
  MessageSquareWarning,
  Clock,
  CheckCircle2,
  EyeOff,
  TrendingUp,
  Building2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { IntercompanyConcernsKpis } from "../types";

interface ConcernsKpiCardsProps {
  kpis: IntercompanyConcernsKpis;
}

export function ConcernsKpiCards({ kpis }: ConcernsKpiCardsProps) {
  const {
    totalConcerns,
    pendingCount,
    inReviewCount,
    resolvedCount,
    closedCount,
    anonymousCount,
    anonymousPercentage,
    resolutionRate,
    activeCompaniesCount,
    totalCompaniesCount,
    companiesWithConcernsCount,
    topConcernCompany,
    topConcernDepartment,
  } = kpis;

  const pendingPct =
    totalConcerns > 0 ? Math.round((pendingCount / totalConcerns) * 100) : 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
      {/* 1. Total Concerns Logged */}
      <Card className="border-border bg-card shadow-xs hover:border-amber-500/40 transition-all rounded-2xl">
        <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Concerns
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <MessageSquareWarning className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground tabular-nums">
              {totalConcerns.toLocaleString()}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Across {companiesWithConcernsCount} active operating {companiesWithConcernsCount === 1 ? "entity" : "entities"}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 2. Pending Action */}
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
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold tracking-tight text-amber-600 dark:text-amber-400 tabular-nums">
                {pendingCount.toLocaleString()}
              </span>
              <span className="text-xs font-semibold text-muted-foreground tabular-nums">
                ({pendingPct}%)
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {inReviewCount > 0 ? `+${inReviewCount} under investigation` : "Awaiting response"}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 3. Resolution Rate */}
      <Card className="border-border bg-card shadow-xs hover:border-emerald-500/40 transition-all rounded-2xl">
        <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Resolution Rate
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 tabular-nums">
                {resolutionRate}%
              </span>
            </div>
            <div className="mt-2 space-y-1">
              <Progress value={resolutionRate} className="h-1.5 bg-muted" />
              <p className="text-[10px] text-muted-foreground flex justify-between">
                <span>{resolvedCount} resolved</span>
                <span>{closedCount} closed</span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 4. Anonymous Submissions */}
      <Card className="border-border bg-card shadow-xs hover:border-purple-500/40 transition-all rounded-2xl">
        <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Anonymous Rate
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
              <EyeOff className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold tracking-tight text-purple-600 dark:text-purple-400 tabular-nums">
                {anonymousCount.toLocaleString()}
              </span>
              <span className="text-xs font-semibold text-muted-foreground tabular-nums">
                ({anonymousPercentage}%)
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Protected whistleblowing/concerns
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 5. In-Review / Active Processing */}
      <Card className="border-border bg-card shadow-xs hover:border-blue-500/40 transition-all rounded-2xl">
        <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Active In-Review
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold tracking-tight text-blue-600 dark:text-blue-400 tabular-nums">
              {inReviewCount.toLocaleString()}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              HR / Management in progress
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 6. Entity & Department Spotlight */}
      <Card className="border-border bg-card shadow-xs hover:border-cyan-500/40 transition-all rounded-2xl">
        <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Most Active Focus
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
              <Building2 className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-sm sm:text-base font-bold tracking-tight text-foreground truncate" title={topConcernCompany}>
              {topConcernCompany}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1 truncate">
              {topConcernDepartment} ({activeCompaniesCount}/{totalCompaniesCount} Cos Online)
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

