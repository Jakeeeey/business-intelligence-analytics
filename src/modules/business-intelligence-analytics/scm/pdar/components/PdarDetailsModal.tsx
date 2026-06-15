import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { PdarRecord } from "../types/pdar.schema";

interface PdarDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: PdarRecord | null;
}

export function PdarDetailsModal({ isOpen, onClose, data }: PdarDetailsModalProps) {
  if (!data) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Dispatch Plan Details</DialogTitle>
          <DialogDescription>
            Details for {data.DP_Number}
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-4">
          <div className="space-y-1">
            <span className="text-sm text-muted-foreground font-medium">DP Number</span>
            <p className="font-semibold">{data.DP_Number}</p>
          </div>
          <div className="space-y-1">
            <span className="text-sm text-muted-foreground font-medium">Driver Name</span>
            <p className="font-semibold">{data.Driver_Name || "N/A"}</p>
          </div>
          <div className="space-y-1">
            <span className="text-sm text-muted-foreground font-medium">Delivery Date</span>
            <p className="font-semibold">{data.DelDate || "N/A"}</p>
          </div>
          <div className="space-y-1">
            <span className="text-sm text-muted-foreground font-medium">Status</span>
            <p className="font-semibold">{data.Status}</p>
          </div>
          <div className="space-y-1">
            <span className="text-sm text-muted-foreground font-medium">Store Name</span>
            <p className="font-semibold">{data.StoreName || "N/A"}</p>
          </div>
          <div className="space-y-1">
            <span className="text-sm text-muted-foreground font-medium">Invoice No</span>
            <p className="font-semibold">{data.Invoice_No || "N/A"}</p>
          </div>
          <div className="space-y-1">
            <span className="text-sm text-muted-foreground font-medium">ETOD / ATOD</span>
            <p className="font-semibold">{data.ETOD || "N/A"} / {data.ATOD || "N/A"}</p>
          </div>
          <div className="space-y-1">
            <span className="text-sm text-muted-foreground font-medium">ETOA / ATOA</span>
            <p className="font-semibold">{data.ETOA || "N/A"} / {data.ATOA || "N/A"}</p>
          </div>
          <div className="space-y-1">
            <span className="text-sm text-muted-foreground font-medium">Invoice Received</span>
            <p className="font-semibold">{data.isInvoiceReceived || "N/A"}</p>
          </div>
          <div className="space-y-1">
            <span className="text-sm text-muted-foreground font-medium">Category</span>
            <p className="font-semibold">{data.Category || "N/A"}</p>
          </div>
          {data.Product && (
            <div className="space-y-1 col-span-2">
              <span className="text-sm text-muted-foreground font-medium">Product</span>
              <p className="font-semibold">{data.Product}</p>
            </div>
          )}
          {data.Remarks && (
            <div className="space-y-1 col-span-2">
              <span className="text-sm text-muted-foreground font-medium">Remarks</span>
              <p className="font-semibold">{data.Remarks}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
