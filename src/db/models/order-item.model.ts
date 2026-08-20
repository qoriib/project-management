import type { ModelDefinition } from "@/db/core/types";

export interface OrderItem {
  order_item_id: string;
  order_id: string;
  item_id: string;
  vendor_id: string;
  item_price_id: string;
  qty: number;
}

export type CreateOrderItem = Omit<OrderItem, "order_item_id">;

export const OrderItemModel: ModelDefinition = {
  createColumns: ["order_id", "item_id", "vendor_id", "item_price_id", "qty"],
  primaryKey: "order_item_id",
  softDelete: false,
  tableName: "order_items",
  updateColumns: ["item_id", "vendor_id", "item_price_id", "qty"],
};
