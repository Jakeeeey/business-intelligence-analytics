"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { format, subDays, startOfMonth, endOfMonth, startOfYear } from "date-fns";
import {
    PurchaseReportFiltersState,
    PurchaseReportLookups,
    PurchaseReportResponse,
    PurchaseOrderItem,
    DatePreset,
} from "../types";
import {
    fetchPurchaseReportLookups,
    fetchPurchaseReport,
} from "../providers/fetchProvider";

function getPresetDates(preset: DatePreset): { startDate: string; endDate: string } {
    const now = new Date();
    switch (preset) {
        case "this-month":
            return {
                startDate: format(startOfMonth(now), "yyyy-MM-dd"),
                endDate: format(endOfMonth(now), "yyyy-MM-dd"),
            };
        case "last-month": {
            const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            return {
                startDate: format(startOfMonth(prev), "yyyy-MM-dd"),
                endDate: format(endOfMonth(prev), "yyyy-MM-dd"),
            };
        }
        case "last-30-days":
            return {
                startDate: format(subDays(now, 30), "yyyy-MM-dd"),
                endDate: format(now, "yyyy-MM-dd"),
            };
        case "ytd":
            return {
                startDate: format(startOfYear(now), "yyyy-MM-dd"),
                endDate: format(now, "yyyy-MM-dd"),
            };
        case "all":
            return { startDate: "", endDate: "" };
    }
}

