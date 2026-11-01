"use client";

import React from "react";
import Link from "next/link";
import {
  CalendarCheck,
  ClockAlert,
  Timer,
  Users,
  MessageSquareWarning,
  UserMinus,
  Award,
  UserPlus,
  ChevronRight,
} from "lucide-react";
import { IntercompanyDashboardData } from "../types";

interface ReportDomainsOverviewProps {
  data: IntercompanyDashboardData;
}

export const ReportDomainsOverview: React.FC<ReportDomainsOverviewProps> = ({
  data,
}) => {
  const {
    attendance,
    punctuality,
    overtime,
    workforce,
    concerns,
    resignation,
    evaluation,
    manpower,
  } = data;

  const domains = [
    {
      title: "Employee Masterlist",
      subtitle: "Enterprise Census & Headcount Registry",
      path: "/bia/hr/intercompany/employee-masterlist",
      icon: Users,
      color: "blue",
      metrics: [
        { label: "Active", value: workforce.activeEmployees.toLocaleString() },
        { label: "Inactive", value: workforce.inactiveEmployees.toLocaleString() },
        { label: "Active Ratio", value: `${workforce.activeRatio}%` },
      ],
      tag: `${workforce.regularCount} Regulars`,
    },
    {
      title: "Attendance Report",
      subtitle: "Biometric Timesheets & Presenteeism",
      path: "/bia/hr/intercompany/attendance-report",
      icon: CalendarCheck,
      color: "emerald",
      metrics: [
        { label: "Present Logs", value: attendance.presentCount.toLocaleString() },
        { label: "Absent Logs", value: attendance.absentCount.toLocaleString() },
        { label: "Attendance Rate", value: `${attendance.attendanceRate}%` },
      ],
      tag: `${attendance.totalLogs.toLocaleString()} Total Scans`,
    },
    {
      title: "Punctuality Report",
      subtitle: "Shift Adherence & Clock-in Promptness",
      path: "/bia/hr/intercompany/punctuality-report",
      icon: ClockAlert,
      color: "amber",
      metrics: [
        { label: "On-Time", value: punctuality.ontimeCount.toLocaleString() },
        { label: "Late Logs", value: punctuality.lateCount.toLocaleString() },
        { label: "Avg Late Time", value: `${punctuality.avgLateMinutes}m` },
      ],
      tag: `${punctuality.punctualityRate}% Compliance`,
    },
    {
      title: "Overtime Report",
      subtitle: "Extra Hours Billing & Approval Workflows",
      path: "/bia/hr/intercompany/overtime-report",
      icon: Timer,
      color: "indigo",
      metrics: [
        { label: "Approved", value: `${overtime.approvedHours}h` },
        { label: "Pending", value: `${overtime.pendingHours}h` },
        { label: "Approval Rate", value: `${overtime.approvalRate}%` },
      ],
      tag: `${overtime.totalRequests} Requests`,
    },
    {
      title: "Employee Concerns Report",
      subtitle: "Voice of Workforce, Grievances & Resolution",
      path: "/bia/hr/intercompany/employee-concerns-report",
      icon: MessageSquareWarning,
      color: "orange",
      metrics: [
        { label: "Pending", value: String(concerns.pendingCount) },
        { label: "Resolved", value: String(concerns.resolvedCount) },
        { label: "Resolution Rate", value: `${concerns.resolutionRate}%` },
      ],
      tag: concerns.pendingCount > 0 ? `${concerns.pendingCount} Action Needed` : "All Clear",
    },
    {
      title: "Resignation Dashboard",
      subtitle: "Offboarding Attrition & Notice Period Monitoring",
      path: "/bia/hr/intercompany/resignation-report",
      icon: UserMinus,
      color: "rose",
      metrics: [
        { label: "Pending Review", value: String(resignation.pendingCount) },
        { label: "Approved", value: String(resignation.approvedCount) },
        { label: "Turnover Rate", value: `${resignation.turnoverRate}%` },
      ],
      tag: `${resignation.compliantNoticeRate}% Compliant Notice`,
    },
    {
      title: "Evaluation Report",
      subtitle: "KPI Scorecards, Appraisals & Regularization",
      path: "/bia/hr/intercompany/evaluation-report",
      icon: Award,
      color: "purple",
      metrics: [
        { label: "Avg Score", value: evaluation.avgScore > 0 ? `${evaluation.avgScore.toFixed(1)}/5` : "-" },
        { label: "Pass Rate", value: `${evaluation.passRate}%` },
        { label: "Regularized", value: String(evaluation.regularizedCount) },
      ],
      tag: `Predominant: ${evaluation.predominantBand || "Good"}`,
    },
    {
      title: "Manpower Report",
      subtitle: "Staffing Requisitions & Recruitment Pipelines",
      path: "/bia/hr/intercompany/manpower-report",
      icon: UserPlus,
      color: "cyan",
      metrics: [
        { label: "Needed", value: String(manpower.headcountNeeded) },
        { label: "Hired", value: String(manpower.headcountHired) },
        { label: "Fulfillment", value: `${manpower.fulfillmentRate}%` },
      ],
      tag: `${manpower.openPositions} Open Positions`,
    },
  ];

  const colorStyles: Record<
    string,
    {
      bgIcon: string;
      textIcon: string;
      tag: string;
      borderHover: string;
    }
  > = {
    blue: {
      bgIcon: "bg-blue-50 dark:bg-blue-950/60",
      textIcon: "text-blue-600 dark:text-blue-400",
      tag: "bg-blue-50 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300 border-blue-200 dark:border-blue-800",
      borderHover: "hover:border-blue-300 dark:hover:border-blue-700",
    },
    emerald: {
      bgIcon: "bg-emerald-50 dark:bg-emerald-950/60",
      textIcon: "text-emerald-600 dark:text-emerald-400",
      tag: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
      borderHover: "hover:border-emerald-300 dark:hover:border-emerald-700",
    },
    amber: {
      bgIcon: "bg-amber-50 dark:bg-amber-950/60",
      textIcon: "text-amber-600 dark:text-amber-400",
      tag: "bg-amber-50 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300 border-amber-200 dark:border-amber-800",
      borderHover: "hover:border-amber-300 dark:hover:border-amber-700",
    },
    indigo: {
      bgIcon: "bg-indigo-50 dark:bg-indigo-950/60",
      textIcon: "text-indigo-600 dark:text-indigo-400",
      tag: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800",
      borderHover: "hover:border-indigo-300 dark:hover:border-indigo-700",
    },
    orange: {
      bgIcon: "bg-amber-50 dark:bg-amber-950/60",
      textIcon: "text-amber-600 dark:text-amber-400",
      tag: "bg-amber-50 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300 border-amber-200 dark:border-amber-800",
      borderHover: "hover:border-amber-300 dark:hover:border-amber-700",
    },
    rose: {
      bgIcon: "bg-rose-50 dark:bg-rose-950/60",
      textIcon: "text-rose-600 dark:text-rose-400",
      tag: "bg-rose-50 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300 border-rose-200 dark:border-rose-800",
      borderHover: "hover:border-rose-300 dark:hover:border-rose-700",
    },
    purple: {
      bgIcon: "bg-purple-50 dark:bg-purple-950/60",
      textIcon: "text-purple-600 dark:text-purple-400",
      tag: "bg-purple-50 text-purple-700 dark:bg-purple-950/70 dark:text-purple-300 border-purple-200 dark:border-purple-800",
      borderHover: "hover:border-purple-300 dark:hover:border-purple-700",
    },
    cyan: {
      bgIcon: "bg-cyan-50 dark:bg-cyan-950/60",
      textIcon: "text-cyan-600 dark:text-cyan-400",
      tag: "bg-cyan-50 text-cyan-700 dark:bg-cyan-950/70 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800",
      borderHover: "hover:border-cyan-300 dark:hover:border-cyan-700",
    },
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            Intercompany HR Reports Directory
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Direct access and real-time status across all 8 specialized intercompany reporting modules
          </p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 self-start sm:self-auto">
          8 Modules Operational
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {domains.map((d, idx) => {
          const Icon = d.icon;
          const style = colorStyles[d.color] || colorStyles.blue;
          return (
            <div
              key={idx}
              className={`flex flex-col justify-between p-4 bg-slate-50/60 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 rounded-xl transition-all duration-200 group ${style.borderHover}`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2.5">
                  <div className={`p-2 rounded-lg ${style.bgIcon} ${style.textIcon}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${style.tag}`}
                  >
                    {d.tag}
                  </span>
                </div>

                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {d.title}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3 line-clamp-1">
                  {d.subtitle}
                </p>

                <div className="grid grid-cols-3 gap-1.5 py-2.5 border-y border-slate-200/60 dark:border-slate-700/60 bg-white/60 dark:bg-slate-900/40 rounded-lg px-2 mb-3">
                  {d.metrics.map((m, mIdx) => (
                    <div key={mIdx} className="text-center">
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">
                        {m.label}
                      </div>
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                        {m.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Link
                href={d.path}
                className="inline-flex items-center justify-between w-full px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950/60 group-hover:border-indigo-200 dark:group-hover:border-indigo-800 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-all shadow-xs"
              >
                <span>Launch Report</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
};
