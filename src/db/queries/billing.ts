import { getDB } from "../index";

// ── Types ────────────────────────────────────────────────────────────────────

export interface Invoice {
  invoice_id: number;
  project_id?: number;
  project_name?: string;
  vendor_id: number;
  vendor_name?: string;
  invoice_number?: string;
  invoice_date: string;
  total_amount: number;
  paid_amount: number;
  remaining_balance?: number;
  payment_status: "UNPAID" | "PARTIAL" | "PAID";
  ownership_type: "INTERNAL" | "EKSTERNAL";
  created_at: string;
}

export interface InvoiceItem {
  inv_item_id: number;
  invoice_id: number;
  po_item_id?: number;
  equip_log_id?: number;
  description: string;
  amount: number;
}

export interface DebtSummaryRow {
  vendor_id: number;
  vendor_name: string;
  vendor_type: string;
  jumlah_invoice: number;
  total_tagihan: number;
  total_bayar: number;
  saldo_utang: number;
}

// ── Invoices ─────────────────────────────────────────────────────────────────

export async function getInvoices(filters?: {
  vendor_id?: number;
  payment_status?: string;
  tanggal_dari?: string;
  tanggal_sampai?: string;
}): Promise<Invoice[]> {
  const db = await getDB();
  let sql = `
    SELECT
      i.*,
      v.vendor_name AS vendor_name,
      p.project_name AS project_name
    FROM invoices i
    LEFT JOIN vendors v ON v.vendor_id = i.vendor_id
    LEFT JOIN projects p ON p.project_id = i.project_id
    WHERE 1=1
  `;
  const params: (string | number)[] = [];
  if (filters?.vendor_id) { sql += " AND i.vendor_id = ?"; params.push(filters.vendor_id); }
  if (filters?.payment_status) { sql += " AND i.payment_status = ?"; params.push(filters.payment_status); }
  if (filters?.tanggal_dari) { sql += " AND i.invoice_date >= ?"; params.push(filters.tanggal_dari); }
  if (filters?.tanggal_sampai) { sql += " AND i.invoice_date <= ?"; params.push(filters.tanggal_sampai); }
  sql += " ORDER BY i.invoice_date DESC, i.invoice_id DESC";
  return db.select<Invoice[]>(sql, params);
}

export async function createInvoice(
  invoice: Omit<Invoice, "invoice_id" | "vendor_name" | "project_name" | "remaining_balance" | "created_at">,
  items: Omit<InvoiceItem, "inv_item_id" | "invoice_id">[]
): Promise<number> {
  const db = await getDB();
  const result = await db.execute(
    `INSERT INTO invoices (project_id, vendor_id, invoice_number, invoice_date, total_amount, paid_amount, payment_status, ownership_type)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      invoice.project_id ?? null,
      invoice.vendor_id,
      invoice.invoice_number ?? null,
      invoice.invoice_date,
      invoice.total_amount,
      invoice.paid_amount || 0,
      invoice.payment_status || "UNPAID",
      invoice.ownership_type || "INTERNAL"
    ]
  );
  const invoiceId = result.lastInsertId;
  for (const item of items) {
    await db.execute(
      "INSERT INTO invoice_items (invoice_id, po_item_id, equip_log_id, description, amount) VALUES (?, ?, ?, ?, ?)",
      [invoiceId, item.po_item_id ?? null, item.equip_log_id ?? null, item.description, item.amount]
    );
  }
  return invoiceId;
}

export async function addPaymentDirect(invoiceId: number, amountPaid: number): Promise<void> {
  const db = await getDB();
  const rows = await db.select<Invoice[]>("SELECT * FROM invoices WHERE invoice_id = ?", [invoiceId]);
  if (rows.length === 0) return;
  const inv = rows[0];
  const newPaid = inv.paid_amount + amountPaid;
  const status = newPaid >= inv.total_amount ? "PAID" : newPaid > 0 ? "PARTIAL" : "UNPAID";

  await db.execute(
    "UPDATE invoices SET paid_amount = ?, payment_status = ? WHERE invoice_id = ?",
    [newPaid, status, invoiceId]
  );
}

export async function getInvoiceItems(invoiceId: number): Promise<InvoiceItem[]> {
  const db = await getDB();
  return db.select<InvoiceItem[]>("SELECT * FROM invoice_items WHERE invoice_id = ?", [invoiceId]);
}

// ── Debt Summary ─────────────────────────────────────────────────────────────

export async function getDebtSummary(): Promise<DebtSummaryRow[]> {
  const db = await getDB();
  return db.select<DebtSummaryRow[]>(`
    SELECT
      v.vendor_id,
      v.vendor_name,
      v.vendor_type AS vendor_type,
      COUNT(DISTINCT i.invoice_id) AS jumlah_invoice,
      COALESCE(SUM(i.total_amount), 0) AS total_tagihan,
      COALESCE(SUM(i.paid_amount), 0) AS total_bayar,
      COALESCE(SUM(i.remaining_balance), 0) AS saldo_utang
    FROM vendors v
    LEFT JOIN invoices i ON i.vendor_id = v.vendor_id
    GROUP BY v.vendor_id
    ORDER BY saldo_utang DESC
  `);
}
