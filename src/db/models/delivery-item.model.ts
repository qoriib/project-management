import type { ModelDefinition } from "@/db/core/types";

export interface DeliveryItem {
  delivery_item_id: string;
  delivery_id: string | null;
  po_item_id: string | null;
  qty: number;
}

export type CreateDeliveryItem = Omit<DeliveryItem, "delivery_item_id">;

export const DeliveryItemModel: ModelDefinition = {
  createColumns: ["delivery_id", "po_item_id", "qty"],
  primaryKey: "delivery_item_id",
  softDelete: false,
  tableName: "delivery_items",
  updateColumns: ["po_item_id", "qty"],
};
