import { BaseRepository } from "@/db/core/base-repository";
import { QueryBuilder } from "@/db/core/query-builder";
import { generateNextCode } from "@/utils/formatters";
import { orderItemRepo, type OrderItemDetail, type OrderItemInput } from "./order-item.repository";
import { receiptItemRepo } from "./receipt-item.repository";
import { receiptRepo } from "./receipt.repository";
import { type CreateOrder, type Order, OrderModel, type UpdateOrder } from "@/db/models";

export type OrderWithSummary = Order & {
  project_name?: string;
  group_name?: string | null;
  group_names?: string[];
  total_price?: number;
  item_count?: number;
  vendor_names?: string[];
  item_names?: string[];
};

export interface OrderFilters {
  project_id?: string;
  requirement_group_id?: string;
  start_date?: string;
  end_date?: string;
}

interface RawOrderSummaryRow extends Order {
  project_name?: string;
  group_name?: string | null;
  group_names?: string | null;
  total_price?: number;
  item_count?: number;
  vendor_names?: string | null;
  item_names?: string | null;
}

export type { OrderItemDetail, OrderItemInput };

class OrderRepository extends BaseRepository<Order, CreateOrder, UpdateOrder> {
  constructor() {
    super(OrderModel);
  }

  private buildSummaryQuery(): QueryBuilder {
    return this.query("orders")
      .select(
        "orders.order_id",
        "orders.order_code",
        "orders.project_id",
        "orders.order_date",
        "orders.created_at",
        "projects.project_name",
      )
      .selectGroupConcat("vendors.vendor_name", "vendor_names", true)
      .selectGroupConcat("items.item_name", "item_names", true)
      .selectGroupConcat("item_rg.group_name", "group_names", true)
      .selectRaw(
        "COALESCE(SUM(order_items.qty * item_prices.price * (CASE WHEN order_items.has_tax = 1 THEN 1.12 ELSE 1.0 END)), 0) as total_price",
      )
      .selectCount("order_items.order_item_id", "item_count")
      .leftJoin("projects", "projects", "projects.project_id = orders.project_id")
      .leftJoin("order_items", "order_items", "order_items.order_id = orders.order_id")
      .leftJoin("requirement_groups", "item_rg", "item_rg.requirement_group_id = order_items.requirement_group_id")
      .leftJoin("items", "items", "items.item_id = order_items.item_id")
      .leftJoin("vendors", "vendors", "vendors.vendor_id = order_items.vendor_id")
      .leftJoin("item_prices", "item_prices", "item_prices.item_price_id = order_items.item_price_id")
      .groupBy("orders.order_id");
  }

  private formatSummaryRow(row: RawOrderSummaryRow): OrderWithSummary {
    const groupNames = row.group_names
      ? [
          ...new Set(
            row.group_names
              .split(",")
              .map((name) => name.trim())
              .filter(Boolean),
          ),
        ]
      : [];

    return {
      ...row,
      group_name: groupNames[0] ?? null,
      group_names: groupNames,
      vendor_names: row.vendor_names ? row.vendor_names.split(",").map((name) => name.trim()) : [],
      item_names: row.item_names ? row.item_names.split(",").map((name) => name.trim()) : [],
    };
  }

  /**
   * Get all Orders with summary (project name, group name, total price, item count, vendor names, item names).
   */
  async findAllWithSummary(filters?: OrderFilters): Promise<OrderWithSummary[]> {
    const qb = this.buildSummaryQuery()
      .when(Boolean(filters?.project_id), (b) => b.where("orders.project_id", "=", filters!.project_id))
      .when(Boolean(filters?.requirement_group_id), (b) =>
        b.where("order_items.requirement_group_id", "=", filters!.requirement_group_id),
      )
      .when(Boolean(filters?.start_date), (b) => b.where("orders.order_date", ">=", filters!.start_date))
      .when(Boolean(filters?.end_date), (b) => b.where("orders.order_date", "<=", filters!.end_date))
      .orderBy("orders.order_date", "DESC")
      .orderBy("orders.order_id", "DESC");

    const rows = await qb.getMany<RawOrderSummaryRow>();
    return rows.map((row) => this.formatSummaryRow(row));
  }

