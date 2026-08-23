# Dokumentasi: `src/utils`

Direktori `src/utils` berisi kumpulan fungsi pembantu (_pure helper utilities_) untuk pemformatan angka/mata uang lokal Indonesia, sanitasi dan parsing data input, penanganan validasi formulir Astryx, serta kalkulasi perpajakan (PPN).

---

## Modul & Fungsi Utilitas

### 1. `formatters.ts` — Pemformatan & Sanitasi Data

Menyediakan pemformatan standar lokal Indonesia (`id-ID`) dan manipulasi string kode/tanggal:

| Fungsi                                                | Deskripsi                                                                                                                  |
| :---------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------- |
| **`formatNumber(value, decimals?)`**                  | Memformat angka dengan pemisah ribuan titik (`.`) dan koma (` `) desimal lokal Indonesia (`id-ID`). Default max 5 desimal. |
| **`sanitizePin(val, maxLength?)`**                    | Membersihkan string PIN hanya berisi angka (0-9) dengan batas panjang maksimal (default: 6).                               |
| **`sanitizeDecimalInput(val)`**                       | Membersihkan input desimal untuk pasar Indonesia (mengubah titik ke koma, menghapus karakter non-angka).                   |
| **`parseDecimalInput(val)`**                          | Mengonversi string input desimal (koma/titik) menjadi tipe angka `number` (float).                                         |
| **`toISODate(date?)`**                                | Mengubah objek Date ke string tanggal ISO format `YYYY-MM-DD`.                                                             |
| **`todayISO()`**                                      | Mendapatkan tanggal hari ini dalam format `YYYY-MM-DD`.                                                                    |
| **`getTimestampString(date?)`**                       | Menghasilkan string timestamp aman untuk nama file backup/ekspor (`YYYY-MM-DD_HH-mm-ss`).                                  |
| **`formatItemCode(parts)`**                           | Menggabungkan prefix kategori, kode kategori, dan kode item menjadi satu kode terformat.                                   |
| **`generateNextCode(existingCodes, prefix, digits)`** | Menghasilkan nomor urut kode berikutnya dengan _auto-increment_ dan zero-padding.                                          |

---

### 2. `form.ts` — Validasi Form & Feedback Error

Fungsi integrasi antara `@tanstack/react-form` dan komponen UI Astryx:

| Fungsi                                  | Deskripsi                                                                                                                                                          |
| :-------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`getFieldError(errors, isTouched)`**  | Mengembalikan status error `{ type: "error", message: string }` hanya jika field sudah disentuh (`isTouched`), kompatibel dengan `statusVariant="tooltip"` Astryx. |
| **`handleFormError(error, showToast)`** | Menangkap exception saat submit form dan menampilkan notifikasi Toast error secara konsisten.                                                                      |

---

### 3. `tax.ts` — Kalkulasi Perpajakan (PPN)

Konstanta dan fungsi kalkulasi perpajakan proyek:

| Fungsi / Konstanta                           | Deskripsi                                                                    |
| :------------------------------------------- | :--------------------------------------------------------------------------- |
| **`DEFAULT_PPN_PERCENT`**                    | Tarif PPN default yang berlaku (`12%`).                                      |
| **`calcPPN(subtotal, percent?)`**            | Menghitung nominal PPN dari nilai subtotal / DPP.                            |
| **`calcTotalWithTax(subtotal, percent?)`**   | Menghitung nilai total setelah ditambah PPN (`Subtotal + PPN`).              |
| **`calcDppFromGross(grossTotal, percent?)`** | Menghitung nilai DPP sebelum pajak dari nilai gross yang sudah termasuk PPN. |

---

## Contoh Penggunaan

```typescript
import { formatNumber, formatItemCode, getTimestampString } from "@/utils/formatters";
import { getFieldError, handleFormError } from "@/utils/form";
import { calcPPN, calcTotalWithTax } from "@/utils/tax";

// Format angka dan mata uang
const displayPrice = `Rp ${formatNumber(row.price)}`;

// Kalkulasi PPN
const ppn = calcPPN(100000); // 12000
const total = calcTotalWithTax(100000); // 112000

// Penanganan error form pada TanStack Form
<TextInput
  statusVariant="tooltip"
  status={getFieldError(field.state.meta.errors, field.state.meta.isTouched)}
/>
```
