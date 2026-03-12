"use client";

import { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import type {
  TargetSettingExecutive,
  TargetSettingDivision,
  Division,
  CreateCompanyTargetDTO,
  CreateDivisionAllocationDTO,
  TargetSettingSupplier,
  TargetSettingSupervisor,
  TargetSettingSalesman
} from "../types";
import {
  getLatestCompanyTarget,
  upsertCompanyTarget,
  updateCompanyTarget,
  updateCompanyTargetStatus,
  getDivisionAllocations,
  createDivisionAllocation,
  updateDivisionAllocation,
  getSupervisorAllocations,
  getSupplierAllocations,
  getSalesmanAllocations,
  getDivisions,
  getSuppliers,
  getSalesmen,
  getAllUsers,
  getTestUser
} from "../providers/fetchProvider";
import { toast } from "sonner";

export function useExecutiveTargetSetting() {
  const [selectedPeriod, setSelectedPeriod] = useState<string>(format(new Date(), "yyyy-MM-01"));
  const [companyTarget, setCompanyTarget] = useState<TargetSettingExecutive | null>(null);
  const [allocations, setAllocations] = useState<TargetSettingDivision[]>([]);
  const [supervisorAllocations, setSupervisorAllocations] = useState<TargetSettingSupervisor[]>([]);
  const [supplierAllocations, setSupplierAllocations] = useState<TargetSettingSupplier[]>([]);
  const [salesmanAllocations, setSalesmanAllocations] = useState<TargetSettingSalesman[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [suppliersMetadata, setSuppliersMetadata] = useState<{ id: number; supplier_name: string }[]>([]);
  const [salesmenMetadata, setSalesmenMetadata] = useState<{ id: number; salesman_name: string }[]>([]);
  const [usersMetadata, setUsersMetadata] = useState<{ user_id: number; user_fname?: string; user_lname?: string }[]>([]);
  const [currentUserId, setCurrentUserId] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(false);

  // Initial Load: Metadata & User
  useEffect(() => {
    Promise.all([
      getDivisions(),
      getSuppliers(),
      getSalesmen(),
      getAllUsers(),
      getTestUser()
    ])
      .then(([divs, sups, sales, users, userId]) => {
        setDivisions(divs.sort((a, b) => a.division_name.localeCompare(b.division_name)));
        setSuppliersMetadata(sups as { id: number; supplier_name: string }[]);
        setSalesmenMetadata(sales as { id: number; salesman_name: string }[]);
        setUsersMetadata(users as { user_id: number; user_fname?: string; user_lname?: string }[]);
        setCurrentUserId(userId);
      })
      .catch(err => console.error("Failed to load metadata", err));
  }, []);

  // Load Target when period changes
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const target = await getLatestCompanyTarget(selectedPeriod);
        setCompanyTarget(target);

        if (target) {
          const [divAllocs, supAllocs, subAllocs, saleAllocs] = await Promise.all([
            getDivisionAllocations(target.id),
            getSupervisorAllocations(undefined, selectedPeriod),
            getSupplierAllocations(undefined, selectedPeriod),
            getSalesmanAllocations(undefined, selectedPeriod)
          ]);

          // Manually join names
          const joinedDivs = divAllocs.map(a => ({
            ...a,
            division_name: divisions.find(d => d.division_id === a.division_id)?.division_name
          }));

          const joinedSuppliers = subAllocs.map(a => ({
            ...a,
            supplier_name: suppliersMetadata.find(s => s.id === a.supplier_id)?.supplier_name || `Supplier #${a.supplier_id}`
          }));

          const joinedSupervisors = supAllocs.map(a => {
            // Use loose comparison for ID match
            const u = usersMetadata.find(u => String(u.user_id) === String(a.supervisor_user_id));
            const name = u ? `${u.user_fname || ''} ${u.user_lname || ''}`.trim() : `User #${a.supervisor_user_id}`;
            return { ...a, supervisor_name: name || `Supervisor #${a.supervisor_user_id}` };
          });

          const joinedSalesmen = saleAllocs.map(a => ({
            ...a,
            salesman_name: salesmenMetadata.find(s => s.id === a.salesman_id)?.salesman_name || `Salesman #${a.salesman_id}`
          }));

          setAllocations(joinedDivs);
          setSupplierAllocations(joinedSuppliers);
          setSupervisorAllocations(joinedSupervisors);
          setSalesmanAllocations(joinedSalesmen);
        } else {
          setAllocations([]);
          setSupervisorAllocations([]);
          setSupplierAllocations([]);
          setSalesmanAllocations([]);
        }
      } catch (error) {
        console.error(error);
        toast.error("Failed to load targets");
      } finally {
        setIsLoading(false);
      }
    };

    if (divisions.length > 0) {
      load();
    }
  }, [selectedPeriod, divisions, salesmenMetadata, suppliersMetadata, usersMetadata]);

  const saveCompanyTarget = async (data: CreateCompanyTargetDTO) => {
    setIsLoading(true);
    try {
      const payload = { ...data, created_by: currentUserId };
      let res;
      if (companyTarget?.id) {
        // Update existing
        res = await updateCompanyTarget(companyTarget.id, payload);
      } else {
        // Create new
        res = await upsertCompanyTarget(payload);
      }
      setCompanyTarget(res);
      toast.success("Company target saved");
    } catch (error) {
      console.error(error);
      toast.error("Failed to save target");
    } finally {
      setIsLoading(false);
    }
  };

  const allocatedAmount = useMemo(() => {
    return allocations.reduce((sum, a) => sum + a.target_amount, 0);
  }, [allocations]);

  const remainingBalance = useMemo(() => {
    if (!companyTarget) return 0;
    return companyTarget.target_amount - allocatedAmount;
  }, [companyTarget, allocatedAmount]);

  const addAllocation = async (data: CreateDivisionAllocationDTO) => {
    if (data.target_amount > remainingBalance) {
      toast.error(`Exceeds remaining balance: ${remainingBalance.toLocaleString()}`);
      return;
    }

    setIsLoading(true);
    try {
      const payload = { ...data, created_by: currentUserId };
      const res = await createDivisionAllocation(payload);
      const withName = {
        ...res,
        division_name: divisions.find(d => d.division_id === res.division_id)?.division_name
      };
      setAllocations(prev => [...prev, withName]);
      toast.success("Division allocation added");
    } catch (error) {
      console.error(error);
      toast.error("Failed to add allocation");
    } finally {
      setIsLoading(false);
    }
  };

  const updateAllocation = async (id: number, data: Partial<CreateDivisionAllocationDTO>) => {
    // Calculate new total if we were to apply this
    const existing = allocations.find(a => a.id === id);
    if (!existing) return;

    const diff = (data.target_amount ?? 0) - existing.target_amount;
    if (diff > remainingBalance) {
      toast.error(`Exceeds remaining balance by ${(diff - remainingBalance).toLocaleString()}`);
      return;
    }

    setIsLoading(true);
    try {
      const res = await updateDivisionAllocation(id, data);
      const withName = {
        ...res,
        division_name: divisions.find(d => d.division_id === res.division_id)?.division_name
      };
      setAllocations(prev => prev.map(a => a.id === id ? withName : a));
      toast.success("Division allocation updated");
    } catch (error) {
      console.error(error);
      toast.error("Failed to update allocation");
    } finally {
      setIsLoading(false);
    }
  };

  const updateStatus = async (status: 'APPROVED' | 'DRAFT' | 'REJECTED') => {
    if (!companyTarget) return;

    if (status === 'APPROVED' && remainingBalance !== 0) {
      const confirm = window.confirm(`There is still a remaining balance of ${remainingBalance.toLocaleString()}. Are you sure you want to approve?`);
      if (!confirm) return;
    }

    setIsLoading(true);
    try {
      const res = await updateCompanyTargetStatus(companyTarget.id, status);
      setCompanyTarget(res);
      toast.success(`Target status updated to ${status}`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to update status");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    selectedPeriod,
    setSelectedPeriod,
    companyTarget,
    allocations,
    supervisorAllocations,
    supplierAllocations,
    salesmanAllocations,
    allocatedAmount,
    remainingBalance,
    divisions, // Return all divisions
    isLoading,
    saveCompanyTarget,
    addAllocation,
    updateAllocation,
    updateStatus
  };
}
