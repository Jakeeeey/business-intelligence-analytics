"use client";

import React from "react";
import { ArrowUpDown, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Award } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ProductBreakdownItem } from "../types";

interface ProductBreakdownTableProps {
    data: ProductBreakdownItem[];
    totalCount: number;
    currentPage: number;
    pageSize: number;
    totalPages: number;
    sortField: "totalAmount" | "totalQuantity" | "productName";
    sortOrder: "asc" | "desc";
    onSort: (field: "totalAmount" | "totalQuantity" | "productName") => void;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
    onSelectProduct?: (productId: number) => void;
}

function formatCurrency(val: number): string {
    return new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
        maximumFractionDigits: 2,
    }).format(val);
}

export const ProductBreakdownTable: React.FC<ProductBreakdownTableProps> = ({
    data,
    totalCount,
    currentPage,
    pageSize,
    totalPages,
    sortField,
    sortOrder,
    onSort,
    onPageChange,
    onPageSizeChange,
    onSelectProduct,
}) => {
    const renderSortIcon = (field: "totalAmount" | "totalQuantity" | "productName") => {
        if (sortField !== field) {
            return <ArrowUpDown className="ml-1.5 h-3.5 w-3.5 text-muted-foreground opacity-50" />;
        }
        return sortOrder === "asc" ? (
            <ChevronUp className="ml-1.5 h-3.5 w-3.5 text-foreground" />
        ) : (
            <ChevronDown className="ml-1.5 h-3.5 w-3.5 text-foreground" />
        );
    };

    const startIndex = (currentPage - 1) * pageSize;

    return (
        <div className="rounded-2xl border border-border/70 bg-card shadow-xs overflow-hidden text-card-foreground">
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader className="bg-muted/40">
                        <TableRow className="border-border/60 hover:bg-transparent">
                            <TableHead className="w-12 text-center font-bold text-xs uppercase tracking-wider text-muted-foreground">
                                #
                            </TableHead>
                            <TableHead
                                className="cursor-pointer font-bold text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground select-none"
                                onClick={() => onSort("productName")}
                            >
                                <div className="flex items-center">
                                    Product Name
                                    {renderSortIcon("productName")}
                                </div>
                            </TableHead>
                            <TableHead
                                className="cursor-pointer text-right font-bold text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground select-none"
                                onClick={() => onSort("totalQuantity")}
                            >
                                <div className="flex items-center justify-end">
                                    Total Qty Received
                                    {renderSortIcon("totalQuantity")}
                                </div>
                            </TableHead>
                            <TableHead className="text-right font-bold text-xs uppercase tracking-wider text-muted-foreground">
                                Avg Unit Price
                            </TableHead>
                            <TableHead
                                className="cursor-pointer text-right font-bold text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground select-none"
                                onClick={() => onSort("totalAmount")}
                            >
                                <div className="flex items-center justify-end">
                                    Total Amount Received
                                    {renderSortIcon("totalAmount")}
                                </div>
                            </TableHead>
                            <TableHead className="text-center font-bold text-xs uppercase tracking-wider text-muted-foreground">
                                Deliveries
                            </TableHead>
                            <TableHead className="text-center font-bold text-xs uppercase tracking-wider text-muted-foreground">
                                Latest Receipt
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground text-sm">
                                    No product receiving records found for the selected period.
                                </TableCell>
                            </TableRow>
                        ) : (
                            data.map((row, idx) => {
                                const rank = startIndex + idx + 1;
                                const isTop3 = rank <= 3 && currentPage === 1;

                                return (
                                    <TableRow
                                        key={row.productId}
                                        className="border-border/50 hover:bg-muted/40 transition-colors cursor-pointer"
                                        onClick={() => onSelectProduct?.(row.productId)}
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

                                        {/* Product Name & Code */}
                                        <TableCell className="font-semibold text-sm text-foreground">
                                            <div>
                                                <p className="font-semibold">{row.productName}</p>
                                                {row.productCode && row.productCode !== "—" && (
                                                    <p className="text-[11px] font-mono text-muted-foreground">
                                                        {row.productCode}
                                                    </p>
                                                )}
                                            </div>
                                        </TableCell>

                                        {/* Total Qty */}
                                        <TableCell className="text-right font-mono text-xs font-semibold text-foreground">
                                            {row.totalQuantity.toLocaleString()}
                                        </TableCell>

                                        {/* Avg Unit Price */}
                                        <TableCell className="text-right font-mono text-xs text-muted-foreground">
                                            {formatCurrency(row.averageUnitPrice)}
                                        </TableCell>

                                        {/* Total Amount Received */}
                                        <TableCell className="text-right font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                            {formatCurrency(row.totalAmount)}
                                        </TableCell>

                                        {/* Deliveries Count */}
                                        <TableCell className="text-center">
                                            <Badge variant="secondary" className="font-mono text-xs">
                                                {row.deliveriesCount}
                                            </Badge>
                                        </TableCell>

                                        {/* Latest Receipt Date */}
                                        <TableCell className="text-center text-xs text-muted-foreground whitespace-nowrap">
                                            {row.latestReceiptDate}
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 px-4 py-3 text-xs text-muted-foreground bg-card">
                <div className="flex items-center gap-2">
                    <span>Rows per page:</span>
                    <Select
                        value={String(pageSize)}
                        onValueChange={(val) => onPageSizeChange(Number(val))}
                    >
                        <SelectTrigger className="h-8 w-18 bg-background border-input text-xs">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-popover text-popover-foreground border-border">
                            <SelectItem value="15">15</SelectItem>
                            <SelectItem value="25">25</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                            <SelectItem value="100">100</SelectItem>
                        </SelectContent>
                    </Select>
                    <span>
                        Showing {totalCount === 0 ? 0 : startIndex + 1} -{" "}
                        {Math.min(startIndex + pageSize, totalCount)} of {totalCount} products
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <span>
                        Page {currentPage} of {totalPages}
                    </span>
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        disabled={currentPage <= 1}
                        onClick={() => onPageChange(currentPage - 1)}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        disabled={currentPage >= totalPages}
                        onClick={() => onPageChange(currentPage + 1)}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
};
