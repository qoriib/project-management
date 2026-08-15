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

  return poItems.map((i) => {
    const item_name = i.item_name ?? "";
    const unit = i.unit ?? "";
    const sisa = i.sisa ?? 0;

    return {
      po_item_id: i.po_item_id,
      item_name,
      unit,
      sisa,
      qty: 0,
    };
  });
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

    const item_name = i.item_name ?? "";
    const unit = i.unit ?? "";

    return {
      po_item_id: i.po_item_id,
      item_name,
      unit,
      sisa: restoredSisa,
      qty: oldQty,
    };
  });

  return {
    poId: String(delivery.po_id),
    deliveryDate: delivery.delivery_date,
    items,
  };
}

// ── Payload Builder ────────────────────────────────────────────────────────────

/** Filter hanya item dengan qty > 0 sebagai payload simpan */
export function buildDeliveryItemPayload(
  items: DeliveryItemRow[]
): { po_item_id: number; qty: number }[] {
  const receivedItems = items.filter((it) => it.qty > 0);

  return receivedItems.map((it) => ({
    po_item_id: it.po_item_id,
    qty: it.qty,
  }));
}
