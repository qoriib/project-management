/**
 * Utilitas Pemformatan, Sanitasi, dan Parsing Data
 *
 * Berisi fungsi-fungsi murni untuk pemformatan angka lokal Indonesia (`id-ID`),
 * sanitasi input desimal & PIN, pembuatan kode urut otomatis, dan manipulasi tanggal ISO.
 */

/**
 * Memformat angka ke dalam format pemisah ribuan dan desimal standar lokal Indonesia (`id-ID`).
 *
 * @param value - Angka yang akan diformat
 * @param decimals - Jumlah maksimum digit desimal (wajib ditentukan)
 * @returns String angka terformat (e.g. "1.500.000,5")
 *
 * @example
 * ```ts
 * formatNumber(1500000, 2); // "1.500.000"
 * formatNumber(12.345678, 2); // "12,35"
 * formatNumber(12.345678, 5); // "12,34568"
 * formatNumber(null, 2); // "0"
 * ```
 */
export function formatNumber(value: number | undefined | null, decimals: number): string {
  if (value === undefined || value === null || isNaN(value)) {
    return "0";
  }
  return new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: decimals,
    minimumFractionDigits: 0,
  }).format(value);
}

/**
 * Membersihkan input PIN sehingga hanya berisi karakter angka (0-9) dan memotong ke panjang maksimal.
 *
 * @param val - Nilai input PIN mentah
 * @param maxLength - Panjang maksimum PIN (default: 6)
 * @returns String digit angka bersih
 *
 * @example
 * ```ts
 * sanitizePin("12a34b5678"); // "123456"
 * ```
 */
export function sanitizePin(val?: string | null, maxLength = 6): string {
  return (val || "").replace(/\D/g, "").slice(0, maxLength);
}

/**
 * Membersihkan dan menormalisasi string input desimal untuk pasar Indonesia:
 * - Mengubah titik (.) menjadi koma (,).
 * - Menghapus karakter selain angka dan koma.
 * - Memastikan hanya ada maksimal 1 tanda koma desimal.
 *
 * @param val - Nilai input teks mentah dari pengguna
 * @returns String input desimal yang aman
 *
 * @example
 * ```ts
 * sanitizeDecimalInput("12.5"); // "12,5"
 * sanitizeDecimalInput("12,,5.4"); // "12,54"
 * ```
 */
export function sanitizeDecimalInput(val?: string | null): string {
  if (!val) return "";
  const normalized = val.replace(/\./g, ",");
  const cleaned = normalized.replace(/[^0-9,]/g, "");
  const parts = cleaned.split(",");
  if (parts.length > 1) {
    return parts[0] + "," + parts.slice(1).join("");
  }
  return cleaned;
}

/**
 * Mem-parsing nilai desimal bertipe string (berisi koma/titik) atau number menjadi angka bertipe float murni.
 *
 * @param val - Nilai string atau number yang akan di-parse
 * @returns Nilai float numerik yang valid (0 jika kosong atau tidak valid)
 *
 * @example
 * ```ts
 * parseDecimalInput("1.250,5"); // 1.250 (tanpa titik ribuan) -> "1250,5" -> 1250.5
 * parseDecimalInput("12,5"); // 12.5
 * parseDecimalInput(null); // 0
 * ```
 */
export function parseDecimalInput(val?: string | number | null): number {
  if (val === undefined || val === null || val === "") return 0;
  if (typeof val === "number") return isNaN(val) ? 0 : val;
  const normalized = String(val).replace(",", ".");
  const num = parseFloat(normalized);
  return isNaN(num) ? 0 : num;
}

/**
 * Mengubah objek Date atau string tanggal ke string tanggal ISO format `YYYY-MM-DD`.
 *
 * @param date - Objek Date atau string tanggal (default: saat ini)
 * @returns String tanggal format `YYYY-MM-DD` atau `"-"` jika kosong / tidak valid
 *
 * @example
 * ```ts
 * toISODate(new Date(2026, 7, 24)); // "2026-08-24"
 * toISODate("2026-08-24T10:00:00Z"); // "2026-08-24"
 * toISODate("2026-08-24"); // "2026-08-24"
 * toISODate(null); // "-"
 * ```
 */
export function toISODate(date: Date | string | null | undefined = new Date()): string {
  if (!date) return "-";
  if (typeof date === "string") {
    if (/^\d{4}-\d{2}-\d{2}/.test(date)) {
      return date.slice(0, 10);
    }
    const parsed = new Date(date);
    if (!isNaN(parsed.getTime())) {
      const y = parsed.getFullYear();
      const m = String(parsed.getMonth() + 1).padStart(2, "0");
      const d = String(parsed.getDate()).padStart(2, "0");
      return `${y}-${m}-${d}`;
    }
    return date;
  }
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Mendapatkan tanggal hari ini dalam format ISO string `YYYY-MM-DD`.
 *
 * @returns String tanggal hari ini format `YYYY-MM-DD`
 */
export function todayISO(): string {
  return toISODate(new Date());
}

/**
 * Menghasilkan string timestamp untuk penamaan file ekspor / backup dengan format `YYYYMMDD_HHmmss`.
 *
 * @param date - Objek Date sumber (default: saat ini)
 * @returns String timestamp (e.g. `20260902_204116`)
 *
 * @example
 * ```ts
 * getTimestampString(); // "20260902_204116"
 * ```
 */
export function getTimestampString(date: Date = new Date()): string {
  const yyyy = date.getFullYear().toString();
  const MM = (date.getMonth() + 1).toString().padStart(2, "0");
  const dd = date.getDate().toString().padStart(2, "0");
  const hh = date.getHours().toString().padStart(2, "0");
  const mm = date.getMinutes().toString().padStart(2, "0");
  const ss = date.getSeconds().toString().padStart(2, "0");

  return `${yyyy}${MM}${dd}_${hh}${mm}${ss}`;
}

/**
 * Menormalkan string agar aman untuk penamaan file tanpa tanda baca atau karakter khusus.
 *
 * @param name - String nama yang ingin dinormalisasi
 * @returns String nama file yang bersih (hanya karakter alfanumerik dan pemisah underscore)
 */
export function sanitizeFilename(name: string): string {
  return (
    name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "") || "Proyek"
  );
}

