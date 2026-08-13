import { getDB } from "@/db/index";
import type { Delivery as BaseDelivery, EquipmentLog as BaseEquipmentLog } from "@/db/schema";

// ── Types ────────────────────────────────────────────────────────────────────

export type Delivery = BaseDelivery & {
  po_id?: number;
  po_number?: string;
  item_name?: string;
  vendor_name?: string;
  unit?: string;
};

export type EquipmentLog = BaseEquipmentLog & {
  project_name?: string;
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

// ── Equipment ─────────────────────────────────────────────────────────────────

export async function getEquipmentLogs(filters?: {
  vendor_id?: number;
  project_id?: number;
  tanggal_dari?: string;
  tanggal_sampai?: string;
}): Promise<EquipmentLog[]> {
  const db = await getDB();
  const conditions: string[] = [];
  const params: any[] = [];
  let paramIdx = 1;

  if (filters?.vendor_id) {
    conditions.push(`e.vendor_id = $${paramIdx++}`);
    params.push(filters.vendor_id);
  }
  if (filters?.project_id) {
    conditions.push(`e.project_id = $${paramIdx++}`);
    params.push(filters.project_id);
  }
  if (filters?.tanggal_dari) {
    conditions.push(`e.work_date_start >= $${paramIdx++}`);
    params.push(filters.tanggal_dari);
  }
  if (filters?.tanggal_sampai) {
    conditions.push(`e.work_date_start <= $${paramIdx++}`);
    params.push(filters.tanggal_sampai);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const query = `
    SELECT 
      e.equip_log_id, e.project_id, e.vendor_id, e.equipment_name, e.operator_name,
      e.work_date_start, e.work_date_end, e.duration_value, e.duration_unit,
      e.rate_per_unit, e.total_cost, e.activity_description,
      v.vendor_name, p.project_name
    FROM equipment_logs e
    LEFT JOIN vendors v ON v.vendor_id = e.vendor_id
    LEFT JOIN projects p ON p.project_id = e.project_id
    ${whereClause}
    ORDER BY e.work_date_start DESC, e.equip_log_id DESC
  `;

  return db.select<EquipmentLog[]>(query, params);
}

export async function createEquipmentLog(data: Omit<EquipmentLog, "equip_log_id" | "vendor_name" | "project_name" | "total_cost">): Promise<void> {
  const db = await getDB();
  await db.execute(
    `INSERT INTO equipment_logs (project_id, vendor_id, equipment_name, operator_name, work_date_start, work_date_end, duration_value, duration_unit, rate_per_unit, activity_description)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
    [
      data.project_id ?? null,
      data.vendor_id ?? null,
      data.equipment_name,
      data.operator_name ?? null,
      data.work_date_start,
      data.work_date_end ?? null,
      data.duration_value,
      data.duration_unit,
      data.rate_per_unit,
      data.activity_description ?? null
    ]
  );
}

export async function deleteEquipmentLog(id: number): Promise<void> {
  const db = await getDB();
  await db.execute("DELETE FROM equipment_logs WHERE equip_log_id = $1", [id]);
}

