import { deliveryRepo, purchaseOrderRepo } from "@/db/repositories";
import type { DeliveryItemRow } from "./delivery.schema";

// ── PO Items Loader ────────────────────────────────────────────────────────────

/**
 * Ambil item-item dari sebuah PO dan konversi ke shape DeliveryItemRow
 * dengan qty = 0 (mode tambah baru).
 */
export async function loadPOItemsAsDeliveryRows(poId: string): Promise<DeliveryItemRow[]> {
  const poItems = await purchaseOrderRepo.findItems(poId);

  return poItems.map((i) => {
    const item_name = i.item_name ?? "",
      unit = i.unit ?? "",
      remaining = i.remaining ?? 0,
      ordered = i.qty ?? 0,
      delivered = i.total_delivered ?? 0;

    return {
      delivered,
      item_id: i.item_id,
      item_name,
      ordered,
      po_item_id: i.po_item_id,
      qty: 0,
      remaining,
      unit,
    };
  });
}

// ── Edit Data Loader ───────────────────────────────────────────────────────────

/**
 * Ambil data delivery yang ada (mode edit).
 * Mengembalikan header delivery (po_id, delivery_date) dan
 * item rows dengan sisa yang sudah dikembalikan (remaining + oldQty).
 */
export async function loadDeliveryEditData(deliveryId: string): Promise<{
  po_id: string;
  delivery_date: string;
  delivery_code: string;
  items: DeliveryItemRow[];
} | null> {
  const delivery = await deliveryRepo.findById(deliveryId);

  if (!delivery) {
    return null;
  }

  const [poItems, delivItems] = await Promise.all([
      purchaseOrderRepo.findItems(delivery.po_id),
      deliveryRepo.findItems(deliveryId),
    ]),
    items: DeliveryItemRow[] = poItems.map((i) => {
      const existingDelivItem = delivItems.find((di) => di.po_item_id === i.po_item_id),
        oldQty = existingDelivItem?.qty ?? 0,
        originalSisa = i.remaining ?? 0,
        restoredSisa = originalSisa + oldQty, // kembalikan sisa yang sudah dipakai
        originalDelivered = (i.total_delivered ?? 0) - oldQty,
        item_name = i.item_name ?? "",
        unit = i.unit ?? "";

      return {
        delivered: originalDelivered,
        item_id: i.item_id,
        item_name,
        ordered: i.qty ?? 0,
        po_item_id: i.po_item_id,
        qty: oldQty,
        remaining: restoredSisa,
        unit,
      };
    });

  return {
    delivery_code: delivery.delivery_code || "",
    delivery_date: delivery.delivery_date,
    items,
    po_id: delivery.po_id,
  };
}

// ── Payload Builder ────────────────────────────────────────────────────────────

/** Filter hanya item dengan qty > 0 sebagai payload simpan */
export function buildDeliveryItemPayload(
  items: DeliveryItemRow[],
): { po_item_id: string; qty: number }[] {
  const receivedItems = items.filter((it) => it.qty > 0);

  return receivedItems.map((it) => ({
    po_item_id: it.po_item_id,
    qty: it.qty,
  }));
}
