import { getDB } from "@/db/index";
import * as schema from "@/db/schema";
import { eq, desc, and, sql } from "drizzle-orm";

// ── Types ────────────────────────────────────────────────────────────────────

export type Invoice = typeof schema.invoices.$inferSelect & {
  vendor_name?: string;
  project_name?: string;
};

export type InvoiceItem = typeof schema.invoiceItems.$inferSelect;

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
  const conditions = [];

  if (filters?.vendor_id) conditions.push(eq(schema.invoices.vendor_id, filters.vendor_id));
  if (filters?.payment_status) conditions.push(eq(schema.invoices.payment_status, filters.payment_status as any));
  if (filters?.tanggal_dari) conditions.push(sql`${schema.invoices.invoice_date} >= ${filters.tanggal_dari}`);
  if (filters?.tanggal_sampai) conditions.push(sql`${schema.invoices.invoice_date} <= ${filters.tanggal_sampai}`);

  const rows = await db
    .select({
      invoice_id: schema.invoices.invoice_id,
      project_id: schema.invoices.project_id,
      vendor_id: schema.invoices.vendor_id,
      invoice_number: schema.invoices.invoice_number,
      invoice_date: schema.invoices.invoice_date,
      total_amount: schema.invoices.total_amount,
      paid_amount: schema.invoices.paid_amount,
      remaining_balance: schema.invoices.remaining_balance,
      payment_status: schema.invoices.payment_status,
      ownership_type: schema.invoices.ownership_type,
      created_at: schema.invoices.created_at,
      vendor_name: schema.vendors.vendor_name,
      project_name: schema.projects.project_name,
    })
    .from(schema.invoices)
    .leftJoin(schema.vendors, eq(schema.vendors.vendor_id, schema.invoices.vendor_id))
    .leftJoin(schema.projects, eq(schema.projects.project_id, schema.invoices.project_id))
    .where(and(...conditions))
    .orderBy(desc(schema.invoices.invoice_date), desc(schema.invoices.invoice_id));

  return rows as Invoice[];
}

export async function createInvoice(
  invoice: Omit<Invoice, "invoice_id" | "vendor_name" | "project_name" | "remaining_balance" | "created_at">,
  items: Omit<InvoiceItem, "inv_item_id" | "invoice_id">[]
): Promise<number> {
  const db = await getDB();
  
  const invoiceResult = await db.insert(schema.invoices).values({
    project_id: invoice.project_id ?? null,
    vendor_id: invoice.vendor_id,
    invoice_number: invoice.invoice_number ?? null,
    invoice_date: invoice.invoice_date,
    total_amount: invoice.total_amount,
    paid_amount: invoice.paid_amount || 0,
    payment_status: invoice.payment_status || "UNPAID",
    ownership_type: invoice.ownership_type || "INTERNAL",
  }).returning({ invoice_id: schema.invoices.invoice_id });

  const invoiceId = invoiceResult[0].invoice_id;

  if (items.length > 0) {
    const itemValues = items.map(item => ({
      invoice_id: invoiceId,
      po_item_id: item.po_item_id ?? null,
      equip_log_id: item.equip_log_id ?? null,
      description: item.description,
      amount: item.amount,
    }));
    await db.insert(schema.invoiceItems).values(itemValues);
  }

  return invoiceId;
}

export async function addPaymentDirect(invoiceId: number, amountPaid: number): Promise<void> {
  const db = await getDB();
  const rows = await db.select().from(schema.invoices).where(eq(schema.invoices.invoice_id, invoiceId));
  
  if (rows.length === 0) return;
  const inv = rows[0];
  const newPaid = inv.paid_amount! + amountPaid;
  const status = newPaid >= inv.total_amount ? "PAID" : newPaid > 0 ? "PARTIAL" : "UNPAID";

  await db.update(schema.invoices).set({
    paid_amount: newPaid,
    payment_status: status
  }).where(eq(schema.invoices.invoice_id, invoiceId));
}

export async function getInvoiceItems(invoiceId: number): Promise<InvoiceItem[]> {
  const db = await getDB();
  return db.select().from(schema.invoiceItems).where(eq(schema.invoiceItems.invoice_id, invoiceId));
}

// ── Debt Summary ─────────────────────────────────────────────────────────────

export async function getDebtSummary(): Promise<DebtSummaryRow[]> {
  const db = await getDB();
  const rows = await db
    .select({
      vendor_id: schema.vendors.vendor_id,
      vendor_name: schema.vendors.vendor_name,
      vendor_type: schema.vendors.vendor_type,
      jumlah_invoice: sql<number>`COUNT(DISTINCT ${schema.invoices.invoice_id})`,
      total_tagihan: sql<number>`COALESCE(SUM(${schema.invoices.total_amount}), 0)`,
      total_bayar: sql<number>`COALESCE(SUM(${schema.invoices.paid_amount}), 0)`,
      saldo_utang: sql<number>`COALESCE(SUM(${schema.invoices.remaining_balance}), 0)`,
    })
    .from(schema.vendors)
    .leftJoin(schema.invoices, eq(schema.invoices.vendor_id, schema.vendors.vendor_id))
    .groupBy(schema.vendors.vendor_id)
    .orderBy(desc(sql<number>`COALESCE(SUM(${schema.invoices.remaining_balance}), 0)`));

  return rows as DebtSummaryRow[];
}
