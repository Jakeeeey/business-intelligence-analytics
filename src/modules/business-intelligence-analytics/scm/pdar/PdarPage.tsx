"use client";

import React from "react";
import { CardDescription } from "@/components/ui/card";
import { usePdar } from "./hooks/usePdar";
import { PdarTable } from "./components/PdarTable";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export function PdarPage() {
    const { 
        data, 
        dropdownOptions,
        isLoading, 
        error, 
        filters, 
        handleFilterChange, 
        handleSearch 
    } = usePdar();

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
                <h2 className="text-2xl font-bold text-destructive">Error Loading Data</h2>
                <p className="text-muted-foreground">{error}</p>
                <button 
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-4 md:p-8 pt-6 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Proof of Delivery (PDAR)</h2>
                    <CardDescription className="mt-1">
                        View posted dispatch plans and delivery acknowledgement receipts
                    </CardDescription>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col md:flex-row gap-4 p-4 border rounded-xl bg-card text-card-foreground shadow-sm">
                <div className="grid w-full max-w-[250px] items-center gap-1.5">
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        DP Number
                    </label>
                    <Select 
                        value={filters.docNo} 
                        onValueChange={(val) => handleFilterChange("docNo", val)}
                        disabled={isLoading}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="All DP Numbers" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All DP Numbers</SelectItem>
                            {dropdownOptions.docNos.map(doc => (
                                <SelectItem key={doc} value={doc}>{doc}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="grid w-full max-w-[200px] items-center gap-1.5">
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Category
                    </label>
                    <Select 
                        value={filters.category} 
                        onValueChange={(val) => handleFilterChange("category", val)}
                        disabled={isLoading}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="All Categories" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Categories</SelectItem>
                            {dropdownOptions.categories.map(cat => (
                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="grid w-full max-w-[300px] items-center gap-1.5">
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Store Name
                    </label>
                    <Select 
                        value={filters.storeName} 
                        onValueChange={(val) => handleFilterChange("storeName", val)}
                        disabled={isLoading}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="All Stores" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Stores</SelectItem>
                            {dropdownOptions.storeNames.map(store => (
                                <SelectItem key={store} value={store}>{store}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex items-end">
                    <Button 
                        onClick={handleSearch} 
                        disabled={isLoading}
                        className="w-full md:w-auto"
                    >
                        {isLoading ? (
                            <span className="animate-spin mr-2">⏳</span>
                        ) : (
                            <Search className="w-4 h-4 mr-2" />
                        )}
                        Search
                    </Button>
                </div>
            </div>

            <PdarTable data={data} isLoading={isLoading} />
        </div>
    );
}
