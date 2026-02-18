//src/modules/business-intelligence-analytics/target-setting/manager/components/AllocationLogTable.tsx
"use client";

import * as React from "react";
import type { AllocationLogRow } from "../types";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

function roleBadge(role: AllocationLogRow["creatorRole"]) {
  if (role === "Executive")
    return (
      <Badge variant="outline" className="border-blue-200 text-blue-700 dark:border-blue-500/30 dark:text-blue-300">
        Executive
      </Badge>
    );

  if (role === "Supervisor")
    return (
      <Badge variant="outline" className="border-amber-200 text-amber-700 dark:border-amber-500/30 dark:text-amber-300">
        Supervisor
      </Badge>
    );

  return (
    <Badge variant="outline" className="border-purple-200 text-purple-700 dark:border-purple-500/30 dark:text-purple-300">
      Div Manager
    </Badge>
  );
}

function statusBadge(status: AllocationLogRow["status"]) {
  const s = String(status ?? "").trim().toUpperCase();

  // APPROVED: Light = blue pill w/ white text, Dark = near-black pill w/ white text
  if (s === "APPROVED") {
    return (
      <Badge
        variant="secondary"
        className="rounded-full !bg-blue-600 !text-white dark:!bg-zinc-900 dark:!text-white"
      >
        APPROVED
      </Badge>
    );
  }

  // Optional: keep same visual style but different label
  if (s === "PENDING") {
    return (
      <Badge
        variant="secondary"
        className="rounded-full !bg-blue-600 !text-white dark:!bg-zinc-900 dark:!text-white"
      >
        PENDING
      </Badge>
    );
  }

  if (s === "REJECTED") {
    return (
      <Badge
        variant="secondary"
        className="rounded-full !bg-blue-600 !text-white dark:!bg-zinc-900 dark:!text-white"
      >
        REJECTED
      </Badge>
    );
  }

  return (
    <Badge
      variant="secondary"
      className="rounded-full !bg-blue-600 !text-white dark:!bg-zinc-900 dark:!text-white"
    >
      {s || "—"}
    </Badge>
  );
}



export default function AllocationLogTable(props: { rows: AllocationLogRow[]; formatPeso: (n: number) => string }) {
  const { rows, formatPeso } = props;

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Allocation Hierarchy Log</CardTitle>
        <CardDescription>Tracks how targets were assigned across Executive → Division → Supplier.</CardDescription>
      </CardHeader>

      <CardContent className="pt-2">
        <div className={cn("overflow-hidden rounded-md border")}>
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[180px]">Creator Role</TableHead>
                <TableHead>Context / Assigned To</TableHead>
                <TableHead className="hidden md:table-cell">Detail</TableHead>
                <TableHead className="text-right">Target Amount</TableHead>
                <TableHead className="text-right w-[120px]">Status</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                    No log rows found for the selected period.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{roleBadge(r.creatorRole)}</TableCell>
                    <TableCell className="font-medium">{r.contextAssignedTo}</TableCell>
                    <TableCell className="hidden md:table-cell text-xs text-muted-foreground">{r.detail}</TableCell>
                    <TableCell className="text-right font-mono">{formatPeso(r.targetAmount)}</TableCell>
                    <TableCell className="text-right">{statusBadge(r.status)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