export function usePurchaseReport() {
    const defaultRange = getPresetDates("this-month");
    const [filters, setFilters] = useState<PurchaseReportFiltersState>({
        startDate: defaultRange.startDate,
        endDate: defaultRange.endDate,
        supplierId: "ALL",
        branchId: "ALL",
        productId: "ALL",
        status: "ALL",
        searchQuery: "",
    });
    const [datePreset, setDatePresetState] = useState<DatePreset>("this-month");
    const [activeTab, setActiveTab] = useState<string>("overview");

    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const [lookups, setLookups] = useState<PurchaseReportLookups>({
        suppliers: [],
        branches: [],
        products: [],
    });

    const [reportData, setReportData] = useState<PurchaseReportResponse | null>(null);
    const [selectedPo, setSelectedPo] = useState<PurchaseOrderItem | null>(null);

    // Pagination for PO table
    const [poPage, setPoPage] = useState<number>(1);
    const [poPageSize, setPoPageSize] = useState<number>(15);

    // Sorting for PO table
    const [poSortField, setPoSortField] = useState<"poDate" | "totalAmount" | "receivedAmount" | "fulfillmentRate">("poDate");
    const [poSortOrder, setPoSortOrder] = useState<"asc" | "desc">("desc");

    // Sorting for Supplier Breakdown table
    const [supplierSortField, setSupplierSortField] = useState<"orderedAmount" | "receivedAmount" | "fulfillmentRate" | "poCount">("orderedAmount");
    const [supplierSortOrder, setSupplierSortOrder] = useState<"asc" | "desc">("desc");

    // Sorting and pagination for Products table
    const [productSortField, setProductSortField] = useState<"totalAmount" | "totalQuantity" | "productName">("totalAmount");
    const [productSortOrder, setProductSortOrder] = useState<"asc" | "desc">("desc");
    const [productPage, setProductPage] = useState<number>(1);
    const [productPageSize, setProductPageSize] = useState<number>(15);

    // Load lookups on mount
    useEffect(() => {
        let mounted = true;
        fetchPurchaseReportLookups()
            .then((res) => {
                if (mounted) setLookups(res);
            })
            .catch((err) => {
                console.error("Failed to load purchase lookups:", err);
            });
        return () => {
            mounted = false;
        };
    }, []);

    // Load Report Data
    const loadData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await fetchPurchaseReport(filters);
            setReportData(data);
            setPoPage(1);
            setProductPage(1);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Failed to load purchase report";
            setError(msg);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const setDatePreset = (preset: DatePreset) => {
        setDatePresetState(preset);
        const { startDate, endDate } = getPresetDates(preset);
        setFilters((prev) => ({ ...prev, startDate, endDate }));
    };

    const resetFilters = () => {
        const { startDate, endDate } = getPresetDates("this-month");
        setDatePresetState("this-month");
        setFilters({
            startDate,
            endDate,
            supplierId: "ALL",
            branchId: "ALL",
            productId: "ALL",
            status: "ALL",
            searchQuery: "",
        });
    };

    // Filtered & Sorted POs
    const filteredOrders = useMemo(() => {
        if (!reportData?.purchaseOrders) return [];
        const q = filters.searchQuery.trim().toLowerCase();
        let items = reportData.purchaseOrders;

        if (q) {
            items = items.filter(
                (po) =>
                    po.purchaseOrderNo.toLowerCase().includes(q) ||
                    po.reference.toLowerCase().includes(q) ||
                    po.supplierName.toLowerCase().includes(q) ||
                    po.branchName.toLowerCase().includes(q) ||
                    po.remark.toLowerCase().includes(q)
            );
        }

        return [...items].sort((a, b) => {
            const valA = a[poSortField];
            const valB = b[poSortField];
            if (typeof valA === "number" && typeof valB === "number") {
                return poSortOrder === "asc" ? valA - valB : valB - valA;
            }
            return poSortOrder === "asc"
                ? String(valA).localeCompare(String(valB))
                : String(valB).localeCompare(String(valA));
        });
    }, [reportData?.purchaseOrders, filters.searchQuery, poSortField, poSortOrder]);

    const paginatedOrders = useMemo(() => {
        const start = (poPage - 1) * poPageSize;
        return filteredOrders.slice(start, start + poPageSize);
    }, [filteredOrders, poPage, poPageSize]);

    const totalPoPages = Math.max(1, Math.ceil(filteredOrders.length / poPageSize));

    const handlePoSort = (field: "poDate" | "totalAmount" | "receivedAmount" | "fulfillmentRate") => {
        if (poSortField === field) {
            setPoSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
        } else {
            setPoSortField(field);
            setPoSortOrder("desc");
        }
    };

    // Sorted Supplier Breakdown
    const sortedSuppliers = useMemo(() => {
        if (!reportData?.supplierBreakdown) return [];
        return [...reportData.supplierBreakdown].sort((a, b) => {
            const valA = a[supplierSortField];
            const valB = b[supplierSortField];
            return supplierSortOrder === "asc" ? valA - valB : valB - valA;
        });
    }, [reportData?.supplierBreakdown, supplierSortField, supplierSortOrder]);

    const handleSupplierSort = (field: "orderedAmount" | "receivedAmount" | "fulfillmentRate" | "poCount") => {
        if (supplierSortField === field) {
            setSupplierSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
        } else {
            setSupplierSortField(field);
            setSupplierSortOrder("desc");
        }
    };

    // Filtered & Sorted Products
    const sortedProducts = useMemo(() => {
        if (!reportData?.productBreakdown) return [];
        const q = filters.searchQuery.trim().toLowerCase();
        let items = reportData.productBreakdown;

        if (q) {
            items = items.filter(
                (p) =>
                    p.productName.toLowerCase().includes(q) ||
                    p.productCode.toLowerCase().includes(q)
            );
        }

        return [...items].sort((a, b) => {
            const valA = a[productSortField];
            const valB = b[productSortField];
            if (typeof valA === "number" && typeof valB === "number") {
                return productSortOrder === "asc" ? valA - valB : valB - valA;
            }
            return productSortOrder === "asc"
                ? String(valA).localeCompare(String(valB))
                : String(valB).localeCompare(String(valA));
        });
    }, [reportData?.productBreakdown, filters.searchQuery, productSortField, productSortOrder]);

    const paginatedProducts = useMemo(() => {
        const start = (productPage - 1) * productPageSize;
        return sortedProducts.slice(start, start + productPageSize);
    }, [sortedProducts, productPage, productPageSize]);

    const totalProductPages = Math.max(1, Math.ceil(sortedProducts.length / productPageSize));

    const handleProductSort = (field: "totalAmount" | "totalQuantity" | "productName") => {
        if (productSortField === field) {
            setProductSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
        } else {
            setProductSortField(field);
            setProductSortOrder("desc");
        }
    };

    return {
        filters,
        setFilters,
        datePreset,
        setDatePreset,
        activeTab,
        setActiveTab,
        loading,
        error,
        lookups,
        reportData,
        selectedPo,
        setSelectedPo,
        filteredOrders,
        paginatedOrders,
        poPage,
        setPoPage,
        poPageSize,
        setPoPageSize,
        totalPoPages,
        poSortField,
        poSortOrder,
        handlePoSort,
        sortedSuppliers,
        supplierSortField,
        supplierSortOrder,
        handleSupplierSort,
        sortedProducts,
        paginatedProducts,
        productPage,
        setProductPage,
        productPageSize,
        setProductPageSize,
        totalProductPages,
        productSortField,
        productSortOrder,
        handleProductSort,
        loadData,
        resetFilters,
    };
}
