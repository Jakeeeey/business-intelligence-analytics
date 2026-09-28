"use client";

import React from "react";
import { Store, MapPin, Phone, ArrowRight, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NewCustomerItem } from "../types";

interface NewCustomerGridProps {
    data: NewCustomerItem[];
    onSelectCustomer: (customer: NewCustomerItem) => void;
    loading: boolean;
}

function getAvatarColor(name: string): string {
    const colors = [
        "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
        "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
        "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30",
        "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
        "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30",
        "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/30",
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
}

function getInitials(name: string): string {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
}

export const NewCustomerGrid: React.FC<NewCustomerGridProps> = ({
    data,
    onSelectCustomer,
    loading,
}) => {
    if (data.length === 0) {
        return (
            <Card className="border-border bg-card">
                <CardContent className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground text-sm">
                    {loading ? "Loading customer profiles..." : "No customer accounts found matching your filters."}
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.map((item) => {
                const colorClass = getAvatarColor(item.storeName);
                const initials = getInitials(item.storeName);

                return (
                    <Card
                        key={item.id}
                        className="group relative overflow-hidden border border-border/70 bg-card hover:border-primary/40 hover:shadow-md transition-all cursor-pointer"
                        onClick={() => onSelectCustomer(item)}
                    >
                        <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
                            {/* Top row: Avatar + Store Name & Status */}
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <div
                                        className={`h-11 w-11 rounded-xl flex items-center justify-center font-bold text-sm border shrink-0 ${colorClass}`}
                                    >
                                        {initials}
                                    </div>
                                    <div className="min-w-0">
                                        <h3
                                            className="font-bold text-sm text-foreground truncate group-hover:text-primary transition-colors"
                                            title={item.storeName}
                                        >
                                            {item.storeName}
                                        </h3>
                                        <p className="text-xs text-muted-foreground font-mono flex items-center gap-1">
                                            <span>{item.customerCode}</span>
                                            {item.storeSignage && item.storeSignage !== "-" && (
                                                <>
                                                    <span>•</span>
                                                    <span className="truncate max-w-[110px]">{item.storeSignage}</span>
                                                </>
                                            )}
                                        </p>
                                    </div>
                                </div>

                                <div className="shrink-0">
                                    {item.isActive ? (
                                        <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-0 text-[11px] font-semibold flex items-center gap-1.5">
                                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                            Active
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline" className="text-muted-foreground border-border text-[11px]">
                                            Inactive
                                        </Badge>
                                    )}
                                </div>
                            </div>

                            {/* Middle details: Owner, Location, Contact */}
                            <div className="space-y-1.5 text-xs text-muted-foreground border-t border-border/40 pt-3">
                                <div className="flex items-center gap-2">
                                    <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                    <span className="truncate font-medium text-foreground">
                                        {item.customerName}
                                    </span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                    <span className="truncate" title={item.location}>
                                        {item.location}
                                    </span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                    <span className="font-mono">{item.contactNumber}</span>
                                </div>
                            </div>

                            {/* Footer: Store Type Badge & Action */}
                            <div className="flex items-center justify-between pt-2 border-t border-border/40">
                                <Badge variant="secondary" className="text-[11px] font-medium">
                                    <Store className="h-3 w-3 mr-1" />
                                    {item.storeType}
                                </Badge>

                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-xs gap-1 text-primary group-hover:translate-x-0.5 transition-transform"
                                >
                                    <span>Details</span>
                                    <ArrowRight className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
};
