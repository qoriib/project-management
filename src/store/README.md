# Dokumentasi: `src/store`

Direktori `src/store` mengelola seluruh _Global State Management_ aplikasi menggunakan library **Zustand**. Setiap domain fungsional dipisahkan ke dalam store modular untuk menjaga keterbacaan, performa re-render yang optimal, dan kemudahan pengujian.

## Daftar Store & Perannya

| File Store                   | Domain / Tanggung Jawab         | State Utama                                                                                                                   |
| ---------------------------- | ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **`useAppStore.ts`**         | Pengaturan Global & Autentikasi | `currentUser`, `activeRole`, `isLoggedIn`, `theme`, status inisialisasi aplikasi.                                             |
| **`useMasterStore.ts`**      | Master Data Terpusat            | `items`, `categories`, `projects`, `units`, `vendors`, `itemPricesMap` (cache varian harga per item), serta aksi CRUD master. |
| **`useOrderStore.ts`**       | Transaksi SPK / Purchase Order  | `orders`, `currentOrder`, `reloadOrders()`, aksi pembuatan dan pembatalan SPK.                                                |
| **`useReceiptStore.ts`**     | Penerimaan Barang (Surat Jalan) | `receipts`, `currentReceipt`, `reloadReceipts()`, pencatatan barang datang per SPK.                                           |
| **`useRequirementStore.ts`** | Estimasi Kebutuhan Material     | `requirements`, `loadRequirementsByProject()`, aksi input & edit kebutuhan per proyek.                                        |

## Pola Penggunaan Zustand

### 1. Inisialisasi & Lazy Loading Data

Data master hanya dimuat sekali ketika pertama kali dibutuhkan menggunakan penanda `isLoaded`:

```typescript
const { categories, loadAllMasters, isLoaded } = useMasterStore();

useEffect(() => {
  if (!isLoaded) {
    loadAllMasters();
  }
}, [isLoaded]);
```

### 2. Optimistic Update / Refresh Pasca Mutasi

Setelah menjalankan aksi CRUD (seperti `createCategory` atau `updateItem`), store secara otomatis memanggil fungsi reload internal (`reloadCategories()`) agar UI selalu sinkron dengan database lokal SQLite:

```typescript
createCategory: async (data) => {
  await itemCategoryRepo.create(data);
  await get().reloadCategories();
};
```

### 3. Pemilihan State Parsial (_Selectors_)

Gunakan selector untuk mencegah re-render yang tidak perlu pada komponen:

```typescript
const categories = useMasterStore((state) => state.categories);
const createCategory = useMasterStore((state) => state.createCategory);
```
