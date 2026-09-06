/**
 * calc.ts — Utilitas Kalkulasi Transaksi
 *
 * Satu-satunya sumber kebenaran untuk semua perhitungan transaksi di project ini:
 * DPP (subtotal), PPN (pajak), total, grand total, dan konversi has_tax.
 *
 * Selalu gunakan fungsi di sini; JANGAN hardcode 0.12 / 1.12 / APP.taxRatio
 * secara langsung di komponen maupun service.
 *
 * @module calc
 */

import { APP } from "@/configs/app.config";

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────

/** Representasi satu baris transaksi yang memiliki qty, price, dan flag pajak */
export interface CalcLineItem {
  qty?: number | null;
  price?: number | null;
  has_tax?: boolean | null;
}

/** Hasil breakdown kalkulasi satu baris item */
export interface LineCalcResult {
  /** Dasar Pengenaan Pajak = qty × price */
  dpp: number;
  /** Nominal PPN */
  tax: number;
  /** Total = DPP + PPN */
  total: number;
}

// ─────────────────────────────────────────────────────────
// Konstanta
// ─────────────────────────────────────────────────────────

/**
 * Rasio PPN yang berlaku, diambil dari konfigurasi APP.
 * Gunakan ini sebagai referensi tampilan (misal untuk header kolom).
 *
 * @example `PPn (${TAX_RATIO_PERCENT}%)`  →  "PPn (12%)"
 */
export const TAX_RATIO = APP.taxRatio;

/** Persentase PPN dalam bilangan bulat, berguna untuk label UI */
export const TAX_RATIO_PERCENT = APP.taxRatio * 100;

// ─────────────────────────────────────────────────────────
// Kalkulasi Baris (Line-Level)
// ─────────────────────────────────────────────────────────

/**
 * Menghitung DPP (Dasar Pengenaan Pajak) = qty × price.
 *
 * @param qty   - Kuantitas / volume item
 * @param price - Harga satuan item
 * @returns Nilai DPP (tidak termasuk pajak)
 *
 * @example calcDPP(10, 50000) // 500000
 */
export function calcDPP(qty: number | null | undefined, price: number | null | undefined): number {
  return (qty ?? 0) * (price ?? 0);
}

/**
 * Menghitung nominal PPN dari nilai DPP.
 *
 * @param dpp     - Dasar Pengenaan Pajak
 * @param hasTax  - Apakah dikenakan pajak
 * @returns Nominal PPN (0 jika hasTax = false)
 *
 * @example calcTax(500000, true)  // 60000
 * @example calcTax(500000, false) // 0
 */
export function calcTax(dpp: number, hasTax: boolean | null | undefined): number {
  if (!hasTax) return 0;
  return dpp * TAX_RATIO;
}

/**
 * Menghitung total baris = DPP + PPN.
 *
 * @param dpp    - Dasar Pengenaan Pajak
 * @param hasTax - Apakah dikenakan pajak
 * @returns Total nilai baris setelah pajak
 *
 * @example calcLineTotal(500000, true)  // 560000
 * @example calcLineTotal(500000, false) // 500000
 */
export function calcLineTotal(dpp: number, hasTax: boolean | null | undefined): number {
  return dpp + calcTax(dpp, hasTax);
}

/**
 * Menghitung breakdown lengkap (DPP, PPN, Total) untuk satu baris item.
 *
 * @param qty    - Kuantitas / volume
 * @param price  - Harga satuan
 * @param hasTax - Apakah dikenakan pajak
 * @returns `{ dpp, tax, total }`
 *
 * @example
 * ```ts
 * calcLine(10, 50000, true)
 * // { dpp: 500000, tax: 60000, total: 560000 }
 * ```
 */
export function calcLine(
  qty: number | null | undefined,
  price: number | null | undefined,
  hasTax: boolean | null | undefined,
): LineCalcResult {
  const dpp = calcDPP(qty, price);
  const tax = calcTax(dpp, hasTax);
  return { dpp, tax, total: dpp + tax };
}

/**
 * Shortcut: hitung breakdown dari objek baris item.
 *
 * @param item - Objek yang memiliki `qty`, `price`, dan `has_tax`
 * @returns `{ dpp, tax, total }`
 *
 * @example
 * ```ts
 * calcLineItem({ qty: 10, price: 50000, has_tax: true })
 * // { dpp: 500000, tax: 60000, total: 560000 }
 * ```
 */
export function calcLineItem(item: CalcLineItem): LineCalcResult {
  return calcLine(item.qty, item.price, item.has_tax);
}

// ─────────────────────────────────────────────────────────
// Kalkulasi Koleksi (Collection-Level)
// ─────────────────────────────────────────────────────────

/**
 * Menghitung grand total dari sekumpulan baris item.
 * Menggunakan nilai `estimated_total` / `total_price` jika sudah tersedia di baris.
 *
 * @param items - Array baris yang memiliki `qty`, `price`, `has_tax`,
 *                dan opsional field pre-kalkulasi (`estimated_total` / `total_price`)
 * @returns Grand total (DPP + PPN seluruh baris)
 *
 * @example
 * ```ts
 * calcGrandTotal([
 *   { qty: 5, price: 10000, has_tax: true  },  // 50000 + 6000 = 56000
 *   { qty: 2, price: 20000, has_tax: false },  // 40000
 * ])
 * // 96000
 * ```
 */
export function calcGrandTotal(
  items: (CalcLineItem & { estimated_total?: number | null; total_price?: number | null })[],
): number {
  let grand = 0;
  for (const item of items) {
    const preCalc = item.estimated_total ?? item.total_price;
    if (preCalc != null) {
      grand += preCalc;
    } else {
      grand += calcLineTotal(calcDPP(item.qty, item.price), item.has_tax);
    }
  }
  return grand;
}

/**
 * Menghitung selisih varians biaya anggaran (anggaran - realisasi).
 * Nilai positif menandakan surplus/hemat, negatif menandakan defisit/over-budget.
 *
 * @param plannedBudget - Nilai pagu anggaran yang direncanakan
 * @param actualCost    - Nilai realisasi biaya pesanan
 * @returns Nilai varians (anggaran - realisasi)
 *
 * @example
 * ```ts
 * calcVariance(100000, 80000)  // 20000 (surplus)
 * calcVariance(100000, 120000) // -20000 (defisit/over)
 * ```
 */
export function calcVariance(plannedBudget: number | null | undefined, actualCost: number | null | undefined): number {
  return (plannedBudget ?? 0) - (actualCost ?? 0);
}

/**
 * Menghitung rasio pemenuhan atau persentase realisasi.
 *
 * @param actual  - Nilai realisasi aktual (volume atau biaya)
 * @param planned - Nilai rencana / pagu pembanding
 * @returns Nilai rasio desimal (0 jika planned kosong/nol)
 *
 * @example
 * ```ts
 * calcRatio(50, 100) // 0.5 (50%)
 * calcRatio(10, 0)   // 0
 * ```
 */
export function calcRatio(actual: number | null | undefined, planned: number | null | undefined): number {
  if (!planned || planned <= 0) return 0;
  return (actual ?? 0) / planned;
}
