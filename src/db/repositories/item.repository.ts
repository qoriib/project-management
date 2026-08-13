/**
 * Item Repository — Catalog items with price lookup.
 */

import { BaseRepository } from "@/db/core/base-repository";
import {
  ItemModel,
  type Item,
  type CreateItem,
  type UpdateItem,
} from "@/db/models";

import { QueryBuilder } from "@/db/core/query-builder";
import { wrapDbError } from "@/db/core/errors";

export type ItemWithDetails = Item & {
  category_name?: string;
  unit_name?: string;
};

class ItemRepository extends BaseRepository<Item, CreateItem, UpdateItem> {
  constructor() {
    super(ItemModel);
  }

  async findAll(): Promise<ItemWithDetails[]> {
    try {
      const qb = new QueryBuilder()
        .select("i.*", "c.category_name", "u.unit_name")
        .from("items i")
        .join("LEFT JOIN", "item_categories c", "i.category_id = c.category_id")
        .join("LEFT JOIN", "units u", "i.unit_id = u.unit_id")
        .where("i.deleted_at", "IS NULL")
        .orderBy("i.item_name", "ASC");

      const { sql, params } = qb.build();
      return await this.rawSelect<ItemWithDetails>(sql, params);
    } catch (error) {
      throw wrapDbError(error, "Failed to get items with details");
    }
  }
}

export const itemRepo = new ItemRepository();
