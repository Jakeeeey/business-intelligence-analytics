import React, { useMemo, useState } from "react";

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
import { Search, Store, Users } from "lucide-react";

import { VSalesPerformanceDataDto } from "../../executive-health/types";

interface CustomerBreakdownModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: VSalesPerformanceDataDto[];
    salesmanName: string;
    supplierName: string;
    periodLabel: string;
}

export function CustomerBreakdownModal({
                                           isOpen,
                                           onClose,
                                           data,
                                           salesmanName,
                                           supplierName,
                                           periodLabel
                                       }: CustomerBreakdownModalProps) {
    const [searchTerm, setSearchTerm] = useState("");

    const { customerMetrics, totalSales, uniqueCustomers } = useMemo(() => {
        const map = new Map<string, { sales: number; count: number }>();

        data.forEach(item => {
            const customer = item.storeName || "Unknown Customer";
            const current = map.get(customer) || { sales: 0, count: 0 };
            map.set(customer, {
                sales: current.sales + (item.netAmount || 0),
                count: current.count + 1
            });
        });

        const sorted = Array.from(map.entries())
            .map(([name, metrics]) => ({ name, ...metrics }))
            .sort((a, b) => b.sales - a.sales);

        return {
            customerMetrics: sorted,
            totalSales: sorted.reduce((sum, c) => sum + c.sales, 0),
            uniqueCustomers: sorted.length
        };
    }, [data]);

    const filteredCustomers = customerMetrics.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatPHP = (val: number) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 0 }).format(val);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[95vw] w-full h-[94vh] flex flex-col overflow-hidden bg-background/95 backdrop-blur-xl border-border/40 shadow-2xl p-6">
                <DialogHeader className="border-b border-border/40 pb-4 flex-shrink-0">
                    <div className="flex justify-between items-start pr-8">
                        <div>
                            <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-[0.2em] font-bold mb-1">
                                <Store className="h-3 w-3" /> Customer Breakdown
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
                        <div className="flex flex-col items-end gap-1">
                            <Badge variant="outline" className="text-xs font-mono uppercase bg-muted/20">
                                {data.length} Trans
                            </Badge>
                        </div>
                    </div>
                </DialogHeader>

                <div className="grid grid-cols-2 gap-4 my-4 flex-shrink-0">
                    <Card className="bg-card/30 border-muted/40 shadow-sm backdrop-blur-sm">
                        <CardHeader className="py-3 px-4">
                            <CardTitle className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Total Sales</CardTitle>
                        </CardHeader>
                        <CardContent className="px-4 pb-3">
                            <div className="text-3xl font-black text-emerald-500 tracking-tighter">{formatPHP(totalSales)}</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-card/30 border-muted/40 shadow-sm backdrop-blur-sm">
                        <CardHeader className="py-3 px-4">
                            <CardTitle className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2">
                                <Users className="h-3 w-3" /> Market Penetration
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-4 pb-3">
                            <div className="flex items-baseline gap-2">
                                <div className="text-3xl font-black tracking-tighter text-foreground">{uniqueCustomers}</div>
                                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Unique Stores</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="flex items-center gap-2 mb-4 bg-muted/10 p-1 rounded-lg border border-border/40 flex-shrink-0">
                    <Search className="h-4 w-4 text-muted-foreground ml-2" />
                    <Input
                        placeholder="FILTER CUSTOMERS..."
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
                                <TableHead className="text-[9px] uppercase font-black tracking-wider text-muted-foreground">Customer Name</TableHead>
                                <TableHead className="text-right text-[9px] uppercase font-black tracking-wider text-muted-foreground">Freq</TableHead>
                                <TableHead className="text-right text-[9px] uppercase font-black tracking-wider text-muted-foreground">Value</TableHead>
                                <TableHead className="w-[120px] text-right text-[9px] uppercase font-black tracking-wider text-muted-foreground">Impact</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredCustomers.length > 0 ? (
                                filteredCustomers.map((customer, index) => {
                                    const contribution = (totalSales > 0 && customer.sales > 0) ? (customer.sales / totalSales) * 100 : 0;
                                    return (
                                        <TableRow key={customer.name} className="hover:bg-muted/20 border-border/40 group">
                                            <TableCell className="font-mono text-xs text-muted-foreground/50 font-bold">{index + 1}</TableCell>
                                            <TableCell className="font-bold text-xs uppercase tracking-tight text-foreground/80 group-hover:text-foreground">
                                                {customer.name}
                                            </TableCell>
                                            <TableCell className="text-right font-mono text-xs text-muted-foreground">{customer.count}</TableCell>
                                            <TableCell className="text-right font-mono font-bold text-emerald-500/90 group-hover:text-emerald-400">
                                                {formatPHP(customer.sales)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex flex-col items-end gap-1">
                                                    <span className="text-[9px] font-mono text-muted-foreground">{contribution.toFixed(1)}%</span>
                                                    <div className="w-full h-1 bg-muted/20 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-emerald-500/80"
                                                            style={{ width: `${Math.min(Math.max(contribution, 0), 100)}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center text-xs uppercase font-bold text-muted-foreground">
                                        No customers found
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </ScrollArea>

                <div className="mt-4 flex justify-between items-center text-[10px] uppercase font-bold text-muted-foreground flex-shrink-0">
                    <span>Generated via BIA</span>
                    <span>Showing top {filteredCustomers.length} records</span>
                </div>
            </DialogContent>
        </Dialog>
    );
}
