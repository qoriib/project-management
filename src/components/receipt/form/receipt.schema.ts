import * as v from "valibot";
import { todayISO } from "@/utils/formatters";

export const receiptSchema = v.object({
  receipt_code: v.pipe(v.string(), v.nonEmpty("Nomor Penerimaan harus diisi.")),
  receipt_date: v.pipe(v.string(), v.nonEmpty("Tanggal Penerimaan harus diisi.")),
  order_id: v.string(),
  items: v.array(v.any()),
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
  receiptId: string;
  onSuccess: (poId: string) => void;
}

export function buildDefaultValues(data?: Partial<ReceiptFormValues> | null): ReceiptFormValues {
  return {
    order_id: data?.order_id ?? "",
    receipt_code: data?.receipt_code ?? "",
    receipt_date: data?.receipt_date ?? todayISO(),
    items: data?.items ?? [],
  };
}
