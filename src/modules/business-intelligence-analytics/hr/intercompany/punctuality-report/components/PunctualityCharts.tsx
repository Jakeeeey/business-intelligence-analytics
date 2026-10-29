"use client";

import React, { useState } from "react";
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
  LineChart,
  Line,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CompanyPunctualitySummary,
  DailyPunctualityTrendPoint,
  PunctualityDistributionSegment,
  PunctualityLeaderboardItem,
} from "../types";
import { Trophy, AlertOctagon, TrendingUp, Building2, Clock, CheckCircle2 } from "lucide-react";

interface PunctualityChartsProps {
  companySummaries: CompanyPunctualitySummary[];
  distribution: PunctualityDistributionSegment[];
  dailyTrends: DailyPunctualityTrendPoint[];
  topPunctual: PunctualityLeaderboardItem[];
  frequentLate: PunctualityLeaderboardItem[];
}

const emptySubscribe = () => () => {};

export function PunctualityCharts({
  companySummaries,
  distribution,
  dailyTrends,
  topPunctual,
  frequentLate,
}: PunctualityChartsProps) {
  const isMounted = React.useSyncExternalStore(emptySubscribe, () => true, () => false);
  const [leaderboardTab, setLeaderboardTab] = useState<"champions" | "delays">("champions");

  if (!isMounted) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="h-72 rounded-2xl border border-border bg-card animate-pulse" />
        <div className="h-72 rounded-2xl border border-border bg-card animate-pulse" />
        <div className="h-72 rounded-2xl border border-border bg-card animate-pulse" />
      </div>
    );
  }

  // 1. Company Rate Bar Data
  const companyBarData = companySummaries
    .filter((c) => c.totalLogs > 0)
    .map((c) => ({
      name: c.companyCode,
      fullName: c.companyName,
      Rate: c.punctualityRate,
      OnTime: c.onTimeCount,
      Late: c.totalLateCount,
      AvgDelay: c.avgDelayMinutes,
    }));

  // 2. Trend Data
  const trendData = dailyTrends.map((d) => ({
    name: d.displayDate,
    Rate: d.punctualityRate,
    AvgDelay: d.avgDelayMinutes,
    OnTime: d.onTimeCount,
    Late: d.lateCount,
  }));

  return (
    <div className="space-y-4">
      {/* Top Visualizations Row: Company Comparison & Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Chart 1: Company Punctuality Comparison */}
        <Card className="border-border bg-card shadow-xs rounded-2xl">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-cyan-500" />
                  Intercompany On-Time Rate Comparison
                </CardTitle>
                <CardDescription className="text-xs">
                  Punctuality compliance percentage across operating entities
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={companyBarData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11 }}
                    interval={0}
                    stroke="currentColor"
                    className="text-muted-foreground"
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 11 }}
                    stroke="currentColor"
                    className="text-muted-foreground"
                    unit="%"
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const item = payload[0].payload;
                      return (
                        <div className="rounded-xl border border-border bg-popover/95 backdrop-blur-md p-3 shadow-xl text-xs space-y-1">
                          <p className="font-bold text-foreground">{item.fullName} ({item.name})</p>
                          <p className="text-emerald-600 dark:text-emerald-400 font-semibold">
                            On-Time Rate: {item.Rate}%
                          </p>
                          <p className="text-muted-foreground">
                            On-Time: {item.OnTime} | Late: {item.Late}
                          </p>
                          <p className="text-amber-600 dark:text-amber-400">
                            Avg Delay: {item.AvgDelay} mins
                          </p>
                        </div>
                      );
                    }}
                  />
                  <Bar
                    dataKey="Rate"
                    name="On-Time Rate %"
                    fill="#10b981"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={44}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Chart 2: Daily Punctuality Trend */}
        <Card className="border-border bg-card shadow-xs rounded-2xl">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                  Daily Punctuality Trend
                </CardTitle>
                <CardDescription className="text-xs">
                  Fluctuation of on-time arrival rate throughout the selected period
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11 }}
                    stroke="currentColor"
                    className="text-muted-foreground"
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 11 }}
                    stroke="currentColor"
                    className="text-muted-foreground"
                    unit="%"
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const item = payload[0].payload;
                      return (
                        <div className="rounded-xl border border-border bg-popover/95 backdrop-blur-md p-3 shadow-xl text-xs space-y-1">
                          <p className="font-bold text-foreground">Date: {item.name}</p>
                          <p className="text-emerald-600 dark:text-emerald-400 font-semibold">
                            Punctuality Rate: {item.Rate}%
                          </p>
                          <p className="text-muted-foreground">
                            {item.OnTime} On-Time • {item.Late} Late
                          </p>
                          <p className="text-cyan-600 dark:text-cyan-400">
                            Avg Delay: {item.AvgDelay} mins
                          </p>
                        </div>
                      );
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="Rate"
                    name="Punctuality Rate %"
                    stroke="#06b6d4"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: "#06b6d4" }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row: Arrival Severity Breakdown & Leaderboards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Chart 3: Punctuality Breakdown Donut */}
        <Card className="border-border bg-card shadow-xs rounded-2xl lg:col-span-1">
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Clock className="h-4 w-4 text-purple-500" />
              Arrival Breakdown
            </CardTitle>
            <CardDescription className="text-xs">
              Distribution of check-in delays
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-52 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={distribution.filter((d) => d.count > 0)}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                  >
                    {distribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val, name, item) => [
                      `${val} arrivals (${item.payload.percentage}%)`,
                      name,
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Custom Legend */}
            <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border/60">
              {distribution.map((d) => (
                <div key={d.name} className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: d.color }}
                  />
                  <span className="text-muted-foreground text-[11px] truncate">{d.name}</span>
                  <span className="font-semibold text-foreground text-[11px] ml-auto tabular-nums">
                    {d.count} ({d.percentage}%)
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Panel: Punctuality Leaderboards */}
        <Card className="border-border bg-card shadow-xs rounded-2xl lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-amber-500" />
                  Punctuality Leaderboard
                </CardTitle>
                <CardDescription className="text-xs">
                  Notable personnel metrics across the organization
                </CardDescription>
              </div>

              <Tabs
                value={leaderboardTab}
                onValueChange={(v) => setLeaderboardTab(v as "champions" | "delays")}
                className="w-auto"
              >
                <TabsList className="h-8 bg-muted/60">
                  <TabsTrigger
                    value="champions"
                    className="text-xs h-7 gap-1.5 data-[state=active]:bg-background"
                  >
                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                    Champions
                  </TabsTrigger>
                  <TabsTrigger
                    value="delays"
                    className="text-xs h-7 gap-1.5 data-[state=active]:bg-background"
                  >
                    <AlertOctagon className="h-3 w-3 text-rose-500" />
                    Frequent Delays
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            {leaderboardTab === "champions" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {topPunctual.length === 0 ? (
                  <p className="text-xs text-muted-foreground col-span-2 py-4 text-center">
                    No data available for champions leaderboard.
                  </p>
                ) : (
                  topPunctual.map((u, idx) => (
                    <div
                      key={u.userId}
                      className="flex items-center gap-3 p-2.5 rounded-xl border border-border/70 bg-muted/20 hover:bg-muted/40 transition-colors"
                    >
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                        #{idx + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-bold text-foreground truncate">{u.name}</p>
                          <span className="text-[10px] font-mono px-1 rounded bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                            {u.companyCode}
                          </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {u.position} • {u.department}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                          {u.earliestArrival || "--:--"}
                        </span>
                        <p className="text-[10px] text-muted-foreground tabular-nums">
                          {u.maxEarlyMinutes && u.maxEarlyMinutes > 0
                            ? `${u.maxEarlyMinutes}m early`
                            : "On-Time"}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {frequentLate.length === 0 ? (
                  <p className="text-xs text-muted-foreground col-span-2 py-4 text-center">
                    Zero delayed arrivals recorded in this timeframe!
                  </p>
                ) : (
                  frequentLate.map((u, idx) => (
                    <div
                      key={u.userId}
                      className="flex items-center gap-3 p-2.5 rounded-xl border border-rose-500/20 bg-rose-500/5 dark:bg-rose-950/10 hover:bg-rose-500/10 transition-colors"
                    >
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-rose-500/15 text-rose-600 dark:text-rose-400 font-bold text-xs">
                        #{idx + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-bold text-foreground truncate">{u.name}</p>
                          <span className="text-[10px] font-mono px-1 rounded bg-rose-500/15 text-rose-600 dark:text-rose-400">
                            {u.companyCode}
                          </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {u.position} • {u.department}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                          +{u.avgDelayMinutes}m avg
                        </span>
                        <p className="text-[10px] text-muted-foreground tabular-nums">
                          {u.lateDays} lates
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
