# Lembar Pengujian: Master Vendor

- **Menu**: Master Data $\rightarrow$ Vendor (`/master/vendor`)
- **Aksi**: Klik tombol **"Tambah Vendor"** untuk membuka form modal.

## Checklist Pengujian BVA

| No  | Field / Bagian       | Nilai yang Diinput                      | Langkah Pengujian                                                            | Hasil yang Diharapkan                                                     |
| :-: | -------------------- | --------------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
|  1  | **Nama Vendor**      | `""` (Kosong)                           | Kosongkan kolom Nama Vendor, isi Telepon dan Alamat.                         | Error: _"Nama vendor harus diisi."_, tombol **Simpan** mati (_disabled_). |
|  2  | **Nama Vendor**      | `"V"` (1 huruf)                         | Ketik 1 huruf `"V"` pada Nama Vendor.                                        | Valid, tombol **Simpan** aktif.                                           |
|  3  | **Nama Vendor**      | `"PT Sumber Logistik Nusantara"`        | Masukkan nama vendor formal.                                                 | Tersimpan dengan benar pada tabel.                                        |
|  4  | **Telepon & Alamat** | `""` (Dikosongkan)                      | Isi hanya Nama Vendor, kosongkan Telepon dan Alamat, klik **Simpan**.        | Valid dan bisa disimpan (karena Telepon & Alamat bersifat opsional).      |
|  5  | **Telepon & Alamat** | `"08123456789"`, `"Jl. Industri No. 1"` | Masukkan data telepon dan alamat lengkap, klik **Simpan**.                   | Tersimpan lengkap pada tabel Master Vendor.                               |
|  6  | **Edit Vendor**      | Ubah kontak/alamat                      | Klik tombol **Edit** pada baris vendor, ubah nomor telepon, klik **Simpan**. | Data langsung terupdate pada tabel.                                       |
|  7  | **Hapus Vendor**     | Hapus baris                             | Klik tombol **Hapus** pada baris vendor, lalu konfirmasi.                    | Baris vendor hilang dari tabel.                                           |
