# Dokumentasi: `src/db`

Direktori `src/db` merupakan lapisan akses data (_Data Access Layer_) yang mengimplementasikan pola **Repository**, **Query Builder kustom**, abstraksi model database, dan layanan kalkulasi bisnis.

## Arsitektur Data Access Layer

```
┌────────────────────────────────────────────────────────┐
│                   Domain Services                      │
│     (report.service.ts, excel.service.ts, auth)        │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│                 Domain Repositories                    │
│   (itemRepo, orderRepo, receiptRepo, projectRepo, dll) │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│               BaseRepository & QueryBuilder            │
│   (CRUD standar, Soft Delete, Pagination, Raw Select)  │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│                    Database Driver                     │
│   Tauri Runtime: @tauri-apps/plugin-sql                │
│   CLI/Node.js Fallback: node:sqlite (node-db.ts)       │
└────────────────────────────────────────────────────────┘
```

## Struktur Direktori

```
src/db/
├── core/                   # Pondasi ORM & Database Engine
│   ├── base-repository.ts  # Generic BaseRepository<T, TCreate, TUpdate>
│   ├── query-builder.ts    # SQL Query Builder (SELECT, JOIN, WHERE, LIMIT)
│   ├── errors.ts           # Wrapper error SQLite & penanganan constraint
│   ├── db-logger.ts        # Logger eksekusi query & profiling waktu
│   └── types.ts            # Type definitions (ModelDefinition, FindOptions)
├── models/                 # Definisi Schema Tabel & TypeScript Interfaces
│   ├── item.model.ts, project.model.ts, order.model.ts, dll
├── repositories/           # Repository spesifik per domain fitur
│   ├── item.repository.ts, order.repository.ts, receipt.repository.ts, dll
├── services/               # Layanan bisnis & pemrosesan data kompleks
│   ├── report.service.ts   # Kalkulasi rekapitulasi, sisa pemenuhan, anggaran
│   ├── excel.service.ts    # Ekspor laporan ke format Microsoft Excel (.xlsx)
│   └── auth.service.ts     # Autentikasi dan verifikasi session role
├── seeds/                  # Script data awal (seeders) CLI
├── index.ts                # Koneksi DB runtime (Tauri plugin-sql)
└── node-db.ts              # Fallback koneksi SQLite untuk Node.js CLI
```

## Pola Penerapan & Kode Contoh

### 1. Pola Model Definition (`src/db/models/`)

Setiap entitas mendefinisikan tipe data dan konfigurasi tabel (primary key, soft delete, kolom yang diizinkan untuk dibuat/diedit):

```typescript
export interface ItemCategory {
  category_id: string;
  category_code: string;
  category_name: string;
  prefix: string;
  deleted_at: string | null;
}

export const ItemCategoryModel: ModelDefinition = {
  createColumns: ["category_code", "category_name", "prefix"],
  primaryKey: "category_id",
  softDelete: true,
  tableName: "item_categories",
  updateColumns: ["category_code", "category_name", "prefix"],
};
```

### 2. Pola Repository (`src/db/repositories/`)

Repository mengekstensi `BaseRepository` untuk mendapatkan fitur bawaan CRUD (`findById`, `create`, `update`, `delete`, `findAll`) dan menambahkan query khusus:

```typescript
class ItemCategoryRepository extends BaseRepository<ItemCategory, CreateItemCategory, UpdateItemCategory> {
  constructor() {
    super(ItemCategoryModel);
  }

  async findAllSorted(): Promise<ItemCategory[]> {
    return this.findAll({
      orderBy: { column: "category_name", direction: "ASC" },
    });
  }
}

export const itemCategoryRepo = new ItemCategoryRepository();
```

### 3. Dual-Environment Database Adapter (`getDB()`)

- Di dalam runtime Tauri (desktop browser/webview), menggunakan `@tauri-apps/plugin-sql`.
- Di luar Tauri (seperti saat menjalankan script `npm run db:seed` via `vite-node`), otomatis beralih ke `node-db.ts` menggunakan native Node.js `node:sqlite`.
