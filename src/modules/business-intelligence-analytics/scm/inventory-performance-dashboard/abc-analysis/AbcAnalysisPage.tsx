"use client";

import React, { useMemo, useState, useEffect } from "react";
import {
    Filter,
    Calendar,
    BarChart3,
    PieChart as PieChartIcon,
    Trophy,
    Package,
    ArrowUpRight,
    Loader2,
    AlertCircle
} from "lucide-react";

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/new-data-table";
import { ColumnDef } from "@tanstack/react-table";
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

import { useScmFilters } from "@/modules/business-intelligence-analytics/scm/providers/ScmFilterProvider";
import { fetchAbcAnalysisData } from "./services/abc-analysis";
import { AbcProduct } from "./types/abc-analysis.schema";
import { cn } from "@/lib/utils";
import { ScmAdvancedFilters } from "@/modules/business-intelligence-analytics/scm/components/filters/ScmAdvancedFilters";
import { isWithinInterval, startOfDay, endOfDay } from "date-fns";

const COLORS = ["#10b981", "#f59e0b", "#ef4444"];

export default function AbcAnalysisPage() {
    const {
        dateRange,
        selectedSupplier,
        selectedBranch,
    } = useScmFilters();

    const [data, setData] = useState<AbcProduct[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const result = await fetchAbcAnalysisData();
                setData(result);
            } catch (err: any) {
                console.error("Failed to fetch ABC Analysis data:", err);
                setError(err.message || "Failed to load data. Please check your connection.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const suppliers = useMemo(() => {
        const set = new Set(data.map((d) => d.supplierName));
        return Array.from(set).sort();
    }, [data]);

    const branches = useMemo(() => {
        const set = new Set(data.map((d) => d.branchName || "Unknown"));
        return Array.from(set).filter(b => b !== "Unknown").sort();
    }, [data]);

    const enrichedData = useMemo(() => {
        let filtered = data;

        // Filter by Date Range
        if (dateRange?.from && dateRange?.to) {
            const start = startOfDay(dateRange.from);
            const end = endOfDay(dateRange.to);
            filtered = filtered.filter((item) => {
                const itemDate = new Date(item.date);
                return isWithinInterval(itemDate, { start, end });
            });
        }

        // Filter by supplier
        if (selectedSupplier !== "all") {
            filtered = filtered.filter((item) => item.supplierName === selectedSupplier);
        }

        // Filter by branch
        if (selectedBranch !== "all") {
            filtered = filtered.filter((item) => item.branchName === selectedBranch);
        }

        // Sort by value descending
        const sorted = [...filtered].sort((a, b) => b.outValue - a.outValue);
        const totalValue = sorted.reduce((sum, item) => sum + item.outValue, 0);

        let cumulativeValue = 0;
        return sorted.map((item) => {
            cumulativeValue += item.outValue;
            const cumulativePct = totalValue > 0 ? (cumulativeValue / totalValue) * 100 : 0;

            let abcClass: "A" | "B" | "C" = "C";
            if (cumulativePct <= 70) abcClass = "A";
            else if (cumulativePct <= 90) abcClass = "B";

            return { ...item, abcClass, cumulativePct };
        });
    }, [data, selectedSupplier, selectedBranch, dateRange]);

    const stats = useMemo(() => {
        const totalItems = enrichedData.length;
        const totalValue = enrichedData.reduce((sum, item) => sum + item.outValue, 0);
        const totalVolume = enrichedData.reduce((sum, item) => sum + item.outQtyBase, 0);

        const categories = {
            A: enrichedData.filter(d => d.abcClass === "A"),
            B: enrichedData.filter(d => d.abcClass === "B"),
            C: enrichedData.filter(d => d.abcClass === "C"),
        };

        return {
            totalItems,
            totalValue,
            totalVolume,
            catA: { count: categories.A.length, value: categories.A.reduce((s, i) => s + i.outValue, 0) },
            catB: { count: categories.B.length, value: categories.B.reduce((s, i) => s + i.outValue, 0) },
            catC: { count: categories.C.length, value: categories.C.reduce((s, i) => s + i.outValue, 0) },
        };
    }, [enrichedData]);

    const chartData = useMemo(() => {
        if (stats.totalValue === 0) return [];
        return [
            { name: "Category A", value: stats.catA.value, count: stats.catA.count, fill: COLORS[0] },
            { name: "Category B", value: stats.catB.value, count: stats.catB.count, fill: COLORS[1] },
            { name: "Category C", value: stats.catC.value, count: stats.catC.count, fill: COLORS[2] },
        ];
    }, [stats]);

    const barChartData = useMemo(() => {
        return enrichedData.slice(0, 10).map(item => ({
            name: item.productName.substring(0, 15) + "...",
            value: item.outValue,
            fullName: item.productName
        }));
    }, [enrichedData]);

    const columns: ColumnDef<any>[] = [
        {
            accessorKey: "rankByValue",
            header: "Rank",
            cell: ({ row }) => (
                <span className="font-mono font-medium">#{row.original.rankByValue}</span>
            ),
        },
        {
            accessorKey: "abcClass",
            header: "Class",
            cell: ({ row }) => {
                const val = row.original.abcClass;
                return (
                    <Badge
                        variant="outline"
                        className={cn(
                            "font-bold",
                            val === "A" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                                val === "B" ? "bg-amber-50 text-amber-700 border-amber-200" :
                                    "bg-red-50 text-red-700 border-red-200"
                        )}
                    >
                        {val}
                    </Badge>
                );
            },
        },
        {
            accessorKey: "productName",
            header: "Product",
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="font-medium line-clamp-1">{row.original.productName}</span>
                    <span className="text-xs text-muted-foreground">{row.original.productId}</span>
                </div>
            ),
        },
        {
            accessorKey: "supplierName",
            header: "Supplier",
            cell: ({ row }) => (
                <span className="text-sm truncate max-w-[150px] inline-block">
                    {row.original.supplierName}
                </span>
            ),
        },
        {
            accessorKey: "outQtyBase",
            header: "Volume",
            cell: ({ row }) => row.original.outQtyBase.toLocaleString(),
        },
        {
            accessorKey: "outValue",
            header: "Value",
            cell: ({ row }) => (
                <span className="font-semibold text-primary">
                    ₱{row.original.outValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
            ),
        },
        {
            accessorKey: "cumulativePct",
            header: "Cum. %",
            cell: ({ row }) => (
                <span className="text-xs text-muted-foreground italic">
                    {row.original.cumulativePct.toFixed(1)}%
                </span>
            ),
        },
    ];

    if (isLoading) {
        return (
            <div className="flex h-[60vh] items-center justify-center flex-col gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary opacity-50" />
                <p className="text-muted-foreground animate-pulse text-sm">Analyzing inventory data...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex h-[60vh] items-center justify-center p-4">
                <Card className="max-w-md w-full border-destructive/20 bg-destructive/5">
                    <CardContent className="pt-6 flex flex-col items-center text-center gap-4">
                        <AlertCircle className="h-12 w-12 text-destructive" />
                        <div>
                            <h3 className="text-lg font-bold text-destructive">Data Fetch Error</h3>
                            <p className="text-sm text-muted-foreground mt-1">{error}</p>
                        </div>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
                        >
                            Retry Connection
                        </button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-4 md:p-8 pt-6 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">ABC Analysis</h2>
                    <CardDescription className="mt-1">
                        Product classification based on inventory output value and volume
                    </CardDescription>
                </div>

                <div className="bg-card border rounded-xl p-2 shadow-sm">
                    <ScmAdvancedFilters
                        suppliers={suppliers}
                        branches={branches}
                        showBranch={true}
                    />
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-primary/5 border-primary/10 shadow-sm relative overflow-hidden group">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Inventory Value</CardTitle>
                        <Trophy className="h-4 w-4 text-primary opacity-70 group-hover:scale-125 transition-transform" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-primary">
                            ₱{stats.totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Across {stats.totalItems} distinct products
                        </p>
                    </CardContent>
                    <div className="absolute top-0 right-0 w-24 h-24 -mr-12 -mt-12 bg-primary/10 rounded-full blur-2xl" />
                </Card>

                <Card className="shadow-sm border-none bg-emerald-50/50 dark:bg-emerald-950/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Class A Items</CardTitle>
                        <ArrowUpRight className="h-4 w-4 text-emerald-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{stats.catA.count}</div>
                        <p className="text-xs text-emerald-600/80 mt-1">
                            {((stats.catA.count / stats.totalItems) * 100 || 0).toFixed(1)}% of items, 70% of value
                        </p>
                    </CardContent>
                </Card>

                <Card className="shadow-sm border-none bg-amber-50/50 dark:bg-amber-950/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-amber-700 dark:text-amber-400">Class B Items</CardTitle>
                        <Package className="h-4 w-4 text-amber-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-amber-700 dark:text-amber-400">{stats.catB.count}</div>
                        <p className="text-xs text-amber-600/80 mt-1">
                            {((stats.catB.count / stats.totalItems) * 100 || 0).toFixed(1)}% of items, 20% of value
                        </p>
                    </CardContent>
                </Card>

                <Card className="shadow-sm border-none bg-red-50/50 dark:bg-red-950/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-red-700 dark:text-red-400">Class C Items</CardTitle>
                        <BarChart3 className="h-4 w-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-700 dark:text-red-400">{stats.catC.count}</div>
                        <p className="text-xs text-red-600/80 mt-1">
                            {((stats.catC.count / stats.totalItems) * 100 || 0).toFixed(1)}% of items, 10% of value
                        </p>
                    </CardContent>
                </Card>
            </div>

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
                                                const data = payload[0].payload;
                                                return (
                                                    <div className="bg-background border rounded-lg p-2 shadow-lg text-xs leading-relaxed">
                                                        <p className="font-bold mb-1">{data.name}</p>
                                                        <p className="text-primary">Value: ₱{data.value.toLocaleString()}</p>
                                                        <p className="text-muted-foreground">Items: {data.count}</p>
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
                                        onMouseOver={(data, index) => { }}
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

            <Card className="shadow-sm border-sidebar-border/40 overflow-hidden">
                <CardHeader className="bg-muted/30 pb-4">
                    <CardTitle>Detailed Classification Table</CardTitle>
                    <CardDescription>
                        Comprehensive list of items with categorization and rank metrics
                    </CardDescription>
                </CardHeader>
                <div className="px-6 pb-6 pt-2">
                    <DataTable
                        columns={columns}
                        data={enrichedData}
                        searchKey="productName"
                        isLoading={isLoading}
                    />
                </div>
            </Card>
        </div>
    );
}
