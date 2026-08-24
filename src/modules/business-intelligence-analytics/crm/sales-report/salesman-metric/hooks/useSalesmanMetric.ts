import * as React from "react";
import { useDebounce } from "use-debounce";
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
  const [filters, setFilters] = React.useState<SalesmanMetricFilters>(() => {
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

  const [loading, setLoading] = React.useState<boolean>(false);
  const [rows, setRows] = React.useState<MetricRow[]>([]);
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [debouncedFilters] = useDebounce(filters, 300);

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

  // Fetch salesmen options when selected dates change
  React.useEffect(() => {
    async function loadLookups() {
      try {
        const queryParams = new URLSearchParams({
          mode: "lookups",
          startDate: filters.startDate,
          endDate: filters.endDate,
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
  }, [filters.startDate, filters.endDate]);

  // Fetch metrics data when filters change
  React.useEffect(() => {
    let active = true;
    const controller = new AbortController();

    async function fetchMetrics() {
      setLoading(true);
      try {
        const salesmanCode =
          debouncedFilters.salesmanId !== ""
            ? salesmen.find((s) => s.salesmanId === debouncedFilters.salesmanId)?.salesmanCode || ""
            : "";

        const queryParams = new URLSearchParams({
          mode: "report",
          salesmanId: debouncedFilters.salesmanId === "" ? "all" : String(debouncedFilters.salesmanId),
          salesmanCode,
          startDate: debouncedFilters.startDate,
          endDate: debouncedFilters.endDate,
        });

        const res = await fetch(`/api/bia/crm/sales-report/salesman-metric?${queryParams.toString()}`, {
          signal: controller.signal
        });
        const json = await res.json();
        if (active && json.success && Array.isArray(json.data)) {
          setRows(json.data);
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
  }, [debouncedFilters.salesmanId, debouncedFilters.startDate, debouncedFilters.endDate, salesmen]);

  const handleSalesmanChange = (id: number | "") => {
    const code = id !== "" ? salesmen.find((s) => s.salesmanId === id)?.salesmanCode || "" : "";
    setFilters((prev) => ({
      ...prev,
      salesmanId: id,
      salesmanCode: code,
    }));
  };

  const handleFiscalPeriodChange = (fp: string) => {
    const range = getFiscalPeriodRange(fp);
    setFilters((prev) => ({
      ...prev,
      fiscalPeriod: fp,
      startDate: range.start,
      endDate: range.end,
    }));
  };

  const filteredRows = React.useMemo(() => {
    if (!searchQuery.trim()) return rows;
    const lowerQuery = searchQuery.toLowerCase();
    return rows.filter((r) => 
      r.salesmanName.toLowerCase().includes(lowerQuery) || 
      (r.salesmanCode && r.salesmanCode.toLowerCase().includes(lowerQuery))
    );
  }, [rows, searchQuery]);

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

  return {
    salesmen,
    filters,
    loading,
    rows: filteredRows,
    
    // Search
    searchQuery,
    setSearchQuery,
    
    // Handlers for filters
    handleSalesmanChange,
    handleFiscalPeriodChange,

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
