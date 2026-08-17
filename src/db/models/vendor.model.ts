import type { ModelDefinition } from "@/db/core/types";

export interface Vendor {
  vendor_id: string;
  vendor_name: string;
  phone: string | null;
  address: string | null;
  created_at: string;
  deleted_at: string | null;
}

export type CreateVendor = Pick<Vendor, "vendor_name"> & Partial<Pick<Vendor, "phone" | "address">>;
export type UpdateVendor = Partial<Pick<Vendor, "vendor_name" | "phone" | "address">>;

export const VendorModel: ModelDefinition = {
  tableName: "vendors",
  primaryKey: "vendor_id",
  createColumns: ["vendor_name", "phone", "address"],
  updateColumns: ["vendor_name", "phone", "address"],
  softDelete: true,
};
