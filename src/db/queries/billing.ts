import { getDB } from "@/db/index";
import type { Invoice as BaseInvoice, InvoiceItem as BaseInvoiceItem } from "@/db/schema";

// ── Types ────────────────────────────────────────────────────────────────────

export type Invoice = BaseInvoice & {
  vendor_name?: string;
  project_name?: string;
};

export type InvoiceItem = BaseInvoiceItem;

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
  project_id?: number;
  payment_status?: string;
  tanggal_dari?: string;
  tanggal_sampai?: string;
}): Promise<Invoice[]> {
  const db = await getDB();
  const conditions: string[] = [];
  const params: any[] = [];
  let paramIdx = 1;

  if (filters?.vendor_id) {
    conditions.push(`i.vendor_id = $${paramIdx++}`);
    params.push(filters.vendor_id);
  }
  if (filters?.project_id) {
    conditions.push(`i.project_id = $${paramIdx++}`);
    params.push(filters.project_id);
  }
  if (filters?.payment_status) {
    conditions.push(`i.payment_status = $${paramIdx++}`);
    params.push(filters.payment_status);
  }
  if (filters?.tanggal_dari) {
    conditions.push(`i.invoice_date >= $${paramIdx++}`);
    params.push(filters.tanggal_dari);
  }
  if (filters?.tanggal_sampai) {
    conditions.push(`i.invoice_date <= $${paramIdx++}`);
    params.push(filters.tanggal_sampai);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const query = `
    SELECT 
      i.invoice_id, i.project_id, i.vendor_id, i.invoice_number, i.invoice_date,
      i.total_amount, i.paid_amount, i.remaining_balance, i.payment_status,
      i.ownership_type, i.created_at,
      v.vendor_name, p.project_name
    FROM invoices i
    LEFT JOIN vendors v ON v.vendor_id = i.vendor_id
    LEFT JOIN projects p ON p.project_id = i.project_id
    ${whereClause}
    ORDER BY i.invoice_date DESC, i.invoice_id DESC
  `;

  return db.select<Invoice[]>(query, params);
}

export async function createInvoice(
  invoice: Omit<Invoice, "invoice_id" | "vendor_name" | "project_name" | "remaining_balance" | "created_at">,
  items: Omit<InvoiceItem, "inv_item_id" | "invoice_id">[]
): Promise<number> {
  const db = await getDB();
  
  const result = await db.execute(
    `INSERT INTO invoices (project_id, vendor_id, invoice_number, invoice_date, total_amount, paid_amount, payment_status, ownership_type)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      invoice.project_id ?? null,
      invoice.vendor_id ?? null,
      invoice.invoice_number ?? null,
      invoice.invoice_date,
      invoice.total_amount,
      invoice.paid_amount || 0,
      invoice.payment_status || "UNPAID",
      invoice.ownership_type || "INTERNAL"
    ]
  );

  const invoiceId = result.lastInsertId as number;

  if (items.length > 0) {
    for (const item of items) {
      await db.execute(
        `INSERT INTO invoice_items (invoice_id, po_item_id, equip_log_id, description, amount)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          invoiceId,
          item.po_item_id ?? null,
          item.equip_log_id ?? null,
          item.description,
          item.amount
        ]
      );
    }
  }

  return invoiceId;
}

export async function addPaymentDirect(invoiceId: number, amountPaid: number): Promise<void> {
  const db = await getDB();
  const rows = await db.select<Invoice[]>("SELECT * FROM invoices WHERE invoice_id = $1", [invoiceId]);
  
  if (rows.length === 0) return;
  const inv = rows[0];
  const newPaid = (inv.paid_amount || 0) + amountPaid;
  const status = newPaid >= inv.total_amount ? "PAID" : newPaid > 0 ? "PARTIAL" : "UNPAID";

  await db.execute(
    "UPDATE invoices SET paid_amount = $1, payment_status = $2 WHERE invoice_id = $3",
    [newPaid, status, invoiceId]
  );
}

export async function getInvoiceItems(invoiceId: number): Promise<InvoiceItem[]> {
  const db = await getDB();
  return db.select<InvoiceItem[]>("SELECT * FROM invoice_items WHERE invoice_id = $1", [invoiceId]);
}

// ── Debt Summary ─────────────────────────────────────────────────────────────

export async function getDebtSummary(filters?: { project_id?: number }): Promise<DebtSummaryRow[]> {
  const db = await getDB();
  const params: any[] = [];
  let joinCondition = "";
  if (filters?.project_id) {
    joinCondition = "AND i.project_id = $1";
    params.push(filters.project_id);
  }
  
  const query = `
    SELECT 
      v.vendor_id, v.vendor_name, v.vendor_type,
      COUNT(DISTINCT i.invoice_id) as jumlah_invoice,
      COALESCE(SUM(i.total_amount), 0) as total_tagihan,
      COALESCE(SUM(i.paid_amount), 0) as total_bayar,
      COALESCE(SUM(i.remaining_balance), 0) as saldo_utang
    FROM vendors v
    LEFT JOIN invoices i ON i.vendor_id = v.vendor_id ${joinCondition}
    GROUP BY v.vendor_id
    ORDER BY saldo_utang DESC
  `;
  return db.select<DebtSummaryRow[]>(query, params);
}
