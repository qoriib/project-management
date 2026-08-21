# Lembar Pengujian: Pemesanan (Order / SPK)

- **Menu**: Pemesanan $\rightarrow$ Buat Order Baru (`/order/create`) atau Detail Order (`/order/$orderId`)
- **Aksi Awal**: Pastikan proyek aktif telah dipilih, lalu klik tombol **"Buat SPK / Order Baru"**.

## Checklist Pengujian BVA & Alur Pemesanan

| No  | Field / Bagian             | Nilai yang Diinput             | Langkah Pengujian                                                         | Hasil yang Diharapkan                                                                      |
| --- | -------------------------- | ------------------------------ | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| 1   | **Nomor Order**            | `""` (Kosong)                  | Kosongkan kolom Nomor Order, lalu isi tanggal dan tambahkan item.         | Error: _"Nomor Order harus diisi."_, tombol **Buat Baru / Simpan** mati (_disabled_).      |
| 2   | **Nomor Order**            | `"SPK-2026-001"`               | Masukkan nomor SPK/Order yang valid.                                      | Valid, input diterima tanpa error.                                                         |
| 3   | **Tanggal Order**          | `""` (Kosong)                  | Kosongkan kolom Tanggal Order.                                            | Error: _"Tanggal Order harus diisi."_, form tidak dapat disimpan.                          |
| 4   | **Pemilihan Item**         | Belum dipilih (`""`)           | Pada baris item order, biarkan kolom Item kosong.                         | Error: _"Item harus dipilih."_, baris item tidak bisa ditambahkan.                         |
| 5   | **Pemilihan Harga**        | Belum dipilih (`""`)           | Pilih Item tetapi tidak memilih varian harga satuan.                      | Error: _"Variasi harga harus dipilih."_, baris item belum valid.                           |
| 6   | **Pemilihan Vendor**       | Belum dipilih (`""`)           | Pilih Item & harga, tetapi biarkan kolom Vendor kosong.                   | Error: _"Vendor harus dipilih."_, baris item belum valid.                                  |
| 7   | **Volume**                 | `-1` atau `-5` (Negatif)       | Masukkan angka negatif pada kolom Volume item order.                      | Error: _"Volume tidak valid."_, tombol simpan item mati.                                   |
| 8   | **Volume**                 | `0` (Nol)                      | Masukkan angka `0` pada kolom Volume item order.                          | Error: _"Volume tidak valid."_ (Volume pemesanan minimal $> 0$).                           |
| 9   | **Volume**                 | `0.01` (Batas minimum desimal) | Masukkan angka desimal kecil `0.01`.                                      | Valid, baris item dapat disimpan.                                                          |
| 10  | **Volume**                 | `100` (Angka normal)           | Masukkan angka volume pemesanan normal.                                   | Valid, subtotal dihitung otomatis (`Volume × Harga Satuan`).                               |
| 11  | **PPN (has_tax)**          | Tidak Dicentang (`false`)      | Tambah item volume `10`, harga `Rp 50.000` tanpa mencentang PPN.          | Subtotal baris = `Rp 500.000`, pajak = `Rp 0`.                                             |
| 12  | **PPN (has_tax)**          | Dicentang (`true`)             | Tambah item volume `10`, harga `Rp 50.000` dengan mencentang PPN.         | Subtotal baris = `Rp 555.000` (termasuk PPN 11% sebesar `Rp 55.000`).                      |
| 13  | **Grand Total**            | Kalkulasi footer tabel         | Tambahkan beberapa item order dengan variasi harga dan PPN.               | Footer tabel otomatis menampilkan ringkasan Subtotal, Total PPN, dan Grand Total.          |
| 14  | **Shortcut Master Vendor** | Tambah vendor via modal        | Klik ikon tambah vendor baru langsung di dalam form item order.           | Modal master vendor terbuka, vendor baru langsung terpilih setelah disimpan.               |
| 15  | **Shortcut Master Harga**  | Tambah harga via modal         | Klik ikon tambah harga baru langsung di dalam form item order.            | Modal harga terbuka, harga baru langsung terpilih setelah disimpan.                        |
| 16  | **Edit Baris Order**       | Ubah data item                 | Klik tombol **Edit** pada salah satu baris item draft order, ubah volume. | Baris terupdate dan total kalkulasi footer langsung disesuaikan.                           |
| 17  | **Hapus Baris Order**      | Hapus item draft               | Klik tombol **Hapus** pada baris item order, konfirmasi.                  | Baris terhapus dari tabel order.                                                           |
| 18  | **Simpan Order**           | Submit form order lengkap      | Klik tombol **Buat Baru**, lalu periksa halaman daftar `/order`.          | Order baru muncul pada tabel dengan status pemenuhan awal **Belum Dikirim (Unfulfilled)**. |
| 19  | **Tracking Status**        | Cek detail progress SPK        | Buka detail order yang sudah dibuat (`/order/$orderId`).                  | Halaman menampilkan tabel monitoring sisa barang (_remaining_) dan log penerimaan.         |
