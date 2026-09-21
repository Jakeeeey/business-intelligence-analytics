"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  User,
  Building,
  Phone,
  Mail,
  Calendar,
  Coins,
  Clock,
  Tag,
  FileText,
  Lightbulb,
  Copy,
  Check,
} from "lucide-react";
import { LostCustomerRecord } from "../types";

interface LostCustomerDetailModalProps {
  customer: LostCustomerRecord | null;
  open: boolean;
  onClose: () => void;
}

function getInitials(name: string): string {
  if (!name) return "CU";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getRecommendation(days: number, sales: number) {
  if (days >= 180) {
    return {
      severity: "Critical Risk (Lost Account)",
      badgeColor: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30",
      action:
        sales > 100000
          ? "High-priority account recovery required. Recommend executive/sales manager outreach with tailored win-back incentives and account review."
          : "Account has been inactive for over 6 months. Consider automated re-engagement campaign or reallocating to prospective sales rep.",
    };
  }
  if (days >= 90) {
    return {
      severity: "Severe Inactivity (Dormant)",
      badgeColor: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30",
      action:
        "Customer has missed routine replenishment cycles. Schedule immediate phone call from assigned salesman to check inventory needs or service friction.",
    };
  }
  return {
    severity: "Early Inactivity (At-Risk)",
    badgeColor: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
    action:
      "Customer recently missed expected purchase window. Prompt salesman to send catalog updates, promotional flyers, or quick courtesy follow-up.",
  };
}

export function LostCustomerDetailModal({
  customer,
  open,
  onClose,
}: LostCustomerDetailModalProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!customer) return null;

  const rec = getRecommendation(
    customer.minDaysNoSales,
    customer.totalHistoricalSales
  );

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto bg-card border-border text-foreground p-6 rounded-2xl shadow-xl">
        {/* Header */}
        <DialogHeader className="border-b border-border/60 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-base">
              {getInitials(customer.customerName)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <DialogTitle className="text-lg font-bold text-foreground truncate">
                  {customer.customerName}
                </DialogTitle>
                <Badge
                  variant="outline"
                  className="border-primary/40 bg-primary/10 text-primary font-semibold text-xs px-2 py-0.5 shrink-0"
                >
                  {customer.tagging}
                </Badge>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-mono text-xs text-muted-foreground">
                  {customer.customerCode}
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(customer.customerCode, "code")}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  title="Copy Code"
                >
                  {copiedKey === "code" ? (
                    <Check className="h-3 w-3 text-emerald-500" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Summary Metric Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="rounded-xl border border-border bg-muted/40 p-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5 text-orange-500" />
                <span>Days Inactive</span>
              </div>
              <p className="mt-1 text-lg font-extrabold text-foreground">
                {customer.minDaysNoSales} days
              </p>
            </div>

            <div className="rounded-xl border border-border bg-muted/40 p-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Coins className="h-3.5 w-3.5 text-amber-500" />
                <span>Past Sales Value</span>
              </div>
              <p className="mt-1 text-lg font-extrabold text-foreground">
                ₱
                {customer.totalHistoricalSales.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>

            <div className="rounded-xl border border-border bg-muted/40 p-3 col-span-2 sm:col-span-1">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Calendar className="h-3.5 w-3.5 text-blue-500" />
                <span>Last Recorded Order</span>
              </div>
              <p className="mt-1 text-sm font-semibold text-foreground truncate">
                {customer.lastSalesDate || "No orders"}
              </p>
            </div>
          </div>

          {/* Re-engagement Advice Card */}
          <div className="rounded-xl border border-border/80 bg-muted/30 p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
                <span>Account Recovery Recommendation</span>
              </div>
              <Badge variant="outline" className={`text-[10px] px-2 py-0 ${rec.badgeColor}`}>
                {rec.severity}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {rec.action}
            </p>
          </div>

          {/* Account Details */}
          <div className="rounded-xl border border-border p-3.5 space-y-2.5 text-xs">
            <h4 className="font-bold text-foreground text-xs uppercase tracking-wider flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-primary" />
              Account Information
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-muted-foreground pt-1">
              {customer.branchName && (
                <div className="flex items-center gap-2">
                  <Building className="h-3.5 w-3.5 text-muted-foreground/70" />
                  <span>Branch: <strong className="text-foreground">{customer.branchName}</strong></span>
                </div>
              )}
              {customer.salesmanName && (
                <div className="flex items-center gap-2">
                  <User className="h-3.5 w-3.5 text-muted-foreground/70" />
                  <span>Salesman: <strong className="text-foreground">{customer.salesmanName}</strong></span>
                </div>
              )}
              {customer.contactNumber && (
                <div className="flex items-center justify-between gap-2 pr-2">
                  <span className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground/70" />
                    <span>Contact: <strong className="text-foreground">{customer.contactNumber}</strong></span>
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-1.5 text-[10px]"
                    onClick={() => copyToClipboard(customer.contactNumber!, "phone")}
                  >
                    {copiedKey === "phone" ? "Copied" : "Copy"}
                  </Button>
                </div>
              )}
              {customer.email && (
                <div className="flex items-center justify-between gap-2 pr-2">
                  <span className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground/70" />
                    <span>Email: <strong className="text-foreground">{customer.email}</strong></span>
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-1.5 text-[10px]"
                    onClick={() => copyToClipboard(customer.email!, "email")}
                  >
                    {copiedKey === "email" ? "Copied" : "Copy"}
                  </Button>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Tag className="h-3.5 w-3.5 text-muted-foreground/70" />
                <span>Tagging: <strong className="text-foreground">{customer.tagging}</strong></span>
              </div>
            </div>
          </div>

          {/* Raw payload fields viewer if extra fields exist */}
          {customer.raw && Object.keys(customer.raw).length > 0 && (
            <div className="rounded-xl border border-border bg-muted/20 p-3 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <FileText className="h-3.5 w-3.5 text-primary" />
                <span>Raw Backend Payload Attributes</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono max-h-32 overflow-y-auto">
                {Object.entries(customer.raw).map(([key, val]) => (
                  <div key={key} className="truncate">
                    <span className="text-muted-foreground">{key}: </span>
                    <span className="text-foreground">
                      {typeof val === "object" ? JSON.stringify(val) : String(val)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
