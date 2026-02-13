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

CREATE TABLE `suppliers` (
	`id` INT NOT NULL AUTO_INCREMENT,
	`supplier_name` VARCHAR(255) NOT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`supplier_shortcut` VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8mb4_unicode_ci',
	`contact_person` VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`email_address` VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`phone_number` VARCHAR(20) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`address` VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`city` VARCHAR(100) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`brgy` VARCHAR(100) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`state_province` VARCHAR(100) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`postal_code` VARCHAR(20) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`country` VARCHAR(100) NOT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`supplier_type` VARCHAR(255) NOT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`tin_number` VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`bank_details` VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`payment_terms` VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`delivery_terms` VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`agreement_or_contract` TEXT NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`preferred_communication_method` VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`notes_or_comments` TEXT NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`date_added` DATE NOT NULL,
	`supplier_image` TEXT NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`isActive` TINYINT NOT NULL DEFAULT '1',
	`nonBuy` BIT(1) NOT NULL DEFAULT (b'1'),
	PRIMARY KEY (`id`) USING BTREE,
	UNIQUE INDEX `supplier_name` (`supplier_name`) USING BTREE
) COMMENT='line discount' COLLATE='utf8mb4_unicode_ci' ENGINE=InnoDB;

CREATE TABLE `user` (
	`user_id` INT NOT NULL AUTO_INCREMENT,
	`user_email` VARCHAR(255) NOT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`user_password` VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`user_fname` VARCHAR(255) NOT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`user_mname` VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`user_lname` VARCHAR(255) NOT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`user_contact` VARCHAR(255) NOT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`user_province` VARCHAR(255) NOT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`user_city` VARCHAR(255) NOT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`user_brgy` VARCHAR(255) NOT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`user_department` INT NULL DEFAULT NULL,
	`user_sss` VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`user_philhealth` VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`user_tin` VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`user_position` VARCHAR(255) NOT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`user_dateOfHire` DATE NOT NULL,
	`user_tags` VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`user_bday` DATE NULL DEFAULT NULL,
	`role_id` INT NULL DEFAULT NULL,
	`user_image` TEXT NULL DEFAULT NULL COLLATE 'utf8mb4_unicode_ci',
	`updateAt` TIMESTAMP NULL DEFAULT NULL,
	`external_id` VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8mb4_unicode_ci',
	`is_deleted` BIT(1) NULL DEFAULT NULL,
	`update_at` DATETIME(6) NULL DEFAULT NULL,
	`externalId` VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8mb4_unicode_ci',
	`isDeleted` BIT(1) NULL DEFAULT NULL,
	`biometric_id` VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8mb4_unicode_ci',
	`rf_id` VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8mb4_unicode_ci',
	`isAdmin` TINYINT(1) NOT NULL DEFAULT '0',
	`user_pagibig` VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8mb4_unicode_ci',
	`signature` TEXT NULL DEFAULT NULL COLLATE 'utf8mb4_unicode_ci',
	`emergency_contact_name` VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8mb4_unicode_ci',
	`emergency_contact_number` VARCHAR(50) NULL DEFAULT NULL COLLATE 'utf8mb4_unicode_ci',
	`role` VARCHAR(10) NOT NULL DEFAULT 'USER' COLLATE 'utf8mb4_unicode_ci',
	`hash_password` VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8mb4_unicode_ci',
	PRIMARY KEY (`user_id`) USING BTREE
) COLLATE='utf8mb4_unicode_ci' ENGINE=InnoDB;

CREATE TABLE `target_setting_approver` (
	`id` INT NOT NULL AUTO_INCREMENT,
	`approver_id` INT NULL DEFAULT NULL,
	`is_deleted` TINYINT NULL DEFAULT '0',
	`created_by` INT NULL DEFAULT NULL,
	`created_at` DATETIME NULL DEFAULT NULL,
	PRIMARY KEY (`id`) USING BTREE,
	INDEX `FK_approver_user_idx` (`approver_id`) USING BTREE,
	CONSTRAINT `FK_approval_approver` FOREIGN KEY (`approver_id`) REFERENCES `user` (`user_id`) ON UPDATE NO ACTION ON DELETE NO ACTION
) COLLATE='utf8mb4_0900_ai_ci' ENGINE=InnoDB;

CREATE TABLE `target_setting_approvals` (
	`id` INT NOT NULL AUTO_INCREMENT,
	`target_period` DATE NOT NULL COMMENT 'fiscal_period from target_setting_executive',
	`status` ENUM('DRAFT','APPROVED','REJECTED') NOT NULL DEFAULT 'DRAFT' COLLATE 'utf8mb4_0900_ai_ci',
	`target_record_id` INT NOT NULL,
	`target_setting_approver_id` INT NOT NULL,
	`approved_at` DATETIME NULL DEFAULT NULL,
	PRIMARY KEY (`id`) USING BTREE,
	INDEX `FK_target_setting_approver_idx` (`target_setting_approver_id`) USING BTREE,
	CONSTRAINT `FK_target_setting_approvals_approver` FOREIGN KEY (`target_setting_approver_id`) REFERENCES `target_setting_approver` (`id`) ON UPDATE CASCADE ON DELETE RESTRICT
) COLLATE='utf8mb4_0900_ai_ci' ENGINE=InnoDB;
```
