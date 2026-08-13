import { getDB } from "@/db/index";
import type { Delivery as BaseDelivery, DeliveryItem as BaseDeliveryItem } from "@/db/schema";

// ── Types ────────────────────────────────────────────────────────────────────

export type Delivery = BaseDelivery & {
  item_count?: number;
  vendor_names?: string;
  project_name?: string;
};

export type DeliveryItem = BaseDeliveryItem & {
  item_name?: string;
  unit?: string;
  vendor_name?: string;
};

// ── Deliveries ────────────────────────────────────────────────────────────────

export async function getDeliveries(filters?: {
  vendor_id?: number;
  project_id?: number;
  tanggal_dari?: string;
  tanggal_sampai?: string;
}): Promise<Delivery[]> {
  const db = await getDB();
  const conditions: string[] = [];
  const params: any[] = [];
  let paramIdx = 1;

  if (filters?.vendor_id) {
    conditions.push(`poi.vendor_id = $${paramIdx++}`);
    params.push(filters.vendor_id);
  }
  if (filters?.project_id) {
    conditions.push(`po.project_id = $${paramIdx++}`);
    params.push(filters.project_id);
  }
  if (filters?.tanggal_dari) {
    conditions.push(`d.delivery_date >= $${paramIdx++}`);
    params.push(filters.tanggal_dari);
  }
  if (filters?.tanggal_sampai) {
    conditions.push(`d.delivery_date <= $${paramIdx++}`);
    params.push(filters.tanggal_sampai);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const query = `
    SELECT 
      d.delivery_id, d.po_id, d.delivery_date,
      p.project_name,
      COUNT(di.delivery_item_id) as item_count,
      GROUP_CONCAT(DISTINCT v.vendor_name) as vendor_names
    FROM deliveries d
    LEFT JOIN purchase_orders po ON po.po_id = d.po_id
    LEFT JOIN projects p ON p.project_id = po.project_id
    LEFT JOIN delivery_items di ON di.delivery_id = d.delivery_id
    LEFT JOIN po_items poi ON poi.po_item_id = di.po_item_id
    LEFT JOIN vendors v ON v.vendor_id = poi.vendor_id
    ${whereClause}
    GROUP BY d.delivery_id
    ORDER BY d.delivery_date DESC, d.delivery_id DESC
  `;

  return db.select<Delivery[]>(query, params);
}

export async function getDeliveryItems(deliveryId: number): Promise<DeliveryItem[]> {
  const db = await getDB();
  const query = `
    SELECT 
      di.*,
      i.item_name,
      i.unit,
      v.vendor_name
    FROM delivery_items di
    LEFT JOIN po_items poi ON poi.po_item_id = di.po_item_id
    LEFT JOIN items i ON i.item_id = poi.item_id
    LEFT JOIN vendors v ON v.vendor_id = poi.vendor_id
    WHERE di.delivery_id = $1
  `;
  return db.select<DeliveryItem[]>(query, [deliveryId]);
}

export async function getDeliveryItemsByPO(poId: number): Promise<(DeliveryItem & { delivery_date: string })[]> {
  const db = await getDB();
  const query = `
    SELECT 
      di.*,
      d.delivery_date,
      i.item_name,
      i.unit,
      v.vendor_name
    FROM delivery_items di
    INNER JOIN deliveries d ON d.delivery_id = di.delivery_id
    INNER JOIN po_items poi ON poi.po_item_id = di.po_item_id
    INNER JOIN items i ON i.item_id = poi.item_id
    LEFT JOIN vendors v ON v.vendor_id = poi.vendor_id
    WHERE poi.po_id = $1
    ORDER BY d.delivery_date DESC, di.delivery_item_id DESC
  `;
  return db.select<(DeliveryItem & { delivery_date: string })[]>(query, [poId]);
}

export async function createDelivery(
  header: { po_id: number; delivery_date: string },
  items: { po_item_id: number; qty: number }[]
): Promise<void> {
  const db = await getDB();
  
  // Insert Header
  const result = await db.execute(
    `INSERT INTO deliveries (po_id, delivery_date) VALUES ($1, $2)`,
    [header.po_id, header.delivery_date]
  );
  
  const deliveryId = result.lastInsertId as number;

  // Insert Items
  if (items.length > 0) {
    for (const item of items) {
      if (item.qty > 0) {
        await db.execute(
          `INSERT INTO delivery_items (delivery_id, po_item_id, qty) VALUES ($1, $2, $3)`,
          [deliveryId, item.po_item_id, item.qty]
        );
      }
    }
  }
}

export async function deleteDelivery(id: number): Promise<void> {
  const db = await getDB();
  // delivery_items will be deleted automatically due to ON DELETE CASCADE
  await db.execute("DELETE FROM deliveries WHERE delivery_id = $1", [id]);
}
