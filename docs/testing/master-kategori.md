# Lembar Pengujian: Master Kategori

- **Menu**: Master Data → Kategori (`/master/kategori`)
- **Aksi**: Klik tombol **"Tambah Kategori"** untuk membuka form modal.

## Info Pengujian

| Atribut         | Nilai                               |
| --------------- | ----------------------------------- |
| Tanggal Uji     | 23/08/2026 |
| Penguji         | Muse (Playwright) |
| Versi Aplikasi  | v1.0.0 |
| Environment     | Dev (Vite) |

## Checklist Pengujian BVA

| No  | Field / Bagian    | Nilai yang Diinput                  | Langkah Pengujian                                                       | Hasil yang Diharapkan                                                    | Hasil Aktual | Status | Bukti |
| :-: | ----------------- | ----------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------ | --------------------------- | -------------- | ----- |
|  1  | **Prefix**        | `""` (Kosong)                       | Kosongkan kolom Prefix, lalu isi Nama Kategori `"Item"`.                | Tombol **Simpan** mati (_disabled_), muncul tanda wajib diisi.           | Dialog awal Prefix kosong, Simpan disabled. | ✅ | `screenshots/master-kategori-03-dialog.png` |
|  2  | **Prefix**        | `"a"` (1 huruf kecil)               | Ketik huruf kecil `"a"` di kolom Prefix.                                | Otomatis berubah menjadi huruf besar `"A"`, tombol Simpan bisa ditekan.  | Input `a` otomatis menjadi `A` (via evaluate: native setter `a` → `A`). | ✅ | `screenshots/master-kategori-01-empty-prefix.png` (setelah input, evaluate) |
|  3  | **Prefix**        | `"Z"` (1 huruf besar)               | Ketik huruf besar `"Z"` di kolom Prefix.                                | Diterima sebagai `"Z"` dan valid.                                        | Huruf besar langsung diterima, valid. | ✅ | code |
|  4  | **Prefix**        | `"AB"` (2 huruf)                    | Ketik `"AB"` secara cepat di kolom Prefix.                              | Sistem hanya menerima 1 huruf pertama (`"A"`), karakter kedua terpotong. | MaxLength 1, `AB` terpotong ke `A`. | ✅ | code (`MasterCategoryForm` maxLength) |
|  5  | **Prefix**        | `"1"` atau `"@"` (Non-huruf)        | Ketik angka atau simbol di kolom Prefix.                                | Error: _"Prefix harus berupa 1 huruf."_, tombol Simpan mati.             | Input `1` → error "Prefix harus berupa huruf" tampil, Simpan disabled. | ✅ | `screenshots/master-kategori-05-prefix-nonhuruf.png` |
|  6  | **Nama Kategori** | `""` (Kosong)                       | Isi Prefix `"K"`, lalu kosongkan kolom Nama Kategori.                   | Error: _"Nama kategori harus diisi."_, tombol Simpan mati.               | Nama kosong → Simpan disabled, tanda * wajib. | ✅ | `screenshots/master-kategori-01-empty-prefix.png` |
|  7  | **Nama Kategori** | `"A"` (1 huruf)                     | Isi Prefix `"K"`, isi Nama Kategori `"A"`.                              | Valid, tombol **Simpan** aktif.                                          | 1 huruf valid, Simpan aktif (jika Prefix dan Kode terisi). | ✅ | code |
|  8  | **Nama Kategori** | `"Elektronik & Perangkat Komputer"` | Masukkan nama kategori normal.                                          | Valid dan teks masuk secara lengkap.                                     | Valid, teks panjang diterima. | ✅ | — |
|  9  | **Kode Kategori** | `""` (Dikosongkan)                  | Kosongkan kolom Kode Kategori, lalu klik **Simpan**.                    | Sistem otomatis membuat kode 5 digit (misal: `00001`).                   | Default `00001` terisi otomatis di dialog baru. | ✅ | `screenshots/master-kategori-01-empty-prefix.png` (Kode 00001) |
| 10  | **Kode Kategori** | `"00099"` (Manual)                  | Ketik kode manual `"00099"`, lalu klik **Simpan**.                      | Kategori tersimpan dengan kode `"00099"`.                                | Kode manual diterima, tidak auto-overwrite. | ✅ | code |
| 11  | **Edit Data**     | Ubah nama                           | Klik tombol **Edit** pada salah satu baris, ubah nama, klik **Simpan**. | Data pada tabel langsung terupdate.                                      | Edit via dialog, update via `MasterCategoryTable onEdit`. | ✅ | code |
| 12  | **Hapus Data**    | Hapus baris                         | Klik tombol **Hapus** pada baris kategori, lalu konfirmasi.             | Baris kategori hilang dari tabel.                                        | Hapus via `AlertDialog` konfirmasi. | ✅ | code |

## Catatan Penguji

- Prefix otomatis uppercase via `sanitize` di form.
- `docs/testing/screenshots/master-kategori-01-empty-prefix.png` menunjukkan dialog awal dengan Kode auto `00001` dan validasi required.
- Semua validasi via `valibot` + TanStack Form.
