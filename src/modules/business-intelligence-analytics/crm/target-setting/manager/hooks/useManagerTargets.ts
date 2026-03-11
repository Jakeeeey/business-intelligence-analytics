// src/modules/business-intelligence-analytics/target-setting/manager/hooks/useManagerTargets.ts
"use client";

import * as React from "react";
import { toast } from "sonner";

import type {
  AllocationLogRow,
  ManagerBootstrapResponse,
  TargetSettingDivision,
  TargetSettingExecutive,
  TargetSettingSupplier,
  TargetSettingSupervisor,
  UserRow,
  SupervisorPerDivisionRow,
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

type SupervisorOption = {
  id: number;
  name: string;
};

function formatFiscalPeriodLabel(input: unknown, fallbackId: number) {
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

function isTradeSupplier(supplierType: unknown) {
  const v = String(supplierType ?? "").trim().toUpperCase();
  return v === "TRADE";
}

function normalizeStatus(v: unknown): AllocationLogRow["status"] {
  const s = String(v ?? "").trim().toUpperCase();
  const allowed = new Set(["DRAFT", "SUBMITTED", "PENDING", "APPROVED", "REJECTED", "SET"]);
  return (allowed.has(s) ? (s as AllocationLogRow["status"]) : "SET");
}

function fullName(u: UserRow) {
  const parts = [u.user_fname, u.user_mname, u.user_lname]
    .map((x) => String(x ?? "").trim())
    .filter(Boolean);
  return parts.join(" ").trim() || `User #${u.user_id}`;
}

/**
 * ✅ FIX: Buffer-safe is_deleted check.
 * Directus sometimes returns:
 * { type: "Buffer", data: [0|1] }
 */
function isNotDeleted(v: unknown) {
  if (v && typeof v === "object") {
    const maybeBuf = v as Record<string, unknown>;
    if (maybeBuf.type === "Buffer" && Array.isArray(maybeBuf.data)) {
      const b = Number(maybeBuf.data?.[0] ?? 0);
      return b === 0;
    }
  }

  if (typeof v === "number") return v === 0;
  if (typeof v === "boolean") return !v;

  const s = String(v ?? "").trim().toLowerCase();
  if (!s) return true;
  return s === "0" || s === "false";
}

export function useManagerTargets() {
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  const [raw, setRaw] = React.useState<ManagerBootstrapResponse | null>(null);

  const [selectedExecutiveId, setSelectedExecutiveId] = React.useState<number | null>(null);
  const [selectedDivisionTsdId, setSelectedDivisionTsdId] = React.useState<number | null>(null);
  const [selectedSupplierId, setSelectedSupplierId] = React.useState<number | null>(null);
  const [selectedSupervisorId, setSelectedSupervisorId] = React.useState<number | null>(null);

  const [targetAmountInput, setTargetAmountInput] = React.useState<string>("");

  const execOptions = React.useMemo(() => {
    const list = raw?.target_setting_executive ?? [];
    return list
      .slice()
      .sort((a, b) => String((a as Record<string, unknown>).fiscal_period ?? "").localeCompare(String((b as Record<string, unknown>).fiscal_period ?? "")))
      .map((e) => ({
        id: e.id,
        label: formatFiscalPeriodLabel((e as Record<string, unknown>).fiscal_period, e.id),
        raw: e,
      }));
  }, [raw]);

  const selectedExecutive = React.useMemo<TargetSettingExecutive | null>(() => {
    if (!raw || !selectedExecutiveId) return null;
    return (raw.target_setting_executive ?? []).find((x) => x.id === selectedExecutiveId) ?? null;
  }, [raw, selectedExecutiveId]);

  /**
   * ✅ FIX: Use real logged-in user id from API:
   * raw.current_user_id
   * and allow Buffer-safe is_deleted filtering.
   */
  const divisionOptions = React.useMemo<DivisionOption[]>(() => {
    if (!raw || !selectedExecutiveId) return [];

    const currentUserId = raw.current_user_id;

    const allowedDivisionIds = new Set<number>();
    if (currentUserId) {
      const dsh = raw.division_sales_head ?? [];
      dsh
        .filter((r) => Number(r.user_id) === Number(currentUserId))
        .filter((r) => isNotDeleted((r as Record<string, unknown>).is_deleted))
        .forEach((r) => allowedDivisionIds.add(Number(r.division_id)));
    }

    const divTargets = (raw.target_setting_division ?? []).filter((x) => x.tse_id === selectedExecutiveId);
    const divisions = raw.division ?? [];

    return divTargets
      .map((tsd) => {
        const d = divisions.find((z) => z.division_id === tsd.division_id);
        const divisionName = d?.division_name ?? `Division #${tsd.division_id}`;
        return { tsd, divisionName, divisionId: tsd.division_id } as DivisionOption & { divisionId: number };
      })
      .filter((item) => {
        // strict only when we have current user
        if (currentUserId) return allowedDivisionIds.has(Number(item.divisionId));
        // fallback if no cookie/auth
        return true;
      })
      .sort((a, b) => a.divisionName.localeCompare(b.divisionName));
  }, [raw, selectedExecutiveId]);

  const selectedDivisionTarget = React.useMemo<TargetSettingDivision | null>(() => {
    if (!raw || !selectedDivisionTsdId) return null;
    return (raw.target_setting_division ?? []).find((x) => x.id === selectedDivisionTsdId) ?? null;
  }, [raw, selectedDivisionTsdId]);

  const supplierOptions = React.useMemo<SupplierOption[]>(() => {
    const suppliers = raw?.suppliers ?? [];
    return suppliers
      .filter((s: Record<string, unknown>) => Number(s?.isActive ?? 1) === 1)
      .filter((s: Record<string, unknown>) => isTradeSupplier(s?.supplier_type))
      .map((s: Record<string, unknown>) => ({
        id: Number(s.id),
        name: String(s.supplier_name ?? "").trim() || `Supplier #${s.id}`,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [raw]);

  /**
   * ✅ JOIN supervisor_per_division -> user, filtered by selected division
   * Only show supervisors mapped to that division (is_deleted=0).
   */
  const supervisorOptions = React.useMemo<SupervisorOption[]>(() => {
    if (!raw) return [];

    const users = raw.users ?? [];
    const spd: SupervisorPerDivisionRow[] = (raw.supervisor_per_division ?? []) as SupervisorPerDivisionRow[];

    const divisionId = selectedDivisionTarget?.division_id ?? null;
    if (!divisionId) return [];

    const allowedSupervisorIds = new Set<number>(
      spd
        .filter((r) => Number(r?.division_id) === Number(divisionId))
        .filter((r) => isNotDeleted(r?.is_deleted))
        .map((r) => Number(r?.supervisor_id))
        .filter((id) => Number.isFinite(id) && id > 0),
    );

    return users
      .filter((u) => allowedSupervisorIds.has(Number(u.user_id)))
      .map((u) => ({ id: Number(u.user_id), name: fullName(u) }))
      .filter((u) => Number.isFinite(u.id) && u.id > 0 && u.name.trim())
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [raw, selectedDivisionTarget]);

  // reset supervisor when division changes (important)
  React.useEffect(() => {
    setSelectedSupervisorId(null);
  }, [selectedDivisionTsdId]);

  const supplierAllocationsForSelectedDivision = React.useMemo<TargetSettingSupplier[]>(() => {
    if (!raw || !selectedDivisionTsdId) return [];
    return (raw.target_setting_supplier ?? []).filter((x) => x.tsd_id === selectedDivisionTsdId);
  }, [raw, selectedDivisionTsdId]);

  const supervisorAllocationsForSelectedDivision = React.useMemo<TargetSettingSupervisor[]>(() => {
    if (!raw || !supplierAllocationsForSelectedDivision.length) return [];
    const supplierIds = new Set(supplierAllocationsForSelectedDivision.map((s) => s.id));
    return (raw.target_setting_supervisor ?? []).filter((sv) => supplierIds.has(sv.tss_id));
  }, [raw, supplierAllocationsForSelectedDivision]);

  const supervisorNamesByAllocationId = React.useCallback(
    (supplierAllocationId: number): string => {
      if (!raw) return "";
      const supervisorRows = (raw.target_setting_supervisor ?? []).filter((sv) => sv.tss_id === supplierAllocationId);
      if (supervisorRows.length === 0) return "—";
      const users = raw.users ?? [];
      return supervisorRows
        .map((sv) => {
          // Use loose comparison for ID match
          const u = users.find((usr) => String(usr.user_id) === String(sv.supervisor_user_id));
          if (!u) return `User #${sv.supervisor_user_id}`;
          return fullName(u);
        })
        .join(", ");
    },
    [raw],
  );

  const allocationLog = React.useMemo<AllocationLogRow[]>(() => {
    if (!raw || !selectedExecutiveId) return [];

    const out: AllocationLogRow[] = [];

    const exec = (raw.target_setting_executive ?? []).find((x) => x.id === selectedExecutiveId);
    const execStatus = normalizeStatus((exec as Record<string, unknown>)?.status);

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
      const divStatus = normalizeStatus((tsd as Record<string, unknown>).status ?? execStatus);

      out.push({
        id: `div-${tsd.id}`,
        creatorRole: "Manager",
        contextAssignedTo: d?.division_name ?? `Division #${tsd.division_id}`,
        detail: "DIVISION ALLOCATION",
        targetAmount: tsd.target_amount,
        status: divStatus,
      });
    });

    const suppliers = raw.suppliers ?? [];
    const suppTargets = raw.target_setting_supplier ?? [];

    suppTargets.forEach((tss) => {
      const tsd = (raw.target_setting_division ?? []).find((x) => x.id === tss.tsd_id);
      if (!tsd) return;
      if (tsd.tse_id !== selectedExecutiveId) return;

      const d = divisions.find((z) => z.division_id === tsd.division_id);
      const s = (suppliers as Record<string, unknown>[]).find((z) => Number(z.id) === tss.supplier_id);

      const supplierStatus = normalizeStatus((tss as Record<string, unknown>).status ?? execStatus);

      out.push({
        id: `supp-${tss.id}`,
        creatorRole: "Manager",
        contextAssignedTo: `${d?.division_name ?? `Div #${tsd.division_id}`} - ${String(
          s?.supplier_name ?? `Supplier #${tss.supplier_id}`,
        )}`,
        detail: "SUPPLIER ALLOCATION",
        targetAmount: tss.target_amount,
        status: supplierStatus,
      });
    });

    return out;
  }, [raw, selectedExecutiveId]);

  const totals = React.useMemo(() => {
    const divisionTarget = selectedDivisionTarget?.target_amount ?? 0;
    const allocatedToSuppliers = supplierAllocationsForSelectedDivision.reduce((sum, x) => sum + (Number(x.target_amount) || 0), 0);
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
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to load data.");
    } finally {
      setLoading(false);
    }
  }

  async function reload() {
    setRefreshing(true);
    try {
      const data = await bootstrapManagerTargets();
      setRaw(data);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to refresh data.");
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
    setSelectedSupervisorId(null);
    setTargetAmountInput("");
  }, [selectedExecutiveId]);

  async function saveAllocation() {
    if (!selectedExecutiveId) return toast.error("Please select fiscal period.");
    if (!selectedDivisionTsdId) return toast.error("Please select your division.");
    if (!selectedSupplierId) return toast.error("Please select supplier.");
    if (!selectedSupervisorId) return toast.error("Please select supervisor.");

    const target_amount = Number(String(targetAmountInput).replace(/[^\d.]/g, ""));
    if (!Number.isFinite(target_amount) || target_amount <= 0) {
      return toast.error("Supplier target share must be greater than 0.");
    }

    const supervisorRows = raw?.target_setting_supervisor ?? [];
    const existing = supplierAllocationsForSelectedDivision.find((x) => {
      if (x.supplier_id !== selectedSupplierId) return false;
      return supervisorRows.some((sv) => sv.tss_id === x.id && sv.supervisor_user_id === selectedSupervisorId);
    });

    if (!existing) {
      if (totals.rawRemaining <= 0) return toast.error("Remaining is 0. You cannot allocate more for this division.");
      if (target_amount > totals.remaining) return toast.error(`Cannot allocate more than remaining (${formatPeso(totals.remaining)}).`);
    } else {
      const prev = Number(existing.target_amount) || 0;
      const delta = target_amount - prev;
      if (delta > 0) {
        if (totals.rawRemaining <= 0) return toast.error("Remaining is 0. You cannot increase this allocation.");
        if (delta > totals.remaining) return toast.error(`Increase exceeds remaining (${formatPeso(totals.remaining)}).`);
      }
    }

    try {
      if (existing) {
        await updateSupplierAllocation({ id: existing.id, target_amount, supervisor_user_id: selectedSupervisorId });
        toast.success("Allocation updated.");
      } else {
        await createSupplierAllocation({
          tsd_id: selectedDivisionTsdId,
          supplier_id: selectedSupplierId,
          target_amount,
          supervisor_user_id: selectedSupervisorId,
        });
        toast.success("Allocation saved.");
      }
      await reload();
      setTargetAmountInput("");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to save allocation.");
    }
  }

  async function removeAllocation(id: number) {
    try {
      await deleteSupplierAllocation(id);
      toast.success("Allocation deleted.");
      await reload();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to delete allocation.");
    }
  }

  function loadRowToForm(row: TargetSettingSupplier) {
    setSelectedSupplierId(row.supplier_id);
    setTargetAmountInput(String(row.target_amount));

    if (raw) {
      const supervisorRows = (raw.target_setting_supervisor ?? []).filter((sv) => sv.tss_id === row.id);
      if (supervisorRows.length > 0) {
        setSelectedSupervisorId(supervisorRows[0].supervisor_user_id);
      } else {
        setSelectedSupervisorId(null);
      }
    }
  }

  return {
    loading,
    refreshing,

    execOptions,
    divisionOptions,
    supplierOptions,
    supervisorOptions,

    selectedExecutiveId,
    setSelectedExecutiveId,

    selectedDivisionTsdId,
    setSelectedDivisionTsdId,

    selectedSupplierId,
    setSelectedSupplierId,

    selectedSupervisorId,
    setSelectedSupervisorId,

    targetAmountInput,
    setTargetAmountInput,

    selectedExecutive,
    selectedDivisionTarget,

    supplierAllocationsForSelectedDivision,
    supervisorAllocationsForSelectedDivision,
    supervisorNamesByAllocationId,
    allocationLog,

    totals,
    formatPeso,

    saveAllocation,
    removeAllocation,
    loadRowToForm,
    reload,
  };
}
