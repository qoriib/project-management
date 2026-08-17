import { purchaseOrderRepo, deliveryRepo } from "@/db/repositories";
import type { DeliveryItemRow } from "./delivery.schema";

// ── PO Items Loader ────────────────────────────────────────────────────────────

/**
 * Ambil item-item dari sebuah PO dan konversi ke shape DeliveryItemRow
 * dengan qty = 0 (mode tambah baru).
 */
export async function loadPOItemsAsDeliveryRows(
  poId: string
): Promise<DeliveryItemRow[]> {
  const poItems = await purchaseOrderRepo.findItems(poId);

  return poItems.map((i) => {
    const item_name = i.item_name ?? "";
    const unit = i.unit ?? "";
    const remaining = i.sisa ?? 0;
    const ordered = i.qty ?? 0;
    const delivered = i.total_terkirim ?? 0;

    return {
      po_item_id: i.po_item_id,
      item_id: i.item_id,
      item_name,
      unit,
      remaining,
      qty: 0,
      ordered,
      delivered,
    };
  });
}

// ── Edit Data Loader ───────────────────────────────────────────────────────────

/**
 * Ambil data delivery yang ada (mode edit).
 * Mengembalikan header delivery (po_id, delivery_date) dan
 * item rows dengan sisa yang sudah dikembalikan (sisa + oldQty).
 */
export async function loadDeliveryEditData(deliveryId: string): Promise<{
  po_id: string;
  delivery_date: string;
  items: DeliveryItemRow[];
} | null> {
  const delivery = await deliveryRepo.findById(deliveryId);

  if (!delivery) {
    return null;
  }

  const [poItems, delivItems] = await Promise.all([
    purchaseOrderRepo.findItems(delivery.po_id),
    deliveryRepo.findItems(deliveryId),
  ]);

  const items: DeliveryItemRow[] = poItems.map((i) => {
    const existingDelivItem = delivItems.find(
      (di) => di.po_item_id === i.po_item_id
    );

    const oldQty = existingDelivItem?.qty ?? 0;
    const originalSisa = i.sisa ?? 0;
    const restoredSisa = originalSisa + oldQty; // kembalikan sisa yang sudah dipakai
    const originalDelivered = (i.total_terkirim ?? 0) - oldQty;

    const item_name = i.item_name ?? "";
    const unit = i.unit ?? "";

    return {
      po_item_id: i.po_item_id,
      item_id: i.item_id,
      item_name,
      unit,
      remaining: restoredSisa,
      qty: oldQty,
      ordered: i.qty ?? 0,
      delivered: originalDelivered,
    };
  });

  return {
    po_id: delivery.po_id,
    delivery_date: delivery.delivery_date,
    items,
  };
}

// ── Payload Builder ────────────────────────────────────────────────────────────

/** Filter hanya item dengan qty > 0 sebagai payload simpan */
export function buildDeliveryItemPayload(
  items: DeliveryItemRow[]
): { po_item_id: string; qty: number }[] {
  const receivedItems = items.filter((it) => it.qty > 0);

  return receivedItems.map((it) => ({
    po_item_id: it.po_item_id,
    qty: it.qty,
  }));
}
