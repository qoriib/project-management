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
        "item_prices.price as price",
        "receipt_items.has_tax",
      )
      .from("receipt_items", "receipt_items")
      .join("receipts", "receipts", "receipts.receipt_id = receipt_items.receipt_id")
      .join("order_items", "order_items", "order_items.order_item_id = receipt_items.order_item_id")
      .join("item_prices", "item_prices", "item_prices.item_price_id = receipt_items.item_price_id")
      .join("orders", "orders", "orders.order_id = order_items.order_id")
      .join("items", "items", "items.item_id = order_items.item_id")
      .leftJoin("item_categories", "categories", "categories.category_id = items.category_id")
      .leftJoin("units", "units", "units.unit_id = items.unit_id")
      .leftJoin("vendors", "vendors", "vendors.vendor_id = order_items.vendor_id")
      .where("orders.project_id", "=", projectId)
      .when(Boolean(startDate), (builder: QueryBuilder) => builder.where("receipts.receipt_date", ">=", startDate!))
      .when(Boolean(endDate), (builder: QueryBuilder) => builder.where("receipts.receipt_date", "<=", endDate!))
      .orderBy("receipts.receipt_id", "ASC");

    const rows = await query.getMany<ReceiptReportItem>();
    return rows.map((row) => ({ ...row, has_tax: Boolean(row.has_tax) }));
  } catch (error) {
    throw wrapDbError(error, "receipt_report");
  }
}
