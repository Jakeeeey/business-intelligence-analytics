"use client";

import React from "react";
import { CardDescription } from "@/components/ui/card";
import { usePdar } from "./hooks/usePdar";
import { PdarTable } from "./components/PdarTable";

export function PdarPage() {
    const { data, isLoading, error } = usePdar();

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
                <h2 className="text-2xl font-bold text-destructive">Error Loading Data</h2>
                <p className="text-muted-foreground">{error}</p>
                <button 
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-4 md:p-8 pt-6 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Proof of Delivery (PDAR)</h2>
                    <CardDescription className="mt-1">
                        View posted dispatch plans and delivery acknowledgement receipts
                    </CardDescription>
                </div>
            </div>

            <PdarTable data={data} isLoading={isLoading} />
        </div>
    );
}
