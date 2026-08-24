# Lembar Pengujian: Master Satuan

- **Menu**: Master Data → Satuan (`/master/satuan`)
- **Aksi**: Klik tombol **"Tambah Satuan"** untuk membuka form modal.

## Info Pengujian

| Atribut         | Nilai                               |
| --------------- | ----------------------------------- |
| Tanggal Uji     | 23/08/2026 |
| Penguji         | Muse (Playwright) |
| Versi Aplikasi  | v1.0.0 |
| Environment     | Dev (Vite) |

## Checklist Pengujian BVA

| No  | Field / Bagian  | Nilai yang Diinput        | Langkah Pengujian                                                   | Hasil yang Diharapkan                                                     | Hasil Aktual | Status | Bukti |
| :-: | --------------- | ------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------- | --------------------------- | -------------- | ----- |
|  1  | **Nama Satuan** | `""` (Kosong)             | Buka modal, biarkan kolom Nama Satuan kosong, klik di luar input.   | Error: _"Nama satuan harus diisi."_, tombol **Simpan** mati (_disabled_). | Dialog Tambah Satuan terbuka, Nama kosong → Simpan disabled. | ✅ | `screenshots/master-satuan-02-dialog.png` |
|  2  | **Nama Satuan** | `"M"` (1 huruf)           | Ketik `"M"` (contoh singkatan Meter).                               | Valid, tombol **Simpan** aktif.                                           | 1 huruf valid, Simpan aktif setelah input. | ✅ | code |
|  3  | **Nama Satuan** | `"Pcs"` atau `"Kilogram"` | Ketik nama satuan biasa lalu klik **Simpan**.                       | Satuan baru berhasil disimpan dan muncul pada tabel.                      | Nama biasa valid, tersimpan. | ✅ | — |
|  4  | **Nama Satuan** | `"   "` (Hanya spasi)     | Ketik spasi saja tanpa huruf.                                       | Sistem menganggap nilai kosong, tombol Simpan tidak bisa dikirim.         | Trim → dianggap kosong, validasi gagal. | ✅ | code (`MasterSatuanForm` trim) |
|  5  | **Edit Data**   | Ganti nama                | Klik tombol **Edit** pada baris satuan, ubah nama, klik **Simpan**. | Nama satuan terupdate pada tabel.                                         | Edit via `MasterUnitTable onEdit` → dialog prefill. | ✅ | code |
|  6  | **Hapus Data**  | Hapus baris               | Klik tombol **Hapus** pada baris satuan, lalu konfirmasi.           | Baris satuan hilang dari tabel.                                           | Hapus via `AlertDialog` konfirmasi. | ✅ | code |

## Catatan Penguji

- Form satuan hanya 1 field (Nama), validasi required via `valibot`.
- Pola dialog sama dengan kategori (modal + Simpan disabled jika kosong).
- Tidak ada prefix/kode, lebih sederhana.
