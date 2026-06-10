// src/modules/business-intelligence-analytics/scm/consolidator-audit/hooks/useConsolidatorAudit.ts
import { useState, useEffect, useCallback, useMemo } from "react";
import type { ConsolidatorAuditRecord, ConsolidatorAuditFilters } from "../types";
import { fetchConsolidatorAuditData } from "../providers/fetchProvider";
import { toast } from "sonner";

export function getManilaDateRange(
  type: "today" | "week" | "month" | "year" | "custom",
  customStart = "",
  customEnd = ""
) {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  
  const [mStr, dStr, yStr] = formatter.format(now).split("/");
  const currentYear = parseInt(yStr, 10);
  const currentMonth = parseInt(mStr, 10) - 1;
  const currentDay = parseInt(dStr, 10);

  const pad = (n: number) => n.toString().padStart(2, "0");

  let startDate = "";
  let endDate = "";

  if (type === "today") {
    const formatted = `${currentYear}-${pad(currentMonth + 1)}-${pad(currentDay)}`;
    startDate = formatted;
    endDate = formatted;
  } else if (type === "week") {
    const manilaDate = new Date(Date.UTC(currentYear, currentMonth, currentDay));
    const day = manilaDate.getUTCDay();
    const diff = manilaDate.getUTCDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(Date.UTC(currentYear, currentMonth, diff));
    const sunday = new Date(Date.UTC(monday.getUTCFullYear(), monday.getUTCMonth(), monday.getUTCDate() + 6));
    
    startDate = `${monday.getUTCFullYear()}-${pad(monday.getUTCMonth() + 1)}-${pad(monday.getUTCDate())}`;
    endDate = `${sunday.getUTCFullYear()}-${pad(sunday.getUTCMonth() + 1)}-${pad(sunday.getUTCDate())}`;
  } else if (type === "month") {
    startDate = `${currentYear}-${pad(currentMonth + 1)}-01`;
    const lastDay = new Date(Date.UTC(currentYear, currentMonth + 1, 0)).getUTCDate();
    endDate = `${currentYear}-${pad(currentMonth + 1)}-${pad(lastDay)}`;
  } else if (type === "year") {
    startDate = `${currentYear}-01-01`;
    endDate = `${currentYear}-12-31`;
  } else {
    startDate = customStart;
    endDate = customEnd;
  }

  return { startDate, endDate };
}

export function useConsolidatorAudit() {
  const initialDates = useMemo(() => getManilaDateRange("month"), []);

  const [draftFilters, setDraftFilters] = useState<ConsolidatorAuditFilters>({
    dateRangeType: "month",
    startDate: initialDates.startDate,
    endDate: initialDates.endDate,
    pdpNo: "",
    pdpStatus: "",
    consolidatorNo: "",
    consolidatorStatus: "",
    dpNo: "",
    dpStatus: "",
  });

  const [activeFilters, setActiveFilters] = useState<ConsolidatorAuditFilters>({
    dateRangeType: "month",
    startDate: initialDates.startDate,
    endDate: initialDates.endDate,
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
      const fetchFilters = {
        dateRangeType: filtersToUse.dateRangeType,
        startDate: filtersToUse.startDate || "2026-01-01",
        endDate: filtersToUse.endDate || "2026-12-30",
      };

      const records = await fetchConsolidatorAuditData(fetchFilters);
      setData(records);
      setLoadedOnce(true);

      if (showToast && toastId) {
        // Calculate filtered count matching current status and search filters
        const filteredCount = records.filter((row) => {
          if (filtersToUse.pdpNo || filtersToUse.consolidatorNo || filtersToUse.dpNo) {
            const pdpMatch = filtersToUse.pdpNo && row.pdpNo?.toLowerCase().includes(filtersToUse.pdpNo.toLowerCase());
            const consolMatch = filtersToUse.consolidatorNo && row.consolidatorNo?.toLowerCase().includes(filtersToUse.consolidatorNo.toLowerCase());
            const dpMatch = filtersToUse.dpNo && row.dpNo?.toLowerCase().includes(filtersToUse.dpNo.toLowerCase());
            if (!pdpMatch && !consolMatch && !dpMatch) {
              return false;
            }
          }
          if (filtersToUse.pdpStatus && row.pdpStatus !== filtersToUse.pdpStatus) {
            return false;
          }
          if (filtersToUse.consolidatorStatus && row.consolidatorStatus !== filtersToUse.consolidatorStatus) {
            return false;
          }
          if (filtersToUse.dpStatus && row.dpStatus !== filtersToUse.dpStatus) {
            return false;
          }
          return true;
        }).length;

        if (records.length === 0) {
          toast.success("No records found for this date range", { id: toastId });
        } else if (filteredCount === 0) {
          toast.success(`No matching records found (${records.length} total loaded)`, { id: toastId });
        } else if (filteredCount < records.length) {
          toast.success(`Loaded ${filteredCount} matching records (out of ${records.length})`, { id: toastId });
        } else {
          toast.success(`Loaded ${filteredCount} records`, { id: toastId });
        }
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
    const dates = getManilaDateRange("month");
    const defaultFilters = {
      dateRangeType: "month" as const,
      startDate: dates.startDate,
      endDate: dates.endDate,
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
      // Check Document No search term with OR condition to allow PDP-only or other incomplete records
      if (activeFilters.pdpNo || activeFilters.consolidatorNo || activeFilters.dpNo) {
        const pdpMatch = activeFilters.pdpNo && row.pdpNo?.toLowerCase().includes(activeFilters.pdpNo.toLowerCase());
        const consolMatch = activeFilters.consolidatorNo && row.consolidatorNo?.toLowerCase().includes(activeFilters.consolidatorNo.toLowerCase());
        const dpMatch = activeFilters.dpNo && row.dpNo?.toLowerCase().includes(activeFilters.dpNo.toLowerCase());
        if (!pdpMatch && !consolMatch && !dpMatch) {
          return false;
        }
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
    hasRawData: data.length > 0,
    loading,
    loadedOnce,
    error,
    uniqueStatuses,
    handleSearch,
    handleClear,
  };
}
