# Lembar Pengujian: Master Project

- **Menu**: Master Data $\rightarrow$ Project (`/master/project`)
- **Aksi**: Klik tombol **"Tambah Project"** untuk membuka form modal.

## Checklist Pengujian BVA

| No | Field / Bagian | Nilai yang Diinput | Langkah Pengujian | Hasil yang Diharapkan |
|:---:|---|---|---|---|
| 1 | **Tahun Fiskal** | `1899` (Di bawah batas) | Masukkan angka `1899` pada kolom Tahun Fiskal. | Error: *"Tahun fiskal tidak valid."*, tombol **Simpan** mati (*disabled*). |
| 2 | **Tahun Fiskal** | `1900` (Batas minimum) | Masukkan angka `1900` pada kolom Tahun Fiskal. | Valid, tombol **Simpan** aktif. |
| 3 | **Tahun Fiskal** | `1901` (Di atas batas minimum) | Masukkan angka `1901` pada kolom Tahun Fiskal. | Valid, tombol **Simpan** aktif. |
| 4 | **Tahun Fiskal** | `2026` atau `2030` | Masukkan tahun berjalan atau tahun masa depan. | Proyek tersimpan dengan tahun fiskal yang sesuai. |
| 5 | **Nama Project** | `""` (Kosong) | Kosongkan kolom Nama Project, isi Nama Perusahaan & Tahun. | Error: *"Nama proyek harus diisi."*, tombol Simpan mati. |
| 6 | **Nama Project** | `"P"` (1 huruf) | Ketik 1 huruf `"P"` pada Nama Project. | Valid, tombol Simpan aktif. |
| 7 | **Nama Perusahaan** | `""` (Kosong) | Isi Nama Project, tapi kosongkan kolom Nama Perusahaan. | Error: *"Nama perusahaan harus diisi."*, tombol Simpan mati. |
| 8 | **Nama Perusahaan** | `"C"` (1 huruf) | Ketik 1 huruf `"C"` pada Nama Perusahaan. | Valid, tombol Simpan aktif. |
| 9 | **Approval Kebutuhan** | Setujui Kebutuhan | Klik aksi **"Setujui Kebutuhan"** pada baris proyek, konfirmasi. | Status kebutuhan proyek berubah menjadi **Approved**. |
| 10 | **Batal Approval** | Batalkan Approval | Klik aksi **"Batalkan Approval"** pada proyek yang sudah approved. | Status kembali menjadi **Draft / Pending**. |
| 11 | **Edit Project** | Ubah data proyek | Klik tombol **Edit** pada salah satu baris, ubah data, klik **Simpan**. | Data proyek terperbarui pada tabel. |
| 12 | **Hapus Project** | Hapus baris | Klik tombol **Hapus** pada baris proyek, lalu konfirmasi. | Proyek terhapus dari daftar tabel. |
