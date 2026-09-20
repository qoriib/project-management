import { BaseRepository } from "@/db/core/base-repository";
import { type CreateOrderItem, type OrderItem, OrderItemModel } from "@/db/models";

export interface OrderItemDetail {
  order_item_id: string;
  order_id: string | null;
  requirement_group_id?: string | null;
  group_name?: string;
  item_id: string | null;
  vendor_id: string | null;
  item_price_id: string;
  /** Snapshot price stored on the order item */
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
  requirement_group_id?: string | null;
  item_id: string | null;
  vendor_id: string | null;
  item_price_id: string;
  price: number;
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
   */
  async findByOrder(orderId: string): Promise<OrderItemDetail[]> {
    const rows = await this.query("order_items")
      .select(
        "order_items.order_item_id",
        "order_items.order_id",
        "COALESCE(order_items.requirement_group_id, orders.requirement_group_id) as requirement_group_id",
        "COALESCE(item_groups.group_name, order_groups.group_name) as group_name",
        "order_items.item_id",
        "order_items.vendor_id",
        "order_items.item_price_id",
        "item_prices.price as price",
        "order_items.qty",
        "order_items.has_tax",
        "items.item_name",
        "items.item_code",
        "categories.prefix as category_prefix",
        "categories.category_code",
        "units.unit_name as unit",
        "vendors.vendor_name",
      )
      .selectSum("receipt_items.qty", "total_delivered", 0)
      .selectRaw("order_items.qty - COALESCE(SUM(receipt_items.qty), 0) as remaining")
      .leftJoin("orders", "orders", "orders.order_id = order_items.order_id")
      .leftJoin(
        "requirement_groups",
        "item_groups",
        "item_groups.requirement_group_id = order_items.requirement_group_id",
      )
      .leftJoin("requirement_groups", "order_groups", "order_groups.requirement_group_id = orders.requirement_group_id")
      .leftJoin("items", "items", "items.item_id = order_items.item_id")
      .leftJoin("item_prices", "item_prices", "item_prices.item_price_id = order_items.item_price_id")
      .leftJoin("item_categories", "categories", "categories.category_id = items.category_id")
      .leftJoin("units", "units", "items.unit_id = units.unit_id")
      .leftJoin("vendors", "vendors", "vendors.vendor_id = order_items.vendor_id")
      .leftJoin("receipt_items", "receipt_items", "receipt_items.order_item_id = order_items.order_item_id")
      .where("order_items.order_id", "=", orderId)
      .groupBy("order_items.order_item_id")
      .orderBy("order_items.order_item_id", "ASC")
      .getMany<OrderItemDetail>();

    return rows.map((row) => ({
      ...row,
      has_tax: Boolean(row.has_tax),
    }));
  }

  /**
   * Delete all items belonging to a specific order.
   */
  async deleteByOrder(orderId: string): Promise<number> {
    return this.deleteWhere({ order_id: orderId });
  }
}

export const orderItemRepo = new OrderItemRepository();
