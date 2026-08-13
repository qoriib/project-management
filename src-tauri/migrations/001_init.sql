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
	`planned_volume` real NOT NULL,
	`estimated_unit_price` real DEFAULT 0,
	`created_at` text DEFAULT (datetime('now', 'localtime')),
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`project_id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`stage_id`) REFERENCES `project_stages`(`stage_id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`item_id`) REFERENCES `items`(`item_id`) ON UPDATE no action ON DELETE restrict
);

-- 5. TAHAP 1: PURCHASE ORDER (PO / PEMESANAN)
CREATE TABLE `purchase_orders` (
	`po_id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`project_id` integer,
	`vendor_id` integer,
	`po_number` text NOT NULL,
	`po_date` text NOT NULL,
	`notes` text,
	`created_at` text DEFAULT (datetime('now', 'localtime')),
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`project_id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`vendor_id`) REFERENCES `vendors`(`vendor_id`) ON UPDATE no action ON DELETE restrict
);

CREATE UNIQUE INDEX `purchase_orders_po_number_unique` ON `purchase_orders` (`po_number`);

-- Rincian Item Barang yang ada di dalam 1 PO
CREATE TABLE `po_items` (
	`po_item_id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`po_id` integer,
	`item_id` integer,
	`ordered_volume` real NOT NULL,
	`unit_price` real NOT NULL,
	`subtotal_price` real GENERATED ALWAYS AS (ordered_volume * unit_price) STORED,
	`ppn_percentage` real DEFAULT 0,
	`ppn_amount` real GENERATED ALWAYS AS (ordered_volume * unit_price * (ppn_percentage / 100.0)) STORED,
	`total_price` real GENERATED ALWAYS AS (ordered_volume * unit_price * (1.0 + ppn_percentage / 100.0)) STORED,
	FOREIGN KEY (`po_id`) REFERENCES `purchase_orders`(`po_id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`item_id`) REFERENCES `items`(`item_id`) ON UPDATE no action ON DELETE restrict
);

-- 6. TAHAP 2: PENGIRIMAN (DELIVERY / REALISASI FISIK LAPANGAN)
CREATE TABLE `deliveries` (
	`delivery_id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`po_item_id` integer,
	`delivery_date` text NOT NULL,
	`delivered_volume` real NOT NULL,
	`delivery_note_number` text,
	`location_destination` text,
	`notes` text,
	FOREIGN KEY (`po_item_id`) REFERENCES `po_items`(`po_item_id`) ON UPDATE no action ON DELETE cascade
);

-- 7. DUKUNGAN OPERASIONAL: JADWAL & LOG ALAT BERAT / SOLAR
CREATE TABLE `equipment_logs` (
	`equip_log_id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`project_id` integer,
	`vendor_id` integer,
	`equipment_name` text NOT NULL,
	`operator_name` text,
	`work_date_start` text NOT NULL,
	`work_date_end` text,
	`duration_value` real NOT NULL,
	`duration_unit` text NOT NULL,
	`rate_per_unit` real NOT NULL,
	`total_cost` real GENERATED ALWAYS AS (duration_value * rate_per_unit) STORED,
	`activity_description` text,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`project_id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`vendor_id`) REFERENCES `vendors`(`vendor_id`) ON UPDATE no action ON DELETE set null
);

-- 8. TAHAP 3: PENAGIHAN & REKONSILIASI (INVOICING & PAYMENTS)
CREATE TABLE `invoices` (
	`invoice_id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`project_id` integer,
	`vendor_id` integer,
	`invoice_number` text,
	`invoice_date` text NOT NULL,
	`total_amount` real NOT NULL,
	`paid_amount` real DEFAULT 0,
	`remaining_balance` real GENERATED ALWAYS AS (total_amount - paid_amount) STORED,
	`payment_status` text DEFAULT 'UNPAID',
	`ownership_type` text DEFAULT 'INTERNAL',
	`created_at` text DEFAULT (datetime('now', 'localtime')),
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`project_id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`vendor_id`) REFERENCES `vendors`(`vendor_id`) ON UPDATE no action ON DELETE restrict
);

CREATE UNIQUE INDEX `invoices_invoice_number_unique` ON `invoices` (`invoice_number`);

-- Rincian item tagihan yang mencakup gabungan PO / Alat Berat
CREATE TABLE `invoice_items` (
	`inv_item_id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`invoice_id` integer,
	`po_item_id` integer,
	`equip_log_id` integer,
	`description` text NOT NULL,
	`amount` real NOT NULL,
	FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`invoice_id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`po_item_id`) REFERENCES `po_items`(`po_item_id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`equip_log_id`) REFERENCES `equipment_logs`(`equip_log_id`) ON UPDATE no action ON DELETE set null
);
