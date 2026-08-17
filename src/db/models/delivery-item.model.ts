import type { ModelDefinition } from "@/db/core/types";

export interface DeliveryItem {
  delivery_item_id: string;
  delivery_id: string | null;
  po_item_id: string | null;
  qty: number;
}

export type CreateDeliveryItem = Omit<DeliveryItem, "delivery_item_id">;

export const DeliveryItemModel: ModelDefinition = {
  tableName: "delivery_items",
  primaryKey: "delivery_item_id",
  createColumns: ["delivery_id", "po_item_id", "qty"],
  updateColumns: ["po_item_id", "qty"],
  softDelete: false,
};
