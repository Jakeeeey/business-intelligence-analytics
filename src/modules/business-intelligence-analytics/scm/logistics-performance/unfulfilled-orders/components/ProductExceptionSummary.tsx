"use client";

import React, {useState, useMemo} from "react";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import {TrendingUp, Truck, Search, ChevronDown, ChevronRight, UserCircle} from "lucide-react";
import {UnfulfilledOrder} from "../types";

interface Props {
    data: UnfulfilledOrder[];
    isLoading: boolean;
}

// Internal Types for Nested Grouping
type CustomerBreakdown = {
    customerName: string;
    missingQty: number;
    receiptQty: number;
};

type ProductVarianceRow = {
    name: string;
    brand: string;
    uom: string;
    status: string;
    receiptQty: number;
    missingQty: number;
    totalAmount: number;
    customers: Record<string, CustomerBreakdown>;
};

// 1. ADDED: An intermediate type for the reduce phase
type IntermediateSupplierGroup = {
    supplierName: string;
    totalSupplierAmount: number;
    totalSupplierMissing: number;
    totalSupplierReceipt: number;
    itemsMap: Record<string, ProductVarianceRow>;
};

type SupplierGroup = {
    supplierName: string;
    totalSupplierAmount: number;
    totalSupplierMissing: number;
    totalSupplierReceipt: number;
    items: ProductVarianceRow[];
};

