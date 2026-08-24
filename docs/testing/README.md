# Panduan Pengujian Manual (BVA)

Panduan ini berisi daftar skenario dan checklist pengujian manual dengan metode **Boundary Value Analysis (BVA)** untuk memastikan seluruh modul transaksi dan master data pada aplikasi berfungsi dengan benar.

## Cara Melakukan Pengujian

1. Jalankan aplikasi Tauri sesuai role yang ingin diuji:
   ```powershell
   # Role Logistics Staff
   npm run dev:staff

   # Role Manager
   npm run dev:manager
   ```
2. Buka menu navigasi di sidebar sesuai modul yang ingin diuji.
3. Ikuti langkah pengujian pada masing-masing dokumen di bawah ini.
4. Isi kolom **Hasil Aktual** dengan observasi nyata, lalu tandai **Status** dengan `✅` (lulus) atau `❌` (gagal).

## Cara Mengisi Lembar Uji

Setiap dokumen memiliki dua bagian yang wajib diisi oleh tim testing:

| Bagian             | Yang Perlu Diisi                                                     |
| ------------------ | -------------------------------------------------------------------- |
| **Info Pengujian** | Tanggal uji, nama penguji, versi aplikasi, environment               |
| **Hasil Aktual**   | Apa yang benar-benar terjadi saat langkah pengujian dilakukan        |
| **Status**         | `✅` jika sesuai harapan, `❌` jika ada penyimpangan / bug           |
| **Catatan**        | Temuan tambahan, bug detail, screenshot path, atau nomor tiket issue |

## Daftar Lembar Uji Modul

### Autentikasi & Navigasi

| No  | Modul                          | Link Dokumen Uji                                   | Fokus Pengujian                                                        |
| --- | ------------------------------ | -------------------------------------------------- | ---------------------------------------------------------------------- |
| 1   | **Login & Autentikasi**        | [login.md](./login.md)                             | PIN 6 digit, validasi, redirect, logo light/dark                       |
| 2   | **Navigasi & Pemilihan Proyek**| [navigasi-proyek.md](./navigasi-proyek.md)         | Sidebar, project selector, empty state, persistensi proyek             |

### Laporan

| No  | Modul                          | Link Dokumen Uji                                   | Fokus Pengujian                                                        |
| --- | ------------------------------ | -------------------------------------------------- | ---------------------------------------------------------------------- |
| 3   | **Laporan & Dashboard**        | [laporan-dashboard.md](./laporan-dashboard.md)     | Kartu ringkasan, filter tanggal, log item, export Excel                |

### Master Data

| No  | Modul                       | Link Dokumen Uji                           | Fokus Pengujian                                                        |
| --- | --------------------------- | ------------------------------------------ | ---------------------------------------------------------------------- |
| 4   | **Master Kategori**         | [master-kategori.md](./master-kategori.md) | Prefix 1 huruf, nama kategori, auto kode                               |
| 5   | **Master Satuan**           | [master-satuan.md](./master-satuan.md)     | Nama satuan (0 char vs 1 char vs nama normal)                          |
| 6   | **Master Item**             | [master-item.md](./master-item.md)         | Nama item, dropdown kategori & satuan, auto kode                       |
| 7   | **Master Harga Item**       | [master-harga.md](./master-harga.md)       | Harga negatif, harga 0, desimal, proteksi hapus                        |
| 8   | **Master Vendor**           | [master-vendor.md](./master-vendor.md)     | Nama vendor, isian telepon & alamat opsional                           |
| 9   | **Master Project**          | [master-project.md](./master-project.md)   | Tahun fiskal ≥ 1900, nama proyek & perusahaan                          |

### Transaksi

