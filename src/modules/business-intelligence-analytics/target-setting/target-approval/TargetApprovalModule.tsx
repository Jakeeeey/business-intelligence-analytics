"use client";

import { useTargetApproval } from "./hooks/useTargetApproval";
import { PeriodSelectorCard } from "./components/PeriodSelectorCard";
import { ApprovalActionCard } from "./components/ApprovalActionCard";
import { ReadonlyCompanyTargetCard } from "./components/ReadonlyCompanyTargetCard";
import { AllocationHierarchyLog } from "../executive/components/AllocationHierarchyLog";
import { TargetHealthMetrics } from "./components/TargetHealthMetrics";
import { TargetApprovalCharts } from "./components/TargetApprovalCharts";
import { TargetSankeyChart } from "./components/TargetSankeyChart";
import { Loader2 } from "lucide-react";
import { useMemo } from "react";

export default function TargetApprovalModule() {
  const {
    selectedPeriod,
    setSelectedPeriod,
    executiveTarget,
    approvalRecord,
    myVote,
    allVotes,
    totalApprovers,
    isApprover,
    isLoading,
    allocations,
    supervisorAllocations,
    supplierAllocations,
    salesmanAllocations,
    historicalTargets,
    metadata,
    approve,
    reject
  } = useTargetApproval();

  // Manually join metadata for the hierarchy log to ensure names are displayed
  const joinedAllocations = useMemo(() => {
    return allocations.map(a => ({
      ...a,
      division_name: metadata.divisions.find((d: any) => d.division_id === a.division_id)?.division_name
    }));
  }, [allocations, metadata.divisions]);

  const joinedSupplierAllocations = useMemo(() => {
    return supplierAllocations.map(a => ({
      ...a,
      supplier_name: metadata.suppliers.find((s: any) => s.id === a.supplier_id)?.supplier_name
    }));
  }, [supplierAllocations, metadata.suppliers]);

  const joinedSupervisorAllocations = useMemo(() => {
    return supervisorAllocations.map(a => {
      const u = metadata.users.find((u: any) => u.user_id === a.supervisor_user_id);
      return {
        ...a,
        supervisor_name: u ? `${u.user_fname} ${u.user_lname}` : undefined
      };
    });
  }, [supervisorAllocations, metadata.users]);

  const joinedSalesmanAllocations = useMemo(() => {
    return salesmanAllocations.map(a => ({
      ...a,
      salesman_name: metadata.salesmen.find((s: any) => s.id === a.salesman_id)?.salesman_name
    }));
  }, [salesmanAllocations, metadata.salesmen]);

  const totalAllocated = useMemo(() => {
    return allocations.reduce((sum, a) => sum + (a.target_amount || 0), 0);
  }, [allocations]);

  const approvalCount = allVotes.filter(v => v.status === 'APPROVED').length;

  return (
    <div className="space-y-6">
      {/* Configuration & Action Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <PeriodSelectorCard 
          selectedPeriod={selectedPeriod}
          onPeriodChange={setSelectedPeriod}
          isLoading={isLoading}
        />
        <ApprovalActionCard 
          approvalRecord={approvalRecord}
          myVote={myVote}
          allVotes={allVotes}
          totalApprovers={totalApprovers}
          onApprove={approve}
          onReject={reject}
          isLoading={isLoading}
          isApprover={isApprover}
          hasTarget={!!executiveTarget}
        />
      </div>

      {/* NEW: Target Health Metrics Strip */}
      <TargetHealthMetrics 
        totalTarget={executiveTarget?.target_amount || 0}
        totalAllocated={totalAllocated}
        approvalCount={approvalCount}
        totalApprovers={totalApprovers}
        isLoading={isLoading}
      />

      {/* NEW: Visual Breakdowns */}
      <TargetApprovalCharts 
        allocations={joinedAllocations}
        historicalTargets={historicalTargets}
        isLoading={isLoading}
      />

      {/* NEW: Sankey Hierarchy Flow */}
      <TargetSankeyChart 
        companyTarget={executiveTarget}
        allocations={joinedAllocations}
        supplierAllocations={joinedSupplierAllocations}
        supervisorAllocations={joinedSupervisorAllocations}
        salesmanAllocations={joinedSalesmanAllocations}
        isLoading={isLoading}
      />

      {/* Main Target Display (Read-only) */}
      <ReadonlyCompanyTargetCard 
        target={executiveTarget}
        isLoading={isLoading}
      />

      {/* Detailed Hierarchy Log */}
      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 bg-white/50 z-20 flex items-center justify-center rounded-lg">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
        <AllocationHierarchyLog 
          companyTarget={executiveTarget}
          allocations={joinedAllocations}
          supplierAllocations={joinedSupplierAllocations}
          supervisorAllocations={joinedSupervisorAllocations}
          salesmanAllocations={joinedSalesmanAllocations}
        />
      </div>
    </div>
  );
}
