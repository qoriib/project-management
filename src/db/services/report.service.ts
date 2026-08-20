/**
 * Report Service — Requirement fulfillment and project reporting logic.
 */

import { getDB } from "@/db/index";
import { QueryBuilder } from "@/db/core/query-builder";
import { DbError, wrapDbError } from "@/db/core/errors";

// ── Types ────────────────────────────────────────────────────────────────────

export interface RequirementReportItem {
  item_id: string;
  item_code: string;
  category_prefix?: string;
  category_code?: string;
  item_name: string;
  category: string;
  unit: string;
  /** Price resolved from the linked item_price variant */
  price: number;
  item_price_id: string;
  planned_volume: number;
  planned_budget: number;
  total_ordered: number;
  total_delivered: number;
  total_order_price: number;
  is_unplanned?: boolean;
}

export interface ItemLogEntry {
  date: string;
  type: "Order" | "Receipt";
  reference: string;
  qty: number;
  vendor_name: string | null;
}

export interface OrderReportItem {
  order_code: string;
  order_date: string;
  vendor_name: string | null;
  item_code: string;
  category_prefix?: string;
  category_code?: string;
  item_name: string;
  category_name: string | null;
  unit_name: string | null;
  qty: number;
  price: number;
  has_tax: number;
  total_price: number;
}

export interface ReceiptReportItem {
  receipt_code: string;
  receipt_date: string;
  order_code: string;
  vendor_name: string | null;
  item_code: string;
  category_prefix?: string;
  category_code?: string;
  item_name: string;
  category_name: string | null;
  unit_name: string | null;
  qty: number;
}

interface ItemAggregateEntry {
  itemId: string;
  itemPriceId: string;
  ordered: number;
  delivered: number;
  avgPrice: number;
}

interface RawOrderAggregateRow {
  item_id: string;
  item_price_id: string;
  total_ordered: number;
  avg_order_price: number;
}

interface RawReceiptAggregateRow {
  item_id: string;
  item_price_id: string;
  total_delivered: number;
}

interface RawMissingItemRow {
  item_id: string;
  item_price_id: string;
  item_code: string;
  category_prefix?: string;
  category_code?: string;
  item_name: string;
  category: string;
  unit: string;
  price: number;
}

// ── Service Functions ────────────────────────────────────────────────────────

/**
 * Generates the full Requirement fulfillment report for a project.
 */
