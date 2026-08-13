import { getDB } from "@/db/index";
import * as schema from "@/db/schema";
import { eq, desc, and, like, sql, inArray } from "drizzle-orm";

// ── Types ────────────────────────────────────────────────────────────────────

export type PurchaseOrder = typeof schema.purchaseOrders.$inferSelect & {
  vendor_name?: string;
  project_name?: string;
  subtotal_price?: number;
  ppn_amount?: number;
  total_price?: number;
};

export type POItem = typeof schema.poItems.$inferSelect & {
  item_name?: string;
  unit?: string;
  total_terkirim?: number;
  sisa?: number;
};

// ── Purchase Orders ───────────────────────────────────────────────────────────

export async function getPurchaseOrders(filters?: {
  vendor_id?: number;
  tanggal_dari?: string;
  tanggal_sampai?: string;
  search?: string;
}): Promise<PurchaseOrder[]> {
  const db = await getDB();
  const conditions = [];

  if (filters?.vendor_id) conditions.push(eq(schema.purchaseOrders.vendor_id, filters.vendor_id));
  if (filters?.tanggal_dari) conditions.push(sql`${schema.purchaseOrders.po_date} >= ${filters.tanggal_dari}`);
  if (filters?.tanggal_sampai) conditions.push(sql`${schema.purchaseOrders.po_date} <= ${filters.tanggal_sampai}`);
  if (filters?.search) conditions.push(like(schema.purchaseOrders.po_number, `%${filters.search}%`));

  const rows = await db
    .select({
      po_id: schema.purchaseOrders.po_id,
      project_id: schema.purchaseOrders.project_id,
      vendor_id: schema.purchaseOrders.vendor_id,
      po_number: schema.purchaseOrders.po_number,
      po_date: schema.purchaseOrders.po_date,
      notes: schema.purchaseOrders.notes,
      created_at: schema.purchaseOrders.created_at,
      vendor_name: schema.vendors.vendor_name,
      project_name: schema.projects.project_name,
      subtotal_price: sql<number>`COALESCE(SUM(${schema.poItems.subtotal_price}), 0)`,
      ppn_amount: sql<number>`COALESCE(SUM(${schema.poItems.ppn_amount}), 0)`,
      total_price: sql<number>`COALESCE(SUM(${schema.poItems.total_price}), 0)`,
    })
    .from(schema.purchaseOrders)
    .leftJoin(schema.vendors, eq(schema.vendors.vendor_id, schema.purchaseOrders.vendor_id))
    .leftJoin(schema.projects, eq(schema.projects.project_id, schema.purchaseOrders.project_id))
    .leftJoin(schema.poItems, eq(schema.poItems.po_id, schema.purchaseOrders.po_id))
    .where(and(...conditions))
    .groupBy(schema.purchaseOrders.po_id)
    .orderBy(desc(schema.purchaseOrders.po_date), desc(schema.purchaseOrders.po_id));

  return rows as PurchaseOrder[];
}

export async function getPOById(id: number): Promise<PurchaseOrder | null> {
  const db = await getDB();
  const rows = await db
    .select({
      po_id: schema.purchaseOrders.po_id,
      project_id: schema.purchaseOrders.project_id,
      vendor_id: schema.purchaseOrders.vendor_id,
      po_number: schema.purchaseOrders.po_number,
      po_date: schema.purchaseOrders.po_date,
      notes: schema.purchaseOrders.notes,
      created_at: schema.purchaseOrders.created_at,
      vendor_name: schema.vendors.vendor_name,
      project_name: schema.projects.project_name,
      subtotal_price: sql<number>`COALESCE(SUM(${schema.poItems.subtotal_price}), 0)`,
      ppn_amount: sql<number>`COALESCE(SUM(${schema.poItems.ppn_amount}), 0)`,
      total_price: sql<number>`COALESCE(SUM(${schema.poItems.total_price}), 0)`,
    })
    .from(schema.purchaseOrders)
    .leftJoin(schema.vendors, eq(schema.vendors.vendor_id, schema.purchaseOrders.vendor_id))
    .leftJoin(schema.projects, eq(schema.projects.project_id, schema.purchaseOrders.project_id))
    .leftJoin(schema.poItems, eq(schema.poItems.po_id, schema.purchaseOrders.po_id))
    .where(eq(schema.purchaseOrders.po_id, id))
    .groupBy(schema.purchaseOrders.po_id);

  return rows[0] as PurchaseOrder ?? null;
}

