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
  /** Flag apakah kelompok ini memiliki pagu anggaran (1 = ya, 0 = tidak) */
  has_detail: number;
  /** Nilai pagu anggaran (null = pagu tanpa nominal; diisi = pagu dengan nominal) */
  budget: number | null;
  /** Timestamp waktu pembuatan data */
  created_at: string;
  /** Timestamp waktu pembaruan data terakhir */
  updated_at: string;
}

/** Payload untuk membuat kelompok kebutuhan baru */
export type CreateRequirementGroup = Omit<
  RequirementGroup,
  "requirement_group_id" | "created_at" | "updated_at" | "has_detail" | "budget"
> & {
  has_detail?: number;
  budget?: number | null;
};

/** Payload untuk memperbarui kelompok kebutuhan */
export type UpdateRequirementGroup = Partial<
  Omit<RequirementGroup, "requirement_group_id" | "created_at" | "updated_at">
>;

/**
 * Metadata definisi tabel basis data untuk model RequirementGroup
 */
export const RequirementGroupModel: ModelDefinition = {
  createColumns: ["project_id", "group_name", "has_detail", "budget"],
  primaryKey: "requirement_group_id",
  tableName: "requirement_groups",
  updateColumns: ["group_name", "has_detail", "budget"],
};