  /**
   * Get a single Order by ID with summary info.
   */
  async findByIdWithSummary(orderId: string): Promise<OrderWithSummary | null> {
    const row = await this.buildSummaryQuery().where("orders.order_id", "=", orderId).getOne<RawOrderSummaryRow>();

    return row ? this.formatSummaryRow(row) : null;
  }

  /**
   * Get all items for a specific Order, with joined details and delivery calculation.
   */
  async findItems(orderId: string): Promise<OrderItemDetail[]> {
    return orderItemRepo.findByOrder(orderId);
  }

  /**
   * Create an Order with its items.
   */
  async createWithItems(order: CreateOrder, items: Omit<OrderItemInput, "order_item_id">[]): Promise<string> {
    const orderId = await this.create(order);
    const rows = items.map((item) => [
      this.generateId(),
      orderId,
      item.requirement_group_id || null,
      item.item_id ?? null,
      item.vendor_id ?? null,
      item.item_price_id,
      item.qty,
      item.has_tax ? 1 : 0,
    ]);

    await this.bulkInsert(
      "order_items",
      ["order_item_id", "order_id", "requirement_group_id", "item_id", "vendor_id", "item_price_id", "qty", "has_tax"],
      rows,
    );

    return orderId;
  }

  /**
   * Add a single item to an existing Order.
   */
  async createItem(orderId: string, item: Omit<OrderItemInput, "order_item_id">): Promise<string> {
    return orderItemRepo.create({
      has_tax: item.has_tax ?? false,
      item_id: item.item_id!,
      item_price_id: item.item_price_id,
      order_id: orderId,
      qty: item.qty,
      requirement_group_id: item.requirement_group_id ?? null,
      vendor_id: item.vendor_id!,
    });
  }

  /**
   * Update a single item.
   */
  async updateItem(orderItemId: string, item: OrderItemInput): Promise<void> {
    await orderItemRepo.update(orderItemId, {
      has_tax: item.has_tax,
      item_id: item.item_id ?? undefined,
      item_price_id: item.item_price_id,
      qty: item.qty,
      requirement_group_id: item.requirement_group_id ?? undefined,
      vendor_id: item.vendor_id ?? undefined,
    });
  }

  /**
   * Delete a single item from an Order and any referencing receipt items.
   */
  async deleteItem(orderItemId: string): Promise<void> {
    await receiptItemRepo.deleteWhere({ order_item_id: orderItemId });
    await orderItemRepo.delete(orderItemId);
  }

  /**
   * Menghasilkan kode pesanan (PO) berikutnya secara sekuensial (PO-00001, dsb).
   */
  async getNextCode(projectId?: string): Promise<string> {
    const orders = await this.findAllWithSummary({ project_id: projectId });
    return generateNextCode(
      orders.map((order) => order.order_code),
      "PO-",
    );
  }

  /**
   * Membuat pesanan (PO) kosong baru untuk proyek terkait.
   */
  async createForProject(projectId: string): Promise<string> {
    const nextCode = await this.getNextCode(projectId);
    const today = new Date().toISOString().split("T")[0];
    return this.create({
      project_id: projectId,
      order_code: nextCode,
      order_date: today,
    });
  }

  /**
   * Hapus pesanan (PO) beserta seluruh item dan penerimaan (NP) terkait secara cascading.
   * FK cascade menangani receipt_items → FK constraints menangani receipt_items saat orders dihapus.
   * Namun receipt harus dihapus manual karena ON DELETE hanya cascade dari orders→order_items.
   */
  override async delete(id: string): Promise<void> {
    // FK cascade: orders → order_items → receipt_items (via ON DELETE CASCADE).
    // receipts hanya FK ke orders, tidak cascade otomatis.
    await receiptRepo.deleteWhere({ order_id: id });
    await super.delete(id);
  }
}

export const orderRepo = new OrderRepository();
