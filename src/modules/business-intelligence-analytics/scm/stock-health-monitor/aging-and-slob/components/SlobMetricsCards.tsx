"use client";

import React from "react";
import { AlertCircle, CheckCircle2, TrendingDown, Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardDescription, CardTitle } from "@/components/ui/card";

interface SlobMetricsCardsProps {
  metrics: {
    slobInventoryValue: number;
    healthyInventoryValue: number;
    slobPercentage: number;
    totalInventoryValue: number;
    slobItemCount: number;
    totalItemCount: number;
  };
}

const formatPHP = (value: number) => {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(value);
};

export function SlobMetricsCards({ metrics }: SlobMetricsCardsProps) {
  const cards = [
    {
      title: "SLOB Inventory Value",
      value: formatPHP(metrics.slobInventoryValue),
      subtitle: `${metrics.slobItemCount} items with no movement >60 days`,
      icon: AlertCircle,
      iconColor: "text-orange-500",
      valueColor: "text-orange-600",
    },
    {
      title: "Healthy Inventory Value",
      value: formatPHP(metrics.healthyInventoryValue),
      subtitle: `${metrics.totalItemCount - metrics.slobItemCount} items with active movement`,
      icon: CheckCircle2,
      iconColor: "text-emerald-500",
      valueColor: "text-emerald-600",
    },
    {
      title: "SLOB Percentage",
      value: `${metrics.slobPercentage.toFixed(1)}%`,
      subtitle: "Out of total inventory value",
      icon: TrendingDown,
      iconColor: "text-muted-foreground",
      showProgress: true
    },
    {
      title: "Total Inventory Value",
      value: formatPHP(metrics.totalInventoryValue),
      subtitle: `${metrics.totalItemCount} total items`,
      icon: Package,
      iconColor: "text-blue-500",
      valueColor: "text-blue-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.title} className="bg-card shadow-sm border-muted/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardDescription className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardDescription>
              <Icon className={`h-4 w-4 ${card.iconColor}`} />
            </CardHeader>
            <CardContent>
              <CardTitle className={`text-2xl font-bold tabular-nums ${card.valueColor || "text-foreground"}`}>
                {card.value}
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                {card.subtitle}
              </p>
              {card.showProgress && (
                <div className="mt-3 h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-foreground transition-all duration-500" 
                    style={{ width: `${Math.min(100, metrics.slobPercentage)}%` }}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
