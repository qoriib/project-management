import { getDB } from "@/db/index";
import type { PurchaseOrder as BasePurchaseOrder, POItem as BasePOItem } from "@/db/schema";

// ── Types ────────────────────────────────────────────────────────────────────

export type PurchaseOrder = BasePurchaseOrder & {
  vendor_name?: string;
  project_name?: string;
  subtotal_price?: number;
  ppn_amount?: number;
  total_price?: number;
};

export type POItem = BasePOItem & {
  item_name?: string;
  unit?: string;
  total_terkirim?: number;
  sisa?: number;
};

// ── Purchase Orders ───────────────────────────────────────────────────────────

export async function getPurchaseOrders(filters?: {
  vendor_id?: number;
  project_id?: number;
  tanggal_dari?: string;
  tanggal_sampai?: string;
  search?: string;
}): Promise<PurchaseOrder[]> {
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
    conditions.push(`po.po_date >= $${paramIdx++}`);
    params.push(filters.tanggal_dari);
  }
  if (filters?.tanggal_sampai) {
    conditions.push(`po.po_date <= $${paramIdx++}`);
    params.push(filters.tanggal_sampai);
  }
  if (filters?.search) {
    conditions.push(`po.po_number LIKE $${paramIdx++}`);
    params.push(`%${filters.search}%`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const query = `
    SELECT 
      po.po_id, po.project_id, po.vendor_id, po.po_number, po.po_date, po.notes, po.created_at,
      v.vendor_name,
      p.project_name,
      COALESCE(SUM(poi.subtotal_price), 0) as subtotal_price,
      COALESCE(SUM(poi.ppn_amount), 0) as ppn_amount,
      COALESCE(SUM(poi.total_price), 0) as total_price
    FROM purchase_orders po
    LEFT JOIN vendors v ON v.vendor_id = po.vendor_id
    LEFT JOIN projects p ON p.project_id = po.project_id
    LEFT JOIN po_items poi ON poi.po_id = po.po_id
    ${whereClause}
    GROUP BY po.po_id
    ORDER BY po.po_date DESC, po.po_id DESC
  `;

  return db.select<PurchaseOrder[]>(query, params);
}

export async function getPOById(id: number): Promise<PurchaseOrder | null> {
  const db = await getDB();
  const query = `
    SELECT 
      po.po_id, po.project_id, po.vendor_id, po.po_number, po.po_date, po.notes, po.created_at,
      v.vendor_name,
      p.project_name,
      COALESCE(SUM(poi.subtotal_price), 0) as subtotal_price,
      COALESCE(SUM(poi.ppn_amount), 0) as ppn_amount,
      COALESCE(SUM(poi.total_price), 0) as total_price
    FROM purchase_orders po
    LEFT JOIN vendors v ON v.vendor_id = po.vendor_id
    LEFT JOIN projects p ON p.project_id = po.project_id
    LEFT JOIN po_items poi ON poi.po_id = po.po_id
    WHERE po.po_id = $1
    GROUP BY po.po_id
  `;
  const rows = await db.select<PurchaseOrder[]>(query, [id]);
  return rows[0] ?? null;
}

export async function createPO(
  po: Omit<PurchaseOrder, "po_id" | "vendor_name" | "project_name" | "subtotal_price" | "ppn_amount" | "total_price" | "created_at">,
  items: Omit<POItem, "po_item_id" | "po_id" | "item_name" | "unit" | "subtotal_price" | "ppn_amount" | "total_price" | "total_terkirim" | "sisa">[]
): Promise<number> {
  const db = await getDB();
  
  const result = await db.execute(
    `INSERT INTO purchase_orders (po_number, po_date, vendor_id, project_id, notes) 
     VALUES ($1, $2, $3, $4, $5)`,
    [po.po_number, po.po_date, po.vendor_id ?? null, po.project_id ?? null, po.notes ?? null]
  );
  
  const poId = result.lastInsertId as number;

  if (items.length > 0) {
    for (const item of items) {
      await db.execute(
        `INSERT INTO po_items (po_id, item_id, ordered_volume, unit_price, ppn_percentage) 
         VALUES ($1, $2, $3, $4, $5)`,
        [poId, item.item_id ?? null, item.ordered_volume, item.unit_price, item.ppn_percentage]
      );
    }
  }

  return poId;
}

export async function updatePO(
  poId: number,
  po: Omit<PurchaseOrder, "po_id" | "vendor_name" | "project_name" | "subtotal_price" | "ppn_amount" | "total_price" | "created_at">,
  items: (Omit<POItem, "po_id" | "item_name" | "unit" | "subtotal_price" | "ppn_amount" | "total_price" | "total_terkirim" | "sisa"> & { po_item_id?: number })[]
): Promise<void> {
  const db = await getDB();
  
  await db.execute(
    `UPDATE purchase_orders SET 
      po_number = $1, po_date = $2, vendor_id = $3, project_id = $4, notes = $5 
     WHERE po_id = $6`,
    [po.po_number, po.po_date, po.vendor_id ?? null, po.project_id ?? null, po.notes ?? null, poId]
  );
  
  const existingItems = await db.select<{ po_item_id: number }[]>("SELECT po_item_id FROM po_items WHERE po_id = $1", [poId]);
  const newIds = new Set(items.map(i => i.po_item_id).filter(Boolean));
  
  const idsToDelete = existingItems.map(ex => ex.po_item_id).filter(id => !newIds.has(id));
  for (const id of idsToDelete) {
    await db.execute("DELETE FROM po_items WHERE po_item_id = $1", [id]);
  }

  for (const item of items) {
    if (!item.po_item_id) {
      await db.execute(
        `INSERT INTO po_items (po_id, item_id, ordered_volume, unit_price, ppn_percentage) 
         VALUES ($1, $2, $3, $4, $5)`,
        [poId, item.item_id ?? null, item.ordered_volume, item.unit_price, item.ppn_percentage]
      );
    } else {
      await db.execute(
        `UPDATE po_items SET 
          item_id = $1, ordered_volume = $2, unit_price = $3, ppn_percentage = $4 
         WHERE po_item_id = $5`,
        [item.item_id ?? null, item.ordered_volume, item.unit_price, item.ppn_percentage, item.po_item_id]
      );
    }
  }
}

export async function deletePO(id: number): Promise<void> {
  const db = await getDB();
  await db.execute("DELETE FROM purchase_orders WHERE po_id = $1", [id]);
}

export async function getPOItems(poId: number): Promise<POItem[]> {
  const db = await getDB();
  const query = `
    SELECT 
      poi.po_item_id, poi.po_id, poi.item_id, poi.ordered_volume, poi.unit_price,
      poi.subtotal_price, poi.ppn_percentage, poi.ppn_amount, poi.total_price,
      i.item_name, i.unit,
      COALESCE(SUM(d.delivered_volume), 0) as total_terkirim,
      poi.ordered_volume - COALESCE(SUM(d.delivered_volume), 0) as sisa
    FROM po_items poi
    LEFT JOIN items i ON i.item_id = poi.item_id
    LEFT JOIN deliveries d ON d.po_item_id = poi.po_item_id
    WHERE poi.po_id = $1
    GROUP BY poi.po_item_id
  `;
  return db.select<POItem[]>(query, [poId]);
}

