// src/modules/business-intelligence-analytics/sales-report/product-sales-performance/components/ProductTab.tsx
"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, Search, ArrowUpDown, ChevronRight, ChevronDown } from "lucide-react";
import type { TopItem, ProductTrend, ProductSaleRecord } from "../types";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
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
  Legend,
} from "recharts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type ProductTabProps = {
  topProducts: TopItem[];
  productTrends: ProductTrend[];
  filteredData: ProductSaleRecord[];
};

export function ProductTab({ topProducts, productTrends, filteredData }: ProductTabProps) {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [sortBy, setSortBy] = React.useState<"revenue" | "transactions" | "avg">("revenue");
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [itemsPerPage, setItemsPerPage] = React.useState(10);
  const [timePeriod, setTimePeriod] = React.useState<"daily" | "weekly" | "bi-weekly" | "monthly" | "bi-monthly" | "quarterly" | "semi-annually" | "yearly">("monthly");
  const [expandedProducts, setExpandedProducts] = React.useState<Set<string>>(new Set());
  const [expandedSuppliers, setExpandedSuppliers] = React.useState<Set<string>>(new Set());
  const [supplierPeriodSort, setSupplierPeriodSort] = React.useState<Map<string, { sortBy: "period" | "revenue" | "transactions" | "avg"; sortOrder: "asc" | "desc" }>>(new Map());

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
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

  const toggleProduct = (productName: string) => {
    setExpandedProducts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(productName)) {
        newSet.delete(productName);
      } else {
        newSet.add(productName);
      }
      return newSet;
    });
  };

  const toggleSupplier = (supplierKey: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setExpandedSuppliers((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(supplierKey)) {
        newSet.delete(supplierKey);
      } else {
        newSet.add(supplierKey);
      }
      return newSet;
    });
  };

  const getSupplierTimePeriodData = (
    productName: string,
    supplierName: string,
    sortBy: "period" | "revenue" | "transactions" | "avg" = "period",
    sortOrder: "asc" | "desc" = "desc"
  ) => {
    const dataMap = new Map<string, { revenue: number; transactions: number }>();

    filteredData
      .filter((record) => record.productName === productName && record.supplier === supplierName)
      .forEach((record) => {
        const date = new Date(record.date);
        let key = "";

        if (timePeriod === "daily") {
          key = record.date.split("T")[0];
        } else if (timePeriod === "weekly") {
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().split("T")[0];
        } else if (timePeriod === "bi-weekly") {
          const weekNum = Math.floor(date.getDate() / 14);
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-W${weekNum}`;
        } else if (timePeriod === "monthly") {
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        } else if (timePeriod === "bi-monthly") {
          const biMonth = Math.floor(date.getMonth() / 2);
          key = `${date.getFullYear()}-Q${biMonth + 1}`;
        } else if (timePeriod === "quarterly") {
          const quarter = Math.floor(date.getMonth() / 3);
          key = `${date.getFullYear()}-Q${quarter + 1}`;
        } else if (timePeriod === "semi-annually") {
          const half = Math.floor(date.getMonth() / 6);
          key = `${date.getFullYear()}-H${half + 1}`;
        } else if (timePeriod === "yearly") {
          key = `${date.getFullYear()}`;
        }

        const existing = dataMap.get(key) || { revenue: 0, transactions: 0 };
        dataMap.set(key, {
          revenue: existing.revenue + record.amount,
          transactions: existing.transactions + 1,
        });
      });

    return Array.from(dataMap.entries())
      .map(([period, data]) => ({ period, revenue: data.revenue, transactions: data.transactions }))
      .sort((a, b) => {
        let comparison = 0;
        
        if (sortBy === "period") {
          const getDateValue = (dateStr: string) => {
            if (timePeriod === "daily" || timePeriod === "weekly") {
              return new Date(dateStr).getTime();
            } else if (timePeriod === "monthly") {
              return new Date(dateStr + "-01").getTime();
            } else if (timePeriod === "bi-weekly") {
              const match = dateStr.match(/(\d{4})-(\d{2})-W(\d+)/);
              if (match) {
                const [, year, month, week] = match;
                return new Date(parseInt(year), parseInt(month) - 1, parseInt(week) * 14 + 1).getTime();
              }
            } else if (timePeriod === "bi-monthly" || timePeriod === "quarterly") {
              const match = dateStr.match(/(\d{4})-Q(\d+)/);
              if (match) {
                const [, year, quarter] = match;
                const month = (parseInt(quarter) - 1) * (timePeriod === "bi-monthly" ? 2 : 3);
                return new Date(parseInt(year), month, 1).getTime();
              }
            } else if (timePeriod === "semi-annually") {
              const match = dateStr.match(/(\d{4})-H(\d+)/);
              if (match) {
                const [, year, half] = match;
                const month = (parseInt(half) - 1) * 6;
                return new Date(parseInt(year), month, 1).getTime();
              }
            } else if (timePeriod === "yearly") {
              return new Date(parseInt(dateStr), 0, 1).getTime();
            }
            return 0;
          };
          comparison = getDateValue(a.period) - getDateValue(b.period);
        } else if (sortBy === "revenue") {
          comparison = a.revenue - b.revenue;
        } else if (sortBy === "transactions") {
          comparison = a.transactions - b.transactions;
        } else if (sortBy === "avg") {
          comparison = (a.revenue / a.transactions) - (b.revenue / b.transactions);
        }
        
        return sortOrder === "asc" ? comparison : -comparison;
      });
  };

  const getProductSuppliers = (productName: string) => {
    const supplierMap = new Map<string, { revenue: number; transactions: number }>();

    filteredData
      .filter((record) => record.productName === productName)
      .forEach((record) => {
        const existing = supplierMap.get(record.supplier) || { revenue: 0, transactions: 0 };
        supplierMap.set(record.supplier, {
          revenue: existing.revenue + record.amount,
          transactions: existing.transactions + 1,
        });
      });

    return Array.from(supplierMap.entries())
      .map(([supplier, data]) => ({
        supplier,
        revenue: data.revenue,
        transactions: data.transactions,
      }))
      .sort((a, b) => b.revenue - a.revenue);
  };

  const filteredProducts = React.useMemo(() => {
    let products = searchTerm
      ? topProducts.filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
      : [...topProducts];

    // Sort products
    products.sort((a, b) => {
      let comparison = 0;
      if (sortBy === "revenue") {
        comparison = a.revenue - b.revenue;
      } else if (sortBy === "transactions") {
        comparison = a.count - b.count;
      } else if (sortBy === "avg") {
        comparison = a.revenue / a.count - b.revenue / b.count;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return products;
  }, [topProducts, searchTerm, sortBy, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredProducts, currentPage, itemsPerPage]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortBy, sortOrder]);

  // Aggregate product trends by time period
  const aggregatedProductTrends = React.useMemo(() => {
    return productTrends.map((pt) => {
      const dataMap = new Map<string, number>();

      pt.data.forEach((d) => {
        const date = new Date(d.date);
        let key = "";

        if (timePeriod === "daily") {
          key = d.date;
        } else if (timePeriod === "weekly") {
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().split("T")[0];
        } else if (timePeriod === "bi-weekly") {
          const weekNum = Math.floor(date.getDate() / 14);
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-W${weekNum}`;
        } else if (timePeriod === "monthly") {
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        } else if (timePeriod === "bi-monthly") {
          const biMonth = Math.floor(date.getMonth() / 2);
          key = `${date.getFullYear()}-Q${biMonth + 1}`;
        } else if (timePeriod === "quarterly") {
          const quarter = Math.floor(date.getMonth() / 3);
          key = `${date.getFullYear()}-Q${quarter + 1}`;
        } else if (timePeriod === "semi-annually") {
          const half = Math.floor(date.getMonth() / 6);
          key = `${date.getFullYear()}-H${half + 1}`;
        } else if (timePeriod === "yearly") {
          key = `${date.getFullYear()}`;
        }

        dataMap.set(key, (dataMap.get(key) || 0) + d.revenue);
      });

      const data = Array.from(dataMap.entries())
        .map(([date, revenue]) => ({ date, revenue }))
        .sort((a, b) => {
          // Convert aggregated date strings back to comparable format for proper chronological sorting
          const getDateValue = (dateStr: string) => {
            if (timePeriod === "daily" || timePeriod === "weekly") {
              // Format: "2025-10-12" - can be compared as Date
              return new Date(dateStr).getTime();
            } else if (timePeriod === "monthly") {
              // Format: "2025-10" - add day to make valid date
              return new Date(dateStr + "-01").getTime();
            } else if (timePeriod === "bi-weekly") {
              // Format: "2025-10-W0" - extract year and month, week number for sorting
              const match = dateStr.match(/(\d{4})-(\d{2})-W(\d+)/);
              if (match) {
                const [, year, month, week] = match;
                return new Date(parseInt(year), parseInt(month) - 1, parseInt(week) * 14 + 1).getTime();
              }
            } else if (timePeriod === "bi-monthly" || timePeriod === "quarterly") {
              // Format: "2025-Q1" - extract year and quarter
              const match = dateStr.match(/(\d{4})-Q(\d+)/);
              if (match) {
                const [, year, quarter] = match;
                const month = (parseInt(quarter) - 1) * (timePeriod === "bi-monthly" ? 2 : 3);
                return new Date(parseInt(year), month, 1).getTime();
              }
            } else if (timePeriod === "semi-annually") {
              // Format: "2025-H1" - extract year and half
              const match = dateStr.match(/(\d{4})-H(\d+)/);
              if (match) {
                const [, year, half] = match;
                const month = (parseInt(half) - 1) * 6;
                return new Date(parseInt(year), month, 1).getTime();
              }
            } else if (timePeriod === "yearly") {
              // Format: "2025" - just the year
              return new Date(parseInt(dateStr), 0, 1).getTime();
            }
            return 0;
          };

          return getDateValue(a.date) - getDateValue(b.date);
        });

      return { productName: pt.productName, data };
    });
  }, [productTrends, timePeriod]);

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

  return (
    <div className="space-y-4">

      {/* Product Trends Over Time */}
      {productTrends.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Top 5 Products - Sales Trend</CardTitle>
                  <CardDescription>Revenue performance over time</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const flatData = aggregatedProductTrends.flatMap((pt) =>
                      pt.data.map((d) => ({
                        product: pt.productName,
                        date: d.date,
                        revenue: d.revenue,
                      }))
                    );
                    exportToCSV(flatData, "product-trends.csv");
                  }}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={timePeriod === "daily" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setTimePeriod("daily");
                    setCurrentPage(1);
                    setExpandedSuppliers(new Set());
                  }}
                >
                  Daily
                </Button>
                <Button
                  variant={timePeriod === "weekly" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setTimePeriod("weekly");
                    setCurrentPage(1);
                    setExpandedSuppliers(new Set());
                  }}
                >
                  Weekly
                </Button>
                <Button
                  variant={timePeriod === "bi-weekly" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setTimePeriod("bi-weekly");
                    setCurrentPage(1);
                    setExpandedSuppliers(new Set());
                  }}
                >
                  Bi-Weekly
                </Button>
                <Button
                  variant={timePeriod === "monthly" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setTimePeriod("monthly");
                    setCurrentPage(1);
                    setExpandedSuppliers(new Set());
                  }}
                >
                  Monthly
                </Button>
                <Button
                  variant={timePeriod === "bi-monthly" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setTimePeriod("bi-monthly");
                    setCurrentPage(1);
                    setExpandedSuppliers(new Set());
                  }}
                >
                  Bi-Monthly
                </Button>
                <Button
                  variant={timePeriod === "quarterly" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setTimePeriod("quarterly");
                    setCurrentPage(1);
                    setExpandedSuppliers(new Set());
                  }}
                >
                  Quarterly
                </Button>
                <Button
                  variant={timePeriod === "semi-annually" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setTimePeriod("semi-annually");
                    setCurrentPage(1);
                    setExpandedSuppliers(new Set());
                  }}
                >
                  Semi-Annually
                </Button>
                <Button
                  variant={timePeriod === "yearly" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setTimePeriod("yearly");
                    setCurrentPage(1);
                    setExpandedSuppliers(new Set());
                  }}
                >
                  Yearly
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                ...Object.fromEntries(
                  aggregatedProductTrends.map((pt, i) => [
                    pt.productName,
                    {
                      label: pt.productName,
                      color: chartColors[i % chartColors.length],
                    },
                  ])
                ),
              }}
              className="h-100 w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    type="category"
                    allowDuplicatedCategory={false}
                  />
                  <YAxis tickFormatter={(value) => formatCurrency(value)} />
                  <ChartTooltip
                    content={({ active, payload }) => {
                      if (!active || !payload || payload.length === 0) return null;
                      
                      return (
                        <div className="rounded-lg border bg-background p-2 shadow-sm">
                          <div className="grid gap-2">
                            {payload.map((entry: any, index: number) => (
                              <div key={index} className="flex items-center gap-2">
                                <div
                                  className="h-2 w-2 rounded-full"
                                  style={{ backgroundColor: entry.color }}
                                />
                                <span className="text-sm font-medium">{entry.name}:</span>
                                <span className="text-sm">{formatCurrency(entry.value)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }}
                    cursor={{ strokeDasharray: '3 3' }}
                    allowEscapeViewBox={{ x: false, y: true }}
                  />
                  <Legend />
                  {aggregatedProductTrends.map((pt, i) => {
                    const color = chartColors[i % chartColors.length];
                    return (
                      <Line
                        key={pt.productName}
                        data={pt.data}
                        type="monotone"
                        dataKey="revenue"
                        name={pt.productName}
                        stroke={color}
                        strokeWidth={2}
                        dot={{
                          r: 6,
                          fill: color,
                          stroke: "hsl(var(--background))",
                          strokeWidth: 5
                        }}
                        activeDot={{
                          r: 8,
                          fill: color,
                          stroke: "hsl(var(--background))",
                          strokeWidth: 1
                        }}
                      />
                    );
                  })}
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      {/* Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>


      {/* Product Revenue Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Product Performance Table</CardTitle>
              <CardDescription>
                {filteredProducts.length} products found
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                exportToCSV(
                  filteredProducts.map((p, i) => ({
                    rank: i + 1,
                    product: p.name,
                    revenue: p.revenue,
                    transactions: p.count,
                    avgPerTransaction: p.revenue / p.count,
                  })),
                  "product-performance.csv"
                )
              }
            >
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  {/* <TableHead className="w-15">Rank</TableHead> */}
                  <TableHead>Product Name</TableHead>
                  <TableHead className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (sortBy === "revenue") {
                          setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                        } else {
                          setSortBy("revenue");
                          setSortOrder("desc");
                        }
                      }}
                      className="h-8"
                    >
                      Revenue <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (sortBy === "transactions") {
                          setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                        } else {
                          setSortBy("transactions");
                          setSortOrder("desc");
                        }
                      }}
                      className="h-8"
                    >
                      Transactions <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (sortBy === "avg") {
                          setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                        } else {
                          setSortBy("avg");
                          setSortOrder("desc");
                        }
                      }}
                      className="h-8"
                    >
                      Avg/Transaction <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedProducts.length > 0 ? (
                  paginatedProducts.map((product, index) => {
                    const isExpanded = expandedProducts.has(product.name);
                    const suppliers = isExpanded ? getProductSuppliers(product.name) : [];
                    const getProductColor = (index: number) => chartColors[index % chartColors.length];
                    return (
                      <React.Fragment key={product.name}>
                        <TableRow className="cursor-pointer hover:bg-muted/50" onClick={() => toggleProduct(product.name)}>
                          {/* <TableCell className="font-medium">{(currentPage - 1) * itemsPerPage + index + 1}</TableCell> */}
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                              )}
                              <span
                                className="font-medium"
                                style={{ color: getProductColor(index) }}
                              >
                                {product.name}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(product.revenue)}
                          </TableCell>
                          <TableCell className="text-right">{product.count}</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(product.revenue / product.count)}
                          </TableCell>
                        </TableRow>
                        {isExpanded && suppliers.length > 0 && (
                          <TableRow>
                            <TableCell colSpan={5} className="bg-muted/30 p-0">
                              <div className="px-12 py-4">
                                {/* <div className="text-sm font-semibold mb-3 text-muted-foreground">Suppliers for {product.name}</div> */}
                                <div className="rounded-md border bg-background">
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        {/* <TableHead className="w-12">#</TableHead> */}
                                        <TableHead>Supplier Name</TableHead>
                                        <TableHead className="text-right">Revenue</TableHead>
                                        <TableHead className="text-right">Transactions</TableHead>
                                        <TableHead className="text-right">Avg/Transaction</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {suppliers.map((supplier, idx) => {
                                        const supplierKey = `${product.name}-${supplier.supplier}`;
                                        const isSupplierExpanded = expandedSuppliers.has(supplierKey);
                                        const sortState = supplierPeriodSort.get(supplierKey) || { sortBy: "period", sortOrder: "desc" };
                                        const timePeriodData = isSupplierExpanded ? getSupplierTimePeriodData(product.name, supplier.supplier, sortState.sortBy, sortState.sortOrder) : [];
                                        
                                        const handlePeriodSort = (column: "period" | "revenue" | "transactions" | "avg") => {
                                          const newSortState = new Map(supplierPeriodSort);
                                          const currentSort = sortState;
                                          
                                          if (currentSort.sortBy === column) {
                                            newSortState.set(supplierKey, {
                                              sortBy: column,
                                              sortOrder: currentSort.sortOrder === "asc" ? "desc" : "asc"
                                            });
                                          } else {
                                            newSortState.set(supplierKey, {
                                              sortBy: column,
                                              sortOrder: "desc"
                                            });
                                          }
                                          setSupplierPeriodSort(newSortState);
                                        };
                                        
                                        return (
                                          <React.Fragment key={supplier.supplier}>
                                            <TableRow 
                                              className="cursor-pointer hover:bg-muted/50"
                                              onClick={(e) => toggleSupplier(supplierKey, e)}
                                            >
                                              <TableCell>
                                                <div className="flex items-center gap-2">
                                                  {isSupplierExpanded ? (
                                                    <ChevronDown className="h-3 w-3 text-muted-foreground" />
                                                  ) : (
                                                    <ChevronRight className="h-3 w-3 text-muted-foreground" />
                                                  )}
                                                  <span>{supplier.supplier}</span>
                                                </div>
                                              </TableCell>
                                              <TableCell className="text-right">{formatCurrency(supplier.revenue)}</TableCell>
                                              <TableCell className="text-right">{supplier.transactions}</TableCell>
                                              <TableCell className="text-right">{formatCurrency(supplier.revenue / supplier.transactions)}</TableCell>
                                            </TableRow>
                                            {isSupplierExpanded && timePeriodData.length > 0 && (
                                              <TableRow>
                                                <TableCell colSpan={4} className="bg-muted/20 p-0">
                                                  <div className="px-8 py-3" onClick={(e) => e.stopPropagation()}>
                                                    <div className="text-xs font-semibold mb-2 text-muted-foreground">
                                                      Revenue by {timePeriod.charAt(0).toUpperCase() + timePeriod.slice(1)} Period
                                                    </div>
                                                    <div className="rounded-md border bg-background">
                                                      <Table>
                                                        <TableHeader>
                                                          <TableRow>
                                                            <TableHead className="text-xs">
                                                              <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={(e) => {
                                                                  e.stopPropagation();
                                                                  handlePeriodSort("period");
                                                                }}
                                                                className="h-6 px-2 text-xs"
                                                              >
                                                                Period <ArrowUpDown className="ml-1 h-3 w-3" />
                                                              </Button>
                                                            </TableHead>
                                                            <TableHead className="text-right text-xs">
                                                              <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={(e) => {
                                                                  e.stopPropagation();
                                                                  handlePeriodSort("revenue");
                                                                }}
                                                                className="h-6 px-2 text-xs"
                                                              >
                                                                Revenue <ArrowUpDown className="ml-1 h-3 w-3" />
                                                              </Button>
                                                            </TableHead>
                                                            <TableHead className="text-right text-xs">
                                                              <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={(e) => {
                                                                  e.stopPropagation();
                                                                  handlePeriodSort("transactions");
                                                                }}
                                                                className="h-6 px-2 text-xs"
                                                              >
                                                                Transactions <ArrowUpDown className="ml-1 h-3 w-3" />
                                                              </Button>
                                                            </TableHead>
                                                            <TableHead className="text-right text-xs">
                                                              <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={(e) => {
                                                                  e.stopPropagation();
                                                                  handlePeriodSort("avg");
                                                                }}
                                                                className="h-6 px-2 text-xs"
                                                              >
                                                                Avg/Transaction <ArrowUpDown className="ml-1 h-3 w-3" />
                                                              </Button>
                                                            </TableHead>
                                                          </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                          {timePeriodData.map((data) => (
                                                            <TableRow key={data.period}>
                                                              <TableCell className="text-xs">{data.period}</TableCell>
                                                              <TableCell className="text-right text-xs">{formatCurrency(data.revenue)}</TableCell>
                                                              <TableCell className="text-right text-xs">{data.transactions}</TableCell>
                                                              <TableCell className="text-right text-xs">{formatCurrency(data.revenue / data.transactions)}</TableCell>
                                                            </TableRow>
                                                          ))}
                                                        </TableBody>
                                                      </Table>
                                                    </div>
                                                  </div>
                                                </TableCell>
                                              </TableRow>
                                            )}
                                          </React.Fragment>
                                        );
                                      })}
                                    </TableBody>
                                  </Table>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      No products found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-between px-2 py-4">
            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredProducts.length)} of {filteredProducts.length} products
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-muted-foreground">Show:</label>
                <select
                  className="h-8 rounded-md border border-input bg-background px-3 py-1 text-sm"
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
