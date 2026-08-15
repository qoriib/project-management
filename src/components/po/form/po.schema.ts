import * as v from "valibot";

const poItemSchema = v.object({
  po_item_id: v.number(),
  item_id: v.pipe(v.number(), v.minValue(1, "Material harus dipilih.")),
  vendor_id: v.pipe(v.string(), v.nonEmpty("Vendor harus dipilih.")),
  item_price_id: v.pipe(v.string(), v.nonEmpty("Variasi harga harus dipilih.")),
  qty: v.pipe(v.number(), v.minValue(0.001, "Volume tidak valid.")),
});

export const poSchema = v.object({
  po_date: v.pipe(v.string(), v.nonEmpty("Tanggal PO harus diisi.")),
  items: v.pipe(
    v.array(poItemSchema),
    v.minLength(1, "Minimal 1 item harus dipesan.")
  ),
});

/** Single PO item row in table (resolved with BOM & price data) */
export type POItemRow = {
  id: string;
  po_item_id: number;
  item_id: number;
  vendor_id: string;
  item_price_id: string;
  qty: number;
  item_name: string;
  unit: string;
  price: number;
  planned_volume: number;
  total_ordered: number;
  original_qty: number;
  initial_balance: number;
};

/** Default shape of form item value */
export type POFormItemValue = {
  po_item_id: number;
  item_id: number;
  vendor_id: string;
  item_price_id: string;
  qty: number;
  original_qty?: number;
};

export type POFormValues = {
  po_date: string;
  items: POFormItemValue[];
};
