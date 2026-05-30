// src/modules/business-intelligence-analytics/scm/consolidator-audit/hooks/useConsolidatorAudit.ts
import { useState, useEffect, useCallback, useMemo } from "react";
import type { ConsolidatorAuditRecord, ConsolidatorAuditFilters, GroupedPdp } from "../types";
import { fetchConsolidatorAuditData } from "../providers/fetchProvider";
import { toast } from "sonner";

export function useConsolidatorAudit() {
  const [filters, setFilters] = useState<ConsolidatorAuditFilters>({
    startDate: "2025-09-01",
    endDate: "2025-10-30",
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

  const loadData = useCallback(async (activeFilters: ConsolidatorAuditFilters, showToast = false) => {
    setLoading(true);
    setError(null);
    let toastId: string | number | undefined;

    if (showToast) {
      toastId = toast.loading("Fetching audit records...");
    }

    try {
      const records = await fetchConsolidatorAuditData(activeFilters);
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

  // Fetch on mount or when dates change
  useEffect(() => {
    loadData(filters);
  }, []);

  const handleSearch = useCallback(() => {
    loadData(filters, true);
  }, [filters, loadData]);

  const handleClear = useCallback(() => {
    const defaultFilters = {
      startDate: "2025-09-01",
      endDate: "2025-10-30",
      pdpNo: "",
      pdpStatus: "",
      consolidatorNo: "",
      consolidatorStatus: "",
      dpNo: "",
      dpStatus: "",
    };
    setFilters(defaultFilters);
    loadData(defaultFilters, true);
  }, [loadData]);

  // Group data by PDP -> Consolidator -> DP for Relationship View
  const groupedData = useMemo<GroupedPdp[]>(() => {
    const pdpMap = new Map<string, GroupedPdp>();

    data.forEach((row) => {
      // Use pdpNo (or pdpId) as key. If both null, group under "Unknown PDP"
      const pdpKey = row.pdpNo || `unknown-pdp-${row.pdpId || "null"}`;
      let pdp = pdpMap.get(pdpKey);

      if (!pdp) {
        pdp = {
          pdpId: row.pdpId ?? "unknown",
          pdpNo: row.pdpNo || "Unknown PDP",
          pdpStatus: row.pdpStatus || "N/A",
          pdpCreatedAt: row.pdpCreatedAt || "",
          consolidators: [],
        };
        pdpMap.set(pdpKey, pdp);
      }

      // Check for consolidator
      if (row.consolidatorNo || row.consolidatorId) {
        const cKey = row.consolidatorNo || `unknown-c-${row.consolidatorId || "null"}`;
        let consolidator = pdp.consolidators.find((c) => c.consolidatorNo === cKey || (row.consolidatorNo && c.consolidatorNo === row.consolidatorNo));

        if (!consolidator) {
          consolidator = {
            consolidatorId: row.consolidatorId ?? "unknown",
            consolidatorNo: row.consolidatorNo || "Unknown Consolidator",
            consolidatorStatus: row.consolidatorStatus || "N/A",
            consolidatorCreatedAt: row.consolidatorCreatedAt || "",
            dispatchPlans: [],
          };
          pdp.consolidators.push(consolidator);
        }

        // Check for dispatch plan
        if (row.dpNo || row.dpId) {
          const dpKey = row.dpNo || `unknown-dp-${row.dpId || "null"}`;
          const hasDp = consolidator.dispatchPlans.some((d) => d.dpNo === dpKey || (row.dpNo && d.dpNo === row.dpNo));

          if (!hasDp) {
            consolidator.dispatchPlans.push({
              dpId: row.dpId ?? "unknown",
              dpNo: row.dpNo || "Unknown DP",
              dpStatus: row.dpStatus || "N/A",
              dpCreatedAt: row.dpCreatedAt || "",
            });
          }
        }
      }
    });

    return Array.from(pdpMap.values());
  }, [data]);

  // Extract unique statuses from dataset to populate drop-downs/auto-suggest
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
    filters,
    setFilters,
    data,
    groupedData,
    loading,
    loadedOnce,
    error,
    uniqueStatuses,
    handleSearch,
    handleClear,
  };
}
