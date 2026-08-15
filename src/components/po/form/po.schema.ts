import * as v from "valibot";

// ── Valibot Schema ─────────────────────────────────────────────────────────────

export const poSchema = v.object({
  poDate: v.pipe(v.string(), v.nonEmpty("Tanggal PO harus diisi.")),
  items: v.pipe(
    v.array(
      v.object({
        po_item_id: v.number(),
        item_id: v.pipe(v.number(), v.minValue(1, "Material harus dipilih.")),
        vendor_id: v.pipe(v.string(), v.nonEmpty("Vendor harus dipilih.")),
        item_price_id: v.pipe(v.string(), v.nonEmpty("Pilih variasi harga.")),
        qty: v.pipe(v.number(), v.minValue(0.001, "Volume tidak valid.")),
      })
    ),
    v.minLength(1, "Minimal harus ada 1 item yang dipesan.")
  ),
});

// ── Types ──────────────────────────────────────────────────────────────────────

/** Satu baris item dalam tabel PO (sudah di-resolve dengan data BOM & harga) */
export type POItemRow = {
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
  /** Sisa BOM yang bisa dipesan = planned_volume - total_ordered + original_qty */
  sisaAwal: number;
} & Record<string, unknown>;

/** Shape dari default values form */
export type POFormItemValue = {
  po_item_id: number;
  item_id: number;
  vendor_id: string;
  item_price_id: string;
  qty: number;
  original_qty?: number;
};

export type POFormValues = {
  poDate: string;
  items: POFormItemValue[];
};
