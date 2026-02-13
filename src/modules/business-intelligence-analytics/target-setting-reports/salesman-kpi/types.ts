/**
 * Individual Salesman KPI record calculated per supplier.
 */
export interface SalesmanMetric {
    salesmanName: string;
    supplierName: string;
    actualSales: number;
    target: number;
    achievement: number; // Percentage (e.g., 85.5)
    status: "HIT" | "MISS";
}

/**
 * Summary object for the Metric Strip cards.
 */
export interface SalesmanSummary {
    totalActual: number;
    totalTarget: number;
    achievement: number;
    variance: number;
}