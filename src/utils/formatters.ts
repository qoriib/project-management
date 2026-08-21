// ── Currency ──────────────────────────────────────────────────────────────────

export function formatNumber(value: number | undefined | null, decimals = 2): string {
  if (value === undefined || value === null || isNaN(value)) {
    return "0";
  }
  return new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: decimals,
    minimumFractionDigits: 0,
  }).format(value);
}
// ── PIN ───────────────────────────────────────────────────────────────────────

export const sanitizePin = (val?: string) => (val || "").replaceAll(/\D/g, "").slice(0, 6);

// ── Date ─────────────────────────────────────────────────────────────────────

export function toISODate(date: Date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export function todayISO(): string {
  return toISODate(new Date());
}

export function getTimestampString(date: Date = new Date()): string {
  return `${date.getFullYear().toString()}-${(date.getMonth() + 1).toString().padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}_${date.getHours().toString().padStart(2, "0")}-${date.getMinutes().toString().padStart(2, "0")}-${date.getSeconds().toString().padStart(2, "0")}`;
}

// ── Item Code ─────────────────────────────────────────────────────────────────

export interface ItemCodeParts {
  category_prefix?: string | null;
  category_code?: string | null;
  item_code?: string | null;
}

export function formatItemCode(parts?: ItemCodeParts | null): string {
  if (!parts) return "";
  return `${parts.category_prefix ?? ""} ${parts.category_code ?? ""} ${parts.item_code ?? ""}`.trim();
}

// ── Code / ID Generators ──────────────────────────────────────────────────────

/**
 * Menghasilkan nomor urut kode berikutnya dari daftar kode yang ada dengan default padding 5 digit.
 * Contoh:
 * - generateNextCode(["00001", "00002"]) => "00003"
 * - generateNextCode(["PO-00001", "PO-00002"], "PO-") => "PO-00003"
 * - generateNextCode(["NP-00001"], "NP-") => "NP-00002"
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

// ── PPN ───────────────────────────────────────────────────────────────────────

export function calcPPN(subtotal: number, persen: number = 12): number {
  return subtotal * (persen / 100);
}

export function calcTotal(subtotal: number, ppnPersen: number = 12): number {
  return subtotal + calcPPN(subtotal, ppnPersen);
}

// ── Category Labels ───────────────────────────────────────────────────────────

export const KATEGORI_LABELS: Record<string, string> = {
  ALAT: "Sewa Alat",
  "ATK/K3": "ATK / Peralatan K3",
  BETON: "Beton Ready Mix",
  MATERIAL: "Material Umum",
  SOLAR: "Solar",
};

export const KATEGORI_OPTIONS = Object.entries(KATEGORI_LABELS).map(([value, label]) => ({
  label,
  value,
}));

export const SATUAN_OPTIONS = ["m3", "Kg", "Batang", "Liter", "Rol", "Pcs", "Sak", "Unit", "Hari", "Ls", "Jam", "Rit"];

export const VENDOR_TIPE_LABELS: Record<string, string> = {
  EQUIPMENT_RENTAL: "Equipment Rental",
  MATERIAL_SUPPLIER: "Material Supplier",
  STORE: "Toko Umum",
};

export const VENDOR_TIPE_OPTIONS = Object.entries(VENDOR_TIPE_LABELS).map(([value, label]) => ({
  label,
  value,
}));

export const STATUS_PO_LABELS: Record<string, string> = {
  aktif: "Aktif",
  dibatalkan: "Dibatalkan",
  selesai: "Selesai",
};

export const STATUS_INVOICE_LABELS: Record<string, string> = {
  PAID: "Lunas",
  PARTIAL: "Sebagian",
  UNPAID: "Belum Bayar",
};

export const STATUS_INVOICE_COLORS = {
  PAID: "success",
  PARTIAL: "warning",
  UNPAID: "error",
} as const;
