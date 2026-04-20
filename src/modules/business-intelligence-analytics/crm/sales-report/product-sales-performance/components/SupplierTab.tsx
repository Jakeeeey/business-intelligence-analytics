// src/modules/business-intelligence-analytics/sales-report/product-sales-performance/components/SupplierTab.tsx
"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ChevronDown, ChevronUp, ArrowUpDown } from "lucide-react";
import type { SupplierPerformance, TopItem, ProductSaleRecord } from "../types";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
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
const chartColorsDark = [
  "#2563eb", // deep blue
  "#6d28d9", // deep violet
  "#be185d", // deep pink
  "#c2410c", // deep orange
  "#15803d", // deep green
  "#0f766e", // deep teal
  "#a16207", // deep yellow
  "#b91c1c", // deep red
  "#4338ca", // deep indigo
  "#0e7490", // deep cyan
  "#4d7c0f", // deep lime
  "#7e22ce", // deep purple
  "#9f1239", // deep rose
  "#0369a1", // deep sky
  "#047857", // deep emerald
  "#b45309", // deep amber
  "#475569", // dark slate
  "#5b21b6", // rich purple
  "#155e75", // rich cyan
  "#991b1b", // strong deep red
];
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TruncateText } from "./TruncateText";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

// Stable module-level currency formatter — avoids creating Intl.NumberFormat on every render
const phpFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const formatCurrency = (value: number) => phpFormatter.format(value);

// wrapLabel helper removed (was only used by removed CustomXAxisTick)

// Custom X axis tick removed (unused) to satisfy lint rules

// exportToCSV helper removed (unused)

type SupplierTabProps = {
  supplierPerformance: SupplierPerformance[];
  topSuppliers: TopItem[];
  filteredData: ProductSaleRecord[];
};

