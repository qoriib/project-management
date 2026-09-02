import { BaseRepository } from "@/db/core/base-repository";
import { type CreateVendor, type UpdateVendor, type Vendor, VendorModel } from "@/db/models";

export type VendorWithRelation = Vendor & { has_relation?: boolean };

class VendorRepository extends BaseRepository<Vendor, CreateVendor, UpdateVendor> {
  constructor() {
    super(VendorModel);
  }

  /**
   * Get all vendors sorted by vendor_id with has_relation flag checking active orders.
   */
  async findAllSorted(): Promise<VendorWithRelation[]> {
    const rows = await this.rawSelect<Vendor & { has_relation: number | boolean }>(
      `SELECT vendors.*,
              EXISTS(SELECT 1 FROM order_items oi JOIN orders o ON o.order_id = oi.order_id WHERE oi.vendor_id = vendors.vendor_id AND o.deleted_at IS NULL) as has_relation
       FROM vendors
       WHERE vendors.deleted_at IS NULL
       ORDER BY vendors.vendor_id ASC`,
    );

    return rows.map((row) => ({
      ...row,
      has_relation: Boolean(row.has_relation),
    }));
  }
}

export const vendorRepo = new VendorRepository();
