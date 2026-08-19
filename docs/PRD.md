# Aplikasi Manajemen Proyek (Desktop) – Product Requirement Document (PRD)

| Metadata           | Detail                       |
| ------------------ | ---------------------------- |
| **Author / PM**    | Laman                        |
| **Status**         | `Draft`                      |
| **Target Rilis**   | Q3 2026 / v1.0.0             |
| **Tech Lead**      | Laman                        |
| **UI/UX Designer** | Laman                        |
| **Target Version** | v1.0.0                       |
| **Platform**       | Desktop (Windows) — Tauri v2 |
| **Repo**           | `project-management`         |

---

## 1. Executive Summary & Problem Statement

### 1.1 Latar Belakang (Context)

Perusahaan konstruksi, manufaktur, atau pengadaan barang sering mengelola proyek dengan nilai material yang besar dan melibatkan banyak vendor. Pengelolaan kebutuhan material (RAB/BOM), pemesanan (Purchase Order), dan penerimaan barang (Delivery) masih dilakukan secara manual menggunakan spreadsheet terpisah, yang rentan terhadap:

- **Data tidak konsisten** antara RAB yang sudah disetujui vs. realisasi PO dan penerimaan.
- **Tidak ada audit trail** — sulit melacak kapan dan berapa banyak suatu item dipesan atau diterima.
- **Proses multi-file** — team harus membuka banyak file Excel sekaligus untuk mendapatkan gambaran keseluruhan proyek.
- **Keterlambatan deteksi deviasi** antara anggaran yang direncanakan (`planned_budget`) vs. realisasi pemesanan (`total_po_price`).

### 1.2 Problem Statement

> **Formula:** _Project Manager / Tim Pengadaan_ mengalami kesulitan saat _memantau realisasi kebutuhan material terhadap anggaran dan penerimaan barang secara lintas dokumen_ karena _tidak adanya alat terpusat yang menghubungkan BOM, PO, dan Delivery dalam satu database_, yang mengakibatkan _keputusan pengadaan yang lambat, risiko over-order/under-order, dan sulitnya pertanggungjawaban keuangan proyek_.

### 1.3 Tujuan & Manfaat (Goals & Value Proposition)

**Bagi Pengguna (Project Manager / Tim Pengadaan):**

- Menyediakan satu sumber kebenaran (_single source of truth_) untuk seluruh siklus pengadaan material: dari perencanaan (BOM/RAB) ke pemesanan (PO) ke penerimaan (Delivery).
- Menampilkan laporan deviasi anggaran secara real-time tanpa perlu rekap manual.
- Memungkinkan drill-down per item untuk melihat riwayat PO dan Delivery secara kronologis.

**Bagi Bisnis / Perusahaan:**

- Mengurangi risiko fraud dan kesalahan entri data melalui sistem terpusat dengan relasi data yang ketat.
- Mempercepat proses closing laporan proyek dari hitungan hari menjadi hitungan menit.
- Mendukung akuntabilitas antar tim (pengadaan, keuangan, lapangan) dengan data yang dapat diaudit.

---

## 2. Target Audience & Persona

| Persona                                                    | Deskripsi & Karakteristik                                                                                                              | Pain Point Utama                                                                                                            | Kebutuhan Solusi                                                                        |
| ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| **Primary User — Project Manager / Koordinator Pengadaan** | Bertanggung jawab atas keseluruhan pengadaan material proyek. Bekerja di desktop Windows. Mengelola 1–5 proyek aktif secara bersamaan. | Tidak bisa melihat secara cepat item mana yang sudah dipesan tapi belum diterima, atau yang pemesanannya melebihi anggaran. | Dashboard laporan BOM vs. PO vs. Delivery real-time dengan indikator deviasi.           |
| **Secondary User — Admin / Data Entry**                    | Bertugas memasukkan data PO dan Delivery harian berdasarkan dokumen fisik. Tidak perlu akses laporan.                                  | Proses input data berulang, lambat, dan rentan typo.                                                                        | Form input yang terstruktur dengan validasi, autofill dari master data, dan bulk entry. |
| **Tertiary User — Pimpinan / Finance**                     | Memerlukan ringkasan anggaran per proyek untuk persetujuan atau audit. Akses tidak rutin.                                              | Membutuhkan angka total anggaran dan realisasi tanpa harus memahami detail teknis.                                          | Summary card: total budget, total PO, total delivered — tanpa noise.                    |

