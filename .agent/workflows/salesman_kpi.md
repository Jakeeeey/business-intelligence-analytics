---
description: Guide for developing and maintaining the Salesman KPI Module
---

# Salesman KPI Module Workflow

This workflow describes the file structure, logic, and data flow for the Salesman KPI Module.

## 1. Module Overview
The Salesman KPI module provides a matrix view of salesman performance against targets across different suppliers. It uses a heatmap-style table to visualize achievement levels.

- **Location**: `src/modules/business-intelligence-analytics/target-setting-reports/salesman-kpi`
- **Entry Point**: `SalesmanKPIModule.tsx`

## 2. File Structure
Inside `src/modules/.../salesman-kpi/`:
- `components/`: UI sub-components.
- `providers/fetchProvider.ts`: API interaction layer.
- `types.ts`: TypeScript interfaces.
- `SalesmanKPIModule.tsx`: Main matrix logic.

## 3. Logic & Data Flow
### Data Fetching
1.  **Filters**: User selects a "From" and "To" month.
2.  **Requests**:
    - `fetchSalesmanData`: Actual sales by salesman/supplier.
    - `fetchDynamicTargets`: Targets from `target_setting_salesman`.

### Metrics Calculation
- **Matrix Generation**:
    - Maps `salesmanName` x `supplierName` intersections.
    - **Actual**: aggregated `netAmount`.
    - **Target**: filtered from dynamic targets matches by salesman/supplier/date.
    - **Achievement**: `(Actual / Target) * 100`.
- **Heatmap Logic**:
    - Colors cells based on Achievement % (e.g., Green for HIT, Amber for warning, Red for MISS).

## 4. Required Database Schema
- `target_setting_salesman`: Stores the specific targets allocated to a salesman for a given supplier and period.
- `view_sales_performance`: Source of actual sales data.

## 5. Development Notes
- The module relies on `target_setting_salesman` being populated by the Supervisor Target Setting module.
- If targets are missing, they default to 0, which results in "SET" status or N/A achievement.
