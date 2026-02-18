---
description: Guide for developing and maintaining the Supervisor Target Setting Module
---

# Supervisor Target Setting Module Workflow

This workflow describes the file structure, logic, and data flow for the Supervisor Target Setting Module.

## 1. Module Overview
The Supervisor module allows supervisors to allocate salesman-level target shares under a selected supplier. It also displays a hierarchy log showing the full target chain from Executive → Division → Supplier.

- **Location**: `src/modules/business-intelligence-analytics/target-setting/supervisor`
- **Entry Point**: `SupervisorModule.tsx`

## 2. File Structure
Inside `src/modules/.../supervisor/`:
- `components/AllocationTable.tsx`: CRUD table for salesman allocations (edit & delete per row).
- `components/AllocationHierarchyLog.tsx`: Read-only table showing Executive → Division → Supplier hierarchy.
- `components/ui.tsx`: Small shared UI primitives.
- `components/index.ts`: Barrel export for components.
- `hooks/useSalesmanAllocation.ts`: Primary hook — state management, validation, CRUD, hierarchy fetching.
- `hooks/useSupervisorTargets.ts`: Legacy/alternative hook (currently commented out).
- `providers/fetchProvider.ts`: API interaction layer (multiple resource endpoints).
- `types.ts`: TypeScript interfaces for all domain entities.
- `utils/format.ts`: `moneyPHP()` currency formatter and `monthLabel()` date helper.
- `index.ts`: Module barrel export.

## 3. Logic & Data Flow
### Data Fetching (Multi-request)
Unlike the Manager module's single bootstrap, the Supervisor module fetches data from multiple endpoints in parallel:

| Provider Function             | Resource Param       | Returns                          |
|-------------------------------|----------------------|----------------------------------|
| `listSalesmen()`              | `salesmen`           | `SalesmanRow[]`                  |
| `listSuppliers()`             | `suppliers`          | `SupplierRow[]`                  |
| `listTargetSettingSuppliers()`| `ts_supplier`        | `TargetSettingSupplierRow[]`     |
| `listDivisions()`             | `divisions`          | `DivisionRow[]`                  |
| `listSalesmanAllocations()`   | `allocations`        | `TargetSettingSalesmanRow[]`     |

All requests go through **`/api/bia/target-setting/supervisor`** with a `resource` query param to differentiate.

### Selection Cascade
1. **Fiscal Period** → derived from unique `fiscal_period` values in `target_setting_supplier` rows (validated, sorted descending).
2. **Supplier** → filtered suppliers that have a target for the selected fiscal period; shows target amount in label.
3. **Salesman** → all active salesmen (no cascading filter).
4. **Target Amount** → manual numeric input.

### Validation
- Salesman allocation total may not exceed the selected supplier's `target_amount`.
- When saving, checks existing allocations and computes remaining available budget.
- Duplicate (same fiscal + supplier + salesman) triggers an update instead of a create.

### CRUD Operations
| Action   | Method   | Endpoint                              | Body / Params                                    |
|----------|----------|---------------------------------------|--------------------------------------------------|
| Create   | `POST`   | `/api/bia/target-setting/supervisor?resource=allocations` | `UpsertSalesmanAllocationPayload` |
| Update   | `PATCH`  | `/api/bia/target-setting/supervisor?resource=allocations&id=<id>` | `UpsertSalesmanAllocationPayload` |
| Delete   | `DELETE` | `/api/bia/target-setting/supervisor?resource=allocations&id=<id>` | —                               |

### Hierarchy Log
Fetches the target chain for the selected fiscal period:
1. **Executive**: `listExecutiveTargets({ fiscal_period })` → `ts_executive` resource.
2. **Division**: `readDivisionTarget(tsd_id)` → `ts_division` resource (single row by ID, derived from selected supplier target's `tsd_id`).
3. **Supplier allocations under same division**: `listSupplierTargetsByTsd({ fiscal_period, tsd_id })` → `ts_supplier_by_tsd` resource.

Division names are resolved via the `divisions` master list.

## 4. Required Database Schema (DDLs)
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
  PRIMARY KEY (`id`),
  CONSTRAINT `FK_tss_division` FOREIGN KEY (`tsd_id`) REFERENCES `target_setting_division` (`id`)
);

CREATE TABLE `target_setting_supervisor` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `tss_id` INT NOT NULL COMMENT 'Parent: Supplier Target',
  `supervisor_user_id` INT NOT NULL COMMENT 'Link to user table',
  `target_amount` DOUBLE NULL DEFAULT NULL,
  `fiscal_period` DATE NULL DEFAULT NULL,
  `status` ENUM('DRAFT','APPROVED','REJECTED') NULL DEFAULT 'DRAFT',
  `created_by` INT NULL DEFAULT NULL,
  `created_at` DATETIME NULL DEFAULT (CURRENT_TIMESTAMP),
  PRIMARY KEY (`id`),
  CONSTRAINT `FK_ts_super_supplier` FOREIGN KEY (`tss_id`) REFERENCES `target_setting_supplier` (`id`)
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
  PRIMARY KEY (`id`),
  CONSTRAINT `FK_ts_sales_supervisor` FOREIGN KEY (`ts_supervisor_id`) REFERENCES `target_setting_supervisor` (`id`)
);
```

## 5. Development Steps
1. **API Route**: Ensure `/api/bia/target-setting/supervisor` correctly routes by `resource` param.
2. **Hierarchy Integration**: Verify `tsd_id` linkage so the hierarchy log resolves Division → Supplier correctly.
3. **Budget Guard**: Enforce that salesman allocations never exceed the parent supplier target.
4. **Edit Flow**: `loadRowToForm()` pre-fills the form for in-place editing of existing allocations.
5. **Legacy Cleanup**: `useSupervisorTargets.ts` is fully commented out — remove or re-enable based on future requirements.
