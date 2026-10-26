"use client";

import React from "react";
import { Building2, Users, CheckCircle2, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CompanyAttendanceSummary } from "../types";

interface CompanySummaryCardsProps {
  summaries: CompanyAttendanceSummary[];
  selectedCompanyId: string;
  onSelectCompany: (companyId: string) => void;
}

export function CompanySummaryCards({
  summaries,
  selectedCompanyId,
  onSelectCompany,
}: CompanySummaryCardsProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-cyan-500" />
          <h3 className="text-sm font-semibold tracking-tight text-foreground">
            Subsidiary Companies Summary
          </h3>
          <span className="text-xs text-muted-foreground">
            (Click card to filter personnel)
          </span>
        </div>
        {selectedCompanyId !== "ALL" && (
          <button
            type="button"
            onClick={() => onSelectCompany("ALL")}
            className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 hover:underline cursor-pointer"
          >
            Show All Companies
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {summaries.map((c) => {
          const isSelected = selectedCompanyId === String(c.companyId);
          const isOffline = c.status === "OFFLINE";

          return (
            <Card
              key={c.companyId}
              onClick={() => {
                if (isOffline) return;
                onSelectCompany(isSelected ? "ALL" : String(c.companyId));
              }}
              className={`border transition-all rounded-xl select-none cursor-pointer ${
                isSelected
                  ? "border-cyan-500 bg-cyan-500/5 ring-1 ring-cyan-500 shadow-sm"
                  : isOffline
                  ? "opacity-60 bg-muted/30 border-border cursor-not-allowed"
                  : "border-border bg-card hover:border-cyan-500/50 hover:shadow-xs"
              }`}
            >
              <CardContent className="p-4 space-y-3">
                {/* Header: Code badge, Name, Status */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-bold font-mono bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                        {c.companyCode}
                      </span>
                      {isOffline ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-500">
                          <AlertCircle className="h-3 w-3" /> Offline
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-500">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Active
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-semibold text-foreground truncate mt-1" title={c.companyName}>
                      {c.companyName}
                    </h4>
                  </div>
                </div>

                {/* Headcount & Attendance Rate */}
                {!isOffline ? (
                  <div className="space-y-2">
                    <div className="flex items-baseline justify-between">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground font-medium">
                        <Users className="h-3.5 w-3.5" />
                        <span>{c.totalEmployees.toLocaleString()} Staff</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>{c.attendanceRate}% Present</span>
                      </div>
                    </div>

                    <Progress value={c.attendanceRate} className="h-1.5 bg-muted" />

                    {/* Chips for Present, Late, Absent */}
                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-border/50 text-muted-foreground">
                      <span>
                        <strong className="text-emerald-600 dark:text-emerald-400 font-semibold">
                          {c.presentCount}
                        </strong>{" "}
                        present
                      </span>
                      <span>
                        <strong className="text-amber-600 dark:text-amber-400 font-semibold">
                          {c.lateCount}
                        </strong>{" "}
                        late
                      </span>
                      <span>
                        <strong className="text-rose-600 dark:text-rose-400 font-semibold">
                          {c.absentCount}
                        </strong>{" "}
                        absent
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic py-2">
                    Directus node unreachable during sync
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
