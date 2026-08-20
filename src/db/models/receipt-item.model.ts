import type { ModelDefinition } from "@/db/core/types";

export interface ReceiptItem {
  receipt_item_id: string;
  receipt_id: string | null;
  order_item_id: string | null;
  qty: number;
}

export type CreateReceiptItem = Omit<ReceiptItem, "receipt_item_id">;

export const ReceiptItemModel: ModelDefinition = {
  createColumns: ["receipt_id", "order_item_id", "qty"],
  primaryKey: "receipt_item_id",
  softDelete: false,
  tableName: "receipt_items",
  updateColumns: ["order_item_id", "qty"],
};
