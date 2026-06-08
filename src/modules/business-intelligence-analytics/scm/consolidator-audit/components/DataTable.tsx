// src/modules/business-intelligence-analytics/scm/consolidator-audit/components/DataTable.tsx
"use client";

import React, { useMemo } from "react";
import { ColumnDef, Column } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpDown } from "lucide-react";
import { ModuleDataTable as DataTable } from "./ModuleDataTable";
import type { ConsolidatorAuditRecord } from "../types";

/* ─── Status badge helper ─── */
function getStatusBadgeClasses(status: string): {
  variant: "default" | "secondary" | "destructive" | "outline";
  className: string;
} {
  if (!status) return { variant: "outline", className: "" };
  const normalized = status.toLowerCase();

  if (
    ["dispatched", "audited", "posted", "completed", "success"].includes(
      normalized
    )
  ) {
    return {
      variant: "outline",
      className:
        "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
    };
  }
  if (
    ["pending", "processing", "draft", "created"].includes(normalized)
  ) {
    return {
      variant: "outline",
      className:
        "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
    };
  }
  if (["cancelled", "failed", "rejected"].includes(normalized)) {
    return {
      variant: "outline",
      className:
        "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20",
    };
  }
  return { variant: "outline", className: "" };
}

/* ─── Date formatter (PH Manila timezone) ─── */
function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  try {
    const date = new Date(dateStr.replace(" ", "T"));
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Manila",
    });
  } catch {
    return dateStr;
  }
}

/* ─── Header Sort Button Helper ─── */
const SortableHeader = ({
  column,
  title,
}: {
  column: Column<GroupedConsolidatorRow, unknown>;
  title: string;
}) => {
  return (
    <Button
      variant="ghost"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      className="group mx-auto h-auto py-1 px-3 flex items-center justify-center font-extrabold text-sm md:text-base lg:text-lg text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-all"
    >
      <span>{title}</span>
      <ArrowUpDown className="ml-2 h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
    </Button>
  );
};

export interface GroupedConsolidatorRow {
  consolidatorId: number | string;
  consolidatorNo: string;
  consolidatorStatus: string;
  consolidatorCreatedAt: string;
  pdps: {
    pdpId: number | string;
    pdpNo: string;
    pdpStatus: string;
    pdpCreatedAt: string;
  }[];
  dispatchPlans: {
    dpId: number | string;
    dpNo: string;
    dpStatus: string;
    dpCreatedAt: string;
  }[];
}

