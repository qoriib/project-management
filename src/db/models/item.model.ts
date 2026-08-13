import type { ModelDefinition } from "@/db/core/types";

export interface Item {
  item_id: number;
  item_name: string;
  category_id: number;
  unit_id: number;
  deleted_at: string | null;
}

export type CreateItem = Pick<Item, "item_name" | "category_id" | "unit_id">;
export type UpdateItem = Partial<CreateItem>;

export const ItemModel: ModelDefinition = {
  tableName: "items",
  primaryKey: "item_id",
  createColumns: ["item_name", "category_id", "unit_id"],
  updateColumns: ["item_name", "category_id", "unit_id"],
  softDelete: true,
};
