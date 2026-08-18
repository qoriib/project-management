import * as v from "valibot";

const itemRowSchema = v.object({
  po_item_id: v.string(),
  item_id: v.nullable(v.string()),
  item_name: v.string(),
  unit: v.string(),
  remaining: v.number(),
  qty: v.number(),
  ordered: v.number(),
  delivered: v.number(),
});

function itemQtyDoesNotExceedRemaining(item: unknown): boolean {
  const row = item as { qty: number; remaining: number };
  return row.qty <= row.remaining;
}

function atLeastOneItemReceived(items: unknown): boolean {
  const rows = items as { qty: number }[];
  return rows.some((it) => it.qty > 0);
}

export const deliverySchema = v.object({
  po_id: v.pipe(v.string(), v.nonEmpty("PO harus dipilih.")),
  delivery_code: v.pipe(v.string(), v.nonEmpty("Kode pengiriman harus diisi.")),
  delivery_date: v.pipe(v.string(), v.nonEmpty("Tanggal kirim harus diisi.")),
  items: v.pipe(
    v.array(
      v.pipe(
        itemRowSchema,
        v.custom(itemQtyDoesNotExceedRemaining, "Volume melebihi sisa PO.")
      )
    ),
    v.custom(atLeastOneItemReceived, "Minimal ada 1 item yang diterima.")
  ),
});

/** Satu baris item delivery dalam form */
export type DeliveryItemRow = {
  po_item_id: string;
  item_id: string | null;
  item_name: string;
  unit: string;
  remaining: number;
  qty: number;
  ordered: number;
  delivered: number;
};

export type DeliveryFormValues = {
  po_id: string;
  delivery_code: string;
  delivery_date: string;
  items: DeliveryItemRow[];
};

export interface DeliveryFormProps {
  initialPoId?: string;
  initialEditId?: string;
  onSuccess: (poId: string) => void;
  onCancel: () => void;
}
