"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle, Edit2, Loader2, Sparkles, Globe, Tag, CheckCircle2 } from "lucide-react";
import { DynamicReportService } from "../services/DynamicReportService";
import { toast } from "sonner";
import { RegisteredReport } from "../types";
import { cn } from "@/lib/utils";

interface ReportConfigModalProps {
  onSuccess: () => void;
  mode?: "create" | "edit";
  initialData?: RegisteredReport;
  trigger?: React.ReactNode;
}

export function ReportConfigModal({ onSuccess, mode = "create", initialData, trigger }: ReportConfigModalProps) {
  const [name, setName] = useState(initialData?.name || "");
  const [url, setUrl] = useState(initialData?.url || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

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
        toast.success("Connection parameters updated!");
      } else {
        await DynamicReportService.registerReport(name, url);
        toast.success("New data endpoint registered!");
        setName("");
        setUrl("");
      }
      onSuccess();
      setIsOpen(false);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Failed to sync with API";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isEdit = mode === "edit";

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (isEdit ? (
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10 border border-transparent hover:border-primary/20 transition-all group"
            onClick={(e) => e.stopPropagation()}
          >
            <Edit2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
          </Button>
        ) : (
          <Button className="rounded-md gap-2.5 font-black tracking-tighter h-12 px-6 bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-primary/40 active:scale-95 transition-all">
            <PlusCircle className="w-5 h-5" />
            REGISTER ENDPOINT
          </Button>
        ))}
      </DialogTrigger>
      <DialogContent className="rounded-md sm:max-w-[480px] border-none shadow-2xl bg-background/95 backdrop-blur-2xl p-0 overflow-hidden z-[700]">
        <form onSubmit={handleSubmit}>
          {/* Header Section with Gradient */}
          <div className="px-8 pt-10 pb-6 bg-gradient-to-br from-primary/10 via-transparent to-transparent">
            <div className="w-14 h-14 rounded-[1.25rem] bg-primary/10 flex items-center justify-center mb-6 border border-primary/20 shadow-inner">
              {isEdit ? <Sparkles className="w-7 h-7 text-primary" /> : <Globe className="w-7 h-7 text-primary" />}
            </div>
            <DialogHeader>
              <DialogTitle className="text-3xl font-black tracking-tighter text-foreground leading-none">
                {isEdit ? "Refine Endpoint" : "Sync New Source"}
              </DialogTitle>
              <DialogDescription className="text-sm font-bold text-muted-foreground/60 uppercase tracking-[0.2em] mt-2">
                {isEdit ? "Configuration Wizard v2.0" : "Network Integration Panel"}
              </DialogDescription>
            </DialogHeader>
          </div>

          {/* Form Fields */}
          <div className="px-8 py-4 space-y-8">
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <Tag className="w-3.5 h-3.5 text-primary opacity-60" />
                <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Descriptive Label
                </Label>
              </div>
              <Input
                id="name"
                placeholder="e.g. Real-time Inventory Hub"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-14 rounded-2xl bg-muted/30 border-2 border-transparent focus-visible:border-primary/30 focus-visible:ring-0 px-5 font-bold tracking-tight text-lg transition-all"
                required
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <Globe className="w-3.5 h-3.5 text-primary opacity-60" />
                <Label htmlFor="url" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  API Connection String
                </Label>
              </div>
              <Input
                id="url"
                placeholder="/api/v1/analytics/raw-data"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="h-14 rounded-2xl bg-muted/30 border-2 border-transparent focus-visible:border-primary/30 focus-visible:ring-0 px-5 font-mono text-sm transition-all"
                required
              />
            </div>
          </div>

          {/* Footer with Action */}
          <div className="px-8 py-8 mt-4 bg-muted/10 border-t border-border/50">
            <Button
              type="submit"
              disabled={isSubmitting}
              className={cn(
                "w-full h-16 rounded-md font-black tracking-tighter text-xl shadow-xl transition-all active:scale-[0.98]",
                isEdit ? "bg-primary text-primary-foreground shadow-primary/20" : "bg-primary text-primary-foreground shadow-primary/20"
              )}
            >
              {isSubmitting ? (
                <div className="flex items-center gap-3">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span>NEGOTIATING...</span>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6" />
                  <span>{isEdit ? "APPLY UPDATES" : "SAVE ENDPOINT"}</span>
                </div>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
