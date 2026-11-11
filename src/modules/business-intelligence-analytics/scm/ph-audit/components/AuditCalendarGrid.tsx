"use client";

import React, { useMemo } from "react";
import {
  PhysicalInventoryRecord,
  BranchLookup,
} from "../types";
import { InventoryAuditScheduleCell } from "./InventoryAuditScheduleCell";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarX } from "lucide-react";

interface Props {
  selectedYear: number;
  selectedMonth: number;
  daysInMonth: number;
  branches: BranchLookup[];
  records: PhysicalInventoryRecord[];
  currentInventoryByBranch: Record<number, number>;
  lastCommittedByBranch: Record<number, string>;
  loading: boolean;
}

interface BranchRow {
  branch: BranchLookup;
  records: PhysicalInventoryRecord[];
  pesoValue: number;
  lastCommittedDate?: string;
}

function formatCurrency(val: number): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val);
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

// Strict explicit width definitions for fixed columns
const BRANCH_WIDTH = 200;
const INVENTORY_WIDTH = 170;
const DAY_WIDTH = 76;

function getInventoryColorClass(val: number): string {
  if (Math.abs(val) <= 0.001) {
    return "text-muted-foreground/70 font-medium";
  }
  if (val > 0) {
    return "text-emerald-600 dark:text-emerald-400 font-bold";
  }
  return "text-rose-600 dark:text-rose-400 font-bold";
}

