-- 002_add_updated_at.sql
-- Add updated_at column to all tables for LWW Merge synchronization

ALTER TABLE projects ADD COLUMN updated_at text DEFAULT (datetime('now', 'localtime'));
UPDATE projects SET updated_at = created_at;

ALTER TABLE vendors ADD COLUMN updated_at text DEFAULT (datetime('now', 'localtime'));
UPDATE vendors SET updated_at = created_at;

ALTER TABLE item_categories ADD COLUMN updated_at text DEFAULT (datetime('now', 'localtime'));
ALTER TABLE units ADD COLUMN updated_at text DEFAULT (datetime('now', 'localtime'));
ALTER TABLE items ADD COLUMN updated_at text DEFAULT (datetime('now', 'localtime'));
ALTER TABLE item_prices ADD COLUMN updated_at text DEFAULT (datetime('now', 'localtime'));
ALTER TABLE bom_groups ADD COLUMN updated_at text DEFAULT (datetime('now', 'localtime'));

ALTER TABLE bill_of_materials ADD COLUMN updated_at text DEFAULT (datetime('now', 'localtime'));
UPDATE bill_of_materials SET updated_at = created_at;

ALTER TABLE purchase_orders ADD COLUMN updated_at text DEFAULT (datetime('now', 'localtime'));
UPDATE purchase_orders SET updated_at = created_at;

ALTER TABLE po_items ADD COLUMN updated_at text DEFAULT (datetime('now', 'localtime'));
ALTER TABLE deliveries ADD COLUMN updated_at text DEFAULT (datetime('now', 'localtime'));
ALTER TABLE delivery_items ADD COLUMN updated_at text DEFAULT (datetime('now', 'localtime'));
