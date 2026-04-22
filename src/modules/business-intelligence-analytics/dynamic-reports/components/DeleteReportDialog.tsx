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
import { Trash2, Loader2 } from "lucide-react";
import { DynamicReportService } from "../services/DynamicReportService";
import { toast } from "sonner";

interface DeleteReportDialogProps {
  reportId: string | number;
  reportName: string;
  onSuccess: () => void;
}

export function DeleteReportDialog({ reportId, reportName, onSuccess }: DeleteReportDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await DynamicReportService.deleteReport(reportId);
      toast.success(`${reportName} has been deleted.`);
      onSuccess();
      setIsOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to delete report");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="rounded-2xl border-none shadow-premium bg-background/90 backdrop-blur-xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-2xl font-black tracking-tighter">Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete the <strong>{reportName}</strong> configuration. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel className="rounded-xl font-bold tracking-tight">Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            disabled={isDeleting}
            className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 font-black tracking-tighter px-6"
          >
            {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Yes, Delete Report"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
