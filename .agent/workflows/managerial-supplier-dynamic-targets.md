---
description: How to implement dynamic targets for the Managerial Supplier Module
---

# Managerial Supplier Module: Dynamic Target Implementation Workflow

This workflow outlines the steps to replace static target data with dynamic data from the target setting tables.

## 1. Analyze Core Logic
The module uses `fetchManagerialData` to get actual sales. Targets are currently hardcoded in `SUPPLIER_TARGETS`.
The drill-down flow is: Division -> Supplier (BarChart) -> Salesman (Drill-down).

## 2. Database Schema (DDLs)
The following tables are central to this module:
- `target_setting_division`: Top-level division targets.
- `target_setting_supplier`: Targets allocated to specific suppliers under a division.
- `target_setting_supervisor`: Targets allocated to supervisors/salesmen.
- `target_setting_salesman`: Final grain for target allocation.

## 3. Implementation Steps

### A. Backend API Integration
- Locate or create an API route that joins these tables and filters by `fiscal_period`.
- Ensure the API returns targets mapped to `supplier_id` and `salesman_id` (or `user_id`).

### B. Frontend Data Fetching
- Update `fetchProvider.ts` to include a function for fetching targets.
- The query should likely use the `fromMonth` and `toMonth` to match `fiscal_period`.

### C. Module Logic Update
- Replace `SUPPLIER_TARGETS` with a dynamic state populated from the API.
- Update `useMemo` hooks to use the dynamic targets when calculating achievement and health.
- Handle cases where targets might be missing (default to 0 or a fallback).

### D. Verification
- Verify that the "Achievement" metric matches (Actual / Dynamic Target).
- Verify that the BarChart colors correctly reflect "HIT" (>= 100%) or "MISS" (< 100%) based on dynamic data.
- Test the drill-down to ensure salesman targets are also dynamic.
