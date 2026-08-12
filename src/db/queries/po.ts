import { getDB } from "../index";

// ── Types ────────────────────────────────────────────────────────────────────

export interface PurchaseOrder {
  po_id: number;
  project_id?: number;
  project_name?: string;
  vendor_id: number;
  vendor_name?: string;
  po_number: string;
  po_date: string;
  notes?: string;
  created_at: string;
  subtotal_price?: number;
  ppn_amount?: number;
  total_price?: number;
}

export interface POItem {
  po_item_id: number;
  po_id: number;
  item_id: number;
  item_name?: string;
  unit?: string;
  ordered_volume: number;
  unit_price: number;
  subtotal_price?: number;
  ppn_percentage: number;
  ppn_amount?: number;
  total_price?: number;
  total_terkirim?: number;
  sisa?: number;
}

// ── Purchase Orders ───────────────────────────────────────────────────────────

export async function getPurchaseOrders(filters?: {
  vendor_id?: number;
  tanggal_dari?: string;
  tanggal_sampai?: string;
  search?: string;
}): Promise<PurchaseOrder[]> {
  const db = await getDB();
  let sql = `
    SELECT
      po.*,
      v.vendor_name AS vendor_name,
      p.project_name AS project_name,
      COALESCE(SUM(pi.subtotal_price), 0) AS subtotal_price,
      COALESCE(SUM(pi.ppn_amount), 0) AS ppn_amount,
      COALESCE(SUM(pi.total_price), 0) AS total_price
    FROM purchase_orders po
    LEFT JOIN vendors v ON v.vendor_id = po.vendor_id
    LEFT JOIN projects p ON p.project_id = po.project_id
    LEFT JOIN po_items pi ON pi.po_id = po.po_id
    WHERE 1=1
  `;
  const params: (string | number)[] = [];

  if (filters?.vendor_id) {
    sql += " AND po.vendor_id = ?";
    params.push(filters.vendor_id);
  }
  if (filters?.tanggal_dari) {
    sql += " AND po.po_date >= ?";
    params.push(filters.tanggal_dari);
  }
  if (filters?.tanggal_sampai) {
    sql += " AND po.po_date <= ?";
    params.push(filters.tanggal_sampai);
  }
  if (filters?.search) {
    sql += " AND po.po_number LIKE ?";
    params.push(`%${filters.search}%`);
  }

  sql += " GROUP BY po.po_id ORDER BY po.po_date DESC, po.po_id DESC";
  return db.select<PurchaseOrder[]>(sql, params);
}

export async function getPOById(id: number): Promise<PurchaseOrder | null> {
  const db = await getDB();
  const rows = await db.select<PurchaseOrder[]>(
    `SELECT po.*, v.vendor_name AS vendor_name, p.project_name AS project_name,
      COALESCE(SUM(pi.subtotal_price), 0) AS subtotal_price,
      COALESCE(SUM(pi.ppn_amount), 0) AS ppn_amount,
      COALESCE(SUM(pi.total_price), 0) AS total_price
     FROM purchase_orders po
     LEFT JOIN vendors v ON v.vendor_id = po.vendor_id
     LEFT JOIN projects p ON p.project_id = po.project_id
     LEFT JOIN po_items pi ON pi.po_id = po.po_id
     WHERE po.po_id = ?
     GROUP BY po.po_id`,
    [id]
  );
  return rows[0] ?? null;
}

export async function createPO(
  po: Omit<PurchaseOrder, "po_id" | "vendor_name" | "project_name" | "subtotal_price" | "ppn_amount" | "total_price" | "created_at">,
  items: Omit<POItem, "po_item_id" | "po_id" | "item_name" | "unit" | "subtotal_price" | "ppn_amount" | "total_price" | "total_terkirim" | "sisa">[]
): Promise<number> {
  const db = await getDB();
  const result = await db.execute(
    `INSERT INTO purchase_orders (po_number, po_date, vendor_id, project_id, notes)
     VALUES (?, ?, ?, ?, ?)`,
    [po.po_number, po.po_date, po.vendor_id, po.project_id ?? null, po.notes ?? null]
  );
  const poId = result.lastInsertId;
  for (const item of items) {
    await db.execute(
      "INSERT INTO po_items (po_id, item_id, ordered_volume, unit_price, ppn_percentage) VALUES (?, ?, ?, ?, ?)",
      [poId, item.item_id, item.ordered_volume, item.unit_price, item.ppn_percentage]
    );
  }
  return poId;
}

export async function deletePO(id: number): Promise<void> {
  const db = await getDB();
  await db.execute("DELETE FROM purchase_orders WHERE po_id = ?", [id]);
}

export async function getPOItems(poId: number): Promise<POItem[]> {
  const db = await getDB();
  return db.select<POItem[]>(
    `SELECT pi.*, i.item_name, i.unit,
      COALESCE(SUM(d.delivered_volume), 0) AS total_terkirim,
      pi.ordered_volume - COALESCE(SUM(d.delivered_volume), 0) AS sisa
     FROM po_items pi
     LEFT JOIN items i ON i.item_id = pi.item_id
     LEFT JOIN deliveries d ON d.po_item_id = pi.po_item_id
     WHERE pi.po_id = ?
     GROUP BY pi.po_item_id`,
    [poId]
  );
}