export function SupplierTab({
  supplierPerformance,
  topSuppliers,
  filteredData,
}: SupplierTabProps) {
  const { theme } = useTheme();
  const resolvedTheme = theme;
  const isDark = resolvedTheme === "dark";

  const activeChartColors = isDark ? chartColorsDark : chartColors;

  const [searchTerm, setSearchTerm] = React.useState("");
  const [expandedSuppliers, setExpandedSuppliers] = React.useState<Set<string>>(
    new Set(),
  );
  const [sortBy, setSortBy] = React.useState<"revenue" | "products" | "name">(
    "revenue",
  );
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("desc");

  const [selectedSupplier, setSelectedSupplier] = React.useState<string | null>(
    null,
  );
  const [hoveredBar, setHoveredBar] = React.useState<string | null>(null);
  // Per-supplier sub-table sort maps
  const [productSubSortMap, setProductSubSortMap] = React.useState<
    Map<
      string,
      { by: "name" | "revenue" | "percentage"; order: "asc" | "desc" }
    >
  >(new Map());
  const [salesmanSubSortMap, setSalesmanSubSortMap] = React.useState<
    Map<
      string,
      { by: "name" | "revenue" | "transactions"; order: "asc" | "desc" }
    >
  >(new Map());
  const [customerSubSortMap, setCustomerSubSortMap] = React.useState<
    Map<
      string,
      { by: "name" | "revenue" | "transactions"; order: "asc" | "desc" }
    >
  >(new Map());
  const [currentPage, setCurrentPage] = React.useState(1);
  const [itemsPerPage, setItemsPerPage] = React.useState(10);
  const [supplierProductPage, setSupplierProductPage] = React.useState<
    Map<string, number>
  >(new Map());
  const [supplierSalesmanPage, setSupplierSalesmanPage] = React.useState<
    Map<string, number>
  >(new Map());
  const [supplierCustomerPage, setSupplierCustomerPage] = React.useState<
    Map<string, number>
  >(new Map());
  const [subTableItemsPerPage, setSubTableItemsPerPage] = React.useState(5);

  const filteredSuppliers = React.useMemo(() => {
    const suppliers = searchTerm
      ? supplierPerformance.filter((s) =>
          s.supplier.toLowerCase().includes(searchTerm.toLowerCase()),
        )
      : [...supplierPerformance];

    // Sort suppliers
    suppliers.sort((a, b) => {
      let comparison = 0;
      if (sortBy === "revenue") {
        comparison = a.revenue - b.revenue;
      } else if (sortBy === "products") {
        comparison = a.products.length - b.products.length;
      } else if (sortBy === "name") {
        comparison = a.supplier.localeCompare(b.supplier);
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return suppliers;
  }, [supplierPerformance, searchTerm, sortBy, sortOrder]);

  const totalPages = Math.ceil(filteredSuppliers.length / itemsPerPage);
  const paginatedSuppliers = React.useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredSuppliers.slice(start, start + itemsPerPage);
  }, [filteredSuppliers, currentPage, itemsPerPage]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortBy, sortOrder]);

  const toggleSupplier = React.useCallback((supplier: string) => {
    setExpandedSuppliers((prev) => {
      const next = new Set(prev);
      if (next.has(supplier)) {
        next.delete(supplier);
      } else {
        next.add(supplier);
      }
      return next;
    });
  }, []);

  const getYAxisWidth = React.useCallback((data: { revenue?: number }[]) => {
    if (!data?.length) return 60;
    const max = Math.max(...data.map((d) => d.revenue || 0));
    return Math.max(60, formatCurrency(max).length * 8);
  }, []);

  // Stable handlers to avoid recreating lambdas repeatedly
  const handleClearSelection = React.useCallback(() => {
    setSelectedSupplier(null);
    setExpandedSuppliers(new Set());
  }, []);

  const handleCollapseAll = React.useCallback(() => {
    setExpandedSuppliers(new Set());
    setSelectedSupplier(null);
    // reset per-supplier sorts (optional but keeps UI consistent)
    setProductSubSortMap(new Map());
    setSalesmanSubSortMap(new Map());
    setCustomerSubSortMap(new Map());
  }, []);

  const handleToggleSort = React.useCallback(
    (target: "revenue" | "products" | "name") => {
      if (sortBy === target) {
        setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
      } else {
        setSortBy(target);
        setSortOrder(target === "name" ? "asc" : "desc");
      }
    },
    [sortBy],
  );

  const handleSetItemsPerPage = React.useCallback((n: number) => {
    setItemsPerPage(n);
    setCurrentPage(1);
  }, []);

  const setCurrentPageTo = React.useCallback(
    (p: number) => setCurrentPage(p),
    [],
  );

  const setCurrentPagePrev = React.useCallback(
    () => setCurrentPage((p) => Math.max(1, p - 1)),
    [],
  );
  const setCurrentPageNext = React.useCallback(
    () => setCurrentPage((p) => Math.min(totalPages, p + 1)),
    [totalPages],
  );

  const setSupplierProductPageFor = React.useCallback(
    (supplierName: string, page: number) => {
      setSupplierProductPage((prev) => {
        const next = new Map(prev);
        next.set(supplierName, page);
        return next;
      });
    },
    [],
  );

  const setSupplierSalesmanPageFor = React.useCallback(
    (supplierName: string, page: number) => {
      setSupplierSalesmanPage((prev) => {
        const next = new Map(prev);
        next.set(supplierName, page);
        return next;
      });
    },
    [],
  );

  const setSupplierCustomerPageFor = React.useCallback(
    (supplierName: string, page: number) => {
      setSupplierCustomerPage((prev) => {
        const next = new Map(prev);
        next.set(supplierName, page);
        return next;
      });
    },
    [],
  );

  // Shared handler to select a supplier, expand its row and scroll into view
  const handleSelectSupplier = React.useCallback((name?: string) => {
    if (!name) return;
    setSelectedSupplier(name);
    setExpandedSuppliers((prev) => {
      const next = new Set(prev);
      next.add(name);
      return next;
    });
    const safeId = name.replace(/[^a-zA-Z0-9]/g, "-");
    setTimeout(() => {
      document
        .getElementById(`supplier-row-${safeId}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
  }, []);

  const handleXAxisClick = React.useCallback(
    (e: {
      value?: string;
      payload?: { value?: string; payload?: { name?: string } };
      activeLabel?: string;
      name?: string;
    }) => {
      // Recharts may pass different shapes; try common properties
      const val =
        e?.value ??
        e?.payload?.value ??
        e?.activeLabel ??
        e?.payload?.payload?.name ??
        e?.name;
      if (!val) return;
      handleSelectSupplier(String(val));
    },
    [handleSelectSupplier],
  );

  const toggleProductSubSort = React.useCallback(
    (sup: string, by: "name" | "revenue" | "percentage") => {
      setProductSubSortMap((prev) => {
        const next = new Map(prev);
        const cur = prev.get(sup) ?? {
          by: "revenue" as const,
          order: "desc" as const,
        };
        next.set(
          sup,
          cur.by === by
            ? { by, order: cur.order === "asc" ? "desc" : "asc" }
            : { by, order: by === "name" ? "asc" : "desc" },
        );
        return next;
      });
    },
    [],
  );

  const toggleSalesmanSubSort = React.useCallback(
    (sup: string, by: "name" | "revenue" | "transactions") => {
      setSalesmanSubSortMap((prev) => {
        const next = new Map(prev);
        const cur = prev.get(sup) ?? {
          by: "revenue" as const,
          order: "desc" as const,
        };
        next.set(
          sup,
          cur.by === by
            ? { by, order: cur.order === "asc" ? "desc" : "asc" }
            : { by, order: by === "name" ? "asc" : "desc" },
        );
        return next;
      });
    },
    [],
  );

  const toggleCustomerSubSort = React.useCallback(
    (sup: string, by: "name" | "revenue" | "transactions") => {
      setCustomerSubSortMap((prev) => {
        const next = new Map(prev);
        const cur = prev.get(sup) ?? {
          by: "revenue" as const,
          order: "desc" as const,
        };
        next.set(
          sup,
          cur.by === by
            ? { by, order: cur.order === "asc" ? "desc" : "asc" }
            : { by, order: by === "name" ? "asc" : "desc" },
        );
        return next;
      });
    },
    [],
  );

  // ── Pre-computed per-supplier customer & salesman maps ─────────────────────────
  // Single pass over filteredData builds both maps, replacing the old
  // getSupplierCustomers/getSupplierSalesmen that were O(n) per row per render.
  const supplierRelatedData = React.useMemo(() => {
    const custInterim = new Map<
      string,
      Map<string, { revenue: number; transactions: number }>
    >();
    const salesInterim = new Map<
      string,
      Map<string, { revenue: number; transactions: number }>
    >();
    filteredData.forEach((r) => {
      const sup = r.supplier;
      // customers
      if (!custInterim.has(sup)) custInterim.set(sup, new Map());
      const cm = custInterim.get(sup)!;
      const cp = cm.get(r.customerName) || { revenue: 0, transactions: 0 };
      cm.set(r.customerName, {
        revenue: cp.revenue + r.amount,
        transactions: cp.transactions + 1,
      });
      // salesmen
      if (!salesInterim.has(sup)) salesInterim.set(sup, new Map());
      const sm = salesInterim.get(sup)!;
      const skey = r.salesmanName || "Unknown";
      const sp = sm.get(skey) || { revenue: 0, transactions: 0 };
      sm.set(skey, {
        revenue: sp.revenue + r.amount,
        transactions: sp.transactions + 1,
      });
    });
    const allCustomers = new Map<
      string,
      Array<{ name: string; revenue: number; transactions: number }>
    >();
    custInterim.forEach((m, sup) => {
      allCustomers.set(
        sup,
        Array.from(m.entries()).map(([name, d]) => ({ name, ...d })),
      );
    });
    const allSalesmen = new Map<
      string,
      Array<{ name: string; revenue: number; transactions: number }>
    >();
    salesInterim.forEach((m, sup) => {
      allSalesmen.set(
        sup,
        Array.from(m.entries()).map(([name, d]) => ({ name, ...d })),
      );
    });
    return { allCustomers, allSalesmen };
  }, [filteredData]);
  // ────────────────────────────────────────────────────────────────────

  const sortedTopSuppliers = React.useMemo(() => {
    const suppliers = [...topSuppliers];

    suppliers.sort((a, b) => {
      let comparison = 0;
      if (sortBy === "revenue") {
        comparison = a.revenue - b.revenue;
      } else if (sortBy === "products") {
        // topSuppliers doesn't have products array, so just sort by revenue
        comparison = a.revenue - b.revenue;
      } else if (sortBy === "name") {
        comparison = a.name.localeCompare(b.name);
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return suppliers.slice(0, 10);
  }, [topSuppliers, sortBy, sortOrder]);

  const topProductBySupplier = React.useMemo(() => {
    const result = new Map<string, string>();
    const map = new Map<string, Map<string, number>>();
    filteredData.forEach((r) => {
      if (!map.has(r.supplier)) map.set(r.supplier, new Map());
      const m = map.get(r.supplier)!;
      m.set(r.productName, (m.get(r.productName) || 0) + r.amount);
    });
    map.forEach((m, sup) => {
      let top = "";
      let topVal = 0;
      m.forEach((v, k) => {
        if (v > topVal) {
          topVal = v;
          top = k;
        }
      });
      if (top) result.set(sup, top);
    });
    return result;
  }, [filteredData]);

  const topCustomerBySupplier = React.useMemo(() => {
    const result = new Map<string, string>();
    const map = new Map<string, Map<string, number>>();
    filteredData.forEach((r) => {
      if (!map.has(r.supplier)) map.set(r.supplier, new Map());
      const m = map.get(r.supplier)!;
      m.set(r.customerName, (m.get(r.customerName) || 0) + r.amount);
    });
    map.forEach((m, sup) => {
      let top = "";
      let topVal = 0;
      m.forEach((v, k) => {
        if (v > topVal) {
          topVal = v;
          top = k;
        }
      });
      if (top) result.set(sup, top);
    });
    return result;
  }, [filteredData]);

  const topSalesmanBySupplier = React.useMemo(() => {
    const result = new Map<string, string>();
    const map = new Map<string, Map<string, number>>();
    filteredData.forEach((r) => {
      if (!map.has(r.supplier)) map.set(r.supplier, new Map());
      const m = map.get(r.supplier)!;
      const key = r.salesmanName || "Unknown";
      m.set(key, (m.get(key) || 0) + r.amount);
    });
    map.forEach((m, sup) => {
      let top = "";
      let topVal = 0;
      m.forEach((v, k) => {
        if (v > topVal) {
          topVal = v;
          top = k;
        }
      });
      if (top) result.set(sup, top);
    });
    return result;
  }, [filteredData]);

  React.useEffect(() => {
    // Listen for navigation to supplier row and auto-expand
    const handler = () => {
      const hash = window.location.hash;
      if (hash.startsWith("#supplier-row-")) {
        const supplierName = hash
          .replace("#supplier-row-", "")
          .replace(/-/g, " ");
        setExpandedSuppliers((prev) => {
          const next = new Set(prev);
          next.add(supplierName);
          return next;
        });
      }
    };
    window.addEventListener("hashchange", handler);
    handler(); // Initial check
    return () => window.removeEventListener("hashchange", handler);
  }, []);
  return (
    <div className="space-y-4">
      {/* Top Suppliers Chart */}
      <Card className="dark:border-zinc-700 ">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Top 10 Suppliers by Revenue</CardTitle>
              <CardDescription>Supplier revenue comparison</CardDescription>
            </div>
            {selectedSupplier && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearSelection}
              >
                Clear Selection
              </Button>
            )}
            {/* <Button
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
            </Button> */}
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
              <BarChart data={sortedTopSuppliers}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={120}
                  interval={0}
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  tickFormatter={(value) =>
                    value.toString().substring(0, 25) +
                    (value.length > 25 ? "..." : "")
                  }
                  onClick={handleXAxisClick}
                  style={{
                    cursor: "pointer",
                    whiteSpace: "normal",
                    textWrap: "break-word",
                  }}
                />
                <YAxis
                  width={getYAxisWidth(sortedTopSuppliers)}
                  tickFormatter={(value) => formatCurrency(value)}
                />
                <ChartTooltip
                  content={({
                    active,
                    payload,
                  }: {
                    active?: boolean;
                    payload?: Array<{
                      payload?: {
                        name?: string;
                        revenue?: number;
                        count?: number;
                      };
                    }>;
                  }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload || {};
                    const topProd = topProductBySupplier.get(d.name || "");
                    const topCust = topCustomerBySupplier.get(d.name || "");
                    const topSales = topSalesmanBySupplier.get(d.name || "");
                    return (
                      <div className="rounded-lg border bg-background p-3 shadow-md text-sm min-w-44 space-y-1">
                        <p className="font-semibold text-xs leading-tight">
                          {d.name}
                        </p>
                        <div className="border-t pt-1 space-y-0.5">
                          <div className="flex justify-between gap-4">
                            <span className="text-muted-foreground">
                              Revenue
                            </span>
                            <span className="font-medium">
                              {formatCurrency(d.revenue || 0)}
                            </span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-muted-foreground">
                              Transactions
                            </span>
                            <span className="font-medium">{d.count ?? ""}</span>
                          </div>
                          {topProd && (
                            <div className="flex justify-between gap-4">
                              <span className="text-muted-foreground">
                                Top Product
                              </span>
                              <span className="font-medium max-w-28 text-right truncate">
                                {topProd}
                              </span>
                            </div>
                          )}
                          {topCust && (
                            <div className="flex justify-between gap-4">
                              <span className="text-muted-foreground">
                                Top Customer
                              </span>
                              <span className="font-medium max-w-28 text-right truncate">
                                {topCust}
                              </span>
                            </div>
                          )}
                          {topSales && (
                            <div className="flex justify-between gap-4">
                              <span className="text-muted-foreground">
                                Top Salesman
                              </span>
                              <span className="font-medium max-w-28 text-right truncate">
                                {topSales}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }}
                />
                <Bar
                  dataKey="revenue"
                  radius={[4, 4, 0, 0]}
                  onMouseEnter={(data: { name?: string } | unknown) => {
                    const name = (data as { name?: string })?.name ?? null;
                    setHoveredBar(name ? `sup::${name}` : null);
                  }}
                  onMouseLeave={() => setHoveredBar(null)}
                  onClick={(data: { name?: string } | string | unknown) => {
                    const name =
                      typeof data === "string"
                        ? data
                        : (data as { name?: string })?.name;
                    handleSelectSupplier(name);
                  }}
                  cursor="pointer"
                >
                  {sortedTopSuppliers.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={activeChartColors[index % activeChartColors.length]}
                      opacity={
                        (selectedSupplier && selectedSupplier !== entry.name) ||
                        (!selectedSupplier &&
                          hoveredBar &&
                          hoveredBar !== `sup::${entry.name}`)
                          ? 0.3
                          : 1
                      }
                      style={{
                        filter:
                          hoveredBar === `sup::${entry.name}`
                            ? "brightness(1.2) drop-shadow(0 0 3px rgba(0,0,0,0.25))"
                            : undefined,
                        transition: "filter 0.12s ease",
                      }}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
      {/* Search Bar */}
      <Card className="dark:border-zinc-700">
        <CardContent className="">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-10 dark:border-zinc-700"
              placeholder="Search suppliers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>
      {/* Supplier Performance with Product Breakdown */}
      <Card id="supplier-details" className="dark:border-zinc-700 ">
        <CardHeader>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Supplier Performance Details</CardTitle>
                <CardDescription>
                  {filteredSuppliers.length} suppliers with product breakdown
                </CardDescription>
              </div>
              {/* <Button
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
              </Button> */}
            </div>
            <div className="flex flex-wrap gap-2 ">
              <Button
                variant={sortBy === "revenue" ? "default" : "outline"}
                size="sm"
                onClick={() => handleToggleSort("revenue")}
              >
                Sort by Revenue <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
              <Button
                variant={sortBy === "products" ? "default" : "outline"}
                size="sm"
                onClick={() => handleToggleSort("products")}
              >
                Sort by # Products <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
              <Button
                variant={sortBy === "name" ? "default" : "outline"}
                size="sm"
                onClick={() => handleToggleSort("name")}
              >
                Sort by Name <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleCollapseAll}>
                Collapse All
              </Button>
            </div>
          </div>
          <div></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {filteredSuppliers.length > 0 ? (
              paginatedSuppliers.map((supplier) => {
                const supplierSalesmen =
                  supplierRelatedData.allSalesmen.get(supplier.supplier) || [];
                const supplierCustomers =
                  supplierRelatedData.allCustomers.get(supplier.supplier) || [];
                const { by: productSubSortBy, order: productSubSortOrder } =
                  productSubSortMap.get(supplier.supplier) ?? {
                    by: "revenue" as const,
                    order: "desc" as const,
                  };
                const { by: salesmanSubSortBy, order: salesmanSubSortOrder } =
                  salesmanSubSortMap.get(supplier.supplier) ?? {
                    by: "revenue" as const,
                    order: "desc" as const,
                  };
                const { by: customerSubSortBy, order: customerSubSortOrder } =
                  customerSubSortMap.get(supplier.supplier) ?? {
                    by: "revenue" as const,
                    order: "desc" as const,
                  };
                const suppProductPage =
                  supplierProductPage.get(supplier.supplier) || 1;
                const prodTotalPages = Math.ceil(
                  supplier.products.length / subTableItemsPerPage,
                );
                const sortedProductsList = [...supplier.products].sort(
                  (a, b) => {
                    let cmp = 0;
                    if (productSubSortBy === "name")
                      cmp = a.name.localeCompare(b.name);
                    else if (productSubSortBy === "revenue")
                      cmp = a.revenue - b.revenue;
                    else if (productSubSortBy === "percentage")
                      cmp =
                        a.revenue / supplier.revenue -
                        b.revenue / supplier.revenue;
                    return productSubSortOrder === "asc" ? cmp : -cmp;
                  },
                );
                const paginatedProductsList = sortedProductsList.slice(
                  (suppProductPage - 1) * subTableItemsPerPage,
                  suppProductPage * subTableItemsPerPage,
                );
                const suppSalesmanPage =
                  supplierSalesmanPage.get(supplier.supplier) || 1;
                const salesmanTotalPages = Math.ceil(
                  supplierSalesmen.length / subTableItemsPerPage,
                );
                const sortedSalesmenList = [...supplierSalesmen].sort(
                  (a, b) => {
                    let cmp = 0;
                    if (salesmanSubSortBy === "name")
                      cmp = a.name.localeCompare(b.name);
                    else if (salesmanSubSortBy === "revenue")
                      cmp = a.revenue - b.revenue;
                    else cmp = a.transactions - b.transactions;
                    return salesmanSubSortOrder === "asc" ? cmp : -cmp;
                  },
                );
                const paginatedSalesmenList = sortedSalesmenList.slice(
                  (suppSalesmanPage - 1) * subTableItemsPerPage,
                  suppSalesmanPage * subTableItemsPerPage,
                );
                const suppCustomerPage =
                  supplierCustomerPage.get(supplier.supplier) || 1;
                const customerTotalPages = Math.ceil(
                  supplierCustomers.length / subTableItemsPerPage,
                );
                const sortedCustomersList = [...supplierCustomers].sort(
                  (a, b) => {
                    let cmp = 0;
                    if (customerSubSortBy === "name")
                      cmp = a.name.localeCompare(b.name);
                    else if (customerSubSortBy === "revenue")
                      cmp = a.revenue - b.revenue;
                    else cmp = a.transactions - b.transactions;
                    return customerSubSortOrder === "asc" ? cmp : -cmp;
                  },
                );
                const paginatedCustomersList = sortedCustomersList.slice(
                  (suppCustomerPage - 1) * subTableItemsPerPage,
                  suppCustomerPage * subTableItemsPerPage,
                );
                return (
                  <Collapsible
                    id={`supplier-row-${supplier.supplier.replace(/[^a-zA-Z0-9]/g, "-")}`}
                    key={supplier.supplier}
                    open={expandedSuppliers.has(supplier.supplier)}
                    onOpenChange={() => toggleSupplier(supplier.supplier)}
                  >
                    <Card className="dark:border-zinc-700 dark:bg-white/1">
                      <CollapsibleTrigger className="w-full ">
                        <CardContent className="flex items-center justify-between">
                          <div className="flex items-center gap-4 ">
                            <div className="text-left">
                              <div className="font-semibold">
                                {supplier.supplier || "Unknown Supplier"}
                              </div>
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
                              <div className="text-sm text-muted-foreground">
                                Total Revenue
                              </div>
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
                        <CardContent className="border-t pt-4 space-y-4">
                          {/* Products */}
                          <div className="">
                            <p className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wide">
                              Products
                            </p>
                            <div className="rounded-md border dark:border-zinc-700">
                              <Table className="table-fixed w-full dark:border-zinc-700 dark:bg-white/3">
                                <TableHeader>
                                  <TableRow>
                                    <TableHead className="w-[42%]">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="-ml-2 h-7 text-xs font-semibold"
                                        title="Sort by product name"
                                        onClick={() =>
                                          toggleProductSubSort(
                                            supplier.supplier,
                                            "name",
                                          )
                                        }
                                      >
                                        Product Name{" "}
                                        <ArrowUpDown className="ml-1 h-3 w-3" />
                                      </Button>
                                    </TableHead>
                                    <TableHead className="text-right w-[29%]">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="-mr-2 h-7 text-xs font-semibold"
                                        title="Sort by revenue"
                                        onClick={() =>
                                          toggleProductSubSort(
                                            supplier.supplier,
                                            "revenue",
                                          )
                                        }
                                      >
                                        Revenue{" "}
                                        <ArrowUpDown className="ml-1 h-3 w-3" />
                                      </Button>
                                    </TableHead>
                                    <TableHead className="text-right w-[29%]">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="-mr-2 h-7 text-xs font-semibold"
                                        title="Sort by percentage of supplier"
                                        onClick={() =>
                                          toggleProductSubSort(
                                            supplier.supplier,
                                            "percentage",
                                          )
                                        }
                                      >
                                        % of Supplier{" "}
                                        <ArrowUpDown className="ml-1 h-3 w-3" />
                                      </Button>
                                    </TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {paginatedProductsList.map((product, pi) => (
                                    <TableRow
                                      key={product.name || `product-${pi}`}
                                    >
                                      <TableCell className="max-w-0">
                                        <TruncateText
                                          title={
                                            product.name || "Unknown Product"
                                          }
                                        >
                                          {product.name || "Unknown Product"}
                                        </TruncateText>
                                      </TableCell>
                                      <TableCell className="text-right">
                                        {formatCurrency(product.revenue)}
                                      </TableCell>
                                      <TableCell className="text-right">
                                        {(
                                          (product.revenue / supplier.revenue) *
                                          100
                                        ).toFixed(1)}
                                        %
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                            {prodTotalPages > 1 && (
                              <div className="flex items-center justify-between px-2 py-2">
                                <div className="flex items-center gap-4 ">
                                  <div className="flex items-center gap-2">
                                    <select
                                      className="h-8 rounded-md border border-input bg-background px-3 py-1 text-sm"
                                      value={subTableItemsPerPage}
                                      onChange={(e) =>
                                        setSubTableItemsPerPage(
                                          Number(e.target.value),
                                        )
                                      }
                                    >
                                      <option value={5}>5</option>
                                      <option value={10}>10</option>
                                      <option value={25}>25</option>
                                      <option value={50}>50</option>
                                    </select>
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    Showing{" "}
                                    {(suppProductPage - 1) *
                                      subTableItemsPerPage +
                                      1}{" "}
                                    to{" "}
                                    {Math.min(
                                      suppProductPage * subTableItemsPerPage,
                                      supplier.products.length,
                                    )}{" "}
                                    of {supplier.products.length} products
                                  </div>
                                </div>
                                <div className="flex gap-1">
                                  <Button
                                    className="dark:border-zinc-900"
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      setSupplierProductPageFor(
                                        supplier.supplier,
                                        Math.max(1, suppProductPage - 1),
                                      )
                                    }
                                    disabled={suppProductPage === 1}
                                  >
                                    Previous
                                  </Button>
                                  {Array.from(
                                    { length: Math.min(5, prodTotalPages) },
                                    (_, i) => {
                                      let pageNum;
                                      if (prodTotalPages <= 5) {
                                        pageNum = i + 1;
                                      } else if (suppProductPage <= 3) {
                                        pageNum = i + 1;
                                      } else if (
                                        suppProductPage >=
                                        prodTotalPages - 2
                                      ) {
                                        pageNum = prodTotalPages - 4 + i;
                                      } else {
                                        pageNum = suppProductPage - 2 + i;
                                      }
                                      return (
                                        <Button
                                          key={pageNum}
                                          className="dark:border-zinc-700"
                                          variant={
                                            suppProductPage === pageNum
                                              ? "default"
                                              : "outline"
                                          }
                                          size="sm"
                                          onClick={() =>
                                            setSupplierProductPageFor(
                                              supplier.supplier,
                                              pageNum,
                                            )
                                          }
                                        >
                                          {pageNum}
                                        </Button>
                                      );
                                    },
                                  )}
                                  <Button
                                    className="dark:border-zinc-700 dark:bg-white/5"
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      setSupplierProductPageFor(
                                        supplier.supplier,
                                        Math.min(
                                          prodTotalPages,
                                          suppProductPage + 1,
                                        ),
                                      )
                                    }
                                    disabled={
                                      suppProductPage === prodTotalPages
                                    }
                                  >
                                    Next
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                          {/* Salesmen */}
                          {supplierSalesmen.length > 0 && (
                            <div>
                              <p className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wide">
                                Salesmen
                              </p>
                              <div className="rounded-md border dark:border-zinc-700">
                                <Table className="table-fixed w-full">
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead className="w-[42%]">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="-ml-2 h-7 text-xs font-semibold"
                                          title="Sort by salesman"
                                          onClick={() =>
                                            toggleSalesmanSubSort(
                                              supplier.supplier,
                                              "name",
                                            )
                                          }
                                        >
                                          Salesman{" "}
                                          <ArrowUpDown className="ml-1 h-3 w-3" />
                                        </Button>
                                      </TableHead>
                                      <TableHead className="text-right w-[20%]">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="-mr-2 h-7 text-xs font-semibold"
                                          title="Sort by revenue"
                                          onClick={() =>
                                            toggleSalesmanSubSort(
                                              supplier.supplier,
                                              "revenue",
                                            )
                                          }
                                        >
                                          Revenue{" "}
                                          <ArrowUpDown className="ml-1 h-3 w-3" />
                                        </Button>
                                      </TableHead>
                                      <TableHead className="text-right w-[20%]">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="-mr-2 h-7 text-xs font-semibold"
                                          title="Sort by transactions"
                                          onClick={() =>
                                            toggleSalesmanSubSort(
                                              supplier.supplier,
                                              "transactions",
                                            )
                                          }
                                        >
                                          Transactions{" "}
                                          <ArrowUpDown className="ml-1 h-3 w-3" />
                                        </Button>
                                      </TableHead>
                                      <TableHead className="text-right w-[18%]">
                                        % of Supplier
                                      </TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {paginatedSalesmenList.map((s, si) => (
                                      <TableRow
                                        key={s.name || `salesman-${si}`}
                                      >
                                        <TableCell className="max-w-0">
                                          <TruncateText
                                            title={s.name || "Unknown Salesman"}
                                          >
                                            {s.name || "Unknown Salesman"}
                                          </TruncateText>
                                        </TableCell>
                                        <TableCell className="text-right">
                                          {formatCurrency(s.revenue)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                          {s.transactions}
                                        </TableCell>
                                        <TableCell className="text-right">
                                          {(
                                            (s.revenue / supplier.revenue) *
                                            100
                                          ).toFixed(1)}
                                          %
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                              {salesmanTotalPages > 1 && (
                                <div className="flex items-center justify-between px-2 py-2">
                                  <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                      <select
                                        className="h-8 rounded-md border border-input bg-background px-3 py-1 text-sm"
                                        value={subTableItemsPerPage}
                                        onChange={(e) =>
                                          setSubTableItemsPerPage(
                                            Number(e.target.value),
                                          )
                                        }
                                      >
                                        <option value={5}>5</option>
                                        <option value={10}>10</option>
                                        <option value={25}>25</option>
                                        <option value={50}>50</option>
                                      </select>
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                      Showing{" "}
                                      {(suppSalesmanPage - 1) *
                                        subTableItemsPerPage +
                                        1}{" "}
                                      to{" "}
                                      {Math.min(
                                        suppSalesmanPage * subTableItemsPerPage,
                                        supplierSalesmen.length,
                                      )}{" "}
                                      of {supplierSalesmen.length} salesmen
                                    </div>
                                  </div>
                                  <div className="flex gap-1">
                                    <Button
                                      className="dark:border-zinc-700 dark:bg-white/5"
                                      variant="outline"
                                      size="sm"
                                      onClick={() =>
                                        setSupplierSalesmanPageFor(
                                          supplier.supplier,
                                          Math.max(1, suppSalesmanPage - 1),
                                        )
                                      }
                                      disabled={suppSalesmanPage === 1}
                                    >
                                      Previous
                                    </Button>
                                    {Array.from(
                                      {
                                        length: Math.min(5, salesmanTotalPages),
                                      },
                                      (_, i) => {
                                        let pageNum;
                                        if (salesmanTotalPages <= 5) {
                                          pageNum = i + 1;
                                        } else if (suppSalesmanPage <= 3) {
                                          pageNum = i + 1;
                                        } else if (
                                          suppSalesmanPage >=
                                          salesmanTotalPages - 2
                                        ) {
                                          pageNum = salesmanTotalPages - 4 + i;
                                        } else {
                                          pageNum = suppSalesmanPage - 2 + i;
                                        }
                                        return (
                                          <Button
                                            key={pageNum}
                                            className="dark:border-zinc-700"
                                            variant={
                                              suppSalesmanPage === pageNum
                                                ? "default"
                                                : "outline"
                                            }
                                            size="sm"
                                            onClick={() =>
                                              setSupplierSalesmanPageFor(
                                                supplier.supplier,
                                                pageNum,
                                              )
                                            }
                                          >
                                            {pageNum}
                                          </Button>
                                        );
                                      },
                                    )}
                                    <Button
                                      className="dark:border-zinc-700 dark:bg-white/5"
                                      variant="outline"
                                      size="sm"
                                      onClick={() =>
                                        setSupplierSalesmanPageFor(
                                          supplier.supplier,
                                          Math.min(
                                            salesmanTotalPages,
                                            suppSalesmanPage + 1,
                                          ),
                                        )
                                      }
                                      disabled={
                                        suppSalesmanPage === salesmanTotalPages
                                      }
                                    >
                                      Next
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                          {/* Customers */}
                          {supplierCustomers.length > 0 && (
                            <div>
                              <p className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wide">
                                Customers
                              </p>
                              <div className="rounded-md border dark:border-zinc-700">
                                <Table className="table-fixed w-full">
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead className="w-[42%]">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="-ml-2 h-7 text-xs font-semibold"
                                          title="Sort by customer"
                                          onClick={() =>
                                            toggleCustomerSubSort(
                                              supplier.supplier,
                                              "name",
                                            )
                                          }
                                        >
                                          Customer{" "}
                                          <ArrowUpDown className="ml-1 h-3 w-3" />
                                        </Button>
                                      </TableHead>
                                      <TableHead className="text-right w-[20%]">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="-mr-2 h-7 text-xs font-semibold"
                                          title="Sort by revenue"
                                          onClick={() =>
                                            toggleCustomerSubSort(
                                              supplier.supplier,
                                              "revenue",
                                            )
                                          }
                                        >
                                          Revenue{" "}
                                          <ArrowUpDown className="ml-1 h-3 w-3" />
                                        </Button>
                                      </TableHead>
                                      <TableHead className="text-right w-[20%]">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="-mr-2 h-7 text-xs font-semibold"
                                          title="Sort by transactions"
                                          onClick={() =>
                                            toggleCustomerSubSort(
                                              supplier.supplier,
                                              "transactions",
                                            )
                                          }
                                        >
                                          Transactions{" "}
                                          <ArrowUpDown className="ml-1 h-3 w-3" />
                                        </Button>
                                      </TableHead>
                                      <TableHead className="text-right w-[18%]">
                                        % of Supplier
                                      </TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {paginatedCustomersList.map((c, ci) => (
                                      <TableRow
                                        key={c.name || `customer-${ci}`}
                                      >
                                        <TableCell className="max-w-0">
                                          <TruncateText
                                            title={c.name || "Unknown Customer"}
                                          >
                                            {c.name || "Unknown Customer"}
                                          </TruncateText>
                                        </TableCell>
                                        <TableCell className="text-right">
                                          {formatCurrency(c.revenue)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                          {c.transactions}
                                        </TableCell>
                                        <TableCell className="text-right">
                                          {(
                                            (c.revenue / supplier.revenue) *
                                            100
                                          ).toFixed(1)}
                                          %
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                              {customerTotalPages > 1 && (
                                <div className="flex items-center justify-between px-2 py-2">
                                  <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                      <select
                                        className="h-8 rounded-md border border-input bg-background px-3 py-1 text-sm"
                                        value={subTableItemsPerPage}
                                        onChange={(e) =>
                                          setSubTableItemsPerPage(
                                            Number(e.target.value),
                                          )
                                        }
                                      >
                                        <option value={5}>5</option>
                                        <option value={10}>10</option>
                                        <option value={25}>25</option>
                                        <option value={50}>50</option>
                                      </select>
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                      Showing{" "}
                                      {(suppCustomerPage - 1) *
                                        subTableItemsPerPage +
                                        1}{" "}
                                      to{" "}
                                      {Math.min(
                                        suppCustomerPage * subTableItemsPerPage,
                                        supplierCustomers.length,
                                      )}{" "}
                                      of {supplierCustomers.length} customers
                                    </div>
                                  </div>
                                  <div className="flex gap-1">
                                    <Button
                                      className="dark:border-zinc-700 dark:bg-white/5"
                                      variant="outline"
                                      size="sm"
                                      onClick={() =>
                                        setSupplierCustomerPageFor(
                                          supplier.supplier,
                                          Math.max(1, suppCustomerPage - 1),
                                        )
                                      }
                                      disabled={suppCustomerPage === 1}
                                    >
                                      Previous
                                    </Button>
                                    {Array.from(
                                      {
                                        length: Math.min(5, customerTotalPages),
                                      },
                                      (_, i) => {
                                        let pageNum;
                                        if (customerTotalPages <= 5) {
                                          pageNum = i + 1;
                                        } else if (suppCustomerPage <= 3) {
                                          pageNum = i + 1;
                                        } else if (
                                          suppCustomerPage >=
                                          customerTotalPages - 2
                                        ) {
                                          pageNum = customerTotalPages - 4 + i;
                                        } else {
                                          pageNum = suppCustomerPage - 2 + i;
                                        }
                                        return (
                                          <Button
                                            key={pageNum}
                                            className="dark:border-zinc-700"
                                            variant={
                                              suppCustomerPage === pageNum
                                                ? "default"
                                                : "outline"
                                            }
                                            size="sm"
                                            onClick={() =>
                                              setSupplierCustomerPageFor(
                                                supplier.supplier,
                                                pageNum,
                                              )
                                            }
                                          >
                                            {pageNum}
                                          </Button>
                                        );
                                      },
                                    )}
                                    <Button
                                      className="dark:border-zinc-700 dark:bg-white/5"
                                      variant="outline"
                                      size="sm"
                                      onClick={() =>
                                        setSupplierCustomerPageFor(
                                          supplier.supplier,
                                          Math.min(
                                            customerTotalPages,
                                            suppCustomerPage + 1,
                                          ),
                                        )
                                      }
                                      disabled={
                                        suppCustomerPage === customerTotalPages
                                      }
                                    >
                                      Next
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>
                );
              })
            ) : (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  No suppliers found
                </CardContent>
              </Card>
            )}
          </div>
          <div className="flex items-center justify-between px-2 py-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <select
                  className="h-8 rounded-md border border-input bg-background px-3 py-1 text-sm"
                  value={itemsPerPage}
                  onChange={(e) =>
                    handleSetItemsPerPage(Number(e.target.value))
                  }
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
              <div className="text-sm text-muted-foreground">
                Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                {Math.min(currentPage * itemsPerPage, filteredSuppliers.length)}{" "}
                of {filteredSuppliers.length} suppliers
              </div>
            </div>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={setCurrentPagePrev}
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
                    onClick={() => setCurrentPageTo(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}
              <Button
                variant="outline"
                size="sm"
                onClick={setCurrentPageNext}
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
