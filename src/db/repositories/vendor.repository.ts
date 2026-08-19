/**
 * Vendor Repository — Standard CRUD with soft delete.
 */

import { BaseRepository } from "@/db/core/base-repository";
import { type CreateVendor, type UpdateVendor, type Vendor, VendorModel } from "@/db/models";

import { QueryBuilder } from "@/db/core/query-builder";

export type VendorWithRelation = Vendor & { has_relation?: boolean };

class VendorRepository extends BaseRepository<Vendor, CreateVendor, UpdateVendor> {
  constructor() {
    super(VendorModel);
  }

  /**
   * Get all vendors sorted alphabetically.
   */
  async findAllSorted(): Promise<VendorWithRelation[]> {
    const qb = new QueryBuilder()
        .select("v.*")
        .selectRaw("(EXISTS(SELECT 1 FROM po_items WHERE vendor_id = v.vendor_id)) as has_relation")
        .from("vendors v")
        .where("v.deleted_at", "IS NULL")
        .orderBy("v.vendor_name", "ASC"),
      { sql, params } = qb.build(),
      vendors = await this.rawSelect<any>(sql, params);

    return vendors.map((v) => ({
      ...v,
      has_relation: Boolean(v.has_relation),
    }));
  }
}

export const vendorRepo = new VendorRepository();
