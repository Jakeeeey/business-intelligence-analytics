---
description: Create a new module based on the system manual
---

To create a new module, follow these steps:

1.  **Define Module Name & Path**: Determine the kebab-case name (e.g., `target-setting`) and the parent directory (e.g., `src/modules/business-intelligence-analytics`).

2.  **Create Directory Structure**:
    Inside `src/modules/<parent>/<module-name>/`, create:
    - `components/`
    - `providers/`
    - `hooks/`
    - `utils/`
    - `types.ts`
    - `index.ts`
    - `<ModuleName>Module.tsx`

3.  **Define Types (`types.ts`)**:
    - Create interfaces for domain entities (Row/Detail).
    - Create DTOs for create/update operations.
    - *Constraint*: Avoid `any`.

4.  **Implement Provider (`providers/fetchProvider.ts`)**:
    - Import centralized `http` client from `@/lib/http/client`.
    - Create async functions for `list`, `get`, `create`, `update`, `delete`.
    - Map API responses to domain types.

5.  **Build Components (`components/`)**:
    - `*Table.tsx`: For listing data.
    - `*Filters.tsx`: For search/filtering.
    - `Create*Modal.tsx` / `Edit*Modal.tsx`: Forms using `react-hook-form` + `zod`.
    - *Constraint*: Use `shadcn` components / `radix-ui` primitives.

6.  **Create Hook (`hooks/use<ModuleName>.ts`)**:
    - Use SWR or standard `useEffect`/`useState` to call provider functions.
    - Manage state for pagination, filters, and modal visibility.

7.  **Assemble Module Entry (`<ModuleName>Module.tsx`)**:
    - Import the hook and components.
    - Render the layout (Header + Filters + Table).

8.  **Export Module (`index.ts`)**:
    - `export * from "./types";`
    - `export { default as <ModuleName>Module } from "./<ModuleName>Module";`

9.  **Create App Page**:
    - Create `src/app/(<group>)/<path>/page.tsx`.
    - Import `<ModuleName>Module`.
    - Default export a server component that renders the module entry.

10. **Create API Route (Optional)**:
    - If a specific backend proxy is needed, create `src/app/api/<path>/route.ts`.
## Target Setting Schema Reference
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

CREATE TABLE `target_setting_supervisor` (
	`id` INT NOT NULL AUTO_INCREMENT,
	`tss_id` INT NOT NULL COMMENT 'Parent: Supplier Target',
	`supervisor_user_id` INT NOT NULL COMMENT 'Link to user table',
	`target_amount` DOUBLE NULL DEFAULT NULL,
	`fiscal_period` DATE NULL DEFAULT NULL,
	`status` ENUM('DRAFT','APPROVED','REJECTED') NULL DEFAULT 'DRAFT',
	`created_by` INT NULL DEFAULT NULL,
	`created_at` DATETIME NULL DEFAULT (CURRENT_TIMESTAMP),
	PRIMARY KEY (`id`) USING BTREE,
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
	PRIMARY KEY (`id`) USING BTREE,
	CONSTRAINT `FK_ts_sales_supervisor` FOREIGN KEY (`ts_supervisor_id`) REFERENCES `target_setting_supervisor` (`id`)
);
```