---

## 3. Success Metrics (KPIs / OKRs)

| Kategori Metrik        | Indikator Kunci                                         | Target                            | Cara Pengukuran                   |
| ---------------------- | ------------------------------------------------------- | --------------------------------- | --------------------------------- |
| **Adopsi**             | Jumlah proyek aktif yang dikelola di aplikasi           | >= 3 proyek dalam 1 bulan pertama | Count query pada tabel `projects` |
| **Efisiensi Input**    | Rata-rata waktu input 1 PO beserta item-itemnya         | < 3 menit per PO                  | Observasi langsung / user testing |
| **Akurasi Data**       | % discrepancy antara data di aplikasi vs. dokumen fisik | < 1% error rate                   | Audit sampling per bulan          |
| **Keandalan Laporan**  | Laporan BOM Report tersedia dalam < 2 detik             | p95 < 2 detik                     | Profiling query SQLite            |
| **Retensi Penggunaan** | Jumlah hari aktif aplikasi digunakan dalam sebulan      | >= 20 hari kerja                  | Log aktivitas lokal               |
| **Kepuasan Pengguna**  | Skor usability (SUS Score)                              | >= 75 / 100                       | Kuesioner pasca onboarding        |

---

## 4. Scope & Release Strategy

### 4.1 In-Scope (MVP / v1.0.0)

Fitur-fitur berikut sudah **terimplementasi atau dalam pengembangan aktif**:

- [x] **Master Data Management**: Manajemen Proyek, Item, Vendor, Kategori, Satuan, dan Harga Item.
- [x] **BOM / RAB (Bill of Materials)**: Input kebutuhan material per grup pekerjaan untuk setiap proyek.
- [x] **Purchase Order (PO)**: Pembuatan PO dengan multiple item, vendor, dan harga; mendukung update & soft delete.
- [x] **Delivery / Penerimaan**: Pencatatan penerimaan barang berdasarkan PO dengan tracking qty per item.
- [x] **Dashboard Laporan**: Laporan konsolidasi BOM vs. PO vs. Delivery per proyek dengan ringkasan anggaran.
- [x] **Item Log / Audit Trail**: Riwayat kronologis PO dan Delivery per item dalam suatu proyek.
- [x] **Dark / Light Mode**: Toggle tema antarmuka.
- [x] **Multi-Project Support**: Selektor proyek aktif di sidebar; semua modul berfilter berdasarkan proyek yang dipilih.
- [x] **Database Lokal (SQLite via Tauri)**: Penyimpanan data lokal tanpa ketergantungan server/internet.
- [x] **Soft Delete**: Data tidak benar-benar dihapus; mendukung audit dan recovery.

### 4.2 Out-of-Scope (Phase 2 / Backlog)

- [ ] **Export laporan ke PDF / Excel** — untuk distribusi ke stakeholder eksternal.
- [ ] **Multi-user / shared database** — sinkronisasi antar komputer dalam satu tim.
- [ ] **Integrasi ERP / akuntansi** (misal: SAP, Odoo) via API.
- [ ] **Notifikasi / alert otomatis** (misal: item hampir habis kuota BOM).
- [ ] **Autentikasi & manajemen role** pengguna.
- [ ] **Lampiran dokumen** (foto BAST, invoice) per delivery / PO.
- [ ] **Backup & restore database** otomatis ke cloud storage.
- [ ] **Dashboard grafik visualisasi** (charts) tren pengeluaran per waktu.

---

## 5. Functional Requirements (User Stories & Acceptance Criteria)

### FR-01: Master Data — Proyek

- **User Story:** _Sebagai Project Manager, saya ingin membuat dan mengelola data proyek (nama proyek, nama perusahaan, tahun fiskal) agar saya bisa memisahkan data antar proyek yang berbeda._
- **Acceptance Criteria:**
  - **Given** pengguna berada di halaman `/master/project`,
  - **When** pengguna mengisi form `project_name`, `company_name`, dan `fiscal_year` lalu klik Simpan,
  - **Then** proyek baru muncul di tabel dan dapat dipilih sebagai proyek aktif di sidebar.
  - Proyek yang dihapus menggunakan soft delete (`deleted_at` terisi) dan tidak muncul di daftar aktif.
  - Proyek mendukung pengelolaan BOM Group (grup pekerjaan) di dalam dialog proyek.

---

