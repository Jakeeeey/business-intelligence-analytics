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
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Loader2, Search, Calendar, FileSpreadsheet, Layers, MapPin } from "lucide-react";

interface FrequencyTransaction {
  salesmanId?: number;
  salesmanCode?: string;
  salesmanName?: string;
  customerCode?: string;
  storeName?: string;
  province?: string;
  city?: string;
  fiscalPeriod?: string;
  transactionDate?: string;
  invoiceNo?: string;
  netAmount?: number;
}

interface GroupedCustomer {
  customerCode: string;
  storeName: string;
  province: string;
  city: string;
  totalAmount: number;
  transactions: FrequencyTransaction[];
}

interface FrequencyDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  salesmanId: number | string;
  salesmanCode: string;
  salesmanName: string;
  startDate: string;
  endDate: string;
}

export function FrequencyDetailModal({
  isOpen,
  onClose,
  salesmanId,
  salesmanCode,
  salesmanName,
  startDate,
  endDate,
}: FrequencyDetailModalProps) {
  const [transactions, setTransactions] = useState<FrequencyTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!isOpen || !salesmanId) return;

    async function fetchDetails() {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams({
          mode: "frequency-detail",
          salesmanId: String(salesmanId),
          salesmanCode,
          startDate,
          endDate,
        });

        const res = await fetch(`/api/bia/crm/sales-report/salesman-metric?${queryParams.toString()}`);
        const json = await res.json();
        if (json.success) {
          setTransactions(json.data || []);
        } else {
          setTransactions([]);
        }
      } catch (err) {
        console.error("Error fetching frequency transactions:", err);
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    }

    fetchDetails();
  }, [isOpen, salesmanId, salesmanCode, startDate, endDate]);

  const formatPHP = (val: number) =>
    new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(val);

  // Group transactions by customer
  const { groupedCustomers, totalVolume, totalCount } = useMemo(() => {
    const groups: { [key: string]: GroupedCustomer } = {};
    let volume = 0;

    transactions.forEach((tx) => {
      const code = tx.customerCode || "UNKNOWN-CODE";
      const name = tx.storeName || "Unknown Customer";
      const key = `${code}-${name}`;

      if (!groups[key]) {
        groups[key] = {
          customerCode: code,
          storeName: name,
          province: tx.province || "",
          city: tx.city || "",
          totalAmount: 0,
          transactions: [],
        };
      }

      const amt = Number(tx.netAmount) || 0;
      volume += amt;
      groups[key].totalAmount += amt;
      groups[key].transactions.push(tx);
    });

    const sorted = Object.values(groups).sort((a, b) => b.totalAmount - a.totalAmount);

    return {
      groupedCustomers: sorted,
      totalVolume: volume,
      totalCount: transactions.length,
    };
  }, [transactions]);

  // Filter grouped customers by search input
  const filteredCustomers = useMemo(() => {
    return groupedCustomers.filter(
      (c) =>
        c.storeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.customerCode.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [groupedCustomers, searchTerm]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] w-full h-[90vh] flex flex-col overflow-hidden bg-background/95 backdrop-blur-xl border-border/40 shadow-2xl p-6">
        <DialogHeader className="border-b border-border/40 pb-4 flex-shrink-0">
          <div className="flex justify-between items-start pr-6">
            <div>
              <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-[0.2em] font-bold mb-1">
                <FileSpreadsheet className="h-3 w-3 text-primary" /> Transaction Frequency Ledger
              </div>
              <DialogTitle className="text-xl font-black tracking-tight uppercase flex flex-col sm:flex-row sm:items-baseline gap-2">
                <span className="text-primary italic">{salesmanName}</span>
                <span className="text-muted-foreground text-xs font-bold tracking-widest">TRANSACTION HISTORY</span>
              </DialogTitle>
              <DialogDescription className="text-xs font-medium uppercase tracking-wider mt-1 flex items-center gap-1.5 text-muted-foreground">
                <Calendar className="h-3 w-3" /> {startDate} to {endDate}
              </DialogDescription>
            </div>
            <div className="flex flex-col items-end gap-1">
              <Badge variant="outline" className="text-xs font-mono uppercase bg-muted/20">
                {totalCount} Transactions
              </Badge>
            </div>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Loading ledger data...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 my-4 flex-shrink-0">
              <Card className="bg-card/30 border-muted/40 shadow-sm backdrop-blur-sm">
                <CardHeader className="py-2.5 px-4">
                  <CardTitle className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em]">Total Value</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-2.5">
                  <div className="text-2xl font-black text-emerald-500 tracking-tighter">
                    {formatPHP(totalVolume)}
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-card/30 border-muted/40 shadow-sm backdrop-blur-sm">
                <CardHeader className="py-2.5 px-4">
                  <CardTitle className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2">
                    <Layers className="h-3 w-3 text-primary" /> Active Outlets
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-2.5">
                  <div className="text-2xl font-black tracking-tighter text-foreground">
                    {groupedCustomers.length}
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

            {/* Collapsible Accordion Container */}
            <ScrollArea className="flex-1 min-h-0 border border-border/40 rounded-xl bg-card/10 p-4">
              {filteredCustomers.length > 0 ? (
                <Accordion type="multiple" className="w-full space-y-3">
                  {filteredCustomers.map((customer, index) => (
                    <AccordionItem
                      key={`${customer.customerCode}-${index}`}
                      value={`${customer.customerCode}-${index}`}
                      className="border border-border/60 dark:border-zinc-800/80 rounded-xl px-4 py-1.5 bg-card/40 hover:bg-card/75 dark:hover:bg-zinc-900/40 transition-colors shadow-sm overflow-hidden"
                    >
                      <AccordionTrigger className="hover:no-underline py-2.5 flex items-start gap-4">
                        <div className="flex-1 flex flex-col text-left">
                          <span className="text-xs font-mono font-bold text-muted-foreground">
                            {customer.customerCode}
                          </span>
                          <span className="text-sm font-bold uppercase tracking-tight text-foreground/90 mt-0.5">
                            {customer.storeName}
                          </span>
                          {(customer.city || customer.province) && (
                            <span className="text-[10px] text-muted-foreground/85 flex items-center gap-1 mt-1 font-medium">
                              <MapPin className="h-3 w-3 text-muted-foreground/60" />{" "}
                              {[customer.city, customer.province].filter(Boolean).join(", ")}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-col items-end pr-2 gap-1 justify-center self-center">
                          <span className="text-sm font-black text-emerald-500">
                            {formatPHP(customer.totalAmount)}
                          </span>
                          <Badge variant="secondary" className="text-[9px] font-bold py-0.5 px-2">
                            {customer.transactions.length} Invoices
                          </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pt-2 pb-4">
                        <div className="overflow-x-auto rounded-lg border border-border/40 bg-background/50 backdrop-blur-sm">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="border-b border-border/40 bg-muted/40 text-[9px] uppercase font-black text-muted-foreground">
                                <th className="p-3">Invoice No</th>
                                <th className="p-3">Transaction Date</th>
                                <th className="p-3 text-right">Net Amount</th>
                              </tr>
                            </thead>
                            <tbody>
                              {customer.transactions.map((tx, txIdx) => (
                                <tr
                                  key={tx.invoiceNo || txIdx}
                                  className="border-b border-border/20 last:border-b-0 hover:bg-muted/10 font-medium"
                                >
                                  <td className="p-3 font-mono font-bold text-foreground">
                                    {tx.invoiceNo || "N/A"}
                                  </td>
                                  <td className="p-3 text-muted-foreground">
                                    {tx.transactionDate || "N/A"}
                                  </td>
                                  <td className="p-3 text-right font-mono font-bold text-emerald-500/95">
                                    {formatPHP(tx.netAmount || 0)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              ) : (
                <div className="h-32 flex flex-col items-center justify-center text-muted-foreground text-center">
                  <p className="text-xs uppercase font-black tracking-wider">No transaction records found</p>
                </div>
              )}
            </ScrollArea>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
