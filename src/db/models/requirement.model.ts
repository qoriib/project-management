import type { ModelDefinition } from "@/db/core/types";

export interface Requirement {
  requirement_id: string;
  project_id: string;
  item_id: string;
  item_price_id: string;
  qty: number;
  has_tax: number;
  created_at: string;
  deleted_at: string | null;
}

export type CreateRequirement = Pick<Requirement, "project_id" | "item_id" | "item_price_id" | "qty"> &
  Partial<Pick<Requirement, "has_tax">>;
export type UpdateRequirement = Partial<Pick<Requirement, "item_id" | "item_price_id" | "qty" | "has_tax">>;

export const RequirementModel: ModelDefinition = {
  createColumns: ["project_id", "item_id", "item_price_id", "qty", "has_tax"],
  primaryKey: "requirement_id",
  softDelete: true,
  tableName: "requirements",
  updateColumns: ["item_id", "item_price_id", "qty", "has_tax"],
};