### FR-02: Master Data — Item, Kategori, Satuan, Vendor

- **User Story:** _Sebagai Admin, saya ingin mengelola data master item, kategori, satuan, dan vendor agar entri BOM dan PO dapat dilakukan dengan cepat melalui referensi data yang sudah ada._
- **Acceptance Criteria:**
  - **Item**: CRUD dengan relasi ke `item_categories` dan `units`; mendukung pengelolaan variasi harga (`item_prices`) per item dalam dialog terpisah.
  - **Vendor**: CRUD dengan field `vendor_name`, `phone`, `address`.
  - **Kategori & Satuan**: CRUD minimal (nama saja); digunakan sebagai lookup di form Item.
  - Semua entitas master mendukung soft delete dan tidak bisa dihapus hard jika masih direferensikan (RESTRICT).

---

### FR-03: BOM (Bill of Materials / RAB)

- **User Story:** _Sebagai Project Manager, saya ingin memasukkan daftar kebutuhan material (BOM) per grup pekerjaan dalam suatu proyek agar anggaran yang direncanakan dapat dijadikan acuan pengadaan._
- **Acceptance Criteria:**
  - **Given** proyek aktif sudah dipilih dan halaman `/bom` terbuka,
  - **When** pengguna menambahkan baris BOM dengan memilih grup, item, harga, dan kuantitas,
  - **Then** baris baru tersimpan dan langsung terlihat di tabel BOM dengan kalkulasi `qty x price` yang benar.
  - BOM dapat dikelola dalam mode tabel inline-editable untuk kecepatan input.
  - BOM mendukung pengelompokan berdasarkan `bom_group` (grup pekerjaan).
  - Soft delete didukung; baris yang dihapus tidak mempengaruhi laporan dashboard.

---

### FR-04: Purchase Order (PO)

- **User Story:** _Sebagai Tim Pengadaan, saya ingin membuat PO dengan multiple item dan vendor agar semua pesanan tercatat dalam sistem._
- **Acceptance Criteria:**
  - **Given** proyek aktif dipilih dan halaman `/po` terbuka,
  - **When** pengguna membuat PO baru dengan mengisi tanggal PO dan menambahkan item (item, vendor, harga, qty),
  - **Then** PO tersimpan dalam satu transaksi atomik (header + items).
  - PO menampilkan ringkasan: total harga, jumlah item, nama vendor.
  - PO dapat difilter berdasarkan rentang tanggal (`start_date`, `end_date`).
  - PO mendukung update: sinkronisasi item (upsert existing, tambah baru, hapus yang tidak ada).
  - Tabel PO menampilkan tracking per item: `qty ordered`, `qty delivered`, `remaining`.
  - Log delivery per PO dapat dilihat dalam sub-tabel (`PODeliveryLogTable`).

---

### FR-05: Delivery / Penerimaan Barang

- **User Story:** _Sebagai Tim Pengadaan, saya ingin mencatat penerimaan barang berdasarkan PO agar realisasi pengiriman terlacak dan tidak melebihi kuantitas yang dipesan._
- **Acceptance Criteria:**
  - **Given** PO sudah ada dan halaman `/delivery` terbuka,
  - **When** pengguna membuat delivery baru dengan memilih PO dan mengisi qty per item yang diterima,
  - **Then** delivery tersimpan dan qty yang diterima terefleksi di kolom `total_delivered` pada laporan PO dan dashboard.
  - Delivery dapat difilter berdasarkan vendor dan rentang tanggal.
  - Form delivery hanya menampilkan item dari PO yang belum sepenuhnya terpenuhi (`remaining > 0`).
  - Delivery mendukung update dengan replace-all items (delete existing + re-insert).

---

### FR-06: Dashboard & Laporan BOM

- **User Story:** _Sebagai Project Manager, saya ingin melihat laporan konsolidasi antara rencana kebutuhan (BOM), total pemesanan (PO), dan total penerimaan (Delivery) dalam satu tampilan agar saya dapat mengambil keputusan pengadaan dengan cepat._
- **Acceptance Criteria:**
  - Dashboard menampilkan **summary card**: `Total Budget (RAB)` dan `Total Nilai PO`.
  - Tabel laporan menampilkan per baris item: Nama Item, Grup, Kategori, Satuan, Harga Satuan, Volume Direncanakan (BOM), Anggaran (planned_budget), Total Dipesan (total_ordered), Total Diterima (total_delivered), Total Nilai PO (total_po_price).
  - Klik pada baris item membuka **Item Log Dialog** yang menampilkan kronologi semua PO dan Delivery untuk item tersebut.
  - Dashboard hanya tampil jika ada proyek aktif yang dipilih (guard: `ProjectRequired`).
  - Data refresh otomatis ketika proyek aktif berubah.

