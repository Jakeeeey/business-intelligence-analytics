"use client";

import React, {useState, useEffect, useMemo} from "react";
import {format, startOfMonth, differenceInDays} from "date-fns";
import {Card, CardContent} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {
    Printer,
    RefreshCw,
    AlertTriangle,
    Package,
    Clock,
    DollarSign,
    LayoutDashboard,
    TableProperties
} from "lucide-react";
import {getUnfulfilledOrders} from "./providers/fetchProvider";
import {UnfulfilledOrder} from "./types";
import {UnfulfilledTable} from "./components/UnfulfilledTable";
import {ProductExceptionSummary} from "./components/ProductExceptionSummary";
import {ExportReportModal} from "./components/ExportReportModal";

export default function UnfulfilledOrdersModule() {
    const [data, setData] = useState<UnfulfilledOrder[]>([]);
    const [loading, setLoading] = useState(false);
    const [start, setStart] = useState(format(startOfMonth(new Date()), "yyyy-MM-dd"));
    const [end, setEnd] = useState(format(new Date(), "yyyy-MM-dd"));
    const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
    const [activeView, setActiveView] = useState<'analytics' | 'ledger'>('analytics');
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);

    const stats = useMemo(() => {
        const totalValue = data.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);
        const criticalAging = data.filter(order =>
            order.poDate && differenceInDays(new Date(), new Date(order.poDate)) > 3
        ).length;

        return {
            totalOrders: data.length,
            totalValue,
            avgAging: data.length > 0
                ? (data.reduce((acc, curr) => acc + (curr.poDate ? differenceInDays(new Date(), new Date(curr.poDate)) : 0), 0) / data.length).toFixed(1)
                : 0,
            criticalCount: criticalAging
        };
    }, [data]);

    const handleFetch = async () => {
        setLoading(true);
        try {
            const result = await getUnfulfilledOrders(start, end);
            setData(result);
            setLastRefreshed(new Date());
        } catch (e) {
            console.error("Failed to load report", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        handleFetch();
    }, []);

    return (
        <div className="p-8 space-y-6 max-w-[1600px] mx-auto bg-background min-h-screen">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4 pb-4 border-b">
                <div>
                    <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Logistics Intelligence</h1>
                    <p className="text-muted-foreground text-sm font-medium mt-1 flex items-center gap-2">
                        <span
                            className={`w-2 h-2 rounded-full ${loading ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500'}`}/>
                        Exception Monitoring — Vertex Operations
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 bg-card p-2 rounded-lg border shadow-sm">
                    <div className="flex items-center gap-2 px-2">
                        <span
                            className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Period</span>
                        <Input type="date" value={start} onChange={e => setStart(e.target.value)}
                               className="h-8 w-36 text-xs bg-background"/>
                        <span className="text-muted-foreground">-</span>
                        <Input type="date" value={end} onChange={e => setEnd(e.target.value)}
                               className="h-8 w-36 text-xs bg-background"/>
                    </div>
                    <div className="h-6 w-px bg-border mx-1"/>
                    <Button variant="default" size="sm" onClick={handleFetch} disabled={loading} className="h-8">
                        <RefreshCw className={`h-3.5 w-3.5 mr-2 ${loading ? 'animate-spin' : ''}`}/>
                        {loading ? 'Syncing...' : 'Update Data'}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setIsExportModalOpen(true)} className="h-8">
                        <Printer className="h-3.5 w-3.5 mr-2"/> Export
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard title="Unfulfilled Volume" value={stats.totalOrders} subtitle="Active Cases"
                            icon={<Package className="text-indigo-500 h-5 w-5"/>}/>
                <MetricCard title="Revenue at Risk"
                            value={`₱${stats.totalValue.toLocaleString(undefined, {minimumFractionDigits: 2})}`}
                            subtitle="Pending Fulfillment" icon={<DollarSign className="text-emerald-500 h-5 w-5"/>}/>
                <MetricCard title="Avg. Lead Time" value={`${stats.avgAging} Days`} subtitle="System Processing Speed"
                            icon={<Clock className="text-amber-500 h-5 w-5"/>}/>
                <MetricCard title="Critical Backlog" value={stats.criticalCount} subtitle="Over 72 Hours Pending"
                            icon={<AlertTriangle className="text-destructive h-5 w-5"/>}
                            isAlert={stats.criticalCount > 0}/>
            </div>

            <div className="flex items-center justify-between mt-8">
                <div className="flex gap-1 bg-muted p-1 rounded-lg border">
                    <button onClick={() => setActiveView('analytics')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-bold transition-all ${activeView === 'analytics' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                        <LayoutDashboard className="h-4 w-4"/> Supplier Analytics
                    </button>
                    <button onClick={() => setActiveView('ledger')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-bold transition-all ${activeView === 'ledger' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                        <TableProperties className="h-4 w-4"/> Detailed Ledger
                    </button>
                </div>
                <div className="text-right">
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Last Sync</p>
                    <p className="text-xs font-mono text-foreground">{lastRefreshed ? format(lastRefreshed, "HH:mm:ss") : "--:--:--"}</p>
                </div>
            </div>

            <div className="min-h-[500px]">
                {activeView === 'analytics' &&
                    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <ProductExceptionSummary data={data} isLoading={loading}/></div>}
                {activeView === 'ledger' && <div
                    className="bg-card rounded-xl border shadow-sm overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="px-6 py-4 border-b bg-muted/50 flex justify-between items-center"><h3
                        className="font-bold text-foreground">Detailed Exception Ledger</h3><span
                        className="text-xs font-semibold px-2 py-1 bg-muted rounded text-muted-foreground uppercase">{data.length} Total Records</span>
                    </div>
                    <div className="max-h-[650px] overflow-auto"><UnfulfilledTable data={data} isLoading={loading}/>
                    </div>
                </div>}
            </div>

            <ExportReportModal isOpen={isExportModalOpen} onClose={() => setIsExportModalOpen(false)} data={data}
                               startDate={start} endDate={end}/>
        </div>
    );
}

function MetricCard({title, value, subtitle, icon, isAlert = false}: {
    title: string;
    value: string | number;
    subtitle: string;
    icon: React.ReactNode;
    isAlert?: boolean
}) {
    return (
        <Card
            className={`border-none shadow-sm ${isAlert ? 'ring-1 ring-destructive/50 bg-destructive/10' : 'bg-card'}`}>
            <CardContent className="p-5">
                <div className="flex justify-between items-start">
                    <div className="space-y-1">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{title}</p>
                        <p className="text-2xl font-black text-foreground">{value}</p>
                        <p className="text-[11px] font-medium text-muted-foreground">{subtitle}</p>
                    </div>
                    <div
                        className={`p-2.5 rounded-lg border ${isAlert ? 'bg-destructive/10 border-destructive/20' : 'bg-muted border-border'}`}>{icon}</div>
                </div>
            </CardContent>
        </Card>
    );
}