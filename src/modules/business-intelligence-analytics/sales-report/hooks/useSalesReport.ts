"use client";

import * as React from "react";
import { toast } from "sonner";

import type {
  EmployeeGroup,
  SalesReportFilters,
  SalesReportKpis,
  SalesReportRow,
  SalesInvoiceRow,
} from "../types";
import { getLookups, getSalesReport } from "../providers/fetchProvider";

export function useSalesReport() {
  const [employees, setEmployees] = React.useState<EmployeeGroup[]>([]);
  const [loadingLookups, setLoadingLookups] = React.useState(false);

  const [filters, setFilters] = React.useState<SalesReportFilters>(() => ({
    employee: null,
    accountIds: [],
    months: [],
    year: new Date().getFullYear(),
  }));

  const [loading, setLoading] = React.useState(false);
  const [rows, setRows] = React.useState<SalesReportRow[]>([]);
  const [invoices, setInvoices] = React.useState<SalesInvoiceRow[]>([]);
  const [kpis, setKpis] = React.useState<SalesReportKpis | null>(null);

  async function loadLookups() {
    setLoadingLookups(true);
    try {
      const data = await getLookups();
      setEmployees(data.employees ?? []);
    } catch (e: any) {
      toast.error(e?.message || "Failed to load lookups.");
    } finally {
      setLoadingLookups(false);
    }
  }

  async function generate() {
    if (!filters.employee) return toast.error("Please select an employee.");
    if (!filters.accountIds.length) return toast.error("Please select at least 1 account.");
    if (!filters.months.length) return toast.error("Please select at least 1 month.");

    setLoading(true);
    try {
      const data = await getSalesReport({
        year: filters.year,
        months: filters.months,
        salesman_ids: filters.accountIds,
      });

      setRows(data.rows ?? []);
      setInvoices(data.invoices ?? []);
      setKpis(data.kpis ?? null);
    } catch (e: any) {
      toast.error(e?.message || "Failed to generate report.");
    } finally {
      setLoading(false);
    }
  }

  return {
    employees,
    loadingLookups,
    loadLookups,

    filters,
    setFilters,

    loading,
    rows,
    invoices,
    kpis,

    generate,
  };
}
