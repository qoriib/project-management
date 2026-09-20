import type { ModelDefinition } from "@/db/core/types";

/**
 * Entitas Unit mewakili satuan pengukuran barang (misal: Zak, M3, Kg, Lembar, Pail, Hari, dsb).
 */
export interface Unit {
  /** UUID v7 primary key unit */
  unit_id: string;
  /** Nama satuan pengukuran */
  unit_name: string;
  /** Timestamp waktu pembuatan data */
  created_at: string;
  /** Timestamp waktu pembaruan data terakhir */
  updated_at: string;
}

/** Payload untuk membuat satuan pengukuran baru */
export type CreateUnit = Omit<Unit, "unit_id" | "created_at" | "updated_at">;

/** Payload untuk memperbarui data satuan */
export type UpdateUnit = Partial<CreateUnit>;

/**
 * Metadata definisi tabel basis data untuk model Unit
 */
export const UnitModel: ModelDefinition = {
  createColumns: ["unit_name"],
  primaryKey: "unit_id",
  tableName: "units",
  updateColumns: ["unit_name"],
};
