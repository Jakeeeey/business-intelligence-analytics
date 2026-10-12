"use client";

import React from "react";
import { ArrowUpDown, ChevronUp, ChevronDown, Award } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { SupplierBreakdownItem } from "../types";

interface SupplierBreakdownTableProps {
    data: SupplierBreakdownItem[];
    sortField: "orderedAmount" | "receivedAmount" | "fulfillmentRate" | "poCount";
    sortOrder: "asc" | "desc";
    onSort: (field: "orderedAmount" | "receivedAmount" | "fulfillmentRate" | "poCount") => void;
    onSelectSupplier?: (supplierId: number) => void;
}

function formatCurrency(val: number): string {
    return new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
        maximumFractionDigits: 0,
    }).format(val);
}

export const SupplierBreakdownTable: React.FC<SupplierBreakdownTableProps> = ({
    data,
    sortField,
    sortOrder,
    onSort,
    onSelectSupplier,
}) => {
    const renderSortIcon = (field: "orderedAmount" | "receivedAmount" | "fulfillmentRate" | "poCount") => {
        if (sortField !== field) {
            return <ArrowUpDown className="ml-1.5 h-3.5 w-3.5 text-muted-foreground opacity-50" />;
        }
        return sortOrder === "asc" ? (
            <ChevronUp className="ml-1.5 h-3.5 w-3.5 text-foreground" />
        ) : (
            <ChevronDown className="ml-1.5 h-3.5 w-3.5 text-foreground" />
        );
    };

    return (
        <div className="rounded-2xl border border-border/70 bg-card shadow-xs overflow-hidden text-card-foreground">
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader className="bg-muted/40">
                        <TableRow className="border-border/60 hover:bg-transparent">
                            <TableHead className="w-12 text-center font-bold text-xs uppercase tracking-wider text-muted-foreground">
                                #
                            </TableHead>
                            <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
                                Supplier Name
                            </TableHead>
                            <TableHead
                                className="cursor-pointer text-center font-bold text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground select-none"
                                onClick={() => onSort("poCount")}
                            >
                                <div className="flex items-center justify-center">
                                    PO Count
                                    {renderSortIcon("poCount")}
                                </div>
                            </TableHead>
                            <TableHead
                                className="cursor-pointer text-right font-bold text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground select-none"
                                onClick={() => onSort("orderedAmount")}
                            >
                                <div className="flex items-center justify-end">
                                    Ordered Value
                                    {renderSortIcon("orderedAmount")}
                                </div>
                            </TableHead>
                            <TableHead
                                className="cursor-pointer text-right font-bold text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground select-none"
                                onClick={() => onSort("receivedAmount")}
                            >
                                <div className="flex items-center justify-end">
                                    Received Value
                                    {renderSortIcon("receivedAmount")}
                                </div>
                            </TableHead>
                            <TableHead className="text-right font-bold text-xs uppercase tracking-wider text-muted-foreground">
                                Pending Balance
                            </TableHead>
                            <TableHead
                                className="cursor-pointer text-center font-bold text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground select-none min-w-[160px]"
                                onClick={() => onSort("fulfillmentRate")}
                            >
                                <div className="flex items-center justify-center">
                                    Fulfillment %
                                    {renderSortIcon("fulfillmentRate")}
                                </div>
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground text-sm">
                                    No supplier purchase orders found for the selected period.
                                </TableCell>
                            </TableRow>
                        ) : (
                            data.map((row, idx) => {
                                const rank = idx + 1;
                                const isTop3 = rank <= 3;
                                const progress = Math.min(100, Math.max(0, row.fulfillmentRate));

                                return (
                                    <TableRow
                                        key={row.supplierId}
                                        className="border-border/50 hover:bg-muted/40 transition-colors cursor-pointer"
                                        onClick={() => onSelectSupplier?.(row.supplierId)}
                                    >
                                        {/* Rank */}
                                        <TableCell className="text-center font-bold text-xs">
                                            {isTop3 ? (
                                                <span
                                                    className={`inline-flex items-center justify-center h-6 w-6 rounded-md font-bold text-xs ${
                                                        rank === 1
                                                            ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                                                            : rank === 2
                                                            ? "bg-slate-400/20 text-slate-600 dark:text-slate-300 border border-slate-400/30"
                                                            : "bg-amber-700/20 text-amber-700 dark:text-amber-500 border border-amber-700/30"
                                                    }`}
                                                >
                                                    <Award className="h-3.5 w-3.5" />
                                                </span>
                                            ) : (
                                                <span className="text-muted-foreground">{rank}</span>
                                            )}
                                        </TableCell>

                                        {/* Supplier Name */}
                                        <TableCell className="font-semibold text-sm text-foreground">
                                            {row.supplierName}
                                        </TableCell>

                                        {/* PO Count */}
                                        <TableCell className="text-center">
                                            <Badge variant="secondary" className="font-mono text-xs">
                                                {row.poCount}
                                            </Badge>
                                        </TableCell>

                                        {/* Ordered Value */}
                                        <TableCell className="text-right font-mono text-xs text-foreground font-semibold">
                                            {formatCurrency(row.orderedAmount)}
                                        </TableCell>

                                        {/* Received Value */}
                                        <TableCell className="text-right font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                            {formatCurrency(row.receivedAmount)}
                                        </TableCell>

                                        {/* Pending Balance */}
                                        <TableCell className="text-right font-mono text-xs text-amber-600 dark:text-amber-400">
                                            {formatCurrency(row.pendingAmount)}
                                        </TableCell>

                                        {/* Fulfillment % */}
                                        <TableCell className="text-center">
                                            <div className="space-y-1 max-w-[140px] mx-auto">
                                                <div className="flex items-center justify-between text-xs font-mono font-bold">
                                                    <span
                                                        className={
                                                            row.fulfillmentRate >= 99
                                                                ? "text-emerald-600 dark:text-emerald-400"
                                                                : row.fulfillmentRate >= 50
                                                                ? "text-blue-600 dark:text-blue-400"
                                                                : "text-amber-600 dark:text-amber-400"
                                                        }
                                                    >
                                                        {row.fulfillmentRate.toFixed(1)}%
                                                    </span>
                                                </div>
                                                <Progress value={progress} className="h-1.5" />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
};
