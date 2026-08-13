import type { ModelDefinition } from "@/db/core/types";

export interface POItem {
  po_item_id: number;
  po_id: number | null;
  item_id: number | null;
  item_price_id: number | null;
  vendor_id: number | null;
  qty: number;
}

export type CreatePOItem = Omit<POItem, "po_item_id">;

export const POItemModel: ModelDefinition = {
  tableName: "po_items",
  primaryKey: "po_item_id",
  createColumns: ["po_id", "item_id", "item_price_id", "vendor_id", "qty"],
  updateColumns: ["item_id", "item_price_id", "vendor_id", "qty"],
  softDelete: false,
};
