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
- `components/`: UI sub-components (Table, Tooltips, Filters).
- `providers/fetchProvider.ts`: API interaction layer.
- `types.ts`: TypeScript interfaces for sales data and matrix metrics.
- `SalesmanKPIModule.tsx`: Main container and data orchestration logic.

## 3. Logic & Data Flow
### Data Fetching
1.  **Filters**: User selects a "From" and "To" month.
2.  **Request**: `fetchSalesmanData(start, end)` is called.
3.  **API Route**: Requests are proxied via `/api/bia/target-setting-reports/managerial-supplier`.
4.  **Backend**: Proxies to Spring Boot `/api/view-sales-performance/all`.

### Metrics Calculation
- **Actual Sales**: Sum of `netAmount` from returned records, grouped by `salesmanName` and `supplierName`.
- **Targets**:
    - **Static (Legacy)**: Uses `SALESMAN_SUPPLIER_TARGETS` mapping.
    - **Dynamic (Current Goal)**: Fetches targets from `target_setting_salesman` filtered by `fiscal_period`.
- **Achievement %**: `(Actual / Target) * 100`.
- **Heat Color**: Based on achievement percentage or absolute value depending on the active metric.

## 4. Required Database Schema (DDLs)
The following tables are required for dynamic target implementation:

```sql
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

CREATE TABLE `target_setting_supplier` (
	`id` INT NOT NULL AUTO_INCREMENT,
	`tsd_id` INT NOT NULL COMMENT 'Parent: Division Target',
	`supplier_id` INT NOT NULL COMMENT 'Link to suppliers table',
	`target_amount` DOUBLE NULL DEFAULT NULL,
	`fiscal_period` DATE NULL DEFAULT NULL,
	`status` ENUM('DRAFT','APPROVED','REJECTED') NULL DEFAULT 'DRAFT',
	`created_by` INT NULL DEFAULT NULL,
	`created_at` DATETIME NULL DEFAULT (CURRENT_TIMESTAMP),
	PRIMARY KEY (`id`) USING BTREE,
	CONSTRAINT `FK_tss_division` FOREIGN KEY (`tsd_id`) REFERENCES `target_setting_division` (`id`)
);

CREATE TABLE `target_setting_salesman` (
	`id` INT NOT NULL AUTO_INCREMENT,
	`ts_supervisor_id` INT NOT NULL COMMENT 'Parent: Supervisor Target',
	`salesman_id` INT NOT NULL COMMENT 'Link to salesman table',
	`target_amount` DOUBLE NULL DEFAULT NULL,
	`fiscal_period` DATE NULL DEFAULT NULL,
	`status` ENUM('DRAFT','APPROVED','REJECTED') NULL DEFAULT 'DRAFT',
	`created_by` INT NULL DEFAULT NULL,
	`created_at` DATETIME NULL DEFAULT (CURRENT_TIMESTAMP),
	`supplier_id` INT NULL DEFAULT NULL,
	PRIMARY KEY (`id`) USING BTREE,
	CONSTRAINT `FK_ts_sales_supervisor` FOREIGN KEY (`ts_supervisor_id`) REFERENCES `target_setting_supervisor` (`id`)
);
```

## 5. Development Steps
1.  **Backend API**: Create or update an API route to fetch targets from these tables.
2.  **Frontend Integration**: Update `fetchProvider.ts` to include `fetchDynamicTargets`.
3.  **State Management**: Load targets alongside sales data in `SalesmanKPIModule.tsx`.
4.  **Logic Update**: Replace static target logic with dynamic lookups based on `salesmanId` and `supplierId`.
