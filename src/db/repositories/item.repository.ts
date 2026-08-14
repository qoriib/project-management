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
  has_relation?: boolean;
};

class ItemRepository extends BaseRepository<Item, CreateItem, UpdateItem> {
  constructor() {
    super(ItemModel);
  }

  async findAll(): Promise<ItemWithDetails[]> {
    try {
      const qb = new QueryBuilder()
        .select("i.*", "c.category_name", "u.unit_name")
        .selectRaw("(EXISTS(SELECT 1 FROM item_prices WHERE item_id = i.item_id AND deleted_at IS NULL) OR EXISTS(SELECT 1 FROM bill_of_materials WHERE item_id = i.item_id AND deleted_at IS NULL) OR EXISTS(SELECT 1 FROM po_items WHERE item_id = i.item_id)) as has_relation")
        .from("items i")
        .leftJoin("item_categories c", "i.category_id = c.category_id")
        .leftJoin("units u", "i.unit_id = u.unit_id")
        .where("i.deleted_at", "IS NULL")
        .orderBy("i.item_name", "ASC");

      const { sql, params } = qb.build();
      const rows = await this.rawSelect<any>(sql, params);
      return rows.map((r) => ({
        ...r,
        has_relation: Boolean(r.has_relation),
      }));
    } catch (error) {
      throw wrapDbError(error, "Failed to get items with details");
    }
  }
}

export const itemRepo = new ItemRepository();
