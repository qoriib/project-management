import { getDB } from "@/db/index";
import * as schema from "@/db/schema";
import { eq, desc, and, sql } from "drizzle-orm";

// ── Types ────────────────────────────────────────────────────────────────────

export type Delivery = typeof schema.deliveries.$inferSelect & {
  po_id?: number;
  po_number?: string;
  item_name?: string;
  vendor_name?: string;
  unit?: string;
};

export type EquipmentLog = typeof schema.equipmentLogs.$inferSelect & {
  project_name?: string;
  vendor_name?: string;
};

// ── Deliveries ────────────────────────────────────────────────────────────────

export async function getDeliveries(filters?: {
  vendor_id?: number;
  tanggal_dari?: string;
  tanggal_sampai?: string;
}): Promise<Delivery[]> {
  const db = await getDB();
  const conditions = [];

  if (filters?.vendor_id) conditions.push(eq(schema.purchaseOrders.vendor_id, filters.vendor_id));
  if (filters?.tanggal_dari) conditions.push(sql`${schema.deliveries.delivery_date} >= ${filters.tanggal_dari}`);
  if (filters?.tanggal_sampai) conditions.push(sql`${schema.deliveries.delivery_date} <= ${filters.tanggal_sampai}`);

  const rows = await db
    .select({
      delivery_id: schema.deliveries.delivery_id,
      po_item_id: schema.deliveries.po_item_id,
      delivery_date: schema.deliveries.delivery_date,
      delivered_volume: schema.deliveries.delivered_volume,
      delivery_note_number: schema.deliveries.delivery_note_number,
      location_destination: schema.deliveries.location_destination,
      notes: schema.deliveries.notes,
      po_id: schema.poItems.po_id,
      po_number: schema.purchaseOrders.po_number,
      item_name: schema.items.item_name,
      unit: schema.items.unit,
      vendor_name: schema.vendors.vendor_name,
    })
    .from(schema.deliveries)
    .innerJoin(schema.poItems, eq(schema.poItems.po_item_id, schema.deliveries.po_item_id))
    .innerJoin(schema.purchaseOrders, eq(schema.purchaseOrders.po_id, schema.poItems.po_id))
    .innerJoin(schema.items, eq(schema.items.item_id, schema.poItems.item_id))
    .innerJoin(schema.vendors, eq(schema.vendors.vendor_id, schema.purchaseOrders.vendor_id))
    .where(and(...conditions))
    .orderBy(desc(schema.deliveries.delivery_date), desc(schema.deliveries.delivery_id));

  return rows as Delivery[];
}

export async function createDelivery(data: Omit<Delivery, "delivery_id" | "po_id" | "po_number" | "item_name" | "vendor_name" | "unit">): Promise<void> {
  const db = await getDB();
  await db.insert(schema.deliveries).values({
    po_item_id: data.po_item_id!,
    delivery_date: data.delivery_date,
    delivered_volume: data.delivered_volume,
    delivery_note_number: data.delivery_note_number ?? null,
    location_destination: data.location_destination ?? null,
    notes: data.notes ?? null,
  });
}

export async function deleteDelivery(id: number): Promise<void> {
  const db = await getDB();
  await db.delete(schema.deliveries).where(eq(schema.deliveries.delivery_id, id));
}

// ── Equipment ─────────────────────────────────────────────────────────────────

export async function getEquipmentLogs(filters?: {
  vendor_id?: number;
  tanggal_dari?: string;
  tanggal_sampai?: string;
}): Promise<EquipmentLog[]> {
  const db = await getDB();
  const conditions = [];

  if (filters?.vendor_id) conditions.push(eq(schema.equipmentLogs.vendor_id, filters.vendor_id));
  if (filters?.tanggal_dari) conditions.push(sql`${schema.equipmentLogs.work_date_start} >= ${filters.tanggal_dari}`);
  if (filters?.tanggal_sampai) conditions.push(sql`${schema.equipmentLogs.work_date_start} <= ${filters.tanggal_sampai}`);

  const rows = await db
    .select({
      equip_log_id: schema.equipmentLogs.equip_log_id,
      project_id: schema.equipmentLogs.project_id,
      vendor_id: schema.equipmentLogs.vendor_id,
      equipment_name: schema.equipmentLogs.equipment_name,
      operator_name: schema.equipmentLogs.operator_name,
      work_date_start: schema.equipmentLogs.work_date_start,
      work_date_end: schema.equipmentLogs.work_date_end,
      duration_value: schema.equipmentLogs.duration_value,
      duration_unit: schema.equipmentLogs.duration_unit,
      rate_per_unit: schema.equipmentLogs.rate_per_unit,
      total_cost: schema.equipmentLogs.total_cost,
      activity_description: schema.equipmentLogs.activity_description,
      vendor_name: schema.vendors.vendor_name,
      project_name: schema.projects.project_name,
    })
    .from(schema.equipmentLogs)
    .leftJoin(schema.vendors, eq(schema.vendors.vendor_id, schema.equipmentLogs.vendor_id))
    .leftJoin(schema.projects, eq(schema.projects.project_id, schema.equipmentLogs.project_id))
    .where(and(...conditions))
    .orderBy(desc(schema.equipmentLogs.work_date_start), desc(schema.equipmentLogs.equip_log_id));

  return rows as EquipmentLog[];
}

export async function createEquipmentLog(data: Omit<EquipmentLog, "equip_log_id" | "vendor_name" | "project_name" | "total_cost">): Promise<void> {
  const db = await getDB();
  await db.insert(schema.equipmentLogs).values({
    project_id: data.project_id ?? null,
    vendor_id: data.vendor_id ?? null,
    equipment_name: data.equipment_name,
    operator_name: data.operator_name ?? null,
    work_date_start: data.work_date_start,
    work_date_end: data.work_date_end ?? null,
    duration_value: data.duration_value,
    duration_unit: data.duration_unit,
    rate_per_unit: data.rate_per_unit,
    activity_description: data.activity_description ?? null,
  });
}

export async function deleteEquipmentLog(id: number): Promise<void> {
  const db = await getDB();
  await db.delete(schema.equipmentLogs).where(eq(schema.equipmentLogs.equip_log_id, id));
}
