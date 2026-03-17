"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { getAuditLogs } from "../providers/fetchProvider";
import type { AuditTrailEntry, AuditTrailFilters } from "../types";

const DEFAULT_FILTERS: AuditTrailFilters = {
  page: 1,
  limit: 10,
  sort_by: "snapshot_timestamp",
  sort_order: "desc",
  search: "",
  fiscal_period: "",
  trigger_event: ""
};

export function useAuditTrail() {
  const [logs, setLogs] = useState<AuditTrailEntry[]>([]);
  const [filters, setFilters] = useState<AuditTrailFilters>(DEFAULT_FILTERS);
  const [isLoading, setIsLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getAuditLogs(filters);
      setLogs(res.data || []);
      setTotalPages(res.meta.totalPages);
      setTotalRecords(res.meta.total);
    } catch (error) {
      console.error("Failed to load audit logs", error);
      toast.error("Failed to load audit logs");
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const updateFilters = (newFilters: Partial<AuditTrailFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 })); // Reset to page 1 on filter change
  };

  const setPage = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  return {
    logs,
    isLoading,
    filters,
    updateFilters,
    setPage,
    totalPages,
    totalRecords,
    refresh: loadData
  };
}
