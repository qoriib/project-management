/**
 * Item Repository — Catalog items with price lookup.
 */

import { BaseRepository } from "@/db/core/base-repository";
import { QueryBuilder } from "@/db/core/query-builder";
import { wrapDbError } from "@/db/core/errors";
import {
  ItemModel,
  type Item,
  type CreateItem,
  type UpdateItem,
} from "@/db/models";

// ── Extended Types ───────────────────────────────────────────────────────────

export type ItemWithPrices = Item & { prices: number[] };

// ── Repository ───────────────────────────────────────────────────────────────

class ItemRepository extends BaseRepository<Item, CreateItem, UpdateItem> {
  constructor() {
    super(ItemModel);
  }

  /**
   * Get all items with their price variants attached.
   */
  async findAllWithPrices(): Promise<ItemWithPrices[]> {
    try {
      const items = await this.findAll({
        orderBy: [
          { column: "category", direction: "ASC" },
          { column: "item_name", direction: "ASC" },
        ],
      });

      const { sql, params } = new QueryBuilder()
        .select("ip.item_id", "ip.price")
        .from("item_prices", "ip")
        .join("items", "i", "i.item_id = ip.item_id")
        .where("i.deleted_at", "IS NULL")
        .build();

      const prices = await this.rawSelect<{ item_id: number; price: number }>(sql, params);

      return items.map((item) => ({
        ...item,
        prices: prices
          .filter((p) => p.item_id === item.item_id)
          .map((p) => p.price),
      }));
    } catch (error) {
      throw wrapDbError(error, this.model.tableName);
    }
  }
}

export const itemRepo = new ItemRepository();
