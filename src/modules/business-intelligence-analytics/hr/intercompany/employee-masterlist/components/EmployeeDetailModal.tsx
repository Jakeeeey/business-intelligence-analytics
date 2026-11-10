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
  MapPin,
  Calendar,
  UserCheck,
  Briefcase,
  Fingerprint,
} from "lucide-react";
import { IntercompanyEmployeeMasterlistRecord } from "../types";

interface EmployeeDetailModalProps {
  record: IntercompanyEmployeeMasterlistRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EmployeeDetailModal({
  record,
  open,
  onOpenChange,
}: EmployeeDetailModalProps) {
  if (!record) return null;

  const isSeparated = record.rosterStatus === "Separated";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md sm:max-w-lg p-0 overflow-hidden bg-card border-border rounded-2xl shadow-xl">
        {/* Header with decorative gradient */}
        <div className="bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-indigo-500/10 p-5 sm:p-6 border-b border-border/60">
          <DialogHeader className="space-y-1">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-bold font-mono bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30">
                <Building2 className="h-3 w-3" />
                {record.companyCode} • {record.employeeId}
              </span>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                  isSeparated
                    ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                    : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                }`}
              >
                <UserCheck className="h-3.5 w-3.5" />
                {record.employmentStatus} ({record.rosterStatus})
              </span>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
                {record.name}
              </DialogTitle>
              {record.isDepartmentHead && (
                <Badge
                  variant="secondary"
                  className="text-[10px] bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30 font-bold"
                >
                  Department Head
                </Badge>
              )}
            </div>
            <DialogDescription className="text-xs text-muted-foreground">
              {record.position} • {record.department}
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-4">
          {/* Employment & Tenure Card */}
          <div className="rounded-xl border border-border/70 bg-muted/30 p-3.5 space-y-2.5">
            <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Briefcase className="h-3.5 w-3.5 text-cyan-500" />
              Employment & Service Tenure
            </h4>
            <div className="grid grid-cols-3 gap-2.5 text-center">
              <div className="p-2.5 rounded-lg bg-background border border-border/50">
                <span className="text-[10px] font-medium text-muted-foreground">
                  Date of Hire
                </span>
                <p className="text-xs font-bold text-foreground mt-0.5 tabular-nums">
                  {record.dateOfHire || "N/A"}
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-background border border-border/50">
                <span className="text-[10px] font-medium text-muted-foreground">
                  Service Tenure
                </span>
                <p className="text-xs font-bold text-cyan-600 dark:text-cyan-400 mt-0.5 tabular-nums">
                  {record.tenureYears > 0
                    ? `${record.tenureYears} yrs`
                    : record.dateOfHire
                    ? "< 1 yr"
                    : "N/A"}
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-background border border-border/50">
                <span className="text-[10px] font-medium text-muted-foreground">
                  Total Months
                </span>
                <p className="text-xs font-bold text-foreground mt-0.5 tabular-nums">
                  {record.tenureMonths} mos
                </p>
              </div>
            </div>
          </div>

          {/* Organization & Personal Details */}
          <div className="rounded-xl border border-border/70 bg-card p-3.5 space-y-2.5 text-xs">
            <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Organization & Personal Profile
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
                <span className="text-muted-foreground">Gender & Civil Status:</span>
                <p className="font-semibold text-foreground">
                  {record.gender} • {record.civilStatus}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Birthday & Age:</span>
                <p className="font-semibold text-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-muted-foreground" />
                  <span>
                    {record.birthday || "N/A"}
                    {record.age ? ` (${record.age} yrs)` : ""}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Biometric & Identification */}
          {(record.biometricId || record.rfId) && (
            <div className="rounded-xl border border-border/70 bg-card p-3.5 space-y-2 text-xs">
              <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Fingerprint className="h-3.5 w-3.5 text-purple-500" />
                System & Biometric Identifiers
              </h4>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <span className="text-muted-foreground">Biometric ID:</span>
                  <p className="font-mono font-semibold text-foreground">
                    {record.biometricId || "Unassigned"}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">RFID Card:</span>
                  <p className="font-mono font-semibold text-foreground">
                    {record.rfId || "Unassigned"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Separation Info (if separated) */}
          {isSeparated && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 dark:bg-rose-950/20 p-3.5 space-y-1.5 text-xs">
              <h4 className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                Separation Record
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-muted-foreground">Separation Date:</span>
                  <p className="font-semibold text-foreground">
                    {record.separationDate || "N/A"}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Cause:</span>
                  <p className="font-semibold text-foreground">
                    {record.separationCause || "N/A"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Contact & Address Details */}
          <div className="space-y-2 text-xs border-t border-border/60 pt-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="h-3.5 w-3.5 text-cyan-500 shrink-0" />
              <span className="truncate">{record.email || "No email registered"}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="h-3.5 w-3.5 text-cyan-500 shrink-0" />
              <span>{record.contact || "No phone registered"}</span>
            </div>
            {(record.barangay || record.city || record.province) && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 text-cyan-500 shrink-0" />
                <span>
                  {[record.barangay, record.city, record.province]
                    .filter(Boolean)
                    .join(", ")}
                </span>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

