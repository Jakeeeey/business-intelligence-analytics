"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { format, subDays, startOfMonth, endOfMonth, startOfYear } from "date-fns";
import {
    CollectionVsSalesFiltersState,
    CollectionVsSalesLookups,
    CollectionVsSalesResponse,
    CollectionReceiptItem,
    DatePreset,
} from "../types";
import {
    fetchCollectionVsSalesLookups,
    fetchCollectionVsSalesReport,
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

export function useCollectionVsSales() {
    const defaultRange = getPresetDates("this-month");
    const [filters, setFilters] = useState<CollectionVsSalesFiltersState>({
        startDate: defaultRange.startDate,
        endDate: defaultRange.endDate,
        salesmanId: "ALL",
        paymentMethod: "ALL",
        searchQuery: "",
    });
    const [datePreset, setDatePresetState] = useState<DatePreset>("this-month");
    const [activeTab, setActiveTab] = useState<string>("overview");

    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const [lookups, setLookups] = useState<CollectionVsSalesLookups>({
        salesmen: [],
        paymentMethods: [],
    });

    const [reportData, setReportData] = useState<CollectionVsSalesResponse | null>(null);
    const [selectedReceipt, setSelectedReceipt] = useState<CollectionReceiptItem | null>(null);

    // Pagination for Receipts table
    const [receiptsPage, setReceiptsPage] = useState<number>(1);
    const [receiptsPageSize, setReceiptsPageSize] = useState<number>(15);

    // Sorting for Salesman Comparison table
    const [salesmanSortField, setSalesmanSortField] = useState<"sales" | "collections" | "variance" | "efficiency">("collections");
    const [salesmanSortOrder, setSalesmanSortOrder] = useState<"asc" | "desc">("desc");

    // Sorting for Receipts table
    const [receiptsSortField, setReceiptsSortField] = useState<"collectionDate" | "amount" | "salesmanName">("collectionDate");
    const [receiptsSortOrder, setReceiptsSortOrder] = useState<"asc" | "desc">("desc");

    // Load Lookups on mount
    useEffect(() => {
        let mounted = true;
        fetchCollectionVsSalesLookups()
            .then((res) => {
                if (mounted) setLookups(res);
            })
            .catch((err) => {
                console.error("Failed to load collection lookups:", err);
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
            const data = await fetchCollectionVsSalesReport(filters);
            setReportData(data);
            setReceiptsPage(1);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Failed to load collection vs sales report";
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
            salesmanId: "ALL",
            paymentMethod: "ALL",
            searchQuery: "",
        });
    };

    // Filtered & Sorted Salesmen Comparison
    const sortedSalesmen = useMemo(() => {
        if (!reportData?.salesmenComparison) return [];
        return [...reportData.salesmenComparison].sort((a, b) => {
            const valA = a[salesmanSortField];
            const valB = b[salesmanSortField];
            return salesmanSortOrder === "asc" ? valA - valB : valB - valA;
        });
    }, [reportData?.salesmenComparison, salesmanSortField, salesmanSortOrder]);

    const handleSalesmanSort = (field: "sales" | "collections" | "variance" | "efficiency") => {
        if (salesmanSortField === field) {
            setSalesmanSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
        } else {
            setSalesmanSortField(field);
            setSalesmanSortOrder("desc");
        }
    };

    // Filtered & Sorted Receipts
    const filteredReceipts = useMemo(() => {
        if (!reportData?.receipts) return [];
        const q = filters.searchQuery.trim().toLowerCase();
        let items = reportData.receipts;

        if (q) {
            items = items.filter(
                (r) =>
                    r.docNo.toLowerCase().includes(q) ||
                    r.receiptNo.toLowerCase().includes(q) ||
                    r.salesmanName.toLowerCase().includes(q) ||
                    r.collectedBy.toLowerCase().includes(q) ||
                    r.paymentMethod.toLowerCase().includes(q) ||
                    r.remarks.toLowerCase().includes(q)
            );
        }

        return [...items].sort((a, b) => {
            const valA = a[receiptsSortField];
            const valB = b[receiptsSortField];
            if (typeof valA === "number" && typeof valB === "number") {
                return receiptsSortOrder === "asc" ? valA - valB : valB - valA;
            }
            return receiptsSortOrder === "asc"
                ? String(valA).localeCompare(String(valB))
                : String(valB).localeCompare(String(valA));
        });
    }, [reportData?.receipts, filters.searchQuery, receiptsSortField, receiptsSortOrder]);

    // Paginated Receipts
    const paginatedReceipts = useMemo(() => {
        const start = (receiptsPage - 1) * receiptsPageSize;
        return filteredReceipts.slice(start, start + receiptsPageSize);
    }, [filteredReceipts, receiptsPage, receiptsPageSize]);

    const totalReceiptsPages = Math.max(1, Math.ceil(filteredReceipts.length / receiptsPageSize));

    const handleReceiptsSort = (field: "collectionDate" | "amount" | "salesmanName") => {
        if (receiptsSortField === field) {
            setReceiptsSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
        } else {
            setReceiptsSortField(field);
            setReceiptsSortOrder("desc");
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
        selectedReceipt,
        setSelectedReceipt,
        sortedSalesmen,
        salesmanSortField,
        salesmanSortOrder,
        handleSalesmanSort,
        filteredReceipts,
        paginatedReceipts,
        receiptsPage,
        setReceiptsPage,
        receiptsPageSize,
        setReceiptsPageSize,
        totalReceiptsPages,
        receiptsSortField,
        receiptsSortOrder,
        handleReceiptsSort,
        loadData,
        resetFilters,
    };
}
