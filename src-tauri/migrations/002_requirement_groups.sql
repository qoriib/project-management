-- 002_requirement_groups.sql
-- Migration to support grouping requirements (item material) into requirement groups (item pekerjaan)
-- and linking purchase orders (PO) to requirement groups.

CREATE TABLE `requirement_groups` (
	`requirement_group_id` text NOT NULL PRIMARY KEY,
	`project_id` text NOT NULL,
	`group_name` text NOT NULL,
	`budget` real DEFAULT NULL,
	`created_at` text DEFAULT (datetime('now', 'localtime')),
	`updated_at` text DEFAULT (datetime('now', 'localtime')),
	`deleted_at` text DEFAULT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`project_id`) ON UPDATE no action ON DELETE cascade
);

CREATE INDEX IF NOT EXISTS `idx_requirement_groups_project_id` ON `requirement_groups`(`project_id`);

-- Link requirements to requirement_groups
ALTER TABLE `requirements` ADD COLUMN `requirement_group_id` text REFERENCES `requirement_groups`(`requirement_group_id`) ON UPDATE no action ON DELETE set null;
CREATE INDEX IF NOT EXISTS `idx_requirements_group_id` ON `requirements`(`requirement_group_id`);

-- Link orders (PO) to requirement_groups (sebagai default template pekerjaan untuk item baru pada PO)
ALTER TABLE `orders` ADD COLUMN `requirement_group_id` text REFERENCES `requirement_groups`(`requirement_group_id`) ON UPDATE no action ON DELETE set null;
CREATE INDEX IF NOT EXISTS `idx_orders_group_id` ON `orders`(`requirement_group_id`);

-- Link order_items to requirement_groups (pekerjaan per item PO, relasi utama setiap item ke kelompok pekerjaan)
ALTER TABLE `order_items` ADD COLUMN `requirement_group_id` text REFERENCES `requirement_groups`(`requirement_group_id`) ON UPDATE no action ON DELETE set null;
CREATE INDEX IF NOT EXISTS `idx_order_items_group_id` ON `order_items`(`requirement_group_id`);
