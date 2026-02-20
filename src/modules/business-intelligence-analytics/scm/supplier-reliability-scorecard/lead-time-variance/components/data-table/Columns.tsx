"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from "date-fns";

export interface LeadTimeVarianceTableData {
  purchaseOrderNo: string;
  supplierName: string;
  poDate: string | null;
  receivingDate: string | null;
  actualLeadTimeDays: number | null;
}

export const columns: ColumnDef<LeadTimeVarianceTableData>[] = [
  {
    accessorKey: "purchaseOrderNo",
    header: "PO Number",
    cell: ({ row }) => (
      <span className="font-medium">{row.original.purchaseOrderNo}</span>
    ),
  },
  {
    accessorKey: "supplierName",
    header: "Supplier Name",
  },
  {
    accessorKey: "poDate",
    header: "PO Date",
    cell: ({ row }) => {
      const date = row.original.poDate;
      if (!date) return "-";
      try {
        return format(parseISO(date), "MMM dd, yyyy");
      } catch {
        return date;
      }
    },
  },
  {
    accessorKey: "receivingDate",
    header: "Receipt Date",
    cell: ({ row }) => {
      const date = row.original.receivingDate;
      if (!date) return "-";
      try {
        return format(parseISO(date), "MMM dd, yyyy");
      } catch {
        return date;
      }
    },
  },
  {
    accessorKey: "actualLeadTimeDays",
    header: "Lead Time (Days)",
    cell: ({ row }) => {
      const days = row.original.actualLeadTimeDays;
      if (days === null) return "-";
      return (
        <span
          className={
            days > 7
              ? "text-destructive font-bold"
              : days < 3
                ? "text-emerald-600 font-bold"
                : "font-medium"
          }
        >
          {days} {days === 1 ? "Day" : "Days"}
        </span>
      );
    },
  },
  {
    id: "status",
    header: "Status",
    cell: ({ row }) => {
      const days = row.original.actualLeadTimeDays;
      if (days === null) {
        return (
          <Badge
            variant="outline"
            className="bg-gray-50 text-gray-500 border-gray-200"
          >
            No Data
          </Badge>
        );
      }

      let status = "On Time";
      let variant: "outline" | "destructive" | "default" | "secondary" =
        "outline";
      let className = "bg-emerald-50 text-emerald-700 border-emerald-200";

      if (days > 7) {
        status = "Delayed";
        variant = "destructive";
        className = "";
      } else if (days > 4) {
        status = "Warning";
        variant = "secondary";
        className = "bg-orange-50 text-orange-700 border-orange-200";
      }

      return (
        <Badge variant={variant} className={className}>
          {status}
        </Badge>
      );
    },
  },
];
