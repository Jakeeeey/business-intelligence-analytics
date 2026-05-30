// src/modules/business-intelligence-analytics/scm/consolidator-audit/ConsolidatorAuditModule.tsx
"use client";

import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Spinner } from "@/components/ui/spinner";
import { ClipboardList, Package, FileSpreadsheet, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useConsolidatorAudit } from "./hooks/useConsolidatorAudit";
import { Filters } from "./components/Filters";
import { RelationshipView } from "./components/RelationshipView";
import { DataTable } from "./components/DataTable";

export default function ConsolidatorAuditModule() {
  const hook = useConsolidatorAudit();
  const [activeTab, setActiveTab] = useState("relationship");

  // First-load full-page spinner
  if (hook.loading && !hook.loadedOnce) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4 text-muted-foreground">
        <Spinner className="h-8 w-8 text-primary" />
        <p className="text-sm">Loading consolidator audit logs…</p>
      </div>
    );
  }

  // Calculate quick summary metrics
  const totalPdps = hook.groupedData.length;
  const totalConsolidators = hook.groupedData.reduce((acc, p) => acc + p.consolidators.length, 0);
  const totalDps = hook.groupedData.reduce(
    (acc, p) => acc + p.consolidators.reduce((sum, c) => sum + c.dispatchPlans.length, 0),
    0
  );

  return (
    <div className="space-y-5 p-1">
      {/* Filters Panel */}
      <Filters
        filters={hook.filters}
        onChange={hook.setFilters}
        uniqueStatuses={hook.uniqueStatuses}
        onSearch={hook.handleSearch}
        onClear={hook.handleClear}
        loading={hook.loading}
      />

      {hook.error && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="flex items-center gap-3 p-4 text-destructive">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p className="text-sm font-medium">{hook.error}</p>
          </CardContent>
        </Card>
      )}

      {hook.loadedOnce && (
        <>
          {/* Refresh Loader */}
          {hook.loading && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground px-1 animate-pulse">
              <Spinner className="h-3.5 w-3.5" />
              Updating audit records…
            </div>
          )}

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="border border-border bg-card shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="p-3 bg-primary/10 text-primary rounded-xl">
                  <ClipboardList className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Pre-Dispatch Plans</p>
                  <h3 className="text-2xl font-bold tracking-tight text-card-foreground mt-0.5">{totalPdps}</h3>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-border bg-card shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="p-3 bg-sky-500/10 text-sky-600 dark:text-sky-400 rounded-xl">
                  <Package className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Consolidators Linked</p>
                  <h3 className="text-2xl font-bold tracking-tight text-card-foreground mt-0.5">{totalConsolidators}</h3>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-border bg-card shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
                  <FileSpreadsheet className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Dispatch Plans Tagged</p>
                  <h3 className="text-2xl font-bold tracking-tight text-card-foreground mt-0.5">{totalDps}</h3>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Views Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="bg-muted p-1 rounded-lg border border-border inline-flex h-10">
              <TabsTrigger value="relationship" className="text-xs px-4 py-1.5 rounded-md font-medium transition-all">
                Relationship View
              </TabsTrigger>
              <TabsTrigger value="table" className="text-xs px-4 py-1.5 rounded-md font-medium transition-all">
                Table View
              </TabsTrigger>
            </TabsList>

            <TabsContent value="relationship" className="outline-none pt-1">
              <RelationshipView data={hook.groupedData} />
            </TabsContent>

            <TabsContent value="table" className="outline-none pt-1">
              <DataTable data={hook.data} />
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
