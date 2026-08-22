import { BaseRepository } from "@/db/core/base-repository";
import { type CreateVendor, type UpdateVendor, type Vendor, VendorModel } from "@/db/models";
import { wrapDbError } from "@/db/core/errors";

export type VendorWithRelation = Vendor & { has_relation?: boolean };

class VendorRepository extends BaseRepository<Vendor, CreateVendor, UpdateVendor> {
  constructor() {
    super(VendorModel);
  }

  /**
   * Get all vendors sorted alphabetically, with has_relation flag.
   * Only active (non-soft-deleted) orders are considered.
   */
  async findAllSorted(): Promise<VendorWithRelation[]> {
    try {
      const query = this.query("vendors")
        .select("vendors.*")
        .selectRaw(
          "(EXISTS(SELECT 1 FROM order_items oi JOIN orders o ON o.order_id = oi.order_id WHERE oi.vendor_id = vendors.vendor_id AND o.deleted_at IS NULL)) as has_relation",
        )
        .orderBy("vendors.vendor_id", "ASC");

      const { sql, params } = query.build();
      const rows = await this.rawSelect<VendorWithRelation & { has_relation: number | boolean }>(sql, params);

      return rows.map((row) => ({
        ...row,
        has_relation: Boolean(row.has_relation),
      }));
    } catch (error) {
      throw wrapDbError(error, this.model.tableName);
    }
  }
}

export const vendorRepo = new VendorRepository();
