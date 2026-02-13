"use client";

import * as React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { TargetSettingSupplierRow, TargetSettingSupervisorRow } from "../types";
import { moneyPHP } from "../utils/format";
import { StatusBadge } from "./ui";
import { Badge } from "@/components/ui/badge";

export function HierarchyLogTable(props: {
  supplierTargets: TargetSettingSupplierRow[];
  supervisorTargets: TargetSettingSupervisorRow[];
}) {
  // This is a simple log to match your UI section.
  // Executive/Manager layers can be added later once their tables are finalized.
  const rows = [
    ...props.supplierTargets.map((r) => ({
      role: "Div Manager",
      assigned: `Supplier #${r.supplier_id}`,
      detail: "SUPPLIER ALLOCATION",
      amount: r.target_amount,
      status: r.status,
    })),
    ...props.supervisorTargets.map((r) => ({
      role: "Supervisor",
      assigned: `Supervisor User #${r.supervisor_user_id}`,
      detail: "SUPERVISOR TARGET",
      amount: r.target_amount,
      status: r.status,
    })),
  ];

  return (
    <div className="rounded-lg border bg-background">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[160px]">Creator Role</TableHead>
            <TableHead>Context / Assigned To</TableHead>
            <TableHead>Detail</TableHead>
            <TableHead className="text-right w-[180px]">Target Amount</TableHead>
            <TableHead className="w-[140px]">Status</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {rows.map((r, idx) => (
            <TableRow key={idx}>
              <TableCell>
                <Badge variant="outline" className="rounded-md">
                  {r.role}
                </Badge>
              </TableCell>
              <TableCell className="font-medium">{r.assigned}</TableCell>
              <TableCell className="text-xs text-muted-foreground">{r.detail}</TableCell>
              <TableCell className="text-right font-mono">{moneyPHP(r.amount)}</TableCell>
              <TableCell><StatusBadge status={r.status} /></TableCell>
            </TableRow>
          ))}

          {!rows.length ? (
            <TableRow>
              <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                No hierarchy logs to display for the current selection.
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
    </div>
  );
}
