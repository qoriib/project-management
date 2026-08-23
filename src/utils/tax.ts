/**
 * Utilitas Perhitungan Pajak Pertambahan Nilai (PPN)
 *
 * Mengelola kalkulasi nilai PPN (default 12%), total termasuk pajak,
 * dan kalkulasi Dasar Pengenaan Pajak (DPP).
 */

/** Tarif PPN default yang berlaku (12%) */
export const DEFAULT_PPN_PERCENT = 12;

/**
 * Menghitung nominal PPN dari nilai subtotal (DPP).
 *
 * @param subtotal - Nilai DPP / subtotal sebelum pajak
 * @param percent - Persentase PPN (default: 12)
 * @returns Nominal pajak PPN
 *
 * @example
 * ```ts
 * calcPPN(100000); // 12000
 * calcPPN(100000, 11); // 11000
 * ```
 */
export function calcPPN(subtotal: number, percent: number = DEFAULT_PPN_PERCENT): number {
  if (!subtotal || isNaN(subtotal) || subtotal <= 0) return 0;
  return subtotal * (percent / 100);
}

/**
 * Menghitung total akhir termasuk PPN (Subtotal + PPN).
 *
 * @param subtotal - Nilai DPP / subtotal sebelum pajak
 * @param percent - Persentase PPN (default: 12)
 * @returns Nilai total setelah ditambah PPN
 *
 * @example
 * ```ts
 * calcTotalWithTax(100000); // 112000
 * ```
 */
export function calcTotalWithTax(subtotal: number, percent: number = DEFAULT_PPN_PERCENT): number {
  if (!subtotal || isNaN(subtotal) || subtotal <= 0) return 0;
  return subtotal + calcPPN(subtotal, percent);
}

/**
 * Menghitung DPP dari nilai total yang sudah termasuk PPN (Gross).
 *
 * @param grossTotal - Nilai total yang sudah termasuk pajak
 * @param percent - Persentase PPN (default: 12)
 * @returns Nilai DPP sebelum pajak
 *
 * @example
 * ```ts
 * calcDppFromGross(112000); // 100000
 * ```
 */
export function calcDppFromGross(grossTotal: number, percent: number = DEFAULT_PPN_PERCENT): number {
  if (!grossTotal || isNaN(grossTotal) || grossTotal <= 0) return 0;
  return grossTotal / (1 + percent / 100);
}
