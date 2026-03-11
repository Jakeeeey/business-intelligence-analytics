import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import type { CreateCompanyTargetDTO, TargetSettingExecutive } from "../types";

export interface CompanyTargetCardProps {
  currentTarget: TargetSettingExecutive | null;
  onSave: (data: CreateCompanyTargetDTO) => Promise<void>;
  updateStatus: (status: 'DRAFT' | 'APPROVED' | 'REJECTED') => Promise<void>;
  isLoading: boolean;
  selectedPeriod: string;
  onPeriodChange: (date: string) => void;
}

export function CompanyTargetCard({ 
  currentTarget, 
  onSave, 
  updateStatus,
  isLoading, 
  selectedPeriod, 
  onPeriodChange 
}: CompanyTargetCardProps) {
  const [targetAmount, setTargetAmount] = useState<string>("");
  const currency = (val: number) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(val);

  const formatNumber = (val: string) => {
    if (!val) return "";
    const num = val.replace(/,/g, "");
    if (isNaN(Number(num))) return val;
    const parts = num.split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
  };

  const unformatNumber = (val: string) => val.replace(/,/g, "");

  useEffect(() => {
    if (currentTarget) {
      setTargetAmount(formatNumber(currentTarget.target_amount.toString()));
    } else {
      setTargetAmount("");
    }
  }, [currentTarget]);

  const handleSave = () => {
    const rawValue = unformatNumber(targetAmount);
    if (!rawValue || !selectedPeriod) return;
    
    onSave({
      target_amount: parseFloat(rawValue),
      fiscal_period: selectedPeriod,
      created_by: 0 // Will be overridden by hook
    });
  };

  // Generate last 6 months and next 12 months for selection
  const periodOptions = useMemo(() => {
    const options = [];
    const today = new Date();
    for (let i = -6; i < 12; i++) {
        const d = new Date(today.getFullYear(), today.getMonth() + i, 1);
        options.push({
            label: format(d, "MMMM yyyy"),
            value: format(d, "yyyy-MM-01")
        });
    }
    return options;
  }, []);

  const isApproved = currentTarget?.status === 'APPROVED';
  const status = currentTarget?.status || 'DRAFT';

  const getStatusBadge = (status: string) => {
      switch(status) {
          case 'APPROVED': return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/40 border-green-200 dark:border-green-800/50">Approved</Badge>;
          case 'REJECTED': return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 border-red-200 dark:border-red-800/50">Rejected</Badge>;
          default: return <Badge variant="outline" className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700">Draft</Badge>;
      }
  };

  return (
    <Card className="w-full relative overflow-hidden">
      {isLoading && <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>}
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="space-y-1">
            <CardTitle>Executive: Set Company & Division Targets</CardTitle>
            <p className="text-sm text-gray-500">Step 1: Set Total Company Target, then divide it by Division.</p>
        </div>
        <div className="text-right">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Target Status</div>
            <div className="mt-1">
                {getStatusBadge(status)}
            </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 space-y-2">
                <label className="text-sm font-medium">FISCAL PERIOD</label>
                <Select value={selectedPeriod} onValueChange={onPeriodChange} disabled={isLoading}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select Period" />
                    </SelectTrigger>
                    <SelectContent>
                        {periodOptions.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="flex-1 space-y-2">
                <label className="text-sm font-medium">TOTAL COMPANY TARGET</label>
                <Input 
                    type="text" 
                    placeholder="0.00" 
                    value={targetAmount} 
                    onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9.]/g, "");
                        setTargetAmount(formatNumber(val));
                    }}
                    disabled={isApproved}
                />
            </div>

            <div className="flex-none">
                <Button onClick={handleSave} disabled={isLoading || !targetAmount || !selectedPeriod || isApproved}>
                    {currentTarget ? 'Update Allocation' : 'Set Allocation'}
                </Button>
            </div>
        </div>

        <div className="flex justify-between items-center text-xs text-gray-400 pt-2 border-t mt-4 min-h-[32px]">
            <div className="flex gap-4">
                <span>Period: {selectedPeriod ? format(new Date(selectedPeriod), "MMM yyyy") : 'N/A'}</span>
                <span>Target: {currentTarget ? currency(currentTarget.target_amount) : 'Not Set'}</span>
            </div>
            {currentTarget && status === 'REJECTED' && (
                <Button variant="ghost" size="sm" onClick={() => updateStatus('DRAFT')} className="h-6 text-[10px] text-gray-500 hover:text-primary">
                    Reopen to Draft
                </Button>
            )}
        </div>
      </CardContent>
    </Card>
  );
}
