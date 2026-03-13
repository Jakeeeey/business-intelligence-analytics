// src/modules/business-intelligence-analytics/sales-report/product-returns-performance/components/ProductTab.tsx
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
import { Search, ArrowUpDown, ChevronRight, ChevronDown } from "lucide-react";
import type { ProductReturnTrend, ProductReturnRecord } from "../types";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import {
  LineChart,
  Line,
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
import { useTheme } from "next-themes";

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

// Module-scope formatter — avoids creating Intl.NumberFormat on every call
const _phpFmtPRP = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const formatCurrency = (v: number) => _phpFmtPRP.format(v);

type ProductTabProps = {
  allProducts: { name: string; returnValue: number; returnCount: number }[];
  productTrends: ProductReturnTrend[];
  filteredData: ProductReturnRecord[];
};

export function ProductTab({
  allProducts,
  productTrends,
  filteredData,
}: ProductTabProps) {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [sortBy, setSortBy] = React.useState<
    "returnValue" | "returnCount" | "avg"
  >("returnValue");
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [itemsPerPage, setItemsPerPage] = React.useState(10);
  const [timePeriod, setTimePeriod] = React.useState<
    | "daily"
    | "weekly"
    | "bi-weekly"
    | "monthly"
    | "bi-monthly"
    | "quarterly"
    | "semi-annually"
    | "yearly"
  >("monthly");
  const [expandedProducts, setExpandedProducts] = React.useState<Set<string>>(
    new Set(),
  );
  const [selectedProductInTrend, setSelectedProductInTrend] = React.useState<
    string | null
  >(null);
  const [hoveredProductInTrend, setHoveredProductInTrend] = React.useState<
    string | null
  >(null);
  const [customerPage, setCustomerPage] = React.useState<Map<string, number>>(
    new Map(),
  );
  type CustomerSortField =
    | "customer"
    | "division"
    | "operation"
    | "salesman"
    | "returnValue"
    | "returnCount"
    | "avg";
  const [customerSortMap, setCustomerSortMap] = React.useState<
    Map<string, { by: CustomerSortField; order: "asc" | "desc" }>
  >(new Map());
  const customerItemsPerPage = 10;

  const getYAxisWidth = (data: Array<Record<string, unknown>>) => {
    if (!data?.length) return 60;
    const maxValue = Math.max(
      ...data.map((d) =>
        typeof d.returnValue === "number" ? d.returnValue : 0,
      ),
    );
    const formatted = formatCurrency(maxValue);
    return Math.max(60, formatted.length * 8);
  };

  const parseYMD = (s: string) => {
    if (!s) return new Date(NaN);
    const parts = s.split("-").map(Number);
    if (parts.length === 3 && parts.every((n) => !Number.isNaN(n))) {
      return new Date(parts[0], parts[1] - 1, parts[2]);
    }
    const d = new Date(s);
    return isNaN(d.getTime()) ? new Date(NaN) : d;
  };

  const formatPeriodLabel = (label: string) => {
    if (!label) return "";
    try {
      switch (timePeriod) {
        case "daily": {
          const d = parseYMD(label);
          if (isNaN(d.getTime())) return label;
          return (
            d.toLocaleString("en-US", { month: "short" }) + " " + d.getDate()
          );
        }
        case "weekly": {
          const d = parseYMD(label);
          if (isNaN(d.getTime())) return label;
          // compute Monday-start week
          const dayIndex = (d.getDay() + 6) % 7; // Monday=0
          const monday = new Date(d);
          monday.setDate(d.getDate() - dayIndex);
          const sunday = new Date(monday);
          sunday.setDate(monday.getDate() + 6);
          if (monday.getMonth() === sunday.getMonth()) {
            return (
              monday.toLocaleString("en-US", { month: "short" }) +
              " " +
              monday.getDate() +
              "-" +
              sunday.getDate()
            );
          }
          return (
            monday.toLocaleString("en-US", { month: "short" }) +
            " " +
            monday.getDate() +
            " - " +
            sunday.toLocaleString("en-US", { month: "short" }) +
            " " +
            sunday.getDate()
          );
        }
        case "bi-weekly": {
          const m = label.match(/(\d{4})-(\d{2})-W(\d+)/);
          if (m) {
            const year = Number(m[1]);
            const month = Number(m[2]) - 1;
            const weekIndex = Number(m[3]);
            const start = new Date(year, month, weekIndex * 14 + 1);
            const end = new Date(start);
            end.setDate(start.getDate() + 13);
            if (start.getMonth() === end.getMonth()) {
              return (
                start.toLocaleString("en-US", { month: "short" }) +
                " " +
                start.getDate() +
                "-" +
                end.getDate()
              );
            }
            return (
              start.toLocaleString("en-US", { month: "short" }) +
              " " +
              start.getDate() +
              " - " +
              end.toLocaleString("en-US", { month: "short" }) +
              " " +
              end.getDate()
            );
          }
          // fallback: show start + 13 days
          const d = parseYMD(label);
          if (isNaN(d.getTime())) return label;
          const start = new Date(d);
          const end = new Date(start);
          end.setDate(start.getDate() + 13);
          return (
            start.toLocaleString("en-US", { month: "short" }) +
            " " +
            start.getDate() +
            "-" +
            end.getDate()
          );
        }
        case "monthly": {
          const [y, m] = label.split("-");
          if (!y || !m) return label;
          const dt = new Date(Number(y), Number(m) - 1, 1);
          return (
            dt.toLocaleString("en-US", { month: "short" }) +
            " " +
            dt.getFullYear()
          );
        }
        case "bi-monthly": {
          const m = label.match(/(\d{4})-B(\d+)/);
          if (!m) return label;
          const year = Number(m[1]);
          const b = Number(m[2]);
          const startMonth = (b - 1) * 2;
          const start = new Date(year, startMonth, 1);
          const end = new Date(year, startMonth + 1, 1);
          return (
            start.toLocaleString("en-US", { month: "short" }) +
            "-" +
            end.toLocaleString("en-US", { month: "short" }) +
            " " +
            year
          );
        }
        case "quarterly": {
          const m = label.match(/(\d{4})-Q(\d+)/);
          if (m) return `Q${m[2]} ${m[1]}`;
          return label;
        }
        case "semi-annually": {
          const m = label.match(/(\d{4})-H(\d+)/);
          if (m) return `H${m[2]} ${m[1]}`;
          return label;
        }
        case "yearly":
          return label;
        default:
          return label;
      }
    } catch {
      return label;
    }
  };

  const toggleProduct = React.useCallback((productName: string) => {
    setExpandedProducts((prev) => {
      const next = new Set(prev);
      if (next.has(productName)) {
        next.delete(productName);
      } else {
        next.add(productName);
      }
      return next;
    });
  }, []);

  const filteredProducts = React.useMemo(() => {
    const products = searchTerm
      ? allProducts.filter((p) =>
          p.name.toLowerCase().includes(searchTerm.toLowerCase()),
        )
      : [...allProducts];

    products.sort((a, b) => {
      let comparison = 0;
      if (sortBy === "returnValue") comparison = a.returnValue - b.returnValue;
      else if (sortBy === "returnCount")
        comparison = a.returnCount - b.returnCount;
      else if (sortBy === "avg")
        comparison =
          a.returnValue / a.returnCount - b.returnValue / b.returnCount;
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return products;
  }, [allProducts, searchTerm, sortBy, sortOrder]);

  const handleTrendLineClick = React.useCallback(
    (productName: string) => {
      setSelectedProductInTrend(productName);
      setExpandedProducts((prev) => {
        const next = new Set(prev);
        next.add(productName);
        return next;
      });

      const idx = filteredProducts.findIndex((p) => p.name === productName);
      if (idx !== -1) {
        const targetPage = Math.ceil((idx + 1) / itemsPerPage);
        setCurrentPage(targetPage);
      }
      setTimeout(() => {
        const id = `product-row-${productName.replace(/[^a-zA-Z0-9]/g, "-")}`;
        document
          .getElementById(id)
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 150);
    },
    [filteredProducts, itemsPerPage],
  );

  // Get product metadata (brand, category)
  const getProductMeta = (productName: string) => {
    const rec = filteredData.find((r) => r.productName === productName);
    return {
      brand: rec?.productBrand || "—",
      category: rec?.productCategory || "—",
    };
  };

  // Get customers for a product
  const getProductCustomers = (productName: string) => {
    const map = new Map<
      string,
      {
        returnValue: number;
        returnCount: number;
        divisionName: string;
        operationName: string;
        salesmanName: string;
      }
    >();

    filteredData
      .filter((r) => r.productName === productName)
      .forEach((r) => {
        const existing = map.get(r.customerName) || {
          returnValue: 0,
          returnCount: 0,
          divisionName: r.divisionName,
          operationName: r.operationName,
          salesmanName: r.salesmanName,
        };
        map.set(r.customerName, {
          returnValue: existing.returnValue + r.amount,
          returnCount: existing.returnCount + 1,
          divisionName: r.divisionName,
          operationName: r.operationName,
          salesmanName: r.salesmanName,
        });
      });

    const customers = Array.from(map.entries()).map(([customer, data]) => ({
      customer,
      ...data,
    }));

    // Apply per-product sort if present
    const { by: sortByField, order: sortOrderField } = customerSortMap.get(
      productName,
    ) ?? { by: "returnValue", order: "desc" };

    customers.sort((a, b) => {
      let comparison = 0;
      if (sortByField === "customer")
        comparison = a.customer.localeCompare(b.customer);
      else if (sortByField === "division")
        comparison = (a.divisionName || "").localeCompare(b.divisionName || "");
      else if (sortByField === "operation")
        comparison = (a.operationName || "").localeCompare(
          b.operationName || "",
        );
      else if (sortByField === "salesman")
        comparison = (a.salesmanName || "").localeCompare(b.salesmanName || "");
      else if (sortByField === "returnValue")
        comparison = a.returnValue - b.returnValue;
      else if (sortByField === "returnCount")
        comparison = a.returnCount - b.returnCount;
      else if (sortByField === "avg")
        comparison =
          a.returnValue / a.returnCount - b.returnValue / b.returnCount;
      return sortOrderField === "asc" ? comparison : -comparison;
    });

    return customers;
  };

  // Aggregate trend by time period
  const aggregatedTrends = React.useMemo(() => {
    return productTrends.map((pt) => {
      const dataMap = new Map<string, number>();

      // Pre-sort pt.data chronologically before aggregation
      const sortedData = [...pt.data].sort((a, b) => {
        const [yearA, monthA, dayA] = a.date.split("-").map(Number);
        const [yearB, monthB, dayB] = b.date.split("-").map(Number);
        return (
          new Date(yearA, monthA - 1, dayA).getTime() -
          new Date(yearB, monthB - 1, dayB).getTime()
        );
      });

      sortedData.forEach((d) => {
        const date = new Date(d.date);
        let key = "";

        if (timePeriod === "daily") {
          key = d.date;
        } else if (timePeriod === "weekly") {
          const ws = new Date(date);
          ws.setDate(date.getDate() - date.getDay());
          key = ws.toISOString().split("T")[0];
        } else if (timePeriod === "bi-weekly") {
          const weekNum = Math.floor(date.getDate() / 14);
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-W${weekNum}`;
        } else if (timePeriod === "monthly") {
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        } else if (timePeriod === "bi-monthly") {
          const b = Math.floor(date.getMonth() / 2);
          key = `${date.getFullYear()}-B${b + 1}`;
        } else if (timePeriod === "quarterly") {
          const q = Math.floor(date.getMonth() / 3);
          key = `${date.getFullYear()}-Q${q + 1}`;
        } else if (timePeriod === "semi-annually") {
          const h = Math.floor(date.getMonth() / 6);
          key = `${date.getFullYear()}-H${h + 1}`;
        } else if (timePeriod === "yearly") {
          key = `${date.getFullYear()}`;
        }

        dataMap.set(key, (dataMap.get(key) || 0) + d.returnValue);
      });

      const getDateValue = (dateStr: string) => {
        if (timePeriod === "daily" || timePeriod === "weekly") {
          const [year, month, day] = dateStr.split("-").map(Number);
          return new Date(year, month - 1, day).getTime();
        }
        if (timePeriod === "monthly") {
          const [year, month] = dateStr.split("-").map(Number);
          return new Date(year, month - 1, 1).getTime();
        }
        const matchBW = dateStr.match(/(\d{4})-(\d{2})-W(\d+)/);
        if (matchBW)
          return new Date(
            Number(matchBW[1]),
            Number(matchBW[2]) - 1,
            Number(matchBW[3]) * 14,
          ).getTime();
        const matchQ = dateStr.match(/(\d{4})-Q(\d+)/);
        if (matchQ)
          return new Date(
            Number(matchQ[1]),
            (Number(matchQ[2]) - 1) * 3,
            1,
          ).getTime();
        const matchB = dateStr.match(/(\d{4})-B(\d+)/);
        if (matchB)
          return new Date(
            Number(matchB[1]),
            (Number(matchB[2]) - 1) * 2,
            1,
          ).getTime();
        const matchH = dateStr.match(/(\d{4})-H(\d+)/);
        if (matchH)
          return new Date(
            Number(matchH[1]),
            (Number(matchH[2]) - 1) * 6,
            1,
          ).getTime();
        if (timePeriod === "yearly")
          return new Date(Number(dateStr), 0, 1).getTime();
        return 0;
      };

      const data = Array.from(dataMap.entries())
        .map(([date, returnValue]) => ({ date, returnValue }))
        .sort((a, b) => getDateValue(a.date) - getDateValue(b.date));

      return { productName: pt.productName, data };
    });
  }, [productTrends, timePeriod]);

  // Collect all unique dates from all products and sort them chronologically
  const allDates = React.useMemo(() => {
    const dateSet = new Set<string>();
    aggregatedTrends.forEach((pt) => {
      pt.data.forEach((d) => dateSet.add(d.date));
    });

    return Array.from(dateSet).sort((a, b) => {
      const getDateValue = (dateStr: string) => {
        if (timePeriod === "daily" || timePeriod === "weekly") {
          const [year, month, day] = dateStr.split("-").map(Number);
          return new Date(year, month - 1, day).getTime();
        }
        if (timePeriod === "monthly") {
          const [year, month] = dateStr.split("-").map(Number);
          return new Date(year, month - 1, 1).getTime();
        }
        const matchBW = dateStr.match(/(\d{4})-(\d{2})-W(\d+)/);
        if (matchBW)
          return new Date(
            Number(matchBW[1]),
            Number(matchBW[2]) - 1,
            Number(matchBW[3]) * 14,
          ).getTime();
        const matchQ = dateStr.match(/(\d{4})-Q(\d+)/);
        if (matchQ)
          return new Date(
            Number(matchQ[1]),
            (Number(matchQ[2]) - 1) * 3,
            1,
          ).getTime();
        const matchB = dateStr.match(/(\d{4})-B(\d+)/);
        if (matchB)
          return new Date(
            Number(matchB[1]),
            (Number(matchB[2]) - 1) * 2,
            1,
          ).getTime();
        const matchH = dateStr.match(/(\d{4})-H(\d+)/);
        if (matchH)
          return new Date(
            Number(matchH[1]),
            (Number(matchH[2]) - 1) * 6,
            1,
          ).getTime();
        if (timePeriod === "yearly")
          return new Date(Number(dateStr), 0, 1).getTime();
        return 0;
      };
      return getDateValue(a) - getDateValue(b);
    });
  }, [aggregatedTrends, timePeriod]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = React.useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(start, start + itemsPerPage);
  }, [filteredProducts, currentPage, itemsPerPage]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortBy, sortOrder]);

  const handleCustomerSort = (
    productName: string,
    field: CustomerSortField,
  ) => {
    setCustomerSortMap((prev) => {
      const next = new Map(prev);
      const existing = next.get(productName);
      if (existing && existing.by === field) {
        next.set(productName, {
          by: field,
          order: existing.order === "asc" ? "desc" : "asc",
        });
      } else {
        next.set(productName, { by: field, order: "desc" });
      }
      return next;
    });
    // reset paging for that product
    setCustomerPage((prev) => {
      const next = new Map(prev);
      next.set(productName, 1);
      return next;
    });
  };

  const { theme } = useTheme();
  const resolvedTheme =  theme;
  const isDark = resolvedTheme === "dark";
  const activeChartColors = isDark ? chartColorsDark : chartColors;

  const chartLines = React.useMemo(() => {
    return aggregatedTrends.map((pt, i) => {
      const color = activeChartColors[i % activeChartColors.length];
      const isSelected = selectedProductInTrend === pt.productName;
      const isHovered = hoveredProductInTrend === pt.productName;
      const opacity =
        (selectedProductInTrend && !isSelected) ||
        (!selectedProductInTrend && hoveredProductInTrend && !isHovered)
          ? 0.3
          : 1;
      return (
        <Line
          key={pt.productName}
          data={pt.data}
          type="monotone"
          dataKey="returnValue"
          name={pt.productName}
          stroke={color}
          strokeWidth={isSelected || isHovered ? 3 : 2}
          strokeOpacity={opacity}
          dot={{
            r: isSelected || isHovered ? 7 : 6,
            fill: color,
            stroke: "hsl(var(--background))",
            strokeWidth: 5,
            opacity: opacity,
          }}
          activeDot={{
            r: 9,
            fill: color,
            stroke: "hsl(var(--background))",
            strokeWidth: 2,
            onMouseOver: () => setHoveredProductInTrend(pt.productName),
            onClick: () => handleTrendLineClick(pt.productName),
          }}
          onClick={() => handleTrendLineClick(pt.productName)}
          style={{ cursor: "pointer" }}
        />
      );
    });
  }, [
    aggregatedTrends,
    activeChartColors,
    selectedProductInTrend,
    hoveredProductInTrend,
    handleTrendLineClick,
  ]);

  React.useEffect(() => {
    // Listen for navigation to product row and auto-expand (robust match by sanitized id)
    const sanitize = (s: string) => s.replace(/[^a-zA-Z0-9]/g, "-");
    const handler = () => {
      const hash = window.location.hash;
      if (hash.startsWith("#product-row-")) {
        const safeId = hash.replace("#product-row-", "");
        // find product by matching sanitized name
        const match = allProducts.find((p) => sanitize(p.name) === safeId);
        if (match) {
          setExpandedProducts((prev) => {
            const next = new Set(prev);
            next.add(match.name);
            return next;
          });
          // put the product page into view
          setTimeout(() => {
            // recompute filtered products and find index
            const idx = filteredProducts.findIndex(
              (p) => p.name === match.name,
            );
            if (idx !== -1) {
              setCurrentPage(Math.ceil((idx + 1) / itemsPerPage));
            }
            // try scrolling a few times if element not present yet
            const id = `product-row-${safeId}`;
            let attempts = 0;
            const tryScroll = () => {
              const el = document.getElementById(id);
              if (el) {
                el.scrollIntoView({ behavior: "smooth", block: "center" });
              } else if (attempts < 5) {
                attempts += 1;
                setTimeout(tryScroll, 120);
              }
            };
            tryScroll();
          }, 50);
        }
      }
    };
    window.addEventListener("hashchange", handler);
    handler(); // Initial check
    return () => window.removeEventListener("hashchange", handler);
  }, [allProducts, filteredProducts, itemsPerPage]);

  return (
    <div className="space-y-4">
      {/* Product Return Trends Chart */}
      {productTrends.length > 0 && (
        <Card className="dark:border-zinc-700 dark:bg-white/13">
          <CardHeader>
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Top 5 Products – Return Trend</CardTitle>
                  <CardDescription>
                    Return value over time (click line to highlight)
                  </CardDescription>
                </div>
                {selectedProductInTrend && (
                  <Button
                    className="dark:border-zinc-700"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedProductInTrend(null);
                      setExpandedProducts(new Set());
                    }}
                  >
                    Clear Selection
                  </Button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  className="dark:border-zinc-700"
                  variant={timePeriod === "daily" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setTimePeriod("daily");
                    setCurrentPage(1);
                    setExpandedProducts(new Set());
                  }}
                >
                  Daily
                </Button>
                <Button
                  className="dark:border-zinc-700"
                  variant={timePeriod === "weekly" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setTimePeriod("weekly");
                    setCurrentPage(1);
                    setExpandedProducts(new Set());
                  }}
                >
                  Weekly
                </Button>
                <Button
                  className="dark:border-zinc-700"
                  variant={timePeriod === "bi-weekly" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setTimePeriod("bi-weekly");
                    setCurrentPage(1);
                    setExpandedProducts(new Set());
                  }}
                >
                  Bi-Weekly
                </Button>
                <Button
                  className="dark:border-zinc-700"
                  variant={timePeriod === "monthly" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setTimePeriod("monthly");
                    setCurrentPage(1);
                    setExpandedProducts(new Set());
                  }}
                >
                  Monthly
                </Button>
                <Button
                  className="dark:border-zinc-700"
                  variant={timePeriod === "bi-monthly" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setTimePeriod("bi-monthly");
                    setCurrentPage(1);
                    setExpandedProducts(new Set());
                  }}
                >
                  Bi-Monthly
                </Button>
                <Button
                  className="dark:border-zinc-700"
                  variant={timePeriod === "quarterly" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setTimePeriod("quarterly");
                    setCurrentPage(1);
                    setExpandedProducts(new Set());
                  }}
                >
                  Quarterly
                </Button>
                <Button
                  className="dark:border-zinc-700"
                  variant={
                    timePeriod === "semi-annually" ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => {
                    setTimePeriod("semi-annually");
                    setCurrentPage(1);
                    setExpandedProducts(new Set());
                  }}
                >
                  Semi-Annually
                </Button>
                <Button
                  className="dark:border-zinc-700"
                  variant={timePeriod === "yearly" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setTimePeriod("yearly");
                    setCurrentPage(1);
                    setExpandedProducts(new Set());
                  }}
                >
                  Yearly
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={Object.fromEntries(
                aggregatedTrends.map((pt, i) => [
                  pt.productName,
                  {
                    label: pt.productName,
                    color: activeChartColors[i % activeChartColors.length],
                  },
                ]),
              )}
              className="h-100 w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart onMouseLeave={() => setHoveredProductInTrend(null)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    type="category"
                    allowDuplicatedCategory={false}
                    domain={allDates}
                    ticks={allDates}
                    tickFormatter={(v) => formatPeriodLabel(String(v))}
                  />
                  <YAxis
                    domain={[0, "auto"]}
                    width={getYAxisWidth(allProducts)}
                    tickFormatter={(v) => formatCurrency(v)}
                  />
                  <ChartTooltip
                    content={(props) => {
                      const { active, payload, label } = props as unknown as {
                        active?: boolean;
                        payload?: Array<{
                          name?: string;
                          value?: number;
                          color?: string;
                        }>;
                        label?: string;
                      };
                      if (!active || !payload || payload.length === 0)
                        return null;
                      const target = hoveredProductInTrend
                        ? payload.find((e) => e.name === hoveredProductInTrend)
                        : payload[0];
                      if (!target) return null;
                      const rank =
                        aggregatedTrends.findIndex(
                          (t) => t.productName === target.name,
                        ) + 1;
                      return (
                        <div className="rounded-lg border bg-background p-3 shadow-md text-sm min-w-48 space-y-1.5">
                          <p className="text-xs text-muted-foreground">
                            {formatPeriodLabel(String(label))}
                          </p>
                          <div className="flex items-center gap-2">
                            <div
                              className="h-3 w-3 rounded-full shrink-0"
                              style={{ backgroundColor: target.color }}
                            />
                            <span className="font-semibold leading-tight text-xs wrap-break-word">
                              {target.name}
                            </span>
                          </div>
                          <div className="border-t pt-1.5 space-y-1">
                            <div className="flex justify-between gap-4">
                              <span className="text-muted-foreground">
                                Return Value
                              </span>
                              <span className="font-medium">
                                {formatCurrency(target.value as number)}
                              </span>
                            </div>
                            <div className="flex justify-between gap-4">
                              <span className="text-muted-foreground">
                                Rank
                              </span>
                              <span className="font-medium">#{rank}</span>
                            </div>
                          </div>
                        </div>
                      );
                    }}
                    cursor={{ strokeDasharray: "3 3" }}
                    allowEscapeViewBox={{ x: false, y: true }}
                  />
                  <Legend />
                  {chartLines}
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <Card className="dark:border-zinc-700">
        <CardContent className="">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 dark:border-zinc-700"
            />
          </div>
        </CardContent>
      </Card>

      {/* Product Returns Table */}
      <Card className="dark:border-zinc-700 dark:bg-white/13">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Product Returns Table</CardTitle>
              <CardDescription>
                {filteredProducts.length} products found
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table className="table-fixed w-full dark:border-y-zinc-700 dark:bg-white/3">
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-0">Product Name</TableHead>
                  <TableHead className="min-w-0 text-muted-foreground">
                    Brand
                  </TableHead>
                  <TableHead className="min-w-0 text-muted-foreground">
                    Category
                  </TableHead>
                  <TableHead className="w-30 text-right">
                    <Button
                      className="dark:border-zinc-700"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (sortBy === "returnCount") {
                          setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                        } else {
                          setSortBy("returnCount");
                          setSortOrder("desc");
                        }
                      }}
                      style={{ height: 32 }}
                    >
                      Return Count <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="w-46 text-right">
                    <Button
                      className="dark:border-zinc-700"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (sortBy === "returnValue") {
                          setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                        } else {
                          setSortBy("returnValue");
                          setSortOrder("desc");
                        }
                      }}
                      style={{ height: 32 }}
                    >
                      Return Value <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="w-46 text-right">
                    <Button
                      className="dark:border-zinc-700"
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
                      style={{ height: 32 }}
                    >
                      Avg Return Value <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedProducts.length > 0 ? (
                  paginatedProducts.map((product, index) => {
                    const isExpanded = expandedProducts.has(product.name);
                    const meta = getProductMeta(product.name);
                    const customers = isExpanded
                      ? getProductCustomers(product.name)
                      : [];
                    const color =
                      activeChartColors[
                        ((currentPage - 1) * itemsPerPage + index) %
                          activeChartColors.length
                      ];
                    return (
                      <React.Fragment key={product.name}>
                        <TableRow
                          id={`product-row-${product.name.replace(/[^a-zA-Z0-9]/g, "-")}`}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => toggleProduct(product.name)}
                        >
                          <TableCell className="min-w-0">
                            <div className="flex items-center gap-2">
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                              )}
                              <span
                                className="font-medium block min-w-0 truncate"
                                style={{ color }}
                              >
                                {product.name}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground min-w-0">
                            <span className="inline-block truncate">
                              {meta.brand}
                            </span>
                          </TableCell>
                          <TableCell className="text-muted-foreground min-w-0">
                            <span className="inline-block truncate">
                              {meta.category}
                            </span>
                          </TableCell>
                          <TableCell className="w-28 text-right">
                            {product.returnCount}
                          </TableCell>
                          <TableCell className="w-36 text-right font-medium">
                            {formatCurrency(product.returnValue)}
                          </TableCell>
                          <TableCell className="w-36 text-right">
                            {formatCurrency(
                              product.returnValue / product.returnCount,
                            )}
                          </TableCell>
                        </TableRow>
                        {/* Expanded Customer Drilldown */}
                        {isExpanded &&
                          customers.length > 0 &&
                          (() => {
                            const currentCustomerPage =
                              customerPage.get(product.name) || 1;
                            const customerTotalPages = Math.ceil(
                              customers.length / customerItemsPerPage,
                            );
                            const startIdx =
                              (currentCustomerPage - 1) * customerItemsPerPage;
                            const paginatedCustomers = customers.slice(
                              startIdx,
                              startIdx + customerItemsPerPage,
                            );
                            return (
                              <TableRow>
                                <TableCell
                                  colSpan={6}
                                  className="bg-muted/30 p-0"
                                >
                                  <div className="px-12 py-4">
                                    <div className="rounded-md border bg-background">
                                      <Table className=" dark:border-y-zinc-700 dark:bg-white/15">
                                        <TableHeader>
                                          <TableRow>
                                            <TableHead className="w-120">
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() =>
                                                  handleCustomerSort(
                                                    product.name,
                                                    "customer",
                                                  )
                                                }
                                                className="h-8"
                                              >
                                                Customer{" "}
                                                <ArrowUpDown className="ml-2 h-4 w-4" />
                                              </Button>
                                            </TableHead>
                                            <TableHead>
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() =>
                                                  handleCustomerSort(
                                                    product.name,
                                                    "division",
                                                  )
                                                }
                                                className="h-8"
                                              >
                                                Division{" "}
                                                <ArrowUpDown className="ml-2 h-4 w-4" />
                                              </Button>
                                            </TableHead>
                                            <TableHead>
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() =>
                                                  handleCustomerSort(
                                                    product.name,
                                                    "operation",
                                                  )
                                                }
                                                className="h-8"
                                              >
                                                Operation{" "}
                                                <ArrowUpDown className="ml-2 h-4 w-4" />
                                              </Button>
                                            </TableHead>
                                            <TableHead className="w-50">
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() =>
                                                  handleCustomerSort(
                                                    product.name,
                                                    "salesman",
                                                  )
                                                }
                                                className="h-8"
                                              >
                                                Salesman{" "}
                                                <ArrowUpDown className="ml-2 h-4 w-4" />
                                              </Button>
                                            </TableHead>
                                            <TableHead className="text-right">
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() =>
                                                  handleCustomerSort(
                                                    product.name,
                                                    "returnCount",
                                                  )
                                                }
                                                className="h-8"
                                              >
                                                Return Count{" "}
                                                <ArrowUpDown className="ml-2 h-4 w-4" />
                                              </Button>
                                            </TableHead>
                                            <TableHead className="text-right">
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() =>
                                                  handleCustomerSort(
                                                    product.name,
                                                    "returnValue",
                                                  )
                                                }
                                                className="h-8"
                                              >
                                                Return Value{" "}
                                                <ArrowUpDown className="ml-2 h-4 w-4" />
                                              </Button>
                                            </TableHead>
                                            <TableHead className="text-right">
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() =>
                                                  handleCustomerSort(
                                                    product.name,
                                                    "avg",
                                                  )
                                                }
                                                className="h-8"
                                              >
                                                Avg{" "}
                                                <ArrowUpDown className="ml-2 h-4 w-4" />
                                              </Button>
                                            </TableHead>
                                          </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                          {paginatedCustomers.map((c, idx) => (
                                            <TableRow
                                              key={`${c.customer}-${idx}`}
                                            >
                                              <TableCell>
                                                {c.customer}
                                              </TableCell>
                                              <TableCell>
                                                {c.divisionName}
                                              </TableCell>
                                              <TableCell>
                                                {c.operationName}
                                              </TableCell>
                                              <TableCell>
                                                {c.salesmanName}
                                              </TableCell>
                                              <TableCell className="text-right">
                                                {c.returnCount}
                                              </TableCell>
                                              <TableCell className="text-right">
                                                {formatCurrency(c.returnValue)}
                                              </TableCell>
                                              <TableCell className="text-right">
                                                {formatCurrency(
                                                  c.returnValue / c.returnCount,
                                                )}
                                              </TableCell>
                                            </TableRow>
                                          ))}
                                        </TableBody>
                                      </Table>
                                    </div>
                                    {customerTotalPages > 1 && (
                                      <div className="flex items-center justify-between px-2 py-4">
                                        <div className="text-sm text-muted-foreground">
                                          Showing {startIdx + 1} to{" "}
                                          {Math.min(
                                            startIdx + customerItemsPerPage,
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
                                              setCustomerPage((prev) => {
                                                const next = new Map(prev);
                                                next.set(
                                                  product.name,
                                                  Math.max(
                                                    1,
                                                    currentCustomerPage - 1,
                                                  ),
                                                );
                                                return next;
                                              })
                                            }
                                            disabled={currentCustomerPage === 1}
                                          >
                                            Previous
                                          </Button>
                                          {Array.from(
                                            {
                                              length: Math.min(
                                                5,
                                                customerTotalPages,
                                              ),
                                            },
                                            (_, i) => {
                                              let pageNum: number;
                                              if (customerTotalPages <= 5)
                                                pageNum = i + 1;
                                              else if (currentCustomerPage <= 3)
                                                pageNum = i + 1;
                                              else if (
                                                currentCustomerPage >=
                                                customerTotalPages - 2
                                              )
                                                pageNum =
                                                  customerTotalPages - 4 + i;
                                              else
                                                pageNum =
                                                  currentCustomerPage - 2 + i;
                                              return (
                                                <Button
                                                  key={pageNum}
                                                  className="dark:border-y-zinc-700"
                                                  variant={
                                                    currentCustomerPage ===
                                                    pageNum
                                                      ? "default"
                                                      : "outline"
                                                  }
                                                  size="sm"
                                                  onClick={() =>
                                                    setCustomerPage((prev) => {
                                                      const next = new Map(
                                                        prev,
                                                      );
                                                      next.set(
                                                        product.name,
                                                        pageNum,
                                                      );
                                                      return next;
                                                    })
                                                  }
                                                >
                                                  {pageNum}
                                                </Button>
                                              );
                                            },
                                          )}
                                          <Button
                                            className="dark:border-y-zinc-700 dark:bg-white/5"
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                              setCustomerPage((prev) => {
                                                const next = new Map(prev);
                                                next.set(
                                                  product.name,
                                                  Math.min(
                                                    customerTotalPages,
                                                    currentCustomerPage + 1,
                                                  ),
                                                );
                                                return next;
                                              })
                                            }
                                            disabled={
                                              currentCustomerPage ===
                                              customerTotalPages
                                            }
                                          >
                                            Next
                                          </Button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })()}
                      </React.Fragment>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      No products found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          {/* Pagination */}
          <div className="flex items-center justify-between px-2 py-4">
            <div className="flex items-center gap-4">
              <select
                className="h-8 rounded-md border border-input bg-background px-3 py-1 text-sm dark:border-zinc-700"
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
              <div className="text-sm text-muted-foreground">
                Showing{" "}
                {Math.min(
                  (currentPage - 1) * itemsPerPage + 1,
                  filteredProducts.length,
                )}{" "}
                to{" "}
                {Math.min(currentPage * itemsPerPage, filteredProducts.length)}{" "}
                of {filteredProducts.length} products
              </div>
            </div>
            <div className="flex gap-1">
              <Button
                className="dark:border-y-zinc-700 dark:bg-white/5"
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) pageNum = i + 1;
                else if (currentPage <= 3) pageNum = i + 1;
                else if (currentPage >= totalPages - 2)
                  pageNum = totalPages - 4 + i;
                else pageNum = currentPage - 2 + i;
                return (
                  <Button
                    key={pageNum}
                    className="dark:border-y-zinc-700"
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}
              <Button
                className="dark:border-y-zinc-700 dark:bg-white/5"
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
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
