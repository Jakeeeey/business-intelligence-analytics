"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TaggingDistributionItem,
  InactivityRangeDistribution,
  LostCustomerRecord,
} from "../types";

interface LostCustomerChartsProps {
  taggingDistribution: TaggingDistributionItem[];
  inactivityDistribution: InactivityRangeDistribution[];
  topAtRiskCustomers: LostCustomerRecord[];
  onSelectCustomer?: (customer: LostCustomerRecord) => void;
}

const PIE_COLORS = [
  "#ef4444", // red
  "#f97316", // orange
  "#f59e0b", // amber
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#10b981", // emerald
];

function formatPhp(amount: number): string {
  if (amount >= 1_000_000) {
    return `₱${(amount / 1_000_000).toFixed(2)}M`;
  }
  if (amount >= 1_000) {
    return `₱${(amount / 1_000).toFixed(1)}k`;
  }
  return `₱${amount.toLocaleString()}`;
}

function getInitials(name: string): string {
  if (!name) return "CU";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getRankBadge(idx: number) {
  if (idx === 0)
    return (
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-bold">
        1
      </span>
    );
  if (idx === 1)
    return (
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-300/40 text-slate-700 dark:text-slate-300 text-[10px] font-bold">
        2
      </span>
    );
  if (idx === 2)
    return (
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-700/20 text-amber-700 dark:text-amber-500 text-[10px] font-bold">
        3
      </span>
    );
  return (
    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-muted-foreground text-[10px] font-semibold">
      {idx + 1}
    </span>
  );
}

export function LostCustomerCharts({
  taggingDistribution,
  inactivityDistribution,
  topAtRiskCustomers,
  onSelectCustomer,
}: LostCustomerChartsProps) {
  const maxSales = topAtRiskCustomers[0]?.totalHistoricalSales || 1;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* 1. Inactivity Duration Distribution (Bar Chart) */}
      <Card className="border-border bg-card lg:col-span-2 shadow-xs">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold text-foreground">
                Inactivity Duration Distribution
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Distribution of dormant accounts by days elapsed without sales
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-[10px] px-2 py-0.5 text-muted-foreground border-border">
              Timeline Analysis
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={inactivityDistribution}
                margin={{ top: 10, right: 20, left: 0, bottom: 20 }}
              >
                <defs>
                  <linearGradient id="inactivityGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#f97316" stopOpacity={0.65} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-border/40"
                  vertical={false}
                />
                <XAxis
                  dataKey="range"
                  tick={{ fontSize: 11, fill: "currentColor" }}
                  className="text-muted-foreground"
                  tickLine={false}
                  axisLine={{ stroke: "var(--border)" }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "currentColor" }}
                  className="text-muted-foreground"
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  cursor={{ fill: "var(--muted)", opacity: 0.3 }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload as InactivityRangeDistribution;
                      return (
                        <div className="rounded-xl border border-border bg-popover/95 backdrop-blur-sm p-3 shadow-lg text-xs space-y-1">
                          <p className="font-bold text-foreground">
                            {data.range}
                          </p>
                          <div className="flex items-center justify-between gap-4 text-muted-foreground">
                            <span>Accounts:</span>
                            <span className="font-bold text-foreground">
                              {data.count}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-4 text-muted-foreground">
                            <span>Cumulative Value:</span>
                            <span className="font-bold text-primary">
                              {formatPhp(data.totalSales)}
                            </span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  dataKey="count"
                  name="Accounts"
                  fill="url(#inactivityGrad)"
                  radius={[8, 8, 0, 0]}
                  maxBarSize={44}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* 2. Account Tagging Distribution (Donut Chart) */}
      <Card className="border-border bg-card shadow-xs">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold text-foreground">
                Account Tagging
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Proportion by classification
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          {taggingDistribution.length > 0 ? (
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={taggingDistribution}
                    dataKey="count"
                    nameKey="tag"
                    cx="50%"
                    cy="45%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                  >
                    {taggingDistribution.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                        stroke="var(--background)"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload as TaggingDistributionItem;
                        return (
                          <div className="rounded-xl border border-border bg-popover/95 backdrop-blur-sm p-3 shadow-lg text-xs space-y-1">
                            <p className="font-bold text-foreground">
                              {data.tag}
                            </p>
                            <div className="flex items-center justify-between gap-4 text-muted-foreground">
                              <span>Accounts:</span>
                              <span className="font-bold text-foreground">
                                {data.count}
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-4 text-muted-foreground">
                              <span>Past Sales:</span>
                              <span className="font-bold text-primary">
                                {formatPhp(data.totalSales)}
                              </span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex h-[280px] items-center justify-center text-xs text-muted-foreground">
              No tagging distribution available
            </div>
          )}
        </CardContent>
      </Card>

      {/* 3. Top High-Value Accounts at Risk */}
      <Card className="border-border bg-card lg:col-span-3 shadow-xs">
        <CardHeader className="pb-3 border-b border-border/50">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold text-foreground">
                Top High-Value Accounts at Risk
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Critical revenue accounts showing prolonged inactivity — priority for re-engagement
              </CardDescription>
            </div>
            <span className="text-[11px] text-muted-foreground font-medium">
              Click account to inspect profile
            </span>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {topAtRiskCustomers.map((cust, idx) => {
              const pctOfMax = Math.round(
                (cust.totalHistoricalSales / maxSales) * 100
              );
              return (
                <div
                  key={cust.id}
                  onClick={() => onSelectCustomer?.(cust)}
                  className="group relative rounded-xl border border-border bg-card/60 p-3.5 shadow-2xs hover:border-primary/50 hover:bg-muted/40 hover:shadow-md transition-all cursor-pointer space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    {getRankBadge(idx)}
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 py-0 h-4 border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/10 font-semibold"
                    >
                      {cust.tagging}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-xs">
                      {getInitials(cust.customerName)}
                    </div>
                    <div className="min-w-0">
                      <p
                        className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors"
                        title={cust.customerName}
                      >
                        {cust.customerName}
                      </p>
                      <p className="text-[10px] font-mono text-muted-foreground">
                        {cust.customerCode}
                      </p>
                    </div>
                  </div>

                  {/* Relative value bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-muted-foreground">Past Sales</span>
                      <span className="font-bold text-foreground">
                        {formatPhp(cust.totalHistoricalSales)}
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        style={{ width: `${pctOfMax}%` }}
                        className="h-full bg-linear-to-r from-amber-500 to-red-500 rounded-full"
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-border/50 flex items-center justify-between text-xs">
                    <span className="text-[10px] text-muted-foreground">
                      Dormancy:
                    </span>
                    <span className="font-bold text-red-600 dark:text-red-400">
                      {cust.minDaysNoSales} days
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
