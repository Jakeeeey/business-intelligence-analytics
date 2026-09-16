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
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CustomerSummary } from "../types";

interface CustomerChartsProps {
    customerSummaries: CustomerSummary[];
}

const COLORS = [
    "#3b82f6", // blue-500
    "#10b981", // emerald-500
    "#8b5cf6", // violet-500
    "#f59e0b", // amber-500
    "#ec4899", // pink-500
    "#06b6d4", // cyan-500
    "#f97316", // orange-500
    "#6366f1", // indigo-500
    "#14b8a6", // teal-500
    "#84cc16", // lime-500
];

export const CustomerCharts: React.FC<CustomerChartsProps> = ({ customerSummaries }) => {
    // Top 10 Customers by totalSales
    const top10Customers = useMemo(() => {
        return [...customerSummaries]
            .sort((a, b) => b.totalSales - a.totalSales)
            .slice(0, 10)
            .map((c) => ({
                name: c.customerName.length > 18 ? c.customerName.slice(0, 18) + "..." : c.customerName,
                fullName: c.customerName,
                sales: c.totalSales,
                transactions: c.transactionCount,
                share: c.percentageShare,
            }));
    }, [customerSummaries]);

    // Store Type Breakdown
    const storeTypeData = useMemo(() => {
        const map = new Map<string, number>();
        let total = 0;
        customerSummaries.forEach((c) => {
            const type = c.storeType || "Other";
            map.set(type, (map.get(type) || 0) + c.totalSales);
            total += c.totalSales;
        });

        return Array.from(map.entries())
            .map(([name, value]) => ({
                name,
                value,
                share: total > 0 ? (value / total) * 100 : 0,
            }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 6);
    }, [customerSummaries]);

    const formatCurrency = (val: number) => {
        if (val >= 1_000_000) return `₱${(val / 1_000_000).toFixed(2)}M`;
        if (val >= 1_000) return `₱${(val / 1_000).toFixed(1)}k`;
        return `₱${val.toFixed(0)}`;
    };

    if (customerSummaries.length === 0) return null;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Top 10 Customers Chart */}
            <Card className="lg:col-span-2 border-border bg-card shadow-sm">
                <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold text-foreground">
                        Top 10 Customers by Net Sales
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground">
                        Highest revenue contributing accounts
                    </CardDescription>
                </CardHeader>
                <CardContent className="pt-2">
                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={top10Customers}
                                margin={{ top: 10, right: 15, left: 10, bottom: 25 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" className="stroke-border opacity-50" />
                                <XAxis
                                    dataKey="name"
                                    tick={{ fontSize: 11 }}
                                    interval={0}
                                    angle={-25}
                                    textAnchor="end"
                                    className="text-muted-foreground"
                                />
                                <YAxis
                                    tickFormatter={formatCurrency}
                                    tick={{ fontSize: 11 }}
                                    className="text-muted-foreground"
                                />
                                <Tooltip
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            const d = payload[0].payload;
                                            return (
                                                <div className="rounded-lg border border-border bg-popover p-2.5 shadow-md text-popover-foreground text-xs space-y-1">
                                                    <p className="font-semibold">{d.fullName}</p>
                                                    <p className="text-muted-foreground">
                                                        Sales:{" "}
                                                        <span className="font-medium text-foreground">
                                                            ₱{d.sales.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                                                        </span>
                                                    </p>
                                                    <p className="text-muted-foreground">
                                                        Transactions:{" "}
                                                        <span className="font-medium text-foreground">
                                                            {d.transactions}
                                                        </span>
                                                    </p>
                                                    <p className="text-muted-foreground">
                                                        Share:{" "}
                                                        <span className="font-medium text-foreground">
                                                            {d.share.toFixed(2)}%
                                                        </span>
                                                    </p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Bar dataKey="sales" radius={[4, 4, 0, 0]}>
                                    {top10Customers.map((_, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={COLORS[index % COLORS.length]}
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            {/* Store Type Distribution */}
            <Card className="border-border bg-card shadow-sm">
                <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold text-foreground">
                        Sales by Store Type
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground">
                        Distribution across customer categories
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
                                            fill={COLORS[index % COLORS.length]}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            const d = payload[0].payload;
                                            return (
                                                <div className="rounded-lg border border-border bg-popover p-2.5 shadow-md text-popover-foreground text-xs space-y-1">
                                                    <p className="font-semibold">{d.name}</p>
                                                    <p className="text-muted-foreground">
                                                        Sales:{" "}
                                                        <span className="font-medium text-foreground">
                                                            ₱{d.value.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                                                        </span>
                                                    </p>
                                                    <p className="text-muted-foreground">
                                                        Share:{" "}
                                                        <span className="font-medium text-foreground">
                                                            {d.share.toFixed(1)}%
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
                                        <span className="text-xs text-muted-foreground">{value}</span>
                                    )}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
