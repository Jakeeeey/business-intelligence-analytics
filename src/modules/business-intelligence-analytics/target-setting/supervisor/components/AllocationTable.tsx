"use client";

import * as React from "react";
import type { TargetSettingSalesmanRow, SupplierRow, SalesmanRow } from "../types";
import { moneyPHP, monthLabel } from "../utils/format";

import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";

// ❌ removed StatusBadge usage
// import { StatusBadge } from "./ui";

function clampMoney(n: number) {
  if (!Number.isFinite(n)) return 0;
  return n;
}

export function AllocationTable(props: {
  fiscalPeriod: string;
  supplierId: number | null;

  // for the summary pills
  supplierTargetAmount?: number | null;

  rows: TargetSettingSalesmanRow[];
  supplierById: Record<number, SupplierRow>;
  salesmanById: Record<number, SalesmanRow>;

  acting?: boolean;
  onEdit: (row: TargetSettingSalesmanRow) => void;
  onDelete: (id: number) => void;
}) {
  const supplierName =
    props.supplierId != null
      ? props.supplierById[props.supplierId]?.supplier_name ?? `Supplier #${props.supplierId}`
      : "No supplier selected";

  return (
    <Card className="shadow-sm">
      <CardContent className="p-0">
        {/* Header row */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="space-y-1">
              <div className="text-lg font-semibold">Allocation Summary</div>
              <div className="text-sm text-muted-foreground">
                Breakdown of allocated salesman target shares under the selected supplier.
              </div>
            </div>

            {/* KPI pills */}

          </div>
        </div>

        <Separator />

        {/* Section header */}
        <div className="px-6 py-4">
          <div className="space-y-1">
            <div className="text-sm font-semibold">Salesman Allocations</div>
            <div className="text-sm text-muted-foreground">
              Create, update, and delete salesman allocations under the selected supplier and fiscal period.
            </div>

            <div className="pt-2 text-xs text-muted-foreground">
              Period: <span className="font-medium">{monthLabel(props.fiscalPeriod)}</span>
              {"  "}•{"  "}
              Supplier: <span className="font-medium">{supplierName}</span>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="px-4 pb-6">
          <div className="rounded-lg border bg-background">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Salesman</TableHead>
                  <TableHead className="text-right">Target Amount</TableHead>
                  <TableHead className="text-right w-[160px]">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {props.rows.map((r) => {
                  const sm = props.salesmanById[r.salesman_id];
                  const sp = props.supplierById[r.supplier_id];

                  return (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span>{sm?.salesman_name ?? `Salesman #${r.salesman_id}`}</span>

                          <span className="text-xs text-muted-foreground">
                            Supplier:{" "}
                            <span className="font-medium">
                              {sp?.supplier_name ?? `Supplier #${r.supplier_id}`}
                            </span>
                            {sm?.salesman_code ? (
                              <span className="text-muted-foreground"> • {sm.salesman_code}</span>
                            ) : null}
                            {/* ✅ removed: • <StatusBadge status={r.status} /> */}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell className="text-right font-mono">
                        {moneyPHP(r.target_amount)}
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="inline-flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => props.onEdit(r)}
                            disabled={props.acting || (r.status !== "DRAFT" && r.status !== "REJECTED")}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => props.onDelete(r.id)}
                            disabled={props.acting || (r.status !== "DRAFT" && r.status !== "REJECTED")}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}

                {!props.rows.length ? (
                  <TableRow>
                    <TableCell colSpan={3} className="py-12">
                      <div className="text-center text-sm text-muted-foreground">
                        No salesman allocations yet.
                      </div>
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
