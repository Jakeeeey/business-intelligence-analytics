"use client";

import React, { useEffect, useState } from "react";
import { FileCheck2, Clock, AlertCircle, Banknote } from "lucide-react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DashboardCardItem } from "../types";

interface SalesOrderMetricData {
    count: number;
    totalAmount?: number;
    status?: string;
}

interface SalesOrderForApprovalCardProps {
    card: DashboardCardItem;
}

export default function SalesOrderForApprovalCard({ card }: SalesOrderForApprovalCardProps) {
    const [data, setData] = useState<SalesOrderMetricData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchMetric = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/bia/my-dashboard/metrics/sales-order-for-approval", {
                cache: "no-store",
            });
            if (!res.ok) {
                throw new Error("Failed to load metric");
            }
            const json = await res.json();
            setData(json);
        } catch (err) {
            console.error("[SalesOrderForApprovalCard] Fetch error:", err);
            setError("Unable to load data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMetric();
    }, []);

    const formatCurrency = (val?: number) => {
        if (typeof val !== "number" || Number.isNaN(val)) return "₱0.00";
        return new Intl.NumberFormat("en-PH", {
            style: "currency",
            currency: "PHP",
            minimumFractionDigits: 2,
        }).format(val);
    };

    return (
        <Card className="flex flex-col border-border bg-card shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden relative group">
            {/* Top Accent Bar */}
            <div className="h-1 w-full bg-gradient-to-r from-amber-500 to-amber-400" />

            <CardHeader className="p-4 pb-2">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 ring-1 ring-amber-500/20">
                            <FileCheck2 className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                            <CardTitle className="text-sm font-semibold truncate text-foreground">
                                Sales Orders
                            </CardTitle>
                            <span className="text-[11px] text-muted-foreground block truncate">
                                {card.description || "Pending managerial review"}
                            </span>
                        </div>
                    </div>

                    <Badge
                        variant="outline"
                        className="shrink-0 whitespace-nowrap gap-1 border-amber-500/30 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-300 text-[10px] px-2 py-0.5 font-medium"
                    >
                        <Clock className="h-2.5 w-2.5" />
                        <span>For Approval</span>
                    </Badge>
                </div>
            </CardHeader>

            <CardContent className="p-4 pt-1 space-y-3 flex-1 flex flex-col justify-between">
                {loading ? (
                    <div className="space-y-2 py-2 animate-pulse">
                        <div className="h-10 w-24 bg-muted rounded" />
                        <div className="h-4 w-36 bg-muted/60 rounded" />
                        <div className="h-9 w-full bg-muted/50 rounded-lg mt-2" />
                    </div>
                ) : error ? (
                    <div className="flex items-center gap-2 p-2.5 rounded-md border border-destructive/20 bg-destructive/5 text-destructive text-xs my-1">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>{error}</span>
                    </div>
                ) : (
                    <div className="space-y-2.5 pt-1">
                        {/* Stacked Hero Metric */}
                        <div>
                            <span className="text-4xl font-extrabold tracking-tight text-foreground font-mono block leading-none">
                                {data?.count ?? 0}
                            </span>
                            <span className="text-xs font-medium text-muted-foreground block mt-1.5">
                                Orders Awaiting Approval
                            </span>
                        </div>

                        {/* Structured Pending Value Stat Box */}
                        {typeof data?.totalAmount === "number" && (
                            <div className="flex items-center justify-between gap-2 rounded-lg border border-border/70 bg-muted/40 dark:bg-muted/20 px-3 py-2 text-xs">
                                <div className="flex items-center gap-1.5 text-muted-foreground shrink-0 whitespace-nowrap">
                                    <Banknote className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                                    <span>Total Value</span>
                                </div>
                                <span className="font-bold text-foreground font-mono text-sm tracking-tight truncate text-right">
                                    {formatCurrency(data.totalAmount)}
                                </span>
                            </div>
                        )}
                    </div>
                )}

                {/* Footer Metadata */}
                <div className="pt-2.5 mt-auto border-t border-border/50 flex items-center justify-between text-[10px] text-muted-foreground">
                    <span className="font-mono truncate max-w-[150px] text-muted-foreground/80">
                        {card.key}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium shrink-0">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Live Status
                    </span>
                </div>
            </CardContent>
        </Card>
    );
}
