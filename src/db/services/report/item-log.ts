import { QueryBuilder } from "@/db/core/query-builder";
import { DbError, wrapDbError } from "@/db/core/errors";
import type { ItemLogEntry } from "./types";

/**
 * Gets chronological log of Orders and Receipts for a specific item in a project.
 */
export async function getItemLog(projectId: string, itemId: string, itemPriceId?: string): Promise<ItemLogEntry[]> {
  try {
    const orderQuery = new QueryBuilder()
      .select("orders.order_id as id", "orders.order_date as date")
      .selectRaw("'Order' as type")
      .selectRaw("orders.order_code as reference")
      .select("order_items.qty", "vendors.vendor_name")
      .from("order_items", "order_items")
      .join("orders", "orders", "orders.order_id = order_items.order_id")
      .leftJoin("vendors", "vendors", "vendors.vendor_id = order_items.vendor_id AND vendors.deleted_at IS NULL")
      .where("orders.project_id", "=", projectId)
      .where("order_items.item_id", "=", itemId)
      .withSoftDelete("orders")
      .when(Boolean(itemPriceId && itemPriceId.trim() !== ""), (q) =>
        q.where("order_items.item_price_id", "=", itemPriceId!),
      );

    const receiptQuery = new QueryBuilder()
      .select("receipts.receipt_id as id", "receipts.receipt_date as date")
      .selectRaw("'Receipt' as type")
      .selectRaw("receipts.receipt_code as reference")
      .selectRaw("receipt_items.qty")
      .selectRaw("vendors.vendor_name")
      .from("receipt_items", "receipt_items")
      .join("receipts", "receipts", "receipts.receipt_id = receipt_items.receipt_id")
      .join("order_items", "order_items", "order_items.order_item_id = receipt_items.order_item_id")
      .join("orders", "orders", "orders.order_id = order_items.order_id")
      .leftJoin("vendors", "vendors", "vendors.vendor_id = order_items.vendor_id AND vendors.deleted_at IS NULL")
      .where("orders.project_id", "=", projectId)
      .where("order_items.item_id", "=", itemId)
      .withSoftDelete("receipts", "orders")
      .when(Boolean(itemPriceId && itemPriceId.trim() !== ""), (q) =>
        q.where("order_items.item_price_id", "=", itemPriceId!),
      );

    const [orderLogs, receiptLogs] = await Promise.all([
      orderQuery.getMany<ItemLogEntry>(),
      receiptQuery.getMany<ItemLogEntry>(),
    ]);

    const combinedLogs = [...orderLogs, ...receiptLogs];
    combinedLogs.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return combinedLogs;
  } catch (error) {
    if (error instanceof DbError) throw error;
    throw wrapDbError(error, "item_log");
  }
}
