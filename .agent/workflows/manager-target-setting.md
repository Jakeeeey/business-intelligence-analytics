---
description: Guide for developing and maintaining the Manager Target Setting Module
---

# Manager Target Setting Module Workflow

This workflow describes the file structure, logic, and data flow for the Manager Target Setting Module.

## 1. Module Overview
The Manager module allows division managers to allocate supplier-level targets under a selected division. Each allocation is linked to a supervisor and tracked against the division's total budget.

- **Location**: `src/modules/business-intelligence-analytics/target-setting/manager`
- **Entry Point**: `ManagerModule.tsx`

## 2. File Structure
Inside `src/modules/.../manager/`:
- `components/ManagerHeader.tsx`: Top-level form with fiscal period, division, supplier, supervisor selects and save button.
- `components/SupplierAllocationsTable.tsx`: Table showing supplier allocations under the selected division with delete actions.
- `components/AllocationLogTable.tsx`: Full read-only log of Executive → Division → Supplier allocations.
- `hooks/useManagerTargets.ts`: Main state management hook (bootstrap, selection cascading, CRUD).
- `providers/fetchProvider.ts`: API interaction layer.
- `types.ts`: TypeScript interfaces for all domain entities.
- `utils/format.ts`: `formatPeso()` currency formatter.
- `index.ts`: Module barrel export.

## 3. Logic & Data Flow
### Data Fetching (Bootstrap)
1. **Request**: `bootstrapManagerTargets()` → `GET /api/bia/target-setting/manager`.
2. **Response**: A single `ManagerBootstrapResponse` containing:
   - `target_setting_executive[]` — fiscal periods with company-wide goals.
   - `target_setting_division[]` — division-level allocations (FK to executive).
   - `target_setting_supplier[]` — supplier-level allocations (FK to division).
   - `target_setting_supervisor[]` — supervisor-level allocations (FK to supplier).
   - `division[]`, `suppliers[]`, `users[]`, `supervisor_per_division[]` — reference/lookup data.

### Selection Cascade
1. **Fiscal Period** → filters division options by `tse_id`.
2. **Division** → filters supplier allocations by `tsd_id`; resets supervisor selection.
3. **Supervisor** → scoped to selected division via `supervisor_per_division` join table.
4. **Supplier** → only active, TRADE-type suppliers.

### Totals & Validation
- **Division Target**: `target_amount` from the selected `target_setting_division` row.
- **Allocated**: Sum of `target_amount` across supplier allocations for the selected division.
- **Remaining**: `Division Target - Allocated` (clamped to ≥ 0).
- New allocations cannot exceed the remaining amount; updates check the delta.

### CRUD Operations
| Action   | Method  | Endpoint                           | Body                                      |
|----------|---------|------------------------------------|--------------------------------------------|
| Create   | `POST`  | `/api/bia/target-setting/manager`  | `{ action: "UPSERT_SUPPLIER", tsd_id, supplier_id, target_amount, supervisor_user_id }` |
| Update   | `PATCH` | `/api/bia/target-setting/manager`  | `{ action: "UPDATE_SUPPLIER", id, target_amount, supervisor_user_id }` |
| Delete   | `DELETE`| `/api/bia/target-setting/manager?id=<id>` | —                                    |

### Allocation Log
Builds a flat list of `AllocationLogRow[]` from Executive → Division → Supplier hierarchy for the selected fiscal period, shown in `AllocationLogTable`.

## 4. Required Database Schema (DDLs)
```sql
CREATE TABLE `target_setting_executive` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `created_by` INT NULL DEFAULT NULL,
  `target_amount` DOUBLE NULL DEFAULT NULL,
  `fiscal_period` DATE NULL DEFAULT NULL,
  `status` ENUM('DRAFT','APPROVED','REJECTED') NULL DEFAULT 'DRAFT',
  `created_at` DATETIME NULL DEFAULT (CURRENT_TIMESTAMP),
  `updated_at` DATETIME NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `uq_tse_fiscal_period` (`fiscal_period`)
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
  PRIMARY KEY (`id`),
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
  PRIMARY KEY (`id`),
  CONSTRAINT `FK_tss_division` FOREIGN KEY (`tsd_id`) REFERENCES `target_setting_division` (`id`)
);

CREATE TABLE `supervisor_per_division` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `division_id` INT NOT NULL,
  `supervisor_id` INT NOT NULL COMMENT 'maps to user.user_id',
  `is_deleted` INT DEFAULT 0,
  `created_at` DATETIME NULL,
  `created_by` INT NULL,
  `updated_at` DATETIME NULL,
  `updated_by` INT NULL,
  PRIMARY KEY (`id`)
);
```

## 5. Development Steps
1. **Bootstrap API**: Ensure `/api/bia/target-setting/manager` returns all required collections in a single response.
2. **Supervisor Scoping**: `supervisor_per_division` join table must be populated so supervisors correctly filter by division.
3. **Allocation Rules**: Enforce that total supplier allocations never exceed the parent division target.
4. **Allocation Log**: Verify the flat log correctly rolls up Executive → Division → Supplier rows.
