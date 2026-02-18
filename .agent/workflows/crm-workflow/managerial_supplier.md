---
description: Guide for developing and maintaining the Managerial Supplier Module
---

# Managerial Supplier Module Workflow

This workflow describes the file structure, logic, and data flow for the Managerial Supplier Module.

## 1. Module Overview
The Managerial Supplier module provides a detailed breakdown of supplier performance within a selected division. It allows managers to compare actual sales against targets and drill down into individual salesman performance.

- **Location**: `src/modules/business-intelligence-analytics/target-setting-reports/managerial-supplier`
- **Entry Point**: `ManagerialSupplierModule.tsx`

## 2. File Structure
Inside `src/modules/.../managerial-supplier/`:
- `components/`: UI components (Cards, Charts).
- `providers/fetchProvider.ts`: API interaction layer.
- `types.ts`: TypeScript interfaces.
- `ManagerialSupplierModule.tsx`: Main container and business logic.

## 3. Logic & Data Flow
### Data Fetching
1. **Inputs**: 
   - `fromMonth` / `toMonth`: Date range (defaults to current year/month).
   - `selectedDivision`: Division to filter by (defaults to "Dry Goods" or URL param).
2. **Requests**:
   - `fetchManagerialData(start, end)`: Gets actual sales data.
   - `fetchDynamicTargets(start, end, divisionId)`: Gets targets associated with the division.

### Metrics Calculation
- **Supplier Performance**:
    - Aggregates sales by `supplierName`.
    - Maps dynamic targets from `target_setting_supplier` based on `supplierId` and `fiscal_period`.
    - **Achievement %**: `(Actual Sales / Target) * 100`.
    - **Status**: "HIT" (>= Target) or "MISS" (< Target).

- **Division Summary**:
    - Aggregates total Actual and total Target for the selected division.

### Drill-Down (Salesman Analysis)
- User clicks a **Supplier** bar.
- View updates to show **Salesman Breakdown** for that supplier.
- Metrics are re-calculated for each salesman using `target_setting_salesman`.

## 4. Required Database Schema
Ideally, the following tables are populated for full functionality:
- `target_setting_division` (Parent targets)
- `target_setting_supplier` (Supplier allocations)
- `target_setting_salesman` (Salesman allocations)

## 5. Key Components
- **BarChart (Recharts)**: Visualizes Supplier/Salesman performance.
- **ScrollArea (Side Listing)**: Ranked list of entities with health indicators.
