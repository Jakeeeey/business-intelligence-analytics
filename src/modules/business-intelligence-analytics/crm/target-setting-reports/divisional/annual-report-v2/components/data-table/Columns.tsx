"use client";

import { type ColumnDef, type Column } from "@tanstack/react-table";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import type { MonthlyAggregate } from "../../types/annual-report.schema";

function SortHeader({ column, label }: { column: Column<MonthlyAggregate, unknown>; label: string }) {
  const sorted = column.getIsSorted();
  return (
    <Button
      variant="ghost"
      onClick={() => column.toggleSorting(sorted === "asc")}
      className="font-semibold px-0 hover:bg-transparent text-xs h-7"
    >
      {label}
      {sorted === "asc" ? (
        <ArrowUp className="ml-1 h-3 w-3" />
      ) : sorted === "desc" ? (
        <ArrowDown className="ml-1 h-3 w-3" />
      ) : (
        <ArrowUpDown className="ml-1 h-3 w-3 opacity-40" />
      )}
    </Button>
  );
}

export const columns: ColumnDef<MonthlyAggregate>[] = [
  {
    accessorKey: "monthLabel",
    header: ({ column }) => <SortHeader column={column} label="Month" />,
    meta: { label: "Month" },
  },

  {
    accessorKey: "totalSales",
    header: ({ column }) => <SortHeader column={column} label="Total Sales" />,
    cell: ({ row }) => (
      <span className="text-blue-600 dark:text-blue-400 font-medium tabular-nums">
        {formatCurrency(row.original.totalSales)}
      </span>
    ),
    meta: { label: "Total Sales" },
  },
  {
    accessorKey: "totalPurchases",
    header: ({ column }) => <SortHeader column={column} label="Total Purchases" />,
    cell: ({ row }) => (
      <span className="text-red-600 dark:text-red-400 font-medium tabular-nums">
        {formatCurrency(row.original.totalPurchases)}
      </span>
    ),
    meta: { label: "Total Purchases" },
  },
  {
    accessorKey: "variance",
    header: ({ column }) => <SortHeader column={column} label="Variance" />,
    cell: ({ row }) => {
      const variance = row.original.variance;
      return (
        <span
          className={`font-medium tabular-nums flex items-center gap-1 ${
            variance >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
          }`}
        >
          {variance >= 0 ? (
            <ArrowUp className="h-3 w-3" />
          ) : (
            <ArrowDown className="h-3 w-3" />
          )}
          {formatCurrency(variance)}
        </span>
      );
    },
    meta: { label: "Variance" },
  },
  {
    accessorKey: "biasPercentage",
    header: ({ column }) => <SortHeader column={column} label="Bias %" />,
    cell: ({ row }) => (
      <span className="font-mono tabular-nums text-muted-foreground">
        {row.original.biasPercentage.toFixed(2)}%
      </span>
    ),
    meta: { label: "Bias %" },
  },
];
