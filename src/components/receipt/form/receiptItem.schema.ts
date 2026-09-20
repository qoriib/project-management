import * as v from "valibot";
import { parseDecimalInput } from "@/utils/formatters";
import type { ReceiptItemDetail } from "@/db/repositories";

export const receiptItemSchema = v.object({
  order_item_id: v.pipe(v.string("Item pesanan wajib dipilih."), v.nonEmpty("Item pesanan wajib dipilih.")),
  item_price_id: v.pipe(v.string("Pilih harga terlebih dahulu."), v.nonEmpty("Pilih harga terlebih dahulu.")),
  qty: v.pipe(
    v.union([v.string(), v.number()]),
    v.check((val) => parseDecimalInput(val) > 0, "Volume diterima harus lebih dari 0."),
  ),
  has_tax: v.boolean(),
});

export type ReceiptItemFormValues = v.InferOutput<typeof receiptItemSchema>;

export function buildDefaultValues(initialData?: Partial<ReceiptItemDetail>): ReceiptItemFormValues {
  return {
    order_item_id: initialData?.order_item_id ?? "",
    item_price_id: initialData?.item_price_id ?? "",
    qty: initialData?.qty != null ? String(initialData.qty).replace(".", ",") : "",
    has_tax: Boolean(initialData?.has_tax),
  };
}
