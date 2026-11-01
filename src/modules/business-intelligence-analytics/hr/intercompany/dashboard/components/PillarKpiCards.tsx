"use client";

import React from "react";
import {
  Users,
  CalendarCheck,
  ClockAlert,
  Timer,
  UserPlus,
  UserMinus,
  Award,
  MessageSquareWarning,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { IntercompanyDashboardData } from "../types";

interface PillarKpiCardsProps {
  data: IntercompanyDashboardData;
}

export const PillarKpiCards: React.FC<PillarKpiCardsProps> = ({ data }) => {
  const {
    workforce,
    attendance,
    punctuality,
    overtime,
    manpower,
    resignation,
    evaluation,
    concerns,
  } = data;

  const cards = [
    {
      title: "Total Workforce",
      value: workforce.totalEmployees.toLocaleString(),
      subtitle: `${workforce.activeEmployees.toLocaleString()} Active (${workforce.activeRatio}%)`,
      badge: `${workforce.regularCount} Regular`,
      icon: Users,
      trend: `${workforce.casualContractualCount} Casual/Contract`,
      color: "blue",
    },
    {
      title: "Consolidated Attendance",
      value: `${attendance.attendanceRate}%`,
      subtitle: `${attendance.presentCount.toLocaleString()} Present / ${attendance.totalLogs.toLocaleString()} Logs`,
      badge: `${attendance.absentCount.toLocaleString()} Absent`,
      icon: CalendarCheck,
      trend: "Operational Rate",
      color: "emerald",
    },
    {
      title: "Punctuality Rate",
      value: `${punctuality.punctualityRate}%`,
      subtitle: `${punctuality.ontimeCount.toLocaleString()} On-Time (${punctuality.avgLateMinutes}m avg late)`,
      badge: `${punctuality.lateCount.toLocaleString()} Tardies`,
      icon: ClockAlert,
      trend: "Time Compliance",
      color: "amber",
    },
    {
      title: "Overtime Utilized",
      value: `${overtime.approvedHours.toLocaleString()} hrs`,
      subtitle: `${overtime.pendingHours.toLocaleString()} hrs pending approval`,
      badge: `${overtime.approvalRate}% Approved`,
      icon: Timer,
      trend: `${overtime.totalRequests.toLocaleString()} Requests`,
      color: "indigo",
    },
    {
      title: "Manpower Fulfillment",
      value: `${manpower.fulfillmentRate}%`,
      subtitle: `${manpower.headcountHired} hired of ${manpower.headcountNeeded} requested`,
      badge: `${manpower.openPositions} Open Positions`,
      icon: UserPlus,
      trend: `${manpower.totalRequisitions} Requisitions`,
      color: "cyan",
    },
    {
      title: "Turnover & Resignations",
      value: `${resignation.turnoverRate}%`,
      subtitle: `${resignation.pendingCount} Pending HR review`,
      badge: `${resignation.totalResignations} Total Filed`,
      icon: UserMinus,
      trend: `${resignation.compliantNoticeRate}% 30d Notice`,
      color: "rose",
    },
    {
      title: "Appraisal Performance",
      value: `${evaluation.avgScore.toFixed(1)}/5.0`,
      subtitle: `${evaluation.passRate}% Pass Rate (Rank: ${evaluation.predominantBand || "Good"})`,
      badge: `${evaluation.regularizedCount} Regularized`,
      icon: Award,
      trend: `${evaluation.totalEvaluations} Evaluations`,
      color: "purple",
    },
    {
      title: "Employee Concerns",
      value: `${concerns.resolutionRate}%`,
      subtitle: `${concerns.pendingCount} Action Required / Open`,
      badge: `${concerns.totalConcerns} Total Filed`,
      icon: MessageSquareWarning,
      trend: `${concerns.anonymousRate}% Anonymous`,
      color: "amber",
    },
  ];

  const colorStyles: Record<
    string,
    {
      bgIcon: string;
      textIcon: string;
      badge: string;
      border: string;
    }
  > = {
    blue: {
      bgIcon: "bg-blue-50 dark:bg-blue-950/50",
      textIcon: "text-blue-600 dark:text-blue-400",
      badge: "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800",
      border: "hover:border-blue-300 dark:hover:border-blue-700",
    },
    emerald: {
      bgIcon: "bg-emerald-50 dark:bg-emerald-950/50",
      textIcon: "text-emerald-600 dark:text-emerald-400",
      badge: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
      border: "hover:border-emerald-300 dark:hover:border-emerald-700",
    },
    amber: {
      bgIcon: "bg-amber-50 dark:bg-amber-950/50",
      textIcon: "text-amber-600 dark:text-amber-400",
      badge: "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800",
      border: "hover:border-amber-300 dark:hover:border-amber-700",
    },
    indigo: {
      bgIcon: "bg-indigo-50 dark:bg-indigo-950/50",
      textIcon: "text-indigo-600 dark:text-indigo-400",
      badge: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800",
      border: "hover:border-indigo-300 dark:hover:border-indigo-700",
    },
    cyan: {
      bgIcon: "bg-cyan-50 dark:bg-cyan-950/50",
      textIcon: "text-cyan-600 dark:text-cyan-400",
      badge: "bg-cyan-50 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800",
      border: "hover:border-cyan-300 dark:hover:border-cyan-700",
    },
    rose: {
      bgIcon: "bg-rose-50 dark:bg-rose-950/50",
      textIcon: "text-rose-600 dark:text-rose-400",
      badge: "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800",
      border: "hover:border-rose-300 dark:hover:border-rose-700",
    },
    purple: {
      bgIcon: "bg-purple-50 dark:bg-purple-950/50",
      textIcon: "text-purple-600 dark:text-purple-400",
      badge: "bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800",
      border: "hover:border-purple-300 dark:hover:border-purple-700",
    },
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        const style = colorStyles[card.color] || colorStyles.blue;
        return (
          <div
            key={idx}
            className={`flex flex-col justify-between p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm transition-all duration-200 ${style.border}`}
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {card.title}
                </span>
                <div className={`p-2 rounded-xl ${style.bgIcon} ${style.textIcon}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  {card.value}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                {card.subtitle}
              </p>
            </div>

            <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
              <span
                className={`text-[11px] font-medium px-2 py-0.5 rounded-md border ${style.badge}`}
              >
                {card.badge}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 font-mono">
                {card.trend.includes("Regular") || card.trend.includes("Notice") ? (
                  <TrendingUp className="w-3 h-3 text-slate-400" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-slate-400" />
                )}
                {card.trend}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

