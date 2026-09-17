import * as v from "valibot";
import { todayISO } from "@/utils/formatters";

export const receiptSchema = v.object({
  receipt_code: v.pipe(v.string(), v.nonEmpty("Nomor Penerimaan harus diisi.")),
  receipt_date: v.pipe(v.string(), v.nonEmpty("Tanggal Penerimaan harus diisi.")),
  order_id: v.string(),
  items: v.array(v.any()),
});

import type { ReceiptItemDetail } from "@/store/useReceiptStore";

/** Satu baris item receipt dalam form */
export type ReceiptItemRow = ReceiptItemDetail;

export interface ReceiptFormValues {
  order_id: string;
  receipt_code: string;
  receipt_date: string;
  items: ReceiptItemRow[];
}

export interface ReceiptFormProps {
  receiptId: string;
  onSuccess?: (poId: string) => void;
}

export function buildDefaultValues(data?: Partial<ReceiptFormValues> | null): ReceiptFormValues {
  return {
    order_id: data?.order_id ?? "",
    receipt_code: data?.receipt_code ?? "",
    receipt_date: data?.receipt_date ?? todayISO(),
    items: data?.items ?? [],
  };
}
