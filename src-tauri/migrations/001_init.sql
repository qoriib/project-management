-- 001_init.sql
-- Initialize core database schema with soft delete structure
-- Primary keys use UUID v7 (TEXT), generated at application layer

CREATE TABLE `projects` (
	`project_id` text NOT NULL PRIMARY KEY,
	`project_name` text NOT NULL,
	`company_name` text NOT NULL,
	`fiscal_year` integer NOT NULL,
	`requirements_is_approved` integer DEFAULT 0,
	`created_at` text DEFAULT (datetime('now', 'localtime')),
	`updated_at` text DEFAULT (datetime('now', 'localtime')),
	`deleted_at` text DEFAULT NULL
);

CREATE TABLE `vendors` (
	`vendor_id` text NOT NULL PRIMARY KEY,
	`vendor_name` text NOT NULL,
	`phone` text,
	`address` text,
	`created_at` text DEFAULT (datetime('now', 'localtime')),
	`updated_at` text DEFAULT (datetime('now', 'localtime')),
	`deleted_at` text DEFAULT NULL
);

CREATE TABLE `item_categories` (
	`category_id` text NOT NULL PRIMARY KEY,
	`prefix` text NOT NULL,
	`category_code` text NOT NULL,
	`category_name` text NOT NULL,
	`updated_at` text DEFAULT (datetime('now', 'localtime')),
	`deleted_at` text DEFAULT NULL
);

CREATE TABLE `units` (
	`unit_id` text NOT NULL PRIMARY KEY,
	`unit_name` text NOT NULL,
	`updated_at` text DEFAULT (datetime('now', 'localtime')),
	`deleted_at` text DEFAULT NULL
);

CREATE TABLE `items` (
	`item_id` text NOT NULL PRIMARY KEY,
	`item_code` text NOT NULL,
	`item_name` text NOT NULL,
	`category_id` text NOT NULL,
	`unit_id` text NOT NULL,
	`updated_at` text DEFAULT (datetime('now', 'localtime')),
	`deleted_at` text DEFAULT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `item_categories`(`category_id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`unit_id`) REFERENCES `units`(`unit_id`) ON UPDATE no action ON DELETE restrict
);

-- Variasi harga per item (master harga)
CREATE TABLE `item_prices` (
	`item_price_id` text NOT NULL PRIMARY KEY,
	`item_id` text NOT NULL,
	`price` real NOT NULL,
	`updated_at` text DEFAULT (datetime('now', 'localtime')),
	`deleted_at` text DEFAULT NULL,
	FOREIGN KEY (`item_id`) REFERENCES `items`(`item_id`) ON UPDATE no action ON DELETE cascade
);

-- TAHAP PERSIAPAN: REQUIREMENTS
CREATE TABLE `requirements` (
	`requirement_id` text NOT NULL PRIMARY KEY,
	`project_id` text NOT NULL,
	`item_id` text NOT NULL,
	`item_price_id` text NOT NULL,
	`qty` real NOT NULL,
	`created_at` text DEFAULT (datetime('now', 'localtime')),
	`updated_at` text DEFAULT (datetime('now', 'localtime')),
	`deleted_at` text DEFAULT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`project_id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`item_id`) REFERENCES `items`(`item_id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`item_price_id`) REFERENCES `item_prices`(`item_price_id`) ON UPDATE no action ON DELETE restrict
);

-- TAHAP PELAKSANAAN: ORDER & RECEIPTS
CREATE TABLE `orders` (
	`order_id` text NOT NULL PRIMARY KEY,
	`project_id` text NOT NULL,
	`order_code` text,
	`order_date` text NOT NULL,
	`has_tax` integer DEFAULT 0,
	`created_at` text DEFAULT (datetime('now', 'localtime')),
	`updated_at` text DEFAULT (datetime('now', 'localtime')),
	`deleted_at` text DEFAULT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`project_id`) ON UPDATE no action ON DELETE cascade
);

CREATE TABLE `order_items` (
	`order_item_id` text NOT NULL PRIMARY KEY,
	`order_id` text NOT NULL,
	`item_id` text NOT NULL,
	`vendor_id` text NOT NULL,
	`item_price_id` text NOT NULL,
	`qty` real NOT NULL,
	`updated_at` text DEFAULT (datetime('now', 'localtime')),
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`order_id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`item_id`) REFERENCES `items`(`item_id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`vendor_id`) REFERENCES `vendors`(`vendor_id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`item_price_id`) REFERENCES `item_prices`(`item_price_id`) ON UPDATE no action ON DELETE restrict
);

CREATE TABLE `receipts` (
	`receipt_id` text NOT NULL PRIMARY KEY,
	`order_id` text NOT NULL,
	`receipt_code` text,
	`receipt_date` text NOT NULL,
	`updated_at` text DEFAULT (datetime('now', 'localtime')),
	`deleted_at` text DEFAULT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`order_id`) ON UPDATE no action ON DELETE cascade
);

CREATE TABLE `receipt_items` (
	`receipt_item_id` text NOT NULL PRIMARY KEY,
	`receipt_id` text NOT NULL,
	`order_item_id` text NOT NULL,
	`qty` real NOT NULL,
	`updated_at` text DEFAULT (datetime('now', 'localtime')),
	FOREIGN KEY (`receipt_id`) REFERENCES `receipts`(`receipt_id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`order_item_id`) REFERENCES `order_items`(`order_item_id`) ON UPDATE no action ON DELETE restrict
);

-- Tambahkan database triggers untuk mengunci tabel requirements secara mutlak jika proyek sudah di-ACC

-- 1. Mencegah INSERT
CREATE TRIGGER prevent_requirement_insert
BEFORE INSERT ON requirements
FOR EACH ROW
WHEN (SELECT requirements_is_approved FROM projects WHERE project_id = NEW.project_id) = 1
BEGIN
    SELECT RAISE(ABORT, 'Gagal: Kebutuhan untuk proyek ini telah dikunci.');
END;

-- 2. Mencegah UPDATE
CREATE TRIGGER prevent_requirement_update
BEFORE UPDATE ON requirements
FOR EACH ROW
WHEN (SELECT requirements_is_approved FROM projects WHERE project_id = NEW.project_id) = 1
BEGIN
    SELECT RAISE(ABORT, 'Gagal: Kebutuhan untuk proyek ini telah dikunci.');
END;

-- 3. Mencegah DELETE
CREATE TRIGGER prevent_requirement_delete
BEFORE DELETE ON requirements
FOR EACH ROW
WHEN (SELECT requirements_is_approved FROM projects WHERE project_id = OLD.project_id) = 1
BEGIN
    SELECT RAISE(ABORT, 'Gagal: Kebutuhan untuk proyek ini telah dikunci.');
END;
