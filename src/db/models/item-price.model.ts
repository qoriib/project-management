import type { ModelDefinition } from "@/db/core/types";

/**
 * Entitas ItemPrice mewakili variasi harga satuan untuk sebuah item (master harga).
 */
export interface ItemPrice {
  /** UUID v7 primary key variasi harga */
  item_price_id: string;
  /** Relasi ID item yang memiliki harga ini */
  item_id: string;
  /** Nilai harga satuan (dalam Rupiah) */
  price: number;
  /** Timestamp waktu pembaruan data terakhir */
  updated_at: string;
  /** Timestamp waktu soft delete (null jika masih aktif) */
  deleted_at: string | null;
}

/** Payload untuk membuat variasi harga baru */
export type CreateItemPrice = Omit<ItemPrice, "item_price_id" | "updated_at" | "deleted_at">;

/** Payload untuk memperbarui variasi harga */
export type UpdateItemPrice = Partial<CreateItemPrice>;

/**
 * Metadata definisi tabel basis data untuk model ItemPrice
 */
export const ItemPriceModel: ModelDefinition = {
  createColumns: ["item_id", "price"],
  primaryKey: "item_price_id",
  softDelete: true,
  tableName: "item_prices",
  updateColumns: ["item_id", "price"],
};
