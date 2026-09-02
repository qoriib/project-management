import { BaseRepository } from "@/db/core/base-repository";
import { type CreateItemPrice, type ItemPrice, ItemPriceModel, type UpdateItemPrice } from "@/db/models";

export type ItemPriceWithRelation = ItemPrice & {
  /** True if this price is referenced by any active BOM or active PO line */
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
    return this.rawSelect<ItemPrice>(
      "SELECT * FROM item_prices WHERE item_id = $1 AND deleted_at IS NULL ORDER BY item_price_id DESC",
      [itemId],
    );
  }

  /**
   * Get all active price variants for an item, enriched with has_relation flag.
   * Only active (non-soft-deleted) relations are considered.
   */
  async findByItemWithRelation(itemId: string): Promise<ItemPriceWithRelation[]> {
    const rows = await this.rawSelect<ItemPrice & { has_relation: number | boolean }>(
      `SELECT item_prices.*,
              (EXISTS(SELECT 1 FROM requirements WHERE item_price_id = item_prices.item_price_id AND deleted_at IS NULL)
               OR EXISTS(SELECT 1 FROM order_items oi JOIN orders o ON o.order_id = oi.order_id WHERE oi.item_price_id = item_prices.item_price_id AND o.deleted_at IS NULL)) as has_relation
       FROM item_prices
       WHERE item_prices.item_id = $1 AND item_prices.deleted_at IS NULL
       ORDER BY item_prices.item_price_id DESC`,
      [itemId],
    );

    return rows.map((row) => ({
      ...row,
      has_relation: Boolean(row.has_relation),
    }));
  }
}

export const itemPriceRepo = new ItemPriceRepository();
