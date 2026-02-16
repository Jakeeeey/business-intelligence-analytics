---
description: Guide for developing and maintaining the Executive Health Module
---

# Executive Health Module Workflow

This workflow describes the file structure, logic, and data flow for the Executive Health Module.

## 1. Module Overview
The Executive Health module is a high-level dashboard designed for executives to monitor company and division-level performance against targets.

- **Location**: `src/modules/business-intelligence-analytics/target-setting-reports/executive-health`
- **Entry Point**: `ExecutiveHealthModule.tsx`

## 2. File Structure
Inside `src/modules/.../executive-health/`:
- `components/`: UI sub-components.
- `providers/fetchProvider.ts`: API interaction layer.
- `types.ts`: TypeScript interfaces.
- `ExecutiveHealthModule.tsx`: Main container and data orchestration logic.

## 3. Logic & Data Flow
### Data Fetching
1. **Filters**: User selects a "From" and "To" month.
2. **Requests**: 
   - `fetchExecutiveHealthData`: Actual sales performance.
   - `fetchCompanyTargets`: Company-level targets (`target_setting_executive`).
   - `getDivisions`: Metadata for divisions.
   - `fetchDivisionTargets`: Division-level targets (`target_setting_division`).

### Metrics Calculation
- **Company Health**: 
  - Aggregates total `netAmount` vs total `target_amount` from `target_setting_executive`.
- **Division Health**: 
  - Maps actual sales to division targets.
  - **Achievement %**: `(Actual / Target) * 100`.
  - **Gap**: `Actual - Target`.

### Navigation (Drill-down)
- Clicking a Division bar redirects to the **Managerial Supplier** report:
  `/bia/target-setting-reports/managerial-supplier?from=...&to=...&division=...`

## 4. Required Database Schema
- `target_setting_executive`: Company-wide targets.
- `target_setting_division`: Division-specific allocations.
- `view_sales_performance`: Sales data view.
