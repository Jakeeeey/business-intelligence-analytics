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
import { Button } from "@/components/ui/button";
import {
    Store,
    User,
    MapPin,
    Calendar,
    FileText,
    ExternalLink,
    Copy,
    Check,
    Sparkles,
    Phone,
    Mail,
} from "lucide-react";
import { NewCustomerItem } from "../types";

interface NewCustomerDetailModalProps {
    customer: NewCustomerItem | null;
    open: boolean;
    onClose: () => void;
}

export const NewCustomerDetailModal: React.FC<NewCustomerDetailModalProps> = ({
    customer,
    open,
    onClose,
}) => {
    const [copiedKey, setCopiedKey] = useState<string | null>(null);

    if (!customer) return null;

    const handleCopy = (text: string, key: string) => {
        if (!text || text === "-") return;
        navigator.clipboard.writeText(text);
        setCopiedKey(key);
        setTimeout(() => setCopiedKey(null), 1500);
    };

    // Google Maps link URL
    const hasCoordinates = customer.latitude && customer.longitude;
    const mapUrl = hasCoordinates
        ? `https://www.google.com/maps/search/?api=1&query=${customer.latitude},${customer.longitude}`
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(customer.location)}`;

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card text-card-foreground border-border shadow-xl">
                <DialogHeader className="space-y-2 pb-3 border-b border-border">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                                <DialogTitle className="text-xl font-bold text-foreground">
                                    {customer.storeName}
                                </DialogTitle>
                                {customer.isRecent && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                        <Sparkles className="h-3 w-3" />
                                        {customer.recencyLabel}
                                    </span>
                                )}
                            </div>
                            <DialogDescription className="text-xs text-muted-foreground">
                                Customer Account Details and Registration Data
                            </DialogDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge
                                variant="outline"
                                className="font-mono text-xs border-border flex items-center gap-1 cursor-pointer hover:bg-muted"
                                onClick={() => handleCopy(customer.customerCode, "modal-code")}
                                title="Click to copy code"
                            >
                                <span>{customer.customerCode}</span>
                                {copiedKey === "modal-code" ? (
                                    <Check className="h-3 w-3 text-emerald-500" />
                                ) : (
                                    <Copy className="h-3 w-3 text-muted-foreground" />
                                )}
                            </Badge>
                            {customer.isActive ? (
                                <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-0 text-xs">
                                    Active
                                </Badge>
                            ) : (
                                <Badge variant="outline" className="text-muted-foreground border-border text-xs">
                                    Inactive
                                </Badge>
                            )}
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-4 py-2 text-sm">
                    {/* Primary Info Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Card className="border-border bg-muted/20">
                            <CardContent className="p-3 space-y-2">
                                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase">
                                    <Store className="h-4 w-4 text-primary" /> Store Information
                                </div>
                                <div className="space-y-1 text-xs">
                                    <p className="text-muted-foreground">
                                        Signage: <span className="font-medium text-foreground">{customer.storeSignage || "-"}</span>
                                    </p>
                                    <p className="text-muted-foreground">
                                        Store Type: <span className="font-medium text-foreground">{customer.storeType}</span>
                                    </p>
                                    <p className="text-muted-foreground">
                                        Account Type: <span className="font-medium text-foreground">{customer.type}</span>
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-border bg-muted/20">
                            <CardContent className="p-3 space-y-2">
                                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase">
                                    <User className="h-4 w-4 text-primary" /> Customer & Salesman
                                </div>
                                <div className="space-y-1 text-xs">
                                    <p className="text-muted-foreground">
                                        Owner/Contact: <span className="font-medium text-foreground">{customer.customerName}</span>
                                    </p>
                                    <p className="text-muted-foreground">
                                        Sales Rep: <span className="font-medium text-foreground">{customer.salesmanName}</span>
                                    </p>
                                    <p className="text-muted-foreground">
                                        Prospect Status: <span className="font-medium text-foreground capitalize">{customer.prospectStatus}</span>
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Location & Contacts */}
                    <Card className="border-border bg-background">
                        <CardContent className="p-4 space-y-3">
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase">
                                    <MapPin className="h-4 w-4 text-primary" /> Address & Contact Details
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 text-xs gap-1 text-primary border-primary/30 hover:bg-primary/10"
                                    onClick={() => window.open(mapUrl, "_blank", "noopener,noreferrer")}
                                >
                                    <ExternalLink className="h-3 w-3" />
                                    <span>Google Maps</span>
                                </Button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                <div className="space-y-1">
                                    <span className="text-muted-foreground">Complete Address:</span>
                                    <div className="flex items-center gap-1.5 font-medium text-foreground">
                                        <span>{customer.location}</span>
                                        <button
                                            type="button"
                                            onClick={() => handleCopy(customer.location, "modal-loc")}
                                            className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground shrink-0"
                                            title="Copy address"
                                        >
                                            {copiedKey === "modal-loc" ? (
                                                <Check className="h-3 w-3 text-emerald-500" />
                                            ) : (
                                                <Copy className="h-3 w-3" />
                                            )}
                                        </button>
                                    </div>
                                    {hasCoordinates && (
                                        <p className="text-[11px] text-muted-foreground font-mono">
                                            Coords: {customer.latitude}, {customer.longitude}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-1">
                                    <span className="text-muted-foreground">Contact Number:</span>
                                    <div className="flex items-center gap-1.5 font-medium text-foreground font-mono">
                                        <Phone className="h-3 w-3 text-muted-foreground" />
                                        <span>{customer.contactNumber}</span>
                                        {customer.contactNumber !== "-" && (
                                            <button
                                                type="button"
                                                onClick={() => handleCopy(customer.contactNumber, "modal-phone")}
                                                className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground"
                                                title="Copy phone"
                                            >
                                                {copiedKey === "modal-phone" ? (
                                                    <Check className="h-3 w-3 text-emerald-500" />
                                                ) : (
                                                    <Copy className="h-3 w-3" />
                                                )}
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <span className="text-muted-foreground">Email:</span>
                                    <div className="flex items-center gap-1.5 font-medium text-foreground">
                                        <Mail className="h-3 w-3 text-muted-foreground" />
                                        <span>{customer.customerEmail}</span>
                                        {customer.customerEmail !== "-" && (
                                            <button
                                                type="button"
                                                onClick={() => handleCopy(customer.customerEmail, "modal-email")}
                                                className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground"
                                                title="Copy email"
                                            >
                                                {copiedKey === "modal-email" ? (
                                                    <Check className="h-3 w-3 text-emerald-500" />
                                                ) : (
                                                    <Copy className="h-3 w-3" />
                                                )}
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <span className="text-muted-foreground">Registration Date:</span>
                                    <p className="font-medium text-foreground flex items-center gap-1">
                                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                        {customer.dateEntered || "Not recorded"}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Tax & Commercial Details */}
                    <Card className="border-border bg-background">
                        <CardContent className="p-4 space-y-3">
                            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase">
                                <FileText className="h-4 w-4 text-primary" /> Billing & Tax Classification
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                                <div>
                                    <span className="text-muted-foreground">Customer TIN:</span>
                                    <div className="flex items-center gap-1 font-medium text-foreground font-mono mt-0.5">
                                        <span>{customer.customerTin}</span>
                                        {customer.customerTin !== "-" && (
                                            <button
                                                type="button"
                                                onClick={() => handleCopy(customer.customerTin, "modal-tin")}
                                                className="p-0.5 hover:bg-muted rounded text-muted-foreground hover:text-foreground"
                                                title="Copy TIN"
                                            >
                                                {copiedKey === "modal-tin" ? (
                                                    <Check className="h-3 w-3 text-emerald-500" />
                                                ) : (
                                                    <Copy className="h-3 w-3" />
                                                )}
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Price Type:</span>
                                    <p className="font-medium text-foreground mt-0.5">{customer.priceType}</p>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">VAT Registered:</span>
                                    <p className="font-medium text-foreground mt-0.5">{customer.isVAT ? "Yes" : "No"}</p>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">EWT Applied:</span>
                                    <p className="font-medium text-foreground mt-0.5">{customer.isEWT ? "Yes" : "No"}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </DialogContent>
        </Dialog>
    );
};
