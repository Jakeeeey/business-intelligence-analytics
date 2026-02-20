"use client";

import React, { useMemo } from "react";
import { PieChart as PieChartIcon, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
    Legend,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid
} from "recharts";

const COLORS = ["#10b981", "#f59e0b", "#ef4444"];

interface AbcChartsProps {
    stats: {
        totalValue: number;
        catA: { value: number; count: number };
        catB: { value: number; count: number };
        catC: { value: number; count: number };
    };
    data: any[];
}

export function AbcCharts({ stats, data }: AbcChartsProps) {
    const chartData = useMemo(() => {
        if (stats.totalValue === 0) return [];
        return [
            { name: "Category A", value: stats.catA.value, count: stats.catA.count, fill: COLORS[0] },
            { name: "Category B", value: stats.catB.value, count: stats.catB.count, fill: COLORS[1] },
            { name: "Category C", value: stats.catC.value, count: stats.catC.count, fill: COLORS[2] },
        ];
    }, [stats]);

    const barChartData = useMemo(() => {
        return data.slice(0, 10).map(item => ({
            name: item.productName.substring(0, 15) + "...",
            value: item.outValue,
            fullName: item.productName
        }));
    }, [data]);

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="lg:col-span-3 shadow-sm border-sidebar-border/40">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <PieChartIcon className="h-4 w-4 text-primary" />
                        Value Distribution
                    </CardTitle>
                    <CardDescription>ABC Category breakdown by total value</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                    {chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={chartData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                    animationBegin={0}
                                    animationDuration={1500}
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            const itemData = payload[0].payload;
                                            return (
                                                <div className="bg-background border rounded-lg p-2 shadow-lg text-xs leading-relaxed">
                                                    <p className="font-bold mb-1">{itemData.name}</p>
                                                    <p className="text-primary">Value: ₱{itemData.value.toLocaleString()}</p>
                                                    <p className="text-muted-foreground">Items: {itemData.count}</p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-muted-foreground italic text-sm">
                            No data available for chart
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card className="lg:col-span-4 shadow-sm border-sidebar-border/40">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-primary" />
                        Top 10 High-Value Products
                    </CardTitle>
                    <CardDescription>Highest contributors to total inventory output value</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                    {barChartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={barChartData} margin={{ top: 10, right: 10, left: 20, bottom: 40 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                                <XAxis
                                    dataKey="name"
                                    angle={-45}
                                    textAnchor="end"
                                    interval={0}
                                    fontSize={10}
                                    stroke="#888888"
                                />
                                <YAxis
                                    fontSize={10}
                                    stroke="#888888"
                                    tickFormatter={(val) => `₱${val / 1000}k`}
                                />
                                <Tooltip
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            return (
                                                <div className="bg-background border rounded-lg p-2 shadow-lg text-xs">
                                                    <p className="font-bold mb-1 text-primary">{payload[0].payload.fullName}</p>
                                                    <p>Value: <span className="font-bold">₱{payload[0].value?.toLocaleString()}</span></p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Bar
                                    dataKey="value"
                                    fill="hsl(var(--primary))"
                                    radius={[4, 4, 0, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-muted-foreground italic text-sm">
                            No data available for chart
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
