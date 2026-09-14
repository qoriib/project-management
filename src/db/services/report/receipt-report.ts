import { QueryBuilder } from "@/db/core/query-builder";
import { wrapDbError } from "@/db/core/errors";
import type { ReceiptReportItem } from "./types";

/**
 * Gets the receipt report for all items in a project within an optional date range.
 */
export async function getProjectReceiptReport(
  projectId: string,
  startDate?: string,
  endDate?: string,
): Promise<ReceiptReportItem[]> {
  try {
    const query = new QueryBuilder()
      .select(
        "receipts.receipt_code",
        "receipts.receipt_date",
        "orders.order_code",
        "vendors.vendor_name",
        "items.item_code",
        "categories.prefix as category_prefix",
        "categories.category_code",
        "items.item_name",
        "categories.category_name",
        "units.unit_name",
        "receipt_items.qty",
      )
      .from("receipt_items", "receipt_items")
      .join("receipts", "receipts", "receipts.receipt_id = receipt_items.receipt_id")
      .join("order_items", "order_items", "order_items.order_item_id = receipt_items.order_item_id")
      .join("orders", "orders", "orders.order_id = order_items.order_id")
      .join("items", "items", "items.item_id = order_items.item_id AND items.deleted_at IS NULL")
      .leftJoin(
        "item_categories",
        "categories",
        "categories.category_id = items.category_id AND categories.deleted_at IS NULL",
      )
      .leftJoin("units", "units", "units.unit_id = items.unit_id AND units.deleted_at IS NULL")
      .leftJoin("vendors", "vendors", "vendors.vendor_id = order_items.vendor_id AND vendors.deleted_at IS NULL")
      .where("orders.project_id", "=", projectId)
      .withSoftDelete("receipts", "orders")
      .when(Boolean(startDate), (q) => q.where("receipts.receipt_date", ">=", startDate!))
      .when(Boolean(endDate), (q) => q.where("receipts.receipt_date", "<=", endDate!))
      .orderBy("receipts.receipt_id", "ASC");

    return await query.getMany<ReceiptReportItem>();
  } catch (error) {
    throw wrapDbError(error, "receipt_report");
  }
}
