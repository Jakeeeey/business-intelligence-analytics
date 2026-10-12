"use client";

import React from "react";
import { MapPin, Store, CheckCircle2, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProvinceSummary } from "../types";

interface NewCustomerGeographicProps {
    summaries: ProvinceSummary[];
    selectedProvince: string;
    onSelectProvince: (province: string) => void;
}

export const NewCustomerGeographic: React.FC<NewCustomerGeographicProps> = ({
    summaries,
    selectedProvince,
    onSelectProvince,
}) => {
    if (summaries.length === 0) {
        return (
            <Card className="border-border bg-card">
                <CardContent className="p-12 text-center text-sm text-muted-foreground">
                    No geographic distribution data available for current filters.
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="font-bold text-base text-foreground">
                        Provincial Distribution
                    </h3>
                    <p className="text-xs text-muted-foreground">
                        Click any province card to filter the registry by that territory
                    </p>
                </div>
                {selectedProvince !== "ALL" && (
                    <Badge
                        variant="secondary"
                        className="cursor-pointer text-xs"
                        onClick={() => onSelectProvince("ALL")}
                    >
                        Viewing {selectedProvince} (Click to reset)
                    </Badge>
                )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {summaries.map((item) => {
                    const isSelected = selectedProvince === item.province;
                    const activePct =
                        item.totalAccounts > 0
                            ? (item.activeAccounts / item.totalAccounts) * 100
                            : 0;

                    return (
                        <Card
                            key={item.province}
                            className={`group relative overflow-hidden border transition-all cursor-pointer ${
                                isSelected
                                    ? "border-primary bg-primary/5 shadow-md"
                                    : "border-border/70 bg-card hover:border-primary/40 hover:shadow-sm"
                            }`}
                            onClick={() =>
                                onSelectProvince(isSelected ? "ALL" : item.province)
                            }
                        >
                            <CardContent className="p-5 flex flex-col justify-between h-full space-y-3">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 rounded-xl bg-primary/10 text-primary shrink-0">
                                            <MapPin className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">
                                                {item.province}
                                            </h4>
                                            <p className="text-xs text-muted-foreground">
                                                {item.citiesCount} unique {item.citiesCount === 1 ? "city/town" : "cities/towns"}
                                            </p>
                                        </div>
                                    </div>

                                    <Badge variant="secondary" className="font-mono text-xs font-bold shrink-0">
                                        {item.totalAccounts.toLocaleString()}
                                    </Badge>
                                </div>

                                <div className="space-y-2 border-t border-border/40 pt-3 text-xs">
                                    <div className="flex items-center justify-between text-muted-foreground">
                                        <span className="flex items-center gap-1">
                                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                            Active Accounts:
                                        </span>
                                        <span className="font-semibold text-foreground">
                                            {item.activeAccounts} ({activePct.toFixed(0)}%)
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between text-muted-foreground">
                                        <span className="flex items-center gap-1">
                                            <Store className="h-3.5 w-3.5 text-purple-500" />
                                            Top Channel:
                                        </span>
                                        <span className="font-medium text-foreground truncate max-w-[140px]">
                                            {item.topStoreType}
                                        </span>
                                    </div>

                                    {/* Mini Progress */}
                                    <div className="w-full bg-muted rounded-full h-1 mt-1 overflow-hidden">
                                        <div
                                            className="bg-primary h-full rounded-full"
                                            style={{ width: `${Math.min(100, activePct)}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center justify-end text-[11px] font-semibold text-primary group-hover:translate-x-1 transition-transform">
                                    <span>Filter registry</span>
                                    <ChevronRight className="h-3.5 w-3.5" />
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
};
