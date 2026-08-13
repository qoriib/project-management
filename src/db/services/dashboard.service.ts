/**
 * Dashboard Service — Complex BOM report with PO/Delivery distribution.
 *
 * This is business logic, not simple CRUD, so it lives in services/
 * rather than in a repository.
 */

import { getDB } from "@/db/index";
import { QueryBuilder } from "@/db/core/query-builder";
import { wrapDbError, DbError } from "@/db/core/errors";

// ── Types ────────────────────────────────────────────────────────────────────

export interface DashboardBOMReportItem {
  item_id: number;
  item_price_id: number;
  stage_name: string;
  item_name: string;
  category: string;
  unit: string;
  price: number;
  planned_volume: number;
  planned_budget: number;
  total_ordered: number;
  total_delivered: number;
  total_po_price: number;
}

// ── Service ──────────────────────────────────────────────────────────────────

/**
 * Generate the full BOM fulfillment report for a project.
 *
 * This distributes PO quantities and delivery quantities across
 * BOM stages proportionally, handling over-delivery by dumping
 * excess into the last stage for each item.
 */
export async function getDashboardBOMReport(projectId: number): Promise<DashboardBOMReportItem[]> {
  try {
    const db = await getDB();

    // 1. Fetch BOMs with joined details
    const bomQb = new QueryBuilder()
      .select(
        "b.item_id", "b.item_price_id",
        "ps.stage_name",
        "i.item_name", "i.category", "i.unit",
        "ip.price",
      )
      .selectRaw("b.qty as planned_volume")
      .selectRaw("(b.qty * ip.price) as planned_budget")
      .from("bill_of_materials", "b")
      .join("project_stages", "ps", "ps.stage_id = b.stage_id")
      .join("items", "i", "i.item_id = b.item_id")
      .join("item_prices", "ip", "ip.price_id = b.item_price_id")
      .where("b.project_id", "=", projectId)
      .withSoftDelete("b")
      .orderBy("ps.stage_id", "ASC")
      .orderBy("i.category", "ASC")
      .orderBy("i.item_name", "ASC");

    const { sql: bomSql, params: bomParams } = bomQb.build();
    const boms = await db.select<DashboardBOMReportItem[]>(bomSql, bomParams);

    // 2. Fetch PO Aggregates
    const poQb = new QueryBuilder()
      .select("poi.item_id")
      .selectRaw("SUM(poi.qty) as total_ordered")
      .selectRaw("SUM(d.total_delivered) as total_delivered")
      .from("po_items", "poi")
      .join("purchase_orders", "po", "po.po_id = poi.po_id")
      .leftJoin(
        "(SELECT po_item_id, SUM(qty) as total_delivered FROM delivery_items GROUP BY po_item_id)",
        "d",
        "d.po_item_id = poi.po_item_id"
      )
      .where("po.project_id", "=", projectId)
      .where("po.deleted_at", "IS NULL")
      .groupBy("poi.item_id");

    const { sql: poSql, params: poParams } = poQb.build();
    const poAggs = await db.select<{ item_id: number; total_ordered: number; total_delivered: number }[]>(poSql, poParams);

    // 3. Build remaining map
    const itemRemaining = new Map<number, { ordered: number; delivered: number }>();
    for (const agg of poAggs) {
      itemRemaining.set(agg.item_id, {
        ordered: agg.total_ordered || 0,
        delivered: agg.total_delivered || 0,
      });
    }

    // Count stages per item for "last stage" detection
    const stageCounts = new Map<number, number>();
    for (const row of boms) {
      stageCounts.set(row.item_id, (stageCounts.get(row.item_id) || 0) + 1);
    }

    // 4. Distribute over BOM stages
    for (const row of boms) {
      const remain = itemRemaining.get(row.item_id);
      if (!remain) {
        row.total_ordered = 0;
        row.total_delivered = 0;
        row.total_po_price = 0;
        continue;
      }

      const count = stageCounts.get(row.item_id)!;
      stageCounts.set(row.item_id, count - 1);

      const isLastStage = count === 1;

      // Allocate ordered
      const allocateOrdered = isLastStage ? remain.ordered : Math.min(row.planned_volume, remain.ordered);
      row.total_ordered = allocateOrdered;
      remain.ordered -= allocateOrdered;

      // Allocate delivered
      const allocateDelivered = isLastStage ? remain.delivered : Math.min(allocateOrdered, remain.delivered);
      row.total_delivered = allocateDelivered;
      remain.delivered -= allocateDelivered;

      row.total_po_price = allocateOrdered * row.price;
    }

    return boms;
  } catch (error) {
    if (error instanceof DbError) throw error;
    throw wrapDbError(error, "dashboard");
  }
}
