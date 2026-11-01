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
  CompanyResignationSummary,
  DepartmentResignationSummary,
  ReasonDistributionSegment,
  NoticeDistributionSegment,
  ResignationTrendPoint,
} from "../types";
import {
  Building2,
  TrendingDown,
  PieChart as PieIcon,
  Clock,
  Layers,
} from "lucide-react";

interface ResignationChartsProps {
  companySummaries: CompanyResignationSummary[];
  departmentSummaries: DepartmentResignationSummary[];
  reasonDistribution: ReasonDistributionSegment[];
  noticeDistribution: NoticeDistributionSegment[];
  trends: ResignationTrendPoint[];
}

const emptySubscribe = () => () => {};

export function ResignationCharts({
  companySummaries,
  departmentSummaries,
  reasonDistribution,
  noticeDistribution,
  trends,
}: ResignationChartsProps) {
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
    .filter((c) => c.totalResignations > 0)
    .map((c) => ({
      name: c.companyCode,
      fullName: c.companyName,
      Pending: c.pendingCount,
      Processed: c.approvedCount + c.completedCount,
      Rejected: c.rejectedCount,
      Total: c.totalResignations,
      Turnover: c.turnoverRate,
    }));

  // 2. Department Bar Data
  const deptBarData = departmentSummaries.slice(0, 7).map((d) => ({
    name: d.department.length > 15 ? `${d.department.slice(0, 13)}…` : d.department,
    fullName: d.department,
    Total: d.totalResignations,
    Pending: d.pendingCount,
    Processed: d.approvedCount,
  }));

  // 3. Trends Data
  const trendData = trends.map((t) => ({
    name: t.displayDate,
    Total: t.totalCount,
    Pending: t.pendingCount,
    Processed: t.approvedCount,
  }));

  return (
    <div className="space-y-4">
      {/* Top Visualizations Row: Intercompany Comparison & Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Chart 1: Operating Companies Attrition Comparison */}
        <Card className="border-border bg-card shadow-xs rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              Intercompany Resignations by Status
            </CardTitle>
            <CardDescription className="text-xs">
              Pending review, processed, and rejected resignations across operating entities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              {companyBarData.length === 0 ? (
                <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                  No resignation records filed across operating entities yet.
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
                              Pending: {item.Pending}
                            </p>
                            <p className="text-emerald-600 dark:text-emerald-400 font-semibold">
                              Processed: {item.Processed}
                            </p>
                            {item.Rejected > 0 && (
                              <p className="text-red-500 font-semibold">
                                Rejected: {item.Rejected}
                              </p>
                            )}
                            <p className="text-muted-foreground font-mono">
                              Total: {item.Total} (Turnover: {item.Turnover}%)
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
                      dataKey="Processed"
                      stackId="status"
                      name="Processed"
                      fill="#10b981"
                      maxBarSize={44}
                    />
                    <Bar
                      dataKey="Rejected"
                      stackId="status"
                      name="Rejected"
                      fill="#ef4444"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={44}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Chart 2: 6-Month Resignation Timeline */}
        <Card className="border-border bg-card shadow-xs rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-purple-500" />
              Monthly Filing Volume Trajectory
            </CardTitle>
            <CardDescription className="text-xs">
              Resignation requests submitted vs. processed over the last 6 months
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
                    dataKey="Total"
                    name="Total Filed"
                    stroke="#8b5cf6"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: "#8b5cf6" }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="Processed"
                    name="Processed"
                    stroke="#10b981"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={{ r: 3, fill: "#10b981" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="Pending"
                    name="Pending"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={{ r: 3, fill: "#f59e0b" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Visualizations Row: Reason Drivers, Notice Compliance, Department Hotspots */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Chart 3: Resignation Reason Drivers */}
        <Card className="border-border bg-card shadow-xs rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <PieIcon className="h-4 w-4 text-blue-500" />
              Primary Departure Drivers
            </CardTitle>
            <CardDescription className="text-xs">
              Distribution of categorized resignation reasons
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-56 w-full flex items-center justify-center">
              {reasonDistribution.length === 0 ? (
                <div className="text-xs text-muted-foreground">No data available</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={reasonDistribution}
                      dataKey="count"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={2}
                    >
                      {reasonDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const item = payload[0].payload as ReasonDistributionSegment;
                        return (
                          <div className="rounded-xl border border-border bg-popover/95 backdrop-blur-md p-2.5 shadow-xl text-xs space-y-0.5">
                            <p className="font-bold text-foreground">{item.name}</p>
                            <p className="text-muted-foreground">
                              {item.count} resignations ({item.percentage}%)
                            </p>
                          </div>
                        );
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            {/* Top reasons legend */}
            <div className="grid grid-cols-2 gap-1.5 pt-2 text-[11px] text-muted-foreground border-t border-border">
              {reasonDistribution.slice(0, 4).map((r, i) => (
                <div key={i} className="flex items-center gap-1.5 truncate">
                  <span
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: r.color }}
                  />
                  <span className="truncate">{r.name}</span>
                  <span className="font-mono font-bold text-foreground ml-auto">
                    {r.percentage}%
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Chart 4: Notice Period Compliance */}
        <Card className="border-border bg-card shadow-xs rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Clock className="h-4 w-4 text-emerald-500" />
              Notice Period Compliance
            </CardTitle>
            <CardDescription className="text-xs">
              Adherence to 30-day advance filing requirements
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-56 w-full flex items-center justify-center">
              {noticeDistribution.length === 0 ? (
                <div className="text-xs text-muted-foreground">No data available</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={noticeDistribution}
                      dataKey="count"
                      nameKey="range"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={3}
                    >
                      {noticeDistribution.map((entry, index) => (
                        <Cell key={`notice-cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const item = payload[0].payload as NoticeDistributionSegment;
                        return (
                          <div className="rounded-xl border border-border bg-popover/95 backdrop-blur-md p-2.5 shadow-xl text-xs space-y-0.5">
                            <p className="font-bold text-foreground">{item.range}</p>
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
            {/* Notice distribution legend */}
            <div className="grid grid-cols-2 gap-1.5 pt-2 text-[11px] text-muted-foreground border-t border-border">
              {noticeDistribution.map((n, i) => (
                <div key={i} className="flex items-center gap-1.5 truncate">
                  <span
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: n.color }}
                  />
                  <span className="truncate">{n.range}</span>
                  <span className="font-mono font-bold text-foreground ml-auto">
                    {n.percentage}%
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Chart 5: Department Attrition Hotspots */}
        <Card className="border-border bg-card shadow-xs rounded-2xl md:col-span-2 lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Layers className="h-4 w-4 text-amber-500" />
              Department Turnover Volume
            </CardTitle>
            <CardDescription className="text-xs">
              Departments with highest recorded turnover
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-56 w-full">
              {deptBarData.length === 0 ? (
                <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                  No department records available
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={deptBarData}
                    layout="vertical"
                    margin={{ top: 5, right: 15, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis type="number" tick={{ fontSize: 10 }} stroke="currentColor" />
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
                            <p className="text-muted-foreground">
                              Total Resignations: {item.Total}
                            </p>
                            <p className="text-amber-500">Pending: {item.Pending}</p>
                            <p className="text-emerald-500">Processed: {item.Processed}</p>
                          </div>
                        );
                      }}
                    />
                    <Bar
                      dataKey="Total"
                      fill="#f59e0b"
                      radius={[0, 6, 6, 0]}
                      maxBarSize={16}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="pt-2 text-center text-[11px] text-muted-foreground border-t border-border">
              Showing top departments ranked by total resignation filings
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

