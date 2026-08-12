// ── Currency ──────────────────────────────────────────────────────────────────

export function formatRupiah(value: number | undefined | null): string {
  if (value === undefined || value === null || isNaN(value)) return "Rp 0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number | undefined | null, decimals = 2): string {
  if (value === undefined || value === null || isNaN(value)) return "0";
  return new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(value);
}

// ── Date ─────────────────────────────────────────────────────────────────────

export function formatDate(iso: string | undefined | null): string {
  if (!iso) return "-";
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
}

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
  MATERIAL: "Material Umum",
  ALAT: "Sewa Alat",
  BETON: "Beton Ready Mix",
  SOLAR: "Solar",
  "ATK/K3": "ATK / Peralatan K3",
};

export const KATEGORI_OPTIONS = Object.entries(KATEGORI_LABELS).map(([value, label]) => ({
  value,
  label,
}));

export const SATUAN_OPTIONS = [
  "m3", "Kg", "Batang", "Liter", "Rol", "Pcs", "Sak", "Unit", "Hari", "Ls", "Jam", "Rit"
];

export const VENDOR_TIPE_LABELS: Record<string, string> = {
  MATERIAL_SUPPLIER: "Material Supplier",
  EQUIPMENT_RENTAL: "Equipment Rental",
  STORE: "Toko Umum",
};

export const VENDOR_TIPE_OPTIONS = Object.entries(VENDOR_TIPE_LABELS).map(([value, label]) => ({
  value,
  label,
}));

export const STATUS_PO_LABELS: Record<string, string> = {
  aktif: "Aktif",
  selesai: "Selesai",
  dibatalkan: "Dibatalkan",
};

export const STATUS_INVOICE_LABELS: Record<string, string> = {
  UNPAID: "Belum Bayar",
  PARTIAL: "Sebagian",
  PAID: "Lunas",
};

export const STATUS_INVOICE_COLORS = {
  UNPAID: "error",
  PARTIAL: "warning",
  PAID: "success",
} as const;
