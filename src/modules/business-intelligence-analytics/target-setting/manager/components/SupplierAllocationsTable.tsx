"use client";

import * as React from "react";
import type { TargetSettingSupplier } from "../types";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Supplier Allocations (CRUD)</CardTitle>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="overflow-hidden rounded-md border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Supplier</TableHead>
                <TableHead className="text-right">Target Amount</TableHead>
                <TableHead className="w-[90px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="py-10 text-center text-sm text-muted-foreground">
                    No supplier allocations yet.
                  </TableCell>
                </TableRow>
              ) : (
                rows
                  .slice()
                  .sort((a, b) => supplierNameById(a.supplier_id).localeCompare(supplierNameById(b.supplier_id)))
                  .map((r) => (
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
        </div>
      </CardContent>
    </Card>
  );
}
