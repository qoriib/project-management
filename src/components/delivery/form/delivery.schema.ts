import * as v from "valibot";

const itemRowSchema = v.object({
  delivered: v.number(),
  item_id: v.nullable(v.string()),
  item_name: v.string(),
  ordered: v.number(),
  po_item_id: v.string(),
  qty: v.number(),
  remaining: v.number(),
  unit: v.string(),
});

function atLeastOneItemReceived(items: unknown): boolean {
  const rows = items as { qty: number }[];
  return rows.some((it) => it.qty > 0);
}

export const deliverySchema = v.object({
  delivery_code: v.pipe(v.string(), v.nonEmpty("Kode Penerimaan harus diisi.")),
  delivery_date: v.pipe(v.string(), v.nonEmpty("Tanggal kirim harus diisi.")),
  items: v.pipe(
    v.array(itemRowSchema),
    v.custom(atLeastOneItemReceived, "Minimal ada 1 item yang diterima."),
  ),
  po_id: v.pipe(v.string(), v.nonEmpty("PO harus dipilih.")),
});

/** Satu baris item delivery dalam form */
export interface DeliveryItemRow extends Record<string, unknown> {
  po_item_id: string;
  item_id: string | null;
  item_name: string;
  category_prefix?: string | null;
  category_code?: string | null;
  item_code?: string | null;
  price?: number;
  item_price_id?: string | null;
  unit: string;
  remaining: number;
  qty: number;
  ordered: number;
  delivered: number;
}

export interface DeliveryFormValues {
  po_id: string;
  delivery_code: string;
  delivery_date: string;
  items: DeliveryItemRow[];
}

export interface DeliveryFormProps {
  initialPoId?: string;
  initialEditId?: string;
  onSuccess: (poId: string) => void;
  onCancel: () => void;
}
