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
  CompanyEvaluationSummary,
  DepartmentEvaluationSummary,
  RatingBandDistributionSegment,
  EvalTypeDistributionSegment,
  EvaluationTrendPoint,
  KpiCategoryPerformance,
} from "../types";
import {
  Building2,
  TrendingUp,
  PieChart as PieIcon,
  Award,
  Layers,
} from "lucide-react";

interface EvaluationChartsProps {
  companySummaries: CompanyEvaluationSummary[];
  departmentSummaries: DepartmentEvaluationSummary[];
  ratingDistribution: RatingBandDistributionSegment[];
  typeDistribution: EvalTypeDistributionSegment[];
  categoryPerformance: KpiCategoryPerformance[];
  trends: EvaluationTrendPoint[];
}

const emptySubscribe = () => () => {};

export function EvaluationCharts({
  companySummaries,
  departmentSummaries,
  ratingDistribution,
  typeDistribution,
  categoryPerformance,
  trends,
}: EvaluationChartsProps) {
  const isMounted = React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  if (!isMounted) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="h-72 rounded-2xl border border-border bg-card animate-pulse" />
        <div className="h-72 rounded-2xl border border-border bg-card animate-pulse" />
      </div>
    );
  }

  // 1. Company Bar Data
  const companyBarData = companySummaries
    .filter((c) => c.totalEvaluations > 0)
    .map((c) => ({
      name: c.companyCode,
      fullName: c.companyName,
      AvgScore: c.avgScore,
      PassRate: c.passRate,
      Total: c.totalEvaluations,
    }));

  // 2. Department Bar Data
  const deptBarData = departmentSummaries.slice(0, 7).map((d) => ({
    name: d.department.length > 15 ? `${d.department.slice(0, 13)}…` : d.department,
    fullName: d.department,
    AvgScore: d.avgScore,
    Total: d.totalEvaluations,
  }));

  // 3. Trends Data
  const trendData = trends.map((t) => ({
    name: t.displayDate,
    Total: t.totalCount,
    AvgScore: t.avgScore,
    Passed: t.passCount,
  }));

  // 4. Competency Bar Data
  const compBarData = categoryPerformance.slice(0, 6).map((cp) => ({
    name: cp.category.length > 18 ? `${cp.category.slice(0, 16)}…` : cp.category,
    fullName: cp.category,
    Rating: cp.avgRating,
    Weight: cp.avgWeight,
  }));

  return (
    <div className="space-y-4">
      {/* Top Visualizations Row: Company Comparison & Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Chart 1: Company Performance Comparison */}
        <Card className="border-border bg-card shadow-xs rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              Intercompany Evaluation Mean Scores
            </CardTitle>
            <CardDescription className="text-xs">
              Average appraisal score (out of 100) across operating entities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              {companyBarData.length === 0 ? (
                <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                  No evaluation records logged across operating entities yet.
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
                      domain={[0, 100]}
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
                            <p className="text-primary font-semibold">
                              Average Score: {item.AvgScore}%
                            </p>
                            <p className="text-emerald-600 dark:text-emerald-400 font-semibold">
                              Pass Rate: {item.PassRate}%
                            </p>
                            <p className="text-muted-foreground font-mono">
                              Total Evaluations: {item.Total}
                            </p>
                          </div>
                        );
                      }}
                    />
                    <Bar
                      dataKey="AvgScore"
                      name="Average Score"
                      fill="#3b82f6"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={44}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Chart 2: Monthly Appraisal Volume & Score Trajectory */}
        <Card className="border-border bg-card shadow-xs rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              Monthly Appraisal Score Trajectory
            </CardTitle>
            <CardDescription className="text-xs">
              Evaluation volume vs. average appraisal score over the last 6 months
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
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
                    domain={[0, 100]}
                    tick={{ fontSize: 11 }}
                    stroke="currentColor"
                    className="text-muted-foreground"
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      return (
                        <div className="rounded-xl border border-border bg-popover/95 backdrop-blur-md p-3 shadow-xl text-xs space-y-1">
                          <p className="font-bold text-foreground">{label}</p>
                          {payload.map((entry, idx) => (
                            <p
                              key={idx}
                              style={{ color: entry.color }}
                              className="font-semibold"
                            >
                              {entry.name}: {entry.value}
                            </p>
                          ))}
                        </div>
                      );
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="AvgScore"
                    name="Avg Score (%)"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: "#10b981" }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="Total"
                    name="Evaluations Count"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={{ r: 3, fill: "#8b5cf6" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Visualizations Row: Rating Bands, Eval Types, Competency Performance */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Chart 3: Rating Band Distribution */}
        <Card className="border-border bg-card shadow-xs rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Award className="h-4 w-4 text-amber-500" />
              Rating Band Tiers
            </CardTitle>
            <CardDescription className="text-xs">
              Employee performance distribution across rating bands
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-56 w-full flex items-center justify-center">
              {ratingDistribution.every((r) => r.count === 0) ? (
                <div className="text-xs text-muted-foreground">No data available</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={ratingDistribution}
                      dataKey="count"
                      nameKey="band"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={2}
                    >
                      {ratingDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const item = payload[0].payload as RatingBandDistributionSegment;
                        return (
                          <div className="rounded-xl border border-border bg-popover/95 backdrop-blur-md p-2.5 shadow-xl text-xs space-y-0.5">
                            <p className="font-bold text-foreground">{item.band}</p>
                            <p className="text-muted-foreground">
                              {item.count} employees ({item.percentage}%)
                            </p>
                          </div>
                        );
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            {/* Rating legend */}
            <div className="grid grid-cols-2 gap-1.5 pt-2 text-[11px] text-muted-foreground border-t border-border">
              {ratingDistribution.map((r, i) => (
                <div key={i} className="flex items-center gap-1.5 truncate">
                  <span
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: r.color }}
                  />
                  <span className="truncate">{r.band}</span>
                  <span className="font-mono font-bold text-foreground ml-auto">
                    {r.percentage}%
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Chart 4: Evaluation Type Breakdown */}
        <Card className="border-border bg-card shadow-xs rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <PieIcon className="h-4 w-4 text-purple-500" />
              Appraisal Cycle Periods
            </CardTitle>
            <CardDescription className="text-xs">
              Breakdown by probationary milestones and review cycles
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-56 w-full flex items-center justify-center">
              {typeDistribution.length === 0 ? (
                <div className="text-xs text-muted-foreground">No data available</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={typeDistribution}
                      dataKey="count"
                      nameKey="type"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={3}
                    >
                      {typeDistribution.map((entry, index) => (
                        <Cell key={`type-cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const item = payload[0].payload as EvalTypeDistributionSegment;
                        return (
                          <div className="rounded-xl border border-border bg-popover/95 backdrop-blur-md p-2.5 shadow-xl text-xs space-y-0.5">
                            <p className="font-bold text-foreground">{item.type}</p>
                            <p className="text-muted-foreground">
                              {item.count} evaluations ({item.percentage}%)
                            </p>
                          </div>
                        );
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            {/* Type legend */}
            <div className="grid grid-cols-2 gap-1.5 pt-2 text-[11px] text-muted-foreground border-t border-border">
              {typeDistribution.slice(0, 4).map((t, i) => (
                <div key={i} className="flex items-center gap-1.5 truncate">
                  <span
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: t.color }}
                  />
                  <span className="truncate">{t.type}</span>
                  <span className="font-mono font-bold text-foreground ml-auto">
                    {t.percentage}%
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Chart 5: Core KPI Competency Performance */}
        <Card className="border-border bg-card shadow-xs rounded-2xl md:col-span-2 lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Layers className="h-4 w-4 text-cyan-500" />
              Competency Ratings
            </CardTitle>
            <CardDescription className="text-xs">
              Performance by criteria category snapshots
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-56 w-full">
              {compBarData.length === 0 ? (
                <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                  {deptBarData.length === 0
                    ? "No criteria performance logged yet"
                    : "Department Mean Scores"}
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={compBarData}
                    layout="vertical"
                    margin={{ top: 5, right: 15, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis type="number" domain={[0, 5]} tick={{ fontSize: 10 }} stroke="currentColor" />
                    <YAxis
                      dataKey="name"
                      type="category"
                      tick={{ fontSize: 10 }}
                      width={80}
                      stroke="currentColor"
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const item = payload[0].payload;
                        return (
                          <div className="rounded-xl border border-border bg-popover/95 backdrop-blur-md p-2.5 shadow-xl text-xs space-y-0.5">
                            <p className="font-bold text-foreground">{item.fullName}</p>
                            <p className="text-primary font-semibold">
                              Average Rating: {item.Rating} / 5.0
                            </p>
                            <p className="text-muted-foreground">
                              Average Weight: {item.Weight}%
                            </p>
                          </div>
                        );
                      }}
                    />
                    <Bar
                      dataKey="Rating"
                      fill="#06b6d4"
                      radius={[0, 6, 6, 0]}
                      maxBarSize={16}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="pt-2 text-center text-[11px] text-muted-foreground border-t border-border">
              5-point rating scale across core criteria categories
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