export async function getRequirementReport(
  projectId: string,
  startDate?: string,
  endDate?: string,
): Promise<RequirementReportItem[]> {
  try {
    const db = await getDB();

    // 1. Fetch Requirements with joined details
    const requirementQuery = new QueryBuilder()
      .select(
        "requirements.item_id",
        "requirements.item_price_id",
        "items.item_code",
        "categories.prefix as category_prefix",
        "categories.category_code",
        "items.item_name",
        "categories.category_name as category",
        "units.unit_name as unit",
        "item_prices.price",
      )
      .selectRaw("SUM(requirements.qty) as planned_volume")
      .selectRaw(
        "SUM(requirements.qty * item_prices.price * (CASE WHEN requirements.has_tax = 1 THEN 1.12 ELSE 1.0 END)) as planned_budget",
      )
      .from("requirements", "requirements")
      .join("items", "items", "items.item_id = requirements.item_id")
      .join("item_prices", "item_prices", "item_prices.item_price_id = requirements.item_price_id")
      .leftJoin("item_categories", "categories", "items.category_id = categories.category_id")
      .leftJoin("units", "units", "items.unit_id = units.unit_id")
      .where("requirements.project_id", "=", projectId)
      .withSoftDelete("requirements")
      .groupBy(
        "requirements.item_id",
        "requirements.item_price_id",
        "items.item_code",
        "categories.prefix",
        "categories.category_code",
        "items.item_name",
        "categories.category_name",
        "units.unit_name",
        "item_prices.price",
      )
      .orderBy("items.item_name", "ASC");

    const { sql: reqSql, params: reqParams } = requirementQuery.build();
    const requirements = await db.select<RequirementReportItem[]>(reqSql, reqParams);

    // 2. Fetch Order Aggregates
    const orderQuery = new QueryBuilder()
      .select("order_items.item_id", "order_items.item_price_id")
      .selectRaw("SUM(order_items.qty) as total_ordered")
      .selectRaw(
        "COALESCE(SUM(order_items.qty * item_prices.price * (CASE WHEN order_items.has_tax = 1 THEN 1.12 ELSE 1.0 END)) / NULLIF(SUM(order_items.qty), 0), 0) as avg_order_price",
      )
      .from("order_items", "order_items")
      .join("orders", "orders", "orders.order_id = order_items.order_id")
      .join("item_prices", "item_prices", "item_prices.item_price_id = order_items.item_price_id")
      .where("orders.project_id", "=", projectId)
      .where("orders.deleted_at", "IS NULL");

    if (startDate) {
      orderQuery.where("orders.order_date", ">=", startDate);
    }
    if (endDate) {
      orderQuery.where("orders.order_date", "<=", endDate);
    }

    orderQuery.groupBy("order_items.item_id", "order_items.item_price_id");

    const { sql: orderSql, params: orderParams } = orderQuery.build();
    const orderAggregates = await db.select<RawOrderAggregateRow[]>(orderSql, orderParams);

    // 3. Fetch Receipt Aggregates
    const receiptQuery = new QueryBuilder()
      .select("order_items.item_id", "order_items.item_price_id")
      .selectRaw("SUM(receipt_items.qty) as total_delivered")
      .from("receipt_items", "receipt_items")
      .join("receipts", "receipts", "receipts.receipt_id = receipt_items.receipt_id")
      .join("order_items", "order_items", "order_items.order_item_id = receipt_items.order_item_id")
      .join("orders", "orders", "orders.order_id = order_items.order_id")
      .where("orders.project_id", "=", projectId)
      .where("receipts.deleted_at", "IS NULL");

    if (startDate) {
      receiptQuery.where("receipts.receipt_date", ">=", startDate);
    }
    if (endDate) {
      receiptQuery.where("receipts.receipt_date", "<=", endDate);
    }

    receiptQuery.groupBy("order_items.item_id", "order_items.item_price_id");

    const { sql: recSql, params: recParams } = receiptQuery.build();
    const receiptAggregates = await db.select<RawReceiptAggregateRow[]>(recSql, recParams);

    // 4. Build Aggregate Lookup Map
    const aggregateMap = new Map<string, ItemAggregateEntry>();

    for (const orderRow of orderAggregates) {
      const key = `${orderRow.item_id}:::${orderRow.item_price_id}`;
      aggregateMap.set(key, {
        itemId: orderRow.item_id,
        itemPriceId: orderRow.item_price_id,
        avgPrice: orderRow.avg_order_price || 0,
        delivered: 0,
        ordered: orderRow.total_ordered || 0,
      });
    }

    for (const receiptRow of receiptAggregates) {
      const key = `${receiptRow.item_id}:::${receiptRow.item_price_id}`;
      const existing = aggregateMap.get(key);
      if (existing) {
        existing.delivered = receiptRow.total_delivered || 0;
      } else {
        aggregateMap.set(key, {
          itemId: receiptRow.item_id,
          itemPriceId: receiptRow.item_price_id,
          avgPrice: 0,
          delivered: receiptRow.total_delivered || 0,
          ordered: 0,
        });
      }
    }

    // 5. Attach Order/Receipt data to Requirements
    const matchedKeys = new Set<string>();

    for (const requirement of requirements) {
      const key = `${requirement.item_id}:::${requirement.item_price_id}`;
      const aggregate = aggregateMap.get(key);
      matchedKeys.add(key);

      if (!aggregate) {
        requirement.total_ordered = 0;
        requirement.total_delivered = 0;
        requirement.total_order_price = 0;
        continue;
      }

      requirement.total_ordered = aggregate.ordered;
      requirement.total_delivered = aggregate.delivered;
      requirement.total_order_price = aggregate.ordered * aggregate.avgPrice;
    }

    // 6. Append Unplanned items (ordered items that are not in Requirements)
    const missingKeys = Array.from(aggregateMap.keys()).filter((key) => !matchedKeys.has(key));

    if (missingKeys.length > 0) {
      const missingEntries = missingKeys.map((key) => aggregateMap.get(key)!);
      const missingItemIds = Array.from(new Set(missingEntries.map((entry) => entry.itemId)));
      const missingPriceIds = Array.from(new Set(missingEntries.map((entry) => entry.itemPriceId)));

      const missingItemsQuery = new QueryBuilder()
        .select(
          "items.item_id",
          "item_prices.item_price_id",
          "items.item_code",
          "categories.prefix as category_prefix",
          "categories.category_code",
          "items.item_name",
          "categories.category_name as category",
          "units.unit_name as unit",
          "item_prices.price",
        )
        .from("items", "items")
        .join("item_prices", "item_prices", "item_prices.item_id = items.item_id")
        .leftJoin("item_categories", "categories", "items.category_id = categories.category_id")
        .leftJoin("units", "units", "items.unit_id = units.unit_id")
        .where("items.item_id", "IN" as any, missingItemIds)
        .where("item_prices.item_price_id", "IN" as any, missingPriceIds);

      const { sql: missingSql, params: missingParams } = missingItemsQuery.build();
      const missingItems = await db.select<RawMissingItemRow[]>(missingSql, missingParams);

      for (const entry of missingEntries) {
        const itemInfo = missingItems.find(
          (item) => item.item_id === entry.itemId && String(item.item_price_id) === String(entry.itemPriceId),
        );

        requirements.push({
          item_id: entry.itemId,
          item_price_id: entry.itemPriceId,
          item_code: itemInfo?.item_code ?? "",
          category_prefix: itemInfo?.category_prefix,
          category_code: itemInfo?.category_code,
          item_name: itemInfo?.item_name ?? "Item Tidak Dikenal",
          category: itemInfo?.category ?? "LAINNYA",
          unit: itemInfo?.unit ?? "-",
          price: itemInfo?.price ?? 0,
          planned_volume: 0,
          planned_budget: 0,
          total_ordered: entry.ordered,
          total_delivered: entry.delivered,
          total_order_price: entry.ordered * entry.avgPrice,
          is_unplanned: true,
        });
      }
    }

    // 7. Sort report by category and item name
    requirements.sort((itemA, itemB) => {
      const categoryA = itemA.category ?? "LAINNYA";
      const categoryB = itemB.category ?? "LAINNYA";
      if (categoryA < categoryB) return -1;
      if (categoryA > categoryB) return 1;

      const nameA = itemA.item_name ?? "";
      const nameB = itemB.item_name ?? "";
      return nameA.localeCompare(nameB);
    });

    return requirements;
  } catch (error) {
    if (error instanceof DbError) {
      throw error;
    }
    throw wrapDbError(error, "dashboard");
  }
}

