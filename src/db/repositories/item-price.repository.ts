/**
 * Item Price Repository — Manages price variants per item.
 */

import { BaseRepository } from "@/db/core/base-repository";
import { QueryBuilder } from "@/db/core/query-builder";
import { wrapDbError } from "@/db/core/errors";
import {
  type CreateItemPrice,
  type ItemPrice,
  ItemPriceModel,
  type UpdateItemPrice,
} from "@/db/models";

export type ItemPriceWithRelation = ItemPrice & {
  /** True if this price is referenced by any BOM or PO line */
  has_relation: boolean;
};

class ItemPriceRepository extends BaseRepository<ItemPrice, CreateItemPrice, UpdateItemPrice> {
  constructor() {
    super(ItemPriceModel);
  }

  /**
   * Get all active price variants for a specific item.
   */
  async findByItem(itemId: string): Promise<ItemPrice[]> {
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
   * Get all active price variants for an item, enriched with a has_relation flag
   * indicating whether the price is used in any BOM or PO line.
   */
  async findByItemWithRelation(itemId: string): Promise<ItemPriceWithRelation[]> {
    try {
      const sql = `
        SELECT ip.*,
          CASE WHEN (
            EXISTS(SELECT 1 FROM bill_of_materials WHERE item_price_id = ip.item_price_id AND deleted_at IS NULL)
            OR
            EXISTS(SELECT 1 FROM po_items WHERE item_price_id = ip.item_price_id)
          ) THEN 1 ELSE 0 END AS has_relation
        FROM item_prices ip
        WHERE ip.item_id = $1 AND ip.deleted_at IS NULL
        ORDER BY ip.item_price_id ASC
      `;
      interface RawRow {
        item_price_id: string;
        item_id: string;
        price: number;
        deleted_at: string | null;
        has_relation: number;
      }
      const rows = await this.rawSelect<RawRow>(sql, [itemId]);
      return rows.map((r) => ({
        deleted_at: r.deleted_at,
        has_relation: Boolean(r.has_relation),
        item_id: r.item_id,
        item_price_id: r.item_price_id,
        price: r.price,
      }));
    } catch (error) {
      throw wrapDbError(error, "item_prices");
    }
  }
}

export const itemPriceRepo = new ItemPriceRepository();
