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
  HierarchyLogRow,
  TargetSettingExecutiveRow,
  TargetSettingDivisionRow,
} from "../types";

import {
  listSalesmen,
  listSuppliers,
  listTargetSettingSuppliers,
  listSalesmanAllocations,
  createSalesmanAllocation,
  updateSalesmanAllocation,
  deleteSalesmanAllocation,
  listExecutiveTargets,
  readDivisionTarget,
  listSupplierTargetsByTsd,
} from "../providers/fetchProvider";

function errMsg(e: any) {
  return String(e?.message ?? e ?? "Unknown error");
}

function toNum(v: any) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

/** ✅ Prevent "January 1970" by filtering invalid fiscal_period values */
function isValidFiscalPeriod(v: any): v is string {
  return (
    typeof v === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(v) &&
    !Number.isNaN(Date.parse(v))
  );
}

export function useSalesmanAllocation() {
  const [loading, setLoading] = React.useState(true);
  const [acting, setActing] = React.useState(false);

  const [salesmen, setSalesmen] = React.useState<SalesmanRow[]>([]);
  const [suppliers, setSuppliers] = React.useState<SupplierRow[]>([]);
  const [tsSuppliers, setTsSuppliers] = React.useState<TargetSettingSupplierRow[]>([]);

  const [fiscalPeriod, setFiscalPeriod] = React.useState<string>("");
  const [supplierId, setSupplierId] = React.useState<number | null>(null);
  const [salesmanId, setSalesmanId] = React.useState<number | null>(null);

  const [salesmanTargetAmount, setSalesmanTargetAmount] = React.useState<string>("");
  const [status, setStatus] = React.useState<StatusCode>("DRAFT");

  const [rows, setRows] = React.useState<TargetSettingSalesmanRow[]>([]);

  /* -------- Hierarchy (NEW) -------- */
  const [hierarchyLoading, setHierarchyLoading] = React.useState(false);
  const [hierarchyRows, setHierarchyRows] = React.useState<HierarchyLogRow[]>([]);

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

  const supplierTargetRow = React.useMemo(() => {
    if (!fiscalPeriod || supplierId == null) return null;
    return tsSuppliers.find((r) => r.fiscal_period === fiscalPeriod && r.supplier_id === supplierId) ?? null;
  }, [tsSuppliers, fiscalPeriod, supplierId]);

  const supplierTargetAmount = React.useMemo(
    () => toNum(supplierTargetRow?.target_amount),
    [supplierTargetRow]
  );

  /** ✅ FIXED: only include valid YYYY-MM-DD fiscal periods */
  const fiscalOptions = React.useMemo(() => {
    const set = new Set<string>();
    for (const r of tsSuppliers) {
      if (isValidFiscalPeriod(r.fiscal_period)) set.add(r.fiscal_period);
    }
    return Array.from(set).sort((a, b) => (a > b ? -1 : 1));
  }, [tsSuppliers]);

  const supplierOptions = React.useMemo(() => {
    if (!fiscalPeriod) return [];
    const map: Record<number, number> = {};
    for (const r of tsSuppliers) {
      if (r.fiscal_period === fiscalPeriod) map[r.supplier_id] = toNum(r.target_amount);
    }

    return Object.keys(map)
      .map((k) => {
        const id = Number(k);
        const supName = supplierById[id]?.supplier_name ?? `Supplier #${id}`;
        return { id, label: supName, target_amount: map[id] ?? 0 };
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

      /** ✅ FIXED: only compute options from valid fiscal_period strings */
      const fps = Array.from(
        new Set(tss.map((x) => x.fiscal_period).filter(isValidFiscalPeriod))
      ).sort((a, b) => (a > b ? -1 : 1));

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
      const r = await listSalesmanAllocations({ fiscal_period: fiscalPeriod, supplier_id: supplierId });
      setRows(r);
    } catch (e) {
      toast.error(errMsg(e));
    }
  }, [fiscalPeriod, supplierId]);

  React.useEffect(() => {
    refreshRows();
  }, [refreshRows]);

  function validateNotExceedSupplierTarget(params: { newAmount: number; editingId?: number }) {
    if (supplierTargetAmount <= 0) {
      if (params.newAmount > 0) {
        toast.error("Supplier target is missing or zero. Please set supplier target first.");
        return false;
      }
      return true;
    }

    const otherAllocated = rows.reduce((sum, r) => {
      if (params.editingId && r.id === params.editingId) return sum;
      return sum + toNum(r.target_amount);
    }, 0);

    const newTotal = otherAllocated + params.newAmount;
    if (newTotal > supplierTargetAmount) {
      const remaining = supplierTargetAmount - otherAllocated;
      toast.error(
        `Cannot exceed Supplier Target. Remaining available is ₱${remaining.toLocaleString("en-PH")}.`
      );
      return false;
    }
    return true;
  }

  /* -------- Hierarchy fetch (NEW) -------- */
  const refreshHierarchy = React.useCallback(async () => {
    try {
      setHierarchyLoading(true);

      if (!fiscalPeriod) {
        setHierarchyRows([]);
        return;
      }

      // 1) Executive target (latest)
      const exec: TargetSettingExecutiveRow[] = await listExecutiveTargets({ fiscal_period: fiscalPeriod });
      const execRow = exec?.[0];

      // 2) Division target derived from selected supplier target’s tsd_id (if available)
      let division: TargetSettingDivisionRow | null = null;
      let tsdId: number | null = null;

      if (supplierTargetRow?.tsd_id) {
        tsdId = Number(supplierTargetRow.tsd_id);
        division = await readDivisionTarget(tsdId);
      }

      // 3) Supplier allocations under the same division target (tsd_id)
      const supplierAllocations =
        tsdId != null ? await listSupplierTargetsByTsd({ fiscal_period: fiscalPeriod, tsd_id: tsdId }) : [];

      const out: HierarchyLogRow[] = [];

      if (execRow?.id) {
        out.push({
          key: `exec-${execRow.id}`,
          creatorRole: "Executive",
          context: "Company Wide",
          targetAmount: toNum(execRow.target_amount),
          status: execRow.status ?? "DRAFT",
        });
      }

      if (division?.id) {
        const ctx = division?.division_name
          ? String(division.division_name)
          : division?.division_id != null
          ? `Division #${division.division_id}`
          : "Division Allocation";

        out.push({
          key: `div-${division.id}`,
          creatorRole: "Div Manager",
          context: ctx,
          targetAmount: toNum(division.target_amount),
          status: division.status ?? "DRAFT",
        });
      }

      // Supplier rows: show all supplier allocations under that division target
      for (const s of supplierAllocations) {
        const name = supplierById[s.supplier_id]?.supplier_name ?? `Supplier #${s.supplier_id}`;
        const divisionCtx =
          division?.division_name
            ? String(division.division_name)
            : division?.division_id != null
            ? `Division #${division.division_id}`
            : "Division";

        out.push({
          key: `sup-${s.id}`,
          creatorRole: "Div Manager",
          context: `${divisionCtx} - ${name}`,
          targetAmount: toNum(s.target_amount),
          status: s.status ?? "DRAFT",
        });
      }

      setHierarchyRows(out);
    } catch (e) {
      toast.error(errMsg(e));
      setHierarchyRows([]);
    } finally {
      setHierarchyLoading(false);
    }
  }, [fiscalPeriod, supplierTargetRow?.tsd_id, supplierById]);

  React.useEffect(() => {
    refreshHierarchy();
  }, [refreshHierarchy]);

  async function saveAllocation(editingId?: number) {
    if (!fiscalPeriod) return toast.error("Fiscal Period is required.");
    if (supplierId == null) return toast.error("Supplier is required.");
    if (salesmanId == null) return toast.error("Salesman is required.");

    const amt = Number(salesmanTargetAmount);
    if (!Number.isFinite(amt) || amt < 0) return toast.error("Enter a valid Salesman Target Share.");

    if (!validateNotExceedSupplierTarget({ newAmount: amt, editingId })) return;

    const payload: UpsertSalesmanAllocationPayload = {
      fiscal_period: fiscalPeriod,
      supplier_id: supplierId,
      salesman_id: salesmanId,
      target_amount: amt,
      status: "DRAFT",
    };

    try {
      setActing(true);

      if (editingId) {
        await updateSalesmanAllocation(editingId, payload);
        toast.success("Allocation updated.");
      } else {
        const existing = rows.find(
          (x) => x.fiscal_period === fiscalPeriod && x.supplier_id === supplierId && x.salesman_id === salesmanId
        );

        if (existing) {
          if (!validateNotExceedSupplierTarget({ newAmount: amt, editingId: existing.id })) return;
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
    setStatus("DRAFT");
  }

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

    supplierTarget: supplierTargetRow,
    supplierTargetAmount,

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

    // NEW
    hierarchyLoading,
    hierarchyRows,
  };
}
