import * as v from "valibot";

export const poItemSchema = v.object({
  item_id: v.pipe(v.string(), v.nonEmpty("Material harus dipilih.")),
  vendor_id: v.pipe(v.string(), v.nonEmpty("Vendor harus dipilih.")),
  item_price_id: v.pipe(v.string(), v.nonEmpty("Variasi harga harus dipilih.")),
  qty: v.pipe(v.number(), v.minValue(0.000001, "Volume tidak valid.")),
});

export type POItemFormValues = v.InferOutput<typeof poItemSchema>;
