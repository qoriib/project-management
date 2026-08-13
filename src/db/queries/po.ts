import { getDB } from "@/db/index";
import type { PurchaseOrder as BasePurchaseOrder, POItem as BasePOItem } from "@/db/schema";

// ── Types ────────────────────────────────────────────────────────────────────

export type PurchaseOrder = BasePurchaseOrder & {
  project_name?: string;
  total_price?: number;
};

export type POItem = BasePOItem & {
  item_name?: string;
  unit?: string;
  price?: number;
  vendor_name?: string;
  total_terkirim?: number;
  sisa?: number;
};

// ── Purchase Orders ───────────────────────────────────────────────────────────

export async function getPurchaseOrders(filters?: {
  project_id?: number;
  tanggal_dari?: string;
  tanggal_sampai?: string;
}): Promise<(PurchaseOrder & { item_count: number; vendor_names: string })[]> {
  const db = await getDB();
  const conditions: string[] = [];
  const params: any[] = [];
  let paramIdx = 1;

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

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const query = `
    SELECT 
      po.po_id, po.project_id, po.po_date, po.created_at,
      p.project_name,
      COALESCE(SUM(poi.qty * ip.price), 0) as total_price,
      COUNT(poi.po_item_id) as item_count,
      GROUP_CONCAT(DISTINCT v.vendor_name) as vendor_names
    FROM purchase_orders po
    LEFT JOIN projects p ON p.project_id = po.project_id
    LEFT JOIN po_items poi ON poi.po_id = po.po_id
    LEFT JOIN item_prices ip ON ip.price_id = poi.item_price_id
    LEFT JOIN vendors v ON v.vendor_id = poi.vendor_id
    ${whereClause}
    GROUP BY po.po_id
    ORDER BY po.po_date DESC, po.po_id DESC
  `;

  return db.select<any>(query, params);
}

export async function getPOById(id: number): Promise<PurchaseOrder | null> {
  const db = await getDB();
  const query = `
    SELECT 
      po.po_id, po.project_id, po.po_date, po.created_at,
      p.project_name,
      COALESCE(SUM(poi.qty * ip.price), 0) as total_price
    FROM purchase_orders po
    LEFT JOIN projects p ON p.project_id = po.project_id
    LEFT JOIN po_items poi ON poi.po_id = po.po_id
    LEFT JOIN item_prices ip ON ip.price_id = poi.item_price_id
    WHERE po.po_id = $1
    GROUP BY po.po_id
  `;
  const rows = await db.select<PurchaseOrder[]>(query, [id]);
  return rows[0] ?? null;
}

export async function createPO(
  po: Omit<PurchaseOrder, "po_id" | "project_name" | "total_price" | "created_at">,
  items: Omit<POItem, "po_item_id" | "po_id" | "item_name" | "unit" | "price" | "vendor_name" | "total_terkirim" | "sisa">[]
): Promise<number> {
  const db = await getDB();
  
  const result = await db.execute(
    `INSERT INTO purchase_orders (po_date, project_id) VALUES ($1, $2)`,
    [po.po_date, po.project_id ?? null]
  );
  
  const poId = result.lastInsertId as number;

  if (items.length > 0) {
    for (const item of items) {
      await db.execute(
        `INSERT INTO po_items (po_id, item_id, item_price_id, vendor_id, qty) 
         VALUES ($1, $2, $3, $4, $5)`,
        [poId, item.item_id ?? null, item.item_price_id ?? null, item.vendor_id ?? null, item.qty]
      );
    }
  }

  return poId;
}

export async function updatePO(
  poId: number,
  po: Omit<PurchaseOrder, "po_id" | "project_name" | "total_price" | "created_at">,
  items: (Omit<POItem, "po_id" | "item_name" | "unit" | "price" | "vendor_name" | "total_terkirim" | "sisa"> & { po_item_id?: number })[]
): Promise<void> {
  const db = await getDB();
  
  await db.execute(
    `UPDATE purchase_orders SET po_date = $1, project_id = $2 WHERE po_id = $3`,
    [po.po_date, po.project_id ?? null, poId]
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
        `INSERT INTO po_items (po_id, item_id, item_price_id, vendor_id, qty) 
         VALUES ($1, $2, $3, $4, $5)`,
        [poId, item.item_id ?? null, item.item_price_id ?? null, item.vendor_id ?? null, item.qty]
      );
    } else {
      await db.execute(
        `UPDATE po_items SET 
          item_id = $1, item_price_id = $2, vendor_id = $3, qty = $4 
         WHERE po_item_id = $5`,
        [item.item_id ?? null, item.item_price_id ?? null, item.vendor_id ?? null, item.qty, item.po_item_id]
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
      poi.po_item_id, poi.po_id, poi.item_id, poi.item_price_id, poi.vendor_id, poi.qty,
      i.item_name, i.unit,
      ip.price,
      v.vendor_name,
      COALESCE(SUM(d.qty), 0) as total_terkirim,
      poi.qty - COALESCE(SUM(d.qty), 0) as sisa
    FROM po_items poi
    LEFT JOIN items i ON i.item_id = poi.item_id
    LEFT JOIN item_prices ip ON ip.price_id = poi.item_price_id
    LEFT JOIN vendors v ON v.vendor_id = poi.vendor_id
    LEFT JOIN delivery_items d ON d.po_item_id = poi.po_item_id
    WHERE poi.po_id = $1
    GROUP BY poi.po_item_id
  `;
  return db.select<POItem[]>(query, [poId]);
}
