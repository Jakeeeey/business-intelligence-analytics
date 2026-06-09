// src/modules/business-intelligence-analytics/scm/consolidator-audit/hooks/useConsolidatorAudit.ts
import { useState, useEffect, useCallback, useMemo } from "react";
import type { ConsolidatorAuditRecord, ConsolidatorAuditFilters } from "../types";
import { fetchConsolidatorAuditData } from "../providers/fetchProvider";
import { toast } from "sonner";

export function useConsolidatorAudit() {
  const [draftFilters, setDraftFilters] = useState<ConsolidatorAuditFilters>({
    startDate: "",
    endDate: "",
    pdpNo: "",
    pdpStatus: "",
    consolidatorNo: "",
    consolidatorStatus: "",
    dpNo: "",
    dpStatus: "",
  });

  const [activeFilters, setActiveFilters] = useState<ConsolidatorAuditFilters>({
    startDate: "",
    endDate: "",
    pdpNo: "",
    pdpStatus: "",
    consolidatorNo: "",
    consolidatorStatus: "",
    dpNo: "",
    dpStatus: "",
  });

  const [data, setData] = useState<ConsolidatorAuditRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadedOnce, setLoadedOnce] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async (filtersToUse: ConsolidatorAuditFilters, showToast = false) => {
    setLoading(true);
    setError(null);
    let toastId: string | number | undefined;

    if (showToast) {
      toastId = toast.loading("Fetching audit records...");
    }

    try {
      // Only send date filters to backend to prevent multiple-filter conflicts
      const fetchFilters = {
        startDate: filtersToUse.startDate || "2026-01-01",
        endDate: filtersToUse.endDate || "2026-12-30",
      };

      const records = await fetchConsolidatorAuditData(fetchFilters);
      setData(records);
      setLoadedOnce(true);
      if (showToast && toastId) {
        toast.success(`Loaded ${records.length} records`, { id: toastId });
      }
    } catch (err) {
      console.error(err);
      const msg = err instanceof Error ? err.message : "Failed to load audit records";
      setError(msg);
      if (showToast && toastId) {
        toast.error(msg, { id: toastId });
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    loadData(activeFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = useCallback(() => {
    setActiveFilters(draftFilters);
    loadData(draftFilters, true);
  }, [draftFilters, loadData]);

  const handleClear = useCallback(() => {
    const defaultFilters = {
      startDate: "",
      endDate: "",
      pdpNo: "",
      pdpStatus: "",
      consolidatorNo: "",
      consolidatorStatus: "",
      dpNo: "",
      dpStatus: "",
    };
    setDraftFilters(defaultFilters);
    setActiveFilters(defaultFilters);
    loadData(defaultFilters, true);
  }, [loadData]);

  // Client-side filtering of the fetched data based on status/text search from active filters
  const filteredData = useMemo(() => {
    return data.filter((row) => {
      // Check Document No search term
      if (activeFilters.pdpNo && !row.pdpNo?.toLowerCase().includes(activeFilters.pdpNo.toLowerCase())) {
        return false;
      }
      if (activeFilters.consolidatorNo && !row.consolidatorNo?.toLowerCase().includes(activeFilters.consolidatorNo.toLowerCase())) {
        return false;
      }
      if (activeFilters.dpNo && !row.dpNo?.toLowerCase().includes(activeFilters.dpNo.toLowerCase())) {
        return false;
      }

      // Check Status select filters
      if (activeFilters.pdpStatus && row.pdpStatus !== activeFilters.pdpStatus) {
        return false;
      }
      if (activeFilters.consolidatorStatus && row.consolidatorStatus !== activeFilters.consolidatorStatus) {
        return false;
      }
      if (activeFilters.dpStatus && row.dpStatus !== activeFilters.dpStatus) {
        return false;
      }

      return true;
    });
  }, [
    data,
    activeFilters.pdpNo,
    activeFilters.consolidatorNo,
    activeFilters.dpNo,
    activeFilters.pdpStatus,
    activeFilters.consolidatorStatus,
    activeFilters.dpStatus,
  ]);

  // Extract unique statuses from the date-filtered dataset (never shrinks based on selected statuses)
  const uniqueStatuses = useMemo(() => {
    const pdp = new Set<string>();
    const consolidator = new Set<string>();
    const dp = new Set<string>();

    data.forEach((r) => {
      if (r.pdpStatus) pdp.add(r.pdpStatus);
      if (r.consolidatorStatus) consolidator.add(r.consolidatorStatus);
      if (r.dpStatus) dp.add(r.dpStatus);
    });

    return {
      pdp: Array.from(pdp),
      consolidator: Array.from(consolidator),
      dp: Array.from(dp),
    };
  }, [data]);

  return {
    draftFilters,
    setDraftFilters,
    activeFilters,
    data: filteredData,
    loading,
    loadedOnce,
    error,
    uniqueStatuses,
    handleSearch,
    handleClear,
  };
}
