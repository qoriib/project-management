# Lembar Pengujian: Master Item

- **Menu**: Master Data $\rightarrow$ Item (`/master/item`)
- **Aksi**: Klik tombol **"Tambah Item"** untuk membuka form modal.

## Checklist Pengujian BVA

| No  | Field / Bagian     | Nilai yang Diinput                         | Langkah Pengujian                                                            | Hasil yang Diharapkan                                                   |
| :-: | ------------------ | ------------------------------------------ | ---------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
|  1  | **Nama Item**      | `""` (Kosong)                              | Kosongkan kolom Nama Item, pilih Kategori & Satuan.                          | Error: _"Nama item harus diisi."_, tombol **Simpan** mati (_disabled_). |
|  2  | **Nama Item**      | `"B"` (1 huruf)                            | Ketik 1 huruf `"B"` pada Nama Item.                                          | Valid, tombol **Simpan** aktif.                                         |
|  3  | **Nama Item**      | `"Baut Baja Hexagonal M12 x 50mm"`         | Masukkan nama item panjang / spesifikasi lengkap.                            | Valid dan tersimpan utuh tanpa terpotong.                               |
|  4  | **Kategori**       | Belum dipilih                              | Kosongkan pilihan dropdown kategori.                                         | Error: _"Pilih kategori terlebih dahulu."_, tombol Simpan mati.         |
|  5  | **Satuan**         | Belum dipilih                              | Kosongkan pilihan dropdown satuan.                                           | Error: _"Pilih satuan terlebih dahulu."_, tombol Simpan mati.           |
|  6  | **Kode Item**      | `""` (Dikosongkan)                         | Kosongkan kolom Kode Item, lalu klik **Simpan**.                             | Sistem otomatis membuat kode 5 digit (misal: `00001`).                  |
|  7  | **Kode Item**      | `"ITEM-01"` (Manual)                       | Ketik kode manual `"ITEM-01"`, lalu klik **Simpan**.                         | Item tersimpan dengan kode tetap `"ITEM-01"`.                           |
|  8  | **Edit Item**      | Ubah data                                  | Klik tombol **Edit** pada salah satu baris item, ubah data, klik **Simpan**. | Data item terperbarui pada tabel.                                       |
|  9  | **Proteksi Hapus** | Item yang punya riwayat transaksi / relasi | Cari item yang sudah pernah dipakai di kebutuhan / order.                    | Tombol **Hapus** mati (_disabled_) dan muncul tooltip pencegahan.       |
| 10  | **Hapus Item**     | Item baru tanpa relasi                     | Klik tombol **Hapus** pada item yang belum punya relasi, konfirmasi.         | Item berhasil terhapus dari daftar tabel.                               |
