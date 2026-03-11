"use client";

import {
    Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell, CartesianGrid
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChartDataDto } from "../types";

interface Props {
    data: ChartDataDto[];
    onBranchSelect: (name: string) => void;
    selectedBranch: string | null;
}

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { payload: { label: string }; value: number }[] }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        const value = payload[0].value;
        const isLoss = value < 0;

        return (
            <div className="rounded-lg border bg-background p-3 shadow-xl ring-1 ring-black/5 backdrop-blur-md bg-background/90 z-50">
                <p className="font-semibold text-sm mb-1">{data.label}</p>
                <div className="flex items-center gap-2">
                    <div className={`h-2.5 w-2.5 rounded-full ${isLoss ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                    <p className="text-sm font-medium text-muted-foreground">
                        {isLoss ? "Variance Loss:" : "Surplus:"}
                        <span className={`ml-2 font-mono font-bold ${isLoss ? 'text-rose-500' : 'text-emerald-600'}`}>
                            ₱{Math.abs(value).toLocaleString()}
                        </span>
                    </p>
                </div>
            </div>
        );
    }
    return null;
};

export function BranchRiskChart({ data, onBranchSelect, selectedBranch }: Props) {
    const formatYAxis = (val: number) => {
        const absVal = Math.abs(Number(val) || 0);
        if (absVal >= 1000000) return `₱${(absVal / 1000000).toFixed(1)}M`;
        if (absVal >= 1000) return `₱${(absVal / 1000).toFixed(0)}K`;
        return `₱${absVal}`;
    };

    return (
        <Card className="col-span-4 shadow-sm border-border/50 bg-background/50 backdrop-blur flex flex-col h-full">
            <CardHeader className="pb-4 shrink-0">
                <CardTitle className="text-base font-semibold text-foreground">
                    Branch Financial Risk
                </CardTitle>
                <CardDescription className="text-xs">
                    Variance cost impact across all locations
                </CardDescription>
            </CardHeader>
            <CardContent className="pl-0 pr-4 flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={data}
                        // INCREASED BOTTOM MARGIN TO 80 TO FIT LONG NAMES
                        margin={{ top: 10, right: 10, left: 10, bottom: 80 }}
                        onClick={(state) => {
                            if (state && state.activeLabel) {
                                onBranchSelect(state.activeLabel);
                            }
                        }}
                    >
                        <defs>
                            <linearGradient id="lossGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#f43f5e" stopOpacity={1} />
                                <stop offset="100%" stopColor="#9f1239" stopOpacity={0.8} />
                            </linearGradient>
                            <linearGradient id="surplusGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                                <stop offset="100%" stopColor="#047857" stopOpacity={0.8} />
                            </linearGradient>
                        </defs>

                        <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                            stroke="hsl(var(--muted-foreground))"
                            strokeOpacity={0.15}
                        />

                        <XAxis
                            dataKey="label"
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                            tick={{ fill: 'hsl(var(--muted-foreground))' }}
                            // ADDED THESE TO ANGLE THE TEXT
                            angle={-45}
                            textAnchor="end"
                            height={60}
                            interval={0} // Forces every single label to render (won't skip branches)
                        />
                        <YAxis
                            fontSize={11}
                            tickLine={false}
                            axisLine={false}
                            tick={{ fill: 'hsl(var(--muted-foreground))' }}
                            tickFormatter={formatYAxis}
                            width={65}
                            tickMargin={4}
                        />

                        <Tooltip
                            cursor={{ fill: 'hsl(var(--muted))', opacity: 0.3 }}
                            content={<CustomTooltip />}
                        />

                        <Bar
                            dataKey="value"
                            radius={[6, 6, 0, 0]}
                            maxBarSize={60}
                            style={{ cursor: 'pointer' }}
                        >
                            {data.map((entry, index) => {
                                const isSelected = !selectedBranch || selectedBranch === entry.label;
                                return (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={entry.value < 0 ? "url(#lossGradient)" : "url(#surplusGradient)"}
                                        fillOpacity={isSelected ? 1 : 0.25}
                                        className="transition-all duration-300"
                                    />
                                );
                            })}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}