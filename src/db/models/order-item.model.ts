import type { ModelDefinition } from "@/db/core/types";

/**
 * Entitas OrderItem mewakili baris detail barang/jasa dalam dokumen Purchase Order.
 */
export interface OrderItem {
  /** UUID v7 primary key baris item pesanan */
  order_item_id: string;
  /** Relasi ID dokumen order induk */
  order_id: string;
  /** Relasi ID item yang dipesan */
  item_id: string;
  /** Relasi ID vendor tempat barang dipesan */
  vendor_id: string;
  /** Relasi ID harga satuan yang disepakati */
  item_price_id: string;
  /** Jumlah volume kuantitas yang dipesan */
  qty: number;
  /** Flag pajak PPN 12% (1 = Ya, 0 = Tidak) */
  has_tax: number;
}

/** Payload untuk membuat baris detail pesanan baru */
export type CreateOrderItem = Omit<OrderItem, "order_item_id">;

/** Payload untuk memperbarui baris detail pesanan */
export type UpdateOrderItem = Partial<CreateOrderItem>;

/**
 * Metadata definisi tabel basis data untuk model OrderItem
 */
export const OrderItemModel: ModelDefinition = {
  createColumns: ["order_id", "item_id", "vendor_id", "item_price_id", "qty", "has_tax"],
  primaryKey: "order_item_id",
  softDelete: false,
  tableName: "order_items",
  updateColumns: ["item_id", "vendor_id", "item_price_id", "qty", "has_tax"],
};
