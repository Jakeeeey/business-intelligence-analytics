"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingDown, TrendingUp, Scale, PackageX, Target } from "lucide-react";

interface Props {
    totalShortage: number;
    totalOverage: number;
    netTotal: number;
    totalItems: number;
    recordCount: number;
    accuracyScore: number;
    supplierName?: string | null; // NEW: Accepts the selected supplier
}

export const InventoryVarianceKpis = ({
                                          totalShortage,
                                          totalOverage,
                                          netTotal,
                                          totalItems,
                                          recordCount,
                                          accuracyScore,
                                          supplierName
                                      }: Props) => {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <Card className="shadow-sm border-rose-100 bg-rose-50/10">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs font-bold uppercase text-rose-600 tracking-wider">Total Shortages</CardTitle>
                    <TrendingDown className="h-4 w-4 text-rose-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold font-mono text-rose-600">
                        ₱{Math.abs(totalShortage).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                </CardContent>
            </Card>

            <Card className="shadow-sm border-emerald-100 bg-emerald-50/10">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs font-bold uppercase text-emerald-600 tracking-wider">Total Overages</CardTitle>
                    <TrendingUp className="h-4 w-4 text-emerald-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold font-mono text-emerald-600">
                        ₱{Math.abs(totalOverage).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                </CardContent>
            </Card>

            <Card className="shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Net Variance</CardTitle>
                    <Scale className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className={`text-2xl font-bold font-mono ${netTotal < 0 ? 'text-rose-500' : netTotal > 0 ? 'text-emerald-500' : ''}`}>
                        {netTotal < 0 ? '-' : netTotal > 0 ? '+' : ''}₱{Math.abs(netTotal).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                </CardContent>
            </Card>

            {/* DYNAMIC ACCURACY TITLE */}
            <Card className="shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs font-bold uppercase text-muted-foreground tracking-wider truncate" title={supplierName ? `${supplierName} Accuracy` : 'Global Accuracy'}>
                        {supplierName ? `${supplierName} Accuracy` : 'Global Accuracy'}
                    </CardTitle>
                    <Target className={`h-4 w-4 shrink-0 ${accuracyScore >= 98 ? 'text-emerald-500' : accuracyScore >= 95 ? 'text-amber-500' : 'text-rose-500'}`} />
                </CardHeader>
                <CardContent>
                    <div className={`text-2xl font-bold font-mono ${accuracyScore >= 98 ? 'text-emerald-500' : accuracyScore >= 95 ? 'text-amber-500' : 'text-rose-500'}`}>
                        {accuracyScore.toFixed(2)}%
                    </div>
                </CardContent>
            </Card>

            <Card className="shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Items Missing</CardTitle>
                    <PackageX className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold font-mono">
                        {totalItems.toLocaleString()} <span className="text-sm font-sans font-normal text-muted-foreground">units</span>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};