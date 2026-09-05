import { BaseRepository } from "@/db/core/base-repository";
import { type CreateOrderItem, type OrderItem, OrderItemModel } from "@/db/models";

export interface OrderItemDetail {
  order_item_id: string;
  order_id: string | null;
  item_id: string | null;
  vendor_id: string | null;
  item_price_id: string;
  /** Resolved price from joined item_prices */
  price: number;
  qty: number;
  has_tax?: boolean;
  item_name?: string;
  category_prefix?: string;
  category_code?: string;
  item_code?: string;
  unit?: string;
  vendor_name?: string;
  total_delivered?: number;
  remaining?: number;
}

export interface OrderItemInput {
  order_item_id?: string;
  item_id: string | null;
  vendor_id: string | null;
  item_price_id: string;
  qty: number;
  has_tax?: boolean;
}

type UpdateOrderItem = Partial<CreateOrderItem>;

class OrderItemRepository extends BaseRepository<OrderItem, CreateOrderItem, UpdateOrderItem> {
  constructor() {
    super(OrderItemModel);
  }

  /**
   * Get all items for a specific Order, with joined details and delivery calculation.
   * Only active (non-soft-deleted) receipts are counted in total_delivered.
   */
  async findByOrder(orderId: string): Promise<OrderItemDetail[]> {
    const sql = `
      SELECT order_items.order_item_id,
             order_items.order_id,
             order_items.item_id,
             order_items.vendor_id,
             order_items.item_price_id,
             order_items.qty,
             order_items.has_tax,
             item_prices.price,
             items.item_name,
             items.item_code,
             categories.prefix as category_prefix,
             categories.category_code,
             units.unit_name as unit,
             vendors.vendor_name,
             COALESCE(SUM(CASE WHEN receipts.deleted_at IS NULL THEN receipt_items.qty ELSE 0 END), 0) as total_delivered,
             order_items.qty - COALESCE(SUM(CASE WHEN receipts.deleted_at IS NULL THEN receipt_items.qty ELSE 0 END), 0) as remaining
      FROM order_items
      LEFT JOIN item_prices ON item_prices.item_price_id = order_items.item_price_id AND item_prices.deleted_at IS NULL
      LEFT JOIN items ON items.item_id = order_items.item_id AND items.deleted_at IS NULL
      LEFT JOIN item_categories categories ON categories.category_id = items.category_id AND categories.deleted_at IS NULL
      LEFT JOIN units ON items.unit_id = units.unit_id AND units.deleted_at IS NULL
      LEFT JOIN vendors ON vendors.vendor_id = order_items.vendor_id AND vendors.deleted_at IS NULL
      LEFT JOIN receipt_items ON receipt_items.order_item_id = order_items.order_item_id
      LEFT JOIN receipts ON receipts.receipt_id = receipt_items.receipt_id AND receipts.deleted_at IS NULL
      WHERE order_items.order_id = $1
      GROUP BY order_items.order_item_id
    `;

    const rows = await this.rawSelect<OrderItemDetail>(sql, [orderId]);
    return rows.map((r) => ({
      ...r,
      has_tax: Boolean(r.has_tax),
    }));
  }

  /**
   * Delete all items belonging to a specific order.
   */
  async deleteByOrder(orderId: string): Promise<number> {
    return this.deleteWhere({ order_id: orderId }, false);
  }
}

export const orderItemRepo = new OrderItemRepository();
