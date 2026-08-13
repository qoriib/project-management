/**
 * Item Price Repository — Manages price variants per item.
 */

import { BaseRepository } from "@/db/core/base-repository";
import { QueryBuilder } from "@/db/core/query-builder";
import { wrapDbError } from "@/db/core/errors";
import {
  ItemPriceModel,
  type ItemPrice,
  type CreateItemPrice,
  type UpdateItemPrice,
} from "@/db/models";

class ItemPriceRepository extends BaseRepository<ItemPrice, CreateItemPrice, UpdateItemPrice> {
  constructor() {
    super(ItemPriceModel);
  }

  /**
   * Get all active price variants for a specific item.
   */
  async findByItem(itemId: number): Promise<ItemPrice[]> {
    try {
      const { sql, params } = new QueryBuilder()
        .select("*")
        .from("item_prices")
        .where("item_id", "=", itemId)
        .withSoftDelete()
        .orderBy("item_price_id", "ASC")
        .build();

      return this.rawSelect<ItemPrice>(sql, params);
    } catch (error) {
      throw wrapDbError(error, "item_prices");
    }
  }

  /**
   * Get all active price variants for multiple items at once.
   * Returns a map of item_id → ItemPrice[].
   */
  async findByItems(itemIds: number[]): Promise<Map<number, ItemPrice[]>> {
    if (itemIds.length === 0) return new Map();
    try {
      const placeholders = itemIds.map((_, i) => `$${i + 1}`).join(", ");
      const sql = `SELECT * FROM item_prices WHERE item_id IN (${placeholders}) AND deleted_at IS NULL ORDER BY item_id, item_price_id ASC`;
      const rows = await this.rawSelect<ItemPrice>(sql, itemIds);

      const map = new Map<number, ItemPrice[]>();
      for (const row of rows) {
        const existing = map.get(row.item_id) ?? [];
        existing.push(row);
        map.set(row.item_id, existing);
      }
      return map;
    } catch (error) {
      throw wrapDbError(error, "item_prices");
    }
  }
}

export const itemPriceRepo = new ItemPriceRepository();