---

### FR-07: Navigasi & UX Global

- **User Story:** _Sebagai pengguna, saya ingin dapat berpindah antar modul dengan cepat dan selalu tahu proyek mana yang sedang aktif._
- **Acceptance Criteria:**
  - Sidebar navigasi selalu terlihat dengan item: Laporan, Kebutuhan (BOM), Pemesanan (PO), Penerimaan (DLV), Master Data (collapsible).
  - Heading sidebar menampilkan nama proyek aktif dan memiliki dropdown untuk mengganti proyek.
  - Toggle tema (dark/light) tersedia di footer sidebar.
  - Seluruh modul menampilkan pesan "Pilih proyek aktif" jika belum ada proyek yang dipilih.

---

## 6. Non-Functional Requirements (NFR)

### 6.1 Performa

| Aspek                                       | Target                             |
| ------------------------------------------- | ---------------------------------- |
| Startup aplikasi (cold launch)              | < 3 detik hingga UI siap interaksi |
| Load halaman dashboard (BOM Report)         | < 2 detik untuk <= 500 baris BOM   |
| Operasi CRUD tunggal (create/update/delete) | < 500ms response time              |
| Operasi bulk insert (seed data 100+ rows)   | < 5 detik                          |

### 6.2 Keamanan & Integritas Data

- **Referential Integrity**: Foreign key `ON DELETE RESTRICT` untuk relasi kritis (item ke BOM, vendor ke PO item) mencegah penghapusan data yang masih direferensikan.
- **Soft Delete**: Semua entitas utama menggunakan kolom `deleted_at` — data tidak pernah dihapus secara fisik.
- **Transaksi Atomik**: Operasi create/update yang melibatkan header + items (PO, Delivery) dibungkus dalam satu database transaction untuk konsistensi.
- **UUID v7 sebagai Primary Key**: Generated di application layer, bukan database auto-increment, untuk menghindari collision dan mendukung distribusi data di masa depan.
- **Penyimpanan Lokal**: Database SQLite disimpan di sistem file lokal pengguna — tidak ada data yang dikirim ke server eksternal.

### 6.3 Skalabilitas (dalam konteks desktop lokal)

- Mampu mengelola hingga **50 proyek aktif** tanpa degradasi performa nyata.
- Mendukung hingga **10.000 baris** pada tabel `bill_of_materials`, `po_items`, dan `delivery_items` dengan query tetap responsif (< 2 detik) berkat penggunaan `QueryBuilder` yang teroptimasi dan indeks SQLite default pada primary key.

### 6.4 Maintainability & Arsitektur

- **Repository Pattern**: Semua akses data dimediasi melalui repository classes (`BaseRepository`, repository spesifik per entitas) — tidak ada raw SQL query di komponen UI.
- **Service Layer**: Business logic lintas entitas (seperti `getBOMReport`) diisolasi di `services/` terpisah dari repository CRUD sederhana.
- **Migration-Based Schema**: Perubahan skema database dilakukan melalui file migrasi SQL bertahap (`migrations/001_init.sql`, dst.).
- **Type-Safe**: Seluruh model data, tipe input/output, dan query builder menggunakan TypeScript strict mode.

### 6.5 Aksesibilitas & Usability

- Komponen UI menggunakan **Astryx Design System** (`@astryxdesign/core`) yang mengikuti standar aksesibilitas bawaan.
- Mendukung navigasi keyboard untuk semua aksi kritis (open form, submit, cancel).
- Dark mode dan Light mode yang dapat diubah secara persisten.

---

## 7. Arsitektur Sistem & Alur Data

### 7.1 Tech Stack

| Layer                      | Teknologi                                    |
| -------------------------- | -------------------------------------------- |
| **Desktop Shell**          | Tauri v2 (Rust)                              |
| **Frontend Framework**     | React 19 + Vite 8                            |
| **Routing**                | TanStack Router v1 (file-based)              |
| **State Management**       | Zustand v5 (`useAppStore`, `useMasterStore`) |
| **Form & Validation**      | TanStack Form + Valibot                      |
| **UI Component Library**   | Astryx Design System v0.3.0                  |
| **Icons**                  | Lucide React                                 |
| **Database**               | SQLite (via `@tauri-apps/plugin-sql`)        |
| **Primary Key Generation** | UUIDv7 (application layer)                   |
| **Language**               | TypeScript ~7.0                              |

