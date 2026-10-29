"use client";

import React, { useMemo } from "react";
import {
  PhysicalInventoryRecord,
  BranchLookup,
  SupplierLookup,
} from "../types";
import { InventoryScheduleCell } from "./InventoryScheduleCell";
import { Spinner } from "@/components/ui/spinner";
import { CalendarX } from "lucide-react";

interface Props {
  selectedYear: number;
  selectedMonth: number;
  daysInMonth: number;
  branches: BranchLookup[];
  suppliers: SupplierLookup[];
  records: PhysicalInventoryRecord[];
  loading: boolean;
}

interface GroupedRow {
  supplierId: number;
  supplierName: string;
  records: PhysicalInventoryRecord[];
}

interface BranchGroup {
  branch: BranchLookup;
  rows: GroupedRow[];
}

export const WarehouseCalendarGrid: React.FC<Props> = ({
  selectedYear,
  selectedMonth,
  daysInMonth,
  branches,
  suppliers,
  records,
  loading,
}) => {
  const daysArray = useMemo(
    () => Array.from({ length: daysInMonth }, (_, i) => i + 1),
    [daysInMonth]
  );

  const groupedData: BranchGroup[] = useMemo(() => {
    const supplierMap = new Map<number, string>();
    suppliers.forEach((s) => supplierMap.set(s.id, s.shortcut || s.name));

    return branches
      .map((branch) => {
        const branchRecords = records.filter((r) => r.branch_id === branch.id);
        const supplierRecordsMap = new Map<number, PhysicalInventoryRecord[]>();

        branchRecords.forEach((r) => {
          const list = supplierRecordsMap.get(r.supplier_id) || [];
          list.push(r);
          supplierRecordsMap.set(r.supplier_id, list);
        });

        const rows: GroupedRow[] = [];
        supplierRecordsMap.forEach((recList, sId) => {
          const sName =
            supplierMap.get(sId) ||
            recList[0]?.supplier_shortcut ||
            recList[0]?.supplier_name ||
            `Supplier #${sId}`;

          rows.push({
            supplierId: sId,
            supplierName: sName,
            records: recList,
          });
        });

        rows.sort((a, b) => a.supplierName.localeCompare(b.supplierName));

        return {
          branch,
          rows,
        };
      })
      .filter((g) => g.rows.length > 0);
  }, [branches, suppliers, records]);

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
        <span className="text-sm">Loading schedule...</span>
      </div>
    );
  }

  if (groupedData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-16 rounded-lg border bg-card text-muted-foreground gap-2">
        <CalendarX className="h-8 w-8 stroke-1 text-muted-foreground" />
        <span className="text-sm font-medium text-foreground">No schedules found</span>
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
              <th className="sticky left-0 z-30 min-w-[120px] px-3.5 py-2.5 font-semibold border-r bg-muted/90 backdrop-blur">
                Branch
              </th>

              {/* Suppliers */}
              <th className="sticky left-[120px] z-30 min-w-[150px] max-w-[200px] px-3.5 py-2.5 font-semibold border-r bg-muted/90 backdrop-blur">
                Supplier
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
            {groupedData.map((group) => {
              const branchTotalRows = group.rows.length;

              return group.rows.map((row, rowIndex) => {
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
                      <InventoryScheduleCell
                        key={`cell-${row.supplierId}-${rec.id}-${currentDayIdx}`}
                        record={rec}
                        colSpan={span}
                      />
                    );

                    currentDayIdx += span;
                  } else {
                    const isToday = currentDayIdx === currentDay;
                    renderedCells.push(
                      <td
                        key={`empty-${row.supplierId}-${currentDayIdx}`}
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
                    key={`row-${group.branch.id}-${row.supplierId}`}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    {/* Branch (merged across its suppliers) */}
                    {rowIndex === 0 && (
                      <td
                        rowSpan={branchTotalRows}
                        className="sticky left-0 z-20 px-3.5 py-2.5 font-bold text-foreground border-r bg-card align-top text-sm"
                      >
                        <div className="sticky top-12">
                          <span>{group.branch.code || group.branch.name}</span>
                        </div>
                      </td>
                    )}

                    {/* Supplier */}
                    <td className="sticky left-[120px] z-20 px-3.5 py-2 font-medium text-foreground border-r bg-card truncate max-w-[200px]">
                      <span className="truncate block" title={row.supplierName}>
                        {row.supplierName}
                      </span>
                    </td>

                    {/* Days */}
                    {renderedCells}
                  </tr>
                );
              });
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
