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
  
  const query = `
    WITH po_agg AS (
      SELECT 
        po.project_id, 
        poi.item_id, 
        SUM(poi.qty) as total_ordered,
        SUM(poi.qty * ip.price) as total_po_price,
        SUM(d.total_delivered) as total_delivered
      FROM po_items poi
      JOIN purchase_orders po ON po.po_id = poi.po_id
      LEFT JOIN item_prices ip ON ip.price_id = poi.item_price_id
      LEFT JOIN (
        SELECT po_item_id, SUM(qty) as total_delivered 
        FROM delivery_items 
        GROUP BY po_item_id
      ) d ON d.po_item_id = poi.po_item_id
      GROUP BY po.project_id, poi.item_id
    )
    SELECT 
      b.item_id,
      b.item_price_id,
      ps.stage_name,
      i.item_name,
      i.category,
      i.unit,
      ip.price,
      b.qty as planned_volume,
      (b.qty * ip.price) as planned_budget,
      COALESCE(poa.total_ordered, 0) as total_ordered,
      COALESCE(poa.total_delivered, 0) as total_delivered,
      COALESCE(poa.total_po_price, 0) as total_po_price
    FROM bill_of_materials b
    JOIN project_stages ps ON ps.stage_id = b.stage_id
    JOIN items i ON i.item_id = b.item_id
    JOIN item_prices ip ON ip.price_id = b.item_price_id
    LEFT JOIN po_agg poa ON poa.project_id = b.project_id AND poa.item_id = b.item_id
    WHERE b.project_id = $1
    ORDER BY ps.stage_id ASC, i.category ASC, i.item_name ASC
  `;

  return db.select<DashboardBOMReportItem[]>(query, [projectId]);
}
