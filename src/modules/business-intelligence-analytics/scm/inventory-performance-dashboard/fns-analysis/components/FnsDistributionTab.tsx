// src/modules/.../fns-analysis/components/FnsDistributionTab.tsx
"use client";

import * as React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import type { FnsSummary } from "../types";

/** Fixed color map — each category always gets its designated color */
const FNS_COLORS: Record<string, string> = {
    Fast: "#22c55e",   // green-500
    Normal: "#3b82f6", // blue-500
    Slow: "#ef4444",   // red-500
};

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
                                {chartData.map((entry) => (
                                    <Cell
                                        key={entry.name}
                                        fill={FNS_COLORS[entry.name] || "#94a3b8"}
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

            {/* ── KPI Cards ───────────────────────────────────────
                 Uses border-l for category color accent.
                 Card bg stays as default bg-card (theme-aware).
                 Badges use inline style to guarantee contrast in
                 both light and dark mode without fighting shadcn. */}
            <div className="flex flex-col gap-4 justify-center">
                {/* Fast Movers — Green */}
                <Card className="border-l-4 border-l-green-500">
                    <CardContent className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold text-green-700 dark:text-green-400">
                                Fast Movers
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                High-frequency items picked &gt; {fastThreshold} times
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Store in easily accessible locations for fast picking
                            </p>
                        </div>
                        <span
                            className="inline-flex items-center rounded-full px-3 py-1 text-xs font-bold"
                            style={{ backgroundColor: "#16a34a", color: "#ffffff" }}
                        >
                            {fastCount} SKUs
                        </span>
                    </CardContent>
                </Card>

                {/* Normal Movers — Blue */}
                <Card className="border-l-4 border-l-blue-500">
                    <CardContent className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold text-blue-700 dark:text-blue-400">
                                Normal Movers
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                Moderate-frequency items picked {normalThreshold}-{fastThreshold} times
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Standard storage with balanced accessibility
                            </p>
                        </div>
                        <span
                            className="inline-flex items-center rounded-full px-3 py-1 text-xs font-bold"
                            style={{ backgroundColor: "#2563eb", color: "#ffffff" }}
                        >
                            {normalCount} SKUs
                        </span>
                    </CardContent>
                </Card>

                {/* Slow Movers — Red */}
                <Card className="border-l-4 border-l-red-500">
                    <CardContent className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold text-red-700 dark:text-red-400">
                                Slow Movers
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                Low-frequency items picked &lt; {normalThreshold} times
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Consider remote storage or inventory reduction
                            </p>
                        </div>
                        <span
                            className="inline-flex items-center rounded-full px-3 py-1 text-xs font-bold"
                            style={{ backgroundColor: "#dc2626", color: "#ffffff" }}
                        >
                            {slowCount} SKUs
                        </span>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
