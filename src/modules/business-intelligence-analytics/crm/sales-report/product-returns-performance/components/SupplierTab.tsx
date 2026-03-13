// src/modules/business-intelligence-analytics/sales-report/product-returns-performance/components/SupplierTab.tsx
"use client";

import * as React from "react";
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
import type {
  SupplierReturnPerformance,
  TopReturnItem,
  ProductReturnRecord,
} from "../types";
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
import { useTheme } from "next-themes";

// Stable module-level currency formatter — avoids creating Intl.NumberFormat on every render
const phpFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const formatCurrency = (v: number) => phpFormatter.format(v);

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
type SupplierTabProps = {
  supplierPerformance: SupplierReturnPerformance[];
  topSuppliers: TopReturnItem[];
  filteredData: ProductReturnRecord[];
};

export function SupplierTab({
  supplierPerformance,
  topSuppliers,
  filteredData,
}: SupplierTabProps) {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [expandedSuppliers, setExpandedSuppliers] = React.useState<Set<string>>(
    new Set(),
  );
  const [sortBy, setSortBy] = React.useState<
    "returnValue" | "returnCount" | "name"
  >("returnValue");
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("desc");
  const [selectedSupplier, setSelectedSupplier] = React.useState<string | null>(
    null,
  );
  const [currentPage, setCurrentPage] = React.useState(1);
  const [itemsPerPage, setItemsPerPage] = React.useState(10);
  const [supplierProductPage, setSupplierProductPage] = React.useState<
    Map<string, number>
  >(new Map());
  const [supplierCustomerPage, setSupplierCustomerPage] = React.useState<
    Map<string, number>
  >(new Map());
  const [subTableItemsPerPage, setSubTableItemsPerPage] = React.useState(5);
  const [hoveredBar, setHoveredBar] = React.useState<string | null>(null);
  // Per-supplier product sub-table sort
  const [productSubSortMap, setProductSubSortMap] = React.useState<
    Map<
      string,
      {
        by: "name" | "returnValue" | "returnCount" | "avg";
        order: "asc" | "desc";
      }
    >
  >(new Map());
  // Per-supplier customer sub-table sort
  const [customerSubSortMap, setCustomerSubSortMap] = React.useState<
    Map<
      string,
      { by: "name" | "returnValue" | "returnCount"; order: "asc" | "desc" }
    >
  >(new Map());

  const toggleProductSubSort = React.useCallback(
    (sup: string, field: "name" | "returnValue" | "returnCount" | "avg") => {
      setProductSubSortMap((prev) => {
        const next = new Map(prev);
        const cur = prev.get(sup) ?? {
          by: "returnValue" as const,
          order: "desc" as const,
        };
        next.set(
          sup,
          cur.by === field
            ? { by: field, order: cur.order === "asc" ? "desc" : "asc" }
            : { by: field, order: field === "name" ? "asc" : "desc" },
        );
        return next;
      });
    },
    [],
  );

  const toggleCustomerSubSort = React.useCallback(
    (sup: string, field: "name" | "returnValue" | "returnCount") => {
      setCustomerSubSortMap((prev) => {
        const next = new Map(prev);
        const cur = prev.get(sup) ?? {
          by: "returnValue" as const,
          order: "desc" as const,
        };
        next.set(
          sup,
          cur.by === field
            ? { by: field, order: cur.order === "asc" ? "desc" : "asc" }
            : { by: field, order: field === "name" ? "asc" : "desc" },
        );
        return next;
      });
    },
    [],
  );

  const filteredSuppliers = React.useMemo(() => {
    const suppliers = searchTerm
      ? supplierPerformance.filter((s) =>
          s.supplier.toLowerCase().includes(searchTerm.toLowerCase()),
        )
      : [...supplierPerformance];

    suppliers.sort((a, b) => {
      let comparison = 0;
      if (sortBy === "returnValue") comparison = a.returnValue - b.returnValue;
      else if (sortBy === "returnCount")
        comparison = a.returnCount - b.returnCount;
      else if (sortBy === "name")
        comparison = a.supplier.localeCompare(b.supplier);
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return suppliers;
  }, [supplierPerformance, searchTerm, sortBy, sortOrder]);

  const totalPages = Math.ceil(filteredSuppliers.length / itemsPerPage);
  const getYAxisWidth = React.useCallback(
    (data: { returnValue?: number }[]) => {
      if (!data?.length) return 60;
      const max = Math.max(...data.map((d) => d.returnValue || 0));
      return Math.max(60, formatCurrency(max).length * 8);
    },
    [],
  );

  // Stable handlers
  const handleClearSelection = React.useCallback(() => {
    setSelectedSupplier(null);
    setExpandedSuppliers(new Set());
  }, []);

  const handleToggleSort = React.useCallback(
    (target: "returnValue" | "returnCount" | "name") => {
      if (sortBy === target)
        setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
      else {
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
  const setCurrentPagePrev = React.useCallback(
    () => setCurrentPage((p) => Math.max(1, p - 1)),
    [],
  );
  const setCurrentPageNext = React.useCallback(
    () => setCurrentPage((p) => Math.min(totalPages, p + 1)),
    [totalPages],
  );
  const setCurrentPageTo = React.useCallback(
    (p: number) => setCurrentPage(p),
    [],
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

  // ── Pre-computed per-supplier customer map ───────────────────────────────────
  // Replaces getSupplierCustomers() which was O(n) per row per render.
  const allSupplierCustomers = React.useMemo(() => {
    const interim = new Map<
      string,
      Map<string, { returnValue: number; returnCount: number }>
    >();
    filteredData.forEach((r) => {
      const sup = r.supplier;
      if (!interim.has(sup)) interim.set(sup, new Map());
      const m = interim.get(sup)!;
      const prev = m.get(r.customerName) || { returnValue: 0, returnCount: 0 };
      m.set(r.customerName, {
        returnValue: prev.returnValue + r.amount,
        returnCount: prev.returnCount + 1,
      });
    });
    const result = new Map<
      string,
      Array<{ name: string; returnValue: number; returnCount: number }>
    >();
    interim.forEach((m, sup) => {
      result.set(
        sup,
        Array.from(m.entries()).map(([name, d]) => ({ name, ...d })),
      );
    });
    return result;
  }, [filteredData]);
  // ────────────────────────────────────────────────────────────────────

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
      if (next.has(supplier)) next.delete(supplier);
      else next.add(supplier);
      return next;
    });
  }, []);

  const sortedTopSuppliers = React.useMemo(() => {
    return [...topSuppliers]
      .sort((a, b) => {
        let cmp = 0;
        if (sortBy === "returnValue") cmp = a.returnValue - b.returnValue;
        else if (sortBy === "name") cmp = a.name.localeCompare(b.name);
        else cmp = a.returnCount - b.returnCount;
        return sortOrder === "asc" ? cmp : -cmp;
      })
      .slice(0, 10);
  }, [topSuppliers, sortBy, sortOrder]);

  const { theme,  } = useTheme();
  const resolvedTheme = theme;
  const isDark = resolvedTheme === "dark";
  const activeChartColors = isDark ? chartColorsDark : chartColors;

  React.useEffect(() => {
    // Listen for navigation to supplier row and auto-expand (match by sanitized id)
    const sanitize = (s: string) => s.replace(/[^a-zA-Z0-9]/g, "-");
    const handler = () => {
      const hash = window.location.hash;
      if (hash.startsWith("#supplier-row-")) {
        const safeId = hash.replace("#supplier-row-", "");
        // find supplier by matching sanitized supplier name
        const match = supplierPerformance.find(
          (s) => sanitize(s.supplier) === safeId,
        );
        if (match) {
          setExpandedSuppliers((prev) => {
            const next = new Set(prev);
            next.add(match.supplier);
            return next;
          });
          // set page so supplier is visible
          const idx = filteredSuppliers.findIndex(
            (s) => s.supplier === match.supplier,
          );
          if (idx !== -1) setCurrentPage(Math.ceil((idx + 1) / itemsPerPage));
          // scroll into view with retries
          setTimeout(() => {
            let attempts = 0;
            const id = `supplier-row-${safeId}`;
            const tryScroll = () => {
              const el = document.getElementById(id);
              if (el)
                el.scrollIntoView({ behavior: "smooth", block: "center" });
              else if (attempts < 5) {
                attempts += 1;
                setTimeout(tryScroll, 120);
              }
            };
            tryScroll();
          }, 60);
        }
      }
    };
    window.addEventListener("hashchange", handler);
    handler(); // Initial check
    return () => window.removeEventListener("hashchange", handler);
  }, [supplierPerformance, filteredSuppliers, itemsPerPage]);

  return (
    <div className="space-y-4">
      {/* Top Suppliers Chart */}
      <Card className="dark:border-zinc-700 dark:bg-white/13">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Top 10 Suppliers by Return Value</CardTitle>
              <CardDescription>
                Supplier return value comparison
              </CardDescription>
            </div>
            {selectedSupplier && (
              <Button
                className="dark:border-zinc-700"
                variant="outline"
                size="sm"
                onClick={handleClearSelection}
              >
                Clear Selection
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              returnValue: { label: "Return Value", color: "#ef4444" },
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
                  tickFormatter={(v) =>
                    v.toString().substring(0, 25) + (v.length > 25 ? "..." : "")
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
                  tickFormatter={(v) => formatCurrency(v)}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(v) => formatCurrency(Number(v))}
                    />
                  }
                />
                <Bar
                  dataKey="returnValue"
                  radius={[4, 4, 0, 0]}
                  onMouseEnter={(data) => setHoveredBar(data.name)}
                  onMouseLeave={() => setHoveredBar(null)}
                  onClick={(data: { name?: string }) =>
                    handleSelectSupplier(data?.name)
                  }
                  // onClick={React.useCallback((data: any) => {
                  //   const name = data?.name;
                  //   if (!name) return;
                  //   setSelectedSupplier(name);
                  //   setExpandedSuppliers((prev) => {
                  //     const next = new Set(prev);
                  //     next.add(name);
                  //     return next;
                  //   });
                  //   setTimeout(() => {
                  //     const safeId = name.replace(/[^a-zA-Z0-9]/g, "-");
                  //     document.getElementById(`supplier-row-${safeId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
                  //   }, 100);
                  // }, [setSelectedSupplier, setExpandedSuppliers])}
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
                          hoveredBar !== entry.name)
                          ? 0.3
                          : 1
                      }
                      style={{
                        filter:
                          hoveredBar === entry.name
                            ? "brightness(1.2) drop-shadow(0 0 3px rgba(0,0,0,0.25))"
                            : undefined,
                        transition: "filter 0.12s ease",
                        cursor: "pointer",
                      }}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Search */}
      <Card className="dark:border-zinc-700">
        <CardContent className="">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search suppliers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 dark:border-zinc-700"
            />
          </div>
        </CardContent>
      </Card>

      {/* Supplier Details */}
      <Card
        id="supplier-return-details"
        className="dark:border-zinc-700 dark:bg-white/13"
      >
        <CardHeader>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Supplier Return Details</CardTitle>
                <CardDescription>
                  {filteredSuppliers.length} suppliers with product breakdown
                </CardDescription>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                className="dark:border-zinc-700"
                variant={sortBy === "returnValue" ? "default" : "outline"}
                size="sm"
                onClick={() => handleToggleSort("returnValue")}
              >
                Sort by Return Value <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
              <Button
                className="dark:border-zinc-700"
                variant={sortBy === "returnCount" ? "default" : "outline"}
                size="sm"
                onClick={() => handleToggleSort("returnCount")}
              >
                Sort by Count <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
              <Button
                className="dark:border-zinc-700"
                variant={sortBy === "name" ? "default" : "outline"}
                size="sm"
                onClick={() => handleToggleSort("name")}
              >
                Sort by Name <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {paginatedSuppliers.length > 0 ? (
              paginatedSuppliers.map((supplier, index) => {
                const customers =
                  allSupplierCustomers.get(supplier.supplier) || [];
                const { by: productSubSortBy, order: productSubSortOrder } =
                  productSubSortMap.get(supplier.supplier) ?? {
                    by: "returnValue" as const,
                    order: "desc" as const,
                  };
                const { by: customerSubSortBy, order: customerSubSortOrder } =
                  customerSubSortMap.get(supplier.supplier) ?? {
                    by: "returnValue" as const,
                    order: "desc" as const,
                  };
                const suppProductPage =
                  supplierProductPage.get(supplier.supplier) || 1;
                const prodTotalPages = Math.ceil(
                  supplier.products.length / subTableItemsPerPage,
                );
                const paginatedProducts = [...supplier.products]
                  .sort((a, b) => {
                    let cmp = 0;
                    if (productSubSortBy === "name")
                      cmp = a.name.localeCompare(b.name);
                    else if (productSubSortBy === "returnValue")
                      cmp = a.returnValue - b.returnValue;
                    else if (productSubSortBy === "returnCount")
                      cmp = (a.returnCount || 0) - (b.returnCount || 0);
                    else if (productSubSortBy === "avg")
                      cmp =
                        (a.returnCount > 0
                          ? a.returnValue / a.returnCount
                          : 0) -
                        (b.returnCount > 0 ? b.returnValue / b.returnCount : 0);
                    return productSubSortOrder === "asc" ? cmp : -cmp;
                  })
                  .slice(
                    (suppProductPage - 1) * subTableItemsPerPage,
                    suppProductPage * subTableItemsPerPage,
                  );
                const suppCustomerPage =
                  supplierCustomerPage.get(supplier.supplier) || 1;
                const customerTotalPages = Math.ceil(
                  customers.length / subTableItemsPerPage,
                );
                const sortedCustomers = [...customers].sort((a, b) => {
                  let cmp = 0;
                  if (customerSubSortBy === "name")
                    cmp = a.name.localeCompare(b.name);
                  else if (customerSubSortBy === "returnValue")
                    cmp = a.returnValue - b.returnValue;
                  else cmp = a.returnCount - b.returnCount;
                  return customerSubSortOrder === "asc" ? cmp : -cmp;
                });
                const paginatedCustomers = sortedCustomers.slice(
                  (suppCustomerPage - 1) * subTableItemsPerPage,
                  suppCustomerPage * subTableItemsPerPage,
                );
                return (
                  <Collapsible
                    key={supplier.supplier}
                    open={expandedSuppliers.has(supplier.supplier)}
                    onOpenChange={() => toggleSupplier(supplier.supplier)}
                    id={`supplier-row-${supplier.supplier.replace(/[^a-zA-Z0-9]/g, "-")}`}
                  >
                    <Card className="dark:border-zinc-700 dark:bg-white/1">
                      <CollapsibleTrigger className="w-full">
                        <CardContent className="flex items-center justify-between p-4">
                          <div className="flex items-center gap-4">
                            <div
                              className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white"
                              style={{
                                backgroundColor:
                                  activeChartColors[
                                    (currentPage - 1) * itemsPerPage + index
                                  ],
                              }}
                            >
                              {(currentPage - 1) * itemsPerPage + index + 1}
                            </div>
                            <div className="text-left">
                              <div className="font-semibold">
                                {supplier.supplier || "Unknown Supplier"}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {supplier.products.length} products ·{" "}
                                {supplier.returnCount} returns
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <div className="text-lg font-bold ">
                                {formatCurrency(supplier.returnValue)}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Total Return Value
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
                          {/* Top Products for Supplier */}
                          <div>
                            <h4 className="text-sm font-semibold mb-2">
                              Top Products (by Return Value)
                            </h4>
                            <div className="rounded-md border dark:border-zinc-700">
                              <Table className="dark:border-zinc-700 dark:bg-white/3">
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="-ml-3 h-8 gap-1 text-xs font-medium"
                                        onClick={() =>
                                          toggleProductSubSort(
                                            supplier.supplier,
                                            "name",
                                          )
                                        }
                                      >
                                        Product{" "}
                                        <ArrowUpDown className="h-3 w-3" />
                                      </Button>
                                    </TableHead>
                                    <TableHead className="text-right">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 gap-1 text-xs font-medium"
                                        onClick={() =>
                                          toggleProductSubSort(
                                            supplier.supplier,
                                            "returnValue",
                                          )
                                        }
                                      >
                                        Return Value{" "}
                                        <ArrowUpDown className="h-3 w-3" />
                                      </Button>
                                    </TableHead>
                                    <TableHead className="text-right">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 gap-1 text-xs font-medium"
                                        onClick={() =>
                                          toggleProductSubSort(
                                            supplier.supplier,
                                            "returnCount",
                                          )
                                        }
                                      >
                                        Count{" "}
                                        <ArrowUpDown className="h-3 w-3" />
                                      </Button>
                                    </TableHead>
                                    <TableHead className="text-right">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 gap-1 text-xs font-medium"
                                        onClick={() =>
                                          toggleProductSubSort(
                                            supplier.supplier,
                                            "avg",
                                          )
                                        }
                                      >
                                        Avg / Return{" "}
                                        <ArrowUpDown className="h-3 w-3" />
                                      </Button>
                                    </TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {paginatedProducts.map((p, i) => (
                                    <TableRow key={p.name || `unknown-${i}`}>
                                      <TableCell>
                                        <div className="flex items-center gap-2">
                                          <div
                                            className="h-2 w-2 rounded-full"
                                            style={{
                                              backgroundColor:
                                                activeChartColors[
                                                  (suppProductPage - 1) *
                                                    subTableItemsPerPage +
                                                    i
                                                ],
                                            }}
                                          />
                                          {p.name || "Unknown Product"}
                                        </div>
                                      </TableCell>
                                      <TableCell className="text-right">
                                        {formatCurrency(p.returnValue)}
                                      </TableCell>
                                      <TableCell className="text-right">
                                        {p.returnCount}
                                      </TableCell>
                                      <TableCell className="text-right">
                                        {formatCurrency(
                                          p.returnCount > 0
                                            ? p.returnValue / p.returnCount
                                            : 0,
                                        )}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                            {prodTotalPages > 1 && (
                              <div className="flex items-center justify-between px-2 py-4">
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
                                <div className="flex gap-1">
                                  <Button
                                    className="dark:border-y-zinc-700 dark:bg-white/5"
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
                                      let pn: number;
                                      if (prodTotalPages <= 5) pn = i + 1;
                                      else if (suppProductPage <= 3) pn = i + 1;
                                      else if (
                                        suppProductPage >=
                                        prodTotalPages - 2
                                      )
                                        pn = prodTotalPages - 4 + i;
                                      else pn = suppProductPage - 2 + i;
                                      return (
                                        <Button
                                          key={pn}
                                          className="dark:border-y-zinc-700"
                                          variant={
                                            suppProductPage === pn
                                              ? "default"
                                              : "outline"
                                          }
                                          size="sm"
                                          onClick={() =>
                                            setSupplierProductPageFor(
                                              supplier.supplier,
                                              pn,
                                            )
                                          }
                                        >
                                          {pn}
                                        </Button>
                                      );
                                    },
                                  )}
                                  <Button
                                    className="dark:border-y-zinc-700 dark:bg-white/5"
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
                          {/* Customers for Supplier */}
                          {customers.length > 0 && (
                            <div>
                              <h4 className="text-sm font-semibold mb-2">
                                Customers
                              </h4>
                              <div className="rounded-md border">
                                <Table className="dark:border-zinc-700 dark:bg-white/3">
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="-ml-3 h-8 gap-1 text-xs font-medium"
                                          onClick={() =>
                                            toggleCustomerSubSort(
                                              supplier.supplier,
                                              "name",
                                            )
                                          }
                                        >
                                          Customer{" "}
                                          <ArrowUpDown className="h-3 w-3" />
                                        </Button>
                                      </TableHead>
                                      <TableHead className="text-right">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-8 gap-1 text-xs font-medium"
                                          onClick={() =>
                                            toggleCustomerSubSort(
                                              supplier.supplier,
                                              "returnCount",
                                            )
                                          }
                                        >
                                          Count{" "}
                                          <ArrowUpDown className="h-3 w-3" />
                                        </Button>
                                      </TableHead>
                                      <TableHead className="text-right">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-8 gap-1 text-xs font-medium"
                                          onClick={() =>
                                            toggleCustomerSubSort(
                                              supplier.supplier,
                                              "returnValue",
                                            )
                                          }
                                        >
                                          Return Value{" "}
                                          <ArrowUpDown className="h-3 w-3" />
                                        </Button>
                                      </TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {paginatedCustomers.map((c) => (
                                      <TableRow
                                        key={c.name || "unknown-customer"}
                                      >
                                        <TableCell>
                                          {c.name || "Unknown Customer"}
                                        </TableCell>
                                        <TableCell className="text-right">
                                          {c.returnCount}
                                        </TableCell>
                                        <TableCell className="text-right ">
                                          {formatCurrency(c.returnValue)}
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                              {customerTotalPages > 1 && (
                                <div className="flex items-center justify-between px-2 py-4">
                                  <div className="text-sm text-muted-foreground">
                                    Showing{" "}
                                    {(suppCustomerPage - 1) *
                                      subTableItemsPerPage +
                                      1}{" "}
                                    to{" "}
                                    {Math.min(
                                      suppCustomerPage * subTableItemsPerPage,
                                      customers.length,
                                    )}{" "}
                                    of {customers.length} customers
                                  </div>
                                  <div className="flex gap-1">
                                    <Button
                                      className="dark:border-y-zinc-700 dark:bg-white/5"
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
                                        let pn: number;
                                        if (customerTotalPages <= 5) pn = i + 1;
                                        else if (suppCustomerPage <= 3)
                                          pn = i + 1;
                                        else if (
                                          suppCustomerPage >=
                                          customerTotalPages - 2
                                        )
                                          pn = customerTotalPages - 4 + i;
                                        else pn = suppCustomerPage - 2 + i;
                                        return (
                                          <Button
                                            key={pn}
                                            className="dark:border-y-zinc-700"
                                            variant={
                                              suppCustomerPage === pn
                                                ? "default"
                                                : "outline"
                                            }
                                            size="sm"
                                            onClick={() =>
                                              setSupplierCustomerPageFor(
                                                supplier.supplier,
                                                pn,
                                              )
                                            }
                                          >
                                            {pn}
                                          </Button>
                                        );
                                      },
                                    )}
                                    <Button
                                      className="dark:border-y-zinc-700 dark:bg-white/5"
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
              <div className="py-8 text-center text-muted-foreground">
                No suppliers found
              </div>
            )}
          </div>
          {/* Pagination */}
          <div className="flex items-center justify-between px-2 py-4">
            <div className="flex items-center gap-4">
              <select
                className="h-8 rounded-md border border-input bg-background px-3 py-1 text-sm dark:border-zinc-700"
                value={itemsPerPage}
                onChange={(e) => handleSetItemsPerPage(Number(e.target.value))}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <div className="text-sm text-muted-foreground">
                Showing{" "}
                {Math.min(
                  (currentPage - 1) * itemsPerPage + 1,
                  filteredSuppliers.length,
                )}{" "}
                to{" "}
                {Math.min(currentPage * itemsPerPage, filteredSuppliers.length)}{" "}
                of {filteredSuppliers.length} suppliers
              </div>
            </div>
            <div className="flex gap-1">
              <Button
                className="dark:border-y-zinc-700 dark:bg-white/5"
                variant="outline"
                size="sm"
                onClick={setCurrentPagePrev}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pn: number;
                if (totalPages <= 5) pn = i + 1;
                else if (currentPage <= 3) pn = i + 1;
                else if (currentPage >= totalPages - 2) pn = totalPages - 4 + i;
                else pn = currentPage - 2 + i;
                return (
                  <Button
                    key={pn}
                    className="dark:border-y-zinc-700"
                    variant={currentPage === pn ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPageTo(pn)}
                  >
                    {pn}
                  </Button>
                );
              })}
              <Button
                className="dark:border-y-zinc-700 dark:bg-white/5"
                variant="outline"
                size="sm"
                onClick={setCurrentPageNext}
                disabled={currentPage === totalPages || totalPages === 0}
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
