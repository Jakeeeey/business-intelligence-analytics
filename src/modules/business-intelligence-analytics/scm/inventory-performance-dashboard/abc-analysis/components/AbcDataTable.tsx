"use client";

import React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/new-data-table";
import { Button } from "@/components/ui/button";
import { ArrowUpDown } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface AbcDataTableProps {
    data: any[];
    isLoading: boolean;
}

export function AbcDataTable({ data, isLoading }: AbcDataTableProps) {
    const columns: ColumnDef<any>[] = [
        {
            accessorKey: "classRank",
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="p-0 font-bold hover:bg-transparent"
                >
                    Rank
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => (
                <span className="font-mono font-medium">#{row.original.classRank}</span>
            ),
        },
        {
            accessorKey: "abcClass",
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="p-0 font-bold hover:bg-transparent"
                >
                    Class
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => {
                const val = row.original.abcClass;
                return (
                    <Badge
                        variant="outline"
                        className={cn(
                            "font-bold",
                            val === "A" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                                val === "B" ? "bg-amber-50 text-amber-700 border-amber-200" :
                                    "bg-red-50 text-red-700 border-red-200"
                        )}
                    >
                        {val}
                    </Badge>
                );
            },
        },
        {
            accessorKey: "productName",
            header: "Product",
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="font-medium line-clamp-1">{row.original.productName}</span>
                    <span className="text-xs text-muted-foreground">{row.original.productId}</span>
                </div>
            ),
        },
        {
            accessorKey: "supplierName",
            header: "Supplier",
            cell: ({ row }) => (
                <span className="text-sm truncate max-w-[150px] inline-block">
                    {row.original.supplierName}
                </span>
            ),
        },
        {
            accessorKey: "outQtyBase",
            header: "Volume",
            cell: ({ row }) => row.original.outQtyBase.toLocaleString(),
        },
        {
            accessorKey: "outValue",
            header: "Value",
            cell: ({ row }) => (
                <span className="font-semibold text-primary">
                    ₱{row.original.outValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
            ),
        },
        {
            accessorKey: "cumulativePct",
            header: "Cum. %",
            cell: ({ row }) => (
                <span className="text-xs text-muted-foreground italic">
                    {row.original.cumulativePct.toFixed(1)}%
                </span>
            ),
        },
    ];

    return (
        <Card className="shadow-sm border-sidebar-border/40 overflow-hidden">
            <CardHeader className="bg-muted/30 pb-4">
                <CardTitle>Detailed Classification Table</CardTitle>
                <CardDescription>
                    Comprehensive list of items with categorization and rank metrics
                </CardDescription>
            </CardHeader>
            <div className="px-6 pb-6 pt-2">
                <DataTable
                    columns={columns}
                    data={data}
                    searchKey="productName"
                    isLoading={isLoading}
                    sorting={[{ id: "classRank", desc: false }]}
                />
            </div>
        </Card>
    );
}
