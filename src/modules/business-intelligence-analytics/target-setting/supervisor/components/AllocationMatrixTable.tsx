// "use client";

// import * as React from "react";
// import { ScrollArea } from "@/components/ui/scroll-area";
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
// import type { SalesmanRow, SupplierRow, TargetSettingSalesmanRow, UpsertAllocationPayload } from "../types";
// import { moneyPHP } from "../utils/format";
// import { StatusBadge } from "./ui";
// import { AllocationCellDialog } from "./AllocationCellDialog";

// export function AllocationMatrixTable(props: {
//   salesmen: SalesmanRow[];
//   suppliers: SupplierRow[];
//   allocations: TargetSettingSalesmanRow[];

//   fiscal_period: string;
//   ts_supervisor_id: number | null;

//   acting?: boolean;

//   onUpsert: (payload: UpsertAllocationPayload, existingId?: number) => void;
//   onDelete: (id: number) => void;
// }) {
//   const [open, setOpen] = React.useState(false);
//   const [cell, setCell] = React.useState<{
//     salesman: SalesmanRow;
//     supplier: SupplierRow;
//     existing: TargetSettingSalesmanRow | null;
//   } | null>(null);

//   function findCell(salesmanId: number, supplierId: number) {
//     return props.allocations.find((a) => a.salesman_id === salesmanId && a.supplier_id === supplierId) || null;
//   }

//   return (
//     <div className="rounded-lg border bg-background">
//       <ScrollArea className="w-full">
//         <div className="min-w-[1000px]">
//           <Table>
//             <TableHeader>
//               <TableRow>
//                 <TableHead className="sticky left-0 z-10 bg-background w-[260px]">Salesman</TableHead>
//                 {props.suppliers.map((s) => (
//                   <TableHead key={s.id} className="text-center min-w-[180px]">
//                     {s.supplier_name ?? `Supplier #${s.id}`}
//                   </TableHead>
//                 ))}
//               </TableRow>
//             </TableHeader>

//             <TableBody>
//               {props.salesmen.map((sm) => (
//                 <TableRow key={sm.id}>
//                   <TableCell className="sticky left-0 z-10 bg-background font-medium">
//                     <div className="flex flex-col">
//                       <span>{sm.salesman_name ?? `Salesman #${sm.id}`}</span>
//                       {sm.salesman_code ? (
//                         <span className="text-xs text-muted-foreground">{sm.salesman_code}</span>
//                       ) : null}
//                     </div>
//                   </TableCell>

//                   {props.suppliers.map((sp) => {
//                     const existing = findCell(sm.id, sp.id);
//                     return (
//                       <TableCell key={`${sm.id}-${sp.id}`} className="text-center">
//                         <button
//                           type="button"
//                           className="w-full rounded-md border px-3 py-2 text-sm hover:bg-muted/50 transition flex flex-col items-center gap-1"
//                           onClick={() => {
//                             setCell({ salesman: sm, supplier: sp, existing });
//                             setOpen(true);
//                           }}
//                         >
//                           <span className="font-medium">{moneyPHP(existing?.target_amount ?? 0)}</span>
//                           <StatusBadge status={(existing?.status ?? "DRAFT") as any} />
//                         </button>
//                       </TableCell>
//                     );
//                   })}
//                 </TableRow>
//               ))}

//               {!props.salesmen.length ? (
//                 <TableRow>
//                   <TableCell colSpan={1 + props.suppliers.length} className="py-10 text-center text-muted-foreground">
//                     No salesmen found.
//                   </TableCell>
//                 </TableRow>
//               ) : null}
//             </TableBody>
//           </Table>
//         </div>
//       </ScrollArea>

//       {cell ? (
//         <AllocationCellDialog
//           open={open}
//           onOpenChange={setOpen}
//           title={`${cell.salesman.salesman_name ?? "Salesman"} • ${cell.supplier.supplier_name ?? "Supplier"}`}
//           description="Edit this allocation cell (CRUD)."
//           existing={cell.existing}
//           defaultPayload={{
//             ts_supervisor_id: props.ts_supervisor_id,
//             salesman_id: cell.salesman.id,
//             supplier_id: cell.supplier.id,
//             fiscal_period: props.fiscal_period,
//             target_amount: cell.existing?.target_amount ?? 0,
//             status: (cell.existing?.status as any) ?? "PENDING",
//           }}
//           acting={props.acting}
//           onSave={props.onUpsert}
//           onDelete={props.onDelete}
//         />
//       ) : null}
//     </div>
//   );
// }
