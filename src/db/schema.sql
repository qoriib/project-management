-- ============================================================
-- SCHEMA DATABASE RELASIONAL (SQLITE COMPATIBLE)
-- ============================================================

PRAGMA foreign_keys = ON;

-- 1. MASTER DATA: PROYEK & KONTRAKTOR
CREATE TABLE IF NOT EXISTS projects (
    project_id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_code TEXT UNIQUE NOT NULL,
    project_name TEXT NOT NULL,          -- Contoh: PAKET PRESERVASI JALAN MARHEN - SULUSUBAN
    contractor_name TEXT NOT NULL,       -- Contoh: CV. GANESHA MANDALA KARIM
    fiscal_year INTEGER NOT NULL,        -- Contoh: 2026
    status TEXT DEFAULT 'ON_PROGRESS',
    created_at TEXT DEFAULT (datetime('now', 'localtime'))
);

-- 2. MASTER DATA: VENDOR / PEMASOK / TOKO / PENYEDIA SEWA
CREATE TABLE IF NOT EXISTS vendors (
    vendor_id INTEGER PRIMARY KEY AUTOINCREMENT,
    vendor_name TEXT UNIQUE NOT NULL,    -- Contoh: PT. BSBP, PT. BIMA II, Toko Thomas Jaya
    vendor_type TEXT NOT NULL,           -- 'MATERIAL_SUPPLIER', 'EQUIPMENT_RENTAL', 'STORE'
    phone TEXT,
    address TEXT,
    created_at TEXT DEFAULT (datetime('now', 'localtime'))
);

-- 3. MASTER DATA: KATALOG MATERIAL & ALAT
CREATE TABLE IF NOT EXISTS items (
    item_id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_code TEXT UNIQUE,
    item_name TEXT NOT NULL,             -- Contoh: Besi 10 mm, Base A, Beton FC-10 Mpa
    category TEXT NOT NULL,              -- 'MATERIAL', 'ALAT', 'BETON', 'SOLAR', 'ATK/K3'
    unit TEXT NOT NULL                   -- 'm3', 'Kg', 'Batang', 'Liter', 'Rol', 'Pcs'
);

-- 4. TAHAP 1: PURCHASE ORDER (PO / PEMESANAN)
CREATE TABLE IF NOT EXISTS purchase_orders (
    po_id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER REFERENCES projects(project_id) ON DELETE CASCADE,
    vendor_id INTEGER REFERENCES vendors(vendor_id) ON DELETE RESTRICT,
    po_number TEXT UNIQUE NOT NULL,      -- Contoh: 001/GMK-S/I/2026
    po_date TEXT NOT NULL,
    notes TEXT,                          -- Catatan khusus / Lokasi Pengiriman
    created_at TEXT DEFAULT (datetime('now', 'localtime'))
);

-- Rincian Item Barang yang ada di dalam 1 PO
CREATE TABLE IF NOT EXISTS po_items (
    po_item_id INTEGER PRIMARY KEY AUTOINCREMENT,
    po_id INTEGER REFERENCES purchase_orders(po_id) ON DELETE CASCADE,
    item_id INTEGER REFERENCES items(item_id) ON DELETE RESTRICT,
    ordered_volume REAL NOT NULL,        -- Volume/Kuantitas yang dipesan
    unit_price REAL NOT NULL,            -- Harga Satuan
    subtotal_price REAL GENERATED ALWAYS AS (ordered_volume * unit_price) STORED,
    ppn_percentage REAL DEFAULT 0.00,    -- Contoh: 12.00 jika ada PPN
    ppn_amount REAL GENERATED ALWAYS AS (ordered_volume * unit_price * (ppn_percentage / 100.0)) STORED,
    total_price REAL GENERATED ALWAYS AS (ordered_volume * unit_price * (1.0 + ppn_percentage / 100.0)) STORED
);

