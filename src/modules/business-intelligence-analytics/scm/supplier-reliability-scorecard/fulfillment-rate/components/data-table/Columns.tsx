"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";

export interface FulfillmentRateTableData {
  supplierName: string;
  totalPOs: number;
  fulfillmentRate: number;
  totalOrdered: number;
  totalReceived: number;
  shortfall: number;
  status: string;
}

export const columns: ColumnDef<FulfillmentRateTableData>[] = [
  {
    accessorKey: "supplierName",
    header: "Supplier Name",
    cell: ({ row }) => (
      <span className="font-medium">{row.original.supplierName}</span>
    ),
  },
  {
    accessorKey: "totalPOs",
    header: "Total POs",
  },
  {
    accessorKey: "fulfillmentRate",
    header: "Fulfillment Rate",
    cell: ({ row }) => (
      <span
        className={
          row.original.fulfillmentRate < 95
            ? "text-destructive font-bold"
            : "text-emerald-600 font-bold"
        }
      >
        {row.original.fulfillmentRate.toFixed(1)}%
      </span>
    ),
  },
  {
    accessorKey: "totalOrdered",
    header: "Total Ordered",
    cell: ({ row }) => row.original.totalOrdered.toLocaleString(),
  },
  {
    accessorKey: "totalReceived",
    header: "Total Received",
    cell: ({ row }) => row.original.totalReceived.toLocaleString(),
  },
  {
    accessorKey: "shortfall",
    header: "Shortfall",
    cell: ({ row }) => (
      <span className={row.original.shortfall > 0 ? "text-destructive" : ""}>
        {row.original.shortfall.toLocaleString()}
      </span>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status;
      let variant: "outline" | "destructive" | "secondary" = "outline";
      let className = "";

      if (status === "Good") {
        className = "bg-emerald-50 text-emerald-700 border-emerald-200";
      } else if (status === "Warning") {
        variant = "secondary";
        className = "bg-orange-50 text-orange-700 border-orange-200";
      } else if (status === "Critical") {
        variant = "destructive";
      }

      return (
        <Badge variant={variant} className={className}>
          {status}
        </Badge>
      );
    },
  },
];
