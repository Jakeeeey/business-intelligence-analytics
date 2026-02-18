"use client";

import React, { useEffect, useState, useMemo, Suspense } from "react";
import { useRouter } from "next/navigation"; 
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList, Scatter, ComposedChart 
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

import { fetchExecutiveHealthData, fetchCompanyTargets, fetchDivisionTargets } from "./providers/fetchProvider";
import { VSalesPerformanceDataDto, TargetSettingExecutive, TargetSettingDivision } from "./types";
import { getDivisions } from "../../target-setting/executive/providers/fetchProvider";

function ExecutiveHealthContent() {
    const router = useRouter();
    
    // Default to current month for a "Live" dashboard feel
    const today = new Date();
    const currentMonthStr = format(today, "yyyy-MM");

    const [fromMonth, setFromMonth] = useState(currentMonthStr);
    const [toMonth, setToMonth] = useState(currentMonthStr);
    const [rawData, setRawData] = useState<VSalesPerformanceDataDto[]>([]);
    const [targets, setTargets] = useState<TargetSettingExecutive[]>([]);
    const [allocations, setAllocations] = useState<TargetSettingDivision[]>([]);
    const [divisions, setDivisions] = useState<{division_id: number, division_name: string}[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const start = format(startOfMonth(parseISO(fromMonth + "-01")), "yyyy-MM-dd");
                const end = format(endOfMonth(parseISO(toMonth + "-01")), "yyyy-MM-dd");
                if (start > end) return;

                const [data, companyTargets, metadataDivs] = await Promise.all([
                    fetchExecutiveHealthData(start, end),
                    fetchCompanyTargets(start, end),
                    getDivisions()
                ]);

                setRawData(data);
                setTargets(companyTargets);
                setDivisions(metadataDivs);

                if (companyTargets.length > 0) {
                    const divTargets = await fetchDivisionTargets(companyTargets.map(t => t.id));
                    setAllocations(divTargets);
                } else {
                    setAllocations([]);
                }
            } catch (err) { 
                console.error("Executive Fetch Error:", err); 
            } finally { 
                setLoading(false); 
            }
        };
        load();
    }, [fromMonth, toMonth]);

    const { companyHealth, divisionHealth } = useMemo(() => {
        let totalActual = 0;
        let totalTarget = targets.reduce((sum, t) => sum + (t.target_amount || 0), 0);
        
        const divisionMap = new Map<string, any>();

        rawData.forEach(item => {
            const divName = item.divisionName || "Unknown";
            totalActual += item.netAmount || 0;
            const current = divisionMap.get(divName) || { name: divName, sales: 0 };
            current.sales += item.netAmount || 0;
            divisionMap.set(divName, current);
        });

        // Add divisions that have targets but no sales yet
        divisions.forEach(d => {
            if (!divisionMap.has(d.division_name)) {
                divisionMap.set(d.division_name, { name: d.division_name, sales: 0 });
            }
        });

        const processedDivisions = Array.from(divisionMap.values()).map(div => {
            const divId = divisions.find(d => d.division_name === div.name)?.division_id;
            const divTarget = allocations
                .filter(a => a.division_id === divId)
                .reduce((sum, a) => sum + (a.target_amount || 0), 0);

            return {
                ...div,
                target: divTarget,
                achievement: divTarget > 0 ? (div.sales / divTarget) * 100 : 0
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
    }, [rawData, targets, allocations, divisions]);


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
                            <ComposedChart 
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
                                <YAxis dataKey="name" type="category" width={140} fontSize={11} tick={{ fill: 'hsl(var(--foreground))' }} axisLine={false} tickLine={false} />
                                <Tooltip 
                                    contentStyle={{ 
                                        backgroundColor: 'hsl(var(--popover))', 
                                        border: '1px solid hsl(var(--border))', 
                                        borderRadius: 'var(--radius)', 
                                        color: 'hsl(var(--popover-foreground))',
                                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                                    }}
                                    itemStyle={{ color: 'hsl(var(--popover-foreground))', fontWeight: 'bold' }}
                                    labelStyle={{ color: 'hsl(var(--muted-foreground))', marginBottom: '4px', fontWeight: 'bold' }}
                                    formatter={(v: any, name: string) => [formatPHP(v), name]} 
                                />
                                <Bar dataKey="sales" name="Actual" barSize={22} radius={[0, 6, 6, 0]} minPointSize={2}>
                                    {divisionHealth.map((e, i) => (
                                        <Cell key={i} fill={e.sales >= e.target ? '#10b981' : '#f59e0b'} fillOpacity={0.9} />
                                    ))}
                                    <LabelList dataKey="sales" position="right" formatter={(v: number) => formatShort(v)} style={{ fontSize: '11px', fontWeight: 'bold', fill: 'hsl(var(--foreground))' }} offset={8} />
                                </Bar>
                                <Bar 
                                    dataKey="target" 
                                    name="Target" 
                                    barSize={14} 
                                    fill="#38bdf8" 
                                    stroke="#0ea5e9"
                                    strokeWidth={1}
                                    radius={[0, 4, 4, 0]} 
                                />
                                <Scatter 
                                    dataKey="target" 
                                    tooltipType="none"
                                    shape={(props: any) => {
                                        const { cx, cy, payload } = props;
                                        if (!payload || !payload.target) return <g />;
                                        return (
                                            <line 
                                                x1={cx} y1={cy - 18} 
                                                x2={cx} y2={cy + 18} 
                                                stroke="hsl(var(--foreground))" 
                                                strokeWidth={2}
                                                strokeDasharray="3 3"
                                            />
                                        );
                                    }} 
                                />
                            </ComposedChart>
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
                                    <div className="relative">
                                        <Progress value={Math.min(div.achievement, 100)} className="h-1.5" />
                                        {div.target > 0 && (
                                            <div 
                                                className="absolute top-0 bottom-0 w-0.5 bg-foreground border-x border-background z-10"
                                                style={{ left: '100%' }}
                                                title="Target"
                                            />
                                        )}
                                    </div>
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