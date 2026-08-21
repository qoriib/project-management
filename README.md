# Sistem Manajemen Proyek & Logistik (Tauri v2 + React 19)

Aplikasi desktop cross-platform untuk manajemen logistik proyek, pengadaan material, Purchase Order (SPK), surat jalan / penerimaan barang, dan pelaporan logistik berbasis Tauri v2, React 19, dan SQLite.

## Fitur Utama

- **Role-Based Access Control (RBAC)**:
  - **Logistics Staff**: Input kebutuhan, pencatatan SPK (Purchase Order), penerimaan barang (surat jalan), dan manajemen master data item & vendor.
  - **Manager**: Persetujuan (_approval_) kebutuhan proyek, monitoring anggaran, dan ekspor laporan rekapitulasi.
- **Master Data**:
  - Kategori Barang (otomatisasi kode & prefix 1 karakter).
  - Satuan Material.
  - Item Proyek dengan relasi multi-harga (_price variants_).
  - Vendor & Rekanan Supplier.
  - Proyek & Tahun Fiskal beserta status approval kebutuhan.
- **Transaksi Logistik**:
  - **Kebutuhan Proyek**: Input estimasi kebutuhan barang per proyek.
  - **Pemesanan (SPK / Order)**: Pembuatan PO dengan PPN opsional, status pemenuhan (_unfulfilled_, _partial_, _completed_), dan cetak/ekspor Excel.
  - **Penerimaan Barang**: Pencatatan surat jalan bertahap sesuai SPK.
  - **Laporan Logistik**: Rekapitulasi kebutuhan, order, dan penerimaan per proyek dengan ekspor Excel.

## Tech Stack & Arsitektur

| Lapisan                | Teknologi                       | Penjelasan                                                                        |
| ---------------------- | ------------------------------- | --------------------------------------------------------------------------------- |
| **Desktop Runtime**    | Tauri v2                        | Runtime desktop ringan berbasis Rust dengan Webview native.                       |
| **Frontend Framework** | React 19 + TypeScript           | UI berbasis komponen reaktif modern.                                              |
| **Design System**      | @astryxdesign/core              | Component library berbasis token warna & spacing tanpa raw CSS/div.               |
| **Routing**            | @tanstack/react-router          | File-based routing type-safe.                                                     |
| **Form & Validasi**    | @tanstack/react-form + Valibot  | Validasi form terstruktur dengan schema validation cepat dan ringan.              |
| **State Management**   | Zustand                         | Global state management modular.                                                  |
| **Database**           | SQLite (@tauri-apps/plugin-sql) | Penyimpanan lokal SQLite dengan fallback Node.js (node:sqlite) untuk seeding CLI. |
| **Lint & Formatting**  | oxlint & oxfmt                  | Linter & Formatter berkecepatan tinggi berbasis Rust.                             |

## Struktur Direktori Proyek

```
project-management/
├── docs/                   # Dokumentasi pengujian & panduan manual
│   └── testing/            # Lembar checklist pengujian manual BVA tiap modul
├── src/                    # Source code frontend
│   ├── components/         # Komponen UI modular per fitur & shared
│   ├── configs/            # Konfigurasi aplikasi & database
│   ├── db/                 # Database layer: Core ORM, Models, Repositories, Seeds, Services
│   ├── routes/             # File-based routing (TanStack Router)
│   ├── store/              # Global state management (Zustand stores)
│   └── utils/              # Helper utilitas form, formatters, dan pajak
├── src-tauri/              # Backend Rust & konfigurasi Tauri v2
├── package.json            # Dependensi dan script npm
└── README.md               # Dokumentasi utama proyek
```

## Perintah & Script CLI

### 1. Menjalankan Aplikasi (Development)

```powershell
# Jalankan sebagai Logistics Staff
npm run dev:staff

# Jalankan sebagai Manager
npm run dev:manager
```

### 2. Database Seeding & Reset

```powershell
# Mengisi database dengan data awal
npm run db:seed

# Mereset dan mengosongkan database
npm run db:reset
```

### 3. Build Production

```powershell
# Build installer untuk Logistics Staff
npm run build:staff

# Build installer untuk Manager
npm run build:manager
```

### 4. Linting & Formatting

```powershell
# Periksa linting
npm run lint

# Autofix linting
npm run lint:fix

# Format source code
npm run format
```

## Dokumentasi Modul Terkait

- [src/components/README.md](file:///d:/project-management/src/components/README.md) – Panduan komponen UI & Astryx Design System.
- [src/db/README.md](file:///d:/project-management/src/db/README.md) – Pola Repository, Query Builder, dan SQLite Database.
- [src/routes/README.md](file:///d:/project-management/src/routes/README.md) – Arsitektur File-based Routing TanStack Router.
- [src/store/README.md](file:///d:/project-management/src/store/README.md) – Manajemen State Modular dengan Zustand.
- [src/configs/README.md](file:///d:/project-management/src/configs/README.md) – Konfigurasi Database & Environment.
- [src/utils/README.md](file:///d:/project-management/src/utils/README.md) – Formatters, Penanganan Form, dan Pajak.
- [docs/testing/README.md](file:///d:/project-management/docs/testing/README.md) – Panduan & Lembar Pengujian Manual (BVA).
