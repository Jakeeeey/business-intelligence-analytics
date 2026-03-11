"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, ShieldCheck } from "lucide-react";
import type { TargetApprovalRecord, TargetStatus } from "../types";

interface ApprovalActionCardProps {
  approvalRecord: TargetApprovalRecord | null;
  myVote: TargetApprovalRecord | null;
  allVotes: TargetApprovalRecord[];
  totalApprovers: number;
  onApprove: () => void;
  onReject: () => void;
  isLoading: boolean;
  isApprover: boolean;
  hasTarget: boolean;
}

export function ApprovalActionCard({ 
  approvalRecord,
  myVote,
  allVotes,
  totalApprovers,
  onApprove, 
  onReject, 
  isLoading, 
  isApprover,
  hasTarget 
}: ApprovalActionCardProps) {
  
  const status = approvalRecord?.status || 'DRAFT';
  const approvedCount = allVotes.filter(v => v.status === 'APPROVED').length;
  const isRejected = allVotes.some(v => v.status === 'REJECTED');

  const getStatusDisplay = (status: TargetStatus) => {
    if (isRejected) {
      return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 border-red-200 dark:border-red-800/50 py-1 px-3">REJECTED BY QUORUM</Badge>;
    }
    if (approvedCount >= totalApprovers && totalApprovers > 0) {
      return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/40 border-green-200 dark:border-green-800/50 py-1 px-3">APPROVED BY ALL</Badge>;
    }
    if (status === 'DRAFT') {
      return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 border-blue-200 dark:border-blue-800/50 py-1 px-3">WAITING FOR APPROVAL</Badge>;
    }
    return <Badge variant="outline" className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700 py-1 px-3 uppercase">{status} (PENDING)</Badge>;
  };

  if (!isApprover) {
    return (
      <Card className="h-full border-amber-100 bg-amber-50/30 dark:border-amber-900/20 dark:bg-amber-900/10">
        <CardContent className="flex flex-col items-center justify-center h-full py-6 text-center">
          <ShieldCheck className="h-10 w-10 text-amber-500 dark:text-amber-600 mb-2 opacity-50" />
          <p className="text-sm font-medium text-amber-800 dark:text-amber-400">Authorization Required</p>
          <p className="text-xs text-amber-600 dark:text-amber-500">You are not authorized to vote on this target.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div className="space-y-1">
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-gray-400">
            Approval Decisions
          </CardTitle>
          <div className="text-xs font-medium text-gray-500">
            {approvedCount} of {totalApprovers || '?'} approvals recorded
          </div>
        </div>
        {getStatusDisplay(status)}
      </CardHeader>
      <CardContent>
        <div className="flex gap-4">
          <Button 
            className="flex-1 h-12 bg-green-600 hover:bg-green-700 text-white font-bold transition-all shadow-sm"
            disabled={isLoading || !hasTarget || status === 'APPROVED' || isRejected}
            onClick={onApprove}
          >
            <CheckCircle2 className="mr-2 h-5 w-5" />
            APPROVE
          </Button>
          <Button 
            variant="outline"
            className="flex-1 h-12 border-red-200 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 font-bold transition-all"
            disabled={isLoading || !hasTarget || status === 'REJECTED' || isRejected || myVote?.status === 'APPROVED'}
            onClick={onReject}
          >
            <XCircle className="mr-2 h-5 w-5" />
            REJECT
          </Button>
        </div>
        {!hasTarget && (
          <p className="text-[10px] text-center text-gray-400 mt-2 italic">
            No active targets found for this month.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
