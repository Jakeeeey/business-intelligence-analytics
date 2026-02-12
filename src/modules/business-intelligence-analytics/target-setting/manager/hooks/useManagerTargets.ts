"use client";

import * as React from "react";
import { toast } from "sonner";

import type {
  AllocationLogRow,
  ManagerBootstrapResponse,
  TargetSettingDivision,
  TargetSettingExecutive,
  TargetSettingSupplier,
} from "../types";

import {
  bootstrapManagerTargets,
  createSupplierAllocation,
  deleteSupplierAllocation,
  updateSupplierAllocation,
} from "../providers/fetchProvider";

import { formatPeso } from "../utils/format";

type DivisionOption = {
  tsd: TargetSettingDivision;
  divisionName: string;
};

type SupplierOption = {
  id: number;
  name: string;
};

function formatFiscalPeriodLabel(input: any, fallbackId: number) {
  const raw = String(input ?? "").trim();
  if (!raw) return `Fiscal #${fallbackId}`;

  const m = raw.match(/^(\d{4})-(\d{2})(?:-(\d{2}))?/);
  if (!m) return raw;

  const year = Number(m[1]);
  const month = Number(m[2]);
  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) return raw;

  const date = new Date(Date.UTC(year, month - 1, 1));
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
}

function isTradeSupplier(supplierType: any) {
  const v = String(supplierType ?? "").trim().toUpperCase();
  return v === "TRADE";
}

// ✅ normalize any status string to a safe UI status enum string
function normalizeStatus(v: any): AllocationLogRow["status"] {
  const s = String(v ?? "").trim().toUpperCase();

  // Prefer your backend strings
  if (s === "APPROVED") return "APPROVED";
  if (s === "PENDING") return "PENDING";
  if (s === "REJECTED") return "REJECTED";
  if (s === "SUBMITTED") return "SUBMITTED";
  if (s === "DRAFT") return "DRAFT";

  // fallback: if empty, assume SET (consistent with your old behavior)
  return "DRAFT";
}

