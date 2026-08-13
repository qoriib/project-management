import type { ModelDefinition } from "@/db/core/types";

export interface POItem {
  po_item_id: number;
  po_id: number;
  item_id: number;
  vendor_id: number;
  price: number;
  qty: number;
}

export type CreatePOItem = Omit<POItem, "po_item_id">;

export const POItemModel: ModelDefinition = {
  tableName: "po_items",
  primaryKey: "po_item_id",
  createColumns: ["po_id", "item_id", "vendor_id", "price", "qty"],
  updateColumns: ["item_id", "vendor_id", "price", "qty"],
  softDelete: false,
};
