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
import {
    CollectionTimelineItem,
    PaymentMethodItem,
    SalesmanComparisonItem,
} from "../types";

interface CollectionVsSalesChartsProps {
    timeline: CollectionTimelineItem[];
    salesmen: SalesmanComparisonItem[];
    paymentMethods: PaymentMethodItem[];
}

const PM_COLORS = ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ec4899", "#06b6d4"];

function formatCompact(val: number): string {
    if (val >= 1_000_000) return `₱${(val / 1_000_000).toFixed(1)}M`;
    if (val >= 1_000) return `₱${(val / 1_000).toFixed(0)}k`;
    return `₱${val}`;
}

export const CollectionVsSalesCharts: React.FC<CollectionVsSalesChartsProps> = ({
    timeline,
    salesmen,
    paymentMethods,
}) => {
    // Top 8 Salesmen by Sales / Collections
    const topSalesmen = useMemo(() => {
        return salesmen.slice(0, 8).map((s) => ({
            name: s.salesmanName.length > 14 ? s.salesmanName.slice(0, 14) + "..." : s.salesmanName,
            fullName: s.salesmanName,
            sales: s.sales,
            collections: s.collections,
            efficiency: s.efficiency,
        }));
    }, [salesmen]);

    return (
        <div className="space-y-4">
            {/* Chart 1: Sales vs Collection Timeline Trend */}
            {timeline.length > 1 && (
                <Card className="border-border/70 bg-card/80 shadow-xs backdrop-blur-sm">
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-base font-bold text-foreground">
                                    Sales vs Collection Timeline
                                </CardTitle>
                                <CardDescription className="text-xs text-muted-foreground">
                                    Chronological tracking of invoiced revenue vs real collections
                                </CardDescription>
                            </div>
                            <div className="flex items-center gap-4 text-xs">
                                <div className="flex items-center gap-1.5">
                                    <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                                    <span className="text-muted-foreground">Invoiced Sales</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                                    <span className="text-muted-foreground">Collections</span>
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-2">
                        <div className="h-72 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={timeline} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                                        </linearGradient>
                                        <linearGradient id="colGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                                    <XAxis dataKey="label" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                                    <YAxis
                                        tick={{ fontSize: 11 }}
                                        tickFormatter={formatCompact}
                                        className="text-muted-foreground"
                                    />
                                    <Tooltip
                                        content={({ active, payload }) => {
                                            if (active && payload && payload.length) {
                                                const d = payload[0].payload as CollectionTimelineItem;
                                                return (
                                                    <div className="rounded-xl border border-border bg-popover p-3 shadow-lg text-popover-foreground text-xs space-y-1.5 font-mono">
                                                        <p className="font-bold text-foreground font-sans">{d.date}</p>
                                                        <p className="text-blue-500">
                                                            Sales: ₱{d.sales.toLocaleString()}
                                                        </p>
                                                        <p className="text-emerald-500">
                                                            Collections: ₱{d.collections.toLocaleString()}
                                                        </p>
                                                        <p className="text-purple-500">
                                                            Efficiency: {d.sales > 0 ? ((d.collections / d.sales) * 100).toFixed(1) : 100}%
                                                        </p>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="sales"
                                        name="Sales"
                                        stroke="#3b82f6"
                                        strokeWidth={2}
                                        fillOpacity={1}
                                        fill="url(#salesGrad)"
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="collections"
                                        name="Collections"
                                        stroke="#10b981"
                                        strokeWidth={2}
                                        fillOpacity={1}
                                        fill="url(#colGrad)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Row 2: Salesman Comparison & Payment Method Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Salesman Bar Comparison */}
                <Card className="lg:col-span-2 border-border/70 bg-card/80 shadow-xs backdrop-blur-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base font-bold text-foreground">
                            Sales Rep Performance Comparison
                        </CardTitle>
                        <CardDescription className="text-xs text-muted-foreground">
                            Side-by-side comparison of invoiced sales vs collections by representative
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-2">
                        <div className="h-72 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={topSalesmen}
                                    margin={{ top: 10, right: 15, left: 10, bottom: 25 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                                    <XAxis
                                        dataKey="name"
                                        tick={{ fontSize: 11 }}
                                        interval={0}
                                        angle={-20}
                                        textAnchor="end"
                                        className="text-muted-foreground"
                                    />
                                    <YAxis
                                        tick={{ fontSize: 11 }}
                                        tickFormatter={formatCompact}
                                        className="text-muted-foreground"
                                    />
                                    <Tooltip
                                        content={({ active, payload }) => {
                                            if (active && payload && payload.length) {
                                                const d = payload[0].payload;
                                                return (
                                                    <div className="rounded-xl border border-border bg-popover p-2.5 shadow-lg text-popover-foreground text-xs space-y-1">
                                                        <p className="font-bold text-foreground">{d.fullName}</p>
                                                        <p className="text-blue-500 font-mono">
                                                            Sales: ₱{d.sales.toLocaleString()}
                                                        </p>
                                                        <p className="text-emerald-500 font-mono">
                                                            Collections: ₱{d.collections.toLocaleString()}
                                                        </p>
                                                        <p className="text-purple-500 font-mono">
                                                            Efficiency: {d.efficiency.toFixed(1)}%
                                                        </p>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                    <Bar dataKey="sales" name="Sales" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="collections" name="Collections" fill="#10b981" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Payment Methods Donut */}
                <Card className="border-border/70 bg-card/80 shadow-xs backdrop-blur-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base font-bold text-foreground">
                            Payment Method Mix
                        </CardTitle>
                        <CardDescription className="text-xs text-muted-foreground">
                            Distribution of collected payments by mode
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-2">
                        <div className="h-72 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={paymentMethods}
                                        dataKey="amount"
                                        nameKey="name"
                                        cx="50%"
                                        cy="45%"
                                        outerRadius={80}
                                        innerRadius={45}
                                        paddingAngle={3}
                                    >
                                        {paymentMethods.map((_, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={PM_COLORS[index % PM_COLORS.length]}
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        content={({ active, payload }) => {
                                            if (active && payload && payload.length) {
                                                const d = payload[0].payload as PaymentMethodItem;
                                                return (
                                                    <div className="rounded-xl border border-border bg-popover p-2.5 shadow-lg text-popover-foreground text-xs space-y-1">
                                                        <p className="font-bold text-foreground">{d.name}</p>
                                                        <p className="text-muted-foreground font-mono">
                                                            Amount: ₱{d.amount.toLocaleString()} ({d.share.toFixed(1)}%)
                                                        </p>
                                                        <p className="text-muted-foreground">
                                                            Transactions: {d.count}
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
        </div>
    );
};