/** Struktur bagian-bagian kode item untuk pembentukan kode lengkap */
export interface ItemCodeParts {
  category_prefix?: string | null;
  category_code?: string | null;
  item_code?: string | null;
}

/**
 * Menggabungkan bagian prefix kategori, kode kategori, dan kode item menjadi satu kode terformat.
 *
 * @param parts - Objek bagian kode item
 * @returns String kode item terformat (e.g. "MAT 01 0001")
 *
 * @example
 * ```ts
 * formatItemCode({ category_prefix: "MAT", category_code: "01", item_code: "0001" }); // "MAT 01 0001"
 * ```
 */
export function formatItemCode(parts?: ItemCodeParts | null): string {
  if (!parts) return "";
  return `${parts.category_prefix ?? ""} ${parts.category_code ?? ""} ${parts.item_code ?? ""}`.trim();
}

/**
 * Menghasilkan nomor urut kode berikutnya dari daftar kode yang ada dengan default padding digit tertentu.
 *
 * @param existingCodes - Daftar kode yang sudah tersimpan
 * @param prefix - Awalan kode (e.g. "PO-", "NP-")
 * @param digits - Jumlah digit angka dengan zero-padding (default: 5)
 * @returns Kode urut baru berikutnya
 *
 * @example
 * ```ts
 * generateNextCode(["00001", "00002"]); // "00003"
 * generateNextCode(["PO-00001", "PO-00002"], "PO-"); // "PO-00003"
 * generateNextCode(["NP-00001"], "NP-"); // "NP-00002"
 * ```
 */
export function generateNextCode(
  existingCodes: (string | null | undefined)[],
  prefix: string = "",
  digits: number = 5,
): string {
  let maxNum = 0;

  for (const code of existingCodes) {
    if (!code) continue;
    const match = code.match(/(\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
  }

  const nextNum = maxNum + 1;
  return `${prefix}${nextNum.toString().padStart(digits, "0")}`;
}

/**
 * Menghasilkan string label periode dari rentang tanggal opsional.
 *
 * @param startDate - Tanggal mulai (ISO string, opsional)
 * @param endDate - Tanggal akhir (ISO string, opsional)
 * @returns Label periode yang siap ditampilkan
 *
 * @example
 * ```ts
 * formatPeriod("2026-01-01", "2026-12-31"); // "2026-01-01 s/d 2026-12-31"
 * formatPeriod("2026-01-01");               // "Mulai 2026-01-01"
 * formatPeriod(undefined, "2026-12-31");    // "Sampai 2026-12-31"
 * formatPeriod();                           // "Semua Periode"
 * ```
 */
export function formatPeriod(startDate?: string, endDate?: string): string {
  if (startDate && endDate) return `${startDate} s/d ${endDate}`;
  if (startDate) return `Mulai ${startDate}`;
  if (endDate) return `Sampai ${endDate}`;
  return "Semua Periode";
}

/**
 * Memformat kuantitas/volume barang dengan pemisah ribuan lokal Indonesia (`id-ID`).
 * Mengembalikan "-" jika nilai kosong, tidak valid, atau bernilai 0.
 *
 * @param value - Nilai kuantitas
 * @param decimals - Maksimum digit desimal (default: 2)
 * @returns String angka terformat atau "-"
 *
 * @example
 * ```ts
 * formatQty(1500); // "1.500"
 * formatQty(12.5, 2); // "12,5"
 * formatQty(0); // "-"
 * ```
 */
export function formatQty(value: number | null | undefined, decimals = 2): string {
  if (value === null || value === undefined || value === 0 || isNaN(value)) {
    return "-";
  }
  return formatNumber(value, decimals);
}

/**
 * Memformat rasio desimal ke string persentase lokal Indonesia (koma desimal).
 * Mengembalikan "-" jika nilai kosong, tidak valid, atau bernilai 0.
 *
 * @param value - Rasio desimal (e.g. 0.125 untuk 12.5%)
 * @param decimals - Jumlah digit desimal (default: 1)
 * @returns String persentase terformat (e.g. "12,5%") atau "-"
 *
 * @example
 * ```ts
 * formatPercentage(0.125); // "12,5%"
 * formatPercentage(1.0); // "100,0%"
 * formatPercentage(0); // "-"
 * ```
 */
export function formatPercentage(value: number | null | undefined, decimals = 1): string {
  if (value === null || value === undefined || value === 0 || isNaN(value)) {
    return "-";
  }
  const percentage = value * 100;
  return `${percentage.toFixed(decimals).replace(".", ",")}%`;
}

/**
 * Memformat tanggal ISO string atau objek Date menjadi format standar ISO `YYYY-MM-DD`.
 *
 * @param date - String tanggal ISO (e.g. "2026-09-06") atau objek Date
 * @returns String tanggal terformat format ISO `YYYY-MM-DD` atau "-" jika tidak valid
 *
 * @example
 * ```ts
 * formatDate("2026-09-06"); // "2026-09-06"
 * formatDate(new Date(2026, 8, 6)); // "2026-09-06"
 * formatDate(null); // "-"
 * ```
 */
export function formatDate(date?: Date | string | null): string {
  if (!date) return "-";
  return toISODate(date);
}
