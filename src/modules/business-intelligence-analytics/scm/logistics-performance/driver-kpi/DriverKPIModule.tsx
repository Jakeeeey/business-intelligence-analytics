"use client";

import React from "react";
import { format } from "date-fns";
import { DriverKPIProvider, useDriverKPI } from "./hooks/useDriverKPI";
import { Truck, Package } from "lucide-react";
import Filter from "./components/Filter";

import KPICards from "./components/KPICards";
import LogisticsTable from "./components/LogisticsTable";
import FulfillmentTable from "./components/FulfillmentTable";
import TruckHistoryTable from "./components/TruckHistoryTable";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
// Toaster is provided globally in app/layout.tsx
// import { lstatSync } from "fs";

function DriverKPIModuleContent() {
  // useDriverKPI is used inside child components
  const { lastSync, loading = false } = useDriverKPI();
  return (
    <div className="space-y-6 py-6 px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 2xl:px-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
            Driver Performance
          </h1>
          <p className="text-muted-foreground text-sm font-medium mt-1 flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${loading ? "bg-amber-400 animate-pulse" : "bg-emerald-500"}`}
            />
            Exception Monitoring — Vertex Operations
          </p>
        </div>
        <div className=" ">
          <Filter />
        </div>
      </div>

      <Separator />

      <KPICards />

      <section>
        <Tabs defaultValue="logistics" className="bg-none">
          <div className="flex items-center justify-between w-full ">
            <TabsList className="inline-flex  h-10! items-center gap-2 w-70 font-bold">
              <TabsTrigger
                className="flex items-center gap-2 px-4 py-2 rounded-md text-md font-bold transition-all"
                value="logistics"
              >
                <Truck className="mr-2 h-4 w-4" />
                Logistics
              </TabsTrigger>
              <TabsTrigger
                className="flex items-center gap-2 px-4 py-2 rounded-md text-md font-bold transition-all"
                value="fulfillment"
              >
                <Package className="mr-2 h-4 w-4" />
                Fulfillment
              </TabsTrigger>
            </TabsList>

            <div className="text-right">
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                Last Sync
              </p>
              <p className="text-xs font-mono text-foreground">
                {lastSync ? format(new Date(lastSync), "HH:mm:ss") : "--:--:--"}
              </p>
            </div>
          </div>

          <TabsContent value="logistics">
            <div className="pt-4">
              <LogisticsTable />
            </div>
          </TabsContent>

          <TabsContent value="fulfillment">
            <div className="pt-4">
              <FulfillmentTable />
            </div>
          </TabsContent>
        </Tabs>
      </section>

      <TruckHistoryTable />
    </div>
  );
}

export default function DriverKPIModule() {
  return (
    <DriverKPIProvider>
      <DriverKPIModuleContent />
    </DriverKPIProvider>
  );
}
