"use client";

import * as React from "react";
import type { AllocationLogRow } from "../types";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

function roleBadge(role: AllocationLogRow["creatorRole"]) {
  if (role === "Executive") {
    return (
      <Badge variant="outline" className="border-blue-200 text-blue-700">
        Executive
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="border-purple-200 text-purple-700">
      Div Manager
    </Badge>
  );
}

function statusBadge(status: AllocationLogRow["status"]) {
  if (status === "Approved") return <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">Approved</Badge>;
  if (status === "Pending") return <Badge className="bg-amber-500 text-white hover:bg-amber-500">Pending</Badge>;
  return <Badge variant="secondary">Set</Badge>;
}

export default function AllocationLogTable(props: { rows: AllocationLogRow[]; formatPeso: (n: number) => string }) {
  const { rows, formatPeso } = props;

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-4">
        <div className="space-y-1">
          <CardTitle className="text-base">Allocation Hierarchy Log</CardTitle>
          <CardDescription className="text-xs">
            Tracks how targets were assigned across Executive → Division → Supplier.
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* ✅ single border layer + proper clipping */}
        <div className="rounded-md border bg-background">
          <div className={cn("overflow-hidden rounded-md")}>
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[170px]">Creator Role</TableHead>
                  <TableHead>Context / Assigned To</TableHead>
                  <TableHead className="hidden md:table-cell">Detail</TableHead>
                  <TableHead className="text-right">Target Amount</TableHead>
                  <TableHead className="text-right">Status</TableHead>
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
        </div>
      </CardContent>
    </Card>
  );
}