### 7.2 Struktur Database (Entity Relationship Summary)

```
projects
  +-- bom_groups         (grup pekerjaan per proyek)
  +-- bill_of_materials  (item + harga + qty yang direncanakan)
  +-- purchase_orders
        +-- po_items     (item + vendor + harga + qty dipesan)
              +-- delivery_items (qty diterima per po_item)

item_categories --> items --> item_prices
units           --> items
vendors         --> po_items
deliveries      --> delivery_items
```

### 7.3 User Flow Utama

```
[Buka Aplikasi]
      |
      v
[Pilih Proyek Aktif]  -->  [Master: Setup Item / Vendor / Kategori / Satuan]
      |
      v
[BOM: Input Kebutuhan Material per Grup]
      |
      v
[PO: Buat Purchase Order > Pilih Item + Vendor + Harga + Qty]
      |
      v
[Delivery: Catat Penerimaan > Pilih PO > Input Qty Diterima per Item]
      |
      v
[Dashboard: Lihat Laporan BOM vs PO vs Delivery]
      |
      v
[Item Log: Drill-down riwayat per item]
```

### 7.4 Layer Arsitektur Frontend

```
UI Components (React)
      |
      v
Routes (TanStack Router — file-based)
      |
      v
Zustand Store (state global: selectedProject, theme, dbReady)
      |
      v
Service Layer (getBOMReport, getItemLog — business logic lintas entitas)
      |
      v
Repository Layer (BaseRepository + spesifik: PO, Delivery, BOM, dst.)
      |
      v
QueryBuilder (abstraksi SQL builder, type-safe)
      |
      v
SQLite Database (via Tauri plugin-sql)
```

---

## 8. Rollout Plan & Timeline

```
[Sprint 1: Spec & DB Schema]
--> [Sprint 2: Master Data CRUD + BOM]
--> [Sprint 3: PO Module + Delivery Module]
--> [Sprint 4: Dashboard & Laporan]
--> [Sprint 5: Polish, Bug Fix & Testing]
--> [v1.0.0 Internal Release]
```

| Fase         | Deliverable                                                                 | Status          |
| ------------ | --------------------------------------------------------------------------- | --------------- |
| **Sprint 1** | DB schema (`001_init.sql`), model types, base repository                    | Selesai         |
| **Sprint 2** | Master Data (Proyek, Item, Vendor, Kategori, Satuan, Harga) + BOM CRUD      | Selesai         |
| **Sprint 3** | PO Module (PO header + items, tracking delivery per item) + Delivery Module | Selesai         |
| **Sprint 4** | Dashboard BOM Report, Summary Cards, Item Log Dialog                        | Selesai         |
| **Sprint 5** | UI polish, edge case handling, error boundaries, performance tuning         | In Progress     |
| **v1.0.0**   | Rilis internal ke pengguna pertama                                          | Target: Q3 2026 |

---

## 9. Risks, Dependencies, & Open Questions

### 9.1 Risiko & Mitigasi

| Risiko / Kendala                                            | Dampak | Kemungkinan | Mitigasi                                                                                     |
| ----------------------------------------------------------- | ------ | ----------- | -------------------------------------------------------------------------------------------- |
| Database korup akibat force-quit saat transaksi berlangsung | Tinggi | Rendah      | Gunakan WAL mode SQLite; implementasi backup manual                                          |
| Performa lambat pada dataset besar (> 5.000 baris BOM)      | Sedang | Sedang      | Tambahkan indeks komposit pada kolom filter yang sering dipakai (`project_id`, `deleted_at`) |
| Kesalahan entri data qty oleh user (misal: 0 atau negatif)  | Sedang | Tinggi      | Validasi form sisi frontend dengan Valibot + constraint DB (qty > 0)                         |
| Kompatibilitas Tauri v2 di berbagai versi Windows           | Sedang | Rendah      | Testing di Windows 10 dan Windows 11; distribusi via installer                               |
| Kehilangan data jika file SQLite terhapus atau drive rusak  | Tinggi | Rendah      | Dokumentasikan lokasi file DB; roadmap backup otomatis di Phase 2                            |

