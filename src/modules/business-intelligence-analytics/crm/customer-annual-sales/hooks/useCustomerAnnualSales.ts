"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { fetchCustomerAnnualSales } from "../services/customer-annual-sales";
import { CustomerAnnualSalesApiResponse } from "../types/customer-annual-sales.schema";

export function useCustomerAnnualSales(params: Record<string, string> = {}) {
  const [data, setData] = useState<CustomerAnnualSalesApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const paramsKey = JSON.stringify(params);
  const paramsRef = useRef(params);
  paramsRef.current = params;

  const refresh = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchCustomerAnnualSales(paramsRef.current);
      if (controller.signal.aborted) return;
      setData(result);
    } catch (err) {
      if (controller.signal.aborted) return;
      setError(
        err instanceof Error
          ? err.message
          : "ERR_INTERNAL_FAIL: Failed to load customer annual sales data"
      );
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    refresh();
    return () => abortRef.current?.abort();
  }, [refresh, paramsKey]);

  return { data, isLoading, error, refresh };
}
