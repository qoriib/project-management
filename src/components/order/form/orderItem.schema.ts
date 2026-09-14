import * as v from "valibot";
import { parseDecimalInput } from "@/utils/formatters";
import type { OrderItemDetail } from "@/db/repositories";

export const orderItemSchema = v.object({
  requirement_group_id: v.pipe(
    v.string("Kelompok pekerjaan wajib dipilih."),
    v.nonEmpty("Kelompok pekerjaan wajib dipilih."),
  ),
  item_id: v.pipe(v.string(), v.nonEmpty("Item harus dipilih.")),
  item_price_id: v.pipe(v.string(), v.nonEmpty("Variasi harga harus dipilih.")),
  qty: v.pipe(
    v.union([v.string(), v.number()]),
    v.check((val) => parseDecimalInput(val) > 0, "Volume tidak valid."),
  ),
  vendor_id: v.pipe(v.string(), v.nonEmpty("Vendor harus dipilih.")),
  has_tax: v.boolean(),
});

export type OrderItemFormValues = v.InferOutput<typeof orderItemSchema>;

export function buildDefaultValues(
  initialData?: Partial<OrderItemDetail>,
  defaultRequirementGroupId?: string,
): OrderItemFormValues {
  return {
    item_id: initialData?.item_id ?? "",
    item_price_id: initialData?.item_price_id ?? "",
    requirement_group_id: initialData?.requirement_group_id || defaultRequirementGroupId || "",
    qty: initialData?.qty != null ? String(initialData.qty).replace(".", ",") : "",
    vendor_id: initialData?.vendor_id ?? "",
    has_tax: Boolean(initialData?.has_tax),
  };
}
