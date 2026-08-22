import { BaseRepository } from "@/db/core/base-repository";
import { type CreateItem, type Item, ItemModel, type UpdateItem } from "@/db/models";
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
   * Only active (non-soft-deleted) relations are considered.
   */
  async findAll(options?: FindOptions): Promise<ItemWithDetails[]> {
    try {
      const query = this.query("items")
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
            OR EXISTS(SELECT 1 FROM order_items oi JOIN orders o ON o.order_id = oi.order_id WHERE oi.item_id = items.item_id AND o.deleted_at IS NULL)) as has_relation`,
        )
        .leftJoin("item_categories", "categories", "items.category_id = categories.category_id")
        .leftJoin("units", "units", "items.unit_id = units.unit_id")
        .orderBy("items.item_id", "ASC");

      if (options?.includeDeleted) {
        query.includeDeleted();
      }

      if (options?.where) {
        for (const [column, value] of Object.entries(options.where)) {
          const colName = column.includes(".") ? column : `items.${column}`;
          query.applyWhere(colName, value);
        }
      }

      if (options?.limit !== undefined) {
        query.limit(options.limit);
      }
      if (options?.offset !== undefined) {
        query.offset(options.offset);
      }

      const { sql, params } = query.build();
      const rows = await this.rawSelect<ItemWithDetails & { has_relation: number | boolean }>(sql, params);

      return rows.map((row) => ({
        ...row,
        has_relation: Boolean(row.has_relation),
      }));
    } catch (error) {
      throw wrapDbError(error, this.model.tableName);
    }
  }
}

export const itemRepo = new ItemRepository();
