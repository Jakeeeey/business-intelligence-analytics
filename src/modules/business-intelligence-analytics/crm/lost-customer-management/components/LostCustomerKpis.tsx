"use client";

import React from "react";
import {
  Clock,
  Coins,
  ShieldAlert,
  UserX,
  TrendingDown,
  AlertCircle,
  Flame,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LostCustomerKpis as KpiType } from "../types";

interface LostCustomerKpisProps {
  kpis: KpiType;
}

function formatPhp(amount: number): string {
  if (amount >= 1_000_000_000) {
    return `₱${(amount / 1_000_000_000).toFixed(2)}B`;
  }
  if (amount >= 1_000_000) {
    return `₱${(amount / 1_000_000).toFixed(2)}M`;
  }
  return `₱${amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function LostCustomerKpis({ kpis }: LostCustomerKpisProps) {
  const total = kpis.totalCustomers || 1;
  const atRiskPct = Math.round((kpis.atRiskCount / total) * 100);
  const dormantPct = Math.round((kpis.dormantCount / total) * 100);
  const lostPct = Math.round((kpis.lostCount / total) * 100);

  const hasRevenueData = kpis.totalValueAtRisk > 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Inactive Accounts */}
      <Card className="relative overflow-hidden rounded-2xl border-border/80 bg-card shadow-xs transition-all duration-200 hover:shadow-md hover:border-red-500/40 before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-linear-to-r before:from-red-500 before:to-rose-400">
        <CardContent className="p-4.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Inactive Accounts
            </span>
            <div className="flex h-8.5 w-8.5 items-center justify-center rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 shadow-2xs">
              <UserX className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-black tracking-tight text-foreground">
              {kpis.totalCustomers.toLocaleString()}
            </span>
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0 h-4.5 border-red-500/30 text-red-600 dark:text-red-400 bg-red-500/10 font-semibold"
            >
              100% Inactive
            </Badge>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <AlertCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />
            <span>Zero sales recorded in active period</span>
          </div>
        </CardContent>
      </Card>

      {/* 2. Revenue at Risk OR Critical Inactive Accounts */}
      {hasRevenueData ? (
        <Card className="relative overflow-hidden rounded-2xl border-border/80 bg-card shadow-xs transition-all duration-200 hover:shadow-md hover:border-amber-500/40 before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-linear-to-r before:from-amber-500 before:to-yellow-400">
          <CardContent className="p-4.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Revenue at Risk
              </span>
              <div className="flex h-8.5 w-8.5 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 shadow-2xs">
                <Coins className="h-4.5 w-4.5" />
              </div>
            </div>
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="text-2xl font-black tracking-tight text-foreground">
                {formatPhp(kpis.totalValueAtRisk)}
              </span>
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <TrendingDown className="h-3.5 w-3.5 text-amber-500 shrink-0" />
              <span>Cumulative past sales from dormant accounts</span>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="relative overflow-hidden rounded-2xl border-border/80 bg-card shadow-xs transition-all duration-200 hover:shadow-md hover:border-rose-500/40 before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-linear-to-r before:from-rose-500 before:to-red-600">
          <CardContent className="p-4.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Critical Lost (&gt;180d)
              </span>
              <div className="flex h-8.5 w-8.5 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 shadow-2xs">
                <Flame className="h-4.5 w-4.5" />
              </div>
            </div>
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="text-2xl font-black tracking-tight text-foreground">
                {kpis.lostCount.toLocaleString()}
              </span>
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 h-4.5 border-rose-500/30 text-rose-600 dark:text-rose-400 bg-rose-500/10 font-semibold"
              >
                {lostPct}% of total
              </Badge>
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <AlertCircle className="h-3.5 w-3.5 text-rose-500 shrink-0" />
              <span>Accounts inactive for over 6 months</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 3. Average Inactivity Days */}
      <Card className="relative overflow-hidden rounded-2xl border-border/80 bg-card shadow-xs transition-all duration-200 hover:shadow-md hover:border-blue-500/40 before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-linear-to-r before:from-blue-500 before:to-cyan-400">
        <CardContent className="p-4.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Avg Inactivity Span
            </span>
            <div className="flex h-8.5 w-8.5 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 shadow-2xs">
              <Clock className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-black tracking-tight text-foreground">
              {kpis.avgDaysInactive.toLocaleString()}
            </span>
            <span className="text-xs text-muted-foreground font-semibold">Days (~{Math.round(kpis.avgDaysInactive / 30)} mos)</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Clock className="h-3.5 w-3.5 text-blue-500 shrink-0" />
            <span>Average elapsed time since last transaction</span>
          </div>
        </CardContent>
      </Card>

      {/* 4. Risk Breakdown Meter */}
      <Card className="relative overflow-hidden rounded-2xl border-border/80 bg-card shadow-xs transition-all duration-200 hover:shadow-md hover:border-orange-500/40 before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-linear-to-r before:from-orange-500 before:to-red-500">
        <CardContent className="p-4.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Severity Breakdown
            </span>
            <div className="flex h-8.5 w-8.5 items-center justify-center rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 shadow-2xs">
              <ShieldAlert className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs">
            <div>
              <span className="text-base font-extrabold text-amber-600 dark:text-amber-400">
                {kpis.atRiskCount.toLocaleString()}
              </span>
              <span className="block text-[10px] text-muted-foreground">At-Risk ({atRiskPct}%)</span>
            </div>
            <div className="h-6 w-px bg-border" />
            <div>
              <span className="text-base font-extrabold text-orange-600 dark:text-orange-400">
                {kpis.dormantCount.toLocaleString()}
              </span>
              <span className="block text-[10px] text-muted-foreground">Dormant ({dormantPct}%)</span>
            </div>
            <div className="h-6 w-px bg-border" />
            <div>
              <span className="text-base font-extrabold text-red-600 dark:text-red-400">
                {kpis.lostCount.toLocaleString()}
              </span>
              <span className="block text-[10px] text-muted-foreground">Lost ({lostPct}%)</span>
            </div>
          </div>

          {/* Visual severity bar */}
          <div className="mt-2.5 flex h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              style={{ width: `${atRiskPct}%` }}
              title={`At-Risk: ${atRiskPct}%`}
              className="bg-amber-500 transition-all duration-500"
            />
            <div
              style={{ width: `${dormantPct}%` }}
              title={`Dormant: ${dormantPct}%`}
              className="bg-orange-500 transition-all duration-500"
            />
            <div
              style={{ width: `${lostPct}%` }}
              title={`Lost: ${lostPct}%`}
              className="bg-red-500 transition-all duration-500"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
