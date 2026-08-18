-- 003_add_bom_approval.sql
-- Add approval status to projects for BOM locking and approval flow

ALTER TABLE projects ADD COLUMN bom_is_approved INTEGER DEFAULT 0;
