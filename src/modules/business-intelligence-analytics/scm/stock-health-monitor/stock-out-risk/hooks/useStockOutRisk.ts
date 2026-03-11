import { useState, useEffect, useMemo } from "react";
import { fetchStockOutRiskData } from "../services/stock-out-risk";
import { format } from "date-fns";
import { StockOutRisk } from "../types";
import { useScmFilters } from "../providers/ScmFilterProvider";

export function useStockOutRisk() {
  const [data, setData] = useState<StockOutRisk[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { selectedSupplier, selectedBranch, selectedRiskStatus, dateRange } = useScmFilters();

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const start = dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : "";
      const end = dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : "";
      
      const result = await fetchStockOutRiskData(start, end);
      setData(result);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to fetch Stock-out Risk data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  const filteredData = useMemo(() => {
    return data
      .filter((item) => {
        // Supplier Filter
        const supplierMatch = selectedSupplier === "all" || item.supplierShortcut === selectedSupplier;
        
        // Branch Filter
        const branchMatch = selectedBranch === "all" || item.branchName === selectedBranch;

        // Risk Status Filter
        const riskMatch = 
          selectedRiskStatus === "all" || 
          (selectedRiskStatus === "critical" && item.isActionRequired === 1) ||
          (selectedRiskStatus === "healthy" && item.isActionRequired === 0);

        return supplierMatch && branchMatch && riskMatch;
      })
      .sort((a, b) => b.isActionRequired - a.isActionRequired);
  }, [data, selectedSupplier, selectedBranch, selectedRiskStatus]);

  const criticalItems = useMemo(() => {
    return filteredData.filter(item => item.isActionRequired === 1);
  }, [filteredData]);

  return {
    data: filteredData,
    criticalItems,
    isLoading,
    error,
    refresh: fetchData
  };
}
