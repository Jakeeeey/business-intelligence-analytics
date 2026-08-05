"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Loader2, Search, Calendar, UserPlus, MapPin, Milestone } from "lucide-react";

interface NewAccountItem {
  salesmanId?: number;
  salesmanCode?: string;
  salesmanName?: string;
  customerId?: number;
  customerCode?: string;
  customerName?: string;
  storeName?: string;
  province?: string;
  city?: string;
  dateEntered?: string;
  fiscalPeriod?: string;
}

function formatDateTime(dateStr?: string) {
  if (!dateStr) return "-";
  try {
    const formattedStr = dateStr.includes(" ") ? dateStr.replace(" ", "T") : dateStr;
    const dateObj = new Date(formattedStr);
    if (isNaN(dateObj.getTime())) return dateStr;
    
    const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
    const dd = String(dateObj.getDate()).padStart(2, "0");
    const yyyy = dateObj.getFullYear();
    const hh = String(dateObj.getHours()).padStart(2, "0");
    const min = String(dateObj.getMinutes()).padStart(2, "0");
    
    return `${mm}-${dd}-${yyyy} ${hh}:${min}`;
  } catch {
    return dateStr;
  }
}

interface NewAccountsDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  salesmanId: number | string;
  salesmanCode: string;
  salesmanName: string;
  startDate: string;
  endDate: string;
}

export function NewAccountsDetailModal({
  isOpen,
  onClose,
  salesmanId,
  salesmanCode,
  salesmanName,
  startDate,
  endDate,
}: NewAccountsDetailModalProps) {
  const [accounts, setAccounts] = useState<NewAccountItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!isOpen || !salesmanId) return;

    async function fetchDetails() {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams({
          mode: "new-accounts-detail",
          salesmanId: String(salesmanId),
          salesmanCode,
          startDate,
          endDate,
        });

        const res = await fetch(`/api/bia/crm/sales-report/salesman-metric?${queryParams.toString()}`);
        const json = await res.json();
        if (json.success) {
          setAccounts(json.data || []);
        } else {
          setAccounts([]);
        }
      } catch (err) {
        console.error("Error fetching new accounts details:", err);
        setAccounts([]);
      } finally {
        setLoading(false);
      }
    }

    fetchDetails();
  }, [isOpen, salesmanId, salesmanCode, startDate, endDate]);

  // Filter accounts by search input
  const filteredAccounts = useMemo(() => {
    return accounts.filter(
      (acc) =>
        (acc.customerName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (acc.customerCode || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (acc.storeName || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [accounts, searchTerm]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[750px] w-full max-h-[90vh] flex flex-col overflow-hidden bg-background/95 backdrop-blur-xl border-border/40 shadow-2xl p-6">
        <DialogHeader className="border-b border-border/40 pb-4 flex-shrink-0">
          <div className="flex justify-between items-start pr-6">
            <div>
              <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-[0.2em] font-bold mb-1">
                <UserPlus className="h-3.5 w-3.5 text-primary" /> New Accounts Metrics
              </div>
              <DialogTitle className="text-xl font-black tracking-tight uppercase flex flex-col sm:flex-row sm:items-baseline gap-2">
                <span className="text-primary italic">{salesmanName}</span>
                <span className="text-muted-foreground text-xs font-bold tracking-widest">NEW ACCOUNTS LIST</span>
              </DialogTitle>
              <DialogDescription className="text-xs font-medium uppercase tracking-wider mt-1 flex items-center gap-1.5 text-muted-foreground">
                <Calendar className="h-3 w-3" /> {startDate} to {endDate}
              </DialogDescription>
            </div>
            <div className="flex flex-col items-end gap-1">
              <Badge variant="outline" className="text-xs font-mono uppercase bg-muted/20">
                {accounts.length} Total Accounts
              </Badge>
            </div>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Loading accounts...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 my-4 flex-shrink-0">
              <Card className="bg-card/30 border-muted/40 shadow-sm backdrop-blur-sm">
                <CardHeader className="py-2.5 px-4">
                  <CardTitle className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em]">New Registrations</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-2.5">
                  <div className="text-2xl font-black text-primary tracking-tighter">
                    {accounts.length}
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-card/30 border-muted/40 shadow-sm backdrop-blur-sm">
                <CardHeader className="py-2.5 px-4">
                  <CardTitle className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2">
                    <Milestone className="h-3 w-3 text-primary" /> Latest Entry
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-2.5">
                  <div className="text-sm font-black tracking-tight text-foreground">
                    {accounts.length > 0 ? accounts[0].customerName : "N/A"}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filter Bar */}
            <div className="flex items-center gap-2 mb-4 bg-muted/10 p-1.5 rounded-lg border border-border/40 flex-shrink-0">
              <Search className="h-4 w-4 text-muted-foreground ml-2" />
              <Input
                placeholder="Search by customer code or name..."
                className="border-none bg-transparent h-8 text-xs font-bold uppercase placeholder:text-muted-foreground/50 focus-visible:ring-0"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Scrollable Table Area */}
            <div className="flex-1 overflow-y-auto border border-border/40 rounded-xl bg-card/10">
              <Table>
                <TableHeader className="bg-muted/30 sticky top-0 z-10 backdrop-blur-sm">
                  <TableRow className="hover:bg-transparent border-b border-border/40">
                    <TableHead className="w-[50px] text-[9px] uppercase font-black tracking-wider text-muted-foreground">#</TableHead>
                    <TableHead className="text-[9px] uppercase font-black tracking-wider text-muted-foreground">Customer</TableHead>
                    <TableHead className="text-[9px] uppercase font-black tracking-wider text-muted-foreground">Location</TableHead>
                    <TableHead className="text-[9px] uppercase font-black tracking-wider text-muted-foreground">Date Entered</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAccounts.length > 0 ? (
                    filteredAccounts.map((item, index) => (
                      <TableRow key={`${item.customerId || "acc"}-${index}`} className="hover:bg-muted/20 border-border/40 group">
                        <TableCell className="font-mono text-xs text-muted-foreground/50 font-bold">{index + 1}</TableCell>
                        <TableCell className="py-3">
                          <div className="flex flex-col text-left">
                            <span className="text-sm font-bold uppercase tracking-tight text-foreground/90 group-hover:text-foreground">
                              {item.customerName || item.storeName || "Unknown Customer"}
                            </span>
                            <span className="text-xs font-mono font-bold text-muted-foreground mt-0.5">
                              {item.customerCode || "N/A"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="py-3">
                          <span className="text-xs text-muted-foreground/85 flex items-center gap-1 font-medium">
                            <MapPin className="h-3.5 w-3.5 text-muted-foreground/60 flex-shrink-0" />
                            <span className="truncate max-w-[150px]">
                              {[item.city, item.province].filter(Boolean).join(", ") || "N/A"}
                            </span>
                          </span>
                        </TableCell>
                        <TableCell className="py-3 text-xs font-mono font-medium text-muted-foreground">
                          {formatDateTime(item.dateEntered)}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center text-xs uppercase font-bold text-muted-foreground">
                        No new accounts found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
