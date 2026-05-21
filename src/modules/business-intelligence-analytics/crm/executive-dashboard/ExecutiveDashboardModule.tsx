// src/modules/business-intelligence-analytics/crm/executive-dashboard/ExecutiveDashboardModule.tsx
"use client";

import React, { Suspense } from "react";
import { Loader2, LayoutDashboard, CalendarRange, ArrowUpRight, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useExecutiveDashboard } from "./hooks/useExecutiveDashboard";
import { FiltersStrip } from "./components/FiltersStrip";
import { ComparisonGrids } from "./components/ComparisonGrids";
import { DrillDownAnalytics } from "./components/DrillDownAnalytics";

function SkeletonLoader() {
  return (
    <div className="space-y-8 p-6 min-h-screen bg-background text-foreground animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-2">
        <div className="space-y-3">
          <div className="h-3 w-40 bg-muted/60 rounded" />
          <div className="h-8 w-60 bg-muted rounded" />
          <div className="h-4 w-80 bg-muted/60 rounded" />
        </div>
        <div className="h-12 w-80 bg-muted rounded-2xl" />
      </div>

      {/* Metric Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="border-border/40 bg-card/40">
            <CardContent className="p-6 h-28 flex flex-col justify-between">
              <div className="h-3 w-20 bg-muted rounded" />
              <div className="h-6 w-40 bg-muted rounded" />
              <div className="h-2 w-full bg-muted/60 rounded" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Grid Tables Skeleton */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <Card className="xl:col-span-8 border-border/40 bg-card/40 h-80" />
        <Card className="xl:col-span-4 border-border/40 bg-card/40 h-80" />
      </div>
    </div>
  );
}

function ExecutiveDashboardContent() {
  const {
    selectedYear,
    setSelectedYear,
    selectedMonth,
    setSelectedMonth,
    selectedDivision,
    setSelectedDivision,
    uniqueDivisions,
    loading,
    loadedOnce,
    error,
    refresh,
    tradeSupplierGrid,
    tradeTotals,
    nonTradeGrid,
    nonTradeTotals,
    drillDownCategory,
    setDrillDownCategory,
    trendPoints,
    supplierMonthlyBreakdown,
    activeYtdTotal,
  } = useExecutiveDashboard();

  const formatPHP = (val: number) =>
    new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 0,
    }).format(val);

  if (!loadedOnce && loading) {
    return <SkeletonLoader />;
  }

  // Quick Consolidated KPI cards at the top
  const tradeSalesSum = tradeTotals.sales;
  const nonTradeExpSum = nonTradeTotals.expenses;
  const netPosition = tradeSalesSum - nonTradeExpSum - tradeTotals.salesReturn;

  return (
    <div className="space-y-8 p-6 min-h-screen bg-background text-foreground transition-all duration-300">
      {/* 1. FILTER STRIP CONTROL HEADER */}
      <FiltersStrip
        selectedYear={selectedYear}
        setSelectedYear={setSelectedYear}
        selectedMonth={selectedMonth}
        setSelectedMonth={setSelectedMonth}
        selectedDivision={selectedDivision}
        setSelectedDivision={setSelectedDivision}
        uniqueDivisions={uniqueDivisions}
        loading={loading}
        refresh={refresh}
      />

      {/* 2. ERROR DISPLAY */}
      {error && (
        <Card className="border-destructive/40 bg-destructive/10 text-destructive p-4 rounded-2xl flex items-center gap-3">
          <span className="text-sm font-black uppercase tracking-wider">Warning:</span>
          <span className="text-xs font-semibold">{error}</span>
        </Card>
      )}

      {/* 3. CONSOLIDATED FINANCIAL CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Sales trade */}
        <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary/10 to-transparent group hover:scale-[1.01] transition-all duration-300 shadow-xl">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <LayoutDashboard className="h-16 w-16 text-primary -mr-4 -mt-4 rotate-12" />
          </div>
          <CardContent className="p-6 flex flex-col gap-1 relative z-10">
            <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">Trade Gross Sales</p>
            <p className="text-3xl font-black tracking-tighter text-foreground italic">{formatPHP(tradeSalesSum)}</p>
            <div className="mt-2 h-1 w-12 bg-primary/40 rounded-full" />
          </CardContent>
        </Card>

        {/* Card 2: Non-Trade Expenses */}
        <Card className="relative overflow-hidden border-border/40 bg-card hover:scale-[1.01] transition-all duration-300 shadow-lg">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <CalendarRange className="h-16 w-16 -mr-4 -mt-4" />
          </div>
          <CardContent className="p-6 flex flex-col gap-1">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">Non-Trade Expenses</p>
            <p className="text-3xl font-black tracking-tighter text-foreground italic">{formatPHP(nonTradeExpSum)}</p>
            <div className="mt-2 h-1 w-12 bg-muted/40 rounded-full" />
          </CardContent>
        </Card>

        {/* Card 3: Net Cash Balance */}
        <Card className={`relative overflow-hidden hover:scale-[1.01] transition-all duration-300 shadow-xl border-l-4 ${netPosition >= 0 ? "border-emerald-500 bg-emerald-500/5" : "border-destructive bg-destructive/5"}`}>
          <CardContent className="p-6 flex flex-col gap-1">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">Net Cash Position</p>
            <div className="flex items-center gap-3">
              <p className={`text-3xl font-black tracking-tighter italic ${netPosition >= 0 ? "text-emerald-500" : "text-destructive"}`}>
                {formatPHP(netPosition)}
              </p>
              <Badge className={`font-black text-[9px] uppercase px-2 py-0.5 tracking-widest ${netPosition >= 0 ? "bg-emerald-500/20 text-emerald-500 border-emerald-500/20" : "bg-amber-500/20 text-amber-500 border-amber-500/20"}`} variant="outline">
                {netPosition >= 0 ? "SURPLUS" : "DEFICIT"}
              </Badge>
            </div>
            <div className="mt-2 h-1 w-full bg-muted/20 rounded-full overflow-hidden">
              <div className={`h-full ${netPosition >= 0 ? "bg-emerald-500" : "bg-amber-500"}`} style={{ width: "100%" }} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 4. MAIN COMPARISON GRIDS */}
      <ComparisonGrids
        tradeData={tradeSupplierGrid}
        tradeTotals={tradeTotals}
        nonTradeData={nonTradeGrid}
        nonTradeTotals={nonTradeTotals}
        drillDownCategory={drillDownCategory}
        setDrillDownCategory={setDrillDownCategory}
        loading={loading}
      />

      {/* 5. DRILL DOWN CHARTS & LEDGERS */}
      <DrillDownAnalytics
        drillDownCategory={drillDownCategory}
        trendPoints={trendPoints}
        supplierMonthlyBreakdown={supplierMonthlyBreakdown}
        activeYtdTotal={activeYtdTotal}
        loading={loading}
      />
    </div>
  );
}

export default function ExecutiveDashboardModule() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-full items-center justify-center bg-background">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <ExecutiveDashboardContent />
    </Suspense>
  );
}
