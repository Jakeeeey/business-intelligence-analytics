import React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { VProductMovementDto } from "../types";
import { format } from "date-fns";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    data: VProductMovementDto[];
}

export const MovementDrillDownSheet: React.FC<Props> = ({ isOpen, onClose, title, data }) => {
    const totalBoxes = data.reduce((sum, item) => sum + (item.computedBoxQty || 0), 0);

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent className="w-full sm:max-w-2xl md:max-w-4xl overflow-y-auto p-0 flex flex-col h-full border-l">
                <SheetHeader className="p-6 border-b bg-muted/20 shrink-0">
                    <SheetTitle className="text-xl">{title}</SheetTitle>
                    <SheetDescription className="flex items-center gap-2 mt-2">
                        Found {data.length} transaction{data.length !== 1 ? 's' : ''}
                        <Badge variant="secondary" className="font-mono">Total Volume: {totalBoxes.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</Badge>
                    </SheetDescription>
                </SheetHeader>

                <div className="flex-1 overflow-x-auto p-0">
                    <Table className="min-w-full">
                        <TableHeader className="bg-muted/50 sticky top-0 shadow-sm">
                            <TableRow>
                                <TableHead className="w-[120px] whitespace-nowrap pl-6">Date</TableHead>
                                <TableHead className="w-[140px] whitespace-nowrap">Doc No</TableHead>
                                <TableHead className="min-w-[200px]">Product</TableHead>
                                <TableHead className="text-right whitespace-nowrap">Base Qty</TableHead>
                                <TableHead className="text-right whitespace-nowrap pr-6">Converted</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.map((row, idx) => {
                                const baseQty = (row.inBase || 0) + (row.outBase || 0);
                                return (
                                    <TableRow key={`${row.docNo}-${idx}`}>
                                        <TableCell className="font-mono text-xs pl-6">
                                            {format(new Date(row.ts), "MMM dd, yyyy")}
                                        </TableCell>
                                        <TableCell className="font-mono text-xs font-semibold">{row.docNo}</TableCell>
                                        <TableCell className="text-xs">
                                            <div className="font-medium">{row.productName}</div>
                                            {row.descr && <div className="text-[10px] text-muted-foreground mt-0.5">{row.descr}</div>}
                                        </TableCell>
                                        <TableCell className="text-right font-mono text-xs">
                                            {baseQty.toLocaleString()} <span className="text-[10px] text-muted-foreground">{row.unit}</span>
                                        </TableCell>
                                        <TableCell className="text-right font-mono text-xs font-bold text-primary pr-6">
                                            {row.computedBoxQty?.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                </div>
            </SheetContent>
        </Sheet>
    );
};