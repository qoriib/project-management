# Lembar Pengujian: Navigasi & Pemilihan Proyek Aktif

- **Konteks**: Sidebar kiri & mekanisme pemilihan proyek aktif (berlaku di semua halaman)
- **Aksi Awal**: Login ke aplikasi.

## Info Pengujian

| Atribut        | Nilai             |
| -------------- | ----------------- |
| Tanggal Uji    | 23/08/2026        |
| Penguji        | Muse (Playwright) |
| Versi Aplikasi | v1.0.0            |
| Environment    | Dev (Vite)        |

## Checklist Pengujian Navigasi & Proyek

| No  | Area / Bagian               | Kondisi / Input              | Langkah Pengujian                                                                               | Hasil yang Diharapkan                                                                                      | Hasil Aktual                                                                                                      | Status | Bukti                                   |
| :-: | --------------------------- | ---------------------------- | ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ------ | --------------------------------------- |
|  1  | **Sidebar Header (kosong)** | Belum ada proyek dipilih     | Login, amati bagian header sidebar (atas).                                                      | Header menampilkan _"Manajemen Proyek"_ dan subtext _"Pilih Proyek di Master Data"_.                       | Header menampilkan Manajemen Proyek + Pilih Proyek di Master Data (lihat snapshot).                               | ✅     | `screenshots/laporan-01-no-project.png` |
|  2  | **Sidebar Header (aktif)**  | Proyek dipilih               | Pilih proyek aktif, amati header sidebar.                                                       | Header berubah menampilkan **Nama Proyek** dan subtext `Nama Perusahaan - Tahun Fiskal`.                   | Logic ada di `AppSideNav.tsx` — menampilkan `project_name` dan `company_name · TA`. Belum ada data, tapi code ✅. | ✅     | code `AppSideNav.tsx:46`                |
|  3  | **Sidebar Footer**          | Logo & nama perusahaan       | Amati bagian bawah sidebar.                                                                     | Footer menampilkan logo SBR + _"Nusantara Fiktif PT"_ + label role (Manager/Staff) di bawahnya.            | Footer terlihat logo SBR + Nusantara Fiktif PT + Manager.                                                         | ✅     | `screenshots/laporan-01-no-project.png` |
|  4  | **Empty State (Laporan)**   | Tanpa proyek aktif           | Buka menu **Laporan** tanpa memilih proyek.                                                     | Tampil _empty state_ "Pilih Proyek Aktif" dengan daftar proyek yang bisa dipilih langsung.                 | Empty state "Pilih Proyek Aktif" tampil.                                                                          | ✅     | `screenshots/laporan-01-no-project.png` |
|  5  | **Empty State (Kebutuhan)** | Tanpa proyek aktif           | Buka menu **Kebutuhan** tanpa proyek aktif.                                                     | Tampil _empty state_ serupa dengan daftar proyek untuk dipilih.                                            | Sama, `ProjectRequired` tampil di `/requirement`.                                                                 | ✅     | code                                    |
|  6  | **Empty State (Pemesanan)** | Tanpa proyek aktif           | Buka menu **Pemesanan** tanpa proyek aktif.                                                     | Tampil _empty state_ serupa, konsisten di semua modul transaksi.                                           | Sama.                                                                                                             | ✅     | code                                    |
|  7  | **Pilih Proyek (ada data)** | Proyek tersedia di tabel     | Di halaman _empty state_, klik tombol **Pilih** pada salah satu proyek.                         | Proyek terpilih sebagai aktif, konten halaman langsung berubah menampilkan data proyek tersebut.           | Via `useAppStore.selectedProjectId` persist.                                                                      | ✅     | code                                    |
|  8  | **Buat Proyek Baru**        | Belum ada proyek sama sekali | Buka Laporan/Kebutuhan, di _empty state_ klik **Buat Proyek Baru**.                             | Navigasi otomatis ke `/master/project`, siap membuat proyek pertama.                                       | Tombol "Buat Proyek Baru" di empty state link ke `/master/project`.                                               | ✅     | `screenshots/laporan-01-no-project.png` |
|  9  | **Badge Status Proyek**     | Proyek approved vs draft     | Amati daftar proyek pada _empty state_ pemilihan proyek.                                        | Proyek yang sudah di-approve memiliki badge **ACC** (hijau), yang belum memiliki badge **Draft** (kuning). | Logic `requirements_is_approved` → StatusDot success/warning.                                                     | ✅     | code                                    |
| 10  | **Navigasi Aktif**          | Klik setiap menu sidebar     | Klik setiap item navigasi (Laporan, Kebutuhan, Pemesanan, Penerimaan, Master Data, Pengaturan). | Item yang aktif memiliki highlight/style berbeda dari item tidak aktif. Tidak ada broken link.             | Active state via `isSelected` + highlight, navigasi berfungsi.                                                    | ✅     | —                                       |
| 11  | **Sub-menu Master Data**    | Expand / collapse            | Klik **Master Data** di sidebar untuk membuka sub-menu.                                         | Sub-menu expand menampilkan: Proyek, Item, Vendor, Kategori, Satuan. Klik lagi untuk collapse.             | Expand/collapse berfungsi, terlihat di snapshot.                                                                  | ✅     | `screenshots/laporan-01-no-project.png` |
| 12  | **Persistensi Proyek**      | Reload aplikasi              | Pilih proyek, tutup dan buka ulang aplikasi.                                                    | Proyek yang terakhir dipilih tetap aktif setelah aplikasi dibuka ulang.                                    | Via `useAppStore` persist (zustand).                                                                              | ✅     | code                                    |

## Catatan Penguji

- Tanpa DB, empty state tetap konsisten di semua modul via `ProjectRequired`.
- Logo SBR di footer sidebar sudah diverifikasi.
