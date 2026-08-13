import type { ModelDefinition } from "@/db/core/types";

export interface Item {
  item_id: number;
  item_name: string;
  category: string;
  unit: string;
  deleted_at: string | null;
}

export type CreateItem = Pick<Item, "item_name" | "category" | "unit">;
export type UpdateItem = Partial<CreateItem>;

export const ItemModel: ModelDefinition = {
  tableName: "items",
  primaryKey: "item_id",
  createColumns: ["item_name", "category", "unit"],
  updateColumns: ["item_name", "category", "unit"],
  softDelete: true,
};
