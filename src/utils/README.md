# Dokumentasi: `src/utils`

Direktori `src/utils` berisi fungsi-fungsi pembantu (_helper utilities_) murni untuk pemformatan angka/mata uang/tanggal, penanganan error validasi formulir, dan perhitungan kalkulasi pajak.

## Berkas & Fungsi Utilitas

### 1. `formatters.ts`

Menyediakan pemformatan standar lokal Indonesia (`id-ID`):

- `formatNumber(value: number, decimals?: number)`: Memformat angka dengan pemisah ribuan lokal Indonesia (`id-ID`). Default 5 desimal maksimum dan 0 desimal minimum.
- `formatItemCode(parts)`: Memformat kode barang gabungan (`prefix`, `kategori`, `kode`).
- `generateNextCode(existingCodes, prefix, digits)`: Membuat nomor urut kode berikutnya dengan padding otomatis.

### 2. `form.ts`

Fungsi integrasi antara `@tanstack/react-form` dan sistem feedback UI:

- `getFieldError(errors, isTouched)`: Mengembalikan status error dan pesan untuk komponen input Astryx (`statusVariant="tooltip"`).
- `handleFormError(error, showToast)`: Menangkap exception saat submit form dan menampilkan notifikasi Toast yang ramah pengguna.

### 3. `tax.ts`

Konstanta dan fungsi kalkulasi perpajakan proyek:

- `calcPPN(subtotal, persen)`: Menghitung nominal PPN.
- `calcTotal(subtotal, ppnPersen)`: Menghitung total setelah PPN.

## Contoh Penggunaan

```typescript
import { formatNumber, formatItemCode } from "@/utils/formatters";
import { getFieldError, handleFormError } from "@/utils/form";

// Contoh format angka
const displayPrice = `Rp ${formatNumber(row.price)}`;

// Contoh penanganan error form
try {
  await createItem(data);
} catch (error) {
  handleFormError(error, showToast);
}
```
