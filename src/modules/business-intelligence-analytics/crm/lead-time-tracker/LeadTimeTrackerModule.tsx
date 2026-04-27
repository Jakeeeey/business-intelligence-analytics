"use client";

import * as React from "react";
import { AlertCircle } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
// import { Card, CardContent } from "@/components/ui/card";
// import { Spinner } from "@/components/ui/spinner";

import { Filters } from "./components/Filters";
import KPICards from "./components/KPICards";
import { LeadTimeTable } from "./components/LeadTimeTable";
import AverageDaysByStageChart from "./components/charts/AverageDaysByStageChart";
import POVolumeOverTimeChart from "./components/charts/POVolumeOverTimeChart";
import TimelineView from "./components/timeline/TimelineView";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useLeadTimeReport } from "./hooks/useLeadTimeReport";

export default function LeadTimeTrackerModule() {
  const hook = useLeadTimeReport();
  // const hasData = hook.readyState.hasData;
  // const rowCount = hook.rows.length;

  return (
    <div className="space-y-6  mx-auto">
      <Filters
        filters={hook.filters}
        products={hook.products}
        loadingProducts={hook.loadingFilters}
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
          {/* Additional charts: average days by stage + PO volume */}
          <div className="grid gap-4 md:grid-cols-12 my-4">
            <div className="col-span-12 lg:col-span-4">
              <AverageDaysByStageChart rows={hook.rows} />
            </div>
            <div className="col-span-12 lg:col-span-8">
              <POVolumeOverTimeChart rows={hook.rows} />
            </div>
          </div>

          <LeadTimeTable rows={hook.rows} loading={hook.loadingData} />
        </TabsContent>

        <TabsContent value="timeline">
          <TimelineView
            filters={hook.filters}
            rows={hook.rows}
            loading={hook.loadingData}
            error={hook.error}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
