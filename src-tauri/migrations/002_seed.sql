-- 002_seed.sql
-- Seed data master untuk keperluan testing (Units, Categories, Items, Vendors, Projects, Stages)

-- 1. UNITS (Satuan)
INSERT INTO `units` (`unit_name`) VALUES 
('Zak'), ('m3'), ('m2'), ('m'), ('Kg'), ('Liter'), 
('Pail'), ('Btg'), ('Lembar'), ('Unit'), ('Roll'), 
('Ls'), ('Jam'), ('Hari'), ('Bulan');

-- 2. ITEM CATEGORIES (Kategori Material/Alat)
INSERT INTO `item_categories` (`category_name`) VALUES 
('Bahan'),
('Alat'),
('Operasional');

-- 3. VENDORS (Daftar Pemasok)
INSERT INTO `vendors` (`vendor_name`, `phone`, `address`) VALUES 
('TB. Sinar Bangunan', '081234567890', 'Jl. Pembangunan Raya No. 12, Jakarta'),
('PT. Baja Jaya Nusantara', '021-9876543', 'Kawasan Industri Cikarang Blok B2'),
('CV. Sumber Pasir', '085677788899', 'Jl. Raya Bogor No. 88, Depok'),
('Toko Cat Warna Indah', '081912312312', 'Jl. Merdeka No. 45, Bandung'),
('PT. Keramik Indah', '021-5551234', 'Jl. Gatot Subroto Kav. 1, Jakarta'),
('Sewa Alat Berat Nusantara', '081199998888', 'Jl. Perintis Kemerdekaan, Bekasi'),
('Depo Bangunan Mandiri', '021-8889990', 'Jl. Serpong Raya No. 10, Tangerang');

-- 4. ITEMS (Katalog Material)
INSERT INTO `items` (`item_name`, `category`, `unit`) VALUES 
('Semen Portland 50 Kg', 'Bahan', 'Zak'),
('Semen Putih 40 Kg', 'Bahan', 'Zak'),
('Perekat Bata Ringan / Mortar 40 Kg', 'Bahan', 'Zak'),
('Pasir Pasang', 'Bahan', 'm3'),
('Pasir Beton', 'Bahan', 'm3'),
('Batu Pecah / Split 1/2', 'Bahan', 'm3'),
('Batu Kali', 'Bahan', 'm3'),
('Besi Beton Polos 8mm x 12m', 'Bahan', 'Btg'),
('Besi Beton Polos 10mm x 12m', 'Bahan', 'Btg'),
('Besi Beton Ulir 13mm x 12m', 'Bahan', 'Btg'),
('Besi Beton Ulir 16mm x 12m', 'Bahan', 'Btg'),
('Kawat Bendrat', 'Bahan', 'Kg'),
('Triplek / Multiplek 9mm', 'Bahan', 'Lembar'),
('Triplek / Multiplek 12mm', 'Bahan', 'Lembar'),
('Kaso 5/7 Meranti', 'Bahan', 'Btg'),
('Papan Cor 2/20 Meranti', 'Bahan', 'Lembar'),
('Cat Tembok Interior 25kg (Pail)', 'Bahan', 'Pail'),
('Cat Tembok Eksterior 20L', 'Bahan', 'Pail'),
('Waterproofing 20kg', 'Bahan', 'Pail'),
('Pipa PVC 4 inch tipe AW', 'Bahan', 'Btg'),
('Pipa PVC 1/2 inch tipe AW', 'Bahan', 'Btg'),
('Kabel NYM 3x2.5mm', 'Bahan', 'Roll'),
('Lampu Downlight LED 12W', 'Bahan', 'Unit'),
('Granit Tile 60x60 (Cream)', 'Bahan', 'm2'),
('Keramik Dinding 30x60', 'Bahan', 'm2'),
('Sewa Excavator PC100', 'Alat', 'Jam'),
('Sewa Concrete Pump', 'Alat', 'Hari'),
('Tukang Batu / Pekerja', 'Operasional', 'Hari'),
('Mandor', 'Operasional', 'Hari');

