import * as React from "react";
import { MetricRow, SalesmanMetricFilters, SalesmanOption } from "../types";

// Helper to compute first and last day of month based on YYYY-MM-DD fiscal period
function getFiscalPeriodRange(fiscalPeriod: string): { start: string; end: string } {
  const parts = fiscalPeriod.split("-");
  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const start = `${parts[0]}-${parts[1]}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const end = `${parts[0]}-${parts[1]}-${String(lastDay).padStart(2, "0")}`;
  return { start, end };
}

export function useSalesmanMetric() {
  const [salesmen, setSalesmen] = React.useState<SalesmanOption[]>([]);
  const [localFilters, setLocalFilters] = React.useState<SalesmanMetricFilters>(() => {
    const today = new Date();
    const currentFiscalPeriod = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-01`;
    const range = getFiscalPeriodRange(currentFiscalPeriod);
    return {
      salesmanId: "",
      salesmanCode: "",
      fiscalPeriod: currentFiscalPeriod,
      startDate: range.start,
      endDate: range.end,
    };
  });
  
  const [appliedFilters, setAppliedFilters] = React.useState<SalesmanMetricFilters>(localFilters);
  const [selectedSalesman, setSelectedSalesman] = React.useState<SalesmanOption | null>(null);
  
  const [refreshTrigger, setRefreshTrigger] = React.useState<number>(0);

  const [loading, setLoading] = React.useState<boolean>(false);
  const [cachedRows, setCachedRows] = React.useState<MetricRow[]>([]);
  const [searchQuery, setSearchQuery] = React.useState<string>("");

  // Modal State for Supplier Sales Breakdown
  const [modalOpen, setModalOpen] = React.useState<boolean>(false);
  const [selectedSalesmanId, setSelectedSalesmanId] = React.useState<number | "">("");
  const [selectedSalesmanName, setSelectedSalesmanName] = React.useState<string>("");

  // Modal State for Frequency Detailed Breakdown
  const [freqModalOpen, setFreqModalOpen] = React.useState<boolean>(false);
  const [freqSalesmanId, setFreqSalesmanId] = React.useState<number | "">("");
  const [freqSalesmanCode, setFreqSalesmanCode] = React.useState<string>("");
  const [freqSalesmanName, setFreqSalesmanName] = React.useState<string>("");

  // Modal State for Reach Detailed Breakdown
  const [reachModalOpen, setReachModalOpen] = React.useState<boolean>(false);
  const [reachSalesmanId, setReachSalesmanId] = React.useState<number | "">("");
  const [reachSalesmanCode, setReachSalesmanCode] = React.useState<string>("");
  const [reachSalesmanName, setReachSalesmanName] = React.useState<string>("");

  // Modal State for New Accounts Detailed Breakdown
  const [newAccModalOpen, setNewAccModalOpen] = React.useState<boolean>(false);
  const [newAccSalesmanId, setNewAccSalesmanId] = React.useState<number | "">("");
  const [newAccSalesmanCode, setNewAccSalesmanCode] = React.useState<string>("");
  const [newAccSalesmanName, setNewAccSalesmanName] = React.useState<string>("");

  // Modal State for Productive Outlet Breakdown
  const [poModalOpen, setPoModalOpen] = React.useState<boolean>(false);
  const [poSalesmanId, setPoSalesmanId] = React.useState<number | "">("");
  const [poSalesmanName, setPoSalesmanName] = React.useState<string>("");

  // Modal State for Basket Count Breakdown
  const [bcModalOpen, setBcModalOpen] = React.useState<boolean>(false);
  const [bcSalesmanId, setBcSalesmanId] = React.useState<number | "">("");
  const [bcSalesmanName, setBcSalesmanName] = React.useState<string>("");

  // Modal State for Line Sales Breakdown
  const [lsModalOpen, setLsModalOpen] = React.useState<boolean>(false);
  const [lsSalesmanId, setLsSalesmanId] = React.useState<number | "">("");
  const [lsSalesmanName, setLsSalesmanName] = React.useState<string>("");

  // Modal State for Tactical SKU Breakdown
  const [tskuModalOpen, setTskuModalOpen] = React.useState<boolean>(false);
  const [tskuSalesmanId, setTskuSalesmanId] = React.useState<number | "">("");
  const [tskuSalesmanName, setTskuSalesmanName] = React.useState<string>("");

  // Fetch salesmen options when selected dates change (based on localFilters)
  React.useEffect(() => {
    async function loadLookups() {
      try {
        const queryParams = new URLSearchParams({
          mode: "lookups",
          startDate: localFilters.startDate,
          endDate: localFilters.endDate,
        });
        const response = await fetch(`/api/bia/crm/sales-report/salesman-metric?${queryParams.toString()}`);
        const json = await response.json();
        if (json.success && Array.isArray(json.data)) {
          setSalesmen(json.data);
        }
      } catch (err) {
        console.error("Failed to load lookups:", err);
      }
    }
    loadLookups();
  }, [localFilters.startDate, localFilters.endDate]);

  // Fetch metrics data when applied filters' fiscal period changes
  // We fetch for all salesmen in that period to cache it locally
  React.useEffect(() => {
    let active = true;
    const controller = new AbortController();

    async function fetchMetrics() {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams({
          mode: "report",
          salesmanId: "all", // Fetch all to allow client-side filtering
          salesmanCode: "",
          startDate: appliedFilters.startDate,
          endDate: appliedFilters.endDate,
        });

        const res = await fetch(`/api/bia/crm/sales-report/salesman-metric?${queryParams.toString()}`, {
          signal: controller.signal
        });
        const json = await res.json();
        if (active && json.success && Array.isArray(json.data)) {
          setCachedRows(json.data);
        }
      } catch (err: unknown) {
        const error = err as Error;
        if (error.name !== 'AbortError') {
          console.error("Error fetching salesman metrics:", err);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchMetrics();

    return () => {
      active = false;
      controller.abort();
    };
  }, [appliedFilters.startDate, appliedFilters.endDate, refreshTrigger]);

  const handleSalesmanChange = (id: number | "") => {
    if (id === "") {
      setSelectedSalesman(null);
      setLocalFilters((prev) => ({
        ...prev,
        salesmanId: "",
        salesmanCode: "",
      }));
    } else {
      const sm = salesmen.find((s) => s.salesmanId === id);
      if (sm) {
        setSelectedSalesman(sm);
      }
      setLocalFilters((prev) => ({
        ...prev,
        salesmanId: id,
        salesmanCode: sm?.salesmanCode || "",
      }));
    }
  };

  const handleFiscalPeriodChange = (fp: string) => {
    const range = getFiscalPeriodRange(fp);
    setLocalFilters((prev) => ({
      ...prev,
      fiscalPeriod: fp,
      startDate: range.start,
      endDate: range.end,
    }));
  };

  const handleApplyFilters = () => {
    setAppliedFilters(localFilters);
  };

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleClearFilters = () => {
    const today = new Date();
    const currentFiscalPeriod = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-01`;
    const range = getFiscalPeriodRange(currentFiscalPeriod);
    
    const defaultFilters: SalesmanMetricFilters = {
      salesmanId: "",
      salesmanCode: "",
      fiscalPeriod: currentFiscalPeriod,
      startDate: range.start,
      endDate: range.end,
    };
    
    setSelectedSalesman(null);
    setLocalFilters(defaultFilters);
    setAppliedFilters(defaultFilters);
    // Incrementing refreshTrigger forces a fetch of the baseline view
    setRefreshTrigger(prev => prev + 1);
  };

  const hasActiveFilters = React.useMemo(() => {
    const today = new Date();
    const currentFiscalPeriod = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-01`;
    return appliedFilters.salesmanId !== "" || appliedFilters.fiscalPeriod !== currentFiscalPeriod;
  }, [appliedFilters.salesmanId, appliedFilters.fiscalPeriod]);

  const filteredRows = React.useMemo(() => {
    // 1. Filter by applied salesmanId
    let result = cachedRows;
    if (appliedFilters.salesmanId !== "") {
      result = result.filter(r => r.salesmanId === appliedFilters.salesmanId);
    }
    
    // 2. Filter by search query
    if (!searchQuery.trim()) return result;
    const lowerQuery = searchQuery.toLowerCase();
    return result.filter((r) => 
      r.salesmanName.toLowerCase().includes(lowerQuery) || 
      (r.salesmanCode && r.salesmanCode.toLowerCase().includes(lowerQuery))
    );
  }, [cachedRows, appliedFilters.salesmanId, searchQuery]);

  const handleViewSupplierBreakdown = (salesmanId: number, salesmanName: string) => {
    setSelectedSalesmanId(salesmanId);
    setSelectedSalesmanName(salesmanName);
    setModalOpen(true);
  };

  const handleViewFrequencyDetail = (salesmanId: number, salesmanCode: string, salesmanName: string) => {
    setFreqSalesmanId(salesmanId);
    setFreqSalesmanCode(salesmanCode);
    setFreqSalesmanName(salesmanName);
    setFreqModalOpen(true);
  };

  const handleViewReachBreakdown = (salesmanId: number, salesmanCode: string, salesmanName: string) => {
    setReachSalesmanId(salesmanId);
    setReachSalesmanCode(salesmanCode);
    setReachSalesmanName(salesmanName);
    setReachModalOpen(true);
  };

  const handleViewNewAccountsDetail = (salesmanId: number, salesmanCode: string, salesmanName: string) => {
    setNewAccSalesmanId(salesmanId);
    setNewAccSalesmanCode(salesmanCode);
    setNewAccSalesmanName(salesmanName);
    setNewAccModalOpen(true);
  };

  const handleViewProductiveOutletDetail = (salesmanId: number, salesmanName: string) => {
    setPoSalesmanId(salesmanId);
    setPoSalesmanName(salesmanName);
    setPoModalOpen(true);
  };

  const handleViewBasketCountDetail = (salesmanId: number, salesmanName: string) => {
    setBcSalesmanId(salesmanId);
    setBcSalesmanName(salesmanName);
    setBcModalOpen(true);
  };

  const handleViewLineSalesDetail = (salesmanId: number, salesmanName: string) => {
    setLsSalesmanId(salesmanId);
    setLsSalesmanName(salesmanName);
    setLsModalOpen(true);
  };

  const handleViewTacticalSkuDetail = (salesmanId: number, salesmanName: string) => {
    setTskuSalesmanId(salesmanId);
    setTskuSalesmanName(salesmanName);
    setTskuModalOpen(true);
  };

  // Ensure the selected salesman is always in the dropdown options, even if they have no data in the new fiscal period
  const displaySalesmen = React.useMemo(() => {
    if (!selectedSalesman) return salesmen;
    if (salesmen.some((s) => s.salesmanId === selectedSalesman.salesmanId)) return salesmen;
    return [...salesmen, selectedSalesman];
  }, [salesmen, selectedSalesman]);

  return {
    salesmen: displaySalesmen,
    localFilters,
    appliedFilters,
    loading,
    rows: filteredRows,
    
    // Search
    searchQuery,
    setSearchQuery,
    
    // Handlers for filters
    handleSalesmanChange,
    handleFiscalPeriodChange,
    handleApplyFilters,
    handleRefresh,
    handleClearFilters,
    hasActiveFilters,

    // Modal States & Setters
    modalOpen, setModalOpen, selectedSalesmanId, selectedSalesmanName,
    freqModalOpen, setFreqModalOpen, freqSalesmanId, freqSalesmanCode, freqSalesmanName,
    reachModalOpen, setReachModalOpen, reachSalesmanId, reachSalesmanCode, reachSalesmanName,
    newAccModalOpen, setNewAccModalOpen, newAccSalesmanId, newAccSalesmanCode, newAccSalesmanName,
    poModalOpen, setPoModalOpen, poSalesmanId, poSalesmanName,
    bcModalOpen, setBcModalOpen, bcSalesmanId, bcSalesmanName,
    lsModalOpen, setLsModalOpen, lsSalesmanId, lsSalesmanName,
    tskuModalOpen, setTskuModalOpen, tskuSalesmanId, tskuSalesmanName,

    // Actions
    handleViewSupplierBreakdown,
    handleViewFrequencyDetail,
    handleViewReachBreakdown,
    handleViewNewAccountsDetail,
    handleViewProductiveOutletDetail,
    handleViewBasketCountDetail,
    handleViewLineSalesDetail,
    handleViewTacticalSkuDetail,
  };
}
