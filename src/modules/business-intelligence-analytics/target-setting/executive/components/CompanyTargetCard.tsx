import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
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

  useEffect(() => {
    if (currentTarget) {
      setTargetAmount(currentTarget.target_amount.toString());
    } else {
      setTargetAmount("");
    }
  }, [currentTarget]);

  const handleSave = () => {
    if (!targetAmount || !selectedPeriod) return;
    
    onSave({
      target_amount: parseFloat(targetAmount),
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
          case 'APPROVED': return <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">Approved</Badge>;
          case 'REJECTED': return <Badge className="bg-red-100 text-red-800 hover:bg-red-100 border-red-200">Rejected</Badge>;
          default: return <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200">Draft</Badge>;
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
        <div className="flex items-center gap-2">
            {getStatusBadge(status)}
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
                    type="number" 
                    placeholder="0.00" 
                    value={targetAmount} 
                    onChange={(e) => setTargetAmount(e.target.value)}
                    disabled={isApproved}
                />
            </div>

            <div className="flex-none">
                <Button onClick={handleSave} disabled={isLoading || !targetAmount || !selectedPeriod || isApproved}>
                    {currentTarget ? 'Update Allocation' : 'Set Allocation'}
                </Button>
            </div>
        </div>

        {currentTarget && (
            <div className="flex justify-end gap-2 pt-2 border-t">
                {status !== 'APPROVED' && (
                    <Button variant="outline" size="sm" onClick={() => updateStatus('APPROVED')} className="text-green-600 border-green-200 hover:bg-green-50">
                        <CheckCircle className="w-4 h-4 mr-1" /> Approve Target
                    </Button>
                )}
                {status === 'APPROVED' && (
                     <Button variant="outline" size="sm" onClick={() => updateStatus('DRAFT')} className="text-gray-600">
                        Reopen to Draft
                    </Button>
                )}
                {status !== 'REJECTED' && status !== 'APPROVED' && (
                   <Button variant="ghost" size="sm" onClick={() => updateStatus('REJECTED')} className="text-red-600 hover:bg-red-50 hover:text-red-700">
                        <XCircle className="w-4 h-4 mr-1" /> Reject
                   </Button>
                )}
            </div>
        )}
      </CardContent>
    </Card>
  );
}
