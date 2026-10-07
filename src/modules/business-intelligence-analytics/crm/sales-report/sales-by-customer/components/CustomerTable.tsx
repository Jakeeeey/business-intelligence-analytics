"use client";

import React from "react";
import {
    ArrowUpDown,
    ChevronUp,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Eye,
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
import { CustomerSummary } from "../types";

interface CustomerTableProps {
    data: CustomerSummary[];
    totalCount: number;
    sortField: keyof CustomerSummary;
    sortOrder: "asc" | "desc";
    onSort: (field: keyof CustomerSummary) => void;
    currentPage: number;
    pageSize: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
    onSelectCustomer: (customer: CustomerSummary) => void;
    loading: boolean;
}

export const CustomerTable: React.FC<CustomerTableProps> = ({
    data,
    totalCount,
    sortField,
    sortOrder,
    onSort,
    currentPage,
    pageSize,
    totalPages,
    onPageChange,
    onPageSizeChange,
    onSelectCustomer,
    loading,
}) => {
    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat("en-PH", {
            style: "currency",
            currency: "PHP",
            maximumFractionDigits: 2,
        }).format(val || 0);
    };

    const renderSortIcon = (field: keyof CustomerSummary) => {
        if (sortField !== field) {
            return <ArrowUpDown className="ml-1.5 h-3.5 w-3.5 text-muted-foreground opacity-60" />;
        }
        return sortOrder === "asc" ? (
            <ChevronUp className="ml-1.5 h-3.5 w-3.5 text-foreground" />
        ) : (
            <ChevronDown className="ml-1.5 h-3.5 w-3.5 text-foreground" />
        );
    };

    const startIndex = (currentPage - 1) * pageSize;

    return (
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden text-card-foreground">
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader className="bg-muted/40">
                        <TableRow className="border-border hover:bg-transparent">
                            <TableHead className="w-14 text-center font-bold text-xs uppercase tracking-wider text-muted-foreground">
                                #
                            </TableHead>
                            <TableHead
                                className="cursor-pointer font-bold text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground select-none"
                                onClick={() => onSort("customerName")}
                            >
                                <div className="flex items-center">
                                    Customer Name
                                    {renderSortIcon("customerName")}
                                </div>
                            </TableHead>
                            <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
                                Code / Area
                            </TableHead>
                            <TableHead
                                className="cursor-pointer font-bold text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground select-none"
                                onClick={() => onSort("storeType")}
                            >
                                <div className="flex items-center">
                                    Store Type
                                    {renderSortIcon("storeType")}
                                </div>
                            </TableHead>
                            <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
                                Division
                            </TableHead>
                            <TableHead
                                className="cursor-pointer text-right font-bold text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground select-none"
                                onClick={() => onSort("transactionCount")}
                            >
                                <div className="flex items-center justify-end">
                                    Transactions
                                    {renderSortIcon("transactionCount")}
                                </div>
                            </TableHead>
                            <TableHead
                                className="cursor-pointer text-right font-bold text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground select-none"
                                onClick={() => onSort("totalSales")}
                            >
                                <div className="flex items-center justify-end">
                                    Net Sales
                                    {renderSortIcon("totalSales")}
                                </div>
                            </TableHead>
                            <TableHead
                                className="cursor-pointer text-right font-bold text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground select-none"
                                onClick={() => onSort("percentageShare")}
                            >
                                <div className="flex items-center justify-end">
                                    Share
                                    {renderSortIcon("percentageShare")}
                                </div>
                            </TableHead>
                            <TableHead className="w-20 text-center font-bold text-xs uppercase tracking-wider text-muted-foreground">
                                Action
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={9}
                                    className="h-32 text-center text-muted-foreground text-sm"
                                >
                                    {loading ? "Loading customer sales data..." : "No customer sales records found."}
                                </TableCell>
                            </TableRow>
                        ) : (
                            data.map((row, idx) => {
                                const rank = startIndex + idx + 1;
                                return (
                                    <TableRow
                                        key={`${row.customerName}-${idx}`}
                                        className="border-border hover:bg-muted/50 cursor-pointer transition-colors"
                                        onClick={() => onSelectCustomer(row)}
                                    >
                                        <TableCell className="text-center font-medium text-xs text-muted-foreground">
                                            {rank}
                                        </TableCell>
                                        <TableCell className="font-semibold text-sm text-foreground">
                                            <div className="flex flex-col">
                                                <span>{row.customerName}</span>
                                                {(row.customerAddress || row.city || row.province) && (
                                                    <span className="text-[11px] font-normal text-muted-foreground">
                                                        {row.customerAddress || [row.city, row.province].filter(Boolean).join(", ")}
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground font-mono">
                                            {row.customerCode}
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant="secondary"
                                                className="font-medium text-xs bg-secondary text-secondary-foreground"
                                            >
                                                {row.storeType}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground">
                                            {row.divisionName}
                                        </TableCell>
                                        <TableCell className="text-right text-xs font-medium text-foreground">
                                            {row.transactionCount.toLocaleString()}
                                        </TableCell>
                                        <TableCell className="text-right text-sm font-bold text-foreground">
                                            {formatCurrency(row.totalSales)}
                                        </TableCell>
                                        <TableCell className="text-right text-xs font-semibold text-primary">
                                            {row.percentageShare.toFixed(2)}%
                                        </TableCell>
                                        <TableCell
                                            className="text-center"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onSelectCustomer(row);
                                            }}
                                        >
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
                                                title="View Breakdown"
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
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 text-xs text-muted-foreground">
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
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="25">25</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                            <SelectItem value="100">100</SelectItem>
                        </SelectContent>
                    </Select>
                    <span>
                        Showing {totalCount === 0 ? 0 : startIndex + 1} -{" "}
                        {Math.min(startIndex + pageSize, totalCount)} of {totalCount} customers
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
