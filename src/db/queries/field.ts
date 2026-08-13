import { getDB } from "@/db/index";
import type { Delivery as BaseDelivery } from "@/db/schema";

// ── Types ────────────────────────────────────────────────────────────────────

export type Delivery = BaseDelivery & {
  po_id?: number;
  po_number?: string;
  item_name?: string;
  vendor_name?: string;
  unit?: string;
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
    conditions.push(`po.vendor_id = $${paramIdx++}`);
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
      d.delivery_id, d.po_item_id, d.delivery_date, d.delivered_volume, 
      d.delivery_note_number, d.location_destination, d.notes,
      poi.po_id, po.po_number, i.item_name, i.unit, v.vendor_name
    FROM deliveries d
    INNER JOIN po_items poi ON poi.po_item_id = d.po_item_id
    INNER JOIN purchase_orders po ON po.po_id = poi.po_id
    INNER JOIN items i ON i.item_id = poi.item_id
    INNER JOIN vendors v ON v.vendor_id = po.vendor_id
    ${whereClause}
    ORDER BY d.delivery_date DESC, d.delivery_id DESC
  `;

  return db.select<Delivery[]>(query, params);
}

export async function createDelivery(data: Omit<Delivery, "delivery_id" | "po_id" | "po_number" | "item_name" | "vendor_name" | "unit">): Promise<void> {
  const db = await getDB();
  await db.execute(
    `INSERT INTO deliveries (po_item_id, delivery_date, delivered_volume, delivery_note_number, location_destination, notes)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      data.po_item_id ?? null,
      data.delivery_date,
      data.delivered_volume,
      data.delivery_note_number ?? null,
      data.location_destination ?? null,
      data.notes ?? null
    ]
  );
}

export async function deleteDelivery(id: number): Promise<void> {
  const db = await getDB();
  await db.execute("DELETE FROM deliveries WHERE delivery_id = $1", [id]);
}