export async function createPO(
  po: Omit<PurchaseOrder, "po_id" | "vendor_name" | "project_name" | "subtotal_price" | "ppn_amount" | "total_price" | "created_at">,
  items: Omit<POItem, "po_item_id" | "po_id" | "item_name" | "unit" | "subtotal_price" | "ppn_amount" | "total_price" | "total_terkirim" | "sisa">[]
): Promise<number> {
  const db = await getDB();
  const poResult = await db.insert(schema.purchaseOrders).values({
    po_number: po.po_number,
    po_date: po.po_date,
    vendor_id: po.vendor_id,
    project_id: po.project_id,
    notes: po.notes
  }).returning({ po_id: schema.purchaseOrders.po_id });
  
  const poId = poResult[0].po_id;

  if (items.length > 0) {
    const itemValues = items.map(item => ({
      po_id: poId,
      item_id: item.item_id,
      ordered_volume: item.ordered_volume,
      unit_price: item.unit_price,
      ppn_percentage: item.ppn_percentage
    }));
    await db.insert(schema.poItems).values(itemValues);
  }

  return poId;
}

export async function updatePO(
  poId: number,
  po: Omit<PurchaseOrder, "po_id" | "vendor_name" | "project_name" | "subtotal_price" | "ppn_amount" | "total_price" | "created_at">,
  items: (Omit<POItem, "po_id" | "item_name" | "unit" | "subtotal_price" | "ppn_amount" | "total_price" | "total_terkirim" | "sisa"> & { po_item_id?: number })[]
): Promise<void> {
  const db = await getDB();
  
  await db.update(schema.purchaseOrders).set({
    po_number: po.po_number,
    po_date: po.po_date,
    vendor_id: po.vendor_id,
    project_id: po.project_id,
    notes: po.notes
  }).where(eq(schema.purchaseOrders.po_id, poId));
  
  const existingItems = await db.select({ po_item_id: schema.poItems.po_item_id })
                                .from(schema.poItems)
                                .where(eq(schema.poItems.po_id, poId));
  const newIds = new Set(items.map(i => i.po_item_id).filter(Boolean));
  
  const idsToDelete = existingItems.map(ex => ex.po_item_id).filter(id => !newIds.has(id));
  if (idsToDelete.length > 0) {
    await db.delete(schema.poItems).where(inArray(schema.poItems.po_item_id, idsToDelete));
  }

  const newItems = items.filter(i => !i.po_item_id);
  if (newItems.length > 0) {
    await db.insert(schema.poItems).values(newItems.map(item => ({
      po_id: poId,
      item_id: item.item_id,
      ordered_volume: item.ordered_volume,
      unit_price: item.unit_price,
      ppn_percentage: item.ppn_percentage
    })));
  }

  const itemsToUpdate = items.filter(i => i.po_item_id);
  for (const item of itemsToUpdate) {
    await db.update(schema.poItems).set({
      item_id: item.item_id,
      ordered_volume: item.ordered_volume,
      unit_price: item.unit_price,
      ppn_percentage: item.ppn_percentage
    }).where(eq(schema.poItems.po_item_id, item.po_item_id!));
  }
}

export async function deletePO(id: number): Promise<void> {
  const db = await getDB();
  await db.delete(schema.purchaseOrders).where(eq(schema.purchaseOrders.po_id, id));
}

export async function getPOItems(poId: number): Promise<POItem[]> {
  const db = await getDB();
  const rows = await db
    .select({
      po_item_id: schema.poItems.po_item_id,
      po_id: schema.poItems.po_id,
      item_id: schema.poItems.item_id,
      ordered_volume: schema.poItems.ordered_volume,
      unit_price: schema.poItems.unit_price,
      subtotal_price: schema.poItems.subtotal_price,
      ppn_percentage: schema.poItems.ppn_percentage,
      ppn_amount: schema.poItems.ppn_amount,
      total_price: schema.poItems.total_price,
      item_name: schema.items.item_name,
      unit: schema.items.unit,
      total_terkirim: sql<number>`COALESCE(SUM(${schema.deliveries.delivered_volume}), 0)`,
      sisa: sql<number>`${schema.poItems.ordered_volume} - COALESCE(SUM(${schema.deliveries.delivered_volume}), 0)`
    })
    .from(schema.poItems)
    .leftJoin(schema.items, eq(schema.items.item_id, schema.poItems.item_id))
    .leftJoin(schema.deliveries, eq(schema.deliveries.po_item_id, schema.poItems.po_item_id))
    .where(eq(schema.poItems.po_id, poId))
    .groupBy(schema.poItems.po_item_id);
    
  return rows as POItem[];
}
