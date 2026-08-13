/**
 * Item Category Repository — Standard CRUD with soft delete.
 */

import { BaseRepository } from "@/db/core/base-repository";
import {
  ItemCategoryModel,
  type ItemCategory,
  type CreateItemCategory,
  type UpdateItemCategory,
} from "@/db/models";

class ItemCategoryRepository extends BaseRepository<ItemCategory, CreateItemCategory, UpdateItemCategory> {
  constructor() {
    super(ItemCategoryModel);
  }

  /**
   * Get all categories sorted alphabetically.
   */
  async findAllSorted(): Promise<ItemCategory[]> {
    return this.findAll({
      orderBy: { column: "category_name", direction: "ASC" },
    });
  }
}

export const itemCategoryRepo = new ItemCategoryRepository();
