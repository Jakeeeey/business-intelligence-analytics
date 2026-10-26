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
  CompanyOvertimeSummary,
  DailyOtTrendPoint,
  StatusDistributionSegment,
  EmployeeOvertimeSummary,
} from "../types";
import { Trophy, TrendingUp, Building2, PieChart as PieIcon, Clock } from "lucide-react";

interface OvertimeChartsProps {
  companySummaries: CompanyOvertimeSummary[];
  statusDistribution: StatusDistributionSegment[];
  dailyTrends: DailyOtTrendPoint[];
  topEmployees: EmployeeOvertimeSummary[];
  onViewEmployee?: (emp: EmployeeOvertimeSummary) => void;
  onSelectRankings?: () => void;
}

const emptySubscribe = () => () => {};

export function OvertimeCharts({
  companySummaries,
  statusDistribution,
  dailyTrends,
  topEmployees,
  onViewEmployee,
  onSelectRankings,
}: OvertimeChartsProps) {
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
      Requests: c.totalOtRequests,
    }))
    .sort((a, b) => b.ApprovedHours - a.ApprovedHours);

  // 2. Line Chart Daily Trend Data
  const trendData = dailyTrends.slice(-14).map((d) => ({
    date: d.displayDate,
    ApprovedHours: d.approvedOtHours,
    TotalHours: d.totalOtHours,
    Requests: d.otRequestsCount,
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      {/* Chart 1: Overtime By Subsidiary (6 cols) */}
      <Card className="lg:col-span-6 rounded-2xl border-border/70 shadow-sm bg-card flex flex-col">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold tracking-tight text-foreground flex items-center gap-2">
                <Building2 className="h-4 w-4 text-indigo-500" />
                Overtime Hours by Subsidiary
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Comparison of approved overtime hours vs total requested
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 pb-4 pt-2">
          {companyBarData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-xs text-muted-foreground">
              No company overtime activity logged.
            </div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={companyBarData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11 }}
                    interval={0}
                    angle={-25}
                    textAnchor="end"
                  />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      borderColor: "hsl(var(--border))",
                      borderRadius: "0.75rem",
                      fontSize: "12px",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    }}
                    formatter={(val: unknown, name: unknown) => [
                      `${val ?? 0} hrs`,
                      name === "ApprovedHours" ? "Approved Overtime" : "Total Requested",
                    ]}
                  />
                  <Bar
                    dataKey="ApprovedHours"
                    name="ApprovedHours"
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={32}
                  />
                  <Bar
                    dataKey="TotalHours"
                    name="TotalHours"
                    fill="#6366f1"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={32}
                    opacity={0.4}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Chart 2: Daily Overtime Trend (6 cols) */}
      <Card className="lg:col-span-6 rounded-2xl border-border/70 shadow-sm bg-card flex flex-col">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold tracking-tight text-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-teal-500" />
                Daily Overtime Trend (Hours)
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Daily timeline of approved and requested overtime hours
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 pb-4 pt-2">
          {trendData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-xs text-muted-foreground">
              No timeline trends available for the current date selection.
            </div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      borderColor: "hsl(var(--border))",
                      borderRadius: "0.75rem",
                      fontSize: "12px",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    }}
                    formatter={(val: unknown, name: unknown) => [
                      `${val ?? 0} hrs`,
                      name === "ApprovedHours" ? "Approved OT" : "Total Filed",
                    ]}
                  />
                  <Line
                    type="monotone"
                    dataKey="ApprovedHours"
                    name="ApprovedHours"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: "#10b981" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="TotalHours"
                    name="TotalHours"
                    stroke="#6366f1"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Chart 3: Request Status Breakdown (5 cols) */}
      <Card className="lg:col-span-5 rounded-2xl border-border/70 shadow-sm bg-card flex flex-col">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold tracking-tight text-foreground flex items-center gap-2">
            <PieIcon className="h-4 w-4 text-purple-500" />
            Overtime Request Status
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground mt-0.5">
            Distribution across approved, pending, and rejected
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 pb-4 pt-2">
          <div className="h-52 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusDistribution}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={4}
                >
                  {statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    borderColor: "hsl(var(--border))",
                    borderRadius: "0.75rem",
                    fontSize: "12px",
                  }}
                  formatter={(val: unknown, name: unknown) => [
                    `${val ?? 0} filings`,
                    String(name || ""),
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-border/50 text-center">
            {statusDistribution.map((s) => (
              <div key={s.name} className="p-1.5 rounded-lg bg-muted/40">
                <div className="flex items-center justify-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
                  {s.name}
                </div>
                <p className="text-xs font-bold text-foreground mt-0.5 tabular-nums">
                  {s.count} ({s.percentage}%)
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Chart 4: Top Overtime Contributors Leaderboard (7 cols) */}
      <Card className="lg:col-span-7 rounded-2xl border-border/70 shadow-sm bg-card flex flex-col">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold tracking-tight text-foreground flex items-center gap-2">
                <Trophy className="h-4 w-4 text-amber-500" />
                Top Overtime Renderers
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Highest approved overtime hours in the selected period
              </CardDescription>
            </div>
            {onSelectRankings ? (
              <button
                type="button"
                onClick={onSelectRankings}
                className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-500/25 transition-colors cursor-pointer"
              >
                View Full Rankings →
              </button>
            ) : (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                Leaderboard
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex-1 pb-4 pt-1">
          {topEmployees.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-xs text-muted-foreground">
              No employee overtime records found for this timeframe.
            </div>
          ) : (
            <div className="space-y-2.5">
              {topEmployees.map((emp, idx) => (
                <div
                  key={`${emp.companyId}-${emp.userId}`}
                  onClick={() => onViewEmployee && onViewEmployee(emp)}
                  className={`flex items-center justify-between p-2.5 rounded-xl border border-border/60 bg-muted/20 transition-all ${
                    onViewEmployee ? "cursor-pointer hover:bg-muted/60 hover:border-amber-500/40" : ""
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        idx === 0
                          ? "bg-amber-500 text-white"
                          : idx === 1
                          ? "bg-slate-400 text-white"
                          : idx === 2
                          ? "bg-amber-700 text-white"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-foreground truncate">
                        {emp.name}
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {emp.position} • {emp.companyCode}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                      <Clock className="h-3 w-3" />
                      {emp.approvedOtHours.toFixed(1)} hrs
                    </span>
                    <p className="text-[10px] text-muted-foreground">
                      {emp.approvedOtRequests} approved ({emp.approvalRate}%)
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
