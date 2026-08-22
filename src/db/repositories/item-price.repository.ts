import { BaseRepository } from "@/db/core/base-repository";
import { wrapDbError } from "@/db/core/errors";
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
    return this.findAll({
      where: { item_id: itemId },
      orderBy: { column: "item_price_id", direction: "DESC" },
    });
  }

  /**
   * Get all active price variants for an item, enriched with has_relation flag.
   * Only active (non-soft-deleted) relations are considered.
   */
  async findByItemWithRelation(itemId: string): Promise<ItemPriceWithRelation[]> {
    try {
      const qb = this.query("item_prices")
        .select("item_prices.*")
        .selectRaw(
          `(EXISTS(SELECT 1 FROM requirements WHERE item_price_id = item_prices.item_price_id AND deleted_at IS NULL)
            OR EXISTS(SELECT 1 FROM order_items oi JOIN orders o ON o.order_id = oi.order_id WHERE oi.item_price_id = item_prices.item_price_id AND o.deleted_at IS NULL)) as has_relation`,
        )
        .where("item_prices.item_id", "=", itemId)
        .orderBy("item_prices.item_price_id", "DESC");

      const { sql, params } = qb.build();
      const rows = await this.rawSelect<ItemPrice & { has_relation: number | boolean }>(sql, params);

      return rows.map((row) => ({
        ...row,
        has_relation: Boolean(row.has_relation),
      }));
    } catch (error) {
      throw wrapDbError(error, "item_prices");
    }
  }
}

export const itemPriceRepo = new ItemPriceRepository();
