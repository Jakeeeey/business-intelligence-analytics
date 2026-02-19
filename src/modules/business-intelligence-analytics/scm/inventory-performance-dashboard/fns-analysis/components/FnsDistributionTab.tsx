// src/modules/.../fns-analysis/components/FnsDistributionTab.tsx
"use client";

import * as React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { FnsSummary } from "../types";

/**
 * Semantic color tokens from shadcn's CSS variable system.
 * Using hsl() references that map to the project's theme.
 */
const PIE_COLORS = [
    "hsl(var(--chart-2))", // green-ish for Fast
    "hsl(var(--chart-1))", // blue-ish for Normal
    "hsl(var(--chart-5))", // red-ish for Slow
];

interface FnsDistributionTabProps {
    summary: FnsSummary;
}

/**
 * Distribution tab: pie chart showing F/N/S breakdown
 * alongside three KPI summary cards (Fast, Normal, Slow movers).
 */
export function FnsDistributionTab({ summary }: FnsDistributionTabProps) {
    const { fastCount, normalCount, slowCount, totalCount, fastThreshold, normalThreshold } = summary;

    const chartData = [
        { name: "Fast", value: fastCount, label: `Fast (${fastCount})` },
        { name: "Normal", value: normalCount, label: `Normal (${normalCount})` },
        { name: "Slow", value: slowCount, label: `Slow (${slowCount})` },
    ].filter((d) => d.value > 0);

    const pct = (v: number) => (totalCount > 0 ? ((v / totalCount) * 100).toFixed(0) : "0");

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* ── Pie Chart ────────────────────────────────────── */}
            <div className="flex items-center justify-center min-h-[320px]">
                {totalCount === 0 ? (
                    <p className="text-muted-foreground text-sm">No data available</p>
                ) : (
                    <ResponsiveContainer width="100%" height={320}>
                        <PieChart>
                            <Pie
                                data={chartData}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                outerRadius={120}
                                innerRadius={0}
                                label={({ name, value }) =>
                                    `${name} (${value}): ${pct(value)}%`
                                }
                                labelLine
                            >
                                {chartData.map((entry, idx) => (
                                    <Cell
                                        key={entry.name}
                                        fill={PIE_COLORS[idx % PIE_COLORS.length]}
                                        strokeWidth={2}
                                    />
                                ))}
                            </Pie>
                            <Tooltip
                                formatter={(value: number, name: string) => [
                                    `${value} SKUs (${pct(value)}%)`,
                                    name,
                                ]}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                )}
            </div>

            {/* ── KPI Cards ────────────────────────────────────── */}
            <div className="flex flex-col gap-4 justify-center">
                {/* Fast Movers */}
                <Card>
                    <CardContent className="flex items-center justify-between py-4 px-5">
                        <div>
                            <h3 className="text-lg font-semibold text-primary">
                                Fast Movers
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                High-frequency items picked &gt; {fastThreshold} times
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Store in easily accessible locations for fast picking
                            </p>
                        </div>
                        <Badge variant="default">
                            {fastCount} SKUs
                        </Badge>
                    </CardContent>
                </Card>

                {/* Normal Movers */}
                <Card>
                    <CardContent className="flex items-center justify-between py-4 px-5">
                        <div>
                            <h3 className="text-lg font-semibold text-primary">
                                Normal Movers
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                Moderate-frequency items picked {normalThreshold}-{fastThreshold} times
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Standard storage with balanced accessibility
                            </p>
                        </div>
                        <Badge variant="secondary">
                            {normalCount} SKUs
                        </Badge>
                    </CardContent>
                </Card>

                {/* Slow Movers */}
                <Card>
                    <CardContent className="flex items-center justify-between py-4 px-5">
                        <div>
                            <h3 className="text-lg font-semibold text-primary">
                                Slow Movers
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                Low-frequency items picked &lt; {normalThreshold} times
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Consider remote storage or inventory reduction
                            </p>
                        </div>
                        <Badge variant="outline">
                            {slowCount} SKUs
                        </Badge>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