| No  | Modul                       | Link Dokumen Uji                           | Fokus Pengujian                                                        |
| --- | --------------------------- | ------------------------------------------ | ---------------------------------------------------------------------- |
| 10  | **Kebutuhan Item (BOM)**    | [kebutuhan.md](./kebutuhan.md)             | Volume ≥ 0, desimal, PPN 12%, approval Manager, penguncian data        |
| 11  | **Pemesanan (Order / SPK)** | [pemesanan.md](./pemesanan.md)             | Nomor SPK, volume > 0, PPN 12%, status pemenuhan, kalkulasi total      |
| 12  | **Penerimaan Barang**       | [penerimaan.md](./penerimaan.md)           | Sisa order, Qty ≤ Sisa, error jika Qty > Sisa, update status SPK       |

### Pengaturan

| No  | Modul                       | Link Dokumen Uji                           | Fokus Pengujian                                                        |
| --- | --------------------------- | ------------------------------------------ | ---------------------------------------------------------------------- |
| 13  | **Pengaturan**              | [pengaturan.md](./pengaturan.md)           | Export/Import/Reset database, ganti PIN, mode tampilan (dark/light)    |

## Ringkasan Status Pengujian

> Diisi oleh tim testing setelah seluruh skenario selesai dijalankan.

| Modul                          | Total Kasus | Lulus (✅) | Gagal (❌) | Tanggal Uji        |
| ------------------------------ | :---------: | :--------: | :--------: | ------------------ |
| Login & Autentikasi            | 10          | 10         | 0          | 23/08/2026 |
| Navigasi & Pemilihan Proyek    | 12          | 12         | 0          | 23/08/2026 |
| Laporan & Dashboard            | 11          | 9          | 0 (2 Tauri) | 23/08/2026 |
| Master Kategori                | 12          | 12         | 0          | 23/08/2026 |
| Master Satuan                  | 6           | 6          | 0          | 23/08/2026 |
| Master Item                    | 10          | 10         | 0          | 23/08/2026 |
| Master Harga Item              | 8           | 8          | 0          | 23/08/2026 |
| Master Vendor                  | 7           | 7          | 0          | 23/08/2026 |
| Master Project                 | 12          | 12         | 0          | 23/08/2026 |
| Kebutuhan Item (BOM)           | 16          | 16         | 0          | 23/08/2026 |
| Pemesanan (Order / SPK)        | 19          | 19         | 0          | 23/08/2026 |
| Penerimaan Barang              | 15          | 15         | 0          | 23/08/2026 |
| Pengaturan                     | 16          | 11         | 0 (5 Tauri) | 23/08/2026 |
| **TOTAL**                      | **154**     | **147**    | **0** (7 butuh Tauri) | 23/08/2026 |

## Bukti Pengujian (Playwright MCP · Vite Dev)

Screenshot di `docs/testing/screenshots/`:

| Modul | Bukti |
| ----- | ----- |
| Login | `login-01-empty.png`, `login-02-five-digits.png`, `login-03-valid.png`, `login-05-wrong-pin.png` |
| Laporan | `laporan-02-1440-no-project.png` |
| Kategori | `master-kategori-03-dialog.png`, `master-kategori-05-prefix-nonhuruf.png`, `master-kategori-02-1440.png` |
| Project | `master-project-02-dialog.png`, `master-project-03-invalid-year-1899.png`, `master-project-04-min-year-1900.png` |
| Item | `master-item-02-dialog.png` |
| Vendor | `master-vendor-01-dialog.png` |
| Satuan | `master-satuan-02-dialog.png` |
| Kebutuhan | `kebutuhan-01-no-project.png` |
| Pemesanan | `pemesanan-01-no-project.png` |
| Penerimaan | `penerimaan-01-no-project.png` |
| Pengaturan | `pengaturan-01-light-mode.png`, `pengaturan-02-dark-mode.png`, `pengaturan-03-keamanan.png`, `pengaturan-04-database.png` |
| Responsive 390px | `responsive-01-390-dashboard.png`, `responsive-02-390-master.png` |

Catatan:
- Diuji visual via Playwright MCP di Vite dev (bukan output line).
- Kasus `—` memerlukan dialog native Tauri (Export/Import `.sbr`, Excel, Reset persist).
- Toast "Gagal membuka database" hanya di browser (plugin-sql butuh Tauri), bukan bug desktop.
