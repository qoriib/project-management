import type { ModelDefinition } from "@/db/core/types";

/**
 * Entitas ReceiptItem mewakili baris item barang yang diterima pada tanda terima tertentu.
 */
export interface ReceiptItem {
  /** UUID v7 primary key baris item penerimaan */
  receipt_item_id: string;
  /** Relasi ID dokumen tanda terima induk */
  receipt_id: string | null;
  /** Relasi ID baris pesanan (order_items) yang diterima */
  order_item_id: string | null;
  /** Volume kuantitas barang yang diterima pada transaksi ini */
  qty: number;
}

/** Payload untuk membuat baris item penerimaan baru */
export type CreateReceiptItem = Omit<ReceiptItem, "receipt_item_id">;

/** Payload untuk memperbarui baris item penerimaan */
export type UpdateReceiptItem = Partial<CreateReceiptItem>;

/**
 * Metadata definisi tabel basis data untuk model ReceiptItem
 */
export const ReceiptItemModel: ModelDefinition = {
  createColumns: ["receipt_id", "order_item_id", "qty"],
  primaryKey: "receipt_item_id",
  softDelete: false,
  tableName: "receipt_items",
  updateColumns: ["order_item_id", "qty"],
};
