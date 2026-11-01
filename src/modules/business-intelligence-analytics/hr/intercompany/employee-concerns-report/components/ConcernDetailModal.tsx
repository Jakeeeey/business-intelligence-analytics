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
  Calendar,
  Clock,
  EyeOff,
  Mail,
  Phone,
  MessageSquareWarning,
  Tag,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  User,
} from "lucide-react";
import { IntercompanyConcernRecord } from "../types";

interface ConcernDetailModalProps {
  record: IntercompanyConcernRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ConcernDetailModal({
  record,
  open,
  onOpenChange,
}: ConcernDetailModalProps) {
  if (!record) return null;

  const renderStatusBadge = (status: string) => {
    const s = status.toUpperCase();
    if (s === "PENDING") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
          <Clock className="h-3.5 w-3.5" />
          Pending Review
        </span>
      );
    }
    if (s === "IN_REVIEW" || s === "UNDER_REVIEW" || s === "IN PROGRESS" || s === "INVESTIGATING") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
          <AlertCircle className="h-3.5 w-3.5" />
          Under Investigation
        </span>
      );
    }
    if (s === "RESOLVED" || s === "COMPLETED") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Resolved
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-muted text-muted-foreground border border-border">
        {status}
      </span>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md sm:max-w-xl p-0 overflow-hidden bg-card border-border rounded-2xl shadow-xl">
        {/* Header with decorative background */}
        <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-cyan-500/10 p-5 sm:p-6 border-b border-border/60">
          <DialogHeader className="space-y-1">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-bold font-mono bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                <Building2 className="h-3 w-3" />
                {record.companyCode} • Concern #{record.concernId}
              </span>
              {renderStatusBadge(record.status)}
            </div>
            <DialogTitle className="text-xl font-bold tracking-tight text-foreground pt-2">
              {record.subjectOfConcern}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground flex items-center gap-2 pt-0.5">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {record.createdAtFormatted}
              </span>
              <span>•</span>
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 bg-background/60 text-foreground border-border gap-1"
              >
                <Tag className="h-2.5 w-2.5 text-cyan-500" />
                {record.category}
              </Badge>
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Concern Message Body */}
          <div className="rounded-xl border border-border/80 bg-muted/20 p-4 space-y-2">
            <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <MessageSquareWarning className="h-3.5 w-3.5 text-amber-500" />
              Detailed Explanation / Grievance Statement
            </h4>
            <div className="rounded-lg bg-background p-3.5 border border-border/60 text-xs sm:text-sm text-foreground whitespace-pre-wrap leading-relaxed">
              {record.concern}
            </div>
          </div>

          {/* Submitter & Privacy Profile */}
          <div className="rounded-xl border border-border/80 bg-card p-3.5 space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-cyan-500" />
                Submitter Profile
              </h4>
              {record.isAnonymous ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20">
                  <EyeOff className="h-3 w-3" />
                  Anonymous Submission
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-500/20">
                  <ShieldCheck className="h-3 w-3" />
                  Identified Employee
                </span>
              )}
            </div>

            {record.isAnonymous ? (
              <div className="rounded-lg bg-purple-500/5 dark:bg-purple-950/20 border border-purple-500/20 p-3 text-muted-foreground text-xs space-y-1">
                <p className="font-semibold text-foreground flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                  Whistleblower Privacy Protection Active
                </p>
                <p className="text-[11px]">
                  The employee chose to submit this concern anonymously. Personal identity, email, and contact credentials are intentionally withheld to ensure confidentiality.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <span className="text-muted-foreground">Full Name:</span>
                  <p className="font-semibold text-foreground">{record.name}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Employee ID:</span>
                  <p className="font-mono font-semibold text-foreground">
                    {record.employeeId}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Role / Position:</span>
                  <p className="font-semibold text-foreground">{record.position}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Department:</span>
                  <p className="font-semibold text-foreground">{record.department}</p>
                </div>
                {record.email && (
                  <div>
                    <span className="text-muted-foreground">Email Address:</span>
                    <p className="font-semibold text-foreground flex items-center gap-1 truncate">
                      <Mail className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span className="truncate">{record.email}</span>
                    </p>
                  </div>
                )}
                {record.contact && (
                  <div>
                    <span className="text-muted-foreground">Contact Phone:</span>
                    <p className="font-semibold text-foreground flex items-center gap-1">
                      <Phone className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span>{record.contact}</span>
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Operating Entity & Logging Metadata */}
          <div className="rounded-xl border border-border/80 bg-muted/20 p-3.5 text-xs grid grid-cols-2 gap-2.5">
            <div>
              <span className="text-muted-foreground">Operating Company:</span>
              <p className="font-semibold text-foreground">
                {record.companyName} ({record.companyCode})
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Logged Department:</span>
              <p className="font-semibold text-foreground">{record.department}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Submission Timestamp:</span>
              <p className="font-mono text-foreground">{record.createdAtFormatted}</p>
            </div>
            {record.createdByName && !record.isAnonymous && (
              <div>
                <span className="text-muted-foreground">Entered By:</span>
                <p className="font-semibold text-foreground">{record.createdByName}</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

