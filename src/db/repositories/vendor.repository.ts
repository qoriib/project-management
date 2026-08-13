/**
 * Vendor Repository — Standard CRUD with soft delete.
 */

import { BaseRepository } from "@/db/core/base-repository";
import {
  VendorModel,
  type Vendor,
  type CreateVendor,
  type UpdateVendor,
} from "@/db/models";

class VendorRepository extends BaseRepository<Vendor, CreateVendor, UpdateVendor> {
  constructor() {
    super(VendorModel);
  }

  /**
   * Get all vendors sorted alphabetically.
   */
  async findAllSorted(): Promise<Vendor[]> {
    return this.findAll({
      orderBy: { column: "vendor_name", direction: "ASC" },
    });
  }
}

export const vendorRepo = new VendorRepository();
