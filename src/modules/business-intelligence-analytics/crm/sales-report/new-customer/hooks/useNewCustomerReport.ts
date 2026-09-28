"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
    format,
    startOfMonth,
    endOfMonth,
    subDays,
    startOfQuarter,
    endOfQuarter,
    startOfYear,
    endOfYear,
    parseISO,
    isWithinInterval,
    differenceInDays,
} from "date-fns";
import { fetchNewCustomerData } from "../providers/fetchProvider";
import {
    CustomerRawRecord,
    StoreTypeRecord,
    UserRecord,
    NewCustomerItem,
    NewCustomerFilters,
    NewCustomerKpis,
    DatePreset,
    ProvinceSummary,
    RegistrationTrendItem,
    SalesmanOnboardingItem,
} from "../types";

export function useNewCustomerReport() {
    const today = new Date();
    const defaultStart = format(startOfMonth(today), "yyyy-MM-dd");
    const defaultEnd = format(endOfMonth(today), "yyyy-MM-dd");

    const [filters, setFilters] = useState<NewCustomerFilters>({
        preset: "this-month",
        startDate: defaultStart,
        endDate: defaultEnd,
        search: "",
        province: "ALL",
        city: "ALL",
        storeType: "ALL",
        status: "ALL",
        type: "ALL",
    });

    const [viewMode, setViewMode] = useState<"table" | "grid">("table");
    const [activeTab, setActiveTab] = useState("registry");

    const [rawCustomers, setRawCustomers] = useState<CustomerRawRecord[]>([]);
    const [storeTypes, setStoreTypes] = useState<StoreTypeRecord[]>([]);
    const [users, setUsers] = useState<UserRecord[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Selected customer for modal
    const [selectedCustomer, setSelectedCustomer] = useState<NewCustomerItem | null>(null);

    // Sorting & Pagination
    const [sortField, setSortField] = useState<keyof NewCustomerItem>("rawDate");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const setDatePreset = useCallback((preset: DatePreset) => {
        const now = new Date();
        let s = "";
        let e = "";

        if (preset === "this-month") {
            s = format(startOfMonth(now), "yyyy-MM-dd");
            e = format(endOfMonth(now), "yyyy-MM-dd");
        } else if (preset === "last-30-days") {
            s = format(subDays(now, 30), "yyyy-MM-dd");
            e = format(now, "yyyy-MM-dd");
        } else if (preset === "this-quarter") {
            s = format(startOfQuarter(now), "yyyy-MM-dd");
            e = format(endOfQuarter(now), "yyyy-MM-dd");
        } else if (preset === "this-year") {
            s = format(startOfYear(now), "yyyy-MM-dd");
            e = format(endOfYear(now), "yyyy-MM-dd");
        } else if (preset === "all-time") {
            s = "";
            e = "";
        }

        setFilters((prev) => ({
            ...prev,
            preset,
            startDate: s,
            endDate: e,
        }));
        setCurrentPage(1);
    }, []);

    const loadData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await fetchNewCustomerData(filters.startDate, filters.endDate);
            setRawCustomers(data.customers);
            setStoreTypes(data.storeTypes);
            setUsers(data.users);
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Failed to load customers";
            setError(msg);
            setRawCustomers([]);
        } finally {
            setLoading(false);
        }
    }, [filters.startDate, filters.endDate]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Lookup maps
    const storeTypeMap = useMemo(() => {
        const map = new Map<number | string, string>();
        storeTypes.forEach((st) => {
            map.set(st.id, st.store_type);
            map.set(String(st.id), st.store_type);
        });
        return map;
    }, [storeTypes]);

    const userMap = useMemo(() => {
        const map = new Map<number, string>();
        users.forEach((u) => {
            const uid = u.user_id || u.id;
            if (uid) {
                const name = [u.first_name, u.last_name].filter(Boolean).join(" ") || u.email || `User #${uid}`;
                map.set(uid, name);
            }
        });
        return map;
    }, [users]);

    // Normalized Items with Recency Calculation
    const normalizedItems = useMemo<NewCustomerItem[]>(() => {
        const now = new Date();

        return rawCustomers.map((c) => {
            const stId = c.store_type;
            const stName = stId ? storeTypeMap.get(stId) || `Store Type #${stId}` : "General";
            const salesman = c.user_id ? userMap.get(c.user_id) || `User #${c.user_id}` : "Unassigned";

            const locationParts = [c.brgy, c.city, c.province].filter(Boolean);
            const locationStr = locationParts.length > 0 ? locationParts.join(", ") : "Not Specified";

            let formattedDate = "";
            const rawDateStr = c.date_entered || "";
            let recencyLabel = "-";
            let isRecent = false;

            if (c.date_entered) {
                try {
                    const parsed = parseISO(c.date_entered);
                    formattedDate = format(parsed, "yyyy-MM-dd HH:mm");
                    const daysDiff = differenceInDays(now, parsed);

                    if (daysDiff === 0) {
                        recencyLabel = "Today";
                        isRecent = true;
                    } else if (daysDiff === 1) {
                        recencyLabel = "Yesterday";
                        isRecent = true;
                    } else if (daysDiff <= 7) {
                        recencyLabel = `${daysDiff}d ago`;
                        isRecent = true;
                    } else if (daysDiff <= 30) {
                        recencyLabel = `${Math.floor(daysDiff / 7)}w ago`;
                    } else {
                        recencyLabel = format(parsed, "MMM d, yyyy");
                    }
                } catch {
                    formattedDate = c.date_entered.slice(0, 16);
                }
            }

            return {
                id: c.id,
                customerCode: (c.customer_code || "").trim() || "-",
                customerName: (c.customer_name || "").trim() || "Unnamed Customer",
                storeName: (c.store_name || "").trim() || "Unnamed Store",
                storeSignage: (c.store_signage || "").trim() || "-",
                storeType: stName,
                storeTypeId: typeof stId === "number" ? stId : null,
                type: c.type || "Regular",
                location: locationStr,
                brgy: (c.brgy || "").trim(),
                city: (c.city || "").trim(),
                province: (c.province || "").trim(),
                contactNumber: (c.contact_number || "").trim() || "-",
                customerEmail: (c.customer_email || "").trim() || "-",
                dateEntered: formattedDate,
                rawDate: rawDateStr,
                recencyLabel,
                isRecent,
                isActive: Boolean(c.isActive === 1 || c.isActive === true),
                isVAT: Boolean(c.isVAT === 1 || c.isVAT === true),
                isEWT: Boolean(c.isEWT === 1 || c.isEWT === true),
                prospectStatus: c.prospect_status || "N/A",
                priceType: c.price_type || "-",
                salesmanName: salesman,
                customerTin: c.customer_tin || "-",
                latitude: c.latitude,
                longitude: c.longitude,
            };
        });
    }, [rawCustomers, storeTypeMap, userMap]);

    // Unique options for filter dropdowns
    const filterOptions = useMemo(() => {
        const provinces = new Set<string>();
        const cities = new Set<string>();
        const types = new Set<string>();
        const customerTypes = new Set<string>();

        normalizedItems.forEach((item) => {
            if (item.province) provinces.add(item.province);
            if (item.city) cities.add(item.city);
            if (item.storeType) types.add(item.storeType);
            if (item.type) customerTypes.add(item.type);
        });

        return {
            provinces: Array.from(provinces).sort(),
            cities: Array.from(cities).sort(),
            storeTypes: Array.from(types).sort(),
            customerTypes: Array.from(customerTypes).sort(),
        };
    }, [normalizedItems]);

    // Filter Items
    const filteredItems = useMemo(() => {
        return normalizedItems.filter((item) => {
            if (filters.startDate && filters.endDate && item.rawDate) {
                try {
                    const itemDate = parseISO(item.rawDate.slice(0, 10));
                    const start = parseISO(filters.startDate);
                    const end = parseISO(filters.endDate);
                    if (!isWithinInterval(itemDate, { start, end })) return false;
                } catch {
                    // ignore
                }
            }

            if (filters.province !== "ALL" && item.province !== filters.province) {
                return false;
            }

            if (filters.city !== "ALL" && item.city !== filters.city) {
                return false;
            }

            if (filters.storeType !== "ALL" && item.storeType !== filters.storeType) {
                return false;
            }

            if (filters.type !== "ALL" && item.type !== filters.type) {
                return false;
            }

            if (filters.status === "ACTIVE" && !item.isActive) return false;
            if (filters.status === "INACTIVE" && item.isActive) return false;

            if (filters.search.trim()) {
                const q = filters.search.toLowerCase().trim();
                const matched =
                    item.customerName.toLowerCase().includes(q) ||
                    item.storeName.toLowerCase().includes(q) ||
                    item.customerCode.toLowerCase().includes(q) ||
                    item.storeSignage.toLowerCase().includes(q) ||
                    item.location.toLowerCase().includes(q) ||
                    item.contactNumber.toLowerCase().includes(q) ||
                    item.salesmanName.toLowerCase().includes(q);
                if (!matched) return false;
            }

            return true;
        });
    }, [normalizedItems, filters]);

    // KPIs calculation
    const kpis = useMemo<NewCustomerKpis>(() => {
        const total = filteredItems.length;
        const active = filteredItems.filter((i) => i.isActive).length;
        const activePct = total > 0 ? (active / total) * 100 : 0;
        const recent = filteredItems.filter((i) => i.isRecent).length;

        const provMap = new Map<string, number>();
        const citySet = new Set<string>();
        const storeTypeMap = new Map<string, number>();

        filteredItems.forEach((i) => {
            if (i.province) provMap.set(i.province, (provMap.get(i.province) || 0) + 1);
            if (i.city) citySet.add(i.city);
            if (i.storeType) storeTypeMap.set(i.storeType, (storeTypeMap.get(i.storeType) || 0) + 1);
        });

        let topProv = "N/A";
        let maxProvCount = 0;
        provMap.forEach((count, prov) => {
            if (count > maxProvCount) {
                maxProvCount = count;
                topProv = prov;
            }
        });

        let topSt = "N/A";
        let maxStCount = 0;
        storeTypeMap.forEach((count, st) => {
            if (count > maxStCount) {
                maxStCount = count;
                topSt = st;
            }
        });

        return {
            totalNewCustomers: total,
            activeCount: active,
            activePercentage: activePct,
            topProvince: topProv,
            topProvinceCount: maxProvCount,
            topStoreType: topSt,
            topStoreTypeCount: maxStCount,
            totalCities: citySet.size,
            recentCount: recent,
        };
    }, [filteredItems]);

    // Province summaries for Geographic Reach Tab
    const provinceSummaries = useMemo<ProvinceSummary[]>(() => {
        const map = new Map<
            string,
            {
                total: number;
                active: number;
                cities: Set<string>;
                storeTypes: Map<string, number>;
            }
        >();

        filteredItems.forEach((i) => {
            const p = i.province || "Other Provinces";
            if (!map.has(p)) {
                map.set(p, {
                    total: 0,
                    active: 0,
                    cities: new Set(),
                    storeTypes: new Map(),
                });
            }
            const curr = map.get(p)!;
            curr.total += 1;
            if (i.isActive) curr.active += 1;
            if (i.city) curr.cities.add(i.city);
            if (i.storeType) {
                curr.storeTypes.set(i.storeType, (curr.storeTypes.get(i.storeType) || 0) + 1);
            }
        });

        return Array.from(map.entries())
            .map(([province, data]) => {
                let topSt = "General";
                let maxC = 0;
                data.storeTypes.forEach((c, st) => {
                    if (c > maxC) {
                        maxC = c;
                        topSt = st;
                    }
                });

                return {
                    province,
                    totalAccounts: data.total,
                    activeAccounts: data.active,
                    citiesCount: data.cities.size,
                    topStoreType: topSt,
                };
            })
            .sort((a, b) => b.totalAccounts - a.totalAccounts);
    }, [filteredItems]);

    // Registration timeline trends for Analytics Tab
    const registrationTrends = useMemo<RegistrationTrendItem[]>(() => {
        const dateMap = new Map<string, { total: number; active: number }>();

        filteredItems.forEach((item) => {
            const d = item.rawDate ? item.rawDate.slice(0, 10) : "No Date";
            if (!dateMap.has(d)) {
                dateMap.set(d, { total: 0, active: 0 });
            }
            const curr = dateMap.get(d)!;
            curr.total += 1;
            if (item.isActive) curr.active += 1;
        });

        return Array.from(dateMap.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([date, counts]) => ({
                date,
                label: date.length >= 10 ? date.slice(5) : date,
                count: counts.total,
                activeCount: counts.active,
            }));
    }, [filteredItems]);

    // Salesman Onboarding Leaderboard
    const salesmanLeaderboard = useMemo<SalesmanOnboardingItem[]>(() => {
        const map = new Map<string, { total: number; active: number }>();
        filteredItems.forEach((item) => {
            const sm = item.salesmanName || "Unassigned";
            if (!map.has(sm)) {
                map.set(sm, { total: 0, active: 0 });
            }
            const curr = map.get(sm)!;
            curr.total += 1;
            if (item.isActive) curr.active += 1;
        });

        const total = filteredItems.length;
        return Array.from(map.entries())
            .map(([salesmanName, data]) => ({
                salesmanName,
                totalOnboarded: data.total,
                activeCount: data.active,
                percentage: total > 0 ? (data.total / total) * 100 : 0,
            }))
            .sort((a, b) => b.totalOnboarded - a.totalOnboarded)
            .slice(0, 5);
    }, [filteredItems]);

    // Sorted Items
    const sortedItems = useMemo(() => {
        return [...filteredItems].sort((a, b) => {
            const valA = a[sortField];
            const valB = b[sortField];

            if (typeof valA === "number" && typeof valB === "number") {
                return sortOrder === "asc" ? valA - valB : valB - valA;
            }
            return sortOrder === "asc"
                ? String(valA ?? "").localeCompare(String(valB ?? ""))
                : String(valB ?? "").localeCompare(String(valA ?? ""));
        });
    }, [filteredItems, sortField, sortOrder]);

    // Paginated Items
    const paginatedItems = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return sortedItems.slice(start, start + pageSize);
    }, [sortedItems, currentPage, pageSize]);

    const totalPages = Math.max(1, Math.ceil(sortedItems.length / pageSize));

    const handleSort = (field: keyof NewCustomerItem) => {
        if (sortField === field) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
        } else {
            setSortField(field);
            setSortOrder("desc");
        }
        setCurrentPage(1);
    };

    const resetFilters = () => {
        setFilters({
            preset: "this-month",
            startDate: defaultStart,
            endDate: defaultEnd,
            search: "",
            province: "ALL",
            city: "ALL",
            storeType: "ALL",
            status: "ALL",
            type: "ALL",
        });
        setCurrentPage(1);
    };

    return {
        filters,
        setFilters,
        setDatePreset,
        viewMode,
        setViewMode,
        activeTab,
        setActiveTab,
        loading,
        error,
        kpis,
        filterOptions,
        filteredItems: sortedItems,
        paginatedItems,
        totalCount: sortedItems.length,
        provinceSummaries,
        registrationTrends,
        salesmanLeaderboard,
        sortField,
        sortOrder,
        handleSort,
        currentPage,
        setCurrentPage,
        pageSize,
        setPageSize,
        totalPages,
        selectedCustomer,
        setSelectedCustomer,
        loadData,
        resetFilters,
    };
}
