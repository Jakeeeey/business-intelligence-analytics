"use client";

import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function AbcAnalysisSkeleton() {
    return (
        <div className="space-y-6 p-4 md:p-8 pt-6 animate-pulse">
            {/* Header Skeleton */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-64" />
                </div>
                <Skeleton className="h-10 w-full md:w-64 rounded-xl" />
            </div>

            {/* Summary Cards Skeleton */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Card key={i} className="border-none shadow-sm bg-muted/20">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <Skeleton className="h-4 w-24" />
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <Skeleton className="h-8 w-32" />
                            <Skeleton className="h-3 w-24" />
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Charts Skeleton */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="lg:col-span-3 shadow-sm border-sidebar-border/40">
                    <CardHeader className="space-y-2">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-4 w-48" />
                    </CardHeader>
                    <CardContent className="h-[300px] flex items-center justify-center">
                        <Skeleton className="h-48 w-48 rounded-full" />
                    </CardContent>
                </Card>

                <Card className="lg:col-span-4 shadow-sm border-sidebar-border/40">
                    <CardHeader className="space-y-2">
                        <Skeleton className="h-5 w-40" />
                        <Skeleton className="h-4 w-56" />
                    </CardHeader>
                    <CardContent className="h-[300px] flex items-end gap-2 pb-8 px-6">
                        {[70, 45, 90, 65, 30, 80, 55, 40, 75, 50].map((h, i) => (
                            <Skeleton
                                key={i}
                                className="w-full"
                                style={{ height: `${h}%` }}
                            />
                        ))}
                    </CardContent>
                </Card>
            </div>

            {/* Table Skeleton */}
            <Card className="shadow-sm border-sidebar-border/40 overflow-hidden">
                <CardHeader className="bg-muted/30 pb-4 space-y-2">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-64" />
                </CardHeader>
                <div className="px-6 pb-6 pt-4 space-y-3">
                    <Skeleton className="h-10 w-full" />
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                    ))}
                </div>
            </Card>
        </div>
    );
}
