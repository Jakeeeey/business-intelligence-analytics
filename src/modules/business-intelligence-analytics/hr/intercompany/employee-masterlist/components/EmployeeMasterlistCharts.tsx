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
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  CompanyMasterlistSummary,
  DepartmentMasterlistSummary,
  DistributionSegment,
  TenureDistributionPoint,
} from "../types";
import { Building2, Layers, PieChart as PieIcon, Clock } from "lucide-react";

interface EmployeeMasterlistChartsProps {
  companySummaries: CompanyMasterlistSummary[];
  departmentSummaries: DepartmentMasterlistSummary[];
  genderDistribution: DistributionSegment[];
  statusDistribution: DistributionSegment[];
  tenureDistribution: TenureDistributionPoint[];
}

const emptySubscribe = () => () => {};

export function EmployeeMasterlistCharts({
  companySummaries,
  departmentSummaries,
  genderDistribution,
  statusDistribution,
  tenureDistribution,
}: EmployeeMasterlistChartsProps) {
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

  // 1. Company Headcount Bar Data
  const companyBarData = companySummaries
    .filter((c) => c.totalEmployees > 0)
    .map((c) => ({
      name: c.companyCode,
      fullName: c.companyName,
      Total: c.totalEmployees,
      Regular: c.regularCount,
      Probationary: c.probationaryCount,
      Other: c.otherStatusCount,
      AvgTenure: c.avgTenureYears,
    }));

  // 2. Top Departments Bar Data (top 8)
  const deptBarData = departmentSummaries.slice(0, 8).map((d) => ({
    name: d.department.length > 16 ? `${d.department.slice(0, 14)}…` : d.department,
    fullName: d.department,
    Headcount: d.totalEmployees,
    Regular: d.regularCount,
    Probationary: d.probationaryCount,
    Companies: d.companiesCount,
  }));

  return (
    <div className="space-y-4">
      {/* Top Row: Company Headcount vs Top Departments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Chart 1: Company Workforce Distribution */}
        <Card className="border-border bg-card shadow-xs rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Building2 className="h-4 w-4 text-cyan-500" />
              Intercompany Headcount Comparison
            </CardTitle>
            <CardDescription className="text-xs">
              Employee distribution across operating companies (Regular vs Probationary)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
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
                          <p className="text-cyan-600 dark:text-cyan-400 font-semibold">
                            Total Staff: {item.Total}
                          </p>
                          <p className="text-muted-foreground">
                            Regular: {item.Regular} | Probationary: {item.Probationary}
                          </p>
                          <p className="text-purple-600 dark:text-purple-400">
                            Avg Tenure: {item.AvgTenure} yrs
                          </p>
                        </div>
                      );
                    }}
                  />
                  <Bar
                    dataKey="Regular"
                    stackId="a"
                    name="Regular"
                    fill="#10b981"
                    radius={[0, 0, 0, 0]}
                    maxBarSize={44}
                  />
                  <Bar
                    dataKey="Probationary"
                    stackId="a"
                    name="Probationary"
                    fill="#f59e0b"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={44}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Chart 2: Top Departments Headcount */}
        <Card className="border-border bg-card shadow-xs rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Layers className="h-4 w-4 text-purple-500" />
              Top Departments by Headcount
            </CardTitle>
            <CardDescription className="text-xs">
              Largest departmental teams consolidated across all companies
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={deptBarData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10 }}
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
                          <p className="font-bold text-foreground">{item.fullName}</p>
                          <p className="text-purple-600 dark:text-purple-400 font-semibold">
                            Total Staff: {item.Headcount}
                          </p>
                          <p className="text-muted-foreground">
                            Regular: {item.Regular} • Probationary: {item.Probationary}
                          </p>
                          <p className="text-cyan-600 dark:text-cyan-400">
                            Present in {item.Companies} {item.Companies === 1 ? "company" : "companies"}
                          </p>
                        </div>
                      );
                    }}
                  />
                  <Bar
                    dataKey="Headcount"
                    name="Headcount"
                    fill="#8b5cf6"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row: Employment Status, Gender & Tenure Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Chart 3: Employment Status Donut */}
        <Card className="border-border bg-card shadow-xs rounded-2xl">
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <PieIcon className="h-4 w-4 text-emerald-500" />
              Employment Status Breakdown
            </CardTitle>
            <CardDescription className="text-xs">
              Distribution by contract & tenure classification
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-48 w-full flex items-center justify-center">
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
                      `${val} employees (${item.payload.percentage}%)`,
                      name,
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
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

        {/* Chart 4: Gender Demographics Donut */}
        <Card className="border-border bg-card shadow-xs rounded-2xl">
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <PieIcon className="h-4 w-4 text-blue-500" />
              Gender Demographics
            </CardTitle>
            <CardDescription className="text-xs">
              Workforce gender ratio across companies
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-48 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={genderDistribution.filter((d) => d.count > 0)}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={68}
                    paddingAngle={3}
                  >
                    {genderDistribution.map((entry, index) => (
                      <Cell key={`gender-cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val, name, item) => [
                      `${val} employees (${item.payload.percentage}%)`,
                      name,
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-border/60">
              {genderDistribution.map((g) => (
                <div key={g.name} className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: g.color }}
                  />
                  <span className="text-muted-foreground text-[11px] truncate">{g.name}</span>
                  <span className="font-semibold text-foreground text-[11px] ml-auto tabular-nums">
                    {g.count} ({g.percentage}%)
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Chart 5: Tenure Distribution Bar */}
        <Card className="border-border bg-card shadow-xs rounded-2xl">
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500" />
              Service Tenure Distribution
            </CardTitle>
            <CardDescription className="text-xs">
              Length of service brackets across workforce
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={tenureDistribution}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis
                    dataKey="range"
                    tick={{ fontSize: 10 }}
                    stroke="currentColor"
                    className="text-muted-foreground"
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    stroke="currentColor"
                    className="text-muted-foreground"
                  />
                  <Tooltip
                    formatter={(val, _name, item) => [
                      `${val} employees (${item.payload.percentage}%)`,
                      "Headcount",
                    ]}
                  />
                  <Bar
                    dataKey="count"
                    name="Employees"
                    fill="#06b6d4"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-border/60">
              {tenureDistribution.map((t) => (
                <div key={t.range} className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground text-[11px] truncate">{t.range}</span>
                  <span className="font-semibold text-foreground text-[11px] tabular-nums">
                    {t.count} ({t.percentage}%)
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

