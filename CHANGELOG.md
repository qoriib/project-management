# Changelog

Semua perubahan penting pada proyek ini akan dicatat dalam berkas ini.

Format berkas ini berdasarkan [Keep a Changelog](https://keepachangelog.com/id/1.1.0/),
dan proyek ini mengadopsi [Semantic Versioning](https://semver.org/lang/id/).

## [1.1.0] - 2026-09-08

### Added

- **Modul Penerimaan Barang (Nota Penerimaan / NP)**:
  - Implementasi alur formulir penerimaan barang lengkap (`ReceiptForm` dan `ReceiptItemsTable`) dengan validasi skema Valibot (`receipt.schema.ts`).
  - Tabel daftar penerimaan material (`ReceiptTable`) beserta kolom visual interaktif (`useReceiptColumns`).
  - Dukungan aksi penghapusan nota penerimaan dengan sinkronisasi otomatis ke repositori dan pembaruan kuantitas terkirim.
  - Store terpusat `useReceiptStore` untuk pengelolaan state penerimaan material secara reaktif.
- **Ekspor Laporan Pemenuhan (Excel & PDF)**:
  - Layanan ekspor laporan ke berkas Excel (`.xlsx`) melalui `fulfillment-sheet.ts` dengan styling sel kustom, format angka/mata uang Rupiah, dan baris kalkulasi total otomatis.
  - Layanan cetak dan ekspor laporan ke dokumen PDF melalui `fulfillment-table.ts` (`jspdf` + `jspdf-autotable`) dengan tata letak dokumen formal, identitas proyek, dan ringkasan status pemenuhan.
  - Komponen tabel ringkasan pemenuhan interaktif (`ReportSummaryTable`) terintegrasi dengan aksi unduh Excel & PDF.
- **Master Harga Vendor & Dialog Pemilihan Item**:
  - Dialog penetapan riwayat harga beli item per vendor (`MasterItemPriceDialog`) untuk mencatat daftar harga dari berbagai vendor rekanan.
  - Dialog pemilihan item terintegrasi (`OrderItemDialog` dan `RequirementItemDialog`) dengan fitur pencarian instan dan seleksi harga vendor aktif.
  - Peningkatan central store `useMasterStore` untuk pengelolaan workflow vendor dan penetapan harga beli item.
- **Komponen Pelacakan & Visualisasi Pengadaan (PO)**:
  - Tabel pelacakan item pesanan (`OrderItemTrackingTable`) untuk monitoring kuantitas dipesan vs kuantitas diterima per item material.
  - Tabel riwayat penerimaan per pesanan (`OrderReceiptLogTable`).
  - Kartu ringkasan finansial pesanan (`OrderSummaryCard`) dengan kalkulasi subtotal, estimasi PPN (12%), dan total nilai PO secara otomatis.
  - Sel tabel kustom (`PriceSelectorCell` dan `SubtotalCell`) serta hook kolom tabel `useOrderItemFormColumns`.
  - Kartu visual dialog laporan: `OrderVariantCard`, `RequirementVariantCard`, dan `TransactionHistoryCard`.
- **Infrastruktur Database & Arsitektur Repository**:
  - Penambahan metode `rawExecute` pada `BaseRepository` untuk eksekusi query SQL langsung dengan logging terstruktur.
  - Layanan reset database (`DatabaseService.reset`) untuk pembersihan data terisolasi dan pengujian sistem.

### Changed

- **Refaktor & Peningkatan Modul Pengadaan (PO)**:
  - Pembaruan formulir `OrderForm` agar lebih modular, responsif, dan terintegrasi dengan skema validasi `order.schema.ts`.
  - Peningkatan komponen `OrderTable` dengan dukungan aksi penghapusan pesanan beserta konfirmasi dialog.
  - Penyempurnaan `order.repository.ts` untuk pemuatan data relasional, kalkulasi status pemenuhan, dan penanganan transaksi data yang aman.
  - Perampingan struktur rute pengadaan pada `src/routes/order/`.
- **Refaktor & Peningkatan Modul Penerimaan (NP)**:
  - Penyederhanaan alur form `useReceiptForm` dan optimasi utilitas pembantu pada `receipt.utils.ts`.
  - Peningkatan `receipt.repository.ts` untuk mendukung pembaruan item, batch delete relasi, dan pencegahan data yatim (_orphan records_).
  - Perampingan struktur rute penerimaan pada `src/routes/receipt/`.
- **Laporan Pemenuhan**:
  - Peningkatan hook `useReportSummaryColumns` untuk perhitungan progres pemenuhan, deviasi kuantitas, dan penyajian indikator status yang lebih presisi.
- **Standarisasi Format & Desain UI**:
  - Konfigurasi tema terpadu di `src/theme.tsx` dan `src/app.css` untuk konsistensi tipografi sistem dan font Inter.
  - Utilitas pemformatan angka dan mata uang Rupiah yang distandarisasi di `src/utils/formatters.ts` beserta dokumentasi panduan di `src/utils/README.md`.
  - Pembaruan komponen `PinInput` untuk alur keamanan autentikasi yang lebih bersih.
- **Pembaruan Versi Rilis Aplikasi**:
  - Peningkatan versi rilis sistem ke `1.1.0` secara menyeluruh pada `package.json`, `package-lock.json`, `src-tauri/Cargo.toml`, `src-tauri/Cargo.lock`, `src-tauri/tauri.conf.json`, dan `src/configs/app.config.ts`.

## [1.0.0] - 2026-09-07

### Added

- **Manajemen Master Data**:
  - Modul master Proyek, Kategori Item, Satuan Unit, Vendor, dan Item Material.
  - Dukungan multi-project tracking dengan isolasi data dan relasi foreign key.
- **Kebutuhan Material (BOQ - Bill of Quantities)**:
  - Input, kalkulasi volume, dan harga satuan kebutuhan proyek.
  - Alur persetujuan (_Approval_) kebutuhan khusus untuk peran Manager.
  - Proteksi integritas agar data kebutuhan yang telah disetujui terkunci dari perubahan tanpa pembatalan persetujuan.
- **Pengadaan Material (PO - Purchase Order)**:
  - Pembuatan PO ke vendor rekanan berdasarkan kebutuhan yang telah disetujui.
  - Validasi kuantitas agar tidak melebihi alokasi BOQ.
  - Kalkulasi subtotal, estimasi PPN (12%), dan total nilai pengadaan secara otomatis.
- **Penerimaan Material (NP - Nota Penerimaan)**:
  - Pencatatan surat jalan/nota penerimaan barang per pesanan (PO).
  - Validasi kumulatif penerimaan untuk mencegah over-delivery melampaui kuantitas PO.
  - Riwayat log penerimaan dan tanggal kedatangan material.
- **Laporan Pemenuhan & Monitoring**:
  - Dashboard interaktif untuk pelacakan perbandingan BOQ vs PO vs NP secara _real-time_.
  - Indikator selisih deviasi, persentase pemenuhan, dan modal log transaksi detail.
- **Sinkronisasi & Backup Database**:
  - Ekspor dan impor file arsip proyek berformat `.project` terkompresi ZIP melalui modul Rust native.
  - Penggabungan data master cerdas saat proses impor untuk mempertahankan konsistensi referensi data.
- **Sistem Keamanan & PIN**:
  - Proteksi autentikasi PIN untuk akses sesi aplikasi.
  - State keamanan in-memory pada sisi Rust native (sesi tetap terjaga saat refresh, dan terkunci saat menutup jendela aplikasi).
- **Antarmuka & Pengalaman Pengguna (UI/UX)**:
  - Desain modern berbasis Astryx UI Design System v0.3.0.
  - Dropdown navigasi header di SideNav untuk beralih proyek aktif dan pintasan ke menu ekspor/impor.
  - Dukungan tema Light & Dark mode yang tersinkronisasi dengan preferensi pengguna.
- **Dukungan Dual-Role (RBAC)**:
  - Peran `Manager`: Akses penuh ke persetujuan BOQ, manajemen proyek, pengaturan keamanan PIN, dan konfigurasi database.
  - Peran `Staff Logistik`: Akses operasional untuk pembuatan PO, pencatatan penerimaan NP, dan pemantauan laporan.
