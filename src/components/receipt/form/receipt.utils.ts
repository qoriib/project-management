import { receiptRepo, orderRepo } from "@/db/repositories";
import type { ReceiptItemRow } from "./receipt.schema";

// ── Order Items Loader ────────────────────────────────────────────────────────────

/**
 * Ambil item-item dari sebuah Order dan konversi ke shape ReceiptItemRow
 * dengan qty = 0 (mode tambah baru).
 */
export async function loadOrderItemsAsReceiptRows(poId: string): Promise<ReceiptItemRow[]> {
  const orderItems = await orderRepo.findItems(poId);

  return orderItems.map((i) => {
    const item_name = i.item_name ?? "";
    const unit = i.unit ?? "";
    const remaining = i.remaining ?? 0;
    const ordered = i.qty ?? 0;
    const delivered = i.total_delivered ?? 0;

    return {
      delivered,
      item_id: i.item_id,
      item_name,
      category_prefix: i.category_prefix,
      category_code: i.category_code,
      item_code: i.item_code,
      price: i.price,
      item_price_id: i.item_price_id,
      ordered,
      order_item_id: i.order_item_id,
      qty: 0,
      remaining,
      unit,
    };
  });
}

// ── Edit Data Loader ───────────────────────────────────────────────────────────

/**
 * Ambil data receipt yang ada (mode edit).
 * Mengembalikan header receipt (order_id, receipt_date) dan
 * item rows dengan sisa yang sudah dikembalikan (remaining + oldQty).
 */
export async function loadReceiptEditData(receiptId: string): Promise<{
  order_id: string;
  receipt_date: string;
  receipt_code: string;
  items: ReceiptItemRow[];
} | null> {
  const receipt = await receiptRepo.findById(receiptId);

  if (!receipt) return null;

  const [orderItems, delivItems] = await Promise.all([
    orderRepo.findItems(receipt.order_id),
    receiptRepo.findItems(receiptId),
  ]);

  const items: ReceiptItemRow[] = orderItems.map((i) => {
    const existingDelivItem = delivItems.find((di) => di.order_item_id === i.order_item_id);
    const oldQty = existingDelivItem?.qty ?? 0;
    const originalSisa = i.remaining ?? 0;
    const restoredSisa = originalSisa + oldQty; // kembalikan sisa yang sudah dipakai
    const originalDelivered = (i.total_delivered ?? 0) - oldQty;
    const item_name = i.item_name ?? "";
    const unit = i.unit ?? "";

    return {
      delivered: originalDelivered,
      item_id: i.item_id,
      item_name,
      category_prefix: i.category_prefix,
      category_code: i.category_code,
      item_code: i.item_code,
      price: i.price,
      item_price_id: i.item_price_id,
      ordered: i.qty ?? 0,
      order_item_id: i.order_item_id,
      qty: oldQty,
      remaining: restoredSisa,
      unit,
    };
  });

  return {
    receipt_code: receipt.receipt_code || "",
    receipt_date: receipt.receipt_date,
    items,
    order_id: receipt.order_id,
  };
}

import { parseDecimalInput } from "@/utils/formatters";

// ── Payload Builder ────────────────────────────────────────────────────────────

/** Filter hanya item dengan qty > 0 sebagai payload simpan */
export function buildReceiptItemPayload(items: ReceiptItemRow[]): { order_item_id: string; qty: number }[] {
  const receivedItems = items.filter((it) => parseDecimalInput(it.qty) > 0);

  return receivedItems.map((it) => ({
    order_item_id: it.order_item_id,
    qty: parseDecimalInput(it.qty),
  }));
}
