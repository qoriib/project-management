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

interface RawOrderAggregateRow {
  item_id: string;
  item_price_id: string;
  price: number;
  total_ordered: number;
  total_order_price: number;
}

interface RawReceiptAggregateRow {
  item_id: string;
  item_price_id: string;
  total_delivered: number;
}

interface RawUnplannedItemRow {
  item_id: string;
  item_code: string;
  category_prefix?: string;
  category_code?: string;
  item_name: string;
  category: string;
  unit: string;
}

// ── Service Functions ────────────────────────────────────────────────────────

/**
 * Generates the full Requirement fulfillment report for a project.
 * Items in Requirements and Orders are grouped and matched strictly by (item_id, item_price_id).
 * If the same item has multiple prices in PO or BOM, each variation appears as a separate row.
 */
export async function getRequirementReport(
  projectId: string,
  startDate?: string,
  endDate?: string,
): Promise<RequirementReportItem[]> {
  try {
    const db = await getDB();

    // 1. Fetch Requirements grouped by (item_id, item_price_id)
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
        "item_prices.price as price",
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
      .orderBy("items.item_id", "ASC");

    const { sql: reqSql, params: reqParams } = requirementQuery.build();
    const requirements = await db.select<RequirementReportItem[]>(reqSql, reqParams);

    // 2. Fetch Order Aggregates grouped by (item_id, item_price_id)
    const orderQuery = new QueryBuilder()
      .select("order_items.item_id", "order_items.item_price_id", "item_prices.price")
      .selectRaw("SUM(order_items.qty) as total_ordered")
      .selectRaw(
        "SUM(order_items.qty * item_prices.price * (CASE WHEN order_items.has_tax = 1 THEN 1.12 ELSE 1.0 END)) as total_order_price",
      )
      .from("order_items", "order_items")
      .join("orders", "orders", "orders.order_id = order_items.order_id")
      .join("item_prices", "item_prices", "item_prices.item_price_id = order_items.item_price_id")
      .where("orders.project_id", "=", projectId)
      .withSoftDelete("orders");

    if (startDate) {
      orderQuery.where("orders.order_date", ">=", startDate);
    }
    if (endDate) {
      orderQuery.where("orders.order_date", "<=", endDate);
    }

    orderQuery.groupBy("order_items.item_id", "order_items.item_price_id", "item_prices.price");

    const { sql: orderSql, params: orderParams } = orderQuery.build();
    const orderAggregates = await db.select<RawOrderAggregateRow[]>(orderSql, orderParams);

    // 3. Fetch Receipt Aggregates grouped by (item_id, item_price_id)
    const receiptQuery = new QueryBuilder()
      .select("order_items.item_id", "order_items.item_price_id")
      .selectRaw("SUM(receipt_items.qty) as total_delivered")
      .from("receipt_items", "receipt_items")
      .join("receipts", "receipts", "receipts.receipt_id = receipt_items.receipt_id")
      .join("order_items", "order_items", "order_items.order_item_id = receipt_items.order_item_id")
      .join("orders", "orders", "orders.order_id = order_items.order_id")
      .where("orders.project_id", "=", projectId)
      .withSoftDelete("receipts")
      .withSoftDelete("orders");

    if (startDate) {
      receiptQuery.where("receipts.receipt_date", ">=", startDate);
    }
    if (endDate) {
      receiptQuery.where("receipts.receipt_date", "<=", endDate);
    }

    receiptQuery.groupBy("order_items.item_id", "order_items.item_price_id");

    const { sql: recSql, params: recParams } = receiptQuery.build();
    const receiptAggregates = await db.select<RawReceiptAggregateRow[]>(recSql, recParams);

    // 4. Build Lookups by `${item_id}:::${item_price_id}`
    const orderMap = new Map<
      string,
      { itemId: string; itemPriceId: string; price: number; total_order_price: number; total_ordered: number }
    >();
    for (const row of orderAggregates) {
      const key = `${row.item_id}:::${row.item_price_id}`;
      orderMap.set(key, {
        itemId: row.item_id,
        itemPriceId: row.item_price_id,
        price: row.price || 0,
        total_order_price: row.total_order_price || 0,
        total_ordered: row.total_ordered || 0,
      });
    }

    const receiptMap = new Map<string, number>();
    for (const row of receiptAggregates) {
      const key = `${row.item_id}:::${row.item_price_id}`;
      receiptMap.set(key, row.total_delivered || 0);
    }

    // 5. Populate Planned Items (Requirements)
    const matchedKeys = new Set<string>();
    const plannedList: RequirementReportItem[] = [];

    for (const req of requirements) {
      const key = `${req.item_id}:::${req.item_price_id}`;
      matchedKeys.add(key);
      const orderInfo = orderMap.get(key);
      const delivered = receiptMap.get(key) || 0;

      plannedList.push({
        ...req,
        is_unplanned: false,
        total_delivered: delivered,
        total_order_price: orderInfo?.total_order_price || 0,
        total_ordered: orderInfo?.total_ordered || 0,
      });
    }

    // 6. Populate Unplanned Items (ordered in project, but not in Requirements)
    const unplannedEntries: { key: string; itemId: string; priceId: string }[] = [];
    for (const [key, orderInfo] of orderMap) {
      if (!matchedKeys.has(key)) {
        unplannedEntries.push({ itemId: orderInfo.itemId, key, priceId: orderInfo.itemPriceId });
      }
    }

    const unplannedList: RequirementReportItem[] = [];
    const uniqueUnplannedItemIds = Array.from(new Set(unplannedEntries.map((e) => e.itemId)));

    if (uniqueUnplannedItemIds.length > 0) {
      const unplannedQuery = new QueryBuilder()
        .select(
          "items.item_id",
          "items.item_code",
          "categories.prefix as category_prefix",
          "categories.category_code",
          "items.item_name",
          "categories.category_name as category",
          "units.unit_name as unit",
        )
        .from("items", "items")
        .leftJoin("item_categories", "categories", "items.category_id = categories.category_id")
        .leftJoin("units", "units", "items.unit_id = units.unit_id")
        .where("items.item_id", "IN" as any, uniqueUnplannedItemIds);

      const { sql: unplannedSql, params: unplannedParams } = unplannedQuery.build();
      const unplannedItemRows = await db.select<RawUnplannedItemRow[]>(unplannedSql, unplannedParams);
      const itemRowMap = new Map<string, RawUnplannedItemRow>();
      for (const row of unplannedItemRows) {
        itemRowMap.set(row.item_id, row);
      }

      for (const entry of unplannedEntries) {
        const itemInfo = itemRowMap.get(entry.itemId);
        const orderInfo = orderMap.get(entry.key);
        const delivered = receiptMap.get(entry.key) || 0;

        unplannedList.push({
          category: itemInfo?.category ?? "LAINNYA",
          category_code: itemInfo?.category_code,
          category_prefix: itemInfo?.category_prefix,
          is_unplanned: true,
          item_code: itemInfo?.item_code ?? "",
          item_id: entry.itemId,
          item_name: itemInfo?.item_name ?? "Item Non-Rencana",
          item_price_id: entry.priceId,
          planned_budget: 0,
          planned_volume: 0,
          price: orderInfo?.price || 0,
          total_delivered: delivered,
          total_order_price: orderInfo?.total_order_price || 0,
          total_ordered: orderInfo?.total_ordered || 0,
          unit: itemInfo?.unit ?? "-",
        });
      }
    }

    // 7. Sort Planned Items by item_id (UUID)
    plannedList.sort((a, b) => (a.item_id || "").localeCompare(b.item_id || ""));

    // 8. Sort Unplanned Items by item_id (UUID)
    unplannedList.sort((a, b) => (a.item_id || "").localeCompare(b.item_id || ""));

    // Return Planned items first, followed by Unplanned items!
    return [...plannedList, ...unplannedList];
  } catch (error) {
    if (error instanceof DbError) {
      throw error;
    }
    throw wrapDbError(error, "dashboard");
  }
}

/**
 * Gets chronological log of Orders and Receipts for a specific item & item_price in a project.
 */
export async function getItemLog(projectId: string, itemId: string, itemPriceId?: string): Promise<ItemLogEntry[]> {
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
      .withSoftDelete("orders");

    if (itemPriceId && itemPriceId.trim() !== "") {
      orderQuery.where("order_items.item_price_id", "=", itemPriceId);
    }

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
      .withSoftDelete("receipts")
      .withSoftDelete("orders");

    if (itemPriceId && itemPriceId.trim() !== "") {
      receiptQuery.where("order_items.item_price_id", "=", itemPriceId);
    }

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

    query.orderBy("orders.order_id", "ASC");

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

    query.orderBy("receipts.receipt_id", "ASC");

    const { sql, params } = query.build();
    return await db.select<ReceiptReportItem[]>(sql, params);
  } catch (error) {
    throw wrapDbError(error, "receipt_report");
  }
}
