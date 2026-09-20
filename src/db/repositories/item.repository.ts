import { BaseRepository } from "@/db/core/base-repository";
import { type CreateItem, type Item, ItemModel, type UpdateItem } from "@/db/models";
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
  override async findAll(options?: FindOptions): Promise<ItemWithDetails[]> {
    const qb = this.query("items")
      .select(
        "items.*",
        "categories.category_name",
        "categories.prefix as category_prefix",
        "categories.category_code",
        "units.unit_name",
      )
      .selectRaw(
        `(EXISTS(SELECT 1 FROM item_prices WHERE item_id = items.item_id)
          OR EXISTS(SELECT 1 FROM requirements WHERE item_id = items.item_id)
          OR EXISTS(SELECT 1 FROM order_items WHERE item_id = items.item_id)) as has_relation`,
      )
      .leftJoin("item_categories", "categories", "items.category_id = categories.category_id")
      .leftJoin("units", "units", "items.unit_id = units.unit_id")
      .orderBy("items.item_id", "ASC");

    if (options?.where) {
      qb.applySimpleWhere(options.where);
    }

    if (options?.orderBy) {
      const orders = Array.isArray(options.orderBy) ? options.orderBy : [options.orderBy];
      for (const order of orders) {
        qb.orderBy(order.column, order.direction);
      }
    }

    if (options?.limit !== undefined) {
      qb.limit(options.limit);
    }
    if (options?.offset !== undefined) {
      qb.offset(options.offset);
    }

    const rows = await qb.getMany<ItemWithDetails & { has_relation: number | boolean }>();

    return rows.map((row) => ({
      ...row,
      has_relation: Boolean(row.has_relation),
    }));
  }
}

export const itemRepo = new ItemRepository();
