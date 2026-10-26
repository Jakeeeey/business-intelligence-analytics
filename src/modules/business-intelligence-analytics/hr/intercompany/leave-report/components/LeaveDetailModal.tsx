"use client";

import React, { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Building2,
  Clock,
  CalendarDays,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileText,
  ShieldCheck,
} from "lucide-react";
import {
  EmployeeLeaveAndOtSummary,
  IntercompanyOvertimeRecord,
  IntercompanyLeaveRecord,
  RequestStatus,
} from "../types";

interface LeaveDetailModalProps {
  employee: EmployeeLeaveAndOtSummary | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  overtimeRecords?: IntercompanyOvertimeRecord[];
  leaveRecords?: IntercompanyLeaveRecord[];
}

export function LeaveDetailModal({
  employee,
  open,
  onOpenChange,
  overtimeRecords = [],
  leaveRecords = [],
}: LeaveDetailModalProps) {
  const [activeTab, setActiveTab] = useState<string>("overtime");

  // Filter records for the selected employee
  const empOtRecords = useMemo(() => {
    if (!employee) return [];
    return overtimeRecords.filter(
      (ot) =>
        ot.userId === employee.userId && ot.companyId === employee.companyId
    );
  }, [employee, overtimeRecords]);

  const empLeaveRecords = useMemo(() => {
    if (!employee) return [];
    return leaveRecords.filter(
      (lv) =>
        lv.userId === employee.userId && lv.companyId === employee.companyId
    );
  }, [employee, leaveRecords]);

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
        <div className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 p-5 sm:p-6 border-b border-border/60 shrink-0">
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

        {/* Scrollable Modal Content */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
          {/* Overtime & Leave Summary Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl border border-indigo-500/20 bg-indigo-500/5 dark:bg-indigo-950/20">
              <div className="flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 font-medium mb-1">
                <Clock className="h-3.5 w-3.5" />
                <span>Total OT</span>
              </div>
              <p className="text-lg font-bold text-foreground tabular-nums">
                {employee.totalOtHours.toFixed(1)} <span className="text-xs font-normal text-muted-foreground">hrs</span>
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {employee.totalOtRequests} filed request{employee.totalOtRequests === 1 ? "" : "s"}
              </p>
            </div>

            <div className="p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-950/20">
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium mb-1">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Approved OT</span>
              </div>
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                {employee.approvedOtHours.toFixed(1)} <span className="text-xs font-normal text-muted-foreground">hrs</span>
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {employee.approvedOtRequests} approved ({employee.totalOtRequests > 0 ? Math.round((employee.approvedOtRequests / employee.totalOtRequests) * 100) : 0}%)
              </p>
            </div>

            <div className="p-3 rounded-xl border border-purple-500/20 bg-purple-500/5 dark:bg-purple-950/20">
              <div className="flex items-center gap-1.5 text-xs text-purple-600 dark:text-purple-400 font-medium mb-1">
                <CalendarDays className="h-3.5 w-3.5" />
                <span>Leave Days</span>
              </div>
              <p className="text-lg font-bold text-purple-600 dark:text-purple-400 tabular-nums">
                {employee.approvedLeaveDays.toFixed(1)} <span className="text-xs font-normal text-muted-foreground">days</span>
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Approved of {employee.totalLeaveDays.toFixed(1)} filed
              </p>
            </div>

            <div className="p-3 rounded-xl border border-border/80 bg-muted/30">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium mb-1">
                <FileText className="h-3.5 w-3.5" />
                <span>Pending Filings</span>
              </div>
              <p className="text-lg font-bold text-foreground tabular-nums">
                {employee.pendingOtRequests + employee.pendingLeaveRequests}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {employee.pendingOtRequests} OT · {employee.pendingLeaveRequests} Leave
              </p>
            </div>
          </div>

          {/* Filings List Section */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <TabsList className="bg-muted/60 p-1 rounded-lg">
                <TabsTrigger value="overtime" className="text-xs gap-1.5 px-3 py-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  Overtime History ({empOtRecords.length})
                </TabsTrigger>
                <TabsTrigger value="leave" className="text-xs gap-1.5 px-3 py-1.5">
                  <CalendarDays className="h-3.5 w-3.5" />
                  Leave Requests ({empLeaveRecords.length})
                </TabsTrigger>
              </TabsList>
              <span className="text-[11px] text-muted-foreground hidden sm:inline">
                Period records
              </span>
            </div>

            {/* Overtime Tab Content */}
            <TabsContent value="overtime" className="pt-3 focus-visible:outline-none">
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
                            {ot.durationHours.toFixed(1)} hrs ({ot.durationMinutes} mins)
                          </span>
                        </div>
                        {renderStatusBadge(ot.status)}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted-foreground pt-1 border-t border-border/40">
                        <div>
                          <span className="font-medium text-foreground">OT Window:</span>{" "}
                          {ot.otFrom && ot.otTo ? `${ot.otFrom} → ${ot.otTo}` : "Not specified"}
                        </div>
                        <div>
                          <span className="font-medium text-foreground">Filed:</span>{" "}
                          {ot.filedAt ? new Date(ot.filedAt).toLocaleDateString() : "—"}
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
            </TabsContent>

            {/* Leave Tab Content */}
            <TabsContent value="leave" className="pt-3 focus-visible:outline-none">
              {empLeaveRecords.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground border border-dashed rounded-xl bg-muted/20">
                  <CalendarDays className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
                  No leave request records found for this employee in the selected timeframe.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {empLeaveRecords.map((lv) => (
                    <div
                      key={lv.id}
                      className="p-3.5 rounded-xl border border-border/70 bg-card hover:border-purple-500/40 transition-colors space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-foreground">
                            {lv.leaveType}
                          </span>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400">
                            {lv.totalDays} {lv.totalDays === 1 ? "day" : "days"}
                          </span>
                          <span className="text-[11px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                            {lv.isPaid ? "Paid Leave" : "Unpaid Leave"}
                          </span>
                        </div>
                        {renderStatusBadge(lv.status)}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted-foreground pt-1 border-t border-border/40">
                        <div>
                          <span className="font-medium text-foreground">Dates:</span>{" "}
                          {lv.leaveStart} → {lv.leaveEnd}
                        </div>
                        <div>
                          <span className="font-medium text-foreground">Filed:</span>{" "}
                          {lv.filedAt ? new Date(lv.filedAt).toLocaleDateString() : "—"}
                        </div>
                      </div>

                      {lv.reason && (
                        <div className="text-xs bg-muted/40 p-2 rounded-lg text-foreground/90">
                          <span className="font-semibold text-muted-foreground text-[11px] block mb-0.5">
                            Reason:
                          </span>
                          {lv.reason}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
