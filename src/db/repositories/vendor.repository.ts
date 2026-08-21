import { BaseRepository } from "@/db/core/base-repository";
import { type CreateVendor, type UpdateVendor, type Vendor, VendorModel } from "@/db/models";
import { QueryBuilder } from "@/db/core/query-builder";
import { wrapDbError } from "@/db/core/errors";

export type VendorWithRelation = Vendor & { has_relation?: boolean };

class VendorRepository extends BaseRepository<Vendor, CreateVendor, UpdateVendor> {
  constructor() {
    super(VendorModel);
  }

  /**
   * Get all vendors sorted alphabetically, with has_relation flag.
   */
  async findAllSorted(): Promise<VendorWithRelation[]> {
    try {
      const query = new QueryBuilder()
        .select("vendors.*")
        .selectRaw("(EXISTS(SELECT 1 FROM order_items WHERE vendor_id = vendors.vendor_id)) as has_relation")
        .from("vendors", "vendors")
        .where("vendors.deleted_at", "IS NULL")
        .orderBy("vendors.vendor_id", "ASC");

      const { sql, params } = query.build();
      const rows = await this.rawSelect<VendorWithRelation & { has_relation: number | boolean }>(sql, params);

      return rows.map((vendor) => ({
        ...vendor,
        has_relation: Boolean(vendor.has_relation),
      }));
    } catch (error) {
      throw wrapDbError(error, this.model.tableName);
    }
  }
}

export const vendorRepo = new VendorRepository();
