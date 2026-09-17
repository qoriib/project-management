import { BaseRepository } from "@/db/core/base-repository";
import { type CreateOrder, type Order, OrderModel, type UpdateOrder } from "@/db/models";
import { generateNextCode } from "@/utils/formatters";
import { orderItemRepo, type OrderItemDetail, type OrderItemInput } from "./order-item.repository";
import { requirementGroupRepo } from "./requirement-group.repository";

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

  /**
   * Get all Orders with summary (project name, group name, total price, item count, vendor names, item names).
   */
  async findAllWithSummary(filters?: OrderFilters): Promise<OrderWithSummary[]> {
    const params: unknown[] = [];
    let pIdx = 1;
    let whereSql = "WHERE orders.deleted_at IS NULL";

    if (filters?.project_id) {
      whereSql += ` AND orders.project_id = $${pIdx++}`;
      params.push(filters.project_id);
    }
    if (filters?.requirement_group_id) {
      whereSql += ` AND orders.requirement_group_id = $${pIdx++}`;
      params.push(filters.requirement_group_id);
    }
    if (filters?.start_date) {
      whereSql += ` AND orders.order_date >= $${pIdx++}`;
      params.push(filters.start_date);
    }
    if (filters?.end_date) {
      whereSql += ` AND orders.order_date <= $${pIdx++}`;
      params.push(filters.end_date);
    }

    const sql = `
      SELECT orders.order_id,
             orders.order_code,
             orders.project_id,
             orders.requirement_group_id,
             requirement_groups.group_name,
             orders.order_date,
             orders.created_at,
             projects.project_name,
             GROUP_CONCAT(DISTINCT vendors.vendor_name) as vendor_names,
             GROUP_CONCAT(DISTINCT items.item_name) as item_names,
             GROUP_CONCAT(DISTINCT COALESCE(item_rg.group_name, requirement_groups.group_name)) as group_names,
             COALESCE(SUM(order_items.qty * item_prices.price * (CASE WHEN order_items.has_tax = 1 THEN 1.12 ELSE 1.0 END)), 0) as total_price,
             COUNT(order_items.order_item_id) as item_count
      FROM orders
      LEFT JOIN projects ON projects.project_id = orders.project_id AND projects.deleted_at IS NULL
      LEFT JOIN requirement_groups ON requirement_groups.requirement_group_id = orders.requirement_group_id AND requirement_groups.deleted_at IS NULL
      LEFT JOIN order_items ON order_items.order_id = orders.order_id
      LEFT JOIN requirement_groups AS item_rg ON item_rg.requirement_group_id = order_items.requirement_group_id AND item_rg.deleted_at IS NULL
      LEFT JOIN items ON items.item_id = order_items.item_id AND items.deleted_at IS NULL
      LEFT JOIN item_prices ON item_prices.item_price_id = order_items.item_price_id AND item_prices.deleted_at IS NULL
      LEFT JOIN vendors ON vendors.vendor_id = order_items.vendor_id AND vendors.deleted_at IS NULL
      ${whereSql}
      GROUP BY orders.order_id
      ORDER BY orders.order_date DESC, orders.order_id DESC
    `;

    const rows = await this.rawSelect<RawOrderSummaryRow>(sql, params);
    return rows.map((row) => ({
      ...row,
      vendor_names: row.vendor_names ? row.vendor_names.split(",").map((name) => name.trim()) : [],
      item_names: row.item_names ? row.item_names.split(",").map((name) => name.trim()) : [],
      group_names: row.group_names
        ? [
            ...new Set(
              row.group_names
                .split(",")
                .map((n) => n.trim())
                .filter(Boolean),
            ),
          ]
        : [],
    }));
  }

  /**
   * Get a single Order by ID with summary info.
   */
  async findByIdWithSummary(orderId: string): Promise<OrderWithSummary | null> {
    const sql = `
      SELECT orders.order_id,
             orders.order_code,
             orders.project_id,
             orders.requirement_group_id,
             requirement_groups.group_name,
             orders.order_date,
             orders.created_at,
             projects.project_name,
             GROUP_CONCAT(DISTINCT vendors.vendor_name) as vendor_names,
             GROUP_CONCAT(DISTINCT items.item_name) as item_names,
             GROUP_CONCAT(DISTINCT COALESCE(item_rg.group_name, requirement_groups.group_name)) as group_names,
             COALESCE(SUM(order_items.qty * item_prices.price * (CASE WHEN order_items.has_tax = 1 THEN 1.12 ELSE 1.0 END)), 0) as total_price,
             COUNT(order_items.order_item_id) as item_count
      FROM orders
      LEFT JOIN projects ON projects.project_id = orders.project_id AND projects.deleted_at IS NULL
      LEFT JOIN requirement_groups ON requirement_groups.requirement_group_id = orders.requirement_group_id AND requirement_groups.deleted_at IS NULL
      LEFT JOIN order_items ON order_items.order_id = orders.order_id
      LEFT JOIN requirement_groups AS item_rg ON item_rg.requirement_group_id = order_items.requirement_group_id AND item_rg.deleted_at IS NULL
      LEFT JOIN items ON items.item_id = order_items.item_id AND items.deleted_at IS NULL
      LEFT JOIN item_prices ON item_prices.item_price_id = order_items.item_price_id AND item_prices.deleted_at IS NULL
      LEFT JOIN vendors ON vendors.vendor_id = order_items.vendor_id AND vendors.deleted_at IS NULL
      WHERE orders.order_id = $1 AND orders.deleted_at IS NULL
      GROUP BY orders.order_id
    `;

    const rows = await this.rawSelect<RawOrderSummaryRow>(sql, [orderId]);
    if (!rows[0]) return null;

    const firstRow = rows[0];
    return {
      ...firstRow,
      vendor_names: firstRow.vendor_names ? firstRow.vendor_names.split(",").map((name) => name.trim()) : [],
      item_names: firstRow.item_names ? firstRow.item_names.split(",").map((name) => name.trim()) : [],
      group_names: firstRow.group_names
        ? [
            ...new Set(
              firstRow.group_names
                .split(",")
                .map((n) => n.trim())
                .filter(Boolean),
            ),
          ]
        : [],
    };
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
      item.requirement_group_id || order.requirement_group_id || "",
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
    const order = await this.findById(orderId);
    return orderItemRepo.create({
      has_tax: item.has_tax ?? false,
      item_id: item.item_id!,
      item_price_id: item.item_price_id,
      order_id: orderId,
      qty: item.qty,
      requirement_group_id: item.requirement_group_id || order?.requirement_group_id || "",
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
    await this.rawExecute(`DELETE FROM receipt_items WHERE order_item_id = $1`, [orderItemId]);
    await orderItemRepo.delete(orderItemId);
  }

  /**
   * Menghasilkan kode pesanan (PO) berikutnya secara sekuensial (PO-00001, dsb).
   */
  async getNextCode(projectId?: string): Promise<string> {
    const orders = await this.findAllWithSummary({ project_id: projectId });
    return generateNextCode(
      orders.map((o) => o.order_code),
      "PO-",
    );
  }

  /**
   * Membuat pesanan (PO) kosong baru untuk proyek terkait.
   */
  async createForProject(projectId: string): Promise<string> {
    const nextCode = await this.getNextCode(projectId);
    const today = new Date().toISOString().split("T")[0];
    const groups = await requirementGroupRepo.findByProject(projectId);
    return this.create({
      project_id: projectId,
      order_code: nextCode,
      order_date: today,
      requirement_group_id: groups[0]?.requirement_group_id ?? "",
    });
  }

  /**
   * Hapus pesanan (PO) beserta seluruh item dan penerimaan (NP) terkait secara cascading.
   */
  override async delete(id: string): Promise<void> {
    // 1. Ambil seluruh receipt terkait order ini
    const receipts = await this.rawSelect<{ receipt_id: string }>(
      `SELECT receipt_id FROM receipts WHERE order_id = $1`,
      [id],
    );

    // 2. Hapus item penerimaan dan soft-delete dokumen penerimaan
    if (receipts.length > 0) {
      for (const r of receipts) {
        await this.rawExecute(`DELETE FROM receipt_items WHERE receipt_id = $1`, [r.receipt_id]);
      }
      await this.rawExecute(`UPDATE receipts SET deleted_at = datetime('now') WHERE order_id = $1`, [id]);
    }

    // 3. Hapus seluruh item pesanan
    await orderItemRepo.deleteByOrder(id);

    // 4. Soft-delete pesanan
    await super.delete(id);
  }
}

export const orderRepo = new OrderRepository();
