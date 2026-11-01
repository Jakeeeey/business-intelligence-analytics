"use client";

import React from "react";
import { Building2, Clock, ArrowUpRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CompanyResignationSummary } from "../types";

interface CompanyResignationCardsProps {
  summaries: CompanyResignationSummary[];
  selectedCompany: string;
  onSelectCompany: (companyCode: string) => void;
}

export function CompanyResignationCards({
  summaries,
  selectedCompany,
  onSelectCompany,
}: CompanyResignationCardsProps) {
  if (!summaries || summaries.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground tracking-tight">
            Operating Entities Resignation Profile
          </h3>
          <span className="text-xs text-muted-foreground">({summaries.length} companies)</span>
        </div>
        {selectedCompany !== "ALL" && (
          <button
            onClick={() => onSelectCompany("ALL")}
            className="text-xs text-primary hover:underline font-medium"
          >
            Show All Companies
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {summaries.map((comp) => {
          const isSelected = selectedCompany === comp.companyCode;
          const isOffline = comp.status === "OFFLINE";
          const resolved = comp.approvedCount + comp.completedCount;

          return (
            <Card
              key={comp.companyId}
              onClick={() => onSelectCompany(isSelected ? "ALL" : comp.companyCode)}
              className={`cursor-pointer transition-all duration-200 border rounded-2xl relative overflow-hidden group ${
                isSelected
                  ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/30"
                  : "border-border bg-card hover:border-primary/40 hover:shadow-xs"
              }`}
            >
              <CardContent className="p-4 space-y-3">
                {/* Header: Company Name & Code */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`inline-block h-2 w-2 rounded-full ${
                          isOffline ? "bg-muted-foreground/50" : "bg-emerald-500"
                        }`}
                      />
                      <span className="text-xs font-bold text-foreground truncate">
                        {comp.companyName}
                      </span>
                    </div>
                    <span className="text-[11px] text-muted-foreground uppercase font-mono">
                      {comp.companyCode}
                    </span>
                  </div>

                  <Badge
                    variant={isOffline ? "secondary" : comp.totalResignations > 0 ? "outline" : "secondary"}
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-lg border-border"
                  >
                    {isOffline ? "Offline" : `${comp.totalResignations} filed`}
                  </Badge>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-3 gap-2 py-1.5 border-y border-border/60 text-center">
                  <div>
                    <div className="text-[10px] text-muted-foreground">Pending</div>
                    <div className="text-sm font-bold text-amber-600 dark:text-amber-400">
                      {comp.pendingCount}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-muted-foreground">Processed</div>
                    <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                      {resolved}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-muted-foreground">Turnover</div>
                    <div className="text-sm font-bold text-foreground">
                      {comp.turnoverRate}%
                    </div>
                  </div>
                </div>

                {/* Bottom row: Compliance & Notice info */}
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Avg: {comp.avgNoticeDays}d notice
                  </span>
                  <span className="font-medium text-foreground">
                    {comp.complianceRate}% 30d compliant
                  </span>
                </div>

                {/* Select indicator */}
                <div className="flex items-center justify-between pt-1 text-[11px] text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  <span>{isSelected ? "Active Filter" : "Click to isolate company"}</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

