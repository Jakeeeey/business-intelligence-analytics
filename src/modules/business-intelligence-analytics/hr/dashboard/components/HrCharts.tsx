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
  DepartmentHeadcount,
  GenderDistributionItem,
  TenureDistributionItem,
} from "../types";

interface HrChartsProps {
  departmentStats: DepartmentHeadcount[];
  genderDistribution: GenderDistributionItem[];
  tenureDistribution: TenureDistributionItem[];
}

export function HrCharts({
  departmentStats,
  genderDistribution,
  tenureDistribution,
}: HrChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* 1. Departmental Staffing Allocation (Bar Chart) */}
      <Card className="border-border bg-card lg:col-span-2 shadow-xs rounded-2xl">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold text-foreground">
                Departmental Staffing Distribution
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Headcount allocated across corporate and operational departments
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-[10px] px-2 py-0.5 text-muted-foreground border-border">
              {departmentStats.length} Departments
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={departmentStats}
                margin={{ top: 10, right: 15, left: -20, bottom: 25 }}
              >
                <defs>
                  <linearGradient id="deptGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.6} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-border/40"
                  vertical={false}
                />
                <XAxis
                  dataKey="department"
                  tick={{ fontSize: 10, fill: "currentColor" }}
                  className="text-muted-foreground"
                  tickLine={false}
                  axisLine={{ stroke: "var(--border)" }}
                  angle={-15}
                  textAnchor="end"
                  interval={0}
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
                      const data = payload[0].payload as DepartmentHeadcount;
                      return (
                        <div className="rounded-xl border border-border bg-popover/95 backdrop-blur-sm p-3 shadow-lg text-xs space-y-1">
                          <p className="font-bold text-foreground">{data.department}</p>
                          <div className="flex items-center justify-between gap-4 text-muted-foreground">
                            <span>Employees:</span>
                            <span className="font-bold text-foreground">
                              {data.headcount}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-4 text-muted-foreground">
                            <span>Share of Workforce:</span>
                            <span className="font-bold text-primary">
                              {data.percentage}%
                            </span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  dataKey="headcount"
                  name="Employees"
                  fill="url(#deptGrad)"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* 2. Gender & Diversity Distribution (Donut Chart) */}
      <Card className="border-border bg-card shadow-xs rounded-2xl">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold text-foreground">
                Workforce Diversity
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Distribution by reported gender
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-border text-muted-foreground">
              Demographics
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={genderDistribution}
                  dataKey="count"
                  nameKey="gender"
                  cx="50%"
                  cy="45%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                >
                  {genderDistribution.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      stroke="var(--background)"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload as GenderDistributionItem;
                      return (
                        <div className="rounded-xl border border-border bg-popover/95 backdrop-blur-sm p-3 shadow-lg text-xs space-y-1">
                          <p className="font-bold text-foreground">{data.gender}</p>
                          <div className="flex items-center justify-between gap-4 text-muted-foreground">
                            <span>Count:</span>
                            <span className="font-bold text-foreground">
                              {data.count} ({data.percentage}%)
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
                  wrapperStyle={{ fontSize: 11, paddingTop: 4 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* 3. Company Tenure Distribution */}
      <Card className="border-border bg-card lg:col-span-3 shadow-xs rounded-2xl">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold text-foreground">
                Workforce Tenure & Retention
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Staff distribution categorized by completed years of service at the company
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-[10px] px-2 py-0.5 border-border text-muted-foreground">
              Tenure Profile
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
            {tenureDistribution.map((t, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-border/80 bg-muted/25 p-3.5 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">{t.range}</span>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-border">
                    {t.percentage}%
                  </Badge>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-foreground">
                    {t.count}
                  </span>
                  <span className="text-xs text-muted-foreground">Employees</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    style={{ width: `${t.percentage}%` }}
                    className="h-full bg-linear-to-r from-cyan-500 to-blue-500 rounded-full"
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
