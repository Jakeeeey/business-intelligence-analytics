import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { fetchLeadTimeVarianceData } from "../services/lead-time-variance";
import { LeadTimeVariancePo } from "../types/lead-time-variance.schema";
import { useScmFilters } from "../providers/ScmFilterProvider";

/**
 * Custom hook to fetch and manage Lead Time Variance data.
 */
export function useLeadTimeVariance() {
  const { dateRange } = useScmFilters();
  const [data, setData] = useState<LeadTimeVariancePo[]>([]);
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

      const params: Record<string, string> = {
        from: fromFormatted,
        to: toFormatted,
        limit: "-1",
      };

      const result = await fetchLeadTimeVarianceData(params);
      setData(result);
    } catch (err: any) {
      setError(err.message || "Failed to load lead time variance data");
    } finally {
      setIsLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, isLoading, error, refresh };
}
