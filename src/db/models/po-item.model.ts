import type { ModelDefinition } from "@/db/core/types";

export interface POItem {
  po_item_id: string;
  po_id: string;
  item_id: string;
  vendor_id: string;
  item_price_id: string;
  qty: number;
}

export type CreatePOItem = Omit<POItem, "po_item_id">;

export const POItemModel: ModelDefinition = {
  createColumns: ["po_id", "item_id", "vendor_id", "item_price_id", "qty"],
  primaryKey: "po_item_id",
  softDelete: false,
  tableName: "po_items",
  updateColumns: ["item_id", "vendor_id", "item_price_id", "qty"],
};
