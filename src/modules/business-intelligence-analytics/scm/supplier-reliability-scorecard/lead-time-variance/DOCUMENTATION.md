# Lead Time Variance Module

## Overview

The Lead Time Variance module provides visibility into supplier delivery performance by comparing the actual receipt date against the purchase order approval date.

## Key Metrics

- **Average Lead Time**: The mean number of days between PO approval and receipt across all filtered transactions.
- **Lead Time Variance**: The deviation from expected lead times (calculated as `Receiving Date - PO Date`).

## Architecture

This module follows the standardized 4-layer architecture:

1.  **Component Layer**: `LeadTimeVariancePage.tsx` and sub-components for metrics, charts, and tables.
2.  **Hook Layer**: `useLeadTimeVariance.ts` for managing data fetching and state.
3.  **API Layer**: Local `route.ts` proxying requests to the backend.
4.  **Service Layer**: `lead-time-variance.ts` for direct interaction with the Spring Boot API.

## Filtering Logic

Data is filtered locally based on the `ScmFilterProvider` state:

- **Supplier**: Filters by `supplierName`.
- **Date Range**: Filters by `poDate`.
