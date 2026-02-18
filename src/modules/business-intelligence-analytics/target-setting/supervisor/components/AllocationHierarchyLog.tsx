"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type {
  TargetSettingSupplierRow,
  TargetSettingSalesmanRow,
} from "../types";

interface AllocationHierarchyLogProps {
  supplierTarget: TargetSettingSupplierRow | null; // The root context (Supplier)
  salesmanAllocations: TargetSettingSalesmanRow[]; // The details (Salesman)
  salesmanNameById: (id: number) => string;
}

export default function AllocationHierarchyLog({
  supplierTarget,
  salesmanAllocations = [],
  salesmanNameById
}: AllocationHierarchyLogProps) {
  if (!supplierTarget) return null;

  const currency = (amount: number) =>
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);

  return (
    <Card className="w-full mt-6 shadow-sm">
      <CardHeader>
        <CardTitle>Allocation Hierarchy Log</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Hierarchy / Role</TableHead>
              <TableHead>Context / Assigned To</TableHead>
              <TableHead>Level Detail</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* 1. Supplier Level (Root) */}
            <TableRow className="bg-green-50/20 dark:bg-green-900/10">
              <TableCell>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800/50">Supervisor</Badge>
              </TableCell>
              <TableCell className="font-bold uppercase">MY SUPPLIER TARGET</TableCell>
              <TableCell className="text-green-600 dark:text-green-400 font-medium text-xs">ROOT TARGET</TableCell>
              <TableCell className="text-right font-bold">{currency(Number(supplierTarget.target_amount))}</TableCell>
              <TableCell>
                <Badge variant="outline" className="text-[10px] px-1.5 h-4 capitalize dark:border-gray-700 dark:text-gray-400">{(supplierTarget.status || 'DRAFT').toLowerCase()}</Badge>
              </TableCell>
            </TableRow>

            {/* 2. Salesman Rows */}
            {salesmanAllocations.map(sale => {
              return (
                <TableRow key={`sale-${sale.id}`} className="hover:bg-gray-50/50">
                  <TableCell className="pl-6">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-purple-400" />
                      <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-[10px]">Salesman</Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm font-medium">{salesmanNameById(sale.salesman_id)}</TableCell>
                  <TableCell className="text-purple-600 text-[9px] uppercase font-medium">Final Allocation</TableCell>
                  <TableCell className="text-right text-sm">{currency(Number(sale.target_amount))}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px] px-1.5 h-4 capitalize">{(sale.status || 'DRAFT').toLowerCase()}</Badge>
                  </TableCell>
                </TableRow>
              );
            })}

            {salesmanAllocations.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-gray-400 py-8">
                  No allocations found for this period.
                </TableCell>
              </TableRow>
            )}

            {/* Summary Box */}
            <TableRow className="border-t-2 bg-slate-50/50">
              <TableCell colSpan={5} className="py-6 px-8">
                <div className="flex justify-between items-center w-full">
                  <div className="flex gap-12">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Target</span>
                      <span className="text-xl font-black text-slate-900">{currency(Number(supplierTarget.target_amount))}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Allocated</span>
                      <span className="text-xl font-black text-primary">{currency(salesmanAllocations.reduce((s, a) => s + Number(a.target_amount), 0))}</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Remaining to Allocate</span>
                    <span className={`text-2xl font-black ${(Number(supplierTarget.target_amount) - salesmanAllocations.reduce((s, a) => s + Number(a.target_amount), 0)) < 0 ? 'text-red-600' : 'text-slate-900'}`}>
                      {currency(Number(supplierTarget.target_amount) - salesmanAllocations.reduce((s, a) => s + Number(a.target_amount), 0))}
                    </span>
                  </div>
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
