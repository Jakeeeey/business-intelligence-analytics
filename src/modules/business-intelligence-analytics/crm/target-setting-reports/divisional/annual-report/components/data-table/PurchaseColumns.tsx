"use client";

import { type ColumnDef, type Column } from "@tanstack/react-table";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import type { PurchaseTransaction } from "../../types/annual-report.schema";

function SortHeader({ column, label }: { column: Column<PurchaseTransaction, unknown>; label: string }) {
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

export const purchaseColumns: ColumnDef<PurchaseTransaction>[] = [
  {
    accessorKey: "receiptNo",
    header: ({ column }) => <SortHeader column={column} label="Receipt No" />,
    meta: { label: "Receipt No" },
  },
  {
    accessorKey: "receiptDate",
    header: ({ column }) => <SortHeader column={column} label="Receipt Date" />,
    cell: ({ row }) => (
      <span className="tabular-nums">
        {row.original.receiptDate}
      </span>
    ),
    meta: { label: "Receipt Date" },
  },
  {
    accessorKey: "supplierName",
    header: ({ column }) => <SortHeader column={column} label="Supplier Name" />,
    meta: { label: "Supplier Name" },
  },
  {
    accessorKey: "totalReceiptAmount",
    header: ({ column }) => <SortHeader column={column} label="Amount" />,
    cell: ({ row }) => (
      <span className="text-red-600 dark:text-red-400 font-medium tabular-nums">
        {formatCurrency(row.original.totalReceiptAmount)}
      </span>
    ),
    meta: { label: "Amount" },
  },
];
