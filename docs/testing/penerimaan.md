# Lembar Pengujian: Penerimaan Barang (Surat Jalan)

- **Menu**: Penerimaan Barang $\rightarrow$ Catat Penerimaan (`/receipt/create`) atau Detail Penerimaan (`/receipt/$receiptId`)
- **Aksi Awal**: Klik tombol **"Catat Penerimaan"** untuk membuka form pencatatan surat jalan.

## Checklist Pengujian BVA & Alur Penerimaan

| No  | Field / Bagian        | Nilai yang Diinput            | Langkah Pengujian                                                          | Hasil yang Diharapkan                                                                             |
| --- | --------------------- | ----------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| 1   | **Pilih Order / SPK** | Belum dipilih (`""`)          | Biarkan pilihan Order kosong.                                              | Error: _"Order harus dipilih."_, form tabel item belum muncul.                                    |
| 2   | **Pilih Order / SPK** | Nomor Order Valid             | Pilih nomor SPK yang masih memiliki sisa barang yang belum terkirim.       | Daftar item dari SPK tersebut otomatis tampil di tabel lengkap dengan sisa volume (_remaining_).  |
| 3   | **Kode Penerimaan**   | `""` (Kosong)                 | Kosongkan kolom Kode Penerimaan / No. Surat Jalan.                         | Error: _"Kode Penerimaan harus diisi."_, tombol **Simpan** mati (_disabled_).                     |
| 4   | **Kode Penerimaan**   | `"SJ-2026-088"`               | Masukkan nomor surat jalan vendor.                                         | Valid, input diterima.                                                                            |
| 5   | **Tanggal Terima**    | `""` (Kosong)                 | Kosongkan tanggal penerimaan barang.                                       | Error: _"Tanggal kirim harus diisi."_, form tidak bisa disimpan.                                  |
| 6   | **Volume**            | Semua baris `0`               | Biarkan seluruh input Volume bernilai `0`, klik Simpan.                    | Error Banner: _"Minimal ada 1 item yang diterima."_, data tidak tersimpan.                        |
| 7   | **Volume**            | Negatif (`-1`)                | Masukkan angka negatif pada kolom Volume.                                  | Sistem menolak / mereset ke angka `0` atau menampilkan error validasi.                            |
| 8   | **Volume**            | Parsial ($0 < Qty < Sisa$)    | Contoh sisa order = `10`, masukkan Volume = `4`.                           | Valid, sistem mencatat penerimaan parsial 4 unit (sisa order menjadi 6 unit).                     |
| 9   | **Volume**            | Tepat Sisa ($Qty = Sisa$)     | Contoh sisa order = `10`, masukkan Volume = `10`.                          | Valid, sisa order menjadi `0` dan status item menjadi lunas terkirim penuh.                       |
| 10  | **Volume**            | Melebihi Sisa ($Qty > Sisa$)  | Contoh sisa order = `5`, masukkan Volume = `6`.                            | Error Tooltip: _"Melebihi sisa Order (5.00)."_, tombol Simpan mati (_disabled_).                  |
| 11  | **Volume**            | Desimal ($0.5$, $1.25$)       | Masukkan angka desimal pada Item yang mendukung desimal (misal: kg/meter). | Valid, volume desimal tersimpan akurat dan mengurangi sisa order.                                 |
| 12  | **Simpan Penerimaan** | Submit data valid             | Klik tombol **Simpan**, kembali ke daftar `/receipt`.                      | Dokumen surat jalan baru muncul di tabel riwayat penerimaan.                                      |
| 13  | **Update Status SPK** | Parsial $\rightarrow$ Lengkap | Periksa status SPK pada menu Pemesanan (`/order`).                         | Status SPK otomatis berubah menjadi **Sebagian Diterima (Partial)** atau **Selesai (Completed)**. |
| 14  | **Kunci Edit SPK**    | Edit Surat Jalan              | Buka form edit pada penerimaan yang sudah tersimpan.                       | Dropdown pemilihan nomor Order terkunci (_disabled_) untuk menjaga integritas relasi data.        |
| 15  | **Hapus Penerimaan**  | Batalkan Surat Jalan          | Klik tombol **Hapus** pada salah satu baris penerimaan barang, konfirmasi. | Surat jalan terhapus, volume yang diterima dikembalikan ke sisa order pada SPK terkait.           |
