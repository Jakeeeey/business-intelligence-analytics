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
import { Package, Award } from "lucide-react";
import {
    BranchDistributionItem,
    PurchaseTimelineItem,
    SupplierBreakdownItem,
    ProductBreakdownItem,
} from "../types";

interface PurchaseReportChartsProps {
    timeline: PurchaseTimelineItem[];
    suppliers: SupplierBreakdownItem[];
    branches: BranchDistributionItem[];
    products?: ProductBreakdownItem[];
}

const PALETTE = ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ec4899", "#06b6d4", "#f97316", "#6366f1"];

function formatCompact(val: number): string {
    if (val >= 1_000_000) return `₱${(val / 1_000_000).toFixed(1)}M`;
    if (val >= 1_000) return `₱${(val / 1_000).toFixed(0)}k`;
    return `₱${val}`;
}

function formatCurrency(val: number): string {
    return new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
        maximumFractionDigits: 0,
    }).format(val);
}

export const PurchaseReportCharts: React.FC<PurchaseReportChartsProps> = ({
    timeline,
    suppliers,
    branches,
    products = [],
}) => {
    // Top 8 Suppliers by Ordered Amount
    const topSuppliers = useMemo(() => {
        return suppliers.slice(0, 8).map((s) => ({
            name: s.supplierName.length > 16 ? s.supplierName.slice(0, 16) + "..." : s.supplierName,
            fullName: s.supplierName,
            ordered: s.orderedAmount,
            received: s.receivedAmount,
            fulfillment: s.fulfillmentRate,
        }));
    }, [suppliers]);

    const topProducts = useMemo(() => {
        return products.slice(0, 5);
    }, [products]);

    return (
        <div className="space-y-4">
            {/* Row 1: Purchase Order & Receiving Growth Timeline */}
            {timeline.length > 1 && (
                <Card className="border-border/70 bg-card/80 shadow-xs backdrop-blur-sm">
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-base font-bold text-foreground">
                                    Purchase Order vs Receiving Timeline
                                </CardTitle>
                                <CardDescription className="text-xs text-muted-foreground">
                                    Chronological tracking of ordered PO amounts vs deliveries received
                                </CardDescription>
                            </div>
                            <div className="flex items-center gap-4 text-xs">
                                <div className="flex items-center gap-1.5">
                                    <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                                    <span className="text-muted-foreground">PO Amount</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                                    <span className="text-muted-foreground">Received Amount</span>
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-2">
                        <div className="h-72 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={timeline} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="poGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                                        </linearGradient>
                                        <linearGradient id="recGrad" x1="0" y1="0" x2="0" y2="1">
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
                                                const d = payload[0].payload as PurchaseTimelineItem;
                                                return (
                                                    <div className="rounded-xl border border-border bg-popover p-3 shadow-lg text-popover-foreground text-xs space-y-1.5 font-mono">
                                                        <p className="font-bold text-foreground font-sans">{d.date}</p>
                                                        <p className="text-blue-500">
                                                            Ordered: ₱{d.ordered.toLocaleString()}
                                                        </p>
                                                        <p className="text-emerald-500">
                                                            Received: ₱{d.received.toLocaleString()}
                                                        </p>
                                                        <p className="text-purple-500">
                                                            Fulfillment: {d.ordered > 0 ? ((d.received / d.ordered) * 100).toFixed(1) : 0}%
                                                        </p>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="ordered"
                                        name="Ordered"
                                        stroke="#3b82f6"
                                        strokeWidth={2}
                                        fillOpacity={1}
                                        fill="url(#poGrad)"
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="received"
                                        name="Received"
                                        stroke="#10b981"
                                        strokeWidth={2}
                                        fillOpacity={1}
                                        fill="url(#recGrad)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Row 2: Top Suppliers Bar & Branch Distribution Donut */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Top Suppliers Bar Chart */}
                <Card className="lg:col-span-2 border-border/70 bg-card/80 shadow-xs backdrop-blur-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base font-bold text-foreground">
                            Top Suppliers by Purchase Volume
                        </CardTitle>
                        <CardDescription className="text-xs text-muted-foreground">
                            Comparison of ordered amount vs actual received from top vendors
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-2">
                        <div className="h-72 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={topSuppliers}
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
                                                            Ordered: ₱{d.ordered.toLocaleString()}
                                                        </p>
                                                        <p className="text-emerald-500 font-mono">
                                                            Received: ₱{d.received.toLocaleString()}
                                                        </p>
                                                        <p className="text-purple-500 font-mono">
                                                            Fulfillment: {d.fulfillment.toFixed(1)}%
                                                        </p>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                    <Bar dataKey="ordered" name="Ordered" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="received" name="Received" fill="#10b981" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Branch Distribution Donut */}
                <Card className="border-border/70 bg-card/80 shadow-xs backdrop-blur-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base font-bold text-foreground">
                            Branch Delivery Mix
                        </CardTitle>
                        <CardDescription className="text-xs text-muted-foreground">
                            Purchase distribution across receiving branches
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-2">
                        <div className="h-72 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={branches.slice(0, 6)}
                                        dataKey="amount"
                                        nameKey="branchName"
                                        cx="50%"
                                        cy="45%"
                                        outerRadius={80}
                                        innerRadius={45}
                                        paddingAngle={3}
                                    >
                                        {branches.slice(0, 6).map((_, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={PALETTE[index % PALETTE.length]}
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        content={({ active, payload }) => {
                                            if (active && payload && payload.length) {
                                                const d = payload[0].payload as BranchDistributionItem;
                                                return (
                                                    <div className="rounded-xl border border-border bg-popover p-2.5 shadow-lg text-popover-foreground text-xs space-y-1">
                                                        <p className="font-bold text-foreground">{d.branchName}</p>
                                                        <p className="text-muted-foreground font-mono">
                                                            Amount: ₱{d.amount.toLocaleString()} ({d.share.toFixed(1)}%)
                                                        </p>
                                                        <p className="text-muted-foreground">
                                                            POs: {d.poCount}
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

            {/* Row 3: Top Purchased Products Ranking */}
            {topProducts.length > 0 && (
                <Card className="border-border/70 bg-card/80 shadow-xs backdrop-blur-sm">
                    <CardHeader className="pb-3">
                        <div className="flex items-center gap-2">
                            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                                <Package className="h-5 w-5" />
                            </div>
                            <div>
                                <CardTitle className="text-base font-bold text-foreground">
                                    Highest Value Products Received
                                </CardTitle>
                                <CardDescription className="text-xs text-muted-foreground">
                                    Top items by total delivery value across all purchase orders
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="space-y-2.5">
                            {topProducts.map((prod, index) => {
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
                                        key={prod.productId}
                                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl border border-border/50 bg-muted/10 hover:bg-muted/30 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div
                                                className={`h-7 w-7 rounded-lg flex items-center justify-center font-bold text-xs border shrink-0 ${rankBadgeClass}`}
                                            >
                                                {isTop3 ? <Award className="h-3.5 w-3.5" /> : rank}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-sm text-foreground">
                                                    {prod.productName}
                                                </p>
                                                <p className="text-xs text-muted-foreground font-mono">
                                                    {prod.productCode && prod.productCode !== "—" ? prod.productCode : `ID: ${prod.productId}`}{" "}
                                                    • {prod.totalQuantity.toLocaleString()} units • {prod.deliveriesCount} deliveries
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <div className="text-right">
                                                <p className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400">
                                                    {formatCurrency(prod.totalAmount)}
                                                </p>
                                                <p className="text-[11px] text-muted-foreground font-mono">
                                                    Avg: {formatCurrency(prod.averageUnitPrice)}/unit
                                                </p>
                                            </div>
                                            <Badge variant="secondary" className="font-mono text-xs hidden sm:inline-flex">
                                                {prod.deliveriesCount} POs
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
