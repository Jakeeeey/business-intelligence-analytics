"use client";

import React, { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
    CustomerSummary,
    SupplierBreakdown,
    SalesmanBreakdown,
    CustomerTransactionRecord,
} from "../types";

interface CustomerDetailModalProps {
    customer: CustomerSummary | null;
    open: boolean;
    onClose: () => void;
    data: {
        suppliers: SupplierBreakdown[];
        salesmen: SalesmanBreakdown[];
        transactions: CustomerTransactionRecord[];
    };
}

export const CustomerDetailModal: React.FC<CustomerDetailModalProps> = ({
    customer,
    open,
    onClose,
    data,
}) => {
    const [activeTab, setActiveTab] = useState("suppliers");

    if (!customer) return null;

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat("en-PH", {
            style: "currency",
            currency: "PHP",
            maximumFractionDigits: 2,
        }).format(val || 0);
    };

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-card text-card-foreground border-border">
                <DialogHeader className="space-y-2 pb-2 border-b border-border">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                            <DialogTitle className="text-xl font-bold text-foreground">
                                {customer.customerName}
                            </DialogTitle>
                            <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                                Account breakdown and transaction details
                            </DialogDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs border-border">
                                {customer.customerCode || "No Code"}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                                {customer.storeType}
                            </Badge>
                            <Badge className="text-xs bg-primary/10 text-primary border-0">
                                {customer.divisionName}
                            </Badge>
                        </div>
                    </div>
                </DialogHeader>

                {/* Customer Metrics Overview */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-2">
                    <Card className="border-border bg-background shadow-none">
                        <CardContent className="p-4">
                            <p className="text-xs font-medium text-muted-foreground uppercase">
                                Total Invoiced Sales
                            </p>
                            <p className="text-lg font-bold text-foreground mt-1">
                                {formatCurrency(customer.totalSales)}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                                {customer.percentageShare.toFixed(2)}% of total filtered sales
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-border bg-background shadow-none">
                        <CardContent className="p-4">
                            <p className="text-xs font-medium text-muted-foreground uppercase">
                                Total Invoices
                            </p>
                            <p className="text-lg font-bold text-foreground mt-1">
                                {customer.transactionCount.toLocaleString()}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                                Recorded line transactions
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-border bg-background shadow-none">
                        <CardContent className="p-4">
                            <p className="text-xs font-medium text-muted-foreground uppercase">
                                Avg Order Value
                            </p>
                            <p className="text-lg font-bold text-foreground mt-1">
                                {formatCurrency(customer.averageOrderValue)}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                                Net sales per transaction
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Breakdown Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-2">
                    <TabsList className="grid w-full grid-cols-3 bg-muted">
                        <TabsTrigger value="suppliers" className="text-xs font-medium">
                            Suppliers ({data.suppliers.length})
                        </TabsTrigger>
                        <TabsTrigger value="salesmen" className="text-xs font-medium">
                            Salesmen ({data.salesmen.length})
                        </TabsTrigger>
                        <TabsTrigger value="transactions" className="text-xs font-medium">
                            Transactions ({data.transactions.length})
                        </TabsTrigger>
                    </TabsList>

                    {/* Suppliers Tab */}
                    <TabsContent value="suppliers" className="mt-3">
                        <div className="rounded-lg border border-border overflow-hidden">
                            <Table>
                                <TableHeader className="bg-muted/40">
                                    <TableRow className="border-border">
                                        <TableHead className="font-bold text-xs uppercase text-muted-foreground">
                                            Supplier
                                        </TableHead>
                                        <TableHead className="text-right font-bold text-xs uppercase text-muted-foreground">
                                            Transactions
                                        </TableHead>
                                        <TableHead className="text-right font-bold text-xs uppercase text-muted-foreground">
                                            Sales (PHP)
                                        </TableHead>
                                        <TableHead className="text-right font-bold text-xs uppercase text-muted-foreground">
                                            Share (%)
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.suppliers.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center text-sm py-4 text-muted-foreground">
                                                No supplier data found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        data.suppliers.map((s, idx) => (
                                            <TableRow key={idx} className="border-border">
                                                <TableCell className="font-medium text-xs text-foreground">
                                                    {s.supplierName}
                                                </TableCell>
                                                <TableCell className="text-right text-xs text-muted-foreground">
                                                    {s.transactionCount.toLocaleString()}
                                                </TableCell>
                                                <TableCell className="text-right font-semibold text-xs text-foreground">
                                                    {formatCurrency(s.totalSales)}
                                                </TableCell>
                                                <TableCell className="text-right text-xs font-medium text-primary">
                                                    {s.percentage.toFixed(2)}%
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </TabsContent>

                    {/* Salesmen Tab */}
                    <TabsContent value="salesmen" className="mt-3">
                        <div className="rounded-lg border border-border overflow-hidden">
                            <Table>
                                <TableHeader className="bg-muted/40">
                                    <TableRow className="border-border">
                                        <TableHead className="font-bold text-xs uppercase text-muted-foreground">
                                            Salesman
                                        </TableHead>
                                        <TableHead className="text-right font-bold text-xs uppercase text-muted-foreground">
                                            Transactions
                                        </TableHead>
                                        <TableHead className="text-right font-bold text-xs uppercase text-muted-foreground">
                                            Sales (PHP)
                                        </TableHead>
                                        <TableHead className="text-right font-bold text-xs uppercase text-muted-foreground">
                                            Share (%)
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.salesmen.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center text-sm py-4 text-muted-foreground">
                                                No salesman data found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        data.salesmen.map((s, idx) => (
                                            <TableRow key={idx} className="border-border">
                                                <TableCell className="font-medium text-xs text-foreground">
                                                    {s.salesmanName}
                                                </TableCell>
                                                <TableCell className="text-right text-xs text-muted-foreground">
                                                    {s.transactionCount.toLocaleString()}
                                                </TableCell>
                                                <TableCell className="text-right font-semibold text-xs text-foreground">
                                                    {formatCurrency(s.totalSales)}
                                                </TableCell>
                                                <TableCell className="text-right text-xs font-medium text-primary">
                                                    {s.percentage.toFixed(2)}%
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </TabsContent>

                    {/* Transactions Tab */}
                    <TabsContent value="transactions" className="mt-3">
                        <div className="rounded-lg border border-border max-h-72 overflow-y-auto">
                            <Table>
                                <TableHeader className="bg-muted/40 sticky top-0 z-10">
                                    <TableRow className="border-border">
                                        <TableHead className="font-bold text-xs uppercase text-muted-foreground">
                                            Date
                                        </TableHead>
                                        <TableHead className="font-bold text-xs uppercase text-muted-foreground">
                                            Division
                                        </TableHead>
                                        <TableHead className="font-bold text-xs uppercase text-muted-foreground">
                                            Supplier
                                        </TableHead>
                                        <TableHead className="font-bold text-xs uppercase text-muted-foreground">
                                            Salesman
                                        </TableHead>
                                        <TableHead className="text-right font-bold text-xs uppercase text-muted-foreground">
                                            Amount (PHP)
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.transactions.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center text-sm py-4 text-muted-foreground">
                                                No transactions recorded.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        data.transactions.slice(0, 100).map((t, idx) => (
                                            <TableRow key={idx} className="border-border">
                                                <TableCell className="text-xs font-mono text-muted-foreground">
                                                    {t.transactionDate}
                                                </TableCell>
                                                <TableCell className="text-xs text-foreground">
                                                    {t.divisionName}
                                                </TableCell>
                                                <TableCell className="text-xs text-foreground">
                                                    {t.supplierName}
                                                </TableCell>
                                                <TableCell className="text-xs text-foreground">
                                                    {t.salesmanName}
                                                </TableCell>
                                                <TableCell className="text-right font-semibold text-xs text-foreground">
                                                    {formatCurrency(t.netAmount)}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                        {data.transactions.length > 100 && (
                            <p className="text-[11px] text-muted-foreground text-center mt-2">
                                Showing latest 100 transactions of {data.transactions.length}
                            </p>
                        )}
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
};
