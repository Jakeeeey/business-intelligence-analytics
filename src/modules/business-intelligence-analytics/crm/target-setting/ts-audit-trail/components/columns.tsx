"use client"

import { ColumnDef } from "@tanstack/react-table"
import { AuditTrailEntry } from "../types"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"

export const columns: ColumnDef<AuditTrailEntry>[] = [
  {
    accessorKey: "snapshot_timestamp",
    header: "Timestamp",
    cell: ({ row }) => {
      const date = new Date(row.getValue("snapshot_timestamp"))
      return <div className="font-mono text-xs">{format(date, "yyyy-MM-dd HH:mm:ss")}</div>
    },
  },
  {
    accessorKey: "fiscal_period",
    header: "Fiscal Period",
    cell: ({ row }) => <div className="text-xs">{row.getValue("fiscal_period")}</div>
  },
  {
    accessorKey: "trigger_event",
    header: "Event",
    cell: ({ row }) => {
      return <Badge variant="outline" className="text-[11px] px-1.5 h-6">{row.getValue("trigger_event")}</Badge>
    },
  },
  {
    accessorKey: "approval_status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("approval_status") as string
      let variant: "default" | "secondary" | "destructive" | "outline" = "outline"
      
      switch (status) {
        case 'APPROVED':
          variant = "default"
          break
        case 'REJECTED':
          variant = "destructive"
          break
        case 'PENDING':
          variant = "secondary"
          break
      }
      
      return status ? <Badge variant={variant} className="text-[11px] px-1.5 h-6">{status}</Badge> : null
    },
  },
  {
    id: "counts",
    header: "Counts",
    cell: ({ row }) => {
      const approved = row.original.approved_count ?? 0
      const rejected = row.original.rejected_count ?? 0
      const total = row.original.total_approvers ?? 0
      
      return (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="text-green-600 font-medium">App: {approved}</span>
            <span className="text-red-600 font-medium">Rej: {rejected}</span>
            <span>Tot: {total}</span>
        </div>
      )
    },
  },
  {
    accessorKey: "triggered_by_user_id",
    header: "Triggered By",
    cell: ({ row }) => {
        return <div className="text-xs">{row.getValue("triggered_by_user_id") || "System"}</div>
    }
  },
  {
    accessorKey: "notes",
    header: "Notes",
    cell: ({ row }) => {
      return <div className="text-xs truncate max-w-[200px]" title={row.getValue("notes")}>{row.getValue("notes") || "-"}</div>
    },
  },
]
