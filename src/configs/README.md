# Dokumentasi: `src/configs`

Direktori `src/configs` mengelola seluruh konfigurasi statis, variabel lingkungan (_environment variables_), nama database, dan aturan otorisasi berbasis peran (_role-based access control_).

## Berkas Konfigurasi

### 1. `app.config.ts`

- **Role-Based Configuration**: Mengatur peran aktif aplikasi berdasarkan `import.meta.env.VITE_APP_ROLE` (`logistics_staff` atau `manager`).
- **Definisi Hak Akses**:
  - `isManager`: Akses untuk approval kebutuhan, monitoring laporan, dan manajemen proyek.
  - `isStaff`: Akses untuk pencatatan transaksi logistik (kebutuhan, SPK/order, penerimaan barang).
- **Metadata Aplikasi**: Informasi nama aplikasi, versi, dan konfigurasi navigasi.

### 2. `database.config.ts`

- **Konfigurasi Database SQLite**:
  - `DB_NAME`: Nama file database SQLite lokal (`project_management.db`).
  - `DB_SQLITE_URL`: URL koneksi SQLite untuk Tauri (`sqlite:project_management.db`).

## Pola Penggunaan

Gunakan import terpusat untuk membaca konfigurasi aplikasi di seluruh komponen dan service:

```typescript
import { APP_CONFIG, isManagerRole } from "@/configs/app.config";
import { DB_SQLITE_URL } from "@/configs/database.config";
```
