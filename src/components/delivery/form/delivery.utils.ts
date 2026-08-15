import { purchaseOrderRepo, deliveryRepo } from "@/db/repositories";
import type { DeliveryItemRow } from "./delivery.schema";

// ── PO Items Loader ────────────────────────────────────────────────────────────

/**
 * Ambil item-item dari sebuah PO dan konversi ke shape DeliveryItemRow
 * dengan qty = 0 (mode tambah baru).
 */
export async function loadPOItemsAsDeliveryRows(
  poId: number
): Promise<DeliveryItemRow[]> {
  const poItems = await purchaseOrderRepo.findItems(poId);
  return poItems.map((i) => ({
    po_item_id: i.po_item_id,
    item_name: i.item_name ?? "",
    unit: i.unit ?? "",
    sisa: i.sisa ?? 0,
    qty: 0,
  }));
}

// ── Edit Data Loader ───────────────────────────────────────────────────────────

/**
 * Ambil data delivery yang ada (mode edit).
 * Mengembalikan header delivery (poId, deliveryDate) dan
 * item rows dengan sisa yang sudah dikembalikan (sisa + oldQty).
 */
export async function loadDeliveryEditData(deliveryId: number): Promise<{
  poId: string;
  deliveryDate: string;
  items: DeliveryItemRow[];
} | null> {
  const d = await deliveryRepo.findById(deliveryId);
  if (!d) return null;

  const [poItems, delivItems] = await Promise.all([
    purchaseOrderRepo.findItems(d.po_id),
    deliveryRepo.findItems(deliveryId),
  ]);

  const items: DeliveryItemRow[] = poItems.map((i) => {
    const existing = delivItems.find((di) => di.po_item_id === i.po_item_id);
    const oldQty = existing?.qty ?? 0;
    return {
      po_item_id: i.po_item_id,
      item_name: i.item_name ?? "",
      unit: i.unit ?? "",
      sisa: (i.sisa ?? 0) + oldQty, // kembalikan sisa yang sudah dipakai
      qty: oldQty,
    };
  });

  return {
    poId: String(d.po_id),
    deliveryDate: d.delivery_date,
    items,
  };
}

// ── Payload Builder ────────────────────────────────────────────────────────────

/** Filter hanya item dengan qty > 0 sebagai payload simpan */
export function buildDeliveryItemPayload(
  items: DeliveryItemRow[]
): { po_item_id: number; qty: number }[] {
  return items
    .filter((it) => it.qty > 0)
    .map((it) => ({ po_item_id: it.po_item_id, qty: it.qty }));
}
