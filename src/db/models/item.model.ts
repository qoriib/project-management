import type { ModelDefinition } from "@/db/core/types";

/**
 * Entitas Item mewakili master data barang atau jasa yang dapat digunakan di berbagai proyek.
 */
export interface Item {
  /** UUID v7 primary key item */
  item_id: string;
  /** Kode unik 5 digit item (contoh: '00001') */
  item_code: string;
  /** Nama lengkap barang / jasa */
  item_name: string;
  /** Relasi ID kategori barang */
  category_id: string;
  /** Relasi ID satuan pengukuran barang */
  unit_id: string;
  /** Timestamp waktu pembaruan data terakhir */
  updated_at: string;
  /** Timestamp waktu soft delete (null jika masih aktif) */
  deleted_at: string | null;
}

/** Payload untuk membuat data item baru */
export type CreateItem = Omit<Item, "item_id" | "updated_at" | "deleted_at">;

/** Payload untuk memperbarui data item yang sudah ada */
export type UpdateItem = Partial<CreateItem>;

/**
 * Metadata definisi tabel basis data untuk model Item
 */
export const ItemModel: ModelDefinition = {
  createColumns: ["item_code", "item_name", "category_id", "unit_id"],
  primaryKey: "item_id",
  softDelete: true,
  tableName: "items",
  updateColumns: ["item_code", "item_name", "category_id", "unit_id"],
};
