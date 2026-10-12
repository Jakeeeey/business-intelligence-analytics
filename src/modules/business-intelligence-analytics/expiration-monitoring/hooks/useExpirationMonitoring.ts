import { useState, useEffect, useMemo } from "react";
import { ExpirationRecord, ExpirationFilters } from "../types";
import { fetchAllExpirationData, fetchFilteredExpirationData } from "../providers/fetchProvider";

// Determine expiration status
export const getExpirationStatus = (expiryDateStr: string | null | undefined) => {
  if (!expiryDateStr) return "SAFE";
  const expiry = new Date(expiryDateStr);
  if (isNaN(expiry.getTime())) return "SAFE";

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (expiry < today) return "EXPIRED";

  const threeMonthsFromNow = new Date(today);
  threeMonthsFromNow.setMonth(today.getMonth() + 3);

  if (expiry <= threeMonthsFromNow) return "CRITICAL";

  const sixMonthsFromNow = new Date(today);
  sixMonthsFromNow.setMonth(today.getMonth() + 6);

  if (expiry <= sixMonthsFromNow) return "WARNING";

  return "SAFE";
};

export function useExpirationMonitoring() {
  const [data, setData] = useState<ExpirationRecord[]>([]);
  const [masterData, setMasterData] = useState<ExpirationRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Master lists for filters
  const [suppliers, setSuppliers] = useState<{ id: number; name: string }[]>([]);
  const [branches, setBranches] = useState<{ id: number; name: string }[]>([]);
  const [lots, setLots] = useState<{ id: number; name: string }[]>([]);
  const [batches, setBatches] = useState<string[]>([]);

  // Filter state
  const [filters, setFilters] = useState<ExpirationFilters>({});
  const [searchQuery, setSearchQuery] = useState("");

  const loadInitialData = async () => {
    setLoading(true);
    const result = await fetchAllExpirationData();
    setMasterData(result);
    setData(result);

    // Extract unique lists
    const uniqueSuppliers = Array.from(
      new Map(
        result
          .filter((r) => r.supplierId && r.supplierName)
          .map((item) => [item.supplierId, { id: item.supplierId, name: item.supplierName }])
      ).values()
    );
    const uniqueBranches = Array.from(
      new Map(
        result
          .filter((r) => r.branchId && r.branchName)
          .map((item) => [item.branchId, { id: item.branchId, name: item.branchName }])
      ).values()
    );
    const uniqueLots = Array.from(
      new Map(
        result
          .filter((r) => r.lotId && r.lotName)
          .map((item) => [item.lotId, { id: item.lotId, name: item.lotName }])
      ).values()
    );
    const uniqueBatches = Array.from(
      new Set(result.map((item) => item.batchNo).filter(Boolean))
    );

    setSuppliers(uniqueSuppliers);
    setBranches(uniqueBranches);
    setLots(uniqueLots);
    setBatches(uniqueBatches);

    setLoading(false);
  };

  useEffect(() => {
    // Wrap in setTimeout to avoid React's synchronous setState inside effect warning
    const timeoutId = setTimeout(() => {
      loadInitialData();
    }, 0);
    return () => clearTimeout(timeoutId);
  }, []);

  const handleApplyFilters = async (newFilters: ExpirationFilters) => {
    setLoading(true);
    setFilters(newFilters);
    const result = await fetchFilteredExpirationData(newFilters);
    setData(result);
    setLoading(false);
  };

  const handleClearFilters = () => {
    setFilters({});
    setSearchQuery("");
    setData(masterData);
  };

  // Compute stats and frontend filters
  const filteredData = useMemo(() => {
    let finalData = data;

    // Filter by Status
    if (filters.expirationStatuses && filters.expirationStatuses.length > 0) {
      finalData = finalData.filter((item) => {
        const status = getExpirationStatus(item.expiryDate);
        return filters.expirationStatuses?.includes(status);
      });
    }

    // Filter by Suppliers
    if (filters.supplierIds && filters.supplierIds.length > 0) {
      finalData = finalData.filter((item) => 
        item.supplierId && filters.supplierIds?.includes(item.supplierId)
      );
    }

    // Filter by Branches
    if (filters.branchIds && filters.branchIds.length > 0) {
      finalData = finalData.filter((item) => 
        item.branchId && filters.branchIds?.includes(item.branchId)
      );
    }

    // Filter by Lots
    if (filters.lotIds && filters.lotIds.length > 0) {
      finalData = finalData.filter((item) => 
        item.lotId && filters.lotIds?.includes(item.lotId)
      );
    }

    // Filter by Batches
    if (filters.batchNos && filters.batchNos.length > 0) {
      finalData = finalData.filter((item) => 
        item.batchNo && filters.batchNos?.includes(item.batchNo)
      );
    }

    // Filter by search query
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      finalData = finalData.filter(
        (item) =>
          item.productName?.toLowerCase().includes(lowerQuery) ||
          item.productCode?.toLowerCase().includes(lowerQuery) ||
          item.receiptNo?.toLowerCase().includes(lowerQuery)
      );
    }

    return finalData;
  }, [data, searchQuery, filters.expirationStatuses, filters.supplierIds, filters.branchIds, filters.lotIds, filters.batchNos]);

  return {
    data: filteredData,
    loading,
    suppliers,
    branches,
    lots,
    batches,
    filters,
    searchQuery,
    setSearchQuery,
    handleApplyFilters,
    handleClearFilters,
    handleRefresh: () => {
      if (Object.keys(filters).length > 0) {
        handleApplyFilters(filters);
      } else {
        loadInitialData();
      }
    },
  };
}
