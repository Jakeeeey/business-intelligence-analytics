import { useState, useEffect, useMemo } from "react";
import { fetchAgingSlobData } from "../services/aging-slob";
import { SlobAging } from "../../types/stock-health.schema";
import { useScmFilters } from "@/modules/business-intelligence-analytics/scm/providers/ScmFilterProvider";
import { parse, isWithinInterval } from "date-fns";

export function useAgingSlob() {
  const [data, setData] = useState<SlobAging[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { selectedSupplier, selectedBranch, selectedRiskStatus, dateRange } = useScmFilters();

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const result = await fetchAgingSlobData();
      setData(result);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to fetch Aging & SLOB data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredData = useMemo(() => {
    return data
      .filter((item) => {
        // Supplier Filter
        const supplierMatch = selectedSupplier === "all" || item.supplierShortcut === selectedSupplier || item.branchName === selectedSupplier; 
        
        // Branch Filter
        const branchMatch = selectedBranch === "all" || item.branchName === selectedBranch;

        // Risk Status Filter (Day Idle)
        const riskMatch = 
          selectedRiskStatus === "all" || 
          (selectedRiskStatus === "critical" && item.isSlob === 1) ||
          (selectedRiskStatus === "healthy" && item.isSlob === 0);

        // Date Filter (matching against lastOutboundDate)
        let dateMatch = true;
        if (dateRange?.from && item.lastOutboundDate) {
          try {
            const outboundDate = parse(item.lastOutboundDate, "yyyy-MM-dd HH:mm:ss", new Date());
            const start = dateRange.from;
            const end = dateRange.to || new Date();
            dateMatch = isWithinInterval(outboundDate, { start, end });
          } catch {
            dateMatch = true;
          }
        }

        return supplierMatch && branchMatch && riskMatch && dateMatch;
      })
      .sort((a, b) => b.isSlob - a.isSlob);
  }, [data, selectedSupplier, selectedBranch, selectedRiskStatus, dateRange]);

  const metrics = useMemo(() => {
    const totalInventoryValue = data.reduce((acc, curr) => acc + curr.stockValue, 0);
    const slobItems = filteredData.filter(item => item.isSlob === 1);
    const slobInventoryValue = slobItems.reduce((acc, curr) => acc + curr.stockValue, 0);
    const healthyInventoryValue = totalInventoryValue - slobInventoryValue;
    const slobPercentage = totalInventoryValue > 0 ? (slobInventoryValue / totalInventoryValue) * 100 : 0;

    return {
      slobInventoryValue,
      healthyInventoryValue,
      slobPercentage,
      totalInventoryValue,
      slobItemCount: slobItems.length,
      totalItemCount: filteredData.length
    };
  }, [filteredData, data]);

  return {
    data: filteredData,
    rawData: data,
    isLoading,
    error,
    metrics,
    refresh: fetchData
  };
}
