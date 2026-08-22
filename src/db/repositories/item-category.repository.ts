import { BaseRepository } from "@/db/core/base-repository";
import { type CreateItemCategory, type ItemCategory, ItemCategoryModel, type UpdateItemCategory } from "@/db/models";

class ItemCategoryRepository extends BaseRepository<ItemCategory, CreateItemCategory, UpdateItemCategory> {
  constructor() {
    super(ItemCategoryModel);
  }

  /**
   * Get all categories sorted alphabetically by ID / creation order.
   */
  async findAllSorted(): Promise<ItemCategory[]> {
    return this.findAll({
      orderBy: { column: "category_id", direction: "ASC" },
    });
  }
}

export const itemCategoryRepo = new ItemCategoryRepository();
