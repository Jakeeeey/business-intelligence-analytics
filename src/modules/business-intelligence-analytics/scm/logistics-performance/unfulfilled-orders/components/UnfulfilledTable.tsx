"use client";

import React, {useState, useMemo} from "react";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import {Input} from "@/components/ui/input";
import {UnfulfilledOrder} from "../types";
import {format} from "date-fns";
import {UserCircle, Package, Search} from "lucide-react";

export const UnfulfilledTable = ({data, isLoading}: { data: UnfulfilledOrder[]; isLoading: boolean }) => {
    const [searchTerm, setSearchTerm] = useState("");

    const groupedData = useMemo(() => {
        const lowerSearch = searchTerm.toLowerCase();
        return data.reduce((acc, order) => {
            const customer = order.customerName || "Unassigned Customer";
            if (searchTerm && !customer.toLowerCase().includes(lowerSearch)) return acc;
            if (!acc[customer]) acc[customer] = [];
            acc[customer].push(order);
            return acc;
        }, {} as Record<string, UnfulfilledOrder[]>);
    }, [data, searchTerm]);

    if (isLoading) return <div className="p-20 text-center text-muted-foreground animate-pulse font-medium">Analyzing
        inventory exceptions...</div>;
    if (data.length === 0) return <div className="p-20 text-center text-muted-foreground">No unfulfilled records
        found.</div>;

    const getRowColorClass = (status: string) => {
        if (status === 'Fulfilled With Concerns') return "bg-amber-50/50 dark:bg-amber-900/10 hover:bg-amber-100/60";
        if (status === 'Not Fulfilled') return "bg-red-50/50 dark:bg-destructive/10 hover:bg-red-100/60";
        return "hover:bg-muted/50 transition-colors";
    };

    return (
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm flex flex-col h-full overflow-hidden">
            <div className="p-3 border-b bg-muted/30 shrink-0 relative z-20">
                <div className="relative max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                    <Input placeholder="Search customer..." value={searchTerm}
                           onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 bg-background"/>
                </div>
            </div>
            <div className="flex-1 overflow-auto relative">
                <Table>
                    <TableHeader className="sticky top-0 z-10 bg-card shadow-sm ring-1 ring-border">
                        <TableRow className="bg-card">
                            <TableHead className="w-[450px]">Product Description</TableHead>
                            <TableHead>Unit</TableHead>
                            <TableHead className="text-center">Receipt</TableHead>
                            <TableHead
                                className="text-center text-red-600 dark:text-red-400 font-bold">Missing</TableHead>
                            <TableHead>Reference IDs</TableHead>
                            <TableHead className="text-right">Activity Dates</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {Object.keys(groupedData).length === 0 ? <TableRow><TableCell colSpan={6}
                                                                                      className="h-32 text-center text-muted-foreground font-medium">No
                                results for &quot;{searchTerm}&quot;</TableCell></TableRow> :
                            Object.entries(groupedData).map(([customer, orders]) => (
                                <React.Fragment key={customer}>
                                    <TableRow className="bg-muted/40 border-y border-border"><TableCell colSpan={3}
                                                                                                        className="py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-background p-1.5 rounded-lg border shadow-sm"><UserCircle
                                                className="h-4 w-4 text-primary"/></div>
                                            <div><span
                                                className="font-bold text-foreground uppercase text-xs tracking-wider">{customer}</span>
                                                <p className="text-[10px] text-muted-foreground font-medium">{orders.length} exceptions</p>
                                            </div>
                                        </div>
                                    </TableCell><TableCell className="text-center">
                                        <div
                                            className="bg-red-50 dark:bg-destructive/20 text-red-700 dark:text-red-400 px-2 py-1 rounded font-black text-[11px] border border-red-100 dark:border-destructive/30">Σ {orders.reduce((sum, o) => sum + o.missingQty, 0)} UNITS
                                        </div>
                                    </TableCell><TableCell colSpan={2}/></TableRow>
                                    {orders.map((row, idx) => (
                                        <TableRow key={`${row.unfulfilledDetailId}-${idx}`}
                                                  className={getRowColorClass(row.unfulfilledStatus)}>
                                            <TableCell className="pl-10">
                                                <div className="flex gap-3"><Package
                                                    className="h-3.5 w-3.5 text-muted-foreground/50 mt-1"/>
                                                    <div>
                                                        <div
                                                            className="font-semibold text-foreground text-sm flex items-center gap-2">{row.productName}<span
                                                            className={`text-[8px] px-1.5 py-0.5 rounded-sm font-bold uppercase ${row.unfulfilledStatus === 'Fulfilled With Concerns' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'}`}>{row.unfulfilledStatus}</span>
                                                        </div>
                                                        <div
                                                            className="text-[10px] text-muted-foreground">{row.brandName}</div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell
                                                className="text-[11px] font-medium">{row.unitOfMeasurement}</TableCell>
                                            <TableCell className="text-center">{row.receiptQty}</TableCell>
                                            <TableCell
                                                className="text-center font-bold text-red-600 dark:text-red-400">{row.missingQty}</TableCell>
                                            <TableCell>
                                                <div className="space-y-1">
                                                    <div className="text-[10px] font-mono text-muted-foreground"><span
                                                        className="font-bold opacity-70">DISP:</span> {row.dispatchNo}
                                                    </div>
                                                    <div className="text-[10px] font-mono text-muted-foreground"><span
                                                        className="font-bold opacity-70">PO:</span> {row.purchaseOrderNo}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div
                                                    className="text-[10px] font-medium text-foreground">{row.receivedDate ? format(new Date(row.receivedDate), "MMM dd, yyyy") : "N/A"}</div>
                                                <div className="text-[9px] text-muted-foreground uppercase">Finalized
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </React.Fragment>
                            ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
};