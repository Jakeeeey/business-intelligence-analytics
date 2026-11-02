"use client";

import React, { useMemo } from "react";
import {
  PhysicalInventoryRecord,
  BranchLookup,
} from "../types";
import { InventoryAuditScheduleCell } from "./InventoryAuditScheduleCell";
import { Spinner } from "@/components/ui/spinner";
import { CalendarX } from "lucide-react";

interface Props {
  selectedYear: number;
  selectedMonth: number;
  daysInMonth: number;
  branches: BranchLookup[];
  records: PhysicalInventoryRecord[];
  loading: boolean;
}

interface BranchRow {
  branch: BranchLookup;
  records: PhysicalInventoryRecord[];
}

export const AuditCalendarGrid: React.FC<Props> = ({
  selectedYear,
  selectedMonth,
  daysInMonth,
  branches,
  records,
  loading,
}) => {
  const daysArray = useMemo(
    () => Array.from({ length: daysInMonth }, (_, i) => i + 1),
    [daysInMonth]
  );

  // Group records directly by branch (no suppliers)
  const branchRows: BranchRow[] = useMemo(() => {
    return branches
      .map((branch) => {
        const branchRecords = records.filter((r) => r.branch_id === branch.id);
        return {
          branch,
          records: branchRecords,
        };
      })
      .filter((row) => row.records.length > 0);
  }, [branches, records]);

  // Current day indicator
  const today = new Date();
  const isCurrentMonthView =
    today.getFullYear() === selectedYear &&
    today.getMonth() + 1 === selectedMonth;
  const currentDay = isCurrentMonthView ? today.getDate() : -1;

  if (loading && records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-16 rounded-lg border bg-card text-muted-foreground gap-3">
        <Spinner className="h-6 w-6" />
        <span className="text-sm">Loading audit schedule...</span>
      </div>
    );
  }

  if (branchRows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-16 rounded-lg border bg-card text-muted-foreground gap-2">
        <CalendarX className="h-8 w-8 stroke-1 text-muted-foreground" />
        <span className="text-sm font-medium text-foreground">No audit schedules found</span>
        <span className="text-xs text-muted-foreground">No inventory records for this period.</span>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="border-b bg-muted/40 text-muted-foreground">
              {/* Branch */}
              <th className="sticky left-0 z-30 min-w-[180px] max-w-[240px] px-3.5 py-2.5 font-semibold border-r bg-muted/90 backdrop-blur">
                Branch
              </th>

              {/* Days (1, 2, 3...) */}
              {daysArray.map((day) => {
                const isToday = day === currentDay;
                return (
                  <th
                    key={day}
                    className={`min-w-[42px] max-w-[50px] text-center px-1 py-2 font-medium border-r ${
                      isToday
                        ? "bg-primary/10 text-primary font-bold"
                        : "text-muted-foreground"
                    }`}
                  >
                    {day}
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody className="divide-y divide-border">
            {branchRows.map((row) => {
              const dayToRecord = new Map<number, PhysicalInventoryRecord>();

              row.records.forEach((rec) => {
                const startDate = new Date(rec.starting_date);
                const endDate = new Date(rec.cutOff_date);

                let startDay = 1;
                let endDay = daysInMonth;

                if (
                  startDate.getFullYear() === selectedYear &&
                  startDate.getMonth() + 1 === selectedMonth
                ) {
                  startDay = startDate.getDate();
                }

                if (
                  endDate.getFullYear() === selectedYear &&
                  endDate.getMonth() + 1 === selectedMonth
                ) {
                  endDay = endDate.getDate();
                }

                for (let d = startDay; d <= endDay; d++) {
                  if (!dayToRecord.has(d)) {
                    dayToRecord.set(d, rec);
                  }
                }
              });

              const renderedCells: React.ReactNode[] = [];
              let currentDayIdx = 1;

              while (currentDayIdx <= daysInMonth) {
                const rec = dayToRecord.get(currentDayIdx);

                if (rec) {
                  let span = 1;
                  while (
                    currentDayIdx + span <= daysInMonth &&
                    dayToRecord.get(currentDayIdx + span)?.id === rec.id
                  ) {
                    span++;
                  }

                  renderedCells.push(
                    <InventoryAuditScheduleCell
                      key={`cell-${row.branch.id}-${rec.id}-${currentDayIdx}`}
                      record={rec}
                      colSpan={span}
                    />
                  );

                  currentDayIdx += span;
                } else {
                  const isToday = currentDayIdx === currentDay;
                  renderedCells.push(
                    <td
                      key={`empty-${row.branch.id}-${currentDayIdx}`}
                      className={`h-11 min-w-[42px] border-r border-border/40 ${
                        isToday ? "bg-primary/[0.03]" : ""
                      }`}
                    />
                  );
                  currentDayIdx++;
                }
              }

              return (
                <tr
                  key={`row-${row.branch.id}`}
                  className="hover:bg-muted/30 transition-colors"
                >
                  {/* Branch Name / Code */}
                  <td className="sticky left-0 z-20 px-3.5 py-2.5 font-bold text-foreground border-r bg-card truncate max-w-[240px]">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold truncate" title={row.branch.name}>
                        {row.branch.name}
                      </span>
                      {row.branch.code && (
                        <span className="text-[11px] font-normal text-muted-foreground truncate">
                          Code: {row.branch.code}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Days */}
                  {renderedCells}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

