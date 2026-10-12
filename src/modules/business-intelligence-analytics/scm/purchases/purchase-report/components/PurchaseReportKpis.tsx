"use client";

import React from "react";
import {
    ShoppingBag,
    PackageCheck,
    Percent,
    Clock,
    Building2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PurchaseReportKpis as KpiTypes } from "../types";

interface PurchaseReportKpisProps {
    kpis: KpiTypes;
}

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
        maximumFractionDigits: 0,
    }).format(amount);
}

export const PurchaseReportKpis: React.FC<PurchaseReportKpisProps> = ({ kpis }) => {
    const fulfillmentProgress = Math.min(100, Math.max(0, kpis.overallFulfillmentRate));

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {/* Card 1: Total PO Value */}
            <Card className="border-border/70 bg-card/80 shadow-xs backdrop-blur-sm">
                <CardContent className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Total Orders
                        </span>
                        <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                            <ShoppingBag className="h-4 w-4" />
                        </div>
                    </div>
                    <div>
                        <p className="text-xl sm:text-2xl font-bold tracking-tight text-foreground font-mono">
                            {formatCurrency(kpis.totalPoValue)}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                            Across {kpis.totalPoCount.toLocaleString()} purchase orders
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Card 2: Total Received Value */}
            <Card className="border-border/70 bg-card/80 shadow-xs backdrop-blur-sm">
                <CardContent className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Total Received
                        </span>
                        <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            <PackageCheck className="h-4 w-4" />
                        </div>
                    </div>
                    <div>
                        <p className="text-xl sm:text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 font-mono">
                            {formatCurrency(kpis.totalReceivedValue)}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                            Posted deliveries from suppliers
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Card 3: Receiving Fulfillment Rate */}
            <Card className="border-border/70 bg-card/80 shadow-xs backdrop-blur-sm">
                <CardContent className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Fulfillment Rate
                        </span>
                        <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                            <Percent className="h-4 w-4" />
                        </div>
                    </div>
                    <div>
                        <div className="flex items-baseline justify-between">
                            <p className="text-xl sm:text-2xl font-bold tracking-tight text-foreground font-mono">
                                {kpis.overallFulfillmentRate.toFixed(1)}%
                            </p>
                            <span className="text-[11px] text-muted-foreground">Target: 100%</span>
                        </div>
                        <Progress value={fulfillmentProgress} className="h-1.5 mt-2" />
                    </div>
                </CardContent>
            </Card>

            {/* Card 4: Pending / Unserved Balance */}
            <Card className="border-border/70 bg-card/80 shadow-xs backdrop-blur-sm">
                <CardContent className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Pending Balance
                        </span>
                        <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                            <Clock className="h-4 w-4" />
                        </div>
                    </div>
                    <div>
                        <p className="text-xl sm:text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400 font-mono">
                            {formatCurrency(kpis.totalPendingValue)}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                            Awaiting delivery / receiving
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Card 5: Top Supplier */}
            <Card className="border-border/70 bg-card/80 shadow-xs backdrop-blur-sm">
                <CardContent className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Top Supplier
                        </span>
                        <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                            <Building2 className="h-4 w-4" />
                        </div>
                    </div>
                    <div>
                        <p className="text-xl sm:text-2xl font-bold tracking-tight text-foreground truncate" title={kpis.topSupplier}>
                            {kpis.topSupplier}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5 font-mono">
                            {formatCurrency(kpis.topSupplierAmount)}
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
