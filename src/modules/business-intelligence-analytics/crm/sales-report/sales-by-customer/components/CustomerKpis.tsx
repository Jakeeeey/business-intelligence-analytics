"use client";

import React from "react";
import { DollarSign, Users, Receipt, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { CustomerKpis as KpiType } from "../types";

interface CustomerKpisProps {
    kpis: KpiType;
}

export const CustomerKpis: React.FC<CustomerKpisProps> = ({ kpis }) => {
    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat("en-PH", {
            style: "currency",
            currency: "PHP",
            maximumFractionDigits: 2,
        }).format(val || 0);
    };

    const formatNumber = (val: number) => {
        return new Intl.NumberFormat("en-US").format(val || 0);
    };

    const cards = [
        {
            title: "Total Customer Sales",
            value: formatCurrency(kpis.totalSales),
            icon: DollarSign,
            description: "Net invoiced across customers",
            iconBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
        },
        {
            title: "Active Customers",
            value: formatNumber(kpis.totalCustomers),
            icon: Users,
            description: "Customers with transactions",
            iconBg: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
        },
        {
            title: "Avg Sales / Customer",
            value: formatCurrency(kpis.averageSalesPerCustomer),
            icon: TrendingUp,
            description: "Average contribution per account",
            iconBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
        },
        {
            title: "Total Transactions",
            value: formatNumber(kpis.totalTransactions),
            icon: Receipt,
            description: "Total invoice lines recorded",
            iconBg: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
        },
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {cards.map((card, idx) => {
                const Icon = card.icon;
                return (
                    <Card
                        key={idx}
                        className="relative overflow-hidden border border-border bg-card shadow-sm hover:shadow transition-shadow"
                    >
                        <CardContent className="p-5 flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    {card.title}
                                </p>
                                <div className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                                    {card.value}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {card.description}
                                </p>
                            </div>
                            <div className={`p-3 rounded-xl ${card.iconBg}`}>
                                <Icon className="h-5 w-5" />
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
};
