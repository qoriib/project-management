import * as v from "valibot";

const itemRowSchema = v.object({
  po_item_id: v.number(),
  item_id: v.nullable(v.number()),
  item_name: v.string(),
  unit: v.string(),
  sisa: v.number(),
  qty: v.number(),
});

function itemQtyDoesNotExceedSisa(item: unknown): boolean {
  const row = item as { qty: number; sisa: number };
  return row.qty <= row.sisa;
}

function atLeastOneItemReceived(items: unknown): boolean {
  const rows = items as { qty: number }[];
  return rows.some((it) => it.qty > 0);
}

export const deliverySchema = v.object({
  poId: v.pipe(v.string(), v.nonEmpty("PO harus dipilih.")),
  deliveryDate: v.pipe(v.string(), v.nonEmpty("Tanggal kirim harus diisi.")),
  items: v.pipe(
    v.array(
      v.pipe(
        itemRowSchema,
        v.custom(itemQtyDoesNotExceedSisa, "Volume melebihi sisa PO.")
      )
    ),
    v.custom(atLeastOneItemReceived, "Minimal ada 1 item yang diterima.")
  ),
});

/** Satu baris item delivery dalam form */
export type DeliveryItemRow = {
  po_item_id: number;
  item_id: number | null;
  item_name: string;
  unit: string;
  sisa: number;
  qty: number;
};

export type DeliveryFormValues = {
  poId: string;
  deliveryDate: string;
  items: DeliveryItemRow[];
};

export interface DeliveryFormProps {
  initialPoId?: string;
  initialEditId?: number;
  onSuccess: (poId: number) => void;
  onCancel: () => void;
}

/** Format label PO untuk selector: "PO-0001 (Vendor A)" */
export function formatPOLabel(poId: number, vendorNames?: string): string {
  const paddedId = String(poId).padStart(4, "0");
  const vendor = vendorNames || "Tidak ada vendor";
  return `PO-${paddedId} (${vendor})`;
}
