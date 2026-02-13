"use client";

import * as React from "react";
import type { HierarchyLogRow } from "../types";
import { moneyPHP } from "../utils/format";

import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

function RolePill({ role }: { role: string }) {
  const v = role.toLowerCase();
  if (v.includes("executive")) return <Badge variant="secondary">Executive</Badge>;
  return <Badge variant="outline">Div Manager</Badge>;
}

function StatusPill({ status }: { status: string }) {
  return (
    <Badge variant="secondary" className="rounded-full">
      {String(status || "DRAFT").toUpperCase()}
    </Badge>
  );
}

export default function AllocationHierarchyLog(props: {
  rows: HierarchyLogRow[];
  loading?: boolean;
}) {
  return (
    <Card className="shadow-sm">
      <CardContent className="p-0">
        <div className="px-6 pt-6 pb-4">
          <div className="space-y-1">
            <div className="text-lg font-semibold">Allocation Hierarchy Log</div>
            <div className="text-sm text-muted-foreground">
              Tracks how targets were assigned across Executive → Division → Supplier.
            </div>
          </div>
        </div>

        <Separator />

        <div className="px-4 pb-6 pt-4">
          <div className="rounded-lg border bg-background">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Creator Role</TableHead>
                  <TableHead>Context / Assigned To</TableHead>
                  <TableHead className="text-right w-[180px]">Target Amount</TableHead>
                  <TableHead className="text-right w-[120px]">Status</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {props.loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-10 text-center text-sm text-muted-foreground">
                      Loading hierarchy...
                    </TableCell>
                  </TableRow>
                ) : props.rows.length ? (
                  props.rows.map((r) => (
                    <TableRow key={r.key}>
                      <TableCell>
                        <RolePill role={r.creatorRole} />
                      </TableCell>
                      <TableCell className="font-medium">{r.context}</TableCell>
                      <TableCell className="text-right font-mono">{moneyPHP(r.targetAmount)}</TableCell>
                      <TableCell className="text-right">
                        <StatusPill status={r.status} />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="py-10 text-center text-sm text-muted-foreground">
                      No hierarchy log available for the selected period.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
