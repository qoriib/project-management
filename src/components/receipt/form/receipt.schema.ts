import * as v from "valibot";
import { parseDecimalInput, todayISO } from "@/utils/formatters";

const itemRowSchema = v.object({
  delivered: v.number(),
  item_id: v.nullable(v.string()),
  item_name: v.string(),
  ordered: v.number(),
  order_item_id: v.string(),
  qty: v.union([v.string(), v.number()]),
  remaining: v.number(),
  unit: v.string(),
});

function atLeastOneItemReceived(items: unknown): boolean {
  const rows = items as { qty: string | number }[];
  return rows.some((it) => parseDecimalInput(it.qty) > 0);
}

export const receiptSchema = v.object({
  receipt_code: v.pipe(v.string(), v.nonEmpty("Kode Penerimaan harus diisi.")),
  receipt_date: v.pipe(v.string(), v.nonEmpty("Tanggal kirim harus diisi.")),
  items: v.pipe(v.array(itemRowSchema), v.custom(atLeastOneItemReceived, "Minimal ada 1 item yang diterima.")),
  order_id: v.pipe(v.string(), v.nonEmpty("Order harus dipilih.")),
});

/** Satu baris item receipt dalam form */
export interface ReceiptItemRow extends Record<string, unknown> {
  order_item_id: string;
  item_id: string | null;
  item_name: string;
  category_prefix?: string | null;
  category_code?: string | null;
  item_code?: string | null;
  price?: number;
  item_price_id?: string | null;
  unit: string;
  remaining: number;
  qty: string | number;
  ordered: number;
  delivered: number;
}

export interface ReceiptFormValues {
  order_id: string;
  receipt_code: string;
  receipt_date: string;
  items: ReceiptItemRow[];
}

export interface ReceiptFormProps {
  initialPoId?: string;
  initialEditId?: string;
  onSuccess: (poId: string) => void;
  onCancel: () => void;
}

export function buildDefaultValues(
  data?: Partial<ReceiptFormValues> | null,
  nextReceiptCode = "",
  initialPoId = "",
): ReceiptFormValues {
  return {
    order_id: data?.order_id ?? initialPoId ?? "",
    receipt_code: data?.receipt_code ?? nextReceiptCode,
    receipt_date: data?.receipt_date ?? todayISO(),
    items: data?.items ?? [],
  };
}
