# Lembar Pengujian: Master Harga Item

- **Menu**: Master Data $\rightarrow$ Item (`/master/item`)
- **Aksi**: Klik tombol **"Atur Harga"** pada baris item untuk membuka modal harga.

## Checklist Pengujian BVA

| No  | Field / Bagian     | Nilai yang Diinput                 | Langkah Pengujian                                                   | Hasil yang Diharapkan                                                                                   |
| :-: | ------------------ | ---------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
|  1  | **Harga (Rp)**     | `-1` atau `-5000` (Negatif)        | Masukkan angka negatif pada input Harga.                            | Error: _"Harga tidak valid."_, tombol **Tambah** mati (_disabled_).                                     |
|  2  | **Harga (Rp)**     | `0` (Nol)                          | Masukkan nilai `0`.                                                 | Valid, tombol **Tambah** aktif.                                                                         |
|  3  | **Harga (Rp)**     | `0.01` (Desimal batas bawah)       | Masukkan angka desimal `0.01` lalu klik **Tambah**.                 | Harga tersimpan dan muncul di tabel harga.                                                              |
|  4  | **Harga (Rp)**     | `150000` (Nominal biasa)           | Masukkan angka `150000` lalu klik **Tambah**.                       | Harga tersimpan dan diformat rapi menjadi `150.000`.                                                    |
|  5  | **Harga (Rp)**     | `999999999` (Nominal besar)        | Masukkan angka besar.                                               | Diformat dengan benar tanpa error perhitungan.                                                          |
|  6  | **Multi Varian**   | Tambah beberapa harga              | Tambah harga `50000`, lalu tambah lagi `55000` pada item yang sama. | Modal menampilkan riwayat seluruh varian harga yang dimiliki item tersebut.                             |
|  7  | **Proteksi Hapus** | Harga yang sudah terikat transaksi | Arahkan mouse ke tombol Hapus pada harga yang sudah digunakan.      | Tombol Hapus mati (_disabled_) + muncul Tooltip: _"Harga ini sedang digunakan dan tidak bisa dihapus."_ |
|  8  | **Hapus Harga**    | Harga baru / bebas                 | Klik tombol Hapus pada harga yang belum berelasi, konfirmasi.       | Harga berhasil terhapus dari daftar.                                                                    |
