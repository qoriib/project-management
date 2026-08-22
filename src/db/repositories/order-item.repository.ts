import { BaseRepository } from "@/db/core/base-repository";
import { QueryBuilder } from "@/db/core/query-builder";
import { wrapDbError } from "@/db/core/errors";
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

export interface OrderItemInput {
  order_item_id?: string;
  item_id: string | null;
  vendor_id: string | null;
  item_price_id: string;
  qty: number;
  has_tax?: number;
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
    try {
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
        .selectSum("CASE WHEN receipts.deleted_at IS NULL THEN receipt_items.qty ELSE 0 END", "total_delivered", 0)
        .selectRaw(
          "order_items.qty - COALESCE(SUM(CASE WHEN receipts.deleted_at IS NULL THEN receipt_items.qty ELSE 0 END), 0) as remaining",
        )
        .from("order_items", "order_items")
        .leftJoin("item_prices", "item_prices", "item_prices.item_price_id = order_items.item_price_id")
        .leftJoin("items", "items", "items.item_id = order_items.item_id")
        .leftJoin("item_categories", "categories", "categories.category_id = items.category_id")
        .leftJoin("units", "units", "items.unit_id = units.unit_id")
        .leftJoin("vendors", "vendors", "vendors.vendor_id = order_items.vendor_id")
        .leftJoin("receipt_items", "receipt_items", "receipt_items.order_item_id = order_items.order_item_id")
        .leftJoin("receipts", "receipts", "receipts.receipt_id = receipt_items.receipt_id")
        .where("order_items.order_id", "=", orderId)
        .groupBy("order_items.order_item_id");

      const { sql, params } = query.build();
      return await this.rawSelect<OrderItemDetail>(sql, params);
    } catch (error) {
      throw wrapDbError(error, this.model.tableName);
    }
  }

  /**
   * Delete all items belonging to a specific order.
   */
  async deleteByOrder(orderId: string): Promise<number> {
    return this.deleteWhere({ order_id: orderId }, false);
  }
}

export const orderItemRepo = new OrderItemRepository();
