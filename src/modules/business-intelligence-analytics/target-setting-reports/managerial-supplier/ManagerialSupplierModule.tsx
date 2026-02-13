"use client";

import React, { useEffect, useState, useMemo, Suspense } from "react";
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList 
} from 'recharts';
import { 
    Filter, TrendingDown, TrendingUp, Loader2, Calendar, ChevronRight, User2, ArrowLeft
} from "lucide-react";
import { format, startOfMonth, endOfMonth, parseISO } from "date-fns";
import { useSearchParams } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

import { fetchManagerialData } from "./providers/fetchProvider";
import { VSalesPerformanceDataDto } from "../executive-health/types"; 

const SUPPLIER_TARGETS: Record<string, Record<string, number>> = {
    "Dry Goods": {
        "SKINTEC": 500000, 
        "DEFAULT": 200000 
    }
};

function ManagerialSupplierContent() {
    const searchParams = useSearchParams();
    const currentYear = new Date().getFullYear();

    const [fromMonth, setFromMonth] = useState(searchParams.get("from") || `${currentYear}-01`);
    const [toMonth, setToMonth] = useState(searchParams.get("to") || format(new Date(), "yyyy-MM"));
    const [selectedDivision, setSelectedDivision] = useState<string>(searchParams.get("division") || "Dry Goods");
    
    // NEW: State for Drill-down
    const [selectedSupplier, setSelectedSupplier] = useState<string | null>(null);

    const [loading, setLoading] = useState(true);
    const [rawData, setRawData] = useState<VSalesPerformanceDataDto[]>([]);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const start = format(startOfMonth(parseISO(fromMonth + "-01")), "yyyy-MM-dd");
                const end = format(endOfMonth(parseISO(toMonth + "-01")), "yyyy-MM-dd");
                const data = await fetchManagerialData(start, end);
                setRawData(data);
            } catch (err) { console.error(err); } finally { setLoading(false); }
        };
        load();
    }, [fromMonth, toMonth]);

    const divisions = useMemo(() => Array.from(new Set(rawData.map(d => d.divisionName))).sort(), [rawData]);

    // 1. Data Processing for Suppliers
    const { supplierPerformance, divisionSummary } = useMemo(() => {
        const start = parseISO(fromMonth + "-01");
        const end = parseISO(toMonth + "-01");
        const months = Math.max(1, (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1);
        const filtered = rawData.filter(d => d.divisionName === selectedDivision);

        const salesMap = new Map<string, number>();
        filtered.forEach(item => {
            salesMap.set(item.supplierName, (salesMap.get(item.supplierName) || 0) + (item.netAmount || 0));
        });

        const targets = SUPPLIER_TARGETS[selectedDivision] || { "DEFAULT": 200000 };
        const perf = Array.from(salesMap.entries()).map(([name, sales]) => {
            const target = (targets[name] || targets["DEFAULT"]) * months;
            return { name, sales, target, achievement: (sales / target) * 100, status: sales >= target ? "HIT" : "MISS" };
        }).sort((a, b) => b.sales - a.sales);

        const totalActual = perf.reduce((s, i) => s + i.sales, 0);
        const totalTarget = perf.reduce((s, i) => s + i.target, 0);

        return { 
            supplierPerformance: perf, 
            divisionSummary: { totalActual, totalTarget, achievement: totalTarget > 0 ? (totalActual / totalTarget) * 100 : 0 }
        };
    }, [rawData, selectedDivision, fromMonth, toMonth]);

    // 2. Data Processing for Salesman (Specific to selected supplier)
    const salesmanBreakdown = useMemo(() => {
        if (!selectedSupplier) return [];
        
        const filtered = rawData.filter(d => d.supplierName === selectedSupplier);
        const salesmanMap = new Map<string, number>();

        filtered.forEach(item => {
            const name = item.salesmanName || "Unknown Salesman";
            salesmanMap.set(name, (salesmanMap.get(name) || 0) + (item.netAmount || 0));
        });

        return Array.from(salesmanMap.entries())
            .map(([name, sales]) => ({ name, sales }))
            .sort((a, b) => b.sales - a.sales);
    }, [rawData, selectedSupplier]);

    const formatPHP = (val: number) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 0 }).format(val);
    const formatShort = (val: number) => {
        const absVal = Math.abs(val);
        const sign = val < 0 ? "-" : "";
        if (absVal >= 1000000) return `${sign}₱${(absVal / 1000000).toFixed(1)}M`;
        if (absVal >= 1000) return `${sign}₱${(absVal / 1000).toFixed(0)}k`;
        return `${sign}₱${absVal.toFixed(0)}`;
    };

    return (
        <div className="space-y-6 p-4 min-h-screen bg-background text-foreground">
            {/* --- HEADER --- */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 text-muted-foreground mb-1 text-sm">
                        <span>BIA</span> <ChevronRight className="h-3 w-3" /> 
                        <span>Reports</span> <ChevronRight className="h-3 w-3" /> 
                        <span className="text-foreground font-medium">Supplier Analytics</span>
                    </div>
                    <h2 className="text-3xl font-bold tracking-tight">Managerial Dashboard</h2>
                </div>

                <div className="flex flex-wrap items-center gap-3 bg-card border rounded-xl p-2 shadow-sm">
                    <div className="flex items-center gap-2 px-2 border-r">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <Input type="month" value={fromMonth} onChange={e => setFromMonth(e.target.value)} className="w-32 border-none h-8 text-sm bg-transparent focus-visible:ring-0" />
                        <span className="text-muted-foreground text-xs">-</span>
                        <Input type="month" value={toMonth} onChange={e => setToMonth(e.target.value)} className="w-32 border-none h-8 text-sm bg-transparent focus-visible:ring-0" />
                    </div>
                    <div className="flex items-center gap-2 px-2">
                        <Filter className="h-4 w-4 text-muted-foreground" />
                        <Select value={selectedDivision} onValueChange={setSelectedDivision}>
                            <SelectTrigger className="w-[160px] h-8 border-none bg-transparent shadow-none text-sm font-medium">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {divisions.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            {/* --- METRIC STRIP --- */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="border-primary/20"><CardContent className="p-4"><p className="text-xs font-semibold text-primary uppercase">Actual</p><p className="text-2xl font-bold">{formatPHP(divisionSummary.totalActual)}</p></CardContent></Card>
                <Card><CardContent className="p-4"><p className="text-xs font-semibold text-muted-foreground uppercase">Target</p><p className="text-2xl font-bold">{formatPHP(divisionSummary.totalTarget)}</p></CardContent></Card>
                <Card><CardContent className="p-4"><p className="text-xs font-semibold text-muted-foreground uppercase">Achievement</p><p className="text-2xl font-bold">{divisionSummary.achievement.toFixed(1)}%</p></CardContent></Card>
                <Card className={divisionSummary.totalActual > divisionSummary.totalTarget ? "border-emerald-500/50" : "border-destructive/50"}>
                    <CardContent className="p-4"><p className="text-xs font-semibold uppercase opacity-70">Gap</p><p className="text-2xl font-bold">{formatPHP(divisionSummary.totalActual - divisionSummary.totalTarget)}</p></CardContent>
                </Card>
            </div>

            {/* --- MAIN VISUALIZATION --- */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <Card className="lg:col-span-8">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>{selectedSupplier ? `Salesmen: ${selectedSupplier}` : "Top Supplier Volume"}</CardTitle>
                            <CardDescription>{selectedSupplier ? "Breakdown of sales by personnel" : "Click a bar to see salesman breakdown"}</CardDescription>
                        </div>
                        {selectedSupplier && (
                            <Button variant="outline" size="sm" onClick={() => setSelectedSupplier(null)} className="gap-2">
                                <ArrowLeft className="h-4 w-4" /> Back to Suppliers
                            </Button>
                        )}
                    </CardHeader>
                    <CardContent className="h-[550px] pt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart 
                                data={selectedSupplier ? salesmanBreakdown.slice(0, 10) : supplierPerformance.slice(0, 10)} 
                                layout="vertical" 
                                margin={{ left: 50, right: 80 }}
                                onClick={(data) => {
                                    if (!selectedSupplier && data && data.activePayload) {
                                        setSelectedSupplier(data.activePayload[0].payload.name);
                                    }
                                }}
                                style={{ cursor: selectedSupplier ? 'default' : 'pointer' }}
                            >
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" strokeOpacity={0.5} />
                                <XAxis type="number" hide />
                                <YAxis type="category" dataKey="name" width={140} fontSize={11} tick={{ fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                                <Tooltip formatter={(v: any) => formatPHP(v)} cursor={{ fill: 'hsl(var(--muted)/0.2)' }} />
                                <Bar dataKey="sales" barSize={24} radius={[0, 6, 6, 0]} minPointSize={2}>
                                    {(selectedSupplier ? salesmanBreakdown : supplierPerformance).slice(0, 10).map((entry: any, index) => (
                                        <Cell 
                                            key={`cell-${index}`} 
                                            fill={selectedSupplier ? '#3b82f6' : (entry.sales < 0 ? 'hsl(var(--destructive))' : entry.sales >= entry.target ? '#10b981' : '#f59e0b')} 
                                        />
                                    ))}
                                    <LabelList dataKey="sales" position="right" formatter={(v: number) => formatShort(v)} style={{ fontSize: '12px', fontWeight: '600', fill: 'hsl(var(--foreground))' }} offset={10} />
                                </Bar>
                                {!selectedSupplier && <Bar dataKey="target" barSize={8} fill="hsl(var(--muted))" radius={[0, 6, 6, 0]} />}
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* --- SIDE LISTING --- */}
                <Card className="lg:col-span-4">
                    <CardHeader>
                        <CardTitle>{selectedSupplier ? "Salesman Ranking" : "Supplier Health"}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="max-h-[550px] overflow-y-auto px-6 pb-6 space-y-4">
                            {(selectedSupplier ? salesmanBreakdown : supplierPerformance).map((item: any, i) => (
                                <div 
                                    key={i} 
                                    className={`group p-4 rounded-xl border border-transparent hover:border-border hover:bg-muted/50 transition-all ${!selectedSupplier ? 'cursor-pointer' : ''}`}
                                    onClick={() => !selectedSupplier && setSelectedSupplier(item.name)}
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="w-[70%]">
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">
                                                {selectedSupplier ? 'Salesman' : 'Supplier'}
                                            </p>
                                            <p className="font-semibold text-sm leading-tight">{item.name}</p>
                                        </div>
                                        {item.status && <Badge variant={item.status === "HIT" ? "default" : "destructive"}>{item.status}</Badge>}
                                        {selectedSupplier && <User2 className="h-4 w-4 text-primary" />}
                                    </div>
                                    <Progress value={item.achievement || (item.sales / salesmanBreakdown[0].sales * 100)} className="h-1.5" />
                                    <div className="flex justify-between mt-2 text-[11px] font-medium text-muted-foreground">
                                        <span>Act: {formatShort(item.sales)}</span>
                                        {item.achievement && <span className={item.achievement >= 100 ? "text-emerald-500" : "text-amber-500"}>{item.achievement.toFixed(1)}%</span>}
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

export default function ManagerialSupplierModule() {
    return (
        <Suspense fallback={<div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}>
            <ManagerialSupplierContent />
        </Suspense>
    );
}