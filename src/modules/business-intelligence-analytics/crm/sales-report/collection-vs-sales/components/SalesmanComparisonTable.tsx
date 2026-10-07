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
import { SalesmanComparisonItem } from "../types";

interface SalesmanComparisonTableProps {
    data: SalesmanComparisonItem[];
    sortField: "sales" | "collections" | "variance" | "efficiency";
    sortOrder: "asc" | "desc";
    onSort: (field: "sales" | "collections" | "variance" | "efficiency") => void;
    onSelectSalesman?: (salesmanId: number) => void;
}

function formatCurrency(val: number): string {
    return new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
        maximumFractionDigits: 0,
    }).format(val);
}

export const SalesmanComparisonTable: React.FC<SalesmanComparisonTableProps> = ({
    data,
    sortField,
    sortOrder,
    onSort,
    onSelectSalesman,
}) => {
    const renderSortIcon = (field: "sales" | "collections" | "variance" | "efficiency") => {
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
                                Sales Representative
                            </TableHead>
                            <TableHead
                                className="cursor-pointer text-right font-bold text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground select-none"
                                onClick={() => onSort("sales")}
                            >
                                <div className="flex items-center justify-end">
                                    Invoiced Sales
                                    {renderSortIcon("sales")}
                                </div>
                            </TableHead>
                            <TableHead
                                className="cursor-pointer text-right font-bold text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground select-none"
                                onClick={() => onSort("collections")}
                            >
                                <div className="flex items-center justify-end">
                                    Total Collected
                                    {renderSortIcon("collections")}
                                </div>
                            </TableHead>
                            <TableHead
                                className="cursor-pointer text-right font-bold text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground select-none"
                                onClick={() => onSort("variance")}
                            >
                                <div className="flex items-center justify-end">
                                    Variance
                                    {renderSortIcon("variance")}
                                </div>
                            </TableHead>
                            <TableHead
                                className="cursor-pointer text-center font-bold text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground select-none min-w-[160px]"
                                onClick={() => onSort("efficiency")}
                            >
                                <div className="flex items-center justify-center">
                                    Efficiency %
                                    {renderSortIcon("efficiency")}
                                </div>
                            </TableHead>
                            <TableHead className="text-center font-bold text-xs uppercase tracking-wider text-muted-foreground">
                                Receipts
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground text-sm">
                                    No sales or collection records found for the selected filters.
                                </TableCell>
                            </TableRow>
                        ) : (
                            data.map((row, idx) => {
                                const rank = idx + 1;
                                const isTop3 = rank <= 3;
                                const isSurplus = row.variance >= 0;
                                const effProgress = Math.min(100, Math.max(0, row.efficiency));

                                return (
                                    <TableRow
                                        key={row.salesmanId}
                                        className="border-border/50 hover:bg-muted/40 transition-colors cursor-pointer"
                                        onClick={() => onSelectSalesman?.(row.salesmanId)}
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

                                        {/* Salesman Name */}
                                        <TableCell className="font-semibold text-sm text-foreground">
                                            {row.salesmanName}
                                        </TableCell>

                                        {/* Invoiced Sales */}
                                        <TableCell className="text-right font-mono text-xs text-foreground">
                                            {formatCurrency(row.sales)}
                                        </TableCell>

                                        {/* Total Collections */}
                                        <TableCell className="text-right font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                            {formatCurrency(row.collections)}
                                        </TableCell>

                                        {/* Variance */}
                                        <TableCell className="text-right font-mono text-xs">
                                            <span
                                                className={
                                                    isSurplus
                                                        ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                                                        : "text-rose-600 dark:text-rose-400 font-semibold"
                                                }
                                            >
                                                {isSurplus ? "+" : ""}
                                                {formatCurrency(row.variance)}
                                            </span>
                                        </TableCell>

                                        {/* Collection Efficiency */}
                                        <TableCell className="text-center">
                                            <div className="space-y-1 max-w-[140px] mx-auto">
                                                <div className="flex items-center justify-between text-xs font-mono font-bold">
                                                    <span
                                                        className={
                                                            row.efficiency >= 100
                                                                ? "text-emerald-600 dark:text-emerald-400"
                                                                : row.efficiency >= 75
                                                                ? "text-blue-600 dark:text-blue-400"
                                                                : "text-amber-600 dark:text-amber-400"
                                                        }
                                                    >
                                                        {row.efficiency.toFixed(1)}%
                                                    </span>
                                                </div>
                                                <Progress value={effProgress} className="h-1.5" />
                                            </div>
                                        </TableCell>

                                        {/* Receipts Count */}
                                        <TableCell className="text-center">
                                            <Badge variant="secondary" className="font-mono text-xs">
                                                {row.receiptsCount}
                                            </Badge>
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
