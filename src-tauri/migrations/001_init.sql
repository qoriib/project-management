PRAGMA foreign_keys = ON;

-- MASTER DATA: PROYEK
CREATE TABLE `projects` (
	`project_id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`project_name` text NOT NULL,
	`company_name` text NOT NULL,
	`fiscal_year` integer NOT NULL,
	`created_at` text DEFAULT (datetime('now', 'localtime'))
);

CREATE TABLE `project_stages` (
	`stage_id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`project_id` integer NOT NULL,
	`stage_name` text NOT NULL,
	`created_at` text DEFAULT (datetime('now', 'localtime')),
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`project_id`) ON UPDATE no action ON DELETE cascade
);

-- MASTER DATA: VENDOR / PEMASOK / TOKO / PENYEDIA SEWA
CREATE TABLE `vendors` (
	`vendor_id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`vendor_name` text NOT NULL,
	`phone` text,
	`address` text,
	`created_at` text DEFAULT (datetime('now', 'localtime'))
);

CREATE UNIQUE INDEX `vendors_vendor_name_unique` ON `vendors` (`vendor_name`);

-- MASTER DATA: KATALOG MATERIAL & ALAT
CREATE TABLE `units` (
	`unit_id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`unit_name` text NOT NULL
);

CREATE UNIQUE INDEX `units_unit_name_unique` ON `units` (`unit_name`);

CREATE TABLE `items` (
	`item_id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`item_name` text NOT NULL,
	`category` text NOT NULL,
	`unit` text NOT NULL
);

CREATE TABLE `item_categories` (
	`category_id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`category_name` text NOT NULL
);

CREATE TABLE `item_prices` (
	`price_id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`item_id` integer NOT NULL,
	`price` real NOT NULL,
	FOREIGN KEY (`item_id`) REFERENCES `items`(`item_id`) ON UPDATE no action ON DELETE cascade
);

-- TAHAP PERSIAPAN: TAHAPAN PROYEK & BOM (RAB)
CREATE TABLE `bill_of_materials` (
	`bom_id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`project_id` integer NOT NULL,
	`stage_id` integer NOT NULL,
	`item_id` integer NOT NULL,
	`item_price_id` integer NOT NULL,
	`qty` real NOT NULL,
	`created_at` text DEFAULT (datetime('now', 'localtime')),
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`project_id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`stage_id`) REFERENCES `project_stages`(`stage_id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`item_id`) REFERENCES `items`(`item_id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`item_price_id`) REFERENCES `item_prices`(`price_id`) ON UPDATE no action ON DELETE restrict
);

-- TAHAP 1: PURCHASE ORDER (PO / PEMESANAN)
CREATE TABLE `purchase_orders` (
	`po_id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`project_id` integer,
	`po_date` text NOT NULL,
	`created_at` text DEFAULT (datetime('now', 'localtime')),
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`project_id`) ON UPDATE no action ON DELETE cascade
);

-- Rincian Item Barang yang ada di dalam 1 PO
CREATE TABLE `po_items` (
	`po_item_id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`po_id` integer,
	`item_id` integer,
	`item_price_id` integer,
	`vendor_id` integer,
	`qty` real NOT NULL,
	FOREIGN KEY (`po_id`) REFERENCES `purchase_orders`(`po_id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`item_id`) REFERENCES `items`(`item_id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`item_price_id`) REFERENCES `item_prices`(`price_id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`vendor_id`) REFERENCES `vendors`(`vendor_id`) ON UPDATE no action ON DELETE restrict
);

-- TAHAP 2: PENGIRIMAN (DELIVERY / REALISASI FISIK LAPANGAN)
CREATE TABLE `deliveries` (
	`delivery_id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`po_id` integer,
	`delivery_date` text NOT NULL,
	FOREIGN KEY (`po_id`) REFERENCES `purchase_orders`(`po_id`) ON UPDATE no action ON DELETE cascade
);

CREATE TABLE `delivery_items` (
	`delivery_item_id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`delivery_id` integer,
	`po_item_id` integer,
	`qty` real NOT NULL,
	FOREIGN KEY (`delivery_id`) REFERENCES `deliveries`(`delivery_id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`po_item_id`) REFERENCES `po_items`(`po_item_id`) ON UPDATE no action ON DELETE cascade
);
