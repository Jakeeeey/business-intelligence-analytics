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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Building2,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  UserCheck,
  Briefcase,
  Layers,
  Coins,
  FileText,
  UserPlus,
  Users,
} from "lucide-react";
import { IntercompanyManpowerRecord, RecommendationStatus } from "../types";

interface ManpowerDetailModalProps {
  record: IntercompanyManpowerRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ManpowerDetailModal({
  record,
  open,
  onOpenChange,
}: ManpowerDetailModalProps) {
  if (!record) return null;

  const renderStatusBadge = () => {
    switch (record.status) {
      case "Approved":
        return (
          <Badge
            variant="outline"
            className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-xs px-2.5 py-0.5 rounded-lg gap-1.5"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Approved
          </Badge>
        );
      case "Draft":
        return (
          <Badge
            variant="outline"
            className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 text-xs px-2.5 py-0.5 rounded-lg gap-1.5"
          >
            <Clock className="h-3.5 w-3.5" />
            Draft / Pending
          </Badge>
        );
      case "Rejected":
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

  const renderCandidateStatusBadge = (status: RecommendationStatus) => {
    switch (status) {
      case "Hired":
        return (
          <span className="inline-flex items-center text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
            Hired
          </span>
        );
      case "Approved":
        return (
          <span className="inline-flex items-center text-[11px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-md">
            Approved
          </span>
        );
      case "Recommended":
        return (
          <span className="inline-flex items-center text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md">
            Recommended
          </span>
        );
      case "Rejected":
      case "Withdrawn":
        return (
          <span className="inline-flex items-center text-[11px] font-semibold text-red-600 dark:text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-md">
            {status}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
            {status}
          </span>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl bg-card border-border rounded-2xl p-0 overflow-hidden shadow-2xl">
        <DialogHeader className="sr-only">
          <DialogTitle>Manpower Requisition Dossier - {record.requestNo}</DialogTitle>
        </DialogHeader>

        {/* Header Requisition Section */}
        <div className="p-5 sm:p-6 bg-muted/40 border-b border-border space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono font-bold bg-primary/10 text-primary px-2.5 py-0.5 rounded-md">
                  {record.requestNo}
                </span>
                {renderStatusBadge()}
                <Badge variant="secondary" className="text-xs px-2 py-0.5 rounded-md">
                  {record.purpose}
                </Badge>
                <Badge variant="outline" className="text-xs px-2 py-0.5 rounded-md border-border">
                  {record.employmentType}
                </Badge>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-foreground">
                {record.position}
              </h3>
              <p className="text-xs text-muted-foreground flex items-center gap-2 font-mono">
                <span>{record.department}</span>
                <span>•</span>
                <span>Division: {record.division}</span>
              </p>
            </div>
          </div>

          {/* Quick Contact & Company Bar */}
          <div className="flex flex-wrap items-center gap-y-2 gap-x-4 pt-2 border-t border-border/60 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5 font-medium text-foreground">
              <Building2 className="h-3.5 w-3.5 text-primary" />
              {record.companyName} ({record.companyCode})
            </span>
            <span className="flex items-center gap-1.5 font-mono">
              <Calendar className="h-3.5 w-3.5" />
              Filed: {record.createdAtFormatted}
            </span>
            {record.requestedByName && (
              <span className="flex items-center gap-1.5">
                <UserPlus className="h-3.5 w-3.5" />
                Requested by: {record.requestedByName}
              </span>
            )}
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Key Metric Blocks */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-muted/40 p-3 rounded-xl border border-border/60">
              <div className="text-[11px] text-muted-foreground font-medium flex items-center gap-1 mb-1">
                <Users className="h-3 w-3 text-primary" /> Headcount Needed
              </div>
              <div className="text-xl font-bold text-foreground font-mono">
                {record.noManpowerNeeded}
                <span className="text-xs font-normal text-muted-foreground"> positions</span>
              </div>
            </div>

            <div className="bg-muted/40 p-3 rounded-xl border border-border/60">
              <div className="text-[11px] text-muted-foreground font-medium flex items-center gap-1 mb-1">
                <UserCheck className="h-3 w-3 text-emerald-500" /> Hired / Filled
              </div>
              <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                {record.hiredCount}
                <span className="text-xs font-normal text-muted-foreground"> ({record.fulfillmentRate}%)</span>
              </div>
            </div>

            <div className="bg-muted/40 p-3 rounded-xl border border-border/60">
              <div className="text-[11px] text-muted-foreground font-medium flex items-center gap-1 mb-1">
                <Coins className="h-3 w-3 text-amber-500" /> Allocated Rate
              </div>
              <div className="text-base sm:text-lg font-bold text-foreground font-mono">
                {record.rateFormatted}
              </div>
            </div>

            <div className="bg-muted/40 p-3 rounded-xl border border-border/60">
              <div className="text-[11px] text-muted-foreground font-medium flex items-center gap-1 mb-1">
                <Briefcase className="h-3 w-3 text-purple-500" /> Total Budget
              </div>
              <div className="text-base sm:text-lg font-bold text-foreground font-mono">
                ₱{record.totalEstimatedBudget.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Justification & Replacement Details */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-primary" />
              Reason & Business Justification
            </h4>
            <div className="bg-muted/40 border border-border/60 p-3.5 rounded-xl text-xs sm:text-sm text-foreground leading-relaxed whitespace-pre-wrap">
              {record.reasonJustification || "No written justification provided."}
              {record.replacementName && (
                <p className="mt-2 text-xs font-semibold text-primary">
                  Replacing outgoing employee: {record.replacementName}
                </p>
              )}
            </div>
          </div>

          {/* Qualification Requirements */}
          {(record.qualification || record.qualificationDescription) && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-indigo-500" />
                Position Qualifications & Criteria
              </h4>
              <div className="bg-muted/40 border border-border/60 p-3.5 rounded-xl space-y-1.5 text-xs text-foreground">
                {record.qualification && (
                  <p>
                    <strong className="text-muted-foreground">Gender Preference:</strong>{" "}
                    <span className="font-semibold">{record.qualification}</span>
                  </p>
                )}
                {record.qualificationDescription && (
                  <div className="pt-1 border-t border-border/60 whitespace-pre-wrap leading-relaxed">
                    {record.qualificationDescription}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Sign-off & Approval Chain */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              Requisition Sign-Off & Approvals
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 bg-muted/40 p-3.5 rounded-xl border border-border/60 text-xs">
              <div>
                <span className="text-muted-foreground block text-[11px]">Recommending Approval</span>
                <span className="font-semibold text-foreground">
                  {record.recommendingApprovalName || "None"}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px]">Noted By</span>
                <span className="font-semibold text-foreground">{record.notedByName || "None"}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px]">
                  {record.status === "Approved" ? "Approved By" : "Sign-Off Status"}
                </span>
                <span className="font-bold text-foreground">
                  {record.approvedByName ? `${record.approvedByName} (${record.approvedAtFormatted})` : record.status}
                </span>
              </div>
            </div>
          </div>

          {/* Candidate Recommendations Table */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center justify-between">
              <span>Attached Candidate Recommendations ({record.recommendations.length})</span>
            </h4>
            <div className="border border-border/60 rounded-xl overflow-hidden bg-background">
              <Table>
                <TableHeader className="bg-muted/50 border-b border-border">
                  <TableRow>
                    <TableHead className="text-[11px] font-semibold text-foreground">
                      Applicant Name
                    </TableHead>
                    <TableHead className="text-[11px] font-semibold text-foreground">
                      Recommendation Notes
                    </TableHead>
                    <TableHead className="text-[11px] font-semibold text-foreground">
                      Status
                    </TableHead>
                    <TableHead className="text-[11px] font-semibold text-foreground text-right">
                      Decision Notes
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {record.recommendations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-4 text-xs text-muted-foreground">
                        No candidate recommendations attached to this requisition yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    record.recommendations.map((cand) => (
                      <TableRow key={cand.id} className="border-b border-border/60">
                        <TableCell className="py-2.5 font-bold text-xs text-foreground">
                          {cand.applicantName}
                        </TableCell>
                        <TableCell className="py-2.5 text-xs text-muted-foreground max-w-[200px] truncate">
                          {cand.recommendationNotes || "-"}
                        </TableCell>
                        <TableCell className="py-2.5 whitespace-nowrap">
                          {renderCandidateStatusBadge(cand.status)}
                        </TableCell>
                        <TableCell className="py-2.5 text-xs text-muted-foreground text-right max-w-[180px] truncate">
                          {cand.decisionNotes || cand.decisionByName || "-"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
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

