"use client";

import React from "react";
import { Trophy, ArrowUpRight, Package, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AbcSummaryCardsProps {
    stats: {
        totalValue: number;
        totalItems: number;
        catA: { count: number; value: number };
        catB: { count: number; value: number };
        catC: { count: number; value: number };
    };
}

export function AbcSummaryCards({ stats }: AbcSummaryCardsProps) {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-primary/5 border-primary/10 shadow-sm relative overflow-hidden group">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Inventory Value</CardTitle>
                    <Trophy className="h-4 w-4 text-primary opacity-70 group-hover:scale-125 transition-transform" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-primary">
                        ₱{stats.totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                        Across {stats.totalItems} distinct products
                    </p>
                </CardContent>
                <div className="absolute top-0 right-0 w-24 h-24 -mr-12 -mt-12 bg-primary/10 rounded-full blur-2xl" />
            </Card>

            <Card className="shadow-sm border-none bg-emerald-50/50 dark:bg-emerald-950/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Class A Items</CardTitle>
                    <ArrowUpRight className="h-4 w-4 text-emerald-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{stats.catA.count}</div>
                    <p className="text-xs text-emerald-600/80 mt-1">
                        {((stats.catA.count / stats.totalItems) * 100 || 0).toFixed(1)}% of items, 70% of value
                    </p>
                </CardContent>
            </Card>

            <Card className="shadow-sm border-none bg-amber-50/50 dark:bg-amber-950/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-amber-700 dark:text-amber-400">Class B Items</CardTitle>
                    <Package className="h-4 w-4 text-amber-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-amber-700 dark:text-amber-400">{stats.catB.count}</div>
                    <p className="text-xs text-amber-600/80 mt-1">
                        {((stats.catB.count / stats.totalItems) * 100 || 0).toFixed(1)}% of items, 20% of value
                    </p>
                </CardContent>
            </Card>

            <Card className="shadow-sm border-none bg-red-50/50 dark:bg-red-950/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-red-700 dark:text-red-400">Class C Items</CardTitle>
                    <BarChart3 className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-red-700 dark:text-red-400">{stats.catC.count}</div>
                    <p className="text-xs text-red-600/80 mt-1">
                        {((stats.catC.count / stats.totalItems) * 100 || 0).toFixed(1)}% of items, 10% of value
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
