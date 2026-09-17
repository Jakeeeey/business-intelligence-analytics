"use client";

import React, { useState } from "react";
import {
    ChevronLeft,
    ChevronRight,
    ArrowUpDown,
    ChevronUp,
    ChevronDown,
    Eye,
    Copy,
    Check,
} from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { CollectionReceiptItem } from "../types";

interface CollectionReceiptsTableProps {
    data: CollectionReceiptItem[];
    totalCount: number;
    currentPage: number;
    pageSize: number;
    totalPages: number;
    sortField: "collectionDate" | "amount" | "salesmanName";
    sortOrder: "asc" | "desc";
    onSort: (field: "collectionDate" | "amount" | "salesmanName") => void;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
    onSelectReceipt: (receipt: CollectionReceiptItem) => void;
    loading: boolean;
}

function formatCurrency(val: number): string {
    return new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
        maximumFractionDigits: 2,
    }).format(val);
}

export const CollectionReceiptsTable: React.FC<CollectionReceiptsTableProps> = ({
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
    onSelectReceipt,
    loading,
}) => {
    const [copiedKey, setCopiedKey] = useState<string | null>(null);

    const handleCopy = (text: string, key: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!text || text === "—") return;
        navigator.clipboard.writeText(text);
        setCopiedKey(key);
        setTimeout(() => setCopiedKey(null), 1500);
    };

    const renderSortIcon = (field: "collectionDate" | "amount" | "salesmanName") => {
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
                            <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
                                Receipt / Doc #
                            </TableHead>
                            <TableHead
                                className="cursor-pointer font-bold text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground select-none"
                                onClick={() => onSort("collectionDate")}
                            >
                                <div className="flex items-center">
                                    Collection Date
                                    {renderSortIcon("collectionDate")}
                                </div>
                            </TableHead>
                            <TableHead
                                className="cursor-pointer font-bold text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground select-none"
                                onClick={() => onSort("salesmanName")}
                            >
                                <div className="flex items-center">
                                    Sales Representative
                                    {renderSortIcon("salesmanName")}
                                </div>
                            </TableHead>
                            <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
                                Collected By
                            </TableHead>
                            <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
                                Payment Method
                            </TableHead>
                            <TableHead
                                className="cursor-pointer text-right font-bold text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground select-none"
                                onClick={() => onSort("amount")}
                            >
                                <div className="flex items-center justify-end">
                                    Amount
                                    {renderSortIcon("amount")}
                                </div>
                            </TableHead>
                            <TableHead className="w-16 text-center font-bold text-xs uppercase tracking-wider text-muted-foreground">
                                Action
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="h-32 text-center text-muted-foreground text-sm">
                                    {loading ? "Loading collection receipts..." : "No collection receipts found."}
                                </TableCell>
                            </TableRow>
                        ) : (
                            data.map((row, idx) => {
                                const rank = startIndex + idx + 1;
                                const isCopied = copiedKey === `receipt-${row.id}`;

                                return (
                                    <TableRow
                                        key={`${row.id}-${idx}`}
                                        className="border-border/50 hover:bg-muted/40 transition-colors cursor-pointer group"
                                        onClick={() => onSelectReceipt(row)}
                                    >
                                        <TableCell className="text-center font-medium text-xs text-muted-foreground">
                                            {rank}
                                        </TableCell>

                                        {/* Receipt / Doc */}
                                        <TableCell className="font-mono text-xs">
                                            <div className="flex items-center gap-1.5">
                                                <span className="font-bold text-foreground">
                                                    {row.receiptNo !== "—" ? row.receiptNo : row.docNo}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={(e) =>
                                                        handleCopy(
                                                            row.receiptNo !== "—" ? row.receiptNo : row.docNo,
                                                            `receipt-${row.id}`,
                                                            e
                                                        )
                                                    }
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-muted rounded text-muted-foreground hover:text-foreground"
                                                    title="Copy receipt #"
                                                >
                                                    {isCopied ? (
                                                        <Check className="h-3 w-3 text-emerald-500" />
                                                    ) : (
                                                        <Copy className="h-3 w-3" />
                                                    )}
                                                </button>
                                            </div>
                                            {row.docNo && row.docNo !== row.receiptNo && row.docNo !== "—" && (
                                                <p className="text-[11px] text-muted-foreground">Doc: {row.docNo}</p>
                                            )}
                                        </TableCell>

                                        {/* Date */}
                                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                                            {row.collectionDate}
                                        </TableCell>

                                        {/* Salesman */}
                                        <TableCell className="text-xs font-semibold text-foreground">
                                            {row.salesmanName}
                                        </TableCell>

                                        {/* Collected By */}
                                        <TableCell className="text-xs text-muted-foreground">
                                            {row.collectedBy}
                                        </TableCell>

                                        {/* Payment Method */}
                                        <TableCell>
                                            <Badge variant="secondary" className="text-xs font-medium border-border/40">
                                                {row.paymentMethod}
                                            </Badge>
                                        </TableCell>

                                        {/* Amount */}
                                        <TableCell className="text-right font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                            {formatCurrency(row.amount)}
                                        </TableCell>

                                        {/* Action */}
                                        <TableCell
                                            className="text-center"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onSelectReceipt(row);
                                            }}
                                        >
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                                                title="View Receipt"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
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
                        {Math.min(startIndex + pageSize, totalCount)} of {totalCount} records
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
