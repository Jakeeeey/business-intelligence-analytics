// src/modules/business-intelligence-analytics/sales-report/product-returns-performance/components/LocationTab.tsx
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
import { ChevronDown, ChevronRight, MapPin } from "lucide-react";
import { useTheme } from "next-themes";
import type { LocationReturn, ProductReturnRecord } from "../types";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// const chartColors = [
//   "#ef4444", "#f97316", "#eab308", "#f43f5e", "#dc2626",
//   "#fb923c", "#facc15", "#e11d48", "#b91c1c", "#ea580c",
//   "#d97706", "#c2410c", "#9f1239", "#7f1d1d", "#78350f",
//   "#6b21a8", "#0891b2", "#059669", "#2563eb", "#7c3aed",
// ];

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
const _phpFmtLoc = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const formatCurrency = (v: number) => _phpFmtLoc.format(v);
const formatShare = (value: number, total: number) =>
  total > 0 ? `${((value / total) * 100).toFixed(1)}%` : "0.0%";

type LocationTabProps = {
  locationReturns: LocationReturn[];
  filteredData: ProductReturnRecord[];
};

type SortField = "location" | "returnValue" | "returnCount" | "avg";
type SortOrder = "asc" | "desc";

export function LocationTab({ filteredData }: LocationTabProps) {
  const [selectedProvince, setSelectedProvince] = React.useState<string | null>(
    null,
  );
  const [expandedProvinces, setExpandedProvinces] = React.useState<Set<string>>(
    new Set(),
  );
  const [expandedCities, setExpandedCities] = React.useState<Set<string>>(
    new Set(),
  );
  const [sortField, setSortField] = React.useState<SortField>("returnValue");
  const [sortOrder, setSortOrder] = React.useState<SortOrder>("desc");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [itemsPerPage, setItemsPerPage] = React.useState(10);
  const [cityProductPage, setCityProductPage] = React.useState<
    Map<string, number>
  >(new Map());
  const [cityCustomerPage, setCityCustomerPage] = React.useState<
    Map<string, number>
  >(new Map());
  const subTableItemsPerPage = 5;
  const [selectedLocation, setSelectedLocation] = React.useState<string | null>(
    null,
  );
  const [locProductPage, setLocProductPage] = React.useState(1);
  const [locSalesmanPage, setLocSalesmanPage] = React.useState(1);
  const [locCustomerPage, setLocCustomerPage] = React.useState(1);
  const [locItemsPerPage, setLocItemsPerPage] = React.useState(5);
  const [detailProductSortBy, setDetailProductSortBy] = React.useState<
    "returnValue" | "returnCount" | "avg"
  >("returnValue");
  const [detailProductSortOrder, setDetailProductSortOrder] = React.useState<
    "asc" | "desc"
  >("desc");
  const [detailSalesmanSortBy, setDetailSalesmanSortBy] = React.useState<
    "returnValue" | "returnCount"
  >("returnValue");
  const [detailSalesmanSortOrder, setDetailSalesmanSortOrder] = React.useState<
    "asc" | "desc"
  >("desc");
  const [detailCustomerSortBy, setDetailCustomerSortBy] = React.useState<
    "returnValue" | "returnCount"
  >("returnValue");
  const [detailCustomerSortOrder, setDetailCustomerSortOrder] = React.useState<
    "asc" | "desc"
  >("desc");
  const [cityProductSortBy, setCityProductSortBy] = React.useState<
    "returnValue" | "returnCount" | "avg"
  >("returnValue");
  const [cityProductSortOrder, setCityProductSortOrder] = React.useState<
    "asc" | "desc"
  >("desc");
  const [cityCustomerSortBy, setCityCustomerSortBy] = React.useState<
    "returnValue" | "returnCount"
  >("returnValue");
  const [cityCustomerSortOrder, setCityCustomerSortOrder] = React.useState<
    "asc" | "desc"
  >("desc");
  const [hoveredProvince, setHoveredProvince] = React.useState<string | null>(
    null,
  );
  const [hoveredCity, setHoveredCity] = React.useState<string | null>(null);

  const toggleProvince = React.useCallback((province: string) => {
    setExpandedProvinces((prev) => {
      const next = new Set(prev);
      if (next.has(province)) next.delete(province);
      else next.add(province);
      return next;
    });
  }, []);

  const setCityProductPageFor = React.useCallback(
    (cityKey: string, page: number) => {
      setCityProductPage((prev) => {
        const next = new Map(prev);
        next.set(cityKey, page);
        return next;
      });
    },
    [],
  );

  const setCityCustomerPageFor = React.useCallback(
    (cityKey: string, page: number) => {
      setCityCustomerPage((prev) => {
        const next = new Map(prev);
        next.set(cityKey, page);
        return next;
      });
    },
    [],
  );

  const { theme } = useTheme();
  const resolvedTheme = theme;
  const isDark = resolvedTheme === "dark";
  const activeChartColors = isDark ? chartColorsDark : chartColors;

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

  const topProductByProvince = React.useMemo(() => {
    const result = new Map<string, { name: string; returnValue: number }>();
    const map = new Map<string, Map<string, number>>();
    filteredData.forEach((r) => {
      const prov = r.province || "Unknown";
      if (!map.has(prov)) map.set(prov, new Map());
      const pm = map.get(prov)!;
      pm.set(r.productName, (pm.get(r.productName) || 0) + Math.abs(r.amount));
    });
    map.forEach((pm, prov) => {
      const best = Array.from(pm.entries()).sort((a, b) => b[1] - a[1])[0];
      if (best) result.set(prov, { name: best[0], returnValue: best[1] });
    });
    return result;
  }, [filteredData]);

  const topSalesmanByProvince = React.useMemo(() => {
    const result = new Map<string, { name: string; returnValue: number }>();
    const map = new Map<string, Map<string, number>>();
    filteredData.forEach((r) => {
      const prov = r.province || "Unknown";
      if (!map.has(prov)) map.set(prov, new Map());
      const pm = map.get(prov)!;
      const key = r.salesmanName || "Unknown";
      pm.set(key, (pm.get(key) || 0) + Math.abs(r.amount));
    });
    map.forEach((pm, prov) => {
      const best = Array.from(pm.entries()).sort((a, b) => b[1] - a[1])[0];
      if (best) result.set(prov, { name: best[0], returnValue: best[1] });
    });
    return result;
  }, [filteredData]);

  const topCustomerByProvince = React.useMemo(() => {
    const result = new Map<string, { name: string; returnValue: number }>();
    const map = new Map<string, Map<string, number>>();
    filteredData.forEach((r) => {
      const prov = r.province || "Unknown";
      if (!map.has(prov)) map.set(prov, new Map());
      const pm = map.get(prov)!;
      const key = r.customerName || "Unknown";
      pm.set(key, (pm.get(key) || 0) + Math.abs(r.amount));
    });
    map.forEach((pm, prov) => {
      const best = Array.from(pm.entries()).sort((a, b) => b[1] - a[1])[0];
      if (best) result.set(prov, { name: best[0], returnValue: best[1] });
    });
    return result;
  }, [filteredData]);

  const topProductByCity = React.useMemo(() => {
    const result = new Map<string, { name: string; returnValue: number }>();
    const map = new Map<string, Map<string, number>>();
    filteredData.forEach((r) => {
      const city = r.city || "Unknown";
      if (!map.has(city)) map.set(city, new Map());
      const pm = map.get(city)!;
      pm.set(r.productName, (pm.get(r.productName) || 0) + Math.abs(r.amount));
    });
    map.forEach((pm, city) => {
      const best = Array.from(pm.entries()).sort((a, b) => b[1] - a[1])[0];
      if (best) result.set(city, { name: best[0], returnValue: best[1] });
    });
    return result;
  }, [filteredData]);

  const topSalesmanByCity = React.useMemo(() => {
    const result = new Map<string, { name: string; returnValue: number }>();
    const map = new Map<string, Map<string, number>>();
    filteredData.forEach((r) => {
      const city = r.city || "Unknown";
      if (!map.has(city)) map.set(city, new Map());
      const pm = map.get(city)!;
      const key = r.salesmanName || "Unknown";
      pm.set(key, (pm.get(key) || 0) + Math.abs(r.amount));
    });
    map.forEach((pm, city) => {
      const best = Array.from(pm.entries()).sort((a, b) => b[1] - a[1])[0];
      if (best) result.set(city, { name: best[0], returnValue: best[1] });
    });
    return result;
  }, [filteredData]);

  const topCustomerByCity = React.useMemo(() => {
    const result = new Map<string, { name: string; returnValue: number }>();
    const map = new Map<string, Map<string, number>>();
    filteredData.forEach((r) => {
      const city = r.city || "Unknown";
      if (!map.has(city)) map.set(city, new Map());
      const pm = map.get(city)!;
      const key = r.customerName || "Unknown";
      pm.set(key, (pm.get(key) || 0) + Math.abs(r.amount));
    });
    map.forEach((pm, city) => {
      const best = Array.from(pm.entries()).sort((a, b) => b[1] - a[1])[0];
      if (best) result.set(city, { name: best[0], returnValue: best[1] });
    });
    return result;
  }, [filteredData]);

  const getYAxisWidth = (data: { returnValue: number }[]) => {
    if (!data?.length) return 60;
    const maxValue = Math.max(...data.map((d) => d.returnValue));
    return Math.max(60, formatCurrency(maxValue).length * 8);
  };

  // Province aggregations
  const provinceData = React.useMemo(() => {
    const map = new Map<string, { returnValue: number; returnCount: number }>();
    filteredData.forEach((r) => {
      // Filter out records with missing or invalid province data
      const prov = r.province?.trim();
      if (!prov) return;
      const existing = map.get(prov) || { returnValue: 0, returnCount: 0 };
      map.set(prov, {
        returnValue: existing.returnValue + Math.abs(r.amount),
        returnCount: existing.returnCount + 1,
      });
    });
    return Array.from(map.entries())
      .map(([name, data]) => ({
        name,
        ...data,
        avg: data.returnCount > 0 ? data.returnValue / data.returnCount : 0,
      }))
      .sort((a, b) => b.returnValue - a.returnValue);
  }, [filteredData]);

  // City aggregations (optionally filtered by selected province)
  const cityData = React.useMemo(() => {
    const map = new Map<
      string,
      { returnValue: number; returnCount: number; province: string }
    >();
    filteredData
      .filter(
        (r) => !selectedProvince || r.province?.trim() === selectedProvince,
      )
      .forEach((r) => {
        // Filter out records with missing city/province data
        const city = r.city?.trim();
        const province = r.province?.trim();
        if (!city || !province) return;
        const existing = map.get(city) || {
          returnValue: 0,
          returnCount: 0,
          province,
        };
        map.set(city, {
          returnValue: existing.returnValue + Math.abs(r.amount),
          returnCount: existing.returnCount + 1,
          province: existing.province,
        });
      });
    return Array.from(map.entries())
      .map(([name, data]) => ({
        name,
        ...data,
        avg: data.returnCount > 0 ? data.returnValue / data.returnCount : 0,
      }))
      .sort((a, b) => b.returnValue - a.returnValue)
      .slice(0, 15);
  }, [filteredData, selectedProvince]);

  // Get cities for a province (for hierarchical table)
  const getCitiesForProvince = React.useCallback(
    (province: string) => {
      const map = new Map<
        string,
        { returnValue: number; returnCount: number }
      >();
      filteredData
        .filter((r) => (r.province?.trim() || "Unknown") === province)
        .forEach((r) => {
          const city = r.city?.trim() || "Unknown";
          const existing = map.get(city) || { returnValue: 0, returnCount: 0 };
          map.set(city, {
            returnValue: existing.returnValue + Math.abs(r.amount),
            returnCount: existing.returnCount + 1,
          });
        });
      return Array.from(map.entries())
        .map(([name, data]) => ({
          name,
          ...data,
          avg: data.returnCount > 0 ? data.returnValue / data.returnCount : 0,
        }))
        .sort((a, b) => b.returnValue - a.returnValue);
    },
    [filteredData],
  );

  // Get products for a city + province
  const getProductsForLocation = React.useCallback(
    (city: string, province: string) => {
      const map = new Map<
        string,
        { returnValue: number; returnCount: number }
      >();
      filteredData
        .filter(
          (r) =>
            (r.city?.trim() || "Unknown") === city &&
            (r.province?.trim() || "Unknown") === province,
        )
        .forEach((r) => {
          const prod = r.productName || "Unknown";
          const existing = map.get(prod) || { returnValue: 0, returnCount: 0 };
          map.set(prod, {
            returnValue: existing.returnValue + Math.abs(r.amount),
            returnCount: existing.returnCount + 1,
          });
        });
      return Array.from(map.entries())
        .map(([name, data]) => ({
          name,
          ...data,
          avg: data.returnCount > 0 ? data.returnValue / data.returnCount : 0,
        }))
        .sort((a, b) => b.returnValue - a.returnValue);
    },
    [filteredData],
  );

  // Get salesmen for a city + province
  const getSalesmenForLocation = React.useCallback(
    (city: string, province: string) => {
      const map = new Map<
        string,
        { returnValue: number; returnCount: number }
      >();
      filteredData
        .filter(
          (r) =>
            (r.city?.trim() || "Unknown") === city &&
            (r.province?.trim() || "Unknown") === province,
        )
        .forEach((r) => {
          const s = r.salesmanName || "Unknown";
          const existing = map.get(s) || { returnValue: 0, returnCount: 0 };
          map.set(s, {
            returnValue: existing.returnValue + Math.abs(r.amount),
            returnCount: existing.returnCount + 1,
          });
        });
      return Array.from(map.entries())
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.returnValue - a.returnValue);
    },
    [filteredData],
  );

  // Get customers for a city + province
  const getCustomersForLocation = React.useCallback(
    (city: string, province: string) => {
      const map = new Map<
        string,
        { returnValue: number; returnCount: number }
      >();
      filteredData
        .filter(
          (r) =>
            (r.city?.trim() || "Unknown") === city &&
            (r.province?.trim() || "Unknown") === province,
        )
        .forEach((r) => {
          const cust = r.customerName || "Unknown";
          const existing = map.get(cust) || { returnValue: 0, returnCount: 0 };
          map.set(cust, {
            returnValue: existing.returnValue + Math.abs(r.amount),
            returnCount: existing.returnCount + 1,
          });
        });
      return Array.from(map.entries())
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.returnValue - a.returnValue);
    },
    [filteredData],
  );

  const handleSort = (field: SortField) => {
    if (sortField === field)
      setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const sortedProvinces = React.useMemo(() => {
    return [...provinceData].sort((a, b) => {
      let cmp = 0;
      if (sortField === "location") cmp = a.name.localeCompare(b.name);
      else if (sortField === "returnValue") cmp = a.returnValue - b.returnValue;
      else if (sortField === "returnCount") cmp = a.returnCount - b.returnCount;
      else if (sortField === "avg") cmp = a.avg - b.avg;
      return sortOrder === "asc" ? cmp : -cmp;
    });
  }, [provinceData, sortField, sortOrder]);

  const totalPages = Math.ceil(sortedProvinces.length / itemsPerPage);
  const paginatedProvinces = React.useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedProvinces.slice(start, start + itemsPerPage);
  }, [sortedProvinces, currentPage, itemsPerPage]);

  const provinceTotalCount = React.useMemo(
    () => provinceData.reduce((sum, province) => sum + province.returnCount, 0),
    [provinceData],
  );
  const provinceTotalValue = React.useMemo(
    () => provinceData.reduce((sum, province) => sum + province.returnValue, 0),
    [provinceData],
  );

  const topProductsForLocation = React.useMemo(() => {
    if (!selectedLocation) return [];
    const [locCity, locProvince] = selectedLocation.split("|||");
    return getProductsForLocation(locCity, locProvince);
  }, [selectedLocation, getProductsForLocation]);

  const sortedTopProductsForLocation = React.useMemo(() => {
    return [...topProductsForLocation].sort((a, b) => {
      let cmp = 0;
      if (detailProductSortBy === "returnValue")
        cmp = a.returnValue - b.returnValue;
      else if (detailProductSortBy === "returnCount")
        cmp = a.returnCount - b.returnCount;
      else cmp = a.avg - b.avg;
      return detailProductSortOrder === "asc" ? cmp : -cmp;
    });
  }, [topProductsForLocation, detailProductSortBy, detailProductSortOrder]);
  const sortedLocationSalesmen = React.useMemo(() => {
    if (!selectedLocation) return [];
    const [locCity, locProvince] = selectedLocation.split("|||");
    const rows = getSalesmenForLocation(locCity, locProvince);
    return [...rows].sort((a, b) => {
      const cmp =
        detailSalesmanSortBy === "returnValue"
          ? a.returnValue - b.returnValue
          : a.returnCount - b.returnCount;
      return detailSalesmanSortOrder === "asc" ? cmp : -cmp;
    });
  }, [
    selectedLocation,
    getSalesmenForLocation,
    detailSalesmanSortBy,
    detailSalesmanSortOrder,
  ]);
  const sortedLocationCustomers = React.useMemo(() => {
    if (!selectedLocation) return [];
    const [locCity, locProvince] = selectedLocation.split("|||");
    const rows = getCustomersForLocation(locCity, locProvince);
    return [...rows].sort((a, b) => {
      const cmp =
        detailCustomerSortBy === "returnValue"
          ? a.returnValue - b.returnValue
          : a.returnCount - b.returnCount;
      return detailCustomerSortOrder === "asc" ? cmp : -cmp;
    });
  }, [
    selectedLocation,
    getCustomersForLocation,
    detailCustomerSortBy,
    detailCustomerSortOrder,
  ]);
  // Stable handlers
  const handleClearProvinceSelection = React.useCallback(
    () => setSelectedProvince(null),
    [],
  );
  const handleClearLocationSelection = React.useCallback(
    () => setSelectedLocation(null),
    [],
  );
  // removed unused handler: set items per page inline where used
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

  const handleCityClick = React.useCallback((data: unknown) => {
    // Defensive parsing: Recharts may pass a primitive, an object with value/name, or an event with payload
    let city: string | undefined;
    let province: string | undefined;
    if (data == null) return;
    if (typeof data === "string" || typeof data === "number") {
      city = String(data);
    } else if (typeof data === "object") {
      const d = data as Record<string, unknown>;
      if (d.name || d.city) {
        city = String(d.name ?? d.city);
        province = String(d.province ?? "");
      } else if (d.value) {
        city = String(d.value);
      } else if (d.payload) {
        const p = d.payload as Record<string, unknown> | undefined;
        city = String(p?.name ?? p?.city ?? p?.value ?? "");
        province = String(p?.province ?? province ?? "");
      }
    }
    if (!city) return;
    city = city.trim();
    province = (province || "").trim() || "Unknown";
    const key = `${city}|||${province}`;
    setSelectedLocation((prev) => (prev === key ? null : key));
    setLocProductPage(1);
    setLocSalesmanPage(1);
    setLocCustomerPage(1);
  }, []);

  const handleProvinceClick = React.useCallback((data: unknown) => {
    if (!data) return;

    const extract = (p: unknown): string | null => {
      if (p == null) return null;
      if (Array.isArray(p)) {
        for (const item of p) {
          const candidate = extract(item);
          if (candidate) return candidate;
        }
        return null;
      }
      if (typeof p === "object") {
        const o = p as Record<string, unknown>;
        return (
          (o.province as string) ??
          (o.name as string) ??
          (o.value as string) ??
          extract(o.payload) ??
          null
        );
      }
      // primitive
      return String(p);
    };

    const d = data as Record<string, unknown>;
    let val =
      d.province ??
      d.name ??
      d.value ??
      extract(d.payload) ??
      extract((d.payload as Record<string, unknown> | undefined)?.payload);
    if (val == null) return;
    val = String(val).trim();
    if (!val) return;

    setSelectedProvince((prev) => {
      const next = prev === String(val) ? null : String(val);
      // only clear selectedLocation when province actually changed to a new value
      if (next && next !== prev) setSelectedLocation(null);
      return next;
    });
  }, []);
  const renderPagination = (
    currentPg: number,
    totalPgs: number,
    total: number,
    label: string,
    onPrev: () => void,
    onNext: () => void,
    onPage: (n: number) => void,
    itemsPer: number,
    onItemsPerChange: (n: number) => void,
  ) => (
    <div className="flex items-center justify-between px-2 py-4">
      <div className="flex items-center gap-4">
        <select
          className="h-8 rounded-md border border-input bg-background px-3 py-1 text-sm "
          value={itemsPer}
          onChange={(e) => onItemsPerChange(Number(e.target.value))}
        >
          <option value={5}>5</option>
          <option value={10}>10</option>
          <option value={25}>25</option>
          <option value={50}>50</option>
        </select>
        <div className="text-sm text-muted-foreground">
          Showing {(currentPg - 1) * itemsPer + 1} to{" "}
          {Math.min(currentPg * itemsPer, total)} of {total} {label}
        </div>
      </div>
      <div className="flex gap-1">
        <Button
          className="dark:border-y-zinc-700 dark:bg-white/5"
          variant="outline"
          size="sm"
          onClick={onPrev}
          disabled={currentPg === 1}
        >
          Previous
        </Button>
        {Array.from({ length: Math.min(5, totalPgs) }, (_, i) => {
          let pn: number;
          if (totalPgs <= 5) pn = i + 1;
          else if (currentPg <= 3) pn = i + 1;
          else if (currentPg >= totalPgs - 2) pn = totalPgs - 4 + i;
          else pn = currentPg - 2 + i;
          return (
            <Button
              key={pn}
              className="dark:border-y-zinc-700"
              variant={currentPg === pn ? "default" : "outline"}
              size="sm"
              onClick={() => onPage(pn)}
            >
              {pn}
            </Button>
          );
        })}
        <Button
          className="dark:border-y-zinc-700 dark:bg-white/5"
          variant="outline"
          size="sm"
          onClick={onNext}
          disabled={currentPg === totalPgs || totalPgs === 0}
        >
          Next
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Province Chart */}
      <Card className="dark:border-y-zinc-700 ">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Return Value by Province</CardTitle>
              <CardDescription>
                {selectedProvince
                  ? `Showing cities in ${selectedProvince}`
                  : "Provincial performance comparison (click bar to filter cities)"}
              </CardDescription>
            </div>
            {selectedProvince && (
              <Button
                className=""
                variant="outline"
                size="sm"
                onClick={handleClearProvinceSelection}
              >
                Clear
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              returnValue: {
                label: "Return Value",
                color: "#ef4444",
              },
            }}
            className="h-85 w-full"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={provinceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  domain={[0, "auto"]}
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={90}
                  interval={0}
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  tickFormatter={(value) =>
                    value.toString().substring(0, 25) +
                    (value.toString().length > 25 ? "…" : "")
                  }
                  onClick={handleProvinceClick}
                  style={{ cursor: "pointer" }}
                />
                <YAxis
                  domain={[0, "auto"]}
                  width={getYAxisWidth(provinceData)}
                  tickFormatter={(v) => formatCurrency(v)}
                />
                <ChartTooltip
                  content={(props: {
                    active?: boolean;
                    payload?: unknown[];
                  }) => {
                    const { active, payload } = props;
                    if (
                      !active ||
                      !Array.isArray(payload) ||
                      payload.length === 0
                    )
                      return null;
                    const p0 = payload[0] as
                      | Record<string, unknown>
                      | undefined;
                    const d = p0?.payload as
                      | Record<string, unknown>
                      | undefined;
                    if (!d) return null;
                    const name = String(d.name ?? d.city ?? "");
                    const fmt = formatCurrency;
                    const topProd = topProductByProvince.get(name);
                    const topSales = topSalesmanByProvince.get(name);
                    const topCust = topCustomerByProvince.get(name);
                    const returnValue = Number(d.returnValue ?? 0);
                    const returnCount = Number(d.returnCount ?? 0);
                    return (
                      <div className="rounded-lg border bg-background p-3 shadow-md text-sm min-w-56 space-y-1.5">
                        <p className="font-semibold">{name}</p>
                        <div className="border-t pt-1.5 space-y-1">
                          <div className="flex justify-between gap-4">
                            <span className="text-muted-foreground">
                              Return Value
                            </span>
                            <span className="font-medium tabular-nums">
                              {fmt(returnValue)}
                            </span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-muted-foreground">
                              Return Count
                            </span>
                            <span className="font-medium">{returnCount}</span>
                          </div>
                          {topProd && (
                            <div className="flex justify-between gap-4">
                              <span className="text-muted-foreground">
                                Top Product
                              </span>
                              <span className="font-medium truncate max-w-32 text-right">
                                {topProd.name}
                              </span>
                            </div>
                          )}
                          {topSales && (
                            <div className="flex justify-between gap-4">
                              <span className="text-muted-foreground">
                                Top Salesman
                              </span>
                              <span className="font-medium truncate max-w-32 text-right">
                                {topSales.name}
                              </span>
                            </div>
                          )}
                          {topCust && (
                            <div className="flex justify-between gap-4">
                              <span className="text-muted-foreground">
                                Top Customer
                              </span>
                              <span className="font-medium truncate max-w-32 text-right">
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
                  dataKey="returnValue"
                  radius={[4, 4, 0, 0]}
                  cursor="pointer"
                  onMouseEnter={(data) => setHoveredProvince(data.name)}
                  onMouseLeave={() => setHoveredProvince(null)}
                  onClick={handleProvinceClick}
                >
                  {provinceData.map((entry, index) => (
                    <Cell
                      key={`prov-${index}`}
                      fill={activeChartColors[index % activeChartColors.length]}
                      opacity={
                        selectedProvince && selectedProvince !== entry.name
                          ? 0.3
                          : 1
                      }
                      style={{
                        filter:
                          hoveredProvince === entry.name
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

      {/* City Chart */}
      <Card className="dark:border-y-zinc-700 ">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>City Return Value Heatmap</CardTitle>
              <CardDescription>
                {selectedProvince
                  ? `Top 15 cities in ${selectedProvince} (click to see top products, salesman, and customers)`
                  : "Top 15 cities by return value (click to see top products, salesman, and customers)"}
              </CardDescription>
            </div>
            {selectedLocation && (
              <Button
                className=""
                variant="outline"
                size="sm"
                onClick={handleClearLocationSelection}
              >
                Clear
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              returnValue: { label: "Return Value", color: "#f97316" },
            }}
            className="h-104 w-full"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cityData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tickFormatter={(v) => formatCurrency(v)} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={150}
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  tickFormatter={(v: string) =>
                    v.length > 25 ? v.slice(0, 25) + "..." : v
                  }
                  onClick={(data) => {
                    if (data?.value) {
                      const clicked = cityData.find(
                        (c) => c.name === data.value,
                      );
                      if (clicked) handleCityClick(clicked);
                    }
                  }}
                  style={{ cursor: "pointer" }}
                />
                <ChartTooltip
                  content={(props: {
                    active?: boolean;
                    payload?: unknown[];
                  }) => {
                    const { active, payload } = props;
                    if (
                      !active ||
                      !Array.isArray(payload) ||
                      payload.length === 0
                    )
                      return null;
                    const p0 = payload[0] as
                      | Record<string, unknown>
                      | undefined;
                    const d = p0?.payload as
                      | Record<string, unknown>
                      | undefined;
                    if (!d) return null;
                    const name = String(d.name ?? d.city ?? "");
                    const fmt = formatCurrency;
                    const topProd = topProductByCity.get(name);
                    const topSales = topSalesmanByCity.get(name);
                    const topCust = topCustomerByCity.get(name);
                    const returnValue = Number(d.returnValue ?? 0);
                    const returnCount = Number(d.returnCount ?? 0);
                    return (
                      <div className="rounded-lg border bg-background p-3 shadow-md text-sm min-w-56 space-y-1.5">
                        <p className="font-semibold">{name}</p>
                        <div className="border-t pt-1.5 space-y-1">
                          <div className="flex justify-between gap-4">
                            <span className="text-muted-foreground">
                              Return Value
                            </span>
                            <span className="font-medium tabular-nums">
                              {fmt(returnValue)}
                            </span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-muted-foreground">
                              Return Count
                            </span>
                            <span className="font-medium">{returnCount}</span>
                          </div>
                          {topProd && (
                            <div className="flex justify-between gap-4">
                              <span className="text-muted-foreground">
                                Top Product
                              </span>
                              <span className="font-medium truncate max-w-32 text-right">
                                {topProd.name}
                              </span>
                            </div>
                          )}
                          {topSales && (
                            <div className="flex justify-between gap-4">
                              <span className="text-muted-foreground">
                                Top Salesman
                              </span>
                              <span className="font-medium truncate max-w-32 text-right">
                                {topSales.name}
                              </span>
                            </div>
                          )}
                          {topCust && (
                            <div className="flex justify-between gap-4">
                              <span className="text-muted-foreground">
                                Top Customer
                              </span>
                              <span className="font-medium truncate max-w-32 text-right">
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
                  dataKey="returnValue"
                  radius={[0, 4, 4, 0]}
                  cursor="pointer"
                  minPointSize={5}
                  onMouseEnter={(data) => setHoveredCity(data.name)}
                  onMouseLeave={() => setHoveredCity(null)}
                  onClick={(data) =>
                    handleCityClick(data as { name: string; province: string })
                  }
                >
                  {cityData.map((entry, index) => {
                    const isSelected =
                      selectedLocation === `${entry.name}|||${entry.province}`;
                    return (
                      <Cell
                        key={`city-${index}`}
                        fill={
                          isSelected
                            ? activeChartColors[0]
                            : activeChartColors[
                                index % activeChartColors.length
                              ]
                        }
                        opacity={selectedLocation && !isSelected ? 0.3 : 1}
                        style={{
                          filter:
                            hoveredCity === entry.name
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

      {/* Selected Location Detail Panel */}
      {selectedLocation &&
        (() => {
          const [locCity, locProvince] = selectedLocation.split("|||");
          const locationProducts = sortedTopProductsForLocation;
          const locationSalesmen = sortedLocationSalesmen;
          const locationCustomers = sortedLocationCustomers;
          const locationProductsTotalCount = locationProducts.reduce(
            (sum, product) => sum + product.returnCount,
            0,
          );
          const locationProductsTotalValue = locationProducts.reduce(
            (sum, product) => sum + product.returnValue,
            0,
          );
          const locationSalesmenTotalCount = locationSalesmen.reduce(
            (sum, salesman) => sum + salesman.returnCount,
            0,
          );
          const locationSalesmenTotalValue = locationSalesmen.reduce(
            (sum, salesman) => sum + salesman.returnValue,
            0,
          );
          const locationCustomersTotalCount = locationCustomers.reduce(
            (sum, customer) => sum + customer.returnCount,
            0,
          );
          const locationCustomersTotalValue = locationCustomers.reduce(
            (sum, customer) => sum + customer.returnValue,
            0,
          );

          const locProdTotalPgs = Math.ceil(
            locationProducts.length / locItemsPerPage,
          );
          const paginatedLocProducts = locationProducts.slice(
            (locProductPage - 1) * locItemsPerPage,
            locProductPage * locItemsPerPage,
          );
          const locSalesmanTotalPgs = Math.ceil(
            locationSalesmen.length / locItemsPerPage,
          );
          const paginatedLocSalesmen = locationSalesmen.slice(
            (locSalesmanPage - 1) * locItemsPerPage,
            locSalesmanPage * locItemsPerPage,
          );
          const locCustomerTotalPgs = Math.ceil(
            locationCustomers.length / locItemsPerPage,
          );
          const paginatedLocCustomers = locationCustomers.slice(
            (locCustomerPage - 1) * locItemsPerPage,
            locCustomerPage * locItemsPerPage,
          );

          return (
            <Card
              key="location-detail"
              className="border-primary dark:border-y-zinc-700 "
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    <div>
                      <CardTitle>
                        {locCity}, {locProvince}
                      </CardTitle>
                      <CardDescription>Location breakdown</CardDescription>
                    </div>
                  </div>
                  <Button
                    className=""
                    variant="outline"
                    size="sm"
                    onClick={handleClearLocationSelection}
                  >
                    Clear
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Top Products */}
                {locationProducts.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wide">
                      Top Products
                    </p>
                    <div className="rounded-md border">
                      <Table className="table-fixed w-full dark:border-y-zinc-700 dark:bg-white/3">
                        <TableHeader>
                          <TableRow>
                            <TableHead>Rank</TableHead>
                            <TableHead>Product</TableHead>
                            <TableHead className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 gap-1 text-xs font-medium"
                                onClick={() => {
                                  if (detailProductSortBy === "returnValue") {
                                    setDetailProductSortOrder((o) =>
                                      o === "asc" ? "desc" : "asc",
                                    );
                                  } else {
                                    setDetailProductSortBy("returnValue");
                                    setDetailProductSortOrder("desc");
                                  }
                                }}
                              >
                                Return Value
                              </Button>
                            </TableHead>
                            <TableHead className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8  text-xs font-medium"
                                onClick={() => {
                                  if (detailProductSortBy === "returnCount") {
                                    setDetailProductSortOrder((o) =>
                                      o === "asc" ? "desc" : "asc",
                                    );
                                  } else {
                                    setDetailProductSortBy("returnCount");
                                    setDetailProductSortOrder("desc");
                                  }
                                }}
                              >
                                Count Share (%)
                              </Button>
                            </TableHead>
                            <TableHead className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8  text-xs font-medium"
                                onClick={() => {
                                  if (detailProductSortBy === "returnValue") {
                                    setDetailProductSortOrder((o) =>
                                      o === "asc" ? "desc" : "asc",
                                    );
                                  } else {
                                    setDetailProductSortBy("returnValue");
                                    setDetailProductSortOrder("desc");
                                  }
                                }}
                              >
                                Value Share (%)
                              </Button>
                            </TableHead>
                            <TableHead className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 gap-1 text-xs font-medium"
                                onClick={() => {
                                  if (detailProductSortBy === "returnCount") {
                                    setDetailProductSortOrder((o) =>
                                      o === "asc" ? "desc" : "asc",
                                    );
                                  } else {
                                    setDetailProductSortBy("returnCount");
                                    setDetailProductSortOrder("desc");
                                  }
                                }}
                              >
                                Count
                              </Button>
                            </TableHead>
                            <TableHead className="text-right">Avg</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paginatedLocProducts.map((p, i) => {
                            const rank =
                              (locProductPage - 1) * locItemsPerPage + i + 1;
                            return (
                              <TableRow key={p.name}>
                                <TableCell>
                                  <div
                                    className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white"
                                    style={{
                                      backgroundColor:
                                        activeChartColors[
                                          (rank - 1) % activeChartColors.length
                                        ],
                                    }}
                                  >
                                    {rank}
                                  </div>
                                </TableCell>
                                <TableCell>{p.name}</TableCell>
                                <TableCell className="text-right">
                                  {formatCurrency(p.returnValue)}
                                </TableCell>
                                <TableCell className="text-right text-muted-foreground">
                                  {formatShare(
                                    p.returnCount,
                                    locationProductsTotalCount,
                                  )}
                                </TableCell>
                                <TableCell className="text-right text-muted-foreground">
                                  {formatShare(
                                    p.returnValue,
                                    locationProductsTotalValue,
                                  )}
                                </TableCell>
                                <TableCell className="text-right">
                                  {p.returnCount}
                                </TableCell>
                                <TableCell className="text-right text-muted-foreground">
                                  {formatCurrency(p.avg)}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                    {locProdTotalPgs > 1 &&
                      renderPagination(
                        locProductPage,
                        locProdTotalPgs,
                        locationProducts.length,
                        "products",
                        () => setLocProductPage((p) => Math.max(1, p - 1)),
                        () =>
                          setLocProductPage((p) =>
                            Math.min(locProdTotalPgs, p + 1),
                          ),
                        setLocProductPage,
                        locItemsPerPage,
                        (n) => {
                          setLocItemsPerPage(n);
                          setLocProductPage(1);
                        },
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
                      <Table className="table-fixed w-full dark:border-y-zinc-700 dark:bg-white/3">
                        <TableHeader>
                          <TableRow>
                            <TableHead>Salesman</TableHead>
                            <TableHead className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 gap-1 text-xs font-medium"
                                onClick={() => {
                                  if (detailSalesmanSortBy === "returnValue") {
                                    setDetailSalesmanSortOrder((o) =>
                                      o === "asc" ? "desc" : "asc",
                                    );
                                  } else {
                                    setDetailSalesmanSortBy("returnValue");
                                    setDetailSalesmanSortOrder("desc");
                                  }
                                }}
                              >
                                Return Value
                              </Button>
                            </TableHead>
                            <TableHead className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8  text-xs font-medium"
                                onClick={() => {
                                  if (detailSalesmanSortBy === "returnCount") {
                                    setDetailSalesmanSortOrder((o) =>
                                      o === "asc" ? "desc" : "asc",
                                    );
                                  } else {
                                    setDetailSalesmanSortBy("returnCount");
                                    setDetailSalesmanSortOrder("desc");
                                  }
                                }}
                              >
                                Count Share (%)
                              </Button>
                            </TableHead>
                            <TableHead className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8  text-xs font-medium"
                                onClick={() => {
                                  if (detailSalesmanSortBy === "returnValue") {
                                    setDetailSalesmanSortOrder((o) =>
                                      o === "asc" ? "desc" : "asc",
                                    );
                                  } else {
                                    setDetailSalesmanSortBy("returnValue");
                                    setDetailSalesmanSortOrder("desc");
                                  }
                                }}
                              >
                                Value Share (%)
                              </Button>
                            </TableHead>
                            <TableHead className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 gap-1 text-xs font-medium"
                                onClick={() => {
                                  if (detailSalesmanSortBy === "returnCount") {
                                    setDetailSalesmanSortOrder((o) =>
                                      o === "asc" ? "desc" : "asc",
                                    );
                                  } else {
                                    setDetailSalesmanSortBy("returnCount");
                                    setDetailSalesmanSortOrder("desc");
                                  }
                                }}
                              >
                                Count
                              </Button>
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paginatedLocSalesmen.map((s) => (
                            <TableRow key={s.name}>
                              <TableCell>{s.name}</TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(s.returnValue)}
                              </TableCell>
                              <TableCell className="text-right text-muted-foreground">
                                {formatShare(
                                  s.returnCount,
                                  locationSalesmenTotalCount,
                                )}
                              </TableCell>
                              <TableCell className="text-right text-muted-foreground">
                                {formatShare(
                                  s.returnValue,
                                  locationSalesmenTotalValue,
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                {s.returnCount}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    {locSalesmanTotalPgs > 1 &&
                      renderPagination(
                        locSalesmanPage,
                        locSalesmanTotalPgs,
                        locationSalesmen.length,
                        "salesmen",
                        () => setLocSalesmanPage((p) => Math.max(1, p - 1)),
                        () =>
                          setLocSalesmanPage((p) =>
                            Math.min(locSalesmanTotalPgs, p + 1),
                          ),
                        setLocSalesmanPage,
                        locItemsPerPage,
                        (n) => {
                          setLocItemsPerPage(n);
                          setLocSalesmanPage(1);
                        },
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
                      <Table className="table-fixed w-full dark:border-y-zinc-700 dark:bg-white/3">
                        <TableHeader>
                          <TableRow>
                            <TableHead>Customer</TableHead>
                            <TableHead className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 gap-1 text-xs font-medium"
                                onClick={() => {
                                  if (detailCustomerSortBy === "returnValue") {
                                    setDetailCustomerSortOrder((o) =>
                                      o === "asc" ? "desc" : "asc",
                                    );
                                  } else {
                                    setDetailCustomerSortBy("returnValue");
                                    setDetailCustomerSortOrder("desc");
                                  }
                                }}
                              >
                                Return Value
                              </Button>
                            </TableHead>
                            <TableHead className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8  text-xs font-medium"
                                onClick={() => {
                                  if (detailCustomerSortBy === "returnCount") {
                                    setDetailCustomerSortOrder((o) =>
                                      o === "asc" ? "desc" : "asc",
                                    );
                                  } else {
                                    setDetailCustomerSortBy("returnCount");
                                    setDetailCustomerSortOrder("desc");
                                  }
                                }}
                              >
                                Count Share (%)
                              </Button>
                            </TableHead>
                            <TableHead className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8  text-xs font-medium"
                                onClick={() => {
                                  if (detailCustomerSortBy === "returnValue") {
                                    setDetailCustomerSortOrder((o) =>
                                      o === "asc" ? "desc" : "asc",
                                    );
                                  } else {
                                    setDetailCustomerSortBy("returnValue");
                                    setDetailCustomerSortOrder("desc");
                                  }
                                }}
                              >
                                Value Share (%)
                              </Button>
                            </TableHead>
                            <TableHead className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 gap-1 text-xs font-medium"
                                onClick={() => {
                                  if (detailCustomerSortBy === "returnCount") {
                                    setDetailCustomerSortOrder((o) =>
                                      o === "asc" ? "desc" : "asc",
                                    );
                                  } else {
                                    setDetailCustomerSortBy("returnCount");
                                    setDetailCustomerSortOrder("desc");
                                  }
                                }}
                              >
                                Count
                              </Button>
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paginatedLocCustomers.map((c) => (
                            <TableRow key={c.name}>
                              <TableCell>{c.name}</TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(c.returnValue)}
                              </TableCell>
                              <TableCell className="text-right text-muted-foreground">
                                {formatShare(
                                  c.returnCount,
                                  locationCustomersTotalCount,
                                )}
                              </TableCell>
                              <TableCell className="text-right text-muted-foreground">
                                {formatShare(
                                  c.returnValue,
                                  locationCustomersTotalValue,
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                {c.returnCount}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    {locCustomerTotalPgs > 1 &&
                      renderPagination(
                        locCustomerPage,
                        locCustomerTotalPgs,
                        locationCustomers.length,
                        "customers",
                        () => setLocCustomerPage((p) => Math.max(1, p - 1)),
                        () =>
                          setLocCustomerPage((p) =>
                            Math.min(locCustomerTotalPgs, p + 1),
                          ),
                        setLocCustomerPage,
                        locItemsPerPage,
                        (n) => {
                          setLocItemsPerPage(n);
                          setLocCustomerPage(1);
                        },
                      )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })()}

      {/* Hierarchical Table */}
      <Card className="dark:border-y-zinc-700 ">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle>All Locations Return Performance</CardTitle>
              <CardDescription>
                {provinceData.length} provinces · expand to see cities and
                products
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              {(expandedProvinces.size > 0 || expandedCities.size > 0) && (
                <Button
                  className=""
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
              {(
                ["location", "returnValue", "returnCount", "avg"] as SortField[]
              ).map((field) => {
                const labels: Record<SortField, string> = {
                  location: "Province",
                  returnValue: "Return Value",
                  returnCount: "Count",
                  avg: "Avg",
                };
                return (
                  <Button
                    className=""
                    key={field}
                    variant={sortField === field ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleSort(field)}
                  >
                    {labels[field]}
                  </Button>
                );
              })}
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-6">
          <div className="overflow-x-auto rounded-md border">
            <Table className="table-fixed w-full dark:border-y-zinc-700 dark:bg-white/3">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8" />
                  <TableHead>Province</TableHead>
                  <TableHead className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 gap-1 text-xs font-medium"
                      onClick={() => handleSort("returnCount")}
                    >
                      Count
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 gap-1 text-xs font-medium"
                      onClick={() => handleSort("returnValue")}
                    >
                      Return Value
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8  text-xs font-medium"
                      onClick={() => handleSort("returnCount")}
                    >
                      Count Share (%)
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8  text-xs font-medium"
                      onClick={() => handleSort("returnValue")}
                    >
                      Value Share (%)
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">Avg</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedProvinces.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="py-8 text-center text-muted-foreground"
                    >
                      No data
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedProvinces.map((province) => {
                    const cities = getCitiesForProvince(province.name);
                    return (
                      <React.Fragment key={province.name}>
                        {/* Province row */}
                        <TableRow
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => toggleProvince(province.name)}
                        >
                          <TableCell>
                            {expandedProvinces.has(province.name) ? (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            )}
                          </TableCell>
                          <TableCell className="font-semibold">
                            {province.name}
                          </TableCell>
                          <TableCell className="text-right">
                            {province.returnCount}
                          </TableCell>
                          <TableCell className="text-right ">
                            {formatCurrency(province.returnValue)}
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            {formatShare(
                              province.returnCount,
                              provinceTotalCount,
                            )}
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            {formatShare(
                              province.returnValue,
                              provinceTotalValue,
                            )}
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            {formatCurrency(province.avg)}
                          </TableCell>
                        </TableRow>

                        {/* City rows */}
                        {expandedProvinces.has(province.name) &&
                          cities.map((city) => {
                            const products = getProductsForLocation(
                              city.name,
                              province.name,
                            );
                            const customers = getCustomersForLocation(
                              city.name,
                              province.name,
                            );
                            const cityKey = `${province.name}::${city.name}`;
                            const prodPage = cityProductPage.get(cityKey) || 1;
                            const prodTotalPages = Math.ceil(
                              products.length / subTableItemsPerPage,
                            );
                            const sortedProds = [...products].sort((a, b) => {
                              let cmp = 0;
                              if (cityProductSortBy === "returnValue")
                                cmp = a.returnValue - b.returnValue;
                              else if (cityProductSortBy === "returnCount")
                                cmp = a.returnCount - b.returnCount;
                              else cmp = a.avg - b.avg;
                              return cityProductSortOrder === "asc"
                                ? cmp
                                : -cmp;
                            });
                            const paginatedProds = sortedProds.slice(
                              (prodPage - 1) * subTableItemsPerPage,
                              prodPage * subTableItemsPerPage,
                            );
                            const custPage = cityCustomerPage.get(cityKey) || 1;
                            const custTotalPages = Math.ceil(
                              customers.length / subTableItemsPerPage,
                            );
                            const sortedCusts = [...customers].sort((a, b) => {
                              const cmp =
                                cityCustomerSortBy === "returnValue"
                                  ? a.returnValue - b.returnValue
                                  : a.returnCount - b.returnCount;
                              return cityCustomerSortOrder === "asc"
                                ? cmp
                                : -cmp;
                            });
                            const paginatedCusts = sortedCusts.slice(
                              (custPage - 1) * subTableItemsPerPage,
                              custPage * subTableItemsPerPage,
                            );

                            return (
                              <React.Fragment key={city.name}>
                                {/* City row */}
                                <TableRow
                                  id={`location-row-${(city.name + ", " + province.name).replace(/[^a-zA-Z0-9]/g, "-")}`}
                                  className="cursor-pointer bg-muted/30 hover:bg-muted/60"
                                  onClick={() =>
                                    setExpandedCities((prev) => {
                                      const next = new Set(prev);
                                      if (next.has(cityKey))
                                        next.delete(cityKey);
                                      else next.add(cityKey);
                                      return next;
                                    })
                                  }
                                >
                                  <TableCell />
                                  <TableCell className="pl-8">
                                    <span className="flex items-center gap-1">
                                      {expandedCities.has(cityKey) ? (
                                        <ChevronDown className="h-3 w-3 text-muted-foreground" />
                                      ) : (
                                        <ChevronRight className="h-3 w-3 text-muted-foreground" />
                                      )}
                                      {city.name}
                                    </span>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    {city.returnCount}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    {formatCurrency(city.returnValue)}
                                  </TableCell>
                                  <TableCell className="text-right text-muted-foreground">
                                    {formatShare(
                                      city.returnCount,
                                      provinceTotalCount,
                                    )}
                                  </TableCell>
                                  <TableCell className="text-right text-muted-foreground">
                                    {formatShare(
                                      city.returnValue,
                                      provinceTotalValue,
                                    )}
                                  </TableCell>
                                  <TableCell className="text-right text-muted-foreground">
                                    {formatCurrency(city.avg)}
                                  </TableCell>
                                </TableRow>

                                {/* City drilldown */}
                                {expandedCities.has(cityKey) && (
                                  <TableRow>
                                    <TableCell
                                      colSpan={7}
                                      className="bg-background p-0 pl-15"
                                    >
                                      <div className="mx-4 my-2 space-y-4 overflow-x-auto">
                                        {/* Products */}
                                        <div>
                                          <h5 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                            Products in {city.name}
                                          </h5>
                                          <div className="rounded border">
                                            <Table>
                                              <TableHeader>
                                                <TableRow>
                                                  <TableHead>Product</TableHead>
                                                  <TableHead className="text-right w-60">
                                                    <Button
                                                      variant="ghost"
                                                      size="sm"
                                                      className="h-8 gap-1 text-xs font-medium"
                                                      onClick={() => {
                                                        if (
                                                          cityProductSortBy ===
                                                          "returnCount"
                                                        ) {
                                                          setCityProductSortOrder(
                                                            (o) =>
                                                              o === "asc"
                                                                ? "desc"
                                                                : "asc",
                                                          );
                                                        } else {
                                                          setCityProductSortBy(
                                                            "returnCount",
                                                          );
                                                          setCityProductSortOrder(
                                                            "desc",
                                                          );
                                                        }
                                                      }}
                                                    >
                                                      Count
                                                    </Button>
                                                  </TableHead>
                                                  <TableHead className="text-right w-60">
                                                    <Button
                                                      variant="ghost"
                                                      size="sm"
                                                      className="h-8 gap-1 text-xs font-medium "
                                                      onClick={() => {
                                                        if (
                                                          cityProductSortBy ===
                                                          "returnValue"
                                                        ) {
                                                          setCityProductSortOrder(
                                                            (o) =>
                                                              o === "asc"
                                                                ? "desc"
                                                                : "asc",
                                                          );
                                                        } else {
                                                          setCityProductSortBy(
                                                            "returnValue",
                                                          );
                                                          setCityProductSortOrder(
                                                            "desc",
                                                          );
                                                        }
                                                      }}
                                                    >
                                                      Return Value
                                                    </Button>
                                                  </TableHead>
                                                  <TableHead className="text-right w-60">
                                                    <Button
                                                      variant="ghost"
                                                      size="sm"
                                                      className="h-8 gap-1 text-xs font-medium"
                                                      onClick={() => {
                                                        if (
                                                          cityProductSortBy ===
                                                          "returnCount"
                                                        ) {
                                                          setCityProductSortOrder(
                                                            (o) =>
                                                              o === "asc"
                                                                ? "desc"
                                                                : "asc",
                                                          );
                                                        } else {
                                                          setCityProductSortBy(
                                                            "returnCount",
                                                          );
                                                          setCityProductSortOrder(
                                                            "desc",
                                                          );
                                                        }
                                                      }}
                                                    >
                                                      Count Share (%){" "}
                                                    </Button>
                                                  </TableHead>
                                                  <TableHead className="text-right w-60">
                                                    <Button
                                                      variant="ghost"
                                                      size="sm"
                                                      className="h-8 gap-1 text-xs font-medium"
                                                      onClick={() => {
                                                        if (
                                                          cityProductSortBy ===
                                                          "returnValue"
                                                        ) {
                                                          setCityProductSortOrder(
                                                            (o) =>
                                                              o === "asc"
                                                                ? "desc"
                                                                : "asc",
                                                          );
                                                        } else {
                                                          setCityProductSortBy(
                                                            "returnValue",
                                                          );
                                                          setCityProductSortOrder(
                                                            "desc",
                                                          );
                                                        }
                                                      }}
                                                    >
                                                      Value Share (%){" "}
                                                    </Button>
                                                  </TableHead>
                                                  <TableHead className="text-right w-60">
                                                    <Button
                                                      variant="ghost"
                                                      size="sm"
                                                      className="h-8 gap-1 text-xs font-medium"
                                                      onClick={() => {
                                                        if (
                                                          cityProductSortBy ===
                                                          "avg"
                                                        ) {
                                                          setCityProductSortOrder(
                                                            (o) =>
                                                              o === "asc"
                                                                ? "desc"
                                                                : "asc",
                                                          );
                                                        } else {
                                                          setCityProductSortBy(
                                                            "avg",
                                                          );
                                                          setCityProductSortOrder(
                                                            "desc",
                                                          );
                                                        }
                                                      }}
                                                    >
                                                      Avg{" "}
                                                    </Button>
                                                  </TableHead>
                                                </TableRow>
                                              </TableHeader>
                                              <TableBody>
                                                {paginatedProds.map((p) => (
                                                  <TableRow key={p.name}>
                                                    <TableCell className="text-sm">
                                                      {p.name}
                                                    </TableCell>
                                                    <TableCell className="text-right text-sm">
                                                      {p.returnCount}
                                                    </TableCell>
                                                    <TableCell className="text-right text-sm ">
                                                      {formatCurrency(
                                                        p.returnValue,
                                                      )}
                                                    </TableCell>
                                                    <TableCell className="text-right text-sm text-muted-foreground">
                                                      {formatShare(
                                                        p.returnCount,
                                                        products.reduce(
                                                          (sum, product) =>
                                                            sum +
                                                            product.returnCount,
                                                          0,
                                                        ),
                                                      )}
                                                    </TableCell>
                                                    <TableCell className="text-right text-sm text-muted-foreground">
                                                      {formatShare(
                                                        p.returnValue,
                                                        products.reduce(
                                                          (sum, product) =>
                                                            sum +
                                                            product.returnValue,
                                                          0,
                                                        ),
                                                      )}
                                                    </TableCell>
                                                    <TableCell className="text-right text-sm text-muted-foreground">
                                                      {formatCurrency(p.avg)}
                                                    </TableCell>
                                                  </TableRow>
                                                ))}
                                              </TableBody>
                                            </Table>
                                          </div>
                                          {prodTotalPages > 1 && (
                                            <div className="flex items-center justify-between px-2 py-4">
                                              <div className="text-sm text-muted-foreground">
                                                Showing{" "}
                                                {(prodPage - 1) *
                                                  subTableItemsPerPage +
                                                  1}{" "}
                                                to{" "}
                                                {Math.min(
                                                  prodPage *
                                                    subTableItemsPerPage,
                                                  products.length,
                                                )}{" "}
                                                of {products.length} products
                                              </div>
                                              <div className="flex gap-1">
                                                <Button
                                                  className=""
                                                  variant="outline"
                                                  size="sm"
                                                  onClick={() =>
                                                    setCityProductPageFor(
                                                      cityKey,
                                                      Math.max(1, prodPage - 1),
                                                    )
                                                  }
                                                  disabled={prodPage === 1}
                                                >
                                                  Previous
                                                </Button>
                                                {Array.from(
                                                  {
                                                    length: Math.min(
                                                      5,
                                                      prodTotalPages,
                                                    ),
                                                  },
                                                  (_, i) => {
                                                    let pn: number;
                                                    if (prodTotalPages <= 5)
                                                      pn = i + 1;
                                                    else if (prodPage <= 3)
                                                      pn = i + 1;
                                                    else if (
                                                      prodPage >=
                                                      prodTotalPages - 2
                                                    )
                                                      pn =
                                                        prodTotalPages - 4 + i;
                                                    else pn = prodPage - 2 + i;
                                                    return (
                                                      <Button
                                                        key={pn}
                                                        className=""
                                                        variant={
                                                          prodPage === pn
                                                            ? "default"
                                                            : "outline"
                                                        }
                                                        size="sm"
                                                        onClick={() =>
                                                          setCityProductPageFor(
                                                            cityKey,
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
                                                  className=""
                                                  variant="outline"
                                                  size="sm"
                                                  onClick={() =>
                                                    setCityProductPageFor(
                                                      cityKey,
                                                      Math.min(
                                                        prodTotalPages,
                                                        prodPage + 1,
                                                      ),
                                                    )
                                                  }
                                                  disabled={
                                                    prodPage === prodTotalPages
                                                  }
                                                >
                                                  Next
                                                </Button>
                                              </div>
                                            </div>
                                          )}
                                        </div>

                                        {/* Customers */}
                                        {customers.length > 0 && (
                                          <div>
                                            <h5 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                              Customers in {city.name}
                                            </h5>
                                            <div className="rounded border">
                                              <Table>
                                                <TableHeader>
                                                  <TableRow>
                                                    <TableHead>
                                                      Customer
                                                    </TableHead>
                                                    <TableHead className="text-right">
                                                      <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 gap-1 text-xs font-medium"
                                                        onClick={() => {
                                                          if (
                                                            cityCustomerSortBy ===
                                                            "returnCount"
                                                          ) {
                                                            setCityCustomerSortOrder(
                                                              (o) =>
                                                                o === "asc"
                                                                  ? "desc"
                                                                  : "asc",
                                                            );
                                                          } else {
                                                            setCityCustomerSortBy(
                                                              "returnCount",
                                                            );
                                                            setCityCustomerSortOrder(
                                                              "desc",
                                                            );
                                                          }
                                                        }}
                                                      >
                                                        Count
                                                      </Button>
                                                    </TableHead>
                                                    <TableHead className="text-right w-60">
                                                      <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 gap-1 text-xs font-medium"
                                                        onClick={() => {
                                                          if (
                                                            cityCustomerSortBy ===
                                                            "returnValue"
                                                          ) {
                                                            setCityCustomerSortOrder(
                                                              (o) =>
                                                                o === "asc"
                                                                  ? "desc"
                                                                  : "asc",
                                                            );
                                                          } else {
                                                            setCityCustomerSortBy(
                                                              "returnValue",
                                                            );
                                                            setCityCustomerSortOrder(
                                                              "desc",
                                                            );
                                                          }
                                                        }}
                                                      >
                                                        Return Value
                                                      </Button>
                                                    </TableHead>
                                                    <TableHead className="text-right w-60">
                                                      <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 gap-1 text-xs font-medium"
                                                        onClick={() => {
                                                          if (
                                                            cityCustomerSortBy ===
                                                            "returnCount"
                                                          ) {
                                                            setCityCustomerSortOrder(
                                                              (o) =>
                                                                o === "asc"
                                                                  ? "desc"
                                                                  : "asc",
                                                            );
                                                          } else {
                                                            setCityCustomerSortBy(
                                                              "returnCount",
                                                            );
                                                            setCityCustomerSortOrder(
                                                              "desc",
                                                            );
                                                          }
                                                        }}
                                                      >
                                                        Count Share (%){" "}
                                                      </Button>
                                                    </TableHead>
                                                    <TableHead className="text-right w-60">
                                                      <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 gap-1 text-xs font-medium"
                                                        onClick={() => {
                                                          if (
                                                            cityCustomerSortBy ===
                                                            "returnValue"
                                                          ) {
                                                            setCityCustomerSortOrder(
                                                              (o) =>
                                                                o === "asc"
                                                                  ? "desc"
                                                                  : "asc",
                                                            );
                                                          } else {
                                                            setCityCustomerSortBy(
                                                              "returnValue",
                                                            );
                                                            setCityCustomerSortOrder(
                                                              "desc",
                                                            );
                                                          }
                                                        }}
                                                      >
                                                        Value Share (%){" "}
                                                      </Button>
                                                    </TableHead>
                                                  </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                  {paginatedCusts.map((c) => (
                                                    <TableRow key={c.name}>
                                                      <TableCell className="text-sm">
                                                        {c.name}
                                                      </TableCell>
                                                      <TableCell className="text-right text-sm">
                                                        {c.returnCount}
                                                      </TableCell>
                                                      <TableCell className="text-right text-sm ">
                                                        {formatCurrency(
                                                          c.returnValue,
                                                        )}
                                                      </TableCell>
                                                      <TableCell className="text-right text-sm text-muted-foreground">
                                                        {formatShare(
                                                          c.returnCount,
                                                          customers.reduce(
                                                            (sum, customer) =>
                                                              sum +
                                                              customer.returnCount,
                                                            0,
                                                          ),
                                                        )}
                                                      </TableCell>
                                                      <TableCell className="text-right text-sm text-muted-foreground">
                                                        {formatShare(
                                                          c.returnValue,
                                                          customers.reduce(
                                                            (sum, customer) =>
                                                              sum +
                                                              customer.returnValue,
                                                            0,
                                                          ),
                                                        )}
                                                      </TableCell>
                                                    </TableRow>
                                                  ))}
                                                </TableBody>
                                              </Table>
                                            </div>
                                            {custTotalPages > 1 && (
                                              <div className="flex items-center justify-between px-2 py-4">
                                                <div className="text-sm text-muted-foreground">
                                                  Showing{" "}
                                                  {(custPage - 1) *
                                                    subTableItemsPerPage +
                                                    1}{" "}
                                                  to{" "}
                                                  {Math.min(
                                                    custPage *
                                                      subTableItemsPerPage,
                                                    customers.length,
                                                  )}{" "}
                                                  of {customers.length}{" "}
                                                  customers
                                                </div>
                                                <div className="flex gap-1">
                                                  <Button
                                                    className=""
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                      setCityCustomerPageFor(
                                                        cityKey,
                                                        Math.max(
                                                          1,
                                                          custPage - 1,
                                                        ),
                                                      )
                                                    }
                                                    disabled={custPage === 1}
                                                  >
                                                    Previous
                                                  </Button>
                                                  {Array.from(
                                                    {
                                                      length: Math.min(
                                                        5,
                                                        custTotalPages,
                                                      ),
                                                    },
                                                    (_, i) => {
                                                      let pn: number;
                                                      if (custTotalPages <= 5)
                                                        pn = i + 1;
                                                      else if (custPage <= 3)
                                                        pn = i + 1;
                                                      else if (
                                                        custPage >=
                                                        custTotalPages - 2
                                                      )
                                                        pn =
                                                          custTotalPages -
                                                          4 +
                                                          i;
                                                      else
                                                        pn = custPage - 2 + i;
                                                      return (
                                                        <Button
                                                          key={pn}
                                                          className=""
                                                          variant={
                                                            custPage === pn
                                                              ? "default"
                                                              : "outline"
                                                          }
                                                          size="sm"
                                                          onClick={() =>
                                                            setCityCustomerPageFor(
                                                              cityKey,
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
                                                    className=""
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                      setCityCustomerPageFor(
                                                        cityKey,
                                                        Math.min(
                                                          custTotalPages,
                                                          custPage + 1,
                                                        ),
                                                      )
                                                    }
                                                    disabled={
                                                      custPage ===
                                                      custTotalPages
                                                    }
                                                  >
                                                    Next
                                                  </Button>
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                )}
                              </React.Fragment>
                            );
                          })}
                      </React.Fragment>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Main Pagination */}
          <div className="flex items-center justify-between px-4 py-4">
            <div className="flex items-center gap-4">
              <select
                className="h-8 rounded-md border border-input bg-background px-3 py-1 text-sm "
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <div className="text-sm text-muted-foreground">
                Showing{" "}
                {Math.min(
                  (currentPage - 1) * itemsPerPage + 1,
                  sortedProvinces.length,
                )}{" "}
                to{" "}
                {Math.min(currentPage * itemsPerPage, sortedProvinces.length)}{" "}
                of {sortedProvinces.length} provinces
              </div>
            </div>
            <div className="flex gap-1">
              <Button
                className=""
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
                    className=""
                    variant={currentPage === pn ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPageTo(pn)}
                  >
                    {pn}
                  </Button>
                );
              })}
              <Button
                className=""
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
