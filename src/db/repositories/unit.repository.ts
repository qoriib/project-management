/**
 * Unit Repository — Standard CRUD with soft delete.
 */

import { BaseRepository } from "@/db/core/base-repository";
import {
  type CreateUnit,
  type Unit,
  UnitModel,
  type UpdateUnit,
} from "@/db/models";

class UnitRepository extends BaseRepository<Unit, CreateUnit, UpdateUnit> {
  constructor() {
    super(UnitModel);
  }

  /**
   * Get all units sorted alphabetically.
   */
  async findAllSorted(): Promise<Unit[]> {
    return this.findAll({
      orderBy: { column: "unit_name", direction: "ASC" },
    });
  }
}

export const unitRepo = new UnitRepository();
