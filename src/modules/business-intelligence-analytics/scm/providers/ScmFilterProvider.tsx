"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { format, startOfMonth } from "date-fns";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

interface ScmFilterContextType {
  fromMonth: string;
  toMonth: string;
  selectedSupplier: string;
  setFromMonth: (val: string) => void;
  setToMonth: (val: string) => void;
  setSelectedSupplier: (val: string) => void;
}

const ScmFilterContext = createContext<ScmFilterContextType | undefined>(
  undefined,
);

export function ScmFilterProvider({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const currentYear = new Date().getFullYear();
  const fromMonth = searchParams.get("from") || `${currentYear}-01`;
  const toMonth = searchParams.get("to") || format(new Date(), "yyyy-MM");
  const selectedSupplier = searchParams.get("supplier") || "all";

  const updateFilters = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      params.set(key, value);
    });
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <ScmFilterContext.Provider
      value={{
        fromMonth,
        toMonth,
        selectedSupplier,
        setFromMonth: (val) => updateFilters({ from: val }),
        setToMonth: (val) => updateFilters({ to: val }),
        setSelectedSupplier: (val) => updateFilters({ supplier: val }),
      }}
    >
      {children}
    </ScmFilterContext.Provider>
  );
}

export function useScmFilters() {
  const context = useContext(ScmFilterContext);
  if (context === undefined) {
    throw new Error("useScmFilters must be used within a ScmFilterProvider");
  }
  return context;
}
