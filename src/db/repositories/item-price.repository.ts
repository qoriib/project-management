import { BaseRepository } from "@/db/core/base-repository";
import { type CreateItemPrice, type ItemPrice, ItemPriceModel, type UpdateItemPrice } from "@/db/models";

export type ItemPriceWithRelation = ItemPrice & {
  /** True if this price is referenced by any BOM or PO line */
  has_relation: boolean;
};

class ItemPriceRepository extends BaseRepository<ItemPrice, CreateItemPrice, UpdateItemPrice> {
  constructor() {
    super(ItemPriceModel);
  }

  /**
   * Get all price variants for a specific item.
   */
  async findByItem(itemId: string): Promise<ItemPrice[]> {
    return this.findAll({
      where: { item_id: itemId },
      orderBy: { column: "item_price_id", direction: "DESC" },
    });
  }

  /**
   * Get all price variants for an item, enriched with has_relation flag.
   */
  async findByItemWithRelation(itemId: string): Promise<ItemPriceWithRelation[]> {
    const rows = await this.query("item_prices")
      .select("item_prices.*")
      .selectRaw(
        `(EXISTS(SELECT 1 FROM requirements WHERE item_price_id = item_prices.item_price_id)
         OR EXISTS(SELECT 1 FROM order_items WHERE item_price_id = item_prices.item_price_id)
         OR EXISTS(SELECT 1 FROM receipt_items WHERE item_price_id = item_prices.item_price_id)) as has_relation`,
      )
      .where("item_prices.item_id", "=", itemId)
      .orderBy("item_prices.item_price_id", "DESC")
      .getMany<ItemPriceWithRelation & { has_relation: number | boolean }>();

    return rows.map((row) => ({
      ...row,
      has_relation: Boolean(row.has_relation),
    }));
  }
}

export const itemPriceRepo = new ItemPriceRepository();
