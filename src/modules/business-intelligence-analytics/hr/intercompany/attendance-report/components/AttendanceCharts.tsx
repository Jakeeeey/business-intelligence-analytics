"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  CompanyAttendanceSummary,
  IntercompanyAttendanceKpis,
} from "../types";

interface AttendanceChartsProps {
  companySummaries: CompanyAttendanceSummary[];
  kpis: IntercompanyAttendanceKpis;
}

const STATUS_COLORS: Record<string, string> = {
  "On Time": "#10b981", // emerald-500
  Late: "#f59e0b", // amber-500
  Absent: "#f43f5e", // rose-500
  "On Leave": "#a855f7", // purple-500
};

const emptySubscribe = () => () => {};

export function AttendanceCharts({ companySummaries, kpis }: AttendanceChartsProps) {
  const isMounted = React.useSyncExternalStore(emptySubscribe, () => true, () => false);

  if (!isMounted) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="h-72 rounded-2xl border border-border bg-card animate-pulse" />
        <div className="h-72 rounded-2xl border border-border bg-card animate-pulse" />
      </div>
    );
  }

  // 1. Data for Company Comparison Bar Chart
  const companyBarData = companySummaries
    .filter((c) => c.status === "ACTIVE" && c.totalEmployees > 0)
    .map((c) => ({
      name: c.companyCode,
      fullName: c.companyName,
      Present: c.presentCount,
      Late: c.lateCount,
      Absent: c.absentCount,
      Leave: c.leaveCount,
      Rate: c.attendanceRate,
    }));

  // 2. Data for Status Donut Chart
  const onTimeCount = Math.max(0, kpis.totalPresent - kpis.totalLate);
  const statusPieData = [
    { name: "On Time", value: onTimeCount, color: STATUS_COLORS["On Time"] },
    { name: "Late", value: kpis.totalLate, color: STATUS_COLORS.Late },
    { name: "Absent", value: kpis.totalAbsent, color: STATUS_COLORS.Absent },
    { name: "On Leave", value: kpis.totalOnLeave, color: STATUS_COLORS["On Leave"] },
  ].filter((d) => d.value > 0);

  const totalEvaluated = kpis.totalWorkforce || 1;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      {/* Chart 1: Subsidiary Attendance Comparison (8 cols) */}
      <Card className="lg:col-span-7 xl:col-span-8 border-border bg-card rounded-2xl shadow-xs">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold text-foreground">
                Attendance Volume by Company
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Present, Late, and Absent personnel breakdown across active business units
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          {companyBarData.length === 0 ? (
            <div className="flex h-64 items-center justify-center text-xs text-muted-foreground">
              No active company telemetry available for this cycle
            </div>
          ) : (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={companyBarData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: "currentColor" }}
                    className="text-muted-foreground font-medium"
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "currentColor" }}
                    className="text-muted-foreground font-medium"
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--popover)",
                      borderColor: "var(--border)",
                      borderRadius: "0.75rem",
                      fontSize: "12px",
                      color: "var(--popover-foreground)",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    }}
                    formatter={(val: number, name: string) => [
                      `${val.toLocaleString()} employees`,
                      name,
                    ]}
                    labelFormatter={(label: string) => {
                      const item = companyBarData.find((c) => c.name === label);
                      return item ? `${item.fullName} (${label})` : label;
                    }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }}
                    iconType="circle"
                  />
                  <Bar dataKey="Present" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={32} />
                  <Bar dataKey="Late" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={32} />
                  <Bar dataKey="Absent" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Chart 2: Global Status Breakdown Donut (5 cols) */}
      <Card className="lg:col-span-5 xl:col-span-4 border-border bg-card rounded-2xl shadow-xs">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-foreground">
            Attendance Distribution
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Proportion of on-time, late, absent, and on-leave workforce
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-2 flex flex-col items-center">
          <div className="h-56 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {statusPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--popover)",
                    borderColor: "var(--border)",
                    borderRadius: "0.75rem",
                    fontSize: "12px",
                    color: "var(--popover-foreground)",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  }}
                  formatter={(val: number, name: string) => [
                    `${val.toLocaleString()} (${Math.round((val / totalEvaluated) * 100)}%)`,
                    name,
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Center metric */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold text-foreground tabular-nums">
                {kpis.overallAttendanceRate}%
              </span>
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Present
              </span>
            </div>
          </div>

          {/* Custom status list badges */}
          <div className="w-full grid grid-cols-2 gap-2 pt-2 border-t border-border/50">
            {statusPieData.map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-between text-xs p-2 rounded-lg bg-muted/40"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-muted-foreground truncate">{item.name}</span>
                </div>
                <span className="font-semibold text-foreground tabular-nums ml-1">
                  {item.value.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
