-- 001_init.sql
-- Initialize core database schema with soft delete structure
-- Primary keys use UUID v4 (TEXT), generated at application layer

CREATE TABLE IF NOT EXISTS `projects` (
	`project_id` text NOT NULL PRIMARY KEY,
	`project_name` text NOT NULL,
	`company_name` text NOT NULL,
	`fiscal_year` integer NOT NULL,
	`created_at` text DEFAULT (datetime('now', 'localtime')),
	`deleted_at` text DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS `vendors` (
	`vendor_id` text NOT NULL PRIMARY KEY,
	`vendor_name` text NOT NULL,
	`phone` text,
	`address` text,
	`created_at` text DEFAULT (datetime('now', 'localtime')),
	`deleted_at` text DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS `item_categories` (
	`category_id` text NOT NULL PRIMARY KEY,
	`category_name` text NOT NULL,
	`deleted_at` text DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS `units` (
	`unit_id` text NOT NULL PRIMARY KEY,
	`unit_name` text NOT NULL,
	`deleted_at` text DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS `items` (
	`item_id` text NOT NULL PRIMARY KEY,
	`item_name` text NOT NULL,
	`category_id` text NOT NULL,
	`unit_id` text NOT NULL,
	`deleted_at` text DEFAULT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `item_categories`(`category_id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`unit_id`) REFERENCES `units`(`unit_id`) ON UPDATE no action ON DELETE restrict
);

-- Variasi harga per item (master harga)
CREATE TABLE IF NOT EXISTS `item_prices` (
	`item_price_id` text NOT NULL PRIMARY KEY,
	`item_id` text NOT NULL,
	`price` real NOT NULL,
	`deleted_at` text DEFAULT NULL,
	FOREIGN KEY (`item_id`) REFERENCES `items`(`item_id`) ON UPDATE no action ON DELETE cascade
);

-- Grup Pekerjaan / BOM Groups
CREATE TABLE IF NOT EXISTS `bom_groups` (
	`bom_group_id` text NOT NULL PRIMARY KEY,
	`project_id` text NOT NULL,
	`group_name` text NOT NULL,
	`deleted_at` text DEFAULT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`project_id`) ON UPDATE no action ON DELETE cascade
);

-- TAHAP PERSIAPAN: BOM (RAB)
CREATE TABLE IF NOT EXISTS `bill_of_materials` (
	`bom_id` text NOT NULL PRIMARY KEY,
	`project_id` text NOT NULL,
	`bom_group_id` text NOT NULL,
	`item_id` text NOT NULL,
	`item_price_id` text NOT NULL,
	`qty` real NOT NULL,
	`created_at` text DEFAULT (datetime('now', 'localtime')),
	`deleted_at` text DEFAULT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`project_id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`bom_group_id`) REFERENCES `bom_groups`(`bom_group_id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`item_id`) REFERENCES `items`(`item_id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`item_price_id`) REFERENCES `item_prices`(`item_price_id`) ON UPDATE no action ON DELETE restrict
);

-- TAHAP PELAKSANAAN: PO & PENERIMAAN
CREATE TABLE IF NOT EXISTS `purchase_orders` (
	`po_id` text NOT NULL PRIMARY KEY,
	`project_id` text NOT NULL,
	`po_date` text NOT NULL,
	`created_at` text DEFAULT (datetime('now', 'localtime')),
	`deleted_at` text DEFAULT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`project_id`) ON UPDATE no action ON DELETE cascade
);

CREATE TABLE IF NOT EXISTS `po_items` (
	`po_item_id` text NOT NULL PRIMARY KEY,
	`po_id` text NOT NULL,
	`item_id` text NOT NULL,
	`vendor_id` text NOT NULL,
	`item_price_id` text NOT NULL,
	`qty` real NOT NULL,
	FOREIGN KEY (`po_id`) REFERENCES `purchase_orders`(`po_id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`item_id`) REFERENCES `items`(`item_id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`vendor_id`) REFERENCES `vendors`(`vendor_id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`item_price_id`) REFERENCES `item_prices`(`item_price_id`) ON UPDATE no action ON DELETE restrict
);

CREATE TABLE IF NOT EXISTS `deliveries` (
	`delivery_id` text NOT NULL PRIMARY KEY,
	`po_id` text NOT NULL,
	`delivery_date` text NOT NULL,
	`deleted_at` text DEFAULT NULL,
	FOREIGN KEY (`po_id`) REFERENCES `purchase_orders`(`po_id`) ON UPDATE no action ON DELETE cascade
);

CREATE TABLE IF NOT EXISTS `delivery_items` (
	`delivery_item_id` text NOT NULL PRIMARY KEY,
	`delivery_id` text NOT NULL,
	`po_item_id` text NOT NULL,
	`qty` real NOT NULL,
	FOREIGN KEY (`delivery_id`) REFERENCES `deliveries`(`delivery_id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`po_item_id`) REFERENCES `po_items`(`po_item_id`) ON UPDATE no action ON DELETE restrict
);
