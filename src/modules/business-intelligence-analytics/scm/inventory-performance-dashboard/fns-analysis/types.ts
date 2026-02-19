// src/modules/business-intelligence-analytics/scm/inventory-performance-dashboard/fns-analysis/types.ts

/**
 * Raw response shape from Spring Boot `/api/view-fns-pick-frequency/all`.
 * Each record represents a single product's outbound pick frequency classification.
 */
export type FnsPickFrequencyItem = {
    id: string;               // e.g. "FNS:174:22009"
    branchId: number;          // Warehouse / branch identifier
    productId: number;         // Links to Directus `products.id`
    productName: string;
    productDescription: string;
    windowDays: number;        // Analysis window (e.g. 30 days)
    outboundTxnCount: number;  // Number of outbound picks in the window
    fastThreshold: number;     // Threshold for "Fast" classification (e.g. 15)
    normalThreshold: number;   // Threshold for "Normal" classification (e.g. 5)
    fnsClass: "F" | "N" | "S"; // Fast / Normal / Slow classification
};

/**
 * Enriched row for the UI DataTable — merges Spring Boot data
 * with Directus product (SKU) and supplier info.
 */
export type FnsEnrichedRow = {
    rank: number;
    sku: string;               // From Directus `products.product_code`
    productName: string;       // From Spring Boot `productName`
    supplierName: string;      // Resolved via purchase_order chain
    pickCount: number;         // From Spring Boot `outboundTxnCount`
    fnsClass: "F" | "N" | "S"; // From Spring Boot `fnsClass`
    productId: number;
    branchId: number;
};

/**
 * Distribution summary KPIs for the FNS pie chart and category cards.
 */
export type FnsSummary = {
    fastCount: number;
    normalCount: number;
    slowCount: number;
    totalCount: number;
    fastThreshold: number;     // e.g. 15 — picked from any record
    normalThreshold: number;   // e.g. 5 — picked from any record
};

/**
 * API response shape returned by our Next.js route handler.
 */
export type FnsAnalysisResponse = {
    data: FnsEnrichedRow[];
    summary: FnsSummary;
};
