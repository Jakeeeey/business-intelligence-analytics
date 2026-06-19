"use client";

import * as React from "react";
import { AlertCircle } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

import { Filters } from "./components/Filters";
import KPICards from "./components/KPICards";
import { CustomerLeadTimeTable } from "./components/CustomerLeadTimeTable";
import AverageDaysByStageChart from "./components/charts/AverageDaysByStageChart";
import SOVolumeOverTimeChart from "./components/charts/SOVolumeOverTimeChart";
import TimelineView from "./components/timeline/TimelineView";
import { useCustomerLeadTimeReport } from "./hooks/useCustomerLeadTimeReport";

export default function LeadTimeTrackerPerCustomerModule() {
  const hook = useCustomerLeadTimeReport();

  return (
    <div className="space-y-6 mx-auto">
      <Filters
        filters={hook.filters}
        customers={hook.customers}
        loadingCustomers={hook.loadingFilters}
        loadingData={hook.loadingData}
        onChange={hook.setFilters}
        onApply={hook.applyFilters}
      />

      {hook.error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Unable to load data</AlertTitle>
          <AlertDescription>{hook.error}</AlertDescription>
        </Alert>
      ) : null}

      <KPICards rows={hook.rows} loading={hook.loadingData} />

      <Tabs defaultValue="table">
        <TabsList className="w-full">
          <TabsTrigger value="table">Table View</TabsTrigger>
          <TabsTrigger value="timeline">Timeline View</TabsTrigger>
        </TabsList>

        <TabsContent value="table">
          {/* Charts displayed directly in the table view */}
          <div className="grid gap-4 md:grid-cols-12 my-4">
            <div className="col-span-12 lg:col-span-4">
              <AverageDaysByStageChart rows={hook.rows} />
            </div>
            <div className="col-span-12 lg:col-span-8">
              <SOVolumeOverTimeChart rows={hook.rows} filters={hook.filters} />
            </div>
          </div>

          <CustomerLeadTimeTable
            rows={hook.rows}
            loading={hook.loadingData}
            loadedOnce={hook.readyState.loadedOnce}
          />
        </TabsContent>

        <TabsContent value="timeline">
          <TimelineView
            filters={hook.filters}
            rows={hook.rows}
            loading={hook.loadingData}
            error={hook.error}
            loadedOnce={hook.readyState.loadedOnce}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
