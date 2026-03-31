"use client";

import * as React from "react";
import type {
  DisbursementRecord,
  ExpenseFilters,
  DateRangePreset,
} from "../type";
import {
  fetchDisbursements,
  filterRecords,
  calculateKpis,
  getFilterOptions,
  calculateExpensesByCategory,
  calculateExpensesByEmployee,
  calculateExpensesByDivision,
  calculateExpensesByPeriod,
  getDisbursementSummariesGroupedByCoA,
} from "../providers/fetchProvider";

/**
 * Helper function to calculate date range based on preset
 */
function getDateRange(
  preset: DateRangePreset
): { startDate: string; endDate: string } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endDate = today.toISOString().split("T")[0];

  let startDate = endDate;

  switch (preset) {
    case "yesterday": {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      startDate = yesterday.toISOString().split("T")[0];
      break;
    }
    case "today":
      startDate = endDate;
      break;
    case "this-week": {
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());
      startDate = weekStart.toISOString().split("T")[0];
      break;
    }
    case "this-month": {
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      startDate = monthStart.toISOString().split("T")[0];
      break;
    }
    case "this-year": {
      const yearStart = new Date(today.getFullYear(), 0, 1);
      startDate = yearStart.toISOString().split("T")[0];
      break;
    }
    case "custom":
      // Return as-is; caller should provide custom dates
      break;
  }

  return { startDate, endDate };
}

type UseExpenseReportReturn = {
  isLoading: boolean;
  error: string | null;
  records: DisbursementRecord[];
  filteredRecords: DisbursementRecord[];
  filters: ExpenseFilters;
  setFilters: (filters: ExpenseFilters) => void;
  kpis: ReturnType<typeof calculateKpis>;
  expensesByCategory: ReturnType<typeof calculateExpensesByCategory>;
  expensesByEmployee: ReturnType<typeof calculateExpensesByEmployee>;
  expensesByDivision: ReturnType<typeof calculateExpensesByDivision>;
  expensesByPeriod: ReturnType<typeof calculateExpensesByPeriod>;
  dismissedSummaries: ReturnType<typeof getDisbursementSummariesGroupedByCoA>;
  filterOptions: ReturnType<typeof getFilterOptions>;
};

export function useExpenseReport(
  initialDateRange: DateRangePreset = "this-month"
): UseExpenseReportReturn {
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [records, setRecords] = React.useState<DisbursementRecord[]>([]);

  // Initialize filters with date range
  const { startDate: initialStart, endDate: initialEnd } =
    getDateRange(initialDateRange);
  const [filters, setFilters] = React.useState<ExpenseFilters>({
    dateRangePreset: initialDateRange,
    dateFrom: initialStart,
    dateTo: initialEnd,
    employees: [],
    divisions: [],
    encoders: [],
    coaAccounts: [],
    transactionTypes: [],
    statuses: [],
  });

  // Fetch data when date range changes
  React.useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await fetchDisbursements(filters.dateFrom, filters.dateTo);
        setRecords(data);
      } catch (err) {
        const errMsg =
          err instanceof Error ? err.message : "Failed to fetch disbursements";
        setError(errMsg);
        setRecords([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [filters.dateFrom, filters.dateTo]);

  // Apply client-side filters
  const filteredRecords = React.useMemo(
    () => filterRecords(records, filters),
    [records, filters]
  );

  // Calculate all derived data
  const kpis = React.useMemo(() => calculateKpis(filteredRecords), [
    filteredRecords,
  ]);
  const expensesByCategory = React.useMemo(
    () => calculateExpensesByCategory(filteredRecords),
    [filteredRecords]
  );
  const expensesByEmployee = React.useMemo(
    () => calculateExpensesByEmployee(filteredRecords),
    [filteredRecords]
  );
  const expensesByDivision = React.useMemo(
    () => calculateExpensesByDivision(filteredRecords),
    [filteredRecords]
  );
  const expensesByPeriod = React.useMemo(
    () => calculateExpensesByPeriod(filteredRecords, "monthly"),
    [filteredRecords]
  );
  const dismissedSummaries = React.useMemo(
    () => getDisbursementSummariesGroupedByCoA(filteredRecords),
    [filteredRecords]
  );

  const filterOptions = React.useMemo(
    () => getFilterOptions(records),
    [records]
  );

  return {
    isLoading,
    error,
    records,
    filteredRecords,
    filters,
    setFilters,
    kpis,
    expensesByCategory,
    expensesByEmployee,
    expensesByDivision,
    expensesByPeriod,
    dismissedSummaries,
    filterOptions,
  };
}
