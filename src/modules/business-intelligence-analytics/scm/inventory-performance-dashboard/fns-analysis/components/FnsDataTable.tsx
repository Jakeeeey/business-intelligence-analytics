// src/modules/.../fns-analysis/components/FnsDataTable.tsx
"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/new-data-table";
import { ColumnDef } from "@tanstack/react-table";
import type { FnsEnrichedRow } from "../types";

/**
 * Map FNS class to shadcn Badge variant.
 * No hardcoded colors — relies entirely on shadcn's variant system.
 */
const FNS_BADGE_VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
    F: "default",
    N: "secondary",
    S: "destructive",
};

const FNS_LABELS: Record<string, string> = {
    F: "Fast",
    N: "Normal",
    S: "Slow",
};

/**
 * Column definitions for the FNS analysis DataTable.
 * Columns: Rank, SKU, Product Name, Supplier, Pick Count, Category.
 *
 * All columns have `enableHiding: false` so the "View" column toggle
 * dropdown does not appear (revision #5: remove redundant View filter).
 *
 * Rank uses the row index (+ 1) instead of the pre-computed rank,
 * so each tab's ranking restarts from 1 independently (revision #4).
 */
const columns: ColumnDef<FnsEnrichedRow>[] = [
    {
        accessorKey: "rank",
        header: "Rank",
        enableHiding: false,
        cell: ({ row }) => (
            <span className="text-muted-foreground font-medium">
                {row.index + 1}
            </span>
        ),
    },
    {
        accessorKey: "sku",
        header: "SKU",
        enableHiding: false,
        cell: ({ row }) => (
            <span className="font-mono text-sm">{row.original.sku}</span>
        ),
    },
    {
        accessorKey: "productName",
        header: "Product Name",
        enableHiding: false,
        cell: ({ row }) => (
            <span className="font-medium">{row.original.productName}</span>
        ),
    },
    {
        accessorKey: "supplierName",
        header: "Supplier",
        enableHiding: false,
        cell: ({ row }) => (
            <span className="text-muted-foreground">{row.original.supplierName}</span>
        ),
    },
    {
        accessorKey: "pickCount",
        header: "Pick Count",
        enableHiding: false,
        cell: ({ row }) => (
            <span className="font-bold text-center block">
                {row.original.pickCount}
            </span>
        ),
    },
    {
        accessorKey: "fnsClass",
        header: "Category",
        enableHiding: false,
        cell: ({ row }) => {
            const cls = row.original.fnsClass;
            return (
                <Badge variant={FNS_BADGE_VARIANT[cls] || "outline"}>
                    {FNS_LABELS[cls] || cls}
                </Badge>
            );
        },
    },
];

interface FnsDataTableProps {
    data: FnsEnrichedRow[];
    isLoading: boolean;
}

/**
 * Shared DataTable component used by the Fast, Normal, and Slow tabs.
 * Receives a pre-filtered list of rows for the active category.
 */
export function FnsDataTable({ data, isLoading }: FnsDataTableProps) {
    return (
        <DataTable
            columns={columns}
            data={data}
            searchKey="productName"
            isLoading={isLoading}
            emptyTitle="No Products Found"
            emptyDescription="No products match the current filter criteria."
        />
    );
}
