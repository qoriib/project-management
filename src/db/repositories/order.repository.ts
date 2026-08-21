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

interface RawOrderSummaryRow extends Order {
  project_name?: string;
  total_price?: number;
  item_count?: number;
  vendor_names?: string | null;
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
      const query = new QueryBuilder()
        .select(
          "orders.order_id",
          "orders.order_code",
          "orders.project_id",
          "orders.order_date",
          "orders.created_at",
          "projects.project_name",
        )
        .selectRaw("GROUP_CONCAT(DISTINCT vendors.vendor_name) as vendor_names")
        .selectRaw(
          "COALESCE(SUM(order_items.qty * item_prices.price * (CASE WHEN order_items.has_tax = 1 THEN 1.12 ELSE 1.0 END)), 0) as total_price",
        )
        .selectRaw("COUNT(order_items.order_item_id) as item_count")
        .from("orders", "orders")
        .leftJoin("projects", "projects", "projects.project_id = orders.project_id")
        .leftJoin("order_items", "order_items", "order_items.order_id = orders.order_id")
        .leftJoin("item_prices", "item_prices", "item_prices.item_price_id = order_items.item_price_id")
        .leftJoin("vendors", "vendors", "vendors.vendor_id = order_items.vendor_id")
        .withSoftDelete("orders")
        .groupBy("orders.order_id")
        .orderBy("orders.order_id", "ASC");

      if (filters?.project_id) {
        query.where("orders.project_id", "=", filters.project_id);
      }
      if (filters?.start_date) {
        query.where("orders.order_date", ">=", filters.start_date);
      }
      if (filters?.end_date) {
        query.where("orders.order_date", "<=", filters.end_date);
      }

      const { sql, params } = query.build();
      const rows = await this.rawSelect<RawOrderSummaryRow>(sql, params);

      return rows.map((row) => ({
        ...row,
        vendor_names: row.vendor_names ? row.vendor_names.split(",").map((name) => name.trim()) : [],
      }));
    } catch (error) {
      throw wrapDbError(error, this.model.tableName);
    }
  }

  /**
   * Get a single Order by ID with summary info.
   */
  async findByIdWithSummary(orderId: string): Promise<OrderWithSummary | null> {
    const query = new QueryBuilder()
      .select(
        "orders.order_id",
        "orders.order_code",
        "orders.project_id",
        "orders.order_date",
        "orders.created_at",
        "projects.project_name",
      )
      .selectRaw("GROUP_CONCAT(DISTINCT vendors.vendor_name) as vendor_names")
      .selectRaw(
        "COALESCE(SUM(order_items.qty * item_prices.price * (CASE WHEN order_items.has_tax = 1 THEN 1.12 ELSE 1.0 END)), 0) as total_price",
      )
      .from("orders", "orders")
      .leftJoin("projects", "projects", "projects.project_id = orders.project_id")
      .leftJoin("order_items", "order_items", "order_items.order_id = orders.order_id")
      .leftJoin("item_prices", "item_prices", "item_prices.item_price_id = order_items.item_price_id")
      .leftJoin("vendors", "vendors", "vendors.vendor_id = order_items.vendor_id")
      .where("orders.order_id", "=", orderId)
      .groupBy("orders.order_id");

    const { sql, params } = query.build();
    const rows = await this.rawSelect<RawOrderSummaryRow>(sql, params);

    if (!rows[0]) return null;

    const firstRow = rows[0];
    return {
      ...firstRow,
      vendor_names: firstRow.vendor_names ? firstRow.vendor_names.split(",").map((name) => name.trim()) : [],
    };
  }

  /**
   * Get all items for a specific Order, with joined details and delivery calculation.
   */
  async findItems(orderId: string): Promise<OrderItemDetail[]> {
    const query = new QueryBuilder()
      .select(
        "order_items.order_item_id",
        "order_items.order_id",
        "order_items.item_id",
        "order_items.vendor_id",
        "order_items.item_price_id",
        "order_items.qty",
        "order_items.has_tax",
        "item_prices.price",
        "items.item_name",
        "items.item_code",
        "categories.prefix as category_prefix",
        "categories.category_code",
        "units.unit_name as unit",
        "vendors.vendor_name",
      )
      .selectRaw("COALESCE(SUM(receipt_items.qty), 0) as total_delivered")
      .selectRaw("order_items.qty - COALESCE(SUM(receipt_items.qty), 0) as remaining")
      .from("order_items", "order_items")
      .leftJoin("item_prices", "item_prices", "item_prices.item_price_id = order_items.item_price_id")
      .leftJoin("items", "items", "items.item_id = order_items.item_id")
      .leftJoin("item_categories", "categories", "categories.category_id = items.category_id")
      .leftJoin("units", "units", "items.unit_id = units.unit_id")
      .leftJoin("vendors", "vendors", "vendors.vendor_id = order_items.vendor_id")
      .leftJoin("receipt_items", "receipt_items", "receipt_items.order_item_id = order_items.order_item_id")
      .where("order_items.order_id", "=", orderId)
      .groupBy("order_items.order_item_id");

    const { sql, params } = query.build();
    return this.rawSelect<OrderItemDetail>(sql, params);
  }

  /**
   * Create an Order with its items in a single transaction.
   */
  async createWithItems(order: CreateOrder, items: Omit<OrderItemInput, "order_item_id">[]): Promise<string> {
    return this.transaction(async () => {
      const orderId = await this.create(order);
      const rows = items.map((item) => [
        this.generateId(),
        orderId,
        item.item_id ?? null,
        item.vendor_id ?? null,
        item.item_price_id,
        item.qty,
        item.has_tax ? 1 : 0,
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
   * Update an Order and synchronize its items (upsert + delete diff).
   */
  async updateWithItems(orderId: string, order: UpdateOrder, items: OrderItemInput[]): Promise<void> {
    return this.transaction(async () => {
      await this.update(orderId, order);

      const existingRows = await this.rawSelect<{ order_item_id: string }>(
        "SELECT order_item_id FROM order_items WHERE order_id = $1",
        [orderId],
      );

      const newItemIds = new Set(items.map((item) => item.order_item_id).filter(Boolean));
      const idsToDelete = existingRows.map((existing) => existing.order_item_id).filter((id) => !newItemIds.has(id));

      if (idsToDelete.length > 0) {
        const placeholders = idsToDelete.map((_, index) => `$${index + 1}`).join(",");
        await this.rawExecute(`DELETE FROM order_items WHERE order_item_id IN (${placeholders})`, idsToDelete);
      }

      const newItems = items.filter((item) => !item.order_item_id);
      const existingItems = items.filter((item) => item.order_item_id);

      if (newItems.length > 0) {
        const rows = newItems.map((item) => [
          this.generateId(),
          orderId,
          item.item_id ?? null,
          item.vendor_id ?? null,
          item.item_price_id,
          item.qty,
          item.has_tax ? 1 : 0,
        ]);
        await this.bulkInsert(
          "order_items",
          ["order_item_id", "order_id", "item_id", "vendor_id", "item_price_id", "qty", "has_tax"],
          rows,
        );
      }

      for (const item of existingItems) {
        await this.rawExecute(
          `UPDATE order_items 
           SET item_id = $1, vendor_id = $2, item_price_id = $3, qty = $4, has_tax = $5 
           WHERE order_item_id = $6`,
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
    await this.rawExecute("DELETE FROM order_items WHERE order_item_id = $1", [orderItemId]);
  }
}

export const orderRepo = new OrderRepository();
