"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, UserMinus, Percent } from "lucide-react";

type KpiCardsProps = {
  totalApproved: number;
  totalActivated: number;
  totalPending: number;
  activationRate: number;
};

export default function KpiCards({
  totalApproved,
  totalActivated,
  totalPending,
  activationRate,
}: KpiCardsProps) {
  const cards = [
    {
      title: "Total Approved Prospects",
      value: totalApproved,
      description: "Approved prospecting accounts",
      icon: Users,
      colorClass: "text-blue-500",
      bgColorClass: "bg-blue-500/10",
    },
    {
      title: "Activated Customers",
      value: totalActivated,
      description: "Converted to active customers",
      icon: UserCheck,
      colorClass: "text-green-500",
      bgColorClass: "bg-green-500/10",
    },
    {
      title: "Pending Activation",
      value: totalPending,
      description: "Awaiting customer table registration",
      icon: UserMinus,
      colorClass: "text-yellow-500",
      bgColorClass: "bg-yellow-500/10",
    },
    {
      title: "Activation Rate",
      value: `${activationRate.toFixed(1)}%`,
      description: "Prospect to customer conversion",
      icon: Percent,
      colorClass: "text-purple-500",
      bgColorClass: "bg-purple-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <Card key={idx} className="border shadow-xs hover:shadow-md transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
              <CardTitle className="text-xs font-bold tracking-wider uppercase text-muted-foreground">
                {card.title}
              </CardTitle>
              <div className={`p-1.5 rounded-lg ${card.bgColorClass}`}>
                <Icon className={`h-4 w-4 ${card.colorClass}`} />
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-black tracking-tight text-foreground">
                {card.value}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {card.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
