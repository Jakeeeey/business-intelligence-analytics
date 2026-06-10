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

export const salesColumns: ColumnDef<SalesTransaction>[] = [
  {
    accessorKey: "invoiceNo",
    header: ({ column }) => <SortHeader column={column} label="Invoice No" />,
    meta: { label: "Invoice No" },
  },
  {
    accessorKey: "invoiceDate",
    header: ({ column }) => <SortHeader column={column} label="Invoice Date" />,
    cell: ({ row }) => (
      <span className="tabular-nums">
        {row.original.invoiceDate}
      </span>
    ),
    meta: { label: "Invoice Date" },
  },
  {
    accessorKey: "customerName",
    header: ({ column }) => <SortHeader column={column} label="Customer Name" />,
    meta: { label: "Customer Name" },
  },
  {
    accessorKey: "totalInvoiceAmount",
    header: ({ column }) => <SortHeader column={column} label="Amount" />,
    cell: ({ row }) => (
      <span className="text-blue-600 dark:text-blue-400 font-medium tabular-nums">
        {formatCurrency(row.original.totalInvoiceAmount)}
      </span>
    ),
    meta: { label: "Amount" },
  },
];
