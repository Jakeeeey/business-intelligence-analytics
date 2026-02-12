// "use client";

// import * as React from "react";
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
// import { Label } from "@/components/ui/label";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// import type { StatusCode, TargetSettingSalesmanRow, UpsertAllocationPayload } from "../types";
// import { StatusBadge } from "./ui";

// export function AllocationCellDialog(props: {
//   open: boolean;
//   onOpenChange: (v: boolean) => void;

//   title: string;
//   description?: string;

//   existing: TargetSettingSalesmanRow | null;
//   defaultPayload: UpsertAllocationPayload;

//   acting?: boolean;
//   onSave: (payload: UpsertAllocationPayload, existingId?: number) => void;
//   onDelete: (id: number) => void;
// }) {
//   const [amount, setAmount] = React.useState<string>("");
//   const [status, setStatus] = React.useState<StatusCode>("PENDING");

//   React.useEffect(() => {
//     if (!props.open) return;
//     setAmount(props.existing ? String(props.existing.target_amount ?? "") : String(props.defaultPayload.target_amount ?? ""));
//     setStatus((props.existing?.status as StatusCode) ?? props.defaultPayload.status);
//   }, [props.open, props.existing, props.defaultPayload]);

//   const canDelete = !!props.existing?.id;

//   return (
//     <Dialog open={props.open} onOpenChange={props.onOpenChange}>
//       <DialogContent className="sm:max-w-[520px]">
//         <DialogHeader>
//           <DialogTitle>{props.title}</DialogTitle>
//           <DialogDescription className="flex items-center justify-between gap-3">
//             <span className="text-sm text-muted-foreground">{props.description ?? "Update target allocation for this cell."}</span>
//             <StatusBadge status={status} />
//           </DialogDescription>
//         </DialogHeader>

//         <div className="grid gap-4">
//           <div className="grid gap-2">
//             <Label>Target Amount</Label>
//             <Input
//               inputMode="decimal"
//               placeholder="e.g. 150000"
//               value={amount}
//               onChange={(e) => setAmount(e.target.value)}
//             />
//           </div>

//           <div className="grid gap-2">
//             <Label>Status</Label>
//             <Select value={status} onValueChange={(v) => setStatus(v as StatusCode)}>
//               <SelectTrigger>
//                 <SelectValue placeholder="Select status" />
//               </SelectTrigger>
//               <SelectContent>
//                 <SelectItem value="DRAFT">DRAFT</SelectItem>
//                 <SelectItem value="PENDING">PENDING</SelectItem>
//                 <SelectItem value="APPROVED">APPROVED</SelectItem>
//                 <SelectItem value="REJECTED">REJECTED</SelectItem>
//                 <SelectItem value="SET">SET</SelectItem>
//               </SelectContent>
//             </Select>
//           </div>

//           <div className="flex items-center justify-end gap-2 pt-2">
//             {canDelete ? (
//               <AlertDialog>
//                 <AlertDialogTrigger asChild>
//                   <Button variant="destructive" disabled={props.acting}>
//                     Delete
//                   </Button>
//                 </AlertDialogTrigger>
//                 <AlertDialogContent>
//                   <AlertDialogHeader>
//                     <AlertDialogTitle>Delete this allocation?</AlertDialogTitle>
//                   </AlertDialogHeader>
//                   <AlertDialogFooter>
//                     <AlertDialogCancel>Cancel</AlertDialogCancel>
//                     <AlertDialogAction
//                       onClick={() => props.existing?.id && props.onDelete(props.existing.id)}
//                       className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
//                     >
//                       Delete
//                     </AlertDialogAction>
//                   </AlertDialogFooter>
//                 </AlertDialogContent>
//               </AlertDialog>
//             ) : null}

//             <Button
//               onClick={() => {
//                 const n = Number(amount);
//                 props.onSave(
//                   {
//                     ...props.defaultPayload,
//                     target_amount: Number.isFinite(n) ? n : 0,
//                     status,
//                   },
//                   props.existing?.id
//                 );
//                 props.onOpenChange(false);
//               }}
//               disabled={props.acting}
//             >
//               Save
//             </Button>
//           </div>
//         </div>
//       </DialogContent>
//     </Dialog>
//   );
// }
