"use client";

import React, { useMemo } from "react";
import {
  PhysicalInventoryRecord,
  BranchLookup,
  SupplierLookup,
  BranchSupplierInventoryItem,
} from "../types";
import { InventoryScheduleCell } from "./InventoryScheduleCell";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarX } from "lucide-react";

interface Props {
  selectedYear: number;
  selectedMonth: number;
  daysInMonth: number;
  branches: BranchLookup[];
  suppliers: SupplierLookup[];
  records: PhysicalInventoryRecord[];
  currentInventoryByBranch: Record<number, number>;
  branchSupplierInventory: BranchSupplierInventoryItem[];
  lastCommittedByBranchSupplier: Record<string, string>;
  loading: boolean;
}

interface GroupedRow {
  supplierId: number;
  supplierName: string;
  records: PhysicalInventoryRecord[];
  pesoValue: number;
  lastCommittedDate?: string;
}

interface BranchGroup {
  branch: BranchLookup;
  rows: GroupedRow[];
  totalBranchInventory: number;
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
const BRANCH_WIDTH = 130;
const SUPPLIER_WIDTH = 150;
const INVENTORY_WIDTH = 160;
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

export const WarehouseCalendarGrid: React.FC<Props> = ({
  selectedYear,
  selectedMonth,
  daysInMonth,
  branches,
  suppliers,
  records,
  currentInventoryByBranch,
  branchSupplierInventory,
  lastCommittedByBranchSupplier,
  loading,
}) => {
  const daysArray = useMemo(
    () => Array.from({ length: daysInMonth }, (_, i) => i + 1),
    [daysInMonth]
  );

  const groupedData: BranchGroup[] = useMemo(() => {
    const supplierMap = new Map<number, string>();
    suppliers.forEach((s) => supplierMap.set(s.id, s.shortcut || s.name));

    // Map branchId-supplierId -> inventory peso value
    const inventoryMap = new Map<string, number>();
    branchSupplierInventory.forEach((item) => {
      inventoryMap.set(`${item.branchId}-${item.supplierId}`, item.pesoValue);
    });

    return branches
      .map((branch) => {
        const branchRecords = records.filter((r) => r.branch_id === branch.id);
        const branchInventoryItems = branchSupplierInventory.filter(
          (bs) => bs.branchId === branch.id
        );

        const allSupplierIds = new Set<number>();
        branchRecords.forEach((r) => allSupplierIds.add(r.supplier_id));
        branchInventoryItems.forEach((bs) => allSupplierIds.add(bs.supplierId));

        const rows: GroupedRow[] = [];

        allSupplierIds.forEach((sId) => {
          const recList = branchRecords.filter((r) => r.supplier_id === sId);
          const key = `${branch.id}-${sId}`;
          const pesoVal = inventoryMap.get(key) ?? 0;

          const hasPh = recList.length > 0;
          const hasPeso = Math.abs(pesoVal) > 0.001;

          if (!hasPeso && !hasPh) {
            return;
          }

          const invItem = branchInventoryItems.find((b) => b.supplierId === sId);
          const sName =
            supplierMap.get(sId) ||
            recList[0]?.supplier_shortcut ||
            recList[0]?.supplier_name ||
            invItem?.supplierShortcut ||
            invItem?.supplierName ||
            `Supplier #${sId}`;

          const lastCommitted = lastCommittedByBranchSupplier[key];

          rows.push({
            supplierId: sId,
            supplierName: sName,
            records: recList,
            pesoValue: pesoVal,
            lastCommittedDate: lastCommitted,
          });
        });

        rows.sort((a, b) => a.supplierName.localeCompare(b.supplierName));

        const branchTotalPeso =
          currentInventoryByBranch[branch.id] ??
          rows.reduce((sum, r) => sum + r.pesoValue, 0);

        return {
          branch,
          rows,
          totalBranchInventory: branchTotalPeso,
        };
      })
      .filter((g) => g.rows.length > 0);
  }, [branches, suppliers, records, currentInventoryByBranch, branchSupplierInventory, lastCommittedByBranchSupplier]);

  // Current day indicator
  const today = new Date();
  const isCurrentMonthView =
    today.getFullYear() === selectedYear &&
    today.getMonth() + 1 === selectedMonth;
  const currentDay = isCurrentMonthView ? today.getDate() : -1;

  // When loading (either initial or filter switch), show synchronous skeleton table
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
                    width: `${SUPPLIER_WIDTH}px`,
                    minWidth: `${SUPPLIER_WIDTH}px`,
                    maxWidth: `${SUPPLIER_WIDTH}px`,
                  }}
                  className="px-3.5 py-2.5 font-semibold border-b border-r bg-muted/95 backdrop-blur shadow-[1px_0_0_0_hsl(var(--border))]"
                >
                  Supplier
                </th>
                <th
                  style={{
                    position: "sticky",
                    left: `${BRANCH_WIDTH + SUPPLIER_WIDTH}px`,
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
                    <Skeleton className="h-4 w-20" />
                  </td>
                  <td
                    style={{
                      position: "sticky",
                      left: `${BRANCH_WIDTH}px`,
                      zIndex: 20,
                      width: `${SUPPLIER_WIDTH}px`,
                      minWidth: `${SUPPLIER_WIDTH}px`,
                      maxWidth: `${SUPPLIER_WIDTH}px`,
                    }}
                    className="px-3.5 py-2 border-b border-r bg-card shadow-[1px_0_0_0_hsl(var(--border))]"
                  >
                    <Skeleton className="h-4 w-16" />
                  </td>
                  <td
                    style={{
                      position: "sticky",
                      left: `${BRANCH_WIDTH + SUPPLIER_WIDTH}px`,
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

  if (groupedData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-16 rounded-lg border bg-card text-muted-foreground gap-2">
        <CalendarX className="h-8 w-8 stroke-1 text-muted-foreground" />
        <span className="text-sm font-medium text-foreground">No schedules or inventory found</span>
        <span className="text-xs text-muted-foreground">
          No records match the active month or branch filters.
        </span>
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

              {/* Supplier */}
              <th
                style={{
                  position: "sticky",
                  left: `${BRANCH_WIDTH}px`,
                  top: 0,
                  zIndex: 40,
                  width: `${SUPPLIER_WIDTH}px`,
                  minWidth: `${SUPPLIER_WIDTH}px`,
                  maxWidth: `${SUPPLIER_WIDTH}px`,
                }}
                className="px-3.5 py-2.5 font-semibold border-b border-r bg-muted/95 backdrop-blur shadow-[1px_0_0_0_hsl(var(--border))]"
              >
                Supplier
              </th>

              {/* Current Inventory (Peso Value) */}
              <th
                style={{
                  position: "sticky",
                  left: `${BRANCH_WIDTH + SUPPLIER_WIDTH}px`,
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

                // Inventory value to display
                const displayInventoryVal =
                  row.pesoValue !== 0
                    ? row.pesoValue
                    : rowIndex === 0
                    ? group.totalBranchInventory
                    : 0;

                return (
                  <tr
                    key={`row-${group.branch.id}-${row.supplierId}`}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    {/* Branch (merged across its suppliers) */}
                    {rowIndex === 0 && (
                      <td
                        rowSpan={branchTotalRows}
                        style={{
                          position: "sticky",
                          left: 0,
                          zIndex: 20,
                          width: `${BRANCH_WIDTH}px`,
                          minWidth: `${BRANCH_WIDTH}px`,
                          maxWidth: `${BRANCH_WIDTH}px`,
                        }}
                        className="px-3.5 py-2.5 font-bold text-foreground border-b border-r bg-card align-top text-sm shadow-[1px_0_0_0_hsl(var(--border))]"
                      >
                        <div className="sticky top-12">
                          <span>{group.branch.code || group.branch.name}</span>
                        </div>
                      </td>
                    )}

                    {/* Supplier */}
                    <td
                      style={{
                        position: "sticky",
                        left: `${BRANCH_WIDTH}px`,
                        zIndex: 20,
                        width: `${SUPPLIER_WIDTH}px`,
                        minWidth: `${SUPPLIER_WIDTH}px`,
                        maxWidth: `${SUPPLIER_WIDTH}px`,
                      }}
                      className="px-3.5 py-2 font-medium text-foreground border-b border-r bg-card truncate shadow-[1px_0_0_0_hsl(var(--border))]"
                    >
                      <span className="truncate block" title={row.supplierName}>
                        {row.supplierName}
                      </span>
                    </td>

                    {/* Current Inventory per Branch / Supplier & Last Committed Date */}
                    <td
                      style={{
                        position: "sticky",
                        left: `${BRANCH_WIDTH + SUPPLIER_WIDTH}px`,
                        zIndex: 20,
                        width: `${INVENTORY_WIDTH}px`,
                        minWidth: `${INVENTORY_WIDTH}px`,
                        maxWidth: `${INVENTORY_WIDTH}px`,
                      }}
                      className="px-3.5 py-2 text-right border-b border-r bg-card font-mono shadow-[2px_0_5px_-2px_rgba(0,0,0,0.12)]"
                    >
                      <div className="flex flex-col items-end leading-tight">
                        <span className={getInventoryColorClass(displayInventoryVal)}>
                          {formatCurrency(displayInventoryVal)}
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
              });
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
