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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  CompanyConcernsSummary,
  DepartmentConcernsSummary,
  ConcernDistributionSegment,
  ConcernTrendPoint,
} from "../types";
import { Building2, Layers, PieChart as PieIcon, TrendingUp, Tag } from "lucide-react";

interface ConcernsChartsProps {
  companySummaries: CompanyConcernsSummary[];
  departmentSummaries: DepartmentConcernsSummary[];
  statusDistribution: ConcernDistributionSegment[];
  categoryDistribution: ConcernDistributionSegment[];
  trends: ConcernTrendPoint[];
}

const emptySubscribe = () => () => {};

export function ConcernsCharts({
  companySummaries,
  departmentSummaries,
  statusDistribution,
  categoryDistribution,
  trends,
}: ConcernsChartsProps) {
  const isMounted = React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  if (!isMounted) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="h-72 rounded-2xl border border-border bg-card animate-pulse" />
        <div className="h-72 rounded-2xl border border-border bg-card animate-pulse" />
        <div className="h-72 rounded-2xl border border-border bg-card animate-pulse" />
      </div>
    );
  }

  // 1. Company Bar Data
  const companyBarData = companySummaries
    .filter((c) => c.totalConcerns > 0)
    .map((c) => ({
      name: c.companyCode,
      fullName: c.companyName,
      Pending: c.pendingCount,
      InReview: c.inReviewCount,
      Resolved: c.resolvedCount,
      Closed: c.closedCount,
      Total: c.totalConcerns,
    }));

  // 2. Department Bar Data
  const deptBarData = departmentSummaries.slice(0, 8).map((d) => ({
    name: d.department.length > 16 ? `${d.department.slice(0, 14)}…` : d.department,
    fullName: d.department,
    Total: d.totalConcerns,
    Pending: d.pendingCount,
    Resolved: d.resolvedCount,
  }));

  // 3. Trends Data
  const trendData = trends.map((t) => ({
    name: t.displayDate,
    Total: t.totalCount,
    Pending: t.pendingCount,
    Resolved: t.resolvedCount,
  }));

  return (
    <div className="space-y-4">
      {/* Top Visualizations Row: Intercompany Comparison & Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Chart 1: Company Concerns Breakdown */}
        <Card className="border-border bg-card shadow-xs rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Building2 className="h-4 w-4 text-amber-500" />
              Intercompany Concerns by Status
            </CardTitle>
            <CardDescription className="text-xs">
              Pending, in-review, and resolved concerns across operating entities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              {companyBarData.length === 0 ? (
                <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                  No concern records logged across operating entities yet.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={companyBarData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
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
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const item = payload[0].payload;
                        return (
                          <div className="rounded-xl border border-border bg-popover/95 backdrop-blur-md p-3 shadow-xl text-xs space-y-1">
                            <p className="font-bold text-foreground">
                              {item.fullName} ({item.name})
                            </p>
                            <p className="text-amber-600 dark:text-amber-400 font-semibold">
                              Pending: {item.Pending} | In-Review: {item.InReview}
                            </p>
                            <p className="text-emerald-600 dark:text-emerald-400 font-semibold">
                              Resolved: {item.Resolved} | Closed: {item.Closed}
                            </p>
                            <p className="text-muted-foreground font-mono">
                              Total: {item.Total} concerns
                            </p>
                          </div>
                        );
                      }}
                    />
                    <Bar
                      dataKey="Pending"
                      stackId="status"
                      name="Pending"
                      fill="#f59e0b"
                      maxBarSize={44}
                    />
                    <Bar
                      dataKey="InReview"
                      stackId="status"
                      name="In Review"
                      fill="#3b82f6"
                      maxBarSize={44}
                    />
                    <Bar
                      dataKey="Resolved"
                      stackId="status"
                      name="Resolved"
                      fill="#10b981"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={44}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Chart 2: Submission Trend Timeline */}
        <Card className="border-border bg-card shadow-xs rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-cyan-500" />
              Submission Trend Timeline
            </CardTitle>
            <CardDescription className="text-xs">
              Daily volume of submitted vs resolved employee grievances
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              {trendData.length === 0 ? (
                <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                  No timeline data recorded yet.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={trendData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
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
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const item = payload[0].payload;
                        return (
                          <div className="rounded-xl border border-border bg-popover/95 backdrop-blur-md p-3 shadow-xl text-xs space-y-1">
                            <p className="font-bold text-foreground">Date: {item.name}</p>
                            <p className="text-foreground">
                              Total Submitted: {item.Total}
                            </p>
                            <p className="text-amber-600 dark:text-amber-400">
                              Pending: {item.Pending}
                            </p>
                            <p className="text-emerald-600 dark:text-emerald-400">
                              Resolved: {item.Resolved}
                            </p>
                          </div>
                        );
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="Total"
                      name="Total Concerns"
                      stroke="#06b6d4"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: "#06b6d4" }}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="Resolved"
                      name="Resolved"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={{ r: 3, fill: "#10b981" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row: Status Donut, Category Donut & Department Ranking */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Chart 3: Status Breakdown Donut */}
        <Card className="border-border bg-card shadow-xs rounded-2xl">
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <PieIcon className="h-4 w-4 text-amber-500" />
              Status Breakdown
            </CardTitle>
            <CardDescription className="text-xs">
              Current operational state of all concerns
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-48 w-full flex items-center justify-center">
              {statusDistribution.length === 0 ? (
                <span className="text-xs text-muted-foreground">No data</span>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusDistribution.filter((d) => d.count > 0)}
                      dataKey="count"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={68}
                      paddingAngle={3}
                    >
                      {statusDistribution.map((entry, index) => (
                        <Cell key={`status-cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val, name, item) => [
                        `${val} concerns (${item.payload.percentage}%)`,
                        name,
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-border/60">
              {statusDistribution.map((s) => (
                <div key={s.name} className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: s.color }}
                  />
                  <span className="text-muted-foreground text-[11px] truncate">{s.name}</span>
                  <span className="font-semibold text-foreground text-[11px] ml-auto tabular-nums">
                    {s.count} ({s.percentage}%)
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Chart 4: Category Distribution Donut */}
        <Card className="border-border bg-card shadow-xs rounded-2xl">
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Tag className="h-4 w-4 text-cyan-500" />
              Concern Categories
            </CardTitle>
            <CardDescription className="text-xs">
              Classification by grievance topic
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-48 w-full flex items-center justify-center">
              {categoryDistribution.length === 0 ? (
                <span className="text-xs text-muted-foreground">No data</span>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryDistribution.filter((d) => d.count > 0)}
                      dataKey="count"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={68}
                      paddingAngle={3}
                    >
                      {categoryDistribution.map((entry, index) => (
                        <Cell key={`category-cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val, name, item) => [
                        `${val} concerns (${item.payload.percentage}%)`,
                        name,
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-border/60">
              {categoryDistribution.map((c) => (
                <div key={c.name} className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: c.color }}
                  />
                  <span className="text-muted-foreground text-[11px] truncate">{c.name}</span>
                  <span className="font-semibold text-foreground text-[11px] ml-auto tabular-nums">
                    {c.count} ({c.percentage}%)
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Chart 5: Department Concerns Ranking */}
        <Card className="border-border bg-card shadow-xs rounded-2xl">
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Layers className="h-4 w-4 text-purple-500" />
              Department Concentration
            </CardTitle>
            <CardDescription className="text-xs">
              Departments with highest grievance volume
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-48 w-full">
              {deptBarData.length === 0 ? (
                <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                  No department records available.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={deptBarData}
                    layout="vertical"
                    margin={{ top: 5, right: 10, left: 10, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis type="number" tick={{ fontSize: 10 }} stroke="currentColor" className="text-muted-foreground" />
                    <YAxis
                      dataKey="name"
                      type="category"
                      tick={{ fontSize: 10 }}
                      stroke="currentColor"
                      className="text-muted-foreground"
                      width={80}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const item = payload[0].payload;
                        return (
                          <div className="rounded-xl border border-border bg-popover/95 backdrop-blur-md p-2.5 shadow-xl text-xs space-y-1">
                            <p className="font-bold text-foreground">{item.fullName}</p>
                            <p className="text-purple-600 dark:text-purple-400 font-semibold">
                              Total: {item.Total} concerns
                            </p>
                            <p className="text-muted-foreground">
                              Pending: {item.Pending} | Resolved: {item.Resolved}
                            </p>
                          </div>
                        );
                      }}
                    />
                    <Bar
                      dataKey="Total"
                      name="Total"
                      fill="#8b5cf6"
                      radius={[0, 4, 4, 0]}
                      maxBarSize={20}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="pt-2 border-t border-border/60 text-[11px] text-muted-foreground flex justify-between items-center px-1">
              <span>Top reported department:</span>
              <span className="font-semibold text-foreground truncate max-w-[150px]">
                {deptBarData[0]?.fullName || "None"}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

