import type { ModelDefinition } from "@/db/core/types";

/**
 * Entitas Vendor mewakili pemasok barang atau penyedia jasa.
 */
export interface Vendor {
  /** UUID v7 primary key vendor */
  vendor_id: string;
  /** Nama vendor / toko / kontraktor */
  vendor_name: string;
  /** Nomor telepon vendor (opsional) */
  phone: string | null;
  /** Alamat lengkap vendor (opsional) */
  address: string | null;
  /** Timestamp waktu pembuatan data */
  created_at: string;
  /** Timestamp waktu pembaruan data terakhir */
  updated_at: string;
  /** Timestamp waktu soft delete (null jika masih aktif) */
  deleted_at: string | null;
}

/** Payload untuk membuat data vendor baru */
export type CreateVendor = Omit<Vendor, "vendor_id" | "created_at" | "updated_at" | "deleted_at">;

/** Payload untuk memperbarui data vendor yang sudah ada */
export type UpdateVendor = Partial<CreateVendor>;

/**
 * Metadata definisi tabel basis data untuk model Vendor
 */
export const VendorModel: ModelDefinition = {
  createColumns: ["vendor_name", "phone", "address"],
  primaryKey: "vendor_id",
  softDelete: true,
  tableName: "vendors",
  updateColumns: ["vendor_name", "phone", "address"],
};
