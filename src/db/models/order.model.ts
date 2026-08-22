import type { ModelDefinition } from "@/db/core/types";

/**
 * Entitas Order mewakili Dokumen Surat Pemesanan / Purchase Order (PO) proyek ke vendor.
 */
export interface Order {
  /** UUID v7 primary key pesanan */
  order_id: string;
  /** Relasi ID proyek tempat pemesanan dilakukan */
  project_id: string;
  /** Nomor / kode unik dokumen PO (contoh: 'PO-2026-0001') */
  order_code: string | null;
  /** Tanggal pesanan diterbitkan (format: YYYY-MM-DD) */
  order_date: string;
  /** Timestamp waktu pembuatan data */
  created_at: string;
  /** Timestamp waktu pembaruan data terakhir */
  updated_at: string;
  /** Timestamp waktu soft delete (null jika masih aktif) */
  deleted_at: string | null;
}

/** Payload untuk membuat pesanan baru */
export type CreateOrder = Omit<Order, "order_id" | "created_at" | "updated_at" | "deleted_at">;

/** Payload untuk memperbarui pesanan yang ada */
export type UpdateOrder = Partial<CreateOrder>;

/**
 * Metadata definisi tabel basis data untuk model Order
 */
export const OrderModel: ModelDefinition = {
  createColumns: ["project_id", "order_code", "order_date"],
  primaryKey: "order_id",
  softDelete: true,
  tableName: "orders",
  updateColumns: ["project_id", "order_code", "order_date"],
};
