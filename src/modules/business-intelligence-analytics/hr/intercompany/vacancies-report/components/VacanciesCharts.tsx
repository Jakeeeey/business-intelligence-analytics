"use client";

import React, { useSyncExternalStore } from "react";
import {
  DepartmentVacanciesSummary,
  UrgencyDistributionSegment,
  PurposeDistributionSegment,
} from "../types";
import { Layers, Flame, Target } from "lucide-react";

interface VacanciesChartsProps {
  departmentSummaries: DepartmentVacanciesSummary[];
  urgencyDistribution: UrgencyDistributionSegment[];
  purposeDistribution: PurposeDistributionSegment[];
}

const emptySubscribe = () => () => {};

export const VacanciesCharts: React.FC<VacanciesChartsProps> = ({
  departmentSummaries,
  urgencyDistribution,
  purposeDistribution,
}) => {
  const isClient = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  if (!isClient) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-64 bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl animate-pulse"
          />
        ))}
      </div>
    );
  }

  const topDepartments = departmentSummaries.slice(0, 6);
  const maxDeptOpen = Math.max(1, ...topDepartments.map((d) => d.openVacancies));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* 1. Department Breakdown */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Vacancies by Department
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Functional business unit concentration
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {topDepartments.length === 0 ? (
              <div className="text-xs text-slate-400 py-6 text-center">
                No active department vacancies recorded
              </div>
            ) : (
              topDepartments.map((dept, idx) => {
                const widthPct = Math.round((dept.openVacancies / maxDeptOpen) * 100);
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[200px]">
                        {dept.department}
                      </span>
                      <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                        {dept.openVacancies} {dept.openVacancies === 1 ? "seat" : "seats"}
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(5, widthPct)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
          <span>{departmentSummaries.length} total departments hiring</span>
          <span>Ranked by open headcount</span>
        </div>
      </div>

      {/* 2. Urgency Distribution */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
                <Flame className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Requisition Urgency Index
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Aging &amp; replacement critical levels
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3.5">
            {urgencyDistribution.map((item, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {item.urgency} Urgency
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">
                      {item.urgency === "Critical"
                        ? "Replacements or open > 60 days"
                        : item.urgency === "Moderate"
                        ? "Open 30 to 60 days"
                        : "Recently approved (< 30 days)"}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm font-bold font-mono text-slate-900 dark:text-slate-100">
                    {item.count}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                    {item.percentage}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
          <span>Target fill SLA: &lt; 30 days</span>
          <span>Auto-escalation active</span>
        </div>
      </div>

      {/* 3. Requisition Purpose Composition */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                <Target className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Purpose Composition
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Expansion vs. continuity backfill
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {purposeDistribution.length === 0 ? (
              <div className="text-xs text-slate-400 py-6 text-center">
                No purpose breakdown recorded
              </div>
            ) : (
              purposeDistribution.map((p, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: p.color }}
                      />
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {p.purpose}
                      </span>
                    </div>
                    <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                      {p.count} ({p.percentage}%)
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        backgroundColor: p.color,
                        width: `${Math.max(5, p.percentage)}%`,
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
          <span>Headcount authorization audit</span>
          <span>Verified against budget</span>
        </div>
      </div>
    </div>
  );
};

