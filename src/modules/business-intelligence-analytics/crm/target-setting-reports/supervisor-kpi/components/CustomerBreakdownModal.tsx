import React, { useMemo, useState, useEffect } from "react";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Store, Users, TrendingUp, Loader2, MapPin, ArrowUpDown, ChevronUp, ChevronDown } from "lucide-react";

import { VSalesPerformanceDataDto } from "../types";
import { fetchCustomerPeaks, fetchCustomerTargets } from "../providers/fetchProvider";
import { CustomerProductsModal } from "./CustomerProductsModal";

interface CustomerBreakdownModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: VSalesPerformanceDataDto[];
    ids: number[];
    salesmanName: string;
    supplierName: string;
    periodLabel: string;
    startDate: string;
    endDate: string;
}

export function CustomerBreakdownModal({
                                           isOpen,
                                           onClose,
                                           data,
                                           ids,
                                           salesmanName,
                                           supplierName,
                                           periodLabel,
                                           startDate,
                                           endDate
                                       }: CustomerBreakdownModalProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [viewType, setViewType] = useState<"customer" | "area">("customer");
    const [peakSales, setPeakSales] = useState<Record<string, { total: number; peak: number }>>({});
    const [customerTargets, setCustomerTargets] = useState<Record<string, number>>({});
    const [selectedProdCust, setSelectedProdCust] = useState<{ name: string; code: string; sId: number; supId: number } | null>(null);
    const [loadingPeaks, setLoadingPeaks] = useState(false);
    const [loadingTargets, setLoadingTargets] = useState(false);

    // Initial grouping of customers or areas from current period data
    const baseCustomerMetrics = useMemo(() => {
        const map = new Map<string, { sales: number; count: number; customerCode: string; sId: number; supId: number }>();

        data.forEach((item) => {
            const itemObj = item as any;
            const name = viewType === "customer" 
                ? (item.storeName || "Unknown Customer").trim()
                : `${(itemObj.province || "").trim()}, ${(itemObj.city || "").trim()}`.replace(/^, |, $/g, "") || "Unknown Area";
            
            // Based on sample: customerCode might be a name, while province/city might contain the ID (e.g. "EPI-EXT4 - 34095")
            // For Area view, we use the combined name itself as the identifier fallback
            const rawCode = viewType === "area" 
                ? `${(itemObj.province || "").trim()}::${(itemObj.city || "").trim()}`
                : (itemObj.province && itemObj.province.includes('-')) ? itemObj.province :
                  (itemObj.customerCode && itemObj.customerCode.includes('-')) ? itemObj.customerCode :
                  itemObj.customerCode || itemObj.storeCode || itemObj.customerId || name;
            
            const current = map.get(name) || { 
                sales: 0, 
                count: 0, 
                customerCode: rawCode, 
                sId: Number(item.salesmanId), 
                supId: Number(item.supplierId) 
            };
            
            current.sales += Number(item.netAmount || itemObj.amount || 0);
            current.count += 1;
            
            // If code was missing in first record but found in subsequent, update it
            if (!current.customerCode && rawCode) {
                current.customerCode = rawCode;
            }
            
            map.set(name, current);
        });

        return Array.from(map.entries()).map(([name, metrics]) => ({ name, ...metrics }));
    }, [data, viewType]);

    // Fetch historical peaks when modal opens or raw data changes
    useEffect(() => {
        const loadPeaks = async () => {
            if (!isOpen || baseCustomerMetrics.length === 0) return;
            
            setLoadingPeaks(true);
            setLoadingTargets(true);
            try {
                const names = baseCustomerMetrics.map(c => c.name);
                
                const [peaks, targetsMap] = await Promise.all([
                    fetchCustomerPeaks(names, ids, viewType),
                    fetchCustomerTargets(ids, startDate, endDate, viewType, names)
                ]);

                setPeakSales(peaks);
                
                // Use targetsMap directly for both views since the API/Provider now handles the consolidation correctly
                setCustomerTargets(targetsMap);
            } catch (err) {
                console.error("Failed to fetch customer data:", err);
            } finally {
                setLoadingPeaks(false);
                setLoadingTargets(false);
            }
        };

        loadPeaks();
    }, [isOpen, baseCustomerMetrics, ids, startDate, endDate, viewType]);

    const { customerMetrics, totalSales, uniqueCustomers } = useMemo(() => {
        const filtered = baseCustomerMetrics
            .map(c => ({
                ...c,
                peak: peakSales[c.name]?.peak || 0,
                target: customerTargets[c.name] || 0
            }))
            .sort((a, b) => b.sales - a.sales)
            .filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));

        return {
            customerMetrics: filtered,
            totalSales: filtered.reduce((sum, c) => sum + (c.sales > 0 ? c.sales : 0), 0),
            uniqueCustomers: filtered.length
        };
    }, [baseCustomerMetrics, peakSales, customerTargets, searchTerm]);

    const formatPHP = (val: number) => {
        if (!val || isNaN(val)) return "₱0";
        return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 0 }).format(val);
    }

    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedMetrics = useMemo(() => {
        const metrics = customerMetrics;
        if (!sortConfig) return metrics;

        return [...metrics].sort((a, b) => {
            const aVal = (a as any)[sortConfig.key];
            const bVal = (b as any)[sortConfig.key];

            if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [customerMetrics, sortConfig]);

    const getSortIcon = (key: string) => {
        if (!sortConfig || sortConfig.key !== key) return <ArrowUpDown className="ml-1 h-2.5 w-2.5 opacity-30 px-0 translate-y-[1px]" />;
        return sortConfig.direction === 'asc' 
            ? <ChevronUp className="ml-1 h-3 w-3 text-primary" /> 
            : <ChevronDown className="ml-1 h-3 w-3 text-primary" />;
    };

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="sm:max-w-[95vw] w-full h-[94vh] flex flex-col overflow-hidden bg-background/95 backdrop-blur-xl border-border/40 shadow-2xl p-6 pt-12">
                    <DialogHeader className="border-b border-border/40 pb-4 flex-shrink-0">
                        <div className="flex justify-between items-start pr-8">
                            <div>
                                <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-[0.2em] font-bold mb-1">
                                    <Store className="h-3 w-3" /> Breakdown Analysis
                                </div>
                                <DialogTitle className="text-2xl font-black tracking-tight uppercase flex flex-col sm:flex-row sm:items-baseline gap-2">
                                    <span className="text-primary italic">{salesmanName}</span>
                                    <span className="text-muted-foreground text-sm font-bold tracking-widest">SUPPLYING</span>
                                    <span className="text-emerald-500">{supplierName}</span>
                                </DialogTitle>
                                <DialogDescription className="text-xs font-medium uppercase tracking-wider mt-1">
                                    Period: {periodLabel}
                                </DialogDescription>
                            </div>
                            
                            <div className="flex items-center gap-6">
                                <Tabs defaultValue="customer" value={viewType} onValueChange={(v) => {
                                    setViewType(v as any);
                                    setSortConfig(null);
                                }} className="w-[300px]">
                                    <TabsList className="grid w-full grid-cols-2 bg-muted/20 border border-border/40 p-1 rounded-xl">
                                        <TabsTrigger value="customer" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-black text-[10px] uppercase tracking-widest rounded-lg">
                                            <Users className="h-3 w-3 mr-2" /> Customer
                                        </TabsTrigger>
                                        <TabsTrigger value="area" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-black text-[10px] uppercase tracking-widest rounded-lg">
                                            <MapPin className="h-3 w-3 mr-2" /> Area
                                        </TabsTrigger>
                                    </TabsList>
                                </Tabs>

                                <div className="flex flex-col items-end gap-1">
                                    <Badge variant="outline" className="text-xs font-mono uppercase bg-muted/20">
                                        {data.length} Trans
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="flex-1 mt-6 overflow-hidden flex flex-col min-h-0">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 flex-shrink-0">
                            <Card className="bg-muted/10 border-border/40 shadow-sm overflow-hidden group hover:border-primary/40 transition-all duration-300">
                                <CardHeader className="py-3 px-4 flex flex-row items-center justify-between space-y-0">
                                    <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">Total Sales (Current Period)</CardTitle>
                                    <TrendingUp className="h-3 w-3 text-primary opacity-50" />
                                </CardHeader>
                                <CardContent className="px-4 pb-3 text-primary italic">
                                    <div className="text-3xl font-black tracking-tighter">{formatPHP(totalSales)}</div>
                                </CardContent>
                            </Card>
                            
                            <Card className="bg-muted/10 border-border/40 shadow-sm overflow-hidden group hover:border-primary/40 transition-all duration-300">
                                <CardHeader className="py-3 px-4 flex flex-row items-center justify-between space-y-0">
                                    <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors italic uppercase">Market Reach</CardTitle>
                                    <Users className="h-3 w-3 text-primary opacity-50" />
                                </CardHeader>
                                <CardContent className="px-4 pb-3">
                                    <div className="flex items-baseline gap-2">
                                        <div className="text-3xl font-black tracking-tighter text-foreground">{uniqueCustomers}</div>
                                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                                            {viewType === "customer" ? "Active Customers" : "Active Areas"}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="flex items-center gap-2 mb-4 bg-muted/10 p-1 rounded-lg border border-border/40 flex-shrink-0">
                            <Search className="h-4 w-4 text-muted-foreground ml-2" />
                            <Input
                                placeholder={`FILTER BY ${viewType === "customer" ? "CUSTOMER" : "AREA"} NAME...`}
                                className="border-none bg-transparent h-8 text-xs font-bold uppercase placeholder:text-muted-foreground/50 focus-visible:ring-0"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <ScrollArea className="flex-1 min-h-0 h-full border border-border/40 rounded-xl bg-card/10">
                            <Table>
                                <TableHeader className="bg-muted/30 sticky top-0 z-10 backdrop-blur-sm">
                                    <TableRow className="hover:bg-transparent border-b border-border/40">
                                        <TableHead className="w-[50px] text-[9px] uppercase font-black tracking-wider text-muted-foreground">#</TableHead>
                                        <TableHead 
                                            className="text-[9px] uppercase font-black tracking-wider text-muted-foreground cursor-pointer hover:text-primary transition-colors"
                                            onClick={() => handleSort('name')}
                                        >
                                            <div className="flex items-center">
                                                {viewType === "customer" ? "Customer Name" : "Area Name"} {getSortIcon('name')}
                                            </div>
                                        </TableHead>
                                        <TableHead 
                                            className="text-right text-[9px] uppercase font-black tracking-wider text-muted-foreground cursor-pointer hover:text-primary transition-colors"
                                            onClick={() => handleSort('peak')}
                                        >
                                            <div className="flex items-center justify-end">
                                                Highest Monthly Sales {getSortIcon('peak')}
                                            </div>
                                        </TableHead>
                                        <TableHead 
                                            className="text-right text-[9px] uppercase font-black tracking-wider text-muted-foreground cursor-pointer hover:text-primary transition-colors"
                                            onClick={() => handleSort('target')}
                                        >
                                            <div className="flex items-center justify-end">
                                                Target Sales {getSortIcon('target')}
                                            </div>
                                        </TableHead>
                                        <TableHead 
                                            className="text-right text-[9px] uppercase font-black tracking-wider text-muted-foreground cursor-pointer hover:text-primary transition-colors"
                                            onClick={() => handleSort('count')}
                                        >
                                            <div className="flex items-center justify-end">
                                                Freq {getSortIcon('count')}
                                            </div>
                                        </TableHead>
                                        <TableHead 
                                            className="text-right text-[9px] uppercase font-black tracking-wider text-muted-foreground cursor-pointer hover:text-primary transition-colors"
                                            onClick={() => handleSort('sales')}
                                        >
                                            <div className="flex items-center justify-end">
                                                Current Value {getSortIcon('sales')}
                                            </div>
                                        </TableHead>
                                        <TableHead className="text-right text-[9px] uppercase font-black tracking-wider text-muted-foreground min-w-[120px]">Contribution</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {(loadingPeaks || loadingTargets) ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="h-64 text-center">
                                                <div className="flex flex-col items-center justify-center gap-3">
                                                    <Loader2 className="h-8 w-8 text-primary animate-spin" />
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground animate-pulse">Calculating Performance Metrics...</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : sortedMetrics.length > 0 ? (
                                        sortedMetrics.map((customer, idx) => (
                                            <TableRow 
                                                key={idx} 
                                                className="hover:bg-primary/5 transition-colors border-border/40 group cursor-pointer"
                                                onClick={() => setSelectedProdCust({
                                                    name: customer.name,
                                                    code: customer.customerCode,
                                                    sId: customer.sId,
                                                    supId: customer.supId
                                                })}
                                            >
                                                <TableCell className="font-mono text-xs text-muted-foreground/50 font-bold text-center">
                                                    {idx + 1}
                                                </TableCell>
                                                <TableCell className="font-bold text-xs uppercase tracking-tight text-foreground/80 group-hover:text-primary transition-colors">
                                                    {customer.name}
                                                </TableCell>
                                                <TableCell className="text-right font-mono text-xs text-orange-500 font-bold">
                                                    {loadingPeaks ? (
                                                        <span className="animate-pulse opacity-50">...</span>
                                                    ) : (
                                                        formatPHP(customer.peak)
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex flex-col items-end gap-1.5">
                                                        <div className="font-mono text-xs text-blue-500 font-black">
                                                            {loadingTargets ? (
                                                                <span className="animate-pulse opacity-50">...</span>
                                                            ) : customer.target > 0 ? (
                                                                formatPHP(customer.target)
                                                            ) : (
                                                                "-"
                                                            )}
                                                        </div>
                                                        
                                                        {customer.target > 0 && !loadingTargets && (
                                                            <div className="w-full max-w-[80px] pt-1">
                                                                <div className="w-full h-1 bg-muted/30 rounded-full overflow-hidden border border-border/10">
                                                                    <div
                                                                        className={`h-full transition-all duration-500 ${
                                                                            (customer.sales / customer.target) >= 0.67 ? "bg-emerald-500" :
                                                                            (customer.sales / customer.target) >= 0.34 ? "bg-orange-500" : "bg-red-500"
                                                                        }`}
                                                                        style={{ width: `${Math.min((customer.sales / customer.target) * 100, 100)}%` }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right font-mono text-xs text-muted-foreground">{customer.count}</TableCell>
                                                <TableCell className="text-right font-mono font-bold text-emerald-500/90 group-hover:text-emerald-400">
                                                    {formatPHP(customer.sales)}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex flex-col items-end gap-1">
                                                        <span className="text-[9px] font-mono text-muted-foreground">{((customer.sales / totalSales) * 100).toFixed(1)}%</span>
                                                        <div className="w-full h-1 bg-muted/20 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-emerald-500/80"
                                                                style={{ width: `${Math.min((customer.sales / totalSales) * 100, 100)}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={7} className="h-64 text-center">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-30 italic">No breakdown data available for this selection</p>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                    </div>

                    <div className="mt-4 flex justify-between items-center text-[10px] uppercase font-bold text-muted-foreground flex-shrink-0">
                        <span>Generated via BIA Dashboard</span>
                        <span>Showing {customerMetrics.length} records</span>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Nested Products Modal */}
            <CustomerProductsModal 
                isOpen={!!selectedProdCust}
                onClose={() => setSelectedProdCust(null)}
                customerName={selectedProdCust?.name || ""}
                customerCode={selectedProdCust?.code || ""}
                salesmanId={selectedProdCust?.sId || 0}
                supplierId={selectedProdCust?.supId || 0}
                supplierName={supplierName}
                startDate={startDate}
                endDate={endDate}
                viewType={viewType}
            />
        </>
    );
}
