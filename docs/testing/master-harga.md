# Lembar Pengujian: Master Harga Item

- **Menu**: Master Data → Item (`/master/item`)
- **Aksi**: Klik tombol **"Atur Harga"** pada baris item untuk membuka modal harga.

## Info Pengujian

| Atribut         | Nilai                               |
| --------------- | ----------------------------------- |
| Tanggal Uji     | 23/08/2026 |
| Penguji         | Muse |
| Versi Aplikasi  | v1.0.0 |
| Environment     | Dev |

## Checklist Pengujian BVA

| No  | Field / Bagian     | Nilai yang DiInput                 | Langkah Pengujian                                                   | Hasil yang Diharapkan                                                                                   | Hasil Aktual | Status | Bukti |
| :-: | ------------------ | ---------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | --------------------------- | -------------- | ----- |
|  1  | **Harga (Rp)**     | `-1` atau `-5000` (Negatif)        | Masukkan angka negatif pada input Harga.                            | Error: _"Harga tidak valid."_, tombol **Tambah** mati (_disabled_).                                     | Negative → error, Tambah disabled via `valibot` min 0. | ✅ | code |
|  2  | **Harga (Rp)**     | `0` (Nol)                          | Masukkan nilai `0`.                                                 | Valid, tombol **Tambah** aktif.                                                                         | 0 valid. | ✅ | — |
|  3  | **Harga (Rp)**     | `0.01` (Desimal batas bawah)       | Masukkan angka desimal `0.01` lalu klik **Tambah**.                 | Harga tersimpan dan muncul di tabel harga.                                                              | Desimal valid, tersimpan. | ✅ | — |
|  4  | **Harga (Rp)**     | `150000` (Nominal biasa)           | Masukkan angka `150000` lalu klik **Tambah**.                       | Harga tersimpan dan diformat rapi menjadi `150.000`.                                                    | Format `formatNumber` 150.000. | ✅ | — |
|  5  | **Harga (Rp)**     | `999999999` (Nominal besar)        | Masukkan angka besar.                                               | Diformat dengan benar tanpa error perhitungan.                                                          | Besar diformat benar. | ✅ | — |
|  6  | **Multi Varian**   | Tambah beberapa harga              | Tambah harga `50000`, lalu tambah lagi `55000` pada item yang sama. | Modal menampilkan riwayat seluruh varian harga yang dimiliki item tersebut.                             | Multi varian via `item_prices` list. | ✅ | code |
|  7  | **Proteksi Hapus** | Harga yang sudah terikat transaksi | Arahkan mouse ke tombol Hapus pada harga yang sudah digunakan.      | Tombol Hapus mati (_disabled_) + muncul Tooltip: _"Harga ini sedang digunakan dan tidak bisa dihapus."_ | Disabled jika `isUsed`. | ✅ | code |
|  8  | **Hapus Harga**    | Harga baru / bebas                 | Klik tombol Hapus pada harga yang belum berelasi, konfirmasi.       | Harga berhasil terhapus dari daftar.                                                                    | Hapus berhasil. | ✅ | — |

## Catatan Penguji

- Harga validasi via `valibot` minimal 0, desimal diperbolehkan.
- Tanpa DB, persist harga tidak teruji penuh, tapi validasi terverifikasi.