export const ProductExceptionSummary = ({data, isLoading}: Props) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [expandedItemKeys, setExpandedItemKeys] = useState<Record<string, boolean>>({});

    const toggleExpand = (key: string) => {
        setExpandedItemKeys(prev => ({...prev, [key]: !prev[key]}));
    };

    const topSuppliers = useMemo(() => {
        const lowerSearch = searchTerm.toLowerCase();

        // 2. FIXED: Typed the accumulator using the intermediate type
        const grouped = data.reduce((acc: Record<string, IntermediateSupplierGroup>, order) => {
            const supplier = order.productSupplier || "Unknown Supplier";
            const product = order.productName || "Unknown Product";
            const status = order.unfulfilledStatus || "Unspecified Variance";
            const customer = order.customerName || "Unassigned Customer";

            if (searchTerm && !supplier.toLowerCase().includes(lowerSearch) && !product.toLowerCase().includes(lowerSearch)) {
                return acc;
            }

            const itemKey = `${supplier}-${product}-${status}`;

            if (!acc[supplier]) {
                // 3. FIXED: Removed 'as any' here
                acc[supplier] = {
                    supplierName: supplier,
                    totalSupplierAmount: 0,
                    totalSupplierMissing: 0,
                    totalSupplierReceipt: 0,
                    itemsMap: {}
                };
            }

            if (!acc[supplier].itemsMap[itemKey]) {
                acc[supplier].itemsMap[itemKey] = {
                    name: product,
                    brand: order.brandName || "Unknown Brand",
                    uom: order.unitOfMeasurement || "UNIT",
                    status: status,
                    receiptQty: 0,
                    missingQty: 0,
                    totalAmount: 0,
                    customers: {}
                };
            }

            if (!acc[supplier].itemsMap[itemKey].customers[customer]) {
                acc[supplier].itemsMap[itemKey].customers[customer] = {
                    customerName: customer,
                    missingQty: 0,
                    receiptQty: 0
                };
            }

            const prodRow = acc[supplier].itemsMap[itemKey];

            prodRow.receiptQty += (order.receiptQty || 0);
            prodRow.missingQty += order.missingQty;
            prodRow.totalAmount += (order.totalAmount || 0);

            prodRow.customers[customer].missingQty += order.missingQty;
            prodRow.customers[customer].receiptQty += (order.receiptQty || 0);

            acc[supplier].totalSupplierAmount += (order.totalAmount || 0);
            acc[supplier].totalSupplierMissing += order.missingQty;
            acc[supplier].totalSupplierReceipt += (order.receiptQty || 0);

            return acc;
        }, {});

        // 4. FIXED: Provided strict types for the map and sort callbacks
        return Object.values(grouped).map((supplier: IntermediateSupplierGroup): SupplierGroup => ({
            supplierName: supplier.supplierName,
            totalSupplierAmount: supplier.totalSupplierAmount,
            totalSupplierMissing: supplier.totalSupplierMissing,
            totalSupplierReceipt: supplier.totalSupplierReceipt,
            items: Object.values(supplier.itemsMap).sort((a: ProductVarianceRow, b: ProductVarianceRow) => b.totalAmount - a.totalAmount)
        })).sort((a: SupplierGroup, b: SupplierGroup) => b.totalSupplierAmount - a.totalSupplierAmount);

    }, [data, searchTerm]);

    if (isLoading) {
        return (
            <Card className="shadow-sm border animate-pulse">
                <CardContent className="h-[400px] flex items-center justify-center text-muted-foreground font-medium">
                    Analyzing supplier dependencies...
                </CardContent>
            </Card>
        );
    }

    return (
        <Card
            className="shadow-sm border flex flex-col h-full max-h-[700px] overflow-hidden bg-card text-card-foreground">
            {/* Header Area */}
            <CardHeader className="bg-muted/50 border-b pb-4 shrink-0">
                <div className="flex justify-between items-center mb-3">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-primary"/>
                        Supplier Variance Impact
                    </CardTitle>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                    <Input
                        type="text"
                        placeholder="Filter by Supplier or Product..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 h-9 text-xs bg-background"
                    />
                </div>
            </CardHeader>

            <CardContent className="p-0 overflow-auto flex-1 relative">
                {topSuppliers.length === 0 ? (
                    <div className="p-12 text-center text-sm text-muted-foreground">
                        {searchTerm ? "No matches found." : "No supplier variance data available."}
                    </div>
                ) : (
                    <div className="flex flex-col pb-4">
                        {topSuppliers.map((group, sIdx) => (
                            <div key={`supp-${sIdx}`} className="mb-4 border-b last:border-0 pb-2">
                                {/* Supplier Header */}
                                <div
                                    className="bg-muted/90 px-4 py-2.5 flex justify-between items-center sticky top-0 z-20 backdrop-blur-md shadow-sm border-b">
                                    <div className="flex items-center gap-2">
                                        <Truck className="h-4 w-4 text-muted-foreground"/>
                                        <span className="text-xs font-black text-foreground uppercase tracking-widest">
                                            {group.supplierName}
                                        </span>
                                    </div>
                                    <div className="text-right flex flex-col items-end">
                                        <span
                                            className="text-[10px] font-bold text-red-700 bg-red-100/80 dark:bg-red-900/30 dark:text-red-400 px-2 py-0.5 rounded border border-red-200 dark:border-red-900/50 block mb-0.5">
                                            ₱{group.totalSupplierAmount.toLocaleString(undefined, {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2
                                        })}
                                        </span>
                                        <span className="text-[9px] text-muted-foreground font-semibold">
                                            {group.totalSupplierMissing} / {group.totalSupplierReceipt} MISSING
                                        </span>
                                    </div>
                                </div>

                                {/* Products inside Supplier */}
                                <ul className="divide-y divide-border">
                                    {group.items.map((item) => {
                                        const uiKey = `${group.supplierName}-${item.name}-${item.status}`;
                                        const isExpanded = !!expandedItemKeys[uiKey];
                                        const customers = Object.values(item.customers).sort((a, b) => b.missingQty - a.missingQty);

                                        return (
                                            <li key={uiKey} className="flex flex-col">
                                                <button
                                                    onClick={() => toggleExpand(uiKey)}
                                                    className="p-4 hover:bg-accent hover:text-accent-foreground transition-colors text-left flex justify-between items-start w-full focus:outline-none"
                                                >
                                                    <div className="flex gap-2 pr-4 flex-1">
                                                        <div className="mt-0.5 text-muted-foreground shrink-0">
                                                            {isExpanded ? <ChevronDown className="h-4 w-4"/> :
                                                                <ChevronRight className="h-4 w-4"/>}
                                                        </div>
                                                        <div className="space-y-1.5 flex-1">
                                                            <div>
                                                                <p className="text-sm font-bold text-foreground leading-tight">{item.name}</p>
                                                                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mt-0.5">{item.brand}</p>
                                                            </div>
                                                            <div className="inline-block">
                                                                <span
                                                                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider border ${
                                                                        item.status.includes('Concern')
                                                                            ? 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-900/50'
                                                                            : 'bg-red-50 text-red-600 border-red-100 dark:bg-destructive/10 dark:text-destructive dark:border-destructive/20'
                                                                    }`}>
                                                                    {item.status}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Quantities & Amount */}
                                                    <div className="text-right shrink-0">
                                                        <p className="text-[13px] font-black text-foreground">
                                                            ₱{item.totalAmount.toLocaleString(undefined, {
                                                            minimumFractionDigits: 2,
                                                            maximumFractionDigits: 2
                                                        })}
                                                        </p>
                                                        <div className="flex flex-col items-end mt-1">
                                                            <p className="text-xs font-semibold">
                                                                <span
                                                                    className="text-destructive">{item.missingQty}</span>
                                                                <span className="text-muted-foreground mx-1">/</span>
                                                                <span
                                                                    className="text-foreground">{item.receiptQty}</span>
                                                            </p>
                                                            <p className="text-[9px] uppercase text-muted-foreground tracking-wider">
                                                                {item.uom} MISSING
                                                            </p>
                                                        </div>
                                                    </div>
                                                </button>

                                                {/* EXPANDABLE CUSTOMER BREAKDOWN */}
                                                {isExpanded && (
                                                    <div
                                                        className="bg-muted/30 border-t p-3 pl-10 animate-in slide-in-from-top-2 duration-200 shadow-inner">
                                                        <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Affected
                                                            Customers</p>
                                                        <ul className="space-y-1.5">
                                                            {customers.map((c, cIdx) => (
                                                                <li key={cIdx}
                                                                    className="flex justify-between items-center bg-card p-2 rounded border shadow-sm hover:border-border/80 transition-colors">
                                                                    <div className="flex items-center gap-2">
                                                                        <UserCircle
                                                                            className="h-3.5 w-3.5 text-primary/70"/>
                                                                        <span
                                                                            className="text-xs font-semibold text-foreground">{c.customerName}</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-1.5">
                                                                        {c.receiptQty > 0 && (
                                                                            <span
                                                                                className="text-[10px] font-bold text-amber-700 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-900/50">
                                                                                {c.receiptQty} Returned
                                                                            </span>
                                                                        )}
                                                                        {c.missingQty > 0 && (
                                                                            <span
                                                                                className="text-[10px] font-bold text-red-600 bg-red-50 dark:bg-destructive/10 dark:text-destructive px-1.5 py-0.5 rounded border border-red-100 dark:border-destructive/20">
                                                                                {c.missingQty} Missing
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};