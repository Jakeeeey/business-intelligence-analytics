"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle, Edit2, Loader2 } from "lucide-react";
import { DynamicReportService } from "../services/DynamicReportService";
import { toast } from "sonner";

interface ReportConfigModalProps {
  onSuccess: () => void;
  mode?: "create" | "edit";
  initialData?: {
    id: string | number;
    name: string;
    url: string;
  };
}

export function ReportConfigModal({ onSuccess, mode = "create", initialData }: ReportConfigModalProps) {
  const [name, setName] = useState(initialData?.name || "");
  const [url, setUrl] = useState(initialData?.url || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Sync state if initialData changes (useful for edit mode)
  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setUrl(initialData.url);
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !url) return;

    setIsSubmitting(true);
    try {
      if (mode === "edit" && initialData?.id) {
        await DynamicReportService.updateReport(initialData.id, name, url);
        toast.success("Report configuration updated!");
      } else {
        await DynamicReportService.registerReport(name, url);
        toast.success("Report registered successfully!");
        setName("");
        setUrl("");
      }
      onSuccess();
      setIsOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to save report");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isEdit = mode === "edit";

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {isEdit ? (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <Edit2 className="w-4 h-4" />
          </Button>
        ) : (
          <Button className="rounded-2xl gap-2 font-bold tracking-tighter">
            <PlusCircle className="w-4 h-4" />
            Register New Report
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="rounded-2xl sm:max-w-[425px] border-none shadow-premium backdrop-blur-xl bg-background/80">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black tracking-tighter">
            {isEdit ? "Edit Report Config" : "Register API Endpoint"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the details for this report's API connection."
              : "Enter the details of your Spring Boot API endpoint. We will fetch and display its columns dynamically."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-bold uppercase tracking-widest text-muted-foreground/70">
              Report Name
            </Label>
            <Input
              id="name"
              placeholder="e.g., Inventory Performance"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-xl bg-muted/30 border-none focus-visible:ring-primary/30"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="url" className="text-sm font-bold uppercase tracking-widest text-muted-foreground/70">
              Spring Boot API URL
            </Label>
            <Input
              id="url"
              placeholder="/api/v1/..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="rounded-xl bg-muted/30 border-none focus-visible:ring-primary/30"
              required
            />
          </div>
          <DialogFooter>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl py-6 font-black tracking-tighter text-lg transition-all active:scale-95"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : isEdit ? "Update Configuration" : "Save Report Configuration"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
