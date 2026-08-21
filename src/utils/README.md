# Dokumentasi: `src/utils`

Direktori `src/utils` berisi fungsi-fungsi pembantu (_helper utilities_) murni untuk pemformatan angka/mata uang/tanggal, penanganan error validasi formulir, dan perhitungan kalkulasi pajak.

## Berkas & Fungsi Utilitas

### 1. `formatters.ts`

Menyediakan pemformatan standar lokal Indonesia (`id-ID`):

- `formatCurrency(amount: number)`: Memformat angka ke format mata uang Rupiah (contoh: `150000` $\rightarrow$ `Rp 150.000`).
- `formatNumber(value: number)`: Memformat angka dengan pemisah ribuan titik (contoh: `1500000` $\rightarrow$ `1.500.000`).
- `formatDate(date: string | Date)`: Memformat string tanggal ke format standar (contoh: `21 Agustus 2026`).
- `formatDateTime(date: string | Date)`: Memformat tanggal beserta jam dan menit.

### 2. `form.ts`

Fungsi integrasi antara `@tanstack/react-form` dan sistem feedback UI:

- `getFieldError(errors, isTouched)`: Mengembalikan status error dan pesan untuk komponen input Astryx (`statusVariant="attached"`).
- `handleFormError(error, showToast)`: Menangkap exception saat submit form dan menampilkan notifikasi Toast yang ramah pengguna.

### 3. `tax.ts`

Konstanta dan fungsi kalkulasi perpajakan proyek:

- `PPN_PERCENTAGE`: Nilai default PPN (11%).
- `calculateTaxAmount(subtotal, taxPercent)`: Menghitung nominal pajak.
- `calculateTotalWithTax(subtotal, taxPercent)`: Menghitung total setelah pajak.

## Contoh Penggunaan

```typescript
import { formatCurrency, formatDate } from "@/utils/formatters";
import { getFieldError, handleFormError } from "@/utils/form";
import { calculateTaxAmount } from "@/utils/tax";

// Contoh format mata uang
const displayPrice = formatCurrency(row.price);

// Contoh penanganan error form
try {
  await createItem(data);
} catch (error) {
  handleFormError(error, showToast);
}
```
