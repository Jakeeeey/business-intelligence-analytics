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
  CompanyManpowerSummary,
  DepartmentManpowerSummary,
  PurposeDistributionSegment,
  EmploymentTypeSegment,
  ManpowerTrendPoint,
} from "../types";
import {
  Building2,
  TrendingUp,
  PieChart as PieIcon,
  Briefcase,
  Layers,
} from "lucide-react";

interface ManpowerChartsProps {
  companySummaries: CompanyManpowerSummary[];
  departmentSummaries: DepartmentManpowerSummary[];
  purposeDistribution: PurposeDistributionSegment[];
  employmentTypeDistribution: EmploymentTypeSegment[];
  trends: ManpowerTrendPoint[];
}

const emptySubscribe = () => () => {};

export function ManpowerCharts({
  companySummaries,
  departmentSummaries,
  purposeDistribution,
  employmentTypeDistribution,
  trends,
}: ManpowerChartsProps) {
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
    .filter((c) => c.totalRequests > 0)
    .map((c) => ({
      name: c.companyCode,
      fullName: c.companyName,
      Needed: c.totalHeadcountNeeded,
      Hired: c.totalHeadcountHired,
      Requests: c.totalRequests,
    }));

  // 2. Department Bar Data
  const deptBarData = departmentSummaries.slice(0, 7).map((d) => ({
    name: d.department.length > 15 ? `${d.department.slice(0, 13)}…` : d.department,
    fullName: d.department,
    Needed: d.headcountNeeded,
    Hired: d.headcountHired,
  }));

  // 3. Trends Data
  const trendData = trends.map((t) => ({
    name: t.displayDate,
    Requests: t.requestCount,
    Headcount: t.headcountNeeded,
    Approved: t.approvedCount,
  }));

  return (
    <div className="space-y-4">
      {/* Top Visualizations Row: Company Comparison & Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Chart 1: Company Demand & Fulfillment */}
        <Card className="border-border bg-card shadow-xs rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              Intercompany Headcount Demand vs. Hired
            </CardTitle>
            <CardDescription className="text-xs">
              Positions requested vs. candidates hired across operating entities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              {companyBarData.length === 0 ? (
                <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                  No manpower requests logged across operating entities yet.
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
                            <p className="text-primary font-semibold">
                              Headcount Needed: {item.Needed}
                            </p>
                            <p className="text-emerald-600 dark:text-emerald-400 font-semibold">
                              Hired Candidates: {item.Hired}
                            </p>
                            <p className="text-muted-foreground font-mono">
                              Total Requisitions: {item.Requests}
                            </p>
                          </div>
                        );
                      }}
                    />
                    <Bar
                      dataKey="Needed"
                      name="Headcount Needed"
                      fill="#3b82f6"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={36}
                    />
                    <Bar
                      dataKey="Hired"
                      name="Hired"
                      fill="#10b981"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={36}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Chart 2: 6-Month Requisition Timeline */}
        <Card className="border-border bg-card shadow-xs rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-purple-500" />
              Monthly Hiring Demand Trajectory
            </CardTitle>
            <CardDescription className="text-xs">
              Requisitions filed vs. total headcount demand over the last 6 months
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
                    dataKey="Headcount"
                    name="Headcount Needed"
                    stroke="#8b5cf6"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: "#8b5cf6" }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="Requests"
                    name="Requisitions Filed"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ r: 3, fill: "#3b82f6" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="Approved"
                    name="Approved Requisitions"
                    stroke="#10b981"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={{ r: 3, fill: "#10b981" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Visualizations Row: Purpose, Employment Type, Department Rankings */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Chart 3: Requisition Purpose Distribution */}
        <Card className="border-border bg-card shadow-xs rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <PieIcon className="h-4 w-4 text-blue-500" />
              Requisition Purpose Drivers
            </CardTitle>
            <CardDescription className="text-xs">
              New positions vs. replacements vs. additional headcount
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-56 w-full flex items-center justify-center">
              {purposeDistribution.every((p) => p.count === 0) ? (
                <div className="text-xs text-muted-foreground">No data available</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={purposeDistribution}
                      dataKey="count"
                      nameKey="purpose"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={2}
                    >
                      {purposeDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const item = payload[0].payload as PurposeDistributionSegment;
                        return (
                          <div className="rounded-xl border border-border bg-popover/95 backdrop-blur-md p-2.5 shadow-xl text-xs space-y-0.5">
                            <p className="font-bold text-foreground">{item.purpose}</p>
                            <p className="text-muted-foreground">
                              {item.count} requisitions ({item.percentage}%)
                            </p>
                            <p className="text-primary font-semibold">
                              {item.headcount} total headcount
                            </p>
                          </div>
                        );
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            {/* Purpose legend */}
            <div className="grid grid-cols-3 gap-1 pt-2 text-[11px] text-muted-foreground border-t border-border">
              {purposeDistribution.map((p, i) => (
                <div key={i} className="flex flex-col items-center text-center">
                  <div className="flex items-center gap-1">
                    <span
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{ backgroundColor: p.color }}
                    />
                    <span className="truncate max-w-[80px]">{p.purpose}</span>
                  </div>
                  <span className="font-mono font-bold text-foreground">
                    {p.percentage}% ({p.headcount})
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Chart 4: Employment Type Breakdown */}
        <Card className="border-border bg-card shadow-xs rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-purple-500" />
              Employment Types
            </CardTitle>
            <CardDescription className="text-xs">
              Distribution of requested employment status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-56 w-full flex items-center justify-center">
              {employmentTypeDistribution.length === 0 ? (
                <div className="text-xs text-muted-foreground">No data available</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={employmentTypeDistribution}
                      dataKey="count"
                      nameKey="type"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={3}
                    >
                      {employmentTypeDistribution.map((entry, index) => (
                        <Cell key={`emp-cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const item = payload[0].payload as EmploymentTypeSegment;
                        return (
                          <div className="rounded-xl border border-border bg-popover/95 backdrop-blur-md p-2.5 shadow-xl text-xs space-y-0.5">
                            <p className="font-bold text-foreground">{item.type}</p>
                            <p className="text-muted-foreground">
                              {item.count} requisitions ({item.percentage}%)
                            </p>
                          </div>
                        );
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            {/* Employment Type legend */}
            <div className="grid grid-cols-2 gap-1.5 pt-2 text-[11px] text-muted-foreground border-t border-border">
              {employmentTypeDistribution.map((et, i) => (
                <div key={i} className="flex items-center gap-1.5 truncate">
                  <span
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: et.color }}
                  />
                  <span className="truncate">{et.type}</span>
                  <span className="font-mono font-bold text-foreground ml-auto">
                    {et.percentage}%
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Chart 5: Department Demand Ranking */}
        <Card className="border-border bg-card shadow-xs rounded-2xl md:col-span-2 lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Layers className="h-4 w-4 text-amber-500" />
              Department Staffing Demand
            </CardTitle>
            <CardDescription className="text-xs">
              Departments requiring highest headcount
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
                            <p className="text-primary font-semibold">
                              Headcount Needed: {item.Needed}
                            </p>
                            <p className="text-emerald-500">Hired: {item.Hired}</p>
                          </div>
                        );
                      }}
                    />
                    <Bar
                      dataKey="Needed"
                      fill="#f59e0b"
                      radius={[0, 6, 6, 0]}
                      maxBarSize={16}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="pt-2 text-center text-[11px] text-muted-foreground border-t border-border">
              Total requested headcount by operational department
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

