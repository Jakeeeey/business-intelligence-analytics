"use client";

import * as React from "react";
import type { TargetSettingSupplier } from "../types";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2, Pencil } from "lucide-react";

export default function SupplierAllocationsTable(props: {
  rows: TargetSettingSupplier[];
  supplierNameById: (id: number) => string;
  supervisorNameByAllocationId: (id: number) => string;
  formatPeso: (n: number) => string;
  onEdit: (row: TargetSettingSupplier) => void;
  onDelete: (id: number) => void;
  disabled?: boolean;
}) {
  const { rows, supplierNameById, supervisorNameByAllocationId, formatPeso, onEdit, onDelete, disabled } = props;

  const sortedRows = React.useMemo(() => {
    return rows
      .slice()
      .sort((a, b) => supplierNameById(a.supplier_id).localeCompare(supplierNameById(b.supplier_id)));
  }, [rows, supplierNameById]);

  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-muted/50">
          <TableHead>Supplier</TableHead>
          <TableHead>Supervisor</TableHead>
          <TableHead className="text-right">Target Amount</TableHead>
          <TableHead className="w-[110px] text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {sortedRows.length === 0 ? (
          <TableRow>
            <TableCell colSpan={4} className="py-10 text-center text-sm text-muted-foreground">
              No supplier allocations yet.
            </TableCell>
          </TableRow>
        ) : (
          sortedRows.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="font-medium">{supplierNameById(r.supplier_id)}</TableCell>
              <TableCell className="text-sm text-muted-foreground">{supervisorNameByAllocationId(r.id)}</TableCell>
              <TableCell className="text-right font-mono">{formatPeso(r.target_amount)}</TableCell>
              <TableCell className="text-right">
                <div className="inline-flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => onEdit(r)}
                    disabled={disabled || (r.status !== "DRAFT" && r.status !== "REJECTED")}
                  >
                    <Pencil className="h-4 w-4" />
                    <span className="sr-only">Edit</span>
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => onDelete(r.id)}
                    disabled={disabled || (r.status !== "DRAFT" && r.status !== "REJECTED")}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete</span>
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
