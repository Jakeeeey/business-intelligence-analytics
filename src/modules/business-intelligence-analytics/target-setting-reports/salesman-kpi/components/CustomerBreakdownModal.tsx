
import React, { useEffect, useState } from "react";
import { format } from "date-fns";
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
import { Badge } from "@/components/ui/badge";
import { Loader2, Coins, Receipt } from "lucide-react";
import { fetchCustomerBreakdown, CustomerBreakdownItem } from "../providers/fetchProvider";

interface CustomerBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  salesmanId: number;
  salesmanName: string;
  supplierId: number;
  supplierName: string;
  dateRange: { start: string; end: string };
}

export function CustomerBreakdownModal({
  isOpen,
  onClose,
  salesmanId,
  salesmanName,
  supplierId,
  supplierName,
  dateRange,
}: CustomerBreakdownModalProps) {
  const [data, setData] = useState<CustomerBreakdownItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<"ALL" | "PAID" | "UNPAID">("ALL");

  useEffect(() => {
    if (isOpen && salesmanId) {
      const load = async () => {
        setLoading(true);
        try {
          // Pass supplierId if available, otherwise 0 or empty which might mean global
          const res = await fetchCustomerBreakdown(salesmanId, supplierId, dateRange.start, dateRange.end);
          setData(res);
        } catch (error) {
          console.error(error);
        } finally {
          setLoading(false);
        }
      };
      load();
    }
  }, [isOpen, salesmanId, supplierId, dateRange]);

  const filteredData = data.filter((item) => {
    if (filter === "PAID") return item.paidAmount > 0;
    if (filter === "UNPAID") return item.unpaidAmount > 0;
    return true;
  });

  const totalSales = filteredData.reduce((acc, item) => acc + item.totalAmount, 0);
  const totalPaid = filteredData.reduce((acc, item) => acc + item.paidAmount, 0);
  const totalUnpaid = filteredData.reduce((acc, item) => acc + item.unpaidAmount, 0);

  const formatMoney = (val: number) =>
    new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(val);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Receipt className="h-5 w-5 text-primary" />
            <span>Customer Breakdown</span>
          </DialogTitle>
          <DialogDescription>
             Breaking down sales for <span className="font-bold text-foreground">{salesmanName}</span> 
             {supplierName && <> on <span className="font-bold text-foreground">{supplierName}</span> products</>}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between py-4 border-b">
          <div className="flex gap-2">
            <Badge 
                variant={filter === "ALL" ? "default" : "outline"} 
                className="cursor-pointer" 
                onClick={() => setFilter("ALL")}
            >
                All
            </Badge>
            <Badge 
                variant={filter === "PAID" ? "default" : "outline"} 
                className="cursor-pointer hover:bg-emerald-100 border-emerald-500 text-emerald-700" 
                onClick={() => setFilter("PAID")}
            >
                Paid Only
            </Badge>
            <Badge 
                variant={filter === "UNPAID" ? "default" : "outline"} 
                className="cursor-pointer hover:bg-amber-100 border-amber-500 text-amber-700" 
                onClick={() => setFilter("UNPAID")}
            >
                Unpaid / Terms
            </Badge>
          </div>
          <div className="text-right">
              <p className="text-xs text-muted-foreground uppercase font-bold">Total Volume</p>
              <p className="text-2xl font-black text-primary">{formatMoney(totalSales)}</p>
          </div>
        </div>

        <div className="flex-1 overflow-auto min-h-[300px] relative">
            {loading ? (
                <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
                <Table>
                    <TableHeader className="sticky top-0 bg-background z-10">
                    <TableRow>
                        <TableHead>Customer</TableHead>
                        <TableHead className="text-right">Tx Count</TableHead>
                        <TableHead className="text-right">Total Amount</TableHead>
                        <TableHead className="text-right text-emerald-600">Paid</TableHead>
                        <TableHead className="text-right text-amber-600">Unpaid / Balance</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {filteredData.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                No records found for this selection.
                            </TableCell>
                        </TableRow>
                    ) : (
                        filteredData.map((item, idx) => (
                            <TableRow key={idx}>
                                <TableCell className="font-medium">
                                    {item.customerName}
                                </TableCell>
                                <TableCell className="text-right text-muted-foreground">{item.invoiceCount}</TableCell>
                                <TableCell className="text-right font-bold">{formatMoney(item.totalAmount)}</TableCell>
                                <TableCell className="text-right text-emerald-600 font-medium">{item.paidAmount > 0 ? formatMoney(item.paidAmount) : "-"}</TableCell>
                                <TableCell className="text-right text-amber-600 font-medium">{item.unpaidAmount > 0 ? formatMoney(item.unpaidAmount) : "-"}</TableCell>
                            </TableRow>
                        ))
                    )}
                    </TableBody>
                </Table>
            )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
