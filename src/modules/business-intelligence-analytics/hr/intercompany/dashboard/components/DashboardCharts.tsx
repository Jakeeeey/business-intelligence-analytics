"use client";

import React from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  BarChart,
} from "recharts";
import {
  TalentFlowTrendPoint,
  AttendancePunctualityTrendPoint,
  CompanyDistributionShare,
  ConcernsCategoryShare,
} from "../types";

interface DashboardChartsProps {
  talentFlowTrends: TalentFlowTrendPoint[];
  attendanceTrends: AttendancePunctualityTrendPoint[];
  companyDistribution: CompanyDistributionShare[];
  concernsDistribution: ConcernsCategoryShare[];
}

const emptySubscribe = () => () => {};

export const DashboardCharts: React.FC<DashboardChartsProps> = ({
  talentFlowTrends,
  attendanceTrends,
  companyDistribution,
  concernsDistribution,
}) => {
  const isMounted = React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  if (!isMounted) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-80 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 1. Talent Flow Dynamics */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Talent Flow &amp; Net Headcount Trajectory
            </h3>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              Hires vs. Departures
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Tracking cross-company onboarding versus resignations over the last 6 months
          </p>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={talentFlowTrends}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                className="stroke-slate-200 dark:stroke-slate-800"
              />
              <XAxis
                dataKey="displayDate"
                className="text-xs fill-slate-500 dark:fill-slate-400"
                tick={{ fontSize: 11 }}
              />
              <YAxis
                className="text-xs fill-slate-500 dark:fill-slate-400"
                tick={{ fontSize: 11 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(15, 23, 42, 0.95)",
                  borderColor: "rgba(51, 65, 85, 0.8)",
                  borderRadius: "12px",
                  color: "#fff",
                  fontSize: "12px",
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }}
              />
              <Bar
                dataKey="hiredCount"
                name="New Hires"
                fill="#10b981"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="resignedCount"
                name="Resignations"
                fill="#f43f5e"
                radius={[4, 4, 0, 0]}
              />
              <Line
                type="monotone"
                dataKey="netChange"
                name="Net Headcount Change"
                stroke="#6366f1"
                strokeWidth={3}
                dot={{ r: 4 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. Workforce Distribution by Operating Company */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Headcount Share per Entity
            </h3>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              Entity Proportion
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Percentage contribution of each operating subsidiary to total group workforce
          </p>
        </div>

        <div className="h-72 w-full flex flex-col sm:flex-row items-center justify-center">
          <div className="w-full sm:w-1/2 h-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={companyDistribution}
                  dataKey="headcount"
                  nameKey="companyCode"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                >
                  {companyDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number, name: string) => [
                    `${value} employees`,
                    name,
                  ]}
                  contentStyle={{
                    backgroundColor: "rgba(15, 23, 42, 0.95)",
                    borderColor: "rgba(51, 65, 85, 0.8)",
                    borderRadius: "12px",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="w-full sm:w-1/2 flex flex-col gap-2 p-2 max-h-64 overflow-y-auto">
            {companyDistribution.map((item) => (
              <div
                key={item.companyCode}
                className="flex items-center justify-between text-xs p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60"
              >
                <div className="flex items-center gap-2 truncate">
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="font-medium text-slate-700 dark:text-slate-300 truncate">
                    {item.companyName}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2 font-mono">
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {item.headcount}
                  </span>
                  <span className="text-slate-400 text-[11px]">
                    ({item.percentage}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Attendance vs. Punctuality Monthly Trajectory */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Attendance vs. Punctuality Trajectory
            </h3>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              Discipline &amp; Presenteeism
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Correlation between overall employee attendance rate and punctuality compliance
          </p>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={attendanceTrends}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                className="stroke-slate-200 dark:stroke-slate-800"
              />
              <XAxis
                dataKey="displayDate"
                className="text-xs fill-slate-500 dark:fill-slate-400"
                tick={{ fontSize: 11 }}
              />
              <YAxis
                domain={[50, 100]}
                unit="%"
                className="text-xs fill-slate-500 dark:fill-slate-400"
                tick={{ fontSize: 11 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(15, 23, 42, 0.95)",
                  borderColor: "rgba(51, 65, 85, 0.8)",
                  borderRadius: "12px",
                  color: "#fff",
                  fontSize: "12px",
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }}
              />
              <Line
                type="monotone"
                dataKey="attendanceRate"
                name="Attendance Rate"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="punctualityRate"
                name="Punctuality Rate"
                stroke="#f59e0b"
                strokeWidth={3}
                dot={{ r: 4 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. Employee Concerns & Grievance Taxonomy */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Employee Grievance &amp; Concerns Taxonomy
            </h3>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
              Issue Categorization
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Distribution of workforce issues across compensation, scheduling, facilities and relations
          </p>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={concernsDistribution}
              layout="vertical"
              margin={{ top: 10, right: 20, left: 20, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                className="stroke-slate-200 dark:stroke-slate-800"
              />
              <XAxis
                type="number"
                className="text-xs fill-slate-500 dark:fill-slate-400"
                tick={{ fontSize: 11 }}
              />
              <YAxis
                type="category"
                dataKey="category"
                width={120}
                className="text-xs fill-slate-500 dark:fill-slate-400"
                tick={{ fontSize: 10 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(15, 23, 42, 0.95)",
                  borderColor: "rgba(51, 65, 85, 0.8)",
                  borderRadius: "12px",
                  color: "#fff",
                  fontSize: "12px",
                }}
              />
              <Bar dataKey="count" name="Reported Concerns" radius={[0, 4, 4, 0]}>
                {concernsDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

