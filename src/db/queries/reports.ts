import { getDB } from "@/db/index";

// ── Types ────────────────────────────────────────────────────────────────────

export interface CategoryCostRow {
  category: string;
  total_biaya: number;
}

export interface ProjectCostRow {
  project_id: number;
  project_code: string;
  project_name: string;
  contractor_name: string;
  total_po: number;
  total_terkirim_biaya: number;
  total_invoice: number;
  total_bayar: number;
  saldo_utang: number;
}

export interface DashboardStats {
  total_po_aktif: number;
  total_biaya: number;
  saldo_utang: number;
  total_pengiriman: number;
}

// ── Dashboard Stats ───────────────────────────────────────────────────────────

export async function getDashboardStats(): Promise<DashboardStats> {
  const db = await getDB();

  const [poRows, invoiceRows, deliveryRows] = await Promise.all([
    db.select<{ count: number; total: number }[]>(
      `SELECT COUNT(DISTINCT po.po_id) AS count,
        COALESCE(SUM(pi.total_price), 0) AS total
       FROM purchase_orders po
       LEFT JOIN po_items pi ON pi.po_id = po.po_id`
    ),
    db.select<{ total_tagihan: number; total_bayar: number }[]>(
      `SELECT
        COALESCE(SUM(i.total_amount), 0) AS total_tagihan,
        COALESCE(SUM(i.paid_amount), 0) AS total_bayar
       FROM invoices i`
    ),
    db.select<{ count: number }[]>(
      "SELECT COUNT(*) AS count FROM deliveries"
    ),
  ]);

  return {
    total_po_aktif: poRows[0]?.count ?? 0,
    total_biaya: poRows[0]?.total ?? 0,
    saldo_utang: (invoiceRows[0]?.total_tagihan ?? 0) - (invoiceRows[0]?.total_bayar ?? 0),
    total_pengiriman: deliveryRows[0]?.count ?? 0,
  };
}

// ── Category Cost ─────────────────────────────────────────────────────────────

export async function getCostByCategory(): Promise<CategoryCostRow[]> {
  const db = await getDB();
  return db.select<CategoryCostRow[]>(`
    SELECT
      i.category AS category,
      COALESCE(SUM(d.delivered_volume * pi.unit_price), 0) AS total_biaya
    FROM deliveries d
    JOIN po_items pi ON pi.po_item_id = d.po_item_id
    JOIN items i ON i.item_id = pi.item_id
    GROUP BY i.category
    ORDER BY total_biaya DESC
  `);
}

// ── PO Volume Alerts ──────────────────────────────────────────────────────────

export async function getPOVolumeAlerts(thresholdPct: number = 90): Promise<
  { po_number: string; item_name: string; pct_terkirim: number; sisa: number; unit: string }[]
> {
  const db = await getDB();
  return db.select(`
    SELECT
      po.po_number,
      i.item_name,
      i.unit,
      pi.ordered_volume,
      COALESCE(SUM(d.delivered_volume), 0) AS total_terkirim,
      pi.ordered_volume - COALESCE(SUM(d.delivered_volume), 0) AS sisa,
      ROUND(COALESCE(SUM(d.delivered_volume), 0) / pi.ordered_volume * 100, 1) AS pct_terkirim
    FROM po_items pi
    JOIN purchase_orders po ON po.po_id = pi.po_id
    JOIN items i ON i.item_id = pi.item_id
    LEFT JOIN deliveries d ON d.po_item_id = pi.po_item_id
    GROUP BY pi.po_item_id
    HAVING pct_terkirim >= ?
    ORDER BY pct_terkirim DESC
  `, [thresholdPct]);
}

// ── Full Cost Report ──────────────────────────────────────────────────────────

export async function getProjectCostReport(): Promise<ProjectCostRow[]> {
  const db = await getDB();
  return db.select<ProjectCostRow[]>(`
    SELECT
      p.project_id,
      p.project_code,
      p.project_name,
      p.contractor_name,
      COALESCE(SUM(pi.total_price), 0) AS total_po,
      COALESCE((
        SELECT SUM(d.delivered_volume * pi2.unit_price)
        FROM deliveries d
        JOIN po_items pi2 ON pi2.po_item_id = d.po_item_id
        JOIN purchase_orders po2 ON po2.po_id = pi2.po_id
        WHERE po2.project_id = p.project_id
      ), 0) AS total_terkirim_biaya,
      COALESCE((SELECT SUM(i.total_amount) FROM invoices i WHERE i.project_id = p.project_id), 0) AS total_invoice,
      COALESCE((SELECT SUM(i.paid_amount) FROM invoices i WHERE i.project_id = p.project_id), 0) AS total_bayar,
      COALESCE((SELECT SUM(i.remaining_balance) FROM invoices i WHERE i.project_id = p.project_id), 0) AS saldo_utang
    FROM projects p
    LEFT JOIN purchase_orders po ON po.project_id = p.project_id
    LEFT JOIN po_items pi ON pi.po_id = po.po_id
    GROUP BY p.project_id
    ORDER BY total_po DESC
  `);
}
