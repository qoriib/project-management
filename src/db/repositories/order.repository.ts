import { BaseRepository } from "@/db/core/base-repository";
import { wrapDbError } from "@/db/core/errors";
import { type CreateOrder, type Order, OrderModel, type UpdateOrder } from "@/db/models";
import { orderItemRepo, type OrderItemDetail, type OrderItemInput } from "./order-item.repository";

export type OrderWithSummary = Order & {
  project_name?: string;
  total_price?: number;
  item_count?: number;
  vendor_names?: string[];
};

export interface OrderFilters {
  project_id?: string;
  start_date?: string;
  end_date?: string;
}

interface RawOrderSummaryRow extends Order {
  project_name?: string;
  total_price?: number;
  item_count?: number;
  vendor_names?: string | null;
}

export type { OrderItemDetail, OrderItemInput };

class OrderRepository extends BaseRepository<Order, CreateOrder, UpdateOrder> {
  constructor() {
    super(OrderModel);
  }

  /**
   * Get all Orders with summary (project name, total price, item count, vendor names).
   */
  async findAllWithSummary(filters?: OrderFilters): Promise<OrderWithSummary[]> {
    try {
      const query = this.query("orders")
        .select(
          "orders.order_id",
          "orders.order_code",
          "orders.project_id",
          "orders.order_date",
          "orders.created_at",
          "projects.project_name",
        )
        .selectGroupConcat("vendors.vendor_name", "vendor_names", true)
        .selectRaw(
          "COALESCE(SUM(order_items.qty * item_prices.price * (CASE WHEN order_items.has_tax = 1 THEN 1.12 ELSE 1.0 END)), 0) as total_price",
        )
        .selectCount("order_items.order_item_id", "item_count")
        .leftJoin("projects", "projects", "projects.project_id = orders.project_id AND projects.deleted_at IS NULL")
        .leftJoin("order_items", "order_items", "order_items.order_id = orders.order_id")
        .leftJoin("item_prices", "item_prices", "item_prices.item_price_id = order_items.item_price_id")
        .leftJoin("vendors", "vendors", "vendors.vendor_id = order_items.vendor_id AND vendors.deleted_at IS NULL")
        .when(Boolean(filters?.project_id), (q) => q.where("orders.project_id", "=", filters!.project_id))
        .when(Boolean(filters?.start_date), (q) => q.where("orders.order_date", ">=", filters!.start_date))
        .when(Boolean(filters?.end_date), (q) => q.where("orders.order_date", "<=", filters!.end_date))
        .groupBy("orders.order_id")
        .orderBy("orders.order_id", "ASC");

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
    const query = this.query("orders")
      .select(
        "orders.order_id",
        "orders.order_code",
        "orders.project_id",
        "orders.order_date",
        "orders.created_at",
        "projects.project_name",
      )
      .selectGroupConcat("vendors.vendor_name", "vendor_names", true)
      .selectRaw(
        "COALESCE(SUM(order_items.qty * item_prices.price * (CASE WHEN order_items.has_tax = 1 THEN 1.12 ELSE 1.0 END)), 0) as total_price",
      )
      .leftJoin("projects", "projects", "projects.project_id = orders.project_id AND projects.deleted_at IS NULL")
      .leftJoin("order_items", "order_items", "order_items.order_id = orders.order_id")
      .leftJoin("item_prices", "item_prices", "item_prices.item_price_id = order_items.item_price_id")
      .leftJoin("vendors", "vendors", "vendors.vendor_id = order_items.vendor_id AND vendors.deleted_at IS NULL")
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
    return orderItemRepo.findByOrder(orderId);
  }

  /**
   * Create an Order with its items in a single atomic transaction.
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

      const existingRows = await orderItemRepo
        .query()
        .select("order_item_id")
        .where("order_id", "=", orderId)
        .getMany<{ order_item_id: string }>();

      const newItemIds = new Set(items.map((item) => item.order_item_id).filter(Boolean));
      const idsToDelete = existingRows.map((existing) => existing.order_item_id).filter((id) => !newItemIds.has(id));

      if (idsToDelete.length > 0) {
        await orderItemRepo.deleteByIds(idsToDelete, false);
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
        await orderItemRepo.update(item.order_item_id!, {
          has_tax: item.has_tax ? 1 : 0,
          item_id: item.item_id ?? undefined,
          item_price_id: item.item_price_id,
          qty: item.qty,
          vendor_id: item.vendor_id ?? undefined,
        });
      }
    });
  }

  /**
   * Add a single item to an existing Order.
   */
  async createItem(orderId: string, item: Omit<OrderItemInput, "order_item_id">): Promise<string> {
    return orderItemRepo.create({
      has_tax: item.has_tax ? 1 : 0,
      item_id: item.item_id!,
      item_price_id: item.item_price_id,
      order_id: orderId,
      qty: item.qty,
      vendor_id: item.vendor_id!,
    });
  }

  /**
   * Update a single item.
   */
  async updateItem(orderItemId: string, item: OrderItemInput): Promise<void> {
    await orderItemRepo.update(orderItemId, {
      has_tax: item.has_tax ? 1 : 0,
      item_id: item.item_id ?? undefined,
      item_price_id: item.item_price_id,
      qty: item.qty,
      vendor_id: item.vendor_id ?? undefined,
    });
  }

  /**
   * Delete a single item.
   */
  async deleteItem(orderItemId: string): Promise<void> {
    await orderItemRepo.delete(orderItemId);
  }
}

export const orderRepo = new OrderRepository();
