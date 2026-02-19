# Fulfillment Rate Module Documentation

## Overview

The Fulfillment Rate module provides visual reports on supplier purchase order fulfillment performance. It tracks ordered vs. received quantities and flags suppliers falling below the 95% target threshold.

## Location

- **Module**: `src/modules/business-intelligence-analytics/scm/supplier-reliability-scorecard/fulfillment-rate`
- **Route**: `src/app/(business-intelligence-analytics)/bia/scm/supplier-reliability-scorecard/fulfillment-rate`
- **API**: `src/app/api/bia/scm/supplier-reliability-scorecard/fulfillment-rate`

## Technical Details

### Authentication Logic

The module uses the existing user session for authentication:

1. Retrieves the `vos_access_token` from the browser cookies.
2. Forwards this token in the `Authorization: Bearer <token>` header to the Spring Boot API.
3. If the token is missing, the API route returns a 401 Unauthorized response.

### Data Flow

- **Component**: `FulfillmentRatePage.tsx`
- **Hook**: `useFulfillmentRate.ts`
- **Service**: `fulfillment-rate.ts` (Client)
- **API Route**: `route.ts` (Next.js server-side proxy)
- **Backend API**: `SPRING_API_BASE_URL/api/view-supplier_fulfillment_rate_po/all`

### Filtering

Shared filtering is handled by `ScmFilterProvider.tsx`, located in `src/modules/business-intelligence-analytics/scm/providers/`.

- **Component**: Uses `ScmDateRangePicker.tsx` (Shadcn-based calendar).
- **Format**: Syncs `from` and `to` dates as `yyyy-MM-dd` strings in the URL.
- **Provider**: Exposes `dateRange` object and `setDateRange` setter.

## UI Components

- **Summary Cards**: Displays key metrics like average fulfillment and orders count.
- **Bar Chart**: Visualizes fulfillment percentage per supplier with a 95% threshold line.
- **DataTable**: uses `new-data-table.tsx` for detailed PO-level analysis.

## Development Standards

- Strictly adheres to Shadcn/UI.
- No inline styles used.
- Types defined via Zod in `fulfillment-rate.schema.ts`.
