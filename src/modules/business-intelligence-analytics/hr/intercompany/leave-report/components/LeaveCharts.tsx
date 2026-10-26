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
  LineChart,
  Line,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  CompanyLeaveOtSummary,
  DailyOtTrendPoint,
  StatusDistributionSegment,
  EmployeeLeaveAndOtSummary,
} from "../types";
import { Trophy, TrendingUp, Building2, PieChart as PieIcon, Clock } from "lucide-react";

interface LeaveChartsProps {
  companySummaries: CompanyLeaveOtSummary[];
  statusDistribution: StatusDistributionSegment[];
  dailyTrends: DailyOtTrendPoint[];
  topEmployees: EmployeeLeaveAndOtSummary[];
}

const emptySubscribe = () => () => {};

export function LeaveCharts({
  companySummaries,
  statusDistribution,
  dailyTrends,
  topEmployees,
}: LeaveChartsProps) {
  const isMounted = React.useSyncExternalStore(emptySubscribe, () => true, () => false);

  if (!isMounted) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="h-72 rounded-2xl border border-border bg-card animate-pulse" />
        <div className="h-72 rounded-2xl border border-border bg-card animate-pulse" />
        <div className="h-72 rounded-2xl border border-border bg-card animate-pulse" />
      </div>
    );
  }

  // 1. Company Comparison Bar Data
  const companyBarData = companySummaries
    .filter((c) => c.totalEmployees > 0)
    .map((c) => ({
      name: c.companyCode,
      fullName: c.companyName,
      ApprovedHours: c.approvedOtHours,
      TotalHours: c.totalOtHours,
      ApprovedRequests: c.approvedOtRequests,
      LeaveDays: c.approvedLeaveDays,
    }));

  // 2. Daily Trends
  const trendData = dailyTrends.map((d) => ({
    name: d.displayDate,
    ApprovedOtHours: d.approvedOtHours,
    TotalOtHours: d.totalOtHours,
    OtRequests: d.otRequestsCount,
    LeaveRequests: d.leaveRequestsCount,
  }));

  const topOtRenderers = topEmployees.slice(0, 6);

  return (
    <div className="space-y-4">
      {/* Top Charts: Company OT Comparison & Daily Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Chart 1: Company OT Comparison */}
        <Card className="border-border bg-card shadow-xs rounded-2xl">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-cyan-500" />
                  Intercompany Approved Overtime Comparison
                </CardTitle>
                <CardDescription className="text-xs">
                  Approved overtime hours authorized per subsidiary entity
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
                    tick={{ fontSize: 11 }}
                    stroke="currentColor"
                    className="text-muted-foreground"
                    unit="h"
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const item = payload[0].payload;
                      return (
                        <div className="rounded-xl border border-border bg-popover/95 backdrop-blur-md p-3 shadow-xl text-xs space-y-1">
                          <p className="font-bold text-foreground">{item.fullName} ({item.name})</p>
                          <p className="text-emerald-600 dark:text-emerald-400 font-semibold">
                            Approved OT: {item.ApprovedHours} hrs ({item.ApprovedRequests} reqs)
                          </p>
                          <p className="text-muted-foreground">
                            Total Filed: {item.TotalHours} hrs
                          </p>
                          <p className="text-purple-600 dark:text-purple-400">
                            Approved Leaves: {item.LeaveDays} days
                          </p>
                        </div>
                      );
                    }}
                  />
                  <Bar
                    dataKey="ApprovedHours"
                    name="Approved OT Hours"
                    fill="#06b6d4"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={44}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Chart 2: Daily OT Trend */}
        <Card className="border-border bg-card shadow-xs rounded-2xl">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                  Daily Overtime Filing Trend
                </CardTitle>
                <CardDescription className="text-xs">
                  Hours rendered and approved over the specified timeframe
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
                    tick={{ fontSize: 11 }}
                    stroke="currentColor"
                    className="text-muted-foreground"
                    unit="h"
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const item = payload[0].payload;
                      return (
                        <div className="rounded-xl border border-border bg-popover/95 backdrop-blur-md p-3 shadow-xl text-xs space-y-1">
                          <p className="font-bold text-foreground">Date: {item.name}</p>
                          <p className="text-emerald-600 dark:text-emerald-400 font-semibold">
                            Approved OT: {item.ApprovedOtHours} hrs
                          </p>
                          <p className="text-muted-foreground">
                            Filed OT: {item.TotalOtHours} hrs ({item.OtRequests} reqs)
                          </p>
                          <p className="text-purple-600 dark:text-purple-400">
                            Leaves Filed: {item.LeaveRequests}
                          </p>
                        </div>
                      );
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="ApprovedOtHours"
                    name="Approved OT Hours"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: "#10b981" }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row: Status Distribution & Overtime Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Chart 3: Request Status Distribution Donut */}
        <Card className="border-border bg-card shadow-xs rounded-2xl lg:col-span-1">
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <PieIcon className="h-4 w-4 text-purple-500" />
              Approval Status
            </CardTitle>
            <CardDescription className="text-xs">
              Overtime & leave requests approval breakdown
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-52 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusDistribution.filter((d) => d.count > 0)}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                  >
                    {statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val, name, item) => [
                      `${val} requests (${item.payload.percentage}%)`,
                      name,
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs pt-1 border-t border-border/60">
              {statusDistribution.map((d) => (
                <div key={d.name} className="flex flex-col items-center text-center">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: d.color }}
                    />
                    <span className="text-muted-foreground text-[10px]">{d.name}</span>
                  </div>
                  <span className="font-bold text-foreground text-xs mt-0.5 tabular-nums">
                    {d.count} ({d.percentage}%)
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Panel: Overtime Leaderboard */}
        <Card className="border-border bg-card shadow-xs rounded-2xl lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-amber-500" />
                  Top Overtime Renderers
                </CardTitle>
                <CardDescription className="text-xs">
                  Personnel with the highest authorized overtime hours
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {topOtRenderers.length === 0 ? (
                <p className="text-xs text-muted-foreground col-span-2 py-6 text-center">
                  No overtime hours recorded for the selected period.
                </p>
              ) : (
                topOtRenderers.map((emp, idx) => (
                  <div
                    key={emp.userId}
                    className="flex items-center gap-3 p-2.5 rounded-xl border border-border/70 bg-muted/20 hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-bold text-xs">
                      #{idx + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-bold text-foreground truncate">{emp.name}</p>
                        <span className="text-[10px] font-mono px-1 rounded bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                          {emp.companyCode}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {emp.position} • {emp.department}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 tabular-nums flex items-center justify-end gap-1">
                        <Clock className="h-3 w-3 text-cyan-500" />
                        {emp.approvedOtHours} hrs
                      </span>
                      <p className="text-[10px] text-muted-foreground tabular-nums">
                        {emp.approvedOtRequests} approved reqs
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
