import type { ModelDefinition } from "@/db/core/types";

/**
 * Entitas Proyek mewakili proyek konstruksi atau pengadaan yang sedang dikerjakan.
 */
export interface Project {
  /** UUID v7 primary key proyek */
  project_id: string;
  /** Nama lengkap proyek */
  project_name: string;
  /** Nama perusahaan / pemilik proyek */
  company_name: string;
  /** Tahun anggaran proyek (contoh: 2026) */
  fiscal_year: number;
  /** Status kunci persetujuan kebutuhan (1 jika terkunci/ACC, 0 jika draft) */
  requirements_is_approved: number;
  /** Timestamp waktu pembuatan data */
  created_at: string;
  /** Timestamp waktu pembaruan data terakhir */
  updated_at: string;
  /** Timestamp waktu soft delete (null jika masih aktif) */
  deleted_at: string | null;
}

/** Payload untuk membuat data proyek baru (requirements_is_approved bernilai default 0 jika diabaikan) */
export type CreateProject = Omit<
  Project,
  "project_id" | "created_at" | "updated_at" | "deleted_at" | "requirements_is_approved"
> & {
  requirements_is_approved?: number;
};

/** Payload untuk memperbarui data proyek yang sudah ada */
export type UpdateProject = Partial<CreateProject>;

/**
 * Metadata definisi tabel basis data untuk model Project
 */
export const ProjectModel: ModelDefinition = {
  createColumns: ["project_name", "company_name", "fiscal_year", "requirements_is_approved"],
  primaryKey: "project_id",
  softDelete: true,
  tableName: "projects",
  updateColumns: ["project_name", "company_name", "fiscal_year", "requirements_is_approved"],
};
