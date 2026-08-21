# Dokumentasi: `src/routes`

Direktori `src/routes` mengimplementasikan sistem navigasi dan halaman aplikasi menggunakan **TanStack Router** berbasis file (_file-based routing_).

## Struktur & Peta Rute

```
src/routes/
├── __root.tsx              # Root Layout: Theme Provider, AppShell, SideNav, Auth Guard
├── index.tsx               # Halaman Dashboard (Ringkasan Statistik & Aktivitas)
├── login.tsx               # Halaman Pemilihan Role / Login
├── master/                 # Rute Halaman Master Data
│   ├── index.tsx           # Hub navigasi master data
│   ├── item.tsx            # /master/item
│   ├── kategori.tsx        # /master/kategori
│   ├── project.tsx         # /master/project
│   ├── satuan.tsx          # /master/satuan
│   └── vendor.tsx          # /master/vendor
├── order/                  # Rute Halaman SPK / Purchase Order
│   ├── index.tsx           # /order (Daftar SPK)
│   ├── create.tsx          # /order/create (Form Tambah SPK)
│   └── $orderId.tsx        # /order/:orderId (Detail & Status SPK)
├── receipt/                # Rute Halaman Penerimaan Barang
│   ├── index.tsx           # /receipt (Daftar Surat Jalan)
│   ├── create.tsx          # /receipt/create (Form Penerimaan)
│   └── $receiptId.tsx      # /receipt/:receiptId (Detail Surat Jalan)
├── requirement/            # Rute Halaman Kebutuhan Material
│   ├── index.tsx           # /requirement (Daftar Proyek)
│   └── $projectId.tsx      # /requirement/:projectId (Input Kebutuhan per Proyek)
├── settings/               # Rute Pengaturan & Maintenance
│   └── index.tsx           # /settings (Pengaturan Aplikasi & Backup)
└── routeTree.gen.ts        # Manifest router tergenerate otomatis (jangan diedit manual)
```

## Pola Proteksi Rute & Layout

1. **Root Layout (`__root.tsx`)**:
   - Membungkus seluruh aplikasi dengan `AppShell` dan `SideNav` dari Astryx.
   - Memeriksa status login melalui `useAppStore`. Jika pengguna belum memilih role atau belum login, otomatis dialihkan (_redirect_) ke `/login`.
2. **Dynamic Segment Routing (`$param.tsx`)**:
   - Parameter URL (seperti `$orderId`, `$projectId`) dibaca secara type-safe melalui hook `useParams()` dari TanStack Router:
     ```tsx
     const { orderId } = Route.useParams();
     ```
3. **Penyusunan Pohon Rute**:
   - Setiap berkas rute dibuat menggunakan `createFileRoute("/path")({ component: MyPage })`.
   - File `routeTree.gen.ts` diperbarui secara otomatis oleh plugin `@tanstack/router-plugin` saat server dev berjalan.
