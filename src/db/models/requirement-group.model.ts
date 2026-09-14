import type { ModelDefinition } from "@/db/core/types";

/**
 * Entitas RequirementGroup mewakili Kelompok Kebutuhan / Item Pekerjaan per proyek (misal: "Pasang Fondasi").
 */
export interface RequirementGroup {
  /** UUID v7 primary key kelompok kebutuhan */
  requirement_group_id: string;
  /** Relasi ID proyek pemilik kelompok */
  project_id: string;
  /** Nama kelompok kebutuhan / pekerjaan */
  group_name: string;
  /** Modal / pagu anggaran / harga kelompok pekerjaan (null jika dihitung dari item) */
  budget: number | null;
  /** Timestamp waktu pembuatan data */
  created_at: string;
  /** Timestamp waktu pembaruan data terakhir */
  updated_at: string;
  /** Timestamp waktu soft delete (null jika masih aktif) */
  deleted_at: string | null;
}

/** Payload untuk membuat kelompok kebutuhan baru */
export type CreateRequirementGroup = Omit<
  RequirementGroup,
  "requirement_group_id" | "created_at" | "updated_at" | "deleted_at" | "budget"
> & {
  budget?: number | null;
};

/** Payload untuk memperbarui kelompok kebutuhan */
export type UpdateRequirementGroup = Partial<CreateRequirementGroup>;

/**
 * Metadata definisi tabel basis data untuk model RequirementGroup
 */
export const RequirementGroupModel: ModelDefinition = {
  createColumns: ["project_id", "group_name", "budget"],
  primaryKey: "requirement_group_id",
  softDelete: true,
  tableName: "requirement_groups",
  updateColumns: ["project_id", "group_name", "budget"],
};
