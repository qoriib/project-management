import * as v from "valibot";
import type { OrderItemDetail } from "@/db/repositories";

export const orderItemSchema = v.object({
  item_id: v.pipe(v.string(), v.nonEmpty("Material harus dipilih.")),
  item_price_id: v.pipe(v.string(), v.nonEmpty("Variasi harga harus dipilih.")),
  qty: v.pipe(v.number(), v.minValue(0.000001, "Volume tidak valid.")),
  vendor_id: v.pipe(v.string(), v.nonEmpty("Vendor harus dipilih.")),
  has_tax: v.boolean(),
});

export type OrderItemFormValues = v.InferOutput<typeof orderItemSchema>;

export function buildDefaultValues(initialData?: Partial<OrderItemDetail>): OrderItemFormValues {
  return {
    item_id: initialData?.item_id ?? "",
    item_price_id: initialData?.item_price_id ?? "",
    qty: initialData?.qty ?? 0,
    vendor_id: initialData?.vendor_id ?? "",
    has_tax: Boolean(initialData?.has_tax),
  };
}
