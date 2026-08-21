export function formatNumber(value: number | undefined | null, decimals = 5): string {
  if (value === undefined || value === null || isNaN(value)) {
    return "0";
  }
  return new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: decimals,
    minimumFractionDigits: 0,
  }).format(value);
}

export const sanitizePin = (val?: string) => (val || "").replaceAll(/\D/g, "").slice(0, 6);

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

export function parseDecimalInput(val?: string | number | null): number {
  if (val === undefined || val === null || val === "") return 0;
  if (typeof val === "number") return isNaN(val) ? 0 : val;
  const normalized = String(val).replace(",", ".");
  const num = parseFloat(normalized);
  return isNaN(num) ? 0 : num;
}

export function toISODate(date: Date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export function todayISO(): string {
  return toISODate(new Date());
}

export function getTimestampString(date: Date = new Date()): string {
  return `${date.getFullYear().toString()}-${(date.getMonth() + 1).toString().padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}_${date.getHours().toString().padStart(2, "0")}-${date.getMinutes().toString().padStart(2, "0")}-${date.getSeconds().toString().padStart(2, "0")}`;
}

export interface ItemCodeParts {
  category_prefix?: string | null;
  category_code?: string | null;
  item_code?: string | null;
}

export function formatItemCode(parts?: ItemCodeParts | null): string {
  if (!parts) return "";
  return `${parts.category_prefix ?? ""} ${parts.category_code ?? ""} ${parts.item_code ?? ""}`.trim();
}

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

export function calcPPN(subtotal: number, persen: number = 12): number {
  return subtotal * (persen / 100);
}

export function calcTotal(subtotal: number, ppnPersen: number = 12): number {
  return subtotal + calcPPN(subtotal, ppnPersen);
}
