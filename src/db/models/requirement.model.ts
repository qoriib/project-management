import type { ModelDefinition } from "@/db/core/types";

/**
 * Entitas Requirement mewakili Rencana Kebutuhan Item per proyek.
 */
export interface Requirement {
  /** UUID v7 primary key kebutuhan proyek */
  requirement_id: string;
  /** Relasi ID proyek pemilik kebutuhan */
  project_id: string;
  /** Relasi ID item yang direncanakan */
  item_id: string;
  /** Relasi ID harga satuan acuan yang dipilih */
  item_price_id: string;
  /** Volume / kuantitas yang dibutuhkan */
  qty: number;
  /** Flag apakah perhitungan terkena PPN 12% */
  has_tax: boolean;
  /** Timestamp waktu pembuatan data */
  created_at: string;
  /** Timestamp waktu pembaruan data terakhir */
  updated_at: string;
  /** Timestamp waktu soft delete (null jika masih aktif) */
  deleted_at: string | null;
}

/** Payload untuk membuat baris kebutuhan proyek baru (has_tax bernilai default false jika diabaikan) */
export type CreateRequirement = Omit<
  Requirement,
  "requirement_id" | "created_at" | "updated_at" | "deleted_at" | "has_tax"
> & {
  has_tax?: boolean;
};

/** Payload untuk memperbarui baris kebutuhan proyek */
export type UpdateRequirement = Partial<CreateRequirement>;

/**
 * Metadata definisi tabel basis data untuk model Requirement
 */
export const RequirementModel: ModelDefinition = {
  createColumns: ["project_id", "item_id", "item_price_id", "qty", "has_tax"],
  primaryKey: "requirement_id",
  softDelete: true,
  tableName: "requirements",
  updateColumns: ["project_id", "item_id", "item_price_id", "qty", "has_tax"],
};
