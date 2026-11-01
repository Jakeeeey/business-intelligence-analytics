"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { fetchPhysicalInventorySchedule } from "../providers/fetchProvider";
import { PhysicalInventoryRecord, BranchLookup, SupplierLookup } from "../types";

export type StatusValue = "committed" | "pending" | "cancelled";

export function usePHWarehouse() {
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth() + 1);
  const [selectedBranchIds, setSelectedBranchIds] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [records, setRecords] = useState<PhysicalInventoryRecord[]>([]);
  const [branches, setBranches] = useState<BranchLookup[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierLookup[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchPhysicalInventorySchedule(selectedYear, selectedMonth);
      if (res.success) {
        setRecords(res.data);
        setBranches(res.branches || []);
        setSuppliers(res.suppliers || []);
      } else {
        setError(res.message || "Failed to load schedule");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error fetching data");
    } finally {
      setLoading(false);
    }
  }, [selectedYear, selectedMonth]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Total days in the selected month
  const daysInMonth = useMemo(() => {
    return new Date(selectedYear, selectedMonth, 0).getDate();
  }, [selectedYear, selectedMonth]);

  // Filter records by multi-select status and branch
  const filteredRecords = useMemo(() => {
    return records.filter((rec) => {
      // 1. Status Filter
      if (selectedStatuses.length > 0) {
        let recStatus: StatusValue = "pending";
        if (rec.isComitted) recStatus = "committed";
        else if (rec.isCancelled) recStatus = "cancelled";

        if (!selectedStatuses.includes(recStatus)) {
          return false;
        }
      }

      // 2. Branch Filter
      if (selectedBranchIds.length > 0) {
        if (!selectedBranchIds.includes(String(rec.branch_id))) {
          return false;
        }
      }

      return true;
    });
  }, [records, selectedStatuses, selectedBranchIds]);

  // Unique branches from records or master list
  const availableBranches = useMemo(() => {
    const map = new Map<number, BranchLookup>();
    branches.forEach((b) => map.set(b.id, b));
    records.forEach((r) => {
      if (!map.has(r.branch_id)) {
        map.set(r.branch_id, {
          id: r.branch_id,
          name: r.branch_name || `Branch #${r.branch_id}`,
          code: r.branch_code || "",
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [branches, records]);

  // Filtered branches based on branch filter dropdown
  const filteredBranches = useMemo(() => {
    if (selectedBranchIds.length === 0) {
      return availableBranches;
    }
    const branchSet = new Set(selectedBranchIds.map((id) => Number(id)));
    return availableBranches.filter((b) => branchSet.has(b.id));
  }, [availableBranches, selectedBranchIds]);

  return {
    selectedYear,
    setSelectedYear,
    selectedMonth,
    setSelectedMonth,
    selectedBranchIds,
    setSelectedBranchIds,
    selectedStatuses,
    setSelectedStatuses,
    loading,
    records: filteredRecords,
    allRecords: records,
    branches: availableBranches,
    filteredBranches,
    suppliers,
    daysInMonth,
    refresh: loadData,
    error,
  };
}
