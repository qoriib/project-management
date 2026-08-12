import { getDB } from "@/db/index";

// ── Types ────────────────────────────────────────────────────────────────────

export interface Delivery {
  delivery_id: number;
  po_item_id: number;
  po_id?: number;
  po_number?: string;
  item_name?: string;
  vendor_name?: string;
  unit?: string;
  delivery_date: string;
  delivered_volume: number;
  delivery_note_number?: string;
  location_destination?: string;
  notes?: string;
}

export interface EquipmentLog {
  equip_log_id: number;
  project_id?: number;
  project_name?: string;
  vendor_id?: number;
  vendor_name?: string;
  equipment_name: string;
  operator_name?: string;
  work_date_start: string;
  work_date_end?: string;
  duration_value: number;
  duration_unit: string;
  rate_per_unit: number;
  total_cost?: number;
  activity_description?: string;
}

// ── Deliveries ────────────────────────────────────────────────────────────────

export async function getDeliveries(filters?: {
  vendor_id?: number;
  tanggal_dari?: string;
  tanggal_sampai?: string;
}): Promise<Delivery[]> {
  const db = await getDB();
  let sql = `
    SELECT d.*,
      pi.po_id,
      po.po_number,
      i.item_name,
      i.unit,
      v.vendor_name
    FROM deliveries d
    JOIN po_items pi ON pi.po_item_id = d.po_item_id
    JOIN purchase_orders po ON po.po_id = pi.po_id
    JOIN items i ON i.item_id = pi.item_id
    JOIN vendors v ON v.vendor_id = po.vendor_id
    WHERE 1=1
  `;
  const params: (string | number)[] = [];
  if (filters?.vendor_id) { sql += " AND po.vendor_id = ?"; params.push(filters.vendor_id); }
  if (filters?.tanggal_dari) { sql += " AND d.delivery_date >= ?"; params.push(filters.tanggal_dari); }
  if (filters?.tanggal_sampai) { sql += " AND d.delivery_date <= ?"; params.push(filters.tanggal_sampai); }
  sql += " ORDER BY d.delivery_date DESC, d.delivery_id DESC";
  return db.select<Delivery[]>(sql, params);
}

export async function createDelivery(data: Omit<Delivery, "delivery_id" | "po_id" | "po_number" | "item_name" | "vendor_name" | "unit">): Promise<void> {
  const db = await getDB();
  await db.execute(
    "INSERT INTO deliveries (po_item_id, delivery_date, delivered_volume, delivery_note_number, location_destination, notes) VALUES (?, ?, ?, ?, ?, ?)",
    [data.po_item_id, data.delivery_date, data.delivered_volume, data.delivery_note_number ?? null, data.location_destination ?? null, data.notes ?? null]
  );
}

export async function deleteDelivery(id: number): Promise<void> {
  const db = await getDB();
  await db.execute("DELETE FROM deliveries WHERE delivery_id = ?", [id]);
}

// ── Equipment ─────────────────────────────────────────────────────────────────

export async function getEquipmentLogs(filters?: {
  vendor_id?: number;
  tanggal_dari?: string;
  tanggal_sampai?: string;
}): Promise<EquipmentLog[]> {
  const db = await getDB();
  let sql = `
    SELECT el.*, v.vendor_name, p.project_name
    FROM equipment_logs el
    LEFT JOIN vendors v ON v.vendor_id = el.vendor_id
    LEFT JOIN projects p ON p.project_id = el.project_id
    WHERE 1=1
  `;
  const params: (string | number)[] = [];
  if (filters?.vendor_id) { sql += " AND el.vendor_id = ?"; params.push(filters.vendor_id); }
  if (filters?.tanggal_dari) { sql += " AND el.work_date_start >= ?"; params.push(filters.tanggal_dari); }
  if (filters?.tanggal_sampai) { sql += " AND el.work_date_start <= ?"; params.push(filters.tanggal_sampai); }
  sql += " ORDER BY el.work_date_start DESC, el.equip_log_id DESC";
  return db.select<EquipmentLog[]>(sql, params);
}

export async function createEquipmentLog(data: Omit<EquipmentLog, "equip_log_id" | "vendor_name" | "project_name" | "total_cost">): Promise<void> {
  const db = await getDB();
  await db.execute(
    "INSERT INTO equipment_logs (project_id, vendor_id, equipment_name, operator_name, work_date_start, work_date_end, duration_value, duration_unit, rate_per_unit, activity_description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
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
  await db.execute("DELETE FROM equipment_logs WHERE equip_log_id = ?", [id]);
}
