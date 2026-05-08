"use client";

import React, { useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type {
    TargetSettingDivision,
    TargetSettingSupervisor,
    TargetSettingSupplier,
} from "../types";

interface ManagerAllocationHierarchyLogProps {
    divisionTarget: TargetSettingDivision | null;
    supplierAllocations: TargetSettingSupplier[];
    supervisorAllocations: TargetSettingSupervisor[];
    supplierNameById: (id: number) => string;
    resolveSupervisorName: (userId: number) => string;
}

interface GridRow {
    type: 'data' | 'subtotal';
    division: { name: string; amount: number; status: string; id: number };
    supplier: { name: string; amount: number; status: string; id: number } | null;
    supervisor: { name: string; amount: number; status: string; id: number } | null;
}

export function ManagerAllocationHierarchyLog({
    divisionTarget,
    supplierAllocations = [],
    supervisorAllocations = [],
    supplierNameById,
    resolveSupervisorName
}: ManagerAllocationHierarchyLogProps) {
    const currency = (amount: number) =>
        new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);

    const { rows, spans } = useMemo(() => {
        if (!divisionTarget) return { rows: [], spans: { supSpans: {}, divSpan: 0 } };

        const grid: GridRow[] = [];
        const supSpans: Record<number, number> = {};
        const divName = 'MY DIVISION TARGET';

        if (supplierAllocations.length === 0) {
            grid.push({
                type: 'data',
                division: { name: divName, amount: divisionTarget.target_amount, status: divisionTarget.status ?? 'DRAFT', id: divisionTarget.id },
                supplier: null,
                supervisor: null
            });
        } else {
            supplierAllocations.forEach(sup => {
                const supervisors = supervisorAllocations.filter(s => s.tss_id === sup.id);
                const supStartIdx = grid.length;

                if (supervisors.length === 0) {
                    grid.push({
                        type: 'data',
                        division: { name: divName, amount: divisionTarget.target_amount, status: divisionTarget.status ?? 'DRAFT', id: divisionTarget.id },
                        supplier: { name: supplierNameById(sup.supplier_id), amount: sup.target_amount, status: sup.status ?? 'DRAFT', id: sup.id },
                        supervisor: null
                    });
                } else {
                    supervisors.forEach(srv => {
                        grid.push({
                            type: 'data',
                            division: { name: divName, amount: divisionTarget.target_amount, status: divisionTarget.status ?? 'DRAFT', id: divisionTarget.id },
                            supplier: { name: supplierNameById(sup.supplier_id), amount: sup.target_amount, status: sup.status ?? 'DRAFT', id: sup.id },
                            supervisor: { 
                                name: srv.supervisor_user_id ? resolveSupervisorName(srv.supervisor_user_id) : 'Unassigned', 
                                amount: srv.target_amount, 
                                status: srv.status ?? 'DRAFT', 
                                id: srv.id 
                            }
                        });
                    });
                }
                supSpans[sup.id] = grid.length - supStartIdx;
            });
        }

        // Calculate Subtotals
        const supSum = supplierAllocations.reduce((s, sup) => s + Number(sup.target_amount), 0);
        const srvSum = supervisorAllocations.reduce((s, srv) => s + Number(srv.target_amount), 0);

        const divSpanCount = grid.length;

        // Add Subtotal Row
        grid.push({
            type: 'subtotal',
            division: { name: 'GRAND TOTAL', amount: divisionTarget.target_amount, status: divisionTarget.status ?? 'DRAFT', id: divisionTarget.id },
            supplier: { name: 'SUPPLIER TOTAL', amount: supSum, status: '', id: -1 },
            supervisor: { name: 'SUPERVISOR TOTAL', amount: srvSum, status: '', id: -1 }
        });

        return { rows: grid, spans: { supSpans, divSpan: divSpanCount } };
    }, [divisionTarget, supplierAllocations, supervisorAllocations, supplierNameById, resolveSupervisorName]);

    if (!divisionTarget) return null;

    const renderBadge = (status: string) => (
        <Badge 
            variant="outline" 
            className={cn(
                "text-[9px] font-bold uppercase px-2 py-0 h-4 border",
                status === 'APPROVED' ? "bg-emerald-50 text-emerald-700 border-emerald-200" : 
                "bg-slate-50 text-slate-500 border-slate-200"
            )}
        >
            {status}
        </Badge>
    );

    return (
        <Card className="w-full mt-6 shadow-md border border-slate-300 dark:border-slate-700 overflow-hidden bg-background">
            <CardHeader className="border-b border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 py-4 px-6">
                <div>
                    <CardTitle className="text-xl font-bold text-foreground uppercase tracking-tight">Allocation Hierarchy Log</CardTitle>
                    <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-widest">Uniform view of division assignments</p>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <Table className="border-collapse table-fixed w-full">
                        <TableHeader className="bg-slate-200 dark:bg-slate-800 border-b border-slate-400 dark:border-slate-600">
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="w-[200px] font-black text-foreground text-[10px] uppercase py-3 border-r border-slate-400 dark:border-slate-600 text-center tracking-widest">Division & Target</TableHead>
                                <TableHead className="w-[200px] font-black text-foreground text-[10px] uppercase py-3 border-r border-slate-400 dark:border-slate-600 text-center tracking-widest">Supplier & Target</TableHead>
                                <TableHead className="w-[200px] font-black text-foreground text-[10px] uppercase py-3 border-r border-slate-400 dark:border-slate-600 text-center tracking-widest">Supervisor & Target</TableHead>
                                <TableHead className="w-[100px] font-black text-foreground text-[10px] uppercase py-3 text-center tracking-widest">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {rows.map((row, idx) => {
                                if (row.type === 'subtotal') {
                                    return (
                                        <TableRow key={`sub-${idx}`} className="bg-slate-200 dark:bg-slate-800 border-b-2 border-slate-400 dark:border-slate-600 font-black">
                                            <TableCell className="border-r border-slate-400 dark:border-slate-700 text-center py-3">
                                                <p className="text-[10px] text-muted-foreground uppercase leading-none mb-1">Division Sum</p>
                                                <p className="text-xs text-foreground">{currency(row.division.amount)}</p>
                                            </TableCell>
                                            <TableCell className="border-r border-slate-400 dark:border-slate-700 text-center py-3">
                                                <p className="text-[10px] text-muted-foreground uppercase leading-none mb-1">Supplier Sum</p>
                                                <p className="text-xs text-foreground">{currency(row.supplier?.amount || 0)}</p>
                                            </TableCell>
                                            <TableCell className="border-r border-slate-400 dark:border-slate-700 text-center py-3">
                                                <p className="text-[10px] text-muted-foreground uppercase leading-none mb-1">Supervisor Sum</p>
                                                <p className="text-xs text-foreground">{currency(row.supervisor?.amount || 0)}</p>
                                            </TableCell>
                                            <TableCell className="bg-slate-300 dark:bg-slate-700/50"></TableCell>
                                        </TableRow>
                                    );
                                }

                                const isDivStart = idx === 0;
                                const isSupStart = (isDivStart || (row.supplier && rows[idx - 1].supplier?.id !== row.supplier.id));

                                return (
                                    <TableRow 
                                        key={idx} 
                                        className="border-b border-slate-300 hover:bg-slate-50/50 transition-colors"
                                    >
                                        {isDivStart && (
                                            <TableCell rowSpan={spans.divSpan || 1} className="border-r border-slate-400 dark:border-slate-700 align-middle text-center py-4 px-4 bg-muted/20">
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
                                        <TableCell className="border-r border-slate-400 dark:border-slate-700 py-4 px-4 align-middle text-center">
                                            {row.supervisor ? (
                                                <div className="space-y-1">
                                                    <p className="font-bold text-xs text-foreground leading-none uppercase">{row.supervisor.name}</p>
                                                    <p className="font-mono text-[10px] text-muted-foreground">{currency(row.supervisor.amount)}</p>
                                                </div>
                                            ) : <span className="text-muted-foreground/20">-</span>}
                                        </TableCell>
                                        <TableCell className="text-center py-4 px-2">
                                            <div className="flex flex-col items-center gap-1">
                                                {isDivStart && renderBadge(row.division.status)}
                                                {isSupStart && row.supplier && renderBadge(row.supplier.status)}
                                                {row.supervisor && renderBadge(row.supervisor.status)}
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
                        <p className="text-3xl font-black text-foreground italic">{currency(supplierAllocations.reduce((s, a) => s + Number(a.target_amount), 0))}</p>
                    </div>
                    <div className="text-right border-l border-slate-300 dark:border-slate-700 pl-16">
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Remaining Balance</p>
                        <p className={cn(
                            "text-3xl font-black italic",
                            (divisionTarget.target_amount - supplierAllocations.reduce((s, a) => s + Number(a.target_amount), 0)) < 0 ? "text-destructive" : "text-emerald-500"
                        )}>
                            {currency(divisionTarget.target_amount - supplierAllocations.reduce((s, a) => s + Number(a.target_amount), 0))}
                        </p>
                    </div>
                </div>
            </div>
        </Card>
    );
}
