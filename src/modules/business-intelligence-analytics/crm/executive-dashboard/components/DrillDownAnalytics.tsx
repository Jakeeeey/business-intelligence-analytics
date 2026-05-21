// src/modules/business-intelligence-analytics/crm/executive-dashboard/components/DrillDownAnalytics.tsx
"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Trophy, TrendingUp, Presentation, Search, X, Loader2, ChevronsDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MonthlyTrendPoint, SupplierMonthlyBreakdown, DrillDownCategory } from "../types";

const MONTHS_LIST = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const PAGE_SIZE = 15;

interface DrillDownAnalyticsProps {
  drillDownCategory: DrillDownCategory;
  trendPoints: MonthlyTrendPoint[];
  supplierMonthlyBreakdown: SupplierMonthlyBreakdown[];
  activeYtdTotal: number;
  loading: boolean;
}

export function DrillDownAnalytics({
  drillDownCategory,
  trendPoints,
  supplierMonthlyBreakdown,
  activeYtdTotal,
  loading,
}: DrillDownAnalyticsProps) {
  const [supplierSearch, setSupplierSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Track previous filter key so we can reset visibleCount during render
  // without putting setState inside a useEffect (avoids set-state-in-effect lint error)
  const prevFilterKeyRef = useRef(`${supplierSearch}__${drillDownCategory}`);
  const currentFilterKey = `${supplierSearch}__${drillDownCategory}`;
  if (prevFilterKeyRef.current !== currentFilterKey) {
    prevFilterKeyRef.current = currentFilterKey;
    if (visibleCount !== PAGE_SIZE) {
      setVisibleCount(PAGE_SIZE);
    }
  }

  const formatPHP = (val: number) =>
    new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 0,
    }).format(val);

  const formatShort = (val: number) => {
    const absVal = Math.abs(val);
    const sign = val < 0 ? "-" : "";
    if (absVal >= 1000000) return `${sign}₱${(absVal / 1000000).toFixed(1)}M`;
    if (absVal >= 1000) return `${sign}₱${(absVal / 1000).toFixed(0)}k`;
    return `${sign}₱${absVal.toFixed(0)}`;
  };

  const getCategoryLabel = (cat: DrillDownCategory) => {
    switch (cat) {
      case "purchases":       return "PURCHASES";
      case "sales":           return "SALES";
      case "arClaims":        return "AR CLAIMS";
      case "arTrade":         return "AR TRADE";
      case "inventories":     return "INVENTORIES";
      case "salesReturn":     return "SALES RETURN";
      case "accountsPayable": return "ACCOUNTS PAYABLE";
      case "expenses":        return "EXPENSES";
      case "payablesNonTrade":return "NON-TRADE PAYABLES";
      default:                return "METRICS";
    }
  };

  // Derive filtered + paginated data
  const filteredBreakdown = supplierSearch
    ? supplierMonthlyBreakdown.filter((r) =>
        r.supplierName.toLowerCase().includes(supplierSearch.toLowerCase())
      )
    : supplierMonthlyBreakdown;

  const visibleRows = filteredBreakdown.slice(0, visibleCount);
  const hasMore = visibleCount < filteredBreakdown.length;
  const remaining = filteredBreakdown.length - visibleCount;
  const filteredLength = filteredBreakdown.length;

  // Load more handler — plain function, no useCallback to avoid memoization conflicts
  function loadMore() {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    setTimeout(() => {
      setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, filteredLength));
      setIsLoadingMore(false);
    }, 300);
  }

  // IntersectionObserver — re-subscribes whenever sentinel mounts/unmounts
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingMore && hasMore) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMore, isLoadingMore, filteredLength]);

  return (
    <div className="space-y-6">
      {/* 1. VISUALIZATION AND YTD HEADER STRIP */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Trend Line Chart */}
        <Card className="lg:col-span-8 shadow-2xl border-border/40 bg-card/40 backdrop-blur-xl overflow-hidden group">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border/40 bg-muted/10">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-black uppercase tracking-tight italic">
                  Monthly Trend: <span className="text-primary">{getCategoryLabel(drillDownCategory)}</span>
                </CardTitle>
                <Badge variant="secondary" className="text-[8px] font-black tracking-widest uppercase px-1.5 h-4">
                  Bezier Curve
                </Badge>
              </div>
              <CardDescription className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
                Yearly trajectory for active drill-down selection
              </CardDescription>
            </div>
            <div className="p-1.5 bg-background rounded-xl border border-border/40 group-hover:border-primary/40 transition-colors shadow-sm">
              <Presentation className="h-4 w-4 text-primary opacity-60" />
            </div>
          </CardHeader>
          <CardContent className="h-[280px] pt-6 px-2">
            {loading && trendPoints.reduce((sum, p) => sum + p.amount, 0) === 0 ? (
              <div className="flex h-full items-center justify-center">
                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground animate-pulse">
                  Rendering trend spline...
                </span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendPoints} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.25} />
                  <XAxis
                    dataKey="month"
                    tick={{ fill: "hsl(var(--foreground))", fontWeight: 800, fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={(v) => formatShort(v)}
                    tick={{ fill: "hsl(var(--foreground))", fontWeight: 800, fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-background/95 backdrop-blur-xl border border-border/40 p-3 rounded-2xl shadow-2xl min-w-[140px]">
                            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">
                              {label}
                            </p>
                            <div className="flex justify-between items-center gap-4">
                              <span className="text-[10px] font-bold uppercase text-muted-foreground">Amount</span>
                              <span className="text-xs font-black text-primary italic">
                                {formatPHP(payload[0].value as number)}
                              </span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="amount"
                    stroke="hsl(var(--primary))"
                    strokeWidth={3}
                    dot={{ r: 4, strokeWidth: 1 }}
                    activeDot={{ r: 6, strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Year-To-Date Widget */}
        <Card className="lg:col-span-4 shadow-2xl border-border/40 bg-card/40 backdrop-blur-xl overflow-hidden flex flex-col justify-between group">
          <CardHeader className="border-b border-border/40 bg-muted/10">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-black uppercase tracking-tight italic">
                Year To Date <span className="text-primary">Performance</span>
              </CardTitle>
              <div className="p-1.5 bg-background rounded-xl border border-border/40 shadow-sm">
                <Trophy className="h-4 w-4 text-amber-500" />
              </div>
            </div>
            <CardDescription className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
              Aggregated YTD sum for the selected category
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-center p-6 gap-2">
            <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">
              {getCategoryLabel(drillDownCategory)} YTD
            </span>
            <span className="text-4xl font-black tracking-tighter text-foreground italic leading-none">
              {formatPHP(activeYtdTotal)}
            </span>
            <div className="mt-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl w-max">
              <TrendingUp className="h-3.5 w-3.5" />
              Ledger Synchronized
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 2. SUPPLIER MONTH-BY-MONTH GRID LEDGER — infinite scroll */}
      <Card className="shadow-2xl border-border/40 bg-card/40 backdrop-blur-xl overflow-hidden">
        <CardHeader className="border-b border-border/40 bg-muted/10">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div className="space-y-1">
              <CardTitle className="text-sm font-black uppercase tracking-tight italic">
                Monthly Breakdown Sheet:{" "}
                <span className="text-primary">{getCategoryLabel(drillDownCategory)}</span>
              </CardTitle>
              <CardDescription className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
                Complete month-by-month supplier and payee ledger audit
              </CardDescription>
            </div>

            {/* Right side: search + counters */}
            <div className="flex items-center gap-2 w-full sm:w-auto sm:min-w-[300px]">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <Input
                  id="supplier-search"
                  value={supplierSearch}
                  onChange={(e) => setSupplierSearch(e.target.value)}
                  placeholder="Search supplier / payee..."
                  className="pl-9 pr-9 h-8 text-[11px] font-bold uppercase tracking-wider placeholder:normal-case placeholder:font-normal placeholder:tracking-normal bg-background border-border/50 focus-visible:ring-primary/40"
                />
                {supplierSearch && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSupplierSearch("")}
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground hover:text-foreground"
                    aria-label="Clear search"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>

              {/* Pagination badge — always visible when data exists */}
              {filteredBreakdown.length > 0 && (
                <Badge
                  variant="outline"
                  className="text-[9px] font-black tracking-widest uppercase px-2 h-6 shrink-0 whitespace-nowrap border-border/50 text-muted-foreground"
                >
                  {visibleRows.length} / {filteredBreakdown.length}
                </Badge>
              )}

              {/* "X found" badge for search */}
              {supplierSearch && (
                <Badge
                  variant="secondary"
                  className="text-[9px] font-black tracking-widest uppercase px-2 h-6 shrink-0 whitespace-nowrap"
                >
                  {filteredBreakdown.length} found
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0 overflow-x-auto">
          {/* ── Empty states ── */}
          {supplierMonthlyBreakdown.length === 0 && (
            <div className="flex h-[120px] items-center justify-center">
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground italic">
                No monthly ledger lines found for selected criteria.
              </span>
            </div>
          )}

          {supplierMonthlyBreakdown.length > 0 && filteredBreakdown.length === 0 && (
            <div className="flex h-[120px] items-center justify-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground/40" />
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground italic">
                No supplier / payee matching &ldquo;{supplierSearch}&rdquo;
              </span>
            </div>
          )}

          {/* ── Data table ── */}
          {visibleRows.length > 0 && (
            <>
              <table className="w-full text-left border-separate border-spacing-0 min-w-[1000px]">
                <thead>
                  <tr className="bg-muted/10">
                    <th
                      className="p-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground sticky left-0 bg-card/95 backdrop-blur-sm z-30 border-b border-r border-border/30"
                      style={{ minWidth: "200px" }}
                    >
                      Supplier / Payee
                    </th>
                    {MONTHS_LIST.map((m) => (
                      <th
                        key={m}
                        className="p-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right border-b border-border/30"
                      >
                        {m}
                      </th>
                    ))}
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-red-500 text-right sticky right-0 bg-red-50/95 dark:bg-red-950/60 backdrop-blur-sm z-30 border-b border-l border-red-100 dark:border-red-900/50 shadow-[-4px_0_8px_rgba(0,0,0,0.02)]">
                      Year Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {visibleRows.map((row, idx) => (
                    <tr
                      key={idx}
                      className={`group transition-colors duration-150 ${
                        idx % 2 === 0 ? "bg-transparent" : "bg-muted/5"
                      }`}
                    >
                      <td
                        className={`p-4 sticky left-0 z-20 border-b border-r border-border/20 transition-colors ${
                          idx % 2 === 0 ? "bg-card/95" : "bg-[#fcfcfd]/95 dark:bg-card/90"
                        } backdrop-blur-sm group-hover:bg-primary/[0.05]`}
                      >
                        <span className="text-[11px] font-black uppercase text-foreground/90 tracking-tight block">
                          {row.supplierName}
                        </span>
                      </td>
                      {MONTHS_LIST.map((m) => {
                        const val = row.months[m] || 0;
                        const isZero = Math.abs(val) < 0.01;
                        return (
                          <td
                            key={m}
                            className={`p-4 text-[10px] font-bold text-right italic tracking-tight border-b border-border/10 transition-colors group-hover:bg-primary/[0.02] ${
                              isZero
                                ? "text-muted-foreground/20 font-normal"
                                : val < 0
                                ? "text-red-500/90"
                                : "text-foreground/70"
                            }`}
                          >
                            {isZero ? "₱0" : formatShort(val)}
                          </td>
                        );
                      })}
                      <td
                        className={`p-4 text-[11px] font-black text-right text-red-600 italic sticky right-0 z-20 border-b border-l border-red-100/50 shadow-[-4px_0_8px_rgba(0,0,0,0.02)] transition-colors backdrop-blur-sm group-hover:bg-red-100/40 dark:group-hover:bg-red-900/30 ${
                          idx % 2 === 0
                            ? "bg-red-50/50 dark:bg-red-950/30"
                            : "bg-red-50/80 dark:bg-red-950/50"
                        }`}
                      >
                        {formatShort(row.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* ── Infinite scroll sentinel + footer strip ── */}
              <div className="border-t border-border/20 bg-muted/5">
                {/* Sentinel element — observed by IntersectionObserver */}
                <div ref={sentinelRef} className="h-1" />

                {isLoadingMore && (
                  <div className="flex items-center justify-center gap-2 py-4">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground animate-pulse">
                      Loading more rows...
                    </span>
                  </div>
                )}

                {!isLoadingMore && hasMore && (
                  <div className="flex items-center justify-between px-4 py-3 gap-4">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Showing{" "}
                      <span className="text-foreground font-black">{visibleRows.length}</span>
                      {" "}of{" "}
                      <span className="text-foreground font-black">{filteredBreakdown.length}</span>
                      {" "}suppliers
                      {remaining > 0 && (
                        <span className="text-primary font-black ml-1">
                          (+{remaining} more)
                        </span>
                      )}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={loadMore}
                      className="h-7 text-[10px] font-black uppercase tracking-widest gap-1.5 border-border/50 hover:border-primary/50 hover:text-primary transition-colors"
                    >
                      <ChevronsDown className="h-3.5 w-3.5" />
                      Load More
                    </Button>
                  </div>
                )}

                {!hasMore && filteredBreakdown.length > PAGE_SIZE && (
                  <div className="flex items-center justify-center gap-2 py-3">
                    <div className="h-px w-8 bg-border/40 rounded" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">
                      All {filteredBreakdown.length} records loaded
                    </span>
                    <div className="h-px w-8 bg-border/40 rounded" />
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