/**
 * Gets chronological log of Orders and Receipts for a specific item in a project.
 */
export async function getItemLog(projectId: string, itemId: string, itemPriceId: string): Promise<ItemLogEntry[]> {
  try {
    const db = await getDB();

    // 1. Get Orders
    const orderQuery = new QueryBuilder()
      .select("orders.order_date as date")
      .selectRaw("'Order' as type")
      .selectRaw("orders.order_code as reference")
      .select("order_items.qty", "vendors.vendor_name")
      .from("order_items", "order_items")
      .join("orders", "orders", "orders.order_id = order_items.order_id")
      .leftJoin("vendors", "vendors", "vendors.vendor_id = order_items.vendor_id")
      .where("orders.project_id", "=", projectId)
      .where("order_items.item_id", "=", itemId)
      .where("order_items.item_price_id", "=", itemPriceId)
      .withSoftDelete("orders");

    const { sql: orderSql, params: orderParams } = orderQuery.build();
    const orderLogs = await db.select<ItemLogEntry[]>(orderSql, orderParams);

    // 2. Get Receipts
    const receiptQuery = new QueryBuilder()
      .select("receipts.receipt_date as date")
      .selectRaw("'Receipt' as type")
      .selectRaw("receipts.receipt_code as reference")
      .selectRaw("receipt_items.qty")
      .selectRaw("vendors.vendor_name")
      .from("receipt_items", "receipt_items")
      .join("receipts", "receipts", "receipts.receipt_id = receipt_items.receipt_id")
      .join("order_items", "order_items", "order_items.order_item_id = receipt_items.order_item_id")
      .join("orders", "orders", "orders.order_id = order_items.order_id")
      .leftJoin("vendors", "vendors", "vendors.vendor_id = order_items.vendor_id")
      .where("orders.project_id", "=", projectId)
      .where("order_items.item_id", "=", itemId)
      .where("order_items.item_price_id", "=", itemPriceId)
      .withSoftDelete("receipts");

    const { sql: recSql, params: recParams } = receiptQuery.build();
    const receiptLogs = await db.select<ItemLogEntry[]>(recSql, recParams);

    // 3. Combine and sort by date
    const combinedLogs = [...orderLogs, ...receiptLogs];
    combinedLogs.sort((logA, logB) => new Date(logA.date).getTime() - new Date(logB.date).getTime());

    return combinedLogs;
  } catch (error) {
    if (error instanceof DbError) {
      throw error;
    }
    throw wrapDbError(error, "dashboard_log");
  }
}

