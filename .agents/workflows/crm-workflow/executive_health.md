---
description: Guide for developing and maintaining the Executive Health Module
---

# Executive Health Module Workflow

This workflow describes the file structure, logic, and data flow for the Executive Health Module.

## 1. Module Overview
The Executive Health module is a high-level dashboard designed for executives to monitor company and division-level performance against targets. It provides a visual representation of sales vs. targets and a scorecard for detailed performance tracking.

- **Location**: `src/modules/business-intelligence-analytics/target-setting-reports/executive-health`
- **Entry Point**: `ExecutiveHealthModule.tsx`

## 2. File Structure
Inside `src/modules/.../executive-health/`:
- `providers/fetchProvider.ts`: API interaction layer.
- `types.ts`: TypeScript interfaces for sales data and target settings.
- `ExecutiveHealthModule.tsx`: Main container and data orchestration logic.

## 3. Logic & Data Flow

### Data Fetching
1. **Filters**: User selects a "From" and "To" month (YYYY-MM).
2. **Requests**: 
   - `fetchExecutiveHealthData`: Fetches actual sales performance for the date range.
   - `fetchCompanyTargets`: Fetches company-level targets from `target_setting_executive`.
   - `getDivisions`: Fetches metadata for all active divisions.
   - `fetchDivisionTargets`: Fetches division-level allocations linked to the company targets via `tse_id`.

### Metrics Calculation (`useMemo`)
- **Company Health**: 
  - Aggregates total `netAmount` from sales and total `target_amount` from `target_setting_executive`.
  - Calculates `achievement`, `gap`, and `variance`.
- **Division Health**: 
  - Groups sales by `divisionName`.
  - Joins with `divisions` metadata to include divisions with targets but no sales.
  - Joins with `allocations` (division targets) by `division_id`.
  - Resulting `processedDivisions` includes: `name`, `sales`, `target`, `achievement %`.

### UI Components & Visualization
- **Metric Strip**: Cards showing Company Actual, Target, Achievement %, and Variance.
- **Division Sales Volume (Main Chart)**: 
  - Uses `ComposedChart` (Recharts) in `vertical` layout.
  - **Bars**: 
    - `Actual` (Colored Emerald if >= Target, Amber otherwise).
    - `Target` (Light blue bar for visual reference).
  - **Scatter**: Overlays a vertical dashed line at the target position for precise reference.
  - **Tooltip**: Custom formatter `(v, name) => [formatPHP(v), name]` ensures correct labeling.
  - **Note**: The `Scatter` component uses `tooltipType="none"` to avoid redundant "Target" entries.

### Navigation (Drill-down)
- Clicking a Division bar or a scorecard item redirects to the **Managerial Supplier** report:
  `/bia/target-setting-reports/managerial-supplier?from=...&to=...&division=...`

## 4. Required Database Schema/Views
- `target_setting_executive`: Company-wide targets by fiscal period.
- `target_setting_division`: Division-specific allocations linked to executive targets.
- `view_sales_performance`: Sales transaction data view (aggregated by net amount).
