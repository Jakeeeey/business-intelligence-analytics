// src/modules/business-intelligence-analytics/sales-report/product-sales-performance/components/OverviewTab.tsx
"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download,TrendingUp } from "lucide-react";
import type { RevenueByPeriod, TopItem } from "../types";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  Cell,
} from "recharts";

// Color palette for charts
  const chartColors = [
    "#3b82f6", // blue
    "#8b5cf6", // violet
    "#ec4899", // pink
    "#f97316", // orange
    "#22c55e", // green
    "#14b8a6", // teal
    "#eab308", // yellow
    "#ef4444", // red
    "#6366f1", // indigo
    "#06b6d4", // cyan
    "#84cc16", // lime
    "#a855f7", // purple
    "#f43f5e", // rose
    "#0ea5e9", // sky
    "#10b981", // emerald
    "#f59e0b", // amber
    "#64748b", // slate
    "#9333ea", // deep purple
    "#0891b2", // deep cyan
    "#dc2626", // strong red
  ];


type OverviewTabProps = {
  revenueByPeriod: RevenueByPeriod[];
  topProducts: TopItem[];
  topSuppliers: TopItem[];
};

export function OverviewTab({ revenueByPeriod, topProducts, topSuppliers }: OverviewTabProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const exportToCSV = (data: any[], filename: string) => {
    if (!data.length) return;

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(","),
      ...data.map((row) => headers.map((h) => row[h]).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const chartConfig = {
    revenue: {
      label: "Revenue",
      color: "hsl(var(--chart-1))",
    },
  };

  return (
    <div className="space-y-4">
      {/* Revenue Trend */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Revenue Trend Over Time</CardTitle>
              <CardDescription>Monthly revenue performance</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportToCSV(revenueByPeriod, "revenue-trend.csv")}
            >
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-75 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueByPeriod}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis tickFormatter={(value) => formatCurrency(value)} />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value) => formatCurrency(Number(value))}
                    />
                  }
                />
                
                <Line
                
                  type="linear"
                  dataKey="revenue"
                  stroke={chartColors[0]}
                  strokeWidth={3}
                  dot={{ 
                    r: 6,  
                    fill: chartColors[0],
                    stroke: "hsl(var(--primary))",
                    strokeWidth: 3
                  }}
                  activeDot={{ 
                    r: 8,
                    fill: chartColors[0],
                    stroke: "hsl(var(--primary))",
                    strokeWidth: 3
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Top 5 Products */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Top 10 Products by Revenue</CardTitle>
                <CardDescription>Highest performing products</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  exportToCSV(
                    topProducts.map((p) => ({
                      product: p.name,
                      revenue: p.revenue,
                      transactions: p.count,
                    })),
                    "top-products.csv"
                  )
                }
              >
                <Download className="mr-2 h-4 w-4" />
                CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                revenue: {
                  label: "Revenue",
                  color: "hsl(var(--chart-2))",
                },
              }}
              className="h-[300px] w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProducts.slice(0, 10)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tickFormatter={(value) => formatCurrency(value)} />
                  <YAxis dataKey="name" type="category" width={120} />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value) => formatCurrency(Number(value))}
                      />
                    }
                  />
                  <Bar dataKey="revenue" radius={[0, 4, 4, 0]}>
                    {topProducts.slice(0, 10).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Top 5 Suppliers */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Top 10 Suppliers by Revenue</CardTitle>
                <CardDescription>Leading supplier partnerships</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  exportToCSV(
                    topSuppliers.map((s) => ({
                      supplier: s.name,
                      revenue: s.revenue,
                      transactions: s.count,
                    })),
                    "top-suppliers.csv"
                  )
                }
              >
                <Download className="mr-2 h-4 w-4" />
                CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                revenue: {
                  label: "Revenue",
                  color: "hsl(var(--chart-3))",
                },
              }}
              className="h-[300px] w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topSuppliers.slice(0, 10)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tickFormatter={(value) => formatCurrency(value)} />
                  <YAxis dataKey="name" type="category" width={120} />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value) => formatCurrency(Number(value))}
                      />
                    }
                  />
                  <Bar dataKey="revenue" radius={[0, 4, 4, 0]}>
                    {topSuppliers.slice(0, 10).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
