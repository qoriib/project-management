/**
 * Order Repository — Order management with item CRUD.
 */

import { BaseRepository } from "@/db/core/base-repository";
import { QueryBuilder } from "@/db/core/query-builder";
import { wrapDbError } from "@/db/core/errors";
import { type CreateOrder, type Order, OrderModel, type UpdateOrder } from "@/db/models";

// ── Extended Types ───────────────────────────────────────────────────────────

export type OrderWithSummary = Order & {
  project_name?: string;
  total_price?: number;
  item_count?: number;
  vendor_names?: string[];
};

export interface OrderItemDetail {
  order_item_id: string;
  order_id: string | null;
  item_id: string | null;
  vendor_id: string | null;
  item_price_id: string;
  /** Resolved price from joined item_prices */
  price: number;
  qty: number;
  has_tax?: number;
  item_name?: string;
  category_prefix?: string;
  category_code?: string;
  item_code?: string;
  unit?: string;
  vendor_name?: string;
  total_delivered?: number;
  remaining?: number;
}

export interface OrderFilters {
  project_id?: string;
  start_date?: string;
  end_date?: string;
}

export interface OrderItemInput {
  order_item_id?: string;
  item_id: string | null;
  vendor_id: string | null;
  item_price_id: string;
  qty: number;
  has_tax?: number;
}

// ── Repository ───────────────────────────────────────────────────────────────

class OrderRepository extends BaseRepository<Order, CreateOrder, UpdateOrder> {
  constructor() {
    super(OrderModel);
  }

  /**
   * Get all Orders with summary (project name, total price, item count, vendor names).
   */
  async findAllWithSummary(filters?: OrderFilters): Promise<OrderWithSummary[]> {
    try {
      const qb = new QueryBuilder()
        .select("o.order_id", "o.order_code", "o.project_id", "o.order_date", "o.created_at", "p.project_name")
        .selectRaw("GROUP_CONCAT(DISTINCT v.vendor_name) as vendor_names")
        .selectRaw(
          "COALESCE(SUM(oi.qty * ip.price * (CASE WHEN oi.has_tax = 1 THEN 1.12 ELSE 1.0 END)), 0) as total_price",
        )
        .selectRaw("COUNT(oi.order_item_id) as item_count")
        .from("orders", "o")
        .leftJoin("projects", "p", "p.project_id = o.project_id")
        .leftJoin("order_items", "oi", "oi.order_id = o.order_id")
        .leftJoin("item_prices", "ip", "ip.item_price_id = oi.item_price_id")
        .leftJoin("vendors", "v", "v.vendor_id = oi.vendor_id")
        .withSoftDelete("o")
        .groupBy("o.order_id")
        .orderBy("o.order_date", "DESC")
        .orderBy("o.order_id", "DESC");

      if (filters?.project_id) {
        qb.where("o.project_id", "=", filters.project_id);
      }
      if (filters?.start_date) {
        qb.where("o.order_date", ">=", filters.start_date);
      }
      if (filters?.end_date) {
        qb.where("o.order_date", "<=", filters.end_date);
      }

      const { sql, params } = qb.build();
      const rows = await this.rawSelect<any>(sql, params);
      return rows.map((r) => ({
        ...r,
        vendor_names: r.vendor_names ? r.vendor_names.split(",").map((v: string) => v.trim()) : [],
      }));
    } catch (error) {
      throw wrapDbError(error, this.model.tableName);
    }
  }

  /**
   * Get a single Order by ID with summary info.
   */
  async findByIdWithSummary(id: string): Promise<OrderWithSummary | null> {
    const { sql, params } = new QueryBuilder()
        .select("o.order_id", "o.order_code", "o.project_id", "o.order_date", "o.created_at", "p.project_name")
        .selectRaw("GROUP_CONCAT(DISTINCT v.vendor_name) as vendor_names")
        .selectRaw(
          "COALESCE(SUM(oi.qty * ip.price * (CASE WHEN oi.has_tax = 1 THEN 1.12 ELSE 1.0 END)), 0) as total_price",
        )
        .from("orders", "o")
        .leftJoin("projects", "p", "p.project_id = o.project_id")
        .leftJoin("order_items", "oi", "oi.order_id = o.order_id")
        .leftJoin("item_prices", "ip", "ip.item_price_id = oi.item_price_id")
        .leftJoin("vendors", "v", "v.vendor_id = oi.vendor_id")
        .where("o.order_id", "=", id)
        .groupBy("o.order_id")
        .build(),
      rows = await this.rawSelect<any>(sql, params);

    if (!rows[0]) return null;

    return {
      ...rows[0],
      vendor_names: rows[0].vendor_names ? rows[0].vendor_names.split(",").map((v: string) => v.trim()) : [],
    };
  }

