"use client";

import React, { useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Building2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileText,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import {
  EmployeeOvertimeSummary,
  IntercompanyOvertimeRecord,
  RequestStatus,
} from "../types";

interface OvertimeDetailModalProps {
  employee: EmployeeOvertimeSummary | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  overtimeRecords?: IntercompanyOvertimeRecord[];
}

export function OvertimeDetailModal({
  employee,
  open,
  onOpenChange,
  overtimeRecords = [],
}: OvertimeDetailModalProps) {
  // Filter records for this employee
  const empOtRecords = useMemo(() => {
    if (!employee) return [];
    return overtimeRecords
      .filter(
        (ot) =>
          ot.userId === employee.userId && ot.companyId === employee.companyId
      )
      .sort((a, b) => b.requestDate.localeCompare(a.requestDate));
  }, [employee, overtimeRecords]);

  if (!employee) return null;

  const renderStatusBadge = (status: RequestStatus) => {
    switch (status) {
      case "approved":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="h-3 w-3" />
            Approved
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <AlertTriangle className="h-3 w-3" />
            Pending
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <XCircle className="h-3 w-3" />
            Rejected
          </span>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl sm:max-w-3xl p-0 overflow-hidden bg-card border-border rounded-2xl shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header banner */}
        <div className="bg-gradient-to-r from-indigo-500/10 via-blue-500/10 to-teal-500/10 p-5 sm:p-6 border-b border-border/60 shrink-0">
          <DialogHeader className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-bold font-mono bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30">
                <Building2 className="h-3.5 w-3.5" />
                {employee.companyName} ({employee.companyCode})
              </span>
              <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-md bg-muted text-muted-foreground border border-border">
                ID: {employee.employeeId}
              </span>
            </div>
            <div className="flex items-center gap-3 pt-1">
              <div className="h-11 w-11 rounded-full bg-indigo-600/10 dark:bg-indigo-400/20 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center text-base border border-indigo-500/20 shrink-0">
                {employee.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
                  {employee.name}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  {employee.position || "Employee"} • {employee.department || "General"}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* Scrollable content body */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
          {/* Overtime Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl border border-indigo-500/20 bg-indigo-500/5 dark:bg-indigo-950/20">
              <div className="flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 font-medium mb-1">
                <Clock className="h-3.5 w-3.5" />
                <span>Actual Overtime</span>
              </div>
              <p className="text-lg font-bold text-foreground tabular-nums">
                {employee.totalActualOtHours.toFixed(1)}{" "}
                <span className="text-xs font-normal text-muted-foreground">hrs</span>
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {employee.totalActualOtMinutes.toLocaleString()} mins rendered
              </p>
            </div>

            <div className="p-3 rounded-xl border border-blue-500/20 bg-blue-500/5 dark:bg-blue-950/20">
              <div className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">
                <FileText className="h-3.5 w-3.5" />
                <span>Filed Overtime</span>
              </div>
              <p className="text-lg font-bold text-foreground tabular-nums">
                {employee.totalFiledOtHours.toFixed(1)}{" "}
                <span className="text-xs font-normal text-muted-foreground">hrs</span>
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {employee.totalOtRequests} request{employee.totalOtRequests === 1 ? "" : "s"} filed
              </p>
            </div>

            <div className="p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-950/20">
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium mb-1">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Actual Approved OT</span>
              </div>
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                {employee.totalApprovedOtHours.toFixed(1)}{" "}
                <span className="text-xs font-normal text-muted-foreground">hrs</span>
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {employee.approvedOtRequests} approved
              </p>
            </div>

            <div className="p-3 rounded-xl border border-teal-500/20 bg-teal-500/5 dark:bg-teal-950/20">
              <div className="flex items-center gap-1.5 text-xs text-teal-600 dark:text-teal-400 font-medium mb-1">
                <TrendingUp className="h-3.5 w-3.5" />
                <span>Approval Rate</span>
              </div>
              <p className="text-lg font-bold text-teal-600 dark:text-teal-400 tabular-nums">
                {employee.approvalRate}%
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {employee.pendingOtRequests} pending / {employee.rejectedOtRequests} rej
              </p>
            </div>
          </div>

          {/* Filings History */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-indigo-500" />
                Overtime Request Filings ({empOtRecords.length})
              </h4>
              <span className="text-[11px] text-muted-foreground">
                Chronological timeline
              </span>
            </div>

            {empOtRecords.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground border border-dashed rounded-xl bg-muted/20">
                <Clock className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
                No overtime request records found for this employee in the selected timeframe.
              </div>
            ) : (
              <div className="space-y-2.5">
                {empOtRecords.map((ot) => (
                  <div
                    key={ot.id}
                    className="p-3.5 rounded-xl border border-border/70 bg-card hover:border-indigo-500/40 transition-colors space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold font-mono text-foreground">
                          {ot.requestDate}
                        </span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                          Actual: {ot.actualOtHours.toFixed(1)} hrs
                        </span>
                        <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400">
                          Filed: {ot.filedOtHours.toFixed(1)} hrs
                        </span>
                        {ot.status === "approved" && (
                          <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            Approved: {ot.actualApprovedOtHours.toFixed(1)} hrs
                          </span>
                        )}
                      </div>
                      {renderStatusBadge(ot.status)}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-muted-foreground pt-1 border-t border-border/40">
                      <div>
                        <span className="font-medium text-foreground">Sched Timeout:</span>{" "}
                        <span className="font-mono">
                          {ot.schedTimeout ? ot.schedTimeout.substring(0, 5) : (ot.otFrom ? ot.otFrom.substring(0, 5) : "—")}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-foreground">Actual Punch Out:</span>{" "}
                        <span className="font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                          {ot.actualTimeOut ? ot.actualTimeOut.substring(0, 5) : "No punch log"}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-foreground">OT Window:</span>{" "}
                        <span className="font-mono">
                          {ot.otFrom && ot.otTo ? `${ot.otFrom.substring(0, 5)} → ${ot.otTo.substring(0, 5)}` : "—"}
                        </span>
                      </div>
                    </div>

                    {ot.purpose && (
                      <div className="text-xs bg-muted/40 p-2 rounded-lg text-foreground/90">
                        <span className="font-semibold text-muted-foreground text-[11px] block mb-0.5">
                          Purpose / Reason:
                        </span>
                        {ot.purpose}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
