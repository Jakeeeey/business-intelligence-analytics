"use client";

import React, { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Building2,
    Calendar,
    Copy,
    Check,
    PackageCheck,
} from "lucide-react";
import { PurchaseOrderItem } from "../types";

interface PurchaseOrderDetailModalProps {
    po: PurchaseOrderItem | null;
    open: boolean;
    onClose: () => void;
}

function formatCurrency(val: number): string {
    return new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
        maximumFractionDigits: 2,
    }).format(val);
}

export const PurchaseOrderDetailModal: React.FC<PurchaseOrderDetailModalProps> = ({
    po,
    open,
    onClose,
}) => {
    const [copiedKey, setCopiedKey] = useState<string | null>(null);

    if (!po) return null;

    const handleCopy = (text: string, key: string) => {
        if (!text || text === "—") return;
        navigator.clipboard.writeText(text);
        setCopiedKey(key);
        setTimeout(() => setCopiedKey(null), 1500);
    };

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-card text-card-foreground border-border shadow-xl">
                <DialogHeader className="space-y-1 pb-3 border-b border-border">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                            <div className="flex items-center gap-2">
                                <DialogTitle className="text-xl font-bold text-foreground">
                                    {po.purchaseOrderNo}
                                </DialogTitle>
                                {po.status === "FULLY_RECEIVED" ? (
                                    <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-0 text-xs font-semibold">
                                        Fully Received
                                    </Badge>
                                ) : po.status === "PARTIALLY_RECEIVED" ? (
                                    <Badge className="bg-blue-500/15 text-blue-600 dark:text-blue-400 border-0 text-xs font-semibold">
                                        Partially Received ({po.fulfillmentRate.toFixed(0)}%)
                                    </Badge>
                                ) : (
                                    <Badge variant="outline" className="text-amber-600 dark:text-amber-400 border-amber-500/30 text-xs font-semibold">
                                        Pending
                                    </Badge>
                                )}
                            </div>
                            <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                                Purchase Order Breakdown & Delivery Receipts
                            </DialogDescription>
                        </div>
                        <Badge
                            variant="outline"
                            className="font-mono text-xs border-border flex items-center gap-1 cursor-pointer hover:bg-muted"
                            onClick={() => handleCopy(po.purchaseOrderNo, "modal-po")}
                            title="Click to copy PO #"
                        >
                            <span>{po.purchaseOrderNo}</span>
                            {copiedKey === "modal-po" ? (
                                <Check className="h-3 w-3 text-emerald-500" />
                            ) : (
                                <Copy className="h-3 w-3 text-muted-foreground" />
                            )}
                        </Badge>
                    </div>
                </DialogHeader>

                <div className="space-y-4 py-2 text-sm">
                    {/* Primary Info Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Card className="border-border bg-muted/20">
                            <CardContent className="p-3 space-y-2">
                                <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase">
                                    <Building2 className="h-3.5 w-3.5 text-primary" /> Vendor & Warehouse
                                </div>
                                <div className="space-y-1 text-xs">
                                    <p className="text-muted-foreground">
                                        Supplier: <span className="font-semibold text-foreground">{po.supplierName}</span>
                                    </p>
                                    <p className="text-muted-foreground">
                                        Branch: <span className="font-medium text-foreground">{po.branchName}</span>
                                    </p>
                                    <p className="text-muted-foreground">
                                        Price Type: <span className="font-medium text-foreground">{po.priceType}</span>
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-border bg-muted/20">
                            <CardContent className="p-3 space-y-2">
                                <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase">
                                    <Calendar className="h-3.5 w-3.5 text-primary" /> Order Timestamps & Reference
                                </div>
                                <div className="space-y-1 text-xs">
                                    <p className="text-muted-foreground">
                                        PO Date: <span className="font-medium text-foreground">{po.poDate}</span>
                                    </p>
                                    <p className="text-muted-foreground">
                                        Reference: <span className="font-medium text-foreground">{po.reference}</span>
                                    </p>
                                    {po.remark && po.remark !== "—" && (
                                        <p className="text-muted-foreground truncate" title={po.remark}>
                                            Remarks: <span className="font-medium text-foreground">{po.remark}</span>
                                        </p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Financial Summary */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-xl bg-muted/30 border border-border/50 text-xs">
                        <div>
                            <span className="text-muted-foreground">Gross Amount:</span>
                            <p className="font-mono font-semibold text-foreground mt-0.5">{formatCurrency(po.grossAmount)}</p>
                        </div>
                        <div>
                            <span className="text-muted-foreground">Total PO Value:</span>
                            <p className="font-mono font-bold text-foreground mt-0.5">{formatCurrency(po.totalAmount)}</p>
                        </div>
                        <div>
                            <span className="text-muted-foreground">Total Received:</span>
                            <p className="font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                                {formatCurrency(po.receivedAmount)}
                            </p>
                        </div>
                        <div>
                            <span className="text-muted-foreground">Pending Balance:</span>
                            <p className="font-mono font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                                {formatCurrency(po.pendingAmount)}
                            </p>
                        </div>
                    </div>

                    {/* Received Items Table from purchase_order_receiving */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                                <PackageCheck className="h-4 w-4 text-primary" />
                                Received Deliveries ({po.receivingItems.length})
                            </h4>
                        </div>

                        <div className="rounded-xl border border-border/70 overflow-hidden">
                            <Table>
                                <TableHeader className="bg-muted/40">
                                    <TableRow className="border-border/60">
                                        <TableHead className="font-bold text-xs">Product</TableHead>
                                        <TableHead className="font-bold text-xs">Batch / Expiry</TableHead>
                                        <TableHead className="font-bold text-xs">Receipt # / Date</TableHead>
                                        <TableHead className="text-right font-bold text-xs">Qty</TableHead>
                                        <TableHead className="text-right font-bold text-xs">Unit Price</TableHead>
                                        <TableHead className="text-right font-bold text-xs">Total</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {po.receivingItems.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-24 text-center text-muted-foreground text-xs">
                                                No deliveries have been received/posted for this purchase order yet.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        po.receivingItems.map((item) => (
                                            <TableRow key={item.id} className="border-border/40 text-xs">
                                                <TableCell className="font-medium text-foreground">
                                                    <div>
                                                        <p className="font-semibold">{item.productName}</p>
                                                        {item.productCode && item.productCode !== "—" && (
                                                            <p className="text-[11px] font-mono text-muted-foreground">
                                                                {item.productCode}
                                                            </p>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="font-mono text-muted-foreground">
                                                    <p>Batch: {item.batchNo}</p>
                                                    <p className="text-[11px]">Exp: {item.expiryDate}</p>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    <p className="font-mono">{item.receiptNo}</p>
                                                    <p className="text-[11px]">{item.receiptDate}</p>
                                                </TableCell>
                                                <TableCell className="text-right font-mono font-semibold">
                                                    {item.receivedQuantity.toLocaleString()}
                                                </TableCell>
                                                <TableCell className="text-right font-mono text-muted-foreground">
                                                    {formatCurrency(item.unitPrice)}
                                                </TableCell>
                                                <TableCell className="text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                                    {formatCurrency(item.totalAmount)}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
