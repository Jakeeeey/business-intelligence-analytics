"use client";

import React, { useState } from "react";
import {
    ArrowUpDown,
    ChevronUp,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Eye,
    MapPin,
    Copy,
    Check,
    SlidersHorizontal,
    Sparkles,
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
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NewCustomerItem } from "../types";

interface NewCustomerTableProps {
    data: NewCustomerItem[];
    totalCount: number;
    sortField: keyof NewCustomerItem;
    sortOrder: "asc" | "desc";
    onSort: (field: keyof NewCustomerItem) => void;
    currentPage: number;
    pageSize: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
    onSelectCustomer: (customer: NewCustomerItem) => void;
    loading: boolean;
}

function getAvatarColor(name: string): string {
    const colors = [
        "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/20",
        "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
        "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/20",
        "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20",
        "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/20",
        "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/20",
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
}

function getInitials(name: string): string {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
}

export const NewCustomerTable: React.FC<NewCustomerTableProps> = ({
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
    const [copiedKey, setCopiedKey] = useState<string | null>(null);

    // Column visibility toggles
    const [columns, setColumns] = useState({
        accountCode: true,
        owner: true,
        storeType: true,
        location: true,
        contact: true,
        dateEntered: true,
        status: true,
    });

    const handleCopy = (text: string, key: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!text || text === "-") return;
        navigator.clipboard.writeText(text);
        setCopiedKey(key);
        setTimeout(() => setCopiedKey(null), 1500);
    };

    const renderSortIcon = (field: keyof NewCustomerItem) => {
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

    // Count visible columns for colSpan
    let visibleColCount = 3; // #, Store Profile, Actions
    if (columns.accountCode) visibleColCount++;
    if (columns.owner) visibleColCount++;
    if (columns.storeType) visibleColCount++;
    if (columns.location) visibleColCount++;
    if (columns.contact) visibleColCount++;
    if (columns.dateEntered) visibleColCount++;
    if (columns.status) visibleColCount++;

    return (
        <div className="space-y-2.5">
            {/* Table Control Bar */}
            <div className="flex items-center justify-between gap-2 px-1">
                <div className="text-xs text-muted-foreground">
                    Showing <span className="font-semibold text-foreground">{totalCount === 0 ? 0 : startIndex + 1}</span> to{" "}
                    <span className="font-semibold text-foreground">{Math.min(startIndex + pageSize, totalCount)}</span> of{" "}
                    <span className="font-semibold text-foreground">{totalCount}</span> records
                </div>

                {/* Column Visibility Menu */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs gap-1.5 border-border/80 bg-background hover:bg-muted/60"
                        >
                            <SlidersHorizontal className="h-3.5 w-3.5" />
                            <span>Columns</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 bg-popover text-popover-foreground border-border">
                        <DropdownMenuLabel className="text-xs">Toggle Columns</DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-border" />
                        <DropdownMenuCheckboxItem
                            checked={columns.accountCode}
                            onCheckedChange={(val) => setColumns((prev) => ({ ...prev, accountCode: !!val }))}
                            className="text-xs cursor-pointer"
                        >
                            Account Code
                        </DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem
                            checked={columns.owner}
                            onCheckedChange={(val) => setColumns((prev) => ({ ...prev, owner: !!val }))}
                            className="text-xs cursor-pointer"
                        >
                            Owner / Contact
                        </DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem
                            checked={columns.storeType}
                            onCheckedChange={(val) => setColumns((prev) => ({ ...prev, storeType: !!val }))}
                            className="text-xs cursor-pointer"
                        >
                            Store Type
                        </DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem
                            checked={columns.location}
                            onCheckedChange={(val) => setColumns((prev) => ({ ...prev, location: !!val }))}
                            className="text-xs cursor-pointer"
                        >
                            Location
                        </DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem
                            checked={columns.contact}
                            onCheckedChange={(val) => setColumns((prev) => ({ ...prev, contact: !!val }))}
                            className="text-xs cursor-pointer"
                        >
                            Contact Number
                        </DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem
                            checked={columns.dateEntered}
                            onCheckedChange={(val) => setColumns((prev) => ({ ...prev, dateEntered: !!val }))}
                            className="text-xs cursor-pointer"
                        >
                            Date Entered
                        </DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem
                            checked={columns.status}
                            onCheckedChange={(val) => setColumns((prev) => ({ ...prev, status: !!val }))}
                            className="text-xs cursor-pointer"
                        >
                            Status
                        </DropdownMenuCheckboxItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <div className="rounded-2xl border border-border/70 bg-card shadow-sm overflow-hidden text-card-foreground">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-muted/40">
                            <TableRow className="border-border/60 hover:bg-transparent">
                                <TableHead className="w-12 text-center font-bold text-xs uppercase tracking-wider text-muted-foreground">
                                    #
                                </TableHead>
                                <TableHead
                                    className="cursor-pointer font-bold text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground select-none min-w-[200px]"
                                    onClick={() => onSort("storeName")}
                                >
                                    <div className="flex items-center">
                                        Store Profile
                                        {renderSortIcon("storeName")}
                                    </div>
                                </TableHead>

                                {columns.accountCode && (
                                    <TableHead
                                        className="cursor-pointer font-bold text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground select-none"
                                        onClick={() => onSort("customerCode")}
                                    >
                                        <div className="flex items-center">
                                            Account Code
                                            {renderSortIcon("customerCode")}
                                        </div>
                                    </TableHead>
                                )}

                                {columns.owner && (
                                    <TableHead
                                        className="cursor-pointer font-bold text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground select-none"
                                        onClick={() => onSort("customerName")}
                                    >
                                        <div className="flex items-center">
                                            Owner / Rep
                                            {renderSortIcon("customerName")}
                                        </div>
                                    </TableHead>
                                )}

                                {columns.storeType && (
                                    <TableHead
                                        className="cursor-pointer font-bold text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground select-none"
                                        onClick={() => onSort("storeType")}
                                    >
                                        <div className="flex items-center">
                                            Store Type
                                            {renderSortIcon("storeType")}
                                        </div>
                                    </TableHead>
                                )}

                                {columns.location && (
                                    <TableHead
                                        className="cursor-pointer font-bold text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground select-none"
                                        onClick={() => onSort("province")}
                                    >
                                        <div className="flex items-center">
                                            Location
                                            {renderSortIcon("province")}
                                        </div>
                                    </TableHead>
                                )}

                                {columns.contact && (
                                    <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
                                        Contact
                                    </TableHead>
                                )}

                                {columns.dateEntered && (
                                    <TableHead
                                        className="cursor-pointer font-bold text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground select-none"
                                        onClick={() => onSort("dateEntered")}
                                    >
                                        <div className="flex items-center">
                                            Date Entered
                                            {renderSortIcon("dateEntered")}
                                        </div>
                                    </TableHead>
                                )}

                                {columns.status && (
                                    <TableHead className="text-center font-bold text-xs uppercase tracking-wider text-muted-foreground">
                                        Status
                                    </TableHead>
                                )}

                                <TableHead className="w-16 text-center font-bold text-xs uppercase tracking-wider text-muted-foreground">
                                    Action
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={visibleColCount}
                                        className="h-36 text-center text-muted-foreground text-sm"
                                    >
                                        {loading ? "Fetching new customer records..." : "No customer accounts found."}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                data.map((row, idx) => {
                                    const rank = startIndex + idx + 1;
                                    const avatarColor = getAvatarColor(row.storeName);
                                    const initials = getInitials(row.storeName);
                                    const codeCopied = copiedKey === `code-${row.id}`;
                                    const contactCopied = copiedKey === `contact-${row.id}`;
                                    const locCopied = copiedKey === `loc-${row.id}`;

                                    return (
                                        <TableRow
                                            key={row.id}
                                            className="border-border/50 hover:bg-muted/40 cursor-pointer transition-colors group"
                                            onClick={() => onSelectCustomer(row)}
                                        >
                                            <TableCell className="text-center font-medium text-xs text-muted-foreground">
                                                {rank}
                                            </TableCell>

                                            {/* Store Name with Avatar & Recency Badge */}
                                            <TableCell className="font-semibold text-sm text-foreground">
                                                <div className="flex items-center gap-2.5">
                                                    <div
                                                        className={`h-8 w-8 rounded-lg flex items-center justify-center font-bold text-xs border shrink-0 ${avatarColor}`}
                                                    >
                                                        {initials}
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        <div className="flex items-center gap-1.5 flex-wrap">
                                                            <span className="truncate font-bold max-w-[200px]" title={row.storeName}>
                                                                {row.storeName}
                                                            </span>
                                                            {row.isRecent && (
                                                                <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.2 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                                                                    <Sparkles className="h-2.5 w-2.5" />
                                                                    {row.recencyLabel}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {row.storeSignage && row.storeSignage !== "-" && (
                                                            <span className="text-[11px] font-normal text-muted-foreground truncate max-w-[200px]">
                                                                Signage: {row.storeSignage}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </TableCell>

                                            {/* Account Code with Click-to-Copy */}
                                            {columns.accountCode && (
                                                <TableCell className="font-mono text-xs font-semibold text-foreground">
                                                    <div className="flex items-center gap-1.5">
                                                        <span>{row.customerCode}</span>
                                                        <button
                                                            type="button"
                                                            onClick={(e) => handleCopy(row.customerCode, `code-${row.id}`, e)}
                                                            className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-muted rounded text-muted-foreground hover:text-foreground"
                                                            title="Copy account code"
                                                        >
                                                            {codeCopied ? (
                                                                <Check className="h-3.5 w-3.5 text-emerald-500" />
                                                            ) : (
                                                                <Copy className="h-3 w-3" />
                                                            )}
                                                        </button>
                                                    </div>
                                                </TableCell>
                                            )}

                                            {/* Owner & Salesman */}
                                            {columns.owner && (
                                                <TableCell className="text-xs text-foreground font-medium">
                                                    <div>
                                                        <p className="truncate max-w-[150px]">{row.customerName}</p>
                                                        {row.salesmanName && row.salesmanName !== "Unassigned" && (
                                                            <p className="text-[11px] text-muted-foreground truncate max-w-[150px]">
                                                                Rep: {row.salesmanName}
                                                            </p>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            )}

                                            {/* Store Type */}
                                            {columns.storeType && (
                                                <TableCell>
                                                    <Badge
                                                        variant="secondary"
                                                        className="text-xs font-medium border-border/40"
                                                    >
                                                        {row.storeType}
                                                    </Badge>
                                                </TableCell>
                                            )}

                                            {/* Location with Quick Copy */}
                                            {columns.location && (
                                                <TableCell className="text-xs text-muted-foreground max-w-[180px] truncate" title={row.location}>
                                                    <div className="flex items-center gap-1">
                                                        <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                                                        <span className="truncate">{row.location}</span>
                                                        <button
                                                            type="button"
                                                            onClick={(e) => handleCopy(row.location, `loc-${row.id}`, e)}
                                                            className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-muted rounded text-muted-foreground hover:text-foreground shrink-0"
                                                            title="Copy address"
                                                        >
                                                            {locCopied ? (
                                                                <Check className="h-3.5 w-3.5 text-emerald-500" />
                                                            ) : (
                                                                <Copy className="h-3 w-3" />
                                                            )}
                                                        </button>
                                                    </div>
                                                </TableCell>
                                            )}

                                            {/* Contact Number with Quick Copy */}
                                            {columns.contact && (
                                                <TableCell className="text-xs text-muted-foreground font-mono">
                                                    <div className="flex items-center gap-1">
                                                        <span>{row.contactNumber}</span>
                                                        {row.contactNumber !== "-" && (
                                                            <button
                                                                type="button"
                                                                onClick={(e) => handleCopy(row.contactNumber, `contact-${row.id}`, e)}
                                                                className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-muted rounded text-muted-foreground hover:text-foreground"
                                                                title="Copy contact number"
                                                            >
                                                                {contactCopied ? (
                                                                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                                                                ) : (
                                                                    <Copy className="h-3 w-3" />
                                                                )}
                                                            </button>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            )}

                                            {/* Date Entered */}
                                            {columns.dateEntered && (
                                                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                                                    {row.dateEntered || "-"}
                                                </TableCell>
                                            )}

                                            {/* Active Status Badge with Pulse Indicator */}
                                            {columns.status && (
                                                <TableCell className="text-center">
                                                    {row.isActive ? (
                                                        <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-0 text-[11px] font-semibold inline-flex items-center gap-1.5">
                                                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                            Active
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="text-muted-foreground border-border text-[11px]">
                                                            Inactive
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                            )}

                                            {/* Action View */}
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
                                                    className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                                                    title="View Profile"
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

                {/* Pagination Bar */}
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
                                <SelectItem value="10">10</SelectItem>
                                <SelectItem value="25">25</SelectItem>
                                <SelectItem value="50">50</SelectItem>
                                <SelectItem value="100">100</SelectItem>
                            </SelectContent>
                        </Select>
                        <span>
                            Showing {totalCount === 0 ? 0 : startIndex + 1} -{" "}
                            {Math.min(startIndex + pageSize, totalCount)} of {totalCount} accounts
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
        </div>
    );
};
