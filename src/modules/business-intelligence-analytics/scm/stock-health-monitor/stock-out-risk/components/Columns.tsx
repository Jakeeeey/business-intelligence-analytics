"use client";

import { ColumnDef } from "@tanstack/react-table";
import { StockOutRisk } from "../../types/stock-health.schema";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const columns: ColumnDef<StockOutRisk>[] = [
  {
    accessorKey: "productId",
    header: "SKU",
    cell: ({ row }) => <span className="font-medium">{row.original.productId}</span>,
  },
  {
    accessorKey: "productName",
    header: "Item Name",
    cell: ({ row }) => <span className="font-medium truncate max-w-[200px] block" title={row.original.productName}>{row.original.productName}</span>,
  },
  {
    accessorKey: "supplierShortcut",
    header: "Supplier",
    cell: ({ row }) => <span className="font-medium">{row.original.supplierShortcut || "N/A"}</span>,
  },
  {
    accessorKey: "branchName",
    header: "Branch",
  },
  {
    accessorKey: "currentStock",
    header: "Stock Qty",
    cell: ({ row }) => <span className="tabular-nums">{row.original.currentStock.toLocaleString()}</span>,
  },
  {
    accessorKey: "ads30d",
    header: "ADS (30d)",
    cell: ({ row }) => <span className="tabular-nums">{row.original.ads30d.toFixed(2)}</span>,
  },
  {
    accessorKey: "daysOfStockRemaining",
    header: "Days Remaining",
    cell: ({ row }) => {
      const days = row.original.daysOfStockRemaining;
      const isCritical = (days !== null && days <= row.original.riskDaysThreshold) || row.original.isActionRequired === 1;
      
      return (
        <span className={cn(
          "tabular-nums font-bold",
          isCritical ? "text-red-600" : "text-emerald-600"
        )}>
          {days !== null ? `${days.toFixed(0)} days` : "N/A"}
        </span>
      );
    },
  },
  {
    id: "riskLevel",
    header: "Risk Level",
    cell: ({ row }) => {
      const isActionRequired = row.original.isActionRequired === 1;
      return (
        <Badge 
          variant={isActionRequired ? "destructive" : "secondary"} 
          className="text-[10px] py-0 px-2 h-5"
        >
          {isActionRequired ? "CRITICAL" : "HEALTHY"}
        </Badge>
      );
    },
  },
  {
    accessorKey: "estimatedDepletionDate",
    header: "Est. Depletion",
    cell: ({ row }) => {
      const date = row.original.estimatedDepletionDate;
      if (!date) return <span className="text-muted-foreground italic">N/A</span>;
      return <span className="tabular-nums text-xs">{date}</span>;
    },
  },
];
