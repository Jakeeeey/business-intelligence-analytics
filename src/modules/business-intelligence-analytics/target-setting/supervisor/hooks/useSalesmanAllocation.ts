"use client";

import * as React from "react";
import { toast } from "sonner";

import type {
  SalesmanRow,
  StatusCode,
  SupplierRow,
  TargetSettingSalesmanRow,
  TargetSettingSupplierRow,
  UpsertSalesmanAllocationPayload,
} from "../types";

import {
  listSalesmen,
  listSuppliers,
  listTargetSettingSuppliers,
  listSalesmanAllocations,
  createSalesmanAllocation,
  updateSalesmanAllocation,
  deleteSalesmanAllocation,
} from "../providers/fetchProvider";

function errMsg(e: any) {
  return String(e?.message ?? e ?? "Unknown error");
}

export function useSalesmanAllocation() {
  const [loading, setLoading] = React.useState(true);
  const [acting, setActing] = React.useState(false);

  const [salesmen, setSalesmen] = React.useState<SalesmanRow[]>([]);
  const [suppliers, setSuppliers] = React.useState<SupplierRow[]>([]);
  const [tsSuppliers, setTsSuppliers] = React.useState<TargetSettingSupplierRow[]>([]);

  // dropdown state
  const [fiscalPeriod, setFiscalPeriod] = React.useState<string>("");
  const [supplierId, setSupplierId] = React.useState<number | null>(null);
  const [salesmanId, setSalesmanId] = React.useState<number | null>(null);

  // readonly supplier target (still computed if needed elsewhere)
  const supplierTarget = React.useMemo(() => {
    if (!fiscalPeriod || supplierId == null) return null;
    return (
      tsSuppliers.find(
        (r) => r.fiscal_period === fiscalPeriod && r.supplier_id === supplierId
      ) ?? null
    );
  }, [tsSuppliers, fiscalPeriod, supplierId]);

  // form inputs for salesman allocation
  const [salesmanTargetAmount, setSalesmanTargetAmount] = React.useState<string>("");

  // status removed from UI -> always DRAFT
  const [status, setStatus] = React.useState<StatusCode>("DRAFT");

  // list table rows (ONLY saved allocations for selected fiscal + supplier)
  const [rows, setRows] = React.useState<TargetSettingSalesmanRow[]>([]);

  const supplierById = React.useMemo(() => {
    const map: Record<number, SupplierRow> = {};
    for (const s of suppliers) map[s.id] = s;
    return map;
  }, [suppliers]);

  const salesmanById = React.useMemo(() => {
    const map: Record<number, SalesmanRow> = {};
    for (const s of salesmen) map[s.id] = s;
    return map;
  }, [salesmen]);

  // Fiscal options from target_setting_supplier
  const fiscalOptions = React.useMemo(() => {
    const set = new Set<string>();
    for (const r of tsSuppliers) set.add(r.fiscal_period);
    return Array.from(set).sort((a, b) => (a > b ? -1 : 1));
  }, [tsSuppliers]);

  /**
   * Supplier options are sourced from target_setting_supplier for the selected fiscal period,
   * but label comes from suppliers table, and we include target_amount in the option.
   */
  const supplierOptions = React.useMemo(() => {
    if (!fiscalPeriod) return [];

    // supplier_id -> target_amount for that fiscal period
    const map: Record<number, number> = {};
    for (const r of tsSuppliers) {
      if (r.fiscal_period === fiscalPeriod) {
        map[r.supplier_id] = Number(r.target_amount ?? 0);
      }
    }

    return Object.keys(map)
      .map((k) => {
        const id = Number(k);
        const name = supplierById[id]?.supplier_name ?? `Supplier #${id}`;
        const target_amount = map[id] ?? 0;
        return { id, label: name, target_amount };
      })
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [tsSuppliers, fiscalPeriod, supplierById]);

  const refreshBase = React.useCallback(async () => {
    try {
      setLoading(true);
      const [sm, sp, tss] = await Promise.all([
        listSalesmen(),
        listSuppliers(),
        listTargetSettingSuppliers(),
      ]);

      setSalesmen(sm);
      setSuppliers(sp);
      setTsSuppliers(tss);

      // default fiscal period (latest)
      const fps = Array.from(new Set(tss.map((x) => x.fiscal_period))).sort((a, b) =>
        a > b ? -1 : 1
      );
      if (fps.length && !fiscalPeriod) setFiscalPeriod(fps[0]);
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setLoading(false);
    }
  }, [fiscalPeriod]);

  React.useEffect(() => {
    refreshBase();
  }, [refreshBase]);

  const refreshRows = React.useCallback(async () => {
    if (!fiscalPeriod || supplierId == null) {
      setRows([]);
      return;
    }
    try {
      const r = await listSalesmanAllocations({
        fiscal_period: fiscalPeriod,
        supplier_id: supplierId,
      });
      setRows(r);
    } catch (e) {
      toast.error(errMsg(e));
    }
  }, [fiscalPeriod, supplierId]);

  React.useEffect(() => {
    refreshRows();
  }, [refreshRows]);

  async function saveAllocation(editingId?: number) {
    if (!fiscalPeriod) return toast.error("Fiscal Period is required.");
    if (supplierId == null) return toast.error("Supplier is required.");
    if (salesmanId == null) return toast.error("Salesman is required.");

    const amt = Number(salesmanTargetAmount);
    if (!Number.isFinite(amt) || amt < 0) {
      return toast.error("Enter a valid Salesman Target Share.");
    }

    const payload: UpsertSalesmanAllocationPayload = {
      ts_supervisor_id: null,
      fiscal_period: fiscalPeriod,
      supplier_id: supplierId,
      salesman_id: salesmanId,
      target_amount: amt,
      status: "DRAFT", // forced (status UI removed)
    };

    try {
      setActing(true);

      if (editingId) {
        await updateSalesmanAllocation(editingId, payload);
        toast.success("Allocation updated.");
      } else {
        // auto-upsert per salesman per supplier per period
        const existing = rows.find(
          (x) =>
            x.fiscal_period === fiscalPeriod &&
            x.supplier_id === supplierId &&
            x.salesman_id === salesmanId
        );

        if (existing) {
          await updateSalesmanAllocation(existing.id, payload);
          toast.success("Allocation updated (existing).");
        } else {
          await createSalesmanAllocation(payload);
          toast.success("Allocation created.");
        }
      }

      await refreshRows();
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setActing(false);
    }
  }

  async function removeAllocation(id: number) {
    try {
      setActing(true);
      await deleteSalesmanAllocation(id);
      toast.success("Allocation deleted.");
      await refreshRows();
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setActing(false);
    }
  }

  function loadRowToForm(r: TargetSettingSalesmanRow) {
    setSalesmanId(r.salesman_id);
    setSalesmanTargetAmount(String(r.target_amount ?? ""));
    setStatus("DRAFT"); // keep forced
  }

  // When fiscal changes, reset supplier selection + rows until supplier chosen
  React.useEffect(() => {
    setSupplierId(null);
    setRows([]);
  }, [fiscalPeriod]);

  return {
    loading,
    acting,

    salesmen,
    suppliers,

    tsSuppliers,
    fiscalOptions,
    supplierOptions,

    fiscalPeriod,
    setFiscalPeriod,

    supplierId,
    setSupplierId,

    supplierTarget,

    salesmanId,
    setSalesmanId,

    salesmanTargetAmount,
    setSalesmanTargetAmount,

    status,
    setStatus,

    rows,
    refreshRows,

    supplierById,
    salesmanById,

    saveAllocation,
    removeAllocation,
    loadRowToForm,
  };
}
