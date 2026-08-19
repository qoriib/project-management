/**
 * Item Category Repository — Standard CRUD with soft delete.
 */

import { BaseRepository } from "@/db/core/base-repository";
import {
  type CreateItemCategory,
  type ItemCategory,
  ItemCategoryModel,
  type UpdateItemCategory,
} from "@/db/models";

class ItemCategoryRepository extends BaseRepository<
  ItemCategory,
  CreateItemCategory,
  UpdateItemCategory
> {
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

  async create(data: CreateItemCategory): Promise<string> {
    const dataToInsert = { ...data };

    if (!dataToInsert.category_code || dataToInsert.category_code.trim() === "") {
      const db = await this.db(),
        rows = await db.select<{ max_code: string }[]>(
          `SELECT MAX(CAST(category_code AS INTEGER)) as max_code FROM item_categories`,
        ),
        maxCode = parseInt(rows[0]?.max_code || "0", 10),
        newCode = (maxCode + 1).toString().padStart(5, "0");
      dataToInsert.category_code = newCode;
    }

    return super.create(dataToInsert);
  }
}

export const itemCategoryRepo = new ItemCategoryRepository();