/**
 * Gets the order report for all items in a project within an optional date range.
 */
export async function getProjectOrderReport(
  projectId: string,
  startDate?: string,
  endDate?: string,
): Promise<OrderReportItem[]> {
  try {
    const db = await getDB();
    const query = new QueryBuilder()
      .select(
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
        "item_prices.price",
        "order_items.has_tax",
      )
      .selectRaw(
        "order_items.qty * item_prices.price * (CASE WHEN order_items.has_tax = 1 THEN 1.12 ELSE 1.0 END) as total_price",
      )
      .from("order_items", "order_items")
      .join("orders", "orders", "orders.order_id = order_items.order_id")
      .join("items", "items", "items.item_id = order_items.item_id")
      .join("item_prices", "item_prices", "item_prices.item_price_id = order_items.item_price_id")
      .leftJoin("item_categories", "categories", "categories.category_id = items.category_id")
      .leftJoin("units", "units", "units.unit_id = items.unit_id")
      .leftJoin("vendors", "vendors", "vendors.vendor_id = order_items.vendor_id")
      .where("orders.project_id", "=", projectId)
      .withSoftDelete("orders");

    if (startDate) {
      query.where("orders.order_date", ">=", startDate);
    }
    if (endDate) {
      query.where("orders.order_date", "<=", endDate);
    }

    query.orderBy("orders.order_date", "ASC").orderBy("orders.order_code", "ASC");

    const { sql, params } = query.build();
    return await db.select<OrderReportItem[]>(sql, params);
  } catch (error) {
    throw wrapDbError(error, "order_report");
  }
}

/**
 * Gets the receipt report for all items in a project within an optional date range.
 */
export async function getProjectReceiptReport(
  projectId: string,
  startDate?: string,
  endDate?: string,
): Promise<ReceiptReportItem[]> {
  try {
    const db = await getDB();
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
      .join("items", "items", "items.item_id = order_items.item_id")
      .leftJoin("item_categories", "categories", "categories.category_id = items.category_id")
      .leftJoin("units", "units", "units.unit_id = items.unit_id")
      .leftJoin("vendors", "vendors", "vendors.vendor_id = order_items.vendor_id")
      .where("orders.project_id", "=", projectId)
      .withSoftDelete("receipts");

    if (startDate) {
      query.where("receipts.receipt_date", ">=", startDate);
    }
    if (endDate) {
      query.where("receipts.receipt_date", "<=", endDate);
    }

    query.orderBy("receipts.receipt_date", "ASC").orderBy("receipts.receipt_code", "ASC");

    const { sql, params } = query.build();
    return await db.select<ReceiptReportItem[]>(sql, params);
  } catch (error) {
    throw wrapDbError(error, "receipt_report");
  }
}
