import type { ModelDefinition } from "@/db/core/types";

/**
 * Entitas ItemCategory mewakili kategori pengelompokan master barang (misal: Bahan, Alat, Operasional).
 */
export interface ItemCategory {
  /** UUID v7 primary key kategori */
  category_id: string;
  /** Huruf awalan prefix kategori (contoh: 'B' untuk Bahan, 'A' untuk Alat) */
  prefix: string;
  /** Kode unik 5 digit kategori (contoh: '00001') */
  category_code: string;
  /** Nama kategori */
  category_name: string;
  /** Timestamp waktu pembuatan data */
  created_at: string;
  /** Timestamp waktu pembaruan data terakhir */
  updated_at: string;
}

/** Payload untuk membuat data kategori baru */
export type CreateItemCategory = Omit<ItemCategory, "category_id" | "created_at" | "updated_at">;

/** Payload untuk memperbarui data kategori yang sudah ada */
export type UpdateItemCategory = Partial<CreateItemCategory>;

/**
 * Metadata definisi tabel basis data untuk model ItemCategory
 */
export const ItemCategoryModel: ModelDefinition = {
  createColumns: ["prefix", "category_code", "category_name"],
  primaryKey: "category_id",
  tableName: "item_categories",
  updateColumns: ["prefix", "category_code", "category_name"],
};
