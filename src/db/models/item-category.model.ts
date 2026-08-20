import type { ModelDefinition } from "@/db/core/types";

export interface ItemCategory {
  category_id: string;
  prefix: string;
  category_code: string;
  category_name: string;
  deleted_at: string | null;
}

export type CreateItemCategory = Pick<
  ItemCategory,
  "prefix" | "category_code" | "category_name"
>;
export type UpdateItemCategory = Partial<CreateItemCategory>;

export const ItemCategoryModel: ModelDefinition = {
  createColumns: ["prefix", "category_code", "category_name"],
  primaryKey: "category_id",
  softDelete: true,
  tableName: "item_categories",
  updateColumns: ["prefix", "category_code", "category_name"],
};
