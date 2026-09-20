import { QueryBuilder } from "@/db/core/query-builder";
import { wrapDbError } from "@/db/core/errors";
import type { OrderReportItem } from "./types";

/**
 * Gets the order report for all items in a project within an optional date range.
 */
export async function getProjectOrderReport(
  projectId: string,
  startDate?: string,
  endDate?: string,
): Promise<OrderReportItem[]> {
  try {
    const query = new QueryBuilder()
      .select(
        "order_items.requirement_group_id",
        "item_groups.group_name as group_name",
        "orders.order_code",
        "orders.order_date",
        "vendors.vendor_name",
        "items.item_code",
        "categories.prefix as category_prefix",
        "categories.category_code",
        "items.item_name",
        "categories.category_name",
        "units.unit_name",
        "order_items.qty",
        "item_prices.price as price",
        "order_items.has_tax",
      )
      .selectRaw(
        "order_items.qty * item_prices.price * (CASE WHEN order_items.has_tax = 1 THEN 1.12 ELSE 1.0 END) as total_price",
      )
      .from("order_items", "order_items")
      .join("orders", "orders", "orders.order_id = order_items.order_id")
      .join("item_prices", "item_prices", "item_prices.item_price_id = order_items.item_price_id")
      .leftJoin(
        "requirement_groups",
        "item_groups",
        "item_groups.requirement_group_id = order_items.requirement_group_id",
      )
      .join("items", "items", "items.item_id = order_items.item_id")
      .leftJoin("item_categories", "categories", "categories.category_id = items.category_id")
      .leftJoin("units", "units", "units.unit_id = items.unit_id")
      .leftJoin("vendors", "vendors", "vendors.vendor_id = order_items.vendor_id")
      .where("orders.project_id", "=", projectId)
      .when(Boolean(startDate), (builder: QueryBuilder) => builder.where("orders.order_date", ">=", startDate!))
      .when(Boolean(endDate), (builder: QueryBuilder) => builder.where("orders.order_date", "<=", endDate!))
      .orderBy("orders.order_id", "ASC");

    const rows = await query.getMany<OrderReportItem>();
    return rows.map((row) => ({
      ...row,
      has_tax: Boolean(row.has_tax),
    }));
  } catch (error) {
    throw wrapDbError(error, "order_report");
  }
}
