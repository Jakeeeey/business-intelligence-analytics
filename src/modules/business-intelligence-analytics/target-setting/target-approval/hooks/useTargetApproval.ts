"use client";

import { useState, useEffect, useCallback } from "react";
import { format, startOfMonth } from "date-fns";
import { toast } from "sonner";
import {
  checkApproverStatus,
  getExecutiveTargetByPeriod,
  getApprovalRecord,
  submitApproval
} from "../providers/fetchProvider";
import {
  getDivisionAllocations,
  getDivisions,
  getSupplierAllocations,
  getSupervisorAllocations,
  getSalesmanAllocations,
  getSuppliers,
  getSalesmen,
  getAllUsers
} from "../../executive/providers/fetchProvider";
import type {
  TargetSettingExecutive,
  TargetApprover
} from "../types";

export function useTargetApproval() {
  const [selectedPeriod, setSelectedPeriod] = useState<string>(
    format(startOfMonth(new Date()), "yyyy-MM-01")
  );

  const [executiveTarget, setExecutiveTarget] = useState<TargetSettingExecutive | null>(null);
  const [allVotes, setAllVotes] = useState<any[]>([]);
  const [totalApprovers, setTotalApprovers] = useState(0);
  const [isApprover, setIsApprover] = useState(false);
  const [approver, setApprover] = useState<TargetApprover | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Hierarchy Data (Read-only)
  const [allocations, setAllocations] = useState<any[]>([]);
  const [supervisorAllocations, setSupervisorAllocations] = useState<any[]>([]);
  const [supplierAllocations, setSupplierAllocations] = useState<any[]>([]);
  const [salesmanAllocations, setSalesmanAllocations] = useState<any[]>([]);
  const [historicalTargets, setHistoricalTargets] = useState<TargetSettingExecutive[]>([]);
  const [metadata, setMetadata] = useState<any>({
    divisions: [],
    suppliers: [],
    users: [],
    salesmen: []
  });

  const loadAuth = useCallback(async () => {
    const res = await checkApproverStatus() as any;
    setIsApprover(res.isApprover);
    setApprover(res.approver);
    setTotalApprovers(res.totalApprovers || 0);
  }, []);

  const loadData = useCallback(async () => {
    if (!selectedPeriod) return;
    setIsLoading(true);
    try {
      // 1. Fetch Executive Target & Metadata first
      const [target, divisionsData, suppliersData, salesmenData, usersData] = await Promise.all([
        getExecutiveTargetByPeriod(selectedPeriod),
        getDivisions(),
        getSuppliers(),
        getSalesmen(),
        getAllUsers()
      ]);

      setExecutiveTarget(target);

      // 2. Fetch Approval Records specifically for THIS target ID if it exists
      const votesRes = await getApprovalRecord(selectedPeriod, target?.id);
      setAllVotes(votesRes?.data || []);
      setMetadata({
        divisions: divisionsData,
        suppliers: suppliersData,
        salesmen: salesmenData,
        users: usersData
      });

      if (target) {
        // 2. Fetch Hierarchy
        const [divs, sups, supps, sales] = await Promise.all([
          getDivisionAllocations(target.id),
          getSupervisorAllocations(undefined, selectedPeriod),
          getSupplierAllocations(undefined, selectedPeriod),
          getSalesmanAllocations(undefined, selectedPeriod)
        ]);

        setAllocations(divs);
        setSupervisorAllocations(sups);
        setSupplierAllocations(supps);
        setSalesmanAllocations(sales);

        // 3. Fetch Historical Targets for Trend (Last 6 Months)
        try {
          const startDate = format(startOfMonth(new Date(new Date(selectedPeriod).setMonth(new Date(selectedPeriod).getMonth() - 5))), "yyyy-MM-01");
          const filter = JSON.stringify({ fiscal_period: { _between: [startDate, selectedPeriod] } });
          const histUrl = `/api/bia/target-setting/executive?filter=${filter}&sort=fiscal_period`;
          const histRes = await fetch(histUrl, { cache: "no-store" });
          if (histRes.ok) {
            const histData = await histRes.json();
            setHistoricalTargets(Array.isArray(histData?.data) ? histData.data : []);
          }
        } catch (e) {
          console.error("Failed to fetch historical targets", e);
        }
      } else {
        setAllocations([]);
        setSupervisorAllocations([]);
        setSupplierAllocations([]);
        setSalesmanAllocations([]);
        setHistoricalTargets([]);
      }
    } catch (error) {
      console.error("Failed to load approval data", error);
      toast.error("Failed to load targets");
    } finally {
      setIsLoading(false);
    }
  }, [selectedPeriod]);

  useEffect(() => {
    loadAuth();
  }, [loadAuth]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAction = async (status: 'APPROVED' | 'REJECTED') => {
    if (!executiveTarget || !approver) return;

    setIsLoading(true);
    try {
      const res = await submitApproval({
        target_record_id: executiveTarget.id,
        target_period: selectedPeriod,
        approver_id: approver.id,
        status
      });
      toast.success(`Vote submitted. Current Status: ${res.finalStatus}`);
      loadData();
    } catch (error) {
      toast.error(`Failed to submit vote`);
    } finally {
      setIsLoading(false);
    }
  };

  const myVote = allVotes.find(v => v.target_setting_approver_id === approver?.id);

  return {
    selectedPeriod,
    setSelectedPeriod,
    executiveTarget,
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
    approvalRecord: myVote || null,
    myVote: myVote || null,
    approve: () => handleAction('APPROVED'),
    reject: () => handleAction('REJECTED'),
    refresh: loadData
  };
}
