"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  Mail,
  Phone,
  Clock,
  Calendar,
  User,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Plane,
  FileText,
} from "lucide-react";
import { IntercompanyEmployeeRecord } from "../types";

interface AttendanceDetailModalProps {
  record: IntercompanyEmployeeRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AttendanceDetailModal({
  record,
  open,
  onOpenChange,
}: AttendanceDetailModalProps) {
  if (!record) return null;

  const renderStatusBadge = () => {
    switch (record.attendanceStatus) {
      case "On Time":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="h-3.5 w-3.5" />
            On Time
          </span>
        );
      case "Late":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <AlertTriangle className="h-3.5 w-3.5" />
            Late
          </span>
        );
      case "Absent":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <XCircle className="h-3.5 w-3.5" />
            Absent
          </span>
        );
      case "On Leave":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
            <Plane className="h-3.5 w-3.5" />
            On Leave ({record.leaveType || "Approved"})
          </span>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md sm:max-w-lg p-0 overflow-hidden bg-card border-border rounded-2xl shadow-xl">
        {/* Header with decorative background */}
        <div className="bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-teal-500/10 p-5 sm:p-6 border-b border-border/60">
          <DialogHeader className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-bold font-mono bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30">
                <Building2 className="h-3 w-3" />
                {record.companyCode} • {record.employeeId}
              </span>
              {renderStatusBadge()}
            </div>
            <DialogTitle className="text-xl font-bold tracking-tight text-foreground pt-2">
              {record.name}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {record.position} • {record.department}
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-5">
          {/* Company & Organization Details */}
          <div className="rounded-xl border border-border/70 bg-muted/30 p-3.5 space-y-2.5">
            <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Employment Details
            </h4>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-muted-foreground">Company Entity:</span>
                <p className="font-semibold text-foreground">{record.companyName}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Department:</span>
                <p className="font-semibold text-foreground">{record.department}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Gender:</span>
                <p className="font-semibold text-foreground">{record.gender}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Approval Status:</span>
                <p className="font-semibold text-foreground capitalize">
                  {record.approveStatus || "N/A"}
                </p>
              </div>
            </div>
          </div>

          {/* Filed Leave Details (if applicable) */}
          {record.hasFiledLeave && (
            <div className="rounded-xl border border-purple-500/30 bg-purple-500/5 dark:bg-purple-950/20 p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="text-[11px] font-semibold text-purple-700 dark:text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Plane className="h-3.5 w-3.5 text-purple-500" />
                  Leave Filing Details
                </h4>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                    record.leaveStatus === "approved"
                      ? "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30"
                      : "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
                  }`}
                >
                  {record.leaveStatus === "approved" ? "Approved Leave" : "Pending Approval"}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-muted-foreground">Leave Type:</span>
                  <p className="font-semibold text-foreground">{record.leaveType || "Unspecified"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Filing Period:</span>
                  <p className="font-semibold text-foreground">{record.leaveDates || "Today"}</p>
                </div>
                {record.leaveReason && (
                  <div className="col-span-2 pt-1 border-t border-purple-500/20 dark:border-purple-500/30">
                    <span className="text-muted-foreground">Reason:</span>
                    <p className="font-normal text-foreground/90 italic text-[11px] mt-0.5">
                      "{record.leaveReason}"
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Attendance Timing */}
          <div className="rounded-xl border border-border/70 bg-card p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-cyan-500" />
                Time Record ({record.logDate})
              </h4>
            </div>
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-3 rounded-lg bg-muted/40 border border-border/50">
                <span className="text-[11px] font-medium text-muted-foreground">Check In</span>
                <p className="text-base font-bold text-foreground mt-0.5 tabular-nums">
                  {record.timeIn || "--:--"}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-muted/40 border border-border/50">
                <span className="text-[11px] font-medium text-muted-foreground">Check Out</span>
                <p className="text-base font-bold text-foreground mt-0.5 tabular-nums">
                  {record.timeOut || "--:--"}
                </p>
              </div>
            </div>
          </div>

          {/* Time In / Out Image Proofs if available */}
          {(record.imageTimeIn || record.imageTimeOut) && (
            <div className="space-y-2">
              <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Biometric / Photo Verification
              </h4>
              <div className="grid grid-cols-2 gap-3">
                {record.imageTimeIn && (
                  <div className="space-y-1">
                    <span className="text-[10px] text-muted-foreground">Time In Photo</span>
                    <div className="h-28 rounded-lg overflow-hidden border border-border bg-muted flex items-center justify-center">
                      <img
                        src={record.imageTimeIn}
                        alt="Time In Verification"
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                    </div>
                  </div>
                )}
                {record.imageTimeOut && (
                  <div className="space-y-1">
                    <span className="text-[10px] text-muted-foreground">Time Out Photo</span>
                    <div className="h-28 rounded-lg overflow-hidden border border-border bg-muted flex items-center justify-center">
                      <img
                        src={record.imageTimeOut}
                        alt="Time Out Verification"
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Contact Details */}
          <div className="space-y-2 text-xs border-t border-border/60 pt-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="h-3.5 w-3.5 text-cyan-500 shrink-0" />
              <span className="truncate">{record.email || "No email registered"}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="h-3.5 w-3.5 text-cyan-500 shrink-0" />
              <span>{record.contact || "No phone registered"}</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
