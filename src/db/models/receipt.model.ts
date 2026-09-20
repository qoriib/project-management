import type { ModelDefinition } from "@/db/core/types";

/**
 * Entitas Receipt mewakili Dokumen Surat Tanda Terima / Bukti Penerimaan Barang (Goods Receipt Note) dari pesanan PO.
 */
export interface Receipt {
  /** UUID v7 primary key penerimaan */
  receipt_id: string;
  /** Relasi ID dokumen order yang diterima */
  order_id: string;
  /** Nomor / kode unik surat tanda terima (contoh: 'NP-2026-0001') */
  receipt_code: string | null;
  /** Tanggal fisik barang diterima di lapangan (format: YYYY-MM-DD) */
  receipt_date: string;
  /** Timestamp waktu pembuatan data */
  created_at: string;
  /** Timestamp waktu pembaruan data terakhir */
  updated_at: string;
}

/** Payload untuk membuat tanda terima baru */
export type CreateReceipt = Omit<Receipt, "receipt_id" | "created_at" | "updated_at">;

/** Payload untuk memperbarui data tanda terima */
export type UpdateReceipt = Partial<CreateReceipt>;

/**
 * Metadata definisi tabel basis data untuk model Receipt
 */
export const ReceiptModel: ModelDefinition = {
  createColumns: ["order_id", "receipt_code", "receipt_date"],
  primaryKey: "receipt_id",
  tableName: "receipts",
  updateColumns: ["order_id", "receipt_code", "receipt_date"],
};
