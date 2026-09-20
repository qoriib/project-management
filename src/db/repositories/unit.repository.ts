import { BaseRepository } from "@/db/core/base-repository";
import { type CreateUnit, type Unit, UnitModel, type UpdateUnit } from "@/db/models";

export type UnitWithRelation = Unit & { has_relation?: boolean };

class UnitRepository extends BaseRepository<Unit, CreateUnit, UpdateUnit> {
  constructor() {
    super(UnitModel);
  }

  /**
   * Get all units sorted by unit_id with has_relation flag checking items table.
   */
  async findAllSorted(): Promise<UnitWithRelation[]> {
    const rows = await this.query("units")
      .select("units.*")
      .selectExists("SELECT 1 FROM items WHERE items.unit_id = units.unit_id")
      .orderBy("units.unit_id", "ASC")
      .getMany<Unit & { has_relation: number | boolean }>();

    return rows.map((row) => ({
      ...row,
      has_relation: Boolean(row.has_relation),
    }));
  }
}

export const unitRepo = new UnitRepository();
