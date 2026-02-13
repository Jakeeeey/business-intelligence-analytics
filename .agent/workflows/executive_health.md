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
- `components/`: UI sub-components (Charts, Scorecards).
- `providers/fetchProvider.ts`: API interaction layer.
- `types.ts`: TypeScript interfaces for sales data and health metrics.
- `ExecutiveHealthModule.tsx`: Main container and data orchestration logic.

## 3. Logic & Data Flow
### Data Fetching
1. **Filters**: User selects a "From" and "To" month.
2. **Request**: `fetchExecutiveHealthData(start, end)` is called.
3. **API Route**: Requests are proxied via `/api/bia/target-setting-reports/executive-health`.
4. **Backend**: Proxies to Spring Boot `/api/view-sales-performance/all`.

### Metrics Calculation
- **Company Actual**: Sum of `netAmount` from all returned records.
- **Monthly Targets**: Currently hardcoded in `MONTHLY_TARGETS` (Action Item: Migrate to Database).
- **Target Scaling**: `targetAmount * numberOfMonthsSelected`.
- **Achievement %**: `(Actual / Target) * 100`.
- **Variance**: `Actual - Target`.

### Navigation (Drill-down)
- Clicking a Division bar redirects to the **Managerial Supplier** report:
  `/bia/target-setting-reports/managerial-supplier?from=...&to=...&division=...`

## 4. Required Database Schema (DDLs)
The following tables from the Target Setting module are required for making targets dynamic:

```sql
CREATE TABLE `target_setting_executive` (
	`id` INT NOT NULL AUTO_INCREMENT,
	`created_by` INT NULL DEFAULT NULL,
	`target_amount` DOUBLE NULL DEFAULT NULL,
	`fiscal_period` DATE NULL DEFAULT NULL,
	`status` ENUM('DRAFT','APPROVED','REJECTED') NULL DEFAULT 'DRAFT',
	`created_at` DATETIME NULL DEFAULT (CURRENT_TIMESTAMP),
	`updated_at` DATETIME NULL DEFAULT NULL,
	PRIMARY KEY (`id`) USING BTREE,
	UNIQUE INDEX `uq_tse_fiscal_period` (`fiscal_period`) USING BTREE
);

CREATE TABLE `target_setting_division` (
	`id` INT NOT NULL AUTO_INCREMENT,
	`tse_id` INT NOT NULL COMMENT 'Parent: Executive Target',
	`division_id` INT NOT NULL COMMENT 'Link to division table',
	`target_amount` DOUBLE NULL DEFAULT NULL,
	`fiscal_period` DATE NULL DEFAULT NULL,
	`status` ENUM('DRAFT','APPROVED','REJECTED') NULL DEFAULT 'DRAFT',
	`created_by` INT NULL DEFAULT NULL,
	`created_at` DATETIME NULL DEFAULT (CURRENT_TIMESTAMP),
	PRIMARY KEY (`id`) USING BTREE,
	CONSTRAINT `FK_tsd_executive` FOREIGN KEY (`tse_id`) REFERENCES `target_setting_executive` (`id`)
);

-- Note: The module also utilizes a view named `view_sales_performance` (backend-only reference)
```

## 5. Development Steps
1. **Database Integration**: Replace `MONTHLY_TARGETS` constant with a fetch from `target_setting_executive` / `target_setting_division`.
2. **Dynamic Scaling**: Ensure targets are correctly aggregated across the selected date range.
3. **Enhanced Visualization**: Add trend indicators (Current vs Previous Period) if data supports it.
