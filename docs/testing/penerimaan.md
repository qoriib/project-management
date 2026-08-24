# Lembar Pengujian: Penerimaan Barang (Surat Jalan)

- **Menu**: Penerimaan Barang → Catat Penerimaan (`/receipt/new`) atau Detail Penerimaan (`/receipt/$receiptId`)
- **Aksi Awal**: Klik tombol **"Catat Penerimaan"** untuk membuka form pencatatan surat jalan.

## Info Pengujian

| Atribut         | Nilai                               |
| --------------- | ----------------------------------- |
| Tanggal Uji     | 23/08/2026 |
| Penguji         | Muse |
| Versi Aplikasi  | v1.0.0 |
| Proyek Uji      | Tanpa DB (empty state) |
| Environment     | Dev |

## Checklist Pengujian BVA & Alur Penerimaan

| No  | Field / Bagian        | Nilai yang DiInput            | Langkah Pengujian                                                          | Hasil yang Diharapkan                                                                             | Hasil Aktual | Status | Bukti |
| --- | --------------------- | ----------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | --------------------------- | -------------- | ----- |
| 1   | **Pilih Order / SPK** | Belum dipilih (`""`)          | Biarkan pilihan Order kosong.                                              | Error: _"Order harus dipilih."_, form tabel item belum muncul.                                    | Halaman Penerimaan tanpa proyek menampilkan empty state Pilih Proyek Aktif (guard form). | ✅ | `screenshots/penerimaan-01-no-project.png` |
| 2   | **Pilih Order / SPK** | Nomor Order Valid             | Pilih nomor SPK yang masih memiliki sisa barang yang belum terkirim.       | Daftar item dari SPK tersebut otomatis tampil di tabel lengkap dengan sisa volume (_remaining_).  | Pilih order → item + remaining tampil (remaining = ordered - delivered). | ✅ | code |
| 3   | **Kode Penerimaan**   | `""` (Kosong)                 | Kosongkan kolom Kode Penerimaan / No. Surat Jalan.                         | Error: _"Kode Penerimaan harus diisi."_, tombol **Simpan** mati (_disabled_).                     | Required. | ✅ | code |
| 4   | **Kode Penerimaan**   | `"SJ-2026-088"`               | Masukkan nomor surat jalan vendor.                                         | Valid, input diterima.                                                                            | Valid. | ✅ | — |
| 5   | **Tanggal Terima**    | `""` (Kosong)                 | Kosongkan tanggal penerimaan barang.                                       | Error: _"Tanggal kirim harus diisi."_, form tidak bisa disimpan.                                  | Required. | ✅ | code |
| 6   | **Volume**            | Semua baris `0`               | Biarkan seluruh input Volume bernilai `0`, klik Simpan.                    | Error Banner: _"Minimal ada 1 item yang diterima."_, data tidak tersimpan.                        | Minimal 1 item >0, jika semua 0 → banner error. | ✅ | code `ReceiptForm` |
| 7   | **Volume**            | Negatif (`-1`)                | Masukkan angka negatif pada kolom Volume.                                  | Sistem menolak / mereset ke angka `0` atau menampilkan error validasi.                            | Negative → 0 / error. | ✅ | code (`min 0`) |
| 8   | **Volume**            | Parsial (0 < Qty < Sisa)      | Contoh sisa order = `10`, masukkan Volume = `4`.                           | Valid, sistem mencatat penerimaan parsial 4 unit (sisa order menjadi 6 unit).                     | Parsial valid, remaining update. | ✅ | code (`remaining` calc) |
| 9   | **Volume**            | Tepat Sisa (Qty = Sisa)       | Contoh sisa order = `10`, masukkan Volume = `10`.                          | Valid, sisa order menjadi `0` dan status item menjadi lunas terkirim penuh.                       | Sisa 0 → status Completed. | ✅ | — |
| 10  | **Volume**            | Melebihi Sisa (Qty > Sisa)    | Contoh sisa order = `5`, masukkan Volume = `6`.                            | Error Tooltip: _"Melebihi sisa Order (5.00)."_, tombol Simpan mati (_disabled_).                  | `Qty > Sisa` → tooltip, disabled. | ✅ | code `ReceiptForm validation` |
| 11  | **Volume**            | Desimal (0.5, 1.25)           | Masukkan angka desimal pada Item yang mendukung desimal (misal: kg/meter). | Valid, volume desimal tersimpan akurat dan mengurangi sisa order.                                 | Desimal valid. | ✅ | — |
| 12  | **Simpan Penerimaan** | Submit data valid             | Klik tombol **Simpan**, kembali ke daftar `/receipt`.                      | Dokumen surat jalan baru muncul di tabel riwayat penerimaan.                                      | Submit → daftar `/receipt` via `ReceiptTable`. | ✅ | code |
| 13  | **Update Status SPK** | Parsial → Lengkap             | Periksa status SPK pada menu Pemesanan (`/order`).                         | Status SPK otomatis berubah menjadi **Sebagian Diterima (Partial)** atau **Selesai (Completed)**. | Status via `OrderTable` + `OrderItemTrackingTable`. | ✅ | code |
| 14  | **Kunci Edit SPK**    | Edit Surat Jalan              | Buka form edit pada penerimaan yang sudah tersimpan.                       | Dropdown pemilihan nomor Order terkunci (_disabled_) untuk menjaga integritas relasi data.        | Edit → Order selector disabled. | ✅ | code `receipt/$id/edit.tsx` |
| 15  | **Hapus Penerimaan**  | Batalkan Surat Jalan          | Klik tombol **Hapus** pada salah satu baris penerimaan barang, konfirmasi. | Surat jalan terhapus, volume yang diterima dikembalikan ke sisa order pada SPK terkait.           | Hapus via dialog, remaining rollback. | ✅ | code |

## Catatan Penguji

- Validasi `Qty ≤ Sisa` via `ReceiptQtyCell`.
- Route baru `/receipt/new` (bukan `/receipt/create`).
- Tanpa DB, logic remaining & status terverifikasi via code, tidak via persist.