/* ─── Block cell for the 3-line format ─── */
const BlockCell = ({
  no,
  status,
  date,
}: {
  no: string | null;
  status: string | null;
  date: string | null;
}) => {
  if (!no && !status && !date) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center p-4 text-muted-foreground min-h-[90px]">
        —
      </div>
    );
  }
  const badge = status ? getStatusBadgeClasses(status) : null;
  return (
    <div className="flex-1 flex flex-col justify-center items-center p-4 text-center border-b last:border-b-0 border-zinc-200 dark:border-zinc-700 w-full min-h-[90px]">
      <span className="font-bold text-sm text-foreground">{no || "—"}</span>
      {status && badge && (
        <div className="my-1.5">
          <Badge
            variant={badge.variant}
            className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 ${badge.className}`}
          >
            {status}
          </Badge>
        </div>
      )}
      <span className="text-xs text-muted-foreground whitespace-nowrap">
        {formatDate(date)}
      </span>
    </div>
  );
};

/* ─── Column definitions ─── */
const columns: ColumnDef<GroupedConsolidatorRow>[] = [
  {
    accessorKey: "pdps",
    header: ({ column }) => <SortableHeader column={column} title="Pre Dispatch Plan" />,
    meta: { label: "Pre Dispatch Plan" },
    cell: ({ row }) => {
      const pdps = row.original.pdps;
      if (!pdps || pdps.length === 0) {
        return <BlockCell no={null} status={null} date={null} />;
      }
      return (
        <div className="flex flex-col h-full w-full justify-stretch items-stretch">
          {pdps.map((pdp, idx) => (
            <BlockCell
              key={idx}
              no={pdp.pdpNo}
              status={pdp.pdpStatus}
              date={pdp.pdpCreatedAt}
            />
          ))}
        </div>
      );
    },
  },
  {
    accessorKey: "consolidatorNo",
    header: ({ column }) => (
      <SortableHeader column={column} title="Consolidation" />
    ),
    meta: { label: "Consolidation" },
    cell: ({ row }) => {
      return (
        <div className="flex flex-col h-full w-full justify-stretch items-stretch">
          <BlockCell
            no={row.original.consolidatorNo}
            status={row.original.consolidatorStatus}
            date={row.original.consolidatorCreatedAt}
          />
        </div>
      );
    },
  },
  {
    accessorKey: "dispatchPlans",
    header: ({ column }) => <SortableHeader column={column} title="Dispatch Plan" />,
    meta: { label: "Dispatch Plan" },
    cell: ({ row }) => {
      const dps = row.original.dispatchPlans;
      if (!dps || dps.length === 0) {
        return <BlockCell no={null} status={null} date={null} />;
      }
      return (
        <div className="flex flex-col h-full w-full justify-stretch items-stretch">
          {dps.map((dp, idx) => (
            <BlockCell
              key={idx}
              no={dp.dpNo}
              status={dp.dpStatus}
              date={dp.dpCreatedAt}
            />
          ))}
        </div>
      );
    },
  },
];

/* ─── Exported AuditDataTable ─── */
type AuditDataTableProps = {
  data: ConsolidatorAuditRecord[];
  loading?: boolean;
};

export function AuditDataTable({
  data,
  loading = false,
}: AuditDataTableProps) {
  const groupedRows = useMemo<GroupedConsolidatorRow[]>(() => {
    const map = new Map<string, GroupedConsolidatorRow>();

    data.forEach((row, idx) => {
      // Use consolidatorNo if present. Otherwise, assign a unique key per index so they do not merge.
      const cKey = row.consolidatorNo ? row.consolidatorNo : `unlinked-${idx}`;
      let group = map.get(cKey);

      if (!group) {
        group = {
          consolidatorId: row.consolidatorId ?? "unknown",
          consolidatorNo: row.consolidatorNo || "Unknown Consolidator",
          consolidatorStatus: row.consolidatorStatus || "N/A",
          consolidatorCreatedAt: row.consolidatorCreatedAt || "",
          pdps: [],
          dispatchPlans: [],
        };
        map.set(cKey, group);
      }

      if (row.pdpNo || row.pdpId) {
        const hasPdp = group.pdps.some(
          (p) => p.pdpNo === row.pdpNo || (row.pdpNo && p.pdpNo === row.pdpNo)
        );
        if (!hasPdp) {
          group.pdps.push({
            pdpId: row.pdpId ?? "unknown",
            pdpNo: row.pdpNo || "Unknown PDP",
            pdpStatus: row.pdpStatus || "N/A",
            pdpCreatedAt: row.pdpCreatedAt || "",
          });
        }
      }

      if (row.dpNo || row.dpId) {
        const hasDp = group.dispatchPlans.some(
          (d) => d.dpNo === row.dpNo || (row.dpNo && d.dpNo === row.dpNo)
        );
        if (!hasDp) {
          group.dispatchPlans.push({
            dpId: row.dpId ?? "unknown",
            dpNo: row.dpNo || "Unknown DP",
            dpStatus: row.dpStatus || "N/A",
            dpCreatedAt: row.dpCreatedAt || "",
          });
        }
      }
    });

    return Array.from(map.values());
  }, [data]);

  const stableColumns = useMemo(() => columns, []);

  return (
    <DataTable
      columns={stableColumns}
      data={groupedRows}
      isLoading={loading}
      emptyTitle="No Audit Records"
      emptyDescription="No consolidator audit records found for the current filters."
    />
  );
}

