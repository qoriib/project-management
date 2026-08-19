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

// ── Date ─────────────────────────────────────────────────────────────────────

export function toISODate(date: Date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export function todayISO(): string {
  return toISODate(new Date());
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

export const SATUAN_OPTIONS = [
  "m3",
  "Kg",
  "Batang",
  "Liter",
  "Rol",
  "Pcs",
  "Sak",
  "Unit",
  "Hari",
  "Ls",
  "Jam",
  "Rit",
];

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
