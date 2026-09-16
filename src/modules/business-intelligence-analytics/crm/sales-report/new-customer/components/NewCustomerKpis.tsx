"use client";

import React from "react";
import { UserPlus, CheckCircle2, MapPin, Store, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NewCustomerKpis as KpiType } from "../types";

interface NewCustomerKpisProps {
    kpis: KpiType;
}

export const NewCustomerKpis: React.FC<NewCustomerKpisProps> = ({ kpis }) => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Total New Customers */}
            <Card className="relative overflow-hidden border border-border/70 bg-gradient-to-br from-card to-card/60 shadow-sm hover:shadow-md transition-all">
                <CardContent className="p-5 flex flex-col justify-between h-full space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            New Accounts
                        </span>
                        <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                            <UserPlus className="h-4 w-4" />
                        </div>
                    </div>
                    <div>
                        <div className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                            {kpis.totalNewCustomers.toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                            <TrendingUp className="h-3.5 w-3.5 text-blue-500" />
                            <span>Registered in selected period</span>
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Card 2: Active Accounts Ratio */}
            <Card className="relative overflow-hidden border border-border/70 bg-gradient-to-br from-card to-card/60 shadow-sm hover:shadow-md transition-all">
                <CardContent className="p-5 flex flex-col justify-between h-full space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Active Status
                        </span>
                        <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 className="h-4 w-4" />
                        </div>
                    </div>
                    <div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                                {kpis.activeCount.toLocaleString()}
                            </span>
                            <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-0 text-[11px] font-bold">
                                {kpis.activePercentage.toFixed(1)}% Active
                            </Badge>
                        </div>
                        {/* Visual Progress Bar */}
                        <div className="w-full bg-muted rounded-full h-1.5 mt-2 overflow-hidden">
                            <div
                                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                                style={{ width: `${Math.min(100, kpis.activePercentage)}%` }}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Card 3: Geographic Coverage */}
            <Card className="relative overflow-hidden border border-border/70 bg-gradient-to-br from-card to-card/60 shadow-sm hover:shadow-md transition-all">
                <CardContent className="p-5 flex flex-col justify-between h-full space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Top Province
                        </span>
                        <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            <MapPin className="h-4 w-4" />
                        </div>
                    </div>
                    <div>
                        <div className="text-xl sm:text-2xl font-bold tracking-tight text-foreground truncate" title={kpis.topProvince}>
                            {kpis.topProvince}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {kpis.topProvinceCount > 0 ? (
                                <span>
                                    <strong className="text-foreground">{kpis.topProvinceCount.toLocaleString()}</strong> stores ({kpis.totalCities} cities total)
                                </span>
                            ) : (
                                "No regional distribution yet"
                            )}
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Card 4: Store Category Leader */}
            <Card className="relative overflow-hidden border border-border/70 bg-gradient-to-br from-card to-card/60 shadow-sm hover:shadow-md transition-all">
                <CardContent className="p-5 flex flex-col justify-between h-full space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Top Store Type
                        </span>
                        <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                            <Store className="h-4 w-4" />
                        </div>
                    </div>
                    <div>
                        <div className="text-xl sm:text-2xl font-bold tracking-tight text-foreground truncate" title={kpis.topStoreType}>
                            {kpis.topStoreType}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {kpis.topStoreTypeCount > 0 ? (
                                <span>
                                    <strong className="text-foreground">{kpis.topStoreTypeCount.toLocaleString()}</strong> accounts registered
                                </span>
                            ) : (
                                "No type classification yet"
                            )}
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
