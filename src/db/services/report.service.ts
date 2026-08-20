/**
 * Dashboard Service — Requirement report with Order/Receipt distribution.
 *
 * This is business logic, not simple CRUD, so it lives in services/
 * rather than in a repository.
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
}

// ── Service ──────────────────────────────────────────────────────────────────

/**
 * Generate the full Requirement fulfillment report for a project.
 */
export async function getRequirementReport(
  projectId: string,
  startDate?: string,
  endDate?: string,
): Promise<RequirementReportItem[]> {
  try {
    const db = await getDB(),
      // 1. Fetch Requirements with joined details (price resolved from item_prices)
      reqQb = new QueryBuilder()
        .select(
          "r.item_id",
          "r.item_price_id",
          "i.item_code",
          "c.prefix as category_prefix",
          "c.category_code",
          "i.item_name",
          "c.category_name as category",
          "u.unit_name as unit",
          "ip.price",
        )
        .selectRaw("SUM(r.qty) as planned_volume")
        .selectRaw("SUM(r.qty * ip.price) as planned_budget")
        .from("requirements", "r")
        .join("items", "i", "i.item_id = r.item_id")
        .join("item_prices", "ip", "ip.item_price_id = r.item_price_id")
        .leftJoin("item_categories", "c", "i.category_id = c.category_id")
        .leftJoin("units", "u", "i.unit_id = u.unit_id")
        .where("r.project_id", "=", projectId)
        .withSoftDelete("r")
        .groupBy(
          "r.item_id",
          "r.item_price_id",
          "i.item_code",
          "c.prefix",
          "c.category_code",
          "i.item_name",
          "c.category_name",
          "u.unit_name",
          "ip.price",
        )
        .orderBy("i.item_name", "ASC"),
      { sql: reqSql, params: reqParams } = reqQb.build(),
      reqs = await db.select<RequirementReportItem[]>(reqSql, reqParams),
      // 2. Fetch Order Aggregates (join item_prices for price)
      orderQb = new QueryBuilder()
        .select("oi.item_id", "oi.item_price_id")
        .selectRaw("SUM(oi.qty) as total_ordered")
        .selectRaw("COALESCE(SUM(oi.qty * ip.price) / NULLIF(SUM(oi.qty), 0), 0) as avg_order_price")
        .from("order_items", "oi")
        .join("orders", "o", "o.order_id = oi.order_id")
        .join("item_prices", "ip", "ip.item_price_id = oi.item_price_id")
        .where("o.project_id", "=", projectId)
        .where("o.deleted_at", "IS NULL");

      if (startDate) orderQb.where("o.order_date", ">=", startDate);
      if (endDate) orderQb.where("o.order_date", "<=", endDate);

      orderQb.groupBy("oi.item_id", "oi.item_price_id");

      const { sql: orderSql, params: orderParams } = orderQb.build();
      const orderAggs = await db.select<
        {
          item_id: string;
          item_price_id: string;
          total_ordered: number;
          avg_order_price: number;
        }[]
      >(orderSql, orderParams);

      // 3. Fetch Receipt Aggregates
      const recQb = new QueryBuilder()
        .select("oi.item_id", "oi.item_price_id")
        .selectRaw("SUM(ri.qty) as total_delivered")
        .from("receipt_items", "ri")
        .join("receipts", "r", "r.receipt_id = ri.receipt_id")
        .join("order_items", "oi", "oi.order_item_id = ri.order_item_id")
        .join("orders", "o", "o.order_id = oi.order_id")
        .where("o.project_id", "=", projectId)
        .where("r.deleted_at", "IS NULL");

      if (startDate) recQb.where("r.receipt_date", ">=", startDate);
      if (endDate) recQb.where("r.receipt_date", "<=", endDate);

      recQb.groupBy("oi.item_id", "oi.item_price_id");
      const { sql: recSql, params: recParams } = recQb.build();
      const recAggs = await db.select<{
        item_id: string;
        item_price_id: string;
        total_delivered: number;
      }[]>(recSql, recParams);

      // 4. Build remaining map
      const itemAgg = new Map<string, { ordered: number; delivered: number; avgPrice: number }>();
      for (const agg of orderAggs) {
        itemAgg.set(`${agg.item_id}-${agg.item_price_id}`, {
          avgPrice: agg.avg_order_price || 0,
          delivered: 0,
          ordered: agg.total_ordered || 0,
        });
      }

      for (const agg of recAggs) {
        const key = `${agg.item_id}-${agg.item_price_id}`;
        if (itemAgg.has(key)) {
          itemAgg.get(key)!.delivered = agg.total_delivered || 0;
        } else {
          itemAgg.set(key, {
            avgPrice: 0,
            delivered: agg.total_delivered || 0,
            ordered: 0,
          });
        }
      }

    // 4. Attach to Requirements
    for (const row of reqs) {
      const key = `${row.item_id}-${row.item_price_id}`,
        agg = itemAgg.get(key);
      if (!agg) {
        row.total_ordered = 0;
        row.total_delivered = 0;
        row.total_order_price = 0;
        continue;
      }

      row.total_ordered = agg.ordered;
      row.total_delivered = agg.delivered;
      row.total_order_price = agg.ordered * agg.avgPrice;
    }

    return reqs;
  } catch (error) {
    if (error instanceof DbError) {
      throw error;
    }
    throw wrapDbError(error, "dashboard");
  }
}

export interface ItemLogEntry {
  date: string;
  type: "Order" | "Receipt";
  reference: string;
  qty: number;
  vendor_name: string | null;
}

/**
 * Get chronological log of Orders and Receipts for a specific item in a project.
 */
