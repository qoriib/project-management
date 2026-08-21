# Lembar Pengujian: Master Satuan

- **Menu**: Master Data $\rightarrow$ Satuan (`/master/satuan`)
- **Aksi**: Klik tombol **"Tambah Satuan"** untuk membuka form modal.

## Checklist Pengujian BVA

| No  | Field / Bagian  | Nilai yang Diinput        | Langkah Pengujian                                                   | Hasil yang Diharapkan                                                     |
| :-: | --------------- | ------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------- |
|  1  | **Nama Satuan** | `""` (Kosong)             | Buka modal, biarkan kolom Nama Satuan kosong, klik di luar input.   | Error: _"Nama satuan harus diisi."_, tombol **Simpan** mati (_disabled_). |
|  2  | **Nama Satuan** | `"M"` (1 huruf)           | Ketik `"M"` (contoh singkatan Meter).                               | Valid, tombol **Simpan** aktif.                                           |
|  3  | **Nama Satuan** | `"Pcs"` atau `"Kilogram"` | Ketik nama satuan biasa lalu klik **Simpan**.                       | Satuan baru berhasil disimpan dan muncul pada tabel.                      |
|  4  | **Nama Satuan** | `"   "` (Hanya spasi)     | Ketik spasi saja tanpa huruf.                                       | Sistem menganggap nilai kosong, tombol Simpan tidak bisa dikirim.         |
|  5  | **Edit Data**   | Ganti nama                | Klik tombol **Edit** pada baris satuan, ubah nama, klik **Simpan**. | Nama satuan terupdate pada tabel.                                         |
|  6  | **Hapus Data**  | Hapus baris               | Klik tombol **Hapus** pada baris satuan, lalu konfirmasi.           | Baris satuan hilang dari tabel.                                           |
