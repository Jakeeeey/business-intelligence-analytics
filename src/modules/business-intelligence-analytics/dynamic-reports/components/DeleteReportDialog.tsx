"use client";

import React, { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2, AlertTriangle, ShieldAlert, XCircle } from "lucide-react";
import { DynamicReportService } from "../services/DynamicReportService";
import { toast } from "sonner";

interface DeleteReportDialogProps {
  reportId: string | number;
  reportName: string;
  onSuccess: () => void;
  trigger?: React.ReactNode;
}

export function DeleteReportDialog({ reportId, reportName, onSuccess, trigger }: DeleteReportDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await DynamicReportService.deleteReport(reportId);
      toast.success(`Endpoint purged: ${reportName}`);
      onSuccess();
      setIsOpen(false);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Failed to purge record";
      toast.error(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        {trigger || (
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-9 w-9 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 border border-transparent hover:border-destructive/20 transition-all group"
            onClick={(e) => e.stopPropagation()}
          >
            <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent className="rounded-[2.5rem] border-none shadow-2xl bg-background/95 backdrop-blur-2xl p-0 overflow-hidden z-[800] sm:max-w-[440px]">
        {/* Warning Header */}
        <div className="px-8 pt-10 pb-6 bg-gradient-to-br from-destructive/10 via-transparent to-transparent">
          <div className="w-14 h-14 rounded-[1.25rem] bg-destructive/10 flex items-center justify-center mb-6 border border-destructive/20 shadow-inner">
            <ShieldAlert className="w-7 h-7 text-destructive" />
          </div>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-3xl font-black tracking-tighter text-foreground leading-none">
              Confirm Purge
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm font-bold text-destructive/60 uppercase tracking-[0.2em] mt-2">
              Security Protocol v1.0
            </AlertDialogDescription>
          </AlertDialogHeader>
        </div>

        <div className="px-8 py-4">
          <div className="p-4 rounded-2xl bg-destructive/5 border border-destructive/10 space-y-2">
            <p className="text-sm font-bold text-foreground/80 leading-relaxed">
              You are about to permanently disconnect the <span className="text-destructive font-black underline decoration-2 underline-offset-4">{reportName}</span> endpoint.
            </p>
            <p className="text-[10px] font-black uppercase tracking-widest text-destructive/40 flex items-center gap-2">
              <AlertTriangle className="w-3 h-3" /> Data connection will be severed immediately.
            </p>
          </div>
        </div>

        <AlertDialogFooter className="px-8 py-8 mt-4 bg-muted/10 border-t border-border/50 flex-row gap-3">
          <AlertDialogCancel asChild>
            <Button variant="ghost" className="flex-1 h-14 rounded-2xl font-black tracking-tighter uppercase text-muted-foreground hover:bg-muted/50 transition-all">
              Abort
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={isDeleting}
              className="flex-[1.5] h-14 rounded-2xl bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-lg shadow-destructive/20 font-black tracking-tighter text-lg transition-all active:scale-95"
            >
              {isDeleting ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>PURGING...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <XCircle className="w-5 h-5" />
                  <span>PURGE ENDPOINT</span>
                </div>
              )}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
