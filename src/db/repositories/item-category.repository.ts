import { BaseRepository } from "@/db/core/base-repository";
import { type CreateItemCategory, type ItemCategory, ItemCategoryModel, type UpdateItemCategory } from "@/db/models";
import { wrapDbError } from "@/db/core/errors";

export type ItemCategoryWithRelation = ItemCategory & { has_relation?: boolean };

class ItemCategoryRepository extends BaseRepository<ItemCategory, CreateItemCategory, UpdateItemCategory> {
  constructor() {
    super(ItemCategoryModel);
  }

  /**
   * Get all categories sorted by category_id with has_relation flag checking items table.
   */
  async findAllSorted(): Promise<ItemCategoryWithRelation[]> {
    try {
      const query = this.query("item_categories")
        .select("item_categories.*")
        .selectRaw(
          "(EXISTS(SELECT 1 FROM items WHERE items.category_id = item_categories.category_id AND items.deleted_at IS NULL)) as has_relation",
        )
        .orderBy("item_categories.category_id", "ASC");

      const { sql, params } = query.build();
      const rows = await this.rawSelect<ItemCategoryWithRelation & { has_relation: number | boolean }>(sql, params);

      return rows.map((row) => ({
        ...row,
        has_relation: Boolean(row.has_relation),
      }));
    } catch (error) {
      throw wrapDbError(error, this.model.tableName);
    }
  }
}

export const itemCategoryRepo = new ItemCategoryRepository();
