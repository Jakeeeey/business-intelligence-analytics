"use client";

import React, { useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { 
    TargetSettingExecutive, 
    TargetSettingDivision,
    TargetSettingSupervisor,
    TargetSettingSupplier,
    TargetSettingSalesman
} from "../types";

interface AllocationHierarchyLogProps {
  companyTarget: TargetSettingExecutive | null;
  allocations: TargetSettingDivision[];
  supervisorAllocations?: TargetSettingSupervisor[];
  supplierAllocations?: TargetSettingSupplier[];
  salesmanAllocations?: TargetSettingSalesman[];
}

interface GridRow {
    division: { name: string; amount: number; status: string; id: number };
    supplier: { name: string; amount: number; status: string; id: number } | null;
    supervisor: { name: string; amount: number; status: string; id: number } | null;
    salesman: { name: string; amount: number; status: string; id: number } | null;
}

export function AllocationHierarchyLog({ 
    companyTarget, 
    allocations,
    supervisorAllocations = [],
    supplierAllocations = [],
    salesmanAllocations = []
}: AllocationHierarchyLogProps) {
    const currency = (amount: number) => 
        new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);

    const { rows, spans, divIds } = useMemo(() => {
        if (!companyTarget) return { rows: [], spans: { divSpans: {}, supSpans: {}, srvSpans: {} }, divIds: [] };

        const grid: GridRow[] = [];
        const divSpans: Record<number, number> = {};
        const supSpans: Record<number, number> = {};
        const srvSpans: Record<number, number> = {};
        const divIds: number[] = [];

        allocations.forEach(div => {
            divIds.push(div.id);
            const suppliers = supplierAllocations.filter(s => s.tsd_id === div.id);
            let divStartIdx = grid.length;

            if (suppliers.length === 0) {
                grid.push({
                    division: { name: div.division_name || `Div #${div.division_id}`, amount: div.target_amount, status: div.status, id: div.id },
                    supplier: null,
                    supervisor: null,
                    salesman: null
                });
            } else {
                suppliers.forEach(sup => {
                    const supervisors = supervisorAllocations.filter(s => s.tss_id === sup.id);
                    let supStartIdx = grid.length;

                    if (supervisors.length === 0) {
                        grid.push({
                            division: { name: div.division_name || `Div #${div.division_id}`, amount: div.target_amount, status: div.status, id: div.id },
                            supplier: { name: sup.supplier_name || `Sup #${sup.supplier_id}`, amount: sup.target_amount, status: sup.status, id: sup.id },
                            supervisor: null,
                            salesman: null
                        });
                    } else {
                        supervisors.forEach(srv => {
                            const salesmen = salesmanAllocations.filter(s => s.ts_supervisor_id === srv.id);
                            let srvStartIdx = grid.length;

                            if (salesmen.length === 0) {
                                grid.push({
                                    division: { name: div.division_name || `Div #${div.division_id}`, amount: div.target_amount, status: div.status, id: div.id },
                                    supplier: { name: sup.supplier_name || `Sup #${sup.supplier_id}`, amount: sup.target_amount, status: sup.status, id: sup.id },
                                    supervisor: { name: srv.supervisor_name || `Srv #${srv.supervisor_user_id}`, amount: srv.target_amount, status: srv.status, id: srv.id },
                                    salesman: null
                                });
                            } else {
                                salesmen.forEach(sale => {
                                    grid.push({
                                        division: { name: div.division_name || `Div #${div.division_id}`, amount: div.target_amount, status: div.status, id: div.id },
                                        supplier: { name: sup.supplier_name || `Sup #${sup.supplier_id}`, amount: sup.target_amount, status: sup.status, id: sup.id },
                                        supervisor: { name: srv.supervisor_name || `Srv #${srv.supervisor_user_id}`, amount: srv.target_amount, status: srv.status, id: srv.id },
                                        salesman: { name: sale.salesman_name || `Sale #${sale.salesman_id}`, amount: sale.target_amount, status: sale.status, id: sale.id }
                                    });
                                });
                            }
                            srvSpans[srv.id] = grid.length - srvStartIdx;
                        });
                    }
                    supSpans[sup.id] = grid.length - supStartIdx;
                });
            }
            divSpans[div.id] = grid.length - divStartIdx;
        });

        return { rows: grid, spans: { divSpans, supSpans, srvSpans }, divIds };
    }, [companyTarget, allocations, supplierAllocations, supervisorAllocations, salesmanAllocations]);

    if (!companyTarget) return null;

    const renderBadge = (status: string) => (
        <Badge 
            variant="outline" 
            className={cn(
                "text-[9px] font-bold uppercase px-1.5 h-4",
                status === 'APPROVED' ? "bg-emerald-100 text-emerald-700 border-emerald-200" : 
                status === 'REJECTED' ? "bg-red-100 text-red-700 border-red-200" : 
                "bg-slate-100 text-slate-600 border-slate-200"
            )}
        >
            {status}
        </Badge>
    );

    // Dynamic color themes per division
    const getTheme = (index: number) => {
        const themes = [
            { bg: "bg-blue-50/40", text: "text-blue-900", border: "border-blue-100", label: "text-blue-800", mono: "text-blue-600" },
            { bg: "bg-emerald-50/40", text: "text-emerald-900", border: "border-emerald-100", label: "text-emerald-800", mono: "text-emerald-600" },
            { bg: "bg-indigo-50/40", text: "text-indigo-900", border: "border-indigo-100", label: "text-indigo-800", mono: "text-indigo-600" },
            { bg: "bg-slate-50/80", text: "text-slate-900", border: "border-slate-200", label: "text-slate-800", mono: "text-slate-600" },
            { bg: "bg-amber-50/40", text: "text-amber-900", border: "border-amber-100", label: "text-amber-800", mono: "text-amber-600" },
        ];
        return themes[index % themes.length];
    };

  return (
    <Card className="w-full mt-6 shadow-sm border overflow-hidden bg-white">
      <CardHeader className="border-b bg-slate-50/50 py-4 px-6">
        <div className="flex justify-between items-center">
            <div>
                <CardTitle className="text-lg font-bold text-slate-800">Allocation Hierarchy Log</CardTitle>
                <p className="text-xs text-slate-500 font-medium">Grouped view with uniform division themes</p>
            </div>
            <div className="flex gap-4">
                <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Company Target</p>
                    <p className="text-sm font-black text-slate-900">{currency(companyTarget.target_amount)}</p>
                </div>
            </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
            <Table className="border-collapse table-fixed w-full">
                <TableHeader className="bg-slate-900 dark:bg-slate-800 text-white">
                    <TableRow className="hover:bg-transparent">
                        <TableHead className="w-[180px] font-bold text-white text-[10px] uppercase py-3 border-r border-slate-700 text-center">Division & Target</TableHead>
                        <TableHead className="w-[200px] font-bold text-white text-[10px] uppercase py-3 border-r border-slate-700 text-center">Supplier & Target</TableHead>
                        <TableHead className="w-[180px] font-bold text-white text-[10px] uppercase py-3 border-r border-slate-700 text-center">Supervisor & Target</TableHead>
                        <TableHead className="w-[180px] font-bold text-white text-[10px] uppercase py-3 border-r border-slate-700 text-center">Salesman & Target</TableHead>
                        <TableHead className="w-[100px] font-bold text-white text-[10px] uppercase py-3 text-center">Status</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {/* 1. Company Row */}
                    <TableRow className="bg-slate-800 text-slate-300 border-b border-slate-700">
                        <TableCell colSpan={4} className="py-2 px-4 text-xs font-black uppercase tracking-widest text-center">
                            COMPANY WIDE ROOT TARGET: <span className="text-white ml-2">{currency(companyTarget.target_amount)}</span>
                        </TableCell>
                        <TableCell className="text-center">{renderBadge(companyTarget.status)}</TableCell>
                    </TableRow>

                    {rows.map((row, idx) => {
                        const isDivStart = idx === 0 || rows[idx - 1].division.id !== row.division.id;
                        const isSupStart = (isDivStart || (row.supplier && rows[idx - 1].supplier?.id !== row.supplier.id));
                        const isSrvStart = (isSupStart || (row.supervisor && rows[idx - 1].supervisor?.id !== row.supervisor.id));
                        
                        const divIndex = divIds.indexOf(row.division.id);
                        const theme = getTheme(divIndex);

                        return (
                            <TableRow 
                                key={idx} 
                                className={cn(
                                    "transition-colors border-b border-slate-100",
                                    theme.bg,
                                    "hover:opacity-80"
                                )}
                            >
                                {isDivStart && (
                                    <TableCell rowSpan={spans.divSpans[row.division.id] || 1} className={cn("border-r align-middle text-center py-3 px-4", theme.border)}>
                                        <div className="space-y-1">
                                            <p className={cn("font-black text-xs leading-none", theme.text)}>{row.division.name}</p>
                                            <p className={cn("font-mono text-[11px] font-bold", theme.mono)}>{currency(row.division.amount)}</p>
                                        </div>
                                    </TableCell>
                                )}
                                {row.supplier ? (
                                    isSupStart && (
                                        <TableCell rowSpan={spans.supSpans[row.supplier.id] || 1} className={cn("border-r align-middle text-center py-3 px-4", theme.border)}>
                                            <div className="space-y-1">
                                                <p className={cn("font-bold text-xs leading-none", theme.label)}>{row.supplier.name}</p>
                                                <p className={cn("font-mono text-[10px]", theme.mono)}>{currency(row.supplier.amount)}</p>
                                            </div>
                                        </TableCell>
                                    )
                                ) : (
                                    <TableCell className={cn("border-r italic text-xs py-3 px-4 text-center", theme.border, theme.mono)}>-</TableCell>
                                )}
                                {row.supervisor ? (
                                    isSrvStart && (
                                        <TableCell rowSpan={spans.srvSpans[row.supervisor.id] || 1} className={cn("border-r align-middle text-center py-3 px-4", theme.border)}>
                                            <div className="space-y-1">
                                                <p className={cn("font-semibold text-[11px] leading-none", theme.label)}>{row.supervisor.name}</p>
                                                <p className={cn("font-mono text-[9px]", theme.mono)}>{currency(row.supervisor.amount)}</p>
                                            </div>
                                        </TableCell>
                                    )
                                ) : (
                                    <TableCell className={cn("border-r italic text-xs py-3 px-4 text-center", theme.border, theme.mono)}>-</TableCell>
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
                                        {isDivStart && renderBadge(row.division.status)}
                                        {isSupStart && row.supplier && renderBadge(row.supplier.status)}
                                        {isSrvStart && row.supervisor && renderBadge(row.supervisor.status)}
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
          <div className="flex justify-end gap-16">
              <div className="text-right">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Allocated</p>
                  <p className="text-2xl font-black text-white italic">{currency(allocations.reduce((s, a) => s + a.target_amount, 0))}</p>
              </div>
              <div className="text-right border-l border-slate-700 pl-16">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Unallocated Balance</p>
                  <p className={cn(
                      "text-2xl font-black italic",
                      (companyTarget.target_amount - allocations.reduce((s, a) => s + a.target_amount, 0)) < 0 ? "text-red-500" : "text-emerald-400"
                  )}>
                      {currency(companyTarget.target_amount - allocations.reduce((s, a) => s + a.target_amount, 0))}
                  </p>
              </div>
          </div>
      </div>
    </Card>
  );
}
