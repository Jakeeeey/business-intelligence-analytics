"use client";

import React from "react";
import {
    TrendingUp,
    Receipt,
    Percent,
    ArrowUpRight,
    ArrowDownRight,
    CreditCard,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CollectionVsSalesKpis as KpiTypes } from "../types";

interface CollectionVsSalesKpisProps {
    kpis: KpiTypes;
}

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
        maximumFractionDigits: 0,
    }).format(amount);
}

export const CollectionVsSalesKpis: React.FC<CollectionVsSalesKpisProps> = ({ kpis }) => {
    const isSurplus = kpis.variance >= 0;
    const eff = Math.min(100, Math.max(0, kpis.collectionEfficiency));

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {/* Card 1: Total Sales */}
            <Card className="border-border/70 bg-card/80 shadow-xs backdrop-blur-sm">
                <CardContent className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Invoiced Sales
                        </span>
                        <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                            <TrendingUp className="h-4 w-4" />
                        </div>
                    </div>
                    <div>
                        <p className="text-xl sm:text-2xl font-bold tracking-tight text-foreground font-mono">
                            {formatCurrency(kpis.totalSales)}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                            Net sales after deducted returns
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Card 2: Total Collections */}
            <Card className="border-border/70 bg-card/80 shadow-xs backdrop-blur-sm">
                <CardContent className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Total Collected
                        </span>
                        <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            <Receipt className="h-4 w-4" />
                        </div>
                    </div>
                    <div>
                        <p className="text-xl sm:text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 font-mono">
                            {formatCurrency(kpis.totalCollected)}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                            Across {kpis.receiptsCount.toLocaleString()} collection items
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Card 3: Collection Efficiency */}
            <Card className="border-border/70 bg-card/80 shadow-xs backdrop-blur-sm">
                <CardContent className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Collection Efficiency
                        </span>
                        <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                            <Percent className="h-4 w-4" />
                        </div>
                    </div>
                    <div>
                        <div className="flex items-baseline justify-between">
                            <p className="text-xl sm:text-2xl font-bold tracking-tight text-foreground font-mono">
                                {kpis.collectionEfficiency.toFixed(1)}%
                            </p>
                            <span className="text-[11px] text-muted-foreground">Target: 100%</span>
                        </div>
                        <Progress value={eff} className="h-1.5 mt-2" />
                    </div>
                </CardContent>
            </Card>

            {/* Card 4: Variance / Net Gap */}
            <Card className="border-border/70 bg-card/80 shadow-xs backdrop-blur-sm">
                <CardContent className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            {isSurplus ? "Net Surplus" : "Uncollected Gap"}
                        </span>
                        <div
                            className={`p-2 rounded-xl ${
                                isSurplus
                                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                    : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                            }`}
                        >
                            {isSurplus ? (
                                <ArrowUpRight className="h-4 w-4" />
                            ) : (
                                <ArrowDownRight className="h-4 w-4" />
                            )}
                        </div>
                    </div>
                    <div>
                        <p
                            className={`text-xl sm:text-2xl font-bold tracking-tight font-mono ${
                                isSurplus
                                    ? "text-emerald-600 dark:text-emerald-400"
                                    : "text-rose-600 dark:text-rose-400"
                            }`}
                        >
                            {formatCurrency(Math.abs(kpis.variance))}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                            {isSurplus
                                ? "Collections exceeded sales"
                                : "Remaining balance to be collected"}
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Card 5: Top Payment Method */}
            <Card className="border-border/70 bg-card/80 shadow-xs backdrop-blur-sm">
                <CardContent className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Top Payment Mode
                        </span>
                        <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                            <CreditCard className="h-4 w-4" />
                        </div>
                    </div>
                    <div>
                        <p className="text-xl sm:text-2xl font-bold tracking-tight text-foreground truncate" title={kpis.topPaymentMethod}>
                            {kpis.topPaymentMethod}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5 font-mono">
                            {formatCurrency(kpis.topPaymentAmount)}
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
