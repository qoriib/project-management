import { receiptRepo, orderRepo } from "@/db/repositories";
import type { ReceiptItemRow } from "./receipt.schema";

/**
 * Ambil data receipt yang ada (mode edit).
 * Mengembalikan header receipt (order_id, receipt_date, receipt_code) dan
 * item rows dengan sisa yang sudah dikembalikan (remaining + oldQty).
 */
export async function loadReceiptEditData(receiptId: string): Promise<{
  order_id: string;
  order_code?: string;
  receipt_date: string;
  receipt_code: string;
  items: ReceiptItemRow[];
} | null> {
  const receipt = await receiptRepo.findById(receiptId);

  if (!receipt) return null;

  const [order, orderItems, delivItems] = await Promise.all([
    orderRepo.findById(receipt.order_id),
    orderRepo.findItems(receipt.order_id),
    receiptRepo.findItems(receiptId),
  ]);

  const items: ReceiptItemRow[] = orderItems.map((item) => {
    const existingDelivItem = delivItems.find((delivItem) => delivItem.order_item_id === item.order_item_id);
    const oldQty = existingDelivItem?.qty ?? 0;
    const originalSisa = item.remaining ?? 0;
    const restoredSisa = originalSisa + oldQty; // kembalikan sisa yang sudah dipakai
    const originalDelivered = (item.total_delivered ?? 0) - oldQty;
    const item_name = item.item_name ?? "";
    const unit = item.unit ?? "";

    return {
      delivered: originalDelivered,
      item_id: item.item_id,
      item_name,
      category_prefix: item.category_prefix,
      category_code: item.category_code,
      item_code: item.item_code,
      price: item.price,
      item_price_id: item.item_price_id,
      ordered: item.qty ?? 0,
      order_item_id: item.order_item_id,
      remaining: restoredSisa,
      qty: oldQty,
      unit,
    };
  });

  return {
    receipt_code: receipt.receipt_code || "",
    receipt_date: receipt.receipt_date,
    items,
    order_id: receipt.order_id,
    order_code: order?.order_code ?? undefined,
  };
}
