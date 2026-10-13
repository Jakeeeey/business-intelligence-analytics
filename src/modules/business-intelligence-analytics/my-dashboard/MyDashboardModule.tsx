"use client";

import React, { useEffect, useState } from "react";
import {
    LayoutDashboard,
    Info,
    ShieldCheck,
    BarChart3,
    Activity,
    TrendingUp,
    RefreshCw,
} from "lucide-react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MyDashboardProps, DashboardCardItem, CardsApiResponse } from "./types";

function formatCardTitle(key: string): string {
    return key
        .replace(/[_-]+/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getCardIcon(key: string) {
    const lower = key.toLowerCase();
    if (lower.includes("sales") || lower.includes("revenue")) {
        return <TrendingUp className="h-4 w-4" />;
    }
    if (lower.includes("activity") || lower.includes("lead")) {
        return <Activity className="h-4 w-4" />;
    }
    return <BarChart3 className="h-4 w-4" />;
}

export default function MyDashboardModule({ className = "" }: MyDashboardProps) {
    const [cards, setCards] = useState<DashboardCardItem[]>([]);
    const [hasWildcardAccess, setHasWildcardAccess] = useState(false);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchCards = async (isManualRefresh = false) => {
        if (isManualRefresh) setRefreshing(true);
        try {
            const res = await fetch("/api/bia/my-dashboard/cards", {
                cache: "no-store",
            });
            if (res.ok) {
                const data: CardsApiResponse = await res.json();
                setCards(data.cards || []);
                setHasWildcardAccess(Boolean(data.hasWildcardAccess));
            } else {
                setCards([]);
            }
        } catch (err) {
            console.error("[MyDashboardModule] Fetch error:", err);
            setCards([]);
        } finally {
            setLoading(false);
            if (isManualRefresh) setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchCards();
    }, []);

    return (
        <div className={`flex flex-col gap-6 p-4 sm:p-6 min-h-[calc(100vh-8rem)] ${className}`}>
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary ring-1 ring-primary/20">
                            <LayoutDashboard className="h-5 w-5" />
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">
                            My Dashboard
                        </h1>
                        {hasWildcardAccess && (
                            <Badge
                                variant="outline"
                                className="ml-2 gap-1.5 border-emerald-500/30 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-950/40 dark:text-emerald-400 font-medium"
                            >
                                <ShieldCheck className="h-3.5 w-3.5" />
                                <span>Full Access (Card #1)</span>
                            </Badge>
                        )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Monitor your personal business intelligence metrics and reports.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchCards(true)}
                        disabled={loading || refreshing}
                        className="gap-2 border-border bg-background hover:bg-accent text-foreground hover:text-accent-foreground"
                    >
                        <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                        <span>Refresh</span>
                    </Button>
                </div>
            </div>

            {/* Content Section */}
            {loading ? (
                /* Loading Skeletons */
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                    {[1, 2, 3].map((i) => (
                        <Card key={i} className="border-border bg-card shadow-sm animate-pulse">
                            <CardHeader className="space-y-2 pb-4">
                                <div className="h-4 w-1/3 bg-muted rounded" />
                                <div className="h-3 w-2/3 bg-muted rounded" />
                            </CardHeader>
                            <CardContent>
                                <div className="h-32 w-full bg-muted/60 rounded-md" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : cards.length === 0 ? (
                /* Blank / Administrator Notice State */
                <Card className="flex-1 border-dashed border-2 border-border/80 bg-card/50 backdrop-blur-sm shadow-none">
                    <CardHeader className="text-center pb-2">
                        <CardTitle className="text-lg font-semibold text-foreground">
                            Personal Dashboard
                        </CardTitle>
                        <CardDescription className="text-muted-foreground">
                            Widgets in this dashboard are managed and provisioned by system administration.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center min-h-[320px] text-center p-6">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted/60 text-muted-foreground border border-border/50 mb-4">
                            <LayoutDashboard className="h-8 w-8 stroke-[1.5]" />
                        </div>
                        <p className="text-base font-medium text-foreground mb-1">
                            No widgets assigned yet
                        </p>
                        <p className="text-sm text-muted-foreground max-w-md mb-6">
                            You currently do not have any widgets assigned to your personal dashboard.
                        </p>

                        <div className="flex items-center gap-2 px-4 py-3 rounded-lg border border-border bg-muted/40 text-muted-foreground text-xs sm:text-sm max-w-md">
                            <Info className="h-4 w-4 shrink-0 text-primary" />
                            <span>
                                Please contact your system administrator to have widgets configured or assigned to your account.
                            </span>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                /* Assigned Cards Grid */
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                    {cards.map((card) => (
                        <Card
                            key={card.id}
                            className="flex flex-col border-border bg-card shadow-sm hover:shadow-md transition-shadow"
                        >
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary dark:bg-primary/20">
                                            {getCardIcon(card.key)}
                                        </div>
                                        <CardTitle className="text-base font-semibold truncate text-foreground">
                                            {formatCardTitle(card.key)}
                                        </CardTitle>
                                    </div>
                                    <Badge
                                        variant="secondary"
                                        className="shrink-0 text-[11px] font-mono uppercase bg-muted text-muted-foreground"
                                    >
                                        #{card.id}
                                    </Badge>
                                </div>
                                <CardDescription className="text-xs text-muted-foreground line-clamp-2 mt-1">
                                    {card.description || "Active dashboard card metric."}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1 flex flex-col justify-between pt-0">
                                <div className="rounded-lg border border-border/60 bg-muted/20 dark:bg-muted/10 p-4 min-h-[120px] flex flex-col items-center justify-center text-center">
                                    <BarChart3 className="h-8 w-8 text-muted-foreground/40 mb-2" />
                                    <span className="text-xs font-medium text-muted-foreground">
                                        {formatCardTitle(card.key)} Widget
                                    </span>
                                    <span className="text-[11px] text-muted-foreground/70 mt-0.5">
                                        Metric data container
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