  /**
   * Get all items for a specific Order, with joined details.
   */
  async findItems(orderId: string): Promise<OrderItemDetail[]> {
    const { sql, params } = new QueryBuilder()
      .select(
        "oi.order_item_id",
        "oi.order_id",
        "oi.item_id",
        "oi.vendor_id",
        "oi.item_price_id",
        "oi.qty",
        "oi.has_tax",
        "ip.price",
        "i.item_name",
        "i.item_code",
        "c.prefix as category_prefix",
        "c.category_code",
        "u.unit_name as unit",
        "v.vendor_name",
      )
      .selectRaw("COALESCE(SUM(ri.qty), 0) as total_delivered")
      .selectRaw("oi.qty - COALESCE(SUM(ri.qty), 0) as remaining")
      .from("order_items", "oi")
      .leftJoin("item_prices", "ip", "ip.item_price_id = oi.item_price_id")
      .leftJoin("items", "i", "i.item_id = oi.item_id")
      .leftJoin("item_categories", "c", "c.category_id = i.category_id")
      .leftJoin("units", "u", "i.unit_id = u.unit_id")
      .leftJoin("vendors", "v", "v.vendor_id = oi.vendor_id")
      .leftJoin("receipt_items", "ri", "ri.order_item_id = oi.order_item_id")
      .where("oi.order_id", "=", orderId)
      .groupBy("oi.order_item_id")
      .build();

    return this.rawSelect<OrderItemDetail>(sql, params);
  }

  /**
   * Create an Order with its items in a single operation.
   */
  async createWithItems(order: CreateOrder, items: Omit<OrderItemInput, "order_item_id">[]): Promise<string> {
    return this.transaction(async () => {
      const orderId = await this.create(order),
        rows = items.map((it) => [
          this.generateId(),
          orderId,
          it.item_id ?? null,
          it.vendor_id ?? null,
          it.item_price_id,
          it.qty,
          it.has_tax ? 1 : 0,
        ]);
      await this.bulkInsert(
        "order_items",
        ["order_item_id", "order_id", "item_id", "vendor_id", "item_price_id", "qty", "has_tax"],
        rows,
      );

      return orderId;
    });
  }

  /**
   * Update an Order and sync its items (upsert + delete diff).
   */
  async updateWithItems(orderId: string, order: UpdateOrder, items: OrderItemInput[]): Promise<void> {
    return this.transaction(async () => {
      // Update Order header
      await this.update(orderId, order);

      // Sync items
      const existing = await this.rawSelect<{ order_item_id: string }>(
          "SELECT order_item_id FROM order_items WHERE order_id = $1",
          [orderId],
        ),
        newIds = new Set(items.map((i) => i.order_item_id).filter(Boolean)),
        idsToDelete = existing.map((ex) => ex.order_item_id).filter((id) => !newIds.has(id));

      if (idsToDelete.length > 0) {
        const placeholders = idsToDelete.map((_, i) => `$${i + 1}`).join(",");
        await this.rawExecute(`DELETE FROM order_items WHERE order_item_id IN (${placeholders})`, idsToDelete);
      }

      const newItems = items.filter((it) => !it.order_item_id),
        existingItems = items.filter((it) => it.order_item_id);

      if (newItems.length > 0) {
        const rows = newItems.map((it) => [
          this.generateId(),
          orderId,
          it.item_id ?? null,
          it.vendor_id ?? null,
          it.item_price_id,
          it.qty,
          it.has_tax ? 1 : 0,
        ]);
        await this.bulkInsert(
          "order_items",
          ["order_item_id", "order_id", "item_id", "vendor_id", "item_price_id", "qty", "has_tax"],
          rows,
        );
      }

      for (const item of existingItems) {
        await this.rawExecute(
          "UPDATE order_items SET item_id = $1, vendor_id = $2, item_price_id = $3, qty = $4, has_tax = $5 WHERE order_item_id = $6",
          [
            item.item_id ?? null,
            item.vendor_id ?? null,
            item.item_price_id,
            item.qty,
            item.has_tax ? 1 : 0,
            item.order_item_id,
          ],
        );
      }
    });
  }

  /**
   * Add a single item to an existing Order.
   */
  async createItem(orderId: string, item: Omit<OrderItemInput, "order_item_id">): Promise<string> {
    const orderItemId = this.generateId();
    await this.rawExecute(
      `INSERT INTO order_items (order_item_id, order_id, item_id, vendor_id, item_price_id, qty, has_tax)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        orderItemId,
        orderId,
        item.item_id ?? null,
        item.vendor_id ?? null,
        item.item_price_id,
        item.qty,
        item.has_tax ? 1 : 0,
      ],
    );
    return orderItemId;
  }

  /**
   * Update a single item.
   */
  async updateItem(orderItemId: string, item: OrderItemInput): Promise<void> {
    await this.rawExecute(
      `UPDATE order_items 
       SET item_id = $1, vendor_id = $2, item_price_id = $3, qty = $4, has_tax = $5 
       WHERE order_item_id = $6`,
      [item.item_id ?? null, item.vendor_id ?? null, item.item_price_id, item.qty, item.has_tax ? 1 : 0, orderItemId],
    );
  }

  /**
   * Delete a single item.
   */
  async deleteItem(orderItemId: string): Promise<void> {
    await this.rawExecute(`DELETE FROM order_items WHERE order_item_id = $1`, [orderItemId]);
  }
}

export const orderRepo = new OrderRepository();
