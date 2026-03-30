// src/modules/business-intelligence-analytics/sales-report/product-sales-performance/components/ProductTab.tsx
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
import { Search, ArrowUpDown, ChevronRight, ChevronDown } from "lucide-react";
import type { TopItem, ProductTrend, ProductSaleRecord } from "../types";
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
import { TruncateText } from "./TruncateText";

// Module-scope formatter — avoids creating Intl.NumberFormat on every call
const _phpFmt = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const formatCurrency = (v: number) => _phpFmt.format(v);

// Chart color palettes at module scope — avoids array recreation on every render
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

type ProductTabProps = {
  topProducts: TopItem[];
  productTrends: ProductTrend[];
  filteredData: ProductSaleRecord[];
};

export function ProductTab({
  topProducts,
  productTrends,
  filteredData,
}: ProductTabProps) {
  const { theme } = useTheme();
  const resolvedTheme = theme;
  const isDark = resolvedTheme === "dark";

  const [searchTerm, setSearchTerm] = React.useState("");
  const [sortBy, setSortBy] = React.useState<
    "revenue" | "transactions" | "avg"
  >("revenue");
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
  const [, setExpandedSuppliers] = React.useState<Set<string>>(new Set());
  const [selectedProductInTrend, setSelectedProductInTrend] = React.useState<
    string | null
  >(null);
  const [hoveredProductInTrend, setHoveredProductInTrend] = React.useState<
    string | null
  >(null);
  type CustomerSortField =
    | "customer"
    | "division"
    | "operation"
    | "salesman"
    | "revenue"
    | "transactions"
    | "avg";

  const [customerSortMap, setCustomerSortMap] = React.useState<
    Map<string, { by: CustomerSortField; order: "asc" | "desc" }>
  >(new Map());

  const [customerPage, setCustomerPage] = React.useState<Map<string, number>>(
    new Map(),
  );
  const [customerItemsPerPage] = React.useState(10);

  const filteredProducts = React.useMemo(() => {
    const products = searchTerm
      ? topProducts.filter((p) =>
          p.name.toLowerCase().includes(searchTerm.toLowerCase()),
        )
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

  // CSV export not currently used; keep implementation commented for future use

  const toggleProduct = React.useCallback((productName: string) => {
    setExpandedProducts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(productName)) {
        newSet.delete(productName);
      } else {
        newSet.add(productName);
      }
      return newSet;
    });
  }, []);

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

  React.useEffect(() => {
    // Listen for navigation to product row and auto-expand when hash is present
    const sanitize = (s: string) => s.replace(/[^a-zA-Z0-9]/g, "-");
    const handler = () => {
      const hash = window.location.hash;
      if (hash.startsWith("#product-row-")) {
        const safeId = hash.replace("#product-row-", "");
        const match = topProducts.find((p) => sanitize(p.name) === safeId);
        if (match) {
          setExpandedProducts((prev) => {
            const next = new Set(prev);
            next.add(match.name);
            return next;
          });
          setTimeout(() => {
            const idx = filteredProducts.findIndex(
              (p) => p.name === match.name,
            );
            if (idx !== -1) setCurrentPage(Math.ceil((idx + 1) / itemsPerPage));
            const id = `product-row-${safeId}`;
            let attempts = 0;
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
          }, 50);
        }
      }
    };
    window.addEventListener("hashchange", handler);
    handler();
    return () => window.removeEventListener("hashchange", handler);
  }, [topProducts, filteredProducts, itemsPerPage]);

  // `toggleSupplier` removed — not used in current UI
  const getYAxisWidth = (data: { revenue?: number }[]) => {
    if (!data?.length) return 60;

    const maxValue = Math.max(...data.map((d) => d.revenue || 0));
    const formatted = formatCurrency(maxValue);

    return Math.max(60, formatted.length * 8); // 8px per char approx
  };

  const formatPeriodLabel = React.useCallback(
    (key: string) => {
      const MONTHS = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      if (!key) return "";
      try {
        if (timePeriod === "daily") {
          const parts = key.split("T")[0].split("-");
          return `${MONTHS[Number(parts[1]) - 1]} ${Number(parts[2])}`;
        }
        if (timePeriod === "weekly") {
          const parts = key.split("-");
          if (parts.length === 3) {
            const y = Number(parts[0]),
              m = Number(parts[1]),
              d = Number(parts[2]);
            const start = new Date(y, m - 1, d);
            const end = new Date(start);
            end.setDate(start.getDate() + 6);
            const sm = MONTHS[start.getMonth()],
              em = MONTHS[end.getMonth()];
            return sm === em
              ? `${sm} ${start.getDate()}-${end.getDate()}`
              : `${sm} ${start.getDate()} - ${em} ${end.getDate()}`;
          }
          return key;
        }
        if (timePeriod === "bi-weekly") {
          const bw = key.match(/^(\d{4})-(\d{2})-W(\d+)/);
          if (bw) {
            const y = Number(bw[1]),
              m = Number(bw[2]),
              n = Number(bw[3]);
            const startDay = n === 0 ? 1 : n * 14;
            const endDay = Math.min(new Date(y, m, 0).getDate(), startDay + 13);
            const start = new Date(y, m - 1, startDay);
            const sm = MONTHS[start.getMonth()],
              em = MONTHS[new Date(y, m - 1, endDay).getMonth()];
            return sm === em
              ? `${sm} ${startDay}-${endDay}`
              : `${sm} ${startDay} - ${em} ${endDay}`;
          }
          return key;
        }
        if (timePeriod === "monthly") {
          const parts = key.split("-");
          if (parts.length >= 2)
            return `${MONTHS[Number(parts[1]) - 1]} ${parts[0]}`;
          return key;
        }
        if (timePeriod === "bi-monthly") {
          const bm = key.match(/^(\d{4})-Q(\d+)/);
          if (bm) {
            const b = Number(bm[2]) - 1;
            return `${MONTHS[b * 2]}-${MONTHS[b * 2 + 1]} ${bm[1]}`;
          }
          return key;
        }
        if (timePeriod === "quarterly") {
          const q = key.match(/^(\d{4})-Q(\d+)/);
          if (q) return `Q${q[2]} ${q[1]}`;
          return key;
        }
        if (timePeriod === "semi-annually") {
          const h = key.match(/^(\d{4})-H(\d+)/);
          if (h) return `H${h[2]} ${h[1]}`;
          return key;
        }
        return key;
      } catch {
        return key;
      }
    },
    [timePeriod],
  );
  // `getSupplierTimePeriodData` removed — not currently used by the UI

  // `getProductSuppliers` removed — not currently used by the UI

  // Get customers for a specific product
  const getProductCustomers = (productName: string) => {
    const customerMap = new Map<
      string,
      {
        revenue: number;
        transactions: number;
        divisionName: string;
        operationName: string;
        salesmanName: string;
      }
    >();

    filteredData
      .filter((record) => record.productName === productName)
      .forEach((record) => {
        const existing = customerMap.get(record.customerName) || {
          revenue: 0,
          transactions: 0,
          divisionName: record.divisionName,
          operationName: record.operationName,
          salesmanName: record.salesmanName,
        };
        customerMap.set(record.customerName, {
          revenue: existing.revenue + record.amount,
          transactions: existing.transactions + 1,
          divisionName: record.divisionName,
          operationName: record.operationName,
          salesmanName: record.salesmanName,
        });
      });

    const customers = Array.from(customerMap.entries()).map(
      ([customer, data]) => ({
        customer,
        revenue: data.revenue,
        transactions: data.transactions,
        divisionName: data.divisionName,
        operationName: data.operationName,
        salesmanName: data.salesmanName,
      }),
    );

    // Sort customers based on per-product sort settings
    const sort = customerSortMap.get(productName) || {
      by: "revenue" as CustomerSortField,
      order: "desc" as "asc" | "desc",
    };

    customers.sort((a, b) => {
      let comparison = 0;
      if (sort.by === "customer") {
        comparison = a.customer.localeCompare(b.customer);
      } else if (sort.by === "division") {
        comparison = (a.divisionName || "").localeCompare(b.divisionName || "");
      } else if (sort.by === "operation") {
        comparison = (a.operationName || "").localeCompare(
          b.operationName || "",
        );
      } else if (sort.by === "salesman") {
        comparison = (a.salesmanName || "").localeCompare(b.salesmanName || "");
      } else if (sort.by === "revenue") {
        comparison = a.revenue - b.revenue;
      } else if (sort.by === "transactions") {
        comparison = a.transactions - b.transactions;
      } else if (sort.by === "avg") {
        comparison = a.revenue / a.transactions - b.revenue / b.transactions;
      }
      return sort.order === "asc" ? comparison : -comparison;
    });

    return customers;
  };

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

      // First, ensure pt.data is sorted chronologically
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
            if (!dateStr) return 0;

            if (timePeriod === "daily" || timePeriod === "weekly") {
              // Format: "2025-10-12" or "2026-01-17" - parse as ISO date string
              const [year, month, day] = dateStr.split("-").map(Number);
              return new Date(year, month - 1, day).getTime();
            } else if (timePeriod === "monthly") {
              // Format: "2025-10" - add day to make valid date
              const [year, month] = dateStr.split("-").map(Number);
              return new Date(year, month - 1, 1).getTime();
            } else if (timePeriod === "bi-weekly") {
              // Format: "2025-10-W0" - extract year and month, week number for sorting
              const match = dateStr.match(/(\d{4})-(\d{2})-W(\d+)/);
              if (match) {
                const [, year, month, week] = match;
                return new Date(
                  parseInt(year),
                  parseInt(month) - 1,
                  parseInt(week) * 14 + 1,
                ).getTime();
              }
            } else if (
              timePeriod === "bi-monthly" ||
              timePeriod === "quarterly"
            ) {
              // Format: "2025-Q1" - extract year and quarter
              const match = dateStr.match(/(\d{4})-Q(\d+)/);
              if (match) {
                const [, year, quarter] = match;
                const month =
                  (parseInt(quarter) - 1) *
                  (timePeriod === "bi-monthly" ? 2 : 3);
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

  // Collect all unique dates from all products and sort them chronologically
  const allDates = React.useMemo(() => {
    const dateSet = new Set<string>();
    aggregatedProductTrends.forEach((pt) => {
      pt.data.forEach((d) => dateSet.add(d.date));
    });

    const dates = Array.from(dateSet).sort((a, b) => {
      const getDateValue = (dateStr: string) => {
        if (!dateStr) return 0;

        if (timePeriod === "daily" || timePeriod === "weekly") {
          const [year, month, day] = dateStr.split("-").map(Number);
          return new Date(year, month - 1, day).getTime();
        } else if (timePeriod === "monthly") {
          const [year, month] = dateStr.split("-").map(Number);
          return new Date(year, month - 1, 1).getTime();
        } else if (timePeriod === "bi-weekly") {
          const match = dateStr.match(/(\d{4})-(\d{2})-W(\d+)/);
          if (match) {
            const [, year, month, week] = match;
            return new Date(
              parseInt(year),
              parseInt(month) - 1,
              parseInt(week) * 14 + 1,
            ).getTime();
          }
        } else if (timePeriod === "bi-monthly" || timePeriod === "quarterly") {
          const match = dateStr.match(/(\d{4})-Q(\d+)/);
          if (match) {
            const [, year, quarter] = match;
            const month =
              (parseInt(quarter) - 1) * (timePeriod === "bi-monthly" ? 2 : 3);
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

      return getDateValue(a) - getDateValue(b);
    });

    return dates;
  }, [aggregatedProductTrends, timePeriod]);

  // chartColors / chartColorsDark are now defined at module scope above
  const activeChartColors = isDark ? chartColorsDark : chartColors;

  const chartLines = React.useMemo(() => {
    return aggregatedProductTrends.map((pt, i) => {
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
          dataKey="revenue"
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
            strokeWidth: 1,
            onClick: () => handleTrendLineClick(pt.productName),
            onMouseOver: () => setHoveredProductInTrend(pt.productName),
          }}
          onClick={() => handleTrendLineClick(pt.productName)}
          style={{ cursor: "pointer" }}
        />
      );
    });
  }, [
    aggregatedProductTrends,
    activeChartColors,
    selectedProductInTrend,
    hoveredProductInTrend,
    handleTrendLineClick,
  ]);

  return (
    <div className="space-y-4">
      {/* Product Trends Over Time */}
      {productTrends.length > 0 && (
        <Card className="dark:border-zinc-700 dark:bg-white/13">
          <CardHeader>
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Top 5 Products - Sales Trend</CardTitle>
                  <CardDescription>
                    Revenue performance over time (click line to highlight)
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
                {/* <Button
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
                </Button> */}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  className="dark:border-zinc-700"
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
                  className="dark:border-zinc-700"
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
                  className="dark:border-zinc-700"
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
                  className="dark:border-zinc-700"
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
                  className="dark:border-zinc-700"
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
                  className="dark:border-zinc-700"
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
                  className="dark:border-zinc-700"
                  variant={
                    timePeriod === "semi-annually" ? "default" : "outline"
                  }
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
                  className="dark:border-zinc-700"
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
                      color: activeChartColors[i % activeChartColors.length],
                    },
                  ]),
                ),
              }}
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
                    tickFormatter={formatPeriodLabel}
                    tick={{ fontSize: 10, fill: "#64748b" }}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    width={getYAxisWidth(topProducts)}
                    tickFormatter={(value) => formatCurrency(value)}
                  />
                  <ChartTooltip
                    content={({
                      active,
                      payload,
                      label,
                    }: {
                      active?: boolean;
                      payload?: Array<{
                        name?: string;
                        value?: number;
                        color?: string;
                      }>;
                      label?: string;
                    }) => {
                      if (!active || !payload?.length) return null;
                      const target = hoveredProductInTrend
                        ? payload.find((e) => e.name === hoveredProductInTrend)
                        : payload[0];
                      if (!target) return null;
                      const rank =
                        aggregatedProductTrends.findIndex(
                          (t) => t.productName === target.name,
                        ) + 1;
                      return (
                        <div className="rounded-lg border bg-background p-3 shadow-md text-sm min-w-48 space-y-1.5">
                          <p className="text-xs text-muted-foreground">
                            {label ? formatPeriodLabel(String(label)) : ""}
                          </p>
                          <div className="flex items-center gap-2">
                            <div
                              className="h-3 w-3 rounded-full shrink-0"
                              style={{ backgroundColor: target.color }}
                            />
                            <span className="font-semibold leading-tight text-xs wrap-break-words">
                              {target.name}
                            </span>
                          </div>
                          <div className="border-t pt-1.5 space-y-1">
                            <div className="flex justify-between gap-4">
                              <span className="text-muted-foreground">
                                Revenue
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

      {/* Search Bar */}
      <Card className="dark:border-zinc-700 dark:bg-white/13">
        <CardContent className="">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-10 dark:border-zinc-700"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Product Revenue Table */}
      <Card className="dark:border-zinc-700 dark:bg-white/13">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Product Performance Table</CardTitle>
              <CardDescription>
                {filteredProducts.length} products found
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setExpandedProducts(new Set());
                  setSelectedProductInTrend(null);
                  setCustomerSortMap(new Map());
                }}
              >
                Collapse All
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table className="table-fixed w-full dark:border-zinc-700 dark:bg-white/3">
              <TableHeader>
                <TableRow>
                  {/* <TableHead className="w-15">Rank</TableHead> */}
                  <TableHead className="min-w-0 w-full">Product Name</TableHead>
                  <TableHead className="w-30 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      title="Sort by revenue"
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
                  <TableHead className="w-28 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      title="Sort by transactions"
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
                  <TableHead className="w-59 text-right ">
                    <Button
                      variant="ghost"
                      size="sm"
                      title="Sort by average transaction"
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
                    const customers = isExpanded
                      ? getProductCustomers(product.name)
                      : [];
                    const getProductColor = (index: number) =>
                      activeChartColors[index % activeChartColors.length];
                    return (
                      <React.Fragment key={product.name}>
                        <TableRow
                          id={`product-row-${product.name.replace(/[^a-zA-Z0-9]/g, "-")}`}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => toggleProduct(product.name)}
                        >
                          {/* <TableCell className="font-medium">{(currentPage - 1) * itemsPerPage + index + 1}</TableCell> */}
                          <TableCell className="min-w-0 w-full">
                            <div className="flex items-center gap-2">
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                              )}
                              <TruncateText title={product.name}>
                                <span
                                  className="font-medium"
                                  style={{ color: getProductColor(index) }}
                                >
                                  {product.name}
                                </span>
                              </TruncateText>
                            </div>
                          </TableCell>
                          <TableCell className="w-28 text-right">
                            {formatCurrency(product.revenue)}
                          </TableCell>
                          <TableCell className="w-20 text-right">
                            {product.count}
                          </TableCell>
                          <TableCell className="w-32 text-right">
                            {formatCurrency(product.revenue / product.count)}
                          </TableCell>
                        </TableRow>
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

                            const handleCustomerSort = (
                              field: CustomerSortField,
                            ) => {
                              setCustomerSortMap((prev) => {
                                const next = new Map(prev);
                                const cur = next.get(product.name);
                                if (cur?.by === field) {
                                  next.set(product.name, {
                                    by: field,
                                    order: cur.order === "asc" ? "desc" : "asc",
                                  });
                                } else {
                                  next.set(product.name, {
                                    by: field,
                                    order: "desc",
                                  });
                                }
                                return next;
                              });
                            };

                            return (
                              <TableRow>
                                <TableCell colSpan={5} className="  p-0">
                                  <div className="px-12 py-4">
                                    <div className="rounded-md border  ">
                                      <Table className="table-fixed w-full dark:border-zinc-700 dark:bg-white/3">
                                        <TableHeader>
                                          <TableRow>
                                            <TableHead>
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                title="Sort by customer name"
                                                onClick={() =>
                                                  handleCustomerSort("customer")
                                                }
                                                className="h-8"
                                              >
                                                Customer Name{" "}
                                                <ArrowUpDown className="ml-2 h-4 w-4" />
                                              </Button>
                                            </TableHead>
                                            <TableHead className="w-40">
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                title="Sort by division"
                                                onClick={() =>
                                                  handleCustomerSort("division")
                                                }
                                                className="h-8"
                                              >
                                                Division{" "}
                                                <ArrowUpDown className="ml-2 h-4 w-4" />
                                              </Button>
                                            </TableHead>
                                            <TableHead className="w-40">
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                title="Sort by operation"
                                                onClick={() =>
                                                  handleCustomerSort(
                                                    "operation",
                                                  )
                                                }
                                                className="h-8"
                                              >
                                                Operation{" "}
                                                <ArrowUpDown className="ml-2 h-4 w-4" />
                                              </Button>
                                            </TableHead>
                                            <TableHead className="w-40">
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                title="Sort by salesman"
                                                onClick={() =>
                                                  handleCustomerSort("salesman")
                                                }
                                                className="h-8"
                                              >
                                                Salesman{" "}
                                                <ArrowUpDown className="ml-2 h-4 w-4" />
                                              </Button>
                                            </TableHead>
                                            <TableHead className="w-40 text-right">
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                title="Sort by revenue"
                                                onClick={() =>
                                                  handleCustomerSort("revenue")
                                                }
                                                className="h-8"
                                              >
                                                Revenue{" "}
                                                <ArrowUpDown className="ml-2 h-4 w-4" />
                                              </Button>
                                            </TableHead>
                                            <TableHead className="w-40 text-right">
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                title="Sort by transactions"
                                                onClick={() =>
                                                  handleCustomerSort(
                                                    "transactions",
                                                  )
                                                }
                                                className="h-8"
                                              >
                                                Transactions{" "}
                                                <ArrowUpDown className="ml-2 h-4 w-4" />
                                              </Button>
                                            </TableHead>
                                            <TableHead className="w-45 text-right">
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                title="Sort by average transaction"
                                                onClick={() =>
                                                  handleCustomerSort("avg")
                                                }
                                                className="h-8"
                                              >
                                                Avg/Transaction
                                                <ArrowUpDown className="ml-2 h-4 w-4" />
                                              </Button>
                                            </TableHead>
                                          </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                          {paginatedCustomers.map(
                                            (customer, idx) => (
                                              <TableRow
                                                key={`${customer.customer}-${idx}`}
                                              >
                                                <TableCell className="max-w-0">
                                                  <TruncateText
                                                    title={customer.customer}
                                                  >
                                                    {customer.customer}
                                                  </TruncateText>
                                                </TableCell>
                                                <TableCell className="max-w-0">
                                                  <TruncateText
                                                    title={
                                                      customer.divisionName
                                                    }
                                                  >
                                                    {customer.divisionName}
                                                  </TruncateText>
                                                </TableCell>
                                                <TableCell className="max-w-0">
                                                  <TruncateText
                                                    title={
                                                      customer.operationName
                                                    }
                                                  >
                                                    {customer.operationName}
                                                  </TruncateText>
                                                </TableCell>
                                                <TableCell className="max-w-0">
                                                  <TruncateText
                                                    title={
                                                      customer.salesmanName
                                                    }
                                                  >
                                                    {customer.salesmanName}
                                                  </TruncateText>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                  {formatCurrency(
                                                    customer.revenue,
                                                  )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                  {customer.transactions}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                  {formatCurrency(
                                                    customer.revenue /
                                                      customer.transactions,
                                                  )}
                                                </TableCell>
                                              </TableRow>
                                            ),
                                          )}
                                        </TableBody>
                                      </Table>
                                    </div>
                                    {customerTotalPages > 1 && (
                                      <div className="flex items-center justify-between px-2 py-4">
                                        {/* <div className="text-sm text-muted-foreground">
                                        Showing {startIdx + 1} to {Math.min(startIdx + customerItemsPerPage, customers.length)} of {customers.length} customers
                                      </div> */}

                                        <div className="flex items-center gap-4">
                                          <div className="flex items-center gap-2">
                                            {/* <label className="text-sm text-muted-foreground">Show:</label> */}
                                            <select
                                              className="h-8 rounded-md border border-input bg-background px-3 py-1 text-sm dark:border-zinc-700"
                                              value={itemsPerPage}
                                              onChange={(e) => {
                                                setItemsPerPage(
                                                  Number(e.target.value),
                                                );
                                                setCurrentPage(1);
                                              }}
                                            >
                                              <option value={10}>10</option>
                                              <option value={25}>25</option>
                                              <option value={50}>50</option>
                                              <option value={100}>100</option>
                                            </select>
                                          </div>
                                          <div className="text-sm text-muted-foreground">
                                            Showing{" "}
                                            {(currentPage - 1) * itemsPerPage +
                                              1}{" "}
                                            to{" "}
                                            {Math.min(
                                              currentPage * itemsPerPage,
                                              filteredProducts.length,
                                            )}{" "}
                                            of {filteredProducts.length}{" "}
                                            products
                                          </div>
                                        </div>
                                        <div className="flex gap-1">
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                              const newPage = Math.max(
                                                1,
                                                currentCustomerPage - 1,
                                              );
                                              setCustomerPage(
                                                new Map(customerPage).set(
                                                  product.name,
                                                  newPage,
                                                ),
                                              );
                                            }}
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
                                              let pageNum;
                                              if (customerTotalPages <= 5) {
                                                pageNum = i + 1;
                                              } else if (
                                                currentCustomerPage <= 3
                                              ) {
                                                pageNum = i + 1;
                                              } else if (
                                                currentCustomerPage >=
                                                customerTotalPages - 2
                                              ) {
                                                pageNum =
                                                  customerTotalPages - 4 + i;
                                              } else {
                                                pageNum =
                                                  currentCustomerPage - 2 + i;
                                              }
                                              return (
                                                <Button
                                                  key={pageNum}
                                                  variant={
                                                    currentCustomerPage ===
                                                    pageNum
                                                      ? "default"
                                                      : "outline"
                                                  }
                                                  size="sm"
                                                  onClick={() => {
                                                    setCustomerPage(
                                                      new Map(customerPage).set(
                                                        product.name,
                                                        pageNum,
                                                      ),
                                                    );
                                                  }}
                                                >
                                                  {pageNum}
                                                </Button>
                                              );
                                            },
                                          )}
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                              const newPage = Math.min(
                                                customerTotalPages,
                                                currentCustomerPage + 1,
                                              );
                                              setCustomerPage(
                                                new Map(customerPage).set(
                                                  product.name,
                                                  newPage,
                                                ),
                                              );
                                            }}
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
              <div className="flex items-center gap-2">
                {/* <label className="text-sm text-muted-foreground">Show:</label> */}
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
              </div>
              <div className="text-sm text-muted-foreground">
                Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                {Math.min(currentPage * itemsPerPage, filteredProducts.length)}{" "}
                of {filteredProducts.length} products
              </div>
            </div>
            <div className="flex gap-1">
              <Button
                className="dark:border-zinc-700 dark:bg-white/5"
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
                    className="dark:border-zinc-700"
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
                className="dark:border-zinc-700 dark:bg-white/5"
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
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
