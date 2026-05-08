"use client";

import React, { useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type {
  TargetSettingSupplierRow,
  TargetSettingSalesmanRow,
} from "../types";

interface AllocationHierarchyLogProps {
  supplierTarget: TargetSettingSupplierRow | null; // The root context (Supplier)
  salesmanAllocations: TargetSettingSalesmanRow[]; // The details (Salesman)
  salesmanNameById: (id: number) => string;
}

interface GridRow {
    supplier: { name: string; amount: number; status: string; id: number };
    salesman: { name: string; amount: number; status: string; id: number } | null;
}

export default function AllocationHierarchyLog({
  supplierTarget,
  salesmanAllocations = [],
  salesmanNameById
}: AllocationHierarchyLogProps) {
  const currency = (amount: number) =>
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);

  const { rows, divSpan } = useMemo(() => {
    if (!supplierTarget) return { rows: [], divSpan: 0 };
    const grid: GridRow[] = [];
    const supplierName = 'MY SUPPLIER TARGET';

    if (salesmanAllocations.length === 0) {
        grid.push({
            supplier: { name: supplierName, amount: Number(supplierTarget.target_amount), status: supplierTarget.status ?? 'DRAFT', id: supplierTarget.id },
            salesman: null
        });
    } else {
        salesmanAllocations.forEach(sale => {
            grid.push({
                supplier: { name: supplierName, amount: Number(supplierTarget.target_amount), status: supplierTarget.status ?? 'DRAFT', id: supplierTarget.id },
                salesman: { name: salesmanNameById(sale.salesman_id), amount: Number(sale.target_amount), status: sale.status ?? 'DRAFT', id: sale.id }
            });
        });
    }

    return { rows: grid, divSpan: grid.length };
  }, [supplierTarget, salesmanAllocations, salesmanNameById]);

  if (!supplierTarget) return null;

  const renderBadge = (status: string) => (
    <Badge 
        variant="outline" 
        className={cn(
            "text-[9px] font-bold uppercase px-1.5 h-4",
            status === 'APPROVED' ? "bg-emerald-100 text-emerald-700 border-emerald-200" : 
            "bg-slate-100 text-slate-600 border-slate-200"
        )}
    >
        {status}
    </Badge>
  );

  // Uniform theme for Supervisor view
  const theme = { bg: "bg-blue-50/40", text: "text-blue-900", border: "border-blue-100", label: "text-blue-800", mono: "text-blue-600" };

  return (
    <Card className="w-full mt-6 shadow-sm border overflow-hidden bg-white">
      <CardHeader className="border-b bg-slate-50/50 py-4 px-6">
        <CardTitle className="text-lg font-bold text-slate-800">Allocation Hierarchy Log</CardTitle>
        <p className="text-xs text-slate-500 font-medium">Uniform view of salesman assignments</p>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
            <Table className="border-collapse table-fixed w-full">
                <TableHeader className="bg-slate-900 text-white">
                    <TableRow className="hover:bg-transparent">
                        <TableHead className="w-[200px] font-bold text-white text-[10px] uppercase py-3 border-r border-slate-700 text-center">Supplier & Target</TableHead>
                        <TableHead className="w-[200px] font-bold text-white text-[10px] uppercase py-3 border-r border-slate-700 text-center">Salesman & Target</TableHead>
                        <TableHead className="w-[100px] font-bold text-white text-[10px] uppercase py-3 text-center">Status</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {rows.map((row, idx) => {
                        const isDivStart = idx === 0;

                        return (
                            <TableRow 
                                key={idx} 
                                className={cn("transition-colors border-b border-slate-100 hover:opacity-80", theme.bg)}
                            >
                                {isDivStart && (
                                    <TableCell rowSpan={divSpan || 1} className={cn("border-r align-middle text-center py-3 px-4", theme.border)}>
                                        <div className="space-y-1">
                                            <p className={cn("font-black text-xs leading-none", theme.text)}>{row.supplier.name}</p>
                                            <p className={cn("font-mono text-[11px] font-bold", theme.mono)}>{currency(row.supplier.amount)}</p>
                                        </div>
                                    </TableCell>
                                )}
                                <TableCell className={cn("border-r py-3 px-4 align-middle text-center", theme.border)}>
                                    {row.salesman ? (
                                        <div className="space-y-1">
                                            <p className={cn("text-[11px] font-medium leading-none", theme.label)}>{row.salesman.name}</p>
                                            <p className={cn("font-mono text-[9px] font-bold", theme.text)}>{currency(row.salesman.amount)}</p>
                                        </div>
                                    ) : '-'}
                                </TableCell>
                                <TableCell className="text-center py-3 px-2">
                                    <div className="flex flex-col items-center gap-1">
                                        {isDivStart && renderBadge(row.supplier.status)}
                                        {row.salesman && renderBadge(row.salesman.status)}
                                    </div>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
      </CardContent>
      <div className="bg-slate-900 border-t border-slate-700 p-6">
          <div className="flex justify-end gap-12">
              <div className="text-right">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Allocated</p>
                  <p className="text-2xl font-black text-white italic">{currency(salesmanAllocations.reduce((s, a) => s + Number(a.target_amount), 0))}</p>
              </div>
              <div className="text-right border-l border-slate-700 pl-16">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Remaining Balance</p>
                  <p className={cn(
                      "text-2xl font-black italic",
                      (Number(supplierTarget.target_amount) - salesmanAllocations.reduce((s, a) => s + Number(a.target_amount), 0)) < 0 ? "text-red-500" : "text-emerald-400"
                  )}>
                      {currency(Number(supplierTarget.target_amount) - salesmanAllocations.reduce((s, a) => s + Number(a.target_amount), 0))}
                  </p>
              </div>
          </div>
      </div>
    </Card>
  );
}