-- 5. ITEM PRICES (Varian Harga Material)
-- Asumsi ID item sesuai dengan urutan insert di atas (1-29)
INSERT INTO `item_prices` (`item_id`, `price`) VALUES 
(1, 75000), (1, 78000), -- Semen Portland 50 Kg
(2, 85000), -- Semen Putih
(3, 90000), (3, 92000), -- Mortar
(4, 250000), (4, 260000), -- Pasir Pasang
(5, 300000), -- Pasir Beton
(6, 350000), -- Batu Split
(7, 280000), -- Batu Kali
(8, 45000), (8, 48000), -- Besi 8mm
(9, 72000), (9, 75000), -- Besi 10mm
(10, 115000), (10, 118000), -- Besi Ulir 13mm
(11, 165000), -- Besi Ulir 16mm
(12, 22000), -- Kawat Bendrat
(13, 110000), -- Triplek 9mm
(14, 145000), (14, 150000), -- Triplek 12mm
(15, 35000), -- Kaso 5/7
(16, 25000), -- Papan Cor
(17, 850000), (17, 950000), -- Cat Interior
(18, 1250000), -- Cat Eksterior
(19, 750000), -- Waterproofing
(20, 150000), -- Pipa PVC 4 inch
(21, 35000), -- Pipa PVC 1/2 inch
(22, 650000), -- Kabel NYM 3x2.5
(23, 55000), -- Downlight
(24, 185000), (24, 210000), -- Granit 60x60
(25, 95000), -- Keramik Dinding
(26, 180000), (26, 200000), -- Excavator
(27, 4500000), -- Concrete Pump
(28, 150000), (28, 175000), -- Tukang
(29, 250000); -- Mandor

-- 6. PROJECTS (Proyek Aktif)
INSERT INTO `projects` (`project_name`, `company_name`, `fiscal_year`) VALUES 
('Pembangunan Rumah Tinggal 2 Lantai Bpk. Budi', 'PT. Bangun Rumah Idaman', 2026),
('Renovasi Interior Kantor PT. xyz', 'CV. Karya Mandiri', 2026),
('Pembangunan Gudang Logistik Cikarang', 'PT. Konstruksi Maju Bersama', 2026);

-- 7. PROJECT STAGES (Tahapan Proyek)
-- Tahapan untuk Proyek 1 (ID 1)
INSERT INTO `project_stages` (`project_id`, `stage_name`) VALUES 
(1, 'Pekerjaan Persiapan & Tanah'),
(1, 'Pekerjaan Pondasi & Beton Bertulang'),
(1, 'Pekerjaan Pasangan Dinding & Plesteran'),
(1, 'Pekerjaan Atap & Plafon'),
(1, 'Pekerjaan Lantai & Keramik'),
(1, 'Pekerjaan Elektrikal & Plumbing'),
(1, 'Pekerjaan Pengecatan & Finishing');

-- Tahapan untuk Proyek 2 (ID 2)
INSERT INTO `project_stages` (`project_id`, `stage_name`) VALUES 
(2, 'Pekerjaan Pembongkaran (Demolisi)'),
(2, 'Pekerjaan Partisi Kaca & Gypsum'),
(2, 'Pekerjaan ME (Mechanical Electrical)'),
(2, 'Pekerjaan Custom Furniture');

-- Tahapan untuk Proyek 3 (ID 3)
INSERT INTO `project_stages` (`project_id`, `stage_name`) VALUES 
(3, 'Pekerjaan Tanah & Cut and Fill'),
(3, 'Pekerjaan Struktur Baja (Warehouse)'),
(3, 'Pekerjaan Lantai Beton (Floor Hardener)'),
(3, 'Pekerjaan Utilitas Gudang');

