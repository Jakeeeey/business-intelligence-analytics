"use client";

import React from "react";
import { Building2 } from "lucide-react";
import { CompanyVacanciesSummary } from "../types";

interface CompanyVacanciesCardsProps {
  summaries: CompanyVacanciesSummary[];
  selectedCompany: string;
  onSelectCompany: (companyCode: string) => void;
}

export const CompanyVacanciesCards: React.FC<CompanyVacanciesCardsProps> = ({
  summaries,
  selectedCompany,
  onSelectCompany,
}) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <Building2 className="w-3.5 h-3.5 text-indigo-500" />
          Operating Entity Vacancy Distribution
        </h3>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          Click an entity to isolate its open requisitions
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-10 gap-2.5">
        {summaries.map((comp) => {
          const isSelected =
            selectedCompany.toUpperCase() === comp.companyCode.toUpperCase();
          const isOffline = comp.status === "OFFLINE";

          return (
            <button
              key={comp.companyId}
              onClick={() => onSelectCompany(comp.companyCode)}
              className={`flex flex-col justify-between p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                isSelected
                  ? "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 ring-2 ring-indigo-500/20 shadow-xs"
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold font-mono text-slate-900 dark:text-slate-100">
                    {comp.companyCode}
                  </span>
                  {isOffline ? (
                    <span className="h-2 w-2 rounded-full bg-slate-300 dark:bg-slate-700" title="Offline" />
                  ) : comp.openVacancies > 0 ? (
                    <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" title="Open Vacancies" />
                  ) : (
                    <span className="h-2 w-2 rounded-full bg-emerald-500" title="Fully Staffed" />
                  )}
                </div>

                <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate" title={comp.companyName}>
                  {comp.companyName}
                </div>
              </div>

              <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-baseline justify-between">
                <div>
                  <div className="text-sm font-bold font-mono text-slate-900 dark:text-slate-100">
                    {isOffline ? "-" : comp.openVacancies}
                  </div>
                  <div className="text-[9px] text-slate-500 dark:text-slate-400 uppercase font-medium">
                    Vacancies
                  </div>
                </div>

                {!isOffline && (
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                    {comp.sharePercentage}%
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

