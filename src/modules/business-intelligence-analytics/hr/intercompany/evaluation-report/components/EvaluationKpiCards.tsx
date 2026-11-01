"use client";

import React from "react";
import {
  ClipboardCheck,
  CheckCircle2,
  TrendingUp,
  Award,
  UserCheck,
  Building2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { IntercompanyEvaluationKpis } from "../types";

interface EvaluationKpiCardsProps {
  kpis: IntercompanyEvaluationKpis;
}

export function EvaluationKpiCards({ kpis }: EvaluationKpiCardsProps) {
  const {
    totalEvaluations,
    passedCount,
    regularizedCount,
    avgTotalScore,
    overallPassRate,
    regularizationRate,
    companiesWithEvaluationsCount,
    topPerformingCompany,
    topPerformingDepartment,
    predominantRatingBand,
  } = kpis;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
      {/* 1. Total Evaluations */}
      <Card className="border-border bg-card shadow-xs hover:border-blue-500/40 transition-all rounded-2xl">
        <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Evaluations
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              <ClipboardCheck className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground tabular-nums">
              {totalEvaluations.toLocaleString()}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Across {companiesWithEvaluationsCount} operating {companiesWithEvaluationsCount === 1 ? "entity" : "entities"}
            </p>
          </div>
          <div className="pt-1">
            <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
              <span>Appraisal Volume</span>
              <span className="font-medium text-foreground">{totalEvaluations} records</span>
            </div>
            <Progress value={Math.min(100, totalEvaluations * 5)} className="h-1 bg-muted" />
          </div>
        </CardContent>
      </Card>

      {/* 2. Overall Pass Rate */}
      <Card className="border-border bg-card shadow-xs hover:border-emerald-500/40 transition-all rounded-2xl">
        <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Overall Pass Rate
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 tabular-nums">
              {overallPassRate}%
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {passedCount + regularizedCount} successful evaluations
            </p>
          </div>
          <div className="pt-1">
            <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
              <span>Pass Target</span>
              <span className="font-medium text-emerald-600 dark:text-emerald-400">{overallPassRate}%</span>
            </div>
            <Progress value={overallPassRate} className="h-1 bg-muted" />
          </div>
        </CardContent>
      </Card>

      {/* 3. Average Score */}
      <Card className="border-border bg-card shadow-xs hover:border-indigo-500/40 transition-all rounded-2xl">
        <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Average Score
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground tabular-nums">
              {avgTotalScore} <span className="text-xs font-normal text-muted-foreground">/ 100</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Mean score across all appraisals
            </p>
          </div>
          <div className="pt-1">
            <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
              <span>Mean Standard</span>
              <span className="font-medium text-indigo-600 dark:text-indigo-400">{avgTotalScore}%</span>
            </div>
            <Progress value={avgTotalScore} className="h-1 bg-muted" />
          </div>
        </CardContent>
      </Card>

      {/* 4. Regularization Rate */}
      <Card className="border-border bg-card shadow-xs hover:border-purple-500/40 transition-all rounded-2xl">
        <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Regularization Rate
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
              <UserCheck className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold tracking-tight text-purple-600 dark:text-purple-400 tabular-nums">
              {regularizationRate}%
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {regularizedCount} confirmed regularizations
            </p>
          </div>
          <div className="pt-1">
            <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
              <span>Confirmation Ratio</span>
              <span className="font-medium text-purple-600 dark:text-purple-400">{regularizationRate}%</span>
            </div>
            <Progress value={regularizationRate} className="h-1 bg-muted" />
          </div>
        </CardContent>
      </Card>

      {/* 5. Rating Band Peak */}
      <Card className="border-border bg-card shadow-xs hover:border-amber-500/40 transition-all rounded-2xl">
        <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Dominant Tier
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <Award className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-base sm:text-lg font-bold tracking-tight text-foreground line-clamp-1">
              {predominantRatingBand}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Top Dept: {topPerformingDepartment}
            </p>
          </div>
          <div className="pt-1">
            <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
              <span>Benchmark Status</span>
              <span className="font-medium text-foreground">Standard</span>
            </div>
            <Progress value={80} className="h-1 bg-muted" />
          </div>
        </CardContent>
      </Card>

      {/* 6. Top Operating Entity */}
      <Card className="border-border bg-card shadow-xs hover:border-cyan-500/40 transition-all rounded-2xl">
        <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Top Entity
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
              <Building2 className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-base sm:text-lg font-bold tracking-tight text-foreground line-clamp-1">
              {topPerformingCompany}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Highest average appraisal score
            </p>
          </div>
          <div className="pt-1">
            <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
              <span>Performance</span>
              <span className="font-medium text-emerald-600 dark:text-emerald-400">High</span>
            </div>
            <Progress value={90} className="h-1 bg-muted" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

