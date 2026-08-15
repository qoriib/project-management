import * as v from "valibot";

// ── Valibot Schema ─────────────────────────────────────────────────────────────

export const deliverySchema = v.object({
  poId: v.pipe(v.string(), v.nonEmpty("PO harus dipilih.")),
  deliveryDate: v.pipe(v.string(), v.nonEmpty("Tanggal kirim harus diisi.")),
  items: v.pipe(
    v.array(
      v.pipe(
        v.object({
          po_item_id: v.number(),
          item_name: v.string(),
          unit: v.string(),
          sisa: v.number(),
          qty: v.number(),
        }),
        v.custom((item: unknown) => {
          const i = item as { qty: number; sisa: number };
          return i.qty <= i.sisa;
        }, "Volume melebihi sisa PO.")
      )
    ),
    v.custom(
      (items: unknown) => (items as { qty: number }[]).some((it) => it.qty > 0),
      "Minimal ada 1 item yang diterima."
    )
  ),
});

// ── Types ──────────────────────────────────────────────────────────────────────

/** Satu baris item delivery dalam form */
export type DeliveryItemRow = {
  po_item_id: number;
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

// ── Label Helpers ──────────────────────────────────────────────────────────────

/** Format label PO untuk selector: "PO-0001 (Vendor A)" */
export function formatPOLabel(poId: number, vendorNames?: string): string {
  return `PO-${String(poId).padStart(4, "0")} (${vendorNames || "Tidak ada vendor"})`;
}
