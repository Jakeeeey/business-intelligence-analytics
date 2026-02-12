// "use client";

// import * as React from "react";
// import { toast } from "sonner";

// import type {
//   SalesmanRow,
//   SupplierRow,
//   TargetSettingSalesmanRow,
//   UserRow,
//   StatusCode,
//   UpsertAllocationPayload,
//   TargetSettingSupervisorRow,
//   TargetSettingSupplierRow,
// } from "../types";

// import {
//   listSalesmen,
//   listSuppliers,
//   listUsers,
//   listAllocations,
//   createAllocation,
//   updateAllocation,
//   deleteAllocation,
//   listSupervisorTargets,
//   listSupplierTargets,
// } from "../providers/fetchProvider";

// function safeErr(e: any) {
//   return String(e?.message ?? e ?? "Unknown error");
// }

// export function useSupervisorTargets() {
//   const [loading, setLoading] = React.useState(true);

//   const [fiscalPeriod, setFiscalPeriod] = React.useState<string>(() => {
//     const d = new Date();
//     const y = d.getFullYear();
//     const m = String(d.getMonth() + 1).padStart(2, "0");
//     return `${y}-${m}-01`;
//   });

//   // Supervisor dropdown (users)
//   const [supervisors, setSupervisors] = React.useState<UserRow[]>([]);
//   const [supervisorUserId, setSupervisorUserId] = React.useState<number | null>(null);

//   // Optional: ts_supervisor_id (links allocations to a supervisor target record)
//   const [supervisorTargets, setSupervisorTargets] = React.useState<TargetSettingSupervisorRow[]>([]);
//   const [tsSupervisorId, setTsSupervisorId] = React.useState<number | null>(null);

//   const [salesmen, setSalesmen] = React.useState<SalesmanRow[]>([]);
//   const [suppliers, setSuppliers] = React.useState<SupplierRow[]>([]);

//   const [allocations, setAllocations] = React.useState<TargetSettingSalesmanRow[]>([]);
//   const [supplierTargets, setSupplierTargets] = React.useState<TargetSettingSupplierRow[]>([]);

//   // Quick add controls (top form)
//   const [selectedSupplierId, setSelectedSupplierId] = React.useState<number | null>(null);
//   const [selectedSalesmanId, setSelectedSalesmanId] = React.useState<number | null>(null);
//   const [quickAmount, setQuickAmount] = React.useState<string>("");
//   const [quickStatus, setQuickStatus] = React.useState<StatusCode>("PENDING");

//   const [acting, setActing] = React.useState(false);

//   const refresh = React.useCallback(async () => {
//     try {
//       setLoading(true);
//       const [u, sm, sp] = await Promise.all([listUsers(), listSalesmen(), listSuppliers()]);
//       setSupervisors(u);
//       setSalesmen(sm);
//       setSuppliers(sp);
//     } catch (e) {
//       toast.error(safeErr(e));
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   React.useEffect(() => {
//     refresh();
//   }, [refresh]);

//   // Load supervisor targets when supervisorUserId/fiscal changes
//   React.useEffect(() => {
//     (async () => {
//       try {
//         const rows = await listSupervisorTargets({
//           fiscal_period: fiscalPeriod,
//           supervisor_user_id: supervisorUserId ?? undefined,
//         });
//         setSupervisorTargets(rows);

//         // auto-pick first if exists
//         if (rows.length && tsSupervisorId == null) setTsSupervisorId(rows[0].id);
//         if (!rows.length) setTsSupervisorId(null);
//       } catch (e) {
//         toast.error(safeErr(e));
//       }
//     })();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [fiscalPeriod, supervisorUserId]);

//   // Load supplier targets (for hierarchy log)
//   React.useEffect(() => {
//     (async () => {
//       try {
//         const rows = await listSupplierTargets({
//           fiscal_period: fiscalPeriod,
//           supplier_id: selectedSupplierId ?? undefined,
//         });
//         setSupplierTargets(rows);
//       } catch (e) {
//         toast.error(safeErr(e));
//       }
//     })();
//   }, [fiscalPeriod, selectedSupplierId]);

//   // Load allocations when fiscal/tsSupervisorId changes
//   React.useEffect(() => {
//     (async () => {
//       try {
//         const rows = await listAllocations({
//           fiscal_period: fiscalPeriod,
//           ts_supervisor_id: tsSupervisorId,
//         });
//         setAllocations(rows);
//       } catch (e) {
//         toast.error(safeErr(e));
//       }
//     })();
//   }, [fiscalPeriod, tsSupervisorId]);

//   function findAllocationCell(salesmanId: number, supplierId: number) {
//     return allocations.find((a) => a.salesman_id === salesmanId && a.supplier_id === supplierId) || null;
//   }

//   async function upsertCell(payload: UpsertAllocationPayload, existingId?: number) {
//     try {
//       setActing(true);
//       if (existingId) {
//         await updateAllocation(existingId, payload);
//         toast.success("Allocation updated.");
//       } else {
//         await createAllocation(payload);
//         toast.success("Allocation created.");
//       }
//       const rows = await listAllocations({ fiscal_period: fiscalPeriod, ts_supervisor_id: tsSupervisorId });
//       setAllocations(rows);
//     } catch (e) {
//       toast.error(safeErr(e));
//     } finally {
//       setActing(false);
//     }
//   }

//   async function removeCell(id: number) {
//     try {
//       setActing(true);
//       await deleteAllocation(id);
//       toast.success("Allocation deleted.");
//       const rows = await listAllocations({ fiscal_period: fiscalPeriod, ts_supervisor_id: tsSupervisorId });
//       setAllocations(rows);
//     } catch (e) {
//       toast.error(safeErr(e));
//     } finally {
//       setActing(false);
//     }
//   }

//   async function saveQuick() {
//     if (!selectedSupplierId) return toast.error("Supplier is required.");
//     if (!selectedSalesmanId) return toast.error("Salesman is required.");

//     const amt = Number(quickAmount);
//     if (!Number.isFinite(amt) || amt < 0) return toast.error("Enter a valid target amount.");

//     const existing = findAllocationCell(selectedSalesmanId, selectedSupplierId);

//     await upsertCell(
//       {
//         ts_supervisor_id: tsSupervisorId ?? null,
//         salesman_id: selectedSalesmanId,
//         supplier_id: selectedSupplierId,
//         fiscal_period: fiscalPeriod,
//         target_amount: amt,
//         status: quickStatus,
//       },
//       existing?.id
//     );
//   }

//   return {
//     loading,
//     acting,

//     fiscalPeriod,
//     setFiscalPeriod,

//     supervisors,
//     supervisorUserId,
//     setSupervisorUserId,

//     supervisorTargets,
//     tsSupervisorId,
//     setTsSupervisorId,

//     salesmen,
//     suppliers,

//     allocations,
//     supplierTargets,

//     selectedSupplierId,
//     setSelectedSupplierId,
//     selectedSalesmanId,
//     setSelectedSalesmanId,
//     quickAmount,
//     setQuickAmount,
//     quickStatus,
//     setQuickStatus,
//     saveQuick,

//     findAllocationCell,
//     upsertCell,
//     removeCell,
//   };
// }
