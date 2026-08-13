-- 001_init.sql
-- Initialize core database schema with soft delete structure

CREATE TABLE `projects` (
	`project_id` text PRIMARY KEY NOT NULL,
	`project_name` text NOT NULL,
	`company_name` text NOT NULL,
	`fiscal_year` integer NOT NULL,
	`created_at` text DEFAULT (datetime('now', 'localtime')),
	`deleted_at` text DEFAULT NULL
);

CREATE TABLE `project_stages` (
	`stage_id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`project_id` text NOT NULL,
	`stage_name` text NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`project_id`) ON UPDATE no action ON DELETE cascade
);

CREATE TABLE `vendors` (
	`vendor_id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`vendor_name` text NOT NULL,
	`vendor_phone` text,
	`vendor_address` text,
	`created_at` text DEFAULT (datetime('now', 'localtime')),
	`deleted_at` text DEFAULT NULL
);

CREATE TABLE `items` (
	`item_id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`item_name` text NOT NULL,
	`category_id` integer NOT NULL,
	`unit_id` integer NOT NULL,
	`deleted_at` text DEFAULT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `item_categories`(`category_id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`unit_id`) REFERENCES `units`(`unit_id`) ON UPDATE no action ON DELETE restrict
);

CREATE TABLE `item_categories` (
	`category_id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`category_name` text NOT NULL,
	`deleted_at` text DEFAULT NULL
);

CREATE TABLE `units` (
	`unit_id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`unit_name` text NOT NULL,
	`deleted_at` text DEFAULT NULL
);

-- TAHAP PERSIAPAN: TAHAPAN PROYEK & BOM (RAB)
CREATE TABLE `bill_of_materials` (
	`bom_id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`project_id` text NOT NULL,
	`stage_id` integer NOT NULL,
	`item_id` integer NOT NULL,
	`price` real NOT NULL,
	`qty` real NOT NULL,
	`created_at` text DEFAULT (datetime('now', 'localtime')),
	`deleted_at` text DEFAULT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`project_id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`stage_id`) REFERENCES `project_stages`(`stage_id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`item_id`) REFERENCES `items`(`item_id`) ON UPDATE no action ON DELETE restrict
);

-- TAHAP PELAKSANAAN: PO & PENERIMAAN
CREATE TABLE `purchase_orders` (
	`po_id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`project_id` text NOT NULL,
	`po_date` text NOT NULL,
	`created_at` text DEFAULT (datetime('now', 'localtime')),
	`deleted_at` text DEFAULT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`project_id`) ON UPDATE no action ON DELETE cascade
);

CREATE TABLE `po_items` (
	`po_item_id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`po_id` integer NOT NULL,
	`item_id` integer NOT NULL,
	`vendor_id` integer NOT NULL,
	`price` real NOT NULL,
	`qty` real NOT NULL,
	FOREIGN KEY (`po_id`) REFERENCES `purchase_orders`(`po_id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`item_id`) REFERENCES `items`(`item_id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`vendor_id`) REFERENCES `vendors`(`vendor_id`) ON UPDATE no action ON DELETE restrict
);

CREATE TABLE `deliveries` (
	`delivery_id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`po_id` integer NOT NULL,
	`delivery_date` text NOT NULL,
	`created_at` text DEFAULT (datetime('now', 'localtime')),
	`deleted_at` text DEFAULT NULL,
	FOREIGN KEY (`po_id`) REFERENCES `purchase_orders`(`po_id`) ON UPDATE no action ON DELETE cascade
);

CREATE TABLE `delivery_items` (
	`delivery_item_id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`delivery_id` integer NOT NULL,
	`po_item_id` integer NOT NULL,
	`qty` real NOT NULL,
	FOREIGN KEY (`delivery_id`) REFERENCES `deliveries`(`delivery_id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`po_item_id`) REFERENCES `po_items`(`po_item_id`) ON UPDATE no action ON DELETE restrict
);
