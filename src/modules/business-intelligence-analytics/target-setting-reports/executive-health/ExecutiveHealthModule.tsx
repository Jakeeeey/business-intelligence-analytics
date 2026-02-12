"use client";

import React, { useEffect, useState, useMemo, Suspense } from "react";
import { useRouter } from "next/navigation"; 
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList 
} from 'recharts';
import { 
    TrendingDown, TrendingUp, Loader2, Calendar, LayoutDashboard, ChevronRight, AlertCircle
} from "lucide-react";
import { format, startOfMonth, endOfMonth, parseISO } from "date-fns";

// Shadcn UI Components
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

import { fetchExecutiveHealthData } from "./providers/fetchProvider";
import { VSalesPerformanceDataDto } from "./types";

const MONTHLY_TARGETS: Record<string, number> = {
    "Food Division": 5000000,
    "Non-Food Division": 3000000,
    "Grains Division": 2000000,
    "General Merchandise": 1000000,
    "DEFAULT": 1000000
};

function ExecutiveHealthContent() {
    const router = useRouter();
    
    // Default to current month for a "Live" dashboard feel
    const today = new Date();
    const currentMonthStr = format(today, "yyyy-MM");

    const [fromMonth, setFromMonth] = useState(currentMonthStr);
    const [toMonth, setToMonth] = useState(currentMonthStr);
    const [rawData, setRawData] = useState<VSalesPerformanceDataDto[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const start = format(startOfMonth(parseISO(fromMonth + "-01")), "yyyy-MM-dd");
                const end = format(endOfMonth(parseISO(toMonth + "-01")), "yyyy-MM-dd");
                if (start > end) return;
                const data = await fetchExecutiveHealthData(start, end);
                setRawData(data);
            } catch (err) { 
                console.error("Executive Fetch Error:", err); 
            } finally { 
                setLoading(false); 
            }
        };
        load();
    }, [fromMonth, toMonth]);

    const { companyHealth, divisionHealth } = useMemo(() => {
        const start = parseISO(fromMonth + "-01");
        const end = parseISO(toMonth + "-01");
        const monthCount = Math.max(1, (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1);

        let totalActual = 0;
        let totalTarget = 0;
        const divisionMap = new Map<string, any>();

        rawData.forEach(item => {
            const divName = item.divisionName || "Unknown";
            totalActual += item.netAmount || 0;
            const current = divisionMap.get(divName) || { name: divName, sales: 0 };
            current.sales += item.netAmount || 0;
            divisionMap.set(divName, current);
        });

        const processedDivisions = Array.from(divisionMap.values()).map(div => {
            const baseTarget = MONTHLY_TARGETS[div.name] || MONTHLY_TARGETS["DEFAULT"];
            const scaledTarget = baseTarget * monthCount;
            totalTarget += scaledTarget;
            return {
                ...div,
                target: scaledTarget,
                achievement: (div.sales / scaledTarget) * 100
            };
        }).sort((a, b) => b.sales - a.sales);

        return {
            companyHealth: {
                actual: totalActual,
                target: totalTarget,
                achievement: totalTarget > 0 ? (totalActual / totalTarget) * 100 : 0,
                gap: totalActual - totalTarget
            },
            divisionHealth: processedDivisions
        };
    }, [rawData, fromMonth, toMonth]);

    const formatPHP = (val: number) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 0 }).format(val);
    
    const formatShort = (val: number) => {
        const absVal = Math.abs(val);
        const sign = val < 0 ? "-" : "";
        if (absVal >= 1000000) return `${sign}₱${(absVal / 1000000).toFixed(1)}M`;
        if (absVal >= 1000) return `${sign}₱${(absVal / 1000).toFixed(0)}k`;
        return `${sign}₱${absVal.toFixed(0)}`;
    };

    const handleDivisionClick = (divisionName: string) => {
        const params = new URLSearchParams({ from: fromMonth, to: toMonth, division: divisionName });
        router.push(`/bia/target-setting-reports/managerial-supplier?${params.toString()}`);
    };

    return (
        <div className="space-y-6 p-2 min-h-screen bg-background text-foreground">
            {/* --- HEADER --- */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 text-muted-foreground mb-1 text-sm">
                        <span>BIA</span> <ChevronRight className="h-3 w-3" /> 
                        <span>Reports</span> <ChevronRight className="h-3 w-3" /> 
                        <span className="text-foreground font-medium">Executive Health</span>
                    </div>
                    <h2 className="text-3xl font-bold tracking-tight">Executive Performance</h2>
                </div>

                <div className="flex flex-wrap items-center gap-3 bg-card border rounded-xl p-2 shadow-sm">
                    <div className="flex items-center gap-2 px-3 border-r border-border">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <Input type="month" value={fromMonth} onChange={e => setFromMonth(e.target.value)} className="w-[140px] border-none bg-transparent h-8 text-sm font-medium focus-visible:ring-0 cursor-pointer" />
                        <span className="text-muted-foreground font-bold">-</span>
                        <Input type="month" value={toMonth} onChange={e => setToMonth(e.target.value)} className="w-[140px] border-none bg-transparent h-8 text-sm font-medium focus-visible:ring-0 cursor-pointer" />
                    </div>
                    <div className="px-2">
                        <Badge variant="outline" className="font-mono text-xs uppercase tracking-tighter">
                            VOS Analytics
                        </Badge>
                    </div>
                </div>
            </div>

            {/* --- METRIC STRIP --- */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="border-primary/20 bg-primary/5">
                    <CardContent className="p-4 flex flex-col gap-1">
                        <p className="text-xs font-semibold text-primary uppercase tracking-wider">Company Actual</p>
                        <p className="text-2xl font-bold">{formatPHP(companyHealth.actual)}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex flex-col gap-1">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Company Target</p>
                        <p className="text-2xl font-bold">{formatPHP(companyHealth.target)}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex flex-col gap-1">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Achievement</p>
                        <div className="flex items-center gap-3">
                            <p className="text-2xl font-bold">{companyHealth.achievement.toFixed(1)}%</p>
                            <Badge className={companyHealth.achievement >= 100 ? "bg-emerald-500" : "bg-amber-500"}>
                                {companyHealth.achievement >= 100 ? "On Track" : "Lagging"}
                            </Badge>
                        </div>
                    </CardContent>
                </Card>
                <Card className={companyHealth.gap > 0 ? "border-emerald-500/50 bg-emerald-500/5" : "border-destructive/50 bg-destructive/5"}>
                    <CardContent className="p-4 flex flex-col gap-1">
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Variance</p>
                        <p className={`text-2xl font-bold ${companyHealth.gap > 0 ? "text-emerald-500" : "text-destructive"}`}>
                            {formatPHP(companyHealth.gap)}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* --- MAIN VISUALIZATION --- */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <Card className="lg:col-span-8 shadow-md border-muted/40">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Division Sales Volume</CardTitle>
                            <CardDescription>Click a bar to see specific supplier performance</CardDescription>
                        </div>
                        <LayoutDashboard className="h-5 w-5 text-muted-foreground/30" />
                    </CardHeader>
                    <CardContent className="h-[500px] pt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart 
                                data={divisionHealth} 
                                layout="vertical" 
                                margin={{ left: 50, right: 80 }}
                                onClick={(data) => {
                                    if (data && data.activePayload) handleDivisionClick(data.activePayload[0].payload.name);
                                }}
                                style={{ cursor: 'pointer' }}
                            >
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" strokeOpacity={0.5} />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" width={140} fontSize={11} tick={{ fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)', color: 'hsl(var(--popover-foreground))' }}
                                    formatter={(v: any) => formatPHP(v)} 
                                />
                                <Bar dataKey="sales" name="Actual" barSize={28} radius={[0, 6, 6, 0]} minPointSize={2}>
                                    {divisionHealth.map((e, i) => (
                                        <Cell key={i} fill={e.sales >= e.target ? '#10b981' : '#f59e0b'} fillOpacity={0.9} />
                                    ))}
                                    <LabelList dataKey="sales" position="right" formatter={(v: number) => formatShort(v)} style={{ fontSize: '12px', fontWeight: 'bold', fill: 'hsl(var(--foreground))' }} offset={10} />
                                </Bar>
                                <Bar dataKey="target" name="Target" barSize={8} fill="hsl(var(--muted))" radius={[0, 6, 6, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="lg:col-span-4 shadow-md border-muted/40">
                    <CardHeader>
                        <CardTitle>Division Target Status</CardTitle>
                        <CardDescription>Performance scorecard</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="max-h-[500px] overflow-y-auto px-6 pb-6 space-y-4">
                            {divisionHealth.map((div, i) => (
                                <div 
                                    key={i} 
                                    className="group p-4 rounded-xl border border-transparent hover:border-border hover:bg-muted/50 transition-all cursor-pointer"
                                    onClick={() => handleDivisionClick(div.name)}
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="w-[70%]">
                                            <div className="flex items-center gap-2">
                                                <p className="font-semibold text-sm leading-tight">{div.name}</p>
                                                {div.sales < div.target && <AlertCircle className="h-3 w-3 text-destructive" />}
                                            </div>
                                        </div>
                                        <Badge variant={div.achievement >= 100 ? "default" : "outline"} className="text-[10px]">
                                            {div.achievement.toFixed(0)}%
                                        </Badge>
                                    </div>
                                    <Progress value={div.achievement} className="h-1.5" />
                                    <div className="flex justify-between mt-2 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                                        <span>Act: {formatShort(div.sales)}</span>
                                        <span>Tgt: {formatShort(div.target)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

export default function ExecutiveHealthModule() {
    return (
        <Suspense fallback={<div className="flex h-screen w-full items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}>
            <ExecutiveHealthContent />
        </Suspense>
    );
}