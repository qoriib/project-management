import { BaseRepository } from "@/db/core/base-repository";
import { type CreateItemCategory, type ItemCategory, ItemCategoryModel, type UpdateItemCategory } from "@/db/models";

export type ItemCategoryWithRelation = ItemCategory & { has_relation?: boolean };

class ItemCategoryRepository extends BaseRepository<ItemCategory, CreateItemCategory, UpdateItemCategory> {
  constructor() {
    super(ItemCategoryModel);
  }

  /**
   * Get all categories sorted by category_id with has_relation flag checking items table.
   */
  async findAllSorted(): Promise<ItemCategoryWithRelation[]> {
    const rows = await this.query("item_categories")
      .select("item_categories.*")
      .selectExists("SELECT 1 FROM items WHERE items.category_id = item_categories.category_id")
      .orderBy("item_categories.category_id", "ASC")
      .getMany<ItemCategoryWithRelation & { has_relation: number | boolean }>();

    return rows.map((row) => ({
      ...row,
      has_relation: Boolean(row.has_relation),
    }));
  }
}

export const itemCategoryRepo = new ItemCategoryRepository();
