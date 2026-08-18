/**
 * Dashboard Service — BOM report with PO/Delivery distribution.
 *
 * This is business logic, not simple CRUD, so it lives in services/
 * rather than in a repository.
 */

import { getDB } from "@/db/index";
import { QueryBuilder } from "@/db/core/query-builder";
import { wrapDbError, DbError } from "@/db/core/errors";

// ── Types ────────────────────────────────────────────────────────────────────

export interface BOMReportItem {
  item_id: string;
  item_name: string;
  bom_group_name: string;
  category: string;
  unit: string;
  /** Price resolved from the linked item_price variant */
  price: number;
  item_price_id: string;
  planned_volume: number;
  planned_budget: number;
  total_ordered: number;
  total_delivered: number;
  total_po_price: number;
}

// ── Service ──────────────────────────────────────────────────────────────────

/**
 * Generate the full BOM fulfillment report for a project.
 */
export async function getBOMReport(projectId: string): Promise<BOMReportItem[]> {
  try {
    const db = await getDB();

    // 1. Fetch BOMs with joined details (price resolved from item_prices)
    const bomQb = new QueryBuilder()
      .select(
        "b.item_id", "b.item_price_id",
        "i.item_name", "g.group_name as bom_group_name", "c.category_name as category", "u.unit_name as unit",
        "ip.price",
      )
      .selectRaw("SUM(b.qty) as planned_volume")
      .selectRaw("SUM(b.qty * ip.price) as planned_budget")
      .from("bill_of_materials", "b")
      .join("items", "i", "i.item_id = b.item_id")
      .join("item_prices", "ip", "ip.item_price_id = b.item_price_id")
      .leftJoin("bom_groups", "g", "g.bom_group_id = b.bom_group_id")
      .leftJoin("item_categories", "c", "i.category_id = c.category_id")
      .leftJoin("units", "u", "i.unit_id = u.unit_id")
      .where("b.project_id", "=", projectId)
      .withSoftDelete("b")
      .groupBy("b.item_id", "b.item_price_id", "i.item_name", "g.group_name", "c.category_name", "u.unit_name", "ip.price")
      .orderBy("g.group_name", "ASC")
      .orderBy("i.item_name", "ASC");

    const { sql: bomSql, params: bomParams } = bomQb.build();
    const boms = await db.select<BOMReportItem[]>(bomSql, bomParams);

    // 2. Fetch PO Aggregates (join item_prices for price)
    const poQb = new QueryBuilder()
      .select("poi.item_id", "poi.item_price_id")
      .selectRaw("SUM(poi.qty) as total_ordered")
      .selectRaw("SUM(d.total_delivered) as total_delivered")
      .selectRaw("COALESCE(SUM(poi.qty * ip.price) / NULLIF(SUM(poi.qty), 0), 0) as avg_po_price")
      .from("po_items", "poi")
      .join("purchase_orders", "po", "po.po_id = poi.po_id")
      .join("item_prices", "ip", "ip.item_price_id = poi.item_price_id")
      .leftJoin(
        "(SELECT po_item_id, SUM(qty) as total_delivered FROM delivery_items GROUP BY po_item_id)",
        "d",
        "d.po_item_id = poi.po_item_id"
      )
      .where("po.project_id", "=", projectId)
      .where("po.deleted_at", "IS NULL")
      .groupBy("poi.item_id", "poi.item_price_id");

    const { sql: poSql, params: poParams } = poQb.build();
    const poAggs = await db.select<{ item_id: string; item_price_id: string; total_ordered: number; total_delivered: number; avg_po_price: number }[]>(poSql, poParams);

    // 3. Build remaining map
    const itemAgg = new Map<string, { ordered: number; delivered: number; avgPrice: number }>();
    for (const agg of poAggs) {
      itemAgg.set(`${agg.item_id}-${agg.item_price_id}`, {
        ordered: agg.total_ordered || 0,
        delivered: agg.total_delivered || 0,
        avgPrice: agg.avg_po_price || 0,
      });
    }

    // 4. Attach to BOMs
    for (const row of boms) {
      const key = `${row.item_id}-${row.item_price_id}`;
      const agg = itemAgg.get(key);
      if (!agg) {
        row.total_ordered = 0;
        row.total_delivered = 0;
        row.total_po_price = 0;
        continue;
      }

      row.total_ordered = agg.ordered;
      row.total_delivered = agg.delivered;
      row.total_po_price = agg.ordered * agg.avgPrice;
    }

    return boms;
  } catch (error) {
    if (error instanceof DbError) throw error;
    throw wrapDbError(error, "dashboard");
  }
}

export interface ItemLogEntry {
  date: string;
  type: 'PO' | 'Delivery';
  reference: string;
  qty: number;
  vendor_name: string | null;
}

/**
 * Get chronological log of POs and Deliveries for a specific item in a project.
 */
export async function getItemLog(
  projectId: string,
  itemId: string,
  itemPriceId: string
): Promise<ItemLogEntry[]> {
  try {
    const db = await getDB();

    // 1. Get POs
    const poQb = new QueryBuilder()
      .select("po.po_date as date")
      .selectRaw("'PO' as type")
      .selectRaw("po.po_code as reference")
      .select("poi.qty", "v.vendor_name")
      .from("po_items", "poi")
      .join("purchase_orders", "po", "po.po_id = poi.po_id")
      .leftJoin("vendors", "v", "v.vendor_id = poi.vendor_id")
      .where("po.project_id", "=", projectId)
      .where("poi.item_id", "=", itemId)
      .where("poi.item_price_id", "=", itemPriceId)
      .withSoftDelete("po");

    const { sql: poSql, params: poParams } = poQb.build();
    const pos = await db.select<ItemLogEntry[]>(poSql, poParams);

    // 2. Get Deliveries
    const delQb = new QueryBuilder()
      .select("d.delivery_date as date")
      .selectRaw("'Delivery' as type")
      .selectRaw("d.delivery_code as reference")
      .selectRaw("di.qty")
      .selectRaw("v.vendor_name")
      .from("delivery_items", "di")
      .join("deliveries", "d", "d.delivery_id = di.delivery_id")
      .join("po_items", "poi", "poi.po_item_id = di.po_item_id")
      .join("purchase_orders", "po", "po.po_id = poi.po_id")
      .leftJoin("vendors", "v", "v.vendor_id = poi.vendor_id")
      .where("po.project_id", "=", projectId)
      .where("poi.item_id", "=", itemId)
      .where("poi.item_price_id", "=", itemPriceId)
      .withSoftDelete("d");

    const { sql: delSql, params: delParams } = delQb.build();
    const dels = await db.select<ItemLogEntry[]>(delSql, delParams);

    const combined = [...pos, ...dels];
    combined.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return combined;
  } catch (error) {
    if (error instanceof DbError) throw error;
    throw wrapDbError(error, "dashboard_log");
  }
}
