import { BaseRepository } from "@/db/core/base-repository";
import { QueryBuilder } from "@/db/core/query-builder";
import { wrapDbError } from "@/db/core/errors";
import { type CreateItemPrice, type ItemPrice, ItemPriceModel, type UpdateItemPrice } from "@/db/models";

export type ItemPriceWithRelation = ItemPrice & {
  /** True if this price is referenced by any BOM or PO line */
  has_relation: boolean;
};

interface RawItemPriceRow {
  item_price_id: string;
  item_id: string;
  price: number;
  deleted_at: string | null;
  has_relation: number;
}

class ItemPriceRepository extends BaseRepository<ItemPrice, CreateItemPrice, UpdateItemPrice> {
  constructor() {
    super(ItemPriceModel);
  }

  /**
   * Get all active price variants for a specific item.
   */
  async findByItem(itemId: string): Promise<ItemPrice[]> {
    try {
      const query = new QueryBuilder()
        .select("*")
        .from("item_prices")
        .where("item_id", "=", itemId)
        .withSoftDelete()
        .orderBy("item_price_id", "DESC");

      const { sql, params } = query.build();
      return await this.rawSelect<ItemPrice>(sql, params);
    } catch (error) {
      throw wrapDbError(error, "item_prices");
    }
  }

  /**
   * Get all active price variants for an item, enriched with has_relation flag.
   */
  async findByItemWithRelation(itemId: string): Promise<ItemPriceWithRelation[]> {
    try {
      const sql = `
        SELECT 
          item_prices.*,
          CASE WHEN (
            EXISTS(SELECT 1 FROM requirements WHERE item_price_id = item_prices.item_price_id AND deleted_at IS NULL)
            OR
            EXISTS(SELECT 1 FROM order_items WHERE item_price_id = item_prices.item_price_id)
          ) THEN 1 ELSE 0 END AS has_relation
        FROM item_prices
        WHERE item_id = $1 AND deleted_at IS NULL
        ORDER BY item_price_id DESC
      `;

      const rows = await this.rawSelect<RawItemPriceRow>(sql, [itemId]);
      return rows.map((row) => ({
        item_price_id: row.item_price_id,
        item_id: row.item_id,
        price: row.price,
        deleted_at: row.deleted_at,
        has_relation: Boolean(row.has_relation),
      }));
    } catch (error) {
      throw wrapDbError(error, "item_prices");
    }
  }
}

export const itemPriceRepo = new ItemPriceRepository();