### 9.2 Dependensi

| Dependensi                  | Jenis      | Keterangan                                                                                                        |
| --------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------- |
| `@astryxdesign/core` v0.3.0 | UI Library | Semua komponen UI bergantung pada library ini; breaking change saat upgrade perlu diuji menyeluruh                |
| `@tauri-apps/plugin-sql` v2 | Database   | Abstraksi SQLite untuk Tauri; harus dikonfigurasi dengan benar di Cargo.toml dan capabilities                     |
| `@tanstack/react-router` v1 | Routing    | File-based routing dengan code generation (`routeTree.gen.ts`); perlu dijalankan kembali saat menambah route baru |
| Rust toolchain              | Build      | Required untuk compile Tauri backend; versi harus sesuai dengan `Cargo.lock`                                      |

### 9.3 Open Questions

| #    | Pertanyaan                                                                                                                                                                                | Owner     | Priority |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | -------- |
| OQ-1 | Apakah diperlukan fitur **export laporan ke Excel/PDF** untuk v1.0.0, atau cukup untuk v1.1.0?                                                                                            | PM        | High     |
| OQ-2 | Bagaimana penanganan jika satu item memiliki **beberapa harga berbeda** dalam satu proyek (multi `item_price_id` per item)? Apakah laporan perlu menggabungkan atau memisahkan per harga? | Tech Lead | Medium   |
| OQ-3 | Apakah diperlukan fitur **print / cetak PO** langsung dari aplikasi sebagai dokumen pengadaan resmi?                                                                                      | PM        | Medium   |
| OQ-4 | Di mana file SQLite disimpan secara default di sistem pengguna? Apakah perlu ditampilkan lokasinya di dalam aplikasi (settings page)?                                                     | Tech Lead | Low      |
| OQ-5 | Apakah perlu fitur **pencarian global** (misal: cari item atau vendor dari mana saja)?                                                                                                    | PM        | Low      |

---

## 10. Appendix

### 10.1 Glosarium

| Istilah             | Definisi                                                                                                    |
| ------------------- | ----------------------------------------------------------------------------------------------------------- |
| **BOM**             | _Bill of Materials_ — Daftar kebutuhan material yang direncanakan untuk suatu proyek (setara RAB material). |
| **PO**              | _Purchase Order_ — Dokumen pemesanan material kepada vendor.                                                |
| **Delivery / DLV**  | Pencatatan penerimaan barang berdasarkan PO yang sudah dibuat.                                              |
| **BOM Group**       | Grup pekerjaan dalam proyek (misal: Pekerjaan Pondasi, Pekerjaan Atap) sebagai pengelompokan item BOM.      |
| **Soft Delete**     | Penghapusan logis dengan mengisi kolom `deleted_at`; data tetap ada di database untuk keperluan audit.      |
| **Planned Budget**  | Total anggaran yang direncanakan = SUM(bom.qty x item_price.price).                                         |
| **Total PO Price**  | Total nilai pemesanan realisasi = SUM(po_item.qty x item_price.price).                                      |
| **Total Delivered** | Total kuantitas material yang sudah diterima = SUM(delivery_item.qty).                                      |
| **Remaining**       | Sisa kuantitas yang belum diterima per PO item = po_item.qty - SUM(delivery_item.qty).                      |

### 10.2 Referensi File Kunci

| File                                               | Deskripsi                                                               |
| -------------------------------------------------- | ----------------------------------------------------------------------- |
| `src-tauri/migrations/001_init.sql`                | Skema database lengkap (semua tabel dan relasi)                         |
| `src/configs/app.config.ts`                        | Konfigurasi navigasi sidebar aplikasi                                   |
| `src/db/services/report.service.ts`                | Business logic laporan BOM & Item Log                                   |
| `src/db/repositories/purchase-order.repository.ts` | Repository PO dengan operasi complex (createWithItems, updateWithItems) |
| `src/db/repositories/delivery.repository.ts`       | Repository Delivery dengan tracking per item                            |
| `src/routes/index.tsx`                             | Halaman Dashboard / Laporan utama                                       |
| `src/routes/__root.tsx`                            | Root layout: AppShell, SideNav, inisialisasi DB                         |

---

_Dokumen ini dibuat pada 2026-08-18 dan akan diperbarui seiring perkembangan proyek._
