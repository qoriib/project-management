import { BaseRepository } from "@/db/core/base-repository";
import { type CreateItem, type Item, ItemModel, type UpdateItem } from "@/db/models";
import { QueryBuilder } from "@/db/core/query-builder";
import { wrapDbError } from "@/db/core/errors";
import type { FindOptions } from "@/db/core/types";

export type ItemWithDetails = Item & {
  category_name?: string;
  category_prefix?: string;
  category_code?: string;
  unit_name?: string;
  has_relation?: boolean;
};

class ItemRepository extends BaseRepository<Item, CreateItem, UpdateItem> {
  constructor() {
    super(ItemModel);
  }

  /**
   * Get all items with category, unit, and relation status.
   */
  async findAll(options?: FindOptions): Promise<ItemWithDetails[]> {
    try {
      const query = new QueryBuilder()
        .select(
          "items.*",
          "categories.category_name",
          "categories.prefix as category_prefix",
          "categories.category_code",
          "units.unit_name",
        )
        .selectRaw(
          `(EXISTS(SELECT 1 FROM item_prices WHERE item_id = items.item_id AND deleted_at IS NULL) 
            OR EXISTS(SELECT 1 FROM requirements WHERE item_id = items.item_id AND deleted_at IS NULL) 
            OR EXISTS(SELECT 1 FROM order_items WHERE item_id = items.item_id)) as has_relation`,
        )
        .from("items", "items")
        .leftJoin("item_categories", "categories", "items.category_id = categories.category_id")
        .leftJoin("units", "units", "items.unit_id = units.unit_id");

      if (!options?.includeDeleted) {
        query.where("items.deleted_at", "IS NULL");
      }

      if (options?.where) {
        for (const [column, value] of Object.entries(options.where)) {
          const colName = column.includes(".") ? column : `items.${column}`;
          if (value === null) {
            query.where(colName, "IS NULL");
          } else {
            query.where(colName, "=", value);
          }
        }
      }

      if (options?.limit !== undefined) {
        query.limit(options.limit);
      }
      if (options?.offset !== undefined) {
        query.offset(options.offset);
      }

      query.orderBy("items.item_name", "ASC");

      const { sql, params } = query.build();
      const rows = await this.rawSelect<ItemWithDetails & { has_relation: number | boolean }>(sql, params);

      return rows.map((row) => ({
        ...row,
        has_relation: Boolean(row.has_relation),
      }));
    } catch (error) {
      throw wrapDbError(error, "Failed to get items with details");
    }
  }

  /**
   * Create an item with auto-generated 5-digit item_code if omitted.
   */
  async create(data: CreateItem): Promise<string> {
    const payload = { ...data };

    if (!payload.item_code || payload.item_code.trim() === "") {
      const db = await this.db();
      const rows = await db.select<{ max_code: string | null }[]>(
        "SELECT MAX(CAST(item_code AS INTEGER)) as max_code FROM items",
      );
      const maxCodeNumber = parseInt(rows[0]?.max_code || "0", 10);
      payload.item_code = (maxCodeNumber + 1).toString().padStart(5, "0");
    }

    return super.create(payload);
  }
}

export const itemRepo = new ItemRepository();
