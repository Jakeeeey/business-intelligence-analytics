//src/modules/business-intelligence-analytics/target-setting/manager/components/ManagerAllocationHierarchyLog.tsx
"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
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

export function ManagerAllocationHierarchyLog({
    divisionTarget,
    supplierAllocations = [],
    supervisorAllocations = [],
    supplierNameById,
    resolveSupervisorName
}: ManagerAllocationHierarchyLogProps) {
    if (!divisionTarget) return null;

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
                        {/* 1. Division Level (Root) */}
                        <TableRow className="bg-blue-50/20 dark:bg-blue-900/10">
                            <TableCell>
                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800/50">Manager</Badge>
                            </TableCell>
                            <TableCell className="font-bold uppercase">MY DIVISION TARGET</TableCell>
                            <TableCell className="text-blue-600 dark:text-blue-400 font-medium text-xs">ROOT TARGET</TableCell>
                            <TableCell className="text-right font-bold">{currency(divisionTarget.target_amount)}</TableCell>
                            <TableCell>
                                <Badge variant="outline" className="text-[10px] px-1.5 h-4 capitalize dark:border-gray-700 dark:text-gray-400">{(divisionTarget.status || 'DRAFT').toLowerCase()}</Badge>
                            </TableCell>
                        </TableRow>

                        {/* 2. Supplier Rows */}
                        {supplierAllocations.map(sup => {
                            const supervisors = supervisorAllocations.filter(s => s.tss_id === sup.id);

                            return (
                                <React.Fragment key={`sup-group-${sup.id}`}>
                                    <TableRow key={`sup-${sup.id}`} className="hover:bg-gray-50/50">
                                        <TableCell className="pl-6">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-green-400" />
                                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Supplier</Badge>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm font-medium">{supplierNameById(sup.supplier_id)}</TableCell>
                                        <TableCell className="text-green-600 text-xs uppercase font-medium">Supplier Allocation</TableCell>
                                        <TableCell className="text-right text-sm">{currency(sup.target_amount)}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="text-[10px] px-1.5 h-4 capitalize">{(sup.status || 'DRAFT').toLowerCase()}</Badge>
                                        </TableCell>
                                    </TableRow>

                                    {/* Supervisor Rows */}
                                    {supervisors.map(sv => {
                                        return (
                                            <TableRow key={`sv-${sv.id}`} className="hover:bg-gray-50/30">
                                                <TableCell className="pl-12">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                                                        <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">Supervisor</Badge>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-xs italic font-medium">
                                                    {sv.supervisor_user_id ? resolveSupervisorName(sv.supervisor_user_id) : 'Unassigned'}
                                                </TableCell>
                                                <TableCell className="text-orange-600 text-[10px] uppercase font-bold">Assigned Supervisor</TableCell>
                                                <TableCell className="text-right text-xs">{currency(sv.target_amount)}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="text-[9px] px-1 h-3.5 capitalize">{(sv.status || 'DRAFT').toLowerCase()}</Badge>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </React.Fragment>
                            );
                        })}

                        {supplierAllocations.length === 0 && (
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
                                            <span className="text-xl font-black text-slate-900">{currency(divisionTarget.target_amount)}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Allocated</span>
                                            <span className="text-xl font-black text-primary">{currency(supplierAllocations.reduce((s, a) => s + Number(a.target_amount), 0))}</span>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-end">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Remaining to Allocate</span>
                                        <span className={`text-2xl font-black ${(divisionTarget.target_amount - supplierAllocations.reduce((s, a) => s + Number(a.target_amount), 0)) < 0 ? 'text-red-600' : 'text-slate-900'}`}>
                                            {currency(divisionTarget.target_amount - supplierAllocations.reduce((s, a) => s + Number(a.target_amount), 0))}
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
