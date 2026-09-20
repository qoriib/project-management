import type { ModelDefinition } from "@/db/core/types";

/**
 * Entitas OrderItem mewakili baris detail barang/jasa dalam dokumen Purchase Order.
 */
export interface OrderItem {
  /** UUID v7 primary key baris item pesanan */
  order_item_id: string;
  /** Relasi ID dokumen order induk */
  order_id: string;
  /** Relasi ID kelompok kebutuhan / item pekerjaan */
  requirement_group_id: string | null;
  /** Relasi ID item yang dipesan */
  item_id: string;
  /** Relasi ID vendor tempat barang dipesan */
  vendor_id: string;
  /** Relasi ID harga satuan yang disepakati */
  item_price_id: string;
  /** Jumlah volume kuantitas yang dipesan */
  qty: number;
  /** Flag pajak PPN 12% */
  has_tax: boolean;
  /** Timestamp waktu pembuatan data */
  created_at: string;
  /** Timestamp waktu pembaruan data terakhir */
  updated_at: string;
}

/** Payload untuk membuat baris detail pesanan baru */
export type CreateOrderItem = Omit<OrderItem, "order_item_id" | "created_at" | "updated_at">;

/** Payload untuk memperbarui baris detail pesanan */
export type UpdateOrderItem = Partial<CreateOrderItem>;

/**
 * Metadata definisi tabel basis data untuk model OrderItem
 */
export const OrderItemModel: ModelDefinition = {
  createColumns: ["order_id", "requirement_group_id", "item_id", "vendor_id", "item_price_id", "qty", "has_tax"],
  primaryKey: "order_item_id",
  tableName: "order_items",
  updateColumns: ["requirement_group_id", "item_id", "vendor_id", "item_price_id", "qty", "has_tax"],
};
