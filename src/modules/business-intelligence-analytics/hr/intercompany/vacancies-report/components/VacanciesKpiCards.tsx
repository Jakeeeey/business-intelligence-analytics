"use client";

import React from "react";
import {
  Briefcase,
  AlertTriangle,
  Sparkles,
  Clock,
  Coins,
  FileText,
} from "lucide-react";
import { IntercompanyVacanciesKpis } from "../types";

interface VacanciesKpiCardsProps {
  kpis: IntercompanyVacanciesKpis;
}

export const VacanciesKpiCards: React.FC<VacanciesKpiCardsProps> = ({ kpis }) => {
  const cards = [
    {
      title: "Total Open Vacancies",
      value: kpis.totalOpenVacancies.toLocaleString(),
      subtitle: `${kpis.totalRequisitions} active requisitions`,
      icon: Briefcase,
      color: "blue",
      badge: `${kpis.totalOpenVacancies} Open Seats`,
    },
    {
      title: "Critical Urgency Roles",
      value: kpis.criticalRolesCount.toLocaleString(),
      subtitle: "Replacements & aging > 60d",
      icon: AlertTriangle,
      color: "rose",
      badge: "High Priority",
    },
    {
      title: "Replacement Positions",
      value: kpis.replacementRoles.toLocaleString(),
      subtitle: "Backfill existing headcount",
      icon: FileText,
      color: "amber",
      badge: "Continuity",
    },
    {
      title: "Expansion Roles",
      value: kpis.newPositionRoles.toLocaleString(),
      subtitle: "Newly created organizational roles",
      icon: Sparkles,
      color: "emerald",
      badge: "Growth",
    },
    {
      title: "Avg Requisition Aging",
      value: `${kpis.avgAgingDays} days`,
      subtitle: "From approval to today",
      icon: Clock,
      color: "purple",
      badge: kpis.avgAgingDays > 45 ? "Delayed" : "On Track",
    },
    {
      title: "Allocated Rate Budget",
      value: `₱${kpis.totalAllocatedBudget.toLocaleString("en-US", {
        maximumFractionDigits: 0,
      })}`,
      subtitle: "Estimated open salary rate",
      icon: Coins,
      color: "cyan",
      badge: "Capital Plan",
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
      bgIcon: "bg-blue-50 dark:bg-blue-950/60",
      textIcon: "text-blue-600 dark:text-blue-400",
      badge:
        "bg-blue-50 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300 border-blue-200 dark:border-blue-800",
      border: "hover:border-blue-300 dark:hover:border-blue-700",
    },
    rose: {
      bgIcon: "bg-rose-50 dark:bg-rose-950/60",
      textIcon: "text-rose-600 dark:text-rose-400",
      badge:
        "bg-rose-50 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300 border-rose-200 dark:border-rose-800",
      border: "hover:border-rose-300 dark:hover:border-rose-700",
    },
    amber: {
      bgIcon: "bg-amber-50 dark:bg-amber-950/60",
      textIcon: "text-amber-600 dark:text-amber-400",
      badge:
        "bg-amber-50 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300 border-amber-200 dark:border-amber-800",
      border: "hover:border-amber-300 dark:hover:border-amber-700",
    },
    emerald: {
      bgIcon: "bg-emerald-50 dark:bg-emerald-950/60",
      textIcon: "text-emerald-600 dark:text-emerald-400",
      badge:
        "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
      border: "hover:border-emerald-300 dark:hover:border-emerald-700",
    },
    purple: {
      bgIcon: "bg-purple-50 dark:bg-purple-950/60",
      textIcon: "text-purple-600 dark:text-purple-400",
      badge:
        "bg-purple-50 text-purple-700 dark:bg-purple-950/70 dark:text-purple-300 border-purple-200 dark:border-purple-800",
      border: "hover:border-purple-300 dark:hover:border-purple-700",
    },
    cyan: {
      bgIcon: "bg-cyan-50 dark:bg-cyan-950/60",
      textIcon: "text-cyan-600 dark:text-cyan-400",
      badge:
        "bg-cyan-50 text-cyan-700 dark:bg-cyan-950/70 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800",
      border: "hover:border-cyan-300 dark:hover:border-cyan-700",
    },
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
      {cards.map((c, i) => {
        const style = colorStyles[c.color] || colorStyles.blue;
        const Icon = c.icon;
        return (
          <div
            key={i}
            className={`flex flex-col justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 transition-all duration-200 shadow-xs ${style.border}`}
          >
            <div className="flex items-start justify-between gap-2 mb-3">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-wide">
                {c.title}
              </span>
              <div className={`p-2 rounded-xl ${style.bgIcon} ${style.textIcon}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>

            <div>
              <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 font-mono">
                {c.value}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                {c.subtitle}
              </p>
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
              <span
                className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full border ${style.badge}`}
              >
                {c.badge}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

