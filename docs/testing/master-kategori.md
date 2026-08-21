# Lembar Pengujian: Master Kategori

- **Menu**: Master Data $\rightarrow$ Kategori (`/master/kategori`)
- **Aksi**: Klik tombol **"Tambah Kategori"** untuk membuka form modal.

## Checklist Pengujian BVA

| No | Field / Bagian | Nilai yang Diinput | Langkah Pengujian | Hasil yang Diharapkan |
|:---:|---|---|---|---|
| 1 | **Prefix** | `""` (Kosong) | Kosongkan kolom Prefix, lalu isi Nama Kategori `"Material"`. | Tombol **Simpan** mati (*disabled*), muncul tanda wajib diisi. |
| 2 | **Prefix** | `"a"` (1 huruf kecil) | Ketik huruf kecil `"a"` di kolom Prefix. | Otomatis berubah menjadi huruf besar `"A"`, tombol Simpan bisa ditekan. |
| 3 | **Prefix** | `"Z"` (1 huruf besar) | Ketik huruf besar `"Z"` di kolom Prefix. | Diterima sebagai `"Z"` dan valid. |
| 4 | **Prefix** | `"AB"` (2 huruf) | Ketik `"AB"` secara cepat di kolom Prefix. | Sistem hanya menerima 1 huruf pertama (`"A"`), karakter kedua terpotong. |
| 5 | **Prefix** | `"1"` atau `"@"` (Non-huruf) | Ketik angka atau simbol di kolom Prefix. | Error: *"Prefix harus berupa 1 huruf."*, tombol Simpan mati. |
| 6 | **Nama Kategori** | `""` (Kosong) | Isi Prefix `"K"`, lalu kosongkan kolom Nama Kategori. | Error: *"Nama kategori harus diisi."*, tombol Simpan mati. |
| 7 | **Nama Kategori** | `"A"` (1 huruf) | Isi Prefix `"K"`, isi Nama Kategori `"A"`. | Valid, tombol **Simpan** aktif. |
| 8 | **Nama Kategori** | `"Elektronik & Perangkat Komputer"` | Masukkan nama kategori normal. | Valid dan teks masuk secara lengkap. |
| 9 | **Kode Kategori** | `""` (Dikosongkan) | Kosongkan kolom Kode Kategori, lalu klik **Simpan**. | Sistem otomatis membuat kode 5 digit (misal: `00001`). |
| 10 | **Kode Kategori** | `"00099"` (Manual) | Ketik kode manual `"00099"`, lalu klik **Simpan**. | Kategori tersimpan dengan kode `"00099"`. |
| 11 | **Edit Data** | Ubah nama | Klik tombol **Edit** pada salah satu baris, ubah nama, klik **Simpan**. | Data pada tabel langsung terupdate. |
| 12 | **Hapus Data** | Hapus baris | Klik tombol **Hapus** pada baris kategori, lalu konfirmasi. | Baris kategori hilang dari tabel. |
