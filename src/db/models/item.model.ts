import type { ModelDefinition } from "@/db/core/types";

export interface Item {
  item_id: string;
  item_code: string;
  item_name: string;
  category_id: string;
  unit_id: string;
  deleted_at: string | null;
}

export type CreateItem = Pick<Item, "item_code" | "item_name" | "category_id" | "unit_id">;
export type UpdateItem = Partial<CreateItem>;

export const ItemModel: ModelDefinition = {
  tableName: "items",
  primaryKey: "item_id",
  createColumns: ["item_code", "item_name", "category_id", "unit_id"],
  updateColumns: ["item_code", "item_name", "category_id", "unit_id"],
  softDelete: true,
};
