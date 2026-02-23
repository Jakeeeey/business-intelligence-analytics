import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, ShoppingCart, ArrowDown, ArrowUp } from "lucide-react";
import { LeadTimeVarianceMetrics } from "../../utils/lead-time-variance.utils";

interface LeadTimeVarianceMetricsProps {
  metrics: LeadTimeVarianceMetrics;
}

export function LeadTimeVarianceMetricsCard({
  metrics,
}: LeadTimeVarianceMetricsProps) {
  const cards = [
    {
      title: "Avg. Lead Time",
      value: `${metrics.averageLeadTime.toFixed(1)} Days`,
      description: "Across selected range",
      icon: Clock,
      color: "text-blue-500",
    },
    {
      title: "Total POs",
      value: metrics.totalPOs.toLocaleString(),
      description: "Recorded transactions",
      icon: ShoppingCart,
      color: "text-green-500",
    },
    {
      title: "Min Lead Time",
      value: `${metrics.minLeadTime} Days`,
      description: "Fastest receipt",
      icon: ArrowDown,
      color: "text-orange-500",
    },
    {
      title: "Max Lead Time",
      value: `${metrics.maxLeadTime} Days`,
      description: "Slowest receipt",
      icon: ArrowUp,
      color: "text-red-500",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => (
        <Card key={index} className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            <card.icon className={`h-4 w-4 ${card.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {card.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
