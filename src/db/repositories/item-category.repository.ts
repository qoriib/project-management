import { BaseRepository } from "@/db/core/base-repository";
import { type CreateItemCategory, type ItemCategory, ItemCategoryModel, type UpdateItemCategory } from "@/db/models";

class ItemCategoryRepository extends BaseRepository<ItemCategory, CreateItemCategory, UpdateItemCategory> {
  constructor() {
    super(ItemCategoryModel);
  }

  /**
   * Get all categories sorted alphabetically by name.
   */
  async findAllSorted(): Promise<ItemCategory[]> {
    return this.findAll({
      orderBy: { column: "category_name", direction: "ASC" },
    });
  }

  /**
   * Create a category with auto-generated 5-digit category_code if omitted.
   */
  async create(data: CreateItemCategory): Promise<string> {
    const payload = { ...data };

    if (!payload.category_code || payload.category_code.trim() === "") {
      const db = await this.db();
      const rows = await db.select<{ max_code: string | null }[]>(
        "SELECT MAX(CAST(category_code AS INTEGER)) as max_code FROM item_categories",
      );
      const maxCodeNumber = parseInt(rows[0]?.max_code || "0", 10);
      payload.category_code = (maxCodeNumber + 1).toString().padStart(5, "0");
    }

    return super.create(payload);
  }
}

export const itemCategoryRepo = new ItemCategoryRepository();
