-- 003_soft_delete.sql
-- Add soft-delete column (deleted_at) to all main entity tables.
-- Junction/detail tables (po_items, delivery_items, item_prices, project_stages)
-- follow their parent's lifecycle via CASCADE and don't need soft delete.

ALTER TABLE projects ADD COLUMN deleted_at TEXT DEFAULT NULL;
ALTER TABLE vendors ADD COLUMN deleted_at TEXT DEFAULT NULL;
ALTER TABLE items ADD COLUMN deleted_at TEXT DEFAULT NULL;
ALTER TABLE item_categories ADD COLUMN deleted_at TEXT DEFAULT NULL;
ALTER TABLE units ADD COLUMN deleted_at TEXT DEFAULT NULL;
ALTER TABLE purchase_orders ADD COLUMN deleted_at TEXT DEFAULT NULL;
ALTER TABLE bill_of_materials ADD COLUMN deleted_at TEXT DEFAULT NULL;
ALTER TABLE deliveries ADD COLUMN deleted_at TEXT DEFAULT NULL;
