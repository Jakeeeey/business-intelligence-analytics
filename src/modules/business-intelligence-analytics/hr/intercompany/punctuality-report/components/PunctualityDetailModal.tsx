"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Building2,
  Mail,
  Phone,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Plane,
  Camera,
} from "lucide-react";
import { IntercompanyPunctualityRecord } from "../types";

interface PunctualityDetailModalProps {
  record: IntercompanyPunctualityRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PunctualityDetailModal({
  record,
  open,
  onOpenChange,
}: PunctualityDetailModalProps) {
  if (!record) return null;

  const renderStatusBadge = () => {
    switch (record.punctualityStatus) {
      case "On Time":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="h-3.5 w-3.5" />
            On Time (≤ 08:00 AM)
          </span>
        );
      case "Grace Period":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Clock className="h-3.5 w-3.5" />
            Grace Period (+{record.delayMinutes}m)
          </span>
        );
      case "Moderate Late":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">
            <AlertTriangle className="h-3.5 w-3.5" />
            Moderate Late (+{record.delayMinutes}m)
          </span>
        );
      case "Severe Late":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <XCircle className="h-3.5 w-3.5" />
            Severe Late (+{record.delayMinutes}m)
          </span>
        );
      case "Undertime":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
            <Clock className="h-3.5 w-3.5" />
            Undertime / Early Departure
          </span>
        );
      case "On Leave":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <Plane className="h-3.5 w-3.5" />
            On Leave ({record.leaveType || "Approved"})
          </span>
        );
      case "Absent":
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-muted text-muted-foreground border border-border">
            <XCircle className="h-3.5 w-3.5" />
            Absent / No Log
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
        <div className="p-5 sm:p-6 space-y-4">
          {/* Punctuality Summary Card */}
          <div className="rounded-xl border border-border/70 bg-muted/30 p-3.5 space-y-2.5">
            <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-cyan-500" />
              Punctuality Timing ({record.logDate})
            </h4>
            <div className="grid grid-cols-3 gap-2.5 text-center">
              <div className="p-2.5 rounded-lg bg-background border border-border/50">
                <span className="text-[10px] font-medium text-muted-foreground">Scheduled</span>
                <p className="text-xs font-bold text-foreground mt-0.5 tabular-nums">
                  {record.scheduledTimeIn}
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-background border border-border/50">
                <span className="text-[10px] font-medium text-muted-foreground">Actual Time In</span>
                <p className="text-xs font-bold text-foreground mt-0.5 tabular-nums">
                  {record.timeIn || "--:--"}
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-background border border-border/50">
                <span className="text-[10px] font-medium text-muted-foreground">Delay</span>
                <p
                  className={`text-xs font-bold mt-0.5 tabular-nums ${
                    record.delayMinutes === 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : record.delayMinutes > 30
                      ? "text-rose-600 dark:text-rose-400"
                      : "text-amber-600 dark:text-amber-400"
                  }`}
                >
                  {record.delayMinutes === 0 ? "0m (On Time)" : `+${record.delayMinutes} mins`}
                </p>
              </div>
            </div>
            {record.timeOut && (
              <div className="flex items-center justify-between text-xs px-1 pt-1 text-muted-foreground">
                <span>Check-Out Log:</span>
                <span className="font-semibold text-foreground font-mono">{record.timeOut}</span>
              </div>
            )}
          </div>

          {/* Organization Details */}
          <div className="rounded-xl border border-border/70 bg-card p-3.5 space-y-2 text-xs">
            <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Employment Details
            </h4>
            <div className="grid grid-cols-2 gap-2.5">
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
            <div className="rounded-xl border border-purple-500/30 bg-purple-500/5 dark:bg-purple-950/20 p-3.5 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <h4 className="text-[11px] font-semibold text-purple-700 dark:text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Plane className="h-3.5 w-3.5 text-purple-500" />
                  Leave Filing Record
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
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-muted-foreground">Type:</span>
                  <p className="font-semibold text-foreground">{record.leaveType || "Standard"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Dates:</span>
                  <p className="font-semibold text-foreground">{record.leaveDates || "Today"}</p>
                </div>
                {record.leaveReason && (
                  <div className="col-span-2 pt-1 border-t border-purple-500/20">
                    <span className="text-muted-foreground">Reason:</span>
                    <p className="font-normal italic text-[11px] text-foreground/90 mt-0.5">
                      &ldquo;{record.leaveReason}&rdquo;
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Biometric / Photo Verification */}
          {(record.imageTimeIn || record.imageTimeOut) && (
            <div className="space-y-2">
              <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Camera className="h-3.5 w-3.5 text-cyan-500" />
                Biometric Photo Verification
              </h4>
              <div className="grid grid-cols-2 gap-3">
                {record.imageTimeIn && (
                  <div className="space-y-1">
                    <span className="text-[10px] text-muted-foreground">Time In Photo</span>
                    <div className="h-28 rounded-lg overflow-hidden border border-border bg-muted flex items-center justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={record.imageTimeIn}
                        alt="Time In Photo Verification"
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
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={record.imageTimeOut}
                        alt="Time Out Photo Verification"
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
