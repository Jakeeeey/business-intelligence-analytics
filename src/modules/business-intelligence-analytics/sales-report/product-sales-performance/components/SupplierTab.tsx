// src/modules/business-intelligence-analytics/sales-report/product-sales-performance/components/SupplierTab.tsx
"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, Search, ChevronDown, ChevronUp } from "lucide-react";
import type { SupplierPerformance, TopItem } from "../types";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
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

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

type SupplierTabProps = {
  supplierPerformance: SupplierPerformance[];
  topSuppliers: TopItem[];
};

export function SupplierTab({ supplierPerformance, topSuppliers }: SupplierTabProps) {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [expandedSuppliers, setExpandedSuppliers] = React.useState<Set<string>>(new Set());

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

  const filteredSuppliers = React.useMemo(() => {
    if (!searchTerm) return supplierPerformance;
    return supplierPerformance.filter((s) =>
      s.supplier.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [supplierPerformance, searchTerm]);

  const toggleSupplier = (supplier: string) => {
    setExpandedSuppliers((prev) => {
      const next = new Set(prev);
      if (next.has(supplier)) {
        next.delete(supplier);
      } else {
        next.add(supplier);
      }
      return next;
    });
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search suppliers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Top Suppliers Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Top 10 Suppliers by Revenue</CardTitle>
              <CardDescription>Supplier revenue comparison</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                exportToCSV(
                  topSuppliers.map((s, i) => ({
                    rank: i + 1,
                    supplier: s.name,
                    revenue: s.revenue,
                    transactions: s.count,
                  })),
                  "top-suppliers.csv"
                )
              }
            >
              <Download className="mr-2 h-4 w-4" />
              Export CSV
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
            className="h-87.5 w-full"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topSuppliers.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis tickFormatter={(value) => formatCurrency(value)} />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value) => formatCurrency(Number(value))}
                    />
                  }
                />
                <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                  {topSuppliers.slice(0, 10).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Supplier Performance with Product Breakdown */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Supplier Performance Details</CardTitle>
              <CardDescription>
                {filteredSuppliers.length} suppliers with product breakdown
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const flatData = filteredSuppliers.flatMap((s) =>
                  s.products.map((p) => ({
                    supplier: s.supplier,
                    product: p.name,
                    productRevenue: p.revenue,
                    supplierTotalRevenue: s.revenue,
                  }))
                );
                exportToCSV(flatData, "supplier-products.csv");
              }}
            >
              <Download className="mr-2 h-4 w-4" />
              Export All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {filteredSuppliers.length > 0 ? (
              filteredSuppliers.map((supplier, index) => (
                <Collapsible
                  key={supplier.supplier}
                  open={expandedSuppliers.has(supplier.supplier)}
                  onOpenChange={() => toggleSupplier(supplier.supplier)}
                >
                  <Card>
                    <CollapsibleTrigger className="w-full">
                      <CardContent className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-4">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                            {index + 1}
                          </div>
                          <div className="text-left">
                            <div className="font-semibold">{supplier.supplier}</div>
                            <div className="text-sm text-muted-foreground">
                              {supplier.products.length} products
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-lg font-bold">
                              {formatCurrency(supplier.revenue)}
                            </div>
                            <div className="text-sm text-muted-foreground">Total Revenue</div>
                          </div>
                          {expandedSuppliers.has(supplier.supplier) ? (
                            <ChevronUp className="h-5 w-5" />
                          ) : (
                            <ChevronDown className="h-5 w-5" />
                          )}
                        </div>
                      </CardContent>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="border-t pt-4">
                        <div className="rounded-md border">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Product Name</TableHead>
                                <TableHead className="text-right">Revenue</TableHead>
                                <TableHead className="text-right">% of Supplier</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {supplier.products.map((product) => (
                                <TableRow key={product.name}>
                                  <TableCell>{product.name}</TableCell>
                                  <TableCell className="text-right">
                                    {formatCurrency(product.revenue)}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    {((product.revenue / supplier.revenue) * 100).toFixed(1)}%
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              ))
            ) : (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  No suppliers found
                </CardContent>
              </Card>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
