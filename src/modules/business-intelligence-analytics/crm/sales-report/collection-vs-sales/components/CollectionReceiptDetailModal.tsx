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
    Receipt,
    User,
    Calendar,
    CreditCard,
    FileText,
    Copy,
    Check,
} from "lucide-react";
import { CollectionReceiptItem } from "../types";

interface CollectionReceiptDetailModalProps {
    receipt: CollectionReceiptItem | null;
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

export const CollectionReceiptDetailModal: React.FC<CollectionReceiptDetailModalProps> = ({
    receipt,
    open,
    onClose,
}) => {
    const [copiedKey, setCopiedKey] = useState<string | null>(null);

    if (!receipt) return null;

    const handleCopy = (text: string, key: string) => {
        if (!text || text === "—") return;
        navigator.clipboard.writeText(text);
        setCopiedKey(key);
        setTimeout(() => setCopiedKey(null), 1500);
    };

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <DialogContent className="max-w-lg bg-card text-card-foreground border-border shadow-xl">
                <DialogHeader className="space-y-1 pb-3 border-b border-border">
                    <div className="flex items-center justify-between">
                        <div>
                            <DialogTitle className="text-xl font-bold text-foreground">
                                Collection Receipt
                            </DialogTitle>
                            <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                                Transaction details and payment verification
                            </DialogDescription>
                        </div>
                        <Badge
                            variant="outline"
                            className="font-mono text-xs border-border flex items-center gap-1 cursor-pointer hover:bg-muted"
                            onClick={() => handleCopy(receipt.receiptNo, "modal-receipt")}
                            title="Click to copy receipt #"
                        >
                            <span>{receipt.receiptNo !== "—" ? receipt.receiptNo : receipt.docNo}</span>
                            {copiedKey === "modal-receipt" ? (
                                <Check className="h-3 w-3 text-emerald-500" />
                            ) : (
                                <Copy className="h-3 w-3 text-muted-foreground" />
                            )}
                        </Badge>
                    </div>
                </DialogHeader>

                <div className="space-y-3.5 py-2 text-sm">
                    {/* Amount Banner */}
                    <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-0.5">
                        <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                            Collected Amount
                        </span>
                        <p className="text-3xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(receipt.amount)}
                        </p>
                    </div>

                    {/* Information Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Card className="border-border bg-muted/20">
                            <CardContent className="p-3 space-y-2">
                                <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase">
                                    <Receipt className="h-3.5 w-3.5 text-primary" /> Document Identifiers
                                </div>
                                <div className="space-y-1 text-xs">
                                    <p className="text-muted-foreground">
                                        Receipt #:{" "}
                                        <span className="font-mono font-bold text-foreground">{receipt.receiptNo}</span>
                                    </p>
                                    <p className="text-muted-foreground">
                                        Doc #:{" "}
                                        <span className="font-mono font-medium text-foreground">{receipt.docNo}</span>
                                    </p>
                                    <p className="text-muted-foreground flex items-center gap-1">
                                        <Calendar className="h-3 w-3" /> Date:{" "}
                                        <span className="font-medium text-foreground">{receipt.collectionDate}</span>
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-border bg-muted/20">
                            <CardContent className="p-3 space-y-2">
                                <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase">
                                    <User className="h-3.5 w-3.5 text-primary" /> Personnel
                                </div>
                                <div className="space-y-1 text-xs">
                                    <p className="text-muted-foreground">
                                        Sales Rep:{" "}
                                        <span className="font-medium text-foreground">{receipt.salesmanName}</span>
                                    </p>
                                    <p className="text-muted-foreground">
                                        Collected By:{" "}
                                        <span className="font-medium text-foreground">{receipt.collectedBy}</span>
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Financial Classification */}
                    <Card className="border-border bg-background">
                        <CardContent className="p-3.5 space-y-2">
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase">
                                <CreditCard className="h-3.5 w-3.5 text-primary" /> Payment Method & Classification
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <div>
                                    <span className="text-muted-foreground">Payment Mode:</span>
                                    <p className="font-semibold text-foreground mt-0.5">{receipt.paymentMethod}</p>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Account Classification:</span>
                                    <p className="font-semibold text-foreground mt-0.5">{receipt.accountTitle}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Remarks */}
                    {receipt.remarks && receipt.remarks !== "—" && (
                        <Card className="border-border bg-background">
                            <CardContent className="p-3.5 space-y-1 text-xs">
                                <div className="flex items-center gap-1.5 font-semibold text-muted-foreground uppercase">
                                    <FileText className="h-3.5 w-3.5 text-primary" /> Remarks
                                </div>
                                <p className="text-muted-foreground italic mt-1">{receipt.remarks}</p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};
