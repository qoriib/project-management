/**
 * Item Price Repository — Price variant management with relation checking.
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

// ── Extended Types ───────────────────────────────────────────────────────────

export type ItemPriceWithRelation = ItemPrice & { has_relation?: boolean };

export interface PriceInput {
  price_id?: number;
  price: number;
}

// ── Repository ───────────────────────────────────────────────────────────────

class ItemPriceRepository extends BaseRepository<ItemPrice, CreateItemPrice, UpdateItemPrice> {
  constructor() {
    super(ItemPriceModel);
  }

  /**
   * Get all prices for an item, with info about BOM/PO relations.
   */
  async findByItemWithRelation(itemId: number): Promise<ItemPriceWithRelation[]> {
    const { sql, params } = new QueryBuilder()
      .select("p.*")
      .selectRaw("(SELECT COUNT(*) FROM bill_of_materials b WHERE b.item_price_id = p.price_id) as bom_count")
      .selectRaw("(SELECT COUNT(*) FROM po_items po WHERE po.item_price_id = p.price_id) as po_count")
      .from("item_prices", "p")
      .where("p.item_id", "=", itemId)
      .orderBy("p.price_id", "ASC")
      .build();

    const prices = await this.rawSelect<ItemPrice & { bom_count: number; po_count: number }>(sql, params);

    return prices.map((p) => ({
      ...p,
      has_relation: p.bom_count > 0 || p.po_count > 0,
    }));
  }

  /**
   * Sync prices for an item: update existing, create new, delete removed.
   */
  async syncPrices(itemId: number, prices: PriceInput[]): Promise<void> {
    try {
      // Get existing
      const existing = await this.rawSelect<{ price_id: number }>(
        "SELECT price_id FROM item_prices WHERE item_id = $1",
        [itemId]
      );
      const existingIds = existing.map((e) => e.price_id);
      const newIds = prices.filter((p) => p.price_id).map((p) => p.price_id!);
      const idsToDelete = existingIds.filter((id) => !newIds.includes(id));

      // Delete removed prices
      for (const id of idsToDelete) {
        await this.hardDelete(id);
      }

      // Upsert prices
      for (const price of prices) {
        if (price.price_id) {
          await this.update(price.price_id, { price: price.price });
        } else {
          await this.create({ item_id: itemId, price: price.price });
        }
      }
    } catch (error) {
      throw wrapDbError(error, this.model.tableName);
    }
  }
}

export const itemPriceRepo = new ItemPriceRepository();
