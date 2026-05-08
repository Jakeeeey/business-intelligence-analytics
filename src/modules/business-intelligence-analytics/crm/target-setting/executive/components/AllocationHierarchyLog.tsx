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
    type: 'data' | 'subtotal';
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
        new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);

    const { rows, spans } = useMemo(() => {
        if (!companyTarget) return { rows: [], spans: { divSpans: {}, supSpans: {}, srvSpans: {} } };

        const grid: GridRow[] = [];
        const divSpans: Record<number, number> = {};
        const supSpans: Record<number, number> = {};
        const srvSpans: Record<number, number> = {};
        allocations.forEach(div => {
            const suppliers = supplierAllocations.filter(s => s.tsd_id === div.id);
            const divStartIdx = grid.length;

            if (suppliers.length === 0) {
                grid.push({
                    type: 'data',
                    division: { name: div.division_name || `Div #${div.division_id}`, amount: div.target_amount, status: div.status, id: div.id },
                    supplier: null,
                    supervisor: null,
                    salesman: null
                });
            } else {
                suppliers.forEach(sup => {
                    const supervisors = supervisorAllocations.filter(s => s.tss_id === sup.id);
                    const supStartIdx = grid.length;

                    if (supervisors.length === 0) {
                        grid.push({
                            type: 'data',
                            division: { name: div.division_name || `Div #${div.division_id}`, amount: div.target_amount, status: div.status, id: div.id },
                            supplier: { name: sup.supplier_name || `Sup #${sup.supplier_id}`, amount: sup.target_amount, status: sup.status, id: sup.id },
                            supervisor: null,
                            salesman: null
                        });
                    } else {
                        supervisors.forEach(srv => {
                            const salesmen = salesmanAllocations.filter(s => s.ts_supervisor_id === srv.id);
                            const srvStartIdx = grid.length;

                            if (salesmen.length === 0) {
                                grid.push({
                                    type: 'data',
                                    division: { name: div.division_name || `Div #${div.division_id}`, amount: div.target_amount, status: div.status, id: div.id },
                                    supplier: { name: sup.supplier_name || `Sup #${sup.supplier_id}`, amount: sup.target_amount, status: sup.status, id: sup.id },
                                    supervisor: { name: srv.supervisor_name || `Srv #${srv.supervisor_user_id}`, amount: srv.target_amount, status: srv.status, id: srv.id },
                                    salesman: null
                                });
                            } else {
                                salesmen.forEach(sale => {
                                    grid.push({
                                        type: 'data',
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

            // Calculate Division Subtotals
            const supSum = suppliers.reduce((s, sup) => s + sup.target_amount, 0);
            const srvSum = supervisorAllocations
                .filter(srv => suppliers.some(sup => sup.id === srv.tss_id))
                .reduce((s, srv) => s + srv.target_amount, 0);
            const saleSum = salesmanAllocations
                .filter(sale => supervisorAllocations.some(srv => srv.id === sale.ts_supervisor_id && suppliers.some(sup => sup.id === srv.tss_id)))
                .reduce((s, sale) => s + sale.target_amount, 0);

            divSpans[div.id] = grid.length - divStartIdx;

            // Add Subtotal Row
            grid.push({
                type: 'subtotal',
                division: { name: 'GRAND TOTAL', amount: div.target_amount, status: div.status, id: div.id },
                supplier: { name: 'SUPPLIER TOTAL', amount: supSum, status: '', id: -1 },
                supervisor: { name: 'SUPERVISOR TOTAL', amount: srvSum, status: '', id: -1 },
                salesman: { name: 'SALESMAN TOTAL', amount: saleSum, status: '', id: -1 }
            });
        });

        return { rows: grid, spans: { divSpans, supSpans, srvSpans } };
    }, [companyTarget, allocations, supplierAllocations, supervisorAllocations, salesmanAllocations]);

    if (!companyTarget) return null;

    const renderBadge = (status: string) => (
        <Badge 
            variant="outline" 
            className={cn(
                "text-[9px] font-bold uppercase px-2 py-0 h-4 border",
                status === 'APPROVED' ? "bg-emerald-50 text-emerald-700 border-emerald-200" : 
                status === 'REJECTED' ? "bg-red-50 text-red-700 border-red-200" : 
                "bg-slate-50 text-slate-500 border-slate-200"
            )}
        >
            {status}
        </Badge>
    );

  return (
    <Card className="w-full mt-6 shadow-md border border-slate-300 dark:border-slate-700 overflow-hidden bg-background">
      <CardHeader className="border-b border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 py-4 px-6">
        <div className="flex justify-between items-center">
            <div>
                <CardTitle className="text-xl font-bold text-foreground uppercase tracking-tight">Allocation Hierarchy Log</CardTitle>
                <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-widest">Consolidated target distribution breakdown</p>
            </div>
            <div className="text-right">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Root Target</p>
                <p className="text-xl font-black text-foreground italic leading-none">{currency(companyTarget.target_amount)}</p>
            </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
            <Table className="border-collapse table-fixed w-full">
                <TableHeader className="bg-slate-200 dark:bg-slate-800 border-b border-slate-400 dark:border-slate-600">
                    <TableRow className="hover:bg-transparent">
                        <TableHead className="w-[180px] font-black text-foreground text-[10px] uppercase py-3 border-r border-slate-400 dark:border-slate-600 text-center tracking-widest">Division & Target</TableHead>
                        <TableHead className="w-[200px] font-black text-foreground text-[10px] uppercase py-3 border-r border-slate-400 dark:border-slate-600 text-center tracking-widest">Supplier & Target</TableHead>
                        <TableHead className="w-[180px] font-black text-foreground text-[10px] uppercase py-3 border-r border-slate-400 dark:border-slate-600 text-center tracking-widest">Supervisor & Target</TableHead>
                        <TableHead className="w-[180px] font-black text-foreground text-[10px] uppercase py-3 border-r border-slate-400 dark:border-slate-600 text-center tracking-widest">Salesman & Target</TableHead>
                        <TableHead className="w-[100px] font-black text-foreground text-[10px] uppercase py-3 text-center tracking-widest">Status</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {/* Company Wide Summary Row - Simple */}
                    <TableRow className="bg-slate-50 dark:bg-slate-900 border-b border-slate-400 dark:border-slate-600">
                        <TableCell colSpan={4} className="py-3 px-6 text-xs font-bold uppercase tracking-widest text-left text-foreground border-r border-slate-400 dark:border-slate-600">
                            Company Wide Root Target: <span className="text-foreground font-black ml-1 text-sm">{currency(companyTarget.target_amount)}</span>
                        </TableCell>
                        <TableCell className="text-center py-2">{renderBadge(companyTarget.status)}</TableCell>
                    </TableRow>

                    {rows.map((row, idx) => {
                        if (row.type === 'subtotal') {
                            return (
                                <TableRow key={`sub-${idx}`} className="bg-slate-200 dark:bg-slate-800 border-b-2 border-slate-400 dark:border-slate-600 font-black">
                                    <TableCell className="border-r border-slate-400 dark:border-slate-600 text-center py-3">
                                        <p className="text-[10px] text-muted-foreground uppercase leading-none mb-1">Division Sum</p>
                                        <p className="text-xs text-foreground">{currency(row.division.amount)}</p>
                                    </TableCell>
                                    <TableCell className="border-r border-slate-400 dark:border-slate-600 text-center py-3">
                                        <p className="text-[10px] text-muted-foreground uppercase leading-none mb-1">Supplier Sum</p>
                                        <p className="text-xs text-foreground">{currency(row.supplier?.amount || 0)}</p>
                                    </TableCell>
                                    <TableCell className="border-r border-slate-400 dark:border-slate-600 text-center py-3">
                                        <p className="text-[10px] text-muted-foreground uppercase leading-none mb-1">Supervisor Sum</p>
                                        <p className="text-xs text-foreground">{currency(row.supervisor?.amount || 0)}</p>
                                    </TableCell>
                                    <TableCell className="border-r border-slate-400 dark:border-slate-600 text-center py-3">
                                        <p className="text-[10px] text-muted-foreground uppercase leading-none mb-1">Salesman Sum</p>
                                        <p className="text-xs text-foreground">{currency(row.salesman?.amount || 0)}</p>
                                    </TableCell>
                                    <TableCell className="bg-slate-300 dark:bg-slate-700/50"></TableCell>
                                </TableRow>
                            );
                        }

                        const isDivStart = idx === 0 || (rows[idx - 1].type === 'subtotal') || rows[idx - 1].division.id !== row.division.id;
                        const isSupStart = (isDivStart || (row.supplier && rows[idx - 1].supplier?.id !== row.supplier.id));
                        const isSrvStart = (isSupStart || (row.supervisor && rows[idx - 1].supervisor?.id !== row.supervisor.id));

                        return (
                            <TableRow 
                                key={idx} 
                                className="border-b border-slate-300 dark:border-slate-700 hover:bg-muted/50 transition-colors"
                            >
                                {isDivStart && (
                                    <TableCell rowSpan={spans.divSpans[row.division.id] || 1} className="border-r border-slate-400 dark:border-slate-700 align-middle text-center py-4 px-4 bg-muted/20">
                                        <div className="space-y-1">
                                            <p className="font-black text-sm text-foreground uppercase leading-tight">{row.division.name}</p>
                                            <p className="font-mono text-[11px] font-bold text-muted-foreground">{currency(row.division.amount)}</p>
                                        </div>
                                    </TableCell>
                                )}
                                {row.supplier ? (
                                    isSupStart && (
                                        <TableCell rowSpan={spans.supSpans[row.supplier.id] || 1} className="border-r border-slate-400 dark:border-slate-700 align-middle text-center py-4 px-4 bg-muted/10">
                                            <div className="space-y-1">
                                                <p className="font-bold text-sm text-foreground uppercase leading-tight">{row.supplier.name}</p>
                                                <p className="font-mono text-[11px] text-muted-foreground">{currency(row.supplier.amount)}</p>
                                            </div>
                                        </TableCell>
                                    )
                                ) : (
                                    <TableCell className="border-r border-slate-400 dark:border-slate-700 italic text-xs py-4 px-4 text-center text-muted-foreground/30">-</TableCell>
                                )}
                                {row.supervisor ? (
                                    isSrvStart && (
                                        <TableCell rowSpan={spans.srvSpans[row.supervisor.id] || 1} className="border-r border-slate-400 dark:border-slate-700 align-middle text-center py-4 px-4">
                                            <div className="space-y-1">
                                                <p className="font-bold text-xs text-foreground leading-none uppercase">{row.supervisor.name}</p>
                                                <p className="font-mono text-[10px] text-muted-foreground">{currency(row.supervisor.amount)}</p>
                                            </div>
                                        </TableCell>
                                    )
                                ) : (
                                    <TableCell className="border-r border-slate-400 dark:border-slate-700 italic text-xs py-4 px-4 text-center text-muted-foreground/30">-</TableCell>
                                )}
                                <TableCell className="border-r border-slate-400 dark:border-slate-700 py-4 px-4 align-middle text-center">
                                    {row.salesman ? (
                                        <div className="space-y-1">
                                            <p className="text-xs font-bold text-muted-foreground leading-none uppercase">{row.salesman.name}</p>
                                            <p className="font-mono text-[10px] text-muted-foreground/60">{currency(row.salesman.amount)}</p>
                                        </div>
                                    ) : <span className="text-muted-foreground/20">-</span>}
                                </TableCell>
                                <TableCell className="text-center py-4 px-2">
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
      <div className="border-t border-slate-400 dark:border-slate-600 p-6 bg-slate-50 dark:bg-slate-900/30">
          <div className="flex justify-end gap-16">
              <div className="text-right">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Total Allocated</p>
                  <p className="text-3xl font-black text-foreground italic">{currency(allocations.reduce((s, a) => s + a.target_amount, 0))}</p>
              </div>
              <div className="text-right border-l border-slate-300 dark:border-slate-700 pl-16">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Unallocated Balance</p>
                  <p className={cn(
                      "text-3xl font-black italic",
                      (companyTarget.target_amount - allocations.reduce((s, a) => s + a.target_amount, 0)) < 0 ? "text-destructive" : "text-emerald-500"
                  )}>
                      {currency(companyTarget.target_amount - allocations.reduce((s, a) => s + a.target_amount, 0))}
                  </p>
              </div>
          </div>
      </div>
    </Card>
  );
}
