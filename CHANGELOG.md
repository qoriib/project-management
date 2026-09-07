# Changelog

Semua perubahan penting pada proyek ini akan dicatat dalam berkas ini.

Format berkas ini berdasarkan [Keep a Changelog](https://keepachangelog.com/id/1.1.0/),
dan proyek ini mengadopsi [Semantic Versioning](https://semver.org/lang/id/).

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
