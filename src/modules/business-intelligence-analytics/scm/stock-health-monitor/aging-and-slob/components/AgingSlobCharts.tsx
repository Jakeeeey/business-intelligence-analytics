"use client";

import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SlobAging } from "../../types/stock-health.schema";

interface AgingSlobChartsProps {
  data: SlobAging[];
}

export function AgingSlobCharts({ data }: AgingSlobChartsProps) {
  // Aging Summary Data (Healthy vs >60 Days)
  const slobCount = data.filter((item) => item.isSlob === 1).length;
  const healthyCount = data.length - slobCount;

  const chartData = [
    { name: ">60 Days", value: slobCount, color: "hsl(var(--destructive))" },
    { name: "Healthy", value: healthyCount, color: "hsl(var(--emerald-600))" },
  ];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-sm font-medium">Aging & SLOB Overview</CardTitle>
        <CardDescription>Comparison of Healthy items vs Slow-Moving items (&gt;60 Days Idle)</CardDescription>
      </CardHeader>
      <CardContent className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={5}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ 
                borderRadius: '8px', 
                border: '1px solid hsl(var(--border))',
                backgroundColor: 'hsl(var(--popover))',
                color: 'hsl(var(--popover-foreground))'
              }}
              itemStyle={{ fontSize: '12px', color: 'hsl(var(--popover-foreground))' }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex justify-center gap-8 text-sm font-medium -mt-4">
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-full bg-destructive" />
            <span>SLOB / &gt;60 Days ({slobCount})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-full bg-emerald-600" />
            <span>Healthy ({healthyCount})</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
