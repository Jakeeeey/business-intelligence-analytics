"use client";

import React, { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { UnfulfilledOrder } from "../types";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    data: UnfulfilledOrder[];
    startDate: string;
    endDate: string;
}

export const ExportReportModal = ({ isOpen, onClose, data }: Props) => {
    const [printNotFulfilled, setPrintNotFulfilled] = useState(true);
    const [printWithConcerns, setPrintWithConcerns] = useState(true);

    useMemo(() => {
        return data.filter(order => {
            if (printNotFulfilled && order.unfulfilledStatus === 'Not Fulfilled') return true;
            if (printWithConcerns && order.unfulfilledStatus === 'Fulfilled With Concerns') return true;
            return false;
        });
    }, [data, printNotFulfilled, printWithConcerns]);

    const handleAction = async () => {
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader><DialogTitle>Unfulfilled Orders Report</DialogTitle></DialogHeader>
                <div className="py-6 space-y-4 text-card-foreground">
                    <div className="flex items-center space-x-3">
                        <Checkbox id="nf" checked={printNotFulfilled} onCheckedChange={(c) => setPrintNotFulfilled(c === true)} />
                        <Label htmlFor="nf" className="text-sm font-medium cursor-pointer">Include &quot;Not Fulfilled&quot; Records</Label>
                    </div>
                    <div className="flex items-center space-x-3">
                        <Checkbox id="wc" checked={printWithConcerns} onCheckedChange={(c) => setPrintWithConcerns(c === true)} />
                        <Label htmlFor="wc" className="text-sm font-medium cursor-pointer">Include &quot;With Concerns&quot; Records</Label>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleAction}>Generate PDF</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};