import type { ModelDefinition } from "@/db/core/types";

export interface ItemCategory {
  category_id: string;
  category_name: string;
  deleted_at: string | null;
}

export type CreateItemCategory = Pick<ItemCategory, "category_name">;
export type UpdateItemCategory = Partial<CreateItemCategory>;

export const ItemCategoryModel: ModelDefinition = {
  tableName: "item_categories",
  primaryKey: "category_id",
  createColumns: ["category_name"],
  updateColumns: ["category_name"],
  softDelete: true,
};
