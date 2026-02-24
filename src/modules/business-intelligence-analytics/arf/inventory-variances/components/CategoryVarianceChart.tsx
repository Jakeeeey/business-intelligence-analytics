"use client";

import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const COLORS = ["#ef4444", "#f97316", "#f59e0b", "#84cc16", "#06b6d4", "#6366f1"];

export function CategoryVarianceChart({ data }: { data: { name: string; value: number }[] }) {
    return (
        <Card className="h-full flex flex-col shadow-sm">
            <CardHeader className="pb-0">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Loss Breakdown by Category
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 pb-2">
                {data.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-xs text-muted-foreground italic min-h-[200px]">
                        No loss data to display
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%" minHeight={220}>
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={55}
                                outerRadius={80}
                                paddingAngle={2}
                                dataKey="value"
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                formatter={(value: number) => [`₱${value.toLocaleString()}`, "Loss Amount"]}
                                contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
                            />
                            <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                        </PieChart>
                    </ResponsiveContainer>
                )}
            </CardContent>
        </Card>
    );
}