-- 5. TAHAP 2: PENGIRIMAN (DELIVERY / REALISASI FISIK LAPANGAN)
CREATE TABLE IF NOT EXISTS deliveries (
    delivery_id INTEGER PRIMARY KEY AUTOINCREMENT,
    po_item_id INTEGER REFERENCES po_items(po_item_id) ON DELETE CASCADE,
    delivery_date TEXT NOT NULL,
    delivered_volume REAL NOT NULL,      -- Volume riil terkirim pada tanggal tsb
    delivery_note_number TEXT,           -- Nomor Surat Jalan (opsional)
    location_destination TEXT,           -- Contoh: Tanjungan / Sulusuban
    notes TEXT                           -- Keterangan ritase / pengiriman
);

-- 6. DUKUNGAN OPERASIONAL: JADWAL & LOG ALAT BERAT / SOLAR
CREATE TABLE IF NOT EXISTS equipment_logs (
    equip_log_id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER REFERENCES projects(project_id) ON DELETE SET NULL,
    vendor_id INTEGER REFERENCES vendors(vendor_id) ON DELETE SET NULL,
    equipment_name TEXT NOT NULL,        -- Contoh: Excavator Kobelco SK50, Vibro Sakai
    operator_name TEXT,                  -- Contoh: Op. Epan, Op. Fariz
    work_date_start TEXT NOT NULL,
    work_date_end TEXT,
    duration_value REAL NOT NULL,        -- Jumlah jam/hari/rit
    duration_unit TEXT NOT NULL,         -- 'Jam', 'Hari', 'Rit'
    rate_per_unit REAL NOT NULL,         -- Harga sewa per jam/hari
    total_cost REAL GENERATED ALWAYS AS (duration_value * rate_per_unit) STORED,
    activity_description TEXT            -- Contoh: Gali Drainase / Pemadatan Bahu
);

-- 7. TAHAP 3: PENAGIHAN & REKONSILIASI (INVOICING & PAYMENTS)
CREATE TABLE IF NOT EXISTS invoices (
    invoice_id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER REFERENCES projects(project_id) ON DELETE SET NULL,
    vendor_id INTEGER REFERENCES vendors(vendor_id) ON DELETE RESTRICT,
    invoice_number TEXT UNIQUE,
    invoice_date TEXT NOT NULL,
    total_amount REAL NOT NULL,          -- Nilai Total Tagihan
    paid_amount REAL DEFAULT 0.00,       -- Pembayaran yang sudah direalisasikan
    remaining_balance REAL GENERATED ALWAYS AS (total_amount - paid_amount) STORED,
    payment_status TEXT DEFAULT 'UNPAID',-- 'UNPAID', 'PARTIAL', 'PAID'
    ownership_type TEXT DEFAULT 'INTERNAL',-- 'INTERNAL' / 'EKSTERNAL' (seperti pada sheet CPAS)
    created_at TEXT DEFAULT (datetime('now', 'localtime'))
);

-- Rincian item tagihan yang mencakup gabungan PO / Alat Berat
CREATE TABLE IF NOT EXISTS invoice_items (
    inv_item_id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_id INTEGER REFERENCES invoices(invoice_id) ON DELETE CASCADE,
    po_item_id INTEGER REFERENCES po_items(po_item_id) ON DELETE SET NULL,
    equip_log_id INTEGER REFERENCES equipment_logs(equip_log_id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    amount REAL NOT NULL
);

-- View: Rekap Sisa Volume Pengiriman Per Item PO (Mencegah Sisa Kontrak Tercecer)
CREATE VIEW IF NOT EXISTS view_po_delivery_summary AS
SELECT 
    p.project_name,
    po.po_number,
    v.vendor_name,
    i.item_name,
    poi.ordered_volume AS volume_po,
    COALESCE(SUM(d.delivered_volume), 0) AS total_volume_terkirim,
    (poi.ordered_volume - COALESCE(SUM(d.delivered_volume), 0)) AS sisa_volume_kontrak,
    i.unit
FROM po_items poi
JOIN purchase_orders po ON poi.po_id = po.po_id
JOIN projects p ON po.project_id = p.project_id
JOIN vendors v ON po.vendor_id = v.vendor_id
JOIN items i ON poi.item_id = i.item_id
LEFT JOIN deliveries d ON poi.po_item_id = d.po_item_id
GROUP BY poi.po_item_id;