export function useManagerTargets() {
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  const [raw, setRaw] = React.useState<ManagerBootstrapResponse | null>(null);

  const [selectedExecutiveId, setSelectedExecutiveId] = React.useState<number | null>(null);
  const [selectedDivisionTsdId, setSelectedDivisionTsdId] = React.useState<number | null>(null);
  const [selectedSupplierId, setSelectedSupplierId] = React.useState<number | null>(null);

  const [targetAmountInput, setTargetAmountInput] = React.useState<string>("");

  const execOptions = React.useMemo(() => {
    const list = raw?.target_setting_executive ?? [];
    return list
      .slice()
      .sort((a, b) => String((a as any).fiscal_period ?? "").localeCompare(String((b as any).fiscal_period ?? "")))
      .map((e) => ({
        id: e.id,
        label: formatFiscalPeriodLabel((e as any).fiscal_period, e.id),
        raw: e,
      }));
  }, [raw]);

  const selectedExecutive = React.useMemo<TargetSettingExecutive | null>(() => {
    if (!raw || !selectedExecutiveId) return null;
    return (raw.target_setting_executive ?? []).find((x) => x.id === selectedExecutiveId) ?? null;
  }, [raw, selectedExecutiveId]);

  const divisionOptions = React.useMemo<DivisionOption[]>(() => {
    if (!raw || !selectedExecutiveId) return [];
    const divTargets = (raw.target_setting_division ?? []).filter((x) => x.tse_id === selectedExecutiveId);
    const divisions = raw.division ?? [];

    return divTargets
      .map((tsd) => {
        const d = divisions.find((z) => z.division_id === tsd.division_id);
        const divisionName = d?.division_name ?? `Division #${tsd.division_id}`;
        return { tsd, divisionName };
      })
      .sort((a, b) => a.divisionName.localeCompare(b.divisionName));
  }, [raw, selectedExecutiveId]);

  const selectedDivisionTarget = React.useMemo<TargetSettingDivision | null>(() => {
    if (!raw || !selectedDivisionTsdId) return null;
    return (raw.target_setting_division ?? []).find((x) => x.id === selectedDivisionTsdId) ?? null;
  }, [raw, selectedDivisionTsdId]);

  // ✅ ONLY TRADE suppliers + active
  const supplierOptions = React.useMemo<SupplierOption[]>(() => {
    const suppliers = raw?.suppliers ?? [];
    return suppliers
      .filter((s: any) => Number(s?.isActive ?? 1) === 1)
      .filter((s: any) => isTradeSupplier(s?.supplier_type))
      .map((s: any) => ({ id: Number(s.id), name: String(s.supplier_name ?? "").trim() || `Supplier #${s.id}` }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [raw]);

  const supplierAllocationsForSelectedDivision = React.useMemo<TargetSettingSupplier[]>(() => {
    if (!raw || !selectedDivisionTsdId) return [];
    return (raw.target_setting_supplier ?? []).filter((x) => x.tsd_id === selectedDivisionTsdId);
  }, [raw, selectedDivisionTsdId]);

  /**
   * ✅ Allocation hierarchy status rule (per your instruction):
   * Executive → Manager → Supervisor
   * Whatever Executive status is, all lower levels show the same status.
   */
  const allocationLog = React.useMemo<AllocationLogRow[]>(() => {
    if (!raw || !selectedExecutiveId) return [];

    const out: AllocationLogRow[] = [];

    const exec = (raw.target_setting_executive ?? []).find((x) => x.id === selectedExecutiveId);
    const execStatus = normalizeStatus((exec as any)?.status);

    if (exec) {
      out.push({
        id: `exec-${exec.id}`,
        creatorRole: "Executive",
        contextAssignedTo: "Company Wide",
        detail: "TOTAL COMPANY GOAL",
        targetAmount: exec.target_amount,
        status: execStatus,
      });
    }

    const divTargets = (raw.target_setting_division ?? []).filter((x) => x.tse_id === selectedExecutiveId);
    const divisions = raw.division ?? [];

    divTargets.forEach((tsd) => {
      const d = divisions.find((z) => z.division_id === tsd.division_id);
      out.push({
        id: `div-${tsd.id}`,
        creatorRole: "Manager",
        contextAssignedTo: d?.division_name ?? `Division #${tsd.division_id}`,
        detail: "DIVISION ALLOCATION",
        targetAmount: tsd.target_amount,
        status: execStatus, // ✅ inherit
      });
    });

    const suppliers = raw.suppliers ?? [];
    const suppTargets = raw.target_setting_supplier ?? [];

    suppTargets.forEach((tss) => {
      const tsd = (raw.target_setting_division ?? []).find((x) => x.id === tss.tsd_id);
      if (!tsd) return;
      if (tsd.tse_id !== selectedExecutiveId) return;

      const d = divisions.find((z) => z.division_id === tsd.division_id);
      const s = (suppliers as any[]).find((z) => Number(z.id) === tss.supplier_id);

      out.push({
        id: `supp-${tss.id}`,
        creatorRole: "Manager",
        contextAssignedTo: `${d?.division_name ?? `Div #${tsd.division_id}`} - ${String(
          s?.supplier_name ?? `Supplier #${tss.supplier_id}`,
        )}`,
        detail: "SUPPLIER ALLOCATION",
        targetAmount: tss.target_amount,
        status: execStatus, // ✅ inherit
      });
    });

    return out;
  }, [raw, selectedExecutiveId]);

  const totals = React.useMemo(() => {
    const divisionTarget = selectedDivisionTarget?.target_amount ?? 0;
    const allocatedToSuppliers = supplierAllocationsForSelectedDivision.reduce(
      (sum, x) => sum + (Number(x.target_amount) || 0),
      0,
    );

    const rawRemaining = divisionTarget - allocatedToSuppliers;
    const remaining = Math.max(0, rawRemaining);

    return { divisionTarget, allocatedToSuppliers, rawRemaining, remaining };
  }, [selectedDivisionTarget, supplierAllocationsForSelectedDivision]);

  async function load() {
    setLoading(true);
    try {
      const data = await bootstrapManagerTargets();
      setRaw(data);

      const first = (data.target_setting_executive ?? [])[0];
      if (first && !selectedExecutiveId) setSelectedExecutiveId(first.id);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to load data.");
    } finally {
      setLoading(false);
    }
  }

  async function reload() {
    setRefreshing(true);
    try {
      const data = await bootstrapManagerTargets();
      setRaw(data);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to refresh data.");
    } finally {
      setRefreshing(false);
    }
  }

  React.useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    setSelectedDivisionTsdId(null);
    setSelectedSupplierId(null);
    setTargetAmountInput("");
  }, [selectedExecutiveId]);

  async function saveAllocation() {
    if (!selectedExecutiveId) {
      toast.error("Please select fiscal period.");
      return;
    }
    if (!selectedDivisionTsdId) {
      toast.error("Please select your division.");
      return;
    }
    if (!selectedSupplierId) {
      toast.error("Please select supplier.");
      return;
    }

    const target_amount = Number(String(targetAmountInput).replace(/[^\d.]/g, ""));
    if (!Number.isFinite(target_amount) || target_amount <= 0) {
      toast.error("Supplier target share must be greater than 0.");
      return;
    }

    const existing = supplierAllocationsForSelectedDivision.find((x) => x.supplier_id === selectedSupplierId);

    if (!existing) {
      if (totals.rawRemaining <= 0) {
        toast.error("Remaining is 0. You cannot allocate more for this division.");
        return;
      }
      if (target_amount > totals.remaining) {
        toast.error(`Cannot allocate more than remaining (${formatPeso(totals.remaining)}).`);
        return;
      }
    } else {
      const prev = Number(existing.target_amount) || 0;
      const delta = target_amount - prev;

      if (delta > 0) {
        if (totals.rawRemaining <= 0) {
          toast.error("Remaining is 0. You cannot increase this allocation.");
          return;
        }
        if (delta > totals.remaining) {
          toast.error(`Increase exceeds remaining (${formatPeso(totals.remaining)}).`);
          return;
        }
      }
    }

    try {
      if (existing) {
        await updateSupplierAllocation({ id: existing.id, target_amount });
        toast.success("Allocation updated.");
      } else {
        await createSupplierAllocation({ tsd_id: selectedDivisionTsdId, supplier_id: selectedSupplierId, target_amount });
        toast.success("Allocation saved.");
      }
      await reload();
      setTargetAmountInput("");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to save allocation.");
    }
  }

  async function removeAllocation(id: number) {
    try {
      await deleteSupplierAllocation(id);
      toast.success("Allocation deleted.");
      await reload();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to delete allocation.");
    }
  }

  return {
    loading,
    refreshing,

    execOptions,
    divisionOptions,
    supplierOptions,

    selectedExecutiveId,
    setSelectedExecutiveId,

    selectedDivisionTsdId,
    setSelectedDivisionTsdId,

    selectedSupplierId,
    setSelectedSupplierId,

    targetAmountInput,
    setTargetAmountInput,

    selectedExecutive,
    selectedDivisionTarget,

    supplierAllocationsForSelectedDivision,
    allocationLog,

    totals,
    formatPeso,

    saveAllocation,
    removeAllocation,
    reload,
  };
}
