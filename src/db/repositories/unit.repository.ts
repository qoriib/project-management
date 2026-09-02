import { BaseRepository } from "@/db/core/base-repository";
import { type CreateUnit, type Unit, UnitModel, type UpdateUnit } from "@/db/models";
import { wrapDbError } from "@/db/core/errors";

export type UnitWithRelation = Unit & { has_relation?: boolean };

class UnitRepository extends BaseRepository<Unit, CreateUnit, UpdateUnit> {
  constructor() {
    super(UnitModel);
  }

  /**
   * Get all units sorted by unit_id with has_relation flag checking items table.
   */
  async findAllSorted(): Promise<UnitWithRelation[]> {
    try {
      const query = this.query("units")
        .select("units.*")
        .selectRaw(
          "(EXISTS(SELECT 1 FROM items WHERE items.unit_id = units.unit_id AND items.deleted_at IS NULL)) as has_relation",
        )
        .orderBy("units.unit_id", "ASC");

      const { sql, params } = query.build();
      const rows = await this.rawSelect<UnitWithRelation & { has_relation: number | boolean }>(sql, params);

      return rows.map((row) => ({
        ...row,
        has_relation: Boolean(row.has_relation),
      }));
    } catch (error) {
      throw wrapDbError(error, this.model.tableName);
    }
  }
}

export const unitRepo = new UnitRepository();
