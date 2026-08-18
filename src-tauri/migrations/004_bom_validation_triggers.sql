-- 004_bom_validation_triggers.sql
-- Tambahkan database triggers untuk mengunci tabel bill_of_materials secara mutlak jika proyek sudah di-ACC

-- 1. Mencegah INSERT
CREATE TRIGGER IF NOT EXISTS prevent_bom_insert
BEFORE INSERT ON bill_of_materials
FOR EACH ROW
WHEN (SELECT bom_is_approved FROM projects WHERE project_id = NEW.project_id) = 1
BEGIN
    SELECT RAISE(ABORT, 'Gagal: BOM untuk proyek ini telah di-ACC dan dikunci.');
END;

-- 2. Mencegah UPDATE
CREATE TRIGGER IF NOT EXISTS prevent_bom_update
BEFORE UPDATE ON bill_of_materials
FOR EACH ROW
WHEN (SELECT bom_is_approved FROM projects WHERE project_id = NEW.project_id) = 1
BEGIN
    SELECT RAISE(ABORT, 'Gagal: BOM untuk proyek ini telah di-ACC dan dikunci.');
END;

-- 3. Mencegah DELETE
CREATE TRIGGER IF NOT EXISTS prevent_bom_delete
BEFORE DELETE ON bill_of_materials
FOR EACH ROW
WHEN (SELECT bom_is_approved FROM projects WHERE project_id = OLD.project_id) = 1
BEGIN
    SELECT RAISE(ABORT, 'Gagal: BOM untuk proyek ini telah di-ACC dan dikunci.');
END;