export const AuditCalendarGrid: React.FC<Props> = ({
  selectedYear,
  selectedMonth,
  daysInMonth,
  branches,
  records,
  currentInventoryByBranch,
  lastCommittedByBranch,
  loading,
}) => {
  const daysArray = useMemo(
    () => Array.from({ length: daysInMonth }, (_, i) => i + 1),
    [daysInMonth]
  );

  // Group records directly by branch, applying filter:
  // - Show branch if Peso Value is non-zero (+ or -)
  // - If Peso Value is 0, hide it UNLESS it has PH records for the period
  const branchRows = useMemo(() => {
    const list: BranchRow[] = [];

    branches.forEach((branch) => {
      const branchRecords = records.filter((r) => r.branch_id === branch.id);
      const pesoVal = currentInventoryByBranch[branch.id] ?? 0;
      const lastCommitted = lastCommittedByBranch[branch.id];

      const hasPh = branchRecords.length > 0;
      const hasPeso = Math.abs(pesoVal) > 0.001;

      if (!hasPeso && !hasPh) {
        return;
      }

      list.push({
        branch,
        records: branchRecords,
        pesoValue: pesoVal,
        lastCommittedDate: lastCommitted,
      });
    });

    return list;
  }, [branches, records, currentInventoryByBranch, lastCommittedByBranch]);

  // Current day indicator
  const today = new Date();
  const isCurrentMonthView =
    today.getFullYear() === selectedYear &&
    today.getMonth() + 1 === selectedMonth;
  const currentDay = isCurrentMonthView ? today.getDate() : -1;

  // When loading, show synchronous skeleton table
  if (loading) {
    return (
      <div className="rounded-lg border bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto w-full">
          <table className="w-max min-w-full border-separate border-spacing-0 text-left text-xs table-fixed">
            <thead>
              <tr className="bg-muted/40 text-muted-foreground">
                <th
                  style={{
                    position: "sticky",
                    left: 0,
                    top: 0,
                    zIndex: 40,
                    width: `${BRANCH_WIDTH}px`,
                    minWidth: `${BRANCH_WIDTH}px`,
                    maxWidth: `${BRANCH_WIDTH}px`,
                  }}
                  className="px-3.5 py-2.5 font-semibold border-b border-r bg-muted/95 backdrop-blur shadow-[1px_0_0_0_hsl(var(--border))]"
                >
                  Branch
                </th>
                <th
                  style={{
                    position: "sticky",
                    left: `${BRANCH_WIDTH}px`,
                    top: 0,
                    zIndex: 40,
                    width: `${INVENTORY_WIDTH}px`,
                    minWidth: `${INVENTORY_WIDTH}px`,
                    maxWidth: `${INVENTORY_WIDTH}px`,
                  }}
                  className="px-3.5 py-2.5 font-semibold text-right border-b border-r bg-muted/95 backdrop-blur shadow-[2px_0_5px_-2px_rgba(0,0,0,0.12)]"
                >
                  Current Inventory
                </th>
                {daysArray.map((day) => (
                  <th
                    key={day}
                    style={{
                      width: `${DAY_WIDTH}px`,
                      minWidth: `${DAY_WIDTH}px`,
                      maxWidth: `${DAY_WIDTH}px`,
                    }}
                    className="text-center px-1 py-2 font-medium border-b border-r text-muted-foreground"
                  >
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 7 }).map((_, rIdx) => (
                <tr key={`skel-row-${rIdx}`} className="h-11 border-b">
                  <td
                    style={{
                      position: "sticky",
                      left: 0,
                      zIndex: 20,
                      width: `${BRANCH_WIDTH}px`,
                      minWidth: `${BRANCH_WIDTH}px`,
                      maxWidth: `${BRANCH_WIDTH}px`,
                    }}
                    className="px-3.5 py-2 border-b border-r bg-card shadow-[1px_0_0_0_hsl(var(--border))]"
                  >
                    <Skeleton className="h-4 w-28" />
                  </td>
                  <td
                    style={{
                      position: "sticky",
                      left: `${BRANCH_WIDTH}px`,
                      zIndex: 20,
                      width: `${INVENTORY_WIDTH}px`,
                      minWidth: `${INVENTORY_WIDTH}px`,
                      maxWidth: `${INVENTORY_WIDTH}px`,
                    }}
                    className="px-3.5 py-2 border-b border-r bg-card text-right shadow-[2px_0_5px_-2px_rgba(0,0,0,0.12)]"
                  >
                    <Skeleton className="h-4 w-24 ml-auto" />
                  </td>
                  {daysArray.map((d) => (
                    <td
                      key={`skel-col-${rIdx}-${d}`}
                      style={{
                        width: `${DAY_WIDTH}px`,
                        minWidth: `${DAY_WIDTH}px`,
                        maxWidth: `${DAY_WIDTH}px`,
                      }}
                      className="border-b border-r border-border/40 p-1"
                    >
                      {(rIdx === 1 && d >= 12 && d <= 13) ||
                      (rIdx === 2 && d >= 18 && d <= 21) ||
                      (rIdx === 4 && d >= 5 && d <= 9) ? (
                        <Skeleton className="h-8 w-full rounded" />
                      ) : null}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (branchRows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-16 rounded-lg border bg-card text-muted-foreground gap-2">
        <CalendarX className="h-8 w-8 stroke-1 text-muted-foreground" />
        <span className="text-sm font-medium text-foreground">No audit schedules found</span>
        <span className="text-xs text-muted-foreground">No inventory records or active inventory values for this period.</span>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card overflow-hidden shadow-sm">
      <div className="overflow-x-auto w-full">
        <table className="w-max min-w-full border-separate border-spacing-0 text-left text-xs table-fixed">
          <thead>
            <tr className="bg-muted/40 text-muted-foreground">
              {/* Branch */}
              <th
                style={{
                  position: "sticky",
                  left: 0,
                  top: 0,
                  zIndex: 40,
                  width: `${BRANCH_WIDTH}px`,
                  minWidth: `${BRANCH_WIDTH}px`,
                  maxWidth: `${BRANCH_WIDTH}px`,
                }}
                className="px-3.5 py-2.5 font-semibold border-b border-r bg-muted/95 backdrop-blur shadow-[1px_0_0_0_hsl(var(--border))]"
              >
                Branch
              </th>

              {/* Current Inventory (Peso Value) & Last Committed Date */}
              <th
                style={{
                  position: "sticky",
                  left: `${BRANCH_WIDTH}px`,
                  top: 0,
                  zIndex: 40,
                  width: `${INVENTORY_WIDTH}px`,
                  minWidth: `${INVENTORY_WIDTH}px`,
                  maxWidth: `${INVENTORY_WIDTH}px`,
                }}
                className="px-3.5 py-2.5 font-semibold text-right border-b border-r bg-muted/95 backdrop-blur shadow-[2px_0_5px_-2px_rgba(0,0,0,0.12)]"
              >
                Current Inventory
              </th>

              {/* Days (1, 2, 3...) */}
              {daysArray.map((day) => {
                const isToday = day === currentDay;
                return (
                  <th
                    key={day}
                    style={{
                      width: `${DAY_WIDTH}px`,
                      minWidth: `${DAY_WIDTH}px`,
                      maxWidth: `${DAY_WIDTH}px`,
                    }}
                    className={`text-center px-1 py-2 font-medium border-b border-r ${
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

          <tbody>
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
                      style={{
                        width: `${DAY_WIDTH}px`,
                        minWidth: `${DAY_WIDTH}px`,
                        maxWidth: `${DAY_WIDTH}px`,
                      }}
                      className={`h-11 border-b border-r border-border/40 ${
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
                  <td
                    style={{
                      position: "sticky",
                      left: 0,
                      zIndex: 20,
                      width: `${BRANCH_WIDTH}px`,
                      minWidth: `${BRANCH_WIDTH}px`,
                      maxWidth: `${BRANCH_WIDTH}px`,
                    }}
                    className="px-3.5 py-2.5 font-bold text-foreground border-b border-r bg-card truncate shadow-[1px_0_0_0_hsl(var(--border))]"
                  >
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

                  {/* Current Inventory per Branch & Last Committed Cutoff Date */}
                  <td
                    style={{
                      position: "sticky",
                      left: `${BRANCH_WIDTH}px`,
                      zIndex: 20,
                      width: `${INVENTORY_WIDTH}px`,
                      minWidth: `${INVENTORY_WIDTH}px`,
                      maxWidth: `${INVENTORY_WIDTH}px`,
                    }}
                    className="px-3.5 py-2 text-right border-b border-r bg-card font-mono shadow-[2px_0_5px_-2px_rgba(0,0,0,0.12)]"
                  >
                    <div className="flex flex-col items-end leading-tight">
                      <span className={getInventoryColorClass(row.pesoValue)}>
                        {formatCurrency(row.pesoValue)}
                      </span>
                      <span className="text-[10px] text-muted-foreground/80 font-sans tracking-tight mt-0.5">
                        {row.lastCommittedDate ? (
                          formatDate(row.lastCommittedDate)
                        ) : (
                          <span className="text-muted-foreground/50">-</span>
                        )}
                      </span>
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
