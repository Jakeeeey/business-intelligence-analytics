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
  AlertTriangle,
  UserCheck,
  Briefcase,
  Layers,
  Phone,
  Mail,
  Award,
  AlertOctagon,
} from "lucide-react";
import { IntercompanyEvaluationRecord } from "../types";

interface EvaluationDetailModalProps {
  record: IntercompanyEvaluationRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EvaluationDetailModal({
  record,
  open,
  onOpenChange,
}: EvaluationDetailModalProps) {
  if (!record) return null;

  const initials =
    `${record.firstName?.[0] || ""}${record.lastName?.[0] || ""}`.toUpperCase() || "E";

  const renderResultBadge = () => {
    switch (record.result) {
      case "PASSED":
        return (
          <Badge
            variant="outline"
            className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-xs px-2.5 py-0.5 rounded-lg gap-1.5"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Passed
          </Badge>
        );
      case "REGULARIZED":
        return (
          <Badge
            variant="outline"
            className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30 text-xs px-2.5 py-0.5 rounded-lg gap-1.5"
          >
            <UserCheck className="h-3.5 w-3.5" />
            Regularized
          </Badge>
        );
      case "FAILED":
        return (
          <Badge
            variant="outline"
            className="bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30 text-xs px-2.5 py-0.5 rounded-lg gap-1.5"
          >
            <XCircle className="h-3.5 w-3.5" />
            Failed
          </Badge>
        );
      case "EXTENDED":
        return (
          <Badge
            variant="outline"
            className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 text-xs px-2.5 py-0.5 rounded-lg gap-1.5"
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            Extended
          </Badge>
        );
      case "VOIDED":
        return (
          <Badge
            variant="outline"
            className="bg-muted text-muted-foreground border-border text-xs px-2.5 py-0.5 rounded-lg line-through"
          >
            Voided
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-xs px-2.5 py-0.5 rounded-lg">
            {record.result}
          </Badge>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl bg-card border-border rounded-2xl p-0 overflow-hidden shadow-2xl">
        <DialogHeader className="sr-only">
          <DialogTitle>Performance Appraisal Dossier - {record.name}</DialogTitle>
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
                  {renderResultBadge()}
                  <Badge variant="secondary" className="text-xs px-2 py-0.5 rounded-md">
                    {record.ratingBand}
                  </Badge>
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
            {record.tenureFormatted && (
              <span className="flex items-center gap-1.5">
                <Briefcase className="h-3.5 w-3.5" />
                Tenure: {record.tenureFormatted}
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
                <Award className="h-3 w-3 text-primary" /> Total Score
              </div>
              <div className="text-xl font-bold text-foreground font-mono">
                {record.totalScore}
                <span className="text-xs font-normal text-muted-foreground"> / 100</span>
              </div>
            </div>

            <div className="bg-muted/40 p-3 rounded-xl border border-border/60">
              <div className="text-[11px] text-muted-foreground font-medium flex items-center gap-1 mb-1">
                <Layers className="h-3 w-3" /> Appraisal Period
              </div>
              <div className="text-xs font-bold text-foreground">
                {record.evalType}
              </div>
            </div>

            <div className="bg-muted/40 p-3 rounded-xl border border-border/60">
              <div className="text-[11px] text-muted-foreground font-medium flex items-center gap-1 mb-1">
                <Calendar className="h-3 w-3" /> Evaluation Date
              </div>
              <div className="text-xs font-bold text-foreground font-mono">
                {record.evaluationDateFormatted}
              </div>
            </div>

            <div className="bg-muted/40 p-3 rounded-xl border border-border/60">
              <div className="text-[11px] text-muted-foreground font-medium flex items-center gap-1 mb-1">
                <UserCheck className="h-3 w-3" /> Evaluator
              </div>
              <div className="text-xs font-bold text-foreground truncate" title={record.evaluatorName || "Unassigned"}>
                {record.evaluatorName || "HR / Manager"}
              </div>
            </div>
          </div>

          {/* Voided Alert (if applicable) */}
          {record.voidedAt && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-3 flex items-start gap-2.5 text-xs text-destructive">
              <AlertOctagon className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Evaluation Voided on {record.voidedAtFormatted}</p>
                <p className="mt-0.5">{record.voidReason || "No void reason specified."}</p>
              </div>
            </div>
          )}

          {/* Evaluator Comments */}
          {record.evaluatorComments && (
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                Evaluator Feedback & Recommendations
              </h4>
              <div className="bg-muted/40 border border-border/60 p-3.5 rounded-xl text-xs sm:text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                {record.evaluatorComments}
              </div>
            </div>
          )}

          {/* Career Milestone & Regularization Tracking */}
          {record.tracking && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <UserCheck className="h-3.5 w-3.5 text-purple-500" />
                Employment & Regularization Milestones
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 bg-muted/40 p-3.5 rounded-xl border border-border/60 text-xs">
                <div>
                  <span className="text-muted-foreground block text-[11px]">Milestone Status</span>
                  <span className="font-bold text-foreground">{record.tracking.careerStatus}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Regularization Date</span>
                  <span className="font-semibold text-foreground font-mono">
                    {record.tracking.regularizedAtFormatted || "Pending / In Probation"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Recommendation</span>
                  <span className="font-semibold text-foreground font-mono">
                    {record.tracking.recommendationIssuedAtFormatted || "Not Issued"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Criteria & Items Breakdown Table */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
              Evaluation Criteria Breakdown ({record.items.length} items)
            </h4>
            <div className="border border-border/60 rounded-xl overflow-hidden bg-background">
              <Table>
                <TableHeader className="bg-muted/50 border-b border-border">
                  <TableRow>
                    <TableHead className="text-[11px] font-semibold text-foreground">
                      Competency / KPI Category
                    </TableHead>
                    <TableHead className="text-[11px] font-semibold text-foreground">
                      Target & Description
                    </TableHead>
                    <TableHead className="text-[11px] font-semibold text-foreground text-center">
                      Weight
                    </TableHead>
                    <TableHead className="text-[11px] font-semibold text-foreground text-center">
                      Rating
                    </TableHead>
                    <TableHead className="text-[11px] font-semibold text-foreground text-right">
                      Weighted
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {record.items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4 text-xs text-muted-foreground">
                        No itemized criteria snapshots recorded for this evaluation.
                      </TableCell>
                    </TableRow>
                  ) : (
                    record.items.map((item, idx) => (
                      <TableRow key={item.id || idx} className="border-b border-border/60">
                        <TableCell className="py-2.5 font-semibold text-xs text-foreground">
                          {item.kpiCategory}
                        </TableCell>
                        <TableCell className="py-2.5 text-xs text-muted-foreground max-w-[240px]">
                          <p className="line-clamp-2">{item.kpiDescription || item.target || "-"}</p>
                        </TableCell>
                        <TableCell className="py-2.5 text-xs font-mono text-center text-foreground">
                          {item.weightPercentage}%
                        </TableCell>
                        <TableCell className="py-2.5 text-xs font-mono font-bold text-center text-primary">
                          {item.rating}
                        </TableCell>
                        <TableCell className="py-2.5 text-xs font-mono font-bold text-right text-foreground">
                          {item.weightedScore}
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

