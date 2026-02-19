import { useState, useEffect, useCallback } from "react";
import { FulfillmentRatePo } from "../types/fulfillment-rate.schema";
import { fetchFulfillmentRateData } from "../services/fulfillment-rate";
import { useScmFilters } from "@/modules/business-intelligence-analytics/scm/providers/ScmFilterProvider";

export function useFulfillmentRate() {
  const { fromMonth, toMonth, selectedSupplier } = useScmFilters();
  const [data, setData] = useState<FulfillmentRatePo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {
        from: fromMonth,
        to: toMonth,
      };
      if (selectedSupplier !== "all") {
        params.supplier = selectedSupplier;
      }
      const result = await fetchFulfillmentRateData(params);
      setData(result);
    } catch (err: any) {
      setError(err.message || "Failed to load fulfillment data");
    } finally {
      setIsLoading(false);
    }
  }, [fromMonth, toMonth, selectedSupplier]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, isLoading, error, refresh };
}
