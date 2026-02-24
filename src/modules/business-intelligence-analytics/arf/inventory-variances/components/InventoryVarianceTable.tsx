"use client";

import React, { useState, useMemo } from "react";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Search, ChevronLeft, ChevronRight, ArrowUpDown } from "lucide-react";
import { VArfInventoryVarianceDto } from "../types";

interface Props {
    data: VArfInventoryVarianceDto[];
    criticalCost: number;
    minAccuracy: number;
}

export const InventoryVarianceTable = ({ data, criticalCost }: Props) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [sortKey, setSortKey] = useState<keyof VArfInventoryVarianceDto | 'differenceCost'>('differenceCost');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const pageSize = 15;

    // 1. Search & Sort Logic
    const processedData = useMemo(() => {
        let result = [...data];

        if (searchTerm) {
            const lowerSearch = searchTerm.toLowerCase();
            result = result.filter(item =>
                (item.familyName?.toLowerCase().includes(lowerSearch)) ||
                (item.branchName?.toLowerCase().includes(lowerSearch)) ||
                (item.categoryName?.toLowerCase().includes(lowerSearch))
            );
        }

        result.sort((a, b) => {
            const valA = a[sortKey] || 0;
            const valB = b[sortKey] || 0;
            if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
            if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });

        return result;
    }, [data, searchTerm, sortKey, sortOrder]);

    // 2. Pagination Logic
    const totalPages = Math.ceil(processedData.length / pageSize) || 1;
    const paginatedData = processedData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    const handleSort = (key: keyof VArfInventoryVarianceDto) => {
        if (sortKey === key) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortOrder('asc'); // Revert to asc, except for costs it's usually better to start desc.
        }
    };

    return (
        <div className="rounded-xl border bg-card shadow-sm flex flex-col overflow-hidden">
            {/* Toolbar */}
            <div className="p-4 border-b flex items-center justify-between gap-4 bg-muted/20">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search SKU, branch, or category..."
                        className="w-full bg-background rounded-lg border pl-9 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                    />
                </div>
                <div className="text-xs text-muted-foreground font-medium">
                    Showing {paginatedData.length} of {processedData.length} records
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto custom-scrollbar flex-1">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow>
                            <TableHead className="w-[120px] font-bold text-xs uppercase cursor-pointer hover:bg-muted/80 transition-colors" onClick={() => handleSort('branchName')}>
                                <div className="flex items-center gap-1">Branch <ArrowUpDown className="h-3 w-3" /></div>
                            </TableHead>
                            <TableHead className="font-bold text-xs uppercase cursor-pointer hover:bg-muted/80 transition-colors" onClick={() => handleSort('familyName')}>
                                <div className="flex items-center gap-1">Product <ArrowUpDown className="h-3 w-3" /></div>
                            </TableHead>
                            <TableHead className="font-bold text-xs uppercase">Date Audited</TableHead>
                            <TableHead className="text-right font-bold text-xs uppercase cursor-pointer hover:bg-muted/80 transition-colors" onClick={() => handleSort('systemCount')}>
                                <div className="flex items-center justify-end gap-1"><ArrowUpDown className="h-3 w-3" /> System</div>
                            </TableHead>
                            <TableHead className="text-right font-bold text-xs uppercase cursor-pointer hover:bg-muted/80 transition-colors" onClick={() => handleSort('physicalCount')}>
                                <div className="flex items-center justify-end gap-1"><ArrowUpDown className="h-3 w-3" /> Physical</div>
                            </TableHead>
                            <TableHead className="text-right font-bold text-xs uppercase cursor-pointer hover:bg-muted/80 transition-colors" onClick={() => handleSort('variance')}>
                                <div className="flex items-center justify-end gap-1"><ArrowUpDown className="h-3 w-3" /> Variance</div>
                            </TableHead>
                            <TableHead className="text-right font-bold text-xs uppercase cursor-pointer hover:bg-muted/80 transition-colors" onClick={() => handleSort('differenceCost')}>
                                <div className="flex items-center justify-end gap-1"><ArrowUpDown className="h-3 w-3" /> Cost Impact</div>
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedData.length === 0 ? (
                            <TableRow><TableCell colSpan={7} className="h-24 text-center text-muted-foreground italic">No matches found.</TableCell></TableRow>
                        ) : (
                            paginatedData.map((row, index) => {
                                const cost = Number(row.differenceCost) || 0;
                                return (
                                    <TableRow key={`${row.detailId}-${index}`} className="group transition-colors hover:bg-muted/30">
                                        <TableCell className="font-medium text-xs truncate max-w-[120px]" title={row.branchName}>{row.branchName}</TableCell>
                                        <TableCell className="text-xs truncate max-w-[200px]" title={row.familyName}>
                                            <div className="font-semibold">{row.familyName}</div>
                                            <div className="text-[10px] text-muted-foreground uppercase mt-0.5">{row.categoryName}</div>
                                        </TableCell>
                                        <TableCell className="text-xs whitespace-nowrap text-muted-foreground">{row.auditDate ? format(new Date(row.auditDate), "MMM d, yyyy") : "-"}</TableCell>
                                        <TableCell className="text-right text-xs font-mono">{row.systemCount}</TableCell>
                                        <TableCell className="text-right text-xs font-mono">{row.physicalCount}</TableCell>
                                        <TableCell className={`text-right text-xs font-mono font-bold ${row.variance < 0 ? 'text-rose-500' : row.variance > 0 ? 'text-emerald-500' : 'text-muted-foreground'}`}>
                                            {row.variance > 0 ? '+' : ''}{row.variance}
                                        </TableCell>
                                        <TableCell className={`text-right text-xs font-mono font-bold ${cost <= -criticalCost ? 'text-rose-600 bg-rose-50/50' : cost > 0 ? 'text-emerald-600' : ''}`}>
                                            {cost < 0 ? '-' : cost > 0 ? '+' : ''}₱{Math.abs(cost).toLocaleString()}
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination Controls */}
            <div className="p-3 border-t bg-muted/20 flex items-center justify-between">
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="h-8">
                    <ChevronLeft className="h-4 w-4 mr-1" /> Prev
                </Button>
                <div className="text-xs font-medium">Page {currentPage} of {totalPages}</div>
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="h-8">
                    Next <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
            </div>
        </div>
    );
};