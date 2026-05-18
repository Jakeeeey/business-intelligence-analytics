"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  Search, 
  Trash2, 
  Edit2,
  Table as TableIcon,
  ShieldCheck,
  Layers,
  Plus,
  Link2,
  Database,
  XCircle
} from "lucide-react";
import { RegisteredReport } from "../types";
import { ReportConfigModal } from "./ReportConfigModal";
import { DeleteReportDialog } from "./DeleteReportDialog";
import { Input } from "@/components/ui/input";

interface ManageReportsModalProps {
  reports: RegisteredReport[];
  onRefresh: () => void;
  trigger?: React.ReactNode;
}

export function ManageReportsModal({ reports, onRefresh, trigger }: ManageReportsModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const filteredReports = reports.filter(r => 
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.url.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button 
            variant="outline" 
            className="rounded-md h-9 p-0 bg-destructive/10 border-destructive/20 hover:bg-destructive/20 transition-all active:scale-95 overflow-hidden flex items-stretch group/btn"
          >
            <div className="bg-destructive/10 px-2.5 flex items-center justify-center border-r border-destructive/20 group-hover/btn:bg-destructive/20 transition-colors">
              <Layers className="w-3.5 h-3.5 text-destructive" />
            </div>
            <span className="px-3 flex items-center text-[9px] font-black uppercase tracking-[0.15em] text-destructive">
              MANAGE REPORTS
            </span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent 
        className="rounded-xl sm:max-w-2xl border border-border/50 shadow-2xl bg-background p-0 overflow-hidden z-[600] [&>button]:hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <div className="flex flex-col h-[520px]">
          {/* Header Area - Compact Industrial */}
          <div className="px-6 py-4 bg-muted/20 border-b border-border/50">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20 shadow-sm">
                  <ShieldCheck className="w-5 h-5 text-primary" />
                </div>
                <div className="flex flex-col">
                  <DialogTitle className="text-sm font-black tracking-widest uppercase">Analytics Registry</DialogTitle>
                  <span className="text-[9px] font-bold text-muted-foreground tracking-tight opacity-50 uppercase leading-none">Endpoint Management System</span>
                </div>
              </div>
              <ReportConfigModal 
                onSuccess={onRefresh} 
                trigger={
                  <Button size="sm" className="h-8 px-3 rounded-lg bg-primary text-primary-foreground font-black text-[9px] uppercase tracking-widest gap-2 shadow-sm active:scale-95 transition-all">
                    <Plus className="w-3.5 h-3.5" />
                    REGISTER ENDPOINT
                  </Button>
                }
              />
            </div>

            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/30 group-focus-within:text-primary transition-colors" />
              <Input 
                placeholder="SEARCH ENDPOINTS BY NAME OR SOURCE URL..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9 rounded-lg border-border bg-background shadow-sm font-mono text-[10px] font-black tracking-widest uppercase transition-all focus-visible:ring-1 focus-visible:ring-primary/20"
              />
            </div>
          </div>

          {/* List Area - Clean & Dense */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-hide">
            {filteredReports.length > 0 ? (
              filteredReports.map((report) => (
                <div 
                  key={report.id} 
                  className="group flex items-center gap-3 p-2.5 rounded-lg bg-muted/10 hover:bg-muted/30 border border-border/30 hover:border-primary/20 transition-all duration-200"
                >
                  <div className="w-8 h-8 rounded-md bg-background flex items-center justify-center shadow-sm border border-border/10 group-hover:border-primary/20 transition-all">
                    <TableIcon className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="font-black tracking-tight text-[11px] uppercase truncate group-hover:text-primary transition-all">
                      {report.name}
                    </h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="flex items-center gap-1 px-1.5 py-0.5 bg-background border border-border/50 rounded-md shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]">
                        <Link2 className="w-2.5 h-2.5 text-muted-foreground/40" />
                        <span className="text-[9px] font-bold text-muted-foreground/60 truncate max-w-[400px] font-mono lowercase tracking-tighter">
                          {report.url}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 transition-all">
                    <ReportConfigModal 
                      mode="edit" 
                      initialData={report} 
                      onSuccess={onRefresh} 
                      trigger={
                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md hover:bg-primary/10 hover:text-primary transition-all">
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                      }
                    />
                    <DeleteReportDialog 
                      reportId={report.id} 
                      reportName={report.name} 
                      onSuccess={onRefresh} 
                      trigger={
                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md hover:bg-destructive/10 hover:text-destructive transition-all">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      }
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center py-12 opacity-10">
                <Database className="w-10 h-10 mb-2" />
                <p className="text-[8px] font-black uppercase tracking-[0.4em]">Registry Offline</p>
              </div>
            )}
          </div>

          {/* Footer Area */}
          <div className="px-6 py-3 bg-muted/10 border-t border-border/50 flex items-center justify-between">
            <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40">
              Total Managed Nodes: <span className="text-primary font-bold">{filteredReports.length}</span>
            </span>
            <Button 
              variant="ghost" 
              onClick={() => setIsOpen(false)}
              className="h-8 px-4 rounded-lg hover:bg-muted text-[10px] font-black uppercase tracking-widest gap-2 transition-all active:scale-95 border border-border/50"
            >
              <XCircle className="w-3.5 h-3.5 opacity-50" />
              CLOSE REGISTRY
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
