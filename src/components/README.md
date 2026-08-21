# Dokumentasi: `src/components`

Direktori `src/components` berisi seluruh komponen antarmuka (UI) aplikasi yang diorganisasikan berdasarkan domain fitur dan komponen yang dapat digunakan ulang (_shared_).

## Pola Desain & Aturan UI (Astryx Design System)

Aplikasi ini menggunakan **Astryx Design System (`@astryxdesign/core`)**. Semua komponen wajib mengikuti pedoman berikut:

- **No `<div>` / `<span>` untuk layout**: Gunakan komponen tata letak bawaan seperti `VStack`, `HStack`, `Section`, `AppShell`, `SideNav`, `Card`, dan `FormLayout`.
- **Penggunaan Token**: Menggunakan token CSS Astryx (`var(--color-*)`, `var(--spacing-*)`, `var(--radius-*)`) tanpa _hardcoded_ nilai pixel/hex.
- **Dense Data Presentation**: Menggunakan `Table` dari `@astryxdesign/core/Table` dengan _column width helpers_ (`pixel()`, `proportional()`) dan plugin indeks baris `useTableRowIndex`.
- **Penanganan Status**: Menggunakan `StatusDot` dan `Badge` untuk status pemenuhan (_unfulfilled_, _partial_, _completed_), bukan dekorasi semata.

## Struktur Subdirektori

```
src/components/
├── master/         # Komponen Form & Tabel CRUD Master Data
│   ├── MasterCategoryForm.tsx / MasterCategoryTable.tsx
│   ├── MasterItemForm.tsx / MasterItemTable.tsx / MasterItemPriceDialog.tsx
│   ├── MasterProjectForm.tsx / MasterProjectTable.tsx
│   ├── MasterUnitForm.tsx / MasterUnitTable.tsx
│   └── MasterVendorForm.tsx / MasterVendorTable.tsx
├── order/          # Komponen Transaksi SPK / Purchase Order
│   ├── OrderForm.tsx, OrderTable.tsx, OrderDetail.tsx, OrderItemSelector.tsx
├── receipt/        # Komponen Penerimaan Barang (Surat Jalan)
│   ├── ReceiptForm.tsx, ReceiptTable.tsx, ReceiptDetail.tsx
├── report/         # Komponen Pelaporan & Rekapitulasi Proyek
│   ├── ReportRequirementTable.tsx, ReportOrderTable.tsx, ReportReceiptTable.tsx
├── requirement/    # Komponen Estimasi Kebutuhan Item Proyek
│   ├── RequirementTable.tsx, RequirementApprovalActions.tsx, form/, table/
├── settings/       # Komponen Pengaturan & Database Backup
└── shared/         # Komponen yang Digunakan Bersama
    ├── PageHeader.tsx         # Header halaman terstandarisasi (judul, subtitle, aksi)
    ├── TableEmptyState.tsx    # State visual ketika data tabel kosong
    └── useTableRowIndex.ts    # Plugin nomor urut baris tabel Astryx
```

## Pola Integrasi Form & State

1. **Form Handling**:
   Setiap form modal mengombinasikan `@tanstack/react-form` dengan validasi schema `valibot`.
   ```tsx
   import { useForm } from "@tanstack/react-form";
   import * as v from "valibot";

   const schema = v.object({
     name: v.pipe(v.string(), v.nonEmpty("Nama wajib diisi.")),
   });
   ```
2. **Submit & Toast Notification**:
   Error ditangani secara terpusat melalui `handleFormError(error, showToast)` dari `@/utils/form`.
3. **Pemisahan Form dan Tabel**:
   Setiap entitas memisahkan komponen daftar (`*Table.tsx`) dan form modal input/edit (`*Form.tsx`) agar rendering tetap efisien dan mudah diuji.
