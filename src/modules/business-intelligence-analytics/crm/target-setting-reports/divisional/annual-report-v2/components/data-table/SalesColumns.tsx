"use client";

import { type ColumnDef, type Column } from "@tanstack/react-table";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import type { SalesTransaction } from "../../types/annual-report.schema";

function SortHeader({ column, label }: { column: Column<SalesTransaction, unknown>; label: string }) {
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

export const salesColumns = (unitName?: string): ColumnDef<SalesTransaction>[] => [
  {
    accessorKey: "productName",
    header: ({ column }) => <SortHeader column={column} label="Product" />,
    cell: ({ row }) => (
      <span className="font-medium">{row.original.productName || "Unknown Product"}</span>
    ),
    meta: { label: "Product" },
  },
  {
    id: "monthYear",
    header: "Month",
    accessorFn: (row) => {
      const dateStr = row.invoiceDate;
      if (dateStr) {
        const parsed = new Date(dateStr);
        if (!isNaN(parsed.getTime())) {
          return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(parsed);
        }
      }
      return "Unknown Date";
    },
    meta: { label: "Month" }
  },
  {
    accessorKey: "cases",
    header: ({ column }) => (
      <div className="text-right">
        <SortHeader column={column} label="Cases" />
      </div>
    ),
    cell: ({ row }) => (
      <div className="text-right font-medium tabular-nums text-emerald-600 dark:text-emerald-500">
        {row.original.cases?.toLocaleString() ?? 0}
      </div>
    ),
    meta: { label: "Cases" },
  },
  {
    accessorKey: "totalInvoiceAmount",
    header: ({ column }) => (
      <div className="text-right">
        <SortHeader column={column} label={unitName ? "Quantity" : "Amount"} />
      </div>
    ),
    cell: ({ row }) => (
      <div className="text-right">
        <span className="text-blue-600 dark:text-blue-400 font-medium tabular-nums">
          {unitName ? (row.original.totalInvoiceAmount ?? 0).toLocaleString() : formatCurrency(row.original.totalInvoiceAmount ?? 0)}
        </span>
      </div>
    ),
    meta: { label: unitName ? "Quantity" : "Amount" },
  },
];
