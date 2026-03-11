import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { FulfillmentRatePo } from "../types/fulfillment-rate.schema";
import { fetchFulfillmentRateData } from "../services/fulfillment-rate";
import { useScmFilters } from "../providers/ScmFilterProvider";

export function useFulfillmentRate() {
  const { dateRange } = useScmFilters();
  const [data, setData] = useState<FulfillmentRatePo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fromFormatted = dateRange?.from
        ? format(dateRange.from, "yyyy-MM-dd")
        : "";
      const toFormatted = dateRange?.to
        ? format(dateRange.to, "yyyy-MM-dd")
        : "";

      // We only filter by date on the server to keep the full supplier list available for local switching
      const params: Record<string, string> = {
        from: fromFormatted,
        to: toFormatted,
        limit: "-1",
      };

      const result = await fetchFulfillmentRateData(params);
      setData(result);
    } catch (err: unknown) {
      setError((err as Error).message || "Failed to load fulfillment data");
    } finally {
      setIsLoading(false);
    }
  }, [dateRange]); // Removed selectedSupplier as a dependency for the API call

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, isLoading, error, refresh };
}
