"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingBag, RotateCcw, TrendingUp } from "lucide-react";
import { CustomerSalesSummary } from "../types/customer-annual-sales.schema";
import { formatCurrency } from "../utils/customer-annual-sales.utils";

interface CustomerAnnualSalesKPICardsProps {
  summary: CustomerSalesSummary;
  isLoading: boolean;
  unitName?: string;
}

export function CustomerAnnualSalesKPICards({
  summary,
  isLoading,
  unitName,
}: CustomerAnnualSalesKPICardsProps) {
  const normUnit = unitName?.toLowerCase();
  const isUnitQty = normUnit === "pieces" || normUnit === "box";

  const cards = [
    {
      title: isUnitQty ? "Total Sold Quantity" : "Total Sales Orders",
      value: isUnitQty
        ? summary.totalSoldQuantity.toLocaleString()
        : formatCurrency(summary.totalSoldAmount),
      description: "Total sales order volume",
      icon: ShoppingBag,
      iconColor: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
    },
    {
      title: isUnitQty ? "Total Returned Quantity" : "Total Returns",
      value: isUnitQty
        ? summary.totalReturnedQuantity.toLocaleString()
        : formatCurrency(summary.totalReturnedAmount),
      description: "Sales returns and credits",
      icon: RotateCcw,
      iconColor: "text-rose-500",
      bgColor: "bg-rose-500/10",
    },
    {
      title: "Net Sales (Variance)",
      value: isUnitQty
        ? (summary.totalSoldQuantity - summary.totalReturnedQuantity).toLocaleString()
        : formatCurrency(summary.totalNetAmount),
      description: "Gross orders minus returns",
      icon: TrendingUp,
      iconColor: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="border-border bg-card">
            <CardContent className="p-6">
              <Skeleton className="h-4 w-28 mb-3" />
              <Skeleton className="h-8 w-36 mb-2" />
              <Skeleton className="h-3 w-44" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {cards.map((card, i) => {
        const Icon = card.icon;
        return (
          <Card
            key={i}
            className="border-border bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow"
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between space-y-0 pb-2">
                <span className="text-sm font-medium text-muted-foreground">
                  {card.title}
                </span>
                <div className={`p-2 rounded-lg ${card.bgColor}`}>
                  <Icon className={`h-4 w-4 ${card.iconColor}`} />
                </div>
              </div>
              <div className="text-2xl font-bold tracking-tight mt-1">
                {card.value}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {card.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
