"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Building2,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  Paperclip,
  Download,
  UserCheck,
  Briefcase,
  Phone,
  Mail,
} from "lucide-react";
import { IntercompanyResignationRecord } from "../types";

interface ResignationDetailModalProps {
  record: IntercompanyResignationRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ResignationDetailModal({
  record,
  open,
  onOpenChange,
}: ResignationDetailModalProps) {
  if (!record) return null;

  const initials =
    `${record.firstName?.[0] || ""}${record.lastName?.[0] || ""}`.toUpperCase() || "E";

  const renderStatusBadge = () => {
    switch (record.status) {
      case "PENDING":
        return (
          <Badge
            variant="outline"
            className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 text-xs px-2.5 py-0.5 rounded-lg gap-1.5"
          >
            <Clock className="h-3.5 w-3.5" />
            Pending Review
          </Badge>
        );
      case "APPROVED":
        return (
          <Badge
            variant="outline"
            className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-xs px-2.5 py-0.5 rounded-lg gap-1.5"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Approved
          </Badge>
        );
      case "COMPLETED":
      case "RECORDED":
        return (
          <Badge
            variant="outline"
            className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30 text-xs px-2.5 py-0.5 rounded-lg gap-1.5"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Completed
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge
            variant="outline"
            className="bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30 text-xs px-2.5 py-0.5 rounded-lg gap-1.5"
          >
            <XCircle className="h-3.5 w-3.5" />
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-xs px-2.5 py-0.5 rounded-lg">
            {record.status}
          </Badge>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-card border-border rounded-2xl p-0 overflow-hidden shadow-2xl">
        <DialogHeader className="sr-only">
          <DialogTitle>Resignation Dossier - {record.name}</DialogTitle>
        </DialogHeader>
        {/* Header Profile Section */}
        <div className="p-5 sm:p-6 bg-muted/40 border-b border-border space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3.5 min-w-0">
              <Avatar className="h-12 w-12 rounded-2xl border-2 border-background shadow-xs">
                {record.avatar && <AvatarImage src={record.avatar} alt={record.name} />}
                <AvatarFallback className="rounded-2xl text-sm font-bold bg-primary/10 text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base sm:text-lg font-bold text-foreground">
                    {record.name}
                  </h3>
                  {renderStatusBadge()}
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5 font-mono">
                  <span>{record.employeeId}</span>
                  <span>•</span>
                  <span>{record.position}</span>
                  <span>•</span>
                  <span className="font-sans font-semibold text-foreground">
                    {record.department}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Quick Contact & Company Bar */}
          <div className="flex flex-wrap items-center gap-y-2 gap-x-4 pt-2 border-t border-border/60 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5 font-medium text-foreground">
              <Building2 className="h-3.5 w-3.5 text-primary" />
              {record.companyName} ({record.companyCode})
            </span>
            {record.email !== "-" && (
              <span className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" />
                {record.email}
              </span>
            )}
            {record.contact !== "-" && (
              <span className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" />
                {record.contact}
              </span>
            )}
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Key Dates Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-muted/40 p-3 rounded-xl border border-border/60">
              <div className="text-[11px] text-muted-foreground font-medium flex items-center gap-1 mb-1">
                <Calendar className="h-3 w-3" /> Filing Date
              </div>
              <div className="text-xs font-bold text-foreground font-mono">
                {record.filingDateFormatted}
              </div>
            </div>

            <div className="bg-muted/40 p-3 rounded-xl border border-border/60">
              <div className="text-[11px] text-muted-foreground font-medium flex items-center gap-1 mb-1">
                <Calendar className="h-3 w-3" /> Last Day
              </div>
              <div className="text-xs font-bold text-foreground font-mono">
                {record.resignationDateFormatted}
              </div>
            </div>

            <div className="bg-muted/40 p-3 rounded-xl border border-border/60">
              <div className="text-[11px] text-muted-foreground font-medium flex items-center gap-1 mb-1">
                <Clock className="h-3 w-3" /> Notice Period
              </div>
              <div className="text-xs font-bold text-foreground">
                {record.noticeDays} days
                <span className="text-[10px] block font-normal text-muted-foreground">
                  {record.noticeCategory}
                </span>
              </div>
            </div>

            <div className="bg-muted/40 p-3 rounded-xl border border-border/60">
              <div className="text-[11px] text-muted-foreground font-medium flex items-center gap-1 mb-1">
                <Briefcase className="h-3 w-3" /> Tenure
              </div>
              <div className="text-xs font-bold text-foreground">
                {record.tenureFormatted || "N/A"}
                <span className="text-[10px] block font-normal text-muted-foreground">
                  {record.dateOfHire ? `Hired: ${record.dateOfHire.slice(0, 10)}` : "At filing"}
                </span>
              </div>
            </div>
          </div>

          {/* Reason Statement */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wider">
                <FileText className="h-3.5 w-3.5 text-primary" />
                Reason for Resignation
              </h4>
              <Badge variant="secondary" className="text-[10px] font-semibold rounded-md">
                {record.reasonCategory}
              </Badge>
            </div>
            <div className="bg-muted/40 border border-border/60 p-3.5 rounded-xl text-xs sm:text-sm text-foreground leading-relaxed whitespace-pre-wrap">
              {record.reason || "No detailed statement provided."}
            </div>
          </div>

          {/* HR Review & Remarks */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wider">
              <UserCheck className="h-3.5 w-3.5 text-amber-500" />
              HR Review & Remarks
            </h4>
            <div className="bg-muted/40 border border-border/60 p-3.5 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground border-b border-border/60 pb-2">
                <span>
                  Reviewer:{" "}
                  <strong className="text-foreground">
                    {record.reviewerName || "Unassigned HR Officer"}
                  </strong>
                </span>
                <span>
                  Date:{" "}
                  <strong className="text-foreground font-mono">
                    {record.reviewedAtFormatted || "Pending review"}
                  </strong>
                </span>
              </div>
              <p className="text-xs text-foreground leading-relaxed">
                {record.hrRemarks ? (
                  record.hrRemarks
                ) : (
                  <span className="italic text-muted-foreground">
                    No remarks recorded yet by the HR review officer.
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Attachment Preview / Download */}
          {record.attachmentUrl && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wider">
                <Paperclip className="h-3.5 w-3.5 text-blue-500" />
                Resignation Letter & Supporting Attachment
              </h4>
              <div className="flex items-center justify-between p-3 bg-muted/40 border border-border/60 rounded-xl">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-foreground truncate">
                      {record.attachmentName || "Resignation_Document"}
                    </p>
                    <p className="text-[11px] text-muted-foreground uppercase">
                      {record.attachmentType || "Attachment File"}
                    </p>
                  </div>
                </div>

                <a
                  href={record.attachmentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex"
                >
                  <Button size="sm" variant="outline" className="h-8 text-xs rounded-xl gap-1.5">
                    <Download className="h-3.5 w-3.5" />
                    Download
                  </Button>
                </a>
              </div>
            </div>
          )}

          {/* Audit Trail Timeline */}
          <div className="space-y-2 pt-2 border-t border-border">
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
              Departure Processing Trail
            </h4>
            <div className="space-y-3 relative pl-4 border-l-2 border-border/60 ml-2 py-1">
              {/* Step 1: Filed */}
              <div className="relative">
                <span className="absolute -left-[23px] top-0.5 h-3.5 w-3.5 rounded-full bg-primary ring-4 ring-background" />
                <div className="text-xs font-bold text-foreground">Filing Submitted</div>
                <div className="text-[11px] text-muted-foreground font-mono">
                  {record.filingDateFormatted}
                </div>
              </div>

              {/* Step 2: HR Review */}
              <div className="relative">
                <span
                  className={`absolute -left-[23px] top-0.5 h-3.5 w-3.5 rounded-full ring-4 ring-background ${
                    record.reviewedAt ? "bg-emerald-500" : "bg-amber-500"
                  }`}
                />
                <div className="text-xs font-bold text-foreground">
                  HR Review ({record.status})
                </div>
                <div className="text-[11px] text-muted-foreground font-mono">
                  {record.reviewedAtFormatted !== "-" ? record.reviewedAtFormatted : "Pending action"}
                </div>
              </div>

              {/* Step 3: Last Working Day */}
              <div className="relative">
                <span className="absolute -left-[23px] top-0.5 h-3.5 w-3.5 rounded-full bg-blue-500 ring-4 ring-background" />
                <div className="text-xs font-bold text-foreground">Effective Last Working Day</div>
                <div className="text-[11px] text-muted-foreground font-mono">
                  {record.resignationDateFormatted} ({record.noticeDays} calendar days notice)
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-muted/30 border-t border-border flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="rounded-xl"
          >
            Close Dossier
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