-- 8. BILL OF MATERIALS (BOM)
INSERT INTO `bill_of_materials` (`project_id`, `stage_id`, `item_id`, `item_price_id`, `qty`) VALUES 
-- PROYEK 1: Rumah Tinggal 2 Lantai
-- Tahap 1: Persiapan & Tanah
(1, 1, 26, 35, 40),    -- Sewa Excavator 40 Jam
(1, 1, 28, 38, 14),    -- Tukang 14 Hari
(1, 1, 29, 40, 14),    -- Mandor 14 Hari
-- Tahap 2: Pondasi & Beton Bertulang
(1, 2, 1, 1, 200),     -- Semen Portland 200 Zak
(1, 2, 5, 8, 15),      -- Pasir Beton 15 m3
(1, 2, 6, 9, 15),      -- Batu Split 15 m3
(1, 2, 8, 11, 100),    -- Besi 8mm 100 Btg
(1, 2, 9, 13, 150),    -- Besi 10mm 150 Btg
(1, 2, 10, 15, 200),   -- Besi Ulir 13mm 200 Btg
(1, 2, 12, 18, 20),    -- Kawat Bendrat 20 Kg
(1, 2, 16, 23, 50),    -- Papan Cor 50 Lembar
(1, 2, 15, 22, 100),   -- Kaso 100 Btg
(1, 2, 27, 37, 2),     -- Concrete Pump 2 Hari
-- Tahap 3: Pasangan Dinding & Plesteran
(1, 3, 1, 1, 150),     -- Semen 150 Zak
(1, 3, 4, 6, 20),      -- Pasir Pasang 20 m3
(1, 3, 3, 4, 100),     -- Mortar 100 Zak
-- Tahap 4: Atap & Plafon
(1, 4, 13, 19, 50),    -- Triplek 9mm 50 Lembar (Plafon)
(1, 4, 15, 22, 100),   -- Kaso 100 Btg
-- Tahap 5: Lantai & Keramik
(1, 5, 24, 32, 120),   -- Granit 60x60 120 m2
(1, 5, 25, 34, 40),    -- Keramik Dinding 40 m2
(1, 5, 2, 3, 10),      -- Semen Putih 10 Zak
-- Tahap 6: Elektrikal & Plumbing
(1, 6, 20, 28, 10),    -- Pipa 4 inch 10 Btg
(1, 6, 21, 29, 25),    -- Pipa 1/2 inch 25 Btg
(1, 6, 22, 30, 5),     -- Kabel NYM 5 Roll
(1, 6, 23, 31, 30),    -- Downlight 30 Unit
-- Tahap 7: Pengecatan & Finishing
(1, 7, 17, 24, 15),    -- Cat Interior 15 Pail
(1, 7, 18, 26, 10),    -- Cat Eksterior 10 Pail
(1, 7, 19, 27, 5),     -- Waterproofing 5 Pail

-- PROYEK 2: Interior Kantor PT. xyz
-- Tahap 8: Pembongkaran
(2, 8, 28, 38, 20),    -- Tukang 20 Hari
-- Tahap 9: Partisi Kaca & Gypsum
(2, 9, 14, 20, 60),    -- Triplek 12mm 60 Lembar
-- Tahap 10: ME
(2, 10, 22, 30, 10),   -- Kabel NYM 10 Roll
(2, 10, 23, 31, 50),   -- Downlight 50 Unit
-- Tahap 11: Custom Furniture
(2, 11, 14, 20, 100),  -- Triplek 12mm 100 Lembar
(2, 11, 17, 24, 5),    -- Cat Interior 5 Pail

-- PROYEK 3: Gudang Logistik Cikarang
-- Tahap 12: Tanah & Cut and Fill
(3, 12, 26, 36, 120),  -- Excavator 120 Jam
(3, 12, 4, 6, 50),     -- Pasir Urug/Pasang 50 m3
-- Tahap 13: Struktur Baja (Warehouse)
(3, 13, 11, 17, 500),  -- Besi Ulir 16mm 500 Btg
(3, 13, 27, 37, 5);    -- Concrete Pump 5 Hari
