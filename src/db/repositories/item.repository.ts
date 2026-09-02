import { BaseRepository } from "@/db/core/base-repository";
import { type CreateItem, type Item, ItemModel, type UpdateItem } from "@/db/models";
import type { FindOptions } from "@/db/core/types";

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

  /**
   * Get all items with category, unit, and relation status.
   * Only active (non-soft-deleted) relations are considered.
   */
  async findAll(options?: FindOptions): Promise<ItemWithDetails[]> {
    const includeDeleted = options?.includeDeleted ?? false;
    const deletedFilter = includeDeleted ? "" : "AND items.deleted_at IS NULL";

    let sql = `
      SELECT items.*,
             categories.category_name,
             categories.prefix as category_prefix,
             categories.category_code,
             units.unit_name,
             (EXISTS(SELECT 1 FROM item_prices WHERE item_id = items.item_id AND deleted_at IS NULL) 
              OR EXISTS(SELECT 1 FROM requirements WHERE item_id = items.item_id AND deleted_at IS NULL) 
              OR EXISTS(SELECT 1 FROM order_items oi JOIN orders o ON o.order_id = oi.order_id WHERE oi.item_id = items.item_id AND o.deleted_at IS NULL)) as has_relation
      FROM items
      LEFT JOIN item_categories categories ON items.category_id = categories.category_id AND categories.deleted_at IS NULL
      LEFT JOIN units ON items.unit_id = units.unit_id AND units.deleted_at IS NULL
      WHERE 1=1 ${deletedFilter}
    `;
    const params: unknown[] = [];
    let pIdx = 1;

    if (options?.where) {
      for (const [column, value] of Object.entries(options.where)) {
        const colName = column.includes(".") ? column : `items.${column}`;
        sql += ` AND ${colName} = $${pIdx++}`;
        params.push(value);
      }
    }

    sql += " ORDER BY items.item_id ASC";

    if (options?.limit !== undefined) {
      sql += ` LIMIT $${pIdx++}`;
      params.push(options.limit);
    }
    if (options?.offset !== undefined) {
      sql += ` OFFSET $${pIdx++}`;
      params.push(options.offset);
    }

    const rows = await this.rawSelect<ItemWithDetails & { has_relation: number | boolean }>(sql, params);

    return rows.map((row) => ({
      ...row,
      has_relation: Boolean(row.has_relation),
    }));
  }
}

export const itemRepo = new ItemRepository();
