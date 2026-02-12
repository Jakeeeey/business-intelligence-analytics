"use client";

import * as React from "react";
import type { TargetSettingSupplier } from "../types";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

export default function SupplierAllocationsTable(props: {
  rows: TargetSettingSupplier[];
  supplierNameById: (id: number) => string;
  formatPeso: (n: number) => string;
  onDelete: (id: number) => void;
  disabled?: boolean;
}) {
  const { rows, supplierNameById, formatPeso, onDelete, disabled } = props;

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
          <TableHead className="text-right">Target Amount</TableHead>
          <TableHead className="w-[90px] text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {sortedRows.length === 0 ? (
          <TableRow>
            <TableCell colSpan={3} className="py-10 text-center text-sm text-muted-foreground">
              No supplier allocations yet.
            </TableCell>
          </TableRow>
        ) : (
          sortedRows.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="font-medium">{supplierNameById(r.supplier_id)}</TableCell>
              <TableCell className="text-right font-mono">{formatPeso(r.target_amount)}</TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="icon"
                  className="cursor-pointer"
                  onClick={() => onDelete(r.id)}
                  disabled={disabled}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
