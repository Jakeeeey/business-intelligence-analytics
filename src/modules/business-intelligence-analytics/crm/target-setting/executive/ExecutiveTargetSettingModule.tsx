"use client";

import { useExecutiveTargetSetting } from "./hooks/useExecutiveTargetSetting";
import { CompanyTargetCard } from "./components/CompanyTargetCard";
import { DivisionAllocationCard } from "./components/DivisionAllocationCard";
import { AllocationHierarchyLog } from "./components/AllocationHierarchyLog";
import { Loader2 } from "lucide-react";

export default function ExecutiveTargetSettingModule() {
  const { 
    selectedPeriod, 
    setSelectedPeriod, 
    companyTarget, 
    allocations, 
    supervisorAllocations,
    supplierAllocations,
    salesmanAllocations,
    divisions, 
    isLoading,
    saveCompanyTarget,
    addAllocation,
    updateAllocation,
    updateStatus,
    allocatedAmount,
    remainingBalance
  } = useExecutiveTargetSetting();

  // If loading and no data, maybe show full page loader? 
  // But we have inline loading states.
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Step 1: Company Target */}
        <CompanyTargetCard 
          currentTarget={companyTarget}
          onSave={saveCompanyTarget}
          updateStatus={updateStatus}
          isLoading={isLoading}
          selectedPeriod={selectedPeriod}
          onPeriodChange={setSelectedPeriod}
        />

        {/* Step 2: Division Allocation */}
        <DivisionAllocationCard 
          companyTarget={companyTarget}
          divisions={divisions}
          allocations={allocations}
          onAddAllocation={addAllocation}
          onUpdateAllocation={updateAllocation}
          isLoading={isLoading}
          selectedPeriod={selectedPeriod}
          onPeriodChange={setSelectedPeriod}
          allocatedAmount={allocatedAmount}
          remainingBalance={remainingBalance}
        />
      </div>

      {/* Log */}
      <AllocationHierarchyLog 
        companyTarget={companyTarget}
        allocations={allocations}
        supervisorAllocations={supervisorAllocations}
        supplierAllocations={supplierAllocations}
        salesmanAllocations={salesmanAllocations}
      />
    </div>
  );
}