export async function getItemLog(projectId: string, itemId: string, itemPriceId: string): Promise<ItemLogEntry[]> {
  try {
    const db = await getDB(),
      // 1. Get Orders
      orderQb = new QueryBuilder()
        .select("o.order_date as date")
        .selectRaw("'Order' as type")
        .selectRaw("o.order_code as reference")
        .select("oi.qty", "v.vendor_name")
        .from("order_items", "oi")
        .join("orders", "o", "o.order_id = oi.order_id")
        .leftJoin("vendors", "v", "v.vendor_id = oi.vendor_id")
        .where("o.project_id", "=", projectId)
        .where("oi.item_id", "=", itemId)
        .where("oi.item_price_id", "=", itemPriceId)
        .withSoftDelete("o"),
      { sql: orderSql, params: orderParams } = orderQb.build(),
      orders = await db.select<ItemLogEntry[]>(orderSql, orderParams),
      // 2. Get Receipts
      recQb = new QueryBuilder()
        .select("r.receipt_date as date")
        .selectRaw("'Receipt' as type")
        .selectRaw("r.receipt_code as reference")
        .selectRaw("ri.qty")
        .selectRaw("v.vendor_name")
        .from("receipt_items", "ri")
        .join("receipts", "r", "r.receipt_id = ri.receipt_id")
        .join("order_items", "oi", "oi.order_item_id = ri.order_item_id")
        .join("orders", "o", "o.order_id = oi.order_id")
        .leftJoin("vendors", "v", "v.vendor_id = oi.vendor_id")
        .where("o.project_id", "=", projectId)
        .where("oi.item_id", "=", itemId)
        .where("oi.item_price_id", "=", itemPriceId)
        .withSoftDelete("r"),
      { sql: recSql, params: recParams } = recQb.build(),
      recs = await db.select<ItemLogEntry[]>(recSql, recParams),
      combined = [...orders, ...recs];
    combined.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return combined;
  } catch (error) {
    if (error instanceof DbError) {
      throw error;
    }
    throw wrapDbError(error, "dashboard_log");
  }
}

export interface OrderReportItem {
  order_code: string;
  order_date: string;
  vendor_name: string | null;
  item_code: string;
  item_name: string;
  category_name: string | null;
  unit_name: string | null;
  qty: number;
  price: number;
  total_price: number;
}

export async function getProjectOrderReport(
  projectId: string,
  startDate?: string,
  endDate?: string,
): Promise<OrderReportItem[]> {
  try {
    const db = await getDB();
    const qb = new QueryBuilder()
      .select(
        "o.order_code",
        "o.order_date",
        "v.vendor_name",
        "i.item_code",
        "i.item_name",
        "c.category_name",
        "u.unit_name",
        "oi.qty",
        "ip.price"
      )
      .selectRaw("oi.qty * ip.price as total_price")
      .from("order_items", "oi")
      .join("orders", "o", "o.order_id = oi.order_id")
      .join("items", "i", "i.item_id = oi.item_id")
      .join("item_prices", "ip", "ip.item_price_id = oi.item_price_id")
      .leftJoin("item_categories", "c", "c.category_id = i.category_id")
      .leftJoin("units", "u", "u.unit_id = i.unit_id")
      .leftJoin("vendors", "v", "v.vendor_id = oi.vendor_id")
      .where("o.project_id", "=", projectId)
      .withSoftDelete("o");

    if (startDate) qb.where("o.order_date", ">=", startDate);
    if (endDate) qb.where("o.order_date", "<=", endDate);

    qb.orderBy("o.order_date", "ASC").orderBy("o.order_code", "ASC");

    const { sql, params } = qb.build();
    return await db.select<OrderReportItem[]>(sql, params);
  } catch (error) {
    throw wrapDbError(error, "order_report");
  }
}

export interface ReceiptReportItem {
  receipt_code: string;
  receipt_date: string;
  order_code: string;
  vendor_name: string | null;
  item_code: string;
  item_name: string;
  category_name: string | null;
  unit_name: string | null;
  qty: number;
}

export async function getProjectReceiptReport(
  projectId: string,
  startDate?: string,
  endDate?: string,
): Promise<ReceiptReportItem[]> {
  try {
    const db = await getDB();
    const qb = new QueryBuilder()
      .select(
        "r.receipt_code",
        "r.receipt_date",
        "o.order_code",
        "v.vendor_name",
        "i.item_code",
        "i.item_name",
        "c.category_name",
        "u.unit_name",
        "ri.qty"
      )
      .from("receipt_items", "ri")
      .join("receipts", "r", "r.receipt_id = ri.receipt_id")
      .join("order_items", "oi", "oi.order_item_id = ri.order_item_id")
      .join("orders", "o", "o.order_id = oi.order_id")
      .join("items", "i", "i.item_id = oi.item_id")
      .leftJoin("item_categories", "c", "c.category_id = i.category_id")
      .leftJoin("units", "u", "u.unit_id = i.unit_id")
      .leftJoin("vendors", "v", "v.vendor_id = oi.vendor_id")
      .where("o.project_id", "=", projectId)
      .withSoftDelete("r");

    if (startDate) qb.where("r.receipt_date", ">=", startDate);
    if (endDate) qb.where("r.receipt_date", "<=", endDate);

    qb.orderBy("r.receipt_date", "ASC").orderBy("r.receipt_code", "ASC");

    const { sql, params } = qb.build();
    return await db.select<ReceiptReportItem[]>(sql, params);
  } catch (error) {
    throw wrapDbError(error, "receipt_report");
  }
}

