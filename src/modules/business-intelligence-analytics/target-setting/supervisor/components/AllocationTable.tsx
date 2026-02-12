"use client";

import * as React from "react";
import type { TargetSettingSalesmanRow, SupplierRow, SalesmanRow } from "../types";
import { moneyPHP, monthLabel } from "../utils/format";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "./ui";
import { Pencil, Trash2 } from "lucide-react";

export function AllocationTable(props: {
  fiscalPeriod: string;
  supplierId: number | null;

  rows: TargetSettingSalesmanRow[];
  supplierById: Record<number, SupplierRow>;
  salesmanById: Record<number, SalesmanRow>;

  acting?: boolean;
  onEdit: (row: TargetSettingSalesmanRow) => void;
  onDelete: (id: number) => void;
}) {
  return (
    <div className="rounded-lg border bg-background">
      <div className="px-4 py-3 border-b text-sm text-muted-foreground">
        Showing allocations for <span className="font-medium">{monthLabel(props.fiscalPeriod)}</span>
        {props.supplierId != null ? (
          <>
            {" "}• Supplier:{" "}
            <span className="font-medium">
              {props.supplierById[props.supplierId]?.supplier_name ?? `Supplier #${props.supplierId}`}
            </span>
          </>
        ) : null}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[280px]">Salesman</TableHead>
            <TableHead>Supplier</TableHead>
            <TableHead className="text-right w-[200px]">Salesman Target Share</TableHead>
            <TableHead className="w-[140px]">Status</TableHead>
            <TableHead className="text-right w-[140px]">Actions</TableHead>
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
                    {sm?.salesman_code ? (
                      <span className="text-xs text-muted-foreground">{sm.salesman_code}</span>
                    ) : null}
                  </div>
                </TableCell>

                <TableCell>{sp?.supplier_name ?? `Supplier #${r.supplier_id}`}</TableCell>

                <TableCell className="text-right font-mono">{moneyPHP(r.target_amount)}</TableCell>

                <TableCell>
                  <StatusBadge status={r.status} />
                </TableCell>

                <TableCell className="text-right">
                  <div className="inline-flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => props.onEdit(r)}
                      disabled={props.acting}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => props.onDelete(r.id)}
                      disabled={props.acting}
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
              <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                No saved allocations for this Fiscal Period + Supplier.
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
    </div>
  );
}
