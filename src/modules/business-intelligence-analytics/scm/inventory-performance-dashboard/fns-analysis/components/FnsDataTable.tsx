// src/modules/.../fns-analysis/components/FnsDataTable.tsx
"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/new-data-table";
import { ColumnDef } from "@tanstack/react-table";
import type { FnsEnrichedRow } from "../types";

const FNS_LABELS: Record<string, string> = {
    F: "Fast",
    N: "Normal",
    S: "Slow",
};

/**
 * Column definitions for the FNS analysis DataTable.
 * Columns: Rank, Product Name, Supplier, Pick Count, Category.
 *
 * All columns are hideable via the View dropdown (column toggle).
 * Rank uses the row index (+ 1) so each tab's ranking restarts
 * from 1 independently.
 */
const columns: ColumnDef<FnsEnrichedRow>[] = [
    {
        accessorKey: "rank",
        header: "Rank",
        cell: ({ row }) => (
            <span className="font-mono font-medium">#{row.index + 1}</span>
        ),
    },
    {
        accessorKey: "productName",
        header: "Product Name",
        cell: ({ row }) => (
            <span className="font-medium line-clamp-1">{row.original.productName}</span>
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
        accessorKey: "pickCount",
        header: "Pick Count",
        cell: ({ row }) => (
            <span className="font-semibold text-primary">
                {row.original.pickCount.toLocaleString()}
            </span>
        ),
    },
    {
        accessorKey: "fnsClass",
        header: "Category",
        cell: ({ row }) => {
            const cls = row.original.fnsClass;

            // Inline styles guarantee badge contrast in both light & dark mode
            const badgeColors: Record<string, { bg: string; text: string; border: string }> = {
                F: { bg: "#dcfce7", text: "#15803d", border: "#86efac" }, // green tones
                N: { bg: "#dbeafe", text: "#1d4ed8", border: "#93c5fd" }, // blue tones
                S: { bg: "#fee2e2", text: "#b91c1c", border: "#fca5a5" }, // red tones
            };

            const colors = badgeColors[cls] || badgeColors.S;

            return (
                <Badge
                    variant="outline"
                    style={{
                        backgroundColor: colors.bg,
                        color: colors.text,
                        borderColor: colors.border,
                    }}
                >
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
