"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StockOutRisk } from "../../types/stock-health.schema";

interface StockOutRiskChartsProps {
  data: StockOutRisk[];
}

export function StockOutRiskCharts({ data }: StockOutRiskChartsProps) {
  // 1. Risk Summary Data (Critical vs Healthy)
  const criticalCount = data.filter((item) => item.isActionRequired === 1).length;
  const healthyCount = data.length - criticalCount;

  const summaryData = [
    { name: "Critical", value: criticalCount, color: "hsl(var(--destructive))" },
    { name: "Healthy", value: healthyCount, color: "hsl(var(--emerald-600))" },
  ];

  // 2. Urgency Breakdown Data (0-5, 6-10, 11-15 days)
  const buckets = [
    { range: "0-5 Days", count: 0, color: "hsl(var(--destructive))" },
    { range: "6-10 Days", count: 0, color: "#f97316" }, // orange-500
    { range: "11-15 Days", count: 0, color: "#eab308" }, // yellow-500
  ];

  data.forEach((item) => {
    const days = item.daysOfStockRemaining;
    if (days !== null) {
      if (days <= 5) buckets[0].count++;
      else if (days <= 10) buckets[1].count++;
      else if (days <= 15) buckets[2].count++;
    }
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Risk Summary Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Risk Status Overview</CardTitle>
          <CardDescription>Comparison of Critical vs Healthy products</CardDescription>
        </CardHeader>
        <CardContent className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={summaryData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {summaryData.map((entry, index) => (
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
          <div className="flex justify-center gap-4 text-xs font-medium -mt-4">
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-full bg-destructive" />
              <span>Critical ({criticalCount})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-full bg-emerald-600" />
              <span>Healthy ({healthyCount})</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Urgency Breakdown Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Critical Days Threshold (0-15 Days)</CardTitle>
          <CardDescription>Number of products by days remaining</CardDescription>
        </CardHeader>
        <CardContent className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={buckets}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="range" 
                fontSize={12} 
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false} 
                axisLine={false}
              />
              <YAxis 
                fontSize={12} 
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false} 
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip 
                cursor={{ fill: 'hsl(var(--muted)/0.2)' }}
                contentStyle={{ 
                  borderRadius: '8px', 
                  border: '1px solid hsl(var(--border))',
                  backgroundColor: 'hsl(var(--popover))',
                  color: 'hsl(var(--popover-foreground))'
                }}
                itemStyle={{ color: 'hsl(var(--popover-foreground))' }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={40}>
                {buckets.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
