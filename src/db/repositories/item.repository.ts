/**
 * Item Repository — Catalog items with price lookup.
 */

import { BaseRepository } from "@/db/core/base-repository";
import { type CreateItem, type Item, ItemModel, type UpdateItem } from "@/db/models";

import { QueryBuilder } from "@/db/core/query-builder";
import { wrapDbError } from "@/db/core/errors";

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

  async findAll(): Promise<ItemWithDetails[]> {
    try {
      const qb = new QueryBuilder()
          .select("i.*", "c.category_name", "c.prefix as category_prefix", "c.category_code", "u.unit_name")
          .selectRaw(
            "(EXISTS(SELECT 1 FROM item_prices WHERE item_id = i.item_id AND deleted_at IS NULL) OR EXISTS(SELECT 1 FROM bill_of_materials WHERE item_id = i.item_id AND deleted_at IS NULL) OR EXISTS(SELECT 1 FROM po_items WHERE item_id = i.item_id)) as has_relation",
          )
          .from("items i")
          .leftJoin("item_categories c", "i.category_id = c.category_id")
          .leftJoin("units u", "i.unit_id = u.unit_id")
          .where("i.deleted_at", "IS NULL")
          .orderBy("i.item_name", "ASC"),
        { sql, params } = qb.build(),
        rows = await this.rawSelect<any>(sql, params);
      return rows.map((r) => ({
        ...r,
        has_relation: Boolean(r.has_relation),
      }));
    } catch (error) {
      throw wrapDbError(error, "Failed to get items with details");
    }
  }

  async create(data: CreateItem): Promise<string> {
    const dataToInsert = { ...data };

    if (!dataToInsert.item_code || dataToInsert.item_code.trim() === "") {
      const db = await this.db(),
        rows = await db.select<{ max_code: string }[]>(`SELECT MAX(CAST(item_code AS INTEGER)) as max_code FROM items`),
        maxCode = parseInt(rows[0]?.max_code || "0", 10),
        newCode = (maxCode + 1).toString().padStart(5, "0");
      dataToInsert.item_code = newCode;
    }

    return super.create(dataToInsert);
  }
}

export const itemRepo = new ItemRepository();
