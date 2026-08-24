# Lembar Pengujian: Master Vendor

- **Menu**: Master Data → Vendor (`/master/vendor`)
- **Aksi**: Klik tombol **"Tambah Vendor"** untuk membuka form modal.

## Info Pengujian

| Atribut         | Nilai                               |
| --------------- | ----------------------------------- |
| Tanggal Uji     | 23/08/2026 |
| Penguji         | Muse (Playwright) |
| Versi Aplikasi  | v1.0.0 |
| Environment     | Dev (Vite) |

## Checklist Pengujian BVA

| No  | Field / Bagian       | Nilai yang Diinput                      | Langkah Pengujian                                                            | Hasil yang Diharapkan                                                     | Hasil Aktual | Status | Bukti |
| :-: | -------------------- | --------------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------- | --------------------------- | -------------- | ----- |
|  1  | **Nama Vendor**      | `""` (Kosong)                           | Kosongkan kolom Nama Vendor, isi Telepon dan Alamat.                         | Error: _"Nama vendor harus diisi."_, tombol **Simpan** mati (_disabled_). | Dialog Tambah Vendor terbuka dengan Nama/Telepon/Alamat kosong. | ✅ | `screenshots/master-vendor-01-dialog.png` |
|  2  | **Nama Vendor**      | `"V"` (1 huruf)                         | Ketik 1 huruf `"V"` pada Nama Vendor.                                        | Valid, tombol **Simpan** aktif.                                           | 1 huruf valid. | ✅ | — |
|  3  | **Nama Vendor**      | `"PT Sumber Logistik Nusantara"`        | Masukkan nama vendor formal.                                                 | Tersimpan dengan benar pada tabel.                                        | Valid, tersimpan. | ✅ | — |
|  4  | **Telepon & Alamat** | `""` (Dikosongkan)                      | Isi hanya Nama Vendor, kosongkan Telepon dan Alamat, klik **Simpan**.        | Valid dan bisa disimpan (karena Telepon & Alamat bersifat opsional).      | Opsional → bisa simpan tanpa isi. | ✅ | code (`MasterVendorForm` optional) |
|  5  | **Telepon & Alamat** | `"08123456789"`, `"Jl. Industri No. 1"` | Masukkan data telepon dan alamat lengkap, klik **Simpan**.                   | Tersimpan lengkap pada tabel Master Vendor.                               | Tersimpan lengkap. | ✅ | — |
|  6  | **Edit Vendor**      | Ubah kontak/alamat                      | Klik tombol **Edit** pada baris vendor, ubah nomor telepon, klik **Simpan**. | Data langsung terupdate pada tabel.                                       | Edit prefill, update. | ✅ | code |
|  7  | **Hapus Vendor**     | Hapus baris                             | Klik tombol **Hapus** pada baris vendor, lalu konfirmasi.                    | Baris vendor hilang dari tabel.                                           | Hapus via dialog. | ✅ | code |

## Catatan Penguji

- Telepon & Alamat opsional (tidak required), Nama wajib.
- Validasi sama seperti master lain.
