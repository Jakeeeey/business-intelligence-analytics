"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import type { Division, CreateDivisionAllocationDTO, TargetSettingExecutive, TargetSettingDivision } from "../types";

interface DivisionAllocationCardProps {
  companyTarget: TargetSettingExecutive | null; // Needed to link tse_id
  divisions: Division[];
  allocations: TargetSettingDivision[];
  onAddAllocation: (data: CreateDivisionAllocationDTO) => Promise<void>;
  onUpdateAllocation: (id: number, data: Partial<CreateDivisionAllocationDTO>) => Promise<void>;
  isLoading: boolean;
  selectedPeriod: string;
  allocatedAmount: number;
  remainingBalance: number;
}

export function DivisionAllocationCard({
  companyTarget,
  divisions,
  allocations,
  onAddAllocation,
  onUpdateAllocation,
  isLoading,
  selectedPeriod,
  allocatedAmount,
  remainingBalance
}: DivisionAllocationCardProps) {
  const [selectedDivision, setSelectedDivision] = useState<string>("");
  const [amount, setAmount] = useState<string>("");

  const formatNumber = (val: string) => {
    if (!val) return "";
    const num = val.replace(/,/g, "");
    if (isNaN(Number(num))) return val;
    const parts = num.split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
  };

  const unformatNumber = (val: string) => val.replace(/,/g, "");

  // Check if selected division already has an allocation
  const existingAllocation = useMemo(() => {
    if (!selectedDivision) return null;
    return allocations.find(a => a.division_id === parseInt(selectedDivision));
  }, [selectedDivision, allocations]);

  // Update amount when a division is selected or allocations change
  const [prevAllocation, setPrevAllocation] = useState<TargetSettingDivision | null>(existingAllocation || null);

  if (existingAllocation !== prevAllocation) {
    setPrevAllocation(existingAllocation || null);
    setAmount(existingAllocation ? formatNumber(existingAllocation.target_amount.toString()) : "");
  }

  const handleAction = () => {
    const rawValue = unformatNumber(amount);
    if (!selectedDivision || !rawValue || !companyTarget) return;

    if (existingAllocation) {
        // Update
        onUpdateAllocation(existingAllocation.id, {
            target_amount: parseFloat(rawValue)
        });
    } else {
        // Add
        onAddAllocation({
            tse_id: companyTarget.id,
            division_id: parseInt(selectedDivision),
            target_amount: parseFloat(rawValue),
            fiscal_period: selectedPeriod,
            created_by: 0 // Overridden by hook
        });
        
        // Reset form (Add only)
        setSelectedDivision("");
        setAmount("");
    }
  };

  const isEnabled = !!companyTarget && companyTarget.status !== 'APPROVED';
  const currency = (val: number) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(val);



  return (
    <Card className="w-full h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="space-y-1">
            <CardTitle>Division Allocation</CardTitle>
            <p className="text-sm text-gray-500">Step 2: Allocate target to specific divisions.</p>
        </div>
        <div className="text-right">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">REMAINING</div>
            <div className={`text-xl font-bold ${remainingBalance < 0 ? 'text-red-600' : 'text-primary'}`}>
                {currency(remainingBalance)}
            </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 space-y-2">
                <label className="text-sm font-medium text-gray-700">SELECT DIVISION</label>
                <Select value={selectedDivision} onValueChange={setSelectedDivision} disabled={!isEnabled}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select Division" />
                    </SelectTrigger>
                    <SelectContent>
                        {divisions.filter(d => !allocations.some(a => a.division_id === d.division_id)).length > 0 && (
                            <SelectGroup>
                                <SelectLabel className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-2 py-1.5">To be Allocated</SelectLabel>
                                {divisions
                                    .filter(div => !allocations.some(a => a.division_id === div.division_id))
                                    .map(div => (
                                        <SelectItem key={div.division_id} value={div.division_id.toString()}>
                                            {div.division_name}
                                        </SelectItem>
                                    ))
                                }
                            </SelectGroup>
                        )}
                        {divisions.filter(d => allocations.some(a => a.division_id === d.division_id)).length > 0 && (
                            <SelectGroup>
                                <SelectLabel className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-2 py-1.5 border-t mt-2">Already Allocated</SelectLabel>
                                {divisions
                                    .filter(div => allocations.some(a => a.division_id === div.division_id))
                                    .map(div => (
                                        <SelectItem key={div.division_id} value={div.division_id.toString()}>
                                            <div className="flex items-center justify-between w-full gap-2">
                                                <span>{div.division_name}</span>
                                                <Badge variant="outline" className="text-[10px] py-0 h-4 bg-blue-50 text-blue-600 border-blue-200">Set</Badge>
                                            </div>
                                        </SelectItem>
                                    ))
                                }
                            </SelectGroup>
                        )}
                    </SelectContent>
                </Select>
            </div>

            <div className="flex-1 space-y-2">
                <label className="text-sm font-medium text-gray-700">SHARE AMOUNT</label>
                <Input 
                    type="text" 
                    placeholder="0.00" 
                    value={amount} 
                    onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9.]/g, "");
                        setAmount(formatNumber(val));
                    }}
                    disabled={!isEnabled}
                />
            </div>
            
            <div className="flex-none">
                <Button 
                    variant={existingAllocation ? "outline" : "secondary"} 
                    onClick={handleAction} 
                    className={existingAllocation ? "border-primary text-primary hover:bg-primary/5" : ""}
                    disabled={isLoading || !selectedDivision || !amount || !isEnabled || (existingAllocation?.target_amount === parseFloat(unformatNumber(amount)))}
                >
                    {existingAllocation ? "Update" : "Add"}
                    {!existingAllocation && <Plus className="ml-2 h-4 w-4" />}
                </Button>
            </div>
        </div>
        <div className="flex justify-between items-center text-xs text-gray-400 pt-2 border-t mt-4 min-h-[32px]">
            <span>Total Divisions: {divisions.length} </span>
            <span>Total Allocated: {currency(allocatedAmount)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
