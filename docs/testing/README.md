# Panduan Pengujian Manual (BVA)

Panduan ini berisi daftar skenario dan checklist pengujian manual dengan metode **Boundary Value Analysis (BVA)** untuk memastikan seluruh modul transaksi dan master data pada aplikasi berfungsi dengan benar.

## Cara Melakukan Pengujian

1. Jalankan aplikasi Tauri sesuai role yang ingin diuji:
   ```powershell
   # Role Logistics Staff
   npm run dev:staff

   # Role Manager
   npm run dev:manager
   ```
2. Buka menu navigasi di sidebar sesuai modul yang ingin diuji.
3. Ikuti langkah pengujian pada masing-masing dokumen di bawah ini:

## Daftar Lembar Uji Modul

| No  | Modul                       | Link Dokumen Uji                           | Fokus Pengujian                                                        |
| --- | --------------------------- | ------------------------------------------ | ---------------------------------------------------------------------- |
| 1   | **Master Kategori**         | [master-kategori.md](./master-kategori.md) | Prefix 1 huruf, Nama kategori, Auto kode                               |
| 2   | **Master Satuan**           | [master-satuan.md](./master-satuan.md)     | Nama satuan (0 char vs 1 char vs nama normal)                          |
| 3   | **Master Item**             | [master-item.md](./master-item.md)         | Nama item, Dropdown kategori & satuan, Auto kode                       |
| 4   | **Master Harga Item**       | [master-harga.md](./master-harga.md)       | Harga negatif, Harga 0, Desimal, Proteksi hapus                        |
| 5   | **Master Vendor**           | [master-vendor.md](./master-vendor.md)     | Nama vendor, Isian telepon & alamat opsional                           |
| 6   | **Master Project**          | [master-project.md](./master-project.md)   | Tahun fiskal $\ge 1900$, Nama proyek & perusahaan                      |
| 7   | **Kebutuhan Material**      | [kebutuhan.md](./kebutuhan.md)             | Volume $\ge 0$, Desimal, PPN 11%, Approval Manager, Penguncian data    |
| 8   | **Pemesanan (Order / SPK)** | [pemesanan.md](./pemesanan.md)             | Nomor SPK, Volume $> 0$, PPN 11%, Status pemenuhan, Kalkulasi total    |
| 9   | **Penerimaan Barang**       | [penerimaan.md](./penerimaan.md)           | Sisa order, $Qty \le Sisa$, Error jika $Qty > Sisa$, Update status SPK |
