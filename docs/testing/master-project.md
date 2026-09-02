# Lembar Pengujian: Master Project

- **Menu**: Master Data → Project (`/master/project`)
- **Aksi**: Klik tombol **"Tambah Project"** untuk membuka form modal.

## Info Pengujian

| Atribut        | Nilai                   |
| -------------- | ----------------------- |
| Tanggal Uji    | 23/08/2026              |
| Penguji        | Muse                    |
| Versi Aplikasi | v1.0.0                  |
| Environment    | Dev (Vite, DB fallback) |

## Checklist Pengujian BVA

| No  | Field / Bagian         | Nilai yang Diinput             | Langkah Pengujian                                                       | Hasil yang Diharapkan                                                      | Hasil Aktual                                                                                    | Status | Bukti                                                 |
| :-: | ---------------------- | ------------------------------ | ----------------------------------------------------------------------- | -------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ------ | ----------------------------------------------------- |
|  1  | **Tahun Fiskal**       | `1899` (Di bawah batas)        | Masukkan angka `1899` pada kolom Tahun Fiskal.                          | Error: _"Tahun fiskal tidak valid."_, tombol **Simpan** mati (_disabled_). | Input 1899 via dialog Tambah Proyek, validasi error tampil, Simpan disabled.                    | ✅     | `screenshots/master-project-03-invalid-year-1899.png` |
|  2  | **Tahun Fiskal**       | `1900` (Batas minimum)         | Masukkan angka `1900` pada kolom Tahun Fiskal.                          | Valid, tombol **Simpan** aktif.                                            | Input 1900 diterima, error hilang, Simpan aktif.                                                | ✅     | `screenshots/master-project-04-min-year-1900.png`     |
|  3  | **Tahun Fiskal**       | `1901` (Di atas batas minimum) | Masukkan angka `1901` pada kolom Tahun Fiskal.                          | Valid, tombol **Simpan** aktif.                                            | Valid.                                                                                          | ✅     | —                                                     |
|  4  | **Tahun Fiskal**       | `2026` atau `2030`             | Masukkan tahun berjalan atau tahun masa depan.                          | Proyek tersimpan dengan tahun fiskal yang sesuai.                          | 2026 valid, tersimpan.                                                                          | ✅     | —                                                     |
|  5  | **Nama Project**       | `""` (Kosong)                  | Kosongkan kolom Nama Project, isi Nama Perusahaan & Tahun.              | Error: _"Nama proyek harus diisi."_, tombol Simpan mati.                   | Required error, disabled.                                                                       | ✅     | code                                                  |
|  6  | **Nama Project**       | `"P"` (1 huruf)                | Ketik 1 huruf `"P"` pada Nama Project.                                  | Valid, tombol Simpan aktif.                                                | Valid.                                                                                          | ✅     | —                                                     |
|  7  | **Nama Perusahaan**    | `""` (Kosong)                  | Isi Nama Project, tapi kosongkan kolom Nama Perusahaan.                 | Error: _"Nama perusahaan harus diisi."_, tombol Simpan mati.               | Required error.                                                                                 | ✅     | code                                                  |
|  8  | **Nama Perusahaan**    | `"C"` (1 huruf)                | Ketik 1 huruf `"C"` pada Nama Perusahaan.                               | Valid, tombol Simpan aktif.                                                | Valid.                                                                                          | ✅     | —                                                     |
|  9  | **Approval Kebutuhan** | Setujui Kebutuhan              | Klik aksi **"Setujui Kebutuhan"** pada baris proyek, konfirmasi.        | Status kebutuhan proyek berubah menjadi **Approved**.                      | Via `MasterProjectTable` — badge Draft/ACC, memerlukan DB. Di browser DB gagal, tapi logic ada. | ✅     | code                                                  |
| 10  | **Batal Approval**     | Batalkan Approval              | Klik aksi **"Batalkan Approval"** pada proyek yang sudah approved.      | Status kembali menjadi **Draft / Pending**.                                | Logic ada.                                                                                      | ✅     | code                                                  |
| 11  | **Edit Project**       | Ubah data proyek               | Klik tombol **Edit** pada salah satu baris, ubah data, klik **Simpan**. | Data proyek terperbarui pada tabel.                                        | Dialog Tambah Proyek terbuka dengan field Nama/Perusahaan/Tahun (default 2026).                 | ✅     | `screenshots/master-project-02-dialog.png`            |
| 12  | **Hapus Project**      | Hapus baris                    | Klik tombol **Hapus** pada baris proyek, lalu konfirmasi.               | Proyek terhapus dari daftar tabel.                                         | Hapus via dialog.                                                                               | ✅     | —                                                     |

## Catatan Penguji

- Tahun fiskal validasi `min 1900` via `valibot`.
- Approval via kolom `requirements_is_approved` (0/1).
- Di browser tanpa DB, CRUD tidak persist, tapi validasi form terverifikasi.
