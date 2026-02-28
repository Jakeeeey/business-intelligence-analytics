---
description: Guide for developing and maintaining the Salesman KPI Module
---

# Salesman KPI Module Workflow

This workflow describes the file structure, logic, data flow, and database schema for the Salesman KPI Module.

## 1. Module Overview
The Salesman KPI module provides a matrix view of salesman performance against targets across different suppliers. It uses a heatmap-style table to visualize achievement levels and allows for filtering by date range and personnel.

- **Location**: `src/modules/business-intelligence-analytics/target-setting-reports/salesman-kpi`
- **Entry Point**: `SalesmanKPIModule.tsx`
- **Route**: `src/app/api/bia/target-setting-reports/managerial-supplier`

## 2. File Structure
Inside `src/modules/.../salesman-kpi/`:
- `components/`: UI sub-components (Table, Tooltips, Filters).
- `providers/fetchProvider.ts`: API interaction layer.
- `types.ts`: TypeScript interfaces for sales data and matrix metrics.
- `SalesmanKPIModule.tsx`: Main container and data orchestration logic.

## 3. Logic & Data Flow
### Data Fetching
1.  **Filters**: User selects a "From" and "To" month.
2.  **Frontend Request**: `fetchSalesmanData(start, end)` and `fetchDynamicTargets(start, end)` are called in parallel.
3.  **API Proxy**: Requests are sent to the Next.js API route `/api/bia/target-setting-reports/managerial-supplier`.
4.  **Backend Data Sources**:
    - **Actual Sales**: Proxies to Spring Boot `/api/view-sales-performance/all` (via `managerial-supplier/route.ts`).
    - **Dynamic Targets**: Fetches from Directus collections (via `managerial-supplier/targets/route.ts`).

### Target Hierarchy Resolution (Directus/DB)
The system resolves targets through the following hierarchy:
1.  **Division Target** (`target_setting_division`): The base allocation for a division.
2.  **Supplier Target** (`target_setting_supplier`): Allocation broken down by supplier (Linked to Division).
3.  **Supervisor Target** (`target_setting_supervisor`): Allocation broken down by supervisor (Linked to Supplier).
4.  **Salesman Target** (`target_setting_salesman`): Final allocation to individual salesmen (Linked to Supervisor).

### Metrics Calculation
- **Actual Sales**: Sum of `netAmount` from returned records, grouped by `salesmanId` + `supplierId`.
- **Targets**: Fetched from `target_setting_salesman` filtered by `fiscal_period`.
- **Achievement %**: `(Actual / Target) * 100`.
- **Heat Color**:
    - **Achievement Mode**: Green (>=100%), Amber (>=50%), Red (<50%).
    - **Amount Mode**: Intensity based on % of highest value in the matrix.

## 4. Required Database Schema (DDLs)
The following tables are required for the complete dynamic target implementation.

### 1. Division Targets
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
```

### 2. Supplier Targets
```sql
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
```

### 3. Supervisor Targets
```sql
CREATE TABLE `target_setting_supervisor` (
	`id` INT NOT NULL AUTO_INCREMENT,
	`tss_id` INT NOT NULL COMMENT 'Parent: Supplier Target',
	`supervisor_user_id` INT NOT NULL COMMENT 'Link to user/employee table for supervisor',
	`target_amount` DOUBLE NULL DEFAULT NULL,
	`fiscal_period` DATE NULL DEFAULT NULL,
	`status` ENUM('DRAFT','APPROVED','REJECTED') NULL DEFAULT 'DRAFT',
	`created_by` INT NULL DEFAULT NULL,
	`created_at` DATETIME NULL DEFAULT (CURRENT_TIMESTAMP),
	PRIMARY KEY (`id`) USING BTREE,
	CONSTRAINT `FK_tss_supervisor_supplier` FOREIGN KEY (`tss_id`) REFERENCES `target_setting_supplier` (`id`)
);
```

### 4. Salesman Targets
```sql
CREATE TABLE `target_setting_salesman` (
	`id` INT NOT NULL AUTO_INCREMENT,
	`ts_supervisor_id` INT NOT NULL COMMENT 'Parent: Supervisor Target',
	`salesman_id` INT NOT NULL COMMENT 'Link to salesman table',
	`target_amount` DOUBLE NULL DEFAULT NULL,
	`fiscal_period` DATE NULL DEFAULT NULL,
	`status` ENUM('DRAFT','APPROVED','REJECTED') NULL DEFAULT 'DRAFT',
	`created_by` INT NULL DEFAULT NULL,
	`created_at` DATETIME NULL DEFAULT (CURRENT_TIMESTAMP),
	`supplier_id` INT NULL DEFAULT NULL COMMENT 'Denormalized for easier querying',
	PRIMARY KEY (`id`) USING BTREE,
	CONSTRAINT `FK_ts_sales_supervisor` FOREIGN KEY (`ts_supervisor_id`) REFERENCES `target_setting_supervisor` (`id`)
);
```

## 5. Development Steps & Verification
1.  **Backend API**: Ensure `/api/bia/target-setting-reports/managerial-supplier/targets` correctly joins these tables.
2.  **Frontend**: `SalesmanKPIModule.tsx` must correctly map these targets to the visual matrix.
3.  **Verification**:
    - Create targets in `target_setting_salesman`.
    - Verify they appear in the matrix for the correct month.
    - Verify "Overall Cap" sums these targets correctly.
