"use client";

import { useAuditTrail } from "./hooks/useAuditTrail";
import { AuditTrailTable } from "./components/AuditTrailTable";
import { AuditTrailFilters } from "./components/AuditTrailFilters";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCcw } from "lucide-react";

export function TsAuditTrailModule() {
  const {
    logs,
    isLoading,
    filters,
    updateFilters,
    setPage,
    totalRecords,
    refresh
  } = useAuditTrail();

  return (
    <div className="h-full flex flex-col space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Audit Trail</h2>
          <p className="text-muted-foreground">
            Monitor and track all target setting activities and approvals.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={refresh} disabled={isLoading}>
            <RefreshCcw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      <Card className="w-full py-0 gap-0">
        <CardHeader className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0 pb-6 border-b pt-6">
          <div className="space-y-1">
            <CardTitle>Audit Log</CardTitle>
            <CardDescription>
              {totalRecords} records found
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
             <AuditTrailFilters filters={filters} onFilterChange={updateFilters} />
          </div>
        </CardHeader>
        <CardContent className="p-0">
           <AuditTrailTable 
              data={logs} 
              page={filters.page}
              limit={filters.limit}
              totalRecords={totalRecords}
              onPageChange={setPage}
              onLimitChange={(limit) => updateFilters({ limit })}
           />
        </CardContent>
      </Card>
    </div>
  );
}
