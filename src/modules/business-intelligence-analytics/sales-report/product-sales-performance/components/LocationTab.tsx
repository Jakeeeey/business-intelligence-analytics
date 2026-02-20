// src/modules/business-intelligence-analytics/sales-report/product-sales-performance/components/LocationTab.tsx
"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, Search, MapPin } from "lucide-react";
import type { LocationRevenue, ProductSaleRecord } from "../types";
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
import { Badge } from "@/components/ui/badge";

type LocationTabProps = {
  locationRevenue: LocationRevenue[];
  filteredData: ProductSaleRecord[];
};

export function LocationTab({ locationRevenue, filteredData }: LocationTabProps) {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedLocation, setSelectedLocation] = React.useState<string | null>(null);

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

  const filteredLocations = React.useMemo(() => {
    if (!searchTerm) return locationRevenue;
    return locationRevenue.filter((loc) =>
      loc.location.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [locationRevenue, searchTerm]);

  // Get top products for selected location
  const topProductsForLocation = React.useMemo(() => {
    if (!selectedLocation) return [];

    const [city, province] = selectedLocation.split(", ");
    const locationData = filteredData.filter(
      (r) => r.city === city && r.province === province
    );

    const productMap = new Map<string, number>();
    locationData.forEach((r) => {
      productMap.set(r.productName, (productMap.get(r.productName) || 0) + r.amount);
    });

    return Array.from(productMap.entries())
      .map(([name, revenue]) => ({ name, revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [selectedLocation, filteredData]);

  // Revenue by province
  const provinceRevenue = React.useMemo(() => {
    const provinceMap = new Map<string, { revenue: number; transactions: number }>();

    filteredData.forEach((r) => {
      const existing = provinceMap.get(r.province) || { revenue: 0, transactions: 0 };
      provinceMap.set(r.province, {
        revenue: existing.revenue + r.amount,
        transactions: existing.transactions + 1,
      });
    });

    return Array.from(provinceMap.entries())
      .map(([province, data]) => ({
        province,
        revenue: data.revenue,
        transactions: data.transactions,
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [filteredData]);

  // Get color for heatmap
  const getHeatmapColor = (value: number, max: number) => {
    const intensity = value / max;
    if (intensity > 0.8) return "hsl(var(--chart-1))";
    if (intensity > 0.6) return "hsl(var(--chart-2))";
    if (intensity > 0.4) return "hsl(var(--chart-3))";
    if (intensity > 0.2) return "hsl(var(--chart-4))";
    return "hsl(var(--chart-5))";
  };

  const maxRevenue = Math.max(...locationRevenue.map((l) => l.revenue));

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search locations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Province Revenue Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Revenue by Province</CardTitle>
              <CardDescription>Provincial performance comparison</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                exportToCSV(
                  provinceRevenue.map((p, i) => ({
                    rank: i + 1,
                    province: p.province,
                    revenue: p.revenue,
                    transactions: p.transactions,
                  })),
                  "province-revenue.csv"
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
                color: "hsl(var(--chart-4))",
              },
            }}
            className="h-75 w-full"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={provinceRevenue}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="province" />
                <YAxis tickFormatter={(value) => formatCurrency(value)} />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value) => formatCurrency(Number(value))}
                    />
                  }
                />
                <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                  {provinceRevenue.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* City Revenue Heatmap */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>City Revenue Heatmap</CardTitle>
              <CardDescription>Top 15 cities by revenue (click to see products)</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                exportToCSV(
                  filteredLocations.map((l, i) => ({
                    rank: i + 1,
                    location: l.location,
                    revenue: l.revenue,
                    transactions: l.transactions,
                  })),
                  "city-revenue.csv"
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
                color: "hsl(var(--chart-1))",
              },
            }}
            className="h-100 w-full"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={filteredLocations.slice(0, 15)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tickFormatter={(value) => formatCurrency(value)} />
                <YAxis dataKey="location" type="category" width={150} />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value) => formatCurrency(Number(value))}
                    />
                  }
                />
                <Bar
                  dataKey="revenue"
                  radius={[0, 4, 4, 0]}
                  onClick={(data) => setSelectedLocation(data.location)}
                  cursor="pointer"
                >
                  {filteredLocations.slice(0, 15).map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={chartColors[index % chartColors.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Selected Location Details */}
      {selectedLocation && topProductsForLocation.length > 0 && (
        <Card className="border-primary">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle>{selectedLocation}</CardTitle>
                  <CardDescription>Top products in this location</CardDescription>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedLocation(null)}
              >
                Clear
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rank</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topProductsForLocation.map((product, index) => (
                    <TableRow key={product.name}>
                      <TableCell>
                        <Badge variant={index < 3 ? "default" : "secondary"}>
                          {index + 1}
                        </Badge>
                      </TableCell>
                      <TableCell>{product.name}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(product.revenue)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Location Details Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Locations Performance</CardTitle>
          <CardDescription>{filteredLocations.length} locations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-15">Rank</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Transactions</TableHead>
                  <TableHead className="text-right">Avg/Transaction</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLocations.length > 0 ? (
                  filteredLocations.map((location, index) => (
                    <TableRow
                      key={location.location}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelectedLocation(location.location)}
                    >
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        {location.location}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(location.revenue)}
                      </TableCell>
                      <TableCell className="text-right">{location.transactions}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(location.revenue / location.transactions)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      No locations found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
