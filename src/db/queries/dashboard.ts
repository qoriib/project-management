import { getDB } from "@/db/index";

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

export async function getDashboardBOMReport(projectId: number): Promise<DashboardBOMReportItem[]> {
  const db = await getDB();
  
  // 1. Fetch BOMs
  const bomQuery = `
    SELECT 
      b.item_id,
      b.item_price_id,
      ps.stage_name,
      i.item_name,
      i.category,
      i.unit,
      ip.price,
      b.qty as planned_volume,
      (b.qty * ip.price) as planned_budget
    FROM bill_of_materials b
    JOIN project_stages ps ON ps.stage_id = b.stage_id
    JOIN items i ON i.item_id = b.item_id
    JOIN item_prices ip ON ip.price_id = b.item_price_id
    WHERE b.project_id = $1
    ORDER BY ps.stage_id ASC, i.category ASC, i.item_name ASC
  `;
  const boms = await db.select<DashboardBOMReportItem[]>(bomQuery, [projectId]);

  // 2. Fetch PO Aggregates
  const poQuery = `
    SELECT 
      poi.item_id, 
      SUM(poi.qty) as total_ordered,
      SUM(d.total_delivered) as total_delivered
    FROM po_items poi
    JOIN purchase_orders po ON po.po_id = poi.po_id
    LEFT JOIN (
      SELECT po_item_id, SUM(qty) as total_delivered 
      FROM delivery_items 
      GROUP BY po_item_id
    ) d ON d.po_item_id = poi.po_item_id
    WHERE po.project_id = $1
    GROUP BY poi.item_id
  `;
  const poAggs = await db.select<any[]>(poQuery, [projectId]);

  // Map of remaining PO and Delivery for each item
  const itemRemaining = new Map<number, { ordered: number; delivered: number }>();
  for (const agg of poAggs) {
    itemRemaining.set(agg.item_id, {
      ordered: agg.total_ordered || 0,
      delivered: agg.total_delivered || 0,
    });
  }

  // Count how many stages an item appears in, so we can dump excess into the last one
  const stageCounts = new Map<number, number>();
  for (const row of boms) {
    stageCounts.set(row.item_id, (stageCounts.get(row.item_id) || 0) + 1);
  }

  // 3. Distribute over BOM stages
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
    // Delivered is capped by allocatedOrdered, but if they over-deliver, dump in last stage too
    const allocateDelivered = isLastStage ? remain.delivered : Math.min(allocateOrdered, remain.delivered);
    row.total_delivered = allocateDelivered;
    remain.delivered -= allocateDelivered;

    row.total_po_price = allocateOrdered * row.price;
  }

  return boms;
}
