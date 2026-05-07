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
        new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);

    const { rows, spans } = useMemo(() => {
        if (!divisionTarget) return { rows: [], spans: { supSpans: {}, divSpan: 0 } };

        const grid: GridRow[] = [];
        const supSpans: Record<number, number> = {};
        const divName = 'MY DIVISION TARGET';

        if (supplierAllocations.length === 0) {
            grid.push({
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
                        division: { name: divName, amount: divisionTarget.target_amount, status: divisionTarget.status ?? 'DRAFT', id: divisionTarget.id },
                        supplier: { name: supplierNameById(sup.supplier_id), amount: sup.target_amount, status: sup.status ?? 'DRAFT', id: sup.id },
                        supervisor: null
                    });
                } else {
                    supervisors.forEach(srv => {
                        grid.push({
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

        return { rows: grid, spans: { supSpans, divSpan: grid.length } };
    }, [divisionTarget, supplierAllocations, supervisorAllocations, supplierNameById, resolveSupervisorName]);

    if (!divisionTarget) return null;

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

    // Uniform theme for Manager view (usually one division)
    const theme = { bg: "bg-blue-50/40", text: "text-blue-900", border: "border-blue-100", label: "text-blue-800", mono: "text-blue-600" };

    return (
        <Card className="w-full mt-6 shadow-sm border overflow-hidden bg-white">
            <CardHeader className="border-b bg-slate-50/50 py-4 px-6">
                <CardTitle className="text-lg font-bold text-slate-800">Allocation Hierarchy Log</CardTitle>
                <p className="text-xs text-slate-500 font-medium">Uniform view of division assignments</p>
            </CardHeader>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <Table className="border-collapse table-fixed w-full">
                        <TableHeader className="bg-slate-900 text-white">
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="w-[200px] font-bold text-white text-[10px] uppercase py-3 border-r border-slate-700 text-center">Division & Target</TableHead>
                                <TableHead className="w-[200px] font-bold text-white text-[10px] uppercase py-3 border-r border-slate-700 text-center">Supplier & Target</TableHead>
                                <TableHead className="w-[200px] font-bold text-white text-[10px] uppercase py-3 border-r border-slate-700 text-center">Supervisor & Target</TableHead>
                                <TableHead className="w-[100px] font-bold text-white text-[10px] uppercase py-3 text-center">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {rows.map((row, idx) => {
                                const isDivStart = idx === 0;
                                const isSupStart = (isDivStart || (row.supplier && rows[idx - 1].supplier?.id !== row.supplier.id));

                                return (
                                    <TableRow 
                                        key={idx} 
                                        className={cn("transition-colors border-b border-slate-100 hover:opacity-80", theme.bg)}
                                    >
                                        {isDivStart && (
                                            <TableCell rowSpan={spans.divSpan || 1} className={cn("border-r align-middle text-center py-3 px-4", theme.border)}>
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
                                        <TableCell className={cn("border-r py-3 px-4 align-middle text-center", theme.border)}>
                                            {row.supervisor ? (
                                                <div className="space-y-1">
                                                    <p className={cn("text-[11px] font-medium leading-none", theme.label)}>{row.supervisor.name}</p>
                                                    <p className={cn("font-mono text-[9px] font-bold", theme.text)}>{currency(row.supervisor.amount)}</p>
                                                </div>
                                            ) : '-'}
                                        </TableCell>
                                        <TableCell className="text-center py-3 px-2">
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
            <div className="bg-slate-900 border-t border-slate-700 p-6">
                <div className="flex justify-end gap-16">
                    <div className="text-right">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Allocated</p>
                        <p className="text-2xl font-black text-white italic">{currency(supplierAllocations.reduce((s, a) => s + Number(a.target_amount), 0))}</p>
                    </div>
                    <div className="text-right border-l border-slate-700 pl-16">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Remaining Balance</p>
                        <p className={cn(
                            "text-2xl font-black italic",
                            (divisionTarget.target_amount - supplierAllocations.reduce((s, a) => s + Number(a.target_amount), 0)) < 0 ? "text-red-500" : "text-emerald-400"
                        )}>
                            {currency(divisionTarget.target_amount - supplierAllocations.reduce((s, a) => s + Number(a.target_amount), 0))}
                        </p>
                    </div>
                </div>
            </div>
        </Card>
    );
}
