"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
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

export function AllocationHierarchyLog({ 
    companyTarget, 
    allocations,
    supervisorAllocations = [],
    supplierAllocations = [],
    salesmanAllocations = []
}: AllocationHierarchyLogProps) {
    if (!companyTarget) return null;

    const currency = (amount: number) => 
        new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);

  return (
    <Card className="w-full mt-6">
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
                {/* 1. Company Level */}
                <TableRow className="bg-slate-50/80">
                    <TableCell><Badge variant="outline" className="bg-slate-900 text-white border-slate-900">Executive</Badge></TableCell>
                    <TableCell className="font-bold">COMPANY WIDE</TableCell>
                    <TableCell className="text-gray-500 text-xs">ROOT TARGET</TableCell>
                    <TableCell className="text-right font-bold">{currency(companyTarget.target_amount)}</TableCell>
                    <TableCell>
                        <Badge variant={companyTarget.status === 'APPROVED' ? 'default' : 'outline'} className={companyTarget.status === 'APPROVED' ? 'bg-green-600' : ''}>
                             {companyTarget.status || 'DRAFT'}
                        </Badge>
                    </TableCell>
                </TableRow>

                {/* 2. Division Level & Below */}
                {allocations.map((alloc) => {
                    const suppliers = supplierAllocations.filter(s => s.tsd_id === alloc.id);
                    
                    return (
                        <React.Fragment key={`div-group-${alloc.id}`}>
                            {/* Division Row */}
                            <TableRow key={`div-${alloc.id}`} className="bg-blue-50/20">
                                <TableCell className="pl-6">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-blue-400" />
                                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Executive</Badge>
                                    </div>
                                </TableCell>
                                <TableCell className="font-medium">{alloc.division_name || `Division #${alloc.division_id}`}</TableCell>
                                <TableCell className="text-blue-600 font-medium text-xs">DIVISION ALLOCATION</TableCell>
                                <TableCell className="text-right font-medium">{currency(alloc.target_amount)}</TableCell>
                                <TableCell>
                                    <Badge variant="outline" className="text-[10px] px-1.5 h-4 capitalize">{(alloc.status || 'DRAFT').toLowerCase()}</Badge>
                                </TableCell>
                            </TableRow>

                            {/* Supplier Rows */}
                            {suppliers.map(sup => {
                                const supervisors = supervisorAllocations.filter(s => s.tss_id === sup.id);

                                return (
                                    <React.Fragment key={`sup-group-${sup.id}`}>
                                        <TableRow key={`sup-${sup.id}`} className="hover:bg-gray-50/50">
                                            <TableCell className="pl-12">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-green-400" />
                                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Manager</Badge>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-sm">{sup.supplier_name || `Supplier #${sup.supplier_id}`}</TableCell>
                                            <TableCell className="text-green-600 text-xs uppercase font-medium">Supplier Level</TableCell>
                                            <TableCell className="text-right text-sm">{currency(sup.target_amount)}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="text-[10px] px-1.5 h-4 capitalize">{(sup.status || 'DRAFT').toLowerCase()}</Badge>
                                            </TableCell>
                                        </TableRow>

                                        {/* Supervisor Rows */}
                                        {supervisors.map(sv => {
                                            const salesmen = salesmanAllocations.filter(s => s.ts_supervisor_id === sv.id);

                                            return (
                                                <React.Fragment key={`sv-group-${sv.id}`}>
                                                    <TableRow key={`sv-${sv.id}`} className="hover:bg-gray-50/30">
                                                        <TableCell className="pl-20">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                                                                <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">Supervisor</Badge>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-xs italic font-medium">{sv.supervisor_name || `Supervisor #${sv.supervisor_user_id}`}</TableCell>
                                                        <TableCell className="text-orange-600 text-[10px] uppercase font-bold">Supervisor Allocation</TableCell>
                                                        <TableCell className="text-right text-xs">{currency(sv.target_amount)}</TableCell>
                                                        <TableCell>
                                                            <Badge variant="outline" className="text-[9px] px-1 h-3.5 capitalize">{(sv.status || 'DRAFT').toLowerCase()}</Badge>
                                                        </TableCell>
                                                    </TableRow>

                                                    {/* Salesman Rows */}
                                                    {salesmen.map(sale => (
                                                        <TableRow key={`sale-${sale.id}`} className="hover:bg-gray-50/40">
                                                            <TableCell className="pl-28">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-1 h-1 rounded-full bg-purple-400" />
                                                                    <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-[10px]">Salesman</Badge>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="text-[11px] text-gray-600">{sale.salesman_name || `Salesman #${sale.salesman_id}`}</TableCell>
                                                            <TableCell className="text-purple-600 text-[9px] uppercase">Final Allocation</TableCell>
                                                            <TableCell className="text-right text-[11px] font-medium">{currency(sale.target_amount)}</TableCell>
                                                            <TableCell>
                                                                <Badge variant="outline" className="text-[8px] px-1 h-3 capitalize">{(sale.status || 'DRAFT').toLowerCase()}</Badge>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </React.Fragment>
                                            );
                                        })}
                                    </React.Fragment>
                                );
                            })}
                        </React.Fragment>
                    );
                })}
                
                {allocations.length === 0 && (
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
                                    <span className="text-xl font-black text-slate-900">{currency(companyTarget.target_amount)}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Allocated</span>
                                    <span className="text-xl font-black text-primary">{currency(allocations.reduce((s, a) => s + a.target_amount, 0))}</span>
                                </div>
                            </div>
                            
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Remaining to Allocate</span>
                                <span className={`text-2xl font-black ${(companyTarget.target_amount - allocations.reduce((s, a) => s + a.target_amount, 0)) < 0 ? 'text-red-600' : 'text-slate-900'}`}>
                                    {currency(companyTarget.target_amount - allocations.reduce((s, a) => s + a.target_amount, 0))}
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
