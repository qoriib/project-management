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
  createColumns: ["vendor_name", "phone", "address"],
  primaryKey: "vendor_id",
  softDelete: true,
  tableName: "vendors",
  updateColumns: ["vendor_name", "phone", "address"],
};
