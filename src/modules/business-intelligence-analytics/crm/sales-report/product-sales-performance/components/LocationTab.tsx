// src/modules/business-intelligence-analytics/sales-report/product-sales-performance/components/LocationTab.tsx
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
import {
  Search,
  MapPin,
  ArrowUpDown,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import type { ProductSaleRecord } from "../types";
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
import { Badge } from "@/components/ui/badge";
import { TruncateText } from "./TruncateText";

// Module-scope formatter — avoids creating Intl.NumberFormat on every call
const _phpFmtLoc = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const formatCurrency = (v: number) => _phpFmtLoc.format(v);

type LocationTabProps = {
  filteredData: ProductSaleRecord[];
};

export function LocationTab({ filteredData }: LocationTabProps) {
  const { theme } = useTheme();
  const resolvedTheme = theme;
  const isDark = resolvedTheme === "dark";
  const activeChartColors = isDark ? chartColorsDark : chartColors;

  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedLocation, setSelectedLocation] = React.useState<string | null>(
    null,
  );
  const [selectedProvince, setSelectedProvince] = React.useState<string | null>(
    null,
  );
  const [sortBy, setSortBy] = React.useState<
    "location" | "revenue" | "transactions" | "avg"
  >("revenue");
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [itemsPerPage, setItemsPerPage] = React.useState(10);
  const [expandedProvinces, setExpandedProvinces] = React.useState<Set<string>>(
    new Set(),
  );
  const [expandedCities, setExpandedCities] = React.useState<Set<string>>(
    new Set(),
  );
  const [locProductPage, setLocProductPage] = React.useState(1);
  const [locSalesmanPage, setLocSalesmanPage] = React.useState(1);
  const [locCustomerPage, setLocCustomerPage] = React.useState(1);
  const [locItemsPerPage, setLocItemsPerPage] = React.useState(10);
  const [cityProductPage, setCityProductPage] = React.useState<
    Map<string, number>
  >(new Map());
  const [cityProductItemsPerPage, setCityProductItemsPerPage] = React.useState<
    Map<string, number>
  >(new Map());
  const [hoveredProvince, setHoveredProvince] = React.useState<string | null>(
    null,
  );
  const [hoveredCity, setHoveredCity] = React.useState<string | null>(null);

  // exportToCSV removed (unused) to satisfy lint rules

  // Toggle functions
  const toggleProvince = React.useCallback((province: string) => {
    setExpandedProvinces((prev) => {
      const next = new Set(prev);
      if (next.has(province)) next.delete(province);
      else next.add(province);
      return next;
    });
  }, []);

  const toggleCity = React.useCallback(
    (cityKey: string, event?: React.MouseEvent) => {
      if (event) event.stopPropagation();
      setExpandedCities((prev) => {
        const next = new Set(prev);
        if (next.has(cityKey)) next.delete(cityKey);
        else next.add(cityKey);
        return next;
      });
    },
    [],
  );

  const handleProvinceClick = React.useCallback((data: unknown) => {
    // Normalize recharts payload shapes safely
    const unwrap = (x: unknown): Record<string, unknown> | undefined => {
      if (!x) return undefined;
      if (
        typeof x === "object" &&
        x !== null &&
        "payload" in (x as Record<string, unknown>)
      ) {
        const p = (x as Record<string, unknown>).payload;
        if (typeof p === "object" && p !== null)
          return p as Record<string, unknown>;
      }
      if (typeof x === "object" && x !== null)
        return x as Record<string, unknown>;
      return undefined;
    };

    const d = unwrap(data);
    const candidate = d?.province ?? d?.name ?? d?.value;
    const val = typeof candidate === "string" ? candidate : null;
    if (!val) return;
    setSelectedProvince((prev) => {
      const next = prev === val ? null : val;
      if (next && next !== prev) setSelectedLocation(null);
      return next;
    });
  }, []);

  // const handleCityClick = React.useCallback((data: any) => {
  //   if (!data?.value) return;
  //   const clickedCity = filteredCitiesByProvince.find((c) => c.city === data.value);
  //   if (clickedCity) setSelectedLocation(`${clickedCity.city}|||${clickedCity.province}`);
  // }, [filteredCitiesByProvince]);

  // Get province data
  const getProvinceData = React.useMemo(() => {
    const provinceMap = new Map<
      string,
      { revenue: number; transactions: number }
    >();

    filteredData.forEach((r) => {
      // Filter out records with missing or invalid province data
      const prov = r.province?.trim();
      if (!prov) return;
      const existing = provinceMap.get(prov) || { revenue: 0, transactions: 0 };
      provinceMap.set(prov, {
        revenue: existing.revenue + Math.abs(r.amount),
        transactions: existing.transactions + 1,
      });
    });

    return Array.from(provinceMap.entries()).map(([province, data]) => ({
      province,
      revenue: data.revenue,
      transactions: data.transactions,
    }));
  }, [filteredData]);

  // Get cities for a province
  const getCitiesForProvince = React.useCallback(
    (province: string) => {
      const cityMap = new Map<
        string,
        { revenue: number; transactions: number }
      >();

      filteredData
        .filter((r) => r.province === province)
        .forEach((r) => {
          const existing = cityMap.get(r.city) || {
            revenue: 0,
            transactions: 0,
          };
          cityMap.set(r.city, {
            revenue: existing.revenue + Math.abs(r.amount),
            transactions: existing.transactions + 1,
          });
        });

      return Array.from(cityMap.entries()).map(([city, data]) => ({
        city,
        revenue: data.revenue,
        transactions: data.transactions,
      }));
    },
    [filteredData],
  );

  // Get products for a city in a province
  const getProductsForCity = (city: string, province: string) => {
    const productMap = new Map<
      string,
      { revenue: number; transactions: number }
    >();

    filteredData
      .filter((r) => r.city === city && r.province === province)
      .forEach((r) => {
        const existing = productMap.get(r.productName) || {
          revenue: 0,
          transactions: 0,
        };
        productMap.set(r.productName, {
          revenue: existing.revenue + Math.abs(r.amount),
          transactions: existing.transactions + 1,
        });
      });

    return Array.from(productMap.entries()).map(([productName, data]) => ({
      productName,
      revenue: data.revenue,
      transactions: data.transactions,
    }));
  };
  const getYAxisWidth = (data: { revenue?: number }[]) => {
    if (!data?.length) return 60;

    const maxValue = Math.max(...data.map((d) => d.revenue || 0));
    const formatted = formatCurrency(maxValue);

    return Math.max(60, formatted.length * 8); // 8px per char approx
  };

  const filteredProvinces = React.useMemo(() => {
    let provinces = [...getProvinceData];

    // Filter by search term (province name OR city name)
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      provinces = provinces.filter((p) => {
        // Check if province name matches
        if (p.province.toLowerCase().includes(searchLower)) return true;

        // Check if any city in this province matches
        const cities = getCitiesForProvince(p.province);
        return cities.some((city) =>
          city.city.toLowerCase().includes(searchLower),
        );
      });
    }

    // Sort provinces
    provinces.sort((a, b) => {
      let comparison = 0;
      if (sortBy === "location") {
        comparison = a.province.localeCompare(b.province);
      } else if (sortBy === "revenue") {
        comparison = a.revenue - b.revenue;
      } else if (sortBy === "transactions") {
        comparison = a.transactions - b.transactions;
      } else if (sortBy === "avg") {
        comparison = a.revenue / a.transactions - b.revenue / b.transactions;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return provinces;
  }, [getProvinceData, getCitiesForProvince, searchTerm, sortBy, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredProvinces.length / itemsPerPage);
  const paginatedProvinces = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredProvinces.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredProvinces, currentPage, itemsPerPage]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortBy, sortOrder]);

  React.useEffect(() => {
    setLocProductPage(1);
    setLocSalesmanPage(1);
    setLocCustomerPage(1);
  }, [selectedLocation]);

  React.useEffect(() => {
    setLocProductPage(1);
    setLocSalesmanPage(1);
    setLocCustomerPage(1);
  }, [locItemsPerPage]);
  React.useEffect(() => {
    // Listen for navigation to location row and auto-expand (match sanitized "City, Province")
    const sanitize = (s: string) => s.replace(/[^a-zA-Z0-9]/g, "-");
    const handler = () => {
      const hash = window.location.hash;
      if (hash.startsWith("#location-row-")) {
        const safeId = hash.replace("#location-row-", "");
        // find a record matching sanitized "city, province"
        const rec = filteredData.find(
          (r) => sanitize(`${r.city}, ${r.province}`) === safeId,
        );
        if (rec) {
          const province = rec.province || "Unknown";
          const city = rec.city || "Unknown";
          setExpandedProvinces((prev) => {
            const next = new Set(prev);
            next.add(province);
            return next;
          });
          const cityKey = `${province}::${city}`;
          setExpandedCities((prev) => {
            const next = new Set(prev);
            next.add(cityKey);
            return next;
          });

          // compute province ordering so we can set current page
          const provMap = new Map<
            string,
            { returnValue: number; returnCount: number }
          >();
          filteredData.forEach((r) => {
            const prov = r.province || "Unknown";
            const prev = provMap.get(prov) || {
              returnValue: 0,
              returnCount: 0,
            };
            provMap.set(prov, {
              returnValue: prev.returnValue + Math.abs(r.amount),
              returnCount: prev.returnCount + 1,
            });
          });
          const provinces = Array.from(provMap.entries())
            .map(([name, d]) => ({ name, ...d }))
            .sort((a, b) => b.returnValue - a.returnValue);
          const idx = provinces.findIndex((p) => p.name === province);
          if (idx !== -1) setCurrentPage(Math.ceil((idx + 1) / itemsPerPage));

          // scroll to the city row (retry until present)
          setTimeout(() => {
            const id = `location-row-${safeId}`;
            let attempts = 0;
            const tryScroll = () => {
              const el = document.getElementById(id);
              if (el)
                el.scrollIntoView({ behavior: "smooth", block: "center" });
              else if (attempts < 6) {
                attempts += 1;
                setTimeout(tryScroll, 120);
              }
            };
            tryScroll();
          }, 80);
        }
      }
    };
    window.addEventListener("hashchange", handler);
    handler(); // Initial check
    return () => window.removeEventListener("hashchange", handler);
  }, [filteredData, itemsPerPage]);
  // Stable UI handlers
  const handleClearProvinceSelection = React.useCallback(
    () => setSelectedProvince(null),
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
  const setCurrentPageTo = React.useCallback(
    (p: number) => setCurrentPage(p),
    [],
  );

  // Revenue by province for chart
  const provinceRevenue = React.useMemo(() => {
    return getProvinceData.sort((a, b) => b.revenue - a.revenue);
  }, [getProvinceData]);

  // Calculate city revenue from filteredData using city and province fields
  const cityRevenue = React.useMemo(() => {
    const cityMap = new Map<
      string,
      { city: string; province: string; revenue: number; transactions: number }
    >();

    filteredData.forEach((r) => {
      // Filter out records with missing city/province data
      const city = r.city?.trim();
      const province = r.province?.trim();
      if (!city || !province) return;
      const key = `${city}|||${province}`; // Use delimiter to handle commas in names
      const existing = cityMap.get(key) || {
        city,
        province,
        revenue: 0,
        transactions: 0,
      };
      cityMap.set(key, {
        city,
        province,
        revenue: existing.revenue + Math.abs(r.amount),
        transactions: existing.transactions + 1,
      });
    });

    return Array.from(cityMap.values()).sort((a, b) => b.revenue - a.revenue);
  }, [filteredData]);

  const topProductByProvince = React.useMemo(() => {
    const pm = new Map<string, Map<string, number>>();
    filteredData.forEach((r) => {
      if (!pm.has(r.province)) pm.set(r.province, new Map());
      const p = pm.get(r.province)!;
      p.set(r.productName, (p.get(r.productName) || 0) + Math.abs(r.amount));
    });
    const result = new Map<string, { name: string; revenue: number }>();
    pm.forEach((p, province) => {
      let top = { name: "", revenue: 0 };
      p.forEach((rev, name) => {
        if (rev > top.revenue) top = { name, revenue: rev };
      });
      result.set(province, top);
    });
    return result;
  }, [filteredData]);

  const topSalesmanByProvince = React.useMemo(() => {
    const sm = new Map<string, Map<string, number>>();
    filteredData.forEach((r) => {
      if (!sm.has(r.province)) sm.set(r.province, new Map());
      const s = sm.get(r.province)!;
      const key = r.salesmanName || "Unknown";
      s.set(key, (s.get(key) || 0) + Math.abs(r.amount));
    });
    const result = new Map<string, { name: string; revenue: number }>();
    sm.forEach((s, province) => {
      let top = { name: "", revenue: 0 };
      s.forEach((rev, name) => {
        if (rev > top.revenue) top = { name, revenue: rev };
      });
      result.set(province, top);
    });
    return result;
  }, [filteredData]);

  const topCustomerByProvince = React.useMemo(() => {
    const cm = new Map<string, Map<string, number>>();
    filteredData.forEach((r) => {
      if (!cm.has(r.province)) cm.set(r.province, new Map());
      const c = cm.get(r.province)!;
      c.set(r.customerName, (c.get(r.customerName) || 0) + Math.abs(r.amount));
    });
    const result = new Map<string, { name: string; revenue: number }>();
    cm.forEach((c, province) => {
      let top = { name: "", revenue: 0 };
      c.forEach((rev, name) => {
        if (rev > top.revenue) top = { name, revenue: rev };
      });
      result.set(province, top);
    });
    return result;
  }, [filteredData]);

  const topProductByCity = React.useMemo(() => {
    const pm = new Map<string, Map<string, number>>();
    filteredData.forEach((r) => {
      const key = `${r.city}|||${r.province}`;
      if (!pm.has(key)) pm.set(key, new Map());
      const p = pm.get(key)!;
      p.set(r.productName, (p.get(r.productName) || 0) + Math.abs(r.amount));
    });
    const result = new Map<string, { name: string; revenue: number }>();
    pm.forEach((p, cityKey) => {
      let top = { name: "", revenue: 0 };
      p.forEach((rev, name) => {
        if (rev > top.revenue) top = { name, revenue: rev };
      });
      result.set(cityKey, top);
    });
    return result;
  }, [filteredData]);

  const topSalesmanByCity = React.useMemo(() => {
    const sm = new Map<string, Map<string, number>>();
    filteredData.forEach((r) => {
      const key = `${r.city}|||${r.province}`;
      if (!sm.has(key)) sm.set(key, new Map());
      const s = sm.get(key)!;
      const sKey = r.salesmanName || "Unknown";
      s.set(sKey, (s.get(sKey) || 0) + Math.abs(r.amount));
    });
    const result = new Map<string, { name: string; revenue: number }>();
    sm.forEach((s, cityKey) => {
      let top = { name: "", revenue: 0 };
      s.forEach((rev, name) => {
        if (rev > top.revenue) top = { name, revenue: rev };
      });
      result.set(cityKey, top);
    });
    return result;
  }, [filteredData]);

  const topCustomerByCity = React.useMemo(() => {
    const cm = new Map<string, Map<string, number>>();
    filteredData.forEach((r) => {
      const key = `${r.city}|||${r.province}`;
      if (!cm.has(key)) cm.set(key, new Map());
      const c = cm.get(key)!;
      c.set(r.customerName, (c.get(r.customerName) || 0) + Math.abs(r.amount));
    });
    const result = new Map<string, { name: string; revenue: number }>();
    cm.forEach((c, cityKey) => {
      let top = { name: "", revenue: 0 };
      c.forEach((rev, name) => {
        if (rev > top.revenue) top = { name, revenue: rev };
      });
      result.set(cityKey, top);
    });
    return result;
  }, [filteredData]);

  // Filtered cities based on selected province
  const filteredCitiesByProvince = React.useMemo(() => {
    if (!selectedProvince) return cityRevenue;
    return cityRevenue.filter((city) => city.province === selectedProvince);
  }, [cityRevenue, selectedProvince]);

  // Slice top 15 cities in a separate memo to avoid recalculating on every render
  const top15Cities = React.useMemo(() => {
    return filteredCitiesByProvince.slice(0, 15);
  }, [filteredCitiesByProvince]);
  const handleCityClick = React.useCallback(
    (data: unknown) => {
      const unwrap = (x: unknown): Record<string, unknown> | undefined => {
        if (!x) return undefined;
        if (
          typeof x === "object" &&
          x !== null &&
          "payload" in (x as Record<string, unknown>)
        ) {
          const p = (x as Record<string, unknown>).payload;
          if (typeof p === "object" && p !== null)
            return p as Record<string, unknown>;
        }
        if (typeof x === "object" && x !== null)
          return x as Record<string, unknown>;
        return undefined;
      };
      const d = unwrap(data);
      const candidate = d?.city ?? (d?.value as unknown);
      const cityVal = typeof candidate === "string" ? candidate : null;
      if (!cityVal) return;
      const clickedCity = filteredCitiesByProvince.find(
        (c) => c.city === cityVal,
      );
      if (clickedCity)
        setSelectedLocation(`${clickedCity.city}|||${clickedCity.province}`);
    },
    [filteredCitiesByProvince],
  );
  // Get top products for selected location (format: "city|||province")
  const topProductsForLocation = React.useMemo(() => {
    if (!selectedLocation) return [];

    const [city, province] = selectedLocation.split("|||");

    const locationData = filteredData.filter(
      (r) => r.city === city && r.province === province,
    );

    const productMap = new Map<string, number>();
    locationData.forEach((r) => {
      productMap.set(
        r.productName,
        (productMap.get(r.productName) || 0) + Math.abs(r.amount),
      );
    });

    return Array.from(productMap.entries())
      .map(([name, revenue]) => ({ name, revenue }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [selectedLocation, filteredData]);

  const getLocationCustomers = (city: string, province: string) => {
    const map = new Map<string, { revenue: number; transactions: number }>();
    filteredData
      .filter((r) => r.city === city && r.province === province)
      .forEach((r) => {
        const existing = map.get(r.customerName) || {
          revenue: 0,
          transactions: 0,
        };
        map.set(r.customerName, {
          revenue: existing.revenue + Math.abs(r.amount),
          transactions: existing.transactions + 1,
        });
      });
    return Array.from(map.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.revenue - a.revenue);
  };

  const getLocationSalesmen = (city: string, province: string) => {
    const map = new Map<string, { revenue: number; transactions: number }>();
    filteredData
      .filter((r) => r.city === city && r.province === province)
      .forEach((r) => {
        const key = r.salesmanName || "Unknown";
        const existing = map.get(key) || { revenue: 0, transactions: 0 };
        map.set(key, {
          revenue: existing.revenue + Math.abs(r.amount),
          transactions: existing.transactions + 1,
        });
      });
    return Array.from(map.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.revenue - a.revenue);
  };

  return (
    <div className="space-y-4 ">
      {/* Province Revenue Chart */}
      <Card className="dark:border-zinc-700 dark:bg-white/13">
        <CardHeader className="">
          <div className="flex items-center justify-between ">
            <div>
              <CardTitle>Revenue by Province</CardTitle>
              <CardDescription>
                {selectedProvince
                  ? `Showing cities in ${selectedProvince}`
                  : "Provincial performance comparison (click bar to filter cities)"}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {selectedProvince && (
                <Button
                  className="dark:border-zinc-700"
                  variant="outline"
                  size="sm"
                  onClick={handleClearProvinceSelection}
                >
                  Clear
                </Button>
              )}
            </div>
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
            className="h-85 w-full"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={provinceRevenue}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="province"
                  angle={-45}
                  textAnchor="end"
                  height={120}
                  interval={0}
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  tickFormatter={(value) =>
                    value.toString().substring(0, 25) +
                    (value.length > 25 ? "..." : "")
                  }
                  onClick={handleProvinceClick}
                  style={{
                    cursor: "pointer",
                    whiteSpace: "normal",
                    textWrap: "break-word",
                  }}
                />
                <YAxis
                  width={getYAxisWidth(provinceRevenue)}
                  tickFormatter={(value) => formatCurrency(value)}
                />
                <ChartTooltip
                  content={({
                    active,
                    payload,
                  }: {
                    active?: boolean;
                    payload?: Array<{ payload?: Record<string, unknown> }>;
                  }) => {
                    if (!active || !payload?.length) return null;
                    const d = (payload[0].payload || {}) as Record<
                      string,
                      unknown
                    >;
                    const topProd = topProductByProvince.get(
                      String(d.province ?? ""),
                    );
                    const topSales = topSalesmanByProvince.get(
                      String(d.province ?? ""),
                    );
                    const topCust = topCustomerByProvince.get(
                      String(d.province ?? ""),
                    );
                    return (
                      <div className="rounded-lg border bg-background p-3 shadow-md text-sm min-w-52 space-y-1.5">
                        <p className="font-semibold text-xs">
                          {String(d.province)}
                        </p>
                        <div className="border-t pt-1.5 space-y-0.5">
                          <div className="flex justify-between gap-4">
                            <span className="text-muted-foreground">
                              Revenue
                            </span>
                            <span className="font-medium">
                              {formatCurrency(Number(d.revenue) || 0)}
                            </span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-muted-foreground">
                              Transactions
                            </span>
                            <span className="font-medium">
                              {Number(d.transactions) || 0}
                            </span>
                          </div>
                          {topProd?.name && (
                            <div className="flex justify-between gap-4">
                              <span className="text-muted-foreground">
                                Top Product
                              </span>
                              <span className="font-medium max-w-32 text-right truncate">
                                {topProd.name}
                              </span>
                            </div>
                          )}
                          {topSales?.name && (
                            <div className="flex justify-between gap-4">
                              <span className="text-muted-foreground">
                                Top Salesman
                              </span>
                              <span className="font-medium max-w-32 text-right truncate">
                                {topSales.name}
                              </span>
                            </div>
                          )}
                          {topCust?.name && (
                            <div className="flex justify-between gap-4">
                              <span className="text-muted-foreground">
                                Top Customer
                              </span>
                              <span className="font-medium max-w-32 text-right truncate">
                                {topCust.name}
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
                  onMouseEnter={(data) => setHoveredProvince(data.province)}
                  onMouseLeave={() => setHoveredProvince(null)}
                  onClick={handleProvinceClick}
                  cursor="pointer"
                  minPointSize={3}
                >
                  {provinceRevenue.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        selectedProvince === entry.province
                          ? activeChartColors[0]
                          : activeChartColors[index % activeChartColors.length]
                      }
                      opacity={
                        (selectedProvince &&
                          selectedProvince !== entry.province) ||
                        (!selectedProvince &&
                          hoveredProvince &&
                          hoveredProvince !== entry.province)
                          ? 0.3
                          : 1
                      }
                      style={{
                        filter:
                          hoveredProvince === entry.province
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

      {/* City Revenue Heatmap */}
      <Card className="dark:border-zinc-700 dark:bg-white/13">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>City Revenue Heatmap</CardTitle>
              <CardDescription>
                {selectedProvince
                  ? `Top 15 cities in ${selectedProvince} (click to see top products,salesman, and customers )`
                  : "Top 15 cities by revenue (click to see top products,salesman, and customers)"}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {selectedProvince && (
                <Button
                  className="dark:border-zinc-700"
                  variant="outline"
                  size="sm"
                  onClick={handleClearProvinceSelection}
                >
                  Clear
                </Button>
              )}
              {/* <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  exportToCSV(
                    filteredCitiesByProvince.map((l, i) => ({
                      rank: i + 1,
                      city: l.city,
                      province: l.province,
                      revenue: l.revenue,
                      transactions: l.transactions,
                    })),
                    selectedProvince ? `${selectedProvince}-cities-revenue.csv` : "city-revenue.csv"
                  )
                }
              >
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button> */}
            </div>
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
              <BarChart data={top15Cities} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  tickFormatter={(value) => formatCurrency(value)}
                />
                <YAxis
                  dataKey="city"
                  type="category"
                  width={150}
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  tickFormatter={(value: string) => {
                    return value.length > 25
                      ? value.slice(0, 25) + "..."
                      : value;
                  }}
                  onClick={handleCityClick}
                  style={{ cursor: "pointer" }}
                />
                <ChartTooltip
                  content={({
                    active,
                    payload,
                  }: {
                    active?: boolean;
                    payload?: Array<{ payload?: Record<string, unknown> }>;
                  }) => {
                    if (!active || !payload?.length) return null;
                    const d = (payload[0].payload || {}) as Record<
                      string,
                      unknown
                    >;
                    const cityKey = `${String(d.city || "")}|||${String(d.province || "")}`;
                    const topProd = topProductByCity.get(cityKey);
                    const topSales = topSalesmanByCity.get(cityKey);
                    const topCust = topCustomerByCity.get(cityKey);
                    return (
                      <div className="rounded-lg border bg-background p-3 shadow-md text-sm min-w-52 space-y-1.5">
                        <p className="font-semibold text-xs">
                          {String(d.city)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {String(d.province)}
                        </p>
                        <div className="border-t pt-1.5 space-y-0.5">
                          <div className="flex justify-between gap-4">
                            <span className="text-muted-foreground">
                              Revenue
                            </span>
                            <span className="font-medium">
                              {formatCurrency(Number(d.revenue) || 0)}
                            </span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-muted-foreground">
                              Transactions
                            </span>
                            <span className="font-medium">
                              {Number(d.transactions) || 0}
                            </span>
                          </div>
                          {topProd?.name && (
                            <div className="flex justify-between gap-4">
                              <span className="text-muted-foreground">
                                Top Product
                              </span>
                              <span className="font-medium max-w-32 text-right truncate">
                                {topProd.name}
                              </span>
                            </div>
                          )}
                          {topSales?.name && (
                            <div className="flex justify-between gap-4">
                              <span className="text-muted-foreground">
                                Top Salesman
                              </span>
                              <span className="font-medium max-w-32 text-right truncate">
                                {topSales.name}
                              </span>
                            </div>
                          )}
                          {topCust?.name && (
                            <div className="flex justify-between gap-4">
                              <span className="text-muted-foreground">
                                Top Customer
                              </span>
                              <span className="font-medium max-w-32 text-right truncate">
                                {topCust.name}
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
                  radius={[0, 4, 4, 0]}
                  onMouseEnter={(data) =>
                    setHoveredCity(`${data.city}|||${data.province}`)
                  }
                  onMouseLeave={() => setHoveredCity(null)}
                  onClick={(data) =>
                    setSelectedLocation(`${data.city}|||${data.province}`)
                  }
                  cursor="pointer"
                  minPointSize={5}
                >
                  {top15Cities.map((entry, index) => {
                    const isSelected =
                      selectedLocation === `${entry.city}|||${entry.province}`;
                    const ck = `${entry.city}|||${entry.province}`;
                    return (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          isSelected
                            ? activeChartColors[0]
                            : activeChartColors[
                                index % activeChartColors.length
                              ]
                        }
                        opacity={
                          (selectedLocation && !isSelected) ||
                          (!selectedLocation &&
                            hoveredCity &&
                            hoveredCity !== ck)
                            ? 0.3
                            : 1
                        }
                        style={{
                          filter:
                            hoveredCity === ck
                              ? "brightness(1.2) drop-shadow(0 0 3px rgba(0,0,0,0.25))"
                              : undefined,
                          transition: "filter 0.12s ease",
                        }}
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Selected Location Details */}
      {selectedLocation &&
        (() => {
          const [locCity, locProvince] = selectedLocation.split("|||");
          const locationCustomers = getLocationCustomers(locCity, locProvince);
          const locationSalesmen = getLocationSalesmen(locCity, locProvince);
          const locProdTotal = Math.ceil(
            topProductsForLocation.length / locItemsPerPage,
          );
          const paginatedLocProducts = topProductsForLocation.slice(
            (locProductPage - 1) * locItemsPerPage,
            locProductPage * locItemsPerPage,
          );
          const locSalesmanTotal = Math.ceil(
            locationSalesmen.length / locItemsPerPage,
          );
          const paginatedLocSalesmen = locationSalesmen.slice(
            (locSalesmanPage - 1) * locItemsPerPage,
            locSalesmanPage * locItemsPerPage,
          );
          const locCustomerTotal = Math.ceil(
            locationCustomers.length / locItemsPerPage,
          );
          const paginatedLocCustomers = locationCustomers.slice(
            (locCustomerPage - 1) * locItemsPerPage,
            locCustomerPage * locItemsPerPage,
          );
          return (
            <Card className="dark:border--700 dark:bg-white/13">
              <CardHeader>
                <div className="flex items-center justify-between ">
                  <div className="flex items-center gap-2 ">
                    <MapPin className="h-5 w-5 text-primary " />
                    <div>
                      <CardTitle>
                        {selectedLocation.replace("|||", ", ")}
                      </CardTitle>
                      <CardDescription>Location breakdown</CardDescription>
                    </div>
                  </div>
                  <Button
                    className="dark:border-zinc-700"
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedLocation(null)}
                  >
                    Clear
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Top Products */}
                {topProductsForLocation.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wide">
                      Top Products
                    </p>
                    <div className="rounded-md border">
                      <Table className="table-fixed w-full dark:border-nc-700 dark:bg-white/3">
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-16">Rank</TableHead>
                            <TableHead className="w-[58%]">Product</TableHead>
                            <TableHead className="w-[28%] text-right">
                              Revenue
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paginatedLocProducts.map((product, index) => {
                            const globalIndex =
                              (locProductPage - 1) * locItemsPerPage + index;
                            return (
                              <TableRow key={product.name}>
                                <TableCell>
                                  <Badge
                                    variant={
                                      globalIndex < 3 ? "default" : "secondary"
                                    }
                                  >
                                    {globalIndex + 1}
                                  </Badge>
                                </TableCell>
                                <TableCell className="max-w-0">
                                  <TruncateText title={product.name}>
                                    {product.name}
                                  </TruncateText>
                                </TableCell>
                                <TableCell className="text-right">
                                  {formatCurrency(product.revenue)}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                    {locProdTotal > 1 && (
                      <div className="flex items-center justify-between px-2 py-4">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <select
                              className="h-8 rounded-md border border-input bg-background px-3 py-1 text-sm dark:border-zinc-700"
                              value={locItemsPerPage}
                              onChange={(e) =>
                                setLocItemsPerPage(Number(e.target.value))
                              }
                            >
                              <option value={5}>5</option>
                              <option value={10}>10</option>
                              <option value={25}>25</option>
                              <option value={50}>50</option>
                            </select>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Showing {(locProductPage - 1) * locItemsPerPage + 1}{" "}
                            to{" "}
                            {Math.min(
                              locProductPage * locItemsPerPage,
                              topProductsForLocation.length,
                            )}{" "}
                            of {topProductsForLocation.length} products
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            className="dark:border-zinc-700 dark:bg-white/5"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setLocProductPage((p) => Math.max(1, p - 1))
                            }
                            disabled={locProductPage === 1}
                          >
                            Previous
                          </Button>
                          {Array.from(
                            { length: Math.min(5, locProdTotal) },
                            (_, i) => {
                              let pageNum;
                              if (locProdTotal <= 5) {
                                pageNum = i + 1;
                              } else if (locProductPage <= 3) {
                                pageNum = i + 1;
                              } else if (locProductPage >= locProdTotal - 2) {
                                pageNum = locProdTotal - 4 + i;
                              } else {
                                pageNum = locProductPage - 2 + i;
                              }
                              return (
                                <Button
                                  key={pageNum}
                                  className="dark:border-zinc-700"
                                  variant={
                                    locProductPage === pageNum
                                      ? "default"
                                      : "outline"
                                  }
                                  size="sm"
                                  onClick={() => setLocProductPage(pageNum)}
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
                              setLocProductPage((p) =>
                                Math.min(locProdTotal, p + 1),
                              )
                            }
                            disabled={locProductPage === locProdTotal}
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {/* Salesmen */}
                {locationSalesmen.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wide">
                      Salesmen
                    </p>
                    <div className="rounded-md border">
                      <Table className="table-fixed w-full dark:border-zinc-700 dark:bg-white/3">
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[58%]">Salesman</TableHead>
                            <TableHead className="w-[21%] text-right">
                              Revenue
                            </TableHead>
                            <TableHead className="w-[21%] text-right">
                              Transactions
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paginatedLocSalesmen.map((s) => (
                            <TableRow key={s.name}>
                              <TableCell className="max-w-0">
                                <TruncateText title={s.name}>
                                  {s.name}
                                </TruncateText>
                              </TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(s.revenue)}
                              </TableCell>
                              <TableCell className="text-right">
                                {s.transactions}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    {locSalesmanTotal > 1 && (
                      <div className="flex items-center justify-between px-2 py-4">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <select
                              className="h-8 rounded-md border border-input bg-background px-3 py-1 text-sm dark:border-zinc-700"
                              value={locItemsPerPage}
                              onChange={(e) =>
                                setLocItemsPerPage(Number(e.target.value))
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
                            {(locSalesmanPage - 1) * locItemsPerPage + 1} to{" "}
                            {Math.min(
                              locSalesmanPage * locItemsPerPage,
                              locationSalesmen.length,
                            )}{" "}
                            of {locationSalesmen.length} salesmen
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            className="dark:border-zinc-700 dark:bg-white/5"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setLocSalesmanPage((p) => Math.max(1, p - 1))
                            }
                            disabled={locSalesmanPage === 1}
                          >
                            Previous
                          </Button>
                          {Array.from(
                            { length: Math.min(5, locSalesmanTotal) },
                            (_, i) => {
                              let pageNum;
                              if (locSalesmanTotal <= 5) {
                                pageNum = i + 1;
                              } else if (locSalesmanPage <= 3) {
                                pageNum = i + 1;
                              } else if (
                                locSalesmanPage >=
                                locSalesmanTotal - 2
                              ) {
                                pageNum = locSalesmanTotal - 4 + i;
                              } else {
                                pageNum = locSalesmanPage - 2 + i;
                              }
                              return (
                                <Button
                                  key={pageNum}
                                  className="dark:border-zinc-700"
                                  variant={
                                    locSalesmanPage === pageNum
                                      ? "default"
                                      : "outline"
                                  }
                                  size="sm"
                                  onClick={() => setLocSalesmanPage(pageNum)}
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
                              setLocSalesmanPage((p) =>
                                Math.min(locSalesmanTotal, p + 1),
                              )
                            }
                            disabled={locSalesmanPage === locSalesmanTotal}
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {/* Customers */}
                {locationCustomers.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wide">
                      Customers
                    </p>
                    <div className="rounded-md border">
                      <Table className="table-fixed w-full dark:border-zinc-700 dark:bg-white/3">
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[58%]">Customer</TableHead>
                            <TableHead className="w-[21%] text-right">
                              Revenue
                            </TableHead>
                            <TableHead className="w-[21%] text-right">
                              Transactions
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paginatedLocCustomers.map((c) => (
                            <TableRow key={c.name}>
                              <TableCell className="max-w-0">
                                <TruncateText title={c.name}>
                                  {c.name}
                                </TruncateText>
                              </TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(c.revenue)}
                              </TableCell>
                              <TableCell className="text-right">
                                {c.transactions}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    {locCustomerTotal > 1 && (
                      <div className="flex items-center justify-between px-2 py-4">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <select
                              className="h-8 rounded-md border border-input bg-background px-3 py-1 text-sm dark:border-zinc-700"
                              value={locItemsPerPage}
                              onChange={(e) =>
                                setLocItemsPerPage(Number(e.target.value))
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
                            {(locCustomerPage - 1) * locItemsPerPage + 1} to{" "}
                            {Math.min(
                              locCustomerPage * locItemsPerPage,
                              locationCustomers.length,
                            )}{" "}
                            of {locationCustomers.length} customers
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            className="dark:border-zinc-700 dark:bg-white/5"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setLocCustomerPage((p) => Math.max(1, p - 1))
                            }
                            disabled={locCustomerPage === 1}
                          >
                            Previous
                          </Button>
                          {Array.from(
                            { length: Math.min(5, locCustomerTotal) },
                            (_, i) => {
                              let pageNum;
                              if (locCustomerTotal <= 5) {
                                pageNum = i + 1;
                              } else if (locCustomerPage <= 3) {
                                pageNum = i + 1;
                              } else if (
                                locCustomerPage >=
                                locCustomerTotal - 2
                              ) {
                                pageNum = locCustomerTotal - 4 + i;
                              } else {
                                pageNum = locCustomerPage - 2 + i;
                              }
                              return (
                                <Button
                                  key={pageNum}
                                  className="dark:border-zinc-700"
                                  variant={
                                    locCustomerPage === pageNum
                                      ? "default"
                                      : "outline"
                                  }
                                  size="sm"
                                  onClick={() => setLocCustomerPage(pageNum)}
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
                              setLocCustomerPage((p) =>
                                Math.min(locCustomerTotal, p + 1),
                              )
                            }
                            disabled={locCustomerPage === locCustomerTotal}
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })()}

      {/* Search Bar */}
      <Card className="dark:border-zinc-700">
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-10 dark:border-zinc-700"
              placeholder="Search locations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Location Details Table */}
      <Card className="dark:border-zinc-700 dark:bg-white/13">
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>All Locations Performance</CardTitle>
              <CardDescription>
                {filteredProvinces.length} provinces · expand to see cities and
                products
              </CardDescription>
            </div>
            {(expandedProvinces.size > 0 || expandedCities.size > 0) && (
              <Button
                className="dark:border-zinc-700"
                variant="outline"
                size="sm"
                onClick={() => {
                  setExpandedProvinces(new Set());
                  setExpandedCities(new Set());
                }}
              >
                Collapse All
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table className="dark:border-zinc-700 dark:bg-white/3 table-fixed w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40%]">
                    <Button
                      variant="ghost"
                      size="sm"
                      title="Sort by location"
                      onClick={() => {
                        if (sortBy === "location") {
                          setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                        } else {
                          setSortBy("location");
                          setSortOrder("asc");
                        }
                      }}
                      className="h-8"
                    >
                      Province / City / Product{" "}
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="w-[20%] text-right">
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
                  <TableHead className="w-[20%] text-right">
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
                  <TableHead className="w-[20%] text-right">
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
                {paginatedProvinces.length > 0 ? (
                  <>
                    {paginatedProvinces.map((provinceData) => {
                      const isProvinceExpanded = expandedProvinces.has(
                        provinceData.province,
                      );
                      const cities = isProvinceExpanded
                        ? getCitiesForProvince(provinceData.province)
                        : [];

                      return (
                        <React.Fragment key={provinceData.province}>
                          {/* Province Row */}
                          <TableRow
                            className="cursor-pointer hover:bg-muted/50 font-semibold"
                            onClick={() =>
                              toggleProvince(provinceData.province)
                            }
                          >
                            <TableCell className="w-[40%]">
                              <div className="flex min-w-0 items-center gap-2">
                                {isProvinceExpanded ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                <TruncateText title={provinceData.province}>
                                  {provinceData.province}
                                </TruncateText>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(provinceData.revenue)}
                            </TableCell>
                            <TableCell className="text-right">
                              {provinceData.transactions}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(
                                provinceData.revenue /
                                  provinceData.transactions,
                              )}
                            </TableCell>
                          </TableRow>

                          {/* Cities under Province */}
                          {isProvinceExpanded &&
                            cities
                              .filter((cityData) => {
                                // If searching, only show cities that match the search term
                                if (!searchTerm) return true;
                                return cityData.city
                                  .toLowerCase()
                                  .includes(searchTerm.toLowerCase());
                              })
                              .map((cityData) => {
                                const cityKey = `${provinceData.province}-${cityData.city}`;
                                const isCityExpanded =
                                  expandedCities.has(cityKey);
                                const products = isCityExpanded
                                  ? getProductsForCity(
                                      cityData.city,
                                      provinceData.province,
                                    )
                                  : [];

                                return (
                                  <React.Fragment key={cityKey}>
                                    {/* City Row */}
                                    <TableRow
                                      className="cursor-pointer hover:bg-muted/30 bg-muted/10"
                                      onClick={(e) => toggleCity(cityKey, e)}
                                    >
                                      <TableCell className="pl-12 w-[40%]">
                                        <div className="flex min-w-0 items-center gap-2">
                                          {isCityExpanded ? (
                                            <ChevronDown className="h-3 w-3" />
                                          ) : (
                                            <ChevronRight className="h-3 w-3" />
                                          )}
                                          <TruncateText
                                            title={cityData.city}
                                            className="text-sm"
                                          >
                                            {cityData.city}
                                          </TruncateText>
                                        </div>
                                      </TableCell>
                                      <TableCell className="text-right text-sm">
                                        {formatCurrency(cityData.revenue)}
                                      </TableCell>
                                      <TableCell className="text-right text-sm">
                                        {cityData.transactions}
                                      </TableCell>
                                      <TableCell className="text-right text-sm">
                                        {formatCurrency(
                                          cityData.revenue /
                                            cityData.transactions,
                                        )}
                                      </TableCell>
                                    </TableRow>

                                    {/* Products under City */}
                                    {isCityExpanded &&
                                      (() => {
                                        const currentProductPage =
                                          cityProductPage.get(cityKey) || 1;
                                        const perPage =
                                          cityProductItemsPerPage.get(
                                            cityKey,
                                          ) ?? 5;
                                        const productTotalPages = Math.ceil(
                                          products.length / perPage,
                                        );
                                        const startIdx =
                                          (currentProductPage - 1) * perPage;
                                        const paginatedProducts =
                                          products.slice(
                                            startIdx,
                                            startIdx + perPage,
                                          );

                                        return (
                                          <>
                                            {paginatedProducts.map(
                                              (productData) => (
                                                <TableRow
                                                  key={`${cityKey}-${productData.productName}`}
                                                  className="bg-muted/5"
                                                >
                                                  <TableCell className="pl-20 max-w-0">
                                                    <TruncateText
                                                      title={
                                                        productData.productName
                                                      }
                                                      className="text-xs text-muted-foreground"
                                                    >
                                                      {productData.productName}
                                                    </TruncateText>
                                                  </TableCell>
                                                  <TableCell className="text-right text-xs">
                                                    {formatCurrency(
                                                      productData.revenue,
                                                    )}
                                                  </TableCell>
                                                  <TableCell className="text-right text-xs">
                                                    {productData.transactions}
                                                  </TableCell>
                                                  <TableCell className="text-right text-xs">
                                                    {formatCurrency(
                                                      productData.revenue /
                                                        productData.transactions,
                                                    )}
                                                  </TableCell>
                                                </TableRow>
                                              ),
                                            )}
                                            {productTotalPages > 1 && (
                                              <TableRow className="bg-muted/5 ">
                                                <TableCell
                                                  colSpan={4}
                                                  className="p-0 pl-15"
                                                >
                                                  <div className="flex items-center justify-between px-2 py-3">
                                                    <div className="flex items-center gap-4">
                                                      <div className="flex items-center gap-2">
                                                        <select
                                                          className="h-8 rounded-md border border-input bg-background px-3 py-1 text-sm dark:border-zinc-700"
                                                          value={
                                                            cityProductItemsPerPage.get(
                                                              cityKey,
                                                            ) ?? 5
                                                          }
                                                          onChange={(e) => {
                                                            setCityProductItemsPerPage(
                                                              new Map(
                                                                cityProductItemsPerPage,
                                                              ).set(
                                                                cityKey,
                                                                Number(
                                                                  e.target
                                                                    .value,
                                                                ),
                                                              ),
                                                            );
                                                            setCityProductPage(
                                                              new Map(
                                                                cityProductPage,
                                                              ).set(cityKey, 1),
                                                            );
                                                          }}
                                                          onClick={(e) =>
                                                            e.stopPropagation()
                                                          }
                                                        >
                                                          <option value={5}>
                                                            5
                                                          </option>
                                                          <option value={10}>
                                                            10
                                                          </option>
                                                          <option value={25}>
                                                            25
                                                          </option>
                                                          <option value={50}>
                                                            50
                                                          </option>
                                                          <option value={100}>
                                                            100
                                                          </option>
                                                        </select>
                                                      </div>
                                                      <div className="text-sm text-muted-foreground ">
                                                        Showing {startIdx + 1}{" "}
                                                        to{" "}
                                                        {Math.min(
                                                          startIdx + perPage,
                                                          products.length,
                                                        )}{" "}
                                                        of {products.length}{" "}
                                                        products
                                                      </div>
                                                    </div>
                                                    <div className="flex gap-1">
                                                      <Button
                                                        className="dark:border-zinc-700 dark:bg-white/5"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={(e) => {
                                                          e.stopPropagation();
                                                          const newPage =
                                                            Math.max(
                                                              1,
                                                              currentProductPage -
                                                                1,
                                                            );
                                                          setCityProductPage(
                                                            new Map(
                                                              cityProductPage,
                                                            ).set(
                                                              cityKey,
                                                              newPage,
                                                            ),
                                                          );
                                                        }}
                                                        disabled={
                                                          currentProductPage ===
                                                          1
                                                        }
                                                      >
                                                        Previous
                                                      </Button>
                                                      {Array.from(
                                                        {
                                                          length: Math.min(
                                                            5,
                                                            productTotalPages,
                                                          ),
                                                        },
                                                        (_, i) => {
                                                          let pageNum;
                                                          if (
                                                            productTotalPages <=
                                                            5
                                                          ) {
                                                            pageNum = i + 1;
                                                          } else if (
                                                            currentProductPage <=
                                                            3
                                                          ) {
                                                            pageNum = i + 1;
                                                          } else if (
                                                            currentProductPage >=
                                                            productTotalPages -
                                                              2
                                                          ) {
                                                            pageNum =
                                                              productTotalPages -
                                                              4 +
                                                              i;
                                                          } else {
                                                            pageNum =
                                                              currentProductPage -
                                                              2 +
                                                              i;
                                                          }
                                                          return (
                                                            <Button
                                                              key={pageNum}
                                                              className="dark:border-zinc-700"
                                                              variant={
                                                                currentProductPage ===
                                                                pageNum
                                                                  ? "default"
                                                                  : "outline"
                                                              }
                                                              size="sm"
                                                              onClick={(e) => {
                                                                e.stopPropagation();
                                                                setCityProductPage(
                                                                  new Map(
                                                                    cityProductPage,
                                                                  ).set(
                                                                    cityKey,
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
                                                        className="dark:border-zinc-700 dark:bg-white/5"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={(e) => {
                                                          e.stopPropagation();
                                                          const newPage =
                                                            Math.min(
                                                              productTotalPages,
                                                              currentProductPage +
                                                                1,
                                                            );
                                                          setCityProductPage(
                                                            new Map(
                                                              cityProductPage,
                                                            ).set(
                                                              cityKey,
                                                              newPage,
                                                            ),
                                                          );
                                                        }}
                                                        disabled={
                                                          currentProductPage ===
                                                          productTotalPages
                                                        }
                                                      >
                                                        Next
                                                      </Button>
                                                    </div>
                                                  </div>
                                                </TableCell>
                                              </TableRow>
                                            )}
                                          </>
                                        );
                                      })()}
                                  </React.Fragment>
                                );
                              })}
                        </React.Fragment>
                      );
                    })}
                  </>
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      No locations found
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
                {Math.min(currentPage * itemsPerPage, filteredProvinces.length)}{" "}
                of {filteredProvinces.length} provinces
              </div>
            </div>
            <div className="flex gap-1">
              <Button
                className="dark:border-zinc-700 dark:bg-white/5"
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
                    className="dark:border-zinc-700"
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
                className="dark:border-zinc-700 dark:bg-white/5"
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
