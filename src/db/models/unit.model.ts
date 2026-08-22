import type { ModelDefinition } from "@/db/core/types";

/**
 * Entitas Unit mewakili satuan pengukuran barang (misal: Zak, M3, Kg, Lembar, Pail, Hari, dsb).
 */
export interface Unit {
  /** UUID v7 primary key unit */
  unit_id: string;
  /** Nama satuan pengukuran */
  unit_name: string;
  /** Timestamp waktu pembaruan data terakhir */
  updated_at: string;
  /** Timestamp waktu soft delete (null jika masih aktif) */
  deleted_at: string | null;
}

/** Payload untuk membuat satuan pengukuran baru */
export type CreateUnit = Omit<Unit, "unit_id" | "updated_at" | "deleted_at">;

/** Payload untuk memperbarui data satuan */
export type UpdateUnit = Partial<CreateUnit>;

/**
 * Metadata definisi tabel basis data untuk model Unit
 */
export const UnitModel: ModelDefinition = {
  createColumns: ["unit_name"],
  primaryKey: "unit_id",
  softDelete: true,
  tableName: "units",
  updateColumns: ["unit_name"],
};
