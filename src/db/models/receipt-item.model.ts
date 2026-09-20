import type { ModelDefinition } from "@/db/core/types";

/**
 * Entitas ReceiptItem mewakili baris item barang yang diterima pada tanda terima tertentu.
 */
export interface ReceiptItem {
  /** UUID v7 primary key baris item penerimaan */
  receipt_item_id: string;
  /** Relasi ID dokumen tanda terima induk */
  receipt_id: string;
  /** Relasi ID baris pesanan (order_items) yang diterima */
  order_item_id: string;
  /** Relasi ID harga satuan yang berlaku pada tanda terima ini */
  item_price_id: string;
  /** Volume kuantitas barang yang diterima pada transaksi ini */
  qty: number;
  /** Flag pajak PPN 12% */
  has_tax: boolean;
  /** Timestamp waktu pembuatan data */
  created_at: string;
  /** Timestamp waktu pembaruan data terakhir */
  updated_at: string;
}

/** Payload untuk membuat baris item penerimaan baru */
export type CreateReceiptItem = Omit<ReceiptItem, "receipt_item_id" | "created_at" | "updated_at">;

/** Payload untuk memperbarui baris item penerimaan */
export type UpdateReceiptItem = Partial<CreateReceiptItem>;

/**
 * Metadata definisi tabel basis data untuk model ReceiptItem
 */
export const ReceiptItemModel: ModelDefinition = {
  createColumns: ["receipt_id", "order_item_id", "item_price_id", "qty", "has_tax"],
  primaryKey: "receipt_item_id",
  tableName: "receipt_items",
  updateColumns: ["order_item_id", "item_price_id", "qty", "has_tax"],
};
