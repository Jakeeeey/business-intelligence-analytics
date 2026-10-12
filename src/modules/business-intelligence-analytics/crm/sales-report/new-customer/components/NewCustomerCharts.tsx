"use client";

import React, { useMemo } from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    PieChart,
    Pie,
    Legend,
    AreaChart,
    Area,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, Award } from "lucide-react";
import { NewCustomerItem, RegistrationTrendItem, SalesmanOnboardingItem } from "../types";

interface NewCustomerChartsProps {
    items: NewCustomerItem[];
    trends: RegistrationTrendItem[];
    leaderboard?: SalesmanOnboardingItem[];
}

const PALETTE = [
    "#3b82f6", // blue
    "#10b981", // emerald
    "#8b5cf6", // violet
    "#f59e0b", // amber
    "#ec4899", // pink
    "#06b6d4", // cyan
    "#f97316", // orange
    "#6366f1", // indigo
    "#14b8a6", // teal
];

export const NewCustomerCharts: React.FC<NewCustomerChartsProps> = ({
    items,
    trends,
    leaderboard = [],
}) => {
    // Province Distribution (Top 10)
    const provinceData = useMemo(() => {
        const map = new Map<string, number>();
        items.forEach((i) => {
            const p = i.province || "Other Areas";
            map.set(p, (map.get(p) || 0) + 1);
        });

        return Array.from(map.entries())
            .map(([name, count]) => ({
                name: name.length > 16 ? name.slice(0, 16) + "..." : name,
                fullName: name,
                count,
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);
    }, [items]);

    // Store Type Distribution
    const storeTypeData = useMemo(() => {
        const map = new Map<string, number>();
        items.forEach((i) => {
            const st = i.storeType || "General";
            map.set(st, (map.get(st) || 0) + 1);
        });

        const total = items.length;
        return Array.from(map.entries())
            .map(([name, value]) => ({
                name,
                value,
                share: total > 0 ? (value / total) * 100 : 0,
            }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 6);
    }, [items]);

    if (items.length === 0) return null;

    return (
        <div className="space-y-4">
            {/* Row 1: Registration Timeline Trend */}
            {trends.length > 1 && (
                <Card className="border-border/70 bg-card/80 shadow-sm backdrop-blur-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base font-bold text-foreground">
                            Registration Growth Timeline
                        </CardTitle>
                        <CardDescription className="text-xs text-muted-foreground">
                            Daily / chronological onboarding trend of new customer accounts
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-2">
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart
                                    data={trends}
                                    margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                                >
                                    <defs>
                                        <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                                        </linearGradient>
                                        <linearGradient id="activeGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                                    <XAxis
                                        dataKey="label"
                                        tick={{ fontSize: 11 }}
                                        className="text-muted-foreground"
                                    />
                                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} className="text-muted-foreground" />
                                    <Tooltip
                                        content={({ active, payload }) => {
                                            if (active && payload && payload.length) {
                                                const d = payload[0].payload as RegistrationTrendItem;
                                                return (
                                                    <div className="rounded-xl border border-border bg-popover p-3 shadow-lg text-popover-foreground text-xs space-y-1.5">
                                                        <p className="font-bold text-foreground">{d.date}</p>
                                                        <p className="text-blue-500 font-semibold">
                                                            Registered: {d.count} accounts
                                                        </p>
                                                        <p className="text-emerald-500 font-semibold">
                                                            Active: {d.activeCount} accounts
                                                        </p>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="count"
                                        name="Total"
                                        stroke="#3b82f6"
                                        strokeWidth={2}
                                        fillOpacity={1}
                                        fill="url(#totalGrad)"
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="activeCount"
                                        name="Active"
                                        stroke="#10b981"
                                        strokeWidth={2}
                                        fillOpacity={1}
                                        fill="url(#activeGrad)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Row 2: Province Ranking & Store Type Donut */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Province Distribution */}
                <Card className="lg:col-span-2 border-border/70 bg-card/80 shadow-sm backdrop-blur-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base font-bold text-foreground">
                            Top Provinces by Registrations
                        </CardTitle>
                        <CardDescription className="text-xs text-muted-foreground">
                            Regional concentration of newly acquired outlets
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-2">
                        <div className="h-72 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={provinceData}
                                    margin={{ top: 10, right: 15, left: 0, bottom: 25 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                                    <XAxis
                                        dataKey="name"
                                        tick={{ fontSize: 11 }}
                                        interval={0}
                                        angle={-25}
                                        textAnchor="end"
                                        className="text-muted-foreground"
                                    />
                                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} className="text-muted-foreground" />
                                    <Tooltip
                                        content={({ active, payload }) => {
                                            if (active && payload && payload.length) {
                                                const d = payload[0].payload;
                                                return (
                                                    <div className="rounded-xl border border-border bg-popover p-2.5 shadow-lg text-popover-foreground text-xs space-y-1">
                                                        <p className="font-bold text-foreground">{d.fullName}</p>
                                                        <p className="text-muted-foreground">
                                                            New Accounts:{" "}
                                                            <span className="font-bold text-foreground">
                                                                {d.count.toLocaleString()}
                                                            </span>
                                                        </p>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                                        {provinceData.map((_, index) => (
                                             <Cell
                                                key={`cell-${index}`}
                                                fill={PALETTE[index % PALETTE.length]}
                                            />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Store Type Donut */}
                <Card className="border-border/70 bg-card/80 shadow-sm backdrop-blur-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base font-bold text-foreground">
                            Store Category Mix
                        </CardTitle>
                        <CardDescription className="text-xs text-muted-foreground">
                            Classification of new store profiles
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-2">
                        <div className="h-72 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={storeTypeData}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%"
                                        cy="45%"
                                        outerRadius={80}
                                        innerRadius={45}
                                        paddingAngle={3}
                                    >
                                        {storeTypeData.map((_, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={PALETTE[index % PALETTE.length]}
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        content={({ active, payload }) => {
                                            if (active && payload && payload.length) {
                                                const d = payload[0].payload;
                                                return (
                                                    <div className="rounded-xl border border-border bg-popover p-2.5 shadow-lg text-popover-foreground text-xs space-y-1">
                                                        <p className="font-bold text-foreground">{d.name}</p>
                                                        <p className="text-muted-foreground">
                                                            Count:{" "}
                                                            <span className="font-bold text-foreground">
                                                                {d.value.toLocaleString()} ({d.share.toFixed(1)}%)
                                                            </span>
                                                        </p>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                    <Legend
                                        verticalAlign="bottom"
                                        height={36}
                                        formatter={(value) => (
                                            <span className="text-xs text-muted-foreground font-medium">{value}</span>
                                        )}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Row 3: Sales Rep / Encoder Leaderboard */}
            {leaderboard.length > 0 && (
                <Card className="border-border/70 bg-card/80 shadow-sm backdrop-blur-sm">
                    <CardHeader className="pb-3">
                        <div className="flex items-center gap-2">
                            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                <Trophy className="h-5 w-5" />
                            </div>
                            <div>
                                <CardTitle className="text-base font-bold text-foreground">
                                    Top Onboarding Sales Representatives
                                </CardTitle>
                                <CardDescription className="text-xs text-muted-foreground">
                                    Personnel driving the highest customer acquisition volume
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="space-y-3">
                            {leaderboard.map((leader, index) => {
                                const rank = index + 1;
                                const isTop3 = rank <= 3;
                                const rankBadgeClass =
                                    rank === 1
                                        ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30"
                                        : rank === 2
                                        ? "bg-slate-400/20 text-slate-600 dark:text-slate-300 border-slate-400/30"
                                        : rank === 3
                                        ? "bg-amber-700/20 text-amber-700 dark:text-amber-500 border-amber-700/30"
                                        : "bg-muted text-muted-foreground border-border/50";

                                return (
                                    <div
                                        key={leader.salesmanName}
                                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl border border-border/50 bg-muted/10 hover:bg-muted/30 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div
                                                className={`h-7 w-7 rounded-lg flex items-center justify-center font-bold text-xs border shrink-0 ${rankBadgeClass}`}
                                            >
                                                {isTop3 ? (
                                                    <Award className="h-3.5 w-3.5" />
                                                ) : (
                                                    <span>{rank}</span>
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-sm text-foreground">
                                                    {leader.salesmanName}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {leader.activeCount} active accounts of {leader.totalOnboarded} total
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 sm:w-64">
                                            <div className="flex-1 space-y-1">
                                                <div className="flex justify-between text-[11px] text-muted-foreground font-medium">
                                                    <span>Share</span>
                                                    <span>{leader.percentage.toFixed(1)}%</span>
                                                </div>
                                                <Progress value={leader.percentage} className="h-2" />
                                            </div>
                                            <Badge
                                                variant="secondary"
                                                className="font-mono text-xs font-bold shrink-0 min-w-[50px] justify-center"
                                            >
                                                {leader.totalOnboarded}
                                            </Badge>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};